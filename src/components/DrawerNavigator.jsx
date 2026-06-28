import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Beef, Milk, Stethoscope, Package, Users, CircleDollarSign, Settings, LogOut, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screens (Placeholders for now)
import Dashboard from '../pages/Dashboard';
import Cattle from '../pages/Cattle';
import MilkScreen from '../pages/Milk';
import Health from '../pages/Health';
import Inventory from '../pages/Inventory';
import HR from '../pages/HR';
import Finance from '../pages/Finance';
import SettingsScreen from '../pages/Settings';
import SubscriptionGuard from './SubscriptionGuard';
import TermsAndConditions from '../pages/TermsAndConditions';

const Drawer = createDrawerNavigator();

// Custom Drawer Content to include Logo, Farm Name and Logout button
function CustomDrawerContent(props) {
  const { farmData, logout } = useAuth();

  return (
    <View className="flex-1">
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Header Profile Section */}
        <View className="flex-col items-center justify-center pt-14 pb-8 border-b border-gray-200 bg-green-50/50 mb-2">
          <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 shadow-md flex items-center justify-center bg-white p-0.5 mb-2">
            <Image source={require('../../assets/logo.png')} className="w-full h-full rounded-full" />
          </View>
          <Text className="font-bold text-gray-800 text-base tracking-wide text-center px-4">
            {farmData?.farmName || 'Loading...'}
          </Text>
        </View>

        {/* Standard Drawer Items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Footer Actions */}
      <View className="p-4 border-t border-gray-200 mb-4">
        <TouchableOpacity 
          onPress={() => props.navigation.navigate('TermsAndConditions')} 
          className="flex-row items-center px-4 py-3 rounded-lg mb-2"
        >
          <FileText size={20} color="#6b7280" style={{ marginRight: 12 }} />
          <Text className="font-medium text-gray-600">Terms & Conditions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={logout} 
          className="flex-row items-center px-4 py-3 rounded-lg bg-red-50"
        >
          <LogOut size={20} color="#ef4444" style={{ marginRight: 12 }} />
          <Text className="font-medium text-red-500">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Higher Order Component to wrap screens in SubscriptionGuard
const guarded = (Component) => () => (
  <SubscriptionGuard>
    <Component />
  </SubscriptionGuard>
);

export default function DrawerNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { height: 60 + insets.top },
        headerTitleStyle: { fontWeight: 'bold', paddingTop: insets.top / 2 },
        headerLeftContainerStyle: { paddingTop: insets.top / 2 },
        headerRightContainerStyle: { paddingTop: insets.top / 2 },
        headerTintColor: '#16a34a',
        drawerActiveBackgroundColor: '#dcfce7',
        drawerActiveTintColor: '#16a34a',
        drawerInactiveTintColor: '#4b5563',
        drawerLabelStyle: { fontSize: 15, fontWeight: '500' }
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={guarded(Dashboard)} 
        options={{ drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Cattle" 
        component={guarded(Cattle)} 
        options={{ drawerIcon: ({ color, size }) => <Beef size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Milk Management" 
        component={guarded(MilkScreen)} 
        options={{ drawerIcon: ({ color, size }) => <Milk size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Health Records" 
        component={guarded(Health)} 
        options={{ drawerIcon: ({ color, size }) => <Stethoscope size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Inventory" 
        component={guarded(Inventory)} 
        options={{ drawerIcon: ({ color, size }) => <Package size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="HR Management" 
        component={guarded(HR)} 
        options={{ drawerIcon: ({ color, size }) => <Users size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Expenses" 
        component={guarded(Finance)} 
        options={{ drawerIcon: ({ color, size }) => <CircleDollarSign size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="Settings" 
        component={guarded(SettingsScreen)} 
        options={{ drawerIcon: ({ color, size }) => <Settings size={size} color={color} /> }} 
      />
      <Drawer.Screen 
        name="TermsAndConditions" 
        component={TermsAndConditions} 
        options={{ 
          drawerItemStyle: { display: 'none' },
          title: 'Terms & Conditions' 
        }} 
      />
    </Drawer.Navigator>
  );
}
