import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, Bot, User, History, Plus } from 'lucide-react';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [creatingSession, setCreatingSession] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 🔥 CREATE SESSION
    const createSession = async () => {
        try {
            setCreatingSession(true);
            const res = await fetch('http://localhost:3000/api/ai/session', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                setSessionId(data.session._id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingSession(false);
        }
    };

    // 🔥 SEND MESSAGE (WITH SESSION)
    const sendMessage = async () => {
        if (!input.trim() || !sessionId) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ sessionId, prompt: input })
            });

            const data = await res.json();

            const botMsg = {
                role: 'bot',
                content: data.chat?.response || 'No response'
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Error occurred' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">

            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
                    <p className="text-slate-500">Chat with your intelligent assistant</p>
                </div>

                {!sessionId && (
                    <button
                        onClick={createSession}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow"
                    >
                        <Plus size={16} />
                        {creatingSession ? 'Creating...' : 'Create Session'}
                    </button>
                )}
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                {/* LEFT - Chat */}
                <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">

                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" />
                        <h3 className="font-bold text-slate-800">Conversation</h3>
                    </div>

                    {!sessionId ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Create a session to start chatting
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-start gap-2 max-w-md ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="text-sm text-slate-400 flex items-center gap-2">
                                        <Sparkles size={14} className="animate-spin" /> Thinking...
                                    </div>
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Ask something..."
                                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Chatbot;