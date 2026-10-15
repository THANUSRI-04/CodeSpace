import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Eye, EyeOff, Save, Trash2, X } from 'lucide-react';

const GeminiKeyModal = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [savedKey, setSavedKey] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setSavedKey(storedKey);
            setApiKey(storedKey);
        }
    }, [isOpen]);

    const handleSave = () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            setStatusMessage({ type: 'error', text: 'API Key cannot be empty.' });
            return;
        }
        localStorage.setItem('gemini_api_key', trimmedKey);
        setSavedKey(trimmedKey);
        setStatusMessage({ type: 'success', text: 'API Key saved successfully!' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    };

    const handleRemove = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setSavedKey('');
        setStatusMessage({ type: 'success', text: 'API Key removed.' });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content gemini-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Key className="ai-icon-gradient" size={20} />
                        <h3 style={{ margin: 0 }}>Google Gemini API Key</h3>
                    </div>
                    <button onClick={onClose} className="icon-btn" aria-label="Close modal"><X size={20} /></button>
                </div>
                
                <div className="modal-body">
                    <p className="gemini-desc-text">
                        CodeSpace AI uses Google's Gemini API to power its intelligent coding assistant. 
                        To use these features, please provide your own Gemini API key. 
                        Your key is stored securely in your browser and is never sent to our servers.
                    </p>

                    <div className="api-key-box">
                        <div className="api-key-box-header">
                            <label style={{ fontWeight: '500' }}>Your API Key</label>
                            {savedKey && (
                                <span className="status-badge success connected-badge">
                                    <span className="status-dot"></span> Connected
                                </span>
                            )}
                        </div>
                        
                        <div className="input-group-icon">
                            <input
                                type={isKeyVisible ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste your Gemini API key here..."
                                className="input-modern"
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button 
                                className="icon-inside-input" 
                                onClick={() => setIsKeyVisible(!isKeyVisible)}
                                title={isKeyVisible ? "Hide Key" : "Show Key"}
                                aria-label={isKeyVisible ? "Hide Key" : "Show Key"}
                            >
                                {isKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {statusMessage.text && (
                        <div className={`status-message ${statusMessage.type}`} style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                            {statusMessage.text}
                        </div>
                    )}

                    <div className="gemini-modal-footer">
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="link-with-icon"
                        >
                            <span>Get key from Google AI Studio</span>
                            <ExternalLink size={14} />
                        </a>
                        
                        <div className="gemini-footer-actions">
                            {savedKey && (
                                <button onClick={handleRemove} className="btn btn-secondary">
                                    <Trash2 size={15} /> <span>Remove</span>
                                </button>
                            )}
                            <button onClick={handleSave} className="btn ai-btn-primary">
                                <Save size={15} /> <span>Save Key</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeminiKeyModal;
