<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { Chart, registerables } from "chart.js";
import { 
  Building, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Check, 
  X,
  FileText,
  Sliders
} from "@lucide/vue";

// Register Chart.js components
Chart.register(...registerables);

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// Stats states
const kpis = ref({
  totalFields: 0,
  totalBookings: 0,
  revenueToday: 0,
  revenueThisMonth: 0
});
const incomingBookings = ref([]);

let dailyChart = null;
let monthlyChart = null;

onMounted(() => {
  if (!authStore.isLoggedIn || authStore.user.role !== "owner") {
    router.push("/login");
    return;
  }

  loadOwnerDashboard();
});

onBeforeUnmount(() => {
  // Destroy chart instances to avoid leaks
  if (dailyChart) dailyChart.destroy();
  if (monthlyChart) monthlyChart.destroy();
});

function loadOwnerDashboard() {
  const ownerId = authStore.user.id;
  const stats = db.getOwnerStats(ownerId);
  
  kpis.value = stats.kpis;
  
  // Get pending bookings first, then confirmed bookings
  const bookings = db.getCollection("bookings").filter(b => b.ownerId === ownerId);
  incomingBookings.value = bookings
    .filter(b => b.status === "Pending")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Render Charts
  renderCharts(stats.charts);
}

function renderCharts(chartsData) {
  // 1. Daily Bookings Bar Chart
  const ctx1 = document.getElementById("dailyChartCanvas");
  if (ctx1) {
    if (dailyChart) dailyChart.destroy();
    
    dailyChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: chartsData.dailyBookings.labels,
        datasets: [{
          label: "Jumlah Booking",
          data: chartsData.dailyBookings.data,
          backgroundColor: "#10B981", // Brand color
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
          y: { grid: { color: "#1E293B" }, ticks: { color: "#94A3B8", stepSize: 1 } }
        }
      }
    });
  }

  // 2. Monthly Revenue Line Chart
  const ctx2 = document.getElementById("monthlyChartCanvas");
  if (ctx2) {
    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(ctx2, {
      type: "line",
      data: {
        labels: chartsData.monthlyRevenue.labels,
        datasets: [{
          label: "Pendapatan (Rp)",
          data: chartsData.monthlyRevenue.data,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#10B981"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#94A3B8" } },
          y: { grid: { color: "#1E293B" }, ticks: { color: "#94A3B8" } }
        }
      }
    });
  }
}

function handleApprove(bookingId) {
  db.update("bookings", bookingId, { status: "Confirmed" });
  notificationStore.addNotification(
    "Booking Disetujui",
    `Booking ID #${bookingId.slice(-6).toUpperCase()} telah disetujui. Penyewa telah dinotifikasi.`,
    "owner"
  );
  loadOwnerDashboard();
}

function handleReject(bookingId) {
  const reason = prompt("Masukkan alasan penolakan booking:");
  if (reason === null) return; // cancel prompt

  db.update("bookings", bookingId, { 
    status: "Cancelled",
    notes: reason || "Ditolak oleh pemilik lapangan"
  });
  
  notificationStore.addNotification(
    "Booking Ditolak",
    `Booking ID #${bookingId.slice(-6).toUpperCase()} berhasil ditolak.`,
    "owner"
  );
  loadOwnerDashboard();
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    
    <!-- Title Area -->
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Dashboard Owner</h1>
      <p class="text-xs text-dark-400 mt-1 font-medium">Lihat rangkuman analitik performa arena olahraga Anda</p>
    </div>

    <!-- KPIs Cards Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- KPI 1 -->
      <div class="glass-card p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
        <div class="space-y-1.5">
          <p class="text-[10px] text-dark-500 font-bold uppercase tracking-wider">Total Lapangan</p>
          <p class="text-2xl font-extrabold text-white">{{ kpis.totalFields }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-3 rounded-2xl">
          <Building class="w-6 h-6" />
        </div>
      </div>
      <!-- KPI 2 -->
      <div class="glass-card p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
        <div class="space-y-1.5">
          <p class="text-[10px] text-dark-500 font-bold uppercase tracking-wider">Total Booking</p>
          <p class="text-2xl font-extrabold text-white">{{ kpis.totalBookings }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-3 rounded-2xl">
          <ShoppingBag class="w-6 h-6" />
        </div>
      </div>
      <!-- KPI 3 -->
      <div class="glass-card p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
        <div class="space-y-1.5">
          <p class="text-[10px] text-dark-500 font-bold uppercase tracking-wider">Omset Hari Ini</p>
          <p class="text-xl font-extrabold text-white">Rp {{ kpis.revenueToday.toLocaleString("id-ID") }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-3 rounded-2xl">
          <DollarSign class="w-6 h-6" />
        </div>
      </div>
      <!-- KPI 4 -->
      <div class="glass-card p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
        <div class="space-y-1.5">
          <p class="text-[10px] text-dark-500 font-bold uppercase tracking-wider">Omset Bulan Ini</p>
          <p class="text-xl font-extrabold text-white">Rp {{ kpis.revenueThisMonth.toLocaleString("id-ID") }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-3 rounded-2xl">
          <TrendingUp class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Charts Grid Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Daily Bookings Chart -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
          <Calendar class="w-4 h-4 text-brand-500" /> Booking Harian (7 Hari Terakhir)
        </h3>
        <div class="h-64 relative">
          <canvas id="dailyChartCanvas"></canvas>
        </div>
      </div>

      <!-- Monthly Revenue Chart -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
          <TrendingUp class="w-4 h-4 text-brand-500" /> Tren Pendapatan Bulanan (6 Bulan Terakhir)
        </h3>
        <div class="h-64 relative">
          <canvas id="monthlyChartCanvas"></canvas>
        </div>
      </div>

    </div>

    <!-- Incoming Bookings Table / Approvals -->
    <div class="glass-card p-6 space-y-4">
      <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
        <Clock class="w-4 h-4 text-brand-500" /> Permintaan Booking Masuk (Butuh Konfirmasi)
      </h3>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-dark-800 text-dark-500 uppercase tracking-wider font-bold">
              <th class="py-3 px-4">Kode Booking</th>
              <th class="py-3 px-4">Nama Penyewa</th>
              <th class="py-3 px-4">Lapangan</th>
              <th class="py-3 px-4">Waktu Reservasi</th>
              <th class="py-3 px-4">Durasi</th>
              <th class="py-3 px-4 text-right">Total Biaya</th>
              <th class="py-3 px-4 text-center">Aksi Konfirmasi</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="b in incomingBookings" 
              :key="b.id" 
              class="border-b border-dark-900 last:border-b-0 hover:bg-dark-900/30"
            >
              <td class="py-4 px-4 font-mono font-bold text-white">{{ b.bookingCode }}</td>
              <td class="py-4 px-4 font-semibold text-white">{{ b.userName }}</td>
              <td class="py-4 px-4 text-dark-300">{{ b.fieldName }}</td>
              <td class="py-4 px-4">
                <div class="space-y-0.5">
                  <p class="font-semibold text-white">{{ b.date }}</p>
                  <p class="text-[10px] text-dark-500">{{ b.startTime }} - {{ b.endTime }}</p>
                </div>
              </td>
              <td class="py-4 px-4 text-dark-300">{{ b.duration }} Jam</td>
              <td class="py-4 px-4 text-right font-extrabold text-brand-400">Rp {{ b.total.toLocaleString("id-ID") }}</td>
              <td class="py-4 px-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="handleApprove(b.id)"
                    class="bg-brand-500 hover:bg-brand-600 text-white p-1.5 rounded-lg active:scale-90"
                    title="Setujui Booking"
                  >
                    <Check class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleReject(b.id)"
                    class="bg-dark-950 border border-dark-800 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 p-1.5 rounded-lg active:scale-90"
                    title="Tolak Booking"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="incomingBookings.length === 0">
              <td colspan="7" class="py-8 text-center text-dark-500 font-semibold">
                Tidak ada permintaan booking baru yang menunggu konfirmasi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
