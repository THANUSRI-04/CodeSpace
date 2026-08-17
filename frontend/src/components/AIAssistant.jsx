import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, MessageSquare, Send, Bot, User, Code2, AlertCircle, Lightbulb, Zap, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AIAssistant = ({ language, code, input, output, isError }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am CodeSpace AI. How can I help you with your code today?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (e.target.closest('button')) return; // Don't drag if clicking close button
        isDragging.current = true;
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current) return;
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        if (isOpen) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (promptText = userInput, mode = 'normal') => {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'To use CodeSpace AI, please add your Gemini API key first using the button in the top navigation bar.' }]);
            return;
        }

        if (!promptText.trim()) return;

        const newMessages = [...messages];
        if (mode === 'normal') {
            newMessages.push({ role: 'user', content: promptText });
        } else {
            newMessages.push({ role: 'user', content: `[Action: ${promptText}]` });
        }
        
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        const systemContext = `
You are CodeSpace AI, an intelligent coding mentor.
Current Language: ${language}
Current Code:
\`\`\`${language}
${code}
\`\`\`
Standard Input: ${input || 'None'}
Console Output:
\`\`\`
${output || 'None'}
\`\`\`
Has Error: ${isError ? 'Yes' : 'No'}

Instructions for modes:
- Debug: Identify bug, explain why and where, how to fix, provide corrected code snippet, provide test case.
- Explain: Explain overall approach, important variables/loops, step-by-step execution, time/space complexity.
- Complexity: Provide O() time and space, explain why, suggest better if possible.
- Edge Cases: Identify edge cases, explain if current code handles them.
- Hint: Give ONE progressive hint without revealing the full solution.

General rules:
- Be a mentor, not just a code generator.
- Explain concepts clearly and simply.
- Point out mistakes respectfully.
- Preserve user's approach if possible.
- If code is correct, explicitly say so.
- Format using Markdown.
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemContext }]
                    },
                    contents: [{
                        role: "user",
                        parts: [{ text: promptText }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                let errorMsg = 'An error occurred while communicating with the AI.';
                if (data.error && data.error.message) {
                    if (data.error.message.includes('API key not valid')) {
                        errorMsg = 'Your Gemini API key appears to be invalid. Please check your key and try again.';
                    } else {
                        errorMsg = `API Error: ${data.error.message}`;
                    }
                }
                setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
                setIsLoading(false);
                return;
            }

            const aiText = data.candidates[0].content.parts[0].text;
            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

        } catch (error) {
            console.error('CodeSpace AI Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network or server error occurred. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const actionModes = [
        { label: 'Debug My Code', icon: <AlertCircle size={14} />, prompt: 'Please debug my code. Identify any bugs, explain why they happen, and show how to fix them.' },
        { label: 'Explain My Code', icon: <HelpCircle size={14} />, prompt: 'Please explain my code step-by-step, including variables and loops.' },
        { label: 'Analyze Complexity', icon: <Zap size={14} />, prompt: 'What is the time and space complexity of my code? Please explain why.' },
        { label: 'Find Edge Cases', icon: <Code2 size={14} />, prompt: 'What are the edge cases for this problem, and does my code handle them?' },
        { label: 'Give Me a Hint', icon: <Lightbulb size={14} />, prompt: 'Give me a progressive hint on how to improve or fix my code without giving away the full solution.' },
    ];

    return (
        <>
            <button 
                className="ai-fab-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Ask CodeSpace AI"
            >
                <Sparkles size={24} />
                <span>Ask CodeSpace AI</span>
            </button>

            {isOpen && (
                <div className="ai-panel" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
                    <div className="ai-panel-header" onMouseDown={handleMouseDown}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles className="ai-icon-gradient" size={20} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>CodeSpace AI</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="icon-btn"><X size={20} /></button>
                    </div>

                    <div className="ai-chat-history">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                <div className="chat-avatar">
                                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="chat-content">
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message assistant">
                                <div className="chat-avatar"><Bot size={16} /></div>
                                <div className="chat-content loading-dots">
                                    CodeSpace AI is thinking<span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-quick-actions">
                        {actionModes.map((action, i) => (
                            <button 
                                key={i} 
                                className="action-chip"
                                onClick={() => handleSendMessage(action.prompt, 'action')}
                                disabled={isLoading}
                            >
                                {action.icon} {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="ai-input-area">
                        <div className="ai-input-wrapper">
                            <input 
                                type="text"
                                placeholder="Ask about your code..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isLoading}
                            />
                            <button 
                                className="send-btn" 
                                onClick={() => handleSendMessage()}
                                disabled={!userInput.trim() || isLoading}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;
