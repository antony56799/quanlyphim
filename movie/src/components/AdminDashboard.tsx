import { useCallback, useEffect, useRef, useState } from "react";
import Background from "./layout/Background";
import Header from "./layout/Header";
import type { AdminMovie, Genre, Cinema, Room, RoomType, Showtime, BasePrice, SeatType } from "../types/admin";
import { useAdminShowtimes } from "../hooks/useAdminShowtimes";
import Sidebar from "./admin/Sidebar";
import TopTabs from "./admin/TopTabs";
import MovieTable from "./admin/MovieTable";
import GenreTable from "./admin/GenreTable";
import CinemaList from "./admin/CinemaList";
import RoomTable from "./admin/RoomTable";
import RoomTypeTable from "./admin/RoomTypeTable";
import { RightForm } from "./admin/RightForm";
import SeatManager from "./admin/SeatManager";
import StaffManager from "./admin/StaffManager";
import AccountManager from "./admin/AccountManager";
import ShowTimeTable from "./admin/ShowTimeTable";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type RevenueReport = {
  summary: {
    total_revenue: number;
    total_bookings: number;
    total_tickets: number;
  };
  byDate: Array<{ day: string; revenue: number; bookings: number; tickets: number }>;
  byMovie: Array<{ id_phim: number; ten_phim: string; revenue: number; bookings: number; tickets: number }>;
  byCinema: Array<{ id_rap: number; ten_rap: string; revenue: number; bookings: number; tickets: number }>;
  invoices: Array<{
    id_hd: number;
    ma_giao_dich: string;
    ngay_tao: string;
    tong_tien_hd: number;
    trang_thai: number;
    id_phim: number;
    ten_phim: string;
    id_rap: number;
    ten_rap: string;
    tickets: number;
  }>;
};

const AdminDashboard = () => {
  const { bulkCreateShowtimes } = useAdminShowtimes(API_BASE_URL);

  // --- States ---
  const [movies, setMovies] = useState<AdminMovie[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"revenue" | "movies" | "genres" | "rooms" | "seats" | "showtimes" | "prices" | "staff" | "accounts">("movies");
  const [activeRoomTab, setActiveRoomTab] = useState<"cinemas" | "rooms" | "roomTypes">("cinemas");
  const [genreOptions, setGenreOptions] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [ticketPrices, setTicketPrices] = useState<BasePrice[]>([]);
  const [selectedCinemaIdForFilter, setSelectedCinemaIdForFilter] = useState<number | "all">("all");

  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [showtimeFilterCinemaId, setShowtimeFilterCinemaId] = useState<number | "all">("all");
  const [showtimeFilterRoomId, setShowtimeFilterRoomId] = useState<number | "all">("all");
  const [showtimeFormData, setShowtimeFormData] = useState({
    id_phim: 0,
    id_rap: 0,
    id_pc: 0,
    id_gia: 0,
    gio_bat_dau: "",
    gio_ket_thuc: "",
  });

  // Selection states
  const [selectedMovie, setSelectedMovie] = useState<AdminMovie | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedTicketPrice, setSelectedTicketPrice] = useState<BasePrice | null>(null);

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
    trang_thai: true
  });

  const [roomFormData, setRoomFormData] = useState({
    ten_phong: "",
    suc_chua: 100,
    trang_thai: true,
    id_loai: 0
  });

  const [roomTypeFormData, setRoomTypeFormData] = useState({
    ten_loai: "",
    gia: 0
  });

  const [priceFormData, setPriceFormData] = useState({
    ten_bang_gia: "",
    gia_tien: 0,
    loai_ngay: "THUONG",
    hieu_luc_tu: "",
    hieu_luc_den: ""
  });

  const [revenueFormData, setRevenueFormData] = useState<{
    tu_ngay: string;
    den_ngay: string;
    id_rap: number | "all";
    id_phim: number | "all";
  }>({ tu_ngay: "", den_ngay: "", id_rap: "all", id_phim: "all" });
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenueChartType, setRevenueChartType] = useState<"bar" | "line">("bar");
  const revenueChartContainerRef = useRef<HTMLDivElement | null>(null);
  const revenueChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revenueChartWidth, setRevenueChartWidth] = useState(0);

  // --- API Calls ---
  const loadMovies = useCallback(async () => {
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
  }, []);

  const loadGenres = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/genres`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const formattedGenres: Genre[] = data.map((item, index) => {
            if (typeof item === "string") {
              return { id_the_loai: index + 1, ten_the_loai: item };
            }
            const id = ("id_the_loai" in item ? item.id_the_loai : ("id" in item ? item.id : undefined)) || index + 1;
            const name = ("ten_the_loai" in item ? item.ten_the_loai : ("name" in item ? item.name : undefined)) || "Không rõ";
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

  const loadShowtimes = useCallback(async (cinemaId: number | "all", roomId: number | "all") => {
    try {
      const params = new URLSearchParams();
      if (cinemaId !== "all") params.set("id_rap", String(cinemaId));
      if (roomId !== "all") params.set("id_pc", String(roomId));

      const url = `${API_BASE_URL}/api/admin/suat-chieu${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setShowtimes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading showtimes:", error);
    }
  }, []);

  const loadRoomTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/loaiphong`);
      if (response.ok) {
        const data = await response.json();
        setRoomTypes(data);
      }
    } catch (error) {
      console.error("Error loading room types:", error);
    }
  }, []);

  const loadSeatTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/loaighe`);
      if (response.ok) {
        const data = await response.json();
        setSeatTypes(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading seat types:", error);
    }
  }, []);

  const loadTicketPrices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bang-gia`);
      if (response.ok) {
        const data = await response.json();
        setTicketPrices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading ticket prices:", error);
    }
  }, []);

  const loadRevenue = useCallback(async (payload?: { tu_ngay?: string; den_ngay?: string; id_rap?: number | "all"; id_phim?: number | "all" }) => {
    const tu_ngay = payload?.tu_ngay ?? revenueFormData.tu_ngay;
    const den_ngay = payload?.den_ngay ?? revenueFormData.den_ngay;
    const id_rap = payload?.id_rap ?? revenueFormData.id_rap;
    const id_phim = payload?.id_phim ?? revenueFormData.id_phim;

    if (!tu_ngay || !den_ngay) return;

    try {
      setRevenueLoading(true);
      setRevenueError(null);

      const params = new URLSearchParams();
      params.set("tu_ngay", tu_ngay);
      params.set("den_ngay", den_ngay);
      if (id_rap !== "all") params.set("id_rap", String(id_rap));
      if (id_phim !== "all") params.set("id_phim", String(id_phim));

      const response = await fetch(`${API_BASE_URL}/api/admin/doanh-thu?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Không thể tải báo cáo doanh thu");

      setRevenueReport(data);
    } catch (error) {
      setRevenueReport(null);
      setRevenueError(error instanceof Error ? error.message : "Không thể tải báo cáo doanh thu");
    } finally {
      setRevenueLoading(false);
    }
  }, [revenueFormData.den_ngay, revenueFormData.id_phim, revenueFormData.id_rap, revenueFormData.tu_ngay]);

  useEffect(() => {
    const el = revenueChartContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0]?.contentRect?.width || 0);
      setRevenueChartWidth(w);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab !== "revenue") return;
    const canvas = revenueChartCanvasRef.current;
    if (!canvas) return;
    const data = revenueReport?.byDate || [];

    const cssWidth = revenueChartWidth || 0;
    const cssHeight = 260;
    if (cssWidth <= 0) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { left: 56, right: 18, top: 18, bottom: 44 };
    const plotW = Math.max(1, cssWidth - padding.left - padding.right);
    const plotH = Math.max(1, cssHeight - padding.top - padding.bottom);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + plotH);
    ctx.lineTo(padding.left + plotW, padding.top + plotH);
    ctx.stroke();

    if (data.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Không có dữ liệu để vẽ biểu đồ", padding.left, padding.top + 24);
      return;
    }

    const values = data.map((d) => Number(d.revenue || 0));
    const maxV = Math.max(...values, 0);
    const safeMax = maxV <= 0 ? 1 : maxV;

    const formatMoneyShort = (v: number) => {
      const abs = Math.abs(v);
      if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
      if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return String(Math.round(v));
    };

    const ticks = 4;
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#6b7280";
    ctx.strokeStyle = "#f3f4f6";
    for (let i = 0; i <= ticks; i += 1) {
      const t = i / ticks;
      const y = padding.top + (1 - t) * plotH;
      const val = safeMax * t;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + plotW, y);
      ctx.stroke();
      ctx.fillText(formatMoneyShort(val), 8, y + 4);
    }

    const n = data.length;
    const stepX = n <= 1 ? plotW : plotW / (n - 1);
    const xOf = (i: number) => padding.left + i * stepX;
    const yOf = (v: number) => padding.top + (1 - Math.max(0, v) / safeMax) * plotH;

    const getDayLabel = (s: string) => String(s || "").slice(0, 10);
    const xLabelEvery = Math.max(1, Math.ceil(n / 8));
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    for (let i = 0; i < n; i += xLabelEvery) {
      const x = xOf(i);
      const y = padding.top + plotH + 22;
      ctx.fillText(getDayLabel(data[i]?.day || ""), x, y);
    }
    ctx.textAlign = "start";

    const color = "#2563eb";

    if (revenueChartType === "line") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < n; i += 1) {
        const x = xOf(i);
        const y = yOf(values[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = color;
      for (let i = 0; i < n; i += 1) {
        const x = xOf(i);
        const y = yOf(values[i]);
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const barGap = 6;
      const barW = n <= 1 ? plotW : Math.max(6, stepX - barGap);
      ctx.fillStyle = color;
      for (let i = 0; i < n; i += 1) {
        const x = xOf(i) - barW / 2;
        const y = yOf(values[i]);
        const h = padding.top + plotH - y;
        ctx.fillRect(x, y, barW, h);
      }
    }
  }, [activeSubTab, revenueChartType, revenueChartWidth, revenueReport]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const escapeCsv = (v: unknown) => {
    const raw = v === null || v === undefined ? "" : String(v);
    const needs = /[",\n\r]/.test(raw);
    const escaped = raw.replace(/"/g, '""');
    return needs ? `"${escaped}"` : escaped;
  };

  const buildRevenueCsv = (report: RevenueReport) => {
    const lines: string[] = [];
    const rapLabel = revenueFormData.id_rap === "all" ? "Tất cả" : String(revenueFormData.id_rap);
    const phimLabel = revenueFormData.id_phim === "all" ? "Tất cả" : String(revenueFormData.id_phim);

    lines.push(["Từ ngày", revenueFormData.tu_ngay, "Đến ngày", revenueFormData.den_ngay].map(escapeCsv).join(","));
    lines.push(["Rạp", rapLabel, "Phim", phimLabel].map(escapeCsv).join(","));
    lines.push(["Tổng doanh thu", report.summary.total_revenue, "Tổng vé", report.summary.total_tickets, "Tổng hóa đơn", report.summary.total_bookings].map(escapeCsv).join(","));
    lines.push("");

    lines.push("Theo ngày");
    lines.push(["Ngày", "Doanh thu", "Vé", "Hóa đơn"].map(escapeCsv).join(","));
    for (const r of report.byDate) {
      lines.push([r.day, r.revenue, r.tickets, r.bookings].map(escapeCsv).join(","));
    }
    lines.push("");

    lines.push("Top phim");
    lines.push(["ID phim", "Tên phim", "Doanh thu", "Vé", "Hóa đơn"].map(escapeCsv).join(","));
    for (const r of report.byMovie) {
      lines.push([r.id_phim, r.ten_phim, r.revenue, r.tickets, r.bookings].map(escapeCsv).join(","));
    }
    lines.push("");

    lines.push("Top rạp");
    lines.push(["ID rạp", "Tên rạp", "Doanh thu", "Vé", "Hóa đơn"].map(escapeCsv).join(","));
    for (const r of report.byCinema) {
      lines.push([r.id_rap, r.ten_rap, r.revenue, r.tickets, r.bookings].map(escapeCsv).join(","));
    }
    lines.push("");

    lines.push("Hóa đơn");
    lines.push(["ID", "Mã GD", "Ngày", "Phim", "Rạp", "Vé", "Tổng tiền", "Trạng thái"].map(escapeCsv).join(","));
    for (const r of report.invoices) {
      lines.push([r.id_hd, r.ma_giao_dich, r.ngay_tao, r.ten_phim, r.ten_rap, r.tickets, r.tong_tien_hd, r.trang_thai].map(escapeCsv).join(","));
    }

    return `\uFEFF${lines.join("\n")}`;
  };

  const handleExportRevenueCsv = () => {
    if (!revenueReport) return;
    const csv = buildRevenueCsv(revenueReport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `doanh-thu_${revenueFormData.tu_ngay}_${revenueFormData.den_ngay}.csv`);
  };

  const handleExportRevenueChartPng = async () => {
    const canvas = revenueChartCanvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
    if (!blob) return;
    downloadBlob(blob, `bieu-do_doanh-thu_${revenueFormData.tu_ngay}_${revenueFormData.den_ngay}.png`);
  };

  useEffect(() => {
    loadMovies();
    loadGenres();
    loadCinemas();
    loadRoomTypes();
    loadSeatTypes();
    loadTicketPrices();
    loadRooms();
  }, [loadMovies, loadGenres, loadCinemas, loadRoomTypes, loadSeatTypes, loadTicketPrices, loadRooms]);

  useEffect(() => {
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const toDateOnly = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

    setRevenueFormData((prev) => {
      if (prev.tu_ngay && prev.den_ngay) return prev;
      const today = new Date();
      const from = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      return { ...prev, tu_ngay: prev.tu_ngay || toDateOnly(from), den_ngay: prev.den_ngay || toDateOnly(today) };
    });
  }, []);

  useEffect(() => {
    if (activeSubTab !== "revenue") return;
    if (!revenueFormData.tu_ngay || !revenueFormData.den_ngay) return;
    loadRevenue();
  }, [activeSubTab, loadRevenue, revenueFormData.den_ngay, revenueFormData.tu_ngay]);

  useEffect(() => {
    if (activeSubTab === "rooms" && activeRoomTab === "rooms") {
      loadRooms(selectedCinemaIdForFilter);
    }
  }, [selectedCinemaIdForFilter, activeRoomTab, activeSubTab, loadRooms]);

  useEffect(() => {
    if (activeSubTab !== "showtimes") return;
    if (rooms.length > 0) return;
    loadRooms(showtimeFilterCinemaId);
  }, [activeSubTab, rooms.length, showtimeFilterCinemaId, loadRooms]);

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

  const handleSubmitTicketPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedTicketPrice
      ? `${API_BASE_URL}/api/admin/bang-gia/${selectedTicketPrice.id_gia}`
      : `${API_BASE_URL}/api/admin/bang-gia`;
    const method = selectedTicketPrice ? "PUT" : "POST";
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...priceFormData,
          hieu_luc_tu: priceFormData.hieu_luc_tu || null,
          hieu_luc_den: priceFormData.hieu_luc_den || null,
        }),
      });
      if (response.ok) {
        handleResetTicketPriceForm();
        loadTicketPrices();
      }
    } catch (error) {
      console.error("Error submitting ticket price:", error);
    }
  };

  const handleDeleteTicketPrice = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa bảng giá này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/bang-gia/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadTicketPrices();
        if (selectedTicketPrice?.id_gia === id) handleResetTicketPriceForm();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Không thể xóa bảng giá");
      }
    } catch (error) {
      console.error("Error deleting ticket price:", error);
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
    setCinemaFormData({ diachi: "", sdt_rap: "", trang_thai: true });
  };

  const handleResetRoomForm = () => {
    setSelectedRoom(null);
    setRoomFormData({ ten_phong: "", suc_chua: 100, trang_thai: true, id_loai: roomTypes[0]?.id_loai || 0 });
  };

  const handleResetRoomTypeForm = () => {
    setSelectedRoomType(null);
    setRoomTypeFormData({ ten_loai: "", gia: 0 });
  };

  const handleResetTicketPriceForm = () => {
    setSelectedTicketPrice(null);
    setPriceFormData({ ten_bang_gia: "", gia_tien: 0, loai_ngay: "THUONG", hieu_luc_tu: "", hieu_luc_den: "" });
  };

  const handleResetShowtimeForm = () => {
    setSelectedShowtime(null);
    setShowtimeFormData({
      id_phim: 0,
      id_rap: 0,
      id_pc: 0,
      id_gia: 0,
      gio_bat_dau: "",
      gio_ket_thuc: "",
    });
  };

  const handleResetAllForms = () => {
    handleResetForm();
    handleResetGenreForm();
    handleResetCinemaForm();
    handleResetRoomForm();
    handleResetRoomTypeForm();
    handleResetTicketPriceForm();
    handleResetShowtimeForm();
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
    const cinema = cinemas.find((c) => c.id_rap === room.id_rap) || null;
    if (cinema) {
      setSelectedCinema(cinema);
      setSelectedCinemaIdForFilter(cinema.id_rap);
    }
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

  const handleEditTicketPrice = (price: BasePrice) => {
    setSelectedTicketPrice(price);
    setPriceFormData({
      ten_bang_gia: price.ten_bang_gia,
      gia_tien: price.gia_tien,
      loai_ngay: price.loai_ngay || "THUONG",
      hieu_luc_tu: price.hieu_luc_tu ? String(price.hieu_luc_tu).split("T")[0] : "",
      hieu_luc_den: price.hieu_luc_den ? String(price.hieu_luc_den).split("T")[0] : "",
    });
  };

  useEffect(() => {
    if (activeSubTab !== "showtimes") return;

    const controller = new AbortController();

    (async () => {
      try {
        const params = new URLSearchParams();
        if (showtimeFilterCinemaId !== "all") params.set("id_rap", String(showtimeFilterCinemaId));
        if (showtimeFilterRoomId !== "all") params.set("id_pc", String(showtimeFilterRoomId));

        const url = `${API_BASE_URL}/api/admin/suat-chieu${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setShowtimes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error loading showtimes:", error);
      }
    })();

    return () => controller.abort();
  }, [activeSubTab, showtimeFilterCinemaId, showtimeFilterRoomId]);

  const handleEditShowtime = (st: Showtime) => {
    const toDateTimeLocal = (raw: string) => {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return "";
      const pad2 = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    };

    setSelectedShowtime(st);
    setShowtimeFormData({
      id_phim: st.id_phim,
      id_rap: st.id_rap,
      id_pc: st.id_pc,
      id_gia: st.id_gia,
      gio_bat_dau: toDateTimeLocal(st.gio_bat_dau),
      gio_ket_thuc: toDateTimeLocal(st.gio_ket_thuc),
    });
  };

  const handleSubmitShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = selectedShowtime
      ? `${API_BASE_URL}/api/admin/suat-chieu/${selectedShowtime.id_sc}`
      : `${API_BASE_URL}/api/admin/suat-chieu`;
    const method = selectedShowtime ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_phim: showtimeFormData.id_phim,
          id_pc: showtimeFormData.id_pc,
          gio_bat_dau: showtimeFormData.gio_bat_dau,
          gio_ket_thuc: showtimeFormData.gio_ket_thuc,
          id_gia: showtimeFormData.id_gia,
        }),
      });
      if (response.ok) {
        handleResetShowtimeForm();
        loadShowtimes(showtimeFilterCinemaId, showtimeFilterRoomId);
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Không thể lưu suất chiếu");
      }
    } catch (error) {
      console.error("Error submitting showtime:", error);
    }
  };

  const handleDeleteShowtime = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa suất chiếu này?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/suat-chieu/${id}`, { method: "DELETE" });
      if (response.ok) {
        if (selectedShowtime?.id_sc === id) handleResetShowtimeForm();
        loadShowtimes(showtimeFilterCinemaId, showtimeFilterRoomId);
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Không thể xóa suất chiếu");
      }
    } catch (error) {
      console.error("Error deleting showtime:", error);
    }
  };

  const handleBulkCreateShowtimes = async (payload: { tu_ngay: string; den_ngay: string; gio_bat_dau: string }) => {
    try {
      if (!showtimeFormData.id_phim || !showtimeFormData.id_pc) {
        alert("Vui lòng chọn phim và phòng chiếu trước");
        return;
      }

      const data = await bulkCreateShowtimes({
        id_phim: showtimeFormData.id_phim,
        id_pc: showtimeFormData.id_pc,
        tu_ngay: payload.tu_ngay,
        den_ngay: payload.den_ngay,
        gio_bat_dau: payload.gio_bat_dau,
      });

      alert(
        `Đã tạo ${data?.inserted ?? 0} suất chiếu (yêu cầu: ${data?.requested ?? "?"}, trùng giờ: ${data?.skipped_overlap ?? 0}, thiếu bảng giá: ${data?.skipped_no_price ?? 0})`
      );
      loadShowtimes(showtimeFilterCinemaId, showtimeFilterRoomId);
    } catch (error) {
      console.error("Error bulk creating showtimes:", error);
      alert(error instanceof Error ? error.message : "Không thể tạo suất chiếu hàng loạt");
    }
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

        {activeSubTab === "seats" ? (
          <SeatManager apiBaseUrl={API_BASE_URL} cinemas={cinemas} />
        ) : activeSubTab === "staff" ? (
          <StaffManager apiBaseUrl={API_BASE_URL} />
        ) : activeSubTab === "accounts" ? (
          <AccountManager apiBaseUrl={API_BASE_URL} />
        ) : (
          <>
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
                  {activeSubTab === "revenue" && (
                    <div className="table-wrapper">
                      <div className="table-header">
                        <h2 className="table-title">Quản lý doanh thu</h2>
                        <div className="table-controls">
                          <span className="table-count">
                            {revenueReport
                              ? `Doanh thu: ${Number(revenueReport.summary.total_revenue || 0).toLocaleString("vi-VN")} đ • Vé: ${Number(revenueReport.summary.total_tickets || 0).toLocaleString("vi-VN")} • Hóa đơn: ${Number(revenueReport.summary.total_bookings || 0).toLocaleString("vi-VN")}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      {revenueLoading ? (
                        <div className="loading-text">Đang tải báo cáo...</div>
                      ) : revenueError ? (
                        <div className="loading-text">{revenueError}</div>
                      ) : !revenueReport ? (
                        <div className="loading-text">Chọn bộ lọc ở khung bên phải để xem báo cáo</div>
                      ) : (
                        <>
                          <h3 style={{ margin: "12px 0" }}>Biểu đồ doanh thu</h3>
                          <div
                            ref={revenueChartContainerRef}
                            style={{
                              width: "100%",
                              maxWidth: 980,
                              background: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 10,
                              overflow: "hidden",
                            }}
                          >
                            <canvas ref={revenueChartCanvasRef} style={{ display: "block", width: "100%", height: 260 }} />
                          </div>

                          <div style={{ height: 16 }} />

                          <h3 style={{ margin: "12px 0" }}>Theo ngày</h3>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Ngày</th>
                                <th className="text-right">Doanh thu</th>
                                <th className="text-right">Vé</th>
                                <th className="text-right">Hóa đơn</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenueReport.byDate.map((r) => (
                                <tr key={r.day}>
                                  <td>{r.day}</td>
                                  <td className="text-right">{Number(r.revenue || 0).toLocaleString("vi-VN")} đ</td>
                                  <td className="text-right">{Number(r.tickets || 0).toLocaleString("vi-VN")}</td>
                                  <td className="text-right">{Number(r.bookings || 0).toLocaleString("vi-VN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ height: 16 }} />

                          <h3 style={{ margin: "12px 0" }}>Top phim</h3>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Phim</th>
                                <th className="text-right">Doanh thu</th>
                                <th className="text-right">Vé</th>
                                <th className="text-right">Hóa đơn</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenueReport.byMovie.map((r) => (
                                <tr key={r.id_phim}>
                                  <td>{r.ten_phim}</td>
                                  <td className="text-right">{Number(r.revenue || 0).toLocaleString("vi-VN")} đ</td>
                                  <td className="text-right">{Number(r.tickets || 0).toLocaleString("vi-VN")}</td>
                                  <td className="text-right">{Number(r.bookings || 0).toLocaleString("vi-VN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ height: 16 }} />

                          <h3 style={{ margin: "12px 0" }}>Top rạp</h3>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Rạp</th>
                                <th className="text-right">Doanh thu</th>
                                <th className="text-right">Vé</th>
                                <th className="text-right">Hóa đơn</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenueReport.byCinema.map((r) => (
                                <tr key={r.id_rap}>
                                  <td>{r.ten_rap || `Rạp ${r.id_rap}`}</td>
                                  <td className="text-right">{Number(r.revenue || 0).toLocaleString("vi-VN")} đ</td>
                                  <td className="text-right">{Number(r.tickets || 0).toLocaleString("vi-VN")}</td>
                                  <td className="text-right">{Number(r.bookings || 0).toLocaleString("vi-VN")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ height: 16 }} />

                          <h3 style={{ margin: "12px 0" }}>Hóa đơn gần đây</h3>
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Mã GD</th>
                                <th>Ngày</th>
                                <th>Phim</th>
                                <th>Rạp</th>
                                <th className="text-right">Vé</th>
                                <th className="text-right">Tổng tiền</th>
                                <th className="text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revenueReport.invoices.map((r) => (
                                <tr key={r.id_hd}>
                                  <td className="bold">{r.ma_giao_dich}</td>
                                  <td>{new Date(r.ngay_tao).toLocaleString("vi-VN")}</td>
                                  <td>{r.ten_phim}</td>
                                  <td>{r.ten_rap || `Rạp ${r.id_rap}`}</td>
                                  <td className="text-right">{Number(r.tickets || 0).toLocaleString("vi-VN")}</td>
                                  <td className="text-right">{Number(r.tong_tien_hd || 0).toLocaleString("vi-VN")} đ</td>
                                  <td className="text-right">{String(r.trang_thai)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                    </div>
                  )}

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

                  {activeSubTab === "showtimes" && (
                    <ShowTimeTable
                      showtimes={showtimes}
                      cinemas={cinemas}
                      rooms={rooms}
                      roomTypes={roomTypes}
                      seatTypes={seatTypes}
                      selectedCinemaId={showtimeFilterCinemaId}
                      selectedRoomId={showtimeFilterRoomId}
                      onCinemaChange={(id: number | "all") => {
                        setShowtimeFilterCinemaId(id);
                        setShowtimeFilterRoomId("all");
                        if (id !== "all") loadRooms(id);
                        else loadRooms();
                      }}
                      onRoomChange={setShowtimeFilterRoomId}
                      onEditShowtimeClick={handleEditShowtime}
                      onDeleteShowtime={handleDeleteShowtime}
                    />
                  )}

                  {activeSubTab === "prices" && (
                    <div className="table-wrapper">
                      <div className="table-header">
                        <h2 className="table-title">Quản lý bảng giá vé</h2>
                        <span className="table-count">{ticketPrices.length} bảng giá</span>
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Tên bảng giá</th>
                            <th>Giá tiền</th>
                            <th>Loại ngày</th>
                            <th className="text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketPrices.map((price) => (
                            <tr key={price.id_gia} onClick={() => handleEditTicketPrice(price)} className="clickable-row">
                              <td>{price.id_gia}</td>
                              <td className="bold">{price.ten_bang_gia}</td>
                              <td>{price.gia_tien.toLocaleString("vi-VN")} đ</td>
                              <td>{price.loai_ngay || "THUONG"}</td>
                              <td className="text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTicketPrice(price.id_gia);
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
              selectedShowtime={selectedShowtime}
              selectedPrice={selectedTicketPrice}
              showtimeFormData={showtimeFormData}
              priceFormData={priceFormData}
              movies={movies}
              cinemas={cinemas}
              rooms={rooms}
              seatTypes={seatTypes}
              ticketPrices={ticketPrices}
              onShowtimeFormChange={(field, val) =>
                setShowtimeFormData((prev) => {
                  const safeVal = typeof val === "number" && Number.isNaN(val) ? 0 : val;
                  const next = { ...prev, [field]: safeVal };

                  const parseDateOnly = (raw?: string | null) => {
                    if (!raw) return null;
                    const d = new Date(String(raw));
                    if (Number.isNaN(d.getTime())) return null;
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                  };

                  const isEffective = (price: BasePrice, d: Date) => {
                    const from = parseDateOnly(price.hieu_luc_tu ?? null);
                    const to = parseDateOnly(price.hieu_luc_den ?? null);
                    if (from && d < from) return false;
                    if (to && d > to) return false;
                    return true;
                  };
                  
                  const pickPrice = (start: Date) => {
                    const normalizeLoaiNgay = (v?: string | null) => (v || "THUONG").trim().toUpperCase();
                    const dateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    const day = start.getDay();
                    const loaiNgayCoBan = day === 0 || day === 6 ? "CUOI_TUAN" : "THUONG";

                    const isLateShow = (value: Date | string) => {
                      const hours = (() => {
                        if (value instanceof Date) return value.getHours();

                        const raw = String(value).trim();
                        const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
                        if (m) {
                          const h12 = parseInt(m[1], 10);
                          const period = m[3].toUpperCase();
                          const base = h12 % 12;
                          return period === "PM" ? base + 12 : base;
                        }

                        const d = new Date(raw);
                        if (!Number.isNaN(d.getTime())) return d.getHours();

                        return -1;
                      })();

                      if (hours < 0) return false;
                      return hours >= 22 || hours < 6;
                    };

                    const pickByLoaiNgay = (allowed: string[]) => {
                      const candidates = ticketPrices
                        .filter((p) => allowed.includes(normalizeLoaiNgay(p.loai_ngay)))
                        .filter((p) => isEffective(p, dateOnly));

                      candidates.sort((a, b) => {
                        const aFrom = parseDateOnly(a.hieu_luc_tu ?? null)?.getTime() ?? -1;
                        const bFrom = parseDateOnly(b.hieu_luc_tu ?? null)?.getTime() ?? -1;
                        if (aFrom !== bFrom) return bFrom - aFrom;
                        return (b.id_gia || 0) - (a.id_gia || 0);
                      });

                      return candidates[0] || null;
                    };

                    const priority: string[][] = [
                      ["TET", "LE"],
                      isLateShow(start) ? ["SUAT_KHUYA", "KHUYEN_MAI"] : ["KHUYEN_MAI"],
                      [loaiNgayCoBan],
                      ["THUONG"],
                    ];

                    for (const group of priority) {
                      const picked = pickByLoaiNgay(group);
                      if (picked) return picked;
                    }

                    return null;
                  };

                  if (field === "gio_bat_dau" || field === "id_pc" || field === "id_rap") {
                    const start = next.gio_bat_dau ? new Date(next.gio_bat_dau) : null;
                    if (start && !Number.isNaN(start.getTime())) {
                      const picked = pickPrice(start);
                      if (picked && next.id_gia !== picked.id_gia) {
                        next.id_gia = picked.id_gia;
                      }
                    }
                  }

                  return next;
                })
              }
              onShowtimeSubmit={handleSubmitShowtime}
              onResetShowtimeForm={handleResetShowtimeForm}
              onShowtimeBulkCreate={handleBulkCreateShowtimes}
              onPriceFormChange={(field, val) => setPriceFormData((prev) => ({ ...prev, [field]: val }))}
              onPriceSubmit={handleSubmitTicketPrice}
              onResetPriceForm={handleResetTicketPriceForm}
              revenueFormData={revenueFormData}
              onRevenueFormChange={(field, val) =>
                setRevenueFormData((prev) => ({
                  ...prev,
                  [field]: field === "id_rap" || field === "id_phim" ? (val === "all" ? "all" : Number(val)) : String(val),
                }))
              }
              onRevenueLoad={() => loadRevenue()}
              onRevenueReset={() => {
                setRevenueReport(null);
                setRevenueError(null);
              }}
              revenueChartType={revenueChartType}
              onRevenueChartTypeChange={setRevenueChartType}
              revenueExportEnabled={Boolean(revenueReport) && !revenueLoading}
              onRevenueExportCsv={handleExportRevenueCsv}
              onRevenueExportPng={handleExportRevenueChartPng}
            />
          </>
        )}
      </main>
    </Background>
  );
};

export default AdminDashboard;
