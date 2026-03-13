require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDB } = require("./db/init");

const customerRoutes = require("./routes/customers");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup — allow same-origin (production) and localhost (dev)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (same-origin, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost for development
      if (origin.includes("localhost")) return callback(null, true);
      // Allow Railway production URL
      if (origin.includes("railway.app")) return callback(null, true);
      // Allow custom FRONTEND_URL if set
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// API routes
app.use("/api/customers", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/config", configRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Loyalty Streak API is running" });
});

// Serve React frontend in production
const clientBuildPath = path.join(__dirname, "public");
app.use(express.static(clientBuildPath));

// All non-API, non-file routes → React app (client-side routing)
app.get("*", (req, res) => {
  // Don't serve index.html for requests that look like static files
  if (req.path.match(/\.\w+$/)) {
    return res.status(404).send("Not found");
  }
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Initialize database tables and start server
initDB()
  .then(() => {
    console.log("Database tables ready.");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database initialization failed:", err.message);
    process.exit(1);
  });
