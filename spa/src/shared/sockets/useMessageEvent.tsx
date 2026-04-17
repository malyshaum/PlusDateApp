import { useEchoPublic } from "@laravel/echo-react"
import type { IMessage } from "@/entities/chats"

export const useMessageEvent = (
  currentUserId?: number,
  callback?: (data: IMessage) => void,
) => {
  useEchoPublic(`user.${currentUserId}`, ".message.received", (data: IMessage) => {
    if (!currentUserId || !callback) return
    return callback(data)
  })
}
