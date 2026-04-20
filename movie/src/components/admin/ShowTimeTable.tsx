import React from "react";
import type { Cinema, Room, Showtime, RoomType, SeatType } from "../../types/admin";

interface ShowTimeTableProps {
  showtimes: Showtime[];
  cinemas: Cinema[];
  rooms: Room[];
  roomTypes: RoomType[];
  seatTypes: SeatType[];
  selectedCinemaId: number | "all";
  selectedRoomId: number | "all";
  onCinemaChange: (id: number | "all") => void;
  onRoomChange: (id: number | "all") => void;
  onEditShowtimeClick: (showtime: Showtime) => void;
  onDeleteShowtime: (id: number) => void;
}

const ShowTimeTable: React.FC<ShowTimeTableProps> = ({
  showtimes,
  cinemas,
  rooms,
  roomTypes,
  seatTypes,
  selectedCinemaId,
  selectedRoomId,
  onCinemaChange,
  onRoomChange,
  onEditShowtimeClick,
  onDeleteShowtime,
}) => {
  const filteredRooms =
    selectedCinemaId === "all" ? rooms : rooms.filter((r) => r.id_rap === selectedCinemaId);

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý suất chiếu</h2>
        <div className="table-controls">
          <select
            className="filter-select"
            value={selectedCinemaId}
            onChange={(e) => {
              const val = e.target.value;
              onCinemaChange(val === "all" ? "all" : parseInt(val));
            }}
          >
            <option value="all">Tất cả rạp</option>
            {cinemas.map((c) => (
              <option key={c.id_rap} value={c.id_rap}>
                {c.diachi || `Rạp ${c.id_rap}`}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedRoomId}
            onChange={(e) => {
              const val = e.target.value;
              onRoomChange(val === "all" ? "all" : parseInt(val));
            }}
          >
            <option value="all">Tất cả phòng</option>
            {filteredRooms.map((r) => (
              <option key={r.id_pc} value={r.id_pc}>
                {r.ten_phong || `Phòng ${r.id_pc}`}
              </option>
            ))}
          </select>

          <span className="table-count">{showtimes.length} suất chiếu</span>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Phim</th>
            <th>Rạp</th>
            <th>Phòng</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th>Bảng giá</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {showtimes.map((st) => (
            <tr key={st.id_sc} onClick={() => onEditShowtimeClick(st)} className="clickable-row">
              <td>{st.id_sc}</td>
              <td className="bold">{st.ten_phim}</td>
              <td>{st.ten_rap || `Rạp ${st.id_rap}`}</td>
              <td>{st.ten_phong || `Phòng ${st.id_pc}`}</td>
              <td>{new Date(st.gio_bat_dau).toLocaleString("vi-VN")}</td>
              <td>{new Date(st.gio_ket_thuc).toLocaleString("vi-VN")}</td>
              <td>
                {(() => {
                  const room = rooms.find((r) => r.id_pc === st.id_pc) || null;
                  const roomType = room ? roomTypes.find((t) => t.id_loai === room.id_loai) || null : null;
                  const roomSurcharge = roomType?.gia ?? 0;

                  const start = new Date(st.gio_bat_dau);
                  const computedLoaiNgay = !Number.isNaN(start.getTime())
                    ? (start.getDay() === 0 || start.getDay() === 6 ? "LE" : "THUONG")
                    : null;
                  const baseWithRoom = st.gia_tien + roomSurcharge;

                  return (
                    <div>
                      <div>
                        {baseWithRoom.toLocaleString("vi-VN")} đ{computedLoaiNgay ? ` (${computedLoaiNgay})` : ""}
                      </div>
                      <div style={{ color: "#aaa", fontSize: "0.75rem", marginTop: "6px" }}>
                        {st.ten_bang_gia ? <div>{st.ten_bang_gia}</div> : null}
                        {seatTypes.map((seat) => (
                          <div key={seat.id_loaighe}>
                            {seat.ten_loaighe}: {(baseWithRoom + seat.phu_phi).toLocaleString("vi-VN")} đ
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </td>
              <td className="text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteShowtime(st.id_sc);
                  }}
                  className="delete-button-small"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showtimes.length === 0 && (
        <div className="empty-message">
          <p>Không có suất chiếu nào</p>
        </div>
      )}
    </div>
  );
};

export default ShowTimeTable;