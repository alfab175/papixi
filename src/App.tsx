import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { getCurrentUser } from './services/auth';
import { DBUser } from './services/localDB';
import Login from './pages/Login';
import Register from './pages/Register';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import Main from './pages/Main';

export type PageType = 'login' | 'register' | 'payment' | 'main' | 'admin';

function App() {
  const [page, setPage] = useState<PageType>('login');
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) {
      setUser(saved);
      setPage('main');
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (u: DBUser) => {
    setUser(u);
    setPage('main');
  };

  const handleRegisterSuccess = (u: DBUser) => {
    setUser(u);
    setPage('payment');
  };

  const handlePaymentDone = (u: DBUser) => {
    setUser(u);
    setPage('main');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  const handleUserUpdate = (u: DBUser) => setUser(u);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-black mb-3" style={{ background: 'linear-gradient(135deg, #e50914 0%, #ff6b35 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
          <div className="flex items-center gap-2 justify-center text-gray-400">
            <span className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1c1c1c',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#e50914', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {page === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setPage('register')}
          onAdminClick={() => setPage('admin')}
        />
      )}

      {page === 'register' && (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setPage('login')}
        />
      )}

      {page === 'payment' && user && (
        <Payment
          user={user}
          onComplete={handlePaymentDone}
          onSkip={() => setPage('main')}
        />
      )}

      {page === 'main' && user && (
        <Main
          user={user}
          onUserUpdate={handleUserUpdate}
          onAdminClick={() => setPage('admin')}
          onLogout={handleLogout}
        />
      )}

      {page === 'admin' && <AdminDashboard onBack={() => setPage(user ? 'main' : 'login')} />}
    </>
  );
}

export default App;
