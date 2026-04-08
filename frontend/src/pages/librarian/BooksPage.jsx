import { useState, useEffect, useCallback } from "react";
import { getBooks, createBook, updateBook, deleteBook } from "../../api/books";
import toast from "react-hot-toast";

const EMPTY_FORM = { title: "", author: "", isbn: "", genre: "", publishedYear: "", stock: "", coverUrl: "" };

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.author.trim()) errors.author = "Author is required";
  if (!form.isbn.trim()) errors.isbn = "ISBN is required";
  if (!form.genre.trim()) errors.genre = "Genre is required";
  if (!form.publishedYear) errors.publishedYear = "Published year is required";
  else if (isNaN(form.publishedYear) || +form.publishedYear < 1000 || +form.publishedYear > new Date().getFullYear())
    errors.publishedYear = "Enter a valid year";
  if (form.stock === "" || form.stock === undefined) errors.stock = "Stock is required";
  else if (isNaN(form.stock) || +form.stock < 0) errors.stock = "Stock must be 0 or more";
  return errors;
}

function BookModal({ book, onClose, onSaved }) {
  const isEdit = !!book?.id;
  const [form, setForm] = useState(
    book ? { ...book, publishedYear: String(book.publishedYear), stock: String(book.stock), coverUrl: book.coverUrl || "" }
         : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, publishedYear: parseInt(form.publishedYear), stock: parseInt(form.stock) };
      if (isEdit) await updateBook(book.id, payload);
      else await createBook(payload);
      toast.success(isEdit ? "Book updated!" : "Book created!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "title", label: "Title", type: "text", placeholder: "e.g. The Great Gatsby", full: true },
    { name: "author", label: "Author", type: "text", placeholder: "e.g. F. Scott Fitzgerald" },
    { name: "isbn", label: "ISBN", type: "text", placeholder: "e.g. 978-3-16-148410-0" },
    { name: "genre", label: "Genre", type: "text", placeholder: "e.g. Fiction" },
    { name: "publishedYear", label: "Published Year", type: "number", placeholder: "e.g. 1925" },
    { name: "stock", label: "Stock", type: "number", placeholder: "e.g. 5" },
    { name: "coverUrl", label: "Cover URL (optional)", type: "text", placeholder: "https://...", full: true },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{isEdit ? "Edit Book" : "Add New Book"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} noValidate className="p-6 grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.full ? "col-span-2" : "col-span-1"}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[f.name] ? "border-red-300" : "border-slate-200"
                }`}
              />
              {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name]}</p>}
            </div>
          ))}
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50">
              {loading ? "Saving..." : isEdit ? "Update Book" : "Add Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ book, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBook(book.id);
      toast.success("Book deleted");
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete book");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-2">Delete Book</h2>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-700">"{book.title}"</span>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search.trim()) params.search = search.trim();
      const res = await getBooks(params);
      setBooks(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  const closeModal = () => setModal(null);
  const handleSaved = () => { closeModal(); fetchBooks(); };
  const handleDeleted = () => { closeModal(); fetchBooks(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Books</h1>
          <p className="text-slate-400 text-sm mt-1">Manage the book catalogue</p>
        </div>
        <button onClick={() => setModal({ type: "add" })} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
          + Add Book
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by title, author, or genre..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-semibold text-slate-500">No books found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Book</th>
                  <th className="px-6 py-3">ISBN</th>
                  <th className="px-6 py-3">Genre</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700 max-w-[200px] truncate">{b.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{b.author}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{b.isbn}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full">{b.genre}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{b.publishedYear}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        b.stock > 0 ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-500 border-red-200"
                      }`}>
                        {b.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setModal({ type: "edit", book: b })} className="text-xs font-semibold text-blue-600 hover:underline mr-4">Edit</button>
                      <button onClick={() => setModal({ type: "delete", book: b })} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">← Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {meta.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Next →</button>
        </div>
      )}

      {modal?.type === "add"    && <BookModal onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === "edit"   && <BookModal book={modal.book} onClose={closeModal} onSaved={handleSaved} />}
      {modal?.type === "delete" && <DeleteModal book={modal.book} onClose={closeModal} onDeleted={handleDeleted} />}
    </div>
  );
}