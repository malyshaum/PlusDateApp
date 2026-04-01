import { ButtonIcon } from "@/shared/ui"
import IconRevertButton from "@/shared/assets/icons/icon-revert-button.svg"
import type { CSSProperties } from "react"

interface Props {
  canRevert: boolean
  onClick?: () => void
  style?: CSSProperties
}

export const RevertDislike = ({ canRevert, onClick, style }: Props) => {
  if (!canRevert) return null
  return (
    <ButtonIcon
      path={IconRevertButton}
      onClick={onClick}
      className='absolute top left-3 top-3 z-4'
      style={style}
    />
  )
}
