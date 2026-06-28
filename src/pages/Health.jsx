import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomPicker from '../components/CustomPicker';
import CustomDatePicker from '../components/CustomDatePicker';
import { useHealth } from "../hooks/useHealth";
import { useCattle } from "../hooks/useCattle";
import { useHR } from "../hooks/useHR";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { Activity, Syringe, HeartPulse, Stethoscope, Plus, X, Search, Calendar, Edit2, Trash2, Filter, Check, ChevronDown, CheckSquare, Square } from "lucide-react-native";

// Helper Component for Multi-Select in React Native
const MultiSelect = ({ options, selectedValues, onChange, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isAllSelected = options.length > 0 && selectedValues.length === options.length;

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const toggleAll = () => {
        if (isAllSelected) {
            onChange([]);
        } else {
            onChange(options.map(o => o.value));
        }
    };

    return (
        <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
            <TouchableOpacity
                className="w-full p-3 border border-gray-300 rounded-lg flex-row justify-between items-center bg-white"
                onPress={() => setIsOpen(true)}
            >
                <View className="flex-1 flex-row flex-wrap">
                    {selectedValues.length === 0 ? (
                        <Text className="text-gray-400">{placeholder}</Text>
                    ) : selectedValues.length === options.length ? (
                        <Text className="font-semibold text-green-700">All Animals Selected ({options.length})</Text>
                    ) : (
                        <Text className="text-gray-800">{selectedValues.length} Animal(s) Selected</Text>
                    )}
                </View>
                <ChevronDown size={16} color="#6b7280" />
            </TouchableOpacity>

            <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold">Select Animals</Text>
                        <TouchableOpacity onPress={() => setIsOpen(false)}>
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                    <View className="p-3 border-b border-gray-200">
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Search size={16} color="#9ca3af" />
                            <TextInput
                                className="flex-1 ml-2"
                                placeholder="Search..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <TouchableOpacity
                            className="p-3 mb-2 flex-row items-center rounded-lg bg-green-50 border border-green-100"
                            onPress={toggleAll}
                        >
                            {isAllSelected ? <CheckSquare size={20} color="#16a34a" className="mr-3" /> : <Square size={20} color="#9ca3af" className="mr-3" />}
                            <Text className="font-semibold text-green-700">Select All Animals</Text>
                        </TouchableOpacity>

                        {filteredOptions.length === 0 ? (
                            <Text className="text-center text-gray-500 mt-4">No animals found.</Text>
                        ) : (
                            filteredOptions.map(opt => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        className={`p-3 mb-2 flex-row items-center rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                                        onPress={() => toggleOption(opt.value)}
                                    >
                                        {isSelected ? <CheckSquare size={20} color="#2563eb" className="mr-3" /> : <Square size={20} color="#9ca3af" className="mr-3" />}
                                        <Text className={`text-sm ${isSelected ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>{opt.label}</Text>
                                    </TouchableOpacity>
                                )
                            })
                        )}
                    </ScrollView>
                    <View className="p-4 border-t border-gray-200">
                        <TouchableOpacity onPress={() => setIsOpen(false)} className="bg-primary p-3 rounded-lg items-center">
                            <Text className="text-white font-bold">Done</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

export default function Health() {
    const { records, loading, addHealthRecord, deleteHealthRecord, updateHealthRecord } = useHealth();
    const { addToast } = useToast();
    const { confirm } = useConfirmation();
    const { cattle } = useCattle();
    const { doctors } = useHR();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [filters, setFilters] = useState({
        search: "", type: "All", startDate: "", endDate: ""
    });

    const [activeFormType, setActiveFormType] = useState("Vaccination");

    const initialFormState = {
        cowIds: [], date: new Date().toISOString().split("T")[0],
        doctorName: "", medicineCost: "", doctorFee: "",
        vaccineName: "FMD", nextDueDate: "",
        semenName: "", semenCompany: "", semenColor: "", expectedDeliveryDate: "",
        diagnosis: "", treatment: "", symptoms: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const vaccineOptions = ["FMD", "Toxipra", "Will", "Brucella", "Theleria", "Lumpy"];

    useEffect(() => {
        if (activeFormType === "Insemination" && formData.date) {
            const d = new Date(formData.date);
            d.setDate(d.getDate() + 270);
            setFormData(prev => ({ ...prev, expectedDeliveryDate: d.toISOString().split("T")[0] }));
        }
    }, [formData.date, activeFormType]);

    const filteredRecords = records.filter(record => {
        const searchLower = filters.search.toLowerCase().trim();
        const searchContent = `${record.cowTag} ${record.vaccineName} ${record.doctorName} ${record.semenName}`.toLowerCase();
        const matchesStandard = searchContent.includes(searchLower);
        
        const isGlobalRecord = record.cowId === "ALL";
        const searchTermIsTag = searchLower.length > 0 && cattle.some(c => c.tagId.toLowerCase().includes(searchLower));
        const matchesGlobalContext = isGlobalRecord && searchTermIsTag;
        
        const matchesSearch = matchesStandard || matchesGlobalContext;
        const matchesType = filters.type === 'All' || record.recordType === filters.type;
        
        let matchesDate = true;
        if (filters.startDate) matchesDate = matchesDate && new Date(record.date) >= new Date(filters.startDate);
        if (filters.endDate) matchesDate = matchesDate && new Date(record.date) <= new Date(filters.endDate);

        return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => {
        const searchLower = filters.search.toLowerCase().trim();
        if (!searchLower) return new Date(b.date) - new Date(a.date); // Default: Newest first
        
        const aIsExact = a.cowTag.toLowerCase().includes(searchLower) && a.cowId !== "ALL";
        const bIsExact = b.cowTag.toLowerCase().includes(searchLower) && b.cowId !== "ALL";

        if (aIsExact && !bIsExact) return -1;
        if (!aIsExact && bIsExact) return 1;
        return 0;
    });

    const handleEdit = (record) => {
        setEditingId(record.id);
        setActiveFormType(record.recordType);
        setFormData({
            date: record.date, doctorName: record.doctorName || "",
            medicineCost: record.medicineCost?.toString() || "", doctorFee: record.doctorFee?.toString() || "",
            cowIds: [record.cowId],
            vaccineName: record.vaccineName || "FMD", nextDueDate: record.nextDueDate || "",
            semenName: record.semenName || "", semenCompany: record.semenCompany || "",
            semenColor: record.semenColor || "", expectedDeliveryDate: record.expectedDeliveryDate || "",
            diagnosis: record.diagnosis || "", treatment: record.treatment || "", symptoms: record.symptoms || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const targets = formData.cowIds;
            if (targets.length === 0) {
                addToast("Please select at least one animal", "error");
                return;
            }

            if (editingId) {
                const payload = {
                    date: formData.date, recordType: activeFormType,
                    cowId: targets[0], cowTag: cattle.find(c => c.id === targets[0])?.tagId || "Unknown",
                    doctorName: formData.doctorName,
                    medicineCost: parseFloat(formData.medicineCost) || 0,
                    doctorFee: parseFloat(formData.doctorFee) || 0,
                    ...(activeFormType === 'Vaccination' ? { vaccineName: formData.vaccineName, nextDueDate: formData.nextDueDate } : 
                        activeFormType === 'Insemination' ? { semenName: formData.semenName, semenCompany: formData.semenCompany, semenColor: formData.semenColor, expectedDeliveryDate: formData.expectedDeliveryDate } : 
                        { diagnosis: formData.diagnosis, treatment: formData.treatment, symptoms: formData.symptoms })
                };
                await updateHealthRecord(editingId, payload);
            } else {
                const isAllAnimals = targets.length === cattle.length && cattle.length > 0;
                
                if (isAllAnimals) {
                    const payload = {
                        date: formData.date, recordType: activeFormType, cowId: "ALL", cowTag: "All Animals",
                        doctorName: formData.doctorName,
                        medicineCost: (parseFloat(formData.medicineCost) || 0) * cattle.length,
                        doctorFee: (parseFloat(formData.doctorFee) || 0) * cattle.length,
                        ...(activeFormType === 'Vaccination' ? { vaccineName: formData.vaccineName, nextDueDate: formData.nextDueDate } : 
                            activeFormType === 'Insemination' ? { semenName: formData.semenName, semenCompany: formData.semenCompany, semenColor: formData.semenColor, expectedDeliveryDate: formData.expectedDeliveryDate } : 
                            { diagnosis: formData.diagnosis, treatment: formData.treatment, symptoms: formData.symptoms })
                    };
                    await addHealthRecord(payload);
                } else {
                    const promises = targets.map(id => {
                        const cow = cattle.find(c => c.id === id);
                        return addHealthRecord({
                            date: formData.date, recordType: activeFormType, cowId: id, cowTag: cow ? cow.tagId : "Unknown",
                            doctorName: formData.doctorName,
                            medicineCost: parseFloat(formData.medicineCost) || 0,
                            doctorFee: parseFloat(formData.doctorFee) || 0,
                            ...(activeFormType === 'Vaccination' ? { vaccineName: formData.vaccineName, nextDueDate: formData.nextDueDate } : 
                                activeFormType === 'Insemination' ? { semenName: formData.semenName, semenCompany: formData.semenCompany, semenColor: formData.semenColor, expectedDeliveryDate: formData.expectedDeliveryDate } : 
                                { diagnosis: formData.diagnosis, treatment: formData.treatment, symptoms: formData.symptoms })
                        });
                    });
                    await Promise.all(promises);
                }
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData(initialFormState);
            addToast(editingId ? "Record updated" : "Record(s) added", "success");
        } catch (err) {
            addToast("Failed to save record", "error");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm("Are you sure you want to delete this record?");
        if (confirmed) {
            try {
                await deleteHealthRecord(id);
                addToast("Record deleted", "delete");
            } catch (err) {
                addToast("Failed to delete record", "error");
            }
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 pt-6 border-b border-gray-200">
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800">Medical & Health</Text>
                    <Text className="text-gray-500 text-xs">Veterinary care & vaccinations</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }}
                    className="bg-red-500 px-4 py-3 rounded-lg flex-row items-center justify-center"
                >
                    <Plus size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2">Record Medical Event</Text>
                </TouchableOpacity>
            </View>

            {/* Content List */}
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Filters */}
                <View className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                    <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
                        <Search size={18} color="#9ca3af" />
                        <TextInput 
                            className="flex-1 ml-2" 
                            placeholder="Search Animal, Doctor, Vaccine..." 
                            value={filters.search} 
                            onChangeText={t => setFilters({...filters, search: t})} 
                        />
                    </View>
                    <View className="flex-row gap-2 mb-2">
                        <View className="flex-1">
                            <CustomPicker 
                                selectedValue={filters.type} 
                                onValueChange={t => setFilters({...filters, type: t})}
                                placeholder="Type"
                                items={[
                                    { label: "All Types", value: "All" },
                                    { label: "Vaccination", value: "Vaccination" },
                                    { label: "Insemination", value: "Insemination" },
                                    { label: "Checkup", value: "Checkup" }
                                ]}
                            />
                        </View>
                    </View>
                    <View className="flex-row gap-2 mb-2">
                        <View className="flex-1">
                            <CustomDatePicker 
                                containerClassName=""
                                placeholder="Start Date" 
                                value={filters.startDate} 
                                onChange={t => setFilters({...filters, startDate: t})} 
                            />
                        </View>
                        <View className="flex-1">
                            <CustomDatePicker 
                                containerClassName=""
                                placeholder="End Date" 
                                value={filters.endDate} 
                                onChange={t => setFilters({...filters, endDate: t})} 
                            />
                        </View>
                    </View>
                    {(filters.search || filters.type !== 'All' || filters.startDate || filters.endDate) && (
                        <TouchableOpacity 
                            onPress={() => setFilters({ search: "", type: "All", startDate: "", endDate: "" })}
                            className="mt-3 bg-red-50 py-2 rounded items-center"
                        >
                            <Text className="text-red-500 font-medium">Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* List */}
                <View className="flex-row items-center mb-3 px-1">
                    <HeartPulse size={20} color="#ef4444" className="mr-2" />
                    <Text className="text-lg font-bold text-gray-800">Medical History</Text>
                    <Text className="text-xs text-gray-500 ml-auto">{filteredRecords.length} records</Text>
                </View>

                {loading ? (
                    <Text className="text-center text-gray-500 mt-10">Loading records...</Text>
                ) : filteredRecords.length === 0 ? (
                    <Text className="text-center text-gray-500 mt-10">No matching records found.</Text>
                ) : (
                    filteredRecords.map((record) => {
                        const totalCost = (parseFloat(record.medicineCost) || 0) + (parseFloat(record.doctorFee) || 0);
                        const isVacc = record.recordType === 'Vaccination';
                        const isInsem = record.recordType === 'Insemination';
                        const badgeColor = isVacc ? 'bg-green-100 text-green-700 border-green-200' : isInsem ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200';

                        return (
                            <View key={record.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                                <View className="flex-row justify-between items-center border-b border-gray-100 pb-2 mb-3">
                                    <Text className="font-bold text-lg text-gray-900">
                                        {record.cowId === "ALL" ? "All Animals" : `#${record.cowTag}`}
                                    </Text>
                                    <Text className="font-bold text-gray-700 text-sm">
                                        {record.date.split("-").reverse().join("-")}
                                    </Text>
                                </View>

                                <View className="flex-row items-center gap-2 mb-3">
                                    <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">EVENT TYPE</Text>
                                    <View className={`px-2 py-0.5 rounded border ${badgeColor.split(' ')[0]} ${badgeColor.split(' ')[2]}`}>
                                        <Text className={`text-xs font-bold uppercase tracking-wide ${badgeColor.split(' ')[1]}`}>{record.recordType}</Text>
                                    </View>
                                </View>

                                <View className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                    {isVacc && (
                                        <View>
                                            <Text className="font-semibold text-green-800">{record.vaccineName}</Text>
                                            {record.nextDueDate && <Text className="text-orange-600 text-xs mt-1">Due: {record.nextDueDate}</Text>}
                                        </View>
                                    )}
                                    {isInsem && (
                                        <View>
                                            <Text className="font-semibold text-purple-800">{record.semenName} <Text className="text-gray-500 text-xs font-normal">({record.semenCompany})</Text></Text>
                                            {record.expectedDeliveryDate && <Text className="text-orange-600 text-xs font-bold mt-1">Exp: {record.expectedDeliveryDate}</Text>}
                                        </View>
                                    )}
                                    {!isVacc && !isInsem && (
                                        <View>
                                            <Text className="font-semibold text-gray-800">{record.diagnosis || "No Diagnosis"}</Text>
                                            <Text className="text-gray-600 text-xs italic mt-1">{record.treatment || "No Treatment"}</Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row justify-between mb-3">
                                    <View>
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">DOCTOR</Text>
                                        <Text className="font-semibold text-gray-800 text-sm">{record.doctorName || "Self"}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">COST</Text>
                                        <Text className="font-bold text-green-700 text-sm">Rs {totalCost.toLocaleString()}</Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-end gap-2 border-t border-gray-100 pt-3">
                                    <TouchableOpacity onPress={() => handleEdit(record)} className="p-2 bg-blue-50 rounded-lg">
                                        <Edit2 size={18} color="#2563eb" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(record.id)} className="p-2 bg-red-50 rounded-lg">
                                        <Trash2 size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Modal */}
            <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                        <Text className="text-lg font-bold text-gray-800">{editingId ? 'Edit Event' : 'Record Event'}</Text>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>

                    {!editingId && (
                        <View className="flex-row p-4 border-b border-gray-100 bg-white">
                            {['Vaccination', 'Insemination', 'Checkup'].map(type => (
                                <TouchableOpacity 
                                    key={type} 
                                    onPress={() => { setActiveFormType(type); setFormData(initialFormState); }}
                                    className={`flex-1 py-2 items-center rounded-md ${activeFormType === type ? 'bg-red-50 border border-red-100' : 'bg-transparent'}`}
                                >
                                    <Text className={`text-sm font-medium ${activeFormType === type ? 'text-red-600' : 'text-gray-500'}`}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <CustomDatePicker 
                                    label="Date"
                                    value={formData.date} 
                                    onChange={t => setFormData({...formData, date: t})} 
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-1">Doctor</Text>
                                <View>
                                    <CustomPicker 
                                        selectedValue={formData.doctorName} 
                                        onValueChange={t => setFormData({...formData, doctorName: t})}
                                        placeholder="Select Doctor..."
                                        items={[
                                            ...doctors.map(d => ({ label: d.name, value: d.name })),
                                            { label: "Self / Staff", value: "Self" }
                                        ]}
                                    />
                                </View>
                            </View>
                        </View>

                        {activeFormType === 'Vaccination' && !editingId ? (
                            <MultiSelect 
                                label="Affected Animals *"
                                placeholder="Select Animals..."
                                options={cattle.map(c => ({ value: c.id, label: `${c.tagId} - ${c.status}` }))}
                                selectedValues={formData.cowIds}
                                onChange={(newValues) => setFormData({ ...formData, cowIds: newValues })}
                            />
                        ) : (
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">Select Animal *</Text>
                                <View className={editingId ? 'opacity-50' : ''} pointerEvents={editingId ? 'none' : 'auto'}>
                                    <CustomPicker 
                                        selectedValue={formData.cowIds[0] || ""} 
                                        onValueChange={t => setFormData({...formData, cowIds: [t]})}
                                        placeholder="Select Cow..."
                                        items={cattle.map(c => ({ label: `${c.tagId} - ${c.status}`, value: c.id }))}
                                    />
                                </View>
                            </View>
                        )}

                        {activeFormType === 'Vaccination' && (
                            <>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Vaccine Name *</Text>
                                    <View>
                                        <CustomPicker 
                                            selectedValue={formData.vaccineName} 
                                            onValueChange={t => setFormData({...formData, vaccineName: t})}
                                            placeholder="Select Vaccine..."
                                            items={vaccineOptions.map(v => ({ label: v, value: v }))}
                                        />
                                    </View>
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Med Cost</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.medicineCost} onChangeText={t => setFormData({...formData, medicineCost: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Dr. Fee</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.doctorFee} onChangeText={t => setFormData({...formData, doctorFee: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                </View>
                                <View className="mb-4">
                                    <CustomDatePicker 
                                        label="Next Due Date"
                                        value={formData.nextDueDate} 
                                        onChange={t => setFormData({...formData, nextDueDate: t})} 
                                    />
                                </View>
                            </>
                        )}

                        {activeFormType === 'Insemination' && (
                            <>
                                <View className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                                    <Text className="font-semibold text-purple-800 mb-3">Semen Details</Text>
                                    <View className="flex-row gap-3 mb-3">
                                        <TextInput className="flex-1 p-3 border border-gray-200 bg-white rounded-lg text-gray-800" placeholderTextColor="#9ca3af" placeholder="Semen Name" value={formData.semenName} onChangeText={t => setFormData({...formData, semenName: t})} />
                                        <TextInput className="flex-1 p-3 border border-gray-200 bg-white rounded-lg text-gray-800" placeholderTextColor="#9ca3af" placeholder="Company" value={formData.semenCompany} onChangeText={t => setFormData({...formData, semenCompany: t})} />
                                    </View>
                                    <View className="flex-row gap-3">
                                        <TextInput className="flex-1 p-3 border border-gray-200 bg-white rounded-lg text-gray-800" placeholderTextColor="#9ca3af" placeholder="Color" value={formData.semenColor} onChangeText={t => setFormData({...formData, semenColor: t})} />
                                    </View>
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Med Cost</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.medicineCost} onChangeText={t => setFormData({...formData, medicineCost: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Dr. Fee</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.doctorFee} onChangeText={t => setFormData({...formData, doctorFee: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                </View>
                                <View className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-4">
                                    <Text className="text-orange-700 font-medium">Expected Delivery:</Text>
                                    <Text className="text-xl font-bold text-orange-800 mt-1">{formData.expectedDeliveryDate || '---'}</Text>
                                </View>
                            </>
                        )}

                        {activeFormType === 'Checkup' && (
                            <>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Diagnosis / Illness</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.diagnosis} onChangeText={t => setFormData({...formData, diagnosis: t})} />
                                </View>
                                <View className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">Treatment</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" multiline numberOfLines={3} value={formData.treatment} onChangeText={t => setFormData({...formData, treatment: t})} textAlignVertical="top" />
                                </View>
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Med Cost</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.medicineCost} onChangeText={t => setFormData({...formData, medicineCost: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Dr. Fee</Text>
                                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 bg-white" placeholderTextColor="#9ca3af" value={formData.doctorFee} onChangeText={t => setFormData({...formData, doctorFee: t})} keyboardType="numeric" placeholder="0" />
                                    </View>
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View className="p-4 border-t border-gray-200 flex-row justify-end bg-white">
                        <TouchableOpacity onPress={() => setIsModalOpen(false)} className="px-5 py-3 rounded-lg mr-3 bg-gray-100">
                            <Text className="font-semibold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSubmit} className="px-5 py-3 bg-green-600 rounded-lg">
                            <Text className="font-semibold text-white">Save Record</Text>
                        </TouchableOpacity>
                    </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
