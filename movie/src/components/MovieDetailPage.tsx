import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Background from "./layout/Background";
import Header from "./layout/Header";
import type { MovieDetailData, SeatData, ShowtimeData } from "../types/movie";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const joinOrFallback = (items: string[] | undefined | null, fallback: string) =>
  items && items.length > 0 ? items.join(", ") : fallback;

const extractYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "") || null;
    }
    return null;
  } catch {
    return null;
  }
};

const toTrailerEmbedSrc = (trailerUrl: string | null | undefined) => {
  if (!trailerUrl) return null;
  const youtubeId = extractYouTubeId(trailerUrl);
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`;
  if (trailerUrl.includes("youtube.com/embed/")) return trailerUrl;
  return null;
};

const SESSION_ID_STORAGE_KEY = "movie_session_id";

const getOrCreateSessionId = () => {
  const existing = localStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(SESSION_ID_STORAGE_KEY, next);
  return next;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null;

const asStringOrNull = (value: unknown) => (typeof value === "string" ? value : null);

const asNumberOrNull = (value: unknown) => (typeof value === "number" ? value : null);

const asStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeMovie = (raw: unknown): MovieDetailData | null => {
  if (!isRecord(raw)) return null;

  const id = asNumberOrNull(raw["id"] ?? raw["id_phim"]);
  const title = asStringOrNull(raw["title"] ?? raw["ten_phim"]);
  const posterUrl = asStringOrNull(raw["posterUrl"] ?? raw["poster_url"] ?? raw["poster"]);

  if (id == null || title == null) return null;

  const genresRaw = raw["genres"];
  const genres = Array.isArray(genresRaw)
    ? genresRaw
        .map((g) => {
          if (typeof g === "string") return g;
          if (!isRecord(g)) return "";
          return asStringOrNull(g["ten_the_loai"] ?? g["name"]) ?? "";
        })
        .filter((g): g is string => Boolean(g))
    : [];

  return {
    id,
    title,
    posterUrl,
    genres,
    directors: asStringArray(raw["directors"]),
    actors: asStringArray(raw["actors"]),
    description: asStringOrNull(raw["description"] ?? raw["mo_ta"]),
    trailerUrl: asStringOrNull(raw["trailerUrl"] ?? raw["trailer_url"]),
    durationMinutes: asNumberOrNull(raw["durationMinutes"] ?? raw["thoi_luong"]),
    releaseDate: asStringOrNull(raw["releaseDate"] ?? raw["ngay_khoi_chieu"]),
  };
};

const normalizeShowtimes = (raw: unknown, movieId: number): ShowtimeData[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((st) => {
      if (!isRecord(st)) return null;

      const id = asNumberOrNull(st["id"] ?? st["id_sc"]);
      const startTime = asStringOrNull(st["startTime"] ?? st["gio_bat_dau"]);
      const endTime = asStringOrNull(st["endTime"] ?? st["gio_ket_thuc"]);

      if (id == null || startTime == null) return null;

      const cinemaName = String(st["cinemaName"] ?? st["ten_rap"] ?? "Rạp");
      const roomName = String(st["roomName"] ?? st["ten_phong"] ?? "Phòng");
      const price = asNumberOrNull(st["price"] ?? st["gia_tien"] ?? st["basePrice"] ?? st["base_price"]);
      const mappedMovieId = asNumberOrNull(st["movieId"] ?? st["id_phim"]) ?? movieId;

      return {
        id,
        movieId: mappedMovieId,
        cinemaName,
        roomName,
        startTime,
        endTime,
        price,
      } satisfies ShowtimeData;
    })
    .filter(Boolean) as ShowtimeData[];
};

const normalizeSeats = (raw: unknown): SeatData[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((s) => {
      if (!isRecord(s)) return null;

      const id = asNumberOrNull(s["id"] ?? s["id_ghe"]);

      const labelFromApi = asStringOrNull(s["label"]);
      const hang = asStringOrNull(s["hang"]);
      const so = asNumberOrNull(s["so"]);
      const label = labelFromApi ?? (hang && so != null ? `${hang}${so}` : null);

      if (id == null || label == null) return null;

      const statusRaw = asStringOrNull(s["status"]);
      const trangThai = asNumberOrNull(s["trang_thai"] ?? s["trangThai"]);

      const activeRaw = s["isAvailable"] ?? s["available"] ?? s["tinhtrang"] ?? true;
      const active = Boolean(activeRaw);

      const isBlocked = statusRaw === "booked" || statusRaw === "held" || trangThai === 0 || trangThai === 2;
      const isAvailable = active && !isBlocked;

      const seatTypeName = asStringOrNull(s["seatTypeName"] ?? s["ten_loaighe"]);
      const extraFee = asNumberOrNull(s["extraFee"] ?? s["phu_phi"]);

      return {
        id,
        label,
        isAvailable,
        seatTypeName,
        extraFee,
      } satisfies SeatData;
    })
    .filter(Boolean) as SeatData[];
};

const groupSeatsByRow = (seats: SeatData[]) => {
  const map = new Map<string, SeatData[]>();

  seats.forEach((seat) => {
    const row = seat.label.slice(0, 1).toUpperCase();
    const list = map.get(row) ?? [];
    list.push(seat);
    map.set(row, list);
  });

  const rows = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, items]) => {
      const sorted = [...items].sort((x, y) => {
        const nx = Number.parseInt(x.label.slice(1), 10);
        const ny = Number.parseInt(y.label.slice(1), 10);
        if (Number.isFinite(nx) && Number.isFinite(ny)) return nx - ny;
        return x.label.localeCompare(y.label);
      });
      return [row, sorted] as const;
    });

  return rows;
};

const MovieDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const movieId = useMemo(() => Number(id), [id]);

  const [movie, setMovie] = useState<MovieDetailData | null>(null);
  const [movieLoading, setMovieLoading] = useState(true);
  const [movieError, setMovieError] = useState<string | null>(null);

  const [showtimes, setShowtimes] = useState<ShowtimeData[]>([]);
  const [showtimesLoading, setShowtimesLoading] = useState(true);
  const [showtimesError, setShowtimesError] = useState<string | null>(null);

  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);

  const [seats, setSeats] = useState<SeatData[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState<string | null>(null);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "holding" | "held" | "paying" | "paid" | "error">("idle");
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [seatReloadToken, setSeatReloadToken] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(movieId)) {
      setMovieError("ID phim không hợp lệ.");
      setMovieLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setMovieLoading(true);
        setMovieError(null);

        const res = await fetch(`${API_BASE_URL}/api/movies/${movieId}`, { signal: controller.signal });
        if (!res.ok) throw new Error();

        const raw = await res.json();
        const normalized = normalizeMovie(raw);
        if (!normalized) {
          setMovieError("Dữ liệu phim không hợp lệ.");
          return;
        }

        setMovie(normalized);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMovieError("Không thể tải chi tiết phim lúc này.");
      } finally {
        setMovieLoading(false);
      }
    })();

    return () => controller.abort();
  }, [movieId]);

  useEffect(() => {
    if (!Number.isFinite(movieId)) return;

    const controller = new AbortController();

    (async () => {
      try {
        setShowtimesLoading(true);
        setShowtimesError(null);

        const res = await fetch(`${API_BASE_URL}/api/showtimes?movieId=${movieId}`, { signal: controller.signal });
        if (!res.ok) throw new Error();

        const raw = await res.json();
        const normalized = normalizeShowtimes(raw, movieId).filter((st) => st.movieId === movieId);
        setShowtimes(normalized);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setShowtimesError("Không thể tải suất chiếu cho phim này.");
      } finally {
        setShowtimesLoading(false);
      }
    })();

    return () => controller.abort();
  }, [movieId]);

  useEffect(() => {
    if (!selectedShowtimeId) return;

    const controller = new AbortController();

    (async () => {
      try {
        setSeatsLoading(true);
        setSeatsError(null);
        setSeats([]);
        setSelectedSeatIds([]);
        setBookingStatus("idle");
        setBookingMessage(null);
        setBookingId(null);
        setHoldExpiresAt(null);
        setConfirmedTotal(null);

        const res = await fetch(`${API_BASE_URL}/api/showtimes/${selectedShowtimeId}/seats`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();

        const raw = await res.json();
        setSeats(normalizeSeats(raw));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSeatsError("Không thể tải sơ đồ ghế cho suất chiếu này.");
      } finally {
        setSeatsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [selectedShowtimeId, seatReloadToken]);

  const selectedShowtime = useMemo(
    () => (selectedShowtimeId ? showtimes.find((s) => s.id === selectedShowtimeId) ?? null : null),
    [selectedShowtimeId, showtimes]
  );

  const seatRows = useMemo(() => groupSeatsByRow(seats), [seats]);

  const totalPrice = useMemo(() => {
    const base = selectedShowtime?.price ?? 0;
    const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id));
    const extras = selectedSeats.reduce((sum, s) => sum + (s.extraFee ?? 0), 0);
    return base * selectedSeatIds.length + extras;
  }, [selectedSeatIds, seats, selectedShowtime?.price]);

  const handleToggleSeat = (seat: SeatData) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) return prev.filter((id) => id !== seat.id);
      return [...prev, seat.id];
    });
  };

  const handleSubmitBooking = async () => {
    if (!movie) return;
    if (!selectedShowtimeId) {
      setBookingStatus("error");
      setBookingMessage("Vui lòng chọn suất chiếu.");
      return;
    }
    if (selectedSeatIds.length === 0) {
      setBookingStatus("error");
      setBookingMessage("Vui lòng chọn ghế.");
      return;
    }

    try {
      setBookingStatus("holding");
      setBookingMessage(null);
      setBookingId(null);
      setHoldExpiresAt(null);
      setConfirmedTotal(null);

      let customerId: number | null = null;
      try {
        const raw = localStorage.getItem("user");
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
          const rec = parsed as Record<string, unknown>;
          if (rec.role === "customer" && typeof rec.id === "number") customerId = rec.id;
        }
      } catch {
        customerId = null;
      }

      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({
          movieId: movie.id,
          showtimeId: selectedShowtimeId,
          seatIds: selectedSeatIds,
          customerId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setBookingStatus("error");
        setBookingMessage(data?.error || "Giữ chỗ không thành công.");
        return;
      }

      const idHd = typeof data?.bookingId === "number" ? data.bookingId : null;
      setBookingId(idHd);
      setHoldExpiresAt(typeof data?.holdExpiresAt === "string" ? data.holdExpiresAt : null);
      setConfirmedTotal(typeof data?.total === "number" ? data.total : null);

      setBookingStatus("held");
      setBookingMessage("Giữ chỗ thành công. Vui lòng thanh toán trước khi hết hạn.");
    } catch {
      setBookingStatus("error");
      setBookingMessage("Không thể kết nối để giữ chỗ. Vui lòng thử lại.");
    }
  };

  const handlePayBooking = async () => {
    if (!bookingId) return;

    try {
      setBookingStatus("paying");
      setBookingMessage(null);

      let customerId: number | null = null;
      try {
        const raw = localStorage.getItem("user");
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
          const rec = parsed as Record<string, unknown>;
          if (rec.role === "customer" && typeof rec.id === "number") customerId = rec.id;
        }
      } catch {
        customerId = null;
      }

      const res = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ bookingId, customerId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setBookingStatus("error");
        setBookingMessage(data?.error || "Thanh toán không thành công.");
        return;
      }

      setBookingStatus("paid");
      setBookingMessage("Thanh toán thành công.");
      setSeatReloadToken((x) => x + 1);
    } catch {
      setBookingStatus("error");
      setBookingMessage("Không thể kết nối để thanh toán. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (bookingStatus !== "held") return;

    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [bookingStatus]);

  const holdRemainingSeconds = useMemo(() => {
    if (!holdExpiresAt) return null;
    const expiresMs = new Date(holdExpiresAt).getTime();
    if (!Number.isFinite(expiresMs)) return null;
    return Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
  }, [holdExpiresAt, nowMs]);

  useEffect(() => {
    if (bookingStatus !== "held") return;
    if (holdRemainingSeconds == null) return;
    if (holdRemainingSeconds > 0) return;

    setBookingStatus("error");
    setBookingMessage("Hết thời gian giữ chỗ. Vui lòng chọn ghế và giữ chỗ lại.");
    setBookingId(null);
    setHoldExpiresAt(null);
    setConfirmedTotal(null);
    setSeatReloadToken((x) => x + 1);
  }, [bookingStatus, holdRemainingSeconds]);

  const trailerEmbedSrc = toTrailerEmbedSrc(movie?.trailerUrl);

  return (
    <Background>
      <Header />
      <main className="movie-detail">
        <div className="movies-section__heading">
          <div>
            <p className="movies-section__eyebrow">Chi tiết phim</p>
            <h2 className="movie-detail__title">{movie?.title || "..."}</h2>
          </div>
          <button className="tab-button tab-button--light" type="button" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>

        {movieLoading && (
          <div className="movies-feedback" role="status">
            Đang tải chi tiết phim...
          </div>
        )}

        {!movieLoading && movieError && (
          <div className="movies-feedback movies-feedback--error" role="alert">
            {movieError}
          </div>
        )}

        {!movieLoading && !movieError && movie && (
          <>
            <section className="movie-detail__top">
              <div>
                <h1 className="movie-detail__title">{movie.title}</h1>
                <div className="movie-detail__meta">
                  <p>
                    <strong>Thể loại:</strong> {joinOrFallback(movie.genres, "Đang cập nhật")}
                  </p>
                  <p>
                    <strong>Đạo diễn:</strong> {joinOrFallback(movie.directors, "Đang cập nhật")}
                  </p>
                  <p>
                    <strong>Diễn viên:</strong> {joinOrFallback(movie.actors, "Đang cập nhật")}
                  </p>
                  {movie.durationMinutes != null && (
                    <p>
                      <strong>Thời lượng:</strong> {movie.durationMinutes} phút
                    </p>
                  )}
                  {movie.releaseDate && (
                    <p>
                      <strong>Khởi chiếu:</strong> {movie.releaseDate}
                    </p>
                  )}
                  {movie.description && (
                    <p>
                      <strong>Mô tả:</strong> {movie.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="movie-detail__poster" aria-label="Poster phim">
                {movie.posterUrl ? <img src={movie.posterUrl} alt={`Poster phim ${movie.title}`} /> : null}
              </div>
            </section>

            <section className="movie-detail__trailer">
              <h2>Trailer</h2>
              {trailerEmbedSrc ? (
                <iframe
                  className="movie-detail__iframe"
                  src={trailerEmbedSrc}
                  title={`Trailer phim ${movie.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="movies-feedback">Trailer đang cập nhật hoặc link trailer không đúng định dạng YouTube.</div>
              )}
            </section>

            <section className="movie-booking">
              <h2>Đặt vé</h2>

              {showtimesLoading && <div className="movies-feedback">Đang tải suất chiếu...</div>}

              {!showtimesLoading && showtimesError && (
                <div className="movies-feedback movies-feedback--error">{showtimesError}</div>
              )}

              {!showtimesLoading && !showtimesError && showtimes.length === 0 && (
                <div className="movies-feedback">Chưa có suất chiếu cho phim này.</div>
              )}

              {!showtimesLoading && !showtimesError && showtimes.length > 0 && (
                <>
                  <div className="showtime-list" aria-label="Danh sách suất chiếu">
                    {showtimes.map((st) => {
                      const parsedStart = new Date(st.startTime);
                      const startLabel = Number.isNaN(parsedStart.getTime())
                        ? st.startTime
                        : parsedStart.toLocaleString("vi-VN");
                      const label = `${startLabel} • ${st.cinemaName} • ${st.roomName}`;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          className={`showtime-chip ${selectedShowtimeId === st.id ? "is-active" : ""}`}
                          onClick={() => setSelectedShowtimeId(st.id)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {selectedShowtime && (
                    <div className="booking-seats">
                      {seatsLoading && <div className="movies-feedback">Đang tải ghế...</div>}

                      {!seatsLoading && seatsError && (
                        <div className="movies-feedback movies-feedback--error">{seatsError}</div>
                      )}

                      {!seatsLoading && !seatsError && seats.length === 0 && (
                        <div className="movies-feedback">Chưa có dữ liệu ghế cho suất chiếu này.</div>
                      )}

                      {!seatsLoading && !seatsError && seats.length > 0 && (
                        <>
                          <div className="seat-grid" aria-label="Sơ đồ ghế">
                            {seatRows.map(([rowLabel, rowSeats]) => (
                              <div key={rowLabel} className="seat-row">
                                <div className="seat-row__label">{rowLabel}</div>
                                {rowSeats.map((seat) => {
                                  const isSelected = selectedSeatIds.includes(seat.id);
                                  return (
                                    <button
                                      key={seat.id}
                                      type="button"
                                      disabled={!seat.isAvailable || bookingStatus === "holding" || bookingStatus === "paying" || bookingStatus === "paid"}
                                      className={`seat ${isSelected ? "is-selected" : ""}`}
                                      onClick={() => handleToggleSeat(seat)}
                                      aria-label={`${seat.label}${seat.seatTypeName ? ` (${seat.seatTypeName})` : ""}`}
                                    >
                                      {seat.label.slice(1)}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          <div className="booking-actions">
                            <div className="booking-total">
                              Tổng: {(confirmedTotal ?? totalPrice).toLocaleString("vi-VN")} đ
                            </div>

                            {bookingStatus !== "held" && bookingStatus !== "paid" && (
                              <button
                                type="button"
                                className="booking-submit"
                                onClick={handleSubmitBooking}
                                disabled={bookingStatus === "holding" || bookingStatus === "paying"}
                              >
                                {bookingStatus === "holding" ? "Đang giữ chỗ..." : "Giữ chỗ"}
                              </button>
                            )}

                            {bookingStatus === "held" && (
                              <button type="button" className="booking-submit" onClick={handlePayBooking}>
                                Thanh toán
                              </button>
                            )}

                            {bookingStatus === "paying" && (
                              <button type="button" className="booking-submit" disabled>
                                Đang thanh toán...
                              </button>
                            )}

                            {bookingStatus === "paid" && (
                              <button type="button" className="booking-submit" disabled>
                                Đã thanh toán
                              </button>
                            )}
                          </div>

                          {bookingStatus === "held" && holdRemainingSeconds != null && (
                            <div className="movies-feedback" role="status">
                              Giữ chỗ còn: {Math.floor(holdRemainingSeconds / 60)}:{String(holdRemainingSeconds % 60).padStart(2, "0")}
                            </div>
                          )}

                          {bookingMessage && (
                            <div
                              className={`movies-feedback ${bookingStatus === "error" ? "movies-feedback--error" : ""}`}
                              role={bookingStatus === "error" ? "alert" : "status"}
                            >
                              {bookingMessage}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </Background>
  );
};

export default MovieDetailPage;