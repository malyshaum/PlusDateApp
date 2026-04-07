import { useTranslation, withTranslation, type WithTranslation } from "react-i18next"
import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { debounce } from "lodash"

import { PageLayout, PremiumIconAnimation } from "@/widgets"
import { useUser, useUserUpdatePreferences } from "@/entities/user/api/queries.ts"
import { RangeSlider, SelectorLink, Switcher } from "@/shared/ui"
import { Selector } from "@/shared/ui/Selector/Selector.tsx"
import IconMale from "@/shared/assets/icons/icon-male.svg?react"
import IconFemale from "@/shared/assets/icons/icon-female.svg?react"
import IconActivity from "@/shared/assets/icons/icon-activity-white.svg"
import IconEye from "@/shared/assets/icons/icon-eye-white.svg"
import IconLightining from "@/shared/assets/icons/icon-lightining.svg"
import { useUserLocation } from "@/entities/dictionary/hooks/useUserLocation.tsx"
import { getCityName } from "@/shared/lib/userHelpers.ts"
import { searchForOptions } from "@/shared/const/units.ts"
import { useNavigate } from "react-router-dom"
import IconClear from "@/shared/assets/icons/icon-clear-revert.svg"
import { useResetPreferences } from "@/entities/user/lib/useResetPreferences.ts"
import { useUserLocation as useUserLocationQuery } from "@/entities/dictionary/api/queries.ts"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import type { ESex } from "@/shared/types/common.ts"
import type { IUserSearchFor } from "@/entities/user/model/types.ts"

const SearchPreferencesPageBase = ({ t }: WithTranslation) => {
  const { triggerImpact } = useHapticFeedback()
  const { data: user } = useUser()
  const { mutate } = useUserUpdatePreferences()
  const { handleResetFilters } = useResetPreferences()
  const { getCurrentLocation, position } = useUserLocation()
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  const latestPreferencesRef = useRef(user?.search_preference)

  const { data: nearestCities } = useUserLocationQuery(
    {
      latitude: position?.coords.latitude ?? 0,
      longitude: position?.coords.longitude ?? 0,
    },
    {
      enabled: !!position,
    },
  )

  const [localFromAge, setLocalFromAge] = useState<number | null>(null)
  const [localToAge, setLocalToAge] = useState<number | null>(null)
  const [localFromHeight, setLocalFromHeight] = useState<number | null>(null)
  const [localToHeight, setLocalToHeight] = useState<number | null>(null)
  const [localGender, setLocalGender] = useState<string | null>(null)
  const [localSearchFor, setLocalSearchFor] = useState<string | null>(null)

  const currentFromAge = localFromAge ?? user?.search_preference?.from_age ?? 16
  const currentToAge = localToAge ?? user?.search_preference?.to_age ?? 99

  const currentFromHeight = localFromHeight ?? user?.search_preference?.height_from ?? 100
  const currentToHeight = localToHeight ?? user?.search_preference?.height_to ?? 220

  const currentGender = localGender ?? user?.search_preference?.gender
  const currentSearchFor = localSearchFor ?? user?.search_preference?.search_for

  useEffect(() => {
    if (user?.search_preference) {
      latestPreferencesRef.current = user.search_preference

      setLocalFromAge(null)
      setLocalToAge(null)
      setLocalFromHeight(null)
      setLocalToHeight(null)
      setLocalGender(null)
      setLocalSearchFor(null)
    }
  }, [user?.search_preference])

  const handleFieldUpdate = (field: string, value: string | boolean | number) => {
    if (!user?.id || !user.search_preference) return

    latestPreferencesRef.current = {
      ...(latestPreferencesRef.current ?? user.search_preference),
      [field]: value,
    }

    mutate(latestPreferencesRef.current)
  }

  const debouncedAgeUpdate = useMemo(
    () =>
      debounce((fromAge: number, toAge: number) => {
        if (!user?.id) return

        const updatedData = {
          ...user.search_preference,
          from_age: fromAge,
          to_age: toAge,
        }
        mutate(updatedData)
      }, 500),
    [user?.id, user?.search_preference, mutate],
  )

  const debouncedHeightUpdate = useMemo(
    () =>
      debounce((fromAge: number, toAge: number) => {
        if (!user?.id) return

        const updatedData = {
          ...user.search_preference,
          height_from: fromAge,
          height_to: toAge,
        }
        mutate(updatedData)
      }, 500),
    [user?.id, user?.search_preference, mutate],
  )

  const debouncedGenderUpdate = useMemo(
    () =>
      debounce((value: ESex) => {
        if (!user?.id) return

        const updatedData = {
          ...user.search_preference,
          gender: value,
        }
        mutate(updatedData)
      }, 500),
    [user?.id, user?.search_preference, mutate],
  )

  const debouncedSearchForUpdate = useMemo(
    () =>
      debounce((value: IUserSearchFor) => {
        if (!user?.id) return

        const updatedData = {
          ...user.search_preference,
          search_for: value,
        }
        mutate(updatedData)
      }, 500),
    [user?.id, user?.search_preference, mutate],
  )

  const handleGenderChange = (value: string) => {
    setLocalGender(value)

    debouncedGenderUpdate(value as ESex)
  }

  const handleSearchForChange = (value: string) => {
    setLocalSearchFor(value)

    debouncedSearchForUpdate(value as IUserSearchFor)
  }

  const handleWithPremiumChange = (value: boolean) => {
    handleFieldUpdate("with_premium", value)
  }
  const handleWithVideoChange = (value: boolean) => {
    handleFieldUpdate("with_video", value)
  }

  const handleAgeRangeChange = (ages: [number, number]) => {
    setLocalFromAge(ages[0])
    setLocalToAge(ages[1])

    debouncedAgeUpdate(ages[0], ages[1])
  }

  const handleHeightRangeChange = (heights: [number, number]) => {
    setLocalFromHeight(heights[0])
    setLocalToHeight(heights[1])

    debouncedHeightUpdate(heights[0], heights[1])
  }

  const handleNavigateToPremium = useCallback(() => {
    void navigate("/premium")
  }, [navigate])

  useEffect(() => {
    void getCurrentLocation()
  }, [getCurrentLocation])

  const nearestCity = nearestCities?.length ? nearestCities[0] : undefined

  const handleCityChange = () => {
    triggerImpact()
    if (nearestCity?.id) {
      handleFieldUpdate("city_id", nearestCity.id)
    }
  }

  if (!user) return null

  return (
    <PageLayout className='pb-safe-area-bottom'>
      <div className='flex justify-between items-center'>
        <h1 className='title1-bold mb-4'>{t("filters")}</h1>
        <button
          className='flex gap-1 items-center button-main text-accent'
          onClick={handleResetFilters}
        >
          <span>{t("clear")}</span>
          <img src={IconClear} alt='clear' />
        </button>
      </div>

      <div>
        <Selector
          name='gender'
          label={t("sex")}
          options={[
            { label: t("male"), value: "male", icon: IconMale },
            { label: t("female"), value: "female", icon: IconFemale },
          ]}
          value={currentGender as unknown as string}
          onChange={handleGenderChange}
          className='mb-4'
        />

        <Selector
          value={currentSearchFor}
          options={searchForOptions(t)}
          label={t("interests.searchFor")}
          onChange={handleSearchForChange}
          direction={"column"}
          className='mb-4'
        />

        <div>
          <SelectorLink
            to='/preferences/city'
            label={t("profile.yourCity")}
            value={
              user?.search_preference?.city
                ? getCityName(user.search_preference.city, i18n.language)
                : t("profile.choose")
            }
            className='mb-3'
          />

          {nearestCity && (
            <button className='body-regular mb-7' onClick={handleCityChange}>
              {t("searchPreferences.currentLocation")} -{" "}
              <span className='text-accent'>{getCityName(nearestCity, i18n.language)}</span>
            </button>
          )}

          <div className='h-[1px] bg-white-10 mb-4' />

          <div className='flex items-center gap-2 mb-2'>
            <span className='uppercase bg-[linear-gradient(89.26deg,#F5558F_-19.8%,#DB46BF_50.29%,#769DE5_100.46%)] bg-clip-text text-transparent'>
              {t("premiumFilters")}
            </span>
            <PremiumIconAnimation />
          </div>

          <Switcher
            value={user.search_preference?.with_video}
            onChange={handleWithVideoChange}
            disabled={!user?.is_premium}
            onDisabledClick={handleNavigateToPremium}
            label={t("searchPreferences.withVideo")}
            className='mb-4 text-white-50'
          />

          <Switcher
            value={user.search_preference?.with_premium}
            onChange={handleWithPremiumChange}
            disabled={!user?.is_premium}
            onDisabledClick={handleNavigateToPremium}
            label={t("searchPreferences.withPremium")}
            className='mb-4 text-white-50'
          />

          <div className='h-[1px] bg-white-10 mb-4' />

          <RangeSlider
            label={t("searchPreferences.ageRange")}
            min={16}
            max={99}
            value={[currentFromAge, currentToAge]}
            onInput={handleAgeRangeChange}
          />

          <div className='h-[1px] bg-white-10 mb-4' />

          <RangeSlider
            label={t("searchPreferences.heightRange")}
            min={100}
            max={220}
            value={[currentFromHeight, currentToHeight]}
            onInput={handleHeightRangeChange}
          />

          <div className='h-[1px] bg-white-10 mb-4' />

          <SelectorLink
            to='/preferences/activity'
            label={t("profile.industry")}
            value={
              user?.search_preference?.activity
                ? t(`activities.${user.search_preference.activity.title}`)
                : t("profile.choose")
            }
            icon={IconActivity}
            className='mt-2 !py-[14px]'
          />

          <SelectorLink
            to='/preferences/eye-color'
            label={t("profile.eyeColor")}
            value={
              user?.search_preference?.eye_color?.length
                ? `${user.search_preference.eye_color.length} ${t("profile.chosen")}`
                : t("profile.choose")
            }
            icon={IconEye}
            className='mt-2 !py-[14px]'
          />

          <SelectorLink
            to='/preferences/interests'
            label={t("interests.title")}
            value={
              user?.search_preference?.hobbies?.length
                ? `${user.search_preference.hobbies.length} ${t("profile.chosen")}`
                : t("profile.choose")
            }
            icon={IconLightining}
            className='mt-2'
          />
        </div>
      </div>
    </PageLayout>
  )
}

export const SearchPreferencesPage = withTranslation()(SearchPreferencesPageBase)
