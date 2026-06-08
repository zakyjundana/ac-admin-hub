import { useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "./auth";
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
  demoMode: boolean;
};

let state: State = {
  teknisi: initialTeknisi,
  orderan: initialOrderan,
  sparepart: initialSparePart,
  riwayat: initialRiwayat,
  feedback: initialFeedback,
  demoMode: true,
};

let currentUserId: string | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const store = {
  getState: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  // Check if we are currently in demo mode
  isDemoMode: () => {
    if (!isSupabaseConfigured() || !currentUserId) return true;
    // Default to live mode (false) unless user explicitly turned on demo mode
    const stored = typeof window !== "undefined" ? localStorage.getItem("coolservice_demo_mode_" + currentUserId) : null;
    return stored === "true";
  },

  // Set demo mode status
  setDemoMode: (enabled: boolean) => {
    if (currentUserId && typeof window !== "undefined") {
      localStorage.setItem("coolservice_demo_mode_" + currentUserId, enabled ? "true" : "false");
    }
    store.syncUser(currentUserId);
  },

  // Synchronize store with the logged-in user
  syncUser: (userId: string | null) => {
    currentUserId = userId;
    // isDemo = true only when: not configured, no userId, OR user explicitly set demo=true
    // A missing/null key means live mode for authenticated users
    const storedDemo = userId && typeof window !== "undefined" ? localStorage.getItem("coolservice_demo_mode_" + userId) : null;
    // If authenticated user has never set a preference, default to live mode and persist it
    if (userId && storedDemo === null && isSupabaseConfigured() && typeof window !== "undefined") {
      localStorage.setItem("coolservice_demo_mode_" + userId, "false");
    }
    const isDemo = !isSupabaseConfigured() || !userId || storedDemo === "true";

    if (isDemo) {
      // Demo mode or logged out -> use mock data
      state = {
        teknisi: initialTeknisi,
        orderan: initialOrderan,
        sparepart: initialSparePart,
        riwayat: initialRiwayat,
        feedback: initialFeedback,
        demoMode: true,
      };
    } else {
      // Registered user -> load from localStorage, otherwise start empty
      const saved = typeof window !== "undefined" ? localStorage.getItem("coolservice_store_" + userId) : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          state = {
            teknisi: parsed.teknisi || [],
            orderan: parsed.orderan || [],
            sparepart: parsed.sparepart || [],
            riwayat: parsed.riwayat || [],
            feedback: parsed.feedback || [],
            demoMode: false,
          };
        } catch {
          state = {
            teknisi: [],
            orderan: [],
            sparepart: [],
            riwayat: [],
            feedback: [],
            demoMode: false,
          };
        }
      } else {
        state = {
          teknisi: [],
          orderan: [],
          sparepart: [],
          riwayat: [],
          feedback: [],
          demoMode: false,
        };
      }
    }
    emit();
  },

  // Save helper
  saveState: () => {
    if (isSupabaseConfigured() && currentUserId && typeof window !== "undefined") {
      if (state.demoMode) return; // Block writing to live database when in Demo Mode
      localStorage.setItem(
        "coolservice_store_" + currentUserId,
        JSON.stringify({
          teknisi: state.teknisi,
          orderan: state.orderan,
          sparepart: state.sparepart,
          riwayat: state.riwayat,
          feedback: state.feedback,
        })
      );
    }
  },

  // ---- Orderan
  addOrderan: (o: Omit<Orderan, "id">) => {
    state = { ...state, orderan: [...state.orderan, { ...o, id: `o${Date.now()}`, sumber: "Admin" }] };
    store.saveState();
    emit();
  },
  addClientBooking: (shopId: string, o: Omit<Orderan, "id">) => {
    const booking = { ...o, id: `o${Date.now()}`, sumber: "Mandiri" as const };
    if (currentUserId === shopId) {
      state = { ...state, orderan: [...state.orderan, booking] };
      store.saveState();
      emit();
    } else {
      const saved = typeof window !== "undefined" ? localStorage.getItem("coolservice_store_" + shopId) : null;
      let shopState: any = { teknisi: [], orderan: [], sparepart: [], riwayat: [], feedback: [] };
      if (saved) {
        try {
          shopState = JSON.parse(saved);
        } catch {}
      }
      shopState.orderan = [...(shopState.orderan || []), booking];
      if (typeof window !== "undefined") {
        localStorage.setItem("coolservice_store_" + shopId, JSON.stringify(shopState));
      }
      if (!currentUserId || currentUserId === "demo-user-id" || shopId === "demo-user-id") {
        state = { ...state, orderan: [...state.orderan, booking] };
        emit();
      }
    }
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
    store.saveState();
    emit();
  },
  deleteOrderan: (id: string) => {
    state = { ...state, orderan: state.orderan.filter((o) => o.id !== id) };
    store.saveState();
    emit();
  },
  // ---- Teknisi
  addTeknisi: (t: Omit<Teknisi, "id">) => {
    state = { ...state, teknisi: [...state.teknisi, { ...t, id: `t${Date.now()}` }] };
    store.saveState();
    emit();
  },
  deleteTeknisi: (id: string) => {
    state = { ...state, teknisi: state.teknisi.filter((t) => t.id !== id) };
    store.saveState();
    emit();
  },
  // ---- Spare Part
  addSparePart: (s: Omit<SparePart, "id">) => {
    state = { ...state, sparepart: [...state.sparepart, { ...s, id: `sp${Date.now()}` }] };
    store.saveState();
    emit();
  },
  updateSparePart: (id: string, patch: Partial<SparePart>) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    store.saveState();
    emit();
  },
  deleteSparePart: (id: string) => {
    state = { ...state, sparepart: state.sparepart.filter((s) => s.id !== id) };
    store.saveState();
    emit();
  },
  adjustStok: (id: string, delta: number) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) =>
        s.id === id ? { ...s, stok: Math.max(0, s.stok + delta) } : s,
      ),
    };
    store.saveState();
    emit();
  },
  // ---- Riwayat
  addRiwayat: (r: Omit<RiwayatKerusakan, "id">) => {
    state = { ...state, riwayat: [...state.riwayat, { ...r, id: `r${Date.now()}` }] };
    store.saveState();
    emit();
  },
  deleteRiwayat: (id: string) => {
    state = { ...state, riwayat: state.riwayat.filter((r) => r.id !== id) };
    store.saveState();
    emit();
  },
  // ---- Feedback
  addFeedback: (f: Omit<Feedback, "id">) => {
    state = { ...state, feedback: [...state.feedback, { ...f, id: `f${Date.now()}` }] };
    store.saveState();
    emit();
  },
  deleteFeedback: (id: string) => {
    state = { ...state, feedback: state.feedback.filter((f) => f.id !== id) };
    store.saveState();
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
