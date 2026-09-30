import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';

// Temporary dashboard placeholder
const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="p-8 text-white min-h-screen bg-gray-950">
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <button onClick={logout} className="mt-4 bg-red-600 px-4 py-2 rounded">Logout</button>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
