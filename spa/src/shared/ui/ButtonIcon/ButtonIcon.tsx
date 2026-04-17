import classNames from "classnames"
import type { CSSProperties } from "react"

interface Props {
  path: string
  className?: string
  onClick?: () => void
  style?: CSSProperties
}

export const ButtonIcon = ({ path, onClick, className, style }: Props) => {
  return (
    <button className={classNames("w-fit", className)} onClick={onClick} style={style}>
      <img src={path} alt='icon-button' />
    </button>
  )
}
