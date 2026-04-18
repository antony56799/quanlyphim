import { useEffect, useState } from "react";
import Background from "./layout/Background";
import Header from "./layout/Header";
import type { AdminMovie, Genre } from "../types/admin";
import { FaChartBar, FaDoorOpen, FaChair, FaCalendarAlt, FaFilm, FaUsers, FaUserCircle } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const normalizeGenreName = (genre: string | Genre | { name: string }) => {
  if (typeof genre === "string") {
    return genre;
  }

  if ("ten_the_loai" in genre) {
    return genre.ten_the_loai;
  }

  return genre.name;
};

interface Cinema {
  id_rap: number;
  diachi: string;
  sdt_rap: string;
  trang_thai: string;
}

interface Room {
  id_pc: number;
  id_rap: number;
  id_loai: number;
  ten_phong: string;
  trang_thai: string;
  suc_chua: number;
}

const AdminDashboard = () => {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"movies" | "genres" | "rooms">("movies");
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    ten_phim: "",
    mo_ta: "",
    thoi_luong: 0,
    ngay_khoi_chieu: "",
    trang_thai: "Đang chiếu",
    poster_url: "",
    trailer_url: "",
    genres: [] as string[],
    directors: [] as string[],
    actors: [] as string[]
  });

  const [genreFormData, setGenreFormData] = useState({
    ten_the_loai: ""
  });

  const [roomFormData, setRoomFormData] = useState({
    ten_phong: "",
    suc_chua: 100,
    trang_thai: "Sẵn sàng"
  });

  const [cinemaFormData, setCinemaFormData] = useState({
    diachi: "",
    sdt_rap: "",
    trang_thai: "Hoạt động"
  });

  const loadMovies = async () => {
  try {
    setIsLoading(true);
    const response = await fetch(`${API_BASE_URL}/api/admin/movies`);
    if (response.ok) {
      const data = await response.json();
      const sortedMovies = (data as AdminMovie[]).sort((a, b) => a.id_phim - b.id_phim);
      setMovies(sortedMovies);
    }
  } catch (error) {
    console.error("Error loading movies:", error);
  } finally {
    setIsLoading(false);
  }
};

  const loadGenres = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching genres from:", `${API_BASE_URL}/api/admin/genres`);
      const response = await fetch(`${API_BASE_URL}/api/admin/genres`);
      if (response.ok) {
        const data = await response.json();
        console.log("Genres received:", data);
        if (Array.isArray(data)) {
          const formattedGenres: Genre[] = (data as (string | Genre | { id?: number; name?: string })[]).map((item, index) => {
            if (typeof item === 'string') {
              return { id_the_loai: index + 1, ten_the_loai: item };
            }
            const id = ('id_the_loai' in item ? item.id_the_loai : ('id' in item ? item.id : undefined)) || index + 1;
            const name = ('ten_the_loai' in item ? item.ten_the_loai : ('name' in item ? item.name : undefined)) || "Không rõ";
            return {
              id_the_loai: id,
              ten_the_loai: name
            };
          });
          const sorted = formattedGenres.sort((a,b) => a.id_the_loai - b.id_the_loai);
          setGenreOptions(sorted);
        } else {
          setGenreOptions([]);
        }
      } else {
        console.error("Genres API error:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error loading genres:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCinemas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rap`);
      if (response.ok) {
        const data = await response.json();
        setCinemas(data);
      }
    } catch (error) {
      console.error("Error loading cinemas:", error);
    }
  };

  const loadRooms = async (cinemaId?: number) => {
    try {
      const url = cinemaId 
        ? `${API_BASE_URL}/api/admin/phong-chieu?id_rap=${cinemaId}`
        : `${API_BASE_URL}/api/admin/phong-chieu`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  useEffect(() => {
    loadMovies();
    loadGenres();
    loadCinemas();
  }, []);

  const handleEditClick = (movie: AdminMovie) => {
    setSelectedMovie(movie);
    setFormData({
      ten_phim: movie.ten_phim || "",
      mo_ta: movie.mo_ta || "",
      thoi_luong: movie.thoi_luong || 0,
      ngay_khoi_chieu: movie.ngay_khoi_chieu ? movie.ngay_khoi_chieu.split('T')[0] : "",
      trang_thai: movie.trang_thai || "Đang chiếu",
      poster_url: movie.poster_url || "",
      trailer_url: movie.trailer_url || "",
      genres: movie.genres.map(normalizeGenreName),
      directors: Array.isArray(movie.directors) ? movie.directors : [],
      actors: Array.isArray(movie.actors) ? movie.actors : []
    });
  };

  const handleEditGenreClick = (genre: Genre) => {
    setSelectedGenre(genre);
    setGenreFormData({
      ten_the_loai: genre.ten_the_loai
    });
  };

  const handleResetForm = () => {
    setSelectedMovie(null);
    setFormData({
      ten_phim: "",
      mo_ta: "",
      thoi_luong: 0,
      ngay_khoi_chieu: "",
      trang_thai: "Đang chiếu",
      poster_url: "",
      trailer_url: "",
      genres: [],
      directors: [],
      actors: []
    });
  };

  const handleResetGenreForm = () => {
    setSelectedGenre(null);
    setGenreFormData({
      ten_the_loai: ""
    });
  };

  const handleEditCinemaClick = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setCinemaFormData({
      diachi: cinema.diachi,
      sdt_rap: cinema.sdt_rap,
      trang_thai: cinema.trang_thai
    });
    loadRooms(cinema.id_rap);
  };

  const handleEditRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setRoomFormData({
      ten_phong: room.ten_phong,
      suc_chua: room.suc_chua,
      trang_thai: room.trang_thai
    });
  };

  const handleResetCinemaForm = () => {
    setSelectedCinema(null);
    setCinemaFormData({
      diachi: "",
      sdt_rap: "",
      trang_thai: "Hoạt động"
    });
    setRooms([]);
  };

  const handleResetRoomForm = () => {
    setSelectedRoom(null);
    setRoomFormData({
      ten_phong: "",
      suc_chua: 100,
      trang_thai: "Sẵn sàng"
    });
  };

  const handleSubmitCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedCinema
      ? `${API_BASE_URL}/api/admin/rap/${selectedCinema.id_rap}`
      : `${API_BASE_URL}/api/admin/rap`;
    const method = selectedCinema ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cinemaFormData),
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        handleResetCinemaForm();
        loadCinemas();
      } else {
        window.alert(result?.error || "Không thể lưu rạp");
      }
    } catch (error) {
      console.error("Error submitting cinema:", error);
      window.alert("Không thể kết nối đến máy chủ khi lưu rạp");
    }
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCinema && !selectedRoom) {
      window.alert("Vui lòng chọn một rạp");
      return;
    }

    const cinemaId = selectedRoom?.id_rap || selectedCinema?.id_rap;
    const url = selectedRoom
      ? `${API_BASE_URL}/api/admin/phong-chieu/${selectedRoom.id_pc}`
      : `${API_BASE_URL}/api/admin/phong-chieu`;
    const method = selectedRoom ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roomFormData,
          id_rap: cinemaId,
          suc_chua: parseInt(roomFormData.suc_chua.toString())
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        handleResetRoomForm();
        if (cinemaId) loadRooms(cinemaId);
      } else {
        window.alert(result?.error || "Không thể lưu phòng chiếu");
      }
    } catch (error) {
      console.error("Error submitting room:", error);
      window.alert("Không thể kết nối đến máy chủ khi lưu phòng chiếu");
    }
  };

  const handleDeleteCinema = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa rạp này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rap/${id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        loadCinemas();
        if (selectedCinema && selectedCinema.id_rap === id) {
          handleResetCinemaForm();
        }
      } else {
        window.alert(result?.error || "Không thể xóa rạp");
      }
    } catch (error) {
      console.error("Error deleting cinema:", error);
      window.alert("Không thể kết nối đến máy chủ khi xóa rạp");
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng chiếu này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/phong-chieu/${id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        if (selectedCinema) loadRooms(selectedCinema.id_rap);
        if (selectedRoom && selectedRoom.id_pc === id) {
          handleResetRoomForm();
        }
      } else {
        window.alert(result?.error || "Không thể xóa phòng chiếu");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      window.alert("Không thể kết nối đến máy chủ khi xóa phòng chiếu");
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/movies/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trang_thai: newStatus }),
      });
      if (response.ok) {
        loadMovies();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedMovie
      ? `${API_BASE_URL}/api/admin/movies/${selectedMovie.id_phim}`
      : `${API_BASE_URL}/api/admin/movies`;
    const method = selectedMovie ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        handleResetForm();
        loadMovies();
      }
    } catch (error) {
      console.error("Error submitting movie:", error);
    }
  };

  const handleGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedGenre
      ? `${API_BASE_URL}/api/admin/genres/${selectedGenre.id_the_loai}`
      : `${API_BASE_URL}/api/admin/genres`;
    const method = selectedGenre ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genreFormData),
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        handleResetGenreForm();
        loadGenres();
      } else {
        window.alert(result?.error || "Không thể lưu thể loại");
      }
    } catch (error) {
      console.error("Error submitting genre:", error);
      window.alert("Không thể kết nối đến máy chủ khi lưu thể loại");
    }
  };

  const handleDeleteGenre = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa thể loại này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/genres/${id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        loadGenres();
        if (selectedGenre && selectedGenre.id_the_loai === id) {
          handleResetGenreForm();
        }
      } else {
        window.alert(result?.error || "Không thể xóa thể loại");
      }
    } catch (error) {
      console.error("Error deleting genre:", error);
      window.alert("Không thể kết nối đến máy chủ khi xóa thể loại");
    }
  };

  const menuItems = [
    { icon: <FaChartBar />, label: "Quản lý doanh thu" },
    { icon: <FaDoorOpen />, label: "Quản lý phòng & Rạp", active: activeSubTab === "rooms" },
    { icon: <FaChair />, label: "Quản lý ghế" },
    { icon: <FaCalendarAlt />, label: "Quản lý suất chiếu" },
    { icon: <FaFilm />, label: "Phim & Thể loại", active: activeSubTab === "movies" || activeSubTab === "genres" },
    { icon: <FaUsers />, label: "Quản lý nhân sự" },
    { icon: <FaUserCircle />, label: "Quản lý tài khoản" },
  ];

  return (
    <Background>
      <Header />
      <main style={{ display: "flex", height: "calc(100vh - 80px)", color: "white" }}>
        {/* Left Column: Sidebar Menu */}
        <aside style={{ width: "250px", backgroundColor: "rgba(0,0,0,0.85)", borderRight: "1px solid #333", padding: "1.5rem 0" }}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "1rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
                backgroundColor: item.active ? "rgba(229, 9, 20, 0.2)" : "transparent",
                borderLeft: item.active ? "4px solid #e50914" : "4px solid transparent",
                transition: "0.2s"
              }}
            >
              <span style={{ color: item.active ? "#e50914" : "#ccc" }}>{item.icon}</span>
              <span style={{ fontSize: "0.95rem", color: item.active ? "white" : "#ccc" }}>{item.label}</span>
            </div>
          ))}
        </aside>

        {/* Middle Column: Movie Table */}
        <section style={{ flex: 1, padding: "1.5rem", backgroundColor: "rgba(0,0,0,0.7)", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid #333", paddingBottom: "1rem" }}>
            <button
              onClick={() => {
                setActiveSubTab("movies");
                handleResetGenreForm();
                handleResetCinemaForm();
              }}
              style={{
                padding: "0.5rem 1rem",
                background: activeSubTab === "movies" ? "#e50914" : "transparent",
                color: "white",
                border: activeSubTab === "movies" ? "none" : "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: activeSubTab === "movies" ? "bold" : "normal"
              }}
            >
              Quản lý phim
            </button>
            <button
              onClick={() => {
                setActiveSubTab("genres");
                handleResetForm();
                handleResetCinemaForm();
              }}
              style={{
                padding: "0.5rem 1rem",
                background: activeSubTab === "genres" ? "#e50914" : "transparent",
                color: "white",
                border: activeSubTab === "genres" ? "none" : "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: activeSubTab === "genres" ? "bold" : "normal"
              }}
            >
              Quản lý thể loại
            </button>
            <button
              onClick={() => {
                setActiveSubTab("rooms");
                handleResetForm();
                handleResetGenreForm();
              }}
              style={{
                padding: "0.5rem 1rem",
                background: activeSubTab === "rooms" ? "#e50914" : "transparent",
                color: "white",
                border: activeSubTab === "rooms" ? "none" : "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: activeSubTab === "rooms" ? "bold" : "normal"
              }}
            >
              Quản lý phòng & Rạp
            </button>
          </div>

          {activeSubTab === "movies" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem" }}>Quản lý phim</h2>
                <span style={{ color: "#aaa", fontSize: "0.9rem" }}>{movies.length} phim trong hệ thống</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #444", color: "#aaa" }}>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Tên phim</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Thể loại</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>T.Lượng</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Khởi chiếu</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Đạo diễn</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Diễn viên</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map(movie => (
                    <tr
                      key={movie.id_phim}
                      style={{ borderBottom: "1px solid #333", cursor: "pointer" }}
                      onClick={() => handleEditClick(movie)}
                    >
                      <td style={{ padding: "1rem 0.5rem" }}>{movie.id_phim}</td>
                      <td style={{ padding: "1rem 0.5rem", fontWeight: "bold" }}>{movie.ten_phim}</td>
                      <td style={{ padding: "1rem 0.5rem" }}>
                        {Array.isArray(movie.genres) 
                          ? movie.genres.map(g => {
                              if (typeof g === 'string') return g;
                              if ('ten_the_loai' in g) return g.ten_the_loai;
                              if ('name' in g) return (g as { name: string }).name;
                              return "";
                            }).join(", ") 
                          : ""}
                      </td>
                      <td style={{ padding: "1rem 0.5rem" }}>{movie.thoi_luong}m</td>
                      <td style={{ padding: "1rem 0.5rem" }}>{new Date(movie.ngay_khoi_chieu).toLocaleDateString("vi-VN")}</td>
                      <td style={{ padding: "1rem 0.5rem" }}>{movie.directors?.join(", ")}</td>
                      <td style={{ padding: "1rem 0.5rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {movie.actors?.join(", ")}
                      </td>
                      <td style={{ padding: "1rem 0.5rem" }}>
                        <select
                          value={movie.trang_thai}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(movie.id_phim, e.target.value);
                          }}
                          style={{ padding: "0.25rem", background: "#333", color: "white", border: "1px solid #444", borderRadius: "4px" }}
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
            </>
          ) : activeSubTab === "genres" ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem" }}>Quản lý thể loại</h2>
                <span style={{ color: "#aaa", fontSize: "0.9rem" }}>{genreOptions.length} thể loại trong hệ thống</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #444", color: "#aaa" }}>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "left" }}>Tên thể loại</th>
                    <th style={{ padding: "1rem 0.5rem", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {genreOptions.map((genre) => {
                    const id = genre.id_the_loai;
                    const name = genre.ten_the_loai;
                    return (
                      <tr
                        key={id}
                        style={{ borderBottom: "1px solid #333", cursor: "pointer" }}
                        onClick={() => handleEditGenreClick(genre)}
                      >
                        <td style={{ padding: "1rem 0.5rem" }}>{id}</td>
                        <td style={{ padding: "1rem 0.5rem", fontWeight: "bold" }}>{name}</td>
                        <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGenre(id);
                            }}
                            style={{ padding: "0.3rem 0.6rem", background: "#333", color: "#ff4444", border: "1px solid #444", borderRadius: "4px", cursor: "pointer" }}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.5rem" }}>Quản lý phòng & Rạp</h2>
                <span style={{ color: "#aaa", fontSize: "0.9rem" }}>{cinemas.length} rạp trong hệ thống</span>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.8rem", color: "#e50914" }}>Danh sách Rạp</h3>
                <div style={{ 
                  maxHeight: "300px", 
                  overflowY: "auto", 
                  background: "#222", 
                  border: "1px solid #444", 
                  borderRadius: "4px"
                }}>
                  {cinemas.map((cinema) => (
                    <div
                      key={cinema.id_rap}
                      style={{
                        padding: "0.8rem",
                        borderBottom: "1px solid #333",
                        backgroundColor: selectedCinema?.id_rap === cinema.id_rap ? "rgba(229, 9, 20, 0.2)" : "transparent",
                        transition: "0.2s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div
                        onClick={() => handleEditCinemaClick(cinema)}
                        style={{ flex: 1, cursor: "pointer" }}
                      >
                        <div style={{ fontWeight: "bold", color: selectedCinema?.id_rap === cinema.id_rap ? "#e50914" : "white" }}>
                          [{cinema.id_rap}] {cinema.diachi || "Chưa có tên"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                          ĐT: {cinema.sdt_rap} | {cinema.trang_thai}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCinema(cinema.id_rap);
                        }}
                        style={{
                          padding: "0.3rem 0.6rem",
                          background: "#333",
                          color: "#ff4444",
                          border: "1px solid #444",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          marginLeft: "0.5rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCinema && (
                <div>
                  <h3 style={{ fontSize: "1rem", marginBottom: "0.8rem", color: "#e50914" }}>
                    Phòng chiếu - {selectedCinema.diachi}
                  </h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", marginBottom: "1rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #444", color: "#aaa" }}>
                        <th style={{ padding: "0.5rem", textAlign: "left" }}>ID</th>
                        <th style={{ padding: "0.5rem", textAlign: "left" }}>Tên phòng</th>
                        <th style={{ padding: "0.5rem", textAlign: "left" }}>Sức chứa</th>
                        <th style={{ padding: "0.5rem", textAlign: "left" }}>Trạng thái</th>
                        <th style={{ padding: "0.5rem", textAlign: "right" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr
                          key={room.id_pc}
                          style={{ borderBottom: "1px solid #333", cursor: "pointer" }}
                          onClick={() => handleEditRoomClick(room)}
                        >
                          <td style={{ padding: "0.5rem" }}>{room.id_pc}</td>
                          <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{room.ten_phong}</td>
                          <td style={{ padding: "0.5rem" }}>{room.suc_chua}</td>
                          <td style={{ padding: "0.5rem" }}>{room.trang_thai}</td>
                          <td style={{ padding: "0.5rem", textAlign: "right" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRoom(room.id_pc);
                              }}
                              style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", background: "#333", color: "#ff4444", border: "1px solid #444", borderRadius: "4px", cursor: "pointer" }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          {isLoading && <p style={{ textAlign: "center", padding: "2rem" }}>Đang tải...</p>}
        </section>

        {/* Right Column: Edit/Add Form */}
        <aside style={{ width: "350px", backgroundColor: "rgba(0,0,0,0.85)", borderLeft: "1px solid #333", padding: "1.5rem", overflowY: "auto" }}>
          {activeSubTab === "movies" ? (
            <>
              <h3 style={{ marginBottom: "1.5rem", color: "#e50914" }}>{selectedMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Tên phim</label>
                  <input
                    type="text" required
                    value={formData.ten_phim}
                    onChange={(e) => setFormData({ ...formData, ten_phim: e.target.value })}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Mô tả</label>
                  <textarea
                    required
                    value={formData.mo_ta}
                    onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px", minHeight: "80px", resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Thời lượng (phút)</label>
                    <input
                      type="number" required
                      value={formData.thoi_luong}
                      onChange={(e) => setFormData({ ...formData, thoi_luong: parseInt(e.target.value) })}
                      style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Ngày khởi chiếu</label>
                    <input
                      type="date" required
                      value={formData.ngay_khoi_chieu}
                      onChange={(e) => setFormData({ ...formData, ngay_khoi_chieu: e.target.value })}
                      style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Poster URL</label>
                  <input
                    type="text"
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Trailer URL</label>
                  <input
                    type="text"
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Thể loại</label>
                  <div style={{ 
                    maxHeight: "150px", 
                    overflowY: "auto", 
                    background: "#222", 
                    border: "1px solid #444", 
                    borderRadius: "4px",
                    padding: "0.5rem"
                  }}>
                    {genreOptions.length > 0 ? (
                      genreOptions.map((genre) => {
                        const name = genre.ten_the_loai;
                        return (
                          <div 
                            key={name} 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.5rem", 
                              padding: "0.3rem 0", 
                              cursor: "pointer", 
                              fontSize: "0.9rem" 
                            }}
                            onClick={() => {
                              const isChecked = formData.genres.includes(name);
                              const newGenres = isChecked 
                                ? formData.genres.filter(g => g !== name)
                                : [...formData.genres, name];
                              setFormData({ ...formData, genres: newGenres });
                            }}
                          >
                            <input 
                              type="checkbox"
                              checked={formData.genres.includes(name)}
                              readOnly // We handle click on the parent div
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ userSelect: "none" }}>{name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: "center", padding: "1rem" }}>
                        <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.5rem" }}>Đang tải thể loại...</p>
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); loadGenres(); }}
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "#444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Thử lại
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Đạo diễn (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.directors.join(", ")}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setFormData({ ...formData, directors: val ? val.split(",").map(s => s.trim()) : [] });
                    }}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Diễn viên (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.actors.join(", ")}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setFormData({ ...formData, actors: val ? val.split(",").map(s => s.trim()) : [] });
                    }}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: "0.75rem", backgroundColor: "#e50914", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    {selectedMovie ? "Cập nhật" : "Thêm mới"}
                  </button>
                  {selectedMovie && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      style={{ flex: 1, padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : activeSubTab === "genres" ? (
            <>
              <h3 style={{ marginBottom: "1.5rem", color: "#e50914" }}>{selectedGenre ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}</h3>
              <form onSubmit={handleGenreSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Tên thể loại</label>
                  <input
                    type="text" required
                    value={genreFormData.ten_the_loai}
                    onChange={(e) => setGenreFormData({ ...genreFormData, ten_the_loai: e.target.value })}
                    style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="submit"
                    style={{ flex: 1, padding: "0.75rem", backgroundColor: "#e50914", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    {selectedGenre ? "Cập nhật" : "Thêm mới"}
                  </button>
                  {selectedGenre && (
                    <button
                      type="button"
                      onClick={handleResetGenreForm}
                      style={{ flex: 1, padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              {selectedCinema ? (
                <>
                  <h3 style={{ marginBottom: "1.5rem", color: "#e50914" }}>
                    {selectedRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"} - {selectedCinema.diachi}
                  </h3>
                  <form onSubmit={handleSubmitRoom} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Tên phòng</label>
                      <input
                        type="text" required
                        value={roomFormData.ten_phong}
                        onChange={(e) => setRoomFormData({ ...roomFormData, ten_phong: e.target.value })}
                        style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Sức chứa</label>
                        <input
                          type="number" required min="1"
                          value={roomFormData.suc_chua}
                          onChange={(e) => setRoomFormData({ ...roomFormData, suc_chua: parseInt(e.target.value) })}
                          style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Trạng thái</label>
                        <select
                          value={roomFormData.trang_thai}
                          onChange={(e) => setRoomFormData({ ...roomFormData, trang_thai: e.target.value })}
                          style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                        >
                          <option value="Sẵn sàng">Sẵn sàng</option>
                          <option value="Bảo trì">Bảo trì</option>
                          <option value="Không sử dụng">Không sử dụng</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button
                        type="submit"
                        style={{ flex: 1, padding: "0.75rem", backgroundColor: "#e50914", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                      >
                        {selectedRoom ? "Cập nhật" : "Thêm mới"}
                      </button>
                      {selectedRoom && (
                        <button
                          type="button"
                          onClick={handleResetRoomForm}
                          style={{ flex: 1, padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 style={{ marginBottom: "1.5rem", color: "#e50914" }}>
                    {selectedCinema ? "Chỉnh sửa rạp" : "Thêm rạp mới"}
                  </h3>
                  <form onSubmit={handleSubmitCinema} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Địa chỉ rạp</label>
                      <input
                        type="text" required
                        value={cinemaFormData.diachi}
                        onChange={(e) => setCinemaFormData({ ...cinemaFormData, diachi: e.target.value })}
                        style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Số điện thoại</label>
                      <input
                        type="text"
                        value={cinemaFormData.sdt_rap}
                        onChange={(e) => setCinemaFormData({ ...cinemaFormData, sdt_rap: e.target.value })}
                        style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.85rem", color: "#aaa" }}>Trạng thái</label>
                      <select
                        value={cinemaFormData.trang_thai}
                        onChange={(e) => setCinemaFormData({ ...cinemaFormData, trang_thai: e.target.value })}
                        style={{ padding: "0.6rem", background: "#333", border: "1px solid #444", color: "white", borderRadius: "4px" }}
                      >
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Bảo trì">Bảo trì</option>
                        <option value="Đóng cửa">Đóng cửa</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button
                        type="submit"
                        style={{ flex: 1, padding: "0.75rem", backgroundColor: "#e50914", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                      >
                        {selectedCinema ? "Cập nhật" : "Thêm mới"}
                      </button>
                      {selectedCinema && (
                        <button
                          type="button"
                          onClick={handleResetCinemaForm}
                          style={{ flex: 1, padding: "0.75rem", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </aside>
      </main>
    </Background>
  );
};

export default AdminDashboard;
