import type { ReactNode } from "react"
import classNames from "classnames"
import "../styles/index.css"

interface Props {
  children: ReactNode
  appearance?: "accent" | "white"
  type?: "button" | "submit"
  size?: "L" | "S"
  className?: string
  disabled?: boolean
  onClick?: () => void
  isLoading?: boolean
}

export const Button = ({
  children,
  type = "button",
  size = "S",
  appearance = "accent",
  className,
  disabled,
  onClick,
  isLoading,
}: Props) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={classNames(
        "button-main rounded-[58px] flex items-center justify-center gap-[10px]",
        {
          "py-[10px] px-[28px]": size === "S",
          "py-[17.5px] w-full h-[52px]": size === "L",
          "bg-accent-gradient": appearance === "accent" && !disabled,
          "bg-[#1B1A1A]": appearance === "white" && !disabled,
          "bg-accent-50": appearance === "accent" && disabled,
          "bg-[#1B1A1A]/50": appearance === "white" && disabled,
        },
        className,
      )}
      disabled={disabled}
    >
      {isLoading ? <div className='loader'></div> : children}
    </button>
  )
}
