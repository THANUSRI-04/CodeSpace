import React, { useState } from 'react';
import { MessageCircle, Mail, X } from 'lucide-react';

const HelpButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 1000 }}>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 1rem)',
                    left: '0',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    boxShadow: 'var(--shadow-lg)',
                    width: '300px',
                    animation: 'slideUp 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Need Help?</h4>
                        <button onClick={() => setIsOpen(false)} className="icon-btn" style={{ padding: '0.25rem' }}>
                            <X size={16} />
                        </button>
                    </div>
                    <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <span>Facing any queries? let us know at</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} />
                            <a href="mailto:thanusrimareboina@gmail.com" style={{ color: 'var(--accent-primary)' }}>thanusrimareboina@gmail.com</a>
                        </div>
                    </div>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'transform 0.2s ease, background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <MessageCircle size={24} />
            </button>
        </div>
    );
};

export default HelpButton;
