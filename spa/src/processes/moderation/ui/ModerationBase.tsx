import { withTranslation, type WithTranslation } from "react-i18next"
import { useUserFiles, useUpdateUserFiles, useUser } from "@/entities/user/api/queries.ts"
import { useNavigate } from "react-router-dom"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/pagination"
import { ModerationPhoto } from "./ModerationPhoto.tsx"
import { ModerationVideo } from "./ModerationVideo.tsx"
import { ModerationVerificationPhoto } from "./ModerationVerificationPhoto.tsx"
import type { IUserFile } from "@/entities/user/model/types.ts"
import { BottomButtonGroup } from "@/shared/ui"
import {
  ModerationReplacementSchema,
  type TModerationReplacement,
} from "@/processes/moderation/model/schemas.ts"
import { CameraModal } from "@/widgets"
import { base64ToImageFile } from "@/shared/lib/utils.ts"
import { useState, useCallback } from "react"

export const ModerationBase = ({ t }: WithTranslation) => {
  const { triggerImpact } = useHapticFeedback()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const { data: files } = useUserFiles()
  const updateUserFiles = useUpdateUserFiles()
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [replacedFiles, setReplacedFiles] = useState<Record<number, File>>({})
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  const { setValue, handleSubmit } = useForm<TModerationReplacement>({
    resolver: zodResolver(ModerationReplacementSchema),
    mode: "onChange",
  })

  const hasReplacements = Object.keys(replacedFiles).length > 0
  const hasValidationErrors = Object.keys(validationErrors).length > 0
  const moderationReason = user?.moderation?.find(
    (m) => !m.is_resolved && m.rejection_reason === 11,
  )

  const handleFileReplace = (fileId: number, newFile: File, error?: string) => {
    setValue(String(fileId), newFile, { shouldValidate: true })

    setReplacedFiles((prev) => ({
      ...prev,
      [fileId]: newFile,
    }))

    if (error) {
      setValidationErrors((prev) => ({ ...prev, [fileId]: error }))
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fileId]
        return newErrors
      })
    }
  }

  const getFileTypeFromFile = (
    file: File,
    originalType: string,
  ): "image" | "video" | "verification_photo" => {
    if (originalType === "verification_photo") {
      return "verification_photo"
    }
    return file.type.startsWith("video/") ? "video" : "image"
  }

  const handleTakePhoto = useCallback(() => {
    triggerImpact("medium")
    setIsCameraOpen(true)
  }, [triggerImpact])

  const handleCloseCamera = useCallback(() => {
    setIsCameraOpen(false)
  }, [])

  const handleCameraCapture = useCallback(
    (imageBase64: string) => {
      const verificationFile = files?.find((f) => f.type === "verification_photo")
      if (!verificationFile) return

      const capturedFile = base64ToImageFile(imageBase64, "verification_photo.jpg")
      setValue(String(verificationFile.id), capturedFile, { shouldValidate: true })
      setReplacedFiles((prev) => ({ ...prev, [verificationFile.id]: capturedFile }))
      setIsCameraOpen(false)
    },
    [files, setValue],
  )

  const onSubmit = (data: TModerationReplacement) => {
    triggerImpact("medium")
    const filesToUpdate = Object.entries(data)
      .filter(([, file]) => file !== undefined)
      .map(([fileId, file]) => {
        const originalFile = files?.find((f) => f.id === Number(fileId))
        const uploadedFile = file as File
        return {
          file: uploadedFile,
          file_id: Number(fileId) === 0 ? undefined : Number(fileId),
          file_type: getFileTypeFromFile(uploadedFile, originalFile?.type || "image"),
        }
      })

    if (filesToUpdate.length === 0) return

    updateUserFiles.mutate(
      { files: filesToUpdate },
      {
        onSuccess: () => {
          void navigate("/feed")
        },
        onError: (error) => {
          console.error("Failed to update files:", error)
        },
      },
    )
  }

  const getFileToDisplay = (file: IUserFile) => {
    return replacedFiles[file.id] || null
  }

  const renderFileCard = (file: IUserFile) => {
    const replacedFile = getFileToDisplay(file)
    const error = validationErrors[file.id]

    switch (file.type) {
      case "verification_photo":
        return <ModerationVerificationPhoto file={file} replacedFile={replacedFile} error={error} />
      case "image":
      default:
        return (
          <ModerationPhoto
            file={file}
            replacedFile={replacedFile}
            onReplace={handleFileReplace}
            error={error}
          />
        )
    }
  }

  const photoFiles = files
    ?.filter((f) => f.type === "image" || f.type === "verification_photo")
    .sort((a, b) =>
      a.type === "verification_photo" ? -1 : b.type === "verification_photo" ? 1 : 0,
    )

  const videoFile = files?.find((f) => f.type === "video")
  const videoFileId = videoFile?.id || 0
  const videoReplacedFile = replacedFiles[videoFileId]
  const videoError = validationErrors[videoFileId]

  const videoConstraints = {
    facingMode: "user",
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex-1 h-full overflow-y-auto pb-safe-area-bottom-with-buttons'
      >
        <div className='pt-4 px-4 mb-4'>
          <h1 className='title1-bold mb-2'>{t("moderation.title")}</h1>
          <p className='caption1-medium opacity-50'>{t("moderation.description")}</p>
        </div>

        <div className='subtitle-medium text-accent mb-2 px-4'>{t("photo")}</div>
        <Swiper spaceBetween={10} slidesPerView='auto' className='!px-4'>
          {photoFiles?.map((file: IUserFile) => (
            <SwiperSlide key={file.id} className='!w-auto'>
              {renderFileCard(file)}
            </SwiperSlide>
          ))}
        </Swiper>

        <div className='caption1-medium text-accent px-4 mt-2'>
          {moderationReason?.note ? moderationReason.note : t("rejectionReasons.general_reason")}
        </div>

        {videoFile && (
          <>
            <div className='subtitle-medium text-accent mb-2 px-4 mt-4'>
              {t("onboarding.media.video")}
              <span className='ml-2 opacity-[50%]'>{t("onboarding.media.videoNote")}</span>
            </div>
            <div className='px-4'>
              <ModerationVideo
                file={videoFile}
                replacedFile={videoReplacedFile}
                onReplace={handleFileReplace}
                error={videoError}
              />
            </div>
          </>
        )}

        <BottomButtonGroup
          secondaryButton={{
            onClick: handleTakePhoto,
            children: (
              <span className='button-main'>{t("onboarding.verification.remakePhoto")}</span>
            ),
            disabled: updateUserFiles.isPending,
          }}
          primaryButton={{
            type: "submit",
            disabled: !hasReplacements || hasValidationErrors || updateUserFiles.isPending,
            isLoading: updateUserFiles.isPending,
            children: <span className='button-main'>{t("send")}</span>,
          }}
          className='pb-safe-area-bottom absolute bottom-0 left-0 right-0'
        />
      </form>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
        videoConstraints={videoConstraints}
      />
    </>
  )
}

export const Moderation = withTranslation()(ModerationBase)
