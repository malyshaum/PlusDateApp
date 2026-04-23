import { AnimatePresence, motion } from "framer-motion"
import { withTranslation, type WithTranslation } from "react-i18next"
import { Button } from "@/shared/ui"
import { useNavigate } from "react-router-dom"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

interface Props extends WithTranslation {
  isOpen: boolean
  onOutsideClick?: () => void
}

const PaymentErrorBase = ({ t, isOpen, onOutsideClick }: Props) => {
  const navigate = useNavigate()
  const { triggerImpact } = useHapticFeedback()

  const handleNavigate = () => {
    onOutsideClick?.()
    triggerImpact()
    void navigate("/premium")
  }

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <motion.div
          key='payment-error'
          initial={{ bottom: "-105%", left: 0, right: 0, top: 0 }}
          animate={{
            bottom: 0,
            backgroundColor: "var(--color-dark-35)",
          }}
          exit={{
            bottom: "-105%",
            backgroundColor: "transparent",
          }}
          className='fixed z-110 flex items-end'
          onClick={onOutsideClick}
        >
          <div
            className='bg-grey-10 rounded-tr-[32px] rounded-tl-[32px] py-8 px-4  text-center'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='text-[75px] font-extrabold leading-[100%] mb-6'>😭</div>
            <h6 className='title1-bold mb-2'>{t("premium.payment.error.title")}</h6>
            <p className='body-regular mb-6'>{t("premium.payment.error.description")}</p>
            <Button size='L' onClick={handleNavigate} className='button-main'>
              {t("premium.payment.error.button")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const PaymentError = withTranslation()(PaymentErrorBase)
