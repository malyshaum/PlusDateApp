import { PageLayout } from "@/widgets"
import { withTranslation, type WithTranslation } from "react-i18next"
import { BottomButtonGroup, LottieComponent, RadioButtonGroup, Tabs } from "@/shared/ui"
import { useState, useMemo, useEffect } from "react"
import TextPlusDate from "../assets/plus-date.svg"
import { plans, sliderItems, tabs } from "../lib/constants.ts"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, Autoplay } from "swiper/modules"
import classNames from "classnames"
import styles from "../styles/index.module.css"
import {
  useSubscription,
  useStarsSubscription,
  useTrialSubscription,
  useCurrentSubscription,
  useCancelSubscription,
} from "@/pages/premium/api/query.ts"
import type { Range } from "@/pages/premium/model/types.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { usePaymentModal } from "@/shared/lib/usePaymentModal"
import { useQueryClient } from "@tanstack/react-query"
import IconStar from "@/shared/assets/icons/icon-stars.svg?react"
import { useUser } from "@/entities/user/api/queries.ts"
import { useNavigate, useSearchParams } from "react-router-dom"
import { dayjs } from "@/shared/lib/date.ts"
import type { Dayjs } from "dayjs"
import type { IStripeSubscription, ITelegramSubscription } from "@/pages/premium/model/types.ts"

type SubscriptionType = "stripe" | "telegram"

interface SubscriptionData {
  stripe: IStripeSubscription | null
  telegram: ITelegramSubscription | null
}

interface ActiveSubscription {
  type: SubscriptionType
  data: IStripeSubscription | ITelegramSubscription
  endDate: Dayjs
}

interface SubscriptionInfo {
  type: SubscriptionType
  isFreeOneDayTelegram: boolean
  diffInDays: number
  endsToday: boolean
  endDate: Dayjs
  plan: Range | null
}

const isStripeActive = (
  stripe: IStripeSubscription | null | undefined,
): stripe is IStripeSubscription => {
  return !!stripe && (stripe.stripe_status === "active" || stripe.stripe_status === "trialing")
}

const getActiveSubscription = (
  subscription: SubscriptionData | undefined,
): ActiveSubscription | null => {
  if (!subscription?.stripe && !subscription?.telegram) {
    return null
  }

  const { stripe, telegram } = subscription
  const hasActiveStripe = isStripeActive(stripe)
  const stripeEndDate = stripe?.ends_at ? dayjs(stripe.ends_at) : null
  const telegramEndDate = telegram?.active_until ? dayjs(telegram.active_until) : null

  if (hasActiveStripe && !stripeEndDate) {
    return {
      type: "stripe",
      data: stripe,
      endDate: dayjs().add(30, "days"),
    }
  }

  if (stripeEndDate && telegramEndDate && stripe && telegram) {
    const isStripeLonger = stripeEndDate.isAfter(telegramEndDate)
    return {
      type: isStripeLonger ? "stripe" : "telegram",
      data: isStripeLonger ? stripe : telegram,
      endDate: isStripeLonger ? stripeEndDate : telegramEndDate,
    }
  }

  if (stripeEndDate && stripe) {
    return { type: "stripe", data: stripe, endDate: stripeEndDate }
  }

  if (telegramEndDate && telegram) {
    return { type: "telegram", data: telegram, endDate: telegramEndDate }
  }

  return null
}

const getCurrentPlan = (activeSubscription: ActiveSubscription | null): Range | null => {
  if (!activeSubscription?.data) return null

  if (activeSubscription.type === "telegram") {
    return (activeSubscription.data as ITelegramSubscription).plan
  }

  return (activeSubscription.data as IStripeSubscription).type
}

const isSubscriptionMatchingTab = (
  subscriptionType: SubscriptionType | undefined,
  currentTab: string,
): boolean => {
  if (!subscriptionType) return false

  return (
    (subscriptionType === "stripe" && currentTab === "card") ||
    (subscriptionType === "telegram" && currentTab === "stars")
  )
}

const getPlanPrice = (
  plan: (typeof plans)[0],
  options: {
    isPlanBought: boolean
    isStarsTab: boolean
    t: (key: string) => string
  },
) => {
  const { isPlanBought, isStarsTab, t } = options

  if (isPlanBought) {
    return (
      <div className='subtitle-medium bg-attention py-[2px] px-[4.5px] rounded-[58px]'>
        {t("bought")}
      </div>
    )
  }

  if (isStarsTab) {
    return (
      <div className='flex items-center gap-1'>
        {t(plan.priceStarsKey)} <IconStar />
      </div>
    )
  }

  return t(plan.priceKey)
}

const getSubscriptionInfo = (
  activeSubscription: ActiveSubscription | null,
): SubscriptionInfo | null => {
  if (!activeSubscription?.data) return null

  const now = dayjs()
  const endDate = activeSubscription.endDate
  const diffInDays = endDate.startOf("day").diff(now.startOf("day"), "day")
  const endsToday = endDate.isSame(now, "day")

  const isFreeOneDayTelegram =
    activeSubscription.type === "telegram" &&
    (activeSubscription.data as ITelegramSubscription).plan === "one_day"

  return {
    type: activeSubscription.type,
    isFreeOneDayTelegram,
    diffInDays,
    endsToday,
    endDate,
    plan:
      activeSubscription.type === "telegram"
        ? (activeSubscription.data as ITelegramSubscription).plan
        : null,
  }
}

const getSubscriptionNote = (
  subscriptionInfo: SubscriptionInfo | null,
  hasStripeEndsAt: boolean,
  t: (key: string, options?: { count: number }) => string,
): string | undefined => {
  if (!subscriptionInfo) return undefined

  const { isFreeOneDayTelegram, endsToday, diffInDays, type } = subscriptionInfo

  if (isFreeOneDayTelegram) {
    return endsToday
      ? t("premium.subscriptionEndsToday")
      : t("premium.freeSubscriptionEnds", { count: diffInDays })
  }

  if (type === "stripe" && !hasStripeEndsAt) {
    return t("premium.youAreSubscribed")
  }

  return endsToday
    ? t("premium.subscriptionEndsToday")
    : t("premium.subscriptionEndsIn", { count: diffInDays })
}

const calculateBottomPadding = (options: {
  hasSubscriptionInfo: boolean
  shouldShowBuyButton: boolean
  shouldShowUnsubscribeButton: boolean
  isTrialUsed: boolean
}): React.CSSProperties => {
  const { hasSubscriptionInfo, shouldShowBuyButton, shouldShowUnsubscribeButton, isTrialUsed } =
    options

  const hasTwoButtons = shouldShowBuyButton && !isTrialUsed
  const hasNoButtons = !shouldShowBuyButton && !shouldShowUnsubscribeButton

  let paddingValue

  if (hasNoButtons && hasSubscriptionInfo) {
    paddingValue = 100
  } else if (hasTwoButtons) {
    paddingValue = hasSubscriptionInfo ? 190 : 176
  } else {
    paddingValue = hasSubscriptionInfo ? 146 : 116
  }

  return {
    paddingBottom: `calc(${paddingValue}px + var(--tg-viewport-safe-area-inset-bottom, 0px))`,
  }
}

const PremiumPageBase = ({ t }: WithTranslation) => {
  const { data: user } = useUser()
  const { showPaymentModal } = usePaymentModal()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { triggerImpact } = useHapticFeedback()

  const initial = searchParams.get("initial")
  const { data: subscription } = useCurrentSubscription()

  const [selectedPlan, setSelectedPlan] = useState<Range>(plans[1]?.range || plans[0]?.range)
  const [currentTab, setCurrentTab] = useState(tabs[0].value)

  const activeSubscription = useMemo(() => getActiveSubscription(subscription), [subscription])

  const currentPlan = useMemo(() => getCurrentPlan(activeSubscription), [activeSubscription])

  const hasNonTrialSubscription = currentPlan !== null && currentPlan !== "one_day"

  const subscriptionInfo = useMemo(
    () => getSubscriptionInfo(activeSubscription),
    [activeSubscription],
  )

  const shouldShowBuyButton = !subscriptionInfo || subscriptionInfo.isFreeOneDayTelegram
  const shouldShowUnsubscribeButton =
    subscriptionInfo?.type === "stripe" &&
    !subscriptionInfo.isFreeOneDayTelegram &&
    !subscription?.stripe?.ends_at

  const mutationCallbacks = {
    onSuccess: () => {
      showPaymentModal("success")
      void queryClient.invalidateQueries()
    },
    onError: () => {
      showPaymentModal("error")
    },
  }

  const trialMutation = useTrialSubscription(mutationCallbacks)
  const subscribeMutation = useSubscription(selectedPlan)
  const starsSubscribeMutation = useStarsSubscription(selectedPlan, mutationCallbacks)
  const cancelSubscriptionMutation = useCancelSubscription({
    onSuccess: () => showPaymentModal("success"),
    onError: () => showPaymentModal("error"),
  })

  const isLoading =
    subscribeMutation.isPending ||
    starsSubscribeMutation.isPending ||
    cancelSubscriptionMutation.isPending

  useEffect(() => {
    if (currentPlan && currentPlan !== "one_day") {
      setSelectedPlan(currentPlan as Range)
    }
  }, [currentPlan])

  useEffect(() => {
    if (activeSubscription) {
      setCurrentTab(activeSubscription.type === "telegram" ? "stars" : "card")
    }
  }, [activeSubscription])

  const translatedPlans = useMemo(() => {
    const isStarsTab = currentTab === "stars"

    return plans.map((plan) => {
      const isPlanBought =
        plan.range === currentPlan &&
        hasNonTrialSubscription &&
        isSubscriptionMatchingTab(activeSubscription?.type, currentTab)

      return {
        id: plan.range,
        title: t(plan.titleKey),
        subtitle: t(plan.subtitleKey),
        price: getPlanPrice(plan, { isPlanBought, isStarsTab, t }),
        note: !hasNonTrialSubscription && plan.note ? t(plan.note) : undefined,
      }
    })
  }, [t, currentTab, currentPlan, hasNonTrialSubscription, activeSubscription])

  const translatedTabs = useMemo(
    () => tabs.map((tab) => ({ label: t(tab.labelKey), value: tab.value })),
    [t],
  )

  const selectedPlanPrice = useMemo(() => {
    const plan = plans.find((p) => p.range === selectedPlan)
    if (!plan) return ""

    if (currentTab === "stars") {
      return (
        <div className='flex items-center gap-1 button-main'>
          {t(plan.priceStarsKey)} <IconStar />
        </div>
      )
    }

    return t(plan.priceKey)
  }, [selectedPlan, currentTab, t])

  const bottomPadding = calculateBottomPadding({
    hasSubscriptionInfo: !!subscriptionInfo,
    shouldShowBuyButton,
    shouldShowUnsubscribeButton,
    isTrialUsed: !!user?.is_trial_used,
  })
  console.log(bottomPadding, "bottomPadding")

  const handleSubscribe = () => {
    triggerImpact("heavy")
    if (currentTab === "stars") {
      starsSubscribeMutation.mutate()
    } else {
      subscribeMutation.mutate()
    }
  }

  const handleContinue = () => {
    triggerImpact("light")
    void navigate("/feed")
  }

  const handleTrial = () => {
    triggerImpact("light")
    trialMutation.mutate()
  }

  const handlePlanChange = (planId: string) => {
    triggerImpact("light")
    setSelectedPlan(planId as Range)
  }

  const handleUnsubscribe = () => {
    triggerImpact("heavy")
    if (currentPlan) {
      cancelSubscriptionMutation.mutate(currentPlan)
    }
  }

  return (
    <PageLayout>
      <div
        className={classNames(
          "bg-[radial-gradient(70.21%_46.13%_at_50.13%_46.13%,rgba(255,61,108,0.25)_0.01%,rgba(255,61,108,0)_97.12%)]",
          "h-[410px] w-full fixed top-[130px] left-0 right-0 pointer-events-none",
        )}
      />
      <div
        className='h-full flex flex-col justify-between gap-8 overflow-y-auto'
        style={bottomPadding}
      >
        <img src={TextPlusDate} alt='plus-date-premium' className='mx-auto block mt-8' />
        <div className='flex-1 flex flex-col justify-center'>
          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000 }}
            loop={true}
            className={classNames("h-[207px] !pt-3 max-w-full", styles["custom-swiper"])}
          >
            {sliderItems.map((item, index) => (
              <SwiperSlide key={index}>
                <div className='relative h-full overflow-hidden'>
                  {item.animationData && (
                    <div className='mx-auto h-20 w-20 flex items-center justify-center mb-2'>
                      <LottieComponent
                        animationData={item.animationData}
                        height={80}
                        width={80}
                        style={item.style}
                      />
                    </div>
                  )}
                  {item.icon && <img src={item.icon} alt='icon' className='mx-auto block mb-2' />}
                  <h1 className='title1-bold text-center mb-1'>{t(item.titleKey)}</h1>
                  <p className='caption1-medium text-center opacity-50'>{t(item.subtitleKey)}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div>
          <Tabs
            options={translatedTabs}
            value={currentTab}
            onChange={setCurrentTab}
            className='mb-2'
            disabled={!shouldShowBuyButton}
          />
          <RadioButtonGroup
            options={translatedPlans}
            value={selectedPlan}
            onChange={handlePlanChange}
            name='premium-plan'
            disabled={hasNonTrialSubscription}
          />
        </div>

        <BottomButtonGroup
          note={getSubscriptionNote(subscriptionInfo, !!subscription?.stripe?.ends_at, t)}
          primaryButton={
            shouldShowBuyButton
              ? {
                  onClick: handleSubscribe,
                  type: "button",
                  children: (
                    <div className='flex items-center gap-1 button-main'>
                      {t("premium.purchaseFor")} {selectedPlanPrice}
                    </div>
                  ),
                  disabled: isLoading,
                }
              : undefined
          }
          secondaryButton={
            shouldShowUnsubscribeButton
              ? {
                  onClick: handleUnsubscribe,
                  children: <span className='button-main'>{t("premium.unsubscribe")}</span>,
                  disabled: isLoading,
                }
              : shouldShowBuyButton && !user?.is_trial_used
                ? {
                    onClick: initial ? handleContinue : handleTrial,
                    children: (
                      <span className='button-main'>
                        {initial ? t("continue") : t("premium.startFreeTrial")}
                      </span>
                    ),
                    disabled: isLoading,
                  }
                : undefined
          }
          className='absolute bottom-0 left-0 right-0 pb-safe-area-bottom'
        />
      </div>
    </PageLayout>
  )
}

export const PremiumPage = withTranslation()(PremiumPageBase)
