import { useState, useEffect, useCallback } from "react";
import { getBooks, getGenres } from "../../api/books";
import { requestBorrow } from "../../api/borrow";
import toast from "react-hot-toast";

function BookCard({ book, onBorrow, borrowingId }) {
  const available = book.stock > 0;
  const isLoading = borrowingId === book.id;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-48 flex items-center justify-center overflow-hidden">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center justify-center px-4 text-center">
            <div className="w-10 h-14 bg-slate-300 rounded mb-2" />
            <p className="text-xs text-slate-400 line-clamp-2">{book.title}</p>
          </div>
        )}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
          available ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
        }`}>
          {available ? `${book.stock} left` : "Unavailable"}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {book.genre && (
          <p className="text-xs font-semibold text-blue-500 mb-1 uppercase tracking-wide">{book.genre}</p>
        )}
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug mb-1">{book.title}</h3>
        <p className="text-xs text-slate-400 mb-4">
          {book.author}{book.publishedYear ? ` · ${book.publishedYear}` : ""}
        </p>
        <button
          onClick={() => onBorrow(book.id)}
          disabled={!available || isLoading}
          className={`mt-auto w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
            available && !isLoading
              ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Requesting..." : available ? "Borrow Now" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [page, setPage] = useState(1);

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
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Browse Books</h1>
        <p className="text-slate-400 text-sm mt-1">Discover and borrow from our catalogue</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
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

      {/* Genre filter */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setSelectedGenre(""); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedGenre === "" ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => { setSelectedGenre(g === selectedGenre ? "" : g); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedGenre === g ? "bg-blue-600 text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-xs text-slate-400 mb-5">
          {meta.total} book{meta.total !== 1 ? "s" : ""}
          {search && ` for "${search}"`}
          {selectedGenre && ` in ${selectedGenre}`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600">No books found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onBorrow={handleBorrow} borrowingId={borrowingId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            ← Prev
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                  page === p ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}