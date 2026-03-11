// This file configures Vercel Cron Jobs
// Add to vercel.json "crons" array

const CRONS = [
  {
    path: '/api/cron/daily-report',
    schedule: '0 8 * * *',      // Every day at 8:00 JST (23:00 UTC)
    description: 'Send daily LINE reports to all users',
  },
  {
    path: '/api/cron/weekly-proposals',
    schedule: '0 8 * * 1',      // Every Monday at 8:00 JST
    description: 'Generate weekly CMO proposals for all Pro+ users',
  },
  {
    path: '/api/cron/run-engagement-jobs',
    schedule: '0 */3 * * *',    // Every 3 hours
    description: 'Execute auto-like/follow jobs within daily limits',
  },
  {
    path: '/api/cron/publish-scheduled',
    schedule: '*/5 * * * *',    // Every 5 minutes
    description: 'Publish scheduled posts and GMB posts',
  },
]

export default CRONS
