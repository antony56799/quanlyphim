import { useState, useCallback, useEffect } from "react";
import type { AdminMovie, Genre, Cinema, Room, RoomType } from "../types/admin";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export const useAdminData = (
  activeSubTab: string,
  activeRoomTab: string,
  onRoomTypesLoaded?: (types: RoomType[]) => void
) => {
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCinemaIdForFilter, setSelectedCinemaIdForFilter] = useState<number | "all">("all");

  const loadMovies = useCallback(async () => {
    try {
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
    }
  }, []);

  const loadGenres = useCallback(async () => {
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
  }, []);

  const loadCinemas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rap`);
      if (response.ok) {
        const data = await response.json();
        setCinemas(data);
      }
    } catch (error) {
      console.error("Error loading cinemas:", error);
    }
  }, []);

  const loadRooms = useCallback(async (cinemaId?: number | "all") => {
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
  }, []);

  const loadRoomTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/loaiphong`);
      if (response.ok) {
        const data = await response.json();
        let types: RoomType[] = [];
        if (Array.isArray(data)) {
          types = data;
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          types = data.data;
        } else {
          console.error("Unexpected data format for room types:", data);
        }
        setRoomTypes(types);
        if (onRoomTypesLoaded) onRoomTypesLoaded(types);
        return types;
      }
    } catch (error) {
      console.error("Error loading room types:", error);
    }
    return [];
  }, [onRoomTypesLoaded]);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadMovies(),
        loadGenres(),
        loadCinemas(),
        loadRoomTypes(),
        loadRooms()
      ]);
      setIsLoading(false);
    };
    initData();
  }, [loadMovies, loadGenres, loadCinemas, loadRoomTypes, loadRooms]);

  useEffect(() => {
    let isMounted = true;
    if (activeSubTab === "rooms" && activeRoomTab === "rooms") {
      const fetchFilteredRooms = async () => {
        await loadRooms(selectedCinemaIdForFilter);
        if (!isMounted) return;
      };
      fetchFilteredRooms();
    }
    return () => { isMounted = false; };
  }, [selectedCinemaIdForFilter, activeRoomTab, activeSubTab, loadRooms]);

  return {
    movies,
    genreOptions,
    cinemas,
    rooms,
    roomTypes,
    isLoading,
    selectedCinemaIdForFilter,
    setSelectedCinemaIdForFilter,
    loadMovies,
    loadGenres,
    loadCinemas,
    loadRooms,
    loadRoomTypes
  };
};
