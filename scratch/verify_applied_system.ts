import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';

dotenv.config({ path: '.env.local' });

async function verifyTableAndRPC() {
  console.log('=== VERIFYING APPLIED DATABASE SCHEMA & RPC ===\n');

  const supabase = createAdminClient();
  if (!supabase) {
    console.error('FAILED: Supabase admin client unavailable.');
    process.exit(1);
  }

  // 1. Verify notification_jobs table query
  const { data: tableData, error: tableErr } = await supabase
    .from('notification_jobs')
    .select('*')
    .limit(1);

  if (tableErr) {
    console.error('FAILED: Error selecting from notification_jobs:', tableErr.message);
    process.exit(1);
  }
  console.log('✔ STEP 1 PASSED: notification_jobs table exists and is readable. Record count sample:', tableData.length);

  // 2. Verify claim_due_notification_jobs RPC call
  const { data: claimedData, error: rpcErr } = await supabase.rpc('claim_due_notification_jobs', {
    p_limit: 5,
  });

  if (rpcErr) {
    console.error('FAILED: Error executing RPC claim_due_notification_jobs:', rpcErr.message);
    process.exit(1);
  }
  console.log('✔ STEP 2 PASSED: RPC claim_due_notification_jobs executed successfully. Claimed count:', claimedData?.length || 0);
}

verifyTableAndRPC();
