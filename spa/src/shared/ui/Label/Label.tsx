import { type ReactNode } from "react"
import classNames from "classnames"

interface Props {
  icon?: ReactNode
  value?: number | string | null
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export const Label = ({ icon, value, className = "", disabled, onClick }: Props) => {
  if (!value) return null

  return (
    <div
      className={classNames(
        "flex flex-wrap gap-1 items-center subtitle-medium !capitalize py-1 px-2 rounded-[40px] bg-grey-75 border border-white-10 shadow-[inset_1px_1px_2px_rgba(255,255,255,.3)]",
        { "opacity-60": disabled },
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {icon}
      <span>{value}</span>
    </div>
  )
}
