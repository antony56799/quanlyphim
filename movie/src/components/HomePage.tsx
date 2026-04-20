import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bannerImage from "../assets/banner.png";
import type { MovieCardData } from "../types/movie";
import Background from "./layout/Background";
import Header from "./layout/Header";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const joinOrFallback = (items: string[], fallback: string) =>
  items.length > 0 ? items.join(", ") : fallback;

const HomePage = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MovieCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMovies() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/movies`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Khong the tai danh sach phim luc nay.");
        }

        const data: MovieCardData[] = await response.json();
        setMovies(data);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError("Khong the ket noi den du lieu phim. Vui long thu lai sau.");
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();

    return () => controller.abort();
  }, []);

  return (
    <Background>
      <Header />
      <main className="home-page">
        <section className="home-hero">
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">Cinema Experience</p>
            <h1>Khám phá thế giới phim tại Lodestar.</h1>
            <p className="home-hero__text">Chọn bộ phim bạn yêu thích và đặt vé</p>
          </div>
          <div className="home-hero__media">
            <img src={bannerImage} alt="Banner giới thiệu phim" className="home-hero__image" />
          </div>
        </section>

        <section className="movies-section" aria-labelledby="movies-title">
          <div className="movies-section__heading">
            <div>
              <p className="movies-section__eyebrow">Danh sách phim</p>
              <h2>Đang chiếu</h2>
            </div>
            {!isLoading && !error && <span>{movies.length} phim</span>}
          </div>

          {isLoading && (
            <div className="movies-feedback" role="status">
              Dang tai danh sach phim...
            </div>
          )}

          {!isLoading && error && (
            <div className="movies-feedback movies-feedback--error" role="alert">
              {error}
            </div>
          )}

          {!isLoading && !error && movies.length === 0 && (
            <div className="movies-feedback">Chua co phim nao trong he thong.</div>
          )}

          {!isLoading && !error && movies.length > 0 && (
            <div className="movie-grid">
              {movies.map((movie) => (
                <article
                  key={movie.id}
                  className="movie-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/movies/${movie.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/movies/${movie.id}`);
                    }
                  }}
                >
                  <div className="movie-card__poster-wrap">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={`Poster phim ${movie.title}`}
                        className="movie-card__poster"
                      />
                    ) : (
                      <div className="movie-card__poster movie-card__poster--placeholder">
                        Khong co poster
                      </div>
                    )}
                  </div>

                  <div className="movie-card__body">
                    <h3>{movie.title}</h3>
                    <p>
                      <strong>Thể loại:</strong> {joinOrFallback(movie.genres, "Dang cap nhat")}
                    </p>
                    <p>
                      <strong>Đạo diễn:</strong>{" "}
                        {joinOrFallback(movie.directors, "Dang cap nhat")}
                    </p>
                    <p>
                      <strong>Diễn viên:</strong> {joinOrFallback(movie.actors, "Dang cap nhat")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Background>
  );
};

export default HomePage;
