export interface Staff {
  id_nv: number;
  ten_nv: string;
  email_nv: string;
  trang_thai: string;
  id_cv: number;
}

export interface Genre {
  id_the_loai: number;
  ten_the_loai: string;
}

export interface AdminMovie {
  id_phim: number;
  ten_phim: string;
  mo_ta: string;
  thoi_luong: number;
  ngay_khoi_chieu: string;
  trang_thai: string;
  poster_url: string;
  trailer_url: string;
  genres: (string | Genre | { name: string })[];
  directors: string[];
  actors: string[];
}
