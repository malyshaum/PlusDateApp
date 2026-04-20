import Lottie from "lottie-react"
import type { CSSProperties } from "react"

interface Props {
  animationData: unknown
  height?: number
  width?: number
  className?: string
  style?: CSSProperties
}

export const LottieComponent = ({ animationData, height, width, className, style }: Props) => {
  return (
    <Lottie
      animationData={animationData}
      className={className}
      style={{ height, width, ...style }}
    />
  )
}
