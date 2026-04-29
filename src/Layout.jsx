import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { Menu, AlertTriangle, Bell, Info } from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const Layout = () => {
    const [isOpen, setIsOpen] = useState(false);
    const BACKEND_URI = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const socket = io(BACKEND_URI, { withCredentials: true });

        socket.on('new-alert', (data) => {
            // Two-way: confirm receipt back to server
            socket.emit('alert-received', { alertId: data.id, userId: 'current-user-context' });

            const isEmergency = data.type === 'emergency';

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 ${isEmergency ? 'border-red-600' : 'border-blue-500'}`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                {isEmergency ? <AlertTriangle className="text-red-500 animate-pulse" size={24} /> : <Bell className="text-blue-500" size={24} />}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                    {data.type}: {data.senderName || 'System'}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 font-medium">
                                    {data.message}
                                </p>
                                {isEmergency && (
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => toast.dismiss(t.id)}
                                            className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase"
                                        >
                                            Acknowledge
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: isEmergency ? 10000 : 5000, position: 'top-center' });
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="h-screen w-full flex bg-slate-50 relative overflow-hidden">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

            <div className="flex-1 flex flex-col h-full relative w-full overflow-y-auto">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
                    <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100">
                        <Menu size={24} />
                    </button>
                    <span className="ml-2 font-bold text-lg text-slate-800">SafeRoute</span>
                </div>

                <div className="p-4 md:p-6 lg:p-8 flex-1">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;