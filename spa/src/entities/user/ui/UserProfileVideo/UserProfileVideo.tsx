import type { IUserFile } from "@/entities/user/model/types.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { lazy, useRef, useState, useMemo } from "react"
import { withTranslation, type WithTranslation } from "react-i18next"
import { z } from "zod"
import { createFileVideoRules } from "@/shared/validations/zod.ts"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useDeleteUserVideo, useReplaceUserVideo } from "@/entities/user/api/queries.ts"
import IconClose from "@/shared/assets/icons/icon-close.svg?react"
import IconPlay from "@/shared/assets/icons/icon-play.svg"
import ReactPlayer from "react-player"
import IconPlus from "@/shared/assets/icons/icon-plus.svg"
import { FileVerificationNote } from "@/shared/ui"
import { UserFileModerationReasons } from "@/shared/const/constants.ts"
import IconPencil from "@/shared/assets/icons/icon-pencil.svg?react"

const ActionMenu = lazy(() =>
  import("@/widgets").then((module) => ({ default: module.ActionMenu })),
)

interface Props extends WithTranslation {
  className?: string
  allowEdit?: boolean
  video?: IUserFile
}

const schema = z.object({
  video: createFileVideoRules(),
})

export type TSchema = z.infer<typeof schema>

const UserProfileVideoBase = ({ allowEdit, video, t }: Props) => {
  const { triggerImpact } = useHapticFeedback()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { mutate: deleteVideo, isPending: isDeleteVideoPending } = useDeleteUserVideo()
  const [playing, setPlaying] = useState<boolean>(false)
  const { mutate: replaceVideo, isPending: isReplaceVideoPending } = useReplaceUserVideo()

  const {
    setValue,
    formState: { errors },
    trigger,
    watch,
  } = useForm<TSchema>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      video: undefined,
    },
  })

  const file = watch("video")
  const allowDelete = !video?.is_under_moderation && allowEdit

  const blobUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file)
    }
    return video?.url
  }, [file, video?.url])

  const triggerReplaceVideoOnLayer = () => {
    if (video) return
    triggerImpact()
    fileInputRef.current?.click()
  }

  const triggerReplaceVideo = () => {
    if (!video) return
    triggerImpact()
    fileInputRef.current?.click()
  }

  const handleVideoDelete = (id: number) => {
    triggerImpact("light")
    deleteVideo(id, {
      onSuccess: () => {
        triggerImpact("medium")
      },
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setValue("video", file)
    const isValid = await trigger("video")
    if (!isValid) {
      return
    }

    triggerImpact("medium")

    replaceVideo(
      {
        file,
        file_id: video?.id,
      },
      {
        onSuccess: () => {
          triggerImpact("light")
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
            setValue("video", undefined)
          }
        },
      },
    )
  }

  const handlePlayVideo = () => {
    setPlaying(true)
  }

  const actions = [
    {
      label: "replace",
      icon: <IconPencil />,
      onClick: triggerReplaceVideo,
    },
  ]

  if (video?.id) {
    actions.push({
      label: "delete",
      icon: <IconClose />,
      onClick: () => handleVideoDelete(video.id),
    })
  }

  const isLoading = isDeleteVideoPending || isReplaceVideoPending

  return (
    <div
      className='relative h-full overflow-hidden bg-grey-10 border border-dashed border-white-10 rounded-[8px]'
      onClick={triggerReplaceVideoOnLayer}
    >
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-white-10 z-50'>
          <div className='loader' />
        </div>
      )}
      <div className='w-full h-full relative'>
        {/*{!isLoading && !playing && video?.url && (*/}
        {/*  <button*/}
        {/*    type='button'*/}
        {/*    className='absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 will-change-[transform,opacity]'*/}
        {/*    onClick={handlePlayVideo}*/}
        {/*  >*/}
        {/*    <img src={IconPlay} alt='icon-play' />*/}
        {/*  </button>*/}
        {/*)}*/}

        {!blobUrl ? (
          <div className='absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center'>
            <img src={IconPlus} alt='icon-plus' width={32} height={32} />
            <div className='subtitle-medium text-white-50'>{t("video.title")}</div>
          </div>
        ) : (
          <ReactPlayer
            src={blobUrl}
            loop={true}
            playing={playing}
            onClickPreview={handlePlayVideo}
            controls={playing}
            light={video?.thumbnail_url}
            playsInline={true}
            width='100%'
            height='100%'
            style={{
              borderRadius: "8px",
              overflow: "hidden",
              objectFit: "cover",
            }}
            playIcon={<img src={IconPlay} alt='icon-play' />}
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='video/*'
        className='hidden'
        onChange={handleFileChange}
      />

      {errors.video ? (
        <FileVerificationNote type='attention'>
          {t(errors.video.message as string)}
        </FileVerificationNote>
      ) : (
        video?.is_under_moderation && (
          <FileVerificationNote type={video?.moderation.length ? "attention" : "info"}>
            {!video?.moderation.length
              ? t("verification")
              : t(UserFileModerationReasons[video?.moderation[0].rejection_reason])}
          </FileVerificationNote>
        )
      )}

      {!isLoading && allowDelete && video?.id && <ActionMenu actions={actions} />}
    </div>
  )
}

export const UserProfileVideo = withTranslation()(UserProfileVideoBase)
