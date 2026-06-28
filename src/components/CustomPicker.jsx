import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';

export default function CustomPicker({ selectedValue, onValueChange, items, placeholder = "Select an option..." }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);

    const selectedItem = items.find(item => item.value === selectedValue);

    const openDropdown = () => {
        triggerRef.current?.measure((fx, fy, width, height, px, py) => {
            // px, py are absolute coordinates on screen
            setDropdownLayout({
                top: py + height + 4, // 4px gap below the input
                left: px,
                width: width
            });
            setModalVisible(true);
        });
    };

    return (
        <View>
            <TouchableOpacity
                ref={triggerRef}
                onPress={openDropdown}
                className="w-full flex-row justify-between items-center bg-gray-50 border border-gray-200 px-4 rounded-xl h-[50px]"
            >
                <Text className={`text-sm ${selectedItem ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                    {selectedItem ? selectedItem.label : placeholder}
                </Text>
                <ChevronDown size={18} color="#9ca3af" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity 
                    className="flex-1" 
                    activeOpacity={1} 
                    onPress={() => setModalVisible(false)}
                >
                    <View 
                        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                        style={{ 
                            position: 'absolute', 
                            top: dropdownLayout.top, 
                            left: dropdownLayout.left, 
                            width: dropdownLayout.width,
                            maxHeight: 250,
                            elevation: 5, // shadow for android
                        }}
                    >
                        <FlatList
                            data={items}
                            keyExtractor={(item, index) => `${item.value}-${index}`}
                            renderItem={({ item }) => {
                                const isSelected = item.value === selectedValue;
                                return (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onValueChange(item.value);
                                            setModalVisible(false);
                                        }}
                                        className={`flex-row justify-between items-center p-3 border-b border-gray-50 ${isSelected ? 'bg-green-50' : 'bg-white'}`}
                                    >
                                        <Text className={`text-sm ${isSelected ? 'text-primary font-bold' : 'text-gray-700'}`}>
                                            {item.label}
                                        </Text>
                                        {isSelected && <Check size={16} color="#16a34a" />}
                                    </TouchableOpacity>
                                );
                            }}
                            bounces={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
