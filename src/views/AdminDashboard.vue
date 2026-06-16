<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { 
  Users, 
  Landmark, 
  Building, 
  ShoppingBag, 
  DollarSign, 
  Activity, 
  Clock, 
  Calendar,
  AlertCircle,
  Database
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();

const kpis = ref({
  totalUsers: 0,
  totalOwners: 0,
  totalFields: 0,
  totalBookings: 0,
  totalRevenue: 0
});

const recentBookings = ref([]);
const recentUsers = ref([]);
const systemActivities = ref([]);
const seedingLoading = ref(false);

onMounted(() => {
  if (!authStore.isLoggedIn || authStore.user.role !== "admin") {
    router.push("/login");
    return;
  }

  loadAdminDashboard();
});

function loadAdminDashboard() {
  const stats = db.getAdminStats();
  kpis.value = stats.kpis;
  recentBookings.value = stats.recentBookings;
  recentUsers.value = stats.recentUsers;
  systemActivities.value = db.getSystemActivities().slice(0, 10);
}

async function triggerSeeding() {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi lama dan menanam ulang data awal ke database? Proses ini memakan waktu beberapa detik.")) {
    seedingLoading.value = true;
    try {
      await db.forceSeed();
      setTimeout(() => {
        loadAdminDashboard();
        seedingLoading.value = false;
        alert("Penanaman data awal (seeding) berhasil diselesaikan!");
      }, 2500);
    } catch (error) {
      seedingLoading.value = false;
      alert("Gagal menanam data: " + error.message);
    }
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    
    <!-- Title -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Dashboard Admin</h1>
        <p class="text-xs text-dark-400 mt-1">Pantau analitik sistem global, aktivitas pengguna, dan omset platform SportSpace</p>
      </div>
      
      <button 
        @click="triggerSeeding" 
        :disabled="seedingLoading"
        class="text-xs font-bold text-white flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
      >
        <Database class="w-4 h-4" />
        <span>{{ seedingLoading ? 'Menanam Data...' : 'Tanam Ulang Data (Seed)' }}</span>
      </button>
    </div>

    <!-- KPIs Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="glass-card p-5 flex items-center justify-between shadow-lg">
        <div class="space-y-1">
          <p class="text-[9px] text-dark-500 font-bold uppercase tracking-wider">Total User</p>
          <p class="text-xl font-extrabold text-white">{{ kpis.totalUsers }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
          <Users class="w-5 h-5" />
        </div>
      </div>

      <div class="glass-card p-5 flex items-center justify-between shadow-lg">
        <div class="space-y-1">
          <p class="text-[9px] text-dark-500 font-bold uppercase tracking-wider">Total Owner</p>
          <p class="text-xl font-extrabold text-white">{{ kpis.totalOwners }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
          <Landmark class="w-5 h-5" />
        </div>
      </div>

      <div class="glass-card p-5 flex items-center justify-between shadow-lg">
        <div class="space-y-1">
          <p class="text-[9px] text-dark-500 font-bold uppercase tracking-wider">Total Lapangan</p>
          <p class="text-xl font-extrabold text-white">{{ kpis.totalFields }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
          <Building class="w-5 h-5" />
        </div>
      </div>

      <div class="glass-card p-5 flex items-center justify-between shadow-lg">
        <div class="space-y-1">
          <p class="text-[9px] text-dark-500 font-bold uppercase tracking-wider">Total Booking</p>
          <p class="text-xl font-extrabold text-white">{{ kpis.totalBookings }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
          <ShoppingBag class="w-5 h-5" />
        </div>
      </div>

      <div class="glass-card p-5 flex items-center justify-between shadow-lg col-span-2 lg:col-span-1">
        <div class="space-y-1">
          <p class="text-[9px] text-dark-500 font-bold uppercase tracking-wider">Gross Omset</p>
          <p class="text-lg font-extrabold text-brand-400">Rp {{ kpis.totalRevenue.toLocaleString("id-ID") }}</p>
        </div>
        <div class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Monitoring & Activity feed -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- System Activity Monitoring Feed -->
      <div class="lg:col-span-1 glass-card p-6 space-y-4">
        <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
          <Activity class="w-4 h-4 text-brand-500" /> Monitoring Aktivitas Terbaru
        </h3>
        
        <div class="space-y-4 max-h-[350px] overflow-y-auto pr-2">
          <div 
            v-for="act in systemActivities" 
            :key="act.id" 
            class="flex gap-2 text-[10px] items-start border-l border-brand-500/30 pl-3 relative last:border-0"
          >
            <!-- Timeline node point -->
            <span class="absolute left-[-4px] top-1 w-2 h-2 rounded-full bg-brand-500"></span>
            
            <div class="space-y-1 flex-grow">
              <p class="text-dark-200 font-medium leading-relaxed">{{ act.message }}</p>
              <span class="text-[9px] text-dark-500 block">{{ new Date(act.timestamp).toLocaleTimeString("id-ID") }} - {{ new Date(act.timestamp).toLocaleDateString("id-ID") }}</span>
            </div>
          </div>
          <div v-if="systemActivities.length === 0" class="text-center py-6 text-xs text-dark-500">
            Belum ada aktivitas tercatat.
          </div>
        </div>
      </div>

      <!-- Recent bookings table -->
      <div class="lg:col-span-2 glass-card p-6 space-y-4">
        <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
          <Clock class="w-4 h-4 text-brand-500" /> Transaksi Terbaru Masuk
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr class="border-b border-dark-800 text-dark-500 uppercase tracking-wider font-bold">
                <th class="py-2.5 px-3">Kode Booking</th>
                <th class="py-2.5 px-3">Penyewa</th>
                <th class="py-2.5 px-3">Lapangan</th>
                <th class="py-2.5 px-3">Jadwal Sewa</th>
                <th class="py-2.5 px-3 text-right">Biaya</th>
                <th class="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="b in recentBookings" 
                :key="b.id" 
                class="border-b border-dark-900 last:border-b-0 hover:bg-dark-900/30"
              >
                <td class="py-3 px-3 font-mono font-bold text-white">{{ b.bookingCode }}</td>
                <td class="py-3 px-3 text-dark-200 font-semibold">{{ b.userName }}</td>
                <td class="py-3 px-3 text-dark-400">{{ b.fieldName }}</td>
                <td class="py-3 px-3 text-dark-400">{{ b.date }} ({{ b.startTime }})</td>
                <td class="py-3 px-3 text-right font-extrabold text-brand-400">Rp {{ b.total.toLocaleString("id-ID") }}</td>
                <td class="py-3 px-3 text-center">
                  <span 
                    class="text-[8px] font-bold px-2 py-0.5 rounded uppercase"
                    :class="[
                      b.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      b.status === 'Confirmed' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                      b.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    ]"
                  >
                    {{ b.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- User accounts database section -->
    <div class="glass-card p-6 space-y-4">
      <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
        <Users class="w-4 h-4 text-brand-500" /> Pendaftaran Pengguna Terbaru
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div 
          v-for="u in recentUsers" 
          :key="u.id" 
          class="bg-dark-950 p-4 border border-dark-900 rounded-2xl flex items-center gap-3"
        >
          <img :src="u.avatar" alt="Avatar" class="w-10 h-10 rounded-lg bg-dark-900 border border-dark-850" />
          <div class="min-w-0">
            <h5 class="font-bold text-xs text-white truncate leading-none">{{ u.name }}</h5>
            <span class="text-[9px] text-brand-400 block mt-1 uppercase tracking-wider font-semibold">{{ u.role }}</span>
            <span class="text-[8px] text-dark-500 block truncate mt-0.5">{{ u.email }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
