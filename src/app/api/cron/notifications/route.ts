import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendNotificationEmail } from '@/lib/email/send';
import { scheduleDailyBarberDigests } from '@/lib/email/scheduler';
import { utcToBudapestParts } from '@/lib/utils/dates';
import type { NotificationJobRow } from '@/lib/email/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleCronWork(request);
}

export async function POST(request: Request) {
  return handleCronWork(request);
}

async function handleCronWork(request: Request) {
  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
  }

  // Check CRON_SECRET if configured in environment
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }
  }

  const results = {
    claimed: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    errors: [] as string[],
  };

  try {
    // 1. Check & schedule today's daily barber digest in Europe/Budapest
    const todayParts = utcToBudapestParts(new Date());
    await scheduleDailyBarberDigests(todayParts.dateStr, adminSupabase);

    // 2. Claim due notification jobs atomically via RPC
    const { data: claimedJobs, error: claimErr } = await adminSupabase.rpc('claim_due_notification_jobs', {
      p_limit: 20,
    });

    if (claimErr) {
      // Fallback: If RPC not present in schema cache yet, manually select and claim due jobs atomically
      const nowIso = new Date().toISOString();
      const { data: fallbackJobs, error: selectErr } = await adminSupabase
        .from('notification_jobs')
        .select('*')
        .or('status.eq.pending,and(status.eq.failed,attempts.lt.3)')
        .lte('scheduled_for', nowIso)
        .order('scheduled_for', { ascending: true })
        .limit(20);

      if (selectErr || !fallbackJobs || fallbackJobs.length === 0) {
        return NextResponse.json({ message: 'No due jobs', results });
      }

      // Claim fallback jobs by updating status = 'processing'
      const jobIds = (fallbackJobs as NotificationJobRow[]).map((j) => j.id);
      await adminSupabase
        .from('notification_jobs')
        .update({ status: 'processing', updated_at: nowIso })
        .in('id', jobIds);

      return processJobs(fallbackJobs as NotificationJobRow[], adminSupabase, results);
    }

    if (!claimedJobs || claimedJobs.length === 0) {
      return NextResponse.json({ message: 'No due jobs to process', results });
    }

    results.claimed = claimedJobs.length;
    return processJobs(claimedJobs as NotificationJobRow[], adminSupabase, results);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Worker processing failed';
    console.error('[Cron Worker Exception]:', err);
    return NextResponse.json({ error: errorMsg, results }, { status: 500 });
  }
}

interface ProcessResults {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
  errors: string[];
}

async function processJobs(jobs: NotificationJobRow[], adminSupabase: ReturnType<typeof createAdminClient>, results: ProcessResults) {
  if (!adminSupabase) return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 });

  for (const job of jobs) {
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

      results.errors.push(`Job ${job.id} (${job.notification_type}): ${sendResult.error}`);

      await adminSupabase
        .from('notification_jobs')
        .update({
          status: newStatus,
          attempts,
          last_error: sendResult.error || 'Email delivery failed',
          updated_at: nowIso,
        })
        .eq('id', job.id);
    }
  }

  return NextResponse.json({
    message: `Processed ${jobs.length} notification job(s)`,
    results,
  });
}
