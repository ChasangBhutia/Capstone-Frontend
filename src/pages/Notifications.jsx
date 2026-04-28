import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, AlertTriangle, Check, Clock, History, Smartphone, Mail, Bell, Calendar, X, ShieldCheck, Siren, Phone, HeartPulse, MapPin, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const TEMPLATES = [
  { id: 't1', label: 'Bus Breakdown', type: 'emergency', text: 'Bus [BUS_ID] has experienced a mechanical failure near [LOCATION]. A replacement bus has been dispatched. ETA: [TIME].' },
  { id: 't2', label: 'Heavy Traffic', type: 'delay', text: 'Due to heavy congestion on [ROAD_NAME], Route [ROUTE_ID] is running approximately [MINUTES] late.' },
  { id: 't3', label: 'Weather Alert', type: 'emergency', text: 'Due to severe weather conditions, school will be [ACTION] today. Please check your email for details.' },
  { id: 't4', label: 'Event Reminder', type: 'reminder', text: 'Reminder: [EVENT_NAME] is scheduled for tomorrow at [TIME].' },
];

const draftParentNotification = async (type, route, details) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`[AI REFINED] ${details}`);
        }, 1000);
    });
};

const Notifications = () => {
  const [isSOSMode, setIsSOSMode] = useState(false);
  const [buses, setBuses] = useState([]);
  
  const [type, setType] = useState('delay');
  const [route, setRoute] = useState('All Parents');
  const [details, setDetails] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [channels, setChannels] = useState({ sms: true, push: true, email: false });
  const [history, setHistory] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [emergencyStatus, setEmergencyStatus] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:3000', { withCredentials: true });

    socket.on('new-alert', (data) => {
        setHistory(prev => [{
            ...data,
            id: data._id || Date.now(),
            sentAt: new Date(data.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
    });

    const fetchBuses = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/bus/all');
            if (response.data.success) {
                setBuses(response.data.data);
                if (response.data.data.length > 0) setSelectedBusId(response.data.data[0].busId);
            }
        } catch (err) {
            console.error(err);
        }
    };
    const fetchHistory = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/alerts/history', { withCredentials: true });
            if (response.data.success) {
                setHistory(response.data.alerts.map(a => ({
                    ...a,
                    id: a._id,
                    sentAt: new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })));
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchBuses();
    fetchHistory();

    return () => socket.disconnect();
  }, []);

  const selectedBusData = buses.find(b => b.busId === selectedBusId);

  const handleGenerate = async () => {
    if (!details) {
        toast.error("Please enter some details or select a template.");
        return;
    }
    setIsGenerating(true);
    const draft = await draftParentNotification(type, route, details);
    setGeneratedMessage(draft || details); 
    setIsGenerating(false);
    toast.success("Draft generated!");
  };

  const handleSend = async () => {
    if (!generatedMessage) return;
    
    const activeChannels = Object.entries(channels).filter(([_, active]) => active).map(([name]) => name.toUpperCase());
    
    if (activeChannels.length === 0) {
        toast.error("Please select at least one delivery channel.");
        return;
    }

    try {
        const response = await axios.post('http://localhost:3000/api/alerts/broadcast', {
            type,
            message: generatedMessage,
            target: route,
            channels: activeChannels
        }, { withCredentials: true });

        if (response.data.success) {
            toast.success("Alert broadcasted successfully!");
            setGeneratedMessage('');
            setDetails('');
        }
    } catch (err) {
        toast.error("Failed to broadcast alert.");
    }
  };

  const handleEmergencyDispatch = async (service) => {
      if (!selectedBusData) return;

      const emergencyMsg = `CRITICAL: ${service} has been dispatched to Bus ${selectedBusData.busId}. Coordinates: ${selectedBusData.lat}, ${selectedBusData.lng}`;
      
      try {
          await axios.post('http://localhost:3000/api/alerts/broadcast', {
              type: 'emergency',
              message: emergencyMsg,
              target: 'Emergency Services',
              channels: ['GPS', 'VOIP']
          }, { withCredentials: true });

          setEmergencyStatus(`${service} DISPATCHED. ETA: 6 mins.`);
          setIsSOSMode(false);
          toast.success(`${service} unit is on the way!`, { icon: '🚨' });
      } catch (err) {
          toast.error("Emergency dispatch failed!");
      }
  };

  const applyTemplate = (template) => {
      setType(template.type);
      setDetails(template.text);
      setGeneratedMessage(''); 
      toast('Template applied.', { icon: '📝' });
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col p-4 lg:p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Broadcast Command Center</h1>
            <p className="text-slate-500">Manage emergency alerts and parent communications.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsSOSMode(!isSOSMode)}
                className={`px-4 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2 ${
                    isSOSMode 
                    ? 'bg-slate-200 text-slate-600' 
                    : 'bg-red-600 text-white animate-pulse'
                }`}
            >
                {isSOSMode ? <X size={18}/> : <Siren size={18}/>}
                {isSOSMode ? 'Exit Emergency Mode' : 'EMERGENCY SOS'}
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
            {isSOSMode ? (
                <div className="absolute inset-0 bg-red-50 z-20 flex flex-col">
                    <div className="p-4 bg-red-600 text-white flex justify-between items-center shadow-md">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <AlertTriangle size={24} className="animate-bounce"/> RESPONSE CENTER
                        </h3>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm">
                            <label className="block text-xs font-bold text-red-600 uppercase mb-2">Affected Unit</label>
                            <select value={selectedBusId} onChange={(e) => setSelectedBusId(e.target.value)} className="w-full p-3 rounded-lg border border-red-200 bg-red-50 font-bold outline-none">
                                {buses.map(bus => (
                                    <option key={bus.busId} value={bus.busId}>Bus {bus.busId} - {bus.driverName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => handleEmergencyDispatch('AMBULANCE')} className="w-full py-4 bg-white border-2 border-red-500 rounded-xl flex items-center px-6 hover:bg-red-600 hover:text-white transition-all group">
                                <HeartPulse size={24} className="text-red-600 group-hover:text-white" />
                                <div className="ml-4 text-left font-black text-lg">MEDICAL EMERGENCY</div>
                            </button>
                            <button onClick={() => handleEmergencyDispatch('POLICE')} className="w-full py-4 bg-white border-2 border-blue-500 rounded-xl flex items-center px-6 hover:bg-blue-600 hover:text-white transition-all group">
                                <ShieldCheck size={24} className="text-blue-600 group-hover:text-white" />
                                <div className="ml-4 text-left font-black text-lg">POLICE ASSISTANCE</div>
                            </button>
                            <button onClick={() => handleEmergencyDispatch('FIRE')} className="w-full py-4 bg-white border-2 border-orange-500 rounded-xl flex items-center px-6 hover:bg-orange-600 hover:text-white transition-all group">
                                <AlertTriangle size={24} className="text-orange-600 group-hover:text-white" />
                                <div className="ml-4 text-left font-black text-lg">FIRE / RESCUE</div>
                            </button>
                        </div>

                        {emergencyStatus && (
                            <div className="bg-slate-900 text-green-400 font-mono p-4 rounded-lg text-xs animate-pulse">
                                {emergencyStatus}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-500" /> Compose Alert
                        </h3>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 bg-white outline-none text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="delay">⚠️ Delay</option>
                                    <option value="emergency">🚨 Emergency</option>
                                    <option value="reminder">📅 Reminder</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Recipient</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 bg-white outline-none text-sm" value={route} onChange={(e) => setRoute(e.target.value)}>
                                    <option>All Parents</option>
                                    <option>Route 101</option>
                                    <option>Route 102</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {TEMPLATES.map(t => (
                                <button key={t.id} onClick={() => applyTemplate(t)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">{t.label}</button>
                            ))}
                        </div>

                        <textarea className="w-full p-4 rounded-xl border border-slate-200 h-40 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder="Message details..." value={details} onChange={(e) => setDetails(e.target.value)} />

                        <button onClick={handleGenerate} disabled={isGenerating || !details} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70">
                            {isGenerating ? <Sparkles size={18} className="animate-spin" /> : <FileText size={18} />}
                            {isGenerating ? 'Generating...' : 'Generate AI Draft'}
                        </button>
                    </div>
                </>
            )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Smartphone size={18} className="text-slate-500" /> Preview
                    </h3>
                </div>
                <div className="p-6 flex-1 bg-slate-100 flex items-center justify-center">
                    {!generatedMessage ? (
                         <div className="text-center text-slate-400">
                             <MessageSquare size={48} className="mx-auto mb-2 opacity-20"/>
                             <p className="text-sm">No message generated yet.</p>
                         </div>
                    ) : (
                        <div className="w-full max-w-xs bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                             <div className="bg-slate-50 px-4 py-2 border-b text-[10px] font-bold text-slate-700">SafeRoute Alert</div>
                             <div className="p-4 text-sm text-slate-800 leading-relaxed font-medium">{generatedMessage}</div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white border-t border-slate-100">
                     <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Channels</label>
                        <div className="flex gap-2">
                            <button onClick={() => setChannels({...channels, sms: !channels.sms})} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${channels.sms ? 'bg-green-50 border-green-200 text-green-700' : 'text-slate-400'}`}>SMS</button>
                            <button onClick={() => setChannels({...channels, push: !channels.push})} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${channels.push ? 'bg-blue-50 border-blue-200 text-blue-700' : 'text-slate-400'}`}>Push</button>
                        </div>
                     </div>

                     <button onClick={handleSend} disabled={!generatedMessage} className="w-full bg-emerald-600 text-white rounded-lg py-2 font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                         <Send size={16} /> Broadcast Now
                     </button>
                </div>
            </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center gap-2">
                <History size={18} className="text-slate-500" /> History
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border text-xs ${item.type === 'emergency' ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
                        <div className="flex justify-between mb-1">
                            <span className="font-bold uppercase text-[10px]">{item.type}</span>
                            <span className="text-slate-400">{item.sentAt}</span>
                        </div>
                        <p className="font-medium text-slate-700 line-clamp-2">{item.message}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
