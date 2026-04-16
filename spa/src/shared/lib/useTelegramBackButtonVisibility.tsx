import { useEffect, useRef, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { backButton } from "@tma.js/sdk-react"
import { debounce } from "lodash"

export function useTelegramBackButtonVisibility(hiddenOnPaths: string[]) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentlyVisible = useRef<boolean | null>(null)

  const debouncedNavigate = useMemo(
    () =>
      debounce(
        () => {
          void navigate(-1)
        },
        300,
        { leading: true, trailing: false },
      ),
    [navigate],
  )

  useEffect(() => {
    if (!backButton.show.isSupported()) return

    const shouldShow = !hiddenOnPaths.includes(location.pathname)

    if (currentlyVisible.current !== shouldShow) {
      if (shouldShow) {
        backButton.show()
      } else {
        backButton.hide()
      }
      currentlyVisible.current = shouldShow
    }

    const offClick = backButton.onClick(() => void debouncedNavigate())

    return () => {
      offClick()
    }
  }, [location.pathname, debouncedNavigate, hiddenOnPaths])

  useEffect(() => {
    return () => {
      debouncedNavigate.cancel()
    }
  }, [debouncedNavigate])

  return null
}

export function useTelegramBackButton(show: boolean, onBack: () => void) {
  const navigate = useNavigate()

  const debouncedNavigate = useMemo(
    () =>
      debounce(
        () => {
          void navigate(-1)
        },
        300,
        { leading: true, trailing: false },
      ),
    [navigate],
  )

  useEffect(() => {
    if (!backButton.show.isSupported()) return

    if (show) {
      backButton.show()
      const offClick = backButton.onClick(onBack)

      return () => {
        offClick()
        backButton.onClick(() => void debouncedNavigate())
      }
    }
  }, [show, onBack, debouncedNavigate])

  useEffect(() => {
    return () => {
      debouncedNavigate.cancel()
    }
  }, [debouncedNavigate])
}
