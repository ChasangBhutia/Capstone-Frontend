import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true, // Keep for web cookies compatibility
});

// Add a request interceptor to attach the JWT token from localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // You might want to trigger a redirect to login here if using a state manager
        }
        return Promise.reject(error);
    }
);

export default api;
