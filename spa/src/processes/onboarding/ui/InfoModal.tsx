import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/shared/ui"
import { useTranslation } from "react-i18next"
import { useOnboardingStore } from "@/processes/onboarding/store/onboardingStore.ts"

export const InfoModal = () => {
  const { t } = useTranslation()
  const { infoChecked, setInfoChecked } = useOnboardingStore()

  if (!infoChecked) return null

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
        onClick={() => setInfoChecked(false)}
      >
        <div className='bg-grey-10 rounded-tr-[32px] rounded-tl-[32px] py-8 px-4  text-center w-full'>
          <h3 className='title1-bold'>{t("betaInfoTitle")}</h3>
          <p className='body-regular mt-2'>{t("betaInfoDescription")}</p>
          <Button type='button' size='L' className='mt-8' onClick={() => setInfoChecked(false)}>
            {t("ok")}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
