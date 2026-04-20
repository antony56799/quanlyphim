import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Background from "./layout/Background";
import Header from "./layout/Header";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const SESSION_ID_STORAGE_KEY = "movie_session_id";
const USER_CHANGED_EVENT = "user-changed";

type StoredUser = {
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

const Account = () => {
  const navigate = useNavigate();
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

  return (
    <Background>
      <Header />
      <main className="login-page">
        <section className="login-window" aria-labelledby="account-title">
          <div className="login-form" style={{ paddingTop: 42 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 id="account-title" style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
                Tài khoản
              </h2>
              <button type="button" className="tab-button tab-button--light" onClick={() => navigate(-1)}>
                Quay lại
              </button>
            </div>

            {!user && (
              <div className="movies-feedback" style={{ marginTop: 16 }}>
                Bạn chưa đăng nhập. Vui lòng đăng nhập để xem vé và cập nhật thông tin.
                <div style={{ marginTop: 12 }}>
                  <button type="button" className="login-form__submit" onClick={() => navigate("/login")}>
                    Đăng nhập
                  </button>
                </div>
              </div>
            )}

            {user && !isCustomer && (
              <div className="movies-feedback" style={{ marginTop: 16 }}>
                Trang này chỉ dành cho tài khoản khách hàng.
              </div>
            )}

            {isCustomer && (
              <>
                {pageError && (
                  <div className="movies-feedback movies-feedback--error" style={{ marginTop: 16 }}>
                    {pageError}
                  </div>
                )}
                {message && (
                  <div className="movies-feedback" style={{ marginTop: 16 }}>
                    {message}
                  </div>
                )}

                <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Thông tin cá nhân</h3>

                  <div className="login-form__group">
                    <label htmlFor="profile-name">Họ tên</label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>

                  <div className="login-form__group">
                    <label htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>

                  <button type="button" className="login-form__submit" onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu thông tin"}
                  </button>
                </div>

                <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Đổi mật khẩu</h3>

                  <div className="login-form__group">
                    <label htmlFor="old-password">Mật khẩu hiện tại</label>
                    <input
                      id="old-password"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                    />
                  </div>

                  <div className="login-form__group">
                    <label htmlFor="new-password">Mật khẩu mới</label>
                    <input
                      id="new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    />
                  </div>

                  <div className="login-form__group">
                    <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>

                  {passwordMessage && <div className="movies-feedback movies-feedback--error">{passwordMessage}</div>}

                  <button type="button" className="login-form__submit" onClick={handleChangePassword} disabled={loading}>
                    {loading ? "Đang đổi..." : "Đổi mật khẩu"}
                  </button>
                </div>

                <div style={{ marginTop: 26, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Vé của tôi</h3>
                    <button type="button" className="tab-button tab-button--light" onClick={loadBookings} disabled={bookingsLoading}>
                      Làm mới
                    </button>
                  </div>

                  {bookingsLoading && <div className="movies-feedback">Đang tải vé...</div>}
                  {!bookingsLoading && bookingsError && (
                    <div className="movies-feedback movies-feedback--error">{bookingsError}</div>
                  )}
                  {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                    <div className="movies-feedback">Chưa có vé nào gắn với tài khoản này.</div>
                  )}

                  {!bookingsLoading && !bookingsError && bookings.length > 0 && (
                    <div style={{ display: "grid", gap: 10 }}>
                      {bookings.map((b) => (
                        <div key={b.bookingId} className="movies-feedback" style={{ textAlign: "left" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{b.movieTitle ?? "Booking"}</div>
                              <div>Mã: {b.ma_giao_dich}</div>
                              <div>Trạng thái: {statusLabel(b.status)}</div>
                              <div>Ngày tạo: {formatDateTime(b.createdAt)}</div>
                              {b.startTime ? <div>Suất: {formatDateTime(b.startTime)}</div> : null}
                              <div>
                                Ghế: {b.seats.length > 0 ? b.seats.join(", ") : "-"} • Tổng:{" "}
                                {Number(b.total || 0).toLocaleString("vi-VN")} đ
                              </div>
                              {b.status === 0 && b.holdExpiresAt ? <div>Hạn giữ chỗ: {formatDateTime(b.holdExpiresAt)}</div> : null}
                            </div>

                            {b.status === 0 && (
                              <div style={{ display: "flex", gap: 8, alignItems: "start" }}>
                                <button
                                  type="button"
                                  className="login-form__submit"
                                  style={{ width: "auto", minHeight: 42, padding: "0 18px" }}
                                  onClick={() => handlePayBooking(b.bookingId)}
                                  disabled={loading}
                                >
                                  Thanh toán
                                </button>
                                <button
                                  type="button"
                                  className="tab-button tab-button--light"
                                  onClick={() => handleCancelBooking(b.bookingId)}
                                  disabled={loading}
                                >
                                  Hủy vé
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </Background>
  );
};

export default Account;