import { useState, useCallback } from "react";
import type { AdminMovie, Genre, Cinema, Room, RoomType } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface UseAdminFormsProps {
  roomTypes: RoomType[];
  selectedCinemaIdForFilter: number | "all";
  loadMovies: () => Promise<void>;
  loadGenres: () => Promise<void>;
  loadCinemas: () => Promise<void>;
  loadRooms: (cinemaId?: number | "all") => Promise<void>;
  loadRoomTypes: () => Promise<RoomType[]>;
  setSelectedCinemaIdForFilter: (id: number | "all") => void;
  setActiveRoomTab: (tab: "cinemas" | "rooms" | "roomTypes") => void;
}

export const useAdminForms = ({
  roomTypes,
  selectedCinemaIdForFilter,
  loadMovies,
  loadGenres,
  loadCinemas,
  loadRooms,
  loadRoomTypes,
  setSelectedCinemaIdForFilter,
  setActiveRoomTab,
}: UseAdminFormsProps) => {
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

  const [genreFormData, setGenreFormData] = useState({ ten_the_loai: "" });
  const [cinemaFormData, setCinemaFormData] = useState({ diachi: "", sdt_rap: "", trang_thai: true });
  const [roomFormData, setRoomFormData] = useState({
    ten_phong: "",
    suc_chua: 100,
    trang_thai: true,
    id_loai: 0
  });
  const [roomTypeFormData, setRoomTypeFormData] = useState({ ten_loai: "", gia: 0 });
  // --- Reset Handlers ---
  const handleResetForm = useCallback(() => {
    setSelectedMovie(null);
    setFormData({
      ten_phim: "", mo_ta: "", thoi_luong: 0, ngay_khoi_chieu: "", trang_thai: "Đang chiếu",
      poster_url: "", trailer_url: "", genres: [], directors: [], actors: []
    });
  }, []);

  const handleResetGenreForm = useCallback(() => {
    setSelectedGenre(null);
    setGenreFormData({ ten_the_loai: "" });
  }, []);

  const handleResetCinemaForm = useCallback(() => {
    setSelectedCinema(null);
    setCinemaFormData({ diachi: "", sdt_rap: "", trang_thai: true });
  }, []);

  const handleResetRoomForm = useCallback(() => {
    setSelectedRoom(null);
    setRoomFormData({ ten_phong: "", suc_chua: 100, trang_thai: true, id_loai: roomTypes[0]?.id_loai || 0 });
  }, [roomTypes]);

  const handleResetRoomTypeForm = useCallback(() => {
    setSelectedRoomType(null);
    setRoomTypeFormData({ ten_loai: "", gia: 0 });
  }, []);

  const handleResetAllForms = useCallback(() => {
    handleResetForm();
    handleResetGenreForm();
    handleResetCinemaForm();
    handleResetRoomForm();
    handleResetRoomTypeForm();
  }, [handleResetForm, handleResetGenreForm, handleResetCinemaForm, handleResetRoomForm, handleResetRoomTypeForm]);

  // --- Edit Handlers ---
  const handleEditMovie = useCallback((movie: AdminMovie) => {
    setSelectedMovie(movie);
    setFormData({
      ten_phim: movie.ten_phim,
      mo_ta: movie.mo_ta,
      thoi_luong: movie.thoi_luong,
      ngay_khoi_chieu: movie.ngay_khoi_chieu.split("T")[0],
      trang_thai: movie.trang_thai,
      poster_url: movie.poster_url,
      trailer_url: movie.trailer_url,
      genres: movie.genres.map(g => (typeof g === 'string' ? g : ('ten_the_loai' in g ? g.ten_the_loai : (g as { name: string }).name))),
      directors: movie.directors,
      actors: movie.actors
    });
  }, []);

  const handleEditGenre = useCallback((genre: Genre) => {
    setSelectedGenre(genre);
    setGenreFormData({ ten_the_loai: genre.ten_the_loai });
  }, []);

  const handleEditCinema = useCallback((cinema: Cinema) => {
    setSelectedCinema(cinema);
    setCinemaFormData({
      diachi: cinema.diachi,
      sdt_rap: cinema.sdt_rap,
      trang_thai: cinema.trang_thai
    });
    setSelectedCinemaIdForFilter(cinema.id_rap);
    setActiveRoomTab("rooms");
  }, [setSelectedCinemaIdForFilter, setActiveRoomTab]);

  const handleEditRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
    setRoomFormData({
      ten_phong: room.ten_phong,
      suc_chua: room.suc_chua,
      trang_thai: room.trang_thai,
      id_loai: room.id_loai
    });
  }, []);

  const handleEditRoomType = useCallback((type: RoomType) => {
    setSelectedRoomType(type);
    setRoomTypeFormData({ ten_loai: type.ten_loai, gia: type.gia });
  }, []);

  // --- CRUD Handlers ---
  const handleUpdateStatus = useCallback(async (id: number, newStatus: string) => {
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
  }, [loadMovies]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedMovie ? `${API_BASE_URL}/api/admin/movies/${selectedMovie.id_phim}` : `${API_BASE_URL}/api/admin/movies`;
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
  }, [selectedMovie, formData, handleResetForm, loadMovies]);

  const handleGenreSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedGenre ? `${API_BASE_URL}/api/admin/genres/${selectedGenre.id_the_loai}` : `${API_BASE_URL}/api/admin/genres`;
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
  }, [selectedGenre, genreFormData, handleResetGenreForm, loadGenres]);

  const handleDeleteGenre = useCallback(async (id: number) => {
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
  }, [selectedGenre, handleResetGenreForm, loadGenres]);

  const handleSubmitCinema = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedCinema ? `${API_BASE_URL}/api/admin/rap/${selectedCinema.id_rap}` : `${API_BASE_URL}/api/admin/rap`;
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
  }, [selectedCinema, cinemaFormData, handleResetCinemaForm, loadCinemas]);

  const handleDeleteCinema = useCallback(async (id: number) => {
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
  }, [selectedCinema, handleResetCinemaForm, loadCinemas]);

  const handleSubmitRoom = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cinemaId = selectedRoom?.id_rap || selectedCinema?.id_rap;
    if (!cinemaId) {
      alert("Vui lòng chọn rạp trước khi thêm phòng!");
      return;
    }
    const url = selectedRoom ? `${API_BASE_URL}/api/admin/phong-chieu/${selectedRoom.id_pc}` : `${API_BASE_URL}/api/admin/phong-chieu`;
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
  }, [selectedRoom, selectedCinema, roomFormData, handleResetRoomForm, loadRooms, selectedCinemaIdForFilter]);

  const handleDeleteRoom = useCallback(async (id: number) => {
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
  }, [selectedRoom, selectedCinemaIdForFilter, handleResetRoomForm, loadRooms]);

  const handleSubmitRoomType = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedRoomType ? `${API_BASE_URL}/api/admin/loaiphong/${selectedRoomType.id_loai}` : `${API_BASE_URL}/api/admin/loaiphong`;
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
  }, [selectedRoomType, roomTypeFormData, handleResetRoomTypeForm, loadRoomTypes]);

  const handleDeleteRoomType = useCallback(async (id: number) => {
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
  }, [selectedRoomType, handleResetRoomTypeForm, loadRoomTypes]);

  return {
    selectedMovie, selectedGenre, selectedCinema, selectedRoom, selectedRoomType,
    formData, genreFormData, cinemaFormData, roomFormData, roomTypeFormData,
    setFormData, setGenreFormData, setCinemaFormData, setRoomFormData, setRoomTypeFormData,
    handleResetForm, handleResetGenreForm, handleResetCinemaForm, handleResetRoomForm, handleResetRoomTypeForm, handleResetAllForms,
    handleEditMovie, handleEditGenre, handleEditCinema, handleEditRoom, handleEditRoomType,
    handleUpdateStatus, handleSubmit, handleGenreSubmit, handleDeleteGenre, handleSubmitCinema, handleDeleteCinema, handleSubmitRoom, handleDeleteRoom, handleSubmitRoomType, handleDeleteRoomType
  };
};
