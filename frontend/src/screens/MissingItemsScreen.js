/**
 * Pantalla de Faltantes - Estilo Sketch/Bone
 * Confirmacion antes de marcar, ordenacion por urgencia, animaciones
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, RefreshControl, ActivityIndicator, Modal, Alert, Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import missingItemsService from '../services/missingItemsService';
import MissingItemCard from '../components/MissingItemCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { C, R, FONT, SHADOW } from '../utils/theme';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

const URGENCIES = [
    { key: 'alta', icon: 'flame-outline', color: C.danger, label: 'Urgente' },
    { key: 'media', icon: 'alert-outline', color: C.warning, label: 'Media' },
    { key: 'baja', icon: 'leaf-outline', color: C.accent, label: 'Baja' },
];

const MissingItemsScreen = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [createVisible, setCreateVisible] = useState(false);
    const [name, setName] = useState('');
    const [size, setSize] = useState('');
    const [urgency, setUrgency] = useState('media');
    const [creating, setCreating] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ visible: false, item: null });
    const [sortBy, setSortBy] = useState('urgency');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const loadData = useCallback(async () => {
        try {
            const data = await missingItemsService.list(user.id);
            setItems(data);
        } catch (e) { console.log('[FALTANTES] ' + e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    const urgencyOrder = { alta: 0, media: 1, baja: 2 };
    const sorted = [...items].sort((a, b) => {
        if (sortBy === 'urgency') return (urgencyOrder[a.urgency] || 1) - (urgencyOrder[b.urgency] || 1);
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const pendingCount = items.filter(i => !i.is_purchased).length;
    const urgentCount = items.filter(i => i.urgency === 'alta' && !i.is_purchased).length;

    const handleCreate = async () => {
        if (!name.trim()) { Alert.alert('Campo requerido', 'Nombre del producto'); return; }
        setCreating(true);
        try {
            await missingItemsService.create({ productName: name.trim(), size: size.trim() || null, urgency, userId: user.id });
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setName(''); setSize(''); setUrgency('media'); setCreateVisible(false); loadData();
        } catch (e) { Alert.alert('Error', 'No se pudo guardar'); }
        finally { setCreating(false); }
    };

    const handlePurchase = (item) => setConfirmDialog({ visible: true, item });
    const confirmPurchase = async () => {
        const item = confirmDialog.item;
        setConfirmDialog({ visible: false, item: null });
        try {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            await missingItemsService.markAsPurchased(item.id); loadData();
        } catch (e) { Alert.alert('Error', 'No se pudo marcar'); }
    };

    const handleDelete = async (id) => {
        Alert.alert('Eliminar', 'Eliminar este faltante?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); await missingItemsService.delete(id); loadData(); }
                    catch (e) { Alert.alert('Error', 'No se pudo eliminar'); }
                }
            },
        ]);
    };

    if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>;

    return (
        <Animated.View style={[st.container, { opacity: fadeAnim }]}>
            {/* Stats bar */}
            <View style={st.statsBar}>
                <View style={st.statChip}>
                    <Ionicons name="cube-outline" size={16} color={C.accent} />
                    <Text style={st.statText}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</Text>
                </View>
                {urgentCount > 0 && (
                    <View style={[st.statChip, { backgroundColor: C.dangerLight }]}>
                        <Ionicons name="flame-outline" size={16} color={C.danger} />
                        <Text style={[st.statText, { color: C.danger }]}>{urgentCount} urgente{urgentCount !== 1 ? 's' : ''}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={st.sortBtn} onPress={() => setSortBy(sortBy === 'urgency' ? 'date' : 'urgency')} activeOpacity={0.7}>
                    <Ionicons name={sortBy === 'urgency' ? 'funnel-outline' : 'time-outline'} size={16} color={C.textSec} />
                    <Text style={st.sortText}>{sortBy === 'urgency' ? 'Urgencia' : 'Fecha'}</Text>
                </TouchableOpacity>
            </View>

            <FlatList data={sorted} keyExtractor={i => i.id} contentContainerStyle={st.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.accent} />}
                renderItem={({ item }) => (
                    <MissingItemCard item={item} isExpanded={expandedId === item.id}
                        onToggle={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedId(expandedId === item.id ? null : item.id); }}
                        onPurchase={() => handlePurchase(item)} onDelete={() => handleDelete(item.id)} />
                )}
                ListEmptyComponent={
                    <View style={st.emptyBox}>
                        <View style={st.emptyCircle}><Ionicons name="checkmark-done-outline" size={36} color={C.accent} /></View>
                        <Text style={st.emptyTitle}>Todo surtido!</Text>
                        <Text style={st.emptySub}>No hay productos faltantes</Text>
                    </View>
                }
            />

            <TouchableOpacity style={st.fab} onPress={() => setCreateVisible(true)} activeOpacity={0.7}>
                <Ionicons name="add" size={26} color={C.card} />
            </TouchableOpacity>

            {/* Modal crear */}
            <Modal visible={createVisible} transparent animationType="fade">
                <View style={st.overlay}><View style={st.modal}>
                    <Text style={st.mTitle}>Agregar Faltante</Text>

                    <Text style={st.fLabel}>Producto *</Text>
                    <TextInput style={st.input} placeholder="Nombre del producto" placeholderTextColor={C.textMuted} value={name} onChangeText={setName} autoFocus />

                    <Text style={st.fLabel}>Presentacion (opcional)</Text>
                    <TextInput style={st.input} placeholder="Ej: 2.5L, 500g, 6-pack" placeholderTextColor={C.textMuted} value={size} onChangeText={setSize} />

                    <Text style={st.fLabel}>Urgencia</Text>
                    <View style={st.urgencyRow}>
                        {URGENCIES.map(u => (
                            <TouchableOpacity key={u.key} style={[st.urgencyBtn, urgency === u.key && { backgroundColor: u.color, borderColor: u.color }]} onPress={() => setUrgency(u.key)} activeOpacity={0.7}>
                                <Ionicons name={u.icon} size={18} color={urgency === u.key ? C.card : u.color} />
                                <Text style={[st.urgencyLabel, urgency === u.key && { color: C.card }]}>{u.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={st.mBtns}>
                        <TouchableOpacity style={st.mCancel} onPress={() => { setCreateVisible(false); setName(''); setSize(''); setUrgency('media'); }}>
                            <Text style={st.mCancelT}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[st.mConfirm, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
                            {creating ? <ActivityIndicator color={C.card} size="small" /> : <><Ionicons name="add-circle-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Agregar</Text></>}
                        </TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            <ConfirmDialog
                visible={confirmDialog.visible}
                title="Marcar como comprado"
                message={'Confirmas que "' + (confirmDialog.item?.product_name || '') + '" ya fue comprado?'}
                onConfirm={confirmPurchase}
                onCancel={() => setConfirmDialog({ visible: false, item: null })}
            />
        </Animated.View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    statsBar: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center' },
    statChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: R, backgroundColor: C.successLight },
    statText: { fontFamily: FONT.medium, fontSize: 12, color: C.accent },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    sortText: { fontFamily: FONT.medium, fontSize: 11, color: C.textSec },
    list: { padding: 12, paddingBottom: 80 },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
    emptyCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.successLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontFamily: FONT.heavy, fontSize: 20, color: C.text },
    emptySub: { fontFamily: FONT.regular, fontSize: 14, color: C.textSec },
    fab: { position: 'absolute', bottom: 20, right: 16, width: 54, height: 54, borderRadius: 27, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', ...SHADOW },
    overlay: { flex: 1, backgroundColor: 'rgba(60,50,38,0.5)', justifyContent: 'center', padding: 16 },
    modal: { backgroundColor: C.card, borderRadius: R, padding: 20, ...SHADOW },
    mTitle: { fontFamily: FONT.heavy, fontSize: 18, color: C.text, marginBottom: 4 },
    fLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: FONT.regular, fontSize: 14 },
    urgencyRow: { flexDirection: 'row', gap: 8 },
    urgencyBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: R, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
    urgencyLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.text },
    mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 10 },
    mCancel: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: R, borderWidth: 1, borderColor: C.border },
    mCancelT: { fontFamily: FONT.medium, color: C.textSec },
    mConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: R, backgroundColor: C.accent },
    mConfirmT: { fontFamily: FONT.bold, color: C.card },
});

export default MissingItemsScreen;
