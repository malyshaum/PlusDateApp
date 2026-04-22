import { useRef, useCallback, useState } from "react"
import Webcam from "react-webcam"
import { Button } from "@/shared/ui"
import { useTelegramBackButton } from "@/shared/lib/useTelegramBackButtonVisibility"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageBase64: string) => void
  videoConstraints?: MediaTrackConstraints
}

export const CameraModal = ({
  isOpen,
  onClose,
  onCapture,
  videoConstraints = {
    width: 120,
    height: 720,
    facingMode: "user",
  },
}: CameraModalProps) => {
  const webcamRef = useRef<Webcam>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const { triggerImpact } = useHapticFeedback()
  useTelegramBackButton(isOpen, onClose)

  const handleCameraError = useCallback((error: string | DOMException) => {
    setCameraError(typeof error === "string" ? error : "Camera access denied")
  }, [])

  const capture = useCallback(() => {
    if (webcamRef.current) {
      triggerImpact()
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        onCapture(imageSrc)
        onClose()
      }
    }
  }, [webcamRef, onCapture, onClose])

  const handleRetry = useCallback(() => {
    triggerImpact()
    setCameraError(null)
  }, [])

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 h-full w-full bg-dark-100 flex flex-col justify-center items-center pb-safe-area-bottom-with-button'>
      <div className='w-full h-full'>
        {cameraError ? (
          <div className='flex flex-col items-center justify-center h-full p-4 text-center'>
            <p className='text-white mb-4'>{cameraError}</p>
            <Button type='button' size='S' appearance='white' onClick={handleRetry}>
              Try again
            </Button>
          </div>
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat='image/jpeg'
            videoConstraints={videoConstraints}
            onUserMediaError={handleCameraError}
            mirrored={true}
            screenshotQuality={1}
            className='w-full h-full object-contain'
          />
        )}
      </div>

      {!cameraError && (
        <div
          className='absolute bottom-10 left-[50%] translate-x-[-50%] rounded-full border border-white-100 p-2 flex items-center justify-center'
          style={{ bottom: "calc(var(--tg-viewport-safe-area-inset-bottom, 40px) + 30px)" }}
        >
          <button
            type='button'
            onClick={capture}
            className='w-16 h-16 bg-white-100 rounded-full active:scale-95 transition-transform'
          />
        </div>
      )}
    </div>
  )
}
