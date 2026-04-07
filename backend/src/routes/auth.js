import { Router } from "express";
import { register, login, logout, me } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/me", auth, me);

export default router;