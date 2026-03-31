import type { IUser, IUserLimits } from "@/entities/user/model/types"
import type { IChat } from "@/entities/chats"

export type SwipeDirection = "left" | "right" | "up"
export type SwipeAction = "like" | "dislike" | "superlike" | "revert"
export type SwipeResult = SwipeAction
export type SwipeActionFailedReason =
  | "like-limit"
  | "dislike-limit"
  | "superlike-limit"
  | "revert-limit"
  | "superlike-disabled"

export interface SwipeFeedState {
  exitingCards: Set<number>
  revertingCards: Set<number>
  canRevert: boolean
  lastDislikeSwipeId: number | null
  currentIndex: number
  isResettingFilters: boolean
  isCardPressed: boolean
}

export interface SwipeCardProps {
  poolIndex: number
  profile: IUser
  isTop: boolean
  onSwipe: (profileId: number, result: SwipeResult) => void
  onLimitFailed: (reason: SwipeActionFailedReason) => void
  onDragStateChange?: (isDragging: boolean) => void
  userLimits: IUserLimits
  disabled?: boolean
  isReverting?: boolean
}

export interface SwipeGestureConfig {
  swipeThreshold: number
  velocityThreshold: number
  rotationMultiplier: number
  scaleStep: number
}

export interface Match {
  matched: boolean
  user: IUser
  chat: IChat
  swipe_id?: number
}
