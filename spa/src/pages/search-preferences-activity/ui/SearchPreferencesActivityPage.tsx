import { type WithTranslation, withTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { BottomButton, Input, RadioText } from "@/shared/ui"
import IconSearch from "@/shared/assets/icons/icon-search.svg"
import { PageLayout } from "@/widgets"
import { useUser, useUserUpdatePreferences } from "@/entities/user/api/queries.ts"
import { useActivities } from "@/entities/dictionary/api/queries.ts"
import type { IActivity } from "@/entities/dictionary/model/types.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

const SearchPreferencesActivityPageBase = ({ t }: WithTranslation) => {
  const { triggerImpact } = useHapticFeedback()
  const navigate = useNavigate()
  const { data: user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedActivity, setSelectedActivity] = useState<IActivity | null>(() => {
    if (!user?.search_preference?.activity_id) return null

    return {
      id: user.search_preference.activity_id,
      title: "",
    }
  })

  const { mutate, isPending } = useUserUpdatePreferences({
    onSuccess: () => {
      void navigate(-1)
    },
  })

  const { data: activities } = useActivities(t)

  const filteredActivities: IActivity[] = useMemo(() => {
    if (!activities) return []
    if (!searchTerm.trim()) return activities

    return activities.filter((activity) =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [activities, searchTerm])

  const handleActivitySelect = (activity: IActivity) => {
    setSelectedActivity((prev) => (prev?.id === activity.id ? null : activity))
  }

  const handleSubmit = () => {
    if (!user?.search_preference) return
    triggerImpact()
    mutate({
      ...user.search_preference,
      activity_id: selectedActivity?.id,
    })
  }

  return (
    <PageLayout className='flex flex-col'>
      <h1 className='title1-bold'>{t("searchPreferences.activity")}</h1>
      <div className='pt-4 flex flex-col gap-4 h-full flex-1 overflow-auto'>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("search")}
          childrenBefore={<img src={IconSearch} alt='icon-search' />}
        />

        <div className='flex-1 pb-4 h-full overflow-auto no-scrollbar pb-safe-area-bottom-with-button'>
          <ul className='flex-1 flex flex-col gap-1 overflow-hidden'>
            {filteredActivities.map((activity) => (
              <RadioText
                key={activity.id}
                isSelected={selectedActivity?.id === activity.id}
                dimmed={!!selectedActivity}
                onClick={() => handleActivitySelect(activity)}
                icon={`/activities/${activity.key}.svg`}
                title={activity.title}
              />
            ))}
          </ul>
        </div>
      </div>
      <BottomButton onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
        <span className='button-main'>{t("save")}</span>
      </BottomButton>
    </PageLayout>
  )
}

export const SearchPreferencesActivityPage = withTranslation()(SearchPreferencesActivityPageBase)
