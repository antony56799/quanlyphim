import React from "react";
import type { Cinema } from "../../types/admin";

interface CinemaListProps {
  cinemas: Cinema[];
  selectedCinema: Cinema | null;
  onEditCinemaClick: (cinema: Cinema) => void;
  onDeleteCinema: (id: number) => void;
}

const CinemaList: React.FC<CinemaListProps> = ({ cinemas, selectedCinema, onEditCinemaClick, onDeleteCinema }) => {
  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý rạp</h2>
        <span className="table-count">{cinemas.length} rạp trong hệ thống</span>
      </div>

      <div className="list-container">
        {cinemas.map((cinema) => (
          <div
            key={cinema.id_rap}
            className={`list-item ${selectedCinema?.id_rap === cinema.id_rap ? "active" : ""}`}
          >
            <div
              onClick={() => onEditCinemaClick(cinema)}
              className="list-item-content"
            >
              <div className="item-title">
                Rạp {cinema.id_rap}
              </div>
              <div className="item-subtitle">
                {cinema.diachi} | ĐT: {cinema.sdt_rap} | {cinema.trang_thai}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCinema(cinema.id_rap);
              }}
              className="delete-button-small"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CinemaList;
