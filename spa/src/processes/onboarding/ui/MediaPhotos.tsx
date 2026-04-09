import { useRef, useState, type ChangeEvent } from "react"
import classNames from "classnames"
import { SwiperSlide } from "swiper/react"
import IconPlus from "@/shared/assets/icons/icon-plus.svg"
import IconClose from "@/shared/assets/icons/icon-close.svg"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { Carousel } from "@/shared/ui"
import type { IUserFile } from "@/entities/user/model/types.ts"
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from "@/shared/const/constants.ts"
import { useTranslation } from "react-i18next"

interface MediaPhotosProps {
  photos: (IUserFile | undefined)[]
  onUpload: (files: File[], startIndex: number) => Promise<void>
  onDelete: (fileId: number) => Promise<void>
  className?: string
}

const validatePhoto = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "validation.image_type_invalid"
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return "validation.image_size_too_large"
  }
  return null
}

const checkDuplicates = (
  newFile: File,
  existingPhotos: (IUserFile | undefined)[],
  otherFiles: File[],
): boolean => {
  const isDuplicateInServer = existingPhotos.some(
    (photo) => photo && photo.filepath === newFile.name,
  )

  const isDuplicateInBatch = otherFiles.some(
    (f) =>
      f.name === newFile.name && f.size === newFile.size && f.lastModified === newFile.lastModified,
  )

  return isDuplicateInServer || isDuplicateInBatch
}

export const MediaPhotos = ({ photos, onUpload, onDelete, className }: MediaPhotosProps) => {
  const { triggerImpact } = useHapticFeedback()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set())
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({})

  const emptySlots = photos.filter((p) => !p).length

  const handleSlotClick = (index: number) => {
    if (photos[index]) return

    triggerImpact("medium")
    setActiveSlot(index)
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[index]
      return newErrors
    })
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (activeSlot === null) return

    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: Record<number, string> = {}

    const emptySlotIndices: number[] = []
    for (let i = 0; i < photos.length; i++) {
      const idx = (activeSlot + i) % photos.length
      if (!photos[idx]) {
        emptySlotIndices.push(idx)
      }
    }

    for (let i = 0; i < Math.min(fileArray.length, emptySlotIndices.length); i++) {
      const file = fileArray[i]
      const slotIndex = emptySlotIndices[i]

      const error = validatePhoto(file)
      if (error) {
        errors[slotIndex] = error
        continue
      }

      const isDuplicate = checkDuplicates(file, photos, fileArray.slice(0, i))
      if (isDuplicate) {
        errors[slotIndex] = "validation.duplicate_photos"
        continue
      }

      validFiles.push(file)
    }

    setValidationErrors(errors)

    if (validFiles.length > 0) {
      const startIndex = emptySlotIndices[0]

      const uploading = new Set(emptySlotIndices.slice(0, validFiles.length))
      setUploadingSlots((prev) => new Set([...prev, ...uploading]))

      try {
        await onUpload(validFiles, startIndex)
        setUploadingSlots((prev) => {
          const updated = new Set(prev)
          uploading.forEach((idx) => updated.delete(idx))
          return updated
        })
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          uploading.forEach((idx) => delete newErrors[idx])
          return newErrors
        })
      } catch (err) {
        console.error(err)
        setUploadingSlots((prev) => {
          const updated = new Set(prev)
          uploading.forEach((idx) => updated.delete(idx))
          return updated
        })

        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          uploading.forEach((idx) => {
            newErrors[idx] = "Upload failed"
          })
          return newErrors
        })
      }
    }

    e.target.value = ""
    setActiveSlot(null)
  }

  const handleDelete = async (index: number, fileId: number) => {
    try {
      await onDelete(fileId)
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[index]
        return newErrors
      })
    } catch (err) {
      console.error(err)
      setValidationErrors((prev) => ({
        ...prev,
        [index]: "Delete failed",
      }))
    }
  }

  return (
    <div className={className}>
      <Carousel
        enablePagination={false}
        slidesPerView='auto'
        spaceBetween={10}
        className='!h-[244px]'
      >
        {[0, 1, 2].map((index) => {
          const photo = photos[index]
          const isUploading = uploadingSlots.has(index)
          const error = validationErrors[index]

          return (
            <SwiperSlide key={index} className='!w-[168px]'>
              <div
                onClick={() => handleSlotClick(index)}
                className={classNames(
                  "h-full w-full relative aspect-square bg-white-10 border border-white-10 border-dashed rounded-[8px] flex items-center justify-center overflow-hidden",
                  {
                    "border-dark-100 border-solid": photo,
                    "!border-attention border-solid !border-2": error,
                    "cursor-pointer": !photo && !isUploading,
                    "cursor-not-allowed": isUploading,
                  },
                )}
              >
                {photo ? (
                  <>
                    <img
                      src={photo.url}
                      alt='Selected photo'
                      className='w-full h-full object-cover rounded-[8px]'
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(index, photo.id)
                      }}
                      className='absolute top-2 right-2'
                      disabled={isUploading}
                    >
                      <img src={IconClose} alt='Remove photo' className='w-4 h-4' />
                    </button>
                  </>
                ) : isUploading ? (
                  <div className='loader' />
                ) : (
                  <div className='flex flex-col items-center'>
                    <img src={IconPlus} alt='icon-plus' />
                  </div>
                )}
              </div>
            </SwiperSlide>
          )
        })}
      </Carousel>

      {Object.keys(validationErrors).length > 0 && (
        <div className='mt-2 flex flex-col gap-1'>
          {Object.entries(validationErrors).map(([index, error]) => (
            <span key={index} className='text-attention caption1-medium'>
              {t(error)}
            </span>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple={emptySlots > 1}
        className='hidden'
        onChange={handleFileChange}
      />
    </div>
  )
}
