import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";
import Subscription from "../pages/Subscription";

export default function SubscriptionGuard({ children }) {
    const { farmData, loading } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    if (!farmData) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 p-4">
                <View className="bg-white p-8 rounded-2xl shadow-sm items-center w-full max-w-md">
                    <Text className="text-2xl font-bold text-gray-800 mb-2">Workspace Not Found</Text>
                    <Text className="text-gray-600 mb-6 text-center">We couldn't find your farm details. Your registration might have been interrupted.</Text>
                    <TouchableOpacity 
                        onPress={() => auth.signOut()} 
                        className="bg-primary px-6 py-3 rounded-lg flex-row justify-center w-full"
                    >
                        <Text className="text-white font-medium text-center">Sign Out & Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const { trialEndDate, subscriptionEndDate } = farmData;
    
    const now = new Date();
    
    // 1. Are they still in their 3-day trial?
    const isTrialActive = trialEndDate ? now <= new Date(trialEndDate) : false;
    
    // 2. Do they have a paid subscription that hasn't expired yet?
    const isSubActive = subscriptionEndDate ? now <= new Date(subscriptionEndDate) : false;

    // If neither is true, lock them out and render the Subscription screen directly 
    // (This avoids navigation complexity and acts exactly like a guard)
    if (!isTrialActive && !isSubActive) {
        return <Subscription />;
    }

    return children;
}
