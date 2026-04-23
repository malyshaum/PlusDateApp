import { AnimatePresence, motion } from "framer-motion"
import { withTranslation, type WithTranslation } from "react-i18next"
import { Button } from "@/shared/ui"
import { useNavigate } from "react-router-dom"
import TextPlusDate from "@/pages/premium/assets/plus-date.svg"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

interface Props extends WithTranslation {
  isOpen: boolean
  onOutsideClick: () => void
}

const PaymentSuccessBase = ({ t, isOpen, onOutsideClick }: Props) => {
  const navigate = useNavigate()
  const { triggerImpact } = useHapticFeedback()

  const handleNavigate = () => {
    onOutsideClick()
    triggerImpact()
    void navigate("/feed")
  }

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <motion.div
          key='payment-success'
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
            className='bg-grey-10 rounded-tr-[32px] rounded-tl-[32px] py-8 px-4 text-center w-full'
            onClick={(e) => e.stopPropagation()}
          >
            <img src={TextPlusDate} alt='plus-date-premium' className='mx-auto block mb-5' />
            <p className='body-regular mb-6'>{t("premium.payment.success.description")}</p>
            <Button size='L' onClick={handleNavigate} className='button-main'>
              {t("premium.payment.success.button")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const PaymentSuccess = withTranslation()(PaymentSuccessBase)
