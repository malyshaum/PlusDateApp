import { useCallback, useState } from "react"
import classNames from "classnames"
import ReactPlayer from "react-player"
import { motion } from "framer-motion"
import { UserInfo } from "@/entities/UserProfile/ui/UserInfo"
import { Button, Label, LottieComponent } from "@/shared/ui"
import IconInstagram from "@/shared/assets/icons/icon-instagram-white.svg?react"
import IconMark from "@/shared/assets/icons/icon-mark-white.svg?react"
import IconHeight from "@/shared/assets/icons/icon-height-white.svg?react"
import IconEye from "@/shared/assets/icons/icon-eye-white.svg?react"
import IconMale from "@/shared/assets/icons/icon-male.svg?react"
import IconFemale from "@/shared/assets/icons/icon-female.svg?react"
import IconSearch from "@/shared/assets/icons/icon-search.svg?react"
import VideoAnimation from "@/../public/animations/PD_em6.json"
import { ESex } from "@/shared/types/common.ts"
import type { IUser, IUserFile } from "@/entities/user/model/types"
import { useTranslation, withTranslation, type WithTranslation } from "react-i18next"
import { useUser } from "@/entities/user/api/queries.ts"
import { useNavigate } from "react-router-dom"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { getCityName, getSearchForLabel } from "@/shared/lib/userHelpers.ts"
import type { i18n as Ti18n } from "i18next"
import { useSwipeFeedStore } from "../../model/store"

export type FeedSlideType = "photo-basic" | "photo-badges" | "photo-description" | "video"

interface Props extends WithTranslation {
  type: FeedSlideType
  media: IUserFile
  user: IUser
  userName: string
  isVideoPlaying?: boolean
  className?: string
}

const getBadges = (user: IUser, i18n: Ti18n, currentUser?: IUser) => {
  const createBadge = (
    icon: React.ReactElement,
    value: string | null | undefined,
    options?: { className?: string; disabled?: boolean; onClick?: () => void },
  ) => ({
    icon,
    value,
    className: options?.className,
    disabled: options?.disabled,
    onClick: options?.onClick,
  })

  const instagramBadges = () => {
    if (!user.instagram) return []
    if (!currentUser?.is_premium) {
      return [createBadge(<IconInstagram />, i18n.t("needPremium"), { disabled: true })]
    }
    return [
      createBadge(<IconInstagram />, user.instagram, {
        className: "!lowercase",
        onClick: () => {
          window.open(`https://instagram.com/${user.instagram}`, "_blank")
        },
      }),
    ]
  }

  const sexIcon =
    user.feed_profile?.sex === ESex.female ? (
      <IconFemale height={16} width={16} />
    ) : (
      <IconMale height={16} width={16} />
    )
  const sexValue = user.feed_profile?.sex === ESex.female ? i18n.t("female") : i18n.t("male")

  return [
    ...instagramBadges(),
    createBadge(<IconMark />, getCityName(user.feed_profile?.city, i18n.language)),
    createBadge(<IconSearch />, getSearchForLabel(user.feed_profile.search_for, i18n.t)),
    createBadge(
      <img
        src={`/activities/${user.feed_profile?.activity?.title}.svg`}
        alt=''
        height={16}
        width={16}
      />,
      user.feed_profile?.activity?.title
        ? i18n.t(`activities.${user.feed_profile?.activity?.title}`)
        : null,
    ),
    createBadge(
      <IconHeight />,
      user.feed_profile?.height ? `${user.feed_profile.height} ${i18n.t("cm")}` : null,
    ),
    createBadge(
      <IconEye />,
      user.feed_profile?.eye_color ? i18n.t(`eyeColors.${user.feed_profile?.eye_color}`) : null,
    ),
    createBadge(sexIcon, sexValue),
    ...(user.feed_profile?.hobbies?.map((h) =>
      createBadge(<span className='leading-[16px]'>{h.emoji}</span>, i18n.t(`hobbies.${h.title}`)),
    ) || []),
  ].filter((item) => item.value)
}

const FeedSlideBase = ({
  type,
  media,
  user,
  userName,
  isVideoPlaying = false,
  className,
  t,
}: Props) => {
  const { data: currentUser } = useUser()
  const { i18n } = useTranslation()
  const { triggerImpact } = useHapticFeedback()
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const { isCardPressed } = useSwipeFeedStore()

  const handleNavigateToPremium = useCallback(() => {
    triggerImpact()
    void navigate("/premium")
  }, [navigate, triggerImpact])

  const handleExpandInfo = useCallback(() => {
    triggerImpact()
    setIsExpanded(true)
  }, [triggerImpact])

  const hideExpandedInfo = useCallback(() => {
    if (!isExpanded) return
    triggerImpact()
    setIsExpanded((prev) => !prev)
  }, [triggerImpact, isExpanded])

  const badges = getBadges(user, i18n, currentUser)

  const renderMedia = () => {
    if (media.type === "image") {
      return (
        <img
          src={media.url}
          alt={`${userName} photo`}
          className='w-full h-full object-cover object-top select-none pointer-events-none'
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
          }}
        />
      )
    }

    if (media.type === "video") {
      return (
        <div className='w-full h-full relative bg-grey-10'>
          {!currentUser?.is_premium && (
            <div className='absolute z-10 inset-0 flex items-center justify-center flex-col px-3 text-center'>
              <LottieComponent animationData={VideoAnimation} width={80} height={80} />
              <h6 className='title1-bold mb-2 mt-6 text-center'>{t("video.title")}</h6>
              <p className='body-regular mb-4 text-center text-white-50'>
                {t("video.premiumOnly")}
              </p>
              <Button size='L' onClick={handleNavigateToPremium}>
                <span>{t("profile.buyPremium")}</span>
              </Button>
            </div>
          )}

          <div className={classNames("h-full", !currentUser?.is_premium && "blur-xl")}>
            <ReactPlayer
              src={media.url}
              playing={isVideoPlaying}
              loop={true}
              controls={false}
              volume={1}
              muted={!currentUser?.is_premium}
              playsInline={true}
              width='100%'
              height='100%'
            />
          </div>
        </div>
      )
    }

    return null
  }

  const renderUserDetails = () => {
    if (type === "video") {
      return null
    }

    if (type === "photo-basic") {
      const visibleBadges = isExpanded ? badges : badges.slice(0, 3)
      const remainingCount = badges.length - visibleBadges.length

      return (
        <div className='mt-2'>
          <div className='flex flex-wrap gap-1 items-center'>
            {visibleBadges.map((item, index) => (
              <Label
                key={index}
                icon={item.icon}
                value={item.value}
                className={item?.className}
                disabled={item.disabled}
                onClick={item.onClick}
              />
            ))}
            {remainingCount > 0 && !isExpanded && (
              <Label value={`+${remainingCount}`} onClick={handleExpandInfo} />
            )}
          </div>
          {user?.profile_description && (
            <p
              className={classNames(
                "body-regular mt-2 cursor-pointer !leading-[24px]",
                !isExpanded && "line-clamp-1",
              )}
              onClick={handleExpandInfo}
            >
              {user.profile_description}
            </p>
          )}
        </div>
      )
    }

    if (type === "photo-badges") {
      return (
        <div className='flex flex-wrap gap-1 items-center mt-2'>
          {badges.slice(3, badges.length).map((item, index) => (
            <Label
              key={index}
              icon={item.icon}
              value={item.value}
              className={item?.className}
              disabled={item.disabled}
              onClick={item.onClick}
            />
          ))}
        </div>
      )
    }

    if (type === "photo-description") {
      return (
        <div className='mt-2'>
          {user?.profile_description && <p className='body-regular'>{user.profile_description}</p>}
        </div>
      )
    }

    return null
  }

  return (
    <div className={classNames("relative h-full overflow-hidden select-none", className)}>
      {renderMedia()}

      <motion.div
        className='absolute left-0 right-0 bottom-[84px] px-4 z-20'
        onClick={hideExpandedInfo}
        animate={{ opacity: isCardPressed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <UserInfo name={user.name} age={user.feed_profile?.age} is_premium={user.is_premium} />
        {renderUserDetails()}
      </motion.div>

      <div className='bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4527)_40.48%,rgba(0,0,0,0.6)_100%)] absolute bottom-0 left-0 right-0 w-full z-2 pointer-events-none h-[50%]' />
    </div>
  )
}

export const FeedSlide = withTranslation()(FeedSlideBase)
