import { type WithTranslation, withTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useMemo } from "react"

import { BottomButton } from "@/shared/ui"
import { useStep } from "@/processes/onboarding/lib/useStep.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useUserGTMEvent } from "@/entities/user/lib/useUserGTMEvent.ts"
import {
  useUser,
  useUploadPhoto,
  useDeleteFile,
  useDeleteUserVideo,
  useUploadVideo,
} from "@/entities/user/api/queries.ts"
import { MediaPhotos } from "./MediaPhotos.tsx"
import { MediaVideo } from "./MediaVideo.tsx"

const MediaNewBase = ({ t }: WithTranslation) => {
  const navigate = useNavigate()
  const { triggerImpact } = useHapticFeedback()
  const sendUserEvent = useUserGTMEvent()

  useStep(5)

  const { data: user } = useUser()
  const uploadPhotoMutation = useUploadPhoto()
  const deleteFileMutation = useDeleteFile()
  const uploadVideoMutation = useUploadVideo()
  const deleteVideoMutation = useDeleteUserVideo()

  const userPhotos = useMemo(() => {
    const photos = user?.files.filter((file) => file.type === "image" && !file.deleted_at) || []
    return [photos[0], photos[1], photos[2]]
  }, [user?.files])

  const userVideo = useMemo(() => {
    return user?.files.find((file) => file.type === "video" && !file.deleted_at)
  }, [user?.files])

  const attachedPhotosCount = userPhotos.filter(Boolean).length

  const handlePhotoUpload = async (files: File[]) => {
    for (const file of files) {
      await uploadPhotoMutation.mutateAsync({
        file,
        file_type: "image",
      })
    }
    sendUserEvent({ event: "files_selected" })
  }

  const handlePhotoDelete = async (fileId: number) => {
    await deleteFileMutation.mutateAsync(fileId)
  }

  const handleVideoUpload = async (file: File) => {
    await uploadVideoMutation.mutateAsync({
      file,
    })
  }

  const handleVideoDelete = async (videoId: number) => {
    await deleteVideoMutation.mutateAsync(videoId)
  }

  const handleContinue = async () => {
    triggerImpact()
    await navigate("/onboarding/verification")
  }

  return (
    <div className='flex flex-col h-full'>
      <h1 className='title1-bold px-4'>{t("onboarding.media.title")}</h1>

      <div className='mt-4 flex flex-col h-full flex-1 overflow-hidden gap-2'>
        <div className='flex-1 h-full px-4 overflow-y-auto'>
          <div>
            <MediaPhotos
              photos={userPhotos}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
            />
            <p className='mt-1 text-text-grey caption1-medium'>{t("onboarding.media.note")}</p>
          </div>

          <div className='mt-4'>
            <MediaVideo
              video={userVideo}
              onUpload={handleVideoUpload}
              onDelete={handleVideoDelete}
              label={t("onboarding.media.video")}
              subLabel={t("onboarding.media.videoNote")}
            />
          </div>
        </div>

        <BottomButton
          onClick={handleContinue}
          disabled={
            attachedPhotosCount !== 3 ||
            uploadPhotoMutation.isPending ||
            uploadVideoMutation.isPending
          }
        >
          <span className='button-main'>
            {t("photo")} {attachedPhotosCount} / 3
          </span>
        </BottomButton>
      </div>
    </div>
  )
}

export const MediaNew = withTranslation()(MediaNewBase)
