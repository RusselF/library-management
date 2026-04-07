import { Router } from "express";
import { getMembers, getMember, toggleStatus } from "../controllers/memberController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = Router();

router.get("/", auth, role("LIBRARIAN"), getMembers);
router.get("/:id", auth, role("LIBRARIAN"), getMember);
router.patch("/:id/toggle-status", auth, role("LIBRARIAN"), toggleStatus);

export default router;