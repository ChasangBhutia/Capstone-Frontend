import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as faceapi from "face-api.js";
import { UserPlus, Mail, Lock, Shield, Building, User, Hash, Bus, Camera, ScanFace } from 'lucide-react';

const CreateUser = () => {
    const videoRef = useRef(null);

    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        password: "",
        role: "staff",
        branch: "",
        teacherOf: "",
        student: [],
    });

    const [studentForm, setStudentForm] = useState({
        name: "",
        class: "",
        roll: "",
        bus: "",
        descriptor: null,
        imagePreview: null
    });

    const [cameraOn, setCameraOn] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ✅ Load models
    useEffect(() => {
        const loadModels = async () => {
            await tf.setBackend("webgl");
            await tf.ready();

            const MODEL_URL = "/models";

            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

            setModelsLoaded(true);
            console.log("Models loaded ✅");
        };

        loadModels();
    }, []);

    // ✅ Start camera
    useEffect(() => {
        if (cameraOn) startCamera();
    }, [cameraOn]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                };
            }
        } catch (err) {
            console.error(err);
            setError("Camera permission denied ❌");
        }
    };

    // ✅ Handle input
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleStudentChange = (e) => {
        setStudentForm({
            ...studentForm,
            [e.target.name]: e.target.value,
        });
    };

    // ✅ Capture face + preview (FOR THE SPECIFIC STUDENT)
    const captureFace = async () => {
        if (!modelsLoaded || !videoRef.current) {
            setError("Camera or models not ready ❌");
            return;
        }

        try {
            // 🔥 Image preview
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(videoRef.current, 0, 0);

            const imageData = canvas.toDataURL("image/png");

            // 🔥 Face detection
            const detection = await faceapi
                .detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setError("No face detected. Please try again. ❌");
                setMessage("");
                return;
            }

            const descriptor = Array.from(detection.descriptor);

            setStudentForm((prev) => ({
                ...prev,
                descriptor,
                imagePreview: imageData
            }));

            setMessage("✅ Face captured successfully!");
            setError("");

        } catch (err) {
            console.error(err);
            setError("Face capture error ❌");
        }
    };

    // ✅ Add student
    const handleAddStudent = () => {
        if (!studentForm.name || !studentForm.class || !studentForm.roll || !studentForm.bus) {
            setError("Please fill all student fields.");
            return;
        }

        if (!studentForm.descriptor) {
            setError("Please capture the student's face before adding.");
            return;
        }

        setFormData((prev) => ({
            ...prev,
            student: [...prev.student, studentForm],
        }));

        setStudentForm({ name: "", class: "", roll: "", bus: "", descriptor: null, imagePreview: null });
        setError("");
        setMessage("Student added. You can add another or complete registration.");
    };

    // ✅ Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const payload = {
                fullname: formData.fullname,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            };

            if (formData.role === "staff") {
                payload.branch = formData.branch;
                if (formData.teacherOf) {
                    payload.teacherOf = formData.teacherOf;
                }
            }

            if (formData.role === "parent") {
                if (formData.student.length === 0) {
                    setError("Please add at least one student.");
                    return;
                }
                payload.student = formData.student;
            }

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}api/auth/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to create user");

            setMessage("✅ User created successfully");
            setFormData({ fullname: "", email: "", password: "", role: "staff", branch: "", teacherOf: "", student: [] });
            setStudentForm({ name: "", class: "", roll: "", bus: "", descriptor: null, imagePreview: null });
            setCameraOn(false);

        } catch (err) {
            console.error(err);
            setError(err.message || "Error ❌");
        }
    };

    return (
        <div className={`space-y-6 relative mx-auto pb-12 ${formData.role === 'parent' ? 'max-w-5xl' : 'max-w-2xl'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Create Profile</h1>
                    <p className="text-slate-500">Register a new staff member or parent/student account.</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className={`grid grid-cols-1 ${formData.role === 'parent' ? 'md:grid-cols-2' : ''} gap-6`}>
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Basic Information</h3>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        name="fullname"
                                        value={formData.fullname}
                                        placeholder="John Doe"
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        placeholder="email@example.com"
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="parent">Parent</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role === "staff" && (
                                <>
                                    <div className="relative animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Branch</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                name="branch"
                                                value={formData.branch}
                                                placeholder="e.g. Main Campus"
                                                onChange={handleChange}
                                                required
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Class Teacher Of (Optional)</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                name="teacherOf"
                                                value={formData.teacherOf}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                            >
                                                <option value="" disabled>Select Class</option>
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Student Details Section (Parent flow) */}
                        {formData.role === "parent" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 border-l pl-0 md:pl-6 border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Student Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            name="name"
                                            placeholder="Student Name"
                                            value={studentForm.name}
                                            onChange={handleStudentChange}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <select
                                            name="class"
                                            value={studentForm.class}
                                            onChange={handleStudentChange}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                        >
                                            <option value="" disabled>Class</option>
                                            {[...Array(10)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="number"
                                            name="roll"
                                            placeholder="Roll No."
                                            value={studentForm.roll}
                                            onChange={handleStudentChange}
                                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Bus className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            name="bus"
                                            value={studentForm.bus}
                                            onChange={handleStudentChange}
                                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                        >
                                            <option value="" disabled>Bus Route</option>
                                            <option value="B-11">B-11</option>
                                            <option value="B-12">B-12</option>
                                            <option value="B-13">B-13</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Facial Recognition Setup</h4>

                                    {!cameraOn ? (
                                        <button
                                            type="button"
                                            onClick={() => setCameraOn(true)}
                                            className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Camera size={18} /> Open Camera to Scan Face
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border-2 border-slate-200">
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={captureFace}
                                                    className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ScanFace size={18} /> Capture Face
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCameraOn(false)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {studentForm.imagePreview && (
                                        <div className="mt-3 flex items-center gap-3 bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100 animate-in fade-in">
                                            <img
                                                src={studentForm.imagePreview}
                                                alt="Face preview"
                                                className="w-12 h-12 rounded object-cover border border-emerald-200"
                                            />
                                            <div className="text-sm font-medium">
                                                Face template generated & ready
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddStudent}
                                    className="w-full py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    <UserPlus size={18} /> Add Student to List
                                </button>

                                {formData.student.length > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Added Students</h4>
                                        <ul className="space-y-2">
                                            {formData.student.map((s, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm bg-white p-2 rounded shadow-sm border border-slate-100">
                                                    {s.imagePreview && (
                                                        <img src={s.imagePreview} alt="Student" className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                                                    )}
                                                    <div className="flex-1 flex justify-between items-center">
                                                        <span className="font-medium text-slate-700">{s.name}</span>
                                                        <span className="text-slate-500 text-xs">Cls: {s.class} | Roll: {s.roll} | Bus: {s.bus}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 text-center animate-in fade-in">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 text-center animate-in fade-in">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={20} /> Complete Registration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUser;