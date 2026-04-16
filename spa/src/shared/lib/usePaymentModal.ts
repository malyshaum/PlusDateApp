import { create } from "zustand"

type PaymentModalType = "success" | "error" | null

interface PaymentModalStore {
  modalType: PaymentModalType
  showPaymentModal: (type: "success" | "error") => void
  closePaymentModal: () => void
}

export const usePaymentModal = create<PaymentModalStore>((set) => ({
  modalType: null,
  showPaymentModal: (type) => set({ modalType: type }),
  closePaymentModal: () => set({ modalType: null }),
}))