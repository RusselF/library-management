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

function HistoryRow({ record, onReturn, returningId }) {
  const status = STATUS_CONFIG[record.status];
  const isReturning = returningId === record.id;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-200 hover:shadow-sm transition-all duration-150">
      <div className="flex-shrink-0 w-11 h-15 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center" style={{ height: 60 }}>
        {record.book?.coverUrl ? (
          <img src={record.book.coverUrl} alt={record.book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-6 h-8 bg-slate-300 rounded-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{record.book?.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{record.book?.author}</p>
        <div className="flex flex-wrap gap-x-4 mt-2 text-xs text-slate-400">
          <span>Requested {formatDate(record.createdAt)}</span>
          {record.borrowedAt && <span>Borrowed {formatDate(record.borrowedAt)}</span>}
          {record.returnedAt && <span>Returned {formatDate(record.returnedAt)}</span>}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status?.className}`}>
          {status?.label}
        </span>
        {record.status === "APPROVED" && (
          <button
            onClick={() => onReturn(record.id)}
            disabled={isReturning}
            className="text-xs px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReturning ? "Returning..." : "Return"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyHistoryPage() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

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
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">My History</h1>
        <p className="text-slate-400 text-sm mt-1">Track all your borrow requests and returns</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 mb-5">
          {meta.total} record{meta.total !== 1 ? "s" : ""}
          {statusFilter !== "ALL" && ` · ${STATUS_CONFIG[statusFilter]?.label}`}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
            <HistoryRow key={record.id} record={record} onReturn={handleReturn} returningId={returningId} />
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
  );
}