import { useInView } from "react-intersection-observer"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"

import { PageLayout } from "@/widgets"
import { useChats, useRecentChats } from "@/entities/chats/api/queries"
import { MatchCard } from "@/entities/chats/ui/MatchCard"
import { ChatCard } from "@/entities/chats/ui/ChatCard"
import { withTranslation, type WithTranslation } from "react-i18next"
import { useLikes } from "@/entities/likes"
import IconHeart from "@/shared/assets/icons/icon-heart.svg"
import { useUser, useUserStats } from "@/entities/user/api/queries.ts"

const ChatsBase = ({ t }: WithTranslation) => {
  const { data: user } = useUser()
  const matchesScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { data: stats } = useUserStats(!!user?.feed_profile)

  const { data: likesData } = useLikes()
  const {
    data: recentChatsData,
    fetchNextPage: fetchNextRecentChats,
    hasNextPage: hasNextRecentChats,
    isFetchingNextPage: isFetchingNextRecentChats,
    isLoading: isLoadingRecentChats,
  } = useRecentChats()

  const {
    data: chatsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingChats,
  } = useChats()

  const { ref: chatsRef, inView: chatsInView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  })

  const { ref: matchesRef, inView: matchesInView } = useInView({
    threshold: 0,
    rootMargin: "50px",
  })

  useEffect(() => {
    if (chatsInView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [chatsInView, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (matchesInView && hasNextRecentChats && !isFetchingNextRecentChats) {
      void fetchNextRecentChats()
    }
  }, [matchesInView, hasNextRecentChats, isFetchingNextRecentChats, fetchNextRecentChats])

  const lastLike = useMemo(() => {
    return likesData?.pages[0].data[0]
  }, [likesData])

  const allMatches = useMemo(() => {
    return recentChatsData?.pages.flatMap((page) => page.data) ?? []
  }, [recentChatsData])

  const allChats = useMemo(() => {
    return chatsData?.pages.flatMap((page) => page.data) ?? []
  }, [chatsData])

  const handleChatClick = useCallback(
    (chatId: number, userId: number) => {
      void navigate(`/chat/${chatId}?userId=${userId}`)
    },
    [navigate],
  )

  const navigateToLikes = useCallback(() => {
    void navigate(`/likes`)
  }, [navigate])

  if (isLoadingRecentChats || isLoadingChats) {
    return (
      <PageLayout>
        <div className='flex items-center justify-center h-full'>
          <span className='body-regular text-white-50'>{t("chats.loading")}</span>
        </div>
      </PageLayout>
    )
  }

  const hasMatches = allMatches && allMatches.length > 0
  const hasChats = allChats.length > 0

  return (
    <PageLayout shadow={{ bottom: true, top: false }} className='pb-safe-area-bottom-with-menu'>
      {hasMatches && (
        <>
          <h2 className='title3-bold mb-4'>{t("chats.newMatches")}</h2>
          <div className='flex gap-4 mb-5 overflow-x-auto items-end' ref={matchesScrollRef}>
            {lastLike?.user && (
              <div>
                <MatchCard
                  user={lastLike?.user}
                  blurred={true}
                  className='border-accent border-2 rounded-full w-[72px] h-[72px]'
                  onClick={navigateToLikes}
                >
                  <div className='flex justify-center items-center bg-accent rounded-[44px] px-[6px] py-[2px] absolute top-1/2 left-1/2 -translate-1/2 gap-[2px]'>
                    <img src={IconHeart} alt='' height={8} width={9} />
                    <span className='button-main'>{stats?.unresolved_likes}</span>
                  </div>
                </MatchCard>
              </div>
            )}
            {allMatches.map((chat) => (
              <MatchCard
                key={chat.id}
                user_name={chat.user_name}
                url={chat.url}
                onClick={() => handleChatClick(chat.id, chat.user_id)}
              />
            ))}
            {hasNextRecentChats && (
              <div ref={matchesRef} className='flex-shrink-0 w-16 flex items-center justify-center'>
                {isFetchingNextRecentChats && (
                  <div className='w-4 h-4 border-2 border-white-20 border-t-white rounded-full animate-spin' />
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!hasChats ? (
        <div className='flex-1 h-full flex flex-col items-center justify-center text-center'>
          <h3 className='title1-bold text-white-20 mb-2'>{t("chats.empty.title")}</h3>
          <p className='body-regular text-white-20'>{t("chats.empty.subtitle")}</p>
        </div>
      ) : (
        <>
          <h2 className='title3-bold mb-4'>{t("chats.chats")}</h2>
          <div className='flex flex-col gap-3'>
            {user?.id &&
              allChats.map((chat) => (
                <ChatCard key={chat.id} chat={chat} currentUserId={user.id} />
              ))}

            {hasNextPage && (
              <div ref={chatsRef} className='w-full py-4 flex justify-center'>
                {isFetchingNextPage && <div className='text-white-50'>{t("chats.loading")}</div>}
              </div>
            )}
          </div>
        </>
      )}
    </PageLayout>
  )
}

export const Chats = withTranslation()(ChatsBase)
