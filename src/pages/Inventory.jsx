import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomPicker from '../components/CustomPicker';
import { useInventory } from "../hooks/useInventory";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { Package, AlertTriangle, Plus, Edit2, Trash2, X, ClipboardList, History, Repeat, Clock } from "lucide-react-native";

export default function Inventory() {
    const { items, usageLogs, templates, loading, addItem, updateItem, deleteItem, logUsage, deleteUsageLog, addTemplate, deleteTemplate, runRecurringTemplates, cleanUpDuplicates } = useInventory();
    const { addToast } = useToast();
    const { confirm } = useConfirmation();

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    useEffect(() => {
        const runAutoLogs = async () => {
            const deleted = await cleanUpDuplicates();
            if (deleted > 0) addToast(`Cleanup: Removed ${deleted} duplicate logs.`, "warning");

            const count = await runRecurringTemplates();
            if (count > 0) addToast(`Auto-logged ${count} recurring feed entries.`, "info");
        };
        runAutoLogs();
    }, []);

    const [itemForm, setItemForm] = useState({
        name: "", category: "Feed", subCategory: "", brand: "", feedType: "", quantity: "", unit: "", cost: "", lowStockThreshold: "", isCustomBrand: false
    });

    const categoryOptions = {
        "Feed": {
            color: "bg-green-100 border-green-200 text-green-800",
            subCategories: [
                { name: "Silage", unit: "Mund" }, { name: "Grain Fodder", unit: "Kanal" }, { name: "Wheat Straw", unit: "Mund" }, { name: "Hay", unit: "Mund" }, { name: "Wanda", unit: "Bag" }, { name: "Self Entry", unit: "" },
            ]
        },
        "Minerals": {
            color: "bg-blue-100 border-blue-200 text-blue-800",
            subCategories: [
                { name: "Fat 84%", unit: "Bag" }, { name: "Fat 99%", unit: "Bag" }, { name: "DCP Organic", unit: "Bag" }, { name: "DCP Inorganic", unit: "Bag" }, { name: "Sodium Bicarbonate", unit: "Bag" }, { name: "Molasses", unit: "KG" }, { name: "Yeast", unit: "KG" }, { name: "Namak", unit: "Stone" }, { name: "Self Entry", unit: "" },
            ]
        },
        "Medicine": { color: "bg-red-100 border-red-200 text-red-800", subCategories: [] },
        "Vaccine": { color: "bg-orange-100 border-orange-200 text-orange-800", subCategories: [] },
        "Semen": { color: "bg-purple-100 border-purple-200 text-purple-800", subCategories: [] },
    };

    const wandaOptions = {
        brands: ["Ahsan Feed Mills", "Hamid", "Self Entry"],
        types: ["Calf Starter", "Customized", "Heifers", "Meat", "Milking"],
    };

    const [usageForm, setUsageForm] = useState({
        itemId: "", quantity: "", note: "", isRecurring: false
    });

    const handleOpenItemModal = (item = null) => {
        if (item) {
            setCurrentItem(item);
            const isCustom = item.subCategory === "Wanda" && item.brand && !wandaOptions.brands.includes(item.brand);
            setItemForm({
                name: item.name, category: item.category, subCategory: item.subCategory || "", brand: item.brand || "", feedType: item.feedType || "",
                quantity: item.quantity?.toString() || "", unit: item.unit || "", cost: item.cost?.toString() || "", lowStockThreshold: item.lowStockThreshold?.toString() || "", isCustomBrand: isCustom
            });
        } else {
            setCurrentItem(null);
            setItemForm({
                name: "", category: "Feed", subCategory: "", brand: "", feedType: "", quantity: "", unit: "", cost: "", lowStockThreshold: "", isCustomBrand: false
            });
        }
        setIsItemModalOpen(true);
    };

    const handleItemSubmit = async () => {
        try {
            const { isCustomBrand, ...formToSave } = itemForm;
            const data = {
                ...formToSave,
                quantity: parseFloat(itemForm.quantity) || 0,
                cost: parseFloat(itemForm.cost) || 0,
                lowStockThreshold: parseFloat(itemForm.lowStockThreshold) || 0
            };

            const existingItem = items.find(
                item => item.name.toLowerCase() === itemForm.name.toLowerCase() &&
                    item.subCategory === itemForm.subCategory &&
                    (!currentItem || item.id !== currentItem.id)
            );

            if (existingItem) {
                const newQuantity = parseFloat(existingItem.quantity) + data.quantity;
                await updateItem(existingItem.id, {
                    ...data,
                    quantity: newQuantity,
                    cost: data.cost || existingItem.cost
                });
                addToast(`Merged with "${existingItem.name}".`, "success");
            } else {
                if (currentItem) {
                    await updateItem(currentItem.id, data);
                    addToast("Item updated", "success");
                } else {
                    await addItem(data);
                    addToast("Item added", "success");
                }
            }
            setIsItemModalOpen(false);
        } catch (err) {
            addToast("Failed to save item", "error");
        }
    };

    useEffect(() => {
        if (currentItem) return;
        const { category, subCategory, brand, feedType } = itemForm;
        let generatedName = itemForm.name;

        if (category === "Feed" && subCategory === "Wanda") {
            if (brand && feedType) generatedName = `Wanda ${brand} - ${feedType}`;
        } else if ((category === "Feed" || category === "Minerals") && subCategory && subCategory !== "Self Entry") {
            generatedName = subCategory;
        }

        if (subCategory !== "Self Entry" && generatedName !== itemForm.name) {
            setItemForm(prev => ({ ...prev, name: generatedName }));
        }
    }, [itemForm.category, itemForm.subCategory, itemForm.brand, itemForm.feedType]);

    const handleSubCategoryChange = (sub) => {
        const catConfig = categoryOptions[itemForm.category];
        const subConfig = catConfig?.subCategories.find(s => s.name === sub);
        setItemForm(prev => ({
            ...prev,
            subCategory: sub,
            unit: subConfig ? subConfig.unit : prev.unit,
            brand: sub === "Wanda" ? prev.brand : "",
            feedType: sub === "Wanda" ? prev.feedType : "",
        }));
    };

    const handleDeleteClick = async (id) => {
        if (await confirm("Delete this item? This action cannot be undone.")) {
            try {
                await deleteItem(id);
                addToast("Item deleted", "delete");
            } catch (error) {
                addToast("Failed to delete", "error");
            }
        }
    };

    const handleUsageSubmit = async () => {
        try {
            const usedItem = items.find(i => i.id === usageForm.itemId);
            if (!usedItem) {
                addToast("Select an item first", "error");
                return;
            }

            const qty = parseFloat(usageForm.quantity) || 0;
            const totalCost = qty * (parseFloat(usedItem.cost) || 0);

            await logUsage(usageForm.itemId, qty, usageForm.note);

            if (usageForm.isRecurring) {
                await addTemplate({
                    itemId: usageForm.itemId,
                    itemName: usedItem.name,
                    quantity: qty,
                    unit: usedItem.unit,
                    isActive: true,
                    note: usageForm.note || "Daily Recurring",
                    lastRunDate: new Date().toISOString().split("T")[0]
                });
                addToast("Recurring template saved", "info");
            }

            addToast(`Logged. Expense: Rs ${totalCost.toLocaleString()}`, "success");
            setUsageForm({ itemId: "", quantity: "", note: "", isRecurring: false });
        } catch (err) {
            addToast("Failed to log usage", "error");
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (await confirm("Delete this recurring template?")) {
            await deleteTemplate(id);
            addToast("Template removed", "delete");
        }
    };

    const handleDeleteLogClick = async (id) => {
        if (await confirm("Delete log and restore stock?")) {
            try {
                await deleteUsageLog(id);
                addToast("Log deleted & stock restored", "delete");
            } catch (error) {
                addToast("Failed to delete", "error");
            }
        }
    };

    const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white p-4 pt-6 border-b border-gray-200">
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800">Inventory & Feed</Text>
                    <Text className="text-gray-500 text-xs">Manage stocks and feed distribution</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => handleOpenItemModal()}
                    className="bg-primary px-4 py-3 rounded-lg flex-row items-center justify-center"
                >
                    <Plus size={20} color="#fff" />
                    <Text className="text-white font-bold ml-2">Add Item</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {lowStockItems.length > 0 && (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex-row items-start shadow-sm">
                        <AlertTriangle color="#ef4444" size={24} className="mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="text-red-800 font-bold text-lg mb-1">Low Stock Alert</Text>
                            {lowStockItems.map(item => (
                                <Text key={item.id} className="text-red-600 text-sm mb-1">
                                    <Text className="font-semibold">{item.name}</Text>: {item.quantity} {item.unit} left (Reorder at {item.lowStockThreshold})
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Log Usage Form */}
                <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <View className="flex-row items-center mb-4">
                        <ClipboardList color="#16a34a" size={20} className="mr-2" />
                        <Text className="text-lg font-bold text-gray-800">Log Daily Usage</Text>
                    </View>

                    <Text className="text-sm font-medium text-gray-700 mb-1">Select Item *</Text>
                    <View className="mb-3">
                        <CustomPicker 
                            selectedValue={usageForm.itemId} 
                            onValueChange={t => setUsageForm({...usageForm, itemId: t})}
                            placeholder="Choose item..."
                            items={items.map(item => ({ label: `${item.name} (${item.quantity} ${item.unit})`, value: item.id }))}
                        />
                    </View>

                    <Text className="text-sm font-medium text-gray-700 mb-1">Quantity Used *</Text>
                    <TextInput 
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3" 
                        value={usageForm.quantity} 
                        onChangeText={t => setUsageForm({...usageForm, quantity: t})} 
                        keyboardType="numeric" 
                        placeholder="0.0" 
                    />

                    <Text className="text-sm font-medium text-gray-700 mb-1">Note / Allocation</Text>
                    <TextInput 
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3" 
                        value={usageForm.note} 
                        onChangeText={t => setUsageForm({...usageForm, note: t})} 
                        placeholder="e.g. Morning Feed, Sick Bay" 
                    />

                    <View className="flex-row items-center bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 justify-between">
                        <Text className="text-sm text-blue-800 font-medium">Set as Recurring Daily Usage</Text>
                        <Switch 
                            value={usageForm.isRecurring} 
                            onValueChange={v => setUsageForm({...usageForm, isRecurring: v})} 
                            trackColor={{ false: '#d1d5db', true: '#16a34a' }}
                        />
                    </View>

                    <TouchableOpacity onPress={handleUsageSubmit} className="bg-orange-500 py-3 rounded-lg items-center mb-3">
                        <Text className="text-white font-bold">Log Usage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsManageTemplatesOpen(true)} className="py-2 items-center">
                        <Text className="text-gray-500 text-sm underline">Manage Recurring Templates</Text>
                    </TouchableOpacity>
                </View>

                {/* Stock Levels */}
                <View className="flex-row items-center mb-3 px-1">
                    <Package size={20} color="#6b7280" className="mr-2" />
                    <Text className="text-lg font-bold text-gray-800">Current Stock Levels</Text>
                </View>

                {loading ? (
                    <Text className="text-center text-gray-500 mt-4">Loading inventory...</Text>
                ) : items.length === 0 ? (
                    <Text className="text-center text-gray-500 mt-4 mb-8">No inventory items found.</Text>
                ) : (
                    items.map(item => {
                        const isLow = item.quantity <= item.lowStockThreshold;
                        const catStyle = categoryOptions[item.category]?.color || "bg-gray-100 border-gray-200 text-gray-700";
                        return (
                            <View key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
                                <View className="flex-row justify-between items-start border-b border-gray-100 pb-2 mb-3">
                                    <View className="flex-1 pr-2">
                                        <Text className="font-bold text-gray-900 text-lg">{item.name}</Text>
                                        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                                            <View className={`px-2 py-0.5 rounded border ${catStyle.split(' ')[0]} ${catStyle.split(' ')[1]}`}>
                                                <Text className={`text-[10px] font-bold uppercase tracking-wide ${catStyle.split(' ')[2]}`}>{item.category}</Text>
                                            </View>
                                            {item.subCategory && <Text className="text-xs text-gray-500 font-medium">{item.subCategory}</Text>}
                                        </View>
                                    </View>
                                    {isLow && (
                                        <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                            <AlertTriangle size={12} color="#dc2626" className="mr-1" />
                                            <Text className="text-[10px] text-red-600 font-bold uppercase">Low Stock</Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                                    <View className="flex-1 border-r border-gray-200 pr-2">
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">STOCK LEVEL</Text>
                                        <Text className={`font-bold text-sm ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{item.quantity} <Text className="font-normal text-gray-500">{item.unit}</Text></Text>
                                    </View>
                                    <View className="flex-1 pl-3">
                                        <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">UNIT COST</Text>
                                        <Text className="font-medium text-gray-800 text-sm">{item.cost ? `Rs ${item.cost}` : '-'}</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-500 text-xs mb-3 text-center">Reorder at: <Text className="font-medium text-gray-900">{item.lowStockThreshold} {item.unit}</Text></Text>

                                <View className="flex-row justify-end gap-2 border-t border-gray-100 pt-3">
                                    <TouchableOpacity onPress={() => handleOpenItemModal(item)} className="p-2 bg-blue-50 rounded-lg"><Edit2 size={18} color="#2563eb" /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteClick(item.id)} className="p-2 bg-red-50 rounded-lg"><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Recent Logs */}
                <View className="flex-row items-center mt-6 mb-3 px-1">
                    <History size={20} color="#6b7280" className="mr-2" />
                    <Text className="text-lg font-bold text-gray-800">Recent Usage Activity</Text>
                </View>

                {usageLogs.length === 0 ? (
                    <Text className="text-center text-gray-500 py-4">No usage logs found.</Text>
                ) : (
                    usageLogs.slice(0, 5).map(log => {
                        const isAuto = log.note === "Recurring Auto-Log";
                        return (
                            <View key={log.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-3">
                                <View className="flex-row justify-between items-start border-b border-gray-50 pb-2 mb-2">
                                    <View>
                                        <Text className="text-xs font-bold text-gray-400 uppercase">{new Date(log.date).toLocaleDateString()}</Text>
                                        <Text className="font-bold text-gray-800 text-md">{log.itemName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteLogClick(log.id)} className="p-2 bg-red-50 rounded-lg">
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                                <View className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-[10px] font-bold text-orange-800 uppercase">USED</Text>
                                        <Text className="font-bold text-red-600 text-lg">-{log.quantity} {log.unit}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-[10px] font-bold text-orange-800 uppercase mb-1">TYPE</Text>
                                        <View className="flex-row items-center">
                                            {isAuto && <Clock size={12} color="#9a3412" className="mr-1" />}
                                            <Text className="text-orange-900 text-sm font-medium">{log.note}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* Manage Templates Modal */}
            <Modal visible={isManageTemplatesOpen} animationType="slide" onRequestClose={() => setIsManageTemplatesOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-gray-50" style={{ flex: 1 }}>
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                        <View className="flex-row items-center">
                            <Repeat size={20} color="#2563eb" className="mr-2" />
                            <Text className="text-lg font-bold text-gray-800">Recurring Templates</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsManageTemplatesOpen(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <Text className="text-sm text-gray-500 p-4 pb-0">These items will be automatically logged as usage every day when you open the app.</Text>
                    
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        {templates.length === 0 ? (
                            <Text className="text-center text-gray-400 py-4">No recurring templates set.</Text>
                        ) : (
                            templates.map(t => (
                                <View key={t.id} className="flex-row justify-between items-center p-4 bg-white rounded-lg border border-gray-200 mb-3 shadow-sm">
                                    <View>
                                        <Text className="font-bold text-gray-800">{t.itemName}</Text>
                                        <Text className="text-xs text-gray-500">{t.quantity} {t.unit} / day</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => handleDeleteTemplate(t.id)} className="p-2 bg-red-50 rounded">
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Item Modal */}
            <Modal visible={isItemModalOpen} animationType="slide" onRequestClose={() => setIsItemModalOpen(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-white" style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                        <Text className="text-lg font-bold text-gray-800">{currentItem ? "Edit Item" : "Add Inventory Item"}</Text>
                        <TouchableOpacity onPress={() => setIsItemModalOpen(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        
                        <Text className="text-sm font-medium mb-2">Category</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {Object.keys(categoryOptions).map(cat => (
                                <TouchableOpacity 
                                    key={cat}
                                    onPress={() => setItemForm({ ...itemForm, category: cat, subCategory: "", unit: "" })}
                                    className={`px-3 py-2 rounded-full border ${itemForm.category === cat ? categoryOptions[cat].color : 'bg-white border-gray-300'}`}
                                >
                                    <Text className={`text-sm font-medium ${itemForm.category === cat ? categoryOptions[cat].color.split(' ')[2] : 'text-gray-600'}`}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {categoryOptions[itemForm.category].subCategories.length > 0 && (
                            <View className="mb-4">
                                <Text className="text-sm font-medium mb-1">Type / Sub-Category</Text>
                                <View>
                                    <CustomPicker 
                                        selectedValue={itemForm.subCategory} 
                                        onValueChange={handleSubCategoryChange}
                                        placeholder="Select Type..."
                                        items={categoryOptions[itemForm.category].subCategories.map(sub => ({ label: sub.name, value: sub.name }))}
                                    />
                                </View>
                            </View>
                        )}

                        {itemForm.subCategory === "Wanda" && (
                            <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                                <View className="mb-3">
                                    <Text className="text-xs font-bold text-yellow-800 mb-1">Company</Text>
                                    <View className="mb-2">
                                        <CustomPicker 
                                            selectedValue={itemForm.isCustomBrand ? "Self Entry" : itemForm.brand} 
                                            onValueChange={v => {
                                                if(v === "Self Entry") setItemForm({...itemForm, isCustomBrand: true, brand: ""});
                                                else setItemForm({...itemForm, isCustomBrand: false, brand: v});
                                            }}
                                            placeholder="Select Company..."
                                            items={[
                                                ...wandaOptions.brands.map(b => ({ label: b, value: b })),
                                                { label: "Self Entry (Other)", value: "Self Entry" }
                                            ]}
                                        />
                                    </View>
                                    {itemForm.isCustomBrand && (
                                        <TextInput 
                                            className="w-full p-2 border border-yellow-300 rounded bg-white text-sm text-gray-800" 
                                            placeholder="Enter Company Name..." 
                                            placeholderTextColor="#9ca3af"
                                            value={itemForm.brand} 
                                            onChangeText={t => setItemForm({...itemForm, brand: t})} 

                                        />
                                    )}
                                </View>
                                <View>
                                    <Text className="text-xs font-bold text-yellow-800 mb-1">Feed Type</Text>
                                    <View>
                                        <CustomPicker 
                                            selectedValue={itemForm.feedType} 
                                            onValueChange={t => setItemForm({...itemForm, feedType: t})}
                                            placeholder="Select Feed Type..."
                                            items={wandaOptions.types.map(t => ({ label: t, value: t }))}
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        <View className="mb-4">
                            <Text className="text-sm font-medium mb-1">Item Name</Text>
                            <TextInput 
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800" 
                                value={itemForm.name} 
                                onChangeText={t => setItemForm({...itemForm, name: t})} 
                                placeholder="Complete Item Name" 
                                placeholderTextColor="#9ca3af"
                            />
                            {items.find(i => i.name.toLowerCase() === itemForm.name.toLowerCase() && (!currentItem || i.id !== currentItem.id)) && (
                                <Text className="text-xs text-blue-600 mt-1"><History size={12} color="#2563eb" /> Existing item found. Stock will be merged.</Text>
                            )}
                        </View>

                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-sm font-medium mb-1">Cost per Unit</Text>
                                <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={itemForm.cost} onChangeText={t => setItemForm({...itemForm, cost: t})} keyboardType="numeric" placeholder="e.g. 500" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium mb-1">Reorder Level</Text>
                                <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={itemForm.lowStockThreshold} onChangeText={t => setItemForm({...itemForm, lowStockThreshold: t})} keyboardType="numeric" />
                            </View>
                        </View>

                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <Text className="text-sm font-medium mb-1">Quantity</Text>
                                <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={itemForm.quantity} onChangeText={t => setItemForm({...itemForm, quantity: t})} keyboardType="numeric" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-medium mb-1">Unit</Text>
                                <TextInput 
                                    className={`w-full p-3 border border-gray-300 rounded-lg text-gray-800 ${itemForm.subCategory && itemForm.subCategory !== "Self Entry" ? 'bg-gray-100' : 'bg-white'}`} 
                                    value={itemForm.unit} 
                                    onChangeText={t => setItemForm({...itemForm, unit: t})} 
                                    placeholder="kg, bags" 
                                    placeholderTextColor="#9ca3af"
                                    editable={!(itemForm.subCategory && itemForm.subCategory !== "Self Entry")}
                                />
                            </View>
                        </View>

                    </ScrollView>
                    <View className="p-4 border-t border-gray-200 flex-row justify-end bg-white">
                        <TouchableOpacity onPress={() => setIsItemModalOpen(false)} className="px-5 py-3 rounded-lg mr-3 bg-gray-100">
                            <Text className="font-semibold text-gray-700">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleItemSubmit} className="px-5 py-3 bg-primary rounded-lg">
                            <Text className="font-semibold text-white">Save Item</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
