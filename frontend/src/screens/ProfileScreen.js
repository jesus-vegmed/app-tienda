/**
 * ProfileScreen - Pantalla de perfil del usuario
 * Muestra nombre del cajero/admin y opcion de cerrar sesion
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C, R, FONT, SHADOW } from '../utils/theme';

const ProfileScreen = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Cerrar sesion', 'Estas seguro de que deseas cerrar sesion?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesion', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <View style={st.container}>
            <View style={st.avatarContainer}>
                <View style={st.avatar}>
                    <Text style={st.avatarLetter}>{(user?.username || '?')[0].toUpperCase()}</Text>
                </View>
                <Text style={st.name}>{user?.username || 'Usuario'}</Text>
                <View style={st.roleBadge}>
                    <Ionicons name={user?.role === 'admin' ? 'shield-outline' : 'person-outline'} size={14} color={C.accent} />
                    <Text style={st.roleText}>{user?.role === 'admin' ? 'Administrador' : 'Cajero'}</Text>
                </View>
            </View>

            <View style={st.infoCard}>
                <View style={st.infoRow}>
                    <Ionicons name="person-outline" size={18} color={C.textSec} />
                    <Text style={st.infoLabel}>Nombre</Text>
                    <Text style={st.infoValue}>{user?.username}</Text>
                </View>
                <View style={st.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={C.textSec} />
                    <Text style={st.infoLabel}>Rol</Text>
                    <Text style={st.infoValue}>{user?.role === 'admin' ? 'Admin' : 'Cajero'}</Text>
                </View>
            </View>

            <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color={C.danger} />
                <Text style={st.logoutText}>Cerrar sesion</Text>
            </TouchableOpacity>

            <Text style={st.versionText}>App Tienda v1.0</Text>
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, padding: 20 },
    avatarContainer: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.warmLight, justifyContent: 'center', alignItems: 'center', marginBottom: 14, ...SHADOW },
    avatarLetter: { fontFamily: FONT.heavy, fontSize: 34, color: C.warm },
    name: { fontFamily: FONT.heavy, fontSize: 22, color: C.text, marginBottom: 8 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: R, backgroundColor: C.successLight },
    roleText: { fontFamily: FONT.medium, fontSize: 13, color: C.accent },
    infoCard: { backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW, marginBottom: 20 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    infoLabel: { fontFamily: FONT.regular, fontSize: 13, color: C.textSec, flex: 1 },
    infoValue: { fontFamily: FONT.bold, fontSize: 14, color: C.text },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: R, borderWidth: 1.5, borderColor: C.danger, marginTop: 10 },
    logoutText: { fontFamily: FONT.medium, color: C.danger, fontSize: 16 },
    versionText: { fontFamily: FONT.regular, color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingBottom: 20 },
});

export default ProfileScreen;
