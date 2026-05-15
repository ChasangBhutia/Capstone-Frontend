import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}api/auth/login`, formData, { withCredentials: true });
            if (response.data.success) {
                // Store token for mobile/app compatibility
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                setMessage("Login successful!");
                // Redirecting to overview/dashboard
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            } else {
                setError(response.data.error || "Login failed");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "An error occurred during login");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6 relative max-w-md mx-auto pt-10 pb-12">
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center gap-2 mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-inner border border-blue-200">
                    <ShieldCheck size={36} />
                </div>
                <h1 className="text-3xl font-bold text-slate-800">Welcome Back</h1>
                <p className="text-slate-500">Sign in to your SafeRoute account to continue.</p>
            </div>

            {/* Form Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-5">
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    placeholder="Enter your email"
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    placeholder="••••••••"
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 text-center animate-in fade-in">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 text-center animate-in fade-in">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-blue-400 shadow-none cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                }`}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Signing in...</span>
                            ) : (
                                <>
                                    <LogIn size={20} /> Sign In
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>


        </div>
    );
};

export default Login;