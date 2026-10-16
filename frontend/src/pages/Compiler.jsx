import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
    Play, 
    Save, 
    SquareTerminal, 
    Square, 
    PanelRightClose, 
    PanelRightOpen, 
    Trash2, 
    FileCode, 
    GripVertical,
    CheckCircle2,
    Code
} from 'lucide-react';
import SaveCodeModal from '../components/SaveCodeModal';
import AIAssistant from '../components/AIAssistant';
import { io } from 'socket.io-client';
import { api, API_URL } from '../config';

const socket = io(API_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling']
});

const LANGUAGE_TEMPLATES = {
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
    python: 'print("Hello World")',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World";\n    return 0;\n}',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}',
    javascript: 'console.log("Hello World");',
    rust: 'fn main() {\n    println!("Hello World");\n}',
    zig: 'const std = @import("std");\n\npub fn main() !void {\n    std.debug.print("Hello World\\n", .{});\n}'
};

const EDITOR_LANGUAGES = {
    java: 'java',
    python: 'python',
    cpp: 'cpp',
    c: 'c',
    javascript: 'javascript',
    rust: 'rust',
    zig: 'text' 
};

const LANGUAGE_FILENAMES = {
    java: 'Main.java',
    python: 'main.py',
    cpp: 'main.cpp',
    c: 'main.c',
    javascript: 'main.js',
    rust: 'main.rs',
    zig: 'main.zig'
};

const Compiler = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const programId = searchParams.get('programId');

    const getInitialLanguage = () => {
        try {
            const saved = localStorage.getItem('codespace_current_language');
            if (saved && LANGUAGE_TEMPLATES[saved]) {
                return saved;
            }
        } catch {}
        return 'java';
    };

    const getInitialCode = (lang) => {
        try {
            const draft = localStorage.getItem(`codespace_draft_${lang}`);
            if (draft !== null && draft.trim() !== '') {
                return draft;
            }
        } catch {}
        return LANGUAGE_TEMPLATES[lang] || '';
    };

    const [language, setLanguage] = useState(getInitialLanguage);
    const [code, setCode] = useState(() => getInitialCode(getInitialLanguage()));
    const [output, setOutput] = useState('Run your code to see the output here...');
    const [terminalInput, setTerminalInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [programName, setProgramName] = useState('');
    const [isError, setIsError] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    // Responsive and Split Panel States
    const [editorWidthPercent, setEditorWidthPercent] = useState(58);
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [activeMobileTab, setActiveMobileTab] = useState('editor'); // 'editor' | 'output'
    const [hasUnreadOutput, setHasUnreadOutput] = useState(false);

    const workspaceRef = useRef(null);
    const terminalInputRef = useRef(null);
    const consoleContainerRef = useRef(null);
    const editorInstanceRef = useRef(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 3000);
    };

    // Track window resize for responsive mode
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile && isOutputCollapsed && activeMobileTab === 'output') {
                setIsOutputCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOutputCollapsed, activeMobileTab]);

    // Ensure Monaco layout refreshes when editor becomes active
    useEffect(() => {
        if (activeMobileTab === 'editor' && editorInstanceRef.current) {
            requestAnimationFrame(() => {
                editorInstanceRef.current?.layout();
            });
            const timer = setTimeout(() => {
                editorInstanceRef.current?.layout();
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [activeMobileTab]);

    // Listen for tab switch events from Navbar or external clicks
    useEffect(() => {
        const handleSwitchTab = (e) => {
            const targetTab = e.detail || 'editor';
            setActiveMobileTab(targetTab);
            if (targetTab === 'editor' && editorInstanceRef.current) {
                requestAnimationFrame(() => {
                    editorInstanceRef.current?.layout();
                });
                setTimeout(() => {
                    editorInstanceRef.current?.layout();
                }, 80);
            }
        };

        window.addEventListener('codespace:switch-tab', handleSwitchTab);
        return () => window.removeEventListener('codespace:switch-tab', handleSwitchTab);
    }, []);

    // Also switch back to editor whenever route /compiler is visited
    useEffect(() => {
        if (location.pathname === '/compiler') {
            setActiveMobileTab('editor');
            if (editorInstanceRef.current) {
                requestAnimationFrame(() => {
                    editorInstanceRef.current?.layout();
                });
            }
        }
    }, [location.pathname, location.key]);

    // Splitter Drag Handlers
    const handleSplitterStart = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e) => {
            if (!workspaceRef.current) return;
            const rect = workspaceRef.current.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const offset = clientX - rect.left;
            const newPercentage = (offset / rect.width) * 100;

            // Clamping between 22% and 78% for clean ergonomics
            if (newPercentage >= 22 && newPercentage <= 78) {
                setEditorWidthPercent(newPercentage);
            }
        };

        const handleStop = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleStop);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleStop);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleStop);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleStop);
        };
    }, [isDragging]);

    useEffect(() => {
        if (programId) {
            fetchProgram(programId);
        }
    }, [programId]);

    useEffect(() => {
        socket.on('output', (data) => {
            setOutput(prev => prev + data);
            if (isMobile && activeMobileTab === 'editor') {
                setHasUnreadOutput(true);
            }
        });
        
        socket.on('finished', (data) => {
            setIsRunning(false);
            if (data && data.output) {
                setOutput(prev => prev + data.output);
            }
        });

        return () => {
            socket.off('output');
            socket.off('finished');
        };
    }, [isMobile, activeMobileTab]);

    useEffect(() => {
        if (consoleContainerRef.current) {
            consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
    }, [output, terminalInput]);

    const fetchProgram = async (id) => {
        try {
            const res = await api.get(`/api/programs/${id}`);
            const data = res.data.program || res.data;
            setProgramName(data.program_name);
            setLanguage(data.language);
            setCode(data.code);
            setOutput(data.output || 'No previous output');
        } catch (err) {
            console.error('Failed to fetch program', err);
            setIsError(true);
        }
    };

    const handleCodeChange = (newVal) => {
        if (typeof newVal === 'string') {
            setCode(newVal);
            if (!programId) {
                try {
                    localStorage.setItem(`codespace_draft_${language}`, newVal);
                } catch {}
            }
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        try {
            localStorage.setItem('codespace_current_language', newLang);
        } catch {}
        
        if (!programId) {
            try {
                const savedDraft = localStorage.getItem(`codespace_draft_${newLang}`);
                if (savedDraft !== null && savedDraft.trim() !== '') {
                    setCode(savedDraft);
                    return;
                }
            } catch {}
            setCode(LANGUAGE_TEMPLATES[newLang] || '');
        }
    };

    const handleRun = () => {
        if (isRunning) return;
        setIsRunning(true);
        setOutput('');
        setTerminalInput('');
        setIsError(false);
        setHasUnreadOutput(false);

        // On mobile or if collapsed, reveal output to see execution
        if (isMobile) {
            setActiveMobileTab('output');
        } else if (isOutputCollapsed) {
            setIsOutputCollapsed(false);
        }

        socket.emit('execute', { language, code });
    };

    const handleStop = () => {
        if (!isRunning) return;
        socket.emit('stop');
        setIsRunning(false);
    };

    const handleClearOutput = () => {
        setOutput('');
    };

    const handleTerminalKeyDown = (e) => {
        if (e.key === 'Enter') {
            const inputToSend = terminalInput + '\n';
            socket.emit('input', inputToSend);
            setOutput(prev => prev + inputToSend);
            setTerminalInput('');
        }
    };

    const handleTerminalClick = () => {
        if (isRunning && terminalInputRef.current) {
            terminalInputRef.current.focus();
        }
    };

    const handleSave = async (name, isUpdate = false, folderId = null) => {
        const payload = {
            program_name: name,
            language,
            code,
            output,
            folder_id: folderId
        };

        try {
            if (isUpdate && programId) {
                await api.put(`/api/programs/${programId}`, payload);
                setProgramName(name);
                showNotification('success', 'Program updated successfully!');
            } else {
                await api.post('/api/programs', payload);
                setProgramName(name);
                showNotification('success', 'Program saved successfully!');
            }
        } catch (error) {
            showNotification('error', 'Failed to save program');
            throw error;
        }
    };

    const fileName = programName ? `${programName}.${language === 'javascript' ? 'js' : language === 'python' ? 'py' : language}` : LANGUAGE_FILENAMES[language] || 'Main';

    return (
        <div className={`compiler-workspace ${isDragging ? 'is-resizing' : ''}`} ref={workspaceRef}>
            {/* Toast Notification */}
            {notification.message && (
                <div className={`toast-notification ${notification.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    <CheckCircle2 size={16} />
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Editor Pane */}
            <div 
                className={`editor-pane ${isMobile && activeMobileTab !== 'editor' ? 'pane-hidden-mobile' : ''}`}
                style={!isMobile ? {
                    width: isOutputCollapsed ? '100%' : `${editorWidthPercent}%`,
                    flex: isOutputCollapsed ? '1 1 100%' : `0 0 ${editorWidthPercent}%`
                } : undefined}
            >
                {/* Editor Header / Tabs Bar */}
                <div className="editor-header">
                    <div className="editor-header-left">
                        {/* File Tab */}
                        <div className="editor-file-tab active" title={fileName}>
                            <FileCode size={14} className="tab-icon" />
                            <span className="tab-name">{fileName}</span>
                        </div>

                        {/* Language Selectors */}
                        <div className="editor-selectors">
                            <select
                                className="select-modern lang-select"
                                value={language}
                                onChange={handleLanguageChange}
                                aria-label="Select Programming Language"
                            >
                                <option value="c">C</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="rust">Rust</option>
                                <option value="zig">Zig</option>
                            </select>
                            <select className="select-modern version-select" aria-label="Compiler Version">
                                <option>Latest</option>
                            </select>
                        </div>
                    </div>

                    {/* Editor Action Controls */}
                    <div className="editor-header-right">
                        {/* Mobile Segmented Tab Switcher */}
                        {isMobile && (
                            <div className="mobile-view-tabs" role="tablist">
                                <button
                                    role="tab"
                                    aria-selected={activeMobileTab === 'editor'}
                                    className={`mobile-tab-btn ${activeMobileTab === 'editor' ? 'active' : ''}`}
                                    onClick={() => setActiveMobileTab('editor')}
                                >
                                    <Code size={14} />
                                    <span>Code</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeMobileTab === 'output'}
                                    className={`mobile-tab-btn ${activeMobileTab === 'output' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveMobileTab('output');
                                        setHasUnreadOutput(false);
                                    }}
                                >
                                    <SquareTerminal size={14} />
                                    <span>Output</span>
                                    {hasUnreadOutput && <span className="tab-unread-dot" />}
                                </button>
                            </div>
                        )}

                        {/* Run & Save Buttons */}
                        <div className="action-buttons-group">
                            {isRunning ? (
                                <button className="btn btn-danger btn-run" onClick={handleStop} title="Stop execution">
                                    <Square size={15} />
                                    <span className="btn-text">Stop</span>
                                </button>
                            ) : (
                                <button className="btn btn-success btn-run" onClick={handleRun} title="Run code (Ctrl + Enter)">
                                    <Play size={15} />
                                    <span className="btn-text">Run</span>
                                </button>
                            )}

                            <button className="btn btn-primary btn-save" onClick={() => setIsSaveModalOpen(true)} title="Save program">
                                <Save size={15} />
                                <span className="btn-text">Save</span>
                            </button>

                            {/* Reopen Console Button on Desktop when collapsed */}
                            {!isMobile && isOutputCollapsed && (
                                <button 
                                    className="btn btn-secondary btn-icon-only" 
                                    onClick={() => setIsOutputCollapsed(false)} 
                                    title="Show Console Panel"
                                >
                                    <PanelRightOpen size={16} />
                                    <span className="btn-text-desktop">Console</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="monaco-wrapper">
                    <Editor
                        height="100%"
                        width="100%"
                        language={EDITOR_LANGUAGES[language]}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => {
                            if (typeof val === 'string') {
                                handleCodeChange(val);
                            }
                        }}
                        onMount={(editor) => {
                            editorInstanceRef.current = editor;
                            requestAnimationFrame(() => editor.layout());
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: isMobile ? 13 : 14,
                            wordWrap: 'on',
                            padding: { top: 12, bottom: 12 },
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineNumbersMinChars: 3,
                            renderLineHighlight: 'all',
                            fontFamily: "'Fira Code', 'Consolas', monospace",
                            tabSize: 4,
                            smoothScrolling: true
                        }}
                    />
                </div>

                {/* AI Assistant Tool */}
                <AIAssistant 
                    language={language}
                    code={code}
                    input={''}
                    output={output}
                    isError={isError}
                />
            </div>

            {/* Draggable Divider (Desktop/Tablet) */}
            {!isMobile && !isOutputCollapsed && (
                <div 
                    className={`workspace-splitter ${isDragging ? 'is-dragging' : ''}`}
                    onMouseDown={handleSplitterStart}
                    onTouchStart={handleSplitterStart}
                    title="Drag to resize panels"
                    role="separator"
                    aria-orientation="vertical"
                >
                    <div className="splitter-handle">
                        <GripVertical size={12} />
                    </div>
                </div>
            )}

            {/* Output / Interactive Console Pane */}
            <div 
                className={`output-pane ${isOutputCollapsed && !isMobile ? 'pane-collapsed' : ''} ${isMobile && activeMobileTab !== 'output' ? 'pane-hidden-mobile' : ''}`}
                style={!isMobile ? {
                    width: isOutputCollapsed ? '0px' : `${100 - editorWidthPercent}%`,
                    flex: isOutputCollapsed ? '0 0 0px' : `0 0 ${100 - editorWidthPercent}%`,
                    display: isOutputCollapsed ? 'none' : 'flex'
                } : undefined}
            >
                {/* Console Header & Tabs */}
                <div className="pane-header">
                    <div className="pane-header-left">
                        {isMobile ? (
                            <div className="mobile-view-tabs" role="tablist">
                                <button
                                    role="tab"
                                    aria-selected={activeMobileTab === 'editor'}
                                    className={`mobile-tab-btn ${activeMobileTab === 'editor' ? 'active' : ''}`}
                                    onClick={() => setActiveMobileTab('editor')}
                                >
                                    <Code size={14} />
                                    <span>Code</span>
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeMobileTab === 'output'}
                                    className={`mobile-tab-btn ${activeMobileTab === 'output' ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveMobileTab('output');
                                        setHasUnreadOutput(false);
                                    }}
                                >
                                    <SquareTerminal size={14} />
                                    <span>Output</span>
                                    {hasUnreadOutput && <span className="tab-unread-dot" />}
                                </button>
                            </div>
                        ) : (
                            <div className="output-tab active">
                                <SquareTerminal size={14} className="tab-icon" />
                                <span>Interactive Console</span>
                            </div>
                        )}
                        <span className={`status-pill ${isRunning ? 'status-running' : 'status-ready'}`}>
                            <span className="status-dot-inner" />
                            {isRunning ? 'Running...' : 'Ready'}
                        </span>
                    </div>

                    <div className="pane-header-actions">
                        {isMobile && (
                            <button 
                                className="btn btn-secondary btn-back-code" 
                                onClick={() => setActiveMobileTab('editor')}
                                title="Back to Code Editor"
                            >
                                <Code size={14} />
                                <span>Code</span>
                            </button>
                        )}

                        <button 
                            className="icon-btn-compact" 
                            onClick={handleClearOutput} 
                            title="Clear Console Output"
                            aria-label="Clear Console Output"
                        >
                            <Trash2 size={14} />
                            <span className="icon-btn-label">Clear</span>
                        </button>

                        {!isMobile && (
                            <button 
                                className="icon-btn-compact" 
                                onClick={() => setIsOutputCollapsed(true)} 
                                title="Collapse Console Panel"
                                aria-label="Collapse Console Panel"
                            >
                                <PanelRightClose size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Console Output Area */}
                <div 
                    ref={consoleContainerRef}
                    className={`console-output ${isError ? 'error' : ''}`} 
                    onClick={handleTerminalClick}
                >
                    <pre className="console-pre-text">{output || 'No output to display.'}</pre>

                    {/* Interactive Input Prompt */}
                    {isRunning && (
                        <div className="terminal-input-row">
                            <span className="terminal-prompt-caret">&gt;</span>
                            <input 
                                ref={terminalInputRef}
                                value={terminalInput}
                                onChange={e => setTerminalInput(e.target.value)}
                                onKeyDown={handleTerminalKeyDown}
                                className="terminal-live-input"
                                placeholder="Type input here and press Enter..."
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Save Code Modal */}
            <SaveCodeModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSave}
                defaultName={programName}
                language={language.toUpperCase()}
                isEditMode={!!programId}
            />
        </div>
    );
};

export default Compiler;
