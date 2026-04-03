import { useExternalUser } from "@/entities/user/api/queries.ts"
import { useNavigate, useSearchParams } from "react-router-dom"
import classNames from "classnames"

export const UserCard = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = searchParams.get("userId")
  const { data: user } = useExternalUser(userId ? parseInt(userId) : undefined)
  const photo = user?.files?.find((file) => file.type === "image" && file.is_main)?.url || ""

  const onClick = () => {
    void navigate(`/user/${user?.id}?showRemoveMatch=true`)
  }

  if (!user) return null

  return (
    <button
      className={classNames(
        "fixed w-fit max-w-[70%] top-4 left-1/2 -translate-x-1/2 z-50",
        "rounded-[24px] p-1 pr-3 flex items-center gap-2",
        "liquid-glass overflow-hidden",
      )}
      onClick={onClick}
    >
      <img src={photo} alt={`${user.name} image`} className='w-12 h-12 object-cover rounded-full' />
      <span className='body-bold flex-1 truncate z-20'>{user.name}</span>
    </button>
  )
}
