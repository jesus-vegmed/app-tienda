/**
 * Componente de entrada de denominaciones - Estilo Sketch/Bone
 * Orden: menor a mayor
 */
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const DENOMINATIONS = [
    { value: 0.5, label: '$0.50', type: 'moneda' },
    { value: 1, label: '$1', type: 'moneda' },
    { value: 2, label: '$2', type: 'moneda' },
    { value: 5, label: '$5', type: 'moneda' },
    { value: 10, label: '$10', type: 'moneda' },
    { value: 20, label: '$20', type: 'billete' },
    { value: 50, label: '$50', type: 'billete' },
    { value: 100, label: '$100', type: 'billete' },
    { value: 200, label: '$200', type: 'billete' },
    { value: 500, label: '$500', type: 'billete' },
    { value: 1000, label: '$1,000', type: 'billete' },
];

const DenominationInput = ({ values, onChange }) => {
    const handleChange = (denom, text) => {
        const count = parseInt(text, 10) || 0;
        onChange({ ...values, [denom]: count });
    };
    const increment = (denom) => {
        const current = parseInt(values[denom] || 0, 10);
        onChange({ ...values, [denom]: current + 1 });
    };
    const decrement = (denom) => {
        const current = parseInt(values[denom] || 0, 10);
        if (current > 0) onChange({ ...values, [denom]: current - 1 });
    };

    let total = 0;
    for (const d of DENOMINATIONS) total += d.value * (parseInt(values[d.value] || 0, 10));

    const monedas = DENOMINATIONS.filter((d) => d.type === 'moneda');
    const billetes = DENOMINATIONS.filter((d) => d.type === 'billete');

    const renderRow = (d) => {
        const count = parseInt(values[d.value] || 0, 10);
        const sub = d.value * count;
        return (
            <View key={d.value} style={[st.row, count > 0 && st.rowActive]}>
                <Text style={[st.label, count > 0 && st.labelActive]}>{d.label}</Text>
                <View style={st.controls}>
                    <TouchableOpacity style={st.btn} onPress={() => decrement(d.value)} activeOpacity={0.6}>
                        <Ionicons name="remove" size={16} color={C.text} />
                    </TouchableOpacity>
                    <TextInput
                        style={[st.input, count > 0 && st.inputActive]}
                        keyboardType="numeric"
                        value={count === 0 ? '' : String(count)}
                        placeholder="0"
                        placeholderTextColor={C.textMuted}
                        onChangeText={(text) => handleChange(d.value, text)}
                        selectTextOnFocus
                    />
                    <TouchableOpacity style={[st.btn, st.btnAdd]} onPress={() => increment(d.value)} activeOpacity={0.6}>
                        <Ionicons name="add" size={16} color={C.card} />
                    </TouchableOpacity>
                </View>
                <Text style={[st.subtotal, sub > 0 && st.subtotalActive]}>
                    {sub > 0 ? formatCurrency(sub) : '-'}
                </Text>
            </View>
        );
    };

    return (
        <View style={st.container}>
            <View style={st.section}>
                <View style={st.sectionHeader}>
                    <Ionicons name="ellipse" size={8} color={C.warning} />
                    <Text style={st.sectionTitle}>Monedas</Text>
                </View>
                {monedas.map(renderRow)}
            </View>
            <View style={st.section}>
                <View style={st.sectionHeader}>
                    <Ionicons name="ellipse" size={8} color={C.accent} />
                    <Text style={st.sectionTitle}>Billetes</Text>
                </View>
                {billetes.map(renderRow)}
            </View>
            <View style={st.totalRow}>
                <Text style={st.totalLabel}>Total contado</Text>
                <Text style={st.totalValue}>{formatCurrency(total)}</Text>
            </View>
        </View>
    );
};

const st = StyleSheet.create({
    container: { marginBottom: 16 },
    section: { backgroundColor: C.card, borderRadius: R, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, ...SHADOW },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    sectionTitle: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.5 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, marginBottom: 2, borderRadius: R - 4, paddingHorizontal: 4 },
    rowActive: { backgroundColor: C.successLight },
    label: { fontFamily: FONT.medium, width: 65, fontSize: 14, color: C.textMuted },
    labelActive: { color: C.text },
    controls: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    btn: { width: 34, height: 34, borderRadius: R - 4, backgroundColor: C.cardAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    btnAdd: { backgroundColor: C.accent, borderColor: C.accent },
    input: { width: 55, height: 34, borderRadius: R - 4, backgroundColor: C.cardAlt, color: C.text, textAlign: 'center', fontFamily: FONT.bold, fontSize: 15, borderWidth: 1, borderColor: C.border },
    inputActive: { borderColor: C.accent, backgroundColor: C.successLight },
    subtotal: { width: 80, textAlign: 'right', fontFamily: FONT.regular, color: C.textMuted, fontSize: 13 },
    subtotalActive: { color: C.accent, fontFamily: FONT.bold },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderRadius: R, padding: 16, borderWidth: 1.5, borderColor: C.accent, ...SHADOW },
    totalLabel: { fontFamily: FONT.bold, fontSize: 16, color: C.text },
    totalValue: { fontFamily: FONT.heavy, fontSize: 22, color: C.accent },
});

export default DenominationInput;
