const express = require("express");
const router = express.Router();
const { pool } = require("../db/init");

// GET /
router.get("/", async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM "Config" WHERE id = 1');

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO "Config" (id, "rewardIcon", "rewardName", "totalClaimed") VALUES (1, $1, $2, 0) RETURNING *',
        ['🥛', '1 Milk Packet — FREE']
      );
    }

    const config = result.rows[0];
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
