import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email.endsWith('@gmail.com')) {
            setError('Please enter a valid Gmail address ending with @gmail.com.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
        } catch (err) {
            const msg = err.response?.data?.message || 
                (err.code === 'ECONNABORTED' 
                    ? 'Server took too long to respond. The cloud server may still be waking up — please try again.' 
                    : 'Failed to login. Please check credentials or try again.');
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Log in to your Code Space account</p>
                {error && <div className="form-error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="loginEmail">Email Address</label>
                        <input
                            id="loginEmail"
                            type="email"
                            className="form-control"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder='example@gmail.com'
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="loginPassword">Password</label>
                        <input
                            id="loginPassword"
                            type="password"
                            className="form-control"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder='Enter your password'
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Connecting & Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
