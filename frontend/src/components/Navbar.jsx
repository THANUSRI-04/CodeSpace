import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Code2, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                <Code2 size={24} color="var(--accent-primary)" />
                Code<span>Space</span>
            </Link>
            
            <div className="nav-links">
                {user ? (
                    <>
                        <Link to="/compiler" className="nav-link">Compiler</Link>
                        <Link to="/my-programs" className="nav-link">My Programs</Link>
                        <div className="nav-link" style={{ cursor: 'default' }}>
                            <UserIcon size={18} />
                            {user.name}
                        </div>
                        <button onClick={handleLogout} className="btn btn-danger">
                            <LogOut size={16} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-secondary">Login</Link>
                        <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
