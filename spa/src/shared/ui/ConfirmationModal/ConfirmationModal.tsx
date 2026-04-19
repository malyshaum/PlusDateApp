import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { Button } from "@/shared/ui"

interface Props {
  isOpen: boolean
  icon?: ReactNode
  title: string
  description?: string
  primaryButton: {
    children: ReactNode
    onClick: () => void
    disabled?: boolean
    isLoading?: boolean
  }
  secondaryButton: {
    children: ReactNode
    onClick: () => void
    disabled?: boolean
  }
  onOutsideClick?: () => void
}

export const ConfirmationModal = ({
  isOpen,
  icon,
  title,
  description,
  primaryButton,
  secondaryButton,
  onOutsideClick,
}: Props) => {
  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <motion.div
          key='confirmation-modal'
          initial={{ bottom: "-105%", left: 0, right: 0, top: 0 }}
          animate={{
            bottom: 0,
            backgroundColor: "var(--color-dark-35)",
          }}
          exit={{
            bottom: "-105%",
            backgroundColor: "transparent",
          }}
          className='fixed flex items-end z-999'
          onClick={onOutsideClick}
        >
          <div
            className='bg-grey-10 rounded-tr-[32px] rounded-tl-[32px] py-8 px-4 text-center w-full'
            onClick={(e) => e.stopPropagation()}
          >
            {icon && <div className='mb-6 mx-auto w-fit'>{icon}</div>}
            <h6 className='title1-bold mb-2'>{title}</h6>
            {description && <p className='body-regular mb-6'>{description}</p>}
            <div className='flex flex-col gap-3'>
              <Button
                size='L'
                onClick={primaryButton.onClick}
                disabled={primaryButton.disabled}
                isLoading={primaryButton.isLoading}
                className='button-main'
              >
                {primaryButton.children}
              </Button>
              <Button
                size='L'
                appearance='white'
                onClick={secondaryButton.onClick}
                disabled={secondaryButton.disabled}
              >
                {secondaryButton.children}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
