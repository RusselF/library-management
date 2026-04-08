import { useState, useEffect } from "react";
import { getBooks } from "../../api/books";
import { allHistory, getPending } from "../../api/borrow";
import { getMembers } from "../../api/member";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  PENDING:  { label: "Pending",  className: "bg-amber-50 text-amber-600 border border-amber-200" },
  APPROVED: { label: "Approved", className: "bg-blue-50 text-blue-600 border border-blue-200" },
  RETURNED: { label: "Returned", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  REJECTED: { label: "Rejected", className: "bg-red-50 text-red-500 border border-red-200" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, loading, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{loading ? "—" : value ?? "—"}</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ books: null, members: null, pending: null, active: null });
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [booksRes, membersRes, pendingRes, activeRes] = await Promise.all([
          getBooks({ per_page: 1 }),
          getMembers({ per_page: 1 }),
          getPending(),
          allHistory({ status: "APPROVED", per_page: 1 }),
        ]);
        setStats({
          books: booksRes.data.meta.total,
          members: membersRes.data.meta.total,
          pending: pendingRes.data.records.length,
          active: activeRes.data.meta.total,
        });
        setPendingRecords(pendingRes.data.records.slice(0, 5));
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Library overview at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Books"       value={stats.books}   loading={loading} accent="text-blue-600" />
        <StatCard label="Total Members"     value={stats.members} loading={loading} accent="text-purple-600" />
        <StatCard label="Pending Requests"  value={stats.pending} loading={loading} accent="text-amber-500" />
        <StatCard label="Active Borrows"    value={stats.active}  loading={loading} accent="text-emerald-600" />
      </div>

      {/* Pending table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Pending Requests</h2>
          <button onClick={() => navigate("/librarian/borrows")} className="text-xs text-blue-600 hover:underline font-semibold">
            View all →
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pendingRecords.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <p className="font-semibold text-slate-500">No pending requests</p>
            <p className="text-sm mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Book</th>
                  <th className="px-6 py-3">Requested</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRecords.map((r) => {
                  const s = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-slate-700">{r.user?.name}</p>
                        <p className="text-xs text-slate-400">{r.user?.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 max-w-[200px] truncate">{r.book?.title}</td>
                      <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s?.className}`}>
                          {s?.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}