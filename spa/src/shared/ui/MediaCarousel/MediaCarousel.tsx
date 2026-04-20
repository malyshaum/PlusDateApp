import { useCallback, useMemo, useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import classNames from "classnames"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import ReactPlayer from "react-player"
import styles from "./index.module.css"
import type { IUserFile } from "@/entities/user/model/types.ts"
import { withTranslation, type WithTranslation } from "react-i18next"
import { renderVideoBullet } from "@/shared/lib/renderVideoBullet.ts"

interface Props extends WithTranslation {
  items: IUserFile[]
  userName: string
  onSlideChange?: (index: number) => void
  onPrevious?: () => void
  onNext?: () => void
  enablePagination?: boolean
  slidesPerView?: number
  spaceBetween?: number
  className?: string
  itemClassName?: string
  enableSidesNavigation?: boolean
}

const MediaCarouselBase = ({
  items,
  userName,
  onSlideChange,
  onPrevious,
  onNext,
  enablePagination = true,
  slidesPerView = 1,
  spaceBetween = 0,
  className,
  itemClassName,
  enableSidesNavigation,
}: Props) => {
  const swiperRef = useRef<SwiperType | null>(null)
  const [currentSlide, setCurrentSlide] = useState<number>(0)
  const videoContainerRef = useRef<HTMLDivElement | null>(null)

  const photos = items
    .filter((file) => file.type === "image")
    .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
  const videos = items.filter((file) => file.type === "video")

  const allMedia = useMemo(() => {
    return [...photos, ...videos]
  }, [photos, videos])
  const currentItem = allMedia[currentSlide]
  const isCurrentSlideVideo = currentItem?.type === "video"

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

  const renderBullet = useCallback(
    (index: number, className: string) => {
      const isVideo = allMedia[index]?.type === "video"
      return renderVideoBullet(className, isVideo)
    },
    [allMedia],
  )

  return (
    <div className={classNames("overflow-hidden h-full", className)}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={spaceBetween}
        slidesPerView={slidesPerView}
        onSlideChange={handleSlideChange}
        onSwiper={(swiper) => {
          swiperRef.current = swiper
        }}
        pagination={{
          clickable: true,
          enabled: enablePagination,
          renderBullet,
        }}
        allowTouchMove={true}
        className={classNames("w-full h-full", styles["custom-swiper"])}
      >
        {allMedia.map((item, index) => (
          <SwiperSlide key={index}>
            <div
              className={classNames(
                "relative h-full overflow-hidden bg-grey-10 border border-white-10 rounded-[24px]",
                itemClassName,
              )}
            >
              {item.type === "image" && (
                <img
                  src={item.url}
                  alt={`${userName} photo ${index + 1}`}
                  className='w-full h-full object-cover object-top select-none pointer-events-none'
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    WebkitTouchCallout: "none",
                    WebkitUserSelect: "none",
                  }}
                />
              )}

              {item.type === "video" && (
                <div className='w-full h-full relative' ref={videoContainerRef}>
                  <ReactPlayer
                    src={item.url}
                    playing={isCurrentSlideVideo}
                    loop={true}
                    controls={false}
                    volume={1}
                    muted={false}
                    width='100%'
                    height='100%'
                  />
                </div>
              )}

              {enableSidesNavigation && (
                <>
                  <div
                    className='absolute h-full w-[25%] top-0 left-0 bottom-0 bg-transparent z-10 cursor-pointer'
                    onClick={scrollPrev}
                  />
                  <div
                    className='absolute h-full w-[25%] top-0 right-0 bottom-0 bg-transparent z-10 cursor-pointer'
                    onClick={scrollNext}
                  />
                </>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
export const MediaCarousel = withTranslation()(MediaCarouselBase)
