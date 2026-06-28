import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar as CalendarIcon } from 'lucide-react-native';

export default function CustomDatePicker({ value, onChange, placeholder = "YYYY-MM-DD", label, containerClassName = "mb-3" }) {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        onChange(dateStr);
        hideDatePicker();
    };

    return (
        <View className={containerClassName}>
            {label && <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>}
            <TouchableOpacity 
                onPress={showDatePicker}
                className="w-full flex-row items-center justify-between p-3 border border-gray-300 rounded-lg bg-white"
            >
                <Text className={`flex-1 ${value ? "text-gray-800" : "text-gray-400"}`}>
                    {value || placeholder}
                </Text>
                <CalendarIcon size={20} color="#9ca3af" />
            </TouchableOpacity>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                display="spinner"
                themeVariant="light"
                textColor="#000000"
                date={value ? new Date(value) : new Date()}
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
            />
        </View>
    );
}
