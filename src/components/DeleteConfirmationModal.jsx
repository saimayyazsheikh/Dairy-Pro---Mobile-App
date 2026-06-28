import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm Deletion", message = "This action cannot be undone. Are you sure you want to delete this record?" }) => {
    return (
        <Modal
            visible={isOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 p-4">
                <View className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <View className="p-6">
                        <View className="flex flex-row items-center gap-3 mb-4">
                            <View className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle size={24} color="#dc2626" />
                            </View>
                            <Text className="text-xl font-bold text-red-600">{title}</Text>
                        </View>

                        <Text className="text-gray-600 mb-8 leading-relaxed">
                            {message}
                        </Text>

                        <View className="flex flex-row gap-3">
                            <TouchableOpacity
                                onPress={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 rounded-lg items-center"
                            >
                                <Text className="text-gray-700 font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onConfirm}
                                className="flex-1 px-4 py-3 bg-red-600 rounded-lg items-center shadow-md"
                            >
                                <Text className="text-white font-bold">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default DeleteConfirmationModal;
