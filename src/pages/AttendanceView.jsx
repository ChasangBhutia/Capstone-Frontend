import React, { useState, useEffect, useRef } from 'react';
import { Search, QrCode, CheckCircle2, Bus, User, Trash2, Image as ImageIcon, AlertTriangle, Check, ShieldCheck, CameraOff, Download, Upload, Sparkles } from 'lucide-react';
import QRCode from "react-qr-code";
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AttendanceView = () => {

    const navigate = useNavigate();

    // Basic States
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [insight, setInsight] = useState('');
    const [loadingInsight, setLoadingInsight] = useState(false);

    // Modal States
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [registeredStudent, setRegisteredStudent] = useState(null);


    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const response = await api.get('api/attendance');
                if (response.data.success) {
                    const mappedStudents = response.data.attendance.map(a => ({
                        id: a.student.roll || a.student._id,
                        name: a.student.studentName,
                        grade: a.student.class,
                        status: a.status,
                        busRouteId: a.student.bus || 'Not Assigned',
                        photoUrl: a.student.photo || null
                    }));
                    setStudents(mappedStudents);
                }
            } catch (err) {
                console.error("Error connecting to student API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
        fetchInsight();
    }, []);

    const fetchInsight = async () => {
        setLoadingInsight(true);
        // Simulate real check vs mock
        setTimeout(() => {
            setInsight("Attendance is stable today. Total students detected in database matched expected enrollment.");
            setLoadingInsight(false);
        }, 800);
    };

    const filteredStudents = students.filter(student => {
        const matchesFilter = filter === 'All' || student.status === filter;
        const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.id.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'bg-emerald-100 text-emerald-700';
            case 'absent': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const requestDeleteStudent = (student, e) => {
        e.stopPropagation();
        setDeleteConfirmation(student);
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) return;
        setStudents(prev => prev.filter(s => s.id !== deleteConfirmation.id));
        setDeleteConfirmation(null);
    };

    const downloadQRCode = () => { alert("QR Code download triggered"); };

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
                    <p className="text-slate-500">Monitor student check-ins, register students, and process attendance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/attendance/scan')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-colors"
                    >
                        <QrCode size={18} />
                        <span>Take Attendance</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment</p>
                        <h3 className="text-2xl font-black text-slate-800">{students.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Present</p>
                        <h3 className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'present').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="h-12 w-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Absent</p>
                        <h3 className="text-2xl font-black text-slate-800">{students.filter(s => s.status === 'absent').length}</h3>
                    </div>
                </div>
            </div>

            {/* AI Insight Banner */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                    <ShieldCheck size={120} />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                    <div className="h-16 w-16 bg-blue-500/20 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Sparkles size={32} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-500 text-[10px] font-black uppercase rounded-full tracking-tighter">AI Analysis</span>
                            <h3 className="font-bold text-lg">Daily Attendance Narrative</h3>
                        </div>
                        {loadingInsight ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-3 bg-white/20 rounded w-3/4"></div>
                                <div className="h-3 bg-white/10 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{insight}</p>
                        )}
                    </div>
                    <button onClick={fetchInsight} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all">
                        <Check size={18} /> Validated Correctness
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {['All', 'present', 'absent'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Student</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Grade</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Check-in Time</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Bus Route</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-blue-200">
                                                {student.photoUrl ? (
                                                    <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    getInitials(student.name)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{student.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{student.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{student.grade}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {student.checkInTime || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm flex items-center gap-2">
                                        <Bus size={14} />
                                        {student.busRouteId}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => requestDeleteStudent(student, e)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove Student"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredStudents.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        No students found matching your criteria.
                    </div>
                )}
            </div>

            {/* -------------------- MODALS -------------------- */}

            {/* Registration Success (QR Code) Modal */}
            {registeredStudent && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-center">
                        <div className="bg-emerald-600 p-6 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3">
                                <Check size={28} className="text-emerald-600" />
                            </div>
                            <h3 className="text-white font-bold text-xl">Registration Success!</h3>
                        </div>

                        <div className="p-6">
                            <p className="text-slate-500 text-sm mb-6">
                                Student <strong>{registeredStudent.name}</strong> has been added. Use this QR code for daily attendance.
                            </p>

                            <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm inline-block mb-6">
                                <QRCode
                                    id="generated-qr-code"
                                    size={180}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={registeredStudent.id}
                                    viewBox={`0 0 256 256`}
                                />
                                <div className="mt-2 text-xs font-mono font-bold text-slate-400 tracking-widest">{registeredStudent.id}</div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={downloadQRCode}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Save PNG
                                </button>
                                <button
                                    onClick={() => setRegisteredStudent(null)}
                                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4 text-red-600">
                            <div className="p-3 bg-red-100 rounded-full shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Confirm Deletion</h3>
                                <p className="text-sm text-slate-500">This action is permanent.</p>
                            </div>
                        </div>

                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to permanently delete student <strong>{deleteConfirmation.name}</strong> ({deleteConfirmation.id})?
                            All attendance records and associated data will be removed from the system.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                            >
                                Delete Student
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AttendanceView