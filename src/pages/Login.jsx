import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
// import logo from "../../assets/logo.png"; // We will handle assets later or use require
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigation = useNavigation();

    async function handleSubmit() {
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        try {
            setError("");
            setLoading(true);
            await login(email, password);
            // On successful login, the App navigator will automatically switch to MainApp because currentUser changes.
        } catch (err) {
            // console.error(err); // Removed to prevent Expo Red Screen on invalid login
            setError("Failed to log in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-green-50 justify-center px-4"
        >
            {/* Login Card */}
            <View className="bg-white/90 p-8 rounded-2xl shadow-md border border-white/50 w-full max-w-md self-center">
                <View className="flex items-center mb-6">
                    <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center bg-white p-0.5 mb-4">
                        <Image source={require('../../assets/logo.png')} className="w-full h-full rounded-full" />
                    </View>
                    <Text className="text-3xl font-extrabold text-gray-800 text-center tracking-tight">DairyPro</Text>
                    <Text className="text-gray-500 text-sm mt-1">Dairy Farm Management</Text>
                </View>

                {error ? (
                    <View className="bg-red-50 p-3 mb-6 rounded-xl border border-red-100 flex-row items-center gap-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <Text className="text-red-700 text-sm flex-1">{error}</Text>
                    </View>
                ) : null}

                <View className="space-y-5 flex-col gap-4">
                    <View>
                        <Text className="text-sm font-semibold text-gray-600 mb-1.5">Email Address</Text>
                        <View className="relative justify-center">
                            <TextInput
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <View className="absolute left-3.5">
                                <Mail color="#9ca3af" size={18} />
                            </View>
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-gray-600 mb-1.5">Password</Text>
                        <View className="relative justify-center">
                            <TextInput
                                secureTextEntry={!showPassword}
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                            />
                            <View className="absolute left-3.5">
                                <Lock color="#9ca3af" size={18} />
                            </View>
                            <TouchableOpacity
                                className="absolute right-3 p-1.5"
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff color="#9ca3af" size={18} /> : <Eye color="#9ca3af" size={18} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        disabled={loading}
                        onPress={handleSubmit}
                        className="w-full bg-primary py-3.5 rounded-xl mt-2 flex-row items-center justify-center shadow-sm"
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="mt-6 flex-row justify-center items-center">
                    <Text className="text-sm text-gray-500">Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text className="text-primary font-bold">Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
