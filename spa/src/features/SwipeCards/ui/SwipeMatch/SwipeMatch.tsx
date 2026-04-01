import type { IUser } from "@/entities/user/model/types.ts"
import { withTranslation, type WithTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { Button, LottieComponent } from "@/shared/ui"
import { useState, useCallback } from "react"
import AnimationData from "@/../public/animations/PD_em7.json"
import { matchAnimations, matchStyles } from "./animations"
import { useNavigate } from "react-router-dom"
import { useUser } from "@/entities/user/api/queries.ts"
import type { IChat } from "@/entities/chats"

interface Props extends WithTranslation {
  matchUser: IUser
  onClose: () => void
  closeButtonLabel?: string
  chat: IChat
}

const SwipeMatchBase = ({
  matchUser,
  t,
  onClose,
  chat,
  closeButtonLabel = "match.continueSwiping",
}: Props) => {
  const { data: user } = useUser()
  const image1 = user?.files?.find((f) => f.is_main && f.type === "image")?.url
  const image2 = matchUser?.files?.find((f) => f.is_main && f.type === "image")?.url
  const navigate = useNavigate()

  const [imagesLoaded, setImagesLoaded] = useState({ image1: false, image2: false })
  const allImagesLoaded = imagesLoaded.image1 && imagesLoaded.image2

  const handleImage1Load = useCallback(() => {
    setImagesLoaded((prev) => ({ ...prev, image1: true }))
  }, [])

  const handleImage2Load = useCallback(() => {
    setImagesLoaded((prev) => ({ ...prev, image2: true }))
  }, [])

  const handleImage1Error = useCallback(() => {
    onClose()
  }, [onClose])

  const handleImage2Error = useCallback(() => {
    onClose()
  }, [onClose])

  const startChat = () => {
    onClose()
    void navigate(`/chat/${chat.id}?userId=${matchUser?.id}`)
  }

  if (!image1 || !image2) {
    return null
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key='match-modal'
        initial={matchAnimations.modal.initial}
        animate={{ opacity: allImagesLoaded ? 1 : 0, scale: allImagesLoaded ? 1 : 0.9 }}
        exit={matchAnimations.modal.exit}
        transition={matchAnimations.modal.transition}
        style={{
          background: matchStyles.background,
        }}
        className='fixed inset-0 z-9999 w-full h-full'
      >
        <div className='h-full flex flex-col pb-8 px-4 relative'>
          <div
            className='absolute w-[600px] h-[600px] top-15 left-1/2 -translate-x-1/2 pointer-events-none'
            style={{
              background: matchStyles.glowBackground,
            }}
          ></div>
          <div className='flex-1 h-full flex flex-col justify-center'>
            <div className='h-[250px] relative'>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-2'>
                <LottieComponent animationData={AnimationData} height={80} width={80} />
              </div>

              <motion.img
                src={image1}
                alt=''
                onLoad={handleImage1Load}
                onError={handleImage1Error}
                className='w-[165px] h-[225px] rounded-[32px] overflow-hidden isolate absolute object-cover rotate-[-7deg]  left-6 z-1'
                initial={matchAnimations.userImage.initial}
                animate={matchAnimations.userImage.animate}
                transition={matchAnimations.userImage.transition}
              />
              <motion.img
                src={image2}
                alt=''
                onLoad={handleImage2Load}
                onError={handleImage2Error}
                className='w-[165px] h-[225px] rounded-[32px] overflow-hidden isolate absolute object-cover rotate-[10deg] right-8'
                initial={matchAnimations.matchUserImage.initial}
                animate={matchAnimations.matchUserImage.animate}
                transition={matchAnimations.matchUserImage.transition}
              />
            </div>
            <div className='pb-4 mt-8 text-center'>
              <div className='relative'>
                <motion.div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  text-[52px] leading-[100%] font-extrabold text-[rgba(139,38,62,0.6)] select-none pointer-events-none'
                  initial={matchAnimations.titleShadow1.initial}
                  animate={matchAnimations.titleShadow1.animate}
                  transition={matchAnimations.titleShadow1.transition}
                >
                  {t("match.title")}
                </motion.div>

                <motion.div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2  text-[52px] leading-[100%] font-extrabold text-[rgba(139,38,62,0.9)] select-none pointer-events-none'
                  initial={matchAnimations.titleShadow2.initial}
                  animate={matchAnimations.titleShadow2.animate}
                  transition={matchAnimations.titleShadow2.transition}
                >
                  {t("match.title")}
                </motion.div>

                <motion.div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-[52px] leading-[100%] font-extrabold select-none pointer-events-none'
                  style={matchStyles.titleGradient}
                  initial={matchAnimations.titleMain.initial}
                  animate={matchAnimations.titleMain.animate}
                  transition={matchAnimations.titleMain.transition}
                >
                  {t("match.title")}
                </motion.div>

                <motion.div
                  initial={matchAnimations.description.initial}
                  animate={matchAnimations.description.animate}
                  transition={matchAnimations.description.transition}
                  className='body-regular'
                >
                  {t("match.description", { name: matchUser.name })}
                </motion.div>
              </div>
            </div>
          </div>
          <motion.div
            initial={matchAnimations.buttons.initial}
            animate={matchAnimations.buttons.animate}
            transition={matchAnimations.buttons.transition}
            className='mt-10'
          >
            <Button type='button' size='L' onClick={startChat}>
              {t("match.startChat")}
            </Button>
            <Button size='L' appearance='white' className='mt-2' onClick={onClose}>
              {t(closeButtonLabel)}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const SwipeMatch = withTranslation()(SwipeMatchBase)
