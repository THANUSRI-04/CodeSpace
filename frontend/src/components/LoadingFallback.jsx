import React, { useState, useEffect } from 'react';
import { Code2, Loader2, ArrowRight } from 'lucide-react';

const LoadingFallback = () => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSkip = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '75vh',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            color: '#e2e8f0'
        }}>
            <div style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                <div style={{
                    position: 'absolute',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)',
                    animation: 'pulse 2s infinite'
                }} />
                <Code2 size={44} color="#8b5cf6" style={{ zIndex: 1 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <Loader2 size={18} className="spin-animation" color="#8b5cf6" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                    {seconds > 10 ? 'Waking Up Cloud Server...' : 'Connecting to CodeSpace...'}
                </h2>
            </div>

            <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                maxWidth: '420px',
                lineHeight: 1.5,
                margin: '0 0 1.25rem 0'
            }}>
                {seconds > 10
                    ? 'The Render free-tier server is spinning up from cold sleep (typically takes 30–50s). Your workspace will open automatically as soon as it responds.'
                    : 'Verifying session and preparing your coding environment...'}
            </p>

            <div style={{
                display: 'inline-block',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                marginBottom: '1.5rem'
            }}>
                Elapsed: {seconds}s
            </div>

            {seconds >= 8 && (
                <button
                    onClick={handleSkip}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#94a3b8',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.825rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                >
                    <span>Taking too long? Continue to Login</span>
                    <ArrowRight size={14} />
                </button>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.9); opacity: 0.7; }
                    50% { transform: scale(1.3); opacity: 0.3; }
                    100% { transform: scale(0.9); opacity: 0.7; }
                }
                .spin-animation {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingFallback;
