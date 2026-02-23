/**
 * Contexto de sincronizacion
 * Controla el estado de conexion y sincronizacion automatica
 */
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import syncService from '../services/syncService';

const SyncContext = createContext(null);

export const SyncProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSync, setLastSync] = useState(null);
    const syncIntervalRef = useRef(null);

    // Escuchar cambios de conectividad
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const connected = state.isConnected && state.isInternetReachable;
            setIsConnected(connected);

            // Si volvio la conexion, sincronizar
            if (connected) {
                triggerSync();
            }
        });

        // Verificar estado inicial
        NetInfo.fetch().then((state) => {
            setIsConnected(state.isConnected && state.isInternetReachable);
        });

        // Sincronizar periodicamente (cada 30 segundos si hay conexion)
        syncIntervalRef.current = setInterval(() => {
            if (isConnected) {
                triggerSync();
            }
        }, 30000);

        return () => {
            unsubscribe();
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, []);

    // Actualizar contador de pendientes periodicamente
    useEffect(() => {
        const updateCount = async () => {
            const count = await syncService.getPendingCount();
            setPendingCount(count);
        };

        const interval = setInterval(updateCount, 5000);
        updateCount();

        return () => clearInterval(interval);
    }, []);

    const triggerSync = async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            await syncService.fullSync();
            setLastSync(new Date());
            const count = await syncService.getPendingCount();
            setPendingCount(count);
        } catch (error) {
            console.log('[SYNC] Error en sincronizacion: ' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <SyncContext.Provider
            value={{
                isConnected,
                isSyncing,
                pendingCount,
                lastSync,
                triggerSync,
            }}
        >
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync debe usarse dentro de SyncProvider');
    }
    return context;
};
