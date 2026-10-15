import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Code2, LogOut, User as UserIcon, Settings, Menu, X, Terminal, Folder } from 'lucide-react';
import GeminiKeyModal from './GeminiKeyModal';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        logout();
        navigate('/login');
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleCompilerClick = () => {
        closeMobileMenu();
        window.dispatchEvent(new CustomEvent('codespace:switch-tab', { detail: 'editor' }));
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            <header className="navbar-wrapper">
                <nav className="navbar" aria-label="Main Navigation">
                    <Link to="/" className="nav-brand" onClick={handleCompilerClick}>
                        <div className="brand-logo-container">
                            <Code2 size={22} className="brand-icon" />
                        </div>
                        <span className="brand-title">Code<span className="brand-accent">Space</span></span>
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <div className="nav-links desktop-only">
                        <button 
                            className="btn ai-btn-special" 
                            onClick={() => setIsKeyModalOpen(true)}
                            title="Configure Google Gemini AI Key"
                        >
                            <Settings size={15} /> 
                            <span>AI Settings</span>
                        </button>

                        {user ? (
                            <>
                                <Link 
                                    to={location.pathname === '/compiler' ? `${location.pathname}${location.search}` : '/compiler'} 
                                    className={`nav-link ${isActive('/compiler') ? 'active' : ''}`}
                                    onClick={handleCompilerClick}
                                >
                                    <Terminal size={16} />
                                    <span>Compiler</span>
                                </Link>
                                <Link 
                                    to="/my-programs" 
                                    className={`nav-link ${isActive('/my-programs') ? 'active' : ''}`}
                                >
                                    <Folder size={16} />
                                    <span>My Programs</span>
                                </Link>
                                <div className="user-profile-badge" title={user.name || user.email}>
                                    <div className="avatar-circle">
                                        <UserIcon size={14} />
                                    </div>
                                    <span className="user-name">{user.name || 'User'}</span>
                                </div>
                                <button onClick={handleLogout} className="btn btn-logout" title="Sign out of Code Space">
                                    <LogOut size={15} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary">Login</Link>
                                <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger Toggle Button */}
                    <button 
                        className="mobile-menu-toggle mobile-only" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMobileMenuOpen}
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </nav>

                {/* Mobile Drawer Menu */}
                {isMobileMenuOpen && (
                    <div className="mobile-nav-backdrop" onClick={closeMobileMenu}>
                        <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
                            <div className="mobile-nav-header">
                                <div className="nav-brand">
                                    <Code2 size={20} className="brand-icon" />
                                    <span>Code<span className="brand-accent">Space</span></span>
                                </div>
                                <button className="icon-btn" onClick={closeMobileMenu} aria-label="Close menu">
                                    <X size={20} />
                                </button>
                            </div>

                            {user && (
                                <div className="mobile-user-card">
                                    <div className="avatar-circle">
                                        <UserIcon size={16} />
                                    </div>
                                    <div className="mobile-user-info">
                                        <div className="user-name-bold">{user.name || 'User'}</div>
                                        {user.email && <div className="user-email-muted">{user.email}</div>}
                                    </div>
                                </div>
                            )}

                            <div className="mobile-nav-links">
                                <button 
                                    className="mobile-nav-item ai-btn-mobile" 
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsKeyModalOpen(true);
                                    }}
                                >
                                    <Settings size={18} />
                                    <span>AI Settings</span>
                                </button>

                                {user ? (
                                    <>
                                        <Link 
                                            to={location.pathname === '/compiler' ? `${location.pathname}${location.search}` : '/compiler'} 
                                            className={`mobile-nav-item ${isActive('/compiler') ? 'active' : ''}`}
                                            onClick={handleCompilerClick}
                                        >
                                            <Terminal size={18} />
                                            <span>Compiler</span>
                                        </Link>
                                        <Link 
                                            to="/my-programs" 
                                            className={`mobile-nav-item ${isActive('/my-programs') ? 'active' : ''}`}
                                            onClick={closeMobileMenu}
                                        >
                                            <Folder size={18} />
                                            <span>My Programs</span>
                                        </Link>
                                        <div className="mobile-nav-divider" />
                                        <button onClick={handleLogout} className="mobile-nav-item logout-item">
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            to="/login" 
                                            className="mobile-nav-item"
                                            onClick={closeMobileMenu}
                                        >
                                            Login
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className="mobile-nav-item primary-mobile-item"
                                            onClick={closeMobileMenu}
                                        >
                                            Sign Up
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <GeminiKeyModal 
                isOpen={isKeyModalOpen} 
                onClose={() => setIsKeyModalOpen(false)} 
            />
        </>
    );
};

export default Navbar;
