import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { X, Play, Edit, Save, XCircle } from 'lucide-react';

const LANGUAGE_TEMPLATES = {
    JAVASCRIPT: 'javascript',
    PYTHON: 'python',
    JAVA: 'java',
    C: 'c',
    CPP: 'cpp',
    RUST: 'rust',
    ZIG: 'zig'
};

const ProgramModal = ({ program, onClose, onEdit, onUpdate }) => {
    const [localCode, setLocalCode] = useState(program.code);
    const [localOutput, setLocalOutput] = useState(program.output || '');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isError, setIsError] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 3000);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setIsError(false);
        setLocalOutput('Running...');
        try {
            const res = await axios.post('https://codespace-fb40.onrender.com/api/execute', {
                language: program.language,
                code: localCode,
                input: ''
            });
            setLocalOutput(res.data.output);
        } catch (error) {
            setIsError(true);
            setLocalOutput(error.response?.data?.error || 'Execution failed');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`https://codespace-fb40.onrender.com/api/programs/${program.id}`, {
                program_name: program.program_name,
                code: localCode,
                output: localOutput
            });

            if (onUpdate) onUpdate();
            showNotification('success', 'Code saved successfully!');
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Failed to save code');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get monaco language string
    const getMonacoLanguage = (lang) => {
        const langMap = {
            'JAVASCRIPT': 'javascript',
            'PYTHON': 'python',
            'JAVA': 'java',
            'C': 'c',
            'CPP': 'cpp',
            'RUST': 'rust',
            'ZIG': 'c' // fallback
        };
        return langMap[lang?.toUpperCase()] || 'plaintext';
    };

    return (
        <div className="program-modal-overlay" onClick={onClose}>
            <div className="program-modal-content" onClick={e => e.stopPropagation()}>
                <div className="program-modal-header">
                    <div style={{ flex: 1 }}>
                        <h2 className="program-modal-title">{program.program_name}</h2>
                        <div className="program-modal-meta">
                            <span className="lang-badge">{program.language}</span>
                            <span className="date-text">Saved {formatDate(program.created_at)}</span>
                        </div>
                    </div>

                    {notification.message && (
                        <div style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            backgroundColor: notification.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: notification.type === 'success' ? '#4ade80' : '#f87171',
                            marginRight: '1rem',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            {notification.message}
                        </div>
                    )}

                    <button className="icon-btn close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="program-modal-body">
                    <div className="program-modal-editor-container">
                        <Editor
                            height="100%"
                            language={getMonacoLanguage(program.language)}
                            theme="vs-dark"
                            value={localCode}
                            onChange={(val) => setLocalCode(val)}
                            options={{
                                readOnly: false,
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                padding: { top: 10 }
                            }}
                        />
                    </div>

                    <div className="program-modal-output-section">
                        <div className="output-header">Output</div>
                        <div className={`output-content ${isError ? 'error' : ''}`}>
                            {localOutput || 'No output available.'}
                        </div>
                    </div>
                </div>

                <div className="program-modal-footer">
                    <button className="btn btn-secondary" onClick={() => onEdit(program.id)}>
                        <Edit size={16} /> Open in Workspace
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || isRunning}>
                        <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-success" onClick={handleRun} disabled={isRunning || isSaving}>
                        {isRunning ? 'Running...' : <><Play size={16} /> Run</>}
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProgramModal;
