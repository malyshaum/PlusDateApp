import { useEchoPublic } from "@laravel/echo-react"

interface MessageReadEvent {
  message_id: number
  chat_id: number
}

export const useMessageReadEvent = (
  currentUserId?: number,
  callback?: (data: MessageReadEvent) => void,
) => {
  useEchoPublic(`user.${currentUserId}`, ".message.read", (data: MessageReadEvent) => {
    if (!currentUserId || !callback) return
    return callback(data)
  })
}