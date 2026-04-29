import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bus, Users, Bot, Bell, ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Landing = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}api/auth/user`, { withCredentials: true });
                if (response.data.success) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                // Not authenticated
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-200">
            {/* Navbar */}
            <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg text-white">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">SafeRoute</span>
                        </div>
                        <div>
                            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200">
                                {isAuthenticated ? "Dashboard" : "Sign In"} <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main>
                <div className="relative pt-24 pb-32 flex items-center justify-center overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-blue-100/50 blur-3xl mix-blend-multiply"></div>
                        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-emerald-100/50 blur-3xl mix-blend-multiply"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <Shield size={16} /> Empowering School Safety
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                            Smart School <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Transport</span> <br className="hidden md:block" /> & Safety System
                        </h1>
                        <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-600 mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 leading-relaxed">
                            A comprehensive platform ensuring student safety through real-time tracking, AI-powered attendance, and instant communication.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300">
                            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
                                {isAuthenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight size={20} />
                            </Link>
                            <a href="#features" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div id="features" className="bg-white py-24 border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to manage student safety</h2>
                            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Our integrated suite of tools brings parents, staff, and administrators together onto a single platform.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                    <Bus size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Live Tracking</h3>
                                <p className="text-slate-600 leading-relaxed">Monitor school buses in real-time with GPS integration and route optimization.</p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                    <Users size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Attendance</h3>
                                <p className="text-slate-600 leading-relaxed">Facial recognition technology for seamless and secure student attendance tracking.</p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                    <Bell size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Alerts</h3>
                                <p className="text-slate-600 leading-relaxed">Two-way communication system for immediate notifications and emergency broadcasts.</p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                                    <Bot size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Assistant</h3>
                                <p className="text-slate-600 leading-relaxed">Intelligent chatbot providing immediate answers to queries regarding student data.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-white">
                        <ShieldCheck size={24} className="text-blue-500" />
                        <span className="font-bold text-xl tracking-tight">SafeRoute</span>
                    </div>
                    <p>© {new Date().getFullYear()} SafeRoute. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
