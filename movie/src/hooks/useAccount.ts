import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const SESSION_ID_STORAGE_KEY = "movie_session_id";
const USER_CHANGED_EVENT = "user-changed";

export type StoredUser = {
  id?: number;
  name: string;
  email?: string;
  role?: string;
};

const readStoredUser = (): StoredUser | null => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    const parsed: unknown = JSON.parse(storedUser);
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;

    const name = typeof rec.name === "string" ? rec.name : "";
    if (!name) return null;

    const id = typeof rec.id === "number" ? rec.id : undefined;
    const email = typeof rec.email === "string" ? rec.email : undefined;
    const role = typeof rec.role === "string" ? rec.role : undefined;

    return { id, name, email, role };
  } catch {
    return null;
  }
};

const getOrCreateSessionId = () => {
  const existing = localStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(SESSION_ID_STORAGE_KEY, next);
  return next;
};

type CustomerBooking = {
  bookingId: number;
  ma_giao_dich: string;
  createdAt: string;
  total: number;
  status: number;
  holdExpiresAt: string | null;
  movieTitle: string | null;
  cinemaName: string | null;
  roomName: string | null;
  startTime: string | null;
  seats: string[];
};

const normalizeBookings = (raw: unknown): CustomerBooking[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;

      const bookingId = typeof rec.bookingId === "number" ? rec.bookingId : null;
      const ma = typeof rec.ma_giao_dich === "string" ? rec.ma_giao_dich : null;
      const createdAt = typeof rec.createdAt === "string" ? rec.createdAt : null;

      if (bookingId == null || ma == null || createdAt == null) return null;

      const seats = Array.isArray(rec.seats) ? rec.seats.filter((x): x is string => typeof x === "string") : [];

      return {
        bookingId,
        ma_giao_dich: ma,
        createdAt,
        total: Number(rec.total ?? 0),
        status: Number(rec.status ?? 0),
        holdExpiresAt: typeof rec.holdExpiresAt === "string" ? rec.holdExpiresAt : null,
        movieTitle: typeof rec.movieTitle === "string" ? rec.movieTitle : null,
        cinemaName: typeof rec.cinemaName === "string" ? rec.cinemaName : null,
        roomName: typeof rec.roomName === "string" ? rec.roomName : null,
        startTime: typeof rec.startTime === "string" ? rec.startTime : null,
        seats,
      } satisfies CustomerBooking;
    })
    .filter(Boolean) as CustomerBooking[];
};

export const useAccount = () => {
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const [user, setUser] = useState<StoredUser | null>(() => readStoredUser());
  const isCustomer = user?.role === "customer" && typeof user.id === "number";

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    window.addEventListener("storage", sync);
    window.addEventListener(USER_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(USER_CHANGED_EVENT, sync);
    };
  }, []);

  const loadProfile = async () => {
    if (!isCustomer || !user?.id) return;

    try {
      setLoading(true);
      setPageError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/api/customers/${user.id}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPageError(data?.error || "Không thể tải thông tin tài khoản.");
        return;
      }

      setProfileForm({
        name: typeof data?.name === "string" ? data.name : user.name,
        email: typeof data?.email === "string" ? data.email : user.email ?? "",
      });
    } catch {
      setPageError("Không thể kết nối để tải thông tin tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!isCustomer || !user?.id) return;

    try {
      setBookingsLoading(true);
      setBookingsError(null);

      const res = await fetch(`${API_BASE_URL}/api/customers/${user.id}/bookings`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBookingsError(data?.error || "Không thể tải danh sách vé.");
        return;
      }

      setBookings(normalizeBookings(data));
    } catch {
      setBookingsError("Không thể kết nối để tải danh sách vé.");
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCustomer) return;
    void loadProfile();
    void loadBookings();
  }, [isCustomer]);

  const handleUpdateProfile = async () => {
    if (!isCustomer || !user?.id) return;

    try {
      setLoading(true);
      setPageError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/api/customers/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileForm.name, email: profileForm.email }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPageError(data?.error || "Cập nhật thông tin không thành công.");
        return;
      }

      const nextUser: StoredUser = { ...user, name: profileForm.name, email: profileForm.email };
      localStorage.setItem("user", JSON.stringify(nextUser));
      window.dispatchEvent(new Event(USER_CHANGED_EVENT));
      setUser(nextUser);

      setMessage("Cập nhật thông tin thành công.");
    } catch {
      setPageError("Không thể kết nối để cập nhật thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isCustomer || !user?.id) return;

    setPasswordMessage(null);
    setMessage(null);

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordMessage("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    try {
      setLoading(true);
      setPageError(null);

      const res = await fetch(`${API_BASE_URL}/api/customers/${user.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordMessage(data?.error || "Đổi mật khẩu không thành công.");
        return;
      }

      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setMessage("Đổi mật khẩu thành công.");
    } catch {
      setPasswordMessage("Không thể kết nối để đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBooking = async (bookingId: number) => {
    if (!isCustomer || !user?.id) return;

    try {
      setLoading(true);
      setBookingsError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ bookingId, customerId: user.id }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBookingsError(data?.error || "Thanh toán không thành công.");
        return;
      }

      setMessage("Thanh toán thành công.");
      await loadBookings();
    } catch {
      setBookingsError("Không thể kết nối để thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!isCustomer || !user?.id) return;

    try {
      setLoading(true);
      setBookingsError(null);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ customerId: user.id }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBookingsError(data?.error || "Hủy vé không thành công.");
        return;
      }

      setMessage("Hủy vé thành công.");
      await loadBookings();
    } catch {
      setBookingsError("Không thể kết nối để hủy vé.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("vi-VN");
  };

  const statusLabel = (s: number) => (s === 1 ? "Đã thanh toán" : s === 2 ? "Đã hủy" : "Chờ thanh toán");

  return {
    user,
    isCustomer,
    loading,
    pageError,
    message,
    profileForm,
    setProfileForm,
    passwordForm,
    setPasswordForm,
    passwordMessage,
    bookings,
    bookingsLoading,
    bookingsError,
    handleUpdateProfile,
    handleChangePassword,
    handlePayBooking,
    handleCancelBooking,
    formatDateTime,
    statusLabel,
  };
};
