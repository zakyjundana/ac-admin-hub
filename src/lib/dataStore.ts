import { useSyncExternalStore } from "react";
import {
  initialOrderan,
  initialTeknisi,
  type Orderan,
  type Teknisi,
} from "./mockData";

// Simple in-memory store (will be replaced with Supabase later).
type State = { teknisi: Teknisi[]; orderan: Orderan[] };

let state: State = { teknisi: initialTeknisi, orderan: initialOrderan };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const store = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  addOrderan: (o: Omit<Orderan, "id">) => {
    state = { ...state, orderan: [...state.orderan, { ...o, id: `o${Date.now()}` }] };
    emit();
  },
  updateOrderan: (id: string, patch: Partial<Orderan>) => {
    state = {
      ...state,
      orderan: state.orderan.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    emit();
  },
  deleteOrderan: (id: string) => {
    state = { ...state, orderan: state.orderan.filter((o) => o.id !== id) };
    emit();
  },
  addTeknisi: (t: Omit<Teknisi, "id">) => {
    state = { ...state, teknisi: [...state.teknisi, { ...t, id: `t${Date.now()}` }] };
    emit();
  },
  deleteTeknisi: (id: string) => {
    state = { ...state, teknisi: state.teknisi.filter((t) => t.id !== id) };
    emit();
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
