import { useCallback, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import classNames from "classnames"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { FeedSlide, type FeedSlideType } from "../FeedSlide"
import type { IUser, IUserFile } from "@/entities/user/model/types"
import styles from "@/shared/ui/MediaCarousel/index.module.css"
import { renderVideoBullet } from "@/shared/lib/renderVideoBullet"
import { useLongPress } from "@uidotdev/usehooks"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback"
import { useSwipeFeedStore } from "@/features/SwipeCards"

interface FeedCardProps {
  user: IUser
  onSlideChange?: (index: number) => void
  onPrevious?: () => void
  onNext?: () => void
  enablePagination?: boolean
  className?: string
}

const getSlides = (user: IUser) => {
  const photos = user.files
    .filter((file) => file.type === "image")
    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
  const videos = user.files.filter((file) => file.type === "video")
  const slideData: Array<{ type: FeedSlideType; media: IUserFile }> = []

  if (photos.length > 0) {
    slideData.push({ type: "photo-basic", media: photos[0] })
  }
  if (photos.length > 1) {
    slideData.push({ type: "photo-badges", media: photos[1] })
  }
  if (photos.length > 2) {
    slideData.push({ type: "photo-description", media: photos[2] })
  }

  if (videos.length > 0) {
    slideData.push({ type: "video", media: videos[0] })
  }

  return slideData
}

export const FeedCard = ({
  user,
  onSlideChange,
  onPrevious,
  onNext,
  enablePagination = true,
  className,
}: FeedCardProps) => {
  const swiperRef = useRef<SwiperType | null>(null)
  const { triggerImpact } = useHapticFeedback()
  const { setCardPressed } = useSwipeFeedStore()
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const longPressAttrs = useLongPress(
    () => {
      setCardPressed(true)
      triggerImpact()
    },
    {
      threshold: 400,
      onStart: (event) => event.preventDefault(),
      onFinish: () => setCardPressed(false),
      onCancel: () => setCardPressed(false),
    },
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const slides = getSlides(user)

  const renderBullet = useCallback(
    (index: number, className: string) => {
      const isVideo = slides[index]?.type === "video"
      return renderVideoBullet(className, isVideo)
    },
    [slides],
  )

  const scrollPrev = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev()
    }
    onPrevious?.()
  }, [onPrevious])

  const scrollNext = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext()
    }
    onNext?.()
  }, [onNext])

  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const newIndex = swiper.activeIndex
      setCurrentSlide(newIndex)
      onSlideChange?.(newIndex)
    },
    [onSlideChange],
  )

  return (
    <div
      className={classNames("relative rounded-[24px] overflow-hidden h-full", className)}
      onContextMenu={handleContextMenu}
      {...longPressAttrs}
    >
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        onSlideChange={handleSlideChange}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        pagination={{
          clickable: true,
          enabled: enablePagination,
          renderBullet,
        }}
        allowTouchMove={false}
        className={classNames("w-full h-full", styles["custom-swiper"])}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <FeedSlide
              type={slide.type}
              media={slide.media}
              user={user}
              userName={user.name}
              isVideoPlaying={slide.type === "video" && currentSlide === index}
              className='bg-grey-10 rounded-[24px] border-1 border-white-20'
            />

            <div
              className='absolute h-full w-[25%] top-0 left-0 bottom-0 bg-transparent z-10 cursor-pointer'
              onClick={scrollPrev}
            />
            <div
              className='absolute h-full w-[25%] top-0 right-0 bottom-0 bg-transparent z-10 cursor-pointer'
              onClick={scrollNext}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
