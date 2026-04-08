import type { IUserFile } from "@/entities/user/model/types.ts"
import { PhotoPreview } from "@/shared/ui/FileInput/FilePhotoPreview.tsx"
import IconPencil from "@/shared/assets/icons/icon-pencil.svg"
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from "@/shared/const/constants.ts"
import { useTranslation } from "react-i18next"
import { InputError } from "@/shared/ui/InputError/InputError.tsx"

interface Props {
  file: IUserFile
  replacedFile: File | null
  onReplace: (fileId: number, newFile: File, error?: string) => void
  error?: string
}

export const ModerationPhoto = ({ file, replacedFile, onReplace, error }: Props) => {
  const { t } = useTranslation()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    let validationError: string | undefined

    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
      validationError = t("validation.image_type_invalid")
    } else if (selectedFile.size > MAX_IMAGE_FILE_SIZE) {
      validationError = t("validation.image_size_too_large")
    }

    onReplace(file.id, selectedFile, validationError)
  }

  return (
    <div className='flex flex-col'>
      <div className='relative h-[252px] w-[176px] rounded-[8px] overflow-hidden'>
        {replacedFile ? (
          <PhotoPreview
            file={replacedFile}
            alt='New photo'
            className='w-full h-full object-cover'
          />
        ) : (
          <img src={file.url} alt='User photo' className='w-full h-full object-cover' />
        )}

        <button
          type='button'
          onClick={() => document.getElementById(`file-input-${file.id}`)?.click()}
          className='absolute top-2 right-2 z-10'
        >
          <img src={IconPencil} alt='replace' />
        </button>

        <input
          id={`file-input-${file.id}`}
          type='file'
          accept='image/*'
          hidden
          onChange={handleFileSelect}
        />
      </div>

      {error && <InputError error={error} />}
    </div>
  )
}
