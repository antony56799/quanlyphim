import { useCallback, useState } from "react";
import type { Showtime } from "../types/admin";

type JsonValue = unknown;

const readErrorMessage = async (res: Response) => {
  const data: JsonValue = await res.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return `HTTP ${res.status}`;
};

export const useAdminShowtimes = (apiBaseUrl: string) => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);

  const loadShowtimes = useCallback(
    async (cinemaId: number | "all", roomId: number | "all", signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (cinemaId !== "all") params.set("id_rap", String(cinemaId));
      if (roomId !== "all") params.set("id_pc", String(roomId));

      const url = `${apiBaseUrl}/api/admin/suat-chieu${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(await readErrorMessage(res));

      const data = await res.json().catch(() => []);
      setShowtimes(Array.isArray(data) ? (data as Showtime[]) : []);
    },
    [apiBaseUrl]
  );

  const saveShowtime = useCallback(
    async (payload: {
      id_sc?: number;
      id_phim: number;
      id_pc: number;
      gio_bat_dau: string;
      gio_ket_thuc: string;
      id_gia: number;
    }) => {
      const isUpdate = Boolean(payload.id_sc);
      const url = isUpdate
        ? `${apiBaseUrl}/api/admin/suat-chieu/${payload.id_sc}`
        : `${apiBaseUrl}/api/admin/suat-chieu`;

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_phim: payload.id_phim,
          id_pc: payload.id_pc,
          gio_bat_dau: payload.gio_bat_dau,
          gio_ket_thuc: payload.gio_ket_thuc,
          id_gia: payload.id_gia,
        }),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));
      return (await res.json()) as Showtime;
    },
    [apiBaseUrl]
  );

  const deleteShowtime = useCallback(
    async (id: number) => {
      const res = await fetch(`${apiBaseUrl}/api/admin/suat-chieu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readErrorMessage(res));
    },
    [apiBaseUrl]
  );

  const bulkCreateShowtimes = useCallback(
    async (payload: { id_phim: number; id_pc: number; tu_ngay: string; den_ngay: string; gio_bat_dau: string }) => {
      const res = await fetch(`${apiBaseUrl}/api/admin/suat-chieu/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));
      return (await res.json()) as { requested: number; inserted: number; skipped_no_price: number; skipped_overlap: number };
    },
    [apiBaseUrl]
  );

  return {
    showtimes,
    loadShowtimes,
    saveShowtime,
    deleteShowtime,
    bulkCreateShowtimes,
  };
};