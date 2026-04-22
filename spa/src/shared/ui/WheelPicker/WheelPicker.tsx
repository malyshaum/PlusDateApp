import React, { useRef, useEffect, useCallback, type CSSProperties } from "react"
import { debounce } from "lodash"
import classNames from "classnames"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"

export interface WheelPickerOption {
  value: string
  label: string
}

export interface CustomWheelPickerProps {
  options: WheelPickerOption[]
  value: string
  onChange: (value: string) => void
  visibleCount?: number
  itemHeight?: number
  itemSuffix?: string
}

interface ItemStyle extends CSSProperties {
  opacity: number
  transform: string
}

export const CustomWheelPicker: React.FC<CustomWheelPickerProps> = ({
  options = [],
  value,
  onChange,
  visibleCount = 5,
  itemHeight = 50,
  itemSuffix,
}) => {
  const { triggerImpact } = useHapticFeedback()

  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const scrollYRef = useRef<number>(0)
  const lastEmittedValueRef = useRef<string>(value)
  const isTouchingRef = useRef<boolean>(false)
  const isInitialized = useRef<boolean>(false)
  const lastHapticIndexRef = useRef<number>(-1)

  const calculateItemStyle = useCallback(
    (index: number, scrollY: number): ItemStyle => {
      const currentScrollIndex = scrollY / itemHeight
      const distance = Math.abs(index - currentScrollIndex)

      const maxDistance = 3
      const normalizedDistance = Math.min(distance / maxDistance, 1)

      const falloff = 1 - Math.pow(normalizedDistance, 1)

      const opacity = Math.max(0.2, falloff)
      const scale = Math.max(0.2, 0.2 + falloff * 0.7)

      return {
        opacity,
        transform: `scale(${scale}) translateZ(0)`,
      }
    },
    [itemHeight],
  )

  const updateItemStyles = useCallback(
    (scrollY: number) => {
      itemsRef.current.forEach((item, index) => {
        if (item) {
          const style = calculateItemStyle(index, scrollY)
          item.style.opacity = style.opacity.toString()
          item.style.transform = style.transform
        }
      })
    },
    [calculateItemStyle],
  )

  const debouncedOnChange = useCallback(debounce(onChange, 100), [onChange])

  const handleOnChange = useCallback(
    (scrollTop: number) => {
      const index = Math.round(scrollTop / itemHeight)
      const clampedIndex = Math.max(0, Math.min(index, options.length - 1))

      if (options[clampedIndex]) {
        const newValue = options[clampedIndex].value
        if (newValue !== lastEmittedValueRef.current) {
          lastEmittedValueRef.current = newValue
          debouncedOnChange(newValue)
        }
      }
    },
    [itemHeight, options, debouncedOnChange],
  )

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop
      scrollYRef.current = scrollTop

      updateItemStyles(scrollTop)

      const currentIndex = Math.round(scrollTop / itemHeight)
      if (currentIndex !== lastHapticIndexRef.current && isInitialized.current) {
        lastHapticIndexRef.current = currentIndex
        triggerImpact("light")
      }

      if (!isTouchingRef.current) {
        handleOnChange(scrollTop)
      }
    },
    [updateItemStyles, handleOnChange, itemHeight, triggerImpact],
  )

  const handleTouchStart = useCallback(() => {
    isTouchingRef.current = true
  }, [])

  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false
    handleOnChange(scrollYRef.current)
  }, [handleOnChange])

  useEffect(() => {
    const index = options.findIndex((opt) => opt.value === value)
    lastEmittedValueRef.current = value

    if (index !== -1) {
      const targetScroll = index * itemHeight
      if (containerRef.current) {
        containerRef.current.scrollTop = targetScroll
        scrollYRef.current = targetScroll
        updateItemStyles(targetScroll)
        setTimeout(() => {
          isInitialized.current = true
        }, 100)
      }
    }
  }, [])

  return (
    <div className='relative w-full'>
      <div
        className='relative overflow-hidden'
        style={{ height: `${itemHeight * visibleCount}px` }}
      >
        <div
          ref={containerRef}
          className={classNames("h-full overflow-y-auto scroll-auto overscroll-contain", {
            "snap-y snap-mandatory scroll-smooth ": isInitialized.current,
          })}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ height: `${((visibleCount - 1) / 2) * itemHeight}px` }} />

          {options.map((option, index) => {
            const initialStyle = calculateItemStyle(index, 0)
            return (
              <div
                key={option.value}
                ref={(el) => {
                  itemsRef.current[index] = el
                }}
                className='flex items-center justify-center  select-none title2-bold'
                style={{
                  height: `${itemHeight}px`,
                  scrollSnapAlign: "center",
                  willChange: "transform, opacity",
                  ...initialStyle,
                }}
              >
                <span>
                  {option.label} {itemSuffix}
                </span>
              </div>
            )
          })}

          <div style={{ height: `${((visibleCount - 1) / 2) * itemHeight}px` }} />
        </div>
      </div>
    </div>
  )
}
