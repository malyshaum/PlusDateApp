import { PageLayout } from "@/widgets"
import { UserProfile } from "@/entities/UserProfile/ui/UserProfile.tsx"
import { type WithTranslation, withTranslation } from "react-i18next"
import { BottomButtonGroup, ConfirmationModal, SwipeButton } from "@/shared/ui"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useExternalUser, useUser } from "@/entities/user/api/queries.ts"
import { useDeleteProfileMatch, useSwipeProfile } from "@/features/SwipeCards/api/queries.ts"
import { useCallback, useState } from "react"
import IconTrash from "@/shared/assets/icons/icon-trash.svg?react"
import IconClose from "@/shared/assets/icons/icon-close.svg"
import IconHeart from "@/shared/assets/icons/icon-heart-default.svg"
import { createPortal } from "react-dom"
import { SwipeMatch } from "@/features/SwipeCards"
import type { Match } from "@/features/SwipeCards/model/types.ts"
import { useEchoPublic } from "@laravel/echo-react"

export const ProfileGuestBase = ({ t }: WithTranslation) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: user } = useUser()
  const [searchParams] = useSearchParams()
  const showRemoveMatch = searchParams.get("showRemoveMatch") === "true"
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [match, setMatch] = useState<Match | null>()
  const swipeProfileMutation = useSwipeProfile()

  const userId = id ? parseInt(id) : undefined
  const { data: externalUser } = useExternalUser(userId)
  const deleteProfileMatchMutation = useDeleteProfileMatch({
    onSuccess: () => {
      void navigate("/chats")
    },
  })

  useEchoPublic(`user.${user?.id}`, ".user.match_deleted", (data: { user_id: number }) => {
    if (data.user_id === Number(userId)) {
      void navigate("/chats", { replace: true })
    }
  })

  const handleRemoveMatch = () => {
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!externalUser?.feed_profile.id) return
    deleteProfileMatchMutation.mutate(externalUser?.feed_profile.id)
    setIsConfirmModalOpen(false)
  }

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false)
  }

  // const handleComplain = () => {
  //   return null
  // }

  const handleDislike = () => {
    if (!externalUser?.feed_profile?.id) return

    swipeProfileMutation.mutate(
      {
        profileId: externalUser.feed_profile.id,
        action: "dislike",
      },
      {
        onSuccess: () => {
          void navigate("/likes")
        },
      },
    )
  }

  const handleLike = () => {
    if (!externalUser?.feed_profile?.id) return
    swipeProfileMutation.mutate(
      {
        profileId: externalUser.feed_profile.id,
        action: "like",
      },
      {
        onSuccess: (res) => {
          setMatch(res)
        },
      },
    )
  }

  const closeMatch = useCallback(() => {
    void navigate("/likes")
  }, [navigate])

  return (
    <PageLayout className='!px-0 pb-0 flex flex-col'>
      {externalUser && (
        <UserProfile
          previewMode={false}
          user={externalUser}
          expanded={true}
          guestMode={true}
          className='flex-1 mx-4'
        >
          {!showRemoveMatch && (
            <div className='mt-3 flex items-center gap-3'>
              <SwipeButton type='grey' onClick={handleDislike}>
                <img src={IconClose} alt='dislike' />
              </SwipeButton>
              <SwipeButton type='cta' onClick={handleLike}>
                <img src={IconHeart} alt='like' />
              </SwipeButton>
            </div>
          )}
        </UserProfile>
      )}
      <BottomButtonGroup
        primaryButton={{
          onClick: handleRemoveMatch,
          type: "button",
          children: <span className='button-main'>{t("deleteMatch.title")}</span>,
          buttonWrapperClassName: showRemoveMatch ? "" : "!hidden",
          isLoading: deleteProfileMatchMutation.isPending,
        }}
        // secondaryButton={{
        //   onClick: handleComplain,
        //   children: <span className='button-main'>пожаловатся и заблокировать</span>,
        // }}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        icon={<IconTrash />}
        title={t("deleteMatch.title")}
        description={t("deleteMatch.description")}
        primaryButton={{
          children: t("deleteMatch.delete"),
          onClick: handleConfirmDelete,
          isLoading: deleteProfileMatchMutation.isPending,
        }}
        secondaryButton={{
          children: t("deleteMatch.cancel"),
          onClick: handleCancelDelete,
        }}
        onOutsideClick={handleCancelDelete}
      />

      {match?.matched &&
        createPortal(
          <SwipeMatch
            matchUser={match.user}
            onClose={closeMatch}
            chat={match.chat}
            closeButtonLabel={"continue"}
          />,
          document.body,
        )}
    </PageLayout>
  )
}

export const ProfileGuestPage = withTranslation()(ProfileGuestBase)
