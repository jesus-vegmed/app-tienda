/**
 * Pantalla de Importes - Estilo Sketch/Bone
 * Buscador solo por cliente, cobro sin codigo con alerta de seguridad 2s
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert, RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import importesService from '../services/importesService';
import ImporteCard from '../components/ImporteCard';
import { formatCurrency } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const FILTERS = [
    { key: null, label: 'Todos' },
    { key: 'activo', label: 'Activos' },
    { key: 'vencido', label: 'Vencidos' },
    { key: 'cobrado', label: 'Cobrados' },
];

const PRESET_PRODUCTS = [
    { name: 'Coca-Cola 2.5L', price: 10 },
    { name: 'Coca-Cola 2L', price: 8 },
    { name: 'Coca-Cola 1.5L', price: 6 },
    { name: 'Coca-Cola 600ml', price: 3 },
    { name: 'Fanta 2.5L', price: 10 },
    { name: 'Fanta 2L', price: 8 },
    { name: 'Sprite 2.5L', price: 10 },
    { name: 'Cerveza envase', price: 5 },
    { name: 'Agua garafon', price: 15 },
];

const ImportesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [importes, setImportes] = useState([]);
    const [filter, setFilter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [chargeModalVisible, setChargeModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [chargeCode, setChargeCode] = useState('');
    const [clientName, setClientName] = useState('');
    const [newItems, setNewItems] = useState([]);
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [charging, setCharging] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Cobro sin codigo
    const [noCodeTimer, setNoCodeTimer] = useState(0);
    const [noCodeAccepted, setNoCodeAccepted] = useState(false);
    const timerRef = useRef(null);

    const loadData = useCallback(async () => {
        try { const data = await importesService.list(filter); setImportes(data); }
        catch (e) { console.log('[IMPORTES] ' + e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, [filter]);

    useEffect(() => { loadData(); }, [loadData]);

    // Buscador solo por cliente
    const filtered = searchText.trim()
        ? importes.filter(i => (i.client_name || '').toLowerCase().includes(searchText.toLowerCase()))
        : importes;

    const handleCharge = async () => {
        const code = chargeCode.trim();
        if (!code) { Alert.alert('Campo requerido', 'Ingresa el codigo'); return; }
        if (code.length !== 6) { Alert.alert('Codigo invalido', 'Debe ser de 6 caracteres'); return; }
        setCharging(true);
        try {
            const result = await importesService.charge(code);
            if (result) { Alert.alert('Cobrado', 'Importe ' + result.code + ' marcado como cobrado'); resetChargeModal(); loadData(); }
            else { Alert.alert('No encontrado', 'No hay un importe activo con ese codigo'); }
        } catch (e) { Alert.alert('Error', 'No se pudo cobrar'); }
        finally { setCharging(false); }
    };

    // Cobro sin codigo
    const startNoCodeTimer = () => {
        setNoCodeTimer(2);
        timerRef.current = setInterval(() => {
            setNoCodeTimer(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); setNoCodeAccepted(true); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChargeWithoutCode = () => {
        // Buscar por nombre de cliente los importes activos
        const clientImportes = importes.filter(i => i.status === 'activo' && i.client_name);
        if (clientImportes.length === 0) { Alert.alert('Sin importes', 'No hay importes activos para cobrar'); return; }

        // Mostrar selector de cliente
        const options = clientImportes.map(i => ({
            text: (i.client_name || 'Sin nombre') + ' - ' + formatCurrency(i.total) + ' (' + i.code + ')',
            onPress: () => {
                Alert.alert('Confirmar cobro', 'Cobrar importe de ' + i.client_name + ' por ' + formatCurrency(i.total) + '?', [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Cobrar', onPress: async () => {
                            try {
                                await importesService.charge(i.code);
                                Alert.alert('Cobrado', 'Importe cobrado correctamente');
                                loadData();
                            } catch (e) { Alert.alert('Error', 'No se pudo cobrar'); }
                        }
                    },
                ]);
            },
        }));
        options.push({ text: 'Cancelar', style: 'cancel' });
        Alert.alert('Seleccionar importe', 'Elige el importe a cobrar sin codigo', options);
    };

    const resetChargeModal = () => {
        setChargeModalVisible(false); setChargeCode('');
        setNoCodeTimer(0); setNoCodeAccepted(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const addPreset = (product) => {
        const existing = newItems.findIndex(i => i.product_name === product.name);
        if (existing >= 0) { const u = [...newItems]; u[existing].quantity += 1; setNewItems(u); }
        else { setNewItems([...newItems, { product_name: product.name, price: product.price, quantity: 1 }]); }
    };

    const addCustomProduct = () => {
        if (!customName.trim()) { Alert.alert('Error', 'Nombre requerido'); return; }
        const price = parseFloat(customPrice);
        if (!customPrice.trim() || isNaN(price) || price <= 0) { Alert.alert('Error', 'Precio invalido'); return; }
        setNewItems([...newItems, { product_name: customName.trim(), price, quantity: 1 }]);
        setCustomName(''); setCustomPrice('');
    };

    const changeQty = (index, delta) => {
        const u = [...newItems]; u[index].quantity += delta;
        if (u[index].quantity <= 0) u.splice(index, 1);
        setNewItems(u);
    };

    const handleCreate = async () => {
        if (!clientName.trim()) { Alert.alert('Campo requerido', 'Nombre del cliente'); return; }
        if (newItems.length === 0) { Alert.alert('Sin productos', 'Agrega al menos un producto'); return; }
        try {
            const result = await importesService.create({ items: newItems, clientName: clientName.trim(), userId: user.id });
            Alert.alert('Importe Creado', 'Codigo: ' + result.code + '\nCliente: ' + clientName.trim());
            setNewItems([]); setClientName(''); setCreateModalVisible(false); loadData();
        } catch (e) { Alert.alert('Error', 'No se pudo crear'); }
    };

    const total = newItems.reduce((s, i) => s + i.price * i.quantity, 0);

    if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>;

    return (
        <View style={st.container}>
            {/* Buscador solo por cliente */}
            <View style={st.searchBox}>
                <Ionicons name="person-outline" size={18} color={C.textMuted} />
                <TextInput style={st.searchInput} placeholder="Buscar por nombre de cliente..." placeholderTextColor={C.textMuted} value={searchText} onChangeText={setSearchText} />
                {searchText !== '' && <TouchableOpacity onPress={() => setSearchText('')}><Ionicons name="close-circle" size={18} color={C.textMuted} /></TouchableOpacity>}
            </View>

            {/* Filtros */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filtersScroll} contentContainerStyle={st.filters}>
                {FILTERS.map(f => (
                    <TouchableOpacity key={String(f.key)} style={[st.filterBtn, filter === f.key && st.filterBtnActive]} onPress={() => setFilter(f.key)} activeOpacity={0.7}>
                        <Text style={[st.filterText, filter === f.key && st.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
                <View style={st.filterCount}><Text style={st.filterCountText}>{filtered.length}</Text></View>
            </ScrollView>

            <FlatList data={filtered} keyExtractor={i => i.id}
                renderItem={({ item }) => <ImporteCard importe={item} onPress={() => navigation.navigate('ImporteDetail', { id: item.id })} />}
                contentContainerStyle={st.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.accent} />}
                ListEmptyComponent={<View style={st.emptyBox}><Ionicons name="receipt-outline" size={40} color={C.textMuted} /><Text style={st.emptyTitle}>Sin importes</Text></View>}
            />

            <View style={st.fabGroup}>
                <TouchableOpacity style={st.fabSec} onPress={() => setChargeModalVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="barcode-outline" size={20} color={C.card} />
                </TouchableOpacity>
                <TouchableOpacity style={st.fab} onPress={() => setCreateModalVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="add" size={26} color={C.card} />
                </TouchableOpacity>
            </View>

            {/* Modal cobro */}
            <Modal visible={chargeModalVisible} transparent animationType="fade">
                <View style={st.overlay}><View style={st.modal}>
                    <Text style={st.mTitle}>Cobrar Importe</Text>
                    <Text style={st.mDesc}>Ingresa el codigo de 6 caracteres</Text>
                    <TextInput style={st.codeInput} placeholder="A B C 1 2 3" placeholderTextColor={C.textMuted} value={chargeCode} onChangeText={t => setChargeCode(t.toUpperCase())} autoCapitalize="characters" maxLength={6} autoFocus />

                    {/* Cobrar sin codigo */}
                    <View style={st.noCodeSection}>
                        {!noCodeAccepted && noCodeTimer === 0 && (
                            <TouchableOpacity style={st.noCodeBtn} onPress={startNoCodeTimer} activeOpacity={0.7}>
                                <Ionicons name="warning-outline" size={16} color={C.warning} />
                                <Text style={st.noCodeBtnText}>Cobrar sin codigo</Text>
                            </TouchableOpacity>
                        )}
                        {noCodeTimer > 0 && (
                            <View style={st.noCodeAlert}>
                                <Ionicons name="alert-circle" size={18} color={C.warning} />
                                <View style={{ flex: 1 }}>
                                    <Text style={st.noCodeAlertTitle}>Solo en caso de emergencia o cliente recurrente</Text>
                                    <Text style={st.noCodeAlertTimer}>Desbloqueando en {noCodeTimer}s...</Text>
                                </View>
                            </View>
                        )}
                        {noCodeAccepted && (
                            <TouchableOpacity style={[st.noCodeConfirmBtn]} onPress={handleChargeWithoutCode} activeOpacity={0.7}>
                                <Ionicons name="checkmark-circle" size={16} color={C.card} />
                                <Text style={st.noCodeConfirmText}>Seleccionar importe a cobrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={st.mBtns}>
                        <TouchableOpacity style={st.mCancel} onPress={resetChargeModal}><Text style={st.mCancelT}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[st.mConfirm, charging && { opacity: 0.6 }]} onPress={handleCharge} disabled={charging}>
                            {charging ? <ActivityIndicator color={C.card} size="small" /> : <><Ionicons name="cash-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Cobrar</Text></>}
                        </TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            {/* Modal creacion */}
            <Modal visible={createModalVisible} transparent animationType="slide">
                <View style={st.overlay}><View style={[st.modal, { maxHeight: '85%' }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={st.mTitle}>Nuevo Importe</Text>
                        <Text style={st.fLabel}>Cliente *</Text>
                        <TextInput style={st.input} placeholder="Nombre del cliente" placeholderTextColor={C.textMuted} value={clientName} onChangeText={setClientName} />
                        <Text style={st.fLabel}>Productos rapidos</Text>
                        <View style={st.presets}>
                            {PRESET_PRODUCTS.map((p, i) => (
                                <TouchableOpacity key={i} style={st.presetChip} onPress={() => addPreset(p)} activeOpacity={0.6}>
                                    <Text style={st.presetName} numberOfLines={1}>{p.name}</Text>
                                    <Text style={st.presetPrice}>{formatCurrency(p.price)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={st.fLabel}>Producto personalizado</Text>
                        <View style={st.customRow}>
                            <TextInput style={[st.input, { flex: 1 }]} placeholder="Producto" placeholderTextColor={C.textMuted} value={customName} onChangeText={setCustomName} />
                            <TextInput style={[st.input, { width: 75, marginLeft: 8 }]} placeholder="$" placeholderTextColor={C.textMuted} value={customPrice} onChangeText={setCustomPrice} keyboardType="decimal-pad" />
                            <TouchableOpacity style={st.addBtn} onPress={addCustomProduct}><Ionicons name="add" size={20} color={C.card} /></TouchableOpacity>
                        </View>
                        {newItems.length > 0 && (
                            <View style={st.itemsSection}>
                                <Text style={st.fLabel}>Productos ({newItems.length})</Text>
                                {newItems.map((item, index) => (
                                    <View key={index} style={st.itemRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={st.itemName} numberOfLines={1}>{item.product_name}</Text>
                                            <Text style={st.itemUnit}>{formatCurrency(item.price)} c/u</Text>
                                        </View>
                                        <View style={st.qtyControls}>
                                            <TouchableOpacity style={st.qtyBtn} onPress={() => changeQty(index, -1)}><Ionicons name="remove" size={14} color={C.text} /></TouchableOpacity>
                                            <Text style={st.qtyText}>{item.quantity}</Text>
                                            <TouchableOpacity style={[st.qtyBtn, { backgroundColor: C.accent, borderColor: C.accent }]} onPress={() => changeQty(index, 1)}><Ionicons name="add" size={14} color={C.card} /></TouchableOpacity>
                                        </View>
                                        <Text style={st.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                                        <TouchableOpacity onPress={() => setNewItems(newItems.filter((_, i) => i !== index))} style={{ padding: 4 }}><Ionicons name="close-circle" size={18} color={C.danger} /></TouchableOpacity>
                                    </View>
                                ))}
                                <View style={st.totalRow}><Text style={st.totalLabel}>Total</Text><Text style={st.totalValue}>{formatCurrency(total)}</Text></View>
                            </View>
                        )}
                    </ScrollView>
                    <View style={st.mBtns}>
                        <TouchableOpacity style={st.mCancel} onPress={() => { setCreateModalVisible(false); setNewItems([]); setClientName(''); }}><Text style={st.mCancelT}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={st.mConfirm} onPress={handleCreate}><Ionicons name="receipt-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Crear</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, margin: 12, marginBottom: 0, borderRadius: R, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8, ...SHADOW },
    searchInput: { flex: 1, fontFamily: FONT.regular, fontSize: 14, color: C.text, padding: 0 },
    filtersScroll: { maxHeight: 50 },
    filters: { padding: 12, gap: 6, alignItems: 'center' },
    filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    filterBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
    filterText: { fontFamily: FONT.medium, fontSize: 12, color: C.textSec },
    filterTextActive: { color: C.card },
    filterCount: { marginLeft: 4, backgroundColor: C.cardAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R },
    filterCountText: { fontFamily: FONT.bold, color: C.textSec, fontSize: 12 },
    list: { padding: 12, paddingBottom: 100 },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
    emptyTitle: { fontFamily: FONT.bold, fontSize: 16, color: C.textSec },
    fabGroup: { position: 'absolute', bottom: 20, right: 16, gap: 10 },
    fabSec: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.warm, justifyContent: 'center', alignItems: 'center', ...SHADOW },
    fab: { width: 54, height: 54, borderRadius: 27, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', ...SHADOW },
    overlay: { flex: 1, backgroundColor: 'rgba(60,50,38,0.5)', justifyContent: 'center', padding: 16 },
    modal: { backgroundColor: C.card, borderRadius: R, padding: 20, ...SHADOW },
    mTitle: { fontFamily: FONT.heavy, fontSize: 18, color: C.text, marginBottom: 4 },
    mDesc: { fontFamily: FONT.regular, fontSize: 13, color: C.textSec, marginBottom: 16 },
    codeInput: { backgroundColor: C.cardAlt, borderRadius: R, borderWidth: 1, borderColor: C.border, padding: 16, color: C.text, fontFamily: FONT.heavy, fontSize: 24, letterSpacing: 8, textAlign: 'center' },
    noCodeSection: { marginTop: 14 },
    noCodeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: R, borderWidth: 1, borderColor: C.warning, borderStyle: 'dashed' },
    noCodeBtnText: { fontFamily: FONT.medium, color: C.warning, fontSize: 13 },
    noCodeAlert: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.warningLight, borderRadius: R, padding: 12, borderWidth: 1, borderColor: C.warning },
    noCodeAlertTitle: { fontFamily: FONT.bold, fontSize: 12, color: C.warning },
    noCodeAlertTimer: { fontFamily: FONT.regular, fontSize: 11, color: C.textSec, marginTop: 2 },
    noCodeConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: R, backgroundColor: C.warning },
    noCodeConfirmText: { fontFamily: FONT.bold, color: C.card, fontSize: 13 },
    fLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: FONT.regular, fontSize: 14 },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    presetChip: { backgroundColor: C.cardAlt, paddingHorizontal: 10, paddingVertical: 8, borderRadius: R - 4, borderWidth: 1, borderColor: C.border },
    presetName: { fontFamily: FONT.medium, color: C.text, fontSize: 12 },
    presetPrice: { fontFamily: FONT.bold, color: C.accent, fontSize: 11, marginTop: 1 },
    customRow: { flexDirection: 'row', alignItems: 'center' },
    addBtn: { marginLeft: 8, backgroundColor: C.accent, width: 44, height: 44, borderRadius: R - 4, justifyContent: 'center', alignItems: 'center' },
    itemsSection: { marginTop: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 8 },
    itemName: { fontFamily: FONT.medium, color: C.text, fontSize: 13 },
    itemUnit: { fontFamily: FONT.regular, color: C.textSec, fontSize: 11 },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.cardAlt, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontFamily: FONT.bold, color: C.text, fontSize: 14, minWidth: 20, textAlign: 'center' },
    itemTotal: { fontFamily: FONT.bold, color: C.accent, fontSize: 14, minWidth: 55, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 2, borderTopColor: C.accent, marginTop: 8 },
    totalLabel: { fontFamily: FONT.bold, fontSize: 16, color: C.text },
    totalValue: { fontFamily: FONT.heavy, fontSize: 18, color: C.accent },
    mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
    mCancel: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: R, borderWidth: 1, borderColor: C.border },
    mCancelT: { fontFamily: FONT.medium, color: C.textSec },
    mConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: R, backgroundColor: C.accent },
    mConfirmT: { fontFamily: FONT.bold, color: C.card },
});

export default ImportesScreen;
