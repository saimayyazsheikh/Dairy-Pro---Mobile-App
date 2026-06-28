import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomPicker from '../components/CustomPicker';
import CustomDatePicker from '../components/CustomDatePicker';
import { useCattle } from "../hooks/useCattle";
import { Plus, Search, Edit2, Trash2, X, Activity, MapPin, Syringe, AlertCircle, ChevronDown } from "lucide-react-native";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";

export default function Cattle() {
    const { cattle, loading, error, addCattle, updateCattle, deleteCattle } = useCattle();
    const { addToast } = useToast();
    const { confirm } = useConfirmation();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [currentCow, setCurrentCow] = useState(null);

    const initialFormState = {
        tagId: "", name: "", type: "Cow", breed: "", gender: "Female",
        dob: "", purchasedYear: "", status: "Milking", bms: "", motherId: "",
        fatherSemenCompany: "", location: "South 1", vaccinationDate: "",
        vaccinationType: "", turnOfPregnancy: "", inseminationDate: "",
        expectedDeliveryDate: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    const ALL_STATUSES = [
        "Milking", "Pregnant", "Pregnant 1st", "Dry", 
        "Ready To Inseminate", "Heifer", "Minor ( Calf )"
    ];

    const calculateAge = (dob, purchasedYear) => {
        if (!dob) return purchasedYear ? `${purchasedYear}` : "Unknown";
        const birthDate = new Date(dob);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days += prevMonth;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years}Y ${months}M ${days}D`;
    };

    const toggleStatus = (statusToToggle) => {
        const currentStatuses = formData.status ? formData.status.split(', ') : [];
        let newStatuses;
        if (currentStatuses.includes(statusToToggle)) {
            newStatuses = currentStatuses.filter(s => s !== statusToToggle);
        } else {
            newStatuses = [...currentStatuses, statusToToggle];
        }
        const newStatusString = newStatuses.join(', ');
        let newData = { ...formData, status: newStatusString };

        if (newStatusString.includes("Pregnant")) {
            if (!formData.expectedDeliveryDate) {
                const baseDate = formData.inseminationDate ? new Date(formData.inseminationDate) : new Date();
                const deliveryDate = new Date(baseDate);
                deliveryDate.setDate(deliveryDate.getDate() + 270);
                newData.expectedDeliveryDate = deliveryDate.toISOString().split('T')[0];
            }
        } else {
            newData.expectedDeliveryDate = "";
        }
        setFormData(newData);
    };

    const handleInseminationChange = (date) => {
        let newData = { ...formData, inseminationDate: date };
        if (formData.status && formData.status.includes("Pregnant")) {
            const baseDate = date ? new Date(date) : new Date();
            const deliveryDate = new Date(baseDate);
            deliveryDate.setDate(deliveryDate.getDate() + 270);
            newData.expectedDeliveryDate = deliveryDate.toISOString().split('T')[0];
        }
        setFormData(newData);
    };

    const isDueSoon = (dateString) => {
        if (!dateString) return false;
        const due = new Date(dateString);
        const today = new Date();
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-');
            return `${day}-${month}-${year}`;
        }
        return dateStr;
    };

    const filteredCattle = cattle.filter((cow) => {
        const matchesSearch =
            cow.tagId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cow.breed?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "All" || cow.type === filterType;
        const matchesStatus = filterStatus === "All" || (cow.status && cow.status.includes(filterStatus));
        return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => {
        return a.tagId.localeCompare(b.tagId, undefined, { numeric: true, sensitivity: 'base' });
    });

    const handleOpenModal = (cow = null) => {
        if (cow) {
            setCurrentCow(cow);
            setFormData({ ...initialFormState, ...cow });
        } else {
            setCurrentCow(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = { ...formData };
            delete payload.id;
            delete payload.createdAt;
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) payload[key] = "";
            });

            if (currentCow) {
                await updateCattle(currentCow.id, payload);
                addToast("Cattle record updated successfully", "success");
            } else {
                await addCattle(payload);
                addToast("New cattle added successfully", "success");
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error("Save error:", err);
            addToast(`Failed to save cattle record: ${err.message}`, "error");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm("This action cannot be undone. Are you sure you want to delete this record?", "Confirm Deletion");
        if (confirmed) {
            try {
                await deleteCattle(id);
                addToast("Record deleted successfully", "delete");
            } catch (err) {
                console.error("Delete error:", err);
                addToast("Failed to delete record: " + err.message, "error");
            }
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header & Search */}
            <View className="bg-white p-4 pt-6 border-b border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-gray-800">Livestock</Text>
                        <Text className="text-gray-500 text-xs">Track genealogy & health</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleOpenModal()} className="bg-primary px-3 py-2 rounded-lg flex-row items-center">
                        <Plus size={16} color="#fff" />
                        <Text className="text-white font-medium ml-1 text-sm">Add Animal</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="flex-row bg-gray-50 rounded-lg px-3 py-2 items-center border border-gray-200 mb-3">
                    <Search color="#9ca3af" size={18} />
                    <TextInput
                        className="flex-1 ml-2 text-gray-700"
                        placeholder="Search Tag ID, Name, Breed..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {/* Filters */}
                <View className="flex-row gap-2">
                    <View className="flex-1">
                        <CustomPicker
                            selectedValue={filterType}
                            onValueChange={setFilterType}
                            placeholder="Type"
                            items={[
                                { label: "All Types", value: "All" },
                                { label: "Heifer", value: "Heifer" },
                                { label: "Calf", value: "Calf" },
                                { label: "Cow", value: "Cow" },
                                { label: "Bull", value: "Bull" },
                                { label: "Buffalo", value: "Buffalo" }
                            ]}
                        />
                    </View>
                    <View className="flex-1">
                        <CustomPicker
                            selectedValue={filterStatus}
                            onValueChange={setFilterStatus}
                            placeholder="Status"
                            items={[
                                { label: "All Statuses", value: "All" },
                                ...ALL_STATUSES.map(s => ({ label: s, value: s }))
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View className="flex-1 items-center justify-center"><Text>Loading herd data...</Text></View>
            ) : error ? (
                <View className="flex-1 items-center justify-center"><Text className="text-red-500">{error}</Text></View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 100 }}>
                    {filteredCattle.length === 0 ? (
                        <Text className="text-center text-gray-500 mt-10">No records found.</Text>
                    ) : (
                        filteredCattle.map((cow) => (
                            <View key={cow.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
                                {/* Header Section */}
                                <View className="mb-3 flex-row justify-between items-start">
                                    <View>
                                        <View className="flex-row items-center">
                                            <Text className="text-xl font-bold text-gray-800">#{cow.tagId}</Text>
                                            {cow.motherId ? (
                                                <View className="ml-2 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">
                                                    <Text className="text-[10px] font-bold text-pink-600">M: {cow.motherId}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                        <Text className="text-xs text-gray-400 font-medium mt-0.5">{cow.name || "Unnamed"}</Text>
                                    </View>
                                    
                                    <View className="flex-col items-end gap-1">
                                        {(cow.status || "").split(', ').slice(0, 2).map((s, i) => {
                                            const bg = s === 'Milking' ? 'bg-green-100' : s.includes('Pregnant') ? 'bg-purple-100' : 'bg-gray-100';
                                            const tc = s === 'Milking' ? 'text-green-700' : s.includes('Pregnant') ? 'text-purple-700' : 'text-gray-700';
                                            return (
                                                <View key={i} className={`px-2 py-0.5 rounded-full ${bg}`}>
                                                    <Text className={`text-[10px] font-bold uppercase tracking-wide ${tc}`}>{s}</Text>
                                                </View>
                                            );
                                        })}
                                        {(cow.status || "").split(', ').length > 2 && <Text className="text-[10px] text-gray-400">+{((cow.status || "").split(', ').length - 2)} more</Text>}
                                    </View>
                                </View>

                                {/* IDENTITY Block */}
                                <View className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                    <Text className="text-[10px] text-gray-500 font-bold uppercase mb-2">IDENTITY</Text>
                                    <View className="flex-row justify-between flex-wrap">
                                        <View className="w-1/2 mb-2"><Text className="text-[10px] text-gray-400 uppercase">Type</Text><Text className="text-sm font-bold text-gray-800">{cow.type}</Text></View>
                                        <View className="w-1/2 mb-2"><Text className="text-[10px] text-gray-400 uppercase">Breed</Text><Text className="text-sm font-bold text-gray-800">{cow.breed}</Text></View>
                                        <View className="w-1/2"><Text className="text-[10px] text-gray-400 uppercase">Age</Text><Text className="text-sm font-bold text-gray-800">{calculateAge(cow.dob, cow.purchasedYear)}</Text></View>
                                        <View className="w-1/2"><Text className="text-[10px] text-gray-400 uppercase">Gender</Text><Text className="text-sm font-bold text-gray-800">{cow.gender}</Text></View>
                                    </View>
                                </View>

                                {/* INSEMINATION & HEALTH */}
                                <View className="flex-row mb-3 gap-2">
                                    <View className="flex-1 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                        <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Insemination</Text>
                                        <Text className="text-sm font-medium text-gray-800">
                                            {cow.inseminationDate ? formatDate(cow.inseminationDate) : 'No record'}
                                        </Text>
                                        {cow.expectedDeliveryDate && (
                                            <Text className={`text-xs font-bold mt-1 ${isDueSoon(cow.expectedDeliveryDate) ? "text-red-600" : "text-purple-700"}`}>
                                                Exp: {formatDate(cow.expectedDeliveryDate)}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <Text className="text-[10px] text-gray-500 font-bold uppercase mb-1">Health/BMS</Text>
                                        <Text className="text-sm font-bold text-gray-800 truncate">{cow.vaccinationType || 'No Vax'}</Text>
                                        <Text className="text-xs text-gray-500 font-medium">BMS: {cow.bms || '-'}</Text>
                                    </View>
                                </View>

                                {/* Footer & Actions */}
                                <View className="flex-row justify-between items-center mt-1">
                                    <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        <MapPin size={12} color="#9ca3af" />
                                        <Text className="text-xs font-semibold text-gray-600 ml-1">{cow.location}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity onPress={() => handleOpenModal(cow)} className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                                            <Edit2 size={16} color="#2563eb" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(cow.id)} className="p-2 bg-red-50 rounded-lg border border-red-100">
                                            <Trash2 size={16} color="#dc2626" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Modal for Add/Edit */}
            <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                        <Text className="text-lg font-bold text-gray-800">{currentCow ? "Edit Record" : "New Animal Registration"}</Text>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Identification</Text>
                        
                        <Text className="text-sm font-medium text-gray-700 mb-1">Tag ID *</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-3" value={formData.tagId} onChangeText={(val) => setFormData({...formData, tagId: val})} />
                        
                        <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-3" value={formData.name} onChangeText={(val) => setFormData({...formData, name: val})} />
                        
                        <Text className="text-sm font-medium text-gray-700 mb-1">Breed *</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-3" value={formData.breed} onChangeText={(val) => setFormData({...formData, breed: val})} />

                        <Text className="text-sm font-medium text-gray-700 mb-1">Category *</Text>
                        <View className="mb-3">
                            <CustomPicker 
                                selectedValue={formData.type} 
                                onValueChange={(val) => setFormData({...formData, type: val})}
                                placeholder="Select Category"
                                items={[
                                    { label: "Heifer", value: "Heifer" },
                                    { label: "Calf", value: "Calf" },
                                    { label: "Cow", value: "Cow" },
                                    { label: "Bull", value: "Bull" },
                                    { label: "Buffalo", value: "Buffalo" }
                                ]}
                            />
                        </View>

                        <Text className="text-sm font-medium text-gray-700 mb-1">Gender</Text>
                        <View className="mb-4">
                            <CustomPicker 
                                selectedValue={formData.gender} 
                                onValueChange={(val) => setFormData({...formData, gender: val})}
                                placeholder="Select Gender"
                                items={[
                                    { label: "Female", value: "Female" },
                                    { label: "Male", value: "Male" }
                                ]}
                            />
                        </View>

                        <CustomDatePicker 
                            label="Date of Birth"
                            value={formData.dob} 
                            onChange={(val) => setFormData({...formData, dob: val})} 
                        />

                        <Text className="text-sm font-medium text-gray-700 mb-1">Purchased Year</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-4" value={formData.purchasedYear} onChangeText={(val) => setFormData({...formData, purchasedYear: val})} keyboardType="number-pad" />

                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">Status & Reproduction</Text>
                        
                        <Text className="text-sm font-medium text-gray-700 mb-1">Current Statuses (Tap to toggle)</Text>
                        <View className="flex-row flex-wrap mb-4">
                            {ALL_STATUSES.map(s => {
                                const isSelected = (formData.status || "").split(', ').includes(s);
                                return (
                                    <TouchableOpacity 
                                        key={s} 
                                        onPress={() => toggleStatus(s)}
                                        className={`px-3 py-1.5 rounded-full border mr-2 mb-2 ${isSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-300'}`}
                                    >
                                        <Text className={`text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <CustomDatePicker 
                            label="Insemination Date"
                            value={formData.inseminationDate} 
                            onChange={handleInseminationChange} 
                        />

                        <Text className="text-sm font-medium text-gray-700 mb-1">Father Semen Company</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-4" value={formData.fatherSemenCompany} onChangeText={(val) => setFormData({...formData, fatherSemenCompany: val})} />

                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">Health & Location</Text>

                        <Text className="text-sm font-medium text-gray-700 mb-1">Body Mass Score (20-100)</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-3" value={formData.bms} onChangeText={(val) => setFormData({...formData, bms: val})} keyboardType="number-pad" />

                        <CustomDatePicker 
                            label="Vaccination Date"
                            value={formData.vaccinationDate} 
                            onChange={(val) => setFormData({...formData, vaccinationDate: val})} 
                        />
                        
                        <Text className="text-sm font-medium text-gray-700 mb-1">Vaccination Type</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-3" value={formData.vaccinationType} onChangeText={(val) => setFormData({...formData, vaccinationType: val})} />

                        <Text className="text-sm font-medium text-gray-700 mb-1">Location *</Text>
                        <View className="mb-3">
                            <CustomPicker 
                                selectedValue={formData.location} 
                                onValueChange={(val) => setFormData({...formData, location: val})}
                                placeholder="Select Location"
                                items={[
                                    { label: "South 1", value: "South 1" },
                                    { label: "South 2", value: "South 2" },
                                    { label: "South 3", value: "South 3" },
                                    { label: "North 1", value: "North 1" },
                                    { label: "North 2", value: "North 2" },
                                    { label: "North 3", value: "North 3" },
                                    { label: "Calf East", value: "Calf East" },
                                    { label: "Calf West", value: "Calf West" }
                                ]}
                            />
                        </View>

                        <Text className="text-sm font-medium text-gray-700 mb-1">Mother ID (Optional)</Text>
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-10" value={formData.motherId} onChangeText={(val) => setFormData({...formData, motherId: val})} />
                    
                    </ScrollView>

                    {/* Bottom Action Bar */}
                    <View className="p-4 bg-white border-t border-gray-200 flex-row justify-end">
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} className="px-5 py-3 rounded-lg mr-3 bg-gray-100">
                            <Text className="font-semibold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} className="px-5 py-3 bg-primary rounded-lg">
                            <Text className="font-semibold text-white">{currentCow ? "Update Record" : "Save Record"}</Text>
                        </TouchableOpacity>
                    </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
