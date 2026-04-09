import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import bookRoutes from "./src/routes/books.js";
import borrowRoutes from "./src/routes/borrows.js";
import memberRoutes from "./src/routes/members.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// GET http://localhost:5000/uploads/cover-xxx.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/members", memberRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Library API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});