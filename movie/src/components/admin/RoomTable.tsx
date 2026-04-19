import React from "react";
import type { Room, Cinema, RoomType } from "../../types/admin";

interface RoomTableProps {
  rooms: Room[];
  cinemas: Cinema[];
  roomTypes: RoomType[];
  selectedCinemaId: number | "all";
  onCinemaChange: (id: number | "all") => void;
  onEditRoomClick: (room: Room) => void;
  onDeleteRoom: (id: number) => void;
}

const RoomTable: React.FC<RoomTableProps> = ({ 
  rooms, 
  cinemas, 
  roomTypes, 
  selectedCinemaId, 
  onCinemaChange, 
  onEditRoomClick, 
  onDeleteRoom 
}) => {
  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý phòng chiếu</h2>
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
            {cinemas.map(c => (
              <option key={c.id_rap} value={c.id_rap}>{c.diachi || `Rạp ${c.id_rap}`}</option>
            ))}
          </select>
          <span className="table-count">{rooms.length} phòng trong hệ thống</span>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên phòng</th>
            <th>Rạp</th>
            <th>Loại phòng</th>
            <th>Sức chứa</th>
            <th>Trạng thái</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const roomType = roomTypes.find(t => t.id_loai === room.id_loai);
            const cinema = cinemas.find(c => c.id_rap === room.id_rap);
            
            return (
              <tr
                key={room.id_pc}
                onClick={() => onEditRoomClick(room)}
                className="clickable-row"
              >
                <td>{room.id_pc}</td>
                <td className="bold">{room.ten_phong}</td>
                <td>{cinema?.diachi || `Rạp ${room.id_rap}`}</td>
                <td>{room.ten_loai || roomType?.ten_loai || "N/A"}</td>
                <td>{room.suc_chua}</td>
                <td>{room.trang_thai ? "Sẵn sàng" : "Bảo trì"}</td>
                <td className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoom(room.id_pc);
                    }}
                    className="delete-button-small"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {rooms.length === 0 && (
        <div className="empty-message">
          <p>Không tìm thấy phòng chiếu nào cho rạp này</p>
        </div>
      )}
    </div>
  );
};

export default RoomTable;
