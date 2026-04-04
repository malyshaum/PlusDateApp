import { PageLayout } from "@/widgets"
import { withTranslation, type WithTranslation } from "react-i18next"
import { ButtonLink, Notification } from "@/shared/ui"

import IconCrownWhite from "@/shared/assets/icons/icon-crown-white.svg?react"
import PencilIcon from "@/shared/assets/icons/icon-pencil.svg?react"
import SettingsIcon from "@/shared/assets/icons/icon-settings.svg?react"
import ChevronIcon from "@/shared/assets/icons/icon-chevron-right.svg?react"
import TriangleWarningIcon from "@/shared/assets/icons/icon-triangle-warning.svg?react"
import RoundedWarningIcon from "@/shared/assets/icons/icon-rounded-warning.svg?react"
import { UserProfile } from "@/entities/UserProfile/ui/UserProfile.tsx"
import { useExternalUser, useUser } from "@/entities/user/api/queries.ts"
import useProfileFullness from "@/entities/user/lib/useProfileFullness.tsx"
import { useMemo } from "react"
import type { IUser } from "@/entities/user/model/types.ts"
import { useCurrentSubscription } from "@/pages/premium/api/query.ts"

export const ProfilePageBase = ({ t }: WithTranslation) => {
  const { data: user } = useUser()
  const { data: meUser } = useExternalUser(user?.id)
  const isUserProfileFull = useProfileFullness(user)
  const { data: subscription } = useCurrentSubscription()

  const links = [
    {
      icon: <PencilIcon />,
      path: "/profile/edit",
      labelKey: "myProfile.editProfile",
      showIndicator: !isUserProfileFull,
      disabled: user?.is_under_moderation,
    },
    {
      icon: <IconCrownWhite />,
      path: "/premium",
      labelKey: "myProfile.subscription",
    },
    {
      icon: <SettingsIcon />,
      path: "/profile/settings",
      labelKey: "myProfile.settings",
    },
  ]

  const transformedUser = useMemo(() => {
    if (!user?.settings?.hide_age) return user

    return {
      ...user,
      feed_profile: {
        ...user.feed_profile,
        age: null,
      },
    }
  }, [user])

  const transformedMeUser = useMemo(() => {
    if (!meUser?.settings?.hide_age) return meUser

    return {
      ...meUser,
      feed_profile: {
        ...meUser.feed_profile,
        age: null,
      },
    }
  }, [meUser])

  const hasOneDayTrial = subscription?.telegram?.plan === "one_day"
  const hasActiveStripe = subscription?.stripe && subscription.stripe.stripe_status === "active"
  const hasActiveTelegram = subscription?.telegram?.plan && subscription.telegram.plan !== "one_day"

  const showPremiumButton = !hasActiveStripe && !hasActiveTelegram

  return (
    <PageLayout shadow={{ bottom: true, top: false }} className='pb-safe-area-bottom-with-menu'>
      {!isUserProfileFull && !user?.is_under_moderation && (
        <Notification
          icon={<RoundedWarningIcon />}
          title='profile.finishProfile'
          subtitle='profile.finishProfileSubtitle'
          type='warning'
        />
      )}

      {user?.is_under_moderation && (
        <Notification
          icon={<TriangleWarningIcon />}
          title='profile.underModeration'
          subtitle='profile.underModerationSubtitle'
          type='error'
        />
      )}

      {user && user?.is_under_moderation && (
        <UserProfile previewMode={true} user={transformedUser as IUser} guestMode={true} />
      )}
      {meUser && !user?.is_under_moderation && (
        <UserProfile previewMode={true} user={transformedMeUser as IUser} guestMode={true} />
      )}

      {showPremiumButton && (
        <ButtonLink
          to='/premium'
          variant='accent'
          icon={<IconCrownWhite />}
          rightElement={<ChevronIcon />}
          className='mt-4'
        >
          <span className='block body-bold'>
            {hasOneDayTrial || user?.is_trial_used
              ? t("profile.buyPremium")
              : t("premium.startFreeTrial")}
          </span>
          <span className='block subtitle-medium mt-1 !normal-case'>
            {hasOneDayTrial || user?.is_trial_used
              ? t("profile.premiumDiscount")
              : t("premium.tryFreeTrial")}
          </span>
        </ButtonLink>
      )}

      <ul className='mt-[10px]'>
        {links.map((link) => (
          <li key={link.path} className='mb-1'>
            <ButtonLink
              to={link.path}
              icon={link.icon}
              rightElement={<ChevronIcon />}
              showIndicator={link?.showIndicator}
              disabled={link?.disabled}
            >
              {t(link.labelKey)}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </PageLayout>
  )
}

export const ProfilePage = withTranslation()(ProfilePageBase)
