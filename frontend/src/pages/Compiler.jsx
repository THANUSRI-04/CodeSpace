import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Play, Save, Terminal, SquareTerminal, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';
import SaveCodeModal from '../components/SaveCodeModal';

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
    zig: 'text' // Zig not officially supported by monaco out of the box, text fallback
};

const Compiler = () => {
    const [searchParams] = useSearchParams();
    const programId = searchParams.get('programId');

    const [language, setLanguage] = useState('java');
    const [code, setCode] = useState(LANGUAGE_TEMPLATES.java);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('Run your code to see the output here...');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [programName, setProgramName] = useState('');
    const [isError, setIsError] = useState(false);
    const [stdinState, setStdinState] = useState('normal'); // 'normal', 'minimized', 'maximized'
    const [stdinHeight, setStdinHeight] = useState(150);
    const [isDragging, setIsDragging] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

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
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 40 && newHeight < window.innerHeight * 0.8) {
                setStdinHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('dragging-active');
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('dragging-active');
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('dragging-active');
        };
    }, [isDragging]);

    const fetchProgram = async (id) => {
        try {
            const res = await axios.get(`https://codespace-fb40.onrender.com/api/programs/${id}`, { withCredentials: true });
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
        // Only set template if we are not editing an existing loaded program's language
        if (!programId) {
            setCode(LANGUAGE_TEMPLATES[newLang]);
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('Executing code...\n\n');
        setIsError(false);
        try {
            const res = await axios.post('https://codespace-fb40.onrender.com/api/execute', {
                language,
                code,
                input
            });
            setIsError(!res.data.success);
            setOutput((res.data.success ? 'Program executed successfully.\n\n' : '') + res.data.output);
        } catch (err) {
            setIsError(true);
            setOutput(err.response?.data?.output || 'Execution failed due to network error.');
        } finally {
            setIsRunning(false);
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
                await axios.put(`https://codespace-fb40.onrender.com/api/programs/${programId}`, payload, { withCredentials: true });
                setProgramName(name);
                showNotification('success', 'Program updated successfully!');
            } else {
                const res = await axios.post('https://codespace-fb40.onrender.com/api/programs', payload, { withCredentials: true });
                setProgramName(name);
                showNotification('success', 'Program saved successfully!');
            }
        } catch (error) {
            showNotification('error', 'Failed to save program');
            throw error;
        }
    };

    const toggleStdin = () => {
        setStdinState(prev => prev === 'minimized' ? 'normal' : 'minimized');
    };

    const maximizeStdin = () => {
        setStdinState(prev => prev === 'maximized' ? 'normal' : 'maximized');
    };

    const handleMouseDown = (e) => {
        e.preventDefault(); // prevent text selection while dragging
        setIsDragging(true);
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
                        <button className="btn btn-success" onClick={handleRun} disabled={isRunning}>
                            <Play size={16} /> {isRunning ? 'Running...' : 'Run'}
                        </button>
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
            </div>

            <div className="output-pane">
                <div className="pane-header">
                    <SquareTerminal size={14} /> CONSOLE OUTPUT
                </div>
                <div className={`console-output ${isError ? 'error' : ''}`} style={{ display: stdinState === 'maximized' ? 'none' : 'block' }}>
                    {output}
                </div>

                {stdinState === 'normal' && (
                    <div
                        className={`resizer-horizontal ${isDragging ? 'dragging' : ''}`}
                        onMouseDown={handleMouseDown}
                    ></div>
                )}

                <div
                    className={`stdin-area ${stdinState}`}
                    style={stdinState === 'normal' ? { height: `${stdinHeight}px` } : {}}
                >
                    <div className="pane-header" style={{ borderTop: 'none', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Terminal size={14} /> STANDARD INPUT (STDIN)
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="icon-btn" onClick={toggleStdin} title={stdinState === 'minimized' ? 'Restore' : 'Minimize'}>
                                {stdinState === 'minimized' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button className="icon-btn" onClick={maximizeStdin} title={stdinState === 'maximized' ? 'Restore' : 'Maximize'}>
                                {stdinState === 'maximized' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                        </div>
                    </div>
                    {stdinState !== 'minimized' && (
                        <textarea
                            className="stdin-textarea"
                            placeholder="Enter custom input here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        ></textarea>
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
