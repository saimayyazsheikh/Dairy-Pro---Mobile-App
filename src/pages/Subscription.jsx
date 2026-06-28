import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import { LogOut, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { auth } from '../firebase';

export default function Subscription() {
    return (
        <View className="flex-1 bg-green-50 p-6 justify-center items-center">
            <View className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-sm border border-gray-100 items-center">
                <View className="w-20 h-20 rounded-full bg-red-50 justify-center items-center mb-4">
                    <CreditCard size={32} color="#ef4444" />
                </View>

                <Text className="text-2xl font-extrabold text-gray-800 text-center mb-2">
                    Trial Expired
                </Text>
                
                <Text className="text-gray-500 text-center mb-6 leading-relaxed">
                    Your 3-day free trial has ended. Subscribe now to continue managing your dairy farm with premium features.
                </Text>

                <View className="w-full mb-8">
                    <View className="flex-row items-center">
                        <CheckCircle2 size={18} color="#16a34a" />
                        <Text className="ml-2 text-gray-600 font-medium">Unlimited Cattle Records</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <CheckCircle2 size={18} color="#16a34a" />
                        <Text className="ml-2 text-gray-600 font-medium">Advanced Milk & Finance Analytics</Text>
                    </View>
                    <View className="flex-row items-center mt-2">
                        <CheckCircle2 size={18} color="#16a34a" />
                        <Text className="ml-2 text-gray-600 font-medium">Health & Vaccination Tracking</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    className="w-full bg-primary py-4 rounded-xl flex-row justify-center items-center shadow-sm mb-4"
                    onPress={() => {
                        const phoneNumber = "923107867246";
                        const user = auth.currentUser;
                        const userInfo = user ? `\n\nEmail: ${user.email}\nUID: ${user.uid}` : "";
                        const message = `Hello, I would like to subscribe to the premium features for the Dairy Pro app. Please provide the payment details.${userInfo}`;
                        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                        
                        Linking.canOpenURL(url).then(supported => {
                            if (supported) {
                                Linking.openURL(url);
                            } else {
                                Alert.alert("Error", "WhatsApp is not installed or cannot be opened.");
                            }
                        });
                    }}
                >
                    <Text className="text-white font-bold text-lg">Subscribe Now</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    className="flex-row items-center justify-center p-2"
                    onPress={() => auth.signOut()}
                >
                    <LogOut size={18} color="#6b7280" />
                    <Text className="text-gray-500 font-medium ml-2">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
