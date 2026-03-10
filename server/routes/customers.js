const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const { todayIST, yesterdayIST } = require("../helpers/dateHelpers");
const { isNearShop } = require("../helpers/geoHelpers");

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone must be exactly 10 digits" });
    }

    let customer = await prisma.customer.findUnique({ where: { phone } });

    if (customer) {
      return res.json(customer);
    }

    customer = await prisma.customer.create({
      data: {
        phone,
        streak: 0,
        lastScan: null,
        history: [],
        complete: false,
        joinDate: todayIST(),
      },
    });

    return res.json(customer);
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /checkin
router.post("/checkin", async (req, res) => {
  try {
    const { phone, lat, lng } = req.body;

    // Verify customer is physically near the shop
    if (lat == null || lng == null) {
      return res.status(403).json({ error: "Location required. Please allow location access to check in." });
    }

    if (!isNearShop(lat, lng)) {
      return res.status(403).json({ error: "You need to be at the shop to check in. Visit us today!" });
    }

    const customer = await prisma.customer.findUnique({ where: { phone } });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const today = todayIST();
    const yesterday = yesterdayIST();

    // Already checked in today
    if (customer.lastScan === today) {
      return res.json({
        alreadyToday: true,
        streak: customer.streak,
        lastScan: customer.lastScan,
        complete: customer.complete,
      });
    }

    let newStreak = customer.streak;
    let newHistory = [...customer.history];

    // If last scan was not yesterday and customer has scanned before, reset streak
    if (customer.lastScan !== yesterday && customer.lastScan !== null) {
      newStreak = 0;
      newHistory = [];
    }

    // Increment streak
    newStreak += 1;
    newHistory.push(today);
    const isComplete = newStreak >= 10;

    const updated = await prisma.customer.update({
      where: { phone },
      data: {
        streak: newStreak,
        lastScan: today,
        history: newHistory,
        complete: isComplete,
      },
    });

    return res.json({
      streak: updated.streak,
      lastScan: updated.lastScan,
      complete: updated.complete,
      alreadyToday: false,
    });
  } catch (err) {
    console.error("Checkin error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /claim
router.post("/claim", async (req, res) => {
  try {
    const { phone } = req.body;

    const customer = await prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    await prisma.customer.update({
      where: { phone },
      data: {
        streak: 0,
        complete: false,
        history: [],
        lastScan: null,
      },
    });

    // Increment totalClaimed in config
    await prisma.config.upsert({
      where: { id: 1 },
      update: { totalClaimed: { increment: 1 } },
      create: {
        rewardIcon: "🥛",
        rewardName: "1 Milk Packet — FREE",
        totalClaimed: 1,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Claim error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /:phone
router.get("/:phone", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { phone: req.params.phone },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.json(customer);
  } catch (err) {
    console.error("Get customer error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
