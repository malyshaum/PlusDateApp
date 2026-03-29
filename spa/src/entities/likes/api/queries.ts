import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchLikes, respondToLike } from "./api"
import type { Match, SwipeAction } from "@/features/SwipeCards/model/types.ts"
import { useUserGTMEvent } from "@/entities/user/lib/useUserGTMEvent.ts"
import { USER_KEYS } from "@/entities/user/api/queries.ts"

export const useLikes = (only_mutual?: boolean, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ["likes", only_mutual],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchLikes(pageParam, only_mutual),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.has_more ? lastPage.meta.next_cursor : undefined
    },
    refetchOnMount: "always",
    enabled,
  })
}

export const useRespondToLikeMutation = ({
  onSuccess,
}: { onSuccess?: (res: Match) => void } = {}) => {
  const queryClient = useQueryClient()
  const sendUserEvent = useUserGTMEvent()

  return useMutation({
    mutationFn: ({ profileId, action }: { profileId: number; action: SwipeAction }) => {
      return respondToLike(profileId, action)
    },
    onSuccess: (res, context) => {
      void queryClient.invalidateQueries({ queryKey: ["likes", false] })
      void queryClient.invalidateQueries({ queryKey: [USER_KEYS.user, "stats"] })

      sendUserEvent({ event: "swipe", action: context.action })

      onSuccess?.(res)
    },
  })
}
