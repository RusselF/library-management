import { useState, useEffect, useCallback } from "react";
import { myHistory, returnBook } from "../../api/borrow";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: "🕐",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: "✅",
  },
  RETURNED: {
    label: "Returned",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: "📬",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-600 border border-red-200",
    icon: "❌",
  },
};

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "RETURNED", "REJECTED"];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function HistoryRow({ record, onReturn, returningId }) {
  const status = STATUS_CONFIG[record.status] || STATUS_CONFIG.PENDING;
  const isReturning = returningId === record.id;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-200 transition">
      {/* Book cover thumbnail */}
      <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        {record.book?.coverUrl ? (
          <img src={record.book.coverUrl} alt={record.book.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">📖</span>
        )}
      </div>

      {/* Book info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">{record.book?.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{record.book?.author}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-400">
          <span>Requested: {formatDate(record.createdAt)}</span>
          {record.borrowedAt && <span>Borrowed: {formatDate(record.borrowedAt)}</span>}
          {record.returnedAt && <span>Returned: {formatDate(record.returnedAt)}</span>}
        </div>
      </div>

      {/* Status + action */}
      <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
          {status.icon} {status.label}
        </span>
        {record.status === "APPROVED" && (
          <button
            onClick={() => onReturn(record.id)}
            disabled={isReturning}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My History</h1>
        <p className="text-gray-500 text-sm mt-1">Track all your borrow requests and returns</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              statusFilter === s
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
            }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.icon + " " + STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Results info */}
      {!loading && (
        <p className="text-xs text-gray-400 mb-4">
          {meta.total} record{meta.total !== 1 ? "s" : ""}
          {statusFilter !== "ALL" && ` · ${STATUS_CONFIG[statusFilter]?.label}`}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">No records found</p>
          <p className="text-sm mt-1">
            {statusFilter !== "ALL"
              ? "Try selecting a different status filter"
              : "You haven't borrowed any books yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <HistoryRow
              key={record.id}
              record={record}
              onReturn={handleReturn}
              returningId={returningId}
            />
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