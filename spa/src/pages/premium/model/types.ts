export type Range = "week" | "month" | "three_month" | "one_day"

export interface TSubscribe {
  url: string
}

export interface ITelegramSubscription {
  active_until: string
  created_at: string
  id: number
  plan: Range
  updated_at: string
  user_id: number
}

export interface IStripeSubscription {
  created_at: null
  ends_at: string
  id: number
  stripe_id: string
  stripe_price: number | null
  stripe_status: string
  trial_ends_at: string
  type: Range
  updated_at: null
  user_id: number
}

export interface ISubscription {
  stripe: IStripeSubscription | null
  telegram: ITelegramSubscription | null
}
