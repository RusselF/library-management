import { useState, useEffect, useCallback } from "react";
import { myHistory, returnBook } from "../../api/borrow";
import toast from "react-hot-toast";

const BRAND = "#d2c1b7";
const BRAND_DARK = "#a08070";
const BRAND_TEXT = "#5c3d2e";

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

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function HistoryCard({ record, onReturn, returningId }) {
  const status = STATUS_CONFIG[record.status];
  const isReturning = returningId === record.id;

  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 items-start transition-all duration-200"
      style={{ boxShadow: "0 2px 8px rgba(160,128,112,0.08)" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(160,128,112,0.18)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(160,128,112,0.08)"}
    >
      {/* Book cover */}
      <div className="w-14 shrink-0 rounded-xl overflow-hidden" style={{ height: 80, background: BRAND }}>
        {record.book?.coverUrl ? (
          <img src={record.book.coverUrl} alt={record.book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }}>
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <p className="text-xs mt-0.5" style={{ color: BRAND_DARK }}>{record.book?.author}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${status?.className}`}>
            {status?.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 mt-2.5 text-xs" style={{ color: BRAND_DARK }}>
          <span>Requested {formatDate(record.createdAt)}</span>
          {record.borrowedAt && <span>Borrowed {formatDate(record.borrowedAt)}</span>}
          {record.returnedAt && <span>Returned {formatDate(record.returnedAt)}</span>}
        </div>

        {record.status === "APPROVED" && (
          <button
            onClick={() => onReturn(record.id)}
            disabled={isReturning}
            className="mt-3 px-4 py-1.5 rounded-xl text-white text-xs font-bold transition disabled:opacity-50"
            style={{ background: BRAND_TEXT }}
            onMouseEnter={e => { if (!isReturning) e.currentTarget.style.background = "#7a5242"; }}
            onMouseLeave={e => { if (!isReturning) e.currentTarget.style.background = BRAND_TEXT; }}
          >
            {isReturning ? "Returning..." : "Return Book"}
          </button>
        )}
      </div>
    </div>
  );
}

function CurrentlyBorrowingSection({ records, onReturn, returningId }) {
  const active = records.filter((r) => r.status === "APPROVED");
  if (active.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#5c3d2e" }} />
        <h2 className="text-sm font-bold" style={{ color: "#5c3d2e" }}>
          Currently Borrowing · {active.length} book{active.length > 1 ? "s" : ""}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((record) => {
          const days = daysSince(record.borrowedAt);
          const isReturning = returningId === record.id;

          return (
            <div key={record.id}
              className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                border: `1.5px solid #d2c1b7`,
                boxShadow: "0 2px 12px rgba(160,128,112,0.12)"
              }}
            >
              {/* Top strip */}
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #5c3d2e, #d2c1b7)" }} />

              <div className="p-4 flex gap-3">
                {/* Cover */}
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#d2c1b7" }}>
                  {record.book?.coverUrl ? (
                    <img src={record.book.coverUrl} alt={record.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #d2c1b7, #a08070)" }}>
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{record.book?.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#a08070" }}>{record.book?.author}</p>

                  {/* Countdown */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "#a08070" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: "#5c3d2e" }}>
                      {days === 0 ? "Borrowed today" : `${days} day${days > 1 ? "s" : ""} ago`}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#a08070" }}>
                    since {formatDate(record.borrowedAt)}
                  </p>
                </div>
              </div>

              {/* Return button */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => onReturn(record.id)}
                  disabled={isReturning}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50"
                  style={{ background: "#5c3d2e" }}
                  onMouseEnter={e => { if (!isReturning) e.currentTarget.style.background = "#7a5242"; }}
                  onMouseLeave={e => { if (!isReturning) e.currentTarget.style.background = "#5c3d2e"; }}
                >
                  {isReturning ? "Returning..." : "Return Book"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyHistoryPage() {
  const [records, setRecords]           = useState([]);
  const [meta, setMeta]                 = useState({ total: 0, last_page: 1 });
  const [loading, setLoading]           = useState(true);
  const [returningId, setReturningId]   = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage]                 = useState(1);

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
    <div className="min-h-screen" style={{ background: "#f9f5f2" }}>

      {/* Top bar */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
        style={{ background: "white", borderBottom: `1px solid ${BRAND}` }}>
        <div>
          <h1 className="text-lg font-bold text-slate-800">My Library</h1>
          <p className="text-xs" style={{ color: BRAND_DARK }}>Track your borrow requests and returns</p>
        </div>
        {!loading && (
          <p className="text-xs" style={{ color: BRAND_DARK }}>
            {meta.total} record{meta.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="px-8 py-8">
        {/* Currently Borrowing Section */}
        {(statusFilter === "ALL" || statusFilter === "APPROVED") && !loading && (
          <CurrentlyBorrowingSection
            records={records}
            onReturn={handleReturn}
            returningId={returningId}
          />
        )}

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
                style={{
                  background: active ? BRAND_TEXT : "white",
                  color: active ? "white" : BRAND_DARK,
                  border: `1.5px solid ${active ? BRAND_TEXT : BRAND}`,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "#f5ede8";
                    e.currentTarget.style.borderColor = BRAND_DARK;
                    e.currentTarget.style.color = BRAND_TEXT;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = BRAND;
                    e.currentTarget.style.color = BRAND_DARK;
                  }
                }}
              >
                {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: BRAND }} />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: BRAND }}>
              <svg className="w-7 h-7 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-slate-600">No records found</p>
            <p className="text-sm mt-1" style={{ color: BRAND_DARK }}>
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
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: `1.5px solid ${BRAND}`, color: BRAND_TEXT }}>
              ← Prev
            </button>
            <span className="text-sm" style={{ color: BRAND_DARK }}>Page {page} of {meta.last_page}</span>
            <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ border: `1.5px solid ${BRAND}`, color: BRAND_TEXT }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}