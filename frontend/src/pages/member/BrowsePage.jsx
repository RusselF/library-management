import { useState, useEffect, useCallback, useRef } from "react";
import { getBooks, getGenres } from "../../api/books";
import { requestBorrow } from "../../api/borrow";
import toast from "react-hot-toast";

const BRAND = "#d2c1b7";
const BRAND_DARK = "#a08070";
const BRAND_TEXT = "#5c3d2e";

// ── Book Detail Modal ─────────────────────────────────────────────────────────
function BookDetailModal({ book, onClose, onBorrow, borrowingId }) {
  const available = book.stock > 0;
  const isLoading = borrowingId === book.id;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ backgroundColor: "rgba(44,28,20,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-48 overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND_TEXT})` }}>
          {book.coverUrl && (
            <img src={book.coverUrl} alt="" className="w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(44,28,20,0.8) 0%, transparent 60%)" }} />

          {/* Cover thumbnail */}
          <div className="absolute bottom-4 left-6 w-16 h-24 rounded-xl overflow-hidden shadow-2xl" style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: BRAND }}>
                <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>

          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white transition"
            style={{ background: "rgba(0,0,0,0.35)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Stock badge */}
          <div className={`absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full ${
            available ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
          }`}>
            {available ? `${book.stock} left` : "Unavailable"}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="ml-20 -mt-1 mb-5">
            {book.genre && (
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND_DARK }}>{book.genre}</span>
            )}
            <h2 className="text-lg font-bold text-slate-800 leading-tight mt-0.5">{book.title}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {book.author}{book.publishedYear ? ` · ${book.publishedYear}` : ""}
            </p>
          </div>

          {book.description ? (
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{book.description}</p>
          ) : (
            <p className="text-sm text-slate-400 italic mb-6">No description available.</p>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl border text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              style={{ borderColor: BRAND }}>
              Close
            </button>
            <button
              onClick={() => { onBorrow(book.id); onClose(); }}
              disabled={!available || isLoading}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: available ? BRAND_TEXT : "#94a3b8" }}>
              {isLoading ? "Requesting..." : available ? "Borrow Now" : "Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Book Card ─────────────────────────────────────────────────────────────────
function BookCard({ book, onClick }) {
  const available = book.stock > 0;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 2px 8px rgba(160,128,112,0.10)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(160,128,112,0.22)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(160,128,112,0.10)"}
    >
      <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: "2/3", background: BRAND }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}

        <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
          available ? "bg-emerald-500 text-white" : "bg-slate-500/80 text-white"
        }`}>
          {available ? `${book.stock}` : "—"}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          style={{ background: "rgba(92,61,46,0.35)" }}>
          <span className="bg-white text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: BRAND_TEXT }}>
            View Details
          </span>
        </div>
      </div>

      <div className="p-3">
        {book.genre && (
          <p className="text-xs font-bold uppercase tracking-wide truncate mb-0.5" style={{ color: BRAND_DARK }}>{book.genre}</p>
        )}
        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{book.title}</h3>
        <p className="text-xs text-slate-400 truncate mt-0.5">{book.author}</p>
      </div>
    </div>
  );
}

// ── Browse Page ───────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const [books, setBooks]                 = useState([]);
  const [genres, setGenres]               = useState([]);
  const [meta, setMeta]                   = useState({ total: 0, last_page: 1 });
  const [loading, setLoading]             = useState(true);
  const [borrowingId, setBorrowingId]     = useState(null);
  const [search, setSearch]               = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [page, setPage]                   = useState(1);
  const [selectedBook, setSelectedBook]   = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12 };
      if (search.trim()) params.search = search.trim();
      if (selectedGenre) params.genre = selectedGenre;
      const res = await getBooks(params);
      setBooks(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  }, [search, selectedGenre, page]);

  useEffect(() => {
    getGenres().then((res) => setGenres(res.data.genres)).catch(() => {});
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchBooks, 300);
    return () => clearTimeout(delay);
  }, [fetchBooks]);

  // Scroll to top button
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleBorrow = async (bookId) => {
    setBorrowingId(bookId);
    try {
      await requestBorrow(bookId);
      toast.success("Borrow request submitted!");
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setBorrowingId(null);
    }
  };

  const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div ref={mainRef} className="min-h-screen overflow-y-auto" style={{ background: "#f9f5f2" }}>

      {/* ── Hero ── */}
      <div className="px-8 pt-10 pb-6" style={{ background: `linear-gradient(160deg, #f0e6df 0%, #f9f5f2 100%)` }}>
        <h1 className="text-3xl font-bold mb-1" style={{ color: BRAND_TEXT }}>What will you read next?</h1>
        <p className="text-sm mb-6" style={{ color: BRAND_DARK }}>Browse and borrow from our collection</p>

        {/* Search */}
        <div className="relative max-w-xl">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND_DARK }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by title, author, or genre..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none transition"
            style={{
              background: "white",
              border: `1.5px solid ${BRAND}`,
              boxShadow: "0 2px 12px rgba(160,128,112,0.10)"
            }}
            onFocus={e => e.target.style.borderColor = BRAND_DARK}
            onBlur={e => e.target.style.borderColor = BRAND}
          />
        </div>
      </div>

      <div className="px-8 pb-12">

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-6 mb-8 border-t" style={{ borderColor: "#e8d8d0" }}>
            {["", ...genres].map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g || "all"}
                  onClick={() => { setSelectedGenre(g); setPage(1); }}
                  className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
                  style={{
                    background: active ? "#5c3d2e" : "white",
                    color: active ? "white" : "#a08070",
                    border: `1.5px solid ${active ? "#5c3d2e" : "#d2c1b7"}`,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = "#f5ede8";
                      e.currentTarget.style.borderColor = "#a08070";
                      e.currentTarget.style.color = "#5c3d2e";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#d2c1b7";
                      e.currentTarget.style.color = "#a08070";
                    }
                  }}
                >
                  {g || "All"}
                </button>
              );
            })}
          </div>
        )}

        {/* Section heading */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {selectedGenre || (search ? `Results for "${search}"` : "Discover Books")}
            </h2>
            {!loading && (
              <p className="text-xs mt-0.5" style={{ color: BRAND_DARK }}>
                {meta.total} book{meta.total !== 1 ? "s" : ""} · click to see details
              </p>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: "2/3", background: BRAND }} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: BRAND }}>
              <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">No books found</p>
            <p className="text-sm mt-1" style={{ color: BRAND_DARK }}>Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: `1.5px solid ${BRAND}`, color: BRAND_TEXT }}>
              ← Prev
            </button>
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-2 text-sm" style={{ color: BRAND_DARK }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-xl text-sm font-medium transition"
                  style={{
                    background: page === p ? BRAND_TEXT : "white",
                    color: page === p ? "white" : BRAND_TEXT,
                    border: `1.5px solid ${page === p ? BRAND_TEXT : BRAND}`,
                  }}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: `1.5px solid ${BRAND}`, color: BRAND_TEXT }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white transition-all z-40"
          style={{ background: BRAND_TEXT }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Modal */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onBorrow={handleBorrow}
          borrowingId={borrowingId}
        />
      )}
    </div>
  );
}