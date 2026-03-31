import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import SuggestionsPage from './pages/SuggestionsPage';

function MainLayout({ children }) {
  const { currentUser, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <h1>Meu App Financeiro</h1>
          <span className="subtitle">controle de gastos inteligente</span>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/gastos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Gastos
          </NavLink>
          <NavLink to="/sugestoes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Sugestões
          </NavLink>
          <span className="user-chip">{currentUser?.email}</span>
          <button type="button" className="button-link danger" onClick={logout}>
            Sair
          </button>
        </nav>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/cadastro"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gastos"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ExpensesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sugestoes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SuggestionsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
