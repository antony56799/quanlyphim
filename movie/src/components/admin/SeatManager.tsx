import { useMemo, useRef, useState } from "react";
import type { Cinema, Room, Seat, SeatType } from "../../types/admin";

type SeatDraft = {
  hang: string;
  so: number;
  id_loaighe: number | null;
  tinhtrang: boolean;
};

const toRowLabel = (index: number) => {
  let n = index;
  let label = "";
  while (n >= 0) {
    label = String.fromCharCode((n % 26) + 65) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
};

const rowLabelToIndex = (label: string) => {
  const s = label.trim().toUpperCase();
  if (!s) return 0;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 65 || code > 90) return 0;
    n = n * 26 + (code - 64);
  }
  return n - 1;
};

const seatKey = (hang: string, so: number) => `${hang.trim().toUpperCase()}|${so}`;

interface SeatManagerProps {
  apiBaseUrl: string;
  cinemas: Cinema[];
}

const SeatManager = ({ apiBaseUrl, cinemas }: SeatManagerProps) => {
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | "">("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");

  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const [activeSeatTab, setActiveSeatTab] = useState<"list" | "map">("list");

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [seatForm, setSeatForm] = useState<SeatDraft>({
    hang: "A",
    so: 1,
    id_loaighe: null,
    tinhtrang: true,
  });

  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(10);
  const [gridDefaultSeatTypeId, setGridDefaultSeatTypeId] = useState<number | "">("");
  const [gridDefaultTinhTrang, setGridDefaultTinhTrang] = useState(true);
  const [previewSeats, setPreviewSeats] = useState<Map<string, SeatDraft>>(new Map());
  const [selectedPreviewKey, setSelectedPreviewKey] = useState<string | null>(null);
  const hasLoadedSeatTypesRef = useRef(false);

  const loadRoomsForCinema = async (cinemaId: number) => {
    const response = await fetch(`${apiBaseUrl}/api/admin/phong-chieu?id_rap=${cinemaId}`);
    if (!response.ok) return;
    const data = await response.json();
    setRooms(Array.isArray(data) ? data : []);
  };

  const loadSeatTypes = async () => {
    const response = await fetch(`${apiBaseUrl}/api/admin/loaighe`);
    if (!response.ok) return;
    const data = await response.json();
    setSeatTypes(Array.isArray(data) ? data : []);
  };

  const ensureSeatTypesLoaded = () => {
    if (hasLoadedSeatTypesRef.current) return;
    hasLoadedSeatTypesRef.current = true;
    void loadSeatTypes();
  };

  const loadSeats = async (roomId: number) => {
    const response = await fetch(`${apiBaseUrl}/api/admin/ghe?id_pc=${roomId}`);
    if (!response.ok) return;
    const data = await response.json();
    setSeats(Array.isArray(data) ? data : []);
  };

  const resetPreviewFromDb = () => {
    const next = new Map<string, SeatDraft>();
    let maxRow = 0;
    let maxCol = 0;

    for (const s of seats) {
      const hang = String(s.hang ?? "").trim().toUpperCase();
      const so = Number(s.so);
      if (!hang || Number.isNaN(so)) continue;

      maxRow = Math.max(maxRow, rowLabelToIndex(hang));
      maxCol = Math.max(maxCol, so);
      next.set(seatKey(hang, so), {
        hang,
        so,
        id_loaighe: s.id_loaighe ?? null,
        tinhtrang: s.tinhtrang,
      });
    }

    setGridRows(Math.max(maxRow + 1, 1));
    setGridCols(Math.max(maxCol, 1));
    setPreviewSeats(next);
    setSelectedPreviewKey(null);
  };

  const handleCreateSeat = async () => {
    if (selectedRoomId === "") return;
    const response = await fetch(`${apiBaseUrl}/api/admin/ghe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_pc: selectedRoomId,
        hang: seatForm.hang,
        so: seatForm.so,
        id_loaighe: seatForm.id_loaighe,
        tinhtrang: seatForm.tinhtrang,
      }),
    });
    if (!response.ok) return;
    setSeatForm((prev) => ({ ...prev, hang: "A", so: 1, tinhtrang: true }));
    await loadSeats(selectedRoomId);
  };

  const handleUpdateSeat = async () => {
    if (!selectedSeat) return;
    const response = await fetch(`${apiBaseUrl}/api/admin/ghe/${selectedSeat.id_ghe}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hang: seatForm.hang,
        so: seatForm.so,
        id_loaighe: seatForm.id_loaighe,
        tinhtrang: seatForm.tinhtrang,
      }),
    });
    if (!response.ok) return;
    if (selectedRoomId !== "") await loadSeats(selectedRoomId);
  };

  const handleDeleteSeat = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa ghế này?")) return;
    const response = await fetch(`${apiBaseUrl}/api/admin/ghe/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    if (selectedSeat?.id_ghe === id) setSelectedSeat(null);
    if (selectedRoomId !== "") await loadSeats(selectedRoomId);
  };

  const buildFullGridPreview = () => {
    const next = new Map<string, SeatDraft>();
    const defaultLoai = gridDefaultSeatTypeId === "" ? null : gridDefaultSeatTypeId;

    for (let r = 0; r < gridRows; r++) {
      const hang = toRowLabel(r);
      for (let c = 1; c <= gridCols; c++) {
        next.set(seatKey(hang, c), {
          hang,
          so: c,
          id_loaighe: defaultLoai,
          tinhtrang: gridDefaultTinhTrang,
        });
      }
    }

    setPreviewSeats(next);
    setSelectedPreviewKey(null);
  };

  const previewGridCells = useMemo(() => {
    const cells: { key: string; draft: SeatDraft | null; label: string }[] = [];
    for (let r = 0; r < gridRows; r++) {
      const hang = toRowLabel(r);
      for (let c = 1; c <= gridCols; c++) {
        const key = seatKey(hang, c);
        const draft = previewSeats.get(key) || null;
        cells.push({ key, draft, label: `${hang}${c}` });
      }
    }
    return cells;
  }, [gridCols, gridRows, previewSeats]);

  const selectedPreviewSeat = useMemo(() => {
    if (!selectedPreviewKey) return null;
    return previewSeats.get(selectedPreviewKey) || null;
  }, [previewSeats, selectedPreviewKey]);

  const handleToggleCell = (hang: string, so: number) => {
    const key = seatKey(hang, so);
    setPreviewSeats((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
        if (selectedPreviewKey === key) setSelectedPreviewKey(null);
      } else {
        const defaultLoai = gridDefaultSeatTypeId === "" ? null : gridDefaultSeatTypeId;
        next.set(key, { hang, so, id_loaighe: defaultLoai, tinhtrang: gridDefaultTinhTrang });
        setSelectedPreviewKey(key);
      }
      return next;
    });
  };

  const handleUpdateSelectedPreview = (patch: Partial<SeatDraft>) => {
    if (!selectedPreviewKey) return;
    setPreviewSeats((prev) => {
      const next = new Map(prev);
      const current = next.get(selectedPreviewKey);
      if (!current) return prev;
      const updated = { ...current, ...patch };
      const nextKey = seatKey(updated.hang, updated.so);
      if (nextKey !== selectedPreviewKey) {
        if (next.has(nextKey)) return prev;
        next.delete(selectedPreviewKey);
        next.set(nextKey, updated);
        setSelectedPreviewKey(nextKey);
        return next;
      }
      next.set(selectedPreviewKey, updated);
      return next;
    });
  };

  const handleSaveLayout = async () => {
    if (selectedRoomId === "") return;
    const payload = Array.from(previewSeats.values()).map((s) => ({
      hang: s.hang,
      so: s.so,
      id_loaighe: s.id_loaighe,
      tinhtrang: s.tinhtrang,
    }));

    const response = await fetch(`${apiBaseUrl}/api/admin/ghe/bulk-save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_pc: selectedRoomId, seats: payload }),
    });
    if (!response.ok) return;
    await loadSeats(selectedRoomId);
    resetPreviewFromDb();
  };

  return (
    <>
      <section className="admin-content">
        <div className="top-tabs-container">
          <div className="sub-tabs">
            <button
              onClick={() => {
                ensureSeatTypesLoaded();
                setActiveSeatTab("list");
              }}
              className={`tab-button ${activeSeatTab === "list" ? "active" : ""}`}
              disabled={selectedRoomId === ""}
            >
              Danh sách ghế
            </button>
            <button
              onClick={() => {
                ensureSeatTypesLoaded();
                setActiveSeatTab("map");
                resetPreviewFromDb();
              }}
              className={`tab-button ${activeSeatTab === "map" ? "active" : ""}`}
              disabled={selectedRoomId === ""}
            >
              Sơ đồ ghế
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <div className="table-header">
            <h2 className="table-title">Quản lý ghế</h2>
            <div className="table-controls">
              <select
                className="filter-select"
                value={selectedCinemaId}
                onChange={(e) => {
                  ensureSeatTypesLoaded();
                  const nextCinemaId = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedCinemaId(nextCinemaId);
                  setSelectedRoomId("");
                  setRooms([]);
                  setSeats([]);
                  setSelectedSeat(null);
                  setActiveSeatTab("list");
                  setSelectedPreviewKey(null);
                  setPreviewSeats(new Map());
                  if (nextCinemaId !== "") void loadRoomsForCinema(nextCinemaId);
                }}
              >
                <option value="">Chọn rạp</option>
                {cinemas.map((c) => (
                  <option key={c.id_rap} value={c.id_rap}>
                    {c.diachi || `Rạp ${c.id_rap}`}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={selectedRoomId}
                onChange={(e) => {
                  ensureSeatTypesLoaded();
                  const nextRoomId = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedRoomId(nextRoomId);
                  setSeats([]);
                  setSelectedSeat(null);
                  setActiveSeatTab("list");
                  setSelectedPreviewKey(null);
                  setPreviewSeats(new Map());
                  if (nextRoomId !== "") void loadSeats(nextRoomId);
                }}
                disabled={selectedCinemaId === ""}
              >
                <option value="">Chọn phòng</option>
                {rooms.map((r) => (
                  <option key={r.id_pc} value={r.id_pc}>
                    {r.ten_phong || `Phòng ${r.id_pc}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedRoomId === "" ? (
            <div className="empty-message">
              <p>Vui lòng chọn rạp và phòng chiếu để quản lý ghế</p>
            </div>
          ) : activeSeatTab === "list" ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên ghế</th>
                  <th>Hàng</th>
                  <th>Số</th>
                  <th>Loại ghế</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((s) => (
                  <tr
                    key={s.id_ghe}
                    className="clickable-row"
                    onClick={() => {
                      setSelectedSeat(s);
                      setSeatForm({
                        hang: s.hang,
                        so: s.so,
                        id_loaighe: s.id_loaighe ?? null,
                        tinhtrang: s.tinhtrang,
                      });
                    }}
                  >
                    <td>{s.id_ghe}</td>
                    <td className="bold">{`${s.hang}${s.so}`}</td>
                    <td>{s.hang}</td>
                    <td>{s.so}</td>
                    <td>{s.ten_loaighe || seatTypes.find((t) => t.id_loaighe === s.id_loaighe)?.ten_loaighe || "N/A"}</td>
                    <td>{s.tinhtrang ? "Có sẵn" : "Không hoạt động"}</td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeat(s.id_ghe);
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
          ) : (
            <>
              <div className="table-header" style={{ marginTop: 16 }}>
                <h3 className="table-title">Thiết lập sơ đồ nhanh</h3>
                <div className="table-controls">
                  <input
                    className="filter-select"
                    type="number"
                    min={1}
                    value={gridRows}
                    onChange={(e) => setGridRows(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <input
                    className="filter-select"
                    type="number"
                    min={1}
                    value={gridCols}
                    onChange={(e) => setGridCols(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <select
                    className="filter-select"
                    value={gridDefaultSeatTypeId}
                    onChange={(e) => setGridDefaultSeatTypeId(e.target.value ? parseInt(e.target.value) : "")}
                    onFocus={ensureSeatTypesLoaded}
                  >
                    <option value="">Loại ghế mặc định</option>
                    {seatTypes.map((t) => (
                      <option key={t.id_loaighe} value={t.id_loaighe}>
                        {t.ten_loaighe} (+{t.phu_phi.toLocaleString()} đ)
                      </option>
                    ))}
                  </select>
                  <select
                    className="filter-select"
                    value={gridDefaultTinhTrang ? "true" : "false"}
                    onChange={(e) => setGridDefaultTinhTrang(e.target.value === "true")}
                  >
                    <option value="true">Có sẵn</option>
                    <option value="false">Không hoạt động</option>
                  </select>
                  <button className="tab-button active" onClick={buildFullGridPreview}>
                    Tạo sơ đồ
                  </button>
                  <button className="tab-button" onClick={resetPreviewFromDb}>
                    Reset
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${gridCols}, minmax(36px, 1fr))`,
                  gap: 8,
                  paddingTop: 12,
                }}
              >
                {previewGridCells.map(({ key, draft, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const [hang, soStr] = key.split("|");
                      handleToggleCell(hang, parseInt(soStr));
                    }}
                    className={`tab-button ${selectedPreviewKey === key ? "active" : ""}`}
                    style={{
                      padding: "8px 6px",
                      opacity: draft ? 1 : 0.35,
                      cursor: "pointer",
                    }}
                    title={draft ? "Click để xóa" : "Click để thêm"}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="button" className="submit-button" onClick={handleSaveLayout}>
                  Lưu sơ đồ
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <aside className="right-form-aside">
        {selectedRoomId === "" ? (
          <div className="empty-message-small">
            <p>Chọn rạp và phòng để chỉnh sửa ghế</p>
          </div>
        ) : activeSeatTab === "list" ? (
          <>
            <h3 className="form-title">{selectedSeat ? "Chỉnh sửa ghế" : "Thêm ghế"}</h3>
            <form
              className="admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedSeat) handleUpdateSeat();
                else handleCreateSeat();
              }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label>Hàng</label>
                  <input
                    type="text"
                    value={seatForm.hang}
                    onChange={(e) => setSeatForm((prev) => ({ ...prev, hang: e.target.value.toUpperCase() }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số</label>
                  <input
                    type="number"
                    min={1}
                    value={seatForm.so}
                    onChange={(e) => setSeatForm((prev) => ({ ...prev, so: Math.max(1, parseInt(e.target.value) || 1) }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Loại ghế</label>
                <select
                  value={seatForm.id_loaighe ?? ""}
                  onChange={(e) =>
                    setSeatForm((prev) => ({ ...prev, id_loaighe: e.target.value ? parseInt(e.target.value) : null }))
                  }
                  onFocus={ensureSeatTypesLoaded}
                >
                  <option value="">Chọn loại ghế</option>
                  {seatTypes.map((t) => (
                    <option key={t.id_loaighe} value={t.id_loaighe}>
                      {t.ten_loaighe} (+{t.phu_phi.toLocaleString()} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={seatForm.tinhtrang ? "true" : "false"}
                  onChange={(e) => setSeatForm((prev) => ({ ...prev, tinhtrang: e.target.value === "true" }))}
                >
                  <option value="true">Có sẵn</option>
                  <option value="false">Không hoạt động</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {selectedSeat ? "Cập nhật" : "Thêm mới"}
                </button>
                {selectedSeat && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeat(null);
                      setSeatForm({ hang: "A", so: 1, id_loaighe: null, tinhtrang: true });
                    }}
                    className="cancel-button"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="form-title">Chỉnh sửa ô ghế</h3>
            {!selectedPreviewKey || !selectedPreviewSeat ? (
              <div className="empty-message-small">
                <p>Click một ô trong sơ đồ để chỉnh sửa</p>
              </div>
            ) : (
              <form
                className="admin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>Hàng</label>
                    <input
                      type="text"
                      value={selectedPreviewSeat.hang}
                      onChange={(e) => handleUpdateSelectedPreview({ hang: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Số</label>
                    <input
                      type="number"
                      min={1}
                      value={selectedPreviewSeat.so}
                      onChange={(e) => handleUpdateSelectedPreview({ so: Math.max(1, parseInt(e.target.value) || 1) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Loại ghế</label>
                  <select
                    value={selectedPreviewSeat.id_loaighe ?? ""}
                    onChange={(e) => handleUpdateSelectedPreview({ id_loaighe: e.target.value ? parseInt(e.target.value) : null })}
                    onFocus={ensureSeatTypesLoaded}
                  >
                    <option value="">Chọn loại ghế</option>
                    {seatTypes.map((t) => (
                      <option key={t.id_loaighe} value={t.id_loaighe}>
                        {t.ten_loaighe} (+{t.phu_phi.toLocaleString()} đ)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={selectedPreviewSeat.tinhtrang ? "true" : "false"}
                    onChange={(e) => handleUpdateSelectedPreview({ tinhtrang: e.target.value === "true" })}
                  >
                    <option value="true">Có sẵn</option>
                    <option value="false">Không hoạt động</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="delete-button-small"
                    onClick={() => {
                      setPreviewSeats((prev) => {
                        const next = new Map(prev);
                        next.delete(selectedPreviewKey);
                        return next;
                      });
                      setSelectedPreviewKey(null);
                    }}
                  >
                    Xóa ghế
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </aside>
    </>
  );
};

export default SeatManager;
