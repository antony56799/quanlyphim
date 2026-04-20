import { useCallback, useEffect, useMemo, useState } from "react";
import type { Staff } from "../../types/admin";

type StaffDraft = {
  ten_nv: string;
  email_nv: string;
  trang_thai: string;
  id_cv: number;
  password_nv: string;
};

const extractArray = (data: unknown) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: unknown[] }).data;
  }
  return [];
};

const toStaff = (raw: unknown, index: number): Staff => {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const id = Number(obj.id_nv ?? obj.id ?? index + 1);
  const ten = String(obj.ten_nv ?? obj.ten ?? obj.name ?? "");
  const email = String(obj.email_nv ?? obj.email ?? "");
  const trangThai = String(obj.trang_thai ?? obj.status ?? "Đang làm");
  const idCv = Number(obj.id_cv ?? obj.id_chuc_vu ?? obj.position_id ?? 0);

  return {
    id_nv: Number.isFinite(id) ? id : index + 1,
    ten_nv: ten,
    email_nv: email,
    trang_thai: trangThai,
    id_cv: Number.isFinite(idCv) ? idCv : 0,
  };
};

interface StaffManagerProps {
  apiBaseUrl: string;
}

const StaffManager = ({ apiBaseUrl }: StaffManagerProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selected, setSelected] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffDraft>({
    ten_nv: "",
    email_nv: "",
    trang_thai: "Đang làm",
    id_cv: 0,
    password_nv: "",
  });

  const staffSorted = useMemo(() => {
    const next = [...staff];
    next.sort((a, b) => (a.id_nv || 0) - (b.id_nv || 0));
    return next;
  }, [staff]);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/nhan-vien`);
      if (!res.ok) {
        setStaff([]);
        return;
      }
      const data = await res.json();
      const arr = extractArray(data);
      setStaff(arr.map((x, i) => toStaff(x, i)));
    } catch {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const resetForm = () => {
    setSelected(null);
    setForm({ ten_nv: "", email_nv: "", trang_thai: "Đang làm", id_cv: 0, password_nv: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected && !form.password_nv.trim()) {
      alert("Vui lòng nhập mật khẩu cho nhân viên");
      return;
    }

    const payload: Record<string, unknown> = {
      ten_nv: form.ten_nv.trim(),
      email_nv: form.email_nv.trim(),
      trang_thai: form.trang_thai,
      id_cv: Number(form.id_cv) || 0,
    };

    if (form.password_nv.trim()) payload.password_nv = form.password_nv.trim();

    const url = selected
      ? `${apiBaseUrl}/api/admin/nhan-vien/${selected.id_nv}`
      : `${apiBaseUrl}/api/admin/nhan-vien`;

    const method = selected ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Không thể lưu nhân sự");
        return;
      }

      await loadStaff();
      resetForm();
    } catch {
      alert("Không thể kết nối đến máy chủ");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm(`Xóa nhân sự #${id}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/nhan-vien/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Không thể xóa nhân sự");
        return;
      }
      await loadStaff();
      if (selected?.id_nv === id) resetForm();
    } catch {
      alert("Không thể kết nối đến máy chủ");
    }
  };

  return (
    <>
      <section className="admin-content">
        <div className="top-tabs-container" />
        <div className="table-wrapper">
          <div className="table-header">
            <h2 className="table-title">Quản lý nhân sự</h2>
            <div className="table-controls">
              <button className="tab-button" onClick={() => void loadStaff()}>
                Tải lại
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-text">Đang tải...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Chức vụ</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staffSorted.map((s) => (
                  <tr
                    key={s.id_nv}
                    className="clickable-row"
                    onClick={() => {
                      setSelected(s);
                      setForm({
                        ten_nv: s.ten_nv ?? "",
                        email_nv: s.email_nv ?? "",
                        trang_thai: s.trang_thai ?? "Đang làm",
                        id_cv: Number(s.id_cv) || 0,
                        password_nv: "",
                      });
                    }}
                  >
                    <td>{s.id_nv}</td>
                    <td className="bold">{s.ten_nv}</td>
                    <td>{s.email_nv}</td>
                    <td>{s.id_cv}</td>
                    <td>{s.trang_thai}</td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id_nv);
                        }}
                        className="delete-button-small"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {staffSorted.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <aside className="right-form-aside">
        <h3 className="form-title">{selected ? "Chỉnh sửa nhân sự" : "Thêm nhân sự"}</h3>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Họ tên</label>
            <input
              type="text"
              required
              value={form.ten_nv}
              onChange={(e) => setForm((prev) => ({ ...prev, ten_nv: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email_nv}
              onChange={(e) => setForm((prev) => ({ ...prev, email_nv: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu {selected ? "(để trống nếu không đổi)" : ""}</label>
            <input
              type="password"
              required={!selected}
              value={form.password_nv}
              onChange={(e) => setForm((prev) => ({ ...prev, password_nv: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Chức vụ (ID)</label>
            <input
              type="number"
              min={0}
              value={form.id_cv}
              onChange={(e) => setForm((prev) => ({ ...prev, id_cv: parseInt(e.target.value || "0") || 0 }))}
            />
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              value={form.trang_thai}
              onChange={(e) => setForm((prev) => ({ ...prev, trang_thai: e.target.value }))}
            >
              <option value="Đang làm">Đang làm</option>
              <option value="Nghỉ việc">Nghỉ việc</option>
              <option value="Tạm khóa">Tạm khóa</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {selected ? "Cập nhật" : "Thêm mới"}
            </button>
            {selected && (
              <button type="button" onClick={resetForm} className="cancel-button">
                Hủy
              </button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
};

export default StaffManager;