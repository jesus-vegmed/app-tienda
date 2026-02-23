/**
 * ImporteCard - Estilo Sketch/Bone
 * Muestra nombre del cliente, estado con icono
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const STATUS = {
    activo: { color: C.accent, icon: 'time-outline', label: 'Activo', bg: C.successLight },
    vencido: { color: C.textMuted, icon: 'warning-outline', label: 'Vencido', bg: C.cardAlt },
    cobrado: { color: C.warm, icon: 'checkmark-circle-outline', label: 'Cobrado', bg: C.warmLight },
};

const ImporteCard = ({ importe, onPress }) => {
    const s = STATUS[importe.status] || STATUS.activo;
    return (
        <TouchableOpacity style={[st.card, { borderLeftColor: s.color }]} onPress={onPress} activeOpacity={0.7}>
            <View style={st.header}>
                <View style={st.codeRow}>
                    <Text style={st.code}>{importe.code}</Text>
                    {importe.sync_status === 'pending' && <View style={st.pendingDot} />}
                </View>
                <View style={[st.statusBadge, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={12} color={s.color} />
                    <Text style={[st.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
            </View>
            {importe.client_name ? (
                <View style={st.clientRow}>
                    <Ionicons name="person-outline" size={13} color={C.textSec} />
                    <Text style={st.clientName}>{importe.client_name}</Text>
                </View>
            ) : null}
            <View style={st.footer}>
                <Text style={st.total}>{formatCurrency(importe.total)}</Text>
                <Text style={st.date}>{formatDate(importe.created_at)}</Text>
            </View>
        </TouchableOpacity>
    );
};

const st = StyleSheet.create({
    card: { backgroundColor: C.card, borderLeftWidth: 4, padding: 14, marginBottom: 8, borderRadius: R, borderWidth: 1, borderColor: C.border, ...SHADOW },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    code: { fontFamily: FONT.heavy, fontSize: 17, color: C.text, letterSpacing: 2 },
    pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.warm },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R - 4 },
    statusText: { fontFamily: FONT.bold, fontSize: 11, textTransform: 'uppercase' },
    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    clientName: { fontFamily: FONT.medium, fontSize: 13, color: C.text },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    total: { fontFamily: FONT.heavy, fontSize: 16, color: C.text },
    date: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec },
});

export default ImporteCard;
