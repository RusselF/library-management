import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../api/auth";
import toast from "react-hot-toast";

const navItems = [
  { to: "/member", label: "Browse Books", icon: "📖", end: true },
  { to: "/member/history", label: "My History", icon: "🕐" },
];

export default function MemberLayout() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // proceed anyway
    } finally {
      clearAuth();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">📚 Library</h1>
          <p className="text-xs text-gray-500 mt-1">Member Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-3 px-4">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition disabled:opacity-50"
          >
            <span>🚪</span>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}