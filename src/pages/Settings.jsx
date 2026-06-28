import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    User, Mail, Phone, MapPin, Bell, Moon, ChevronRight, 
    LogOut, ShieldCheck, Crown, Landmark, Pencil, X 
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Settings() {
    const { userData, farmData, logout, updateProfileData } = useAuth();
    const { addToast } = useToast();

    // Local state for toggles (mock functionality for now)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    // Edit Profile State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', farmName: '' });

    const openEditModal = () => {
        setEditForm({
            name: userData?.name || '',
            farmName: farmData?.farmName || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        if (!editForm.name.trim() || !editForm.farmName.trim()) {
            Alert.alert("Error", "Name and Farm Name cannot be empty.");
            return;
        }
        try {
            await updateProfileData(editForm.name.trim(), editForm.farmName.trim());
            addToast("Profile updated successfully!", "success");
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            addToast("Failed to update profile", "error");
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            addToast("Failed to sign out", "error");
                        }
                    }
                }
            ]
        );
    };

    const handleSubscribe = () => {
        const phoneNumber = "923107867246";
        const email = userData?.email || "Unknown";
        const message = `Hello, I would like to subscribe to the premium features for the Dairy Pro app. Please provide the payment details.\n\nEmail: ${email}`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert("Error", "WhatsApp is not installed or cannot be opened.");
            }
        });
    };

    // Helper to extract initials for the avatar
    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                
                {/* Profile Header */}
                <View className="bg-white px-6 pt-6 pb-8 border-b border-gray-200 items-center relative">
                    <TouchableOpacity 
                        onPress={openEditModal}
                        className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"
                    >
                        <Pencil size={20} color="#4b5563" />
                    </TouchableOpacity>

                    <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-4 border-4 border-green-50 shadow-sm">
                        <Text className="text-3xl font-bold text-green-700">
                            {getInitials(userData?.name || "Farmer")}
                        </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-800 mb-1">
                        {userData?.name || "Dairy Farmer"}
                    </Text>
                    <Text className="text-gray-500 font-medium">
                        {farmData?.farmName || "Dairy Farm"}
                    </Text>
                </View>

                <View className="p-4 space-y-6">
                    
                    {/* Account Information */}
                    <View>
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-2">Account Details</Text>
                        <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <View className="flex-row items-center p-4 border-b border-gray-100">
                                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                                    <Mail size={20} color="#3b82f6" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-sm text-gray-500">Email Address</Text>
                                    <Text className="text-base font-semibold text-gray-800">{userData?.email || "Not set"}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center p-4 border-b border-gray-100">
                                <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                                    <Phone size={20} color="#a855f7" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-sm text-gray-500">Mobile Number</Text>
                                    <Text className="text-base font-semibold text-gray-800">{userData?.mobile || "Not set"}</Text>
                                </View>
                            </View>
                            <View className="flex-row items-center p-4">
                                <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center">
                                    <MapPin size={20} color="#f97316" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-sm text-gray-500">Location</Text>
                                    <Text className="text-base font-semibold text-gray-800">{farmData?.location || "Not set"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Subscription */}
                    <View>
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-2">Subscription</Text>
                        <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-yellow-50 items-center justify-center">
                                        <ShieldCheck size={20} color="#eab308" />
                                    </View>
                                    <View className="ml-3">
                                        <Text className="text-sm text-gray-500">Current Plan</Text>
                                        <Text className="text-base font-bold text-gray-800 capitalize">
                                            {farmData?.subscriptionStatus || "Free Trial"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            
                            <TouchableOpacity 
                                className="flex-row items-center justify-between p-4 bg-green-50"
                                onPress={handleSubscribe}
                            >
                                <View className="flex-row items-center">
                                    <Crown size={20} color="#16a34a" />
                                    <Text className="text-green-700 font-bold ml-2">Upgrade to Premium</Text>
                                </View>
                                <ChevronRight size={20} color="#16a34a" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* App Preferences */}
                    <View>
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-2">Preferences</Text>
                        <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                                        <Bell size={20} color="#4b5563" />
                                    </View>
                                    <Text className="text-base font-semibold text-gray-800 ml-3">Push Notifications</Text>
                                </View>
                                <Switch 
                                    value={notificationsEnabled} 
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: "#d1d5db", true: "#16a34a" }}
                                />
                            </View>
                            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                                        <Moon size={20} color="#4b5563" />
                                    </View>
                                    <Text className="text-base font-semibold text-gray-800 ml-3">Dark Mode</Text>
                                </View>
                                <Switch 
                                    value={darkModeEnabled} 
                                    onValueChange={() => {
                                        setDarkModeEnabled(!darkModeEnabled);
                                        addToast("Dark mode coming in next update!", "info");
                                    }}
                                    trackColor={{ false: "#d1d5db", true: "#16a34a" }}
                                />
                            </View>
                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                                        <Landmark size={20} color="#4b5563" />
                                    </View>
                                    <Text className="text-base font-semibold text-gray-800 ml-3">Currency</Text>
                                </View>
                                <View className="bg-gray-100 px-3 py-1 rounded-full">
                                    <Text className="text-sm font-bold text-gray-600">PKR (Rs)</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <TouchableOpacity 
                        className="w-full bg-red-50 py-4 rounded-2xl flex-row justify-center items-center mt-4 border border-red-100 shadow-sm"
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text className="text-red-500 font-bold text-lg ml-2">Sign Out</Text>
                    </TouchableOpacity>

                    <Text className="text-center text-gray-400 text-xs mt-4 mb-8">
                        DairyPro Version 1.0.0
                    </Text>

                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={isEditModalOpen} animationType="slide" onRequestClose={() => setIsEditModalOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
                        <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                            <Text className="text-lg font-bold text-gray-800">Edit Profile</Text>
                            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                                <X size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 p-4">
                            <View className="mb-4">
                                <Text className="text-sm font-bold text-gray-700 mb-2">Your Name</Text>
                                <TextInput
                                    className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-800"
                                    value={editForm.name}
                                    onChangeText={text => setEditForm({...editForm, name: text})}
                                    placeholder="Enter your name"
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-sm font-bold text-gray-700 mb-2">Farm Name</Text>
                                <TextInput
                                    className="border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-800"
                                    value={editForm.farmName}
                                    onChangeText={text => setEditForm({...editForm, farmName: text})}
                                    placeholder="Enter farm name"
                                />
                            </View>
                        </ScrollView>

                        <View className="p-4 border-t border-gray-200 bg-white">
                            <TouchableOpacity
                                className="bg-primary rounded-xl py-4 items-center"
                                onPress={handleSaveProfile}
                            >
                                <Text className="text-white font-bold text-lg">Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}
