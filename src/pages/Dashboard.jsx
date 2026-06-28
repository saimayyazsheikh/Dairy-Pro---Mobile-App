import React, { useMemo } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Beef, Milk, DollarSign, Calendar, Banknote } from 'lucide-react-native';
import { useCattle } from "../hooks/useCattle";
import { useProduction } from "../hooks/useProduction";
import { useInventory } from "../hooks/useInventory";
import { useHealth } from "../hooks/useHealth";
import { useMilk } from "../hooks/useMilk";
import { useFinance } from "../hooks/useFinance";

const screenWidth = Dimensions.get("window").width;

const StatCard = ({ title, value, icon: Icon, color, iconColor }) => (
  <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex-row items-center justify-between mb-4 mx-1">
    <View className="flex-1 pr-4">
      <Text className="text-gray-500 text-sm font-medium">{title}</Text>
      <Text className="text-3xl font-bold text-gray-800 mt-2">{value}</Text>
    </View>
    <View className={`p-3 rounded-full ${color}`}>
      <Icon size={24} color={iconColor} />
    </View>
  </View>
);

export default function Dashboard() {
  const { cattle, loading: cattleLoading } = useCattle();
  const { items, loading: inventoryLoading } = useInventory();
  const { records: healthRecords, loading: healthLoading } = useHealth();
  const { expenses, loading: expensesLoading } = useFinance();
  const { milkRecords, loading: milkLoading } = useMilk();

  // 1. Total Cattle
  const totalCattle = cattle.length;

  // 2. Daily Milk (Today)
  const today = new Date().toLocaleDateString('en-CA');
  const dailyMilk = useMemo(() => {
    return milkRecords
      .filter(record => record.date === today)
      .reduce((sum, record) => sum + (parseFloat(record.quantity) || 0), 0)
      .toFixed(1);
  }, [milkRecords, today]);

  // 3. Monthly Expenses
  const monthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const total = expenses
      .filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    return Math.floor(total).toLocaleString();
  }, [expenses]);

  // 4. Revenue
  const revenue = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySales = milkRecords
      .filter(sale => {
        const d = new Date(sale.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
    return Math.floor(monthlySales).toLocaleString();
  }, [milkRecords]);

  // 5. Chart Data (Last 7 Days)
  const { chartLabels, chartDataSeries } = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-CA');
    }).reverse();

    const labels = [];
    const data = [];

    last7Days.forEach(date => {
      const dayTotal = milkRecords
        .filter(record => record.date === date)
        .reduce((sum, record) => sum + (parseFloat(record.quantity) || 0), 0);
      
      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      labels.push(dayName);
      data.push(dayTotal);
    });

    return { chartLabels: labels, chartDataSeries: data.length > 0 ? data : [0,0,0,0,0,0,0] };
  }, [milkRecords]);

  // 6. Medical Alerts
  const upcomingMedical = useMemo(() => {
    return healthRecords.filter(record => {
      if (!record.nextDueDate) return false;
      const due = new Date(record.nextDueDate);
      const now = new Date();
      const diffTime = due - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
  }, [healthRecords]);

  // 7. Inventory Alerts
  const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold);

  const stats = [
    { title: "Total Cattle", value: cattleLoading ? "..." : totalCattle, icon: Beef, color: "bg-blue-100", iconColor: "#3b82f6" },
    { title: "Daily Milk (L)", value: milkLoading ? "..." : dailyMilk, icon: Milk, color: "bg-blue-100", iconColor: "#60a5fa" },
    { title: "Monthly Expenses (PKR)", value: expensesLoading ? "..." : `Rs ${monthlyExpenses}`, icon: DollarSign, color: "bg-red-100", iconColor: "#ef4444" },
    { title: "Monthly Revenue (PKR)", value: milkLoading ? "..." : `Rs ${revenue}`, icon: Banknote, color: "bg-green-100", iconColor: "#22c55e" },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-800">Dashboard</Text>
        <Text className="text-gray-600">Overview of farm performance</Text>
      </View>

      {/* Stats Cards */}
      <View className="flex-col mb-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>

      {/* Production Chart */}
      <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 mx-1">
        <Text className="text-lg font-bold text-gray-800 mb-4">Weekly Milk Production</Text>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartDataSeries }]
          }}
          width={screenWidth - 72} // Adjusted to account for ScrollView padding (32), card margin (8), and card padding (32)
          height={220}
          yAxisSuffix=" L"
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#4CAF50"
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>

      {/* Alerts */}
      <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mx-1">
        <Text className="text-lg font-bold text-gray-800 mb-4">Action Required</Text>
        
        {lowStockItems.length === 0 && upcomingMedical.length === 0 && (
          <View className="flex-col items-center justify-center py-6">
            <Calendar size={48} color="#d1d5db" style={{ marginBottom: 8 }} />
            <Text className="text-gray-400">No active alerts. All systems nominal.</Text>
          </View>
        )}

        {lowStockItems.map(item => (
          <View key={item.id} className="flex-row items-start p-3 bg-red-50 rounded-lg border border-red-100 mb-3">
            <View className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-red-800">Low Stock: {item.name}</Text>
              <Text className="text-xs text-red-600 font-medium">
                {item.quantity} {item.unit} remaining
              </Text>
              <Text className="text-xs text-red-400">Threshold: {item.lowStockThreshold} {item.unit}</Text>
            </View>
          </View>
        ))}

        {upcomingMedical.map(record => (
          <View key={record.id} className="flex-row items-start p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3">
            <View className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-blue-800">Upcoming: {record.recordType}</Text>
              <Text className="text-xs text-blue-600 font-medium">
                Due on {record.nextDueDate} for Cow/Animal {record.cowTag}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
