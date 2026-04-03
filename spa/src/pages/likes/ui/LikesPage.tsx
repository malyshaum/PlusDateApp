import { useInView } from "react-intersection-observer"
import { useEffect, useMemo } from "react"

import { PageLayout } from "@/widgets"
import { useLikes } from "@/entities/likes/api/queries"
import { LikeCard } from "@/entities/likes/ui/LikeCard"
import { withTranslation, type WithTranslation } from "react-i18next"
import { useUser, useUserStats } from "@/entities/user/api/queries.ts"
import IconCrownWhite from "@/shared/assets/icons/icon-crown-white.svg?react"
import IconChevronRight from "@/shared/assets/icons/icon-chevron-right.svg?react"
import { ButtonLink } from "@/shared/ui"
import classNames from "classnames"

const LikesPageBase = ({ t }: WithTranslation) => {
  const { data: user } = useUser()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useLikes(false)
  const { data: stats } = useUserStats(!!user?.feed_profile)

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allLikes = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? []
  }, [data])

  return (
    <PageLayout shadow={{ bottom: true, top: false }} className='pb-safe-area-bottom-with-menu'>
      <h1 className='title3-bold text-white mb-6'>
        {t("likes.title")} ({stats?.unresolved_likes})
      </h1>

      {stats?.unresolved_likes === 0 && !isLoading ? (
        <div className='flex items-center justify-center h-full'>
          <span className='title1-bold text-white-20'>{t("likes.empty")}</span>
        </div>
      ) : (
        <div
          className={classNames("flex flex-wrap gap-[10px]", {
            "pb-[76px]": !user?.is_premium,
          })}
        >
          {allLikes.map((like) => (
            <LikeCard key={like.id} user={like.user} action={like.action} />
          ))}

          {hasNextPage && (
            <div ref={ref} className='w-full py-4 flex justify-center'>
              {isFetchingNextPage && <div className='text-white'>{t("likes.loading")}</div>}
            </div>
          )}
        </div>
      )}

      {!user?.is_premium && (
        <ButtonLink
          to='/premium'
          variant='accent'
          icon={<IconCrownWhite />}
          rightElement={<IconChevronRight />}
          className='!absolute w-[calc(100%-32px)] z-1'
          style={{
            bottom:
              "calc(var(--tg-viewport-safe-area-inset-bottom, 20px) + 72px + var(--safe-padding))",
          }}
        >
          <span className='block body-bold'>{t("premium.getPremium")}</span>
          <span className='block subtitle-medium mt-1'>{t("premium.discount30")}</span>
        </ButtonLink>
      )}
    </PageLayout>
  )
}

export const LikesPage = withTranslation()(LikesPageBase)
