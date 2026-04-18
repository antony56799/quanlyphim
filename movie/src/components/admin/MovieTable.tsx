import React from "react";
import type { AdminMovie } from "../../types/admin";

interface MovieTableProps {
  movies: AdminMovie[];
  onEditClick: (movie: AdminMovie) => void;
  onUpdateStatus: (id: number, status: string) => void;
}

const MovieTable: React.FC<MovieTableProps> = ({ movies, onEditClick, onUpdateStatus }) => {
  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý phim</h2>
        <span className="table-count">{movies.length} phim trong hệ thống</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên phim</th>
            <th>Thể loại</th>
            <th>T.Lượng</th>
            <th>Khởi chiếu</th>
            <th>Đạo diễn</th>
            <th>Diễn viên</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {movies.map(movie => (
            <tr
              key={movie.id_phim}
              onClick={() => onEditClick(movie)}
              className="clickable-row"
            >
              <td>{movie.id_phim}</td>
              <td className="bold">{movie.ten_phim}</td>
              <td>
                {Array.isArray(movie.genres) 
                  ? movie.genres.map(g => {
                      if (typeof g === 'string') return g;
                      if ('ten_the_loai' in g) return g.ten_the_loai;
                      if ('name' in g) return (g as { name: string }).name;
                      return "";
                    }).join(", ") 
                  : ""}
              </td>
              <td>{movie.thoi_luong}m</td>
              <td>{new Date(movie.ngay_khoi_chieu).toLocaleDateString("vi-VN")}</td>
              <td>{movie.directors?.join(", ")}</td>
              <td className="truncate">{movie.actors?.join(", ")}</td>
              <td>
                <select
                  value={movie.trang_thai}
                  onChange={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(movie.id_phim, e.target.value);
                  }}
                  className="status-select"
                >
                  <option value="Đang chiếu">Đang chiếu</option>
                  <option value="Sắp chiếu">Sắp chiếu</option>
                  <option value="Ngưng chiếu">Ngưng chiếu</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MovieTable;
