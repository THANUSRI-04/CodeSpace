import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
    const { signup } = useContext(AuthContext);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
            await signup(formData.name, formData.email, formData.password);
        } catch (err) {
            const msg = err.response?.data?.message || 
                (err.code === 'ECONNABORTED' 
                    ? 'Server took too long to respond. The cloud server may still be waking up — please try again.' 
                    : 'Failed to sign up. Please try again.');
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Code Space to start coding</p>
                {error && <div className="form-error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="signupName">Full Name</label>
                        <input
                            id="signupName"
                            type="text"
                            className="form-control"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder='Enter your Name'
                            autoComplete="name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="signupEmail">Email Address</label>
                        <input
                            id="signupEmail"
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
                        <label htmlFor="signupPassword">Password</label>
                        <input
                            id="signupPassword"
                            type="password"
                            className="form-control"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder='Create Password'
                            autoComplete="new-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Connecting & Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
