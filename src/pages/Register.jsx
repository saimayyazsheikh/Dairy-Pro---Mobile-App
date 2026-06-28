import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Eye, EyeOff, Mail, Lock, User, Home, MapPin, Phone } from "lucide-react-native";

export default function Register() {
    const [formData, setFormData] = useState({
        ownerName: "",
        farmName: "",
        location: "",
        mobile: "",
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigation = useNavigation();

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    async function handleSubmit() {
        if (!formData.ownerName || !formData.farmName || !formData.email || !formData.password) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setError("");
            setLoading(true);
            await register(
                formData.ownerName,
                formData.farmName,
                formData.location,
                formData.mobile,
                formData.email,
                formData.password
            );
            // On successful registration, currentUser updates and App navigator handles redirect
        } catch (err) {
            // console.error(err); // Removed to prevent Expo Red Screen on registration failure
            setError(err.message || "Failed to create an account.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-green-50"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
                <View className="bg-white/90 p-6 sm:p-10 rounded-2xl shadow-md border border-white/50 w-full max-w-lg self-center my-8">
                    <View className="flex items-center mb-6">
                        <View className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center bg-white p-0.5 mb-4">
                            <Image source={require('../../assets/logo.png')} className="w-full h-full rounded-full" />
                        </View>
                        <Text className="text-3xl font-extrabold text-gray-800 text-center tracking-tight">Dairy Pro</Text>
                        <Text className="text-gray-500 text-sm mt-1">Create your Dairy Farm workspace</Text>
                    </View>

                    {error ? (
                        <View className="bg-red-50 p-3 mb-6 rounded-xl border border-red-100 flex-row items-center gap-2">
                            <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <Text className="text-red-700 text-sm flex-1">{error}</Text>
                        </View>
                    ) : null}

                    <View className="space-y-4 flex-col gap-4">
                        
                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Owner Name</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="Full Name"
                                    value={formData.ownerName}
                                    onChangeText={(val) => handleChange("ownerName", val)}
                                />
                                <View className="absolute left-3.5">
                                    <User color="#9ca3af" size={16} />
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Farm Name</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="Dairy Farm Name"
                                    value={formData.farmName}
                                    onChangeText={(val) => handleChange("farmName", val)}
                                />
                                <View className="absolute left-3.5">
                                    <Home color="#9ca3af" size={16} />
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Location</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="City/Region"
                                    value={formData.location}
                                    onChangeText={(val) => handleChange("location", val)}
                                />
                                <View className="absolute left-3.5">
                                    <MapPin color="#9ca3af" size={16} />
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Mobile</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    value={formData.mobile}
                                    onChangeText={(val) => handleChange("mobile", val)}
                                />
                                <View className="absolute left-3.5">
                                    <Phone color="#9ca3af" size={16} />
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Email Address</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="Enter your email"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={formData.email}
                                    onChangeText={(val) => handleChange("email", val)}
                                />
                                <View className="absolute left-3.5">
                                    <Mail color="#9ca3af" size={16} />
                                </View>
                            </View>
                        </View>

                        <View>
                            <Text className="text-sm font-semibold text-gray-600 mb-1">Password</Text>
                            <View className="relative justify-center">
                                <TextInput
                                    secureTextEntry={!showPassword}
                                    className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChangeText={(val) => handleChange("password", val)}
                                />
                                <View className="absolute left-3.5">
                                    <Lock color="#9ca3af" size={16} />
                                </View>
                                <TouchableOpacity
                                    className="absolute right-3 p-1.5"
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff color="#9ca3af" size={16} /> : <Eye color="#9ca3af" size={16} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleSubmit}
                            className="w-full bg-primary py-3.5 rounded-xl mt-4 flex-row items-center justify-center shadow-sm"
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-base">Create Workspace</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="mt-6 flex-row justify-center items-center">
                        <Text className="text-sm text-gray-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text className="text-primary font-bold">Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
