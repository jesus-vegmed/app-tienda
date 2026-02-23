import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import SyncBadge from '../components/SyncBadge';
import { C, FONT } from '../utils/theme';

import CashRegisterScreen from '../screens/CashRegisterScreen';
import CashRegisterHistoryScreen from '../screens/CashRegisterHistoryScreen';
import ImportesScreen from '../screens/ImportesScreen';
import ImporteDetailScreen from '../screens/ImporteDetailScreen';
import SuppliersScreen from '../screens/SuppliersScreen';
import MissingItemsScreen from '../screens/MissingItemsScreen';
import AdminScreen from '../screens/AdminScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const screenOptions = {
    headerStyle: { backgroundColor: C.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: C.borderLight },
    headerTintColor: C.text,
    headerTitleStyle: { fontFamily: FONT.bold, fontSize: 17 },
    headerRight: () => <SyncBadge />,
};

const ImportesStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="ImportesList" component={ImportesScreen} options={{ title: 'Importes' }} />
        <Stack.Screen name="ImporteDetail" component={ImporteDetailScreen} options={{ title: 'Detalle' }} />
    </Stack.Navigator>
);

const CajaStack = () => (
    <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="CashRegister" component={CashRegisterScreen} options={{ title: 'Corte de Caja' }} />
        <Stack.Screen name="CashHistory" component={CashRegisterHistoryScreen} options={{ title: 'Historial de Cortes' }} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { isAdmin } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: C.card,
                    borderTopColor: C.borderLight,
                    borderTopWidth: 1,
                    height: 62,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: C.accent,
                tabBarInactiveTintColor: C.textMuted,
                tabBarLabelStyle: { fontFamily: FONT.medium, fontSize: 10 },
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case 'Caja': iconName = 'calculator-outline'; break;
                        case 'Importes': iconName = 'receipt-outline'; break;
                        case 'Proveedores': iconName = 'people-outline'; break;
                        case 'Faltantes': iconName = 'alert-circle-outline'; break;
                        case 'Admin': iconName = 'settings-outline'; break;
                        case 'Perfil': iconName = 'person-circle-outline'; break;
                        default: iconName = 'ellipse-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Caja" component={CajaStack} />
            <Tab.Screen name="Importes" component={ImportesStack} />
            <Tab.Screen name="Proveedores" component={SuppliersScreen} options={{ ...screenOptions, title: 'Proveedores' }} />
            <Tab.Screen name="Faltantes" component={MissingItemsScreen} options={{ ...screenOptions, title: 'Faltantes' }} />
            {isAdmin && <Tab.Screen name="Admin" component={AdminScreen} options={{ ...screenOptions, title: 'Admin' }} />}
            <Tab.Screen name="Perfil" component={ProfileScreen} options={{ ...screenOptions, title: 'Mi Perfil' }} />
        </Tab.Navigator>
    );
};

export default AppNavigator;
