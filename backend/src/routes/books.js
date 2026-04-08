import { Router } from "express";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getGenres,
  upload,
} from "../controllers/bookController.js";
import auth from "../middleware/auth.js";
import role from "../middleware/role.js";

const router = Router();

// Multer error handler wrapper — converts multer errors to clean JSON responses
const handleUpload = (req, res, next) => {
  upload.single("cover")(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({ message: "File too large. Maximum size is 2 MB." });
    }
    if (err.message === "Only JPG and PNG files are allowed") {
      return res.status(422).json({ message: err.message });
    }
    return res.status(500).json({ message: "Upload failed", error: err.message });
  });
};

router.get("/",         auth,                        getBooks);
router.get("/genres",   auth,                        getGenres);
router.get("/:id",      auth,                        getBook);
router.post("/",        auth, role("LIBRARIAN"), handleUpload, createBook);
router.put("/:id",      auth, role("LIBRARIAN"), handleUpload, updateBook);
router.delete("/:id",   auth, role("LIBRARIAN"),     deleteBook);

export default router;