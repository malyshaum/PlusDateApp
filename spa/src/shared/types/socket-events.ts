import type { IChat } from "@/entities/chats/model/types"

export interface ChatCreatedEventData {
  chat: IChat
  timestamp: string
}

export interface MatchCreatedEventData {
  chat_id: number
  user_id: number
  photo_url: string
}

export interface SocketEvent<T> {
  event: string
  data: T
  channel: string
}
