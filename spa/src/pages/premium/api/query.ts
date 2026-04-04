import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Range } from "@/pages/premium/model/types.ts"
import {
  getCheckoutLink,
  getStarsInvoiceLink,
  getCurrentSubscription,
  cancelSubscription,
} from "@/pages/premium/api/api.ts"
import { openLink, invoice } from "@tma.js/sdk-react"

interface UseSubscriptionCallbacks {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

const SUBSCRIPTION_KEYS = {
  subscription: "subscription",
  current: "current",
}

export const useSubscription = (range: Range) => {
  return useMutation({
    mutationKey: ["stripe-subscribe", range],
    mutationFn: () => getCheckoutLink(range),
    onSuccess: (res) => {
      if (openLink.isAvailable()) {
        openLink(res.url)
      } else {
        window.open(res.url, "_blank")
      }
    },
  })
}

export const useTrialSubscription = (callbacks?: UseSubscriptionCallbacks) => {
  return useMutation({
    mutationKey: ["trial-subscribe", "one_day"],
    mutationFn: () => getCheckoutLink("one_day"),
    onSuccess: () => {
      callbacks?.onSuccess?.()
    },
    onError: (error) => {
      callbacks?.onError?.(error)
    },
  })
}

export const useStarsSubscription = (range: Range, callbacks?: UseSubscriptionCallbacks) => {
  return useMutation({
    mutationKey: ["stars-subscribe", range],
    mutationFn: () => getStarsInvoiceLink(range),
    onSuccess: async (res) => {
      try {
        if (invoice.openUrl.isAvailable()) {
          const status = await invoice.openUrl(res.url)
          // TODO debug
          if (status === "paid") {
            callbacks?.onSuccess?.()
          } else if (status === "cancelled") {
            console.log("Payment cancelled by user")
          } else if (status === "failed") {
            console.error("Payment failed")
          }
        } else {
          console.error("Invoice API not available")
        }
      } catch (error) {
        console.error("Error opening invoice:", error)
        callbacks?.onError?.(error as Error)
      }
    },
  })
}

export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: [SUBSCRIPTION_KEYS.subscription, SUBSCRIPTION_KEYS.current],
    queryFn: getCurrentSubscription,
  })
}

export const useCancelSubscription = (callbacks?: UseSubscriptionCallbacks) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [SUBSCRIPTION_KEYS.subscription, "cancel"],
    mutationFn: (range: Range) => cancelSubscription(range),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [SUBSCRIPTION_KEYS.subscription, SUBSCRIPTION_KEYS.current],
      })
      void queryClient.invalidateQueries({ queryKey: ["user"] })
      callbacks?.onSuccess?.()
    },
    onError: (error) => {
      callbacks?.onError?.(error)
    },
  })
}
