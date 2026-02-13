const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const controller = require("../controllers/resiController");

// semua route wajib login
router.use(verifyToken);

// =========================
// LIST RESI
// =========================
router.get("/", controller.getResiList);

// =========================
// TAMBAH RESI
// =========================
router.post("/", controller.addResi); // manual
router.post("/scan", controller.addResiScan);

// =========================
// IMPORT
// =========================
router.post(
  "/import-scan",
  controller.uploadScanMiddleware,
  controller.importResiScanCsv
);

// 🔥 IMPORT MARKETPLACE (CSV)
router.post(
  "/import-marketplace",
  controller.uploadScanMiddleware,
  controller.importMarketplaceCsv
);

// 🔥 IMPORT MARKETPLACE (COPY PASTE FORMAT KAMU)
router.post("/import-marketplace-paste", controller.importMarketplacePaste);

// =========================
// MATCHING
// =========================
router.post("/match", controller.matchResi);

// =========================
// DELETE PILIH (MULTI DELETE)
// =========================
router.post("/delete-selected", controller.deleteSelectedResi);

// =========================
// EDIT & DELETE (SINGLE)
// =========================
router.put("/:id", controller.editResi);
router.delete("/:id", controller.removeResi);

module.exports = router;
