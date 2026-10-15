import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { X, Play, Edit, Save } from 'lucide-react';

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
            const res = await axios.post('https://codespace-1-g2fn.onrender.com/api/execute', {
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
            await axios.put(`https://codespace-1-g2fn.onrender.com/api/programs/${program.id}`, {
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
                    <div className="program-modal-header-info">
                        <h2 className="program-modal-title">{program.program_name}</h2>
                        <div className="program-modal-meta">
                            <span className="lang-badge">{program.language}</span>
                            <span className="date-text">Saved {formatDate(program.created_at)}</span>
                        </div>
                    </div>

                    {notification.message && (
                        <div className={`program-modal-toast ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                            {notification.message}
                        </div>
                    )}

                    <button className="icon-btn close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="program-modal-body">
                    <div className="program-modal-editor-container">
                        <Editor
                            height="100%"
                            width="100%"
                            language={getMonacoLanguage(program.language)}
                            theme="vs-dark"
                            value={localCode}
                            onChange={(val) => setLocalCode(val || '')}
                            options={{
                                readOnly: false,
                                minimap: { enabled: false },
                                fontSize: 13,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                padding: { top: 10, bottom: 10 }
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
                    <button className="btn btn-secondary modal-footer-btn" onClick={() => onEdit(program.id)}>
                        <Edit size={15} /> <span>Open in Workspace</span>
                    </button>
                    <button className="btn btn-primary modal-footer-btn" onClick={handleSave} disabled={isSaving || isRunning}>
                        <Save size={15} /> <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button className="btn btn-success modal-footer-btn" onClick={handleRun} disabled={isRunning || isSaving}>
                        {isRunning ? 'Running...' : <><Play size={15} /> <span>Run</span></>}
                    </button>
                    <button className="btn btn-secondary modal-footer-btn" onClick={onClose}>
                        <span>Close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProgramModal;
