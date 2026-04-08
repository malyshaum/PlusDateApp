import { useState, useEffect } from "react"
import type { IUserFile } from "@/entities/user/model/types.ts"
import ReactPlayer from "react-player"
import IconPencil from "@/shared/assets/icons/icon-pencil.svg"
import IconPlus from "@/shared/assets/icons/icon-plus.svg"
import IconPlay from "@/shared/assets/icons/icon-play.svg"
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_FILE_SIZE } from "@/shared/const/constants.ts"
import { useTranslation } from "react-i18next"
import { InputError } from "@/shared/ui/InputError/InputError.tsx"

interface Props {
  file?: IUserFile
  replacedFile?: File
  onReplace: (fileId: number, newFile: File, error?: string) => void
  error?: string
}

export const ModerationVideo = ({ file, replacedFile, onReplace, error }: Props) => {
  const { t } = useTranslation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (replacedFile) {
      const url = URL.createObjectURL(replacedFile)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl(null)
    }
  }, [replacedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    let validationError: string | undefined

    if (!ACCEPTED_VIDEO_TYPES.includes(selectedFile.type)) {
      validationError = t("validation.video_type_invalid")
    } else if (selectedFile.size > MAX_VIDEO_FILE_SIZE) {
      validationError = t("validation.video_size_too_large")
    }

    onReplace(file?.id || 0, selectedFile, validationError)
  }

  const videoUrl = previewUrl || file?.url
  const hasVideo = !!videoUrl
  const thumbnailUrl = !previewUrl ? file?.thumbnail_url : undefined

  return (
    <div className='flex flex-col'>
      <div
        onClick={() => !hasVideo && document.getElementById(`file-input-video`)?.click()}
        className='relative w-[124px] h-[176px] mx-auto rounded-[8px] overflow-hidden bg-white-10 border-1 border-dashed border-white-10 flex items-center justify-center'
      >
        {hasVideo ? (
          <>
            <ReactPlayer
              src={videoUrl}
              playing={true}
              controls={true}
              loop={true}
              light={thumbnailUrl}
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
              type='button'
              onClick={() => document.getElementById(`file-input-video`)?.click()}
              className='absolute top-2 right-2 z-10'
            >
              <img src={IconPencil} alt='replace' />
            </button>
          </>
        ) : (
          <img src={IconPlus} alt='Add video' />
        )}

        <input
          id={`file-input-video`}
          type='file'
          accept='video/*'
          hidden
          onChange={handleFileSelect}
        />
      </div>

      {error && <InputError error={error} />}
    </div>
  )
}
