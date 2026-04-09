import { useRef, useState, type ChangeEvent } from "react"
import classNames from "classnames"
import IconPlus from "@/shared/assets/icons/icon-plus.svg"
import IconClose from "@/shared/assets/icons/icon-close.svg"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import type { IUserFile } from "@/entities/user/model/types.ts"
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_FILE_SIZE } from "@/shared/const/constants.ts"
import { useTranslation } from "react-i18next"
import IconPlay from "@/shared/assets/icons/icon-play.svg"
import ReactPlayer from "react-player"

interface MediaVideoProps {
  video?: IUserFile
  onUpload: (file: File) => Promise<void>
  onDelete: (fileId: number) => Promise<void>
  label?: string
  subLabel?: string
  className?: string
}

const validateVideo = (file: File): string | null => {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return "validation.video_type_invalid"
  }
  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return "validation.video_size_too_large"
  }
  return null
}

export const MediaVideo = ({
  video,
  onUpload,
  onDelete,
  label,
  subLabel,
  className,
}: MediaVideoProps) => {
  const { triggerImpact } = useHapticFeedback()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const [isUploading, setIsUploading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleClick = () => {
    if (video || isUploading) return

    triggerImpact("medium")
    setValidationError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateVideo(file)
    if (error) {
      setValidationError(error)
      e.target.value = ""
      return
    }

    setIsUploading(true)
    setValidationError(null)

    try {
      await onUpload(file)
      setIsUploading(false)
    } catch (error) {
      console.error(error)
      setIsUploading(false)
      setValidationError("Upload failed")
    }

    e.target.value = ""
  }

  const handleDelete = async () => {
    if (!video) return

    try {
      await onDelete(video.id)
      setValidationError(null)
    } catch (error) {
      console.error(error)
      setValidationError("Delete failed")
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className='subtitle-medium text-accent mb-2 block'>
          {label} {subLabel && <span className='ml-2 opacity-[50%]'>{subLabel}</span>}
        </label>
      )}
      <div className='flex flex-col'>
        <div
          onClick={handleClick}
          className={classNames(
            "relative aspect-auto bg-white-10 border-1 border-dashed border-white-10 rounded-[8px] flex items-center justify-center overflow-hidden mx-auto w-[168px] h-[244px]",
            {
              "border-attention border-solid border-2": validationError,
              "cursor-pointer": !video && !isUploading,
              "cursor-not-allowed": isUploading,
            },
          )}
        >
          {video ? (
            <>
              <ReactPlayer
                src={video.url}
                playing={true}
                controls={true}
                loop={true}
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void handleDelete()
                }}
                className='absolute top-2 right-2 z-2'
                disabled={isUploading}
              >
                <img src={IconClose} alt='Remove video' className='w-4 h-4' />
              </button>
            </>
          ) : isUploading ? (
            <div className='loader' />
          ) : (
            <img src={IconPlus} alt='icon-plus' />
          )}
        </div>
        {validationError && (
          <span className='mt-1 text-attention text-xs text-center'> {t(validationError)}</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_VIDEO_TYPES.join(",")}
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  )
}
