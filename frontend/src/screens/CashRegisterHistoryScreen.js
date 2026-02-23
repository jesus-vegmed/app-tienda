/**
 * Historial de cortes - Estilo Sketch/Bone
 * Muestra nombre del cajero que hizo cada corte
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import cashRegisterService from '../services/cashRegisterService';
import { formatDateTime, formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const CashRegisterHistoryScreen = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try { const data = await cashRegisterService.list(user.id, user.role); setRecords(data); }
        catch (e) { console.log('[HISTORIAL] Error: ' + e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>;

    return (
        <View style={st.container}>
            <FlatList data={records} keyExtractor={i => i.id}
                contentContainerStyle={st.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.accent} />}
                renderItem={({ item }) => {
                    const diff = item.actual - item.expected;
                    return (
                        <View style={st.card}>
                            <View style={st.cardHeader}>
                                <View>
                                    <View style={st.dateRow}>
                                        <Ionicons name="calendar-outline" size={14} color={C.textSec} />
                                        <Text style={st.date}>{formatDateTime(item.created_at)}</Text>
                                    </View>
                                    {/* Nombre del cajero */}
                                    <View style={st.cashierRow}>
                                        <Ionicons name="person-outline" size={12} color={C.textMuted} />
                                        <Text style={st.cashierName}>{item.user_name || 'Cajero'}</Text>
                                    </View>
                                </View>
                                {item.sync_status === 'pending' && <View style={st.pendingDot} />}
                            </View>
                            <View style={st.cardBody}>
                                <View style={st.row}><Text style={st.label}>Contado</Text><Text style={st.value}>{formatCurrency(item.actual)}</Text></View>
                                <View style={st.row}><Text style={st.label}>Esperado</Text><Text style={st.value}>{formatCurrency(item.expected)}</Text></View>
                                <View style={st.row}>
                                    <Text style={st.label}>Diferencia</Text>
                                    <View style={[st.diffBadge, { backgroundColor: diff >= 0 ? C.successLight : C.dangerLight }]}>
                                        <Text style={[st.diffValue, { color: diff >= 0 ? C.success : C.danger }]}>{diff >= 0 ? '+' : ''}{formatCurrency(diff)}</Text>
                                    </View>
                                </View>
                                <View style={[st.row, { borderBottomWidth: 0 }]}><Text style={st.label}>Retiro</Text><Text style={[st.value, { color: C.info, fontFamily: FONT.heavy }]}>{formatCurrency(item.withdrawal)}</Text></View>
                            </View>
                            {item.notes && <Text style={st.notes}>{item.notes}</Text>}
                        </View>
                    );
                }}
                ListEmptyComponent={<View style={st.emptyBox}><Ionicons name="clipboard-outline" size={40} color={C.textMuted} /><Text style={st.emptyText}>No hay cortes registrados</Text></View>}
            />
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: C.card, borderRadius: R, borderWidth: 1, borderColor: C.border, marginBottom: 10, padding: 14, ...SHADOW },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    date: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec },
    cashierRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    cashierName: { fontFamily: FONT.medium, fontSize: 12, color: C.textMuted },
    pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.warm },
    cardBody: {},
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    label: { fontFamily: FONT.regular, fontSize: 13, color: C.textSec },
    value: { fontFamily: FONT.bold, fontSize: 14, color: C.text },
    diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: R - 4 },
    diffValue: { fontFamily: FONT.heavy, fontSize: 14 },
    notes: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec, marginTop: 8, fontStyle: 'italic' },
    emptyBox: { alignItems: 'center', marginTop: 40, gap: 8 },
    emptyText: { fontFamily: FONT.medium, color: C.textSec, fontSize: 14 },
});

export default CashRegisterHistoryScreen;
