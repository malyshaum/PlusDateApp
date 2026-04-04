import IconConfidential from "@/shared/assets/icons/premium/icon-confidential.svg"
import IconFilters from "@/shared/assets/icons/premium/icon-filters.svg"
import IconInstagram from "@/shared/assets/icons/premium/icon-instagram.svg"
import IconCards from "@/shared/assets/icons/premium/icon-cards.svg"
import type { Range } from "@/pages/premium/model/types.ts"
import HeartAnimation from "@/../public/animations/PD_em2.json"
import superlikeAnimationIcon from "@/../public/animations/PD_em3.json"
import premiumAnimation from "@/../public/animations/PD_em8.json"
import VideoAnimation from "@/../public/animations/PD_em6.json"
import revertAnimationIcon from "@/../public/animations/PD_em5.json"

interface Plan {
  range: Range
  titleKey: string
  subtitleKey: string
  priceKey: string
  priceStarsKey: string
  note?: string
}

export const plans: Plan[] = [
  {
    range: "week",
    titleKey: "premium.plans.1week.title",
    subtitleKey: "premium.plans.1week.subtitle",
    priceKey: "premium.plans.1week.price",
    priceStarsKey: "premium.plans.1week.priceStars",
  },
  {
    range: "month",
    titleKey: "premium.plans.month.title",
    subtitleKey: "premium.plans.month.subtitle",
    priceKey: "premium.plans.month.price",
    priceStarsKey: "premium.plans.month.priceStars",
    note: "popular",
  },
  {
    range: "three_month",
    titleKey: "premium.plans.3month.title",
    subtitleKey: "premium.plans.3month.subtitle",
    priceKey: "premium.plans.3month.price",
    priceStarsKey: "premium.plans.3month.priceStars",
  },
]

export const sliderItems = [
  {
    animationData: HeartAnimation,
    titleKey: "premium.features.whoLikedYou.title",
    subtitleKey: "premium.features.whoLikedYou.subtitle",
  },
  {
    animationData: premiumAnimation,
    titleKey: "premium.features.vip.title",
    subtitleKey: "premium.features.vip.subtitle",
    style: { filter: "brightness(0) invert(1)" },
  },
  {
    icon: IconCards,
    titleKey: "premium.features.swipes.title",
    subtitleKey: "premium.features.swipes.subtitle",
  },
  {
    animationData: superlikeAnimationIcon,
    titleKey: "premium.features.moreAttention.title",
    subtitleKey: "premium.features.moreAttention.subtitle",
  },
  {
    animationData: VideoAnimation,
    titleKey: "premium.features.video.title",
    subtitleKey: "premium.features.video.subtitle",
  },
  {
    animationData: revertAnimationIcon,
    titleKey: "premium.features.revert.title",
    subtitleKey: "premium.features.revert.subtitle",
    style: { filter: "brightness(0) invert(1)" },
  },
  {
    icon: IconFilters,
    titleKey: "premium.features.advancedFilters.title",
    subtitleKey: "premium.features.advancedFilters.subtitle",
  },
  {
    icon: IconInstagram,
    titleKey: "premium.features.instagramProfile.title",
    subtitleKey: "premium.features.instagramProfile.subtitle",
  },
  {
    icon: IconConfidential,
    titleKey: "premium.features.privacy.title",
    subtitleKey: "premium.features.privacy.subtitle",
  },
]

export const tabs = [
  { labelKey: "premium.tabs.stars", value: "stars" },
  { labelKey: "premium.tabs.card", value: "card" },
]
