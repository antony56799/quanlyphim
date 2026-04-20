import { useCallback, useEffect, useMemo, useState } from "react";
import type { Account } from "../../types/admin";

type AccountDraft = {
  email: string;
  name: string;
  role: string;
  trang_thai: string;
  id_nv: number | "";
  password: string;
};

const extractArray = (data: unknown) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: unknown[] }).data;
  }
  return [];
};

const toAccount = (raw: unknown, index: number): Account => {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const id = Number(obj.id_tk ?? obj.id_user ?? obj.id ?? index + 1);
  const email = String(obj.email ?? obj.tai_khoan ?? obj.username ?? "");
  const name = obj.name != null ? String(obj.name) : obj.ten != null ? String(obj.ten) : undefined;
  const role = obj.role != null ? String(obj.role) : obj.vai_tro != null ? String(obj.vai_tro) : undefined;
  const trangThai =
    obj.trang_thai != null ? String(obj.trang_thai) : obj.status != null ? String(obj.status) : undefined;
  const idNv = obj.id_nv == null ? undefined : Number(obj.id_nv);

  return {
    id_tk: Number.isFinite(id) ? id : index + 1,
    email,
    name,
    role,
    trang_thai: trangThai,
    id_nv: Number.isFinite(idNv as number) ? (idNv as number) : undefined,
  };
};

interface AccountManagerProps {
  apiBaseUrl: string;
}

const AccountManager = ({ apiBaseUrl }: AccountManagerProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selected, setSelected] = useState<Account | null>(null);
  const [form, setForm] = useState<AccountDraft>({
    email: "",
    name: "",
    role: "user",
    trang_thai: "active",
    id_nv: "",
    password: "",
  });

  const accountsSorted = useMemo(() => {
    const next = [...accounts];
    next.sort((a, b) => (a.id_tk || 0) - (b.id_tk || 0));
    return next;
  }, [accounts]);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/tai-khoan`);
      if (!res.ok) {
        setAccounts([]);
        return;
      }
      const data = await res.json();
      const arr = extractArray(data);
      setAccounts(arr.map((x, i) => toAccount(x, i)));
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const resetForm = () => {
    setSelected(null);
    setForm({ email: "", name: "", role: "user", trang_thai: "active", id_nv: "", password: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      email: form.email.trim(),
      name: form.name.trim() || undefined,
      role: form.role,
      trang_thai: form.trang_thai,
      id_nv: form.id_nv === "" ? null : Number(form.id_nv),
    };

    const password = form.password.trim();
    if (password) payload.password = password;

    const url = selected
      ? `${apiBaseUrl}/api/admin/tai-khoan/${selected.id_tk}`
      : `${apiBaseUrl}/api/admin/tai-khoan`;

    const method = selected ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Không thể lưu tài khoản");
        return;
      }

      await loadAccounts();
      resetForm();
    } catch {
      alert("Không thể kết nối đến máy chủ");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm(`Xóa tài khoản #${id}?`);
    if (!ok) return;

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/tai-khoan/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Không thể xóa tài khoản");
        return;
      }
      await loadAccounts();
      if (selected?.id_tk === id) resetForm();
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
            <h2 className="table-title">Quản lý tài khoản</h2>
            <div className="table-controls">
              <button className="tab-button" onClick={() => void loadAccounts()}>
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
                  <th>Email</th>
                  <th>Tên</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>ID NV</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accountsSorted.map((a) => (
                  <tr
                    key={a.id_tk}
                    className="clickable-row"
                    onClick={() => {
                      setSelected(a);
                      setForm({
                        email: a.email ?? "",
                        name: a.name ?? "",
                        role: (a.role ?? "user").toLowerCase(),
                        trang_thai: (a.trang_thai ?? "active").toLowerCase(),
                        id_nv: a.id_nv == null ? "" : Number(a.id_nv),
                        password: "",
                      });
                    }}
                  >
                    <td>{a.id_tk}</td>
                    <td className="bold">{a.email}</td>
                    <td>{a.name || "-"}</td>
                    <td>{a.role || "-"}</td>
                    <td>{a.trang_thai || "-"}</td>
                    <td>{a.id_nv ?? "-"}</td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id_tk);
                        }}
                        className="delete-button-small"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
                {accountsSorted.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
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
        <h3 className="form-title">{selected ? "Chỉnh sửa tài khoản" : "Tạo tài khoản"}</h3>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Tên hiển thị</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Vai trò</label>
            <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Trạng thái</label>
            <select
              value={form.trang_thai}
              onChange={(e) => setForm((prev) => ({ ...prev, trang_thai: e.target.value }))}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nhân viên (ID, nếu có)</label>
            <input
              type="number"
              min={0}
              value={form.id_nv}
              onChange={(e) => setForm((prev) => ({ ...prev, id_nv: e.target.value ? parseInt(e.target.value) : "" }))}
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu {selected ? "(để trống nếu không đổi)" : ""}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
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

export default AccountManager;