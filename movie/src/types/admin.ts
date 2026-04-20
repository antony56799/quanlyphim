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
  trang_thai: boolean;
}

export interface Room {
  id_pc: number;
  id_rap: number;
  id_loai: number;
  ten_phong: string;
  trang_thai: boolean;
  suc_chua: number;
  ten_loai?: string;
  ten_rap?: string;
}

export interface RoomType {
  id_loai: number;
  ten_loai: string;
  gia: number;
}

export interface SeatType {
  id_loaighe: number;
  ten_loaighe: string;
  phu_phi: number;
}

export interface Seat {
  id_ghe: number;
  hang: string;
  so: number;
  tinhtrang: boolean;
  id_loaighe: number | null;
  ten_loaighe?: string | null;
  phu_phi?: number | null;
}
export interface BasePrice {
  id_gia: number;
  ten_bang_gia: string;
  gia_tien: number;
  loai_ngay?: string;
  hieu_luc_tu?: string | null;
  hieu_luc_den?: string | null;
}

export interface Showtime {
  id_sc: number;
  id_phim: number;
  ten_phim: string;
  id_pc: number;
  ten_phong: string;
  id_rap: number;
  ten_rap: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  id_gia: number;
  ten_bang_gia: string;
  loai_ngay?: string;
  gia_tien: number;
}