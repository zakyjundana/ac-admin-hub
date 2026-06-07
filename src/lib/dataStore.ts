import { useSyncExternalStore } from "react";
import {
  initialOrderan,
  initialTeknisi,
  initialSparePart,
  initialRiwayat,
  initialFeedback,
  type Orderan,
  type Teknisi,
  type SparePart,
  type RiwayatKerusakan,
  type Feedback,
} from "./mockData";

// Simple in-memory store (will be replaced with Supabase later).
type State = {
  teknisi: Teknisi[];
  orderan: Orderan[];
  sparepart: SparePart[];
  riwayat: RiwayatKerusakan[];
  feedback: Feedback[];
};

let state: State = {
  teknisi: initialTeknisi,
  orderan: initialOrderan,
  sparepart: initialSparePart,
  riwayat: initialRiwayat,
  feedback: initialFeedback,
};
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const store = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  // ---- Orderan
  addOrderan: (o: Omit<Orderan, "id">) => {
    state = { ...state, orderan: [...state.orderan, { ...o, id: `o${Date.now()}` }] };
    emit();
  },
  updateOrderan: (id: string, patch: Partial<Orderan>) => {
    const prev = state.orderan.find((o) => o.id === id);
    state = {
      ...state,
      orderan: state.orderan.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    // Saat status berubah menjadi "Selesai" → catat ke riwayat otomatis & kurangi stok spare part
    if (prev && patch.status === "Selesai" && prev.status !== "Selesai") {
      // Kurangi stok spare part
      const partsToReduce = patch.spare_parts !== undefined ? patch.spare_parts : prev.spare_parts;
      if (partsToReduce && partsToReduce.length > 0) {
        state = {
          ...state,
          sparepart: state.sparepart.map((sp) => {
            const match = partsToReduce.find((p) => p.sparepart_id === sp.id);
            return match ? { ...sp, stok: Math.max(0, sp.stok - match.qty) } : sp;
          }),
        };
      }

      const exists = state.riwayat.some((r) => r.orderan_id === id);
      if (!exists) {
        const r: RiwayatKerusakan = {
          id: `r${Date.now()}`,
          orderan_id: id,
          nama_pelanggan: prev.nama_pelanggan,
          no_wa: prev.no_wa,
          alamat: prev.alamat,
          jenis_kerusakan: prev.keluhan,
          tindakan: "—",
          teknisi_id: prev.teknisi_id,
          tanggal_selesai: new Date().toISOString().slice(0, 10),
          garansi_hari: prev.garansi_hari ?? 30,
          biaya: 0,
        };
        state = { ...state, riwayat: [...state.riwayat, r] };
      }
    }
    emit();
  },
  deleteOrderan: (id: string) => {
    state = { ...state, orderan: state.orderan.filter((o) => o.id !== id) };
    emit();
  },
  // ---- Teknisi
  addTeknisi: (t: Omit<Teknisi, "id">) => {
    state = { ...state, teknisi: [...state.teknisi, { ...t, id: `t${Date.now()}` }] };
    emit();
  },
  deleteTeknisi: (id: string) => {
    state = { ...state, teknisi: state.teknisi.filter((t) => t.id !== id) };
    emit();
  },
  // ---- Spare Part
  addSparePart: (s: Omit<SparePart, "id">) => {
    state = { ...state, sparepart: [...state.sparepart, { ...s, id: `sp${Date.now()}` }] };
    emit();
  },
  updateSparePart: (id: string, patch: Partial<SparePart>) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    emit();
  },
  deleteSparePart: (id: string) => {
    state = { ...state, sparepart: state.sparepart.filter((s) => s.id !== id) };
    emit();
  },
  adjustStok: (id: string, delta: number) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) =>
        s.id === id ? { ...s, stok: Math.max(0, s.stok + delta) } : s,
      ),
    };
    emit();
  },
  // ---- Riwayat
  addRiwayat: (r: Omit<RiwayatKerusakan, "id">) => {
    state = { ...state, riwayat: [...state.riwayat, { ...r, id: `r${Date.now()}` }] };
    emit();
  },
  deleteRiwayat: (id: string) => {
    state = { ...state, riwayat: state.riwayat.filter((r) => r.id !== id) };
    emit();
  },
  // ---- Feedback
  addFeedback: (f: Omit<Feedback, "id">) => {
    state = { ...state, feedback: [...state.feedback, { ...f, id: `f${Date.now()}` }] };
    emit();
  },
  deleteFeedback: (id: string) => {
    state = { ...state, feedback: state.feedback.filter((f) => f.id !== id) };
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
