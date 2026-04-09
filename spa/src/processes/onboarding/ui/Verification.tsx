import { type WithTranslation, withTranslation } from "react-i18next"
import { type SubmitHandler, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useCallback } from "react"

import { BottomButton, BottomButtonGroup } from "@/shared/ui"
import { useOnboardingStore } from "@/processes/onboarding/store/onboardingStore.ts"
import { VerificationInfoSchema, type TVerificationInfo } from "../model/schemas.ts"
import VerificationExample from "@/shared/assets/images/verification_example.webp"
import { useStep } from "@/processes/onboarding/lib/useStep.ts"
import { CameraModal } from "@/widgets"
import { base64ToImageFile } from "@/shared/lib/utils.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useOnboard, useUploadPhoto, useUser } from "@/entities/user/api/queries.ts"
import type { IUserDto } from "@/entities/user/model/types.ts"
import i18n from "i18next"
import { useNavigate } from "react-router-dom"
import { useUserGTMEvent } from "@/entities/user/lib/useUserGTMEvent.ts"

const VerificationBase = ({ t }: WithTranslation) => {
  const { verificationInfo, basicInfo, ageInfo, cityInfo, interestsInfo, setVerificationInfo } =
    useOnboardingStore()
  const { triggerImpact } = useHapticFeedback()
  useStep(6)
  const { data: user } = useUser()
  const navigate = useNavigate()
  const sendUserEvent = useUserGTMEvent()
  const uploadPhotoMutation = useUploadPhoto()

  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const methods = useForm<TVerificationInfo>({
    resolver: zodResolver(VerificationInfoSchema),
    mode: "onTouched",
    defaultValues: verificationInfo,
  })

  const { handleSubmit, setValue, watch } = methods

  const verificationPhoto = watch("verification_photo")
  const hasValidPhoto = verificationPhoto && verificationPhoto.size > 0

  const videoConstraints = {
    facingMode: "user",
  }

  const handleStartCamera = useCallback(() => {
    triggerImpact("medium")
    triggerImpact()
    setIsCameraOpen(true)
  }, [triggerImpact])

  const handleCloseCamera = useCallback(() => {
    setIsCameraOpen(false)
  }, [])

  const handleCameraCapture = useCallback(
    (imageBase64: string) => {
      setCapturedImage(imageBase64)
      const file = base64ToImageFile(imageBase64, "verification_photo.jpg")
      setValue("verification_photo", file)
    },
    [setValue],
  )

  const handleRetakePhoto = useCallback(() => {
    triggerImpact("medium")
    setCapturedImage(null)
    methods.resetField("verification_photo")
    setIsCameraOpen(true)
  }, [methods, triggerImpact])

  const { mutate, isPending } = useOnboard({
    onSuccess: () => {
      localStorage.removeItem("onboarding-store1")
      sendUserEvent({ event: "onboarding_finished" })
      void navigate("/moderation-splash")
    },
  })

  const onSubmit: SubmitHandler<TVerificationInfo> = async (data) => {
    setVerificationInfo(data)
    const payload: IUserDto = {
      user_id: user?.id,
      name: basicInfo.name,
      instagram: basicInfo.instagram,
      sex: basicInfo.sex,
      age: Number(ageInfo.age),
      city_id: cityInfo.city_id,
      search_for: interestsInfo.search_for,
      profile_description: interestsInfo.profile_description,
      hobbies: interestsInfo.hobbies.map((i) => Number(i)),
      language_code: i18n.resolvedLanguage,
    }
    await uploadPhotoMutation.mutateAsync({
      file: data.verification_photo,
      file_type: "verification_photo",
    })
    const filteredPayload = Object.fromEntries(
      Object.entries(payload).filter(
        ([, value]) => ![null, undefined, ""].includes(value as string | null | undefined),
      ),
    )
    sendUserEvent({ event: "verification_photo_selected" })
    triggerImpact("medium")
    mutate(filteredPayload)
  }

  return (
    <div className='flex flex-col h-full pb-safe-area-bottom-with-button'>
      <h1 className='title1-bold mb-2 px-4'>{t("onboarding.verification.title")}</h1>
      <p className='opacity-50 caption1-medium px-4'>{t("onboarding.verification.description")}</p>

      <form
        className='flex flex-col h-full overflow-hidden'
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className='flex flex-col h-full items-center justify-center gap-3 px-4'>
          <div className='flex items-center justify-center gap-2'>
            <div className='flex-1 h-[250px] rounded-[8px] overflow-hidden'>
              <img
                src={VerificationExample}
                alt='example'
                loading='eager'
                className='w-full h-full object-cover'
              />
            </div>

            {hasValidPhoto && (
              <div className='flex-1 rounded-[8px] overflow-hidden h-[250px]'>
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt='Verification photo'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(verificationPhoto)}
                    alt='Verification photo'
                    className='w-full h-full object-cover'
                  />
                )}
              </div>
            )}
          </div>
          {hasValidPhoto ? (
            <p className='text-center opacity-50 caption1-medium'>
              {t("onboarding.verification.checkPhoto")}
            </p>
          ) : (
            <p className='text-center opacity-50 caption1-medium max-[240px]'>
              {t("onboarding.verification.note")}
            </p>
          )}
        </div>

        {!hasValidPhoto ? (
          <BottomButton onClick={handleStartCamera}>
            <span className='button-main'>{t("onboarding.verification.makePhoto")}</span>
          </BottomButton>
        ) : (
          <BottomButtonGroup
            secondaryButton={{
              onClick: handleRetakePhoto,
              children: (
                <span className='button-main'>{t("onboarding.verification.remakePhoto")}</span>
              ),
              disabled: isPending || uploadPhotoMutation.isPending,
            }}
            primaryButton={{
              type: "submit",
              disabled: isPending || uploadPhotoMutation.isPending,
              isLoading: isPending || uploadPhotoMutation.isPending,
              children: <span className='button-main'>{t("continue")}</span>,
            }}
            className='absolute bottom-0 left-0 right-0'
          />
        )}
      </form>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={handleCloseCamera}
        onCapture={handleCameraCapture}
        videoConstraints={videoConstraints}
      />
    </div>
  )
}

export const Verification = withTranslation()(VerificationBase)
