import React, { useState } from "react";
import type { AdminMovie, Genre, Cinema, Room, RoomType, Showtime, BasePrice, SeatType } from "../../types/admin";

interface RightFormProps {
  activeSubTab: "movies" | "genres" | "rooms" | "showtimes" | "prices";
  activeRoomTab: "cinemas" | "rooms" | "roomTypes";
  selectedMovie: AdminMovie | null;
  selectedGenre: Genre | null;
  selectedCinema: Cinema | null;
  selectedRoom: Room | null;
  selectedRoomType: RoomType | null;
  selectedShowtime: Showtime | null;
  selectedPrice: BasePrice | null;
  formData: {
    ten_phim: string;
    mo_ta: string;
    thoi_luong: number;
    ngay_khoi_chieu: string;
    poster_url: string;
    trailer_url: string;
    genres: string[];
    directors: string[];
    actors: string[];
  };
  genreFormData: { ten_the_loai: string };
  cinemaFormData: { diachi: string; sdt_rap: string; trang_thai: boolean };
  roomFormData: { ten_phong: string; suc_chua: number; trang_thai: boolean; id_loai: number };
  roomTypeFormData: { ten_loai: string; gia: number };
  genreOptions: Genre[];
  roomTypes: RoomType[];
  movies: AdminMovie[];
  cinemas: Cinema[];
  rooms: Room[];
  seatTypes: SeatType[];
  ticketPrices: BasePrice[];
  showtimeFormData: {
    id_phim: number;
    id_rap: number;
    id_pc: number;
    id_gia: number;
    gio_bat_dau: string;
    gio_ket_thuc: string;
  };
  priceFormData: {
    ten_bang_gia: string;
    gia_tien: number;
    loai_ngay: string;
    hieu_luc_tu: string | null;
    hieu_luc_den: string | null;
  };
  onFormChange: (field: string, value: string | number | string[]) => void;
  onGenreFormChange: (field: string, value: string) => void;
  onCinemaFormChange: (field: string, value: string | boolean) => void;
  onRoomFormChange: (field: string, value: string | number | boolean) => void;
  onRoomTypeFormChange: (field: string, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenreSubmit: (e: React.FormEvent) => void;
  onCinemaSubmit: (e: React.FormEvent) => void;
  onRoomSubmit: (e: React.FormEvent) => void;
  onRoomTypeSubmit: (e: React.FormEvent) => void;
  onResetForm: () => void;
  onResetGenreForm: () => void;
  onResetCinemaForm: () => void;
  onResetRoomForm: () => void;
  onResetRoomTypeForm: () => void;
  loadGenres: () => void;
  onShowtimeFormChange: (field: string, value: string | number) => void;
  onShowtimeSubmit: (e: React.FormEvent) => void;
  onResetShowtimeForm: () => void;
  onShowtimeBulkCreate: (payload: { tu_ngay: string; den_ngay: string; gio_bat_dau: string }) => void;
  onPriceFormChange: (field: string, value: string | number) => void;
  onPriceSubmit: (e: React.FormEvent) => void;
  onResetPriceForm: () => void;
}

export const RightForm: React.FC<RightFormProps> = ({

  activeSubTab,
  activeRoomTab,
  selectedMovie,
  selectedGenre,
  selectedCinema,
  selectedRoom,
  selectedRoomType,
  formData,
  genreFormData,
  cinemaFormData,
  roomFormData,
  roomTypeFormData,
  genreOptions,
  roomTypes,
  onFormChange,
  onGenreFormChange,
  onCinemaFormChange,
  onRoomFormChange,
  onRoomTypeFormChange,
  onSubmit,
  onGenreSubmit,
  onCinemaSubmit,
  onRoomSubmit,
  onRoomTypeSubmit,
  onResetForm,
  onResetGenreForm,
  onResetCinemaForm,
  onResetRoomForm,
  onResetRoomTypeForm,
  loadGenres,
  selectedShowtime,
  selectedPrice,
  movies,
  cinemas,
  rooms,
  seatTypes,
  ticketPrices,
  showtimeFormData,
  priceFormData,
  onShowtimeFormChange,
  onShowtimeSubmit,
  onResetShowtimeForm,
  onShowtimeBulkCreate,
  onPriceFormChange,
  onPriceSubmit,
  onResetPriceForm,
}) => {
  const [autoEndTimeEnabled, setAutoEndTimeEnabled] = useState(true);
  const [bulkEnabled, setBulkEnabled] = useState(false);
  const [bulkFromDate, setBulkFromDate] = useState("");
  const [bulkToDate, setBulkToDate] = useState("");
  const [bulkStartTime, setBulkStartTime] = useState("19:00");

  if (activeSubTab === "prices") {
    return (
      <aside className="right-form-aside">
        <h3 className="form-title">{selectedPrice ? "Chỉnh sửa bảng giá" : "Thêm bảng giá mới"}</h3>
        <form onSubmit={onPriceSubmit} className="admin-form">
          <div className="form-group">
            <label>Tên bảng giá</label>
            <input type="text" required value={priceFormData.ten_bang_gia} onChange={(e) => onPriceFormChange("ten_bang_gia", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Giá tiền (VNĐ)</label>
            <input type="number" min="0" required value={priceFormData.gia_tien} onChange={(e) => onPriceFormChange("gia_tien", parseInt(e.target.value || "0"))} />
          </div>
          <div className="form-group">
            <label>Loại ngày</label>
            <select value={priceFormData.loai_ngay} onChange={(e) => onPriceFormChange("loai_ngay", e.target.value)}>
              <option value="THUONG">Thường</option>
              <option value="CUOI_TUAN">Cuối tuần</option>
              <option value="LE">Lễ</option>
              <option value="TET">Tết</option>
              <option value="SUAT_KHUYA">Suất khuya</option>
              <option value="KHUYEN_MAI">Khuyến mãi</option>
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Hiệu lực từ</label>
              <input
                type="date"
                value={priceFormData.hieu_luc_tu || ""}
                onChange={(e) => onPriceFormChange("hieu_luc_tu", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Hiệu lực đến</label>
              <input
                type="date"
                value={priceFormData.hieu_luc_den || ""}
                onChange={(e) => onPriceFormChange("hieu_luc_den", e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">{selectedPrice ? "Cập nhật" : "Thêm mới"}</button>
            {selectedPrice && <button type="button" onClick={onResetPriceForm} className="cancel-button">Hủy</button>}
          </div>
        </form>
      </aside>
    );
  }

  if (activeSubTab === "showtimes") {
    const roomsForCinema = rooms.filter((r) => r.id_rap === showtimeFormData.id_rap);
    const selectedRoomForPrice = rooms.find((r) => r.id_pc === showtimeFormData.id_pc) || null;
    const selectedRoomTypeForPrice = selectedRoomForPrice
      ? roomTypes.find((t) => t.id_loai === selectedRoomForPrice.id_loai) || null
      : null;
    const roomSurcharge = selectedRoomTypeForPrice?.gia ?? 0;

    const parseDateOnly = (raw?: string | null) => {
      if (!raw) return null;
      const d = new Date(String(raw));
      if (Number.isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const startForPrice = showtimeFormData.gio_bat_dau ? new Date(showtimeFormData.gio_bat_dau) : null;
    const computedLoaiNgay = startForPrice && !Number.isNaN(startForPrice.getTime())
      ? (startForPrice.getDay() === 0 || startForPrice.getDay() === 6 ? "LE" : "THUONG")
      : null;

    const isEffective = (price: BasePrice, d: Date) => {
      const from = parseDateOnly(price.hieu_luc_tu ?? null);
      const to = parseDateOnly(price.hieu_luc_den ?? null);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };

    const effectivePrices = (() => {
      if (!computedLoaiNgay || !startForPrice || Number.isNaN(startForPrice.getTime())) return ticketPrices;
      const dateOnly = new Date(startForPrice.getFullYear(), startForPrice.getMonth(), startForPrice.getDate());
      return ticketPrices
        .filter((p) => (p.loai_ngay || "THUONG") === computedLoaiNgay)
        .filter((p) => isEffective(p, dateOnly));
    })();

    const selectedBasePrice = ticketPrices.find((p) => p.id_gia === showtimeFormData.id_gia) || null;
    const baseAmount = selectedBasePrice?.gia_tien ?? 0;

    return (
      <aside className="right-form-aside">
        <h3 className="form-title">{selectedShowtime ? "Chỉnh sửa suất chiếu" : "Thêm suất chiếu"}</h3>
        <form onSubmit={onShowtimeSubmit} className="admin-form">
          <div className="form-group">
            <label>Phim</label>
            <select
              value={showtimeFormData.id_phim || ""}
              onChange={(e) => {
                const nextMovieId = parseInt(e.target.value);
                onShowtimeFormChange("id_phim", nextMovieId);

                if (!autoEndTimeEnabled) return;
                const start = showtimeFormData.gio_bat_dau;
                const movie = movies.find((m) => m.id_phim === nextMovieId) || null;
                if (!start || !movie) return;

                const startDate = new Date(start);
                if (Number.isNaN(startDate.getTime())) return;

                const endDate = new Date(startDate.getTime() + (movie.thoi_luong || 0) * 60_000);
                const pad2 = (n: number) => String(n).padStart(2, "0");
                const endStr = `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}T${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`;
                onShowtimeFormChange("gio_ket_thuc", endStr);
              }}
              required
            >
              <option value="">Chọn phim</option>
              {movies.map((m) => (
                <option key={m.id_phim} value={m.id_phim}>
                  {m.ten_phim}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Rạp</label>
            <select
              value={showtimeFormData.id_rap || ""}
              onChange={(e) => {
                const idRap = parseInt(e.target.value);
                onShowtimeFormChange("id_rap", idRap);
                onShowtimeFormChange("id_pc", 0);
              }}
              required
            >
              <option value="">Chọn rạp</option>
              {cinemas.map((c) => (
                <option key={c.id_rap} value={c.id_rap}>
                  {c.diachi || `Rạp ${c.id_rap}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Phòng chiếu</label>
            <select
              value={showtimeFormData.id_pc || ""}
              onChange={(e) => onShowtimeFormChange("id_pc", parseInt(e.target.value))}
              required
              disabled={!showtimeFormData.id_rap}
            >
              <option value="">Chọn phòng</option>
              {roomsForCinema.map((r) => (
                <option key={r.id_pc} value={r.id_pc}>
                  {r.ten_phong || `Phòng ${r.id_pc}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={autoEndTimeEnabled}
                onChange={(e) => setAutoEndTimeEnabled(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Tự tính giờ kết thúc theo thời lượng phim
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Giờ bắt đầu</label>
              <input
                type="datetime-local"
                value={showtimeFormData.gio_bat_dau}
                onChange={(e) => {
                  const nextStart = e.target.value;
                  onShowtimeFormChange("gio_bat_dau", nextStart);

                  if (!autoEndTimeEnabled) return;
                  const movie = movies.find((m) => m.id_phim === showtimeFormData.id_phim) || null;
                  if (!movie) return;

                  const startDate = new Date(nextStart);
                  if (Number.isNaN(startDate.getTime())) return;

                  const endDate = new Date(startDate.getTime() + (movie.thoi_luong || 0) * 60_000);
                  const pad2 = (n: number) => String(n).padStart(2, "0");
                  const endStr = `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}T${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`;
                  onShowtimeFormChange("gio_ket_thuc", endStr);

                  const timePart = nextStart.length >= 16 ? nextStart.slice(11, 16) : "";
                  if (timePart && bulkStartTime === "19:00") setBulkStartTime(timePart);
                  const datePart = nextStart.length >= 10 ? nextStart.slice(0, 10) : "";
                  if (datePart && !bulkFromDate) setBulkFromDate(datePart);
                  if (datePart && !bulkToDate) setBulkToDate(datePart);
                }}
                required
              />
            </div>
            <div className="form-group">
              <label>Giờ kết thúc</label>
              <input type="datetime-local" value={showtimeFormData.gio_ket_thuc} readOnly />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={bulkEnabled}
                onChange={(e) => setBulkEnabled(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              Tạo suất chiếu hàng loạt
            </label>
          </div>

          {bulkEnabled ? (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label>Từ ngày</label>
                  <input type="date" value={bulkFromDate} onChange={(e) => setBulkFromDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Đến ngày</label>
                  <input type="date" value={bulkToDate} onChange={(e) => setBulkToDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Khung giờ bắt đầu (HH:mm)</label>
                <input type="time" value={bulkStartTime} onChange={(e) => setBulkStartTime(e.target.value)} />
              </div>
              <button
                type="button"
                className="submit-button"
                onClick={() => {
                  if (!showtimeFormData.id_phim || !showtimeFormData.id_pc) {
                    alert("Vui lòng chọn phim và phòng chiếu trước");
                    return;
                  }
                  if (!bulkFromDate || !bulkToDate || !bulkStartTime) {
                    alert("Vui lòng nhập đủ khoảng ngày và khung giờ");
                    return;
                  }
                  onShowtimeBulkCreate({ tu_ngay: bulkFromDate, den_ngay: bulkToDate, gio_bat_dau: bulkStartTime });
                }}
              >
                Tạo hàng loạt
              </button>
            </>
          ) : null}

          <div className="form-group">
            <label>Giá cơ bản</label>
            <select
              value={showtimeFormData.id_gia || ""}
              onChange={(e) => onShowtimeFormChange("id_gia", parseInt(e.target.value))}
              required
            >
              <option value="">Chọn giá cơ bản</option>
              {effectivePrices.map((p) => (
                <option key={p.id_gia} value={p.id_gia}>
                  {p.gia_tien.toLocaleString("vi-VN")} đ - {p.ten_bang_gia} ({p.loai_ngay || "THUONG"})
                </option>
              ))}
            </select>
            {computedLoaiNgay ? (
              <div className="table-count" style={{ marginTop: "6px" }}>
                Loại ngày theo giờ bắt đầu: {computedLoaiNgay}
              </div>
            ) : null}
          </div>

          {showtimeFormData.id_pc && showtimeFormData.id_gia ? (
            <div className="form-group">
              <label>Giá vé theo loại ghế</label>
              <div className="checkbox-list">
                {seatTypes.map((st) => (
                  <div key={st.id_loaighe} className="checkbox-item" style={{ cursor: "default" }}>
                    <span>
                      {st.ten_loaighe}: {(baseAmount + roomSurcharge + st.phu_phi).toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {selectedShowtime ? "Cập nhật" : "Thêm mới"}
            </button>
            {selectedShowtime && (
              <button type="button" onClick={onResetShowtimeForm} className="cancel-button">Hủy</button>
            )}
          </div>
        </form>
      </aside>
    );
  }

  if (activeSubTab === "movies") {
    return (
      <aside className="right-form-aside">
        <h3 className="form-title">{selectedMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h3>
        <form onSubmit={onSubmit} className="admin-form">
          <div className="form-group">
            <label>Tên phim</label>
            <input
              type="text" required
              value={formData.ten_phim}
              onChange={(e) => onFormChange("ten_phim", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              required
              value={formData.mo_ta}
              onChange={(e) => onFormChange("mo_ta", e.target.value)}
              className="form-textarea"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Thời lượng (phút)</label>
              <input
                type="number" required
                value={formData.thoi_luong}
                onChange={(e) => onFormChange("thoi_luong", parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Ngày khởi chiếu</label>
              <input
                type="date" required
                value={formData.ngay_khoi_chieu}
                onChange={(e) => onFormChange("ngay_khoi_chieu", e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Poster URL</label>
            <input
              type="text"
              value={formData.poster_url}
              onChange={(e) => onFormChange("poster_url", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Trailer URL</label>
            <input
              type="text"
              value={formData.trailer_url}
              onChange={(e) => onFormChange("trailer_url", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Thể loại</label>
            <div className="checkbox-list">
              {genreOptions.length > 0 ? (
                genreOptions.map((genre) => {
                  const name = genre.ten_the_loai;
                  return (
                    <div 
                      key={name} 
                      className="checkbox-item"
                      onClick={() => {
                        const isChecked = formData.genres.includes(name);
                        const newGenres = isChecked 
                          ? formData.genres.filter((g: string) => g !== name)
                          : [...formData.genres, name];
                        onFormChange("genres", newGenres);
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.genres.includes(name)}
                        readOnly
                      />
                      <span>{name}</span>
                    </div>
                  );
                })
              ) : (
                <div className="loading-genres">
                  <p>Đang tải thể loại...</p>
                  <button type="button" onClick={loadGenres} className="retry-button">Thử lại</button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Đạo diễn (cách nhau bằng dấu phẩy)</label>
            <input
              type="text"
              value={formData.directors.join(", ")}
              onChange={(e) => {
                const val = e.target.value.trim();
                onFormChange("directors", val ? val.split(",").map(s => s.trim()) : []);
              }}
            />
          </div>
          <div className="form-group">
            <label>Diễn viên (cách nhau bằng dấu phẩy)</label>
            <input
              type="text"
              value={formData.actors.join(", ")}
              onChange={(e) => {
                const val = e.target.value.trim();
                onFormChange("actors", val ? val.split(",").map(s => s.trim()) : []);
              }}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {selectedMovie ? "Cập nhật" : "Thêm mới"}
            </button>
            {selectedMovie && (
              <button type="button" onClick={onResetForm} className="cancel-button">Hủy</button>
            )}
          </div>
        </form>
      </aside>
    );
  }

  if (activeSubTab === "genres") {
    return (
      <aside className="right-form-aside">
        <h3 className="form-title">{selectedGenre ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}</h3>
        <form onSubmit={onGenreSubmit} className="admin-form">
          <div className="form-group">
            <label>Tên thể loại</label>
            <input
              type="text" required
              value={genreFormData.ten_the_loai}
              onChange={(e) => onGenreFormChange("ten_the_loai", e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {selectedGenre ? "Cập nhật" : "Thêm mới"}
            </button>
            {selectedGenre && (
              <button type="button" onClick={onResetGenreForm} className="cancel-button">Hủy</button>
            )}
          </div>
        </form>
      </aside>
    );
  }

  // rooms tab
  return (
    <aside className="right-form-aside">
      {activeRoomTab === "cinemas" ? (
        <>
          <h3 className="form-title">{selectedCinema ? "Chỉnh sửa rạp" : "Thêm rạp mới"}</h3>
          <form onSubmit={onCinemaSubmit} className="admin-form">
            <div className="form-group">
              <label>Địa chỉ rạp</label>
              <input
                type="text" required
                value={cinemaFormData.diachi}
                onChange={(e) => onCinemaFormChange("diachi", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                value={cinemaFormData.sdt_rap}
                onChange={(e) => onCinemaFormChange("sdt_rap", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Trạng thái</label>
              <select
                value={cinemaFormData.trang_thai ? "true" : "false"}
                onChange={(e) => onCinemaFormChange("trang_thai", e.target.value === "true")}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Đóng cửa</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                {selectedCinema ? "Cập nhật" : "Thêm mới"}
              </button>
              {selectedCinema && (
                <button type="button" onClick={onResetCinemaForm} className="cancel-button">Hủy</button>
              )}
            </div>
          </form>
        </>
      ) : activeRoomTab === "rooms" ? (
        <>
          {selectedCinema ? (
            <>
              <h3 className="form-title">
                {selectedRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"} - {selectedCinema.diachi || `Rạp ${selectedCinema.id_rap}`}
              </h3>
              <form onSubmit={onRoomSubmit} className="admin-form">
                <div className="form-group">
                  <label>Tên phòng</label>
                  <input
                    type="text" required
                    value={roomFormData.ten_phong}
                    onChange={(e) => onRoomFormChange("ten_phong", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Loại phòng</label>
                  <select
                    value={roomFormData.id_loai}
                    onChange={(e) => onRoomFormChange("id_loai", parseInt(e.target.value))}
                    required
                  >
                    <option value="">Chọn loại phòng</option>
                    {roomTypes.map((type) => (
                      <option key={type.id_loai} value={type.id_loai}>
                        {type.ten_loai} - {type.gia.toLocaleString()} VNĐ
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Sức chứa</label>
                    <input
                      type="number" required min="1"
                      value={roomFormData.suc_chua}
                      onChange={(e) => onRoomFormChange("suc_chua", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      value={roomFormData.trang_thai ? "true" : "false"}
                      onChange={(e) => onRoomFormChange("trang_thai", e.target.value === "true")}
                    >
                      <option value="true">Sẵn sàng</option>
                      <option value="false">Bảo trì</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">
                    {selectedRoom ? "Cập nhật" : "Thêm mới"}
                  </button>
                  {selectedRoom && (
                    <button type="button" onClick={onResetRoomForm} className="cancel-button">Hủy</button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="empty-message-small">
              <p>Vui lòng chọn một rạp từ tab "Quản lý rạp" để thêm hoặc chỉnh sửa phòng</p>
            </div>
          )}
        </>
      ) : (
        <>
          <h3 className="form-title">{selectedRoomType ? "Chỉnh sửa loại phòng" : "Thêm loại phòng mới"}</h3>
          <form onSubmit={onRoomTypeSubmit} className="admin-form">
            <div className="form-group">
              <label>Tên loại phòng</label>
              <input
                type="text" required
                value={roomTypeFormData.ten_loai}
                onChange={(e) => onRoomTypeFormChange("ten_loai", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Giá (VNĐ)</label>
              <input
                type="number" required
                value={roomTypeFormData.gia}
                onChange={(e) => onRoomTypeFormChange("gia", parseInt(e.target.value))}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button">
                {selectedRoomType ? "Cập nhật" : "Thêm mới"}
              </button>
              {selectedRoomType && (
                <button type="button" onClick={onResetRoomTypeForm} className="cancel-button">Hủy</button>
              )}
            </div>
          </form>
        </>
      )}
    </aside>
  );
};
export default RightForm;