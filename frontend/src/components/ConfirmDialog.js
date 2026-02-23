/**
 * ConfirmDialog - Estilo Sketch/Bone
 */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, R, FONT, SHADOW } from '../utils/theme';

const ConfirmDialog = ({ visible, title, message, onConfirm, onCancel }) => (
    <Modal transparent visible={visible} animationType="fade">
        <View style={st.overlay}>
            <View style={st.dialog}>
                <View style={st.iconBox}>
                    <Ionicons name="help-circle-outline" size={32} color={C.warm} />
                </View>
                <Text style={st.title}>{title}</Text>
                <Text style={st.message}>{message}</Text>
                <View style={st.buttons}>
                    <TouchableOpacity style={st.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                        <Text style={st.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.confirmBtn} onPress={onConfirm} activeOpacity={0.7}>
                        <Ionicons name="checkmark-outline" size={16} color={C.card} />
                        <Text style={st.confirmText}>Confirmar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const st = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(60,50,38,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    dialog: { backgroundColor: C.card, width: '100%', maxWidth: 340, padding: 24, borderRadius: R, ...SHADOW, alignItems: 'center' },
    iconBox: { marginBottom: 12 },
    title: { fontFamily: FONT.heavy, fontSize: 17, color: C.text, marginBottom: 8, textAlign: 'center' },
    message: { fontFamily: FONT.regular, fontSize: 14, color: C.textSec, marginBottom: 20, lineHeight: 20, textAlign: 'center' },
    buttons: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: R, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
    cancelText: { fontFamily: FONT.medium, color: C.textSec, fontSize: 14 },
    confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: R, backgroundColor: C.accent },
    confirmText: { fontFamily: FONT.bold, color: C.card, fontSize: 14 },
});

export default ConfirmDialog;
