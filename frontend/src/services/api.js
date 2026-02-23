/**
 * Servicio API - Cliente Axios configurado
 * Interceptores para autenticacion y manejo de errores
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL configurada desde .env (EXPO_PUBLIC_API_URL)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de peticion: agregar token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = 'Bearer ' + token;
            }
        } catch (e) {
            // SecureStore no disponible
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo de errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Error del servidor
            const message = error.response.data?.message || 'Error del servidor';
            console.log('[API] Error ' + error.response.status + ': ' + message);
        } else if (error.request) {
            // Sin respuesta (offline)
            console.log('[API] Sin conexion al servidor');
        }
        return Promise.reject(error);
    }
);

/**
 * Cambiar la URL base del API
 */
export const setBaseURL = (url) => {
    api.defaults.baseURL = url;
};

export default api;
