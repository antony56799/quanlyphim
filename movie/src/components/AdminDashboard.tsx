import { useEffect, useState } from "react";
import Background from "./layout/Background";
import Header from "./layout/Header";
import type { AdminMovie, Genre, Cinema, Room, RoomType } from "../types/admin";
import Sidebar from "./admin/Sidebar";
import TopTabs from "./admin/TopTabs";
import MovieTable from "./admin/MovieTable";
import GenreTable from "./admin/GenreTable";
import CinemaList from "./admin/CinemaList";
import RoomTable from "./admin/RoomTable";
import RoomTypeTable from "./admin/RoomTypeTable";
import RightForm from "./admin/RightForm";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const AdminDashboard = () => {
  // --- States ---
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"movies" | "genres" | "rooms">("movies");
  const [activeRoomTab, setActiveRoomTab] = useState<"cinemas" | "rooms" | "roomTypes">("cinemas");
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedCinemaIdForFilter, setSelectedCinemaIdForFilter] = useState<number | "all">("all");

  // Selection states
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  // Form states
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

  const [cinemaFormData, setCinemaFormData] = useState({
    diachi: "",
    sdt_rap: "",
    trang_thai: "Hoạt động"
  });

  const [roomFormData, setRoomFormData] = useState({
    ten_phong: "",
    suc_chua: 100,
    trang_thai: "Sẵn sàng",
    id_loai: 0
  });

  const [roomTypeFormData, setRoomTypeFormData] = useState({
    ten_loai: "",
    gia: 0
  });

  // --- API Calls ---
  const loadMovies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/movies`);
      if (response.ok) {
        let data = await response.json();
        if (Array.isArray(data)) {
          data = data.sort((a: AdminMovie, b: AdminMovie) => (a.id_phim || 0) - (b.id_phim || 0));
        }
        setMovies(data);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/genres`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const formattedGenres: Genre[] = data.map((item, index) => {
            if (typeof item === 'string') {
              return { id_the_loai: index + 1, ten_the_loai: item };
            }
            const id = ('id_the_loai' in item ? item.id_the_loai : ('id' in item ? item.id : undefined)) || index + 1;
            const name = ('ten_the_loai' in item ? item.ten_the_loai : ('name' in item ? item.name : undefined)) || "Không rõ";
            return { id_the_loai: id, ten_the_loai: name };
          });
          formattedGenres.sort((a, b) => a.id_the_loai - b.id_the_loai);
          setGenreOptions(formattedGenres);
        }
      }
    } catch (error) {
      console.error("Error loading genres:", error);
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

  const loadRooms = async (cinemaId?: number | "all") => {
    try {
      let url = `${API_BASE_URL}/api/admin/phong-chieu`;
      if (cinemaId && cinemaId !== "all") {
        url = `${API_BASE_URL}/api/admin/phong-chieu?id_rap=${cinemaId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/loaiphong`);
      if (response.ok) {
        const data = await response.json();
        setRoomTypes(data);
      }
    } catch (error) {
      console.error("Error loading room types:", error);
    }
  };

  useEffect(() => {
    loadMovies();
    loadGenres();
    loadCinemas();
    loadRoomTypes();
    loadRooms();
  }, []);

  useEffect(() => {
    if (activeSubTab === "rooms" && activeRoomTab === "rooms") {
      loadRooms(selectedCinemaIdForFilter);
    }
  }, [selectedCinemaIdForFilter, activeRoomTab, activeSubTab]);

  // --- Handlers ---
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/movies/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trang_thai: newStatus }),
      });
      if (response.ok) loadMovies();
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
      if (response.ok) {
        handleResetGenreForm();
        loadGenres();
      }
    } catch (error) {
      console.error("Error submitting genre:", error);
    }
  };

  const handleDeleteGenre = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa thể loại này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/genres/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadGenres();
        if (selectedGenre?.id_the_loai === id) handleResetGenreForm();
      }
    } catch (error) {
      console.error("Error deleting genre:", error);
    }
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
      if (response.ok) {
        handleResetCinemaForm();
        loadCinemas();
      }
    } catch (error) {
      console.error("Error submitting cinema:", error);
    }
  };

  const handleDeleteCinema = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa rạp này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rap/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadCinemas();
        if (selectedCinema?.id_rap === id) handleResetCinemaForm();
      }
    } catch (error) {
      console.error("Error deleting cinema:", error);
    }
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cinemaId = selectedRoom?.id_rap || selectedCinema?.id_rap;
    if (!cinemaId) {
      alert("Vui lòng chọn rạp trước khi thêm phòng!");
      return;
    }
    const url = selectedRoom
      ? `${API_BASE_URL}/api/admin/phong-chieu/${selectedRoom.id_pc}`
      : `${API_BASE_URL}/api/admin/phong-chieu`;
    const method = selectedRoom ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roomFormData, id_rap: cinemaId }),
      });
      if (response.ok) {
        handleResetRoomForm();
        loadRooms(selectedCinemaIdForFilter);
      }
    } catch (error) {
      console.error("Error submitting room:", error);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa phòng này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/phong-chieu/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadRooms(selectedCinemaIdForFilter);
        if (selectedRoom?.id_pc === id) handleResetRoomForm();
      }
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const handleSubmitRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedRoomType
      ? `${API_BASE_URL}/api/admin/loaiphong/${selectedRoomType.id_loai}`
      : `${API_BASE_URL}/api/admin/loaiphong`;
    const method = selectedRoomType ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomTypeFormData),
      });
      if (response.ok) {
        handleResetRoomTypeForm();
        loadRoomTypes();
      }
    } catch (error) {
      console.error("Error submitting room type:", error);
    }
  };

  const handleDeleteRoomType = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa loại phòng này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/loaiphong/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadRoomTypes();
        if (selectedRoomType?.id_loai === id) handleResetRoomTypeForm();
      }
    } catch (error) {
      console.error("Error deleting room type:", error);
    }
  };

  // --- Reset Forms ---
  const handleResetForm = () => {
    setSelectedMovie(null);
    setFormData({
      ten_phim: "", mo_ta: "", thoi_luong: 0, ngay_khoi_chieu: "", trang_thai: "Đang chiếu",
      poster_url: "", trailer_url: "", genres: [], directors: [], actors: []
    });
  };

  const handleResetGenreForm = () => {
    setSelectedGenre(null);
    setGenreFormData({ ten_the_loai: "" });
  };

  const handleResetCinemaForm = () => {
    setSelectedCinema(null);
    setCinemaFormData({ diachi: "", sdt_rap: "", trang_thai: "Hoạt động" });
    setRooms([]);
  };

  const handleResetRoomForm = () => {
    setSelectedRoom(null);
    setRoomFormData({ ten_phong: "", suc_chua: 100, trang_thai: "Sẵn sàng", id_loai: roomTypes[0]?.id_loai || 0 });
  };

  const handleResetRoomTypeForm = () => {
    setSelectedRoomType(null);
    setRoomTypeFormData({ ten_loai: "", gia: 0 });
  };

  const handleResetAllForms = () => {
    handleResetForm();
    handleResetGenreForm();
    handleResetCinemaForm();
    handleResetRoomForm();
    handleResetRoomTypeForm();
  };

  // --- Click Handlers ---
  const handleEditMovie = (movie: AdminMovie) => {
    setSelectedMovie(movie);
    setFormData({
      ten_phim: movie.ten_phim,
      mo_ta: movie.mo_ta,
      thoi_luong: movie.thoi_luong,
      ngay_khoi_chieu: movie.ngay_khoi_chieu.split("T")[0],
      trang_thai: movie.trang_thai,
      poster_url: movie.poster_url,
      trailer_url: movie.trailer_url,
      genres: movie.genres.map(g => {
        if (typeof g === 'string') return g;
        if ('ten_the_loai' in g) return g.ten_the_loai;
        return (g as { name: string }).name;
      }),
      directors: movie.directors,
      actors: movie.actors
    });
  };

  const handleEditGenre = (genre: Genre) => {
    setSelectedGenre(genre);
    setGenreFormData({ ten_the_loai: genre.ten_the_loai });
  };

  const handleEditCinema = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    setCinemaFormData({
      diachi: cinema.diachi,
      sdt_rap: cinema.sdt_rap,
      trang_thai: cinema.trang_thai
    });
    setSelectedCinemaIdForFilter(cinema.id_rap);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setRoomFormData({
      ten_phong: room.ten_phong,
      suc_chua: room.suc_chua,
      trang_thai: room.trang_thai,
      id_loai: room.id_loai
    });
  };

  const handleEditRoomType = (type: RoomType) => {
    setSelectedRoomType(type);
    setRoomTypeFormData({ ten_loai: type.ten_loai, gia: type.gia });
  };

  return (
    <Background>
      <Header />
      <main className="admin-main">
        <Sidebar
          activeSubTab={activeSubTab}
          onTabChange={setActiveSubTab}
          onResetForms={handleResetAllForms}
        />

        <section className="admin-content">
          <TopTabs
            activeSubTab={activeSubTab}
            activeRoomTab={activeRoomTab}
            onSubTabChange={setActiveSubTab}
            onRoomTabChange={setActiveRoomTab}
            onResetGenreForm={handleResetGenreForm}
            onResetCinemaForm={handleResetCinemaForm}
            onResetForm={handleResetForm}
            onResetRoomForm={handleResetRoomForm}
            onResetRoomTypeForm={handleResetRoomTypeForm}
          />

          {isLoading ? (
            <div className="loading-text">Đang tải...</div>
          ) : (
            <>
              {activeSubTab === "movies" && (
                <MovieTable
                  movies={movies}
                  onEditClick={handleEditMovie}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}
              {activeSubTab === "genres" && (
                <GenreTable
                  genreOptions={genreOptions}
                  onEditGenreClick={handleEditGenre}
                  onDeleteGenre={handleDeleteGenre}
                />
              )}
              {activeSubTab === "rooms" && (
                <>
                  {activeRoomTab === "cinemas" && (
                    <CinemaList
                      cinemas={cinemas}
                      selectedCinema={selectedCinema}
                      onEditCinemaClick={handleEditCinema}
                      onDeleteCinema={handleDeleteCinema}
                    />
                  )}
                  {activeRoomTab === "rooms" && (
                    <RoomTable
                      rooms={rooms}
                      cinemas={cinemas}
                      roomTypes={roomTypes}
                      selectedCinemaId={selectedCinemaIdForFilter}
                      onCinemaChange={setSelectedCinemaIdForFilter}
                      onEditRoomClick={handleEditRoom}
                      onDeleteRoom={handleDeleteRoom}
                    />
                  )}
                  {activeRoomTab === "roomTypes" && (
                    <RoomTypeTable
                      roomTypes={roomTypes}
                      onEditRoomTypeClick={handleEditRoomType}
                      onDeleteRoomType={handleDeleteRoomType}
                    />
                  )}
                </>
              )}
            </>
          )}
        </section>

        <RightForm
          activeSubTab={activeSubTab}
          activeRoomTab={activeRoomTab}
          selectedMovie={selectedMovie}
          selectedGenre={selectedGenre}
          selectedCinema={selectedCinema}
          selectedRoom={selectedRoom}
          selectedRoomType={selectedRoomType}
          formData={formData}
          genreFormData={genreFormData}
          cinemaFormData={cinemaFormData}
          roomFormData={roomFormData}
          roomTypeFormData={roomTypeFormData}
          genreOptions={genreOptions}
          roomTypes={roomTypes}
          onFormChange={(field, val) => setFormData({ ...formData, [field]: val })}
          onGenreFormChange={(field, val) => setGenreFormData({ ...genreFormData, [field]: val })}
          onCinemaFormChange={(field, val) => setCinemaFormData({ ...cinemaFormData, [field]: val })}
          onRoomFormChange={(field, val) => setRoomFormData({ ...roomFormData, [field]: val })}
          onRoomTypeFormChange={(field, val) => setRoomTypeFormData({ ...roomTypeFormData, [field]: val })}
          onSubmit={handleSubmit}
          onGenreSubmit={handleGenreSubmit}
          onCinemaSubmit={handleSubmitCinema}
          onRoomSubmit={handleSubmitRoom}
          onRoomTypeSubmit={handleSubmitRoomType}
          onResetForm={handleResetForm}
          onResetGenreForm={handleResetGenreForm}
          onResetCinemaForm={handleResetCinemaForm}
          onResetRoomForm={handleResetRoomForm}
          onResetRoomTypeForm={handleResetRoomTypeForm}
          loadGenres={loadGenres}
        />
      </main>
    </Background>
  );
};

export default AdminDashboard;
