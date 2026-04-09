import { useState, useEffect, useCallback } from "react";
import { myHistory, returnBook } from "../../api/borrow";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  className: "bg-amber-50 text-amber-600 border border-amber-200" },
  APPROVED: { label: "Approved", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  RETURNED: { label: "Returned", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-500 border border-red-200" },
};

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "RETURNED", "REJECTED"];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function HistoryCard({ record, onReturn, returningId }) {
  const status = STATUS_CONFIG[record.status];
  const isReturning = returningId === record.id;

  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 items-start hover:shadow-md transition-all duration-200 group">
      {/* Book cover */}
      <div className="w-14 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100" style={{ height: 80 }}>
        {record.book?.coverUrl ? (
          <img src={record.book.coverUrl} alt={record.book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{record.book?.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{record.book?.author}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${status?.className}`}>
            {status?.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 mt-2.5 text-xs text-slate-400">
          <span>Requested {formatDate(record.createdAt)}</span>
          {record.borrowedAt && <span>Borrowed {formatDate(record.borrowedAt)}</span>}
          {record.returnedAt && <span>Returned {formatDate(record.returnedAt)}</span>}
        </div>

        {record.status === "APPROVED" && (
          <button
            onClick={() => onReturn(record.id)}
            disabled={isReturning}
            className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition disabled:opacity-50"
          >
            {isReturning ? "Returning..." : "Return Book"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyHistoryPage() {
  const [records, setRecords]       = useState([]);
  const [meta, setMeta]             = useState({ total: 0, last_page: 1 });
  const [loading, setLoading]       = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]             = useState(1);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const res = await myHistory(params);
      setRecords(res.data.data);
      setMeta(res.data.meta);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleReturn = async (id) => {
    setReturningId(id);
    try {
      await returnBook(id);
      toast.success("Book returned successfully!");
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to return book");
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">My Library</h1>
          <p className="text-xs text-slate-400">Track your borrow requests and returns</p>
        </div>
        {!loading && (
          <p className="text-xs text-slate-400">
            {meta.total} record{meta.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="px-8 py-8">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === s
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-slate-200 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">No records found</p>
            <p className="text-sm mt-1">
              {statusFilter !== "ALL" ? "Try a different filter" : "You haven't borrowed any books yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <HistoryCard key={record.id} record={record} onReturn={handleReturn} returningId={returningId} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              ← Prev
            </button>
            <span className="text-sm text-slate-500">Page {page} of {meta.last_page}</span>
            <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}