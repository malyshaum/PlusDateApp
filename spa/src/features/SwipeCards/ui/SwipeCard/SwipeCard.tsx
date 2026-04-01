import {
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useRef,
  memo,
} from "react"
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion"
import classNames from "classnames"
import type { SwipeCardProps } from "../../model/types"
import { FeedCard } from "../FeedCard"
import { type ImpactStyle, useHapticFeedback } from "@/shared/lib/useHapticFeedback"
import { useUser } from "@/entities/user/api/queries.ts"

export interface SwipeCardRef {
  triggerSwipe: (direction: "left" | "right" | "up") => void
}

const ANIMATION_CONFIG = {
  DRAG_CALLBACK_DELAY: 400,
  PROGRAMMATIC_CALLBACK_DELAY: 600,
  RETURN_ANIMATION_DELAY: 600,
  SWIPE_THRESHOLD: 100,
  VELOCITY_THRESHOLD: 300,
} as const

const SPRING_CONFIGS = {
  SMOOTH_EXIT: { type: "spring", stiffness: 45, damping: 12 } as const,
  FAST_EXIT: { type: "spring", stiffness: 180, damping: 25 } as const,
  RETURN: { type: "spring", stiffness: 120, damping: 20 } as const,
} as const

const DRAG_CONSTRAINTS = {
  left: -200,
  right: 200,
  top: -200,
  bottom: 0,
} as const

const DRAG_TRANSITION = { duration: 0.1 } as const

const INITIAL_STATES = {
  REVERTING: { x: -500, y: 200, opacity: 0.8, scale: 0.95 } as const,
  NORMAL: { x: 0, y: 0, opacity: 1 } as const,
} as const

const ANIMATE_STATE = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
} as const

const ENTER_TRANSITIONS = {
  REVERTING: {
    type: "spring",
    stiffness: 120,
    damping: 20,
    duration: 0.6,
  } as const,
  NORMAL: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    duration: 0.3,
  } as const,
} as const

const OVERLAY_GRADIENTS = {
  DISLIKE:
    "radial-gradient(102.97% 100.97% at -2.97% -0.97%, #DF1A21 0%, rgba(95, 16, 16, 0) 100%)",
  LIKE: "radial-gradient(102.97% 100.97% at -2.97% -0.97%, #22C55E 0%, rgba(16, 95, 45, 0) 100%)",
  SUPERLIKE:
    "radial-gradient(102.97% 100.97% at -2.97% -0.97%, #FEAC47 0%, rgba(226, 95, 39, 0) 100%)",
} as const

const OVERLAY_BASE_STYLE = { transform: "translateZ(0)" } as const

type CardStatus = "idle" | "dragging" | "returning" | "exiting"

const SwipeCardComponent = forwardRef<SwipeCardRef, SwipeCardProps>(
  (
    {
      poolIndex,
      profile,
      isTop,
      onSwipe,
      onLimitFailed,
      onDragStateChange,
      userLimits,
      disabled = false,
      isReverting = false,
    },
    ref,
  ) => {
    const { data: user } = useUser()
    const { triggerImpact } = useHapticFeedback()
    const [cardStatus, setCardStatus] = useState<CardStatus>("idle")
    const swipeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const rotateZ = useTransform(x, [-300, 300], [-15, 15])

    const dislikeOpacity = useTransform(x, [-150, -50, 0], [1, 0, 0])
    const likeOpacity = useTransform(x, [0, 50, 150], [0, 0, 1])
    const superlikeOpacity = useTransform(y, [-150, -50, 0], [1, 0, 0])

    const isAnimating = cardStatus === "exiting" || cardStatus === "returning"
    const canDrag = (cardStatus === "idle" || cardStatus === "dragging") && isTop && !disabled

    const cardStyle = {
      x,
      y,
      rotateZ,
      zIndex: 3 - poolIndex,
    }

    useEffect(() => {
      return () => {
        if (swipeTimeoutRef.current) {
          clearTimeout(swipeTimeoutRef.current)
        }
        setCardStatus("idle")
      }
    }, [])

    useEffect(() => {
      if (isTop) {
        onDragStateChange?.(cardStatus !== "idle")
      }
    }, [isTop, cardStatus, onDragStateChange])

    const triggerHapticFeedback = useCallback(
      (type?: ImpactStyle) => {
        triggerImpact(type)
      },
      [triggerImpact],
    )

    const animateCardExit = useCallback(
      (direction: "left" | "right" | "up", smooth: boolean = false) => {
        const currentX = x.get()

        const exitDistance = 500
        let exitX, exitY

        if (direction === "right") {
          exitX = exitDistance
          exitY = exitDistance * 0.4
        } else if (direction === "left") {
          exitX = -exitDistance
          exitY = exitDistance * 0.4
        } else {
          exitX = currentX * 0.1
          exitY = -exitDistance * 1.5
        }

        if (smooth) {
          animate(x, exitX, SPRING_CONFIGS.SMOOTH_EXIT)
          animate(y, exitY, SPRING_CONFIGS.SMOOTH_EXIT)
        } else {
          animate(x, exitX, SPRING_CONFIGS.FAST_EXIT)
          animate(y, exitY, SPRING_CONFIGS.FAST_EXIT)
        }
      },
      [x, y],
    )

    const handleDragEnd = useCallback(
      (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
        if (!isTop || disabled) return

        const { offset, velocity } = info
        let swipeDirection: "left" | "right" | "up"

        if (offset.y < -Math.abs(offset.x) * 0.8) {
          swipeDirection = "up"
        } else {
          swipeDirection = offset.x > 0 ? "right" : "left"
        }

        const isStrongSwipe =
          Math.abs(offset.x) > ANIMATION_CONFIG.SWIPE_THRESHOLD ||
          Math.abs(offset.y) > ANIMATION_CONFIG.SWIPE_THRESHOLD ||
          Math.abs(velocity.x) > ANIMATION_CONFIG.VELOCITY_THRESHOLD ||
          Math.abs(velocity.y) > ANIMATION_CONFIG.VELOCITY_THRESHOLD

        if (!isStrongSwipe) {
          setCardStatus("returning")
          animate(x, 0, SPRING_CONFIGS.RETURN)
          animate(y, 0, SPRING_CONFIGS.RETURN)

          setTimeout(() => {
            setCardStatus("idle")
          }, ANIMATION_CONFIG.RETURN_ANIMATION_DELAY)
          return
        }

        if (isAnimating) return
        setCardStatus("exiting")

        if (swipeDirection === "right" && userLimits.likes <= 0) {
          setCardStatus("returning")
          triggerHapticFeedback()
          onLimitFailed("like-limit")
          animate(x, 0, SPRING_CONFIGS.RETURN)
          animate(y, 0, SPRING_CONFIGS.RETURN)
          setTimeout(() => {
            setCardStatus("idle")
          }, ANIMATION_CONFIG.RETURN_ANIMATION_DELAY)
          return
        }

        if (swipeDirection === "up" && !user?.is_premium) {
          setCardStatus("returning")
          triggerHapticFeedback("heavy")
          onLimitFailed("superlike-disabled")
          animate(x, 0, SPRING_CONFIGS.RETURN)
          animate(y, 0, SPRING_CONFIGS.RETURN)
          setTimeout(() => {
            setCardStatus("idle")
          }, ANIMATION_CONFIG.RETURN_ANIMATION_DELAY)
          return
        }

        if (swipeDirection === "up" && userLimits.superlikes <= 0) {
          setCardStatus("returning")
          triggerHapticFeedback("heavy")
          onLimitFailed("superlike-limit")
          animate(x, 0, SPRING_CONFIGS.RETURN)
          animate(y, 0, SPRING_CONFIGS.RETURN)
          setTimeout(() => {
            setCardStatus("idle")
          }, ANIMATION_CONFIG.RETURN_ANIMATION_DELAY)
          return
        }

        triggerHapticFeedback()

        animateCardExit(swipeDirection, false)

        if (swipeTimeoutRef.current) {
          clearTimeout(swipeTimeoutRef.current)
        }

        swipeTimeoutRef.current = setTimeout(() => {
          const result =
            swipeDirection === "right"
              ? "like"
              : swipeDirection === "left"
                ? "dislike"
                : "superlike"
          onSwipe(profile.feed_profile.id, result)
          swipeTimeoutRef.current = null
        }, ANIMATION_CONFIG.DRAG_CALLBACK_DELAY)
      },
      [
        isTop,
        disabled,
        isAnimating,
        userLimits.likes,
        userLimits.superlikes,
        user?.is_premium,
        triggerHapticFeedback,
        animateCardExit,
        x,
        y,
        onLimitFailed,
        onSwipe,
        profile.feed_profile.id,
      ],
    )

    const triggerSwipe = useCallback(
      (direction: "left" | "right" | "up") => {
        if (!isTop || isAnimating || disabled) {
          return
        }

        setCardStatus("exiting")

        if (direction === "up" && !user?.is_premium) {
          setCardStatus("idle")
          triggerHapticFeedback()
          onLimitFailed("superlike-disabled")
          return
        }

        if (direction === "up" && userLimits.superlikes <= 0) {
          setCardStatus("idle")
          triggerHapticFeedback()
          onLimitFailed("superlike-limit")
          return
        }

        triggerHapticFeedback()
        animateCardExit(direction, true)

        if (swipeTimeoutRef.current) {
          clearTimeout(swipeTimeoutRef.current)
        }

        swipeTimeoutRef.current = setTimeout(() => {
          const result =
            direction === "right" ? "like" : direction === "left" ? "dislike" : "superlike"
          onSwipe(profile.feed_profile.id, result)
          swipeTimeoutRef.current = null
        }, ANIMATION_CONFIG.PROGRAMMATIC_CALLBACK_DELAY)
      },
      [
        isTop,
        isAnimating,
        disabled,
        user?.is_premium,
        userLimits.superlikes,
        triggerHapticFeedback,
        animateCardExit,
        onLimitFailed,
        onSwipe,
        profile.feed_profile.id,
      ],
    )

    useImperativeHandle(
      ref,
      () => ({
        triggerSwipe,
      }),
      [triggerSwipe],
    )

    return (
      <motion.div
        className={classNames(
          "absolute inset-0",
          isTop ? "cursor-grab" : "cursor-default",
          !canDrag && "pointer-events-none",
        )}
        style={cardStyle}
        drag={canDrag}
        dragConstraints={DRAG_CONSTRAINTS}
        dragElastic={0.7}
        onDragStart={() => setCardStatus("dragging")}
        onDragEnd={handleDragEnd}
        whileDrag={{
          transition: DRAG_TRANSITION,
        }}
        initial={isReverting ? INITIAL_STATES.REVERTING : INITIAL_STATES.NORMAL}
        animate={ANIMATE_STATE}
        transition={isReverting ? ENTER_TRANSITIONS.REVERTING : ENTER_TRANSITIONS.NORMAL}
      >
        <div className='relative w-full h-full rounded-[24px] overflow-hidden transform-gpu'>
          <FeedCard user={profile} />

          <div
            className={classNames(
              "absolute inset-0 bg-dark-100 z-2 transition-all pointer-events-none",
              poolIndex !== 0 && !isReverting ? "opacity-80" : "opacity-0",
            )}
          />

          <motion.div
            className='absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none z-20 rotate-90 will-change-[opacity]'
            style={{
              ...OVERLAY_BASE_STYLE,
              background: OVERLAY_GRADIENTS.DISLIKE,
              opacity: isReverting ? 0 : dislikeOpacity,
            }}
          />

          <motion.div
            className='absolute top-0 left-0 w-[300px] h-[300px] pointer-events-none z-20 will-change-[opacity]'
            style={{
              ...OVERLAY_BASE_STYLE,
              background: OVERLAY_GRADIENTS.LIKE,
              opacity: isReverting ? 0 : likeOpacity,
            }}
          />

          <motion.div
            className='absolute top-0 left-0 w-[300%] h-[300px] pointer-events-none z-20 will-change-[opacity]'
            style={{
              ...OVERLAY_BASE_STYLE,
              background: OVERLAY_GRADIENTS.SUPERLIKE,
              opacity: isReverting ? 0 : superlikeOpacity,
            }}
          />
        </div>
      </motion.div>
    )
  },
)

export const SwipeCard = memo(SwipeCardComponent, (prev: SwipeCardProps, next: SwipeCardProps) => {
  return (
    prev.profile.feed_profile.id === next.profile.feed_profile.id &&
    prev.isTop === next.isTop &&
    prev.disabled === next.disabled &&
    prev.poolIndex === next.poolIndex &&
    prev.isReverting === next.isReverting
  )
})
