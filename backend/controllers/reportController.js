/* global require, module, Buffer */

const db = require("../config/database");

// ========================================
// HELPER: VALIDASI FOTO
// ========================================

function validatePhoto(photo) {
  if (photo === undefined || photo === null || photo === "") {
    return { valid: true, photo: null };
  }

  if (typeof photo !== "string") {
    return {
      valid: false,
      message: "Format foto tidak valid.",
    };
  }

  const photoPattern =
    /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

  const match = photo.match(photoPattern);

  if (!match) {
    return {
      valid: false,
      message:
        "Foto harus berupa gambar JPEG, PNG, atau WebP dalam format Base64.",
    };
  }

  const declaredType = match[1].toLowerCase();
  const base64Data = match[2];
  const imageBuffer = Buffer.from(base64Data, "base64");

  if (imageBuffer.length > 2 * 1024 * 1024) {
    return {
      valid: false,
      message: "Ukuran foto maksimal 2 MB.",
    };
  }

  if (
    imageBuffer.length === 0 ||
    imageBuffer.toString("base64") !== base64Data
  ) {
    return {
      valid: false,
      message: "Data foto tidak valid.",
    };
  }

  const isJpeg =
    imageBuffer.length >= 3 &&
    imageBuffer[0] === 0xff &&
    imageBuffer[1] === 0xd8 &&
    imageBuffer[2] === 0xff;

  const isPng =
    imageBuffer.length >= 8 &&
    imageBuffer
      .subarray(0, 8)
      .equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a,
        ])
      );

  const isWebp =
    imageBuffer.length >= 12 &&
    imageBuffer.toString("ascii", 0, 4) === "RIFF" &&
    imageBuffer.toString("ascii", 8, 12) === "WEBP";

  const validImage =
    (["jpeg", "jpg"].includes(declaredType) && isJpeg) ||
    (declaredType === "png" && isPng) ||
    (declaredType === "webp" && isWebp);

  if (!validImage) {
    return {
      valid: false,
      message:
        "Isi foto tidak sesuai dengan format gambar yang dinyatakan.",
    };
  }

  return {
    valid: true,
    photo,
  };
}

// ========================================
// HELPER: VALIDASI ID
// ========================================

function parseReportId(value) {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
}

// ========================================
// HELPER: VALIDASI TEKS OPSIONAL
// ========================================

function isOptionalString(value) {
  return (
    value === undefined ||
    value === null ||
    typeof value === "string"
  );
}

// ========================================
// HELPER: MEMBUAT NOTIFIKASI
// ========================================

async function createNotification(
  connection,
  {
    userId,
    reportId,
    title,
    message,
    type = "info",
    note = null,
  }
) {
  await connection.query(
    `INSERT INTO notifications (
      user_id,
      report_id,
      title,
      message,
      type,
      note
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, reportId, title, message, type, note]
  );
}

// ========================================
// CREATE REPORT
// ========================================

async function createReport(req, res) {
  let connection;

  try {
    const {
      category_id,
      title,
      description,
      province_id,
      province_name,
      regency_id,
      regency_name,
      district_id,
      district_name,
      village_id,
      village_name,
      address,
      location_detail,
      latitude,
      longitude,
      photo,
      photo_name,
    } = req.body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim() ||
      category_id === undefined ||
      category_id === null ||
      category_id === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Judul, deskripsi, dan kategori wajib diisi.",
      });
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const categoryId = Number(category_id);

    if (cleanTitle.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Judul maksimal 200 karakter.",
      });
    }

    if (!Number.isSafeInteger(categoryId) || categoryId < 1) {
      return res.status(400).json({
        success: false,
        message: "Kategori tidak valid.",
      });
    }

    const optionalFields = {
      province_id,
      province_name,
      regency_id,
      regency_name,
      district_id,
      district_name,
      village_id,
      village_name,
      address,
      location_detail,
      photo_name,
    };

    for (const [field, value] of Object.entries(optionalFields)) {
      if (!isOptionalString(value)) {
        return res.status(400).json({
          success: false,
          message: `Format ${field} tidak valid.`,
        });
      }
    }

    if (photo_name && photo_name.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Nama file foto maksimal 255 karakter.",
      });
    }

    const photoValidation = validatePhoto(photo);

    if (!photoValidation.valid) {
      return res.status(400).json({
        success: false,
        message: photoValidation.message,
      });
    }

    const cleanPhoto = photoValidation.photo;

    const cleanPhotoName = cleanPhoto
      ? photo_name?.trim() || "foto-laporan"
      : null;

    const hasLatitude =
      latitude !== undefined &&
      latitude !== null &&
      latitude !== "";

    const hasLongitude =
      longitude !== undefined &&
      longitude !== null &&
      longitude !== "";

    if (hasLatitude !== hasLongitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude dan longitude harus diisi bersamaan.",
      });
    }

    let cleanLatitude = null;
    let cleanLongitude = null;

    if (hasLatitude && hasLongitude) {
      cleanLatitude = Number(latitude);
      cleanLongitude = Number(longitude);

      if (
        !Number.isFinite(cleanLatitude) ||
        !Number.isFinite(cleanLongitude) ||
        cleanLatitude < -90 ||
        cleanLatitude > 90 ||
        cleanLongitude < -180 ||
        cleanLongitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Koordinat lokasi tidak valid.",
        });
      }
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [categories] = await connection.query(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [categoryId]
    );

    if (categories.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Kategori laporan tidak ditemukan.",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO reports (
        user_id,
        category_id,
        title,
        description,
        province_id,
        province_name,
        regency_id,
        regency_name,
        district_id,
        district_name,
        village_id,
        village_name,
        address,
        location_detail,
        latitude,
        longitude,
        photo,
        photo_name,
        status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        req.user.id,
        categoryId,
        cleanTitle,
        cleanDescription,
        province_id || null,
        province_name || null,
        regency_id || null,
        regency_name || null,
        district_id || null,
        district_name || null,
        village_id || null,
        village_name || null,
        address || null,
        location_detail || null,
        cleanLatitude,
        cleanLongitude,
        cleanPhoto,
        cleanPhotoName,
        "Menunggu",
      ]
    );

    const reportId = result.insertId;

    await connection.query(
      `INSERT INTO report_timeline (
        report_id,
        status,
        note
      ) VALUES (?, ?, ?)`,
      [reportId, "Menunggu", "Laporan berhasil dibuat."]
    );

    await createNotification(connection, {
      userId: req.user.id,
      reportId,
      title: "Laporan Berhasil Dikirim",
      message:
        `Laporan "${cleanTitle}" berhasil dikirim ` +
        "dan sedang menunggu verifikasi.",
      type: "success",
      note: null,
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Laporan berhasil dibuat.",
      data: {
        id: reportId,
        category_id: categoryId,
        title: cleanTitle,
        description: cleanDescription,
        photo_name: cleanPhotoName,
        status: "Menunggu",
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError.message);
      }
    }

    console.error("CREATE REPORT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat laporan.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// ========================================
// GET ALL PUBLIC REPORTS
// ========================================

async function getReports(req, res) {
  try {
    const [reports] = await db.query(
      `SELECT
        r.id,
        r.category_id,
        c.name AS category_name,
        r.title,
        r.description,
        r.province_name,
        r.regency_name,
        r.district_name,
        r.village_name,
        r.status,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC, r.id DESC`
    );

    return res.status(200).json({
      success: true,
      message: "Data laporan berhasil diambil.",
      total: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("GET REPORTS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data laporan.",
    });
  }
}

// ========================================
// GET MY REPORTS
// ========================================

async function getMyReports(req, res) {
  try {
    const [reports] = await db.query(
      `SELECT
        r.id,
        r.category_id,
        c.name AS category_name,
        r.title,
        r.description,
        r.province_name,
        r.regency_name,
        r.district_name,
        r.village_name,
        r.address,
        r.location_detail,
        r.latitude,
        r.longitude,
        r.photo_name,
        r.status,
        r.admin_note,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC, r.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Laporan milik pengguna berhasil diambil.",
      total: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("GET MY REPORTS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil laporan milik pengguna.",
    });
  }
}

// ========================================
// GET PUBLIC REPORT DETAIL
// ========================================

async function getReportById(req, res) {
  try {
    const reportId = parseReportId(req.params.id);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "ID laporan tidak valid.",
      });
    }

    const [reports] = await db.query(
      `SELECT
        r.id,
        r.category_id,
        c.name AS category_name,
        r.title,
        r.description,
        r.province_name,
        r.regency_name,
        r.district_name,
        r.village_name,
        r.status,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
      LIMIT 1`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Detail laporan publik berhasil diambil.",
      data: reports[0],
    });
  } catch (error) {
    console.error("GET REPORT BY ID ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail laporan.",
    });
  }
}

// ========================================
// GET PRIVATE REPORT DETAIL
// ========================================

async function getPrivateReportById(req, res) {
  try {
    const reportId = parseReportId(req.params.id);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "ID laporan tidak valid.",
      });
    }

    const [reports] = await db.query(
      `SELECT
        r.id,
        r.user_id,
        r.category_id,
        c.name AS category_name,
        r.title,
        r.description,
        r.province_id,
        r.province_name,
        r.regency_id,
        r.regency_name,
        r.district_id,
        r.district_name,
        r.village_id,
        r.village_name,
        r.address,
        r.location_detail,
        r.latitude,
        r.longitude,
        r.photo,
        r.photo_name,
        r.status,
        r.admin_note,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
      LIMIT 1`,
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan.",
      });
    }

    const report = reports[0];

    const isOwner =
      Number(report.user_id) === Number(req.user.id);

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki akses ke detail laporan ini.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Detail laporan berhasil diambil.",
      data: report,
    });
  } catch (error) {
    console.error("GET PRIVATE REPORT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail laporan.",
    });
  }
}

// ========================================
// GET REPORT TIMELINE
// ========================================

async function getReportTimeline(req, res) {
  try {
    const reportId = parseReportId(req.params.id);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "ID laporan tidak valid.",
      });
    }

    const [reports] = await db.query(
      "SELECT id FROM reports WHERE id = ? LIMIT 1",
      [reportId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan.",
      });
    }

    const [timeline] = await db.query(
      `SELECT id, report_id, status, note, created_at
       FROM report_timeline
       WHERE report_id = ?
       ORDER BY created_at ASC, id ASC`,
      [reportId]
    );

    return res.status(200).json({
      success: true,
      message: "Riwayat status laporan berhasil diambil.",
      total: timeline.length,
      data: timeline,
    });
  } catch (error) {
    console.error("GET REPORT TIMELINE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat status laporan.",
    });
  }
}

// ========================================
// ADMIN: GET SEMUA LAPORAN
// ========================================

async function getAdminReports(req, res) {
  try {
    const [reports] = await db.query(
      `SELECT
        r.id,
        r.user_id,
        r.category_id,
        c.name AS category_name,
        r.title,
        r.description,
        r.province_name,
        r.regency_name,
        r.district_name,
        r.village_name,
        r.address,
        r.location_detail,
        r.latitude,
        r.longitude,
        r.photo_name,
        r.status,
        r.admin_note,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC, r.id DESC`
    );

    return res.status(200).json({
      success: true,
      message: "Data laporan admin berhasil diambil.",
      total: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("GET ADMIN REPORTS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data laporan admin.",
    });
  }
}

// ========================================
// ADMIN: UPDATE REPORT STATUS
// ========================================

async function updateReportStatus(req, res) {
  let connection;

  try {
    const reportId = parseReportId(req.params.id);
    const { status, admin_note } = req.body;

    const allowedStatuses = [
      "Diverifikasi",
      "Dalam Proses",
      "Selesai",
    ];

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "ID laporan tidak valid.",
      });
    }

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Status laporan tidak valid.",
      });
    }

    if (
      admin_note !== undefined &&
      admin_note !== null &&
      typeof admin_note !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Catatan admin harus berupa teks.",
      });
    }

    const cleanNote =
      typeof admin_note === "string" && admin_note.trim()
        ? admin_note.trim()
        : null;

    if (cleanNote && cleanNote.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Catatan admin maksimal 2000 karakter.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [reports] = await connection.query(
      `SELECT id, user_id, title, status
       FROM reports
       WHERE id = ?
       FOR UPDATE`,
      [reportId]
    );

    if (reports.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan.",
      });
    }

    const currentReport = reports[0];

    if (currentReport.status === status) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Status laporan sudah sama dengan status sebelumnya.",
      });
    }

    await connection.query(
      `UPDATE reports
       SET status = ?, admin_note = ?
       WHERE id = ?`,
      [status, cleanNote, reportId]
    );

    await connection.query(
      `INSERT INTO report_timeline (report_id, status, note)
       VALUES (?, ?, ?)`,
      [
        reportId,
        status,
        cleanNote || `Status laporan diperbarui menjadi ${status}.`,
      ]
    );

    const notificationMessages = {
      Diverifikasi: "telah diverifikasi oleh admin.",
      "Dalam Proses": "sedang dalam proses penanganan.",
      Selesai: "telah selesai ditangani.",
    };

    await createNotification(connection, {
      userId: currentReport.user_id,
      reportId,
      title: `Status Laporan: ${status}`,
      message:
        `Laporan "${currentReport.title}" ` +
        notificationMessages[status],
      type: status === "Selesai" ? "success" : "info",
      note: cleanNote,
    });

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Status laporan berhasil diperbarui.",
      data: {
        report_id: reportId,
        status,
        admin_note: cleanNote,
      },
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError.message);
      }
    }

    console.error("UPDATE REPORT STATUS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui status laporan.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// ========================================
// ADMIN: GET REPORT STATISTICS
// ========================================

async function getReportStats(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) AS total_laporan,
        SUM(CASE WHEN status = 'Menunggu' THEN 1 ELSE 0 END) AS menunggu,
        SUM(CASE WHEN status = 'Diverifikasi' THEN 1 ELSE 0 END) AS diverifikasi,
        SUM(CASE WHEN status = 'Dalam Proses' THEN 1 ELSE 0 END) AS dalam_proses,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS selesai
      FROM reports`
    );

    const stats = rows[0];

    return res.status(200).json({
      success: true,
      message: "Statistik laporan berhasil diambil.",
      data: {
        total_laporan: Number(stats.total_laporan || 0),
        menunggu: Number(stats.menunggu || 0),
        diverifikasi: Number(stats.diverifikasi || 0),
        dalam_proses: Number(stats.dalam_proses || 0),
        selesai: Number(stats.selesai || 0),
      },
    });
  } catch (error) {
    console.error("GET REPORT STATS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik laporan.",
    });
  }
}

// ========================================
// DELETE REPORT
// PEMILIK: HANYA STATUS MENUNGGU
// ADMIN: SEMUA STATUS
// ========================================

async function deleteReport(req, res) {
  let connection;

  try {
    const reportId = parseReportId(req.params.id);

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "ID laporan tidak valid.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [reports] = await connection.query(
      `SELECT id, user_id, title, status
       FROM reports
       WHERE id = ?
       FOR UPDATE`,
      [reportId]
    );

    if (reports.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Laporan tidak ditemukan.",
      });
    }

    const report = reports[0];

    const isOwner =
      Number(report.user_id) === Number(req.user.id);

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki izin untuk menghapus laporan ini.",
      });
    }

    if (!isAdmin && report.status !== "Menunggu") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Laporan yang sudah diverifikasi atau diproses tidak dapat dihapus oleh pengguna.",
      });
    }

    // report_timeline akan terhapus otomatis karena ON DELETE CASCADE.
    // notifications tetap ada dan report_id menjadi NULL.
    await connection.query(
      "DELETE FROM reports WHERE id = ?",
      [reportId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Laporan berhasil dihapus.",
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("ROLLBACK ERROR:", rollbackError.message);
      }
    }

    console.error("DELETE REPORT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus laporan.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// ========================================
// EXPORT CONTROLLERS
// ========================================

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getReportById,
  getPrivateReportById,
  getReportTimeline,
  updateReportStatus,
  getReportStats,
  getAdminReports,
  deleteReport,
};