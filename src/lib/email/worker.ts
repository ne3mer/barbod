if (typeof window !== 'undefined') {
  throw new Error('This module can only be executed on the server.');
}

import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotificationEmail } from './send';
import { scheduleDailyBarberDigests } from './scheduler';
import { utcToBudapestParts } from '@/lib/utils/dates';
import type { NotificationJobRow } from './types';

export interface WorkerProcessResult {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
  errors: string[];
}

/**
 * Core server-side worker that processes all due notification jobs atomically.
 */
export async function processDueNotificationJobs(limit: number = 20): Promise<WorkerProcessResult> {
  const adminSupabase = createAdminClient();
  const results: WorkerProcessResult = {
    claimed: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    errors: [],
  };

  if (!adminSupabase) {
    console.error('[Worker] Admin client unavailable.');
    return results;
  }

  try {
    // 1. Schedule today's daily barber digest if needed (Budapest date)
    const todayParts = utcToBudapestParts(new Date());
    await scheduleDailyBarberDigests(todayParts.dateStr, adminSupabase);

    // 2. Claim due jobs atomically via RPC (FOR UPDATE SKIP LOCKED)
    const { data: claimedJobs, error: claimErr } = await adminSupabase.rpc('claim_due_notification_jobs', {
      p_limit: limit,
    });

    let jobsToProcess: NotificationJobRow[] = [];

    if (claimErr) {
      console.warn('[Worker] RPC claim_due_notification_jobs failed, fallback query:', claimErr.message);
      const nowIso = new Date().toISOString();
      const { data: fallbackJobs, error: selectErr } = await adminSupabase
        .from('notification_jobs')
        .select('*')
        .or('status.eq.pending,and(status.eq.failed,attempts.lt.3)')
        .lte('scheduled_for', nowIso)
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (selectErr || !fallbackJobs || fallbackJobs.length === 0) {
        return results;
      }

      const jobIds = (fallbackJobs as NotificationJobRow[]).map((j) => j.id);
      await adminSupabase
        .from('notification_jobs')
        .update({ status: 'processing', updated_at: nowIso })
        .in('id', jobIds);

      jobsToProcess = fallbackJobs as NotificationJobRow[];
    } else {
      jobsToProcess = (claimedJobs as NotificationJobRow[]) || [];
    }

    if (jobsToProcess.length === 0) {
      return results;
    }

    results.claimed = jobsToProcess.length;

    // 3. Dispatch each claimed job
    for (const job of jobsToProcess) {
      const sendResult = await sendNotificationEmail({
        to: job.recipient_email,
        type: job.notification_type,
        locale: job.locale || 'hu',
        payload: (job.metadata as Record<string, unknown>) || {},
      });

      const nowIso = new Date().toISOString();

      if (sendResult.success) {
        results.sent++;
        await adminSupabase
          .from('notification_jobs')
          .update({
            status: 'sent',
            sent_at: nowIso,
            provider_message_id: sendResult.messageId || null,
            last_error: null,
            updated_at: nowIso,
          })
          .eq('id', job.id);
      } else {
        const attempts = (job.attempts || 0) + 1;
        const isFailedFinal = attempts >= 3;
        const newStatus = isFailedFinal ? 'failed' : 'pending';

        if (isFailedFinal) {
          results.failed++;
        } else {
          results.retried++;
        }

        const errorMsg = sendResult.error || 'Email delivery failed';
        results.errors.push(`Job ${job.id} (${job.notification_type}): ${errorMsg}`);

        await adminSupabase
          .from('notification_jobs')
          .update({
            status: newStatus,
            attempts,
            last_error: errorMsg,
            updated_at: nowIso,
          })
          .eq('id', job.id);
      }
    }

    return results;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Worker processing exception';
    console.error('[Worker Exception]:', err);
    results.errors.push(errorMsg);
    return results;
  }
}
