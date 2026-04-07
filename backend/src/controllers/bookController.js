import prisma from "../lib/prisma.js";

export const getBooks = async (req, res) => {
  try {
    const { search, genre, page = 1, per_page = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(per_page);

    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { genre: { contains: search, mode: "insensitive" } },
      ];
    }
    if (genre) where.genre = genre;

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: parseInt(per_page),
        orderBy: { createdAt: "desc" },
      }),
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
    const book = await prisma.book.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json({ book });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, publishedYear, stock, coverUrl } = req.body;

    const existing = await prisma.book.findUnique({ where: { isbn } });
    if (existing) return res.status(400).json({ message: "ISBN already exists" });

    const book = await prisma.book.create({
      data: { title, author, isbn, genre, publishedYear: parseInt(publishedYear), stock: parseInt(stock), coverUrl },
    });

    res.status(201).json({ message: "Book created successfully", book });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, genre, publishedYear, stock, coverUrl } = req.body;
    const id = parseInt(req.params.id);

    const existing = await prisma.book.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Book not found" });

    const book = await prisma.book.update({
      where: { id },
      data: { title, author, isbn, genre, publishedYear: parseInt(publishedYear), stock: parseInt(stock), coverUrl },
    });

    res.json({ message: "Book updated successfully", book });
  } catch (error) {
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