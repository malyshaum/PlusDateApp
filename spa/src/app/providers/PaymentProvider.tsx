import React, { useEffect, useRef } from "react"
import { PaymentSuccess, PaymentError } from "@/widgets"
import { usePaymentModal } from "@/shared/lib/usePaymentModal"
import { useHapticFeedback } from "@/shared/lib/useHapticFeedback.tsx"
import { useLocation, useNavigate } from "react-router-dom"
import { useLaunchParams } from "@tma.js/sdk-react"

interface Props {
  children: React.ReactNode
}

export function PaymentProvider({ children }: Props) {
  const { showPaymentModal } = usePaymentModal()
  const navigate = useNavigate()
  const location = useLocation()
  const { modalType, closePaymentModal } = usePaymentModal()
  const { triggerImpact } = useHapticFeedback()
  const launchParams = useLaunchParams()
  const hasProcessedPayment = useRef(false)

  const handleDismissModal = () => {
    closePaymentModal()
    triggerImpact()
  }

  useEffect(() => {
    const tgWebAppStartParam = launchParams.tgWebAppStartParam

    if (!tgWebAppStartParam || hasProcessedPayment.current) return

    const isPaymentParam =
      tgWebAppStartParam === "payment_success" || tgWebAppStartParam === "payment_error"

    if (!isPaymentParam) {
      return
    }

    const processedKey = `processed_${tgWebAppStartParam}`
    if (sessionStorage.getItem(processedKey)) {
      return
    }

    if (location.pathname !== "/profile") {
      void navigate("/profile", { replace: true })
      return
    }

    hasProcessedPayment.current = true
    sessionStorage.setItem(processedKey, "true")

    if (tgWebAppStartParam === "payment_success") {
      showPaymentModal("success")
    } else if (tgWebAppStartParam === "payment_error") {
      showPaymentModal("error")
    }
  }, [launchParams.tgWebAppStartParam, navigate, location.pathname, showPaymentModal])

  return (
    <>
      {children}
      <PaymentSuccess isOpen={modalType === "success"} onOutsideClick={handleDismissModal} />
      <PaymentError isOpen={modalType === "error"} onOutsideClick={handleDismissModal} />
    </>
  )
}
