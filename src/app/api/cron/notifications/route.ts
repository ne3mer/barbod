import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleCronWork(request);
}

export async function POST(request: Request) {
  return handleCronWork(request);
}

async function handleCronWork(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const isVercelCronHeader = request.headers.get('x-vercel-cron') === '1';

  // Strict Authentication Guard in Production
  if (process.env.NODE_ENV === 'production' || cronSecret) {
    const isValidBearer = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!isVercelCronHeader && !isValidBearer) {
      return NextResponse.json(
        { error: 'Unauthorized cron invocation. Invalid or missing secret header.' },
        { status: 401 }
      );
    }
  }

  const { processDueNotificationJobs } = await import('@/lib/email/worker');
  const results = await processDueNotificationJobs(20);

  return NextResponse.json({
    message: `Processed notification jobs successfully`,
    results,
    timestamp: new Date().toISOString(),
  });
}
