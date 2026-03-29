import type { IUser } from "@/entities/user/model/types.ts"
import classNames from "classnames"
import { memo } from "react"
import { type WithTranslation, withTranslation } from "react-i18next"

interface Props extends WithTranslation {
  user?: IUser
  user_name?: string
  url?: string
  onClick?: () => void
  blurred?: boolean
  className?: string
  children?: React.ReactNode
}

export const MatchCardBase = ({
  user,
  onClick,
  blurred,
  className,
  t,
  children,
  url,
  user_name,
}: Props) => {
  const imageUrl = url || user?.files[0]?.url

  return (
    <div className='flex flex-col items-center cursor-pointer flex-shrink-0' onClick={onClick}>
      <div
        className={classNames(
          "relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center",
          className,
        )}
      >
        <div
          className={classNames({
            "w-[calc(100%-4px)] h-[calc(100%-4px)] overflow-hidden rounded-full": blurred,
            "w-full h-full": !blurred,
          })}
        >
          <img
            src={imageUrl}
            alt={user_name || user?.name}
            className={classNames("w-full h-full object-cover", {
              "blur-sm": blurred,
            })}
          />
          {children}
        </div>

        {user?.is_online && (
          <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black' />
        )}
      </div>
      <div className='mt-1 text-center w-16'>
        <span className='subtitle-medium text-white truncate block !capitalize'>
          {blurred ? t("likes.title") : user_name || user?.name}
        </span>
      </div>
    </div>
  )
}

export const MatchCard = memo(withTranslation()(MatchCardBase))
