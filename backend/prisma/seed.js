import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "librarian@library.com" },
    update: { isActive: true },
    create: {
      name: "Librarian",
      email: "librarian@library.com",
      password: hashedPassword,
      role: "LIBRARIAN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "russel@library.com" },
    update: { isActive: true },
    create: {
      name: "Russel Figo",
      email: "russel@library.com",
      password: hashedPassword,
      role: "MEMBER",
      isActive: true,
    },
  });

  const books = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", genre: "Fiction", publishedYear: 1925, stock: 3 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061935466", genre: "Fiction", publishedYear: 1960, stock: 5 },
    { title: "1984", author: "George Orwell", isbn: "9780451524935", genre: "Dystopian", publishedYear: 1949, stock: 4 },
    { title: "Clean Code", author: "Robert C. Martin", isbn: "9780132350884", genre: "Technology", publishedYear: 2008, stock: 2 },
    { title: "The Pragmatic Programmer", author: "David Thomas", isbn: "9780135957059", genre: "Technology", publishedYear: 2019, stock: 3 },
  ];

  for (const book of books) {
    await prisma.book.upsert({ where: { isbn: book.isbn }, update: {}, create: book });
  }

  console.log("Seed complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());