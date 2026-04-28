import { LayoutDashboard, Bus, Users, Bell, ShieldCheck, Menu, X, Brain, User, LogOut, AlertTriangle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/auth/user', { withCredentials: true });
                console.log(response.data);
                if (response.data.success) {
                    setUser(response.data.user);
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const allNavItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Overview', roles: ['admin', 'staff', 'parent'] },
        { path: '/attendance', icon: <Users size={20} />, label: 'Attendance', roles: ['admin', 'staff'] },
        { path: '/tracking', icon: <Bus size={20} />, label: 'Transport', roles: ['admin', 'staff', 'parent'] },
        { path: '/notifications', icon: <Bell size={20} />, label: 'Alerts', roles: ['admin', 'staff', 'parent'] },
        { path: '/ai/chat', icon: <Brain size={20} />, label: 'AI', roles: ['admin', 'staff', 'parent'] },
        { path: '/create-profile', icon: <User size={20} />, label: 'Create User', roles: ['admin'] }
    ];

    const navItems = allNavItems.filter(item => !user || item.roles.includes(user.role));

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center justify-between px-6 bg-slate-950">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <ShieldCheck className="text-blue-400" />
                        <span>SafeRoute</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-8 px-6 w-full flex flex-col gap-2">
                    {user?.role === 'staff' && (
                        <button
                            onClick={async () => {
                                if (window.confirm("BROADCAST EMERGENCY SOS? This will alert all admins and parents immediately!")) {
                                    try {
                                        toast.loading("Broadcasting SOS...", { id: 'sos' });
                                        // Fetch current position (or use last known if it was a real app)
                                        const pos = await new Promise((res) => navigator.geolocation.getCurrentPosition(res, () => res({ coords: { latitude: 0, longitude: 0 } })));
                                        
                                        await axios.post('http://localhost:3000/api/alerts/broadcast', {
                                            type: 'emergency',
                                            message: `CRITICAL: SOS signal received from ${user.fullname} (Bus ${user.branch}). Immediate assistance required! GPS: ${pos.coords.latitude}, ${pos.coords.longitude}`,
                                            target: 'Emergency Services',
                                            channels: ['GPS', 'SMS', 'PUSH']
                                        }, { withCredentials: true });
                                        
                                        toast.success("SOS Broadcasted!", { id: 'sos' });
                                    } catch (err) {
                                        toast.error("Failed to send SOS", { id: 'sos' });
                                    }
                                }
                            }}
                            className="flex items-center justify-center gap-2 w-full py-4 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-red-900/40 border-2 border-red-500 animate-pulse mb-4"
                        >
                            <AlertTriangle size={20} />
                            EMERGENCY SOS
                        </button>
                    )}
                    {user ? (
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex flex-col gap-3">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-200 truncate">{user.fullname}</h4>
                                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/20"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="animate-pulse flex flex-col gap-2">
                                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar