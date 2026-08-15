import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Compiler from './pages/Compiler';
import MyPrograms from './pages/MyPrograms';
import { Mail } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);

    if (loading) {
        return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);

    if (loading) return null;

    if (user) {
        return <Navigate to="/compiler" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <div className="app-container">
            <Navbar />
            <Routes>
                <Route path="/" element={<Navigate to="/compiler" replace />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/compiler" element={<ProtectedRoute><Compiler /></ProtectedRoute>} />
                <Route path="/my-programs" element={<ProtectedRoute><MyPrograms /></ProtectedRoute>} />
            </Routes>
            <div style={{
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <span>Facing any queries? let us know at</span>
                <Mail size={16} />
                <a href="mailto:thanusrimareboina@gmail.com" style={{ color: 'var(--accent-primary)' }}>thanusrimareboina@gmail.com</a>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
