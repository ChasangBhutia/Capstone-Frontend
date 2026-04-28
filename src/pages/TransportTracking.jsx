import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Bus, Clock, MapPin, Navigation, Signal, AlertCircle, Share2, Search, X, Video, Gauge, Fuel, Users, Phone, MessageSquare, Edit, UserCog, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Configuration ---
const SOCKET_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3000/api/bus/all';

const TransportTracking = () => {
    // 1. State Management
    const [buses, setBuses] = useState({});
    const [selectedBusId, setSelectedBusId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isSharingLocation, setIsSharingLocation] = useState(false);

    // Map Refs
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});

    // 2. Fetch Initial User State
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/auth/user', { withCredentials: true });
                if (response.data.success) {
                    setCurrentUser(response.data.user);
                }
            } catch (error) {
                console.error("Failed to fetch user", error);
            }
        };
        fetchUser();
    }, []);

    // 3. Leaflet Map Initialization
    useEffect(() => {
        const L = window.L;
        if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

        // Initialize Map
        mapInstanceRef.current = L.map(mapContainerRef.current).setView([28.6139, 77.2090], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);

        // Force resize update
        setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // 4. API Service & Socket logic
    const fetchInitialLocations = useCallback(async () => {
        try {
            const response = await axios.get(API_URL);
            if (response.data.success) {
                const map = {};
                response.data.data.forEach(bus => {
                    map[bus.busId] = bus;
                });
                setBuses(map);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Failed to load bus data.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialLocations();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket']
        });

        socket.on('connect', () => setIsSocketConnected(true));
        socket.on('disconnect', () => setIsSocketConnected(false));

        socket.on('bus-location-updated', (data) => {
            setBuses(prev => ({
                ...prev,
                [data.busId]: {
                    ...prev[data.busId],
                    lat: data.lat,
                    lng: data.lng,
                    updatedAt: data.updatedAt
                }
            }));
        });

        return () => socket.disconnect();
    }, [fetchInitialLocations]);

    // 5. Marker Update Logic (Leaflet)
    useEffect(() => {
        const L = window.L;
        if (!L || !mapInstanceRef.current) return;

        Object.entries(buses).forEach(([id, data]) => {
            let marker = markersRef.current[id];

            if (!marker) {
                const iconHtml = `
                    <div class="relative w-10 h-10 rounded-full shadow-xl border-4 border-white flex items-center justify-center text-white bg-blue-600 transition-all duration-300 transform hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
                    </div>
                `;

                const customIcon = L.divIcon({
                    className: 'custom-bus-marker',
                    html: iconHtml,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(mapInstanceRef.current);
                marker.on('click', () => setSelectedBusId(id));
                markersRef.current[id] = marker;
            } else {
                marker.setLatLng([data.lat, data.lng]);
            }
        });
    }, [buses]);

    // 6. Real GPS Broadcast logic for Bus User (Device Geolocation)
    useEffect(() => {
        let watchId;
        
        if (isSharingLocation && currentUser?.branch && navigator.geolocation) {
            toast.success("GPS Broadcast active. Tracking device position.");

            // Use watchPosition for high-accuracy real-time tracking
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    // Update Local State for immediate feedback
                    setBuses(prev => ({
                        ...prev,
                        [currentUser.branch]: {
                            ...prev[currentUser.branch],
                            lat: latitude,
                            lng: longitude,
                            updatedAt: new Date()
                        }
                    }));

                    // Send Real GPS to backend
                    axios.post('http://localhost:3000/api/bus/update-location', {
                        x: latitude, // maps to lat
                        y: longitude // maps to lng
                    }, { withCredentials: true })
                    .catch(err => console.error("Broadcast failed", err));
                },
                (error) => {
                    console.error("GPS Error:", error);
                    toast.error("GPS Error: " + error.message);
                    setIsSharingLocation(false);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isSharingLocation, currentUser]);

    const filteredBuses = Object.entries(buses).filter(([id]) => 
        id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] relative flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 z-20">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Fleet Monitoring</h1>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                        <Signal size={14} className={isSocketConnected ? 'text-emerald-500' : 'text-slate-300'} />
                        {isSocketConnected ? 'Live Connection Active' : 'Connecting to satellite...'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Find bus..." 
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {currentUser?.role === 'staff' && (
                        <button 
                            onClick={() => setIsSharingLocation(!isSharingLocation)}
                            className={`px-4 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2 text-sm ${
                                isSharingLocation 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-emerald-600 text-white'
                            }`}
                        >
                            <Share2 size={16} />
                            {isSharingLocation ? 'Stop Sharing' : 'Share Live GPS'}
                        </button>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full" />
                
                {/* Overlay Info Card */}
                {selectedBusId && buses[selectedBusId] && (
                    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-80 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl z-[500] animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Bus size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg">{selectedBusId}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{buses[selectedBusId].driverName || 'System Active'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedBusId(null)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                                 <X size={20} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Last Contact</span>
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                    <Clock size={14} className="text-blue-500" />
                                    {new Date(buses[selectedBusId].updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Status</span>
                                <span className="text-sm font-bold text-emerald-600">Active</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 p-2 rounded-lg">
                                <MapPin size={14} className="text-red-500" />
                                <span className="truncate">{buses[selectedBusId].lat.toFixed(5)}, {buses[selectedBusId].lng.toFixed(5)}</span>
                            </div>
                            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-slate-300 transition-all active:scale-95">
                                Intercept Sequence
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Units List (Optional view) */}
            {!selectedBusId && (
                <div className="absolute bottom-6 left-6 right-6 lg:left-8 lg:w-96 flex gap-4 overflow-x-auto pb-4 scrollbar-hide z-10 transition-all animate-in slide-in-from-left-10">
                    {filteredBuses.map(([id, data]) => (
                        <div 
                            key={id}
                            onClick={() => {
                                setSelectedBusId(id);
                                if (mapInstanceRef.current) {
                                    mapInstanceRef.current.flyTo([data.lat, data.lng], 15);
                                }
                            }}
                            className="shrink-0 bg-white/90 backdrop-blur border border-slate-200 p-4 rounded-xl shadow-lg cursor-pointer hover:bg-white transition-all w-48"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Bus size={16} />
                                </div>
                                <span className="font-bold text-slate-800">{id}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Updated</span>
                                <span className="text-slate-600">{new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                    {filteredBuses.length === 0 && (
                        <div className="bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200">
                            <p className="text-xs font-bold text-slate-400">No active units detected.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TransportTracking;
