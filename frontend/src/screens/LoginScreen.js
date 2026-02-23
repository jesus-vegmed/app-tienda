/**
 * Pantalla de Login - Estilo Sketch/Bone
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
    Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { C, R, FONT, SHADOW } from '../utils/theme';

const LoginScreen = () => {
    const { loginAdmin, loginCashier } = useAuth();
    const [mode, setMode] = useState('cajero');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        setLoading(true);
        try {
            if (mode === 'admin') {
                if (!username.trim() || !password.trim()) {
                    Alert.alert('Campos requeridos', 'Ingresa usuario y contrasena');
                    setLoading(false);
                    return;
                }
                await loginAdmin(username.trim(), password);
            } else {
                if (!code.trim()) {
                    Alert.alert('Campo requerido', 'Ingresa tu codigo de acceso');
                    setLoading(false);
                    return;
                }
                await loginCashier(code.trim());
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Error de conexion. Verifica tus datos.';
            Alert.alert('No se pudo ingresar', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View style={[s.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <View style={s.logoBox}>
                    <View style={s.logoCircle}>
                        <Ionicons name="storefront-outline" size={36} color={C.accent} />
                    </View>
                </View>
                <Text style={s.title}>Gestion de Tienda</Text>
                <Text style={s.subtitle}>Selecciona tu tipo de acceso</Text>

                <View style={s.modeSelector}>
                    <TouchableOpacity style={[s.modeBtn, mode === 'cajero' && s.modeBtnActive]} onPress={() => setMode('cajero')} activeOpacity={0.7}>
                        <Ionicons name="person-outline" size={18} color={mode === 'cajero' ? C.card : C.textMuted} />
                        <Text style={[s.modeBtnText, mode === 'cajero' && s.modeBtnTextActive]}>Cajero</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.modeBtn, mode === 'admin' && s.modeBtnActive]} onPress={() => setMode('admin')} activeOpacity={0.7}>
                        <Ionicons name="shield-outline" size={18} color={mode === 'admin' ? C.card : C.textMuted} />
                        <Text style={[s.modeBtnText, mode === 'admin' && s.modeBtnTextActive]}>Administrador</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.formCard}>
                    {mode === 'admin' ? (
                        <>
                            <Text style={s.fieldLabel}>Usuario</Text>
                            <TextInput style={s.input} placeholder="admin" placeholderTextColor={C.textMuted} value={username} onChangeText={setUsername} autoCapitalize="none" />
                            <Text style={s.fieldLabel}>Contrasena</Text>
                            <TextInput style={s.input} placeholder="********" placeholderTextColor={C.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
                        </>
                    ) : (
                        <>
                            <Text style={s.fieldLabel}>Codigo de acceso</Text>
                            <TextInput style={[s.input, s.codeInput]} placeholder="ABC123" placeholderTextColor={C.textMuted} value={code} onChangeText={setCode} autoCapitalize="none" textAlign="center" />
                        </>
                    )}

                    <TouchableOpacity style={[s.loginBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.7}>
                        {loading ? (
                            <ActivityIndicator color={C.card} />
                        ) : (
                            <>
                                <Ionicons name="log-in-outline" size={20} color={C.card} />
                                <Text style={s.loginBtnText}>Ingresar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    inner: { flex: 1, justifyContent: 'center', padding: 24 },
    logoBox: { alignItems: 'center', marginBottom: 20 },
    logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.successLight, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: FONT.heavy, fontSize: 26, color: C.text, textAlign: 'center', marginBottom: 4 },
    subtitle: { fontFamily: FONT.regular, fontSize: 14, color: C.textSec, textAlign: 'center', marginBottom: 28 },
    modeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: R, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, ...SHADOW },
    modeBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
    modeBtnText: { fontFamily: FONT.medium, fontSize: 14, color: C.textMuted },
    modeBtnTextActive: { color: C.card },
    formCard: { backgroundColor: C.card, borderRadius: R, padding: 20, borderWidth: 1, borderColor: C.border, ...SHADOW },
    fieldLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: FONT.regular, fontSize: 15, marginBottom: 4 },
    codeInput: { fontSize: 22, letterSpacing: 6, fontFamily: FONT.bold },
    loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: R, paddingVertical: 16, marginTop: 16 },
    loginBtnText: { fontFamily: FONT.bold, color: C.card, fontSize: 16 },
});

export default LoginScreen;
