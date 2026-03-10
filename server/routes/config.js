const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");

// GET /
router.get("/", async (req, res) => {
  try {
    let config = await prisma.config.findUnique({ where: { id: 1 } });

    if (!config) {
      config = await prisma.config.create({
        data: {
          rewardIcon: "🥛",
          rewardName: "1 Milk Packet — FREE",
          totalClaimed: 0,
        },
      });
    }

    return res.json({
      rewardIcon: config.rewardIcon,
      rewardName: config.rewardName,
    });
  } catch (err) {
    console.error("Config error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
