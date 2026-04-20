import { useCallback, useState } from "react";
import type { BasePrice } from "../types/admin";

type JsonValue = unknown;

const readErrorMessage = async (res: Response) => {
  const data: JsonValue = await res.json().catch(() => null);
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return `HTTP ${res.status}`;
};

export const useAdminTicketPrices = (apiBaseUrl: string) => {
  const [ticketPrices, setTicketPrices] = useState<BasePrice[]>([]);

  const loadTicketPrices = useCallback(async () => {
    const res = await fetch(`${apiBaseUrl}/api/admin/bang-gia`);
    if (!res.ok) throw new Error(await readErrorMessage(res));

    const data = await res.json().catch(() => []);
    setTicketPrices(Array.isArray(data) ? (data as BasePrice[]) : []);
  }, [apiBaseUrl]);

  const saveTicketPrice = useCallback(
    async (payload: {
      id_gia?: number;
      ten_bang_gia: string;
      gia_tien: number;
      loai_ngay: string;
      hieu_luc_tu: string | null;
      hieu_luc_den: string | null;
    }) => {
      const isUpdate = Boolean(payload.id_gia);
      const url = isUpdate
        ? `${apiBaseUrl}/api/admin/bang-gia/${payload.id_gia}`
        : `${apiBaseUrl}/api/admin/bang-gia`;

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten_bang_gia: payload.ten_bang_gia,
          gia_tien: payload.gia_tien,
          loai_ngay: payload.loai_ngay,
          hieu_luc_tu: payload.hieu_luc_tu,
          hieu_luc_den: payload.hieu_luc_den,
        }),
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));
      return (await res.json()) as BasePrice;
    },
    [apiBaseUrl]
  );

  const deleteTicketPrice = useCallback(
    async (id: number) => {
      const res = await fetch(`${apiBaseUrl}/api/admin/bang-gia/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readErrorMessage(res));
    },
    [apiBaseUrl]
  );

  return {
    ticketPrices,
    loadTicketPrices,
    saveTicketPrice,
    deleteTicketPrice,
  };
};