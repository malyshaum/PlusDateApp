import { AnimatePresence, motion } from "framer-motion"
import { reasonIcons } from "@/features/SwipeCards/model/constants.ts"
import { Button, LottieComponent } from "@/shared/ui"
import type { SwipeActionFailedReason } from "@/features/SwipeCards/model/types.ts"
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useTranslation } from "react-i18next"
import revertAnimationIcon from "@/../public/animations/PD_em5.json"
import superlikeAnimationIcon from "@/../public/animations/PD_em3.json"

interface Props {
  onClick: () => void
  actionFailedReason: SwipeActionFailedReason
}

export const ActionLimitModal = ({ onClick, actionFailedReason }: Props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { triggerImpact } = useHapticFeedback()

  const handleNavigateToPremium = useCallback(() => {
    triggerImpact()
    if (actionFailedReason === "superlike-limit") {
      onClick()
      return
    }
    void navigate("/premium")
  }, [actionFailedReason, navigate, onClick, triggerImpact])

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key='action-failed-modal'
        initial={{ bottom: "-105%", left: 0, right: 0, top: 0 }}
        animate={{
          bottom: 0,
          backgroundColor: "var(--color-dark-50)",
        }}
        exit={{
          bottom: "-105%",
          backgroundColor: "transparent",
        }}
        className='fixed z-9999 flex items-end'
        onClick={onClick}
      >
        <div className='bg-grey-10 rounded-tr-[32px] rounded-tl-[32px] py-8 px-4  text-center w-full'>
          {actionFailedReason === "revert-limit" && (
            <div className='mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6'>
              <LottieComponent animationData={revertAnimationIcon} height={60} width={60} />
            </div>
          )}
          {["superlike-disabled", "superlike-limit", "like-limit"].includes(actionFailedReason) && (
            <div className='mx-auto h-20 w-20 rounded-full bg-premium-gradient flex items-center justify-center mb-6'>
              <LottieComponent animationData={superlikeAnimationIcon} height={60} width={60} />
            </div>
          )}
          {!["revert-limit", "superlike-disabled", "superlike-limit", "like-limit"].includes(
            actionFailedReason,
          ) && (
            <img src={reasonIcons[actionFailedReason]} alt='icon-info' className='mx-auto mb-6' />
          )}
          <h3 className='title1-bold'>{t(`actionLimit.${actionFailedReason}.title`)}</h3>
          <p className='body-regular mt-2'>{t(`actionLimit.${actionFailedReason}.description`)}</p>
          <Button type='button' size='L' className='mt-8' onClick={handleNavigateToPremium}>
            <span>
              {actionFailedReason === "superlike-limit"
                ? t("ok")
                : t("actionLimit.getPremiumButton")}
            </span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
