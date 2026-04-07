import prisma from "../lib/prisma.js";

export const requestBorrow = async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const userId = req.user.id;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ message: "Book not found" });
    if (book.stock <= 0) return res.status(422).json({ message: "Book is not available" });

    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: { userId, bookId, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (activeBorrow) {
      return res.status(422).json({ message: "You already have an active borrow request for this book" });
    }

    const record = await prisma.borrowRecord.create({
      data: { userId, bookId, status: "PENDING" },
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ message: "Borrow request submitted", record });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const approveBorrow = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const record = await prisma.borrowRecord.findUnique({
      where: { id },
      include: { book: true },
    });
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.status !== "PENDING") {
      return res.status(422).json({ message: "Only pending requests can be approved" });
    }
    if (record.book.stock <= 0) {
      return res.status(422).json({ message: "Book stock is no longer available" });
    }

    const [updated] = await prisma.$transaction([
      prisma.borrowRecord.update({
        where: { id },
        data: { status: "APPROVED", borrowedAt: new Date() },
        include: { book: true, user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.book.update({
        where: { id: record.bookId },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    res.json({ message: "Borrow request approved", record: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const rejectBorrow = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const record = await prisma.borrowRecord.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.status !== "PENDING") {
      return res.status(422).json({ message: "Only pending requests can be rejected" });
    }

    const updated = await prisma.borrowRecord.update({
      where: { id },
      data: { status: "REJECTED" },
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
    });

    res.json({ message: "Borrow request rejected", record: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const returnBook = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.id;

    const record = await prisma.borrowRecord.findUnique({ where: { id } });
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.userId !== userId) return res.status(403).json({ message: "Unauthorized" });
    if (record.status !== "APPROVED") {
      return res.status(422).json({ message: "Only approved borrows can be returned" });
    }

    const [updated] = await prisma.$transaction([
      prisma.borrowRecord.update({
        where: { id },
        data: { status: "RETURNED", returnedAt: new Date() },
        include: { book: true, user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.book.update({
        where: { id: record.bookId },
        data: { stock: { increment: 1 } },
      }),
    ]);

    res.json({ message: "Book returned successfully", record: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const myHistory = async (req, res) => {
  try {
    const { page = 1, per_page = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(per_page);

    const [records, total] = await Promise.all([
      prisma.borrowRecord.findMany({
        where: { userId: req.user.id },
        include: { book: true },
        skip,
        take: parseInt(per_page),
        orderBy: { createdAt: "desc" },
      }),
      prisma.borrowRecord.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      data: records,
      meta: { total, page: parseInt(page), per_page: parseInt(per_page), last_page: Math.ceil(total / parseInt(per_page)) },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const allHistory = async (req, res) => {
  try {
    const { status, user_id, page = 1, per_page = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const where = {};
    if (status) where.status = status;
    if (user_id) where.userId = parseInt(user_id);

    const [records, total] = await Promise.all([
      prisma.borrowRecord.findMany({
        where,
        include: { book: true, user: { select: { id: true, name: true, email: true } } },
        skip,
        take: parseInt(per_page),
        orderBy: { createdAt: "desc" },
      }),
      prisma.borrowRecord.count({ where }),
    ]);

    res.json({
      data: records,
      meta: { total, page: parseInt(page), per_page: parseInt(per_page), last_page: Math.ceil(total / parseInt(per_page)) },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getPending = async (req, res) => {
  try {
    const records = await prisma.borrowRecord.findMany({
      where: { status: "PENDING" },
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};