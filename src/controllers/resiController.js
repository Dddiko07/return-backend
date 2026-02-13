const Resi = require("../models/resiModel");
const { Op } = require("sequelize");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Ambil userId dari token
 */
function getUserIdFromReq(req) {
  return req.user?.id || req.userId || req.user?.userId;
}

/**
 * Helper normalisasi resi
 */
function normalizeResi(val) {
  return (val || "").trim().toUpperCase();
}

/**
 * ======================================================
 * GET /resi
 * List + filter + default auto-filter
 * ======================================================
 */
exports.getResiList = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { search, jasa_kirim, status, sumber, tanggal, start, end } =
      req.query;

    const where = { user_id: userId };

    /**
     * DEFAULT (jika tidak pakai filter apa pun)
     * tampilkan scan + unmatched
     */
    const noFilter =
      !search &&
      !jasa_kirim &&
      !status &&
      !sumber &&
      !tanggal &&
      !start &&
      !end;

    if (noFilter) {
      where.sumber = "scan";
      where.status = "unmatched";
    }

    // ================= FILTER UI =================
    if (jasa_kirim) where.jasa_kirim = jasa_kirim;
    if (status) where.status = status;
    if (sumber) where.sumber = sumber;

    if (tanggal) {
      where.tanggal = tanggal;
    }

    if (start && end) {
      where.tanggal = {
        [Op.between]: [start, end],
      };
    }

    if (search) {
      where[Op.or] = [
        { nomor_resi: { [Op.iLike]: `%${search}%` } },
        { nama_barang: { [Op.iLike]: `%${search}%` } },
        { nama_toko: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const data = await Resi.findAll({
      where,
      order: [["created_at", "DESC"]],
    });

    res.json(data);
  } catch (err) {
    console.error("getResiList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/scan
 * Scan satuan
 * ======================================================
 */
exports.addResiScan = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { nomor_resi, jasa_kirim, tanggal } = req.body;

    if (!nomor_resi) {
      return res.status(400).json({ message: "Nomor resi wajib diisi" });
    }

    const data = await Resi.create({
      nomor_resi: normalizeResi(nomor_resi),
      jasa_kirim: jasa_kirim || null,
      tanggal: tanggal || new Date(),
      sumber: "scan",
      status: "unmatched",
      user_id: userId,
    });

    res.status(201).json({
      message: "Resi scan tersimpan",
      data,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Resi sudah discan" });
    }
    console.error("addResiScan:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi
 * Tambah manual
 * ======================================================
 */
exports.addResi = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { nomor_resi, nama_barang, nama_toko, jasa_kirim, tanggal } = req.body;

    if (!nomor_resi) {
      return res.status(400).json({ message: "Nomor resi wajib diisi" });
    }

    const data = await Resi.create({
      nomor_resi: normalizeResi(nomor_resi),
      nama_barang: nama_barang || null,
      nama_toko: nama_toko || null,
      jasa_kirim: jasa_kirim || null,
      tanggal: tanggal || new Date(),
      sumber: "manual",
      status: "unmatched",
      user_id: userId,
    });

    res.status(201).json({
      message: "Resi manual tersimpan",
      data,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Nomor resi sudah ada" });
    }
    console.error("addResi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/import-scan
 * Import CSV scan lama
 * ======================================================
 */
exports.uploadScanMiddleware = upload.single("file");

exports.importResiScanCsv = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "File CSV tidak ditemukan" });
    }

    const lines = req.file.buffer
      .toString("utf-8")
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "");

    const dataLines = lines.slice(1);

    let inserted = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const [nomor_resi, jasa_kirim, tanggal] = line.split(",");

      if (!nomor_resi) continue;

      try {
        await Resi.create({
          nomor_resi: normalizeResi(nomor_resi),
          jasa_kirim: jasa_kirim?.trim() || null,
          tanggal: tanggal?.trim() || new Date(),
          sumber: "scan",
          status: "unmatched",
          user_id: userId,
        });
        inserted++;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          skipped++;
        }
      }
    }

    res.json({
      message: "Import scan selesai",
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("importResiScanCsv:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/import-marketplace
 * Import CSV marketplace
 * ======================================================
 */
exports.importMarketplaceCsv = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ message: "File CSV tidak ditemukan" });
    }

    const marketplace = (req.body.marketplace || "shopee").toLowerCase();

    const lines = req.file.buffer
      .toString("utf-8")
      .split(/\r?\n/)
      .filter((l) => l.trim() !== "");

    const dataLines = lines.slice(1);

    let inserted = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const cols = line.split(",");

      const nomor_resi = cols[0];
      const nama_barang = cols[1];
      const nama_toko = cols[2];
      const jasa_kirim = cols[3];
      const tanggal = cols[4];

      if (!nomor_resi) continue;

      try {
        await Resi.create({
          nomor_resi: normalizeResi(nomor_resi),
          nama_barang: nama_barang?.trim() || null,
          nama_toko: nama_toko?.trim() || null,
          jasa_kirim: jasa_kirim?.trim() || null,
          tanggal: tanggal?.trim() || new Date(),
          sumber: marketplace,
          status: "unmatched",
          user_id: userId,
        });
        inserted++;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          skipped++;
        }
      }
    }

    res.json({
      message: "Import marketplace selesai",
      marketplace,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("importMarketplaceCsv:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/import-marketplace-paste
 * FORMAT KAMU:
 *
 * Baris 1 = Nama toko
 * Baris 2+ = Resi (JX / NJVTT)
 * Setelah resi selesai = Nama barang (jumlah sama)
 * ======================================================
 */
exports.importMarketplacePaste = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { marketplace, text } = req.body;

    if (!marketplace) {
      return res.status(400).json({ message: "Marketplace wajib dipilih" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Data paste kosong" });
    }

    const mp = marketplace.toLowerCase();

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "");

    if (lines.length < 3) {
      return res.status(400).json({
        message: "Format paste kurang. Minimal: toko + 1 resi + 1 barang",
      });
    }

    // 1) Baris pertama = nama toko
    const nama_toko = lines[0];

    // 2) Deteksi resi
    const isResi = (val) => {
      if (!val) return false;
      const v = normalizeResi(val);

      return (
        /^JX[0-9]{8,}$/.test(v) ||
        /^NJVTT[0-9]{8,}$/.test(v) ||
        /^[A-Z0-9]{10,}$/.test(v)
      );
    };

    // 3) Pisahkan resi dan barang
    const resiList = [];
    const barangList = [];

    let mode = "resi";

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];

      if (mode === "resi") {
        if (isResi(row)) {
          resiList.push(normalizeResi(row));
        } else {
          mode = "barang";
          barangList.push(row.trim());
        }
      } else {
        barangList.push(row.trim());
      }
    }

    if (resiList.length === 0) {
      return res.status(400).json({
        message:
          "Tidak ada nomor resi terdeteksi. Pastikan resi formatnya JX... atau NJVTT...",
      });
    }

    if (barangList.length === 0) {
      return res.status(400).json({
        message:
          "Tidak ada nama barang terdeteksi. Setelah list resi harus ada list nama barang.",
      });
    }

    // 4) Insert ke DB
    let inserted = 0;
    let skipped = 0;

    // Aman: jumlah resi harus sama dengan jumlah barang
    const max = Math.min(resiList.length, barangList.length);

    for (let i = 0; i < max; i++) {
      const nomor_resi = resiList[i];
      const nama_barang = barangList[i];

      if (!nomor_resi) continue;

      try {
        await Resi.create({
          nomor_resi: nomor_resi,
          nama_barang: nama_barang ? nama_barang.trim() : null,
          nama_toko: nama_toko ? nama_toko.trim() : null,
          jasa_kirim: null,
          tanggal: new Date(),
          sumber: mp,
          status: "unmatched",
          user_id: userId,
        });

        inserted++;
      } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
          skipped++;
        } else {
          console.error("Import paste error:", err);
        }
      }
    }

    res.json({
      message: "Import paste marketplace selesai",
      marketplace: mp,
      nama_toko,
      total_resi: resiList.length,
      total_barang: barangList.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error("importMarketplacePaste:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * PUT /resi/:id
 * Edit resi
 * ======================================================
 */
exports.editResi = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const data = await Resi.findOne({
      where: { id, user_id: userId },
    });

    if (!data) {
      return res.status(404).json({ message: "Resi tidak ditemukan" });
    }

    const {
      nomor_resi,
      nama_barang,
      nama_toko,
      jasa_kirim,
      tanggal,
      sumber,
      status,
    } = req.body;

    await data.update({
      nomor_resi:
        nomor_resi !== undefined ? normalizeResi(nomor_resi) : data.nomor_resi,
      nama_barang: nama_barang !== undefined ? nama_barang : data.nama_barang,
      nama_toko: nama_toko !== undefined ? nama_toko : data.nama_toko,
      jasa_kirim: jasa_kirim !== undefined ? jasa_kirim : data.jasa_kirim,
      tanggal: tanggal !== undefined ? tanggal : data.tanggal,
      sumber: sumber !== undefined ? sumber : data.sumber,
      status: status !== undefined ? status : data.status,
    });

    res.json({
      message: "Resi berhasil diupdate",
      data,
    });
  } catch (err) {
    console.error("editResi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * DELETE /resi/:id
 * ======================================================
 */
exports.removeResi = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;

    const deleted = await Resi.destroy({
      where: { id, user_id: userId },
    });

    if (!deleted) {
      return res.status(404).json({ message: "Resi tidak ditemukan" });
    }

    res.json({ message: "Resi berhasil dihapus" });
  } catch (err) {
    console.error("removeResi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/delete-selected
 * MULTI DELETE (Hapus banyak)
 * ======================================================
 */
exports.deleteSelectedResi = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang dipilih" });
    }

    const deleted = await Resi.destroy({
      where: {
        id: ids,
        user_id: userId,
      },
    });

    res.json({
      message: "Hapus data terpilih berhasil",
      deleted,
    });
  } catch (err) {
    console.error("deleteSelectedResi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ======================================================
 * POST /resi/match
 * Matching berdasarkan NOMOR RESI saja
 *
 * 🔥 TAMBAHAN:
 * - Kembalikan marketplace_unmatched (tidak disimpan DB)
 * ======================================================
 */
exports.matchResi = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { marketplace } = req.body;

    if (!marketplace) {
      return res.status(400).json({ message: "Marketplace wajib dipilih" });
    }

    const mp = marketplace.toLowerCase();

    // 1) Ambil semua resi scan yang masih unmatched
    const scanResi = await Resi.findAll({
      where: {
        user_id: userId,
        sumber: "scan",
        status: "unmatched",
      },
    });

    // 2) Ambil semua resi marketplace
    const marketResi = await Resi.findAll({
      where: {
        user_id: userId,
        sumber: mp,
      },
    });

    // 3) Set marketplace resi
    const marketSet = new Set(
      marketResi
        .filter((r) => r.nomor_resi)
        .map((r) => normalizeResi(r.nomor_resi))
    );

    // 4) Set scan resi
    const scanSet = new Set(
      scanResi
        .filter((r) => r.nomor_resi)
        .map((r) => normalizeResi(r.nomor_resi))
    );

    let matched = 0;

    // 5) Update scan yang ketemu
    for (const r of scanResi) {
      const nomor = normalizeResi(r.nomor_resi);
      if (!nomor) continue;

      if (marketSet.has(nomor)) {
        await r.update({ status: "matched" });
        matched++;
      }
    }

    // 6) Marketplace yang tidak ketemu scan
    const marketplace_unmatched = [];
    for (const nomor of marketSet) {
      if (!scanSet.has(nomor)) {
        marketplace_unmatched.push(nomor);
      }
    }

    res.json({
      message: "Matching selesai (berdasarkan nomor resi saja)",
      marketplace: mp,
      total_scan: scanResi.length,
      total_marketplace: marketResi.length,
      matched,
      unmatched_scan: scanResi.length - matched,
      marketplace_unmatched,
    });
  } catch (err) {
    console.error("matchResi:", err);
    res.status(500).json({ message: "Server error" });
  }
};
