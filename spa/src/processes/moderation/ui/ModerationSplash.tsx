import { type WithTranslation, withTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { BottomButton, ButtonLink, LottieComponent } from "@/shared/ui"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import IconHeart from "@/shared/assets/icons/icon-heart.svg?react"
import ChevronIcon from "@/shared/assets/icons/icon-chevron-right.svg?react"
import { useQueryClient } from "@tanstack/react-query"
import { USER_KEYS } from "@/entities/user/api/queries.ts"
import AnimationData from "@/../public/animations/PD_em1.json"

const ModerationSplashBase = ({ t }: WithTranslation) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { triggerImpact } = useHapticFeedback()

  const handleContinue = async () => {
    triggerImpact("medium")
    await queryClient.invalidateQueries({
      queryKey: [USER_KEYS.user, USER_KEYS.me],
    })
    await navigate("/premium?initial=1")
  }

  return (
    <main className='flex flex-col h-full overflow-auto'>
      <div className='flex-1 flex flex-col items-center justify-center px-4'>
        <div className='mx-auto h-20 w-20 rounded-full bg-icon-gradient flex items-center justify-center mb-2'>
          <LottieComponent animationData={AnimationData} width={48} height={48} />
        </div>
        <h1 className='title1-bold text-center mb-1'>{t("moderationSplash.title")}</h1>
        <p className='caption1-medium text-center opacity-50'>
          {t("moderationSplash.description")}
        </p>
      </div>
      <div>
        <div className='mx-4 mb-[-16px] px'>
          <ButtonLink
            to='https://t.me/PlusDateNews'
            icon={<IconHeart />}
            rightElement={<ChevronIcon />}
          >
            {t("news")}
          </ButtonLink>
        </div>
        <BottomButton onClick={handleContinue} className='pb-safe-area-bottom static'>
          <span className='button-main'>{t("startWithLimitations")}</span>
        </BottomButton>
      </div>
    </main>
  )
}

export const ModerationSplash = withTranslation()(ModerationSplashBase)
