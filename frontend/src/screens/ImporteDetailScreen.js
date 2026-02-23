/**
 * Detalle de importe - Estilo Sketch/Bone
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import importesService from '../services/importesService';
import { formatDateTime, formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const STATUS = {
    activo: { color: C.accent, label: 'Activo', bg: C.successLight },
    vencido: { color: C.textMuted, label: 'Vencido', bg: C.cardAlt },
    cobrado: { color: C.warm, label: 'Cobrado', bg: C.warmLight },
};

const ImporteDetailScreen = ({ route }) => {
    const { id } = route.params;
    const [importe, setImporte] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const data = await importesService.getById(id); setImporte(data); }
            catch (e) { console.log('[DETALLE] Error: ' + e.message); }
            finally { setLoading(false); }
        })();
    }, [id]);

    const handleShare = async () => {
        if (!importe) return;
        const total = (importe.items || []).reduce((s, i) => s + i.price * (i.quantity || 1), 0);
        const items = (importe.items || []).map(i => '  - ' + i.product_name + ' x' + (i.quantity || 1) + ': ' + formatCurrency(i.price * (i.quantity || 1))).join('\n');
        const msg = 'Importe ' + importe.code + (importe.client_name ? '\nCliente: ' + importe.client_name : '') + '\n\nProductos:\n' + items + '\n\nTotal: ' + formatCurrency(total);
        try { await Share.share({ message: msg }); } catch (e) { }
    };

    if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>;
    if (!importe) return <View style={st.center}><Text style={st.empty}>Importe no encontrado</Text></View>;

    const total = (importe.items || []).reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    const s = STATUS[importe.status] || STATUS.activo;

    return (
        <ScrollView style={st.container} contentContainerStyle={st.content}>
            <View style={st.codeCard}>
                <View>
                    <Text style={st.code}>{importe.code}</Text>
                    {importe.client_name && (
                        <View style={st.clientRow}>
                            <Ionicons name="person-outline" size={14} color={C.textSec} />
                            <Text style={st.clientName}>{importe.client_name}</Text>
                        </View>
                    )}
                </View>
                <View style={[st.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[st.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
            </View>

            <Text style={st.date}>{formatDateTime(importe.created_at)}</Text>

            <View style={st.section}>
                <Text style={st.sectionTitle}>Productos</Text>
                {(importe.items || []).map((item, index) => (
                    <View key={index} style={st.itemRow}>
                        <Text style={st.itemName}>{item.product_name}</Text>
                        <Text style={st.itemQty}>x{item.quantity || 1}</Text>
                        <Text style={st.itemPrice}>{formatCurrency(item.price * (item.quantity || 1))}</Text>
                    </View>
                ))}
                <View style={st.totalRow}>
                    <Text style={st.totalLabel}>Total</Text>
                    <Text style={st.totalValue}>{formatCurrency(total)}</Text>
                </View>
            </View>

            <TouchableOpacity style={st.shareBtn} onPress={handleShare} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={18} color={C.accent} />
                <Text style={st.shareBtnText}>Compartir</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    content: { padding: 16 },
    empty: { fontFamily: FONT.medium, color: C.textSec, fontSize: 14 },
    codeCard: { backgroundColor: C.card, borderRadius: R, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, ...SHADOW },
    code: { fontFamily: FONT.heavy, fontSize: 26, color: C.text, letterSpacing: 3 },
    clientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    clientName: { fontFamily: FONT.medium, fontSize: 14, color: C.text },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: R - 4 },
    statusText: { fontFamily: FONT.bold, fontSize: 12, textTransform: 'uppercase' },
    date: { fontFamily: FONT.regular, color: C.textSec, fontSize: 12, marginTop: 8, marginBottom: 16 },
    section: { backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1, borderColor: C.border, ...SHADOW },
    sectionTitle: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    itemName: { flex: 1, fontFamily: FONT.medium, color: C.text, fontSize: 14 },
    itemQty: { fontFamily: FONT.regular, color: C.textSec, fontSize: 13, marginRight: 12 },
    itemPrice: { fontFamily: FONT.bold, color: C.accent, fontSize: 14 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 8, borderTopWidth: 2, borderTopColor: C.accent },
    totalLabel: { fontFamily: FONT.bold, fontSize: 16, color: C.text },
    totalValue: { fontFamily: FONT.heavy, fontSize: 20, color: C.accent },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: R, borderWidth: 1.5, borderColor: C.accent, marginTop: 16 },
    shareBtnText: { fontFamily: FONT.medium, color: C.accent, fontSize: 14 },
});

export default ImporteDetailScreen;
