import React from "react";
import type { Genre } from "../../types/admin";

interface GenreTableProps {
  genreOptions: Genre[];
  onEditGenreClick: (genre: Genre) => void;
  onDeleteGenre: (id: number) => void;
}

const GenreTable: React.FC<GenreTableProps> = ({ genreOptions, onEditGenreClick, onDeleteGenre }) => {
  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h2 className="table-title">Quản lý thể loại</h2>
        <span className="table-count">{genreOptions.length} thể loại trong hệ thống</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên thể loại</th>
            <th className="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {genreOptions.map((genre) => {
            const id = genre.id_the_loai;
            const name = genre.ten_the_loai;
            return (
              <tr
                key={id}
                onClick={() => onEditGenreClick(genre)}
                className="clickable-row"
              >
                <td>{id}</td>
                <td className="bold">{name}</td>
                <td className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGenre(id);
                    }}
                    className="delete-button"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GenreTable;
