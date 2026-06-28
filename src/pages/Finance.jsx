import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import CustomPicker from '../components/CustomPicker';
import CustomDatePicker from '../components/CustomDatePicker';
import { useFinance } from "../hooks/useFinance";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { TrendingUp, Calendar, Tag, Plus, Pencil, Trash2, Lock, FileText, FileCode, FileSpreadsheet } from "lucide-react-native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

export default function Finance() {
    const { expenses, loading, addExpense, deleteExpense, updateExpense } = useFinance();
    const { farmData } = useAuth();
    const farmName = farmData?.farmName || "DairyPro";
    const { addToast } = useToast();
    const { confirm } = useConfirmation();

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        category: "Feed",
        amount: "",
        description: "",
        isCustomCategory: false
    });
    const [editingId, setEditingId] = useState(null);

    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(now.getMonth() - 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        let totalThisMonth = 0;
        let totalLastMonth = 0;
        const categoryTotals = {};

        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            const amt = parseFloat(exp.amount) || 0;

            if (expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear) {
                totalThisMonth += amt;
                categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
            }
            if (expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear) {
                totalLastMonth += amt;
            }
        });

        const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

        return {
            totalThisMonth,
            totalLastMonth,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
        };
    }, [expenses]);

    const categories = ["Feed", "Medicine", "Wages", "Maintenance", "Utilities", "Fuel", "Equipment", "Self Entry"];

    const handleSubmit = async () => {
        try {
            const { isCustomCategory, ...expenseDataToSave } = form;
            const expenseData = {
                ...expenseDataToSave,
                amount: parseFloat(form.amount) || 0
            };

            if (editingId) {
                await updateExpense(editingId, expenseData);
                addToast("Expense updated", "success");
                setEditingId(null);
            } else {
                await addExpense(expenseData);
                addToast("Expense added", "success");
            }

            setForm({
                date: new Date().toISOString().split('T')[0],
                category: "Feed",
                amount: "",
                description: "",
                isCustomCategory: false
            });
        } catch (error) {
            addToast(editingId ? "Failed to update" : "Failed to add", "error");
        }
    };

    const handleEditClick = (exp) => {
        setEditingId(exp.id);
        const isCustom = exp.category && !categories.includes(exp.category);
        setForm({
            date: exp.date || new Date().toISOString().split('T')[0],
            category: exp.category || "Feed",
            amount: exp.amount?.toString() || "",
            description: exp.description || "",
            isCustomCategory: isCustom
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm({
            date: new Date().toISOString().split('T')[0],
            category: "Feed",
            amount: "",
            description: "",
            isCustomCategory: false
        });
    };

    const handleDeleteClick = async (id) => {
        if (await confirm("Delete Expense?", "Are you sure you want to remove this record?")) {
            try {
                await deleteExpense(id);
                addToast("Expense deleted", "success");
                if (editingId === id) handleCancelEdit();
            } catch (error) {
                addToast("Failed to delete", "error");
            }
        }
    };

    const handleAutoActionClick = () => {
        addToast("Automated expenses cannot be edited directly.", "error");
    };

    const handleExportPDF = async () => {
        try {
            const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
            const totalExpense = sortedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

            const tableRows = sortedExpenses.map(exp => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(exp.date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${exp.type || "Manual"}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${exp.category}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${exp.description || "-"}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rs ${parseFloat(exp.amount).toLocaleString()}</td>
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
                        .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${farmName}</h1>
                    <h2>Financial Expense Report</h2>
                    <p>Generated: ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th style="text-align: right;">Amount (Rs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                    <div class="total">Total Monthly Expense / Period Total: Rs ${totalExpense.toLocaleString()}</div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("PDF exported successfully", "success");
            } else {
                addToast("Sharing is not available on this device", "error");
            }
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast(`Failed to export PDF: ${error.message}`, "error");
        }
    };

    const handleExportExcel = async () => {
        try {
            const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
            const data = sortedExpenses.map(exp => ({
                Date: new Date(exp.date).toLocaleDateString(),
                Type: exp.type || "Manual",
                Category: exp.category,
                Description: exp.description || "-",
                Amount: parseFloat(exp.amount)
            }));

            const totalExpense = sortedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            data.push({ Date: "TOTAL", Type: "", Category: "", Description: "", Amount: totalExpense });

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

            const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
            const uri = FileSystem.cacheDirectory + `expense_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
            
            await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
                addToast("Excel exported successfully", "success");
            } else {
                addToast("Sharing is not available on this device", "error");
            }
        } catch (error) {
            console.error("Excel Export Error:", error);
            addToast(`Failed to export Excel: ${error.message}`, "error");
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-gray-50">
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-gray-800">Expense Management</Text>
                    <Text className="text-gray-500 text-xs">Track and manage farm expenditures</Text>
                </View>

                {/* Stats */}
                <View className="flex-row gap-4 mb-6">
                    <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center">
                        <View className="p-2 bg-red-100 rounded-full mr-3"><TrendingUp size={20} color="#dc2626" /></View>
                        <View>
                            <Text className="text-[10px] text-gray-500 uppercase font-bold">This Month</Text>
                            <Text className="text-lg font-bold text-gray-800">Rs {stats.totalThisMonth.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center">
                        <View className="p-2 bg-gray-100 rounded-full mr-3"><Calendar size={20} color="#4b5563" /></View>
                        <View>
                            <Text className="text-[10px] text-gray-500 uppercase font-bold">Last Month</Text>
                            <Text className="text-lg font-bold text-gray-800">Rs {stats.totalLastMonth.toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center mb-8">
                    <View className="p-3 bg-blue-100 rounded-full mr-4"><Tag size={24} color="#2563eb" /></View>
                    <View>
                        <Text className="text-xs text-gray-500 uppercase font-bold">Top Category</Text>
                        <Text className="text-xl font-bold text-gray-800">{stats.topCategory ? stats.topCategory.name : 'N/A'}</Text>
                        {stats.topCategory && <Text className="text-xs text-gray-500 font-medium">Rs {stats.topCategory.amount.toLocaleString()}</Text>}
                    </View>
                </View>

                {/* Form */}
                <View className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-8">
                    <View className="flex-row items-center mb-5">
                        {editingId ? <Pencil size={20} color="#16a34a" className="mr-2" /> : <Plus size={20} color="#16a34a" className="mr-2" />}
                        <Text className="text-lg font-bold text-gray-800">{editingId ? "Edit Expense" : "Add New Expense"}</Text>
                    </View>

                    <CustomDatePicker 
                        label="Date"
                        value={form.date} 
                        onChange={t => setForm({...form, date: t})} 
                    />

                    <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
                    <View className="mb-2">
                        <CustomPicker 
                            selectedValue={form.isCustomCategory ? "Self Entry" : form.category} 
                            onValueChange={(val) => {
                                if (val === "Self Entry") setForm({...form, isCustomCategory: true, category: ""});
                                else setForm({...form, isCustomCategory: false, category: val});
                            }}
                            placeholder="Select Category..."
                            items={[
                                ...categories.map(cat => ({ label: cat, value: cat })),
                                { label: "Self Entry (Other)", value: "Self Entry" }
                            ]}
                        />
                    </View>
                    {form.isCustomCategory && (
                        <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-4 bg-white text-gray-800" placeholderTextColor="#9ca3af" placeholder="Enter Custom Category..." value={form.category} onChangeText={t => setForm({...form, category: t})} />
                    )}
                    {!form.isCustomCategory && <View className="mb-4" />}

                    <Text className="text-sm font-medium text-gray-700 mb-1">Amount (Rs)</Text>
                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-4 bg-white text-gray-800" placeholderTextColor="#9ca3af" value={form.amount} onChangeText={t => setForm({...form, amount: t})} keyboardType="numeric" placeholder="0.00" />

                    <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
                    <TextInput className="w-full p-3 border border-gray-300 rounded-lg mb-5 bg-white text-gray-800" placeholderTextColor="#9ca3af" value={form.description} onChangeText={t => setForm({...form, description: t})} placeholder="Details regarding the expense..." multiline />

                    <View className="flex-row gap-2">
                        {editingId && (
                            <TouchableOpacity onPress={handleCancelEdit} className="flex-1 bg-gray-100 p-3 rounded-lg items-center">
                                <Text className="font-bold text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleSubmit} className="flex-1 bg-primary p-3 rounded-lg items-center">
                            <Text className="font-bold text-white">{editingId ? "Update Expense" : "Save Expense"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* History */}
                <View className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <View className="flex-row items-center">
                        <FileText size={20} color="#6b7280" className="mr-2" />
                        <Text className="font-bold text-gray-800 text-lg">Expense History</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity onPress={handleExportPDF} className="bg-red-50 p-2 rounded-lg border border-red-100 flex-row items-center">
                            <FileCode size={14} color="#dc2626" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleExportExcel} className="bg-green-50 p-2 rounded-lg border border-green-100 flex-row items-center">
                            <FileSpreadsheet size={14} color="#16a34a" />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <Text className="text-center text-gray-500 py-8">Loading expenses...</Text>
                ) : expenses.length === 0 ? (
                    <Text className="text-center text-gray-500 py-8">No expenses recorded yet.</Text>
                ) : (
                    expenses.map(exp => (
                        <View key={exp.id} className={`bg-white p-4 rounded-xl border ${editingId === exp.id ? 'border-primary' : 'border-gray-100'} shadow-sm flex flex-col gap-3 mb-3`}>
                            <View className="flex-row justify-between items-start border-b border-gray-50 pb-2">
                                <View>
                                    <Text className="text-xs font-bold text-gray-400 uppercase">{new Date(exp.date).toLocaleDateString()}</Text>
                                    <View className="flex-row items-center gap-2 mt-1">
                                        <View className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                            <Text className="text-gray-700 text-[10px] font-bold uppercase tracking-wide">{exp.category}</Text>
                                        </View>
                                        {exp.type === 'Auto' && (
                                            <View className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex-row items-center">
                                                <Lock size={8} color="#2563eb" className="mr-1" />
                                                <Text className="text-blue-600 text-[10px] font-bold uppercase tracking-wide">AUTO</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                {exp.type === 'Auto' ? (
                                    <TouchableOpacity onPress={handleAutoActionClick} className="p-2 bg-gray-50 rounded-lg">
                                        <Lock size={16} color="#9ca3af" />
                                    </TouchableOpacity>
                                ) : (
                                    <View className="flex-row gap-1">
                                        <TouchableOpacity onPress={() => handleEditClick(exp)} className="p-2 bg-blue-50 rounded-lg"><Pencil size={16} color="#3b82f6" /></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteClick(exp.id)} className="p-2 bg-red-50 rounded-lg"><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            <View className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-row justify-between items-center">
                                <View>
                                    <Text className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">AMOUNT</Text>
                                    <Text className="font-bold text-gray-900 text-lg">Rs {parseFloat(exp.amount).toLocaleString()}</Text>
                                </View>
                            </View>
                            {exp.description && (
                                <Text className="text-sm text-gray-600 bg-white p-2 border border-gray-50 rounded italic">"{exp.description}"</Text>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
