import { memo, type ReactNode } from "react"
import { motion } from "framer-motion"
import { withTranslation, type WithTranslation } from "react-i18next"
import classNames from "classnames"

interface Props extends WithTranslation {
  inactiveIcon: ReactNode
  activeIcon: ReactNode
  label: string
  isActive: boolean
  count?: number
}

const transformCount = (count: number) => {
  if (count > 9) {
    return "9+"
  }
  return count
}

export const NavTabBase = memo(({ inactiveIcon, activeIcon, isActive, count, t, label }: Props) => {
  return (
    <div className='relative flex items-center justify-center flex-col pb-[6px]'>
      {!!count && count > 0 && !isActive && (
        <div className='absolute subtitle-medium w-5 h-[18px] rounded-[24px] bg-attention flex items-center justify-center top-[-1px] right-[-8px]'>
          {transformCount(count)}
        </div>
      )}
      {isActive ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {activeIcon}
        </motion.div>
      ) : (
        inactiveIcon
      )}
      <span className={classNames("small-homa", isActive ? "text-white-100" : "text-white-50")}>
        {t(label)}
      </span>
    </div>
  )
})

export const NavTab = withTranslation()(NavTabBase)
