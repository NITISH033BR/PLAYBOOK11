import { create } from "zustand";

interface Selection {
  matchId: string;
  marketId: string;
  oddsId: string;
  label: string;
  oddsValue: number;
  matchName: string;
  marketName: string;
  source?: "live" | "regular";
}

interface BetSlipState {
  selections: Selection[];
  stake: number;
  betType: "SINGLE" | "MULTI";
  addSelection: (selection: Selection) => void;
  removeSelection: (oddsId: string) => void;
  clearBetSlip: () => void;
  setStake: (stake: number) => void;
  setBetType: (type: "SINGLE" | "MULTI") => void;
}

export const useBetSlipStore = create<BetSlipState>((set) => ({
  selections: [],
  stake: 0,
  betType: "SINGLE",
  addSelection: (selection) =>
    set((state) => {
      const exists = state.selections.find((s) => s.oddsId === selection.oddsId);
      if (exists) return state;
      const newSelections = [...state.selections, selection];
      return {
        selections: newSelections,
        betType: newSelections.length > 1 ? "MULTI" : "SINGLE",
      };
    }),
  removeSelection: (oddsId) =>
    set((state) => {
      const newSelections = state.selections.filter((s) => s.oddsId !== oddsId);
      return {
        selections: newSelections,
        betType: newSelections.length > 1 ? "MULTI" : "SINGLE",
      };
    }),
  clearBetSlip: () => set({ selections: [], stake: 0, betType: "SINGLE" }),
  setStake: (stake) => set({ stake }),
  setBetType: (type) => set({ betType: type }),
}));
