import React, { createContext, useContext, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react-native";

const ToastContext = createContext();

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success", duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Position: Top, Absolute */}
            <View className="absolute top-12 right-4 left-4 z-[70] flex flex-col gap-3">
                {toasts.map(toast => (
                    <View
                        key={toast.id}
                        className={`flex flex-row items-start p-4 rounded-xl shadow-xl border ${toast.type === "success" ? "bg-green-50 border-green-200" :
                            toast.type === "error" ? "bg-red-50 border-red-200" :
                                toast.type === "delete" ? "bg-orange-50 border-orange-200" :
                                    "bg-blue-50 border-blue-200"
                            }`}
                    >
                        <View className={`mr-3 mt-0.5 p-1 rounded-full ${toast.type === "success" ? "bg-green-100" :
                            toast.type === "error" ? "bg-red-100" :
                                toast.type === "delete" ? "bg-orange-100" :
                                    "bg-blue-100"
                            }`}>
                            {toast.type === "success" && <CheckCircle size={18} color="#16a34a" />}
                            {toast.type === "error" && <AlertCircle size={18} color="#dc2626" />}
                            {toast.type === "delete" && <AlertTriangle size={18} color="#ea580c" />}
                            {toast.type === "info" && <Info size={18} color="#2563eb" />}
                        </View>
                        <View className="flex-1">
                            <Text className={`font-bold text-sm capitalize mb-0.5 ${toast.type === "success" ? "text-green-800" :
                            toast.type === "error" ? "text-red-800" :
                                toast.type === "delete" ? "text-orange-800" :
                                    "text-blue-800"
                            }`}>
                                {toast.type === 'delete' ? 'Deleted' : toast.type}
                            </Text>
                            <Text className={`text-sm font-medium opacity-90 ${toast.type === "success" ? "text-green-800" :
                            toast.type === "error" ? "text-red-800" :
                                toast.type === "delete" ? "text-orange-800" :
                                    "text-blue-800"
                            }`}>{toast.message}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => removeToast(toast.id)}
                            className="ml-2 p-1 rounded-full opacity-60"
                        >
                            <X size={16} color="#000" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ToastContext.Provider>
    );
}
