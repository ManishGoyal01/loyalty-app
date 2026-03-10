const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
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

    const totalCustomers = await prisma.customer.count();
    const activeToday = await prisma.customer.count({
      where: { lastScan: today },
    });

    const config = await prisma.config.findUnique({ where: { id: 1 } });
    const totalClaimed = config ? config.totalClaimed : 0;

    return res.json({ totalCustomers, activeToday, totalClaimed });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /customers (protected)
router.get("/customers", authMiddleware, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { streak: "desc" },
    });

    return res.json(customers);
  } catch (err) {
    console.error("Get customers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reward (protected)
router.post("/reward", authMiddleware, async (req, res) => {
  try {
    const { icon, name } = req.body;

    await prisma.config.upsert({
      where: { id: 1 },
      update: { rewardIcon: icon, rewardName: name },
      create: {
        rewardIcon: icon,
        rewardName: name,
        totalClaimed: 0,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Reward update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /shop-info (protected) — returns shop location config
router.get("/shop-info", authMiddleware, (req, res) => {
  return res.json({
    lat: parseFloat(process.env.SHOP_LAT) || null,
    lng: parseFloat(process.env.SHOP_LNG) || null,
    radius: parseFloat(process.env.SHOP_RADIUS) || 100,
  });
});

module.exports = router;
