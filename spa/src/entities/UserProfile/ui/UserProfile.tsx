import { type PropsWithChildren, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import classNames from "classnames"
import { useLongPress } from "@uidotdev/usehooks"
import IconChevronDown from "@/shared/assets/icons/icon-chevron-right.svg?react"
import { MediaCarousel } from "@/shared/ui"
import { withTranslation, type WithTranslation } from "react-i18next"
import { UserInfo } from "./UserInfo"
import { UserDetails } from "./UserDetails"
import type { IUser } from "@/entities/user/model/types.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

interface UserProfileProps extends WithTranslation, PropsWithChildren {
  user: IUser
  previewMode: boolean
  guestMode?: boolean
  expanded?: boolean
  className?: string
}

const UserProfileBase = ({
  user,
  previewMode = false,
  guestMode,
  t,
  expanded = false,
  className,
  children,
}: UserProfileProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const [isContentExpanded, setIsContentExpanded] = useState(false)
  const [isPhotoPressed, setIsPhotoPressed] = useState(false)
  const { triggerImpact } = useHapticFeedback()
  const ref = useRef<HTMLDivElement>(null)

  const longPressAttrs = useLongPress(
    () => {
      setIsPhotoPressed(true)
      triggerImpact()
    },
    {
      threshold: 400,
      onStart: (event) => event.preventDefault(),
      onFinish: () => setIsPhotoPressed(false),
      onCancel: () => setIsPhotoPressed(false),
    },
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const toggleExpand = () => {
    if (previewMode) {
      setIsExpanded(!isExpanded)

      setTimeout(() => {
        if (ref.current) {
          const mainElement = document.querySelector("main")
          if (mainElement) {
            const elementTop = ref.current.getBoundingClientRect().top
            const containerTop = mainElement.getBoundingClientRect().top
            const scrollOffset = mainElement.scrollTop + (elementTop - containerTop)

            mainElement.scrollTo({
              top: scrollOffset,
              behavior: "smooth",
            })
          }
        }
      }, 350)
    }
  }

  const handleExpandContent = useCallback(() => {
    triggerImpact()
    setIsContentExpanded(true)
  }, [triggerImpact])

  const handleCollapseContent = useCallback(() => {
    if (!isContentExpanded) return
    triggerImpact()
    setIsContentExpanded(false)
  }, [triggerImpact, isContentExpanded])

  return (
    <motion.div
      ref={ref}
      className={classNames("relative rounded-[24px] overflow-hidden select-none", className)}
      initial={{ height: 360 }}
      animate={{ height: isExpanded ? "100%" : 360 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onContextMenu={handleContextMenu}
      {...longPressAttrs}
    >
      <MediaCarousel
        items={user.files}
        userName={user.name}
        enablePagination={true}
        enableSidesNavigation={true}
      />

      <motion.div
        className={classNames(
          "absolute left-0 right-0 p-4 z-20",
          previewMode ? "bottom-0" : "bottom-[84px]",
          guestMode ? "!bottom-[0]" : "",
        )}
        onClick={handleCollapseContent}
        animate={{ opacity: isPhotoPressed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <UserInfo
          name={user.name}
          age={user.feed_profile?.age}
          is_premium={user.is_premium}
          onToggleExpand={toggleExpand}
          expandButton={
            previewMode ? (
              <>
                <span>{t("view")}</span>
                <IconChevronDown
                  className={classNames(
                    "rotate-90 [&_path]:stroke-accent transition-all duration-200",
                    {
                      "rotate-270": isExpanded,
                    },
                  )}
                />
              </>
            ) : undefined
          }
        />

        <motion.div
          initial={{
            opacity: 0,
            height: 0,
          }}
          animate={{
            opacity: isExpanded ? 1 : 0,
            height: isExpanded ? "auto" : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <UserDetails user={user} isExpanded={isContentExpanded} onExpand={handleExpandContent} />
          {children}
        </motion.div>
      </motion.div>

      <div
        className={classNames(
          "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4527)_40.48%,rgba(0,0,0,0.6)_100%)]",
          "absolute bottom-0 left-0 right-0 w-full transition-all duration-200 z-2 pointer-events-none",
          isExpanded ? "h-[50%]" : "h-[25%]",
        )}
      ></div>
    </motion.div>
  )
}
export const UserProfile = withTranslation()(UserProfileBase)
