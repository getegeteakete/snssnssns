export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; plan: string; points: number; stripe_customer_id: string | null; stripe_subscription_id: string | null; subscription_status: string | null; line_user_id: string | null; affiliate_code: string | null; referred_by: string | null; created_at: string; updated_at: string }
        Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null; plan?: string; points?: number; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; subscription_status?: string | null; line_user_id?: string | null; affiliate_code?: string | null; referred_by?: string | null }
        Update: { email?: string; full_name?: string | null; avatar_url?: string | null; plan?: string; points?: number; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; subscription_status?: string | null; line_user_id?: string | null; affiliate_code?: string | null; referred_by?: string | null; updated_at?: string }
      }
      sns_accounts: {
        Row: { id: string; user_id: string; platform: string; account_id: string; account_name: string | null; access_token: string | null; refresh_token: string | null; token_expires_at: string | null; followers_count: number; is_active: boolean; created_at: string }
        Insert: { id?: string; user_id: string; platform: string; account_id: string; account_name?: string | null; access_token?: string | null; refresh_token?: string | null; token_expires_at?: string | null; followers_count?: number; is_active?: boolean }
        Update: { platform?: string; account_id?: string; account_name?: string | null; access_token?: string | null; refresh_token?: string | null; token_expires_at?: string | null; followers_count?: number; is_active?: boolean }
      }
      posts: {
        Row: { id: string; user_id: string; platform: string; content: string; image_urls: string[] | null; status: string; scheduled_at: string | null; published_at: string | null; platform_post_id: string | null; likes_count: number; comments_count: number; shares_count: number; impressions: number; clicks: number; ai_generated: boolean; points_used: number; created_at: string }
        Insert: { id?: string; user_id: string; platform: string; content: string; image_urls?: string[] | null; status?: string; scheduled_at?: string | null; published_at?: string | null; platform_post_id?: string | null; likes_count?: number; comments_count?: number; shares_count?: number; impressions?: number; clicks?: number; ai_generated?: boolean; points_used?: number }
        Update: { platform?: string; content?: string; image_urls?: string[] | null; status?: string; scheduled_at?: string | null; published_at?: string | null; platform_post_id?: string | null; likes_count?: number; comments_count?: number; shares_count?: number; impressions?: number; clicks?: number; ai_generated?: boolean; points_used?: number }
      }
      auto_engagement_jobs: {
        Row: { id: string; user_id: string; platform: string; job_type: string; target_type: string; target_value: string; daily_limit: number; executed_today: number; total_executed: number; is_active: boolean; last_run_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; platform: string; job_type: string; target_type: string; target_value: string; daily_limit?: number; executed_today?: number; total_executed?: number; is_active?: boolean }
        Update: { platform?: string; job_type?: string; target_type?: string; target_value?: string; daily_limit?: number; executed_today?: number; total_executed?: number; is_active?: boolean; last_run_at?: string | null }
      }
      keyword_triggers: {
        Row: { id: string; user_id: string; platform: string; trigger_type: string; keywords: string[]; reply_template: string; url_type: string | null; destination_url: string | null; is_active: boolean; triggered_count: number; created_at: string }
        Insert: { id?: string; user_id: string; platform: string; trigger_type: string; keywords: string[]; reply_template: string; url_type?: string | null; destination_url?: string | null; is_active?: boolean; triggered_count?: number }
        Update: { platform?: string; trigger_type?: string; keywords?: string[]; reply_template?: string; url_type?: string | null; destination_url?: string | null; is_active?: boolean; triggered_count?: number }
      }
      trigger_logs: {
        Row: { id: string; trigger_id: string; user_id: string; platform: string; sender_id: string; sender_name: string | null; matched_keyword: string; reply_sent: string; issued_url: string | null; unique_token: string | null; url_clicked: boolean; url_clicked_at: string | null; converted: boolean; created_at: string }
        Insert: { id?: string; trigger_id: string; user_id: string; platform: string; sender_id: string; sender_name?: string | null; matched_keyword: string; reply_sent: string; issued_url?: string | null; unique_token?: string | null }
        Update: { url_clicked?: boolean; url_clicked_at?: string | null; converted?: boolean }
      }
      ai_reply_settings: {
        Row: { id: string; user_id: string; platform: string[]; mode: string; brand_tone: string | null; auto_types: string[]; approval_types: string[]; is_active: boolean; created_at: string }
        Insert: { id?: string; user_id: string; platform?: string[]; mode?: string; brand_tone?: string | null; auto_types?: string[]; approval_types?: string[]; is_active?: boolean }
        Update: { platform?: string[]; mode?: string; brand_tone?: string | null; auto_types?: string[]; approval_types?: string[]; is_active?: boolean }
      }
      ai_reply_queue: {
        Row: { id: string; user_id: string; platform: string; comment_id: string; post_id: string | null; sender_id: string; sender_name: string | null; original_text: string; ai_reply: string; reply_type: string | null; status: string; reviewed_by: string | null; created_at: string; sent_at: string | null }
        Insert: { id?: string; user_id: string; platform: string; comment_id: string; post_id?: string | null; sender_id: string; sender_name?: string | null; original_text: string; ai_reply: string; reply_type?: string | null; status?: string }
        Update: { status?: string; reviewed_by?: string | null; sent_at?: string | null }
      }
      gmb_posts: {
        Row: { id: string; user_id: string; location_id: string; location_name: string | null; post_type: string; title: string | null; content: string; cta_type: string | null; cta_url: string | null; event_start: string | null; event_end: string | null; status: string; scheduled_at: string | null; published_at: string | null; gmb_post_name: string | null; view_count: number; click_count: number; created_at: string }
        Insert: { id?: string; user_id: string; location_id: string; location_name?: string | null; post_type: string; title?: string | null; content: string; cta_type?: string | null; cta_url?: string | null; event_start?: string | null; event_end?: string | null; status?: string; scheduled_at?: string | null }
        Update: { location_id?: string; location_name?: string | null; post_type?: string; title?: string | null; content?: string; cta_type?: string | null; cta_url?: string | null; event_start?: string | null; event_end?: string | null; status?: string; scheduled_at?: string | null; published_at?: string | null; gmb_post_name?: string | null; view_count?: number; click_count?: number }
      }
      analytics_snapshots: {
        Row: { id: string; user_id: string; date: string; platform: string; metric_type: string; value: number; created_at: string }
        Insert: { id?: string; user_id: string; date: string; platform: string; metric_type: string; value: number }
        Update: { value?: number }
      }
      ai_proposals: {
        Row: { id: string; user_id: string; agent: string; category: string; title: string; body: string; priority: string; status: string; expected_impact: string | null; data_basis: Json | null; approved_at: string | null; executed_at: string | null; line_notified: boolean; created_at: string }
        Insert: { id?: string; user_id: string; agent: string; category: string; title: string; body: string; priority?: string; status?: string; expected_impact?: string | null; data_basis?: Json | null }
        Update: { agent?: string; category?: string; title?: string; body?: string; priority?: string; status?: string; expected_impact?: string | null; data_basis?: Json | null; approved_at?: string | null; executed_at?: string | null; line_notified?: boolean }
      }
      point_transactions: {
        Row: { id: string; user_id: string; type: string; amount: number; balance_after: number; description: string | null; stripe_payment_id: string | null; created_at: string }
        Insert: { id?: string; user_id: string; type: string; amount: number; balance_after: number; description?: string | null; stripe_payment_id?: string | null }
        Update: { type?: string; amount?: number; balance_after?: number; description?: string | null }
      }
      affiliate_conversions: {
        Row: { id: string; referrer_id: string; referred_id: string; conversion_type: string; plan: string | null; amount: number; reward: number; status: string; stripe_transfer_id: string | null; created_at: string }
        Insert: { id?: string; referrer_id: string; referred_id: string; conversion_type: string; plan?: string | null; amount?: number; reward?: number; status?: string }
        Update: { conversion_type?: string; plan?: string | null; amount?: number; reward?: number; status?: string; stripe_transfer_id?: string | null }
      }
      ec_programs: {
        Row: { id: string; owner_id: string; name: string; description: string | null; product_url: string; commission_type: string; commission_value: number; cookie_days: number; is_active: boolean; created_at: string }
        Insert: { id?: string; owner_id: string; name: string; description?: string | null; product_url: string; commission_type: string; commission_value: number; cookie_days?: number; is_active?: boolean }
        Update: { name?: string; description?: string | null; product_url?: string; commission_type?: string; commission_value?: number; cookie_days?: number; is_active?: boolean }
      }
      ec_affiliators: {
        Row: { id: string; program_id: string; user_id: string | null; email: string; name: string | null; status: string; unique_tag: string | null; clicks: number; conversions: number; total_revenue: number; total_reward: number; created_at: string }
        Insert: { id?: string; program_id: string; user_id?: string | null; email: string; name?: string | null; status?: string }
        Update: { user_id?: string | null; email?: string; name?: string | null; status?: string; clicks?: number; conversions?: number; total_revenue?: number; total_reward?: number }
      }
      ec_conversions: {
        Row: { id: string; program_id: string; affiliator_id: string; order_id: string | null; order_value: number; commission: number; status: string; created_at: string }
        Insert: { id?: string; program_id: string; affiliator_id: string; order_id?: string | null; order_value: number; commission: number; status?: string }
        Update: { status?: string }
      }
      line_notifications: {
        Row: { id: string; user_id: string; type: string; title: string; body: string; proposal_id: string | null; status: string; created_at: string }
        Insert: { id?: string; user_id: string; type: string; title: string; body: string; proposal_id?: string | null; status?: string }
        Update: { status?: string }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

// Convenience type aliases for components
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type AiProposal = Database['public']['Tables']['ai_proposals']['Row']
export type AnalyticsSnapshot = Database['public']['Tables']['analytics_snapshots']['Row']
export type SnsAccount = Database['public']['Tables']['sns_accounts']['Row']
export type KeywordTrigger = Database['public']['Tables']['keyword_triggers']['Row']
export type AutoEngagementJob = Database['public']['Tables']['auto_engagement_jobs']['Row']
export type GmbPost = Database['public']['Tables']['gmb_posts']['Row']
export type AiReplyQueue = Database['public']['Tables']['ai_reply_queue']['Row']
export type PointTransaction = Database['public']['Tables']['point_transactions']['Row']
export type AffiliateConversion = Database['public']['Tables']['affiliate_conversions']['Row']
export type EcProgram = Database['public']['Tables']['ec_programs']['Row']
export type LineNotification = Database['public']['Tables']['line_notifications']['Row']
