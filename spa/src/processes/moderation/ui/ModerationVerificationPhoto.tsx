import type { IUserFile } from "@/entities/user/model/types.ts"
import { PhotoPreview } from "@/shared/ui/FileInput/FilePhotoPreview.tsx"
import { useTranslation } from "react-i18next"
import { InputError } from "@/shared/ui/InputError/InputError.tsx"

interface Props {
  file: IUserFile
  replacedFile: File | null
  error?: string
}

export const ModerationVerificationPhoto = ({ file, replacedFile, error }: Props) => {
  const { t } = useTranslation()

  return (
    <>
      <div className='flex flex-col'>
        <div className='relative h-[252px] w-[176px] rounded-[8px] overflow-hidden'>
          {replacedFile ? (
            <PhotoPreview
              file={replacedFile}
              alt='Verification photo'
              className='w-full h-full object-cover'
            />
          ) : (
            <img src={file.url} alt='Verification photo' className='w-full h-full object-cover' />
          )}

          <div className='absolute inset-0 top-auto py-[6px] px-3 overflow-hidden subtitle-medium bg-grey-50 text-center'>
            {t("selfie")}
          </div>
        </div>

        {error && <InputError error={error} />}
      </div>
    </>
  )
}
