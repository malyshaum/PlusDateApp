import { create } from "zustand"
import type { SwipeFeedState } from "./types"

interface SwipeFeedActions {
  addExitingCard: (profileId: number) => void
  removeExitingCard: (profileId: number) => void
  clearExitingCards: () => void
  addRevertingCard: (profileId: number) => void
  removeRevertingCard: (profileId: number) => void
  setCanRevert: (canRevert: boolean, swipeId?: number | null) => void
  clearRevertState: () => void
  setCurrentIndex: (index: number) => void
  resetFeedState: () => void
  setIsResettingFilters: (value: boolean) => void
  setCardPressed: (value: boolean) => void
}

type SwipeFeedStore = SwipeFeedState & SwipeFeedActions

const initialState: SwipeFeedState = {
  exitingCards: new Set(),
  revertingCards: new Set(),
  canRevert: false,
  lastDislikeSwipeId: null,
  currentIndex: 0,
  isResettingFilters: false,
  isCardPressed: false,
}

export const useSwipeFeedStore = create<SwipeFeedStore>()((set) => ({
  ...initialState,

  addExitingCard: (profileId: number) => {
    set((state) => {
      const newSet = new Set(state.exitingCards)
      newSet.add(profileId)
      return { exitingCards: newSet }
    })
  },

  removeExitingCard: (profileId: number) => {
    set((state) => {
      const newExitingCards = new Set(state.exitingCards)
      newExitingCards.delete(profileId)
      return { exitingCards: newExitingCards }
    })
  },

  clearExitingCards: () => {
    set({ exitingCards: new Set() })
  },

  addRevertingCard: (profileId: number) => {
    set((state) => {
      const newSet = new Set(state.revertingCards)
      newSet.add(profileId)
      return { revertingCards: newSet }
    })
  },

  removeRevertingCard: (profileId: number) => {
    set((state) => {
      const newRevertingCards = new Set(state.revertingCards)
      newRevertingCards.delete(profileId)
      return { revertingCards: newRevertingCards }
    })
  },

  setCanRevert: (canRevert: boolean, swipeId?: number | null) => {
    set({
      canRevert,
      lastDislikeSwipeId: canRevert ? swipeId || null : null,
    })
  },

  clearRevertState: () => {
    set({
      canRevert: false,
      lastDislikeSwipeId: null,
    })
  },

  setCurrentIndex: (index: number) => {
    set({ currentIndex: index })
  },

  resetFeedState: () => {
    set(initialState)
  },

  setIsResettingFilters: (value: boolean) => {
    set({ isResettingFilters: value })
  },

  setCardPressed: (value: boolean) => {
    set({ isCardPressed: value })
  },
}))
