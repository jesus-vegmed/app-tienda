/**
 * Pantalla de Proveedores - Reescrita completamente
 * Repetitivo: cantidad + nota -> agregar entregas -> cerrar con monto + ticket
 * Unico: monto + nota + ticket (alerta 3s si no hay ticket)
 * Buscador + filtro por dias
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Alert, RefreshControl, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import suppliersService from '../services/suppliersService';
import { formatCurrency, formatDate } from '../utils/dateHelpers';
import { C, R, FONT, SHADOW } from '../utils/theme';

const DAY_FILTERS = [
    { key: null, label: 'Todos' },
    { key: 7, label: '7 dias' },
    { key: 15, label: '15 dias' },
    { key: 30, label: '30 dias' },
];

const SuppliersScreen = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [showClosed, setShowClosed] = useState(false);
    const [daysFilter, setDaysFilter] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Modal crear
    const [createVisible, setCreateVisible] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [supplierType, setSupplierType] = useState('repetitivo');
    const [amount, setAmount] = useState('');
    const [quantity, setQuantity] = useState('');
    const [entryNotes, setEntryNotes] = useState('');
    const [ticketImage, setTicketImage] = useState(null);
    const [creating, setCreating] = useState(false);
    const [noTicketAccepted, setNoTicketAccepted] = useState(false);
    const [noTicketTimer, setNoTicketTimer] = useState(0);
    const timerRef = useRef(null);

    // Modal agregar entrega (repetitivo)
    const [deliveryModal, setDeliveryModal] = useState({ visible: false, entry: null });
    const [deliveryQty, setDeliveryQty] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');

    // Modal cerrar repetitivo
    const [closeModal, setCloseModal] = useState({ visible: false, entry: null });
    const [closeAmount, setCloseAmount] = useState('');
    const [closeTicket, setCloseTicket] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const data = await suppliersService.listEntries({
                showClosed, daysBack: daysFilter, search: searchText,
            });
            setEntries(data);
        } catch (e) { console.log('[PROVEEDORES] ' + e.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, [showClosed, daysFilter, searchText]);

    useEffect(() => { loadData(); }, [loadData]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
            if (!result.canceled && result.assets?.length > 0) return result.assets[0].uri;
        } catch (e) {
            try {
                const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
                if (!result.canceled && result.assets?.length > 0) return result.assets[0].uri;
            } catch (e2) { }
        }
        return null;
    };

    // === CREAR ENTRADA ===
    const startNoTicketTimer = () => {
        setNoTicketTimer(3);
        timerRef.current = setInterval(() => {
            setNoTicketTimer(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); setNoTicketAccepted(true); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const resetCreate = () => {
        setCreateVisible(false); setSupplierName(''); setSupplierType('repetitivo');
        setAmount(''); setQuantity(''); setEntryNotes(''); setTicketImage(null);
        setNoTicketAccepted(false); setNoTicketTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleCreate = async () => {
        if (!supplierName.trim()) { Alert.alert('Campo requerido', 'Nombre del proveedor'); return; }

        if (supplierType === 'repetitivo') {
            if (!quantity.trim()) { Alert.alert('Campo requerido', 'Cantidad de productos'); return; }
            const qtyNum = parseInt(quantity, 10);
            if (isNaN(qtyNum) || qtyNum <= 0) { Alert.alert('Valor invalido', 'Ingresa una cantidad valida'); return; }

            // Confirmacion
            Alert.alert('Confirmar registro', 'Registrar entrada de "' + supplierName.trim() + '" con ' + qtyNum + ' productos?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar', onPress: async () => {
                        setCreating(true);
                        try {
                            await suppliersService.createEntry({
                                supplierName: supplierName.trim(), type: 'repetitivo',
                                quantity: qtyNum, notes: entryNotes.trim() || null, userId: user.id,
                            });
                            resetCreate(); loadData();
                        } catch (e) { Alert.alert('Error', 'No se pudo registrar'); }
                        finally { setCreating(false); }
                    }
                },
            ]);
        } else {
            // Unico
            if (!amount.trim()) { Alert.alert('Campo requerido', 'Monto total'); return; }
            const amtNum = parseFloat(amount);
            if (isNaN(amtNum) || amtNum <= 0) { Alert.alert('Monto invalido', 'Ingresa un monto valido'); return; }

            // Si no hay ticket, alerta 3 segundos
            if (!ticketImage && !noTicketAccepted) {
                startNoTicketTimer();
                return;
            }

            // Confirmacion
            Alert.alert('Confirmar registro',
                'Registrar entrada unica de "' + supplierName.trim() + '" por ' + formatCurrency(amtNum) + (ticketImage ? ' con ticket' : ' SIN ticket') + '?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Confirmar', onPress: async () => {
                            setCreating(true);
                            try {
                                await suppliersService.createEntry({
                                    supplierName: supplierName.trim(), type: 'unico', amount: amtNum,
                                    notes: entryNotes.trim() || null, ticketUri: ticketImage, userId: user.id,
                                });
                                resetCreate(); loadData();
                            } catch (e) { Alert.alert('Error', 'No se pudo registrar'); }
                            finally { setCreating(false); }
                        }
                    },
                ]);
        }
    };

    // === AGREGAR ENTREGA (repetitivo) ===
    const handleAddDelivery = async () => {
        if (!deliveryQty.trim()) { Alert.alert('Campo requerido', 'Cantidad de productos'); return; }
        const qty = parseInt(deliveryQty, 10);
        if (isNaN(qty) || qty <= 0) { Alert.alert('Valor invalido', 'Cantidad positiva'); return; }

        Alert.alert('Confirmar entrega', 'Agregar ' + qty + ' productos a esta entrada?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Confirmar', onPress: async () => {
                    try {
                        await suppliersService.addDelivery({
                            entryId: deliveryModal.entry.id, quantity: qty,
                            notes: deliveryNotes.trim() || null,
                            userId: user.id, userName: user.username,
                        });
                        setDeliveryModal({ visible: false, entry: null }); setDeliveryQty(''); setDeliveryNotes('');
                        loadData();
                    } catch (e) { Alert.alert('Error', 'No se pudo registrar'); }
                }
            },
        ]);
    };

    // === CERRAR REPETITIVO ===
    const openCloseModal = (entry) => {
        setCloseModal({ visible: true, entry });
        setCloseAmount(''); setCloseTicket(null);
    };

    const handleCloseEntry = async () => {
        if (!closeAmount.trim()) { Alert.alert('Campo requerido', 'Monto total'); return; }
        const amt = parseFloat(closeAmount);
        if (isNaN(amt) || amt <= 0) { Alert.alert('Monto invalido', 'Ingresa un monto valido'); return; }

        const entry = closeModal.entry;
        const totalProducts = (entry.quantity || 0) + ((entry.deliveries || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0));

        Alert.alert('Cerrar entrada',
            'Cerrar "' + entry.supplier_name + '"?\n\nTotal entregas: ' + totalProducts + ' productos\nMonto total: ' + formatCurrency(amt) + (closeTicket ? '\nTicket: adjunto' : '\nTicket: sin adjuntar') + '\n\nEsta accion no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar', style: 'destructive', onPress: async () => {
                        try {
                            await suppliersService.closeEntry(entry.id, amt, !!closeTicket);
                            setCloseModal({ visible: false, entry: null }); setExpandedId(null); loadData();
                        } catch (e) { Alert.alert('Error', 'No se pudo cerrar'); }
                    }
                },
            ]);
    };

    if (loading) return <View style={st.center}><ActivityIndicator size="large" color={C.accent} /></View>;

    return (
        <View style={st.container}>
            {/* Buscador */}
            <View style={st.searchBox}>
                <Ionicons name="search-outline" size={18} color={C.textMuted} />
                <TextInput style={st.searchInput} placeholder="Buscar proveedor..." placeholderTextColor={C.textMuted} value={searchText} onChangeText={setSearchText} />
                {searchText !== '' && <TouchableOpacity onPress={() => setSearchText('')}><Ionicons name="close-circle" size={18} color={C.textMuted} /></TouchableOpacity>}
            </View>

            {/* Filtros */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtersRow}>
                <TouchableOpacity style={[st.filterBtn, !showClosed && st.filterActive]} onPress={() => setShowClosed(false)} activeOpacity={0.7}>
                    <Text style={[st.filterText, !showClosed && st.filterActiveText]}>Abiertos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.filterBtn, showClosed && st.filterActive]} onPress={() => setShowClosed(true)} activeOpacity={0.7}>
                    <Text style={[st.filterText, showClosed && st.filterActiveText]}>Cerrados</Text>
                </TouchableOpacity>
                <View style={st.filterSep} />
                {DAY_FILTERS.map(f => (
                    <TouchableOpacity key={String(f.key)} style={[st.filterBtn, daysFilter === f.key && st.filterActive]} onPress={() => setDaysFilter(f.key)} activeOpacity={0.7}>
                        <Text style={[st.filterText, daysFilter === f.key && st.filterActiveText]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
                <View style={st.countBadge}><Text style={st.countText}>{entries.length}</Text></View>
            </ScrollView>

            {/* Lista */}
            <FlatList data={entries} keyExtractor={i => i.id} contentContainerStyle={st.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.accent} />}
                renderItem={({ item }) => {
                    const isExp = expandedId === item.id;
                    const isRepetitivo = item.supplier_type === 'repetitivo';
                    const totalProducts = (item.quantity || 0) + ((item.deliveries || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0));

                    return (
                        <TouchableOpacity style={[st.card, item.is_closed && st.cardClosed]} onPress={() => setExpandedId(isExp ? null : item.id)} activeOpacity={0.7}>
                            <View style={st.cardHeader}>
                                <View style={st.cardTitleRow}>
                                    <View style={[st.typePill, { backgroundColor: isRepetitivo ? C.infoLight : C.warmLight }]}>
                                        <Ionicons name={isRepetitivo ? 'repeat-outline' : 'arrow-forward-outline'} size={12} color={isRepetitivo ? C.info : C.warm} />
                                        <Text style={[st.typeText, { color: isRepetitivo ? C.info : C.warm }]}>{isRepetitivo ? 'Repetitivo' : 'Unico'}</Text>
                                    </View>
                                    {item.is_closed && <View style={st.closedBadge}><Ionicons name="lock-closed" size={10} color={C.textMuted} /><Text style={st.closedText}>Cerrado</Text></View>}
                                </View>
                                <Text style={st.cardDate}>{formatDate(item.created_at)}</Text>
                            </View>

                            <Text style={st.cardName}>{item.supplier_name}</Text>

                            <View style={st.statsRow}>
                                {isRepetitivo && (
                                    <View style={st.stat}><Text style={st.statLabel}>Productos</Text><Text style={st.statValue}>{totalProducts}</Text></View>
                                )}
                                {item.amount != null && (
                                    <View style={st.stat}><Text style={st.statLabel}>Monto</Text><Text style={[st.statValue, { color: C.accent }]}>{formatCurrency(item.amount)}</Text></View>
                                )}
                                {isRepetitivo && (item.deliveries || []).length > 0 && (
                                    <View style={st.stat}><Text style={st.statLabel}>Entregas</Text><Text style={st.statValue}>{(item.deliveries || []).length + 1}</Text></View>
                                )}
                                {item.has_ticket === 1 && (
                                    <View style={[st.stat, { alignItems: 'center' }]}><Ionicons name="camera" size={14} color={C.accent} /><Text style={[st.statLabel, { marginTop: 2 }]}>Ticket</Text></View>
                                )}
                            </View>

                            {item.notes ? <Text style={st.notes}>{item.notes}</Text> : null}

                            {isExp && (
                                <View style={st.expanded}>
                                    {/* Entregas parciales */}
                                    {isRepetitivo && (item.deliveries || []).length > 0 && (
                                        <View style={st.delSection}>
                                            <Text style={st.sectionLabel}>Historial de entregas</Text>
                                            <View style={st.delItem}>
                                                <Text style={st.delUser}>Registro inicial</Text>
                                                <Text style={st.delQty}>{item.quantity || 0} productos</Text>
                                                <Text style={st.delDate}>{formatDate(item.created_at)}</Text>
                                            </View>
                                            {item.deliveries.map((d, i) => (
                                                <View key={d.id || i} style={st.delItem}>
                                                    <Text style={st.delUser}>{d.user_name || 'Cajero'}</Text>
                                                    <Text style={st.delQty}>{d.amount} productos</Text>
                                                    <Text style={st.delDate}>{formatDate(d.created_at)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Acciones */}
                                    {!item.is_closed && isRepetitivo && (
                                        <View style={st.actions}>
                                            <TouchableOpacity style={st.actionBtn} onPress={() => { setDeliveryModal({ visible: true, entry: item }); setDeliveryQty(''); setDeliveryNotes(''); }} activeOpacity={0.7}>
                                                <Ionicons name="add-circle-outline" size={16} color={C.accent} />
                                                <Text style={st.actionText}>Agregar entrega</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[st.actionBtn, { borderColor: C.warm }]} onPress={() => openCloseModal(item)} activeOpacity={0.7}>
                                                <Ionicons name="lock-closed-outline" size={16} color={C.warm} />
                                                <Text style={[st.actionText, { color: C.warm }]}>Cerrar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={<View style={st.emptyBox}><Ionicons name="cube-outline" size={40} color={C.textMuted} /><Text style={st.emptyTitle}>Sin entradas</Text><Text style={st.emptySub}>Registra una nueva entrada de proveedor</Text></View>}
            />

            {/* FAB */}
            <TouchableOpacity style={st.fab} onPress={() => setCreateVisible(true)} activeOpacity={0.7}>
                <Ionicons name="add" size={26} color={C.card} />
            </TouchableOpacity>

            {/* ========= MODAL CREAR ========= */}
            <Modal visible={createVisible} transparent animationType="fade">
                <View style={st.overlay}><ScrollView contentContainerStyle={st.modalScroll}>
                    <View style={st.modal}>
                        <Text style={st.mTitle}>Nueva Entrada</Text>

                        <Text style={st.fLabel}>Nombre del proveedor *</Text>
                        <TextInput style={st.input} placeholder="Ej: Coca-Cola, Bimbo" placeholderTextColor={C.textMuted} value={supplierName} onChangeText={setSupplierName} />

                        <Text style={st.fLabel}>Tipo</Text>
                        <View style={st.typeRow}>
                            {[{ key: 'repetitivo', icon: 'repeat-outline', label: 'Repetitivo', desc: 'Varias entregas' }, { key: 'unico', icon: 'arrow-forward-outline', label: 'Unico', desc: 'Una sola entrega' }].map(t => (
                                <TouchableOpacity key={t.key} style={[st.typeBtn, supplierType === t.key && st.typeBtnActive]} onPress={() => { setSupplierType(t.key); setNoTicketAccepted(false); setNoTicketTimer(0); if (timerRef.current) clearInterval(timerRef.current); }} activeOpacity={0.7}>
                                    <Ionicons name={t.icon} size={20} color={supplierType === t.key ? C.card : C.textSec} />
                                    <Text style={[st.typeLabel, supplierType === t.key && { color: C.card }]}>{t.label}</Text>
                                    <Text style={[st.typeDesc, supplierType === t.key && { color: C.card, opacity: 0.8 }]}>{t.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {supplierType === 'repetitivo' ? (
                            <>
                                <Text style={st.fLabel}>Cantidad de productos *</Text>
                                <TextInput style={st.input} placeholder="Ej: 24" placeholderTextColor={C.textMuted} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
                                <Text style={st.fLabel}>Notas (opcional)</Text>
                                <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Detalles de la entrega..." placeholderTextColor={C.textMuted} value={entryNotes} onChangeText={setEntryNotes} multiline />
                            </>
                        ) : (
                            <>
                                <Text style={st.fLabel}>Monto total *</Text>
                                <TextInput style={st.input} placeholder="0.00" placeholderTextColor={C.textMuted} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                                <Text style={st.fLabel}>Notas (opcional)</Text>
                                <TextInput style={[st.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Detalles..." placeholderTextColor={C.textMuted} value={entryNotes} onChangeText={setEntryNotes} multiline />

                                <Text style={st.fLabel}>Ticket (opcional)</Text>
                                <TouchableOpacity style={st.ticketBtn} onPress={async () => { const uri = await pickImage(); if (uri) { setTicketImage(uri); setNoTicketAccepted(false); setNoTicketTimer(0); if (timerRef.current) clearInterval(timerRef.current); } }} activeOpacity={0.7}>
                                    <Ionicons name={ticketImage ? 'checkmark-circle' : 'camera-outline'} size={20} color={ticketImage ? C.accent : C.textSec} />
                                    <Text style={[st.ticketBtnText, ticketImage && { color: C.accent }]}>{ticketImage ? 'Ticket adjunto' : 'Tomar/seleccionar foto'}</Text>
                                </TouchableOpacity>

                                {/* Alerta 3 segundos sin ticket */}
                                {!ticketImage && noTicketTimer > 0 && (
                                    <View style={st.warningBox}>
                                        <Ionicons name="warning-outline" size={20} color={C.warning} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={st.warningTitle}>No se adjunta ticket</Text>
                                            <Text style={st.warningDesc}>Aceptar sin ticket se desbloquea en {noTicketTimer}s...</Text>
                                        </View>
                                    </View>
                                )}
                                {!ticketImage && noTicketAccepted && (
                                    <View style={[st.warningBox, { backgroundColor: C.warningLight, borderColor: C.warning }]}>
                                        <Ionicons name="alert-circle" size={18} color={C.warning} />
                                        <Text style={[st.warningTitle, { color: C.warning }]}>Registro SIN ticket aceptado</Text>
                                    </View>
                                )}
                            </>
                        )}

                        <View style={st.mBtns}>
                            <TouchableOpacity style={st.mCancel} onPress={resetCreate}><Text style={st.mCancelT}>Cancelar</Text></TouchableOpacity>
                            <TouchableOpacity style={[st.mConfirm, creating && { opacity: 0.6 }, (supplierType === 'unico' && !ticketImage && !noTicketAccepted) && { opacity: 0.5 }]}
                                onPress={handleCreate} disabled={creating || (supplierType === 'unico' && !ticketImage && !noTicketAccepted)} activeOpacity={0.7}>
                                {creating ? <ActivityIndicator color={C.card} size="small" /> : <><Ionicons name="save-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Registrar</Text></>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView></View>
            </Modal>

            {/* ========= MODAL AGREGAR ENTREGA ========= */}
            <Modal visible={deliveryModal.visible} transparent animationType="fade">
                <View style={st.overlay}><View style={st.modal}>
                    <Text style={st.mTitle}>Agregar Entrega</Text>
                    <Text style={st.mSubtitle}>{deliveryModal.entry?.supplier_name}</Text>
                    <Text style={st.fLabel}>Cantidad de productos *</Text>
                    <TextInput style={st.input} placeholder="Ej: 12" placeholderTextColor={C.textMuted} value={deliveryQty} onChangeText={setDeliveryQty} keyboardType="number-pad" autoFocus />
                    <Text style={st.fLabel}>Notas (opcional)</Text>
                    <TextInput style={[st.input, { minHeight: 50, textAlignVertical: 'top' }]} placeholder="Detalles..." placeholderTextColor={C.textMuted} value={deliveryNotes} onChangeText={setDeliveryNotes} multiline />
                    <Text style={st.receiveInfo}><Ionicons name="person-outline" size={12} color={C.textSec} /> Recibe: {user?.username}</Text>
                    <View style={st.mBtns}>
                        <TouchableOpacity style={st.mCancel} onPress={() => setDeliveryModal({ visible: false, entry: null })}><Text style={st.mCancelT}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={st.mConfirm} onPress={handleAddDelivery}><Ionicons name="add-circle-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Agregar</Text></TouchableOpacity>
                    </View>
                </View></View>
            </Modal>

            {/* ========= MODAL CERRAR REPETITIVO ========= */}
            <Modal visible={closeModal.visible} transparent animationType="fade">
                <View style={st.overlay}><ScrollView contentContainerStyle={st.modalScroll}><View style={st.modal}>
                    <Text style={st.mTitle}>Cerrar Entrada</Text>
                    <Text style={st.mSubtitle}>{closeModal.entry?.supplier_name}</Text>

                    {/* Resumen */}
                    {closeModal.entry && (() => {
                        const e = closeModal.entry;
                        const totalP = (e.quantity || 0) + ((e.deliveries || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0));
                        return (
                            <View style={st.summaryCard}>
                                <Text style={st.summaryTitle}>Resumen de entregas</Text>
                                <View style={st.summaryItem}><Text style={st.summaryL}>Registro inicial</Text><Text style={st.summaryV}>{e.quantity || 0} productos</Text></View>
                                {(e.deliveries || []).map((d, i) => (
                                    <View key={i} style={st.summaryItem}>
                                        <Text style={st.summaryL}>{d.user_name || 'Cajero'} - {formatDate(d.created_at)}</Text>
                                        <Text style={st.summaryV}>{d.amount} productos</Text>
                                    </View>
                                ))}
                                <View style={[st.summaryItem, { borderTopWidth: 1.5, borderTopColor: C.accent, paddingTop: 8, marginTop: 4 }]}>
                                    <Text style={[st.summaryL, { fontFamily: FONT.bold, color: C.text }]}>Total</Text>
                                    <Text style={[st.summaryV, { fontFamily: FONT.heavy, color: C.accent }]}>{totalP} productos</Text>
                                </View>
                            </View>
                        );
                    })()}

                    <Text style={st.fLabel}>Monto total *</Text>
                    <TextInput style={st.input} placeholder="0.00" placeholderTextColor={C.textMuted} value={closeAmount} onChangeText={setCloseAmount} keyboardType="decimal-pad" />

                    <Text style={st.fLabel}>Ticket (opcional)</Text>
                    <TouchableOpacity style={st.ticketBtn} onPress={async () => { const uri = await pickImage(); if (uri) setCloseTicket(uri); }} activeOpacity={0.7}>
                        <Ionicons name={closeTicket ? 'checkmark-circle' : 'camera-outline'} size={20} color={closeTicket ? C.accent : C.textSec} />
                        <Text style={[st.ticketBtnText, closeTicket && { color: C.accent }]}>{closeTicket ? 'Ticket adjunto' : 'Tomar/seleccionar foto'}</Text>
                    </TouchableOpacity>

                    <View style={st.mBtns}>
                        <TouchableOpacity style={st.mCancel} onPress={() => setCloseModal({ visible: false, entry: null })}><Text style={st.mCancelT}>Cancelar</Text></TouchableOpacity>
                        <TouchableOpacity style={[st.mConfirm, { backgroundColor: C.warm }]} onPress={handleCloseEntry} activeOpacity={0.7}>
                            <Ionicons name="lock-closed-outline" size={16} color={C.card} /><Text style={st.mConfirmT}>Cerrar entrada</Text>
                        </TouchableOpacity>
                    </View>
                </View></ScrollView></View>
            </Modal>
        </View>
    );
};

const st = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, margin: 12, marginBottom: 0, borderRadius: R, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.border, gap: 8, ...SHADOW },
    searchInput: { flex: 1, fontFamily: FONT.regular, fontSize: 14, color: C.text, padding: 0 },
    filtersRow: { padding: 10, gap: 6, alignItems: 'center' },
    filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
    filterActive: { backgroundColor: C.accent, borderColor: C.accent },
    filterText: { fontFamily: FONT.medium, fontSize: 11, color: C.textSec },
    filterActiveText: { color: C.card },
    filterSep: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
    countBadge: { marginLeft: 4, backgroundColor: C.cardAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R },
    countText: { fontFamily: FONT.bold, color: C.textSec, fontSize: 12 },
    list: { padding: 12, paddingBottom: 80 },
    card: { backgroundColor: C.card, borderRadius: R, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10, ...SHADOW },
    cardClosed: { opacity: 0.65 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    typePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R - 4 },
    typeText: { fontFamily: FONT.bold, fontSize: 10, textTransform: 'uppercase' },
    closedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: R - 4, backgroundColor: C.cardAlt },
    closedText: { fontFamily: FONT.medium, fontSize: 10, color: C.textMuted },
    cardDate: { fontFamily: FONT.regular, fontSize: 11, color: C.textSec },
    cardName: { fontFamily: FONT.bold, fontSize: 16, color: C.text, marginBottom: 6 },
    statsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
    stat: { gap: 2 },
    statLabel: { fontFamily: FONT.regular, fontSize: 10, color: C.textSec, textTransform: 'uppercase' },
    statValue: { fontFamily: FONT.bold, fontSize: 14, color: C.text },
    notes: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec, marginTop: 6, fontStyle: 'italic' },
    expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight },
    delSection: { marginBottom: 12 },
    sectionLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    delItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    delUser: { fontFamily: FONT.medium, fontSize: 12, color: C.text, flex: 1 },
    delQty: { fontFamily: FONT.bold, fontSize: 12, color: C.accent },
    delDate: { fontFamily: FONT.regular, fontSize: 10, color: C.textSec, marginLeft: 8 },
    actions: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: R, borderWidth: 1.5, borderColor: C.accent },
    actionText: { fontFamily: FONT.medium, fontSize: 12, color: C.accent },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 8 },
    emptyTitle: { fontFamily: FONT.bold, fontSize: 16, color: C.textSec },
    emptySub: { fontFamily: FONT.regular, fontSize: 13, color: C.textMuted },
    fab: { position: 'absolute', bottom: 20, right: 16, width: 54, height: 54, borderRadius: 27, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', ...SHADOW },
    overlay: { flex: 1, backgroundColor: 'rgba(60,50,38,0.5)', justifyContent: 'center' },
    modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 16 },
    modal: { backgroundColor: C.card, borderRadius: R, padding: 20, ...SHADOW },
    mTitle: { fontFamily: FONT.heavy, fontSize: 18, color: C.text },
    mSubtitle: { fontFamily: FONT.medium, fontSize: 14, color: C.textSec, marginBottom: 8 },
    fLabel: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: C.cardAlt, borderRadius: R - 4, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: FONT.regular, fontSize: 14 },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: R, backgroundColor: C.cardAlt, borderWidth: 1, borderColor: C.border },
    typeBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
    typeLabel: { fontFamily: FONT.bold, fontSize: 13, color: C.text },
    typeDesc: { fontFamily: FONT.regular, fontSize: 10, color: C.textSec },
    ticketBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: R, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed' },
    ticketBtnText: { fontFamily: FONT.medium, fontSize: 13, color: C.textSec },
    warningBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardAlt, borderRadius: R, padding: 12, marginTop: 10, borderWidth: 1, borderColor: C.border },
    warningTitle: { fontFamily: FONT.bold, fontSize: 13, color: C.text },
    warningDesc: { fontFamily: FONT.regular, fontSize: 11, color: C.textSec },
    receiveInfo: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec, marginTop: 10 },
    summaryCard: { backgroundColor: C.cardAlt, borderRadius: R, padding: 14, marginTop: 10 },
    summaryTitle: { fontFamily: FONT.bold, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border },
    summaryL: { fontFamily: FONT.regular, fontSize: 12, color: C.textSec },
    summaryV: { fontFamily: FONT.medium, fontSize: 12, color: C.text },
    mBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 10 },
    mCancel: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: R, borderWidth: 1, borderColor: C.border },
    mCancelT: { fontFamily: FONT.medium, color: C.textSec },
    mConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: R, backgroundColor: C.accent },
    mConfirmT: { fontFamily: FONT.bold, color: C.card },
});

export default SuppliersScreen;
