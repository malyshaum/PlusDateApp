import { useMemo } from "react"
import classNames from "classnames"
import { Label } from "@/shared/ui"
import IconInstagram from "@/shared/assets/icons/icon-instagram-white.svg?react"
import IconMark from "@/shared/assets/icons/icon-mark-white.svg?react"
import IconHeight from "@/shared/assets/icons/icon-height-white.svg?react"
import IconEye from "@/shared/assets/icons/icon-eye-white.svg?react"
import IconMale from "@/shared/assets/icons/icon-male.svg?react"
import IconFemale from "@/shared/assets/icons/icon-female.svg?react"
import IconSearch from "@/shared/assets/icons/icon-search.svg?react"
import { ESex } from "@/shared/types/common.ts"
import type { IUser } from "@/entities/user/model/types.ts"
import { getCityName, getSearchForLabel } from "@/shared/lib/userHelpers.ts"
import { useTranslation } from "react-i18next"
import { useUser } from "@/entities/user/api/queries.ts"

interface UserDetailsProps {
  user: IUser
  className?: string
  isExpanded?: boolean
  onExpand?: () => void
}

export const UserDetails = ({
  user,
  className,
  isExpanded = false,
  onExpand,
}: UserDetailsProps) => {
  const { i18n, t } = useTranslation()
  const { data: currentUser } = useUser()

  const badges = useMemo(() => {
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

      const isOwnProfile = currentUser?.id === user.id
      const shouldShowInstagram = isOwnProfile ? user.is_premium : currentUser?.is_premium

      if (!shouldShowInstagram) {
        return [createBadge(<IconInstagram />, t("needPremium"), { disabled: true })]
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
    const sexValue = user.feed_profile?.sex === ESex.female ? t("female") : t("male")

    return [
      ...instagramBadges(),
      createBadge(<IconMark />, getCityName(user.feed_profile?.city, i18n.language)),
      createBadge(<IconSearch />, getSearchForLabel(user.feed_profile.search_for, t)),
      createBadge(
        <img
          src={`/activities/${user.feed_profile?.activity?.title}.svg`}
          alt=''
          height={16}
          width={16}
        />,
        user.feed_profile?.activity?.title
          ? t(`activities.${user.feed_profile?.activity?.title}`)
          : null,
      ),
      createBadge(
        <IconHeight />,
        user.feed_profile?.height ? `${user.feed_profile.height} ${t("cm")}` : null,
      ),
      createBadge(
        <IconEye />,
        user.feed_profile?.eye_color ? t(`eyeColors.${user.feed_profile?.eye_color}`) : null,
      ),
      createBadge(sexIcon, sexValue),
      ...(user.feed_profile?.hobbies?.map((h) =>
        createBadge(<span className='leading-[16px]'>{h.emoji}</span>, t(`hobbies.${h.title}`)),
      ) || []),
    ].filter((item) => item.value)
  }, [
    user.instagram,
    user.feed_profile?.city,
    user.feed_profile.search_for,
    user.feed_profile?.activity?.title,
    user.feed_profile?.height,
    user.feed_profile?.eye_color,
    user.feed_profile.sex,
    user.feed_profile?.hobbies,
    user.is_premium,
    user.id,
    i18n,
    t,
    currentUser?.is_premium,
    currentUser?.id,
  ])

  const visibleBadges = isExpanded ? badges : badges.slice(0, 3)
  const remainingCount = badges.length - visibleBadges.length

  return (
    <div className={className}>
      <div className='mt-2 flex flex-wrap gap-1 items-center'>
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
          <Label value={`+${remainingCount}`} onClick={onExpand} />
        )}
      </div>
      {user?.profile_description && (
        <p
          className={classNames(
            "body-regular mt-2 cursor-pointer !leading-[24px]",
            !isExpanded && "line-clamp-1",
          )}
          onClick={onExpand}
        >
          {user.profile_description}
        </p>
      )}
    </div>
  )
}
