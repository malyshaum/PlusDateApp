import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  memo,
} from "react"
import { SwipeCard, type SwipeCardRef } from "../SwipeCard"
import { useSwipeFeedStore } from "../../model/store"
import type { SwipeActionFailedReason, SwipeResult } from "../../model/types"
import type { IUser, IUserLimits } from "@/entities/user/model/types.ts"
import { EmptyProfilesState } from "../EmptyProfilesState"

interface SwipeCardStackProps {
  profiles: IUser[]
  currentIndex: number
  onSwipe: (profileId: number, result: SwipeResult) => void
  onLimitFailed: (reason: SwipeActionFailedReason) => void
  onDragStateChange?: (isDragging: boolean) => void
  userLimits: IUserLimits
  className?: string
}

export interface SwipeCardStackRef {
  triggerTopCardSwipe: (direction: "left" | "right" | "up") => void
  triggerRevert: () => void
}

const SwipeCardStackComponent = forwardRef<SwipeCardStackRef, SwipeCardStackProps>(
  (
    {
      profiles,
      currentIndex,
      onSwipe,
      onLimitFailed,
      onDragStateChange,
      userLimits,
      className = "",
    },
    ref,
  ) => {
    const exitingCards = useSwipeFeedStore((state) => state.exitingCards)
    const addExitingCard = useSwipeFeedStore((state) => state.addExitingCard)
    const removeExitingCard = useSwipeFeedStore((state) => state.removeExitingCard)
    const revertingCards = useSwipeFeedStore((state) => state.revertingCards)
    const addRevertingCard = useSwipeFeedStore((state) => state.addRevertingCard)
    const removeRevertingCard = useSwipeFeedStore((state) => state.removeRevertingCard)
    const topCardRef = useRef<SwipeCardRef>(null)
    const cleanupTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map())

    const triggerTopCardSwipe = useCallback((direction: "left" | "right" | "up") => {
      topCardRef.current?.triggerSwipe(direction)
    }, [])

    const triggerRevert = useCallback(() => {
      if (currentIndex > 0) {
        const revertProfile = profiles[currentIndex - 1]
        if (revertProfile) {
          addRevertingCard(revertProfile.id)

          const timeoutId = setTimeout(() => {
            removeRevertingCard(revertProfile.id)
            cleanupTimeouts.current.delete(revertProfile.id)
          }, 600)

          cleanupTimeouts.current.set(revertProfile.id, timeoutId)
        }
      }
    }, [currentIndex, profiles, addRevertingCard, removeRevertingCard])

    useImperativeHandle(
      ref,
      () => ({
        triggerTopCardSwipe,
        triggerRevert,
      }),
      [triggerTopCardSwipe, triggerRevert],
    )

    useEffect(() => {
      return () => {
        cleanupTimeouts.current.forEach((timeoutId) => {
          clearTimeout(timeoutId)
        })
        cleanupTimeouts.current.clear()

        const state = useSwipeFeedStore.getState()
        state.exitingCards.forEach((id) => state.removeExitingCard(id))
        state.revertingCards.forEach((id) => state.removeRevertingCard(id))
      }
    }, [])

    const CARD_POOL_SIZE = 3
    const visibleProfiles = useMemo(() => {
      const currentProfiles = profiles.slice(currentIndex, currentIndex + CARD_POOL_SIZE)

      if (currentIndex > 0) {
        const prevProfile = profiles[currentIndex - 1]
        if (prevProfile && revertingCards.has(prevProfile.id)) {
          return [prevProfile, ...currentProfiles]
        }
      }

      return currentProfiles
    }, [profiles, currentIndex, revertingCards])

    const handleSwipe = useCallback(
      (profileId: number, result: SwipeResult) => {
        addExitingCard(profileId)

        onSwipe(profileId, result)

        const existingTimeout = cleanupTimeouts.current.get(profileId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        const timeoutId = setTimeout(() => {
          removeExitingCard(profileId)
          cleanupTimeouts.current.delete(profileId)
        }, 100)

        cleanupTimeouts.current.set(profileId, timeoutId)
      },
      [onSwipe, addExitingCard, removeExitingCard],
    )

    if (visibleProfiles.length === 0) {
      return <EmptyProfilesState />
    }

    return (
      <div
        className={`relative w-full h-full ${className}`}
        style={{ touchAction: "none", userSelect: "none" }}
      >
        {visibleProfiles.map((profile, index) => {
          const isReverting = revertingCards.has(profile.id)
          const isExiting = exitingCards.has(profile.id)
          const isTop = index === (isReverting ? 1 : 0) && !isExiting && !isReverting
          const poolIndex = isReverting ? -1 : index

          return (
            <SwipeCard
              key={`${profile.id}-${isReverting ? "reverting" : "normal"}`}
              ref={isTop ? topCardRef : null}
              poolIndex={poolIndex}
              profile={profile}
              isTop={isTop}
              onSwipe={handleSwipe}
              onLimitFailed={onLimitFailed}
              onDragStateChange={onDragStateChange}
              userLimits={userLimits}
              disabled={isExiting || isReverting}
              isReverting={isReverting}
            />
          )
        })}
      </div>
    )
  },
)

export const SwipeCardStack = memo(SwipeCardStackComponent, (prev, next) => {
  return (
    prev.currentIndex === next.currentIndex &&
    prev.profiles.length === next.profiles.length &&
    prev.userLimits === next.userLimits &&
    prev.className === next.className
  )
})
