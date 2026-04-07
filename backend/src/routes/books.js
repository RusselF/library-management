import { Router } from "express";
import { getBooks, getBook, createBook, updateBook, deleteBook, getGenres } from "../controllers/bookController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = Router();

router.get("/", auth, getBooks);
router.get("/genres", auth, getGenres);
router.get("/:id", auth, getBook);
router.post("/", auth, role("LIBRARIAN"), createBook);
router.put("/:id", auth, role("LIBRARIAN"), updateBook);
router.delete("/:id", auth, role("LIBRARIAN"), deleteBook);

export default router;