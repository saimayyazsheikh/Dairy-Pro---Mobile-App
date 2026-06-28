import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsAndConditions() {
    return (
        <SafeAreaView edges={['bottom']} className="flex-1 bg-white">
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">Terms & Conditions</Text>
                
                <Text className="text-gray-600 mb-6">
                    Last Updated: June 28, 2026
                </Text>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">1. Introduction</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        Welcome to DairyPro. By using our application, you agree to these terms and conditions. If you do not agree, please do not use the application. DairyPro provides digital farm management tools including cattle tracking, milk sales, health records, and inventory management.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">2. Subscriptions & Payments</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        DairyPro offers a 3-day free trial. After the trial period, continued use of the application requires an active premium subscription. Payments are handled manually through our official WhatsApp support channel. We reserve the right to suspend or terminate accounts with lapsed subscriptions.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">3. Data Privacy & Ownership</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        Your farm data belongs to you. We securely store your data using Firebase infrastructure. We will never sell your individual farm data to third parties. However, we reserve the right to aggregate anonymized data for platform improvements and analytics.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">4. User Responsibilities</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        You are responsible for maintaining the confidentiality of your login credentials. DairyPro is not liable for data loss resulting from unauthorized access due to negligence. Please ensure your device is secured and do not share your account details.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">5. Service Availability</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        While we strive for 100% uptime, DairyPro is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted access and are not liable for any farm losses incurred due to temporary unavailability of the app.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-2">6. Modifications to Terms</Text>
                    <Text className="text-base text-gray-600 leading-relaxed">
                        We may update these terms periodically. Continued use of the application after changes are made constitutes your acceptance of the revised terms.
                    </Text>
                </View>

                <View className="pb-10">
                    <Text className="text-base text-gray-600 leading-relaxed">
                        For any questions or concerns regarding these terms, please contact us via our WhatsApp support channel.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
