import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5221/api",
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            localStorage.removeItem("fullName");
            localStorage.removeItem("role");
            window.location.href = "/";
        }

        return Promise.reject(error);
    }
);

export default api;
