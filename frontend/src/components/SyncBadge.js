/**
 * SyncBadge - Estilo Sketch/Bone
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSync } from '../context/SyncContext';
import { C, R, FONT } from '../utils/theme';

const SyncBadge = () => {
    const { isConnected, isSyncing, pendingCount, triggerSync } = useSync();
    return (
        <TouchableOpacity style={st.container} onPress={triggerSync} disabled={isSyncing || !isConnected} activeOpacity={0.7}>
            <Ionicons name={isConnected ? 'cloud-done-outline' : 'cloud-offline-outline'} size={18} color={isConnected ? C.accent : C.danger} />
            {pendingCount > 0 && (
                <View style={st.badge}><Text style={st.badgeText}>{pendingCount}</Text></View>
            )}
            {isSyncing && <Text style={st.syncText}>Sync...</Text>}
        </TouchableOpacity>
    );
};

const st = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
    badge: { backgroundColor: C.warm, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
    badgeText: { fontFamily: FONT.bold, color: C.card, fontSize: 10 },
    syncText: { fontFamily: FONT.regular, color: C.textSec, fontSize: 11, marginLeft: 4 },
});

export default SyncBadge;
