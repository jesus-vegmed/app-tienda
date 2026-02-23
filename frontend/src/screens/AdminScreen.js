/**
 * Admin Screen - Estilo Sketch/Bone
 * Gestion de cajeros, sync, estadisticas, logout
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import api from '../services/api';
import { C, R, FONT, SHADOW } from '../utils/theme';

const AdminScreen = () => {
    const { user, logout } = useAuth();
    const { isConnected, pendingCount, triggerSync, isSyncing } = useSync();
    const [cashiers, setCashiers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    const loadCashiers = useCallback(async () => {
        if (!isConnected) return;
        setLoading(true);
        try { const res = await api.get('/users/cashiers'); setCashiers(res.data.data); }
        catch (e) { console.log('[ADMIN] ' + e.message); }
        finally { setLoading(false); }
    }, [isConnected]);

    useEffect(() => { loadCashiers(); }, [loadCashiers]);

    const handleCreate = async () => {
        if (!newName.trim() || !newCode.trim()) { Alert.alert('Campos requeridos', 'Nombre y codigo de acceso'); return; }
        if (newCode.trim().length < 4) { Alert.alert('Codigo corto', 'El codigo debe tener al menos 4 caracteres'); return; }
        try {
            await api.post('/users/cashiers', { username: newName.trim(), code: newCode.trim() });
            setNewName(''); setNewCode(''); setShowCreate(false); loadCashiers();
            Alert.alert('Cajero creado', newName.trim() + ' ahora puede ingresar con su codigo');
        } catch (e) { Alert.alert('Error', e.response?.data?.message || 'No se pudo crear'); }
    };

    const handleDelete = (id, name) => {
        Alert.alert('Eliminar cajero', 'Eliminar a ' + name + '? Esta accion no se puede deshacer.', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    try { await api.delete('/users/cashiers/' + id); loadCashiers(); }
                    catch (e) { Alert.alert('Error', 'No se pudo eliminar'); }
                }
            },
        ]);
    };

    return (
        <ScrollView style={st.container} contentContainerStyle={st.content}>
            {/* Header */}
            <View style={st.headerRow}>
                <View>
                    <Text style={st.title}>Administracion</Text>
                    <Text style={st.subtitle}>Sesion: {user?.username}</Text>
                </View>
                <View style={[st.connBadge, { backgroundColor: isConnected ? C.successLight : C.dangerLight }]}>
                    <Ionicons name={isConnected ? 'wifi-outline' : 'cloud-offline-outline'} size={16} color={isConnected ? C.accent : C.danger} />
                    <Text style={[st.connText, { color: isConnected ? C.accent : C.danger }]}>{isConnected ? 'Online' : 'Offline'}</Text>
                </View>
            </View>

            {/* Sync card */}
            <View style={st.card}>
                <View style={st.cardHeaderRow}>
                    <Ionicons name="sync-outline" size={18} color={C.info} />
                    <Text style={st.cardTitle}>Sincronizacion</Text>
                </View>
                <View style={st.row}>
                    <Text style={st.label}>Operaciones pendientes</Text>
                    <View style={[st.countChip, pendingCount > 0 && { backgroundColor: C.warningLight }]}>
                        <Text style={[st.countChipText, pendingCount > 0 && { color: C.warning }]}>{pendingCount}</Text>
                    </View>
                </View>
                <TouchableOpacity style={[st.syncBtn, (!isConnected || isSyncing) && { opacity: 0.5 }]} onPress={triggerSync} disabled={!isConnected || isSyncing} activeOpacity={0.7}>
                    <Ionicons name="cloud-upload-outline" size={18} color={C.card} />
                    <Text style={st.syncBtnText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</Text>
                </TouchableOpacity>
            </View>

            {/* Cajeros */}
            <View style={st.card}>
                <View style={st.cardHeaderRow}>
                    <Ionicons name="people-outline" size={18} color={C.warm} />
                    <Text style={st.cardTitle}>Cajeros</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity onPress={() => setShowCreate(!showCreate)} style={st.addToggle} activeOpacity={0.7}>
                        <Ionicons name={showCreate ? 'close' : 'add'} size={20} color={C.accent} />
                    </TouchableOpacity>
                </View>

                {showCreate && (
                    <View style={st.createForm}>
                        <Text style={st.fLabel}>Nombre</Text>
                        <TextInput style={st.input} placeholder="Nombre del cajero" placeholderTextColor={C.textMuted} value={newName} onChangeText={setNewName} />
                        <Text style={st.fLabel}>Codigo de acceso</Text>
                        <TextInput style={st.input} placeholder="Codigo unico (min. 4 chars)" placeholderTextColor={C.textMuted} value={newCode} onChangeText={setNewCode} autoCapitalize="none" />
                        <TouchableOpacity style={st.createBtn} onPress={handleCreate} activeOpacity={0.7}>
                            <Ionicons name="person-add-outline" size={16} color={C.card} />
                            <Text style={st.createBtnText}>Crear cajero</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {loading ? <ActivityIndicator color={C.accent} style={{ marginTop: 12 }} /> : (
                    cashiers.map(c => (
                        <View key={c.id} style={st.cashierRow}>
                            <View style={st.cashierAvatar}><Text style={st.cashierInitial}>{(c.username || '?')[0].toUpperCase()}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={st.cashierName}>{c.username}</Text>
                                <Text style={st.cashierCode}>Codigo: {c.code || 'N/A'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(c.id, c.username)} style={st.deleteBtn} activeOpacity={0.7}>
                                <Ionicons name="trash-outline" size={18} color={C.danger} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                {!loading && cashiers.length === 0 && (
                    <View style={st.emptyBox}><Ionicons name="person-outline" size={28} color={C.textMuted} /><Text style={st.emptyText}>No hay cajeros registrados</Text></View>
                )}
            </View>

            {/* Logout */}
            <TouchableOpacity style={st.logoutBtn} onPress={logout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color={C.danger} />
                <Text style={st.logoutText}>Cerrar sesion</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 16, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    title: { fontFamily: FONT.heavy, fontSize: 22, color: C.text },
    subtitle: { fontFamily: FONT.regular, fontSize: 13, color: C.textSec, marginTop: 2 },
    connBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R },
    connText: { fontFamily: FONT.medium, fontSize: 12 },
    card: { backgroundColor: C.card, borderRadius: R, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, ...SHADOW },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    cardTitle: { fontFamily: FONT.bold, fontSize: 14, color: C.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    label: { fontFamily: FONT.regular, fontSize: 13, color: C.textSec },
    countChip: { backgroundColor: C.cardAlt, paddingHorizontal: 10, paddingVertical: 3, borderRadius: R - 4 },
    countChipText: { fontFamily: FONT.bold, fontSize: 14, color: C.textSec },
    syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.info, borderRadius: R, paddingVertical: 12, marginTop: 8 },
    syncBtnText: { fontFamily: FONT.bold, color: C.card, fontSize: 14 },
    addToggle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.successLight, justifyContent: 'center', alignItems: 'center' },
    createForm: { marginTop: 10, gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight },
    fLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 8 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: FONT.regular, fontSize: 14 },
    createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: R, paddingVertical: 12, marginTop: 10 },
    createBtnText: { fontFamily: FONT.bold, color: C.card, fontSize: 14 },
    cashierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12 },
    cashierAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.warmLight, justifyContent: 'center', alignItems: 'center' },
    cashierInitial: { fontFamily: FONT.heavy, fontSize: 16, color: C.warm },
    cashierName: { fontFamily: FONT.medium, fontSize: 14, color: C.text },
    cashierCode: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec, marginTop: 2 },
    deleteBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.danger, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', paddingVertical: 20, gap: 6 },
    emptyText: { fontFamily: FONT.regular, color: C.textSec, fontSize: 13 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: R, borderWidth: 1.5, borderColor: C.danger, marginTop: 8 },
    logoutText: { fontFamily: FONT.medium, color: C.danger, fontSize: 15 },
});

export default AdminScreen;
