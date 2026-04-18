import { NavLink } from "react-router-dom"
import classNames from "classnames"
import IconLock from "@/shared/assets/icons/icon-lock.svg?react"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

interface ButtonLinkProps {
  to: string
  icon?: React.ReactNode
  children: React.ReactNode
  rightElement?: React.ReactNode
  variant?: "default" | "accent"
  className?: string
  showIndicator?: boolean
  disabled?: boolean
  style?: React.CSSProperties
}

export const ButtonLink = ({
  to,
  icon,
  children,
  rightElement,
  variant = "default",
  className,
  showIndicator,
  disabled = false,
  style,
}: ButtonLinkProps) => {
  const { triggerImpact } = useHapticFeedback()

  const onClick = () => {
    triggerImpact()
  }

  return (
    <NavLink
      to={to}
      className={classNames(
        "relative flex gap-2 items-center px-4 py-[14px] body-bold rounded-[8px]",
        variant === "default" && "bg-white-10",
        variant === "accent" && "bg-accent-gradient",
        showIndicator && "bg-button-link-warning",
        disabled && "pointer-events-none opacity-30",
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {showIndicator && !disabled && (
        <div className='absolute right-1 top-1 bg-attention h-2 w-2 rounded-full z-1' />
      )}
      {icon && <span>{icon}</span>}
      <span>{children}</span>
      {rightElement && !disabled && <span className='ml-auto'>{rightElement}</span>}
      {disabled && <IconLock className='ml-auto' />}
    </NavLink>
  )
}
