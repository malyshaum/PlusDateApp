import { memo, useCallback } from "react"
import type { IUser } from "@/entities/user/model/types"
import IconClose from "@/shared/assets/icons/icon-close.svg"
import IconHeartDefault from "@/shared/assets/icons/icon-heart-default.svg"
import IconSuperLike from "@/shared/assets/icons/icon-superlike.svg"
import classNames from "classnames"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useUser } from "@/entities/user/api/queries.ts"
import { useNavigate } from "react-router-dom"
import type { ILike } from "@/entities/likes/model/types.ts"
import { useToast } from "@/shared/lib/useToast.ts"
import { PremiumIconAnimation } from "@/widgets"
import { useRespondToLikeMutation } from "@/entities/likes/api/queries.ts"

interface LikeCardProps {
  user: IUser
  action: ILike["action"]
}

const LikeCardComponent = ({ user, action }: LikeCardProps) => {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const respondToLikeMutation = useRespondToLikeMutation({
    onSuccess: (data) => {
      showToast({
        text: "newMatch",
        imageUrl: data.user.files.find((f) => f.is_main && f.type === "image")?.url || "",
        onClick: () => {
          void navigate(`/chat/${data.chat.id}?userId=${data.user.id}`)
        },
      })
    },
  })

  const { triggerImpact } = useHapticFeedback()
  const { data: currentUser } = useUser()

  const handleLike = useCallback(() => {
    triggerImpact()
    respondToLikeMutation.mutate({ profileId: user.feed_profile.id, action: "like" })
  }, [respondToLikeMutation, triggerImpact, user.feed_profile.id])

  const handleDislike = useCallback(() => {
    triggerImpact()
    respondToLikeMutation.mutate({ profileId: user.feed_profile.id, action: "dislike" })
  }, [respondToLikeMutation, triggerImpact, user.feed_profile.id])

  const handleNavigateToProfile = useCallback(() => {
    if (!currentUser?.is_premium && action !== "superlike") {
      void navigate(`/premium`)
      return
    }
    void navigate(`/user/${user.id}`)
  }, [currentUser?.is_premium, navigate, user.id, action])

  const firstImage = user.files.find((file) => file.type === "image" && file.is_main)

  return (
    <div
      className={classNames(
        "w-[calc(50%-6px)] rounded-[16px] overflow-hidden aspect-[167/220] relative",
        action === "superlike" ? "border-premium-gradient" : "border border-white-20",
      )}
    >
      <div className={classNames("relative w-full h-full rounded-[16px] overflow-hidden")}>
        {firstImage && (
          <img
            src={firstImage.url}
            alt={`${user?.name} photo`}
            className='absolute inset-0 w-full h-full object-cover'
            loading='lazy'
            onClick={handleNavigateToProfile}
          />
        )}

        {action === "superlike" && (
          <div className='absolute top-1 right-1 w-8 h-8'>
            <img src={IconSuperLike} alt='premium' width={32} height={32} />
          </div>
        )}

        {(currentUser?.is_premium || action === "superlike") && (
          <div className='flex flex-col justify-end absolute bottom-0 left-0 right-0 p-1 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4527)_40.48%,rgba(0,0,0,0.6)_100%)] h-[45%]'>
            <div className='flex items-center gap-1 mb-2'>
              <span className='body-bold text-white truncate'>{user.name}</span>
              {user?.feed_profile?.age && (
                <span className='body-bold text-white whitespace-nowrap'>
                  , {user.feed_profile.age}
                </span>
              )}
              {user.is_premium && <PremiumIconAnimation />}
            </div>

            <div className='flex gap-1'>
              <button
                onClick={handleDislike}
                disabled={respondToLikeMutation.isPending}
                className='flex-1 h-10 rounded-[16px] backdrop-blur-[16px] bg-white-20 flex items-center justify-center shadow-[inset_-2px_-2px_2px_0px_rgba(255,255,255,0.15)]'
              >
                <img src={IconClose} alt='dislike' className='w-4 h-4' />
              </button>

              <button
                onClick={handleLike}
                disabled={respondToLikeMutation.isPending}
                className='flex-1 h-10 rounded-[16px] bg-accent-gradient flex items-center justify-center shadow-[inset_-2px_-2px_2px_0px_rgba(255,255,255,0.15)]'
              >
                <img src={IconHeartDefault} alt='like' className='w-6 h-6' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const LikeCard = memo(LikeCardComponent)
