import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Compiler from './pages/Compiler';
import MyPrograms from './pages/MyPrograms';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = React.useContext(AuthContext);
    
    if (loading) {
        return <div className="app-container" style={{justifyContent:'center', alignItems:'center'}}>Loading...</div>;
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
