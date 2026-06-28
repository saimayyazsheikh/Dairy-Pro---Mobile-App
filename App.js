import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { ConfirmationProvider } from './src/contexts/ConfirmationContext';

// Guards
import SubscriptionGuard from './src/components/SubscriptionGuard';

// Screens & Navigators
import DrawerNavigator from './src/components/DrawerNavigator';
import Login from './src/pages/Login';
import Register from './src/pages/Register';

import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!currentUser ? (
        // Unauthenticated Stack
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : (
        // Authenticated Stack
        // Render the DrawerNavigator as the main authenticated screen
        <Stack.Screen name="MainApp" component={DrawerNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmationProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
