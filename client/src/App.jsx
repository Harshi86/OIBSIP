import { Navigate, Route, Routes, Link, NavLink } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Login, Register, Verify, Forgot, Reset } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Builder from './pages/Builder.jsx';
import Summary from './pages/Summary.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return children;
}

function Nav() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <header className="nav">
      <Link to="/" className="brand">Pizza Palace</Link>
      <nav>
        {user.role === 'user' && (
          <>
            <NavLink to="/dashboard">Menu &amp; orders</NavLink>
            <NavLink to="/build">Build your own</NavLink>
          </>
        )}
        {user.role === 'admin' && <NavLink to="/admin">Kitchen console</NavLink>}
        <button className="link" onClick={signOut}>Log out ({user.name.split(' ')[0]})</button>
      </nav>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:token" element={<Verify />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset/:token" element={<Reset />} />
        <Route path="/admin/login" element={<Login admin />} />
        <Route path="/dashboard" element={<Guard role="user"><Dashboard /></Guard>} />
        <Route path="/build" element={<Guard role="user"><Builder /></Guard>} />
        <Route path="/summary" element={<Guard role="user"><Summary /></Guard>} />
        <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
