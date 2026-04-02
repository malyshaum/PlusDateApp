import { useTranslation, withTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "react-intersection-observer"
import { PageLayout } from "@/widgets"
import { useChatMessages, useReadMessages } from "@/entities/chats/api/queries"
import { useUser } from "@/entities/user/api/queries"
import type { IMessage } from "@/entities/chats/model/types"
import { MessageItem } from "./MessageItem"
import { groupMessagesByDate, useChatSocket } from "../lib"
import classNames from "classnames"
import { debounce, throttle } from "lodash"
import { MessageForm } from "@/pages/chat/ui/MessageForm.tsx"
import { UserCard } from "@/pages/chat/ui/UserCard.tsx"
import { useEchoPublic } from "@laravel/echo-react"
import { useQueryClient } from "@tanstack/react-query"
import { ScrollButton } from "@/pages/chat/ui/ScrollButton.tsx"
import { AnimatePresence } from "framer-motion"

export const ChatBase = () => {
  const { chatId } = useParams<{ chatId: string }>()
  const { data: user } = useUser()
  const currentUserId = user?.id
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userId = searchParams.get("userId")
  const queryClient = useQueryClient()
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false)
  const isAtBottomRef = useRef(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  useEchoPublic(`user.${currentUserId}`, ".user.match_deleted", (data: { user_id: number }) => {
    if (data.user_id === Number(userId)) {
      void navigate("/chats", { replace: true })
    }
  })

  const hasInitiallyScrolledRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const lastVisibleMessageIdRef = useRef<number | null>(null)
  const lastProcessedMessageIdRef = useRef<number | null>(null)
  const initialFirstUnreadIdRef = useRef<number | null>(null)
  const scrollHeightBeforeFetchRef = useRef<number>(0)
  const previousPageCountRef = useRef<number>(0)

  const {
    data: messagesData,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    isSuccess,
  } = useChatMessages(chatId || "", currentUserId)

  const { addMessageToCache } = useChatSocket(chatId, currentUserId)

  const onSendMessageSuccess = (message: IMessage) => {
    addMessageToCache(message)

    setTimeout(() => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      }
    }, 100)
  }
  const readMessagesMutation = useReadMessages()

  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return []
    return messagesData.pages.flatMap((page) => [...page.data])
  }, [messagesData])

  const firstUnreadMessageId = useMemo(() => {
    const firstUnread = allMessages.find((m) => m.firstUnread)
    return firstUnread?.id || null
  }, [allMessages])

  const sendBatchReadMessages = useCallback(() => {
    const lastVisibleMessageId = lastVisibleMessageIdRef.current

    if (
      !lastVisibleMessageId ||
      lastVisibleMessageId === lastProcessedMessageIdRef.current ||
      !chatId
    ) {
      return
    }

    lastProcessedMessageIdRef.current = lastVisibleMessageId

    readMessagesMutation.mutate(
      {
        chat_id: parseInt(chatId),
        message_id: lastVisibleMessageId,
      },
      {
        onError: () => {
          lastProcessedMessageIdRef.current = null
          lastVisibleMessageIdRef.current = lastVisibleMessageId
        },
        onSuccess: () => {
          lastVisibleMessageIdRef.current = null
        },
      },
    )
  }, [chatId, readMessagesMutation])

  const scheduleBatchSend = useMemo(
    () => debounce(sendBatchReadMessages, 1000, { maxWait: 3000 }),
    [sendBatchReadMessages],
  )

  const handleMessageVisible = useCallback(
    (messageId: number) => {
      if (lastProcessedMessageIdRef.current && messageId <= lastProcessedMessageIdRef.current) {
        return
      }

      if (!lastVisibleMessageIdRef.current || messageId > lastVisibleMessageIdRef.current) {
        lastVisibleMessageIdRef.current = messageId
      }

      scheduleBatchSend()
    },
    [scheduleBatchSend],
  )

  const { ref: loadMoreTopRef } = useInView({
    threshold: 0,
    rootMargin: "200px",
    root: messagesContainerRef.current,
    skip: !infiniteScrollEnabled || isFetchingPreviousPage,
    onChange: (inView) => {
      if (inView && hasPreviousPage && !isFetchingPreviousPage && infiniteScrollEnabled) {
        const container = messagesContainerRef.current
        if (container) {
          scrollHeightBeforeFetchRef.current = container.scrollHeight
          previousPageCountRef.current = messagesData?.pages.length || 0
        }

        void fetchPreviousPage()
      }
    },
  })

  const { ref: loadMoreBottomRef } = useInView({
    threshold: 0,
    rootMargin: "200px",
    skip: !infiniteScrollEnabled || isFetchingNextPage,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage && infiniteScrollEnabled) {
        void fetchNextPage()
      }
    },
  })

  useEffect(() => {
    if (!isLoading && isSuccess && allMessages.length > 0 && !hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true

      if (initialFirstUnreadIdRef.current === null && firstUnreadMessageId) {
        initialFirstUnreadIdRef.current = firstUnreadMessageId
      }

      const container = messagesContainerRef.current
      if (!container) {
        setInfiniteScrollEnabled(true)
        return
      }

      setInfiniteScrollEnabled(false)

      setTimeout(() => {
        if (firstUnreadMessageId) {
          const element = document.querySelector(`[data-message-id="${firstUnreadMessageId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: "instant", block: "start" })
            container.scrollTop -= 50
          }
        } else {
          container.scrollTo({ top: container.scrollHeight, behavior: "instant" })
        }

        setTimeout(() => {
          setInfiniteScrollEnabled(true)
        }, 1500)
      }, 300)
    } else if (!isLoading && isSuccess && !hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true
      setInfiniteScrollEnabled(true)
    }
  }, [isLoading, isSuccess, allMessages.length, firstUnreadMessageId])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !messagesData?.pages) return

    const currentPageCount = messagesData.pages.length
    const hadPreviousFetch =
      previousPageCountRef.current > 0 && currentPageCount > previousPageCountRef.current

    if (hadPreviousFetch && scrollHeightBeforeFetchRef.current > 0 && infiniteScrollEnabled) {
      const scrollHeightAfter = container.scrollHeight
      const scrollDiff = scrollHeightAfter - scrollHeightBeforeFetchRef.current

      container.scrollTop = container.scrollTop + scrollDiff
      scrollHeightBeforeFetchRef.current = 0
      previousPageCountRef.current = 0
    }
  }, [messagesData?.pages, infiniteScrollEnabled])

  useEffect(() => {
    if (hasInitiallyScrolledRef.current) {
      scheduleBatchSend.flush()
    }

    hasInitiallyScrolledRef.current = false
    lastVisibleMessageIdRef.current = null
    lastProcessedMessageIdRef.current = null
    initialFirstUnreadIdRef.current = null
    setInfiniteScrollEnabled(false)

    return () => {
      void queryClient.removeQueries({ queryKey: ["chat-messages", chatId] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, queryClient])

  useEffect(() => {
    return () => {
      scheduleBatchSend.cancel()
      if (lastVisibleMessageIdRef.current !== null) {
        sendBatchReadMessages()
      }
    }
  }, [scheduleBatchSend, sendBatchReadMessages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const checkIfAtBottom = () => {
      const threshold = 100
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
      isAtBottomRef.current = isAtBottom
      setShowScrollButton(!isAtBottom)
    }

    const throttledCheck = throttle(checkIfAtBottom, 100)

    checkIfAtBottom()
    container.addEventListener("scroll", throttledCheck)

    return () => {
      container.removeEventListener("scroll", throttledCheck)
      throttledCheck.cancel()
    }
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current && allMessages.length > 0) {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      }
    }
  }, [allMessages.length])

  const messagesByDate = useMemo(() => groupMessagesByDate(allMessages), [allMessages])

  const isOwnMessage = (message: IMessage) => message.sender_id === currentUserId

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
    }
  }, [])

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollToBottom()
    }, 300)
  }, [scrollToBottom])

  return (
    <PageLayout shadow={{ top: false, bottom: true }}>
      <div className={classNames("flex flex-col h-full relative")}>
        <UserCard />
        <AnimatePresence>
          {showScrollButton && <ScrollButton onClick={scrollToBottom} />}
        </AnimatePresence>
        <div ref={messagesContainerRef} className='flex-1 overflow-y-auto'>
          <div
            className='min-h-full flex flex-col justify-end gap-6'
            style={{
              paddingBottom:
                "calc(var(--tg-viewport-safe-area-inset-bottom, 24px) + 46px + var(--safe-padding))",
            }}
          >
            {hasPreviousPage && !isLoading && !isFetchingPreviousPage && (
              <div ref={loadMoreTopRef} className='h-0 w-full overflow-hidden' />
            )}

            {Object.entries(messagesByDate).map(([date, dateMessages]) => (
              <div key={date}>
                <div className='flex justify-center mb-3'>
                  <span className='text-grey-50 subtitle-medium'>{date}</span>
                </div>

                <div className='space-y-3'>
                  {dateMessages.map((message) => {
                    const isFirstUnread = message.id === initialFirstUnreadIdRef.current

                    return (
                      <div key={message.id}>
                        {isFirstUnread && (
                          <div className='flex items-center gap-3 my-4'>
                            <div className='flex-1 h-[1px] bg-accent opacity-30' />
                            <span className='text-accent small-medium'>{t("unreadMessages")}</span>
                            <div className='flex-1 h-[1px] bg-accent opacity-30' />
                          </div>
                        )}

                        <MessageItem
                          message={message}
                          isOwnMessage={isOwnMessage(message)}
                          onMessageVisible={handleMessageVisible}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {hasNextPage && !isFetchingNextPage && (
              <div ref={loadMoreBottomRef} className='h-0 w-full overflow-hidden' />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <MessageForm
          chatId={chatId}
          onSuccess={onSendMessageSuccess}
          onInputFocus={handleInputFocus}
        />
      </div>
    </PageLayout>
  )
}

export const Chat = withTranslation()(ChatBase)
