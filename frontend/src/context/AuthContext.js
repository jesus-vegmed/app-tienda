/**
 * Contexto de autenticacion
 * Provee estado de usuario y funciones de login/logout a toda la app
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Intentar restaurar sesion al iniciar
    useEffect(() => {
        const restore = async () => {
            try {
                const storedUser = await authService.getStoredUser();
                if (storedUser) {
                    setUser(storedUser);
                }
            } catch (e) {
                console.log('[AUTH] Error restaurando sesion');
            } finally {
                setLoading(false);
            }
        };
        restore();
    }, []);

    const loginAdmin = async (username, password) => {
        const userData = await authService.loginAdmin(username, password);
        setUser(userData);
        return userData;
    };

    const loginCashier = async (code) => {
        const userData = await authService.loginCashier(code);
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAdmin: user?.role === 'admin',
                isCashier: user?.role === 'cajero',
                loginAdmin,
                loginCashier,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};
