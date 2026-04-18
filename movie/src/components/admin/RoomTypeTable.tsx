import React from "react";
import type { RoomType } from "../../types/admin";

interface RoomTypeTableProps {
  roomTypes: RoomType[];
  onEditRoomTypeClick: (roomType: RoomType) => void;
  onDeleteRoomType: (id: number) => void;
}

const RoomTypeTable: React.FC<RoomTypeTableProps> = ({ roomTypes, onEditRoomTypeClick, onDeleteRoomType }) => {
  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý loại phòng</h2>
        <span className="table-count">{roomTypes.length} loại phòng trong hệ thống</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên loại</th>
            <th>Giá</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {roomTypes.map((type) => (
            <tr
              key={type.id_loai}
              onClick={() => onEditRoomTypeClick(type)}
              className="clickable-row"
            >
              <td>{type.id_loai}</td>
              <td className="bold">{type.ten_loai}</td>
              <td>{type.gia.toLocaleString('vi-VN')} đ</td>
              <td className="text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRoomType(type.id_loai);
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
    </div>
  );
};

export default RoomTypeTable;
