import { useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "./auth";
import { supabase } from "./supabase";
import {
  initialOrderan,
  initialTeknisi,
  initialSparePart,
  initialRiwayat,
  initialFeedback,
  initialPengeluaran,
  type Orderan,
  type Teknisi,
  type SparePart,
  type RiwayatKerusakan,
  type Feedback,
  type Pengeluaran,
} from "./mockData";

// Simple in-memory store backed by Supabase & LocalStorage cache.
type State = {
  teknisi: Teknisi[];
  orderan: Orderan[];
  sparepart: SparePart[];
  riwayat: RiwayatKerusakan[];
  feedback: Feedback[];
  pengeluaran: Pengeluaran[];
  demoMode: boolean;
};

let state: State = {
  teknisi: initialTeknisi,
  orderan: initialOrderan,
  sparepart: initialSparePart,
  riwayat: initialRiwayat,
  feedback: initialFeedback,
  pengeluaran: initialPengeluaran,
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
  syncUser: async (userId: string | null) => {
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
        pengeluaran: initialPengeluaran,
        demoMode: true,
      };
      emit();
    } else {
      // Registered user -> load from Supabase database with fallback to localStorage
      let loadedFromDb = false;
      if (isSupabaseConfigured() && userId) {
        try {
          // Fetch existing tables
          const [
            { data: dbTeknisi, error: errTeknisi },
            { data: dbOrderan, error: errOrderan },
            { data: dbSparepart, error: errSparepart },
            { data: dbRiwayat, error: errRiwayat },
            { data: dbFeedback, error: errFeedback }
          ] = await Promise.all([
            supabase.from("ac_teknisi").select("*").eq("user_id", userId),
            supabase.from("ac_orderan").select("*").eq("user_id", userId),
            supabase.from("ac_spareparts").select("*").eq("user_id", userId),
            supabase.from("ac_riwayat").select("*").eq("user_id", userId),
            supabase.from("ac_feedback").select("*").eq("user_id", userId),
          ]);

          // Fetch ac_pengeluaran with graceful error handling
          let dbPengeluaran: any[] = [];
          try {
            const { data, error } = await supabase.from("ac_pengeluaran").select("*").eq("user_id", userId);
            if (!error && data) {
              dbPengeluaran = data;
            }
          } catch (e) {
            console.warn("Could not load ac_pengeluaran table from Supabase. It might not be migrated yet:", e);
          }

          if (!errTeknisi && !errOrderan && !errSparepart && !errRiwayat && !errFeedback) {
            state = {
              teknisi: dbTeknisi || [],
              orderan: dbOrderan || [],
              sparepart: dbSparepart || [],
              riwayat: dbRiwayat || [],
              feedback: dbFeedback || [],
              pengeluaran: dbPengeluaran || [],
              demoMode: false,
            };
            loadedFromDb = true;
          } else {
            console.warn("Supabase fetch errors:", { errTeknisi, errOrderan, errSparepart, errRiwayat, errFeedback });
          }
        } catch (dbErr) {
          console.error("Failed to fetch from Supabase:", dbErr);
        }
      }

      if (!loadedFromDb) {
        // Fallback to localStorage
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
              pengeluaran: parsed.pengeluaran || [],
              demoMode: false,
            };
          } catch {
            state = {
              teknisi: [],
              orderan: [],
              sparepart: [],
              riwayat: [],
              feedback: [],
              pengeluaran: [],
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
            pengeluaran: [],
            demoMode: false,
          };
        }
      }
      emit();
    }
  },

  // Save helper to persist to localStorage (serves as local cache)
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
          pengeluaran: state.pengeluaran,
        })
      );
    }
  },

  // ---- Orderan
  addOrderan: async (o: Omit<Orderan, "id">) => {
    const id = `o${Date.now()}`;
    const newOrder = { ...o, id, sumber: "Admin" as const };
    state = { ...state, orderan: [...state.orderan, newOrder] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_orderan").insert({ ...newOrder, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert order to Supabase:", err);
      }
    }
  },
  addClientBooking: async (shopId: string, o: Omit<Orderan, "id">) => {
    const booking = { ...o, id: `o${Date.now()}`, sumber: "Mandiri" as const };
    if (currentUserId === shopId) {
      state = { ...state, orderan: [...state.orderan, booking] };
      store.saveState();
      emit();
      if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
        try {
          const { insertClientBooking } = await import("./api/config.functions");
          await insertClientBooking({
            data: {
              shopId: currentUserId,
              booking: {
                nama_pelanggan: booking.nama_pelanggan,
                no_wa: booking.no_wa,
                alamat: booking.alamat,
                wilayah: booking.wilayah,
                keluhan: booking.keluhan,
                status: booking.status,
                teknisi_id: booking.teknisi_id,
                tanggal: booking.tanggal,
                jam: booking.jam,
              }
            }
          });
        } catch (err) {
          console.error("Error inserting booking via server function:", err);
          throw err;
        }
      }
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

      if (isSupabaseConfigured()) {
        try {
          const { insertClientBooking } = await import("./api/config.functions");
          await insertClientBooking({
            data: {
              shopId,
              booking: {
                nama_pelanggan: booking.nama_pelanggan,
                no_wa: booking.no_wa,
                alamat: booking.alamat,
                wilayah: booking.wilayah,
                keluhan: booking.keluhan,
                status: booking.status,
                teknisi_id: booking.teknisi_id,
                tanggal: booking.tanggal,
                jam: booking.jam,
              }
            }
          });
        } catch (err) {
          console.error("Error inserting booking to other shop via server function:", err);
          throw err;
        }
      }

      if (!currentUserId || currentUserId === "demo-user-id" || shopId === "demo-user-id") {
        state = { ...state, orderan: [...state.orderan, booking] };
        emit();
      }
    }
  },
  updateOrderan: async (id: string, patch: Partial<Orderan>) => {
    const prev = state.orderan.find((o) => o.id === id);
    state = {
      ...state,
      orderan: state.orderan.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    
    // Saat status berubah menjadi "Selesai" → catat ke riwayat otomatis & kurangi stok spare part
    if (prev && patch.status === "Selesai" && prev.status !== "Selesai") {
      const partsToReduce = patch.spare_parts !== undefined ? patch.spare_parts : prev.spare_parts;
      if (partsToReduce && partsToReduce.length > 0) {
        state = {
          ...state,
          sparepart: state.sparepart.map((sp) => {
            const match = partsToReduce.find((p) => p.sparepart_id === sp.id);
            return match ? { ...sp, stok: Math.max(0, sp.stok - match.qty) } : sp;
          }),
        };
        if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
          for (const sp of partsToReduce) {
            const targetSp = state.sparepart.find(x => x.id === sp.sparepart_id);
            if (targetSp) {
              const { error } = await supabase.from("ac_spareparts").update({ stok: targetSp.stok }).eq("id", targetSp.id).eq("user_id", currentUserId);
              if (error) {
                console.error("Error updating stock:", error);
              }
            }
          }
        }
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
        if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
          const { error } = await supabase.from("ac_riwayat").insert({ ...r, user_id: currentUserId });
          if (error) {
            console.error("Error inserting riwayat:", error);
          }
        }
      }
    }
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_orderan").update(patch).eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to update order in Supabase:", err);
      }
    }
  },
  deleteOrderan: async (id: string) => {
    state = { ...state, orderan: state.orderan.filter((o) => o.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_orderan").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete order from Supabase:", err);
      }
    }
  },
  // ---- Teknisi
  addTeknisi: async (t: Omit<Teknisi, "id">) => {
    const id = `t${Date.now()}`;
    const newTeknisi = { ...t, id };
    state = { ...state, teknisi: [...state.teknisi, newTeknisi] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_teknisi").insert({ ...newTeknisi, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert technician to Supabase:", err);
      }
    }
  },
  deleteTeknisi: async (id: string) => {
    state = { ...state, teknisi: state.teknisi.filter((t) => t.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_teknisi").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete technician from Supabase:", err);
      }
    }
  },
  // ---- Spare Part
  addSparePart: async (s: Omit<SparePart, "id">) => {
    const id = `sp${Date.now()}`;
    const newSp = { ...s, id };
    state = { ...state, sparepart: [...state.sparepart, newSp] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_spareparts").insert({ ...newSp, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert sparepart to Supabase:", err);
      }
    }
  },
  updateSparePart: async (id: string, patch: Partial<SparePart>) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_spareparts").update(patch).eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to update sparepart in Supabase:", err);
      }
    }
  },
  deleteSparePart: async (id: string) => {
    state = { ...state, sparepart: state.sparepart.filter((s) => s.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_spareparts").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete sparepart from Supabase:", err);
      }
    }
  },
  adjustStok: async (id: string, delta: number) => {
    state = {
      ...state,
      sparepart: state.sparepart.map((s) =>
        s.id === id ? { ...s, stok: Math.max(0, s.stok + delta) } : s,
      ),
    };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        const target = state.sparepart.find((s) => s.id === id);
        if (target) {
          await supabase.from("ac_spareparts").update({ stok: target.stok }).eq("id", id).eq("user_id", currentUserId);
        }
      } catch (err) {
        console.error("Failed to adjust stock in Supabase:", err);
      }
    }
  },
  // ---- Riwayat
  addRiwayat: async (r: Omit<RiwayatKerusakan, "id">) => {
    const id = `r${Date.now()}`;
    const newRiwayat = { ...r, id };
    state = { ...state, riwayat: [...state.riwayat, newRiwayat] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_riwayat").insert({ ...newRiwayat, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert riwayat to Supabase:", err);
      }
    }
  },
  deleteRiwayat: async (id: string) => {
    state = { ...state, riwayat: state.riwayat.filter((r) => r.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_riwayat").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete riwayat from Supabase:", err);
      }
    }
  },
  // ---- Feedback
  addFeedback: async (f: Omit<Feedback, "id">) => {
    const id = `f${Date.now()}`;
    const newFeedback = { ...f, id };
    state = { ...state, feedback: [...state.feedback, newFeedback] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_feedback").insert({ ...newFeedback, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert feedback to Supabase:", err);
      }
    }
  },
  deleteFeedback: async (id: string) => {
    state = { ...state, feedback: state.feedback.filter((f) => f.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_feedback").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete feedback from Supabase:", err);
      }
    }
  },
  // ---- Pengeluaran
  addPengeluaran: async (ex: Omit<Pengeluaran, "id">) => {
    const id = `ex${Date.now()}`;
    const newEx = { ...ex, id };
    state = { ...state, pengeluaran: [...state.pengeluaran, newEx] };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_pengeluaran").insert({ ...newEx, user_id: currentUserId });
      } catch (err) {
        console.error("Failed to insert pengeluaran to Supabase:", err);
      }
    }
  },
  deletePengeluaran: async (id: string) => {
    state = { ...state, pengeluaran: state.pengeluaran.filter((ex) => ex.id !== id) };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_pengeluaran").delete().eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to delete pengeluaran from Supabase:", err);
      }
    }
  },
  updatePengeluaran: async (id: string, patch: Partial<Pengeluaran>) => {
    state = {
      ...state,
      pengeluaran: state.pengeluaran.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    };
    store.saveState();
    emit();

    if (isSupabaseConfigured() && currentUserId && !state.demoMode) {
      try {
        await supabase.from("ac_pengeluaran").update(patch).eq("id", id).eq("user_id", currentUserId);
      } catch (err) {
        console.error("Failed to update pengeluaran in Supabase:", err);
      }
    }
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}
