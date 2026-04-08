import { useState, useEffect, useCallback } from "react";
import { allHistory, getPending, approveBorrow, rejectBorrow } from "../../api/borrow";
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

function ConfirmModal({ title, message, confirmLabel, confirmClass, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className={`px-4 py-2 rounded-xl text-sm text-white font-semibold transition disabled:opacity-50 ${confirmClass}`}>
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BorrowsPage() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (statusFilter === "PENDING") {
        const res = await getPending();
        setRecords(res.data.records);
        setMeta({ total: res.data.records.length, last_page: 1 });
      } else {
        const params = { page, per_page: 10 };
        if (statusFilter !== "ALL") params.status = statusFilter;
        const res = await allHistory(params);
        setRecords(res.data.data);
        setMeta(res.data.meta);
      }
    } catch {
      toast.error("Failed to load borrow records");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleApprove = async () => {
    try {
      await approveBorrow(actionModal.record.id);
      toast.success("Request approved!");
      setActionModal(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
      setActionModal(null);
    }
  };

  const handleReject = async () => {
    try {
      await rejectBorrow(actionModal.record.id);
      toast.success("Request rejected");
      setActionModal(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
      setActionModal(null);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Borrows</h1>
        <p className="text-slate-400 text-sm mt-1">Manage borrow requests and history</p>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-semibold text-slate-500">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Book</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Borrowed</th>
                  <th className="px-6 py-3">Returned</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => {
                  const s = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-700">{r.user?.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.user?.email}</p>
                      </td>
                      <td className="px-6 py-4 max-w-[180px]">
                        <p className="text-slate-600 truncate font-medium">{r.book?.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.book?.author}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{formatDate(r.borrowedAt)}</td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{formatDate(r.returnedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s?.className}`}>
                          {s?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {r.status === "PENDING" ? (
                          <>
                            <button onClick={() => setActionModal({ type: "approve", record: r })} className="text-xs font-semibold text-blue-600 hover:underline mr-4">Approve</button>
                            <button onClick={() => setActionModal({ type: "reject", record: r })} className="text-xs font-semibold text-red-500 hover:underline">Reject</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && statusFilter !== "PENDING" && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">← Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {meta.last_page}</span>
          <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page} className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Next →</button>
        </div>
      )}

      {actionModal?.type === "approve" && (
        <ConfirmModal
          title="Approve Request"
          message={`Approve borrow request from ${actionModal.record.user?.name} for "${actionModal.record.book?.title}"?`}
          confirmLabel="Approve"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onClose={() => setActionModal(null)}
          onConfirm={handleApprove}
        />
      )}
      {actionModal?.type === "reject" && (
        <ConfirmModal
          title="Reject Request"
          message={`Reject borrow request from ${actionModal.record.user?.name} for "${actionModal.record.book?.title}"?`}
          confirmLabel="Reject"
          confirmClass="bg-red-600 hover:bg-red-700"
          onClose={() => setActionModal(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}