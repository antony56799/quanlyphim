import React from "react";
import type { AdminMovie, Genre, Cinema, Room, RoomType, Showtime } from "../../types/admin";

interface RightFormProps {
  activeSubTab: "movies" | "genres" | "rooms" | "showtimes";
  activeRoomTab: "cinemas" | "rooms" | "roomTypes";
  selectedMovie: AdminMovie | null;
  selectedGenre: Genre | null;
  selectedCinema: Cinema | null;
  selectedRoom: Room | null;
  selectedRoomType: RoomType | null;
  selectedShowtime: Showtime | null;
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
  showtimeFormData: {
    id_phim: number;
    id_rap: number;
    id_pc: number;
    id_gia: number;
    gio_bat_dau: string;
    gio_ket_thuc: string;
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
  movies,
  cinemas,
  rooms,
  showtimeFormData,
  onShowtimeFormChange,
  onShowtimeSubmit,
  onResetShowtimeForm,
}) => {
  if (activeSubTab === "showtimes") {
    const roomsForCinema = rooms.filter((r) => r.id_rap === showtimeFormData.id_rap);

    return (
      <aside className="right-form-aside">
        <h3 className="form-title">{selectedShowtime ? "Chỉnh sửa suất chiếu" : "Thêm suất chiếu"}</h3>
        <form onSubmit={onShowtimeSubmit} className="admin-form">
          <div className="form-group">
            <label>Phim</label>
            <select
              value={showtimeFormData.id_phim || ""}
              onChange={(e) => onShowtimeFormChange("id_phim", parseInt(e.target.value))}
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

          <div className="form-grid">
            <div className="form-group">
              <label>Giờ bắt đầu</label>
              <input
                type="datetime-local"
                value={showtimeFormData.gio_bat_dau}
                onChange={(e) => onShowtimeFormChange("gio_bat_dau", e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Giờ kết thúc</label>
              <input
                type="datetime-local"
                value={showtimeFormData.gio_ket_thuc}
                onChange={(e) => onShowtimeFormChange("gio_ket_thuc", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>ID bảng giá</label>
            <input
              type="number"
              min="1"
              value={showtimeFormData.id_gia || ""}
              onChange={(e) => onShowtimeFormChange("id_gia", parseInt(e.target.value))}
              required
            />
          </div>

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