import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomPicker from '../components/CustomPicker';
import CustomDatePicker from '../components/CustomDatePicker';
import { useMilk } from "../hooks/useMilk";
import { useCattle } from "../hooks/useCattle";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { useAuth } from "../contexts/AuthContext";
import { 
    Droplet, DollarSign, Calendar, TrendingUp, FileText, Trash2, 
    ChevronDown, Plus, FileSpreadsheet, FileCode, X, Edit2, Filter
} from "lucide-react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

export default function Milk() {
    const {
        milkRecords, performanceLogs, vendors,
        loading, addMilkRecord, deleteMilkRecord,
        addPerformanceLog, updatePerformanceLog, deletePerformanceLog,
        addVendor, updateVendor, deleteVendor
    } = useMilk();
    const { cattle } = useCattle();
    const { addToast } = useToast();
    const { confirm } = useConfirmation();
    const { farmData } = useAuth();
    
    const [activeTab, setActiveTab] = useState("daily");
    const [submitting, setSubmitting] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);

    // DAILY FORM STATE
    const initialEntry = { vendorName: "", vendorId: "", quantity: "", pricePerLiter: "", isCustom: false };
    const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState([{ ...initialEntry }]);

    // MONTHLY FORM STATE
    const initialMonthlyState = {
        date: new Date().toISOString().slice(0, 7), // YYYY-MM
        cowId: "", morningYield: "", eveningYield: "", nightYield: "",
    };
    const [monthlyForm, setMonthlyForm] = useState(initialMonthlyState);
    const [editingPerformanceId, setEditingPerformanceId] = useState(null);

    // FILTERS
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [vendorFilter, setVendorFilter] = useState("All");

    // STATS
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const todayRecords = milkRecords.filter(r => r.date === today);
        const monthRecords = milkRecords.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const todayYield = todayRecords.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
        const todayRevenue = todayRecords.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);
        const monthRevenue = monthRecords.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || 0), 0);

        return {
            todayYield: todayYield.toFixed(1),
            todayRevenue: todayRevenue.toFixed(0),
            monthRevenue: monthRevenue.toFixed(0)
        };
    }, [milkRecords]);

    // HANDLERS
    const handleAddEntry = () => setEntries([...entries, { ...initialEntry }]);
    const handleRemoveEntry = (index) => {
        const newEntries = [...entries];
        newEntries.splice(index, 1);
        setEntries(newEntries);
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;

        if (field === "vendorName" && !newEntries[index].isCustom) {
            const vendor = vendors.find(v => v.name.toLowerCase() === value.toLowerCase());
            if (vendor) {
                newEntries[index].pricePerLiter = vendor.defaultPrice || "";
                newEntries[index].vendorId = vendor.id;
            } else {
                newEntries[index].vendorId = "";
            }
        }
        setEntries(newEntries);
    };

    const handleDailySubmit = async () => {
        setSubmitting(true);
        try {
            const promises = entries.map(entry => {
                const qty = parseFloat(entry.quantity) || 0;
                const price = parseFloat(entry.pricePerLiter) || 0;
                return addMilkRecord({
                    date: dailyDate,
                    session: "-",
                    vendorName: entry.vendorName,
                    vendorId: entry.vendorId,
                    quantity: qty,
                    pricePerLiter: price,
                    totalAmount: qty * price,
                });
            });

            await Promise.all(promises);
            setEntries([{ ...initialEntry }]);
            addToast("Sales logged successfully!", "success");
        } catch (err) {
            console.error(err);
            addToast("Failed to log sales", "error");
        }
        setSubmitting(false);
    };

    const handleMonthlySubmit = async () => {
        setSubmitting(true);
        try {
            const selectedCow = cattle.find(c => c.id === monthlyForm.cowId);
            const payload = {
                ...monthlyForm,
                cowTag: selectedCow ? selectedCow.tagId : "Unknown",
                morningYield: parseFloat(monthlyForm.morningYield) || 0,
                eveningYield: parseFloat(monthlyForm.eveningYield) || 0,
                nightYield: parseFloat(monthlyForm.nightYield) || 0,
            };

            if (editingPerformanceId) {
                await updatePerformanceLog(editingPerformanceId, payload);
                addToast("Performance record updated", "success");
            } else {
                await addPerformanceLog(payload);
                addToast("Performance record added", "success");
            }
            setMonthlyForm(initialMonthlyState);
            setEditingPerformanceId(null);
        } catch (err) {
            console.error("Monthly Log Error:", err);
            addToast("Failed to save monthly log", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditPerformanceLog = (log) => {
        setMonthlyForm({
            date: log.date || "",
            cowId: log.cowId || "",
            morningYield: log.morningYield?.toString() || "",
            eveningYield: log.eveningYield?.toString() || "",
            nightYield: log.nightYield?.toString() || "",
        });
        setEditingPerformanceId(log.id);
    };

    const consolidatedRecords = useMemo(() => {
        let filtered = milkRecords;
        if (dateRange.start) filtered = filtered.filter(r => r.date >= dateRange.start);
        if (dateRange.end) filtered = filtered.filter(r => r.date <= dateRange.end);
        if (vendorFilter !== "All") filtered = filtered.filter(r => r.vendorName === vendorFilter);

        const grouped = {};
        filtered.forEach(record => {
            if (!grouped[record.date]) {
                grouped[record.date] = { date: record.date, totalQuantity: 0, totalAmount: 0, records: [] };
            }
            const qty = parseFloat(record.quantity) || 0;
            const amt = parseFloat(record.totalAmount) || 0;
            grouped[record.date].totalQuantity += qty;
            grouped[record.date].totalAmount += amt;
            grouped[record.date].records.push(record);
        });

        return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending for mobile is usually better, but sticking to logic
    }, [milkRecords, dateRange, vendorFilter]);

    const handleExportPDF = async () => {
        try {
            const farmName = farmData?.farmName || "Dairy Farm";
            let recordsToExport = [];
            consolidatedRecords.forEach(group => {
                group.records.forEach(r => recordsToExport.push(r));
            });
            recordsToExport.sort((a, b) => new Date(a.date) - new Date(b.date));

            const tableRows = recordsToExport.map(ticket => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(ticket.date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ticket.vendorName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${parseFloat(ticket.quantity).toFixed(1)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${ticket.pricePerLiter}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${parseFloat(ticket.totalAmount).toLocaleString()}</td>
                </tr>
            `).join('');

            const totalQty = recordsToExport.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
            const totalAmt = recordsToExport.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica, sans-serif; padding: 20px; }
                        h1 { color: #16a34a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; background-color: #f3f4f6; padding: 10px; border-bottom: 2px solid #ddd; }
                        .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${farmName}</h1>
                    <h2>Daily Milk Sales Report</h2>
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th style="text-align: right;">Quantity (L)</th>
                                <th style="text-align: right;">Price/L (Rs)</th>
                                <th style="text-align: right;">Total Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="total">Total Quantity: ${totalQty.toFixed(1)} L | Total Revenue: Rs ${totalAmt.toLocaleString()}</div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("PDF exported successfully", "success");
            } else {
                addToast("Sharing not available", "error");
            }
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast(`Failed to export PDF: ${error.message}`, "error");
        }
    };

    const handleExportExcel = async () => {
        try {
            let recordsToExport = [];
            consolidatedRecords.forEach(group => {
                group.records.forEach(r => recordsToExport.push(r));
            });
            recordsToExport.sort((a, b) => new Date(a.date) - new Date(b.date));

            const data = recordsToExport.map(r => ({
                Date: new Date(r.date).toLocaleDateString(),
                Vendor: r.vendorName,
                "Quantity (L)": parseFloat(r.quantity),
                "Price per L (Rs)": parseFloat(r.pricePerLiter),
                "Total Amount (Rs)": parseFloat(r.totalAmount)
            }));

            const totalQty = recordsToExport.reduce((sum, r) => sum + parseFloat(r.quantity), 0);
            const totalAmt = recordsToExport.reduce((sum, r) => sum + parseFloat(r.totalAmount), 0);
            data.push({ Date: "TOTAL", Vendor: "", "Quantity (L)": totalQty, "Price per L (Rs)": "", "Total Amount (Rs)": totalAmt });

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

            const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
            const uri = FileSystem.cacheDirectory + `sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("Excel exported successfully", "success");
            } else {
                addToast("Sharing not available", "error");
            }
        } catch (error) {
            console.error("Excel Export Error:", error);
            addToast(`Failed to export Excel: ${error.message}`, "error");
        }
    };

    const handleMonthlyExportPDF = async () => {
        try {
            const farmName = farmData?.farmName || "Dairy Farm";
            const sortedLogs = [...performanceLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const tableRows = sortedLogs.map(log => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.date}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${log.cowTag}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${log.morningYield || 0}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${log.eveningYield || 0}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${log.nightYield || 0}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">
                        ${(parseFloat(log.morningYield || 0) + parseFloat(log.eveningYield || 0) + parseFloat(log.nightYield || 0)).toFixed(1)}
                    </td>
                </tr>
            `).join('');

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica, sans-serif; padding: 20px; }
                        h1 { color: #16a34a; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; background-color: #f3f4f6; padding: 10px; border-bottom: 2px solid #ddd; }
                    </style>
                </head>
                <body>
                    <h1>${farmName}</h1>
                    <h2>Monthly Animal Performance Report</h2>
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Month</th>
                                <th>Cow Tag</th>
                                <th style="text-align: right;">Morning (L)</th>
                                <th style="text-align: right;">Evening (L)</th>
                                <th style="text-align: right;">Night (L)</th>
                                <th style="text-align: right;">Total Daily Avg (L)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("Performance PDF exported", "success");
            } else {
                addToast("Sharing not available", "error");
            }
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast(`Failed to export PDF: ${error.message}`, "error");
        }
    };

    const handleMonthlyExportExcel = async () => {
        try {
            const sortedLogs = [...performanceLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const data = sortedLogs.map(log => ({
                Month: log.date,
                "Cow Tag": log.cowTag,
                "Morning (L)": parseFloat(log.morningYield || 0),
                "Evening (L)": parseFloat(log.eveningYield || 0),
                "Night (L)": parseFloat(log.nightYield || 0),
                "Total Daily Avg (L)": parseFloat(log.morningYield || 0) + parseFloat(log.eveningYield || 0) + parseFloat(log.nightYield || 0)
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Performance");

            const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
            const uri = FileSystem.cacheDirectory + `performance_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("Performance Excel exported", "success");
            } else {
                addToast("Sharing not available", "error");
            }
        } catch (error) {
            console.error("Excel Export Error:", error);
            addToast(`Failed to export Excel: ${error.message}`, "error");
        }
    };

    const handleDeleteRecord = async (id, type = 'daily') => {
        const confirmed = await confirm("This action cannot be undone. Are you sure you want to delete this record?", "Confirm Deletion");
        if (confirmed) {
            try {
                if (type === 'monthly') await deletePerformanceLog(id);
                else await deleteMilkRecord(id);
                addToast("Record deleted", "delete");
            } catch (err) {
                addToast("Failed to delete record", "error");
            }
        }
    }

    const [newVendor, setNewVendor] = useState({ name: "", defaultPrice: "" });
    const [editingVendorId, setEditingVendorId] = useState(null);

    const handleSaveVendor = async () => {
        if (!newVendor.name || !newVendor.defaultPrice) {
            addToast("Please fill all fields", "error");
            return;
        }
        try {
            if (editingVendorId) {
                await updateVendor(editingVendorId, { name: newVendor.name, defaultPrice: parseFloat(newVendor.defaultPrice) });
                addToast("Vendor updated", "success");
            } else {
                await addVendor({ name: newVendor.name, defaultPrice: parseFloat(newVendor.defaultPrice) });
                addToast("Vendor added", "success");
            }
            setNewVendor({ name: "", defaultPrice: "" });
            setEditingVendorId(null);
        } catch (err) {
            addToast("Failed to save vendor", "error");
        }
    };

    const handleEditVendor = (v) => {
        setNewVendor({ name: v.name, defaultPrice: v.defaultPrice?.toString() });
        setEditingVendorId(v.id);
    };

    const handleDeleteVendor = async (id) => {
        const confirmed = await confirm("Delete this permanent vendor?");
        if (confirmed) {
            try {
                await deleteVendor(id);
                addToast("Vendor deleted", "delete");
            } catch (err) {
                addToast("Failed to delete vendor", "error");
            }
        }
    };

    const dynamicVendors = Array.from(new Set([...milkRecords.map(r => r.vendorName), ...vendors.map(v => v.name)])).filter(Boolean);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header & Tabs */}
            <View className="bg-white p-4 pt-6 border-b border-gray-200">
                <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800">Milk Management</Text>
                    <Text className="text-gray-500 text-xs">Unified production logging and sales</Text>
                </View>

                {/* Horizontal Scroll for Stats Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    <View className="bg-blue-50 p-4 rounded-xl flex-row items-center border border-blue-100 mr-3 min-w-[200px]">
                        <View className="p-3 bg-blue-100 rounded-full mr-3"><Droplet size={20} color="#2563eb" /></View>
                        <View><Text className="text-xs text-blue-600 font-medium">Today's Yield</Text><Text className="text-lg font-bold text-gray-800">{stats.todayYield} L</Text></View>
                    </View>
                    <View className="bg-green-50 p-4 rounded-xl flex-row items-center border border-green-100 mr-3 min-w-[200px]">
                        <View className="p-3 bg-green-100 rounded-full mr-3"><DollarSign size={20} color="#16a34a" /></View>
                        <View><Text className="text-xs text-green-600 font-medium">Today's Revenue</Text><Text className="text-lg font-bold text-gray-800">Rs {stats.todayRevenue}</Text></View>
                    </View>
                    <View className="bg-purple-50 p-4 rounded-xl flex-row items-center border border-purple-100 mr-3 min-w-[200px]">
                        <View className="p-3 bg-purple-100 rounded-full mr-3"><TrendingUp size={20} color="#9333ea" /></View>
                        <View><Text className="text-xs text-purple-600 font-medium">Monthly Revenue</Text><Text className="text-lg font-bold text-gray-800">Rs {stats.monthRevenue}</Text></View>
                    </View>
                </ScrollView>

                <View className="flex-row border-b border-gray-200">
                    <TouchableOpacity onPress={() => setActiveTab("daily")} className={`pb-2 px-4 ${activeTab === 'daily' ? 'border-b-2 border-primary' : ''}`}>
                        <Text className={`text-sm font-medium ${activeTab === 'daily' ? 'text-primary' : 'text-gray-500'}`}>Daily Sales Audit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab("monthly")} className={`pb-2 px-4 ${activeTab === 'monthly' ? 'border-b-2 border-primary' : ''}`}>
                        <Text className={`text-sm font-medium ${activeTab === 'monthly' ? 'text-primary' : 'text-gray-500'}`}>Monthly Performance</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {activeTab === "daily" && (
                    <>
                        {/* Daily Sales Form */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6 shadow-sm">
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <FileText size={20} color="#22c55e" className="mr-2" />
                                    <Text className="text-lg font-bold text-gray-800">Log Sales</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowVendorModal(true)}>
                                    <Text className="text-primary font-medium">Manage Vendors</Text>
                                </TouchableOpacity>
                            </View>

                            <CustomDatePicker 
                                label="Date"
                                value={dailyDate} 
                                onChange={setDailyDate} 
                            />

                            <Text className="text-sm font-medium text-gray-700 mb-2">Entries</Text>
                            {entries.map((entry, index) => (
                                <View key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 relative">
                                    {entries.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveEntry(index)} className="absolute -top-2 -right-2 bg-red-100 p-1 rounded-full z-10">
                                            <Trash2 size={14} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                    <View className="mb-2">
                                        <CustomPicker
                                            selectedValue={entry.isCustom ? "custom" : entry.vendorName}
                                            onValueChange={(val) => {
                                                if (val === "custom") {
                                                    handleEntryChange(index, "isCustom", true);
                                                    handleEntryChange(index, "vendorName", "");
                                                    handleEntryChange(index, "vendorId", "");
                                                    handleEntryChange(index, "pricePerLiter", "");
                                                } else {
                                                    handleEntryChange(index, "isCustom", false);
                                                    handleEntryChange(index, "vendorName", val);
                                                }
                                            }}
                                            placeholder="Select Vendor..."
                                            items={[
                                                ...vendors.map(v => ({ label: v.name, value: v.name })),
                                                { label: "Other (Temporary Vendor)", value: "custom" }
                                            ]}
                                        />
                                    </View>

                                    {entry.isCustom && (
                                        <TextInput
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-2"
                                            placeholder="Enter Temporary Vendor Name..."
                                            value={entry.vendorName}
                                            onChangeText={(val) => handleEntryChange(index, "vendorName", val)}
                                        />
                                    )}

                                    <View className="flex-row gap-2">
                                        <TextInput
                                            className="flex-1 p-3 border border-gray-300 rounded-lg bg-white"
                                            placeholder="Qty (L)" keyboardType="numeric"
                                            value={entry.quantity} onChangeText={(val) => handleEntryChange(index, "quantity", val)}
                                        />
                                        <TextInput
                                            className="flex-1 p-3 border border-gray-300 rounded-lg bg-white"
                                            placeholder="Price/L" keyboardType="numeric"
                                            value={entry.pricePerLiter} onChangeText={(val) => handleEntryChange(index, "pricePerLiter", val)}
                                        />
                                    </View>
                                </View>
                            ))}
                            
                            <TouchableOpacity onPress={handleAddEntry} className="flex-row items-center justify-center py-3 bg-gray-100 rounded-lg mb-4 border border-gray-200 border-dashed">
                                <Plus size={16} color="#4b5563" />
                                <Text className="ml-2 font-medium text-gray-600">Add Another Entry</Text>
                            </TouchableOpacity>

                            <View className="bg-green-50 p-3 rounded-lg border border-green-100 flex-row justify-between items-center mb-4">
                                <Text className="text-green-800 font-medium text-sm">Total EST Revenue:</Text>
                                <Text className="text-lg font-bold text-green-700">
                                    Rs {entries.reduce((sum, e) => sum + ((parseFloat(e.quantity) || 0) * (parseFloat(e.pricePerLiter) || 0)), 0).toLocaleString()}
                                </Text>
                            </View>

                            <TouchableOpacity onPress={handleDailySubmit} disabled={submitting} className="bg-primary py-3 rounded-lg flex items-center justify-center">
                                <Text className="text-white font-bold">{submitting ? "Saving..." : "Save All Entries"}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Sales List */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-800">Recent Sales</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={handleExportPDF} className="bg-red-50 p-2 rounded-lg border border-red-200"><FileCode size={16} color="#dc2626" /></TouchableOpacity>
                                    <TouchableOpacity onPress={handleExportExcel} className="bg-green-50 p-2 rounded-lg border border-green-200"><FileSpreadsheet size={16} color="#16a34a" /></TouchableOpacity>
                                </View>
                            </View>

                            {/* Filters */}
                            <View className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
                                <View className="flex-row items-center mb-2">
                                    <Filter size={16} color="#9ca3af" className="mr-1" />
                                    <Text className="text-sm font-medium text-gray-600">Filters</Text>
                                </View>
                                <View className="flex-row gap-2 mb-2">
                                    <View className="flex-1">
                                        <CustomDatePicker 
                                            containerClassName=""
                                            placeholder="Start Date"
                                            value={dateRange.start} 
                                            onChange={t => setDateRange({...dateRange, start: t})} 
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <CustomDatePicker 
                                            containerClassName=""
                                            placeholder="End Date"
                                            value={dateRange.end} 
                                            onChange={t => setDateRange({...dateRange, end: t})} 
                                        />
                                    </View>
                                </View>
                                <View>
                                    <CustomPicker 
                                        selectedValue={vendorFilter} 
                                        onValueChange={setVendorFilter}
                                        placeholder="Vendor"
                                        items={[
                                            { label: "All Vendors", value: "All" },
                                            ...dynamicVendors.map(v => ({ label: v, value: v }))
                                        ]}
                                    />
                                </View>
                            </View>

                            {consolidatedRecords.length === 0 ? (
                                <Text className="text-center text-gray-500 py-4">No records found.</Text>
                            ) : (
                                consolidatedRecords.map(group => (
                                    <View key={group.date} className="bg-white p-4 rounded-lg border border-gray-100 mb-3 shadow-sm">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="font-bold text-gray-800 text-lg">{group.date.split('-').reverse().join('-')}</Text>
                                            <View className="bg-green-100 px-2 py-1 rounded-full">
                                                <Text className="text-xs font-semibold text-green-800">Rs {group.totalAmount.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-sm font-medium text-gray-600 mb-3">Total Yield: <Text className="font-bold text-gray-800">{group.totalQuantity.toFixed(1)} L</Text></Text>
                                        <View className="space-y-2">
                                            {group.records.map((r) => (
                                                <View key={r.id} className="flex-row justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100 mb-1">
                                                    <View>
                                                        <Text className="font-semibold text-sm text-gray-800">{r.vendorName}</Text>
                                                        <Text className="text-xs text-gray-500">{parseFloat(r.quantity).toFixed(1)} L @ Rs {r.pricePerLiter}</Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleDeleteRecord(r.id)} className="p-2 bg-white rounded border border-gray-200">
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}

                {activeTab === "monthly" && (
                    <>
                        {/* Monthly Form */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6 shadow-sm">
                            <View className="flex-row items-center mb-4">
                                <Calendar size={20} color="#9333ea" className="mr-2" />
                                <Text className="text-lg font-bold text-gray-800">Monthly Log</Text>
                            </View>

                            <CustomDatePicker 
                                label="Month (YYYY-MM)"
                                value={monthlyForm.date} 
                                onChange={t => setMonthlyForm({...monthlyForm, date: t.substring(0, 7)})} 
                                placeholder="Select Month"
                            />

                            <Text className="text-sm font-medium text-gray-700 mb-1">Select Animal *</Text>
                            <View className="mb-3">
                                <CustomPicker 
                                    selectedValue={monthlyForm.cowId} 
                                    onValueChange={(val) => setMonthlyForm({...monthlyForm, cowId: val})}
                                    placeholder="Select Cow..."
                                    items={cattle.map(cow => ({ label: `${cow.tagId} - ${cow.type}`, value: cow.id }))}
                                />
                            </View>

                            <View className="flex-row gap-2 mb-4">
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-700 mb-1">Morning (L)</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={monthlyForm.morningYield} onChangeText={t => setMonthlyForm({...monthlyForm, morningYield: t})} keyboardType="numeric" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-700 mb-1">Evening (L)</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={monthlyForm.eveningYield} onChangeText={t => setMonthlyForm({...monthlyForm, eveningYield: t})} keyboardType="numeric" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-medium text-gray-700 mb-1">Night (L)</Text>
                                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800" placeholderTextColor="#9ca3af" value={monthlyForm.nightYield} onChangeText={t => setMonthlyForm({...monthlyForm, nightYield: t})} keyboardType="numeric" />
                                </View>
                            </View>

                            {editingPerformanceId && (
                                <TouchableOpacity onPress={() => { setMonthlyForm(initialMonthlyState); setEditingPerformanceId(null); }} className="mb-3 items-center">
                                    <Text className="text-gray-500 text-sm">Cancel Edit</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity onPress={handleMonthlySubmit} disabled={submitting} className={`py-3 rounded-lg flex items-center justify-center ${editingPerformanceId ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                <Text className="text-white font-bold">{submitting ? "Saving..." : (editingPerformanceId ? "Update Monthly Log" : "Log Monthly Stats")}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Performance Records */}
                        <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-800">Performance</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity onPress={handleMonthlyExportPDF} className="bg-red-50 p-2 rounded-lg border border-red-200"><FileCode size={16} color="#dc2626" /></TouchableOpacity>
                                    <TouchableOpacity onPress={handleMonthlyExportExcel} className="bg-green-50 p-2 rounded-lg border border-green-200"><FileSpreadsheet size={16} color="#16a34a" /></TouchableOpacity>
                                </View>
                            </View>

                            {performanceLogs.length === 0 ? (
                                <Text className="text-center text-gray-500 py-4">No records found.</Text>
                            ) : (
                                [...performanceLogs].sort((a, b) => new Date(a.date) - new Date(b.date)).map(log => (
                                    <View key={log.id} className="bg-white p-4 rounded-lg border border-purple-100 mb-3 shadow-sm">
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View>
                                                <Text className="font-bold text-lg text-purple-700">{log.cowTag}</Text>
                                                <Text className="text-xs text-gray-500 uppercase font-medium">{log.date}</Text>
                                            </View>
                                            <View className="flex-row gap-1">
                                                <TouchableOpacity onPress={() => handleEditPerformanceLog(log)} className="p-2 bg-blue-50 rounded">
                                                    <FileText size={16} color="#2563eb" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteRecord(log.id, 'monthly')} className="p-2 bg-red-50 rounded">
                                                    <Trash2 size={16} color="#dc2626" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View className="flex-row gap-2 mt-2">
                                            <View className="flex-1 bg-orange-50 p-2 rounded items-center">
                                                <Text className="text-[10px] text-orange-500 font-bold uppercase">Morning</Text>
                                                <Text className="font-bold text-orange-700">{log.morningYield || 0}</Text>
                                            </View>
                                            <View className="flex-1 bg-blue-50 p-2 rounded items-center">
                                                <Text className="text-[10px] text-blue-500 font-bold uppercase">Evening</Text>
                                                <Text className="font-bold text-blue-700">{log.eveningYield || 0}</Text>
                                            </View>
                                            <View className="flex-1 bg-indigo-50 p-2 rounded items-center">
                                                <Text className="text-[10px] text-indigo-500 font-bold uppercase">Night</Text>
                                                <Text className="font-bold text-indigo-700">{log.nightYield || 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Vendor Modal */}
            <Modal visible={showVendorModal} animationType="slide" onRequestClose={() => setShowVendorModal(false)}>
                <SafeAreaView edges={['top', 'bottom']} className="bg-gray-50" style={{ flex: 1 }}>
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                        <Text className="text-lg font-bold text-gray-800">Manage Permanent Vendors</Text>
                        <TouchableOpacity onPress={() => setShowVendorModal(false)}><X size={24} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <View className="flex-row gap-2 mb-6">
                            <TextInput 
                                className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-800" 
                                placeholder="Vendor Name" 
                                placeholderTextColor="#9ca3af"
                                value={newVendor.name} 
                                onChangeText={t => setNewVendor({...newVendor, name: t})} 
                            />
                            <TextInput 
                                className="w-24 p-3 border border-gray-300 rounded-lg bg-white text-gray-800" 
                                placeholder="Rate" 
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric" 
                                value={newVendor.defaultPrice} 
                                onChangeText={t => setNewVendor({...newVendor, defaultPrice: t})} 
                            />
                            <TouchableOpacity onPress={handleSaveVendor} className="bg-primary px-4 justify-center items-center rounded-lg">
                                <Text className="text-white font-bold">{editingVendorId ? "Update" : "Add"}</Text>
                            </TouchableOpacity>
                        </View>

                        {vendors.length === 0 ? (
                            <Text className="text-center text-gray-500 py-4">No permanent vendors found.</Text>
                        ) : (
                            vendors.map(v => (
                                <View key={v.id} className="flex-row justify-between items-center p-4 bg-white rounded-lg border border-gray-100 mb-2 shadow-sm">
                                    <View>
                                        <Text className="font-semibold text-gray-800">{v.name}</Text>
                                        <Text className="text-sm text-green-600">Fixed Rate: Rs {v.defaultPrice}</Text>
                                    </View>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity onPress={() => handleEditVendor(v)} className="p-2 bg-blue-50 rounded"><Edit2 size={16} color="#3b82f6"/></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteVendor(v.id)} className="p-2 bg-red-50 rounded"><Trash2 size={16} color="#ef4444"/></TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
