export type MovieCardData = {
  id: number;
  title: string;
  posterUrl: string | null;
  genres: string[];
  directors: string[];
  actors: string[];
};

export type MovieDetailData = MovieCardData & {
  description?: string | null;
  trailerUrl?: string | null;
  durationMinutes?: number | null;
  releaseDate?: string | null;
};

export type ShowtimeData = {
  id: number;
  movieId: number;
  cinemaName: string;
  roomName: string;
  startTime: string;
  endTime?: string | null;
  price?: number | null;
};

export type SeatData = {
  id: number;
  label: string;
  isAvailable: boolean;
  seatTypeName?: string | null;
  extraFee?: number | null;
};
