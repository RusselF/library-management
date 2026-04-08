import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Librarian pages
import LibrarianLayout from "./pages/librarian/LibrarianLayout";
import DashboardPage from "./pages/librarian/DashboardPage";
import BooksPage from "./pages/librarian/BooksPage";
import MembersPage from "./pages/librarian/MembersPage";
import BorrowsPage from "./pages/librarian/BorrowsPage";

// Member pages
import MemberLayout from "./pages/member/MemberLayout";
import BrowsePage from "./pages/member/BrowsePage";
import MyHistoryPage from "./pages/member/MyHistoryPage";

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "LIBRARIAN" ? "/librarian" : "/member"} replace />;
  }
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "LIBRARIAN" ? "/librarian" : "/member"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/librarian" element={
            <PrivateRoute allowedRoles={["LIBRARIAN"]}><LibrarianLayout /></PrivateRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="books" element={<BooksPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="borrows" element={<BorrowsPage />} />
          </Route>

          <Route path="/member" element={
            <PrivateRoute allowedRoles={["MEMBER"]}><MemberLayout /></PrivateRoute>
          }>
            <Route index element={<BrowsePage />} />
            <Route path="history" element={<MyHistoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}