// Browser client - safe to use in Client Components
export { createClient } from './browser'

// Server clients - only use in Server Components / API Routes
export { createServerSupabaseClient, createAdminClient } from './server'
