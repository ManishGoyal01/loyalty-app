const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { pool } = require("../db/init");
const { todayIST } = require("../helpers/dateHelpers");
const authMiddleware = require("../middleware/authMiddleware");

// POST /login
router.post("/login", (req, res) => {
  try {
    const { phone } = req.body;

    const adminPhones = (process.env.ADMIN_PHONES || "")
      .split(",")
      .map((p) => p.trim());

    if (!adminPhones.includes(phone)) {
      return res.status(401).json({ error: "Unauthorized: not an admin phone" });
    }

    const token = jwt.sign({ phone }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.json({ token });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats (protected)
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const today = todayIST();

    const totalResult = await pool.query('SELECT COUNT(*) FROM "Customer"');
    const activeResult = await pool.query('SELECT COUNT(*) FROM "Customer" WHERE "lastScan" = $1', [today]);
    const configResult = await pool.query('SELECT "totalClaimed" FROM "Config" WHERE id = 1');

    const totalCustomers = parseInt(totalResult.rows[0].count);
    const activeToday = parseInt(activeResult.rows[0].count);
    const totalClaimed = configResult.rows.length > 0 ? configResult.rows[0].totalClaimed : 0;

    return res.json({ totalCustomers, activeToday, totalClaimed });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /customers (protected)
router.get("/customers", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Customer" ORDER BY streak DESC');
    return res.json(result.rows);
  } catch (err) {
    console.error("Get customers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reward (protected)
router.post("/reward", authMiddleware, async (req, res) => {
  try {
    const { icon, name } = req.body;

    await pool.query(`
      INSERT INTO "Config" (id, "rewardIcon", "rewardName", "totalClaimed")
      VALUES (1, $1, $2, 0)
      ON CONFLICT (id) DO UPDATE SET "rewardIcon" = $1, "rewardName" = $2
    `, [icon, name]);

    return res.json({ success: true });
  } catch (err) {
    console.error("Reward update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /shop-info (protected)
router.get("/shop-info", authMiddleware, (req, res) => {
  return res.json({
    lat: parseFloat(process.env.SHOP_LAT) || null,
    lng: parseFloat(process.env.SHOP_LNG) || null,
    radius: parseFloat(process.env.SHOP_RADIUS) || 100,
  });
});

module.exports = router;
