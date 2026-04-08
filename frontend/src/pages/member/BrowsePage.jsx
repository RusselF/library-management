import { useState, useEffect, useCallback } from "react";
import { getBooks, getGenres } from "../../api/books";
import { requestBorrow } from "../../api/borrow";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  UNAVAILABLE: "bg-red-50 text-red-600 border border-red-200",
};

function BookCard({ book, onBorrow, borrowingId }) {
  const available = book.stock > 0;
  const isLoading = borrowingId === book.id;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
      {/* Cover */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 h-44 flex items-center justify-center flex-shrink-0">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <div className="text-4xl mb-2">📖</div>
            <p className="text-xs text-indigo-400 font-medium line-clamp-2">{book.title}</p>
          </div>
        )}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${available ? STATUS_BADGE.AVAILABLE : STATUS_BADGE.UNAVAILABLE}`}>
          {available ? `${book.stock} left` : "Out of stock"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 leading-snug mb-1">{book.title}</h3>
        <p className="text-xs text-gray-500 mb-1">{book.author}</p>
        <div className="flex items-center gap-2 mt-auto pt-3">
          {book.genre && (
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
              {book.genre}
            </span>
          )}
          {book.publishedYear && (
            <span className="text-xs text-gray-400">{book.publishedYear}</span>
          )}
        </div>

        <button
          onClick={() => onBorrow(book.id)}
          disabled={!available || isLoading}
          className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isLoading ? "Requesting..." : available ? "Borrow" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, page: 1 });
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

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleGenre = (genre) => {
    setSelectedGenre((prev) => (prev === genre ? "" : genre));
    setPage(1);
  };

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

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Browse Books</h1>
        <p className="text-gray-500 text-sm mt-1">Find and borrow books from our catalogue</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by title, author, or genre..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Genre pills */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => handleGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedGenre === g
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-4">
          {meta.total} book{meta.total !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
          {selectedGenre && ` in ${selectedGenre}`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">No books found</p>
          <p className="text-sm mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onBorrow={handleBorrow} borrowingId={borrowingId} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page === meta.last_page}
            className="px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}