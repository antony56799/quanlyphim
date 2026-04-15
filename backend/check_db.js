const { pool } = require("./db");

async function checkData() {
  try {
    const genres = await pool.query("SELECT * FROM theloai");
    console.log("Genres count:", genres.rows.length);
    console.log("Genres:", genres.rows);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    process.exit();
  }
}

checkData();
