import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export const PLANS = {
  free:     { name: 'Free',     price: 0,     priceId: null },
  starter:  { name: 'Starter',  price: 3900,  priceId: process.env.STRIPE_PRICE_STARTER },
  pro:      { name: 'Pro',      price: 6900,  priceId: process.env.STRIPE_PRICE_PRO },
  business: { name: 'Business', price: 14800, priceId: process.env.STRIPE_PRICE_BUSINESS },
}

export const POINT_PACKAGES = [
  { id: 'points_100',  points: 100,  price: 1000,  priceId: process.env.STRIPE_PRICE_POINTS_100,  label: '100pt — ¥1,000' },
  { id: 'points_550',  points: 550,  price: 5000,  priceId: process.env.STRIPE_PRICE_POINTS_550,  label: '550pt — ¥5,000 (9%OFF)' },
  { id: 'points_1200', points: 1200, price: 10000, priceId: process.env.STRIPE_PRICE_POINTS_1200, label: '1,200pt — ¥10,000 (17%OFF)' },
]

// Create Stripe Checkout session for subscription
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  userId: string
  successUrl: string
  cancelUrl: string
  mode: 'subscription' | 'payment'
}) {
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    mode: params.mode,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { userId: params.userId },
    locale: 'ja',
  })
  return session
}

// Get or create Stripe customer
export async function getOrCreateCustomer(email: string, name: string, userId: string) {
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data.length > 0) return existing.data[0]

  return stripe.customers.create({
    email, name,
    metadata: { userId }
  })
}

// Create Stripe Connect account for affiliates
export async function createConnectAccount(email: string) {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true } },
    business_type: 'individual',
    settings: { payouts: { schedule: { interval: 'manual' } } }
  })
}
