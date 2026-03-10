require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const customerRoutes = require("./routes/customers");
const adminRoutes = require("./routes/admin");
const configRoutes = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup — needed for local dev (separate Vite dev server)
// In production on Railway, frontend is served from Express so CORS is same-origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
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

// All non-API routes → React app (client-side routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
