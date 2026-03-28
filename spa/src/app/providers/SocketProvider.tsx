import React, { useCallback, useRef, useEffect } from "react"
import Pusher from "pusher-js"
import { configureEcho, useEchoPublic } from "@laravel/echo-react"
import Cookies from "js-cookie"
import { useExternalUser, useUser, useUserStats } from "@/entities/user/api/queries.ts"
import { useToast } from "@/shared/lib/useToast.ts"
import type { MatchCreatedEventData } from "@/shared/types/socket-events"
import { useLocation, useNavigate } from "react-router-dom"
import { env } from "@/shared/config/env"
import { useMessageEvent } from "@/shared/sockets"
import { useChats } from "@/entities/chats"
import { useLikes } from "@/entities/likes"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import type { ISocketMessage } from "@/entities/chats/model/types.ts"

;(Pusher as any).logToConsole = true

interface Props {
  children: React.ReactNode
}

configureEcho({
  broadcaster: "reverb",
  key: "plusdate",
  wsPort: env.socket.port,
  wsHost: env.socket.host,
  forceTLS: env.socket.port === 443,
  enabledTransports: ["ws"],
  authEndpoint: env.socket.authUrl,
  auth: {
    headers: {
      Authorization: `Bearer ${Cookies.get("auth_token")}`,
    },
  },
})

export function SocketProvider({ children }: Props) {
  const { data: user } = useUser()

  if (!user?.id) {
    return <>{children}</>
  }

  return <SocketSubscriptions userId={user.id}>{children}</SocketSubscriptions>
}

function SocketSubscriptions({ userId, children }: { userId: number; children: React.ReactNode }) {
  const { data: user, refetch } = useUser()
  const { refetch: meRefetch } = useExternalUser(userId)
  const { refetch: refetchChats } = useChats(true)
  const { refetch: refetchLikes } = useLikes(false, !!user?.feed_profile)
  const { refetch: refetchStats } = useUserStats(!!user?.feed_profile)
  const location = useLocation()
  const locationRef = useRef(location)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { triggerNotification, triggerImpact } = useHapticFeedback()

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEchoPublic(`user.${userId}`, ".moderation.status.updated", async () => {
    await refetch()
    await meRefetch()
    triggerNotification("success")
  })

  useEchoPublic(`user.${userId}`, ".photo.moderation.result", async () => {
    await refetch()
  })

  useEchoPublic(`user.${userId}`, ".user.match", (data: MatchCreatedEventData) => {
    triggerNotification("success")
    void refetchStats()
    showToast({
      text: "newMatch",
      imageUrl: data.photo_url,
      onClick: () => {
        void navigate(`/chat/${data.chat_id}?userId=${data.user_id}`)
      },
    })
  })

  useEchoPublic(`user.${userId}`, ".message.received", async (data: ISocketMessage) => {
    if (locationRef.current.pathname !== `/chat/${data.chat_id}`) {
      triggerImpact()
      showToast({
        text: data.name,
        imageUrl: data.photo_url,
        note: data.message,
        onClick: () => {
          void navigate(`/chat/${data.chat_id}?userId=${data.sender_id}`)
        },
      })
    }
    await refetchStats()
  })

  useEchoPublic(`user.${userId}`, ".user.received_like", () => {
    triggerNotification("success")
    void refetchStats()
    void refetchLikes()
    if (locationRef.current.pathname !== "/likes") {
      showToast({
        text: "newLike",
        onClick: () => {
          void navigate(`/likes`)
        },
      })
    }
  })

  useEchoPublic(`user.${userId}`, ".chat.created", () => {
    void refetchChats()
    void refetchStats()
  })

  useMessageEvent(
    userId,
    useCallback(() => {
      void refetchChats()
    }, [refetchChats]),
  )

  return <>{children}</>
}
