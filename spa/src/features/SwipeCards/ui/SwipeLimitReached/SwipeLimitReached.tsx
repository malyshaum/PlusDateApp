import { Button } from "@/shared/ui"
import { useNavigate } from "react-router-dom"
import { withTranslation, type WithTranslation } from "react-i18next"

export const SwipeLimitReachedBase = ({ t }: WithTranslation) => {
  const navigate = useNavigate()

  const navigateToPremium = () => {
    void navigate("/premium")
  }

  return (
    <div className='flex items-center flex-col justify-center h-full'>
      <div className='text-center mb-4 text-[75px]'>😭</div>
      <div className='text-center mb-4'>
        <p className='title1-bold mb-1'>{t("swipe.limitReached.title")}</p>
        <p className='caption1-medium text-white-50'>{t("swipe.limitReached.subtitle")}</p>
      </div>
      <Button size='L' onClick={navigateToPremium}>
        {t("swipe.limitReached.getPremium")}
      </Button>
    </div>
  )
}

export const SwipeLimitReached = withTranslation()(SwipeLimitReachedBase)
