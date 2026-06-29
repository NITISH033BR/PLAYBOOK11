import { create } from "zustand";

interface UIState {
  betSlipOpen: boolean;
  toggleBetSlip: () => void;
  openBetSlip: () => void;
  closeBetSlip: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  walletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  walletModalTab: "deposit" | "withdraw";
  setWalletModalTab: (tab: "deposit" | "withdraw") => void;
}

export const useUIStore = create<UIState>((set) => ({
  betSlipOpen: false,
  toggleBetSlip: () => set((state) => ({ betSlipOpen: !state.betSlipOpen })),
  openBetSlip: () => set({ betSlipOpen: true }),
  closeBetSlip: () => set({ betSlipOpen: false }),
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  walletModalOpen: false,
  openWalletModal: () => set({ walletModalOpen: true }),
  closeWalletModal: () => set({ walletModalOpen: false }),
  walletModalTab: "deposit",
  setWalletModalTab: (tab) => set({ walletModalTab: tab }),
}));
