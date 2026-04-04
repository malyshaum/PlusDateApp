import { PageLayout } from "@/widgets"
import { BottomButtonGroup, CheckboxField, ConfirmationModal, TextareaField } from "@/shared/ui"
import { getOptions } from "@/pages/profile-delete/lib/contants.ts"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Schema, type TSchema } from "@/pages/profile-delete/lib/form.ts"
import { useState, useMemo } from "react"
import { useDeleteProfile } from "@/entities/user/api/queries.ts"
import IconTrash from "@/shared/assets/icons/icon-trash.svg?react"
import { useNavigate } from "react-router-dom"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useTranslation } from "react-i18next"
import { useKeyboardAware } from "@/shared/lib/useKeyboardAware.tsx"

export const ProfileDeletePage = () => {
  const keyboardAwareRef = useKeyboardAware()
  const { t } = useTranslation()
  const { triggerImpact } = useHapticFeedback()
  const navigate = useNavigate()
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  const options = useMemo(() => getOptions(t), [t])

  const methods = useForm<TSchema>({
    resolver: zodResolver(Schema),
    mode: "onChange",
    defaultValues: {
      reasons: [],
      note: "",
    },
  })

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    register,
  } = methods

  const reasons = watch("reasons")
  const isOtherSelected = reasons?.includes("other")

  const { mutate: deleteProfile, isPending } = useDeleteProfile({
    onSuccess: () => {
      setIsConfirmModalOpen(false)
      void navigate("/profile/restore")
      sessionStorage.setItem("account.deleted", "true")
    },
    onError: (error) => {
      console.error("Failed to delete profile:", error)
      setIsConfirmModalOpen(false)
    },
  })

  const handleOpenConfirmModal = () => {
    triggerImpact()
    setIsConfirmModalOpen(true)
  }

  const handleCancelDelete = () => {
    triggerImpact()
    setIsConfirmModalOpen(false)
  }

  const handleConfirmDelete = handleSubmit((data) => {
    triggerImpact()
    deleteProfile(data)
  })

  return (
    <PageLayout className='overflow-y-auto pb-safe-area-bottom-with-buttons' ref={keyboardAwareRef}>
      <h1 className='title1-bold mb-4'>{t("profileDelete.title")}</h1>
      <CheckboxField<TSchema>
        name='reasons'
        options={options}
        control={control}
        maxSelections={6}
        classNameOptions='!pb-0 overflow-y-visible'
      />

      {isOtherSelected && (
        <TextareaField<TSchema>
          name='note'
          placeholder={t("profileDelete.notePlaceholder")}
          register={register}
          note={t("profileDelete.noteLimit")}
          error={errors.note}
          className='mt-4'
        />
      )}

      <BottomButtonGroup
        primaryButton={{
          children: <span>{t("profileDelete.cancelButton")}</span>,
          onClick: () => {
            void navigate(-1)
          },
          disabled: !isValid,
        }}
        secondaryButton={{
          children: <span>{t("profileDelete.deleteButton")}</span>,
          onClick: handleOpenConfirmModal,
          disabled: reasons.length < 1,
        }}
        className='absolute bottom-0 left-0 right-0 z-20'
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        icon={<IconTrash />}
        title={t("profileDelete.confirmModal.title")}
        description={t("profileDelete.confirmModal.description")}
        primaryButton={{
          children: t("profileDelete.confirmModal.deleteButton"),
          onClick: handleConfirmDelete,
          isLoading: isPending,
        }}
        secondaryButton={{
          children: t("profileDelete.confirmModal.cancelButton"),
          onClick: handleCancelDelete,
        }}
        onOutsideClick={handleCancelDelete}
      />
    </PageLayout>
  )
}
