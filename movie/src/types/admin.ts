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

export interface Cinema {
  id_rap: number;
  diachi: string;
  sdt_rap: string;
  trang_thai: string;
}

export interface Room {
  id_pc: number;
  id_rap: number;
  id_loai: number;
  ten_phong: string;
  trang_thai: string;
  suc_chua: number;
  ten_loai?: string;
  ten_rap?: string;
}

export interface RoomType {
  id_loai: number;
  ten_loai: string;
  gia: number;
}
