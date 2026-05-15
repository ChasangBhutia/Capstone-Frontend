import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('api/auth/user');
                if (response.data.success) {
                    setUser(response.data.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
