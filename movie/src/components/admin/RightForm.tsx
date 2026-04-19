import React from "react";
import type { AdminMovie, Genre, Cinema, Room, RoomType } from "../../types/admin";

interface RightFormProps {
  activeSubTab: "movies" | "genres" | "rooms";
  activeRoomTab: "cinemas" | "rooms" | "roomTypes";
  selectedMovie: AdminMovie | null;
  selectedGenre: Genre | null;
  selectedCinema: Cinema | null;
  selectedRoom: Room | null;
  selectedRoomType: RoomType | null;
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
}

const RightForm: React.FC<RightFormProps> = ({
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
}) => {
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
