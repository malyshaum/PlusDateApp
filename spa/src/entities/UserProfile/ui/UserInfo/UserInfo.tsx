import classNames from "classnames"
import { type ReactNode } from "react"
import { PremiumIconAnimation } from "@/widgets"

interface UserInfoProps {
  name: string
  age: number
  is_premium: boolean
  onToggleExpand?: () => void
  expandButton?: ReactNode
  className?: string
}

export const UserInfo = ({
  name,
  age,
  is_premium,
  onToggleExpand,
  expandButton,
  className,
}: UserInfoProps) => {
  return (
    <div className={classNames("flex items-start justify-between gap-2", className)}>
      <h3 className='title1-regular flex flex-wrap items-center gap-1 flex-1 min-w-0'>
        <span className='truncate flex-shrink min-w-0 max-w-full'>{name}</span>
        {age && <span className='flex-shrink-0 whitespace-nowrap'>, {age}</span>}
        {is_premium && <PremiumIconAnimation className='flex-shrink-0 ml-[2px] mb-[2px]' />}
      </h3>
      {expandButton && (
        <button
          onClick={onToggleExpand}
          className='flex items-center button-main text-accent flex-shrink-0 mt-1'
        >
          {expandButton}
        </button>
      )}
    </div>
  )
}
