import prisma from "../lib/prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Upload directory ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Multer config ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cover-${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG and PNG files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// ── Helper: build public URL from filename ──────────────────────────────────
const coverUrl = (req, filename) =>
  filename ? `${req.protocol}://${req.get("host")}/uploads/${filename}` : null;

// ── Helper: delete old cover file from disk ─────────────────────────────────
const deleteOldCover = (existingCoverUrl) => {
  if (!existingCoverUrl) return;
  try {
    // Extract filename from URL  e.g. http://localhost:5000/uploads/cover-xxx.jpg
    const filename = existingCoverUrl.split("/uploads/")[1];
    if (!filename) return;
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Non-critical — just log and move on
    console.warn("Could not delete old cover file");
  }
};

// ── Controllers ─────────────────────────────────────────────────────────────

export const getBooks = async (req, res) => {
  try {
    const { search, genre, page = 1, per_page = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(per_page);

    const where = {};
    if (search) {
      where.OR = [
        { title:  { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { genre:  { contains: search, mode: "insensitive" } },
      ];
    }
    if (genre) where.genre = genre;

    const [books, total] = await Promise.all([
      prisma.book.findMany({ where, skip, take: parseInt(per_page), orderBy: { createdAt: "desc" } }),
      prisma.book.count({ where }),
    ]);

    res.json({
      data: books,
      meta: {
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        last_page: Math.ceil(total / parseInt(per_page)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getBook = async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, publishedYear, stock, coverUrl: coverUrlInput } = req.body;

    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) {
      // Clean up uploaded file if ISBN duplicate
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "ISBN already exists" });
    }

    // Prefer uploaded file; fall back to manual URL from body
    const finalCoverUrl = req.file
      ? coverUrl(req, req.file.filename)
      : (coverUrlInput || null);

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        genre,
        publishedYear: parseInt(publishedYear),
        stock: parseInt(stock),
        coverUrl: finalCoverUrl,
      },
    });

    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, publishedYear, stock, coverUrl: coverUrlInput } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Book not found" });
    }

    let finalCoverUrl = existing.coverUrl; // keep old by default

    if (req.file) {
      // New file uploaded — delete old uploaded cover (not external URLs)
      if (existing.coverUrl?.includes("/uploads/")) {
        deleteOldCover(existing.coverUrl);
      }
      finalCoverUrl = coverUrl(req, req.file.filename);
    } else if (coverUrlInput !== undefined) {
      // Manual URL provided (or cleared)
      finalCoverUrl = coverUrlInput || null;
    }

    const book = await prisma.book.update({
      where: { id },
      data: {
        title,
        author,
        isbn,
        genre,
        publishedYear: parseInt(publishedYear),
        stock: parseInt(stock),
        coverUrl: finalCoverUrl,
      },
    });

    res.json({ message: "Book updated successfully", book });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: { bookId: id, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (activeBorrow) {
      return res.status(422).json({ message: "Cannot delete book with active borrow records" });
    }

    const book = await prisma.book.findUnique({ where: { id } });
    if (book?.coverUrl?.includes("/uploads/")) {
      deleteOldCover(book.coverUrl);
    }

    await prisma.book.delete({ where: { id } });
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getGenres = async (req, res) => {
  try {
    const genres = await prisma.book.findMany({
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    });
    res.json({ genres: genres.map((g) => g.genre) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};