import { type WithTranslation, withTranslation } from "react-i18next"
import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"

import { MediaInfoSchema, type TMediaInfo } from "../model/schemas.ts"
import { useOnboardingStore } from "@/processes/onboarding/store/onboardingStore.ts"
import { BottomButton, Carousel, PhotoInput, VideoInput } from "@/shared/ui"
import { InputError } from "@/shared/ui/InputError/InputError.tsx"
import { useStep } from "@/processes/onboarding/lib/useStep.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useMemo } from "react"
import { SwiperSlide } from "swiper/react"
import { useUserGTMEvent } from "@/entities/user/lib/useUserGTMEvent.ts"

const MediaBase = ({ t }: WithTranslation) => {
  const navigate = useNavigate()
  const { mediaInfo, setMediaInfo } = useOnboardingStore()
  const { triggerImpact } = useHapticFeedback()
  const sendUserEvent = useUserGTMEvent()

  useStep(5)

  const methods = useForm<TMediaInfo>({
    resolver: zodResolver(MediaInfoSchema),
    mode: "onSubmit",
    defaultValues: mediaInfo,
  })

  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = methods

  const watchedValues = watch(["photo1", "photo2", "photo3"])
  const attachedPhotosCount = useMemo(() => {
    return watchedValues.filter(Boolean).length || 0
  }, [watchedValues])

  const getOtherEmptySlots = (currentSlot: keyof TMediaInfo): number => {
    const slots = ["photo1", "photo2", "photo3"] as const
    const currentIndex = slots.indexOf(currentSlot as (typeof slots)[number])
    return slots.filter((_, index) => index !== currentIndex && !watchedValues[index]).length
  }

  const handleMultiplePhotos = (remainingFiles: File[], currentSlot: keyof TMediaInfo) => {
    const slots = ["photo1", "photo2", "photo3"] as const
    const currentIndex = slots.indexOf(currentSlot as (typeof slots)[number])

    let fileIndex = 0

    for (let i = currentIndex + 1; i < slots.length && fileIndex < remainingFiles.length; i++) {
      const slot = slots[i]
      if (!watchedValues[i]) {
        setValue(slot, remainingFiles[fileIndex])
        fileIndex++
      }
    }

    for (let i = 0; i < currentIndex && fileIndex < remainingFiles.length; i++) {
      const slot = slots[i]
      if (!watchedValues[i]) {
        setValue(slot, remainingFiles[fileIndex])
        fileIndex++
      }
    }
  }

  const onSubmit: SubmitHandler<TMediaInfo> = async (data) => {
    setMediaInfo(data)
    triggerImpact()
    sendUserEvent({ event: "files_selected" })
    await navigate("/onboarding/verification")
  }

  return (
    <div className='flex flex-col h-full'>
      <h1 className='title1-bold px-4'>{t("onboarding.media.title")}</h1>

      <form
        className='mt-4 flex flex-col h-full flex-1 overflow-hidden gap-2'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className='flex-1 h-full px-4 overflow-y-auto'>
          <div>
            <div className='flex'>
              <Carousel
                enablePagination={false}
                slidesPerView='auto'
                spaceBetween={10}
                className='!h-[244px]'
              >
                <SwiperSlide className='!w-[168px]'>
                  <PhotoInput<TMediaInfo>
                    name='photo1'
                    control={control}
                    allowMultiple={getOtherEmptySlots("photo1") > 0}
                    onMultipleFiles={handleMultiplePhotos}
                  />
                </SwiperSlide>
                <SwiperSlide className='!w-[168px]'>
                  <PhotoInput<TMediaInfo>
                    name='photo2'
                    control={control}
                    allowMultiple={getOtherEmptySlots("photo2") > 0}
                    onMultipleFiles={handleMultiplePhotos}
                  />
                </SwiperSlide>
                <SwiperSlide className='!w-[168px]'>
                  <PhotoInput<TMediaInfo>
                    name='photo3'
                    control={control}
                    allowMultiple={getOtherEmptySlots("photo3") > 0}
                    onMultipleFiles={handleMultiplePhotos}
                  />
                </SwiperSlide>
              </Carousel>
            </div>
            <p className='mt-1 text-text-grey caption1-medium'>{t("onboarding.media.note")}</p>
            {(errors.photo1 || errors.photo2 || errors.photo3) && (
              <div className='mt-2'>
                {errors.photo1 && <InputError error={errors.photo1} />}
                {errors.photo2 && <InputError error={errors.photo2} />}
                {errors.photo3 && <InputError error={errors.photo3} />}
              </div>
            )}
          </div>

          <div className='mt-4'>
            <VideoInput<TMediaInfo>
              label={t("onboarding.media.video")}
              subLabel={t("onboarding.media.videoNote")}
              name='videos'
              control={control}
              error={errors.videos}
              inputContainerClassName='mx-auto w-[168px] h-[244px]'
            />
          </div>
        </div>

        <BottomButton type='submit' disabled={attachedPhotosCount !== 3}>
          <span className='button-main'>
            {t("photo")} {attachedPhotosCount} / 3
          </span>
        </BottomButton>
      </form>
    </div>
  )
}

export const Media = withTranslation()(MediaBase)
