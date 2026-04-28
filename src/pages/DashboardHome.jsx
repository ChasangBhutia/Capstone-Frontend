import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bus, AlertTriangle, CheckCircle, MapPin, Navigation, X, ArrowUp, ArrowDown, Clock, Activity, Bell } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MOCK_BUSES, MOCK_STUDENTS, StudentStatus, BusStatus } from '../data/mockData';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, subtitle, icon, color, trend, trendUp }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-${color}-600`}>
      {React.cloneElement(icon, { size: 64 })}
    </div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-800 mb-1 tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
    </div>
  </div>
);

const ActivityItem = ({ type, title, time, desc }) => {
  let icon = <Activity size={16} />;
  let color = 'bg-slate-100 text-slate-600';

  if (type === 'checkin') { icon = <CheckCircle size={16} />; color = 'bg-emerald-100 text-emerald-600'; }
  if (type === 'alert') { icon = <AlertTriangle size={16} />; color = 'bg-amber-100 text-amber-600'; }
  if (type === 'transport') { icon = <Bus size={16} />; color = 'bg-blue-100 text-blue-600'; }

  return (
    <div className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className="font-semibold text-slate-800 text-sm truncate">{title}</h4>
          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{time}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{desc}</p>
      </div>
    </div>
  );
};

import axios from 'axios';
import { io } from 'socket.io-client';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 0. Fetch User Context
  useEffect(() => {
    const fetchUser = async () => {
        try {
            setUserLoading(true);
            const response = await axios.get('http://localhost:3000/api/auth/user', { withCredentials: true });
            if (response.data.success) {
                setCurrentUser(response.data.user);
            }
        } catch (err) {
            console.error("Failed to fetch user context", err);
        } finally {
            setUserLoading(false);
        }
    };
    fetchUser();
  }, []);

  // Backend Stats State
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    activeBuses: 0,
    activeAlerts: 0
  });

  // Bus Tracking State
  const [buses, setBuses] = useState({});
  const [selectedBus, setSelectedBus] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // 1. Fetch Dynamic Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/stats/overview', { withCredentials: true });
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update stats every 30s
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch Initial Bus Positions & Connect Socket
  useEffect(() => {
    const fetchBuses = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/bus/all');
            if (response.data.success) {
                const busMap = {};
                response.data.data.forEach(b => busMap[b.busId] = b);
                setBuses(busMap);
            }
        } catch (err) {
            console.error("Failed to fetch buses", err);
        }
    };

    fetchBuses();

    const socket = io('http://localhost:3000', { withCredentials: true });
    socket.on('bus-location-updated', (data) => {
        setBuses(prev => ({
            ...prev,
            [data.busId]: { ...prev[data.busId], ...data }
        }));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Use real data or fallback to mock for visuals
  const students = MOCK_STUDENTS;
  const presentCount = students.filter(s => s.status === StudentStatus.PRESENT).length;
  const totalStudents = stats.totalStudents || students.length;
  const attendanceRate = stats.attendanceRate || (totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0);

  const attendanceData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: students.filter(s => s.status === StudentStatus.ABSENT).length },
    { name: 'Late', value: students.filter(s => s.status === StudentStatus.LATE).length },
  ];

  const weeklyData = [
    { day: 'Mon', rate: 92, absents: 8 },
    { day: 'Tue', rate: 95, absents: 5 },
    { day: 'Wed', rate: 88, absents: 12 },
    { day: 'Thu', rate: 94, absents: 6 },
    { day: 'Fri', rate: attendanceRate, absents: totalStudents - presentCount },
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b'];



  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([51.505, -0.10], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);

      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstanceRef.current) return;

    const BASE_LAT = 51.53;
    const BASE_LNG = -0.18;
    const LAT_SPAN = -0.06;
    const LNG_SPAN = 0.16;

    Object.values(buses).forEach(bus => {
      const lat = bus.lat;
      const lng = bus.lng;

      let marker = markersRef.current[bus.busId];

      if (!marker) {
        const colorClass = 'bg-blue-600';

        const pulseHtml = `<span class="absolute -top-1 -right-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>`;

        const iconHtml = `
                <div class="relative w-8 h-8 rounded-xl shadow-lg border-2 border-white flex items-center justify-center text-white ${colorClass} transition-transform hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
                    ${pulseHtml}
                </div>
            `;

        const icon = L.divIcon({
          className: 'custom-bus-marker',
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        marker = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);

        marker.on('click', () => {
          setSelectedBus(bus);
          mapInstanceRef.current.panTo([lat, lng]);
        });

        markersRef.current[bus.busId] = marker;
      } else {
        marker.setLatLng([lat, lng]);
        marker.off('click');
        marker.on('click', () => setSelectedBus(bus));
      }
    });

  }, [buses]);

  const handleDownloadReport = () => {
    if (students.length === 0) {
      toast.error("No student data available to export.");
      return;
    }

    const headers = ["ID", "Name", "Grade", "Status", "Check-in Time", "Route", "Parent Phone"];
    const rows = students.map(s => [
      s.id,
      s.name,
      s.grade,
      s.status,
      s.checkInTime || '-',
      s.busRouteId,
      s.parentPhone
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Attendance report downloaded successfully!");
  };

  const handleBroadcastAlert = () => {
    navigate('/notifications');
  };

  const isAdmin = currentUser?.role === 'admin';
  const isStaff = currentUser?.role === 'staff';
  const isParent = currentUser?.role === 'parent';

  if (userLoading) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing your Secure Dashboard...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'System Command' : isStaff ? 'Transport Hub' : 'Parent Gateway'}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Clock size={14} />
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            Active Role: <span className="text-blue-600 font-semibold uppercase">{currentUser?.role || 'Guest'}</span>
          </p>
        </div>
        {(isAdmin || isStaff) && (
          <div className="flex gap-3">
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <ArrowDown size={16} /> Download Report
            </button>
            <button
              onClick={handleBroadcastAlert}
              className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex items-center gap-2"
            >
              <AlertTriangle size={16} /> Broadcast Alert
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <>
            <StatCard title="Total Enrollment" value={totalStudents} subtitle="Active student records" icon={<Users size={24} />} color="blue" trend="12% vs last month" trendUp={true} />
            <StatCard title="Attendance Rate" value={`${attendanceRate}%`} subtitle="Daily average" icon={<CheckCircle size={24} />} color="emerald" trend="2.1% vs yesterday" trendUp={true} />
            <StatCard title="Active Fleet" value={`${stats.activeBuses}/3`} subtitle="Buses currently on route" icon={<Bus size={24} />} color="indigo" trend="On Schedule" trendUp={true} />
            <StatCard title="Security Alerts" value={stats.activeAlerts} subtitle="Requires attention" icon={<AlertTriangle size={24} />} color="amber" trend="Low Severity" trendUp={false} />
          </>
        )}
        
        {isStaff && (
          <>
            <StatCard title="Assigned Unit" value={currentUser?.fullname?.split('Bus ')[1] || 'N/A'} subtitle="Vehicle ID" icon={<Bus size={24} />} color="blue" />
            <StatCard title="Route Status" value="On Time" subtitle="Traffic: Moderate" icon={<Navigation size={24} />} color="emerald" />
            <StatCard title="Passenger Load" value="28/40" subtitle="70% capacity" icon={<Users size={24} />} color="indigo" />
            <StatCard title="Engine Health" value="Optimal" subtitle="Next service: 12 days" icon={<Activity size={24} />} color="amber" />
          </>
        )}

        {isParent && (
          <>
            <StatCard title="Child Status" value="At School" subtitle="Checked in: 08:15 AM" icon={<CheckCircle size={24} />} color="emerald" />
            <StatCard title="Assigned Bus" value="R-101" subtitle="ETA to stop: 03:45 PM" icon={<Bus size={24} />} color="blue" />
            <StatCard title="Attendance" value="98%" subtitle="Academic year total" icon={<Activity size={24} />} color="indigo" />
            <StatCard title="Alerts" value="0" subtitle="No notifications today" icon={<Bell size={24} />} color="slate" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <MapPin size={20} className="text-blue-500" /> 
                {isAdmin ? 'Live Fleet Tracking' : isStaff ? 'Sector Status Map' : 'Real-time Child Tracking'}
              </h3>
              <p className="text-sm text-slate-500">
                {isAdmin ? 'Real-time GPS positions of active buses' : isStaff ? 'Local traffic and assigned route status' : 'Track the live progress of your child\'s transport'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">LIVE</span>
            </div>
          </div>

          <div className="flex-1 relative bg-slate-100 overflow-hidden group">
            <div id="dashboard-map" ref={mapContainerRef} className="absolute inset-0 z-0" />

            {selectedBus && (
              <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-2xl z-[500] animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <Bus size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{selectedBus.busId}</h4>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{selectedBus.driverName}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBus(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Status</span>
                    <span className="text-sm font-bold text-emerald-600">
                      Active
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Position</span>
                    <span className="text-[10px] font-bold text-slate-800">{selectedBus.lat?.toFixed(3)}, {selectedBus.lng?.toFixed(3)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Occupancy</span>
                    <span>{selectedBus.passengers}/{selectedBus.capacity}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${selectedBus.passengers > 25 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${(selectedBus.passengers / selectedBus.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Navigation size={12} /> {selectedBus.driverName}
                  </span>
                  <button className="text-blue-600 font-bold hover:underline">View Details</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" /> Recent Activity
            </h3>
            <button className="text-xs font-medium text-slate-500 hover:text-blue-600">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ActivityItem
              type="checkin"
              title="Alice Johnson Checked In"
              time="2 mins ago"
              desc="Verified via Face ID at Main Entrance Gate A."
            />
            <ActivityItem
              type="transport"
              title="Bus R-103 Arrived"
              time="5 mins ago"
              desc="Arrived at School Zone. Offloading 15 students."
            />
            <ActivityItem
              type="alert"
              title="Unrecognized Person"
              time="12 mins ago"
              desc="Security camera detected unregistered individual near Gate B."
            />
            <ActivityItem
              type="checkin"
              title="Bob Smith Checked In"
              time="15 mins ago"
              desc="Verified via QR Code scan."
            />
            <ActivityItem
              type="transport"
              title="Bus R-101 Delayed"
              time="25 mins ago"
              desc="Traffic congestion reported on North Avenue. ETA +10m."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Attendance Trends</h3>
              <p className="text-sm text-slate-500">Weekly student presence analytics</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1 outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Today's Distribution</h3>
          <p className="text-sm text-slate-500 mb-6">Real-time student status breakdown</p>

          <div className="h-64 w-full relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-bold text-slate-800">{presentCount}</span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Present</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {attendanceData.map((d, i) => (
              <div key={d.name} className="flex flex-col items-center p-2 rounded-lg bg-slate-50">
                <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-slate-500 font-medium">{d.name}</span>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
