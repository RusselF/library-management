import { Router } from "express";
import { requestBorrow, approveBorrow, rejectBorrow, returnBook, myHistory, allHistory, getPending } from "../controllers/borrowController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = Router();

router.get("/my-history", auth, myHistory);
router.get("/", auth, role("LIBRARIAN"), allHistory);
router.get("/pending", auth, role("LIBRARIAN"), getPending);
router.post("/books/:bookId", auth, role("MEMBER"), requestBorrow);
router.patch("/:id/approve", auth, role("LIBRARIAN"), approveBorrow);
router.patch("/:id/reject", auth, role("LIBRARIAN"), rejectBorrow);
router.patch("/:id/return", auth, role("MEMBER"), returnBook);

export default router;