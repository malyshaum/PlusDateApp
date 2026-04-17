import { Button } from "@/shared/ui"
import { type ReactNode } from "react"
import classNames from "classnames"

interface BottomButtonProps {
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  type?: "button" | "submit"
  className?: string
  isLoading?: boolean
}

export const BottomButton = ({
  onClick,
  disabled,
  children,
  type = "submit",
  className,
  isLoading,
}: BottomButtonProps) => {
  return (
    <div
      className={classNames(
        "w-[100vw] py-9 px-4 absolute inset-0 top-auto pb-safe-area-bottom z-10",
        className,
      )}
      style={{
        background: "linear-gradient(0deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
      }}
    >
      <Button
        type={type}
        size='L'
        appearance='accent'
        onClick={onClick}
        disabled={disabled}
        isLoading={isLoading}
      >
        {children}
      </Button>
    </div>
  )
}
