import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Play, Save, SquareTerminal, Square } from 'lucide-react';
import SaveCodeModal from '../components/SaveCodeModal';
import AIAssistant from '../components/AIAssistant';
import { io } from 'socket.io-client';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
const API_URL = isLocal
    ? 'http://localhost:5000'
    : 'https://codespace-1-g2fn.onrender.com';

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

const Compiler = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('programId');

    const [language, setLanguage] = useState('java');
    const [code, setCode] = useState(LANGUAGE_TEMPLATES.java);
    const [output, setOutput] = useState('Run your code to see the output here...');
    const [terminalInput, setTerminalInput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [programName, setProgramName] = useState('');
    const [isError, setIsError] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    const terminalInputRef = useRef(null);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification({ type: '', message: '' }), 3000);
    };

    useEffect(() => {
        if (programId) {
            fetchProgram(programId);
        }
    }, [programId]);

    useEffect(() => {
        socket.on('output', (data) => {
            setOutput(prev => prev + data);
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
    }, []);

    const consoleContainerRef = useRef(null);

    useEffect(() => {
        if (consoleContainerRef.current) {
            consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
    }, [output, terminalInput]);

    const fetchProgram = async (id) => {
        try {
            const res = await axios.get(`https://codespace-1-g2fn.onrender.com/api/programs/${id}`, { withCredentials: true });
            const data = res.data.program || res.data;
            setProgramName(data.program_name);
            setLanguage(data.language);
            setCode(data.code);
            setOutput(data.output || 'No previous output');
        } catch (err) {
            console.error('Failed to fetch program');
            setIsError(true);
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        if (!programId) {
            setCode(LANGUAGE_TEMPLATES[newLang]);
        }
    };

    const handleRun = () => {
        if (isRunning) return;
        setIsRunning(true);
        setOutput('');
        setTerminalInput('');
        setIsError(false);
        socket.emit('execute', { language, code });
    };

    const handleStop = () => {
        if (!isRunning) return;
        socket.emit('stop');
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
                await axios.put(`https://codespace-1-g2fn.onrender.com/api/programs/${programId}`, payload, { withCredentials: true });
                setProgramName(name);
                showNotification('success', 'Program updated successfully!');
            } else {
                const res = await axios.post('https://codespace-1-g2fn.onrender.com/api/programs', payload, { withCredentials: true });
                setProgramName(name);
                showNotification('success', 'Program saved successfully!');
            }
        } catch (error) {
            showNotification('error', 'Failed to save program');
            throw error;
        }
    };

    return (
        <div className="compiler-workspace">
            {notification.message && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: notification.type === 'success' ? '#059669' : '#dc2626',
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {notification.message}
                </div>
            )}
            <div className="editor-pane">
                <div className="editor-header">
                    <div className="editor-controls">
                        <select
                            className="select-modern"
                            value={language}
                            onChange={handleLanguageChange}
                        >
                            <option value="c">C</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                            <option value="rust">Rust</option>
                            <option value="zig">Zig</option>
                        </select>
                        <select className="select-modern">
                            <option>Latest Version</option>
                        </select>
                    </div>
                    <div className="editor-controls">
                        {isRunning ? (
                            <button className="btn btn-danger" onClick={handleStop} style={{ backgroundColor: '#dc2626', color: 'white' }}>
                                <Square size={16} /> Stop
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={handleRun}>
                                <Play size={16} /> Run
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => setIsSaveModalOpen(true)}>
                            <Save size={16} /> Save Code
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, backgroundColor: '#1e1e1e' }}>
                    <Editor
                        height="100%"
                        language={EDITOR_LANGUAGES[language]}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val)}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            padding: { top: 16 }
                        }}
                    />
                </div>
                <AIAssistant 
                    language={language}
                    code={code}
                    input={''}
                    output={output}
                    isError={isError}
                />
            </div>

            <div className="output-pane">
                <div className="pane-header">
                    <SquareTerminal size={14} /> INTERACTIVE CONSOLE
                </div>
                <div 
                    ref={consoleContainerRef}
                    className={`console-output ${isError ? 'error' : ''}`} 
                    style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', cursor: isRunning ? 'text' : 'default' }}
                    onClick={handleTerminalClick}
                >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: "'Consolas', 'Monaco', monospace" }}>{output}</pre>
                    {isRunning && (
                        <div style={{ display: 'flex', marginTop: output.endsWith('\n') || output === '' ? '0' : '0' }}>
                            <input 
                                ref={terminalInputRef}
                                value={terminalInput}
                                onChange={e => setTerminalInput(e.target.value)}
                                onKeyDown={handleTerminalKeyDown}
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'inherit', 
                                    outline: 'none', 
                                    flex: 1, 
                                    fontFamily: "'Consolas', 'Monaco', monospace",
                                    fontSize: '0.9rem',
                                    padding: 0,
                                    margin: 0
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

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
