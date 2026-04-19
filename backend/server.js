const express = require("express");
const cors = require("cors");
const path = require("path");
const { pool, testConnection } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

function buildPosterUrl(req, posterUrl) {
  if (!posterUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(posterUrl)) {
    return posterUrl;
  }

  const normalizedPosterUrl = posterUrl.replace(/^\/+/, "");
  return `${req.protocol}://${req.get("host")}/uploads/${normalizedPosterUrl}`;
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  }
  return undefined;
}

function parseBooleanWithDefault(value, defaultValue) {
  const parsed = parseBoolean(value);
  return parsed === undefined ? defaultValue : parsed;
}

app.get("/", (_req, res) => {
  res.json({
    message: "Backend is running",
    database: "movie",
  });
});

app.get("/api/db-check", async (_req, res) => {
  try {
    const info = await testConnection();
    res.json({
      connected: true,
      database: info.database,
      serverTime: info.now,
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

app.get("/api/tables", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_phim,
        p.ten_phim,
        p.poster_url,
        COALESCE(
          ARRAY_AGG(DISTINCT tl.ten_loai) FILTER (WHERE tl.ten_loai IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS genres,
        COALESCE(
          ARRAY_AGG(DISTINCT dd.ten_dao_dien) FILTER (WHERE dd.ten_dao_dien IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS directors,
        COALESCE(
          ARRAY_AGG(DISTINCT dv.ten_dien_vien) FILTER (WHERE dv.ten_dien_vien IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS actors
      FROM phim p
      LEFT JOIN phim_theloai ptl ON p.id_phim = ptl.id_phim
      LEFT JOIN theloai tl ON ptl.id_loai = tl.id_loai
      LEFT JOIN phim_daodien pdd ON p.id_phim = pdd.id_phim
      LEFT JOIN daodien dd ON pdd.id_dao_dien = dd.id_dao_dien
      LEFT JOIN phim_dienvien pdv ON p.id_phim = pdv.id_phim
      LEFT JOIN dienvien dv ON pdv.id_dien_vien = dv.id_dien_vien
      GROUP BY p.id_phim, p.ten_phim, p.poster_url
      ORDER BY p.id_phim
    `);

    const movies = result.rows.map((movie) => ({
      id: movie.id_phim,
      title: movie.ten_phim,
      posterUrl: buildPosterUrl(req, movie.poster_url),
      genres: movie.genres,
      directors: movie.directors,
      actors: movie.actors,
    }));

    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check in staff table first
    const staffResult = await pool.query(
      "SELECT nv.*, cv.ten_cv FROM nhanvien nv JOIN chucvu cv ON nv.id_cv = cv.id_cv WHERE nv.email_nv = $1 AND nv.password_nv = $2",
      [email, password]
    );

    if (staffResult.rows.length > 0) {
      const staff = staffResult.rows[0];
      return res.json({
        success: true,
        user: {
          id: staff.id_nv,
          name: staff.ten_nv,
          email: staff.email_nv,
          role: staff.ten_cv === "Quản trị viên" ? "admin" : "staff",
        },
      });
    }

    // Check in customer table
    const customerResult = await pool.query(
      "SELECT * FROM khachhang WHERE email = $1 AND password_user = $2",
      [email, password]
    );

    if (customerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      return res.json({
        success: true,
        user: {
          id: customer.id_kh,
          name: customer.ten_kh,
          email: customer.email,
          role: "customer",
        },
      });
    }

    res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoints for movie management
app.get("/api/admin/movies", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.*,
        COALESCE(
          ARRAY_AGG(DISTINCT tl.ten_loai) FILTER (WHERE tl.ten_loai IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS genres,
        COALESCE(
          ARRAY_AGG(DISTINCT dd.ten_dao_dien) FILTER (WHERE dd.ten_dao_dien IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS directors,
        COALESCE(
          ARRAY_AGG(DISTINCT dv.ten_dien_vien) FILTER (WHERE dv.ten_dien_vien IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS actors
      FROM phim p
      LEFT JOIN phim_theloai ptl ON p.id_phim = ptl.id_phim
      LEFT JOIN theloai tl ON ptl.id_loai = tl.id_loai
      LEFT JOIN phim_daodien pdd ON p.id_phim = pdd.id_phim
      LEFT JOIN daodien dd ON pdd.id_dao_dien = dd.id_dao_dien
      LEFT JOIN phim_dienvien pdv ON p.id_phim = pdv.id_phim
      LEFT JOIN dienvien dv ON pdv.id_dien_vien = dv.id_dien_vien
      GROUP BY p.id_phim
      ORDER BY p.id_phim DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/genres", async (_req, res) => {
  console.log("GET /api/admin/genres hit");
  try {
    const result = await pool.query(`
      SELECT id_loai, ten_loai
      FROM theloai
      ORDER BY ten_loai
    `);
    console.log("Genres found:", result.rows.length);
    res.json(result.rows.map((row) => ({
      id_the_loai: row.id_loai,
      ten_the_loai: row.ten_loai,
    })));
  } catch (error) {
    console.error("GET /api/admin/genres error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/genres", async (req, res) => {
  const ten_the_loai = req.body.ten_the_loai?.trim();

  if (!ten_the_loai) {
    return res.status(400).json({ error: "Tên thể loại không được để trống" });
  }

  try {
    const existingGenre = await pool.query(
      "SELECT id_loai, ten_loai FROM theloai WHERE LOWER(ten_loai) = LOWER($1)",
      [ten_the_loai]
    );

    if (existingGenre.rows.length > 0) {
      return res.status(409).json({ error: "Thể loại đã tồn tại" });
    }

    const result = await pool.query(
      "INSERT INTO theloai (ten_loai) VALUES ($1) RETURNING id_loai, ten_loai",
      [ten_the_loai]
    );

    return res.status(201).json({
      success: true,
      genre: {
        id_the_loai: result.rows[0].id_loai,
        ten_the_loai: result.rows[0].ten_loai,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/genres/:id", async (req, res) => {
  const { id } = req.params;
  const ten_the_loai = req.body.ten_the_loai?.trim();

  if (!ten_the_loai) {
    return res.status(400).json({ error: "Tên thể loại không được để trống" });
  }

  try {
    const duplicateGenre = await pool.query(
      "SELECT id_loai FROM theloai WHERE LOWER(ten_loai) = LOWER($1) AND id_loai <> $2",
      [ten_the_loai, id]
    );

    if (duplicateGenre.rows.length > 0) {
      return res.status(409).json({ error: "Tên thể loại đã được sử dụng" });
    }

    const result = await pool.query(
      "UPDATE theloai SET ten_loai = $1 WHERE id_loai = $2 RETURNING id_loai, ten_loai",
      [ten_the_loai, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy thể loại" });
    }

    return res.json({
      success: true,
      genre: {
        id_the_loai: result.rows[0].id_loai,
        ten_the_loai: result.rows[0].ten_loai,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/genres/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM phim_theloai WHERE id_loai = $1", [id]);
    const result = await client.query(
      "DELETE FROM theloai WHERE id_loai = $1 RETURNING id_loai",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Không tìm thấy thể loại" });
    }

    await client.query("COMMIT");
    return res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post("/api/admin/movies", async (req, res) => {
  const { ten_phim, mo_ta, thoi_luong, ngay_khoi_chieu, trang_thai, poster_url, trailer_url, genres, directors, actors } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert movie
    const movieResult = await client.query(
      "INSERT INTO phim (ten_phim, mo_ta, thoi_luong, ngay_khoi_chieu, trang_thai, poster_url, trailer_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_phim",
      [ten_phim, mo_ta, thoi_luong, ngay_khoi_chieu, trang_thai, poster_url, trailer_url]
    );
    const movieId = movieResult.rows[0].id_phim;

    // Handle genres
    if (genres && Array.isArray(genres)) {
      for (const genreName of genres) {
        if (!genreName) continue;
        // Find or insert genre
        let genreRes = await client.query("SELECT id_loai FROM theloai WHERE ten_loai = $1", [genreName]);
        let genreId;
        if (genreRes.rows.length === 0) {
          genreRes = await client.query("INSERT INTO theloai (ten_loai) VALUES ($1) RETURNING id_loai", [genreName]);
        }
        genreId = genreRes.rows[0].id_loai;
        // Link to movie
        await client.query("INSERT INTO phim_theloai (id_phim, id_loai) VALUES ($1, $2) ON CONFLICT DO NOTHING", [movieId, genreId]);
      }
    }

    // Handle directors
    if (directors && Array.isArray(directors)) {
      for (const dirName of directors) {
        if (!dirName) continue;
        let dirRes = await client.query("SELECT id_dao_dien FROM daodien WHERE ten_dao_dien = $1", [dirName]);
        let dirId;
        if (dirRes.rows.length === 0) {
          dirRes = await client.query("INSERT INTO daodien (ten_dao_dien) VALUES ($1) RETURNING id_dao_dien", [dirName]);
        }
        dirId = dirRes.rows[0].id_dao_dien;
        await client.query("INSERT INTO phim_daodien (id_phim, id_dao_dien) VALUES ($1, $2) ON CONFLICT DO NOTHING", [movieId, dirId]);
      }
    }

    // Handle actors
    if (actors && Array.isArray(actors)) {
      for (const actorName of actors) {
        if (!actorName) continue;
        let actorRes = await client.query("SELECT id_dien_vien FROM dienvien WHERE ten_dien_vien = $1", [actorName]);
        let actorId;
        if (actorRes.rows.length === 0) {
          actorRes = await client.query("INSERT INTO dienvien (ten_dien_vien) VALUES ($1) RETURNING id_dien_vien", [actorName]);
        }
        actorId = actorRes.rows[0].id_dien_vien;
        await client.query("INSERT INTO phim_dienvien (id_phim, id_dien_vien) VALUES ($1, $2) ON CONFLICT DO NOTHING", [movieId, actorId]);
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, id_phim: movieId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put("/api/admin/movies/:id", async (req, res) => {
  const { id } = req.params;
  const { ten_phim, mo_ta, thoi_luong, ngay_khoi_chieu, trang_thai, poster_url, trailer_url, genres, directors, actors } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update movie info
    await client.query(
      "UPDATE phim SET ten_phim = $1, mo_ta = $2, thoi_luong = $3, ngay_khoi_chieu = $4, trang_thai = $5, poster_url = $6, trailer_url = $7, updated_at = NOW() WHERE id_phim = $8",
      [ten_phim, mo_ta, thoi_luong, ngay_khoi_chieu, trang_thai, poster_url, trailer_url, id]
    );

    // Sync genres
    await client.query("DELETE FROM phim_theloai WHERE id_phim = $1", [id]);
    if (genres && Array.isArray(genres)) {
      for (const genreName of genres) {
        if (!genreName) continue;
        let genreRes = await client.query("SELECT id_loai FROM theloai WHERE ten_loai = $1", [genreName]);
        let genreId;
        if (genreRes.rows.length === 0) {
          genreRes = await client.query("INSERT INTO theloai (ten_loai) VALUES ($1) RETURNING id_loai", [genreName]);
        }
        genreId = genreRes.rows[0].id_loai;
        await client.query("INSERT INTO phim_theloai (id_phim, id_loai) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, genreId]);
      }
    }

    // Sync directors
    await client.query("DELETE FROM phim_daodien WHERE id_phim = $1", [id]);
    if (directors && Array.isArray(directors)) {
      for (const dirName of directors) {
        if (!dirName) continue;
        let dirRes = await client.query("SELECT id_dao_dien FROM daodien WHERE ten_dao_dien = $1", [dirName]);
        let dirId;
        if (dirRes.rows.length === 0) {
          dirRes = await client.query("INSERT INTO daodien (ten_dao_dien) VALUES ($1) RETURNING id_dao_dien", [dirName]);
        }
        dirId = dirRes.rows[0].id_dao_dien;
        await client.query("INSERT INTO phim_daodien (id_phim, id_dao_dien) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, dirId]);
      }
    }

    // Sync actors
    await client.query("DELETE FROM phim_dienvien WHERE id_phim = $1", [id]);
    if (actors && Array.isArray(actors)) {
      for (const actorName of actors) {
        if (!actorName) continue;
        let actorRes = await client.query("SELECT id_dien_vien FROM dienvien WHERE ten_dien_vien = $1", [actorName]);
        let actorId;
        if (actorRes.rows.length === 0) {
          actorRes = await client.query("INSERT INTO dienvien (ten_dien_vien) VALUES ($1) RETURNING id_dien_vien", [actorName]);
        }
        actorId = actorRes.rows[0].id_dien_vien;
        await client.query("INSERT INTO phim_dienvien (id_phim, id_dien_vien) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, actorId]);
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.put("/api/admin/movies/:id/status", async (req, res) => {
  const { id } = req.params;
  const { trang_thai } = req.body;
  try {
    const result = await pool.query(
      "UPDATE phim SET trang_thai = $1, updated_at = NOW() WHERE id_phim = $2 RETURNING *",
      [trang_thai, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RAP (Cinema) Management =====
app.get("/api/admin/rap", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_rap, diachi, sdt_rap, trang_thai
      FROM rap
      ORDER BY id_rap
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/rap error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/rap", async (req, res) => {
  const { diachi, sdt_rap, trang_thai } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rap (diachi, sdt_rap, trang_thai)
       VALUES ($1, $2, $3)
       RETURNING id_rap, diachi, sdt_rap, trang_thai`,
      [diachi, sdt_rap, parseBooleanWithDefault(trang_thai, true)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/admin/rap error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/rap/:id", async (req, res) => {
  const { id } = req.params;
  const { diachi, sdt_rap, trang_thai } = req.body;
  try {
    const parsedTrangThai = parseBoolean(trang_thai);
    const result = await pool.query(
      `UPDATE rap
       SET diachi = COALESCE($1, diachi),
           sdt_rap = COALESCE($2, sdt_rap),
           trang_thai = COALESCE($3, trang_thai)
       WHERE id_rap = $4
       RETURNING id_rap, diachi, sdt_rap, trang_thai`,
      [diachi, sdt_rap, parsedTrangThai, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rạp không tồn tại" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/admin/rap/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/rap/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Check if cinema has rooms
    const checkResult = await pool.query(
      `SELECT COUNT(*) as count FROM phong_chieu WHERE id_rap = $1`,
      [id]
    );
    if (checkResult.rows[0].count > 0) {
      return res.status(400).json({ 
        error: "Không thể xóa rạp vì còn có phòng chiếu liên kết" 
      });
    }
    
    const result = await pool.query(
      `DELETE FROM rap WHERE id_rap = $1 RETURNING id_rap`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Rạp không tồn tại" });
    }
    res.json({ message: "Xóa rạp thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/rap/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/loaiphong", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id_loai,
        ten_loai,
        COALESCE(phu_phi, 0)::float8 AS gia
      FROM loai_phong
      ORDER BY id_loai
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/loaiphong error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/loaiphong", async (req, res) => {
  const { ten_loai, gia } = req.body;
  try {
    if (!ten_loai) {
      return res.status(400).json({ error: "Thiếu thông tin: ten_loai là bắt buộc" });
    }

    const result = await pool.query(
      `INSERT INTO loai_phong (ten_loai, phu_phi)
       VALUES ($1, $2)
       RETURNING id_loai, ten_loai, COALESCE(phu_phi, 0)::float8 AS gia`,
      [ten_loai, gia ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/admin/loaiphong error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/loaiphong/:id", async (req, res) => {
  const { id } = req.params;
  const { ten_loai, gia } = req.body;
  try {
    const result = await pool.query(
      `UPDATE loai_phong
       SET ten_loai = COALESCE($1, ten_loai),
           phu_phi = COALESCE($2, phu_phi)
       WHERE id_loai = $3
       RETURNING id_loai, ten_loai, COALESCE(phu_phi, 0)::float8 AS gia`,
      [ten_loai, gia, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loại phòng không tồn tại" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/admin/loaiphong/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/loaiphong/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const checkResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM phong_chieu WHERE id_loai = $1`,
      [id]
    );

    if (checkResult.rows[0].count > 0) {
      return res.status(400).json({ error: "Không thể xóa loại phòng vì còn phòng chiếu liên kết" });
    }

    const result = await pool.query(
      `DELETE FROM loai_phong WHERE id_loai = $1 RETURNING id_loai`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loại phòng không tồn tại" });
    }

    res.json({ message: "Xóa loại phòng thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/loaiphong/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/loaighe", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id_loaighe,
        ten_loaighe,
        COALESCE(phu_phi, 0)::float8 AS phu_phi
      FROM loai_ghe
      ORDER BY id_loaighe
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/loaighe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/loaighe", async (req, res) => {
  const { ten_loaighe, phu_phi } = req.body;
  try {
    if (!ten_loaighe) {
      return res.status(400).json({ error: "Thiếu thông tin: ten_loaighe là bắt buộc" });
    }

    const result = await pool.query(
      `INSERT INTO loai_ghe (ten_loaighe, phu_phi)
       VALUES ($1, $2)
       RETURNING id_loaighe, ten_loaighe, COALESCE(phu_phi, 0)::float8 AS phu_phi`,
      [ten_loaighe, phu_phi ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/admin/loaighe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/loaighe/:id", async (req, res) => {
  const { id } = req.params;
  const { ten_loaighe, phu_phi } = req.body;
  try {
    const result = await pool.query(
      `UPDATE loai_ghe
       SET ten_loaighe = COALESCE($1, ten_loaighe),
           phu_phi = COALESCE($2, phu_phi)
       WHERE id_loaighe = $3
       RETURNING id_loaighe, ten_loaighe, COALESCE(phu_phi, 0)::float8 AS phu_phi`,
      [ten_loaighe, phu_phi, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loại ghế không tồn tại" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/admin/loaighe/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/loaighe/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const checkResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ghe WHERE id_loaighe = $1`,
      [id]
    );

    if (checkResult.rows[0].count > 0) {
      return res.status(400).json({ error: "Không thể xóa loại ghế vì còn ghế liên kết" });
    }

    const result = await pool.query(
      `DELETE FROM loai_ghe WHERE id_loaighe = $1 RETURNING id_loaighe`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loại ghế không tồn tại" });
    }

    res.json({ message: "Xóa loại ghế thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/loaighe/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/ghe", async (req, res) => {
  const { id_pc } = req.query;
  try {
    if (!id_pc) {
      return res.status(400).json({ error: "Thiếu tham số: id_pc" });
    }

    const result = await pool.query(
      `
      SELECT
        g.id_ghe,
        g.hang,
        g.so,
        g.tinhtrang,
        g.id_loaighe,
        lg.ten_loaighe,
        COALESCE(lg.phu_phi, 0)::float8 AS phu_phi
      FROM ghe g
      LEFT JOIN loai_ghe lg ON g.id_loaighe = lg.id_loaighe
      WHERE g.id_pc = $1
      ORDER BY g.hang, g.so
      `,
      [id_pc]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/ghe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/ghe", async (req, res) => {
  const { id_pc, hang, so, id_loaighe, tinhtrang } = req.body;
  try {
    if (!id_pc || !hang || so === undefined || so === null) {
      return res.status(400).json({ error: "Thiếu thông tin: id_pc, hang, so là bắt buộc" });
    }

    const normalizedHang = String(hang).trim().toUpperCase();
    const normalizedSo = Number(so);

    const exists = await pool.query(
      `SELECT 1 FROM ghe WHERE id_pc = $1 AND UPPER(TRIM(hang)) = $2 AND so = $3 LIMIT 1`,
      [id_pc, normalizedHang, normalizedSo]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Ghế đã tồn tại trong phòng (hang, so)" });
    }

    const result = await pool.query(
      `INSERT INTO ghe (hang, so, tinhtrang, id_loaighe, id_pc)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_ghe, hang, so, tinhtrang, id_loaighe, id_pc`,
      [normalizedHang, normalizedSo, parseBooleanWithDefault(tinhtrang, true), id_loaighe ?? null, id_pc]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/admin/ghe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/ghe/:id", async (req, res) => {
  const { id } = req.params;
  const { hang, so, id_loaighe, tinhtrang } = req.body;
  try {
    const currentRes = await pool.query(`SELECT id_pc, hang, so FROM ghe WHERE id_ghe = $1`, [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: "Ghế không tồn tại" });
    }

    const { id_pc } = currentRes.rows[0];
    const nextHang = hang !== undefined ? String(hang).trim().toUpperCase() : undefined;
    const nextSo = so !== undefined ? Number(so) : undefined;

    if (nextHang !== undefined || nextSo !== undefined) {
      const checkHang = nextHang ?? String(currentRes.rows[0].hang).trim().toUpperCase();
      const checkSo = nextSo ?? Number(currentRes.rows[0].so);
      const exists = await pool.query(
        `SELECT 1 FROM ghe WHERE id_pc = $1 AND UPPER(TRIM(hang)) = $2 AND so = $3 AND id_ghe <> $4 LIMIT 1`,
        [id_pc, checkHang, checkSo, id]
      );
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: "Ghế đã tồn tại trong phòng (hang, so)" });
      }
    }

    const parsedTinhTrang = parseBoolean(tinhtrang);
    const result = await pool.query(
      `UPDATE ghe
       SET hang = COALESCE($1, hang),
           so = COALESCE($2, so),
           tinhtrang = COALESCE($3, tinhtrang),
           id_loaighe = COALESCE($4, id_loaighe)
       WHERE id_ghe = $5
       RETURNING id_ghe, hang, so, tinhtrang, id_loaighe, id_pc`,
      [nextHang, nextSo, parsedTinhTrang, id_loaighe, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/admin/ghe/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/ghe/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM ghe WHERE id_ghe = $1 RETURNING id_ghe`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ghế không tồn tại" });
    }
    res.json({ message: "Xóa ghế thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/ghe/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/ghe/bulk-save", async (req, res) => {
  const { id_pc, seats } = req.body;
  if (!id_pc || !Array.isArray(seats)) {
    return res.status(400).json({ error: "Thiếu thông tin: id_pc và seats[] là bắt buộc" });
  }

  const normalized = [];
  const keySet = new Set();
  for (const item of seats) {
    const hang = String(item.hang ?? "").trim().toUpperCase();
    const so = Number(item.so);
    if (!hang || Number.isNaN(so)) {
      return res.status(400).json({ error: "Dữ liệu ghế không hợp lệ (hang, so)" });
    }
    const key = `${hang}|${so}`;
    if (keySet.has(key)) {
      return res.status(400).json({ error: "Danh sách ghế bị trùng (hang, so)" });
    }
    keySet.add(key);
    normalized.push({
      hang,
      so,
      id_loaighe: item.id_loaighe ?? null,
      tinhtrang: parseBooleanWithDefault(item.tinhtrang, true),
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingRes = await client.query(
      `SELECT id_ghe, hang, so, id_loaighe, tinhtrang FROM ghe WHERE id_pc = $1`,
      [id_pc]
    );

    const existingByKey = new Map();
    for (const row of existingRes.rows) {
      const key = `${String(row.hang).trim().toUpperCase()}|${Number(row.so)}`;
      existingByKey.set(key, row);
    }

    const desiredByKey = new Map();
    for (const s of normalized) {
      desiredByKey.set(`${s.hang}|${s.so}`, s);
    }

    const toDeleteIds = [];
    const toUpdate = [];
    const toInsert = [];

    for (const [key, row] of existingByKey.entries()) {
      const desired = desiredByKey.get(key);
      if (!desired) {
        toDeleteIds.push(row.id_ghe);
        continue;
      }
      const nextLoai = desired.id_loaighe ?? null;
      const nextTinhTrang = desired.tinhtrang;
      if ((row.id_loaighe ?? null) !== nextLoai || row.tinhtrang !== nextTinhTrang) {
        toUpdate.push({ id_ghe: row.id_ghe, id_loaighe: nextLoai, tinhtrang: nextTinhTrang });
      }
    }

    for (const [key, desired] of desiredByKey.entries()) {
      if (!existingByKey.has(key)) {
        toInsert.push(desired);
      }
    }

    if (toDeleteIds.length > 0) {
      await client.query(`DELETE FROM ghe WHERE id_ghe = ANY($1::int[])`, [toDeleteIds]);
    }

    if (toUpdate.length > 0) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const u of toUpdate) {
        values.push(`($${idx++}::int, $${idx++}::int, $${idx++}::boolean)`);
        params.push(u.id_ghe, u.id_loaighe, u.tinhtrang);
      }
      await client.query(
        `
        WITH updates(id_ghe, id_loaighe, tinhtrang) AS (
          VALUES ${values.join(", ")}
        )
        UPDATE ghe g
        SET id_loaighe = u.id_loaighe,
            tinhtrang = u.tinhtrang
        FROM updates u
        WHERE g.id_ghe = u.id_ghe
        `,
        params
      );
    }

    if (toInsert.length > 0) {
      const values = [];
      const params = [];
      let idx = 1;
      for (const s of toInsert) {
        values.push(`($${idx++}::varchar, $${idx++}::int, $${idx++}::boolean, $${idx++}::int, $${idx++}::int)`);
        params.push(s.hang, s.so, s.tinhtrang, s.id_loaighe, id_pc);
      }
      await client.query(
        `
        INSERT INTO ghe (hang, so, tinhtrang, id_loaighe, id_pc)
        VALUES ${values.join(", ")}
        `,
        params
      );
    }

    await client.query("COMMIT");
    res.json({
      deleted: toDeleteIds.length,
      updated: toUpdate.length,
      inserted: toInsert.length,
      total: normalized.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/admin/ghe/bulk-save error:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// ===== PHONG CHIEU (Room) Management =====
app.get("/api/admin/phong-chieu", async (req, res) => {
  try {
    const { id_rap } = req.query;
    let query = `
      SELECT 
        id_pc, 
        id_rap, 
        id_loai, 
        ten_phong, 
        trang_thai, 
        suc_chua
      FROM phong_chieu
    `;
    const params = [];
    
    if (id_rap) {
      query += ` WHERE id_rap = $1`;
      params.push(id_rap);
    }
    
    query += ` ORDER BY id_rap, id_pc`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/phong-chieu error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/phong-chieu", async (req, res) => {
  const { id_rap, id_loai, ten_phong, trang_thai, suc_chua } = req.body;
  try {
    if (!id_rap || !ten_phong) {
      return res.status(400).json({ 
        error: "Thiếu thông tin: id_rap và ten_phong là bắt buộc" 
      });
    }
    
    const result = await pool.query(
      `INSERT INTO phong_chieu (id_rap, id_loai, ten_phong, trang_thai, suc_chua)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_pc, id_rap, id_loai, ten_phong, trang_thai, suc_chua`,
      [id_rap, id_loai || 1, ten_phong, parseBooleanWithDefault(trang_thai, true), suc_chua || 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/admin/phong-chieu error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/phong-chieu/:id", async (req, res) => {
  const { id } = req.params;
  const { id_rap, id_loai, ten_phong, trang_thai, suc_chua } = req.body;
  try {
    const parsedTrangThai = parseBoolean(trang_thai);
    const result = await pool.query(
      `UPDATE phong_chieu
       SET id_rap = COALESCE($1, id_rap),
           id_loai = COALESCE($2, id_loai),
           ten_phong = COALESCE($3, ten_phong),
           trang_thai = COALESCE($4, trang_thai),
           suc_chua = COALESCE($5, suc_chua)
       WHERE id_pc = $6
       RETURNING id_pc, id_rap, id_loai, ten_phong, trang_thai, suc_chua`,
      [id_rap, id_loai, ten_phong, parsedTrangThai, suc_chua, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Phòng chiếu không tồn tại" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /api/admin/phong-chieu/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/phong-chieu/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Check if room has seats
    const checkResult = await pool.query(
      `SELECT COUNT(*) as count FROM ghe WHERE id_pc = $1`,
      [id]
    );
    if (checkResult.rows[0].count > 0) {
      return res.status(400).json({ 
        error: "Không thể xóa phòng vì còn có ghế liên kết" 
      });
    }
    
    const result = await pool.query(
      `DELETE FROM phong_chieu WHERE id_pc = $1 RETURNING id_pc`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Phòng chiếu không tồn tại" });
    }
    res.json({ message: "Xóa phòng chiếu thành công" });
  } catch (error) {
    console.error("DELETE /api/admin/phong-chieu/:id error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);

  try {
    const info = await testConnection();
    console.log(`Connected to PostgreSQL database: ${info.database}`);
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
  }
});
