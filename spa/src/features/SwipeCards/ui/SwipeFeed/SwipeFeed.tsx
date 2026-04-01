import { useMemo, useCallback, useEffect, useState, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import classNames from "classnames"
import { debounce } from "lodash"
import { useQueryClient } from "@tanstack/react-query"
import { SwipeCardStack, type SwipeCardStackRef } from "../SwipeCardStack"
import { SwipeActions } from "../SwipeActions"
import { useSwipeFeed, useSwipeProfile, useRevertDislike, FEED_QUERY_KEYS } from "../../api/queries"
import type { Match, SwipeActionFailedReason, SwipeResult } from "../../model/types"
import { useSwipeFeedStore } from "../../model/store"
import type { IUser } from "@/entities/user/model/types.ts"
import { Button, ButtonIcon } from "@/shared/ui"
import { useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import IconFiltersButton from "@/shared/assets/icons/icon-filters-button.svg"
import { SwipeMatch } from "@/features/SwipeCards"
import { useUser, useUserLimits } from "@/entities/user/api/queries.ts"
import { RevertDislike } from "@/features/SwipeCards/ui/RevertDislike"
import { ActionLimitModal } from "@/features/SwipeCards/ui/ActionLimitModal"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { withTranslation, type WithTranslation } from "react-i18next"
import { useAppliedFiltersCount } from "@/entities/user/lib/useAppliedFiltersCount"

interface Props extends WithTranslation {
  className?: string
}

const SwipeFeedBase = ({ className, t }: Props) => {
  const { data: user } = useUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [match, setMatch] = useState<Match | null>()
  const { triggerImpact } = useHapticFeedback()
  const [actionFailedReason, setActionFailedReason] = useState<SwipeActionFailedReason | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    canRevert,
    lastDislikeSwipeId,
    currentIndex,
    isResettingFilters,
    setCanRevert,
    clearRevertState,
    setCurrentIndex,
    setIsResettingFilters,
    isCardPressed,
  } = useSwipeFeedStore()

  const revertingCards = useSwipeFeedStore((state) => state.revertingCards)
  const exitingCards = useSwipeFeedStore((state) => state.exitingCards)

  const { data: userLimitsData } = useUserLimits()

  const swipeStackRef = useRef<SwipeCardStackRef>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasCheckedOnMount = useRef(false)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching, isLoading, isError } =
    useSwipeFeed()

  const swipeProfileMutation = useSwipeProfile()
  const revertDislikeMutation = useRevertDislike()

  const allProfilesRef = useRef<IUser[]>([])

  const allProfiles = useMemo(() => {
    if (!data?.pages) return allProfilesRef.current

    const newProfiles = data.pages.flatMap((page) => page.data)

    if (
      newProfiles.length !== allProfilesRef.current.length ||
      newProfiles.some((profile, idx) => profile.id !== allProfilesRef.current[idx]?.id)
    ) {
      allProfilesRef.current = newProfiles
    }

    return allProfilesRef.current
  }, [data])

  useEffect(() => {
    const remainingCards = allProfiles.length - currentIndex
    if (remainingCards <= 5 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [currentIndex, allProfiles.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (isResettingFilters && allProfiles.length > 0 && !isFetching) {
      setCurrentIndex(0)
      clearRevertState()
      setIsResettingFilters(false)
    }
  }, [
    isResettingFilters,
    allProfiles.length,
    isFetching,
    setCurrentIndex,
    clearRevertState,
    setIsResettingFilters,
  ])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (hasCheckedOnMount.current || isLoading) return
    hasCheckedOnMount.current = true

    const hasVisibleProfiles = currentIndex < allProfiles.length

    if (!hasVisibleProfiles && !isFetching && !hasNextPage) {
      void queryClient.invalidateQueries({
        queryKey: FEED_QUERY_KEYS.profiles(),
      })

      setCurrentIndex(0)
      clearRevertState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLimitFailed = useCallback((reason: SwipeActionFailedReason) => {
    setActionFailedReason(reason)
  }, [])

  const handleSwipe = useCallback(
    (profileId: number, result: SwipeResult) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      if (controller.signal.aborted) {
        return
      }

      const newIndex: number = currentIndex + 1
      setCurrentIndex(newIndex)

      swipeProfileMutation.mutate(
        {
          profileId,
          action: result,
        },
        {
          onSuccess: (res) => {
            setMatch(res)

            if (result === "dislike" && res.swipe_id) {
              setCanRevert(true, res.swipe_id)
            } else {
              clearRevertState()
            }
          },
          onSettled: () => {
            if (abortControllerRef.current === controller) {
              abortControllerRef.current = null
            }
          },
        },
      )
    },
    [currentIndex, swipeProfileMutation, setCurrentIndex, setCanRevert, clearRevertState],
  )

  const handleRevert = useCallback(() => {
    if (!user?.is_premium) {
      triggerImpact("heavy")
      handleLimitFailed("revert-limit")
      return
    }

    if (!canRevert || !lastDislikeSwipeId || currentIndex <= 0) {
      return
    }

    const revertedProfile = allProfiles[currentIndex - 1]
    if (!revertedProfile) {
      return
    }

    triggerImpact()
    swipeStackRef.current?.triggerRevert()

    revertDislikeMutation.mutate(
      { swipeId: lastDislikeSwipeId },
      {
        onSuccess: () => {
          setCurrentIndex(currentIndex - 1)
          clearRevertState()
        },
        onError: (error) => {
          console.error("Revert failed:", error)
        },
      },
    )
  }, [
    user?.is_premium,
    canRevert,
    lastDislikeSwipeId,
    currentIndex,
    allProfiles,
    triggerImpact,
    revertDislikeMutation,
    handleLimitFailed,
    setCurrentIndex,
    clearRevertState,
  ])

  const handleProgrammaticSwipeRef = useRef<((direction: "left" | "right" | "up") => void) | null>(
    null,
  )

  handleProgrammaticSwipeRef.current = (direction: "left" | "right" | "up") => {
    if (!abortControllerRef.current) {
      swipeStackRef.current?.triggerTopCardSwipe?.(direction)
    }
  }

  const handleProgrammaticSwipe = useMemo(
    () =>
      debounce(
        (direction: "left" | "right" | "up") => {
          handleProgrammaticSwipeRef.current?.(direction)
        },
        300,
        { leading: true, trailing: false },
      ),
    [],
  )

  useEffect(() => {
    return () => {
      handleProgrammaticSwipe.cancel()
    }
  }, [handleProgrammaticSwipe])

  const revertCard = useCallback(() => {
    triggerImpact("medium")
    handleRevert()
  }, [handleRevert, triggerImpact])

  const openFilters = useCallback(() => {
    triggerImpact()
    void navigate("/preferences")
  }, [navigate, triggerImpact])

  const closeMatch = useCallback(() => {
    setMatch(null)
  }, [])

  const handleNavigateToPremium = useCallback(() => {
    triggerImpact()
    void navigate("/premium")
  }, [navigate, triggerImpact])

  const limitReached = useMemo(() => {
    return userLimitsData?.likes === 0 && userLimitsData?.superlikes === 0
  }, [userLimitsData])

  const shouldHideButtons = useMemo(() => {
    return isDragging || revertingCards.size > 0 || exitingCards.size > 0
  }, [isDragging, revertingCards, exitingCards])

  const appliedFiltersCount = useAppliedFiltersCount(user)
  const hasVisibleProfiles = currentIndex < allProfiles.length

  if (isLoading || (isResettingFilters && isFetching) || (isFetching && !hasVisibleProfiles)) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center'>
          <motion.div
            className='w-12 h-12 border-b-2 border-accent rounded-full mx-auto mb-4'
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className='bod-regular text-white-50'>{t("swipe.loading.text")}</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='text-center px-4'>
          <p className='title1-bold text-attention mb-4'>Oops! Something went wrong</p>
          <Button onClick={() => window.location.reload()} className='mx-auto'>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={classNames("relative h-full flex flex-col touch-none select-none", className)}>
      <div className='flex-1'>
        {limitReached && (
          <div className='absolute z-10 inset-0 flex items-center justify-center flex-col px-3 text-center'>
            <div className='text-center mb-2 text-[75px] leading-[100%]'>😭</div>
            <h6 className='title1-bold mb-2 text-center'>{t("swipe.limitReached.title")}</h6>
            <p className='body-regular mb-4 text-center text-white-50'>
              {t("swipe.limitReached.subtitle")}
            </p>
            <Button size='L' onClick={handleNavigateToPremium}>
              <span>{t("profile.buyPremium")}</span>
            </Button>
          </div>
        )}

        {hasVisibleProfiles && !limitReached && !isCardPressed && (
          <>
            <RevertDislike
              canRevert={canRevert}
              onClick={revertCard}
              style={{ opacity: shouldHideButtons ? 0 : 1 }}
            />
            <div
              className='absolute top-3 right-3 z-4'
              style={{ opacity: shouldHideButtons ? 0 : 1 }}
            >
              <div className='relative'>
                <ButtonIcon path={IconFiltersButton} onClick={openFilters} />
                {appliedFiltersCount > 0 && (
                  <div className='absolute top-[-6px] right-[-6px] bg-accent subtitle-medium rounded-full min-w-[20px] h-[20px] flex items-center justify-center'>
                    {appliedFiltersCount}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className='relative max-w-md mx-auto h-full'>
          {userLimitsData && !limitReached && (
            <SwipeCardStack
              ref={swipeStackRef}
              profiles={allProfiles}
              currentIndex={currentIndex}
              onSwipe={handleSwipe}
              onLimitFailed={handleLimitFailed}
              onDragStateChange={setIsDragging}
              userLimits={userLimitsData}
              className='h-full'
            />
          )}
        </div>
      </div>

      <AnimatePresence mode='wait'>
        {hasVisibleProfiles && userLimitsData && !limitReached && !isCardPressed && (
          <div
            className='absolute inset-3 top-auto z-9 transition-opacity duration-200'
            style={{ opacity: shouldHideButtons ? 0 : 1 }}
          >
            <SwipeActions
              onSwipe={handleProgrammaticSwipe}
              onLimitFailed={handleLimitFailed}
              userLimits={userLimitsData}
              disabled={
                currentIndex >= allProfiles.length ||
                swipeProfileMutation.isPending ||
                abortControllerRef.current !== null
              }
              user={user}
            />
          </div>
        )}
      </AnimatePresence>

      {actionFailedReason &&
        createPortal(
          <ActionLimitModal
            onClick={() => setActionFailedReason(null)}
            actionFailedReason={actionFailedReason}
          />,
          document.body,
        )}

      {match?.matched &&
        createPortal(
          <SwipeMatch matchUser={match.user} onClose={closeMatch} chat={match.chat} />,
          document.body,
        )}
    </div>
  )
}

export const SwipeFeed = withTranslation()(SwipeFeedBase)
