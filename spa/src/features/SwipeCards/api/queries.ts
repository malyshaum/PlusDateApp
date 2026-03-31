import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchFeedProfiles, swipeProfile, revertDislike, deleteMatch } from "./api"
import type { Match, SwipeAction } from "../model/types"
import { USER_KEYS } from "@/entities/user/api/queries.ts"
import type { IUserLimits } from "@/entities/user/model/types.ts"
import { useUserGTMEvent } from "@/entities/user/lib/useUserGTMEvent.ts"

export const FEED_QUERY_KEYS = {
  all: ["swipe-feed"] as const,
  profiles: () => [...FEED_QUERY_KEYS.all, "profiles"] as const,
}

export const useSwipeFeed = () => {
  return useInfiniteQuery({
    queryKey: FEED_QUERY_KEYS.profiles(),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => fetchFeedProfiles(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.has_more ? lastPage.meta.next_cursor : undefined
    },
  })
}

export const useSwipeProfile = ({ onSuccess }: { onSuccess?: (res: Match) => void } = {}) => {
  const queryClient = useQueryClient()
  const sendUserEvent = useUserGTMEvent()

  return useMutation({
    mutationFn: ({ profileId, action }: { profileId: number; action: SwipeAction }) => {
      return swipeProfile(profileId, action)
    },
    onMutate: ({ action }) => {
      const previousLimits = queryClient.getQueryData<IUserLimits>([
        USER_KEYS.user,
        USER_KEYS.limits,
      ])

      if (previousLimits) {
        queryClient.setQueryData<IUserLimits>([USER_KEYS.user, USER_KEYS.limits], (old) => {
          if (!old) return old

          switch (action) {
            case "like":
              return { ...old, likes: old.likes + 1 }
            case "superlike":
              return { ...old, superlikes: old.superlikes + 1 }
            case "dislike":
              return old
            default:
              return old
          }
        })
      }

      return { previousLimits }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLimits) {
        queryClient.setQueryData([USER_KEYS.user, USER_KEYS.limits], context.previousLimits)
      } else {
        void queryClient.invalidateQueries({
          queryKey: [USER_KEYS.user, USER_KEYS.limits],
        })
      }
    },
    onSuccess: (res, context) => {
      void queryClient.invalidateQueries({ queryKey: ["likes", false] })

      void queryClient.invalidateQueries({
        queryKey: [USER_KEYS.user, USER_KEYS.limits],
      })

      sendUserEvent({ event: "swipe", action: context.action })

      onSuccess?.(res)
    },
  })
}

export const useRevertDislike = () => {
  const sendUserEvent = useUserGTMEvent()

  return useMutation({
    mutationFn: ({ swipeId }: { swipeId: number }) => {
      return revertDislike(swipeId)
    },
    onSuccess: () => {
      sendUserEvent({ event: "revert_like" })
    },
  })
}

export const useDeleteProfileMatch = ({ onSuccess }: { onSuccess?: () => void }) => {
  return useMutation({
    mutationFn: (profileId: number) => {
      return deleteMatch(profileId)
    },
    onSuccess: () => {
      onSuccess?.()
    },
  })
}
