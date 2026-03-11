export type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
export type Platform = 'twitter' | 'instagram' | 'facebook' | 'line_official' | 'gmb'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'snoozed'
export type AgentType = 'cmo' | 'sns' | 'lp' | 'analytics' | 'notify'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  points: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  line_user_id: string | null
  affiliate_code: string
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface SnsAccount {
  id: string
  user_id: string
  platform: Platform
  account_id: string
  account_name: string | null
  access_token: string | null
  refresh_token: string | null
  token_expires_at: string | null
  followers_count: number
  is_active: boolean
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  platform: string
  content: string
  image_urls: string[] | null
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  platform_post_id: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  impressions: number
  clicks: number
  ai_generated: boolean
  points_used: number
  created_at: string
}

export interface AutoEngagementJob {
  id: string
  user_id: string
  platform: string
  job_type: 'like' | 'follow' | 'unfollow'
  target_type: 'hashtag' | 'keyword' | 'competitor_followers' | 'location'
  target_value: string
  daily_limit: number
  executed_today: number
  total_executed: number
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

export interface KeywordTrigger {
  id: string
  user_id: string
  platform: string
  trigger_type: 'comment' | 'dm' | 'mention'
  keywords: string[]
  reply_template: string
  url_type: 'product_lp' | 'gift_download' | 'reservation' | 'custom' | null
  destination_url: string | null
  is_active: boolean
  triggered_count: number
  created_at: string
}

export interface TriggerLog {
  id: string
  trigger_id: string
  user_id: string
  platform: string
  sender_id: string
  sender_name: string | null
  matched_keyword: string
  reply_sent: string
  issued_url: string | null
  unique_token: string
  url_clicked: boolean
  url_clicked_at: string | null
  converted: boolean
  created_at: string
}

export interface AiReplyQueue {
  id: string
  user_id: string
  platform: string
  comment_id: string
  post_id: string | null
  sender_id: string
  sender_name: string | null
  original_text: string
  ai_reply: string
  reply_type: string | null
  status: 'pending' | 'approved' | 'sent' | 'rejected' | 'auto_sent'
  reviewed_by: string | null
  created_at: string
  sent_at: string | null
}

export interface GmbPost {
  id: string
  user_id: string
  location_id: string
  location_name: string | null
  post_type: 'whats_new' | 'event' | 'offer' | 'product'
  title: string | null
  content: string
  cta_type: string | null
  cta_url: string | null
  event_start: string | null
  event_end: string | null
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  gmb_post_name: string | null
  view_count: number
  click_count: number
  created_at: string
}

export interface AiProposal {
  id: string
  user_id: string
  agent: AgentType
  category: string
  title: string
  body: string
  priority: 'high' | 'medium' | 'low'
  status: ProposalStatus
  expected_impact: string | null
  data_basis: Record<string, any> | null
  approved_at: string | null
  executed_at: string | null
  line_notified: boolean
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  type: 'purchase' | 'bonus' | 'use' | 'refund' | 'affiliate_bonus'
  amount: number
  balance_after: number
  description: string | null
  stripe_payment_id: string | null
  created_at: string
}

export interface EcProgram {
  id: string
  owner_id: string
  name: string
  description: string | null
  product_url: string
  commission_type: 'percentage' | 'fixed'
  commission_value: number
  cookie_days: number
  is_active: boolean
  created_at: string
}

export interface EcAffiliator {
  id: string
  program_id: string
  user_id: string | null
  email: string
  name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  unique_tag: string
  clicks: number
  conversions: number
  total_revenue: number
  total_reward: number
  created_at: string
}

// DB type for Supabase codegen compatibility
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      sns_accounts: { Row: SnsAccount; Insert: Partial<SnsAccount>; Update: Partial<SnsAccount> }
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> }
      auto_engagement_jobs: { Row: AutoEngagementJob; Insert: Partial<AutoEngagementJob>; Update: Partial<AutoEngagementJob> }
      keyword_triggers: { Row: KeywordTrigger; Insert: Partial<KeywordTrigger>; Update: Partial<KeywordTrigger> }
      trigger_logs: { Row: TriggerLog; Insert: Partial<TriggerLog>; Update: Partial<TriggerLog> }
      ai_reply_queue: { Row: AiReplyQueue; Insert: Partial<AiReplyQueue>; Update: Partial<AiReplyQueue> }
      gmb_posts: { Row: GmbPost; Insert: Partial<GmbPost>; Update: Partial<GmbPost> }
      ai_proposals: { Row: AiProposal; Insert: Partial<AiProposal>; Update: Partial<AiProposal> }
      point_transactions: { Row: PointTransaction; Insert: Partial<PointTransaction>; Update: Partial<PointTransaction> }
      ec_programs: { Row: EcProgram; Insert: Partial<EcProgram>; Update: Partial<EcProgram> }
      ec_affiliators: { Row: EcAffiliator; Insert: Partial<EcAffiliator>; Update: Partial<EcAffiliator> }
    }
  }
}
