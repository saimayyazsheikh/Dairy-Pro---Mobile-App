import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHR } from "../hooks/useHR";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import CustomDatePicker from '../components/CustomDatePicker';
import { Users, UserPlus, Stethoscope, Phone, Trash2, Edit2, X, CheckCircle, Clock } from "lucide-react-native";

export default function HR() {
    const { employees, doctors, loading, payrollStatus, doctorStats, addEmployee, updateEmployee, deleteEmployee, addDoctor, updateDoctor, deleteDoctor, runMonthlyPayroll } = useHR();
    const { addToast } = useToast();
    const { confirm } = useConfirmation();

    const [activeTab, setActiveTab] = useState("employees"); // "employees" | "doctors"
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const runPayroll = async () => {
            const count = await runMonthlyPayroll();
            if (count > 0) addToast(`Payroll Run: Paid ${count} employees.`, "success");
        };
        if (!loading) runPayroll();
    }, [loading]);

    const initialEmpState = { name: "", role: "", contact: "", salary: "", dateJoined: "" };
    const initialDocState = { name: "", specialization: "", contact: "", hospital: "", visitSchedule: "" };

    const [empForm, setEmpForm] = useState(initialEmpState);
    const [docForm, setDocForm] = useState(initialDocState);

    const handleOpenModal = (item = null) => {
        setEditingId(item ? item.id : null);
        if (activeTab === "employees") {
            setEmpForm(item ? { ...item, salary: item.salary?.toString() || "" } : initialEmpState);
        } else {
            setDocForm(item ? { ...item } : initialDocState);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (activeTab === "employees") {
                if (editingId) {
                    await updateEmployee(editingId, empForm);
                    addToast("Employee updated", "success");
                } else {
                    const salaryLogged = await addEmployee(empForm);
                    if (salaryLogged) addToast("Added & Initial Salary Logged", "success");
                    else addToast("Employee Added", "success");
                }
            } else {
                if (editingId) await updateDoctor(editingId, docForm);
                else await addDoctor(docForm);
                addToast("Doctor saved", "success");
            }
            setIsModalOpen(false);
        } catch (err) {
            addToast("Action failed", "error");
        }
    };

    const handleDelete = async (id) => {
        if (await confirm("Are you sure?")) {
            if (activeTab === "employees") await deleteEmployee(id);
            else await deleteDoctor(id);
            addToast("Record deleted", "delete");
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 pt-6 border-b border-gray-200">
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800">Human Resources</Text>
                    <Text className="text-gray-500 text-xs">Manage Farm Staff & Veterinary Partners</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => handleOpenModal()}
                    className="bg-primary px-4 py-3 rounded-lg flex-row items-center justify-center"
                >
                    <UserPlus size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2">Add {activeTab === "employees" ? "Employee" : "Doctor"}</Text>
                </TouchableOpacity>

                <View className="flex-row mt-4 border-b border-gray-200">
                    <TouchableOpacity onPress={() => setActiveTab("employees")} className={`flex-row items-center pb-3 px-4 ${activeTab === 'employees' ? 'border-b-2 border-primary' : ''}`}>
                        <Users size={18} color={activeTab === 'employees' ? '#16a34a' : '#6b7280'} className="mr-2" />
                        <Text className={`font-medium ${activeTab === 'employees' ? 'text-primary' : 'text-gray-500'}`}>Staff</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab("doctors")} className={`flex-row items-center pb-3 px-4 ${activeTab === 'doctors' ? 'border-b-2 border-primary' : ''}`}>
                        <Stethoscope size={18} color={activeTab === 'doctors' ? '#16a34a' : '#6b7280'} className="mr-2" />
                        <Text className={`font-medium ${activeTab === 'doctors' ? 'text-primary' : 'text-gray-500'}`}>Doctors</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {loading ? (
                    <Text className="text-center text-gray-500 py-8">Loading HR data...</Text>
                ) : (activeTab === "employees" ? employees : doctors).length === 0 ? (
                    <Text className="text-center text-gray-500 py-8">No records found.</Text>
                ) : (
                    (activeTab === "employees" ? employees : doctors).map(item => (
                        <View key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                            {activeTab === "employees" ? (
                                <>
                                    <View className="flex-row justify-between items-start border-b border-gray-100 pb-2 mb-3">
                                        <View>
                                            <Text className="font-bold text-gray-900 text-lg">{item.name}</Text>
                                            <View className="bg-blue-50 px-2 py-0.5 rounded mt-1 self-start border border-blue-100">
                                                <Text className="text-blue-800 text-[10px] font-bold uppercase">{item.role || "Staff"}</Text>
                                            </View>
                                        </View>
                                        {payrollStatus[item.id] ? (
                                            <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                <CheckCircle size={12} color="#16a34a" className="mr-1" />
                                                <Text className="text-green-600 text-[10px] font-bold uppercase">Paid</Text>
                                            </View>
                                        ) : (
                                            <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                                                <Clock size={12} color="#ea580c" className="mr-1" />
                                                <Text className="text-orange-600 text-[10px] font-bold uppercase">Pending</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View className="flex-row bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                        <View className="flex-1 border-r border-gray-200 pr-2">
                                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">CONTACT</Text>
                                            <Text className="text-gray-800 text-sm font-medium">{item.contact || "-"}</Text>
                                        </View>
                                        <View className="flex-1 pl-3">
                                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">SALARY</Text>
                                            <Text className="text-gray-800 text-sm font-bold">{item.salary ? `Rs ${parseInt(item.salary).toLocaleString()}` : '-'}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-500 text-xs mb-3">Joined: <Text className="font-medium text-gray-800">{item.dateJoined || "N/A"}</Text></Text>
                                </>
                            ) : (
                                <>
                                    <View className="flex-row justify-between items-start border-b border-gray-100 pb-2 mb-3">
                                        <View>
                                            <Text className="font-bold text-gray-900 text-lg">{item.name}</Text>
                                            <View className="bg-green-50 px-2 py-0.5 rounded mt-1 self-start border border-green-100">
                                                <Text className="text-green-800 text-[10px] font-bold uppercase">VET PARTNER</Text>
                                            </View>
                                        </View>
                                        <View className="bg-purple-50 px-2 py-0.5 rounded">
                                            <Text className="text-purple-700 text-xs font-medium">{item.specialization}</Text>
                                        </View>
                                    </View>
                                    <View className="flex-row bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                        <View className="flex-1 border-r border-gray-200 pr-2">
                                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">TOTAL PAID</Text>
                                            <Text className="text-gray-800 text-sm font-bold">Rs {(doctorStats[item.name]?.amount || 0).toLocaleString()}</Text>
                                        </View>
                                        <View className="flex-1 pl-3">
                                            <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">LAST VISIT</Text>
                                            <Text className="text-gray-800 text-sm font-medium">{doctorStats[item.name]?.lastVisit ? new Date(doctorStats[item.name].lastVisit).toLocaleDateString() : '-'}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-500 text-xs mb-1">Contact: <Text className="font-medium text-gray-800">{item.contact || "N/A"}</Text></Text>
                                    <Text className="text-gray-500 text-xs mb-3">Schedule: <Text className="font-medium text-gray-800">{item.visitSchedule || "N/A"}</Text></Text>
                                </>
                            )}
                            <View className="flex-row justify-end gap-2 border-t border-gray-100 pt-3">
                                <TouchableOpacity onPress={() => handleOpenModal(item)} className="p-2 bg-blue-50 rounded-lg"><Edit2 size={18} color="#2563eb" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2 bg-red-50 rounded-lg"><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                        <Text className="text-lg font-bold text-gray-800">{editingId ? "Edit" : "Add"} {activeTab === "employees" ? "Employee" : "Doctor"}</Text>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {activeTab === "employees" ? (
                            <>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium mb-1">Full Name *</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={empForm.name} onChangeText={t => setEmpForm({...empForm, name: t})} />
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium mb-1">Role *</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={empForm.role} onChangeText={t => setEmpForm({...empForm, role: t})} placeholder="e.g. Herdsman" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium mb-1">Contact *</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={empForm.contact} onChangeText={t => setEmpForm({...empForm, contact: t})} keyboardType="phone-pad" />
                                    </View>
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium mb-1">Salary</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={empForm.salary} onChangeText={t => setEmpForm({...empForm, salary: t})} keyboardType="numeric" placeholder="15000" />
                                    </View>
                                    <View className="flex-1">
                                        <CustomDatePicker 
                                            label="Date Joined"
                                            value={empForm.dateJoined} 
                                            onChange={t => setEmpForm({...empForm, dateJoined: t})} 
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium mb-1">Doctor Name *</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={docForm.name} onChangeText={t => setDocForm({...docForm, name: t})} />
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium mb-1">Specialization</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={docForm.specialization} onChangeText={t => setDocForm({...docForm, specialization: t})} placeholder="e.g. Surgeon" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium mb-1">Contact *</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={docForm.contact} onChangeText={t => setDocForm({...docForm, contact: t})} keyboardType="phone-pad" />
                                    </View>
                                </View>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium mb-1">Clinic / Hospital</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={docForm.hospital} onChangeText={t => setDocForm({...docForm, hospital: t})} />
                                </View>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium mb-1">Visit Schedule / Availability</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={docForm.visitSchedule} onChangeText={t => setDocForm({...docForm, visitSchedule: t})} placeholder="e.g. Fridays, On Call" />
                                </View>
                            </>
                        )}
                    </ScrollView>
                    <View className="p-4 border-t border-gray-200 flex-row justify-end bg-white">
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} className="px-5 py-3 rounded-lg mr-3 bg-gray-100">
                            <Text className="font-semibold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} className="px-5 py-3 bg-primary rounded-lg">
                            <Text className="font-semibold text-white">Save</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
