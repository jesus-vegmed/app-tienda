/**
 * Tarjeta de faltante - Estilo Sketch/Bone
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R, FONT, SHADOW } from '../utils/theme';

const URGENCY = {
    alta: { bg: C.dangerLight, border: C.danger, text: C.danger, icon: 'flame-outline' },
    media: { bg: C.warningLight, border: C.warning, text: C.warning, icon: 'alert-outline' },
    baja: { bg: C.successLight, border: C.accent, text: C.accent, icon: 'leaf-outline' },
};
const LABELS = { alta: 'Urgente', media: 'Media', baja: 'Baja' };

const MissingItemCard = ({ item, isExpanded, onToggle, onPurchase, onDelete }) => {
    const u = URGENCY[item.urgency] || URGENCY.media;
    return (
        <View style={[st.card, { borderLeftColor: u.border }]}>
            <TouchableOpacity style={st.header} onPress={onToggle} activeOpacity={0.7}>
                <View style={st.info}>
                    <Text style={st.name}>{item.product_name}</Text>
                    {item.size && <Text style={st.size}>{item.size}</Text>}
                </View>
                <View style={[st.badge, { backgroundColor: u.bg }]}>
                    <Ionicons name={u.icon} size={13} color={u.text} />
                    <Text style={[st.badgeText, { color: u.text }]}>{LABELS[item.urgency]}</Text>
                </View>
            </TouchableOpacity>
            {isExpanded && (
                <View style={st.actions}>
                    <TouchableOpacity style={st.purchaseBtn} onPress={onPurchase} activeOpacity={0.7}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={C.card} />
                        <Text style={st.purchaseText}>Comprado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={18} color={C.danger} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const st = StyleSheet.create({
    card: { backgroundColor: C.card, borderRadius: R, borderLeftWidth: 4, marginBottom: 8, borderWidth: 1, borderColor: C.border, ...SHADOW },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    info: { flex: 1 },
    name: { fontFamily: FONT.medium, fontSize: 15, color: C.text },
    size: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec, marginTop: 2 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: R - 4 },
    badgeText: { fontFamily: FONT.bold, fontSize: 11, textTransform: 'uppercase' },
    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.borderLight, padding: 10, gap: 10 },
    purchaseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, borderRadius: R - 4, paddingVertical: 10, gap: 6 },
    purchaseText: { fontFamily: FONT.medium, color: C.card, fontSize: 13 },
    deleteBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: R - 4, borderWidth: 1.5, borderColor: C.danger, justifyContent: 'center' },
});

export default MissingItemCard;
