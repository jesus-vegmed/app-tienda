/**
 * Servicio de autenticacion
 * Login, logout, persistencia de sesion
 */
import api from './api';
import * as SecureStore from 'expo-secure-store';

const authService = {
    /**
     * Login como admin (usuario + contrasena)
     */
    async loginAdmin(username, password) {
        const response = await api.post('/auth/login', { username, password });
        const { token, user } = response.data.data;
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
        return user;
    },

    /**
     * Login como cajero (codigo)
     */
    async loginCashier(code) {
        const response = await api.post('/auth/login', { code });
        const { token, user } = response.data.data;
        await SecureStore.setItemAsync('auth_token', token);
        await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
        return user;
    },

    /**
     * Cerrar sesion
     */
    async logout() {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('auth_user');
    },

    /**
     * Obtener usuario guardado
     */
    async getStoredUser() {
        try {
            const userStr = await SecureStore.getItemAsync('auth_user');
            if (userStr) {
                return JSON.parse(userStr);
            }
        } catch (e) {
            // Ignorar
        }
        return null;
    },

    /**
     * Verificar si hay token guardado
     */
    async isAuthenticated() {
        const token = await SecureStore.getItemAsync('auth_token');
        return !!token;
    },

    /**
     * Obtener datos actuales del servidor
     */
    async getMe() {
        const response = await api.get('/auth/me');
        return response.data.data;
    },
};

export default authService;
