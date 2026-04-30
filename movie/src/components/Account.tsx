import { useNavigate } from "react-router-dom";
import Background from "./layout/Background";
import Header from "./layout/Header";
import { useAccount } from "../hooks/useAccount";

const Account = () => {
  const navigate = useNavigate();
  const {
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
  } = useAccount();

  return (
    <Background>
      <Header />
      <main className="login-page">
        <section className="account" aria-labelledby="account-title">
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
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <h3 style={{ margin: 0 }}>Vé của tôi</h3>
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