import prisma from "../lib/prisma.js";

export const getMembers = async (req, res) => {
  try {
    const { search, is_active, page = 1, per_page = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(per_page);
    const where = { role: "MEMBER" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (is_active !== undefined) where.isActive = is_active === "true";

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        skip,
        take: parseInt(per_page),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: members,
      meta: { total, page: parseInt(page), per_page: parseInt(per_page), last_page: Math.ceil(total / parseInt(per_page)) },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getMember = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        borrowRecords: { include: { book: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) return res.status(404).json({ message: "Member not found" });
    res.json({ member: user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ message: "Member not found" });
    if (user.role === "LIBRARIAN") {
      return res.status(422).json({ message: "Cannot deactivate librarian accounts" });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.json({ message: updated.isActive ? "Member activated" : "Member deactivated", member: updated });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};