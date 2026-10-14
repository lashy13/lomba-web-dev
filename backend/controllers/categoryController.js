
/* global require, module */

const db = require("../config/database");

// ========================================
// GET ALL CATEGORIES
// ========================================

async function getCategories(req, res) {
  try {
    const [categories] = await db.query(
      `SELECT id, name
       FROM categories
       ORDER BY id ASC`
    );

    return res.status(200).json({
      success: true,
      message: "Kategori berhasil diambil.",
      data: categories,
    });
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data kategori.",
    });
  }
}

module.exports = {
  getCategories,
};
