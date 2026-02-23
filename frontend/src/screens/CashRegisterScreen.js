/**
 * Pantalla de Corte de Caja - Estilo Sketch/Bone
 * Muestra nombre del cajero, confirmacion irreversible, logout post-corte
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DenominationInput from '../components/DenominationInput';
import { useAuth } from '../context/AuthContext';
import cashRegisterService from '../services/cashRegisterService';
import { formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const CashRegisterScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [denominations, setDenominations] = useState({});
    const [expected, setExpected] = useState('');
    const [fund, setFund] = useState('800');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    let total = 0;
    for (const [denom, count] of Object.entries(denominations)) {
        total += parseFloat(denom) * parseInt(count || 0, 10);
    }

    const handleSubmit = () => {
        if (!expected.trim()) { Alert.alert('Campo requerido', 'Ingresa el dinero esperado'); return; }
        const expectedNum = parseFloat(expected);
        if (isNaN(expectedNum) || expectedNum < 0) { Alert.alert('Valor invalido', 'Debe ser un numero positivo'); return; }

        // Confirmacion irreversible
        Alert.alert(
            '⚠️ Confirmar corte de caja',
            'Este registro es IRREVERSIBLE.\n\nCajero: ' + (user?.username || 'Desconocido') + '\nTotal contado: ' + formatCurrency(total) + '\nEsperado: ' + formatCurrency(expectedNum) + '\n\n¿Deseas continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Guardar corte', style: 'destructive', onPress: async () => {
                        setLoading(true);
                        try {
                            const record = await cashRegisterService.create({
                                denominations, expected: expectedNum, fund: parseFloat(fund) || 800,
                                notes, userId: user.id, userName: user.username,
                            });
                            setResult({ ...record, userName: user.username });

                            // Preguntar si cerrar sesion
                            setTimeout(() => {
                                Alert.alert('Corte guardado', 'El corte se guardo correctamente.\n¿Deseas cerrar sesion?', [
                                    { text: 'Seguir trabajando', style: 'cancel' },
                                    { text: 'Cerrar sesion', style: 'destructive', onPress: () => logout() },
                                ]);
                            }, 500);
                        } catch (error) { Alert.alert('Error', 'No se pudo guardar el corte'); }
                        finally { setLoading(false); }
                    }
                },
            ]
        );
    };

    const handleReset = () => {
        setDenominations({}); setExpected(''); setFund('800'); setNotes(''); setResult(null);
    };

    if (result) {
        const difference = result.actual - parseFloat(expected);
        return (
            <ScrollView style={st.container} contentContainerStyle={st.content}>
                <View style={st.resultHeader}>
                    <View style={st.successCircle}><Ionicons name="checkmark" size={28} color={C.card} /></View>
                    <Text style={st.resultTitle}>Corte Guardado</Text>
                </View>

                {/* Info del cajero */}
                <View style={st.cashierInfo}>
                    <Ionicons name="person-circle-outline" size={20} color={C.textSec} />
                    <Text style={st.cashierName}>Cajero: {result.userName || user?.username || 'N/A'}</Text>
                </View>

                <View style={st.resultCard}>
                    <View style={st.rRow}><Text style={st.rLabel}>Total contado</Text><Text style={st.rValue}>{formatCurrency(result.actual)}</Text></View>
                    <View style={st.rRow}><Text style={st.rLabel}>Esperado</Text><Text style={st.rValue}>{formatCurrency(result.expected)}</Text></View>
                    <View style={[st.rRow, st.diffRow]}>
                        <Text style={st.rLabel}>Diferencia</Text>
                        <View style={[st.diffBadge, { backgroundColor: difference >= 0 ? C.successLight : C.dangerLight }]}>
                            <Text style={[st.diffValue, { color: difference >= 0 ? C.success : C.danger }]}>
                                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                            </Text>
                        </View>
                    </View>
                    <View style={st.rRow}><Text style={st.rLabel}>Fondo</Text><Text style={st.rValue}>{formatCurrency(result.fund)}</Text></View>
                    <View style={[st.rRow, { borderBottomWidth: 0 }]}>
                        <Text style={st.rLabel}>Retiro</Text>
                        <Text style={[st.rValue, { color: C.info, fontFamily: FONT.heavy, fontSize: 18 }]}>{formatCurrency(result.withdrawal)}</Text>
                    </View>
                </View>

                {Object.keys(result.withdrawal_detail || {}).length > 0 && (
                    <View style={st.detailCard}>
                        <Text style={st.detailTitle}>Detalle del retiro</Text>
                        {Object.entries(result.withdrawal_detail).map(([d, c]) => (
                            <View key={d} style={st.detailRow}>
                                <Text style={st.detailDenom}>{formatCurrency(parseFloat(d))} x {c}</Text>
                                <Text style={st.detailTotal}>{formatCurrency(parseFloat(d) * c)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <TouchableOpacity style={st.primaryBtn} onPress={handleReset} activeOpacity={0.7}>
                    <Ionicons name="add-circle-outline" size={20} color={C.card} />
                    <Text style={st.primaryBtnText}>Nuevo Corte</Text>
                </TouchableOpacity>
                <TouchableOpacity style={st.outlineBtn} onPress={() => navigation.navigate('CashHistory')} activeOpacity={0.7}>
                    <Ionicons name="time-outline" size={18} color={C.accent} />
                    <Text style={st.outlineBtnText}>Ver Historial</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={st.container} contentContainerStyle={st.content}>
            <View style={st.headerRow}>
                <View>
                    <Text style={st.title}>Corte de Caja</Text>
                    <View style={st.cashierTag}>
                        <Ionicons name="person-outline" size={14} color={C.textSec} />
                        <Text style={st.cashierTagText}>{user?.username || 'Cajero'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={st.historyChip} onPress={() => navigation.navigate('CashHistory')} activeOpacity={0.7}>
                    <Ionicons name="time-outline" size={16} color={C.accent} />
                    <Text style={st.historyChipText}>Historial</Text>
                </TouchableOpacity>
            </View>

            <DenominationInput values={denominations} onChange={setDenominations} />

            <View style={st.fieldsCard}>
                <Text style={st.fieldLabel}>Dinero esperado *</Text>
                <TextInput style={st.input} keyboardType="decimal-pad" placeholder="Ej: 5000.00" placeholderTextColor={C.textMuted} value={expected} onChangeText={setExpected} />
                <Text style={st.fieldLabel}>Fondo de caja</Text>
                <TextInput style={st.input} keyboardType="decimal-pad" placeholder="800" placeholderTextColor={C.textMuted} value={fund} onChangeText={setFund} />
                <Text style={st.fieldLabel}>Notas (opcional)</Text>
                <TextInput style={[st.input, { minHeight: 70, textAlignVertical: 'top' }]} placeholder="Observaciones del turno..." placeholderTextColor={C.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            </View>

            {/* Resumen previo */}
            <View style={st.summaryCard}>
                <View style={st.summaryRow}>
                    <Text style={st.summaryLabel}>Total contado</Text>
                    <Text style={st.summaryValue}>{formatCurrency(total)}</Text>
                </View>
                {expected !== '' && (
                    <View style={st.summaryRow}>
                        <Text style={st.summaryLabel}>Diferencia estimada</Text>
                        <Text style={[st.summaryValue, { color: (total - parseFloat(expected || 0)) >= 0 ? C.success : C.danger }]}>
                            {(total - parseFloat(expected || 0)) >= 0 ? '+' : ''}{formatCurrency(total - parseFloat(expected || 0))}
                        </Text>
                    </View>
                )}
            </View>

            {/* Aviso irreversible */}
            <View style={st.irreversibleNotice}>
                <Ionicons name="information-circle-outline" size={16} color={C.warning} />
                <Text style={st.irreversibleText}>Este registro es irreversible una vez guardado</Text>
            </View>

            <TouchableOpacity style={[st.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.7}>
                {loading ? <ActivityIndicator color={C.card} /> : (
                    <><Ionicons name="save-outline" size={20} color={C.card} /><Text style={st.primaryBtnText}>Guardar Corte</Text></>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { padding: 16, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title: { fontFamily: FONT.heavy, fontSize: 22, color: C.text },
    cashierTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    cashierTagText: { fontFamily: FONT.medium, fontSize: 13, color: C.textSec },
    historyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: R, backgroundColor: C.successLight, borderWidth: 1, borderColor: C.accent },
    historyChipText: { fontFamily: FONT.medium, color: C.accent, fontSize: 13 },
    fieldsCard: { backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW, marginBottom: 12 },
    fieldLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 10 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 14, color: C.text, fontFamily: FONT.regular, fontSize: 15 },
    summaryCard: { backgroundColor: C.warmLight, borderRadius: R, padding: 14, borderWidth: 1.5, borderColor: C.warm, marginBottom: 8 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    summaryLabel: { fontFamily: FONT.medium, fontSize: 14, color: C.text },
    summaryValue: { fontFamily: FONT.heavy, fontSize: 16, color: C.warm },
    irreversibleNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 4 },
    irreversibleText: { fontFamily: FONT.regular, fontSize: 12, color: C.warning },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: R, paddingVertical: 16, marginTop: 8 },
    primaryBtnText: { fontFamily: FONT.bold, color: C.card, fontSize: 16 },
    outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: R, borderWidth: 1.5, borderColor: C.accent, marginTop: 10 },
    outlineBtnText: { fontFamily: FONT.medium, color: C.accent, fontSize: 14 },
    resultHeader: { alignItems: 'center', marginBottom: 16, gap: 10 },
    successCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
    resultTitle: { fontFamily: FONT.heavy, fontSize: 22, color: C.text },
    cashierInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.cardAlt, paddingVertical: 10, paddingHorizontal: 14, borderRadius: R, marginBottom: 12 },
    cashierName: { fontFamily: FONT.medium, fontSize: 14, color: C.text },
    resultCard: { backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW, marginBottom: 12 },
    rRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    rLabel: { fontFamily: FONT.regular, fontSize: 14, color: C.textSec },
    rValue: { fontFamily: FONT.bold, fontSize: 15, color: C.text },
    diffRow: {},
    diffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: R - 4 },
    diffValue: { fontFamily: FONT.heavy, fontSize: 16 },
    detailCard: { backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW, marginBottom: 12 },
    detailTitle: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    detailDenom: { fontFamily: FONT.regular, fontSize: 14, color: C.text },
    detailTotal: { fontFamily: FONT.medium, fontSize: 14, color: C.accent },
});

export default CashRegisterScreen;
