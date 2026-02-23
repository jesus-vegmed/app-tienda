import React from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SyncProvider } from './src/context/SyncContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { initDatabase } from './src/database/init';
import { C, FONT } from './src/utils/theme';

// Inicializar base de datos local al arrancar
initDatabase().catch((e) => console.log('[DB] Error inicializando: ' + e.message));

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={s.loadText}>Cargando...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <SyncProvider>
      <AppNavigator />
    </SyncProvider>
  );
};

const navTheme = {
  dark: false,
  colors: {
    background: C.bg,
    card: C.card,
    text: C.text,
    border: C.border,
    primary: C.accent,
    notification: C.warm,
  },
  fonts: {
    regular: { fontFamily: FONT.regular, fontWeight: '400' },
    medium: { fontFamily: FONT.medium, fontWeight: '500' },
    bold: { fontFamily: FONT.bold, fontWeight: '700' },
    heavy: { fontFamily: FONT.heavy, fontWeight: '800' },
  },
};

const App = () => {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <NavigationContainer theme={navTheme}>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
};

const s = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg, gap: 12 },
  loadText: { fontFamily: FONT.medium, fontSize: 14, color: C.textSec },
});

export default App;
