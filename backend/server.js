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
      SELECT ten_loai
      FROM theloai
      ORDER BY ten_loai
    `);
    console.log("Genres found:", result.rows.length);
    res.json(result.rows.map((row) => row.ten_loai));
  } catch (error) {
    console.error("GET /api/admin/genres error:", error.message);
    res.status(500).json({ error: error.message });
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

app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);

  try {
    const info = await testConnection();
    console.log(`Connected to PostgreSQL database: ${info.database}`);
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
  }
});
