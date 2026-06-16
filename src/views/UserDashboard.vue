<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Percent, 
  Trophy, 
  Plus, 
  ArrowRight,
  Heart,
  ChevronRight,
  CheckCircle2,
  CalendarDays
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();

const upcomingBookings = ref([]);
const todaySchedule = ref([]);
const favoriteFields = ref([]);
const latestPromos = ref([]);
const lastBooking = ref(null);

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push("/login");
    return;
  }

  const userId = authStore.user.id;
  const bookings = db.getCollection("bookings").filter(b => b.userId === userId);
  const fields = db.getCollection("fields");
  const promos = db.getCollection("promos");

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Bookings for today
  todaySchedule.value = bookings.filter(b => b.date === todayStr && b.status === "Confirmed");

  // 2. Upcoming bookings (future dates or later today)
  upcomingBookings.value = bookings
    .filter(b => b.date > todayStr && (b.status === "Confirmed" || b.status === "Pending"))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 2);

  // 3. Favorites fields
  const favIds = JSON.parse(localStorage.getItem(`favs_${userId}`) || "[]");
  favoriteFields.value = fields.filter(f => favIds.includes(f.id)).slice(0, 3);
  // Fallback to top-rated if empty
  if (favoriteFields.value.length === 0) {
    favoriteFields.value = fields.slice(0, 2);
  }

  // 4. Latest active promos
  latestPromos.value = promos.filter(p => p.isActive).slice(0, 2);

  // 5. Last booking
  if (bookings.length > 0) {
    const sorted = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    lastBooking.value = sorted[0];
  }
});

function handlePromoCopy(code) {
  navigator.clipboard.writeText(code);
  alert(`Kode promo "${code}" berhasil disalin! gunakan saat checkout.`);
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    
    <!-- Welcome Header Banner -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Halo, {{ authStore.user.name }}!</h1>
        <p class="text-xs text-dark-400 mt-1">Pantau reservasi lapangan Anda dan temukan promo terupdate di sini</p>
      </div>

      <!-- Quick Search CTA -->
      <router-link 
        to="/explore" 
        class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95"
      >
        <Plus class="w-4 h-4" /> Sewa Lapangan Baru
      </router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- Left side: Booking schedules -->
      <div class="lg:col-span-2 space-y-8">
        
        <!-- Today Schedule -->
        <div class="glass-card p-6 space-y-4">
          <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
            <Clock class="w-4 h-4 text-brand-500" /> Jadwal Bermain Hari Ini
          </h3>

          <div v-if="todaySchedule.length > 0" class="space-y-4">
            <div 
              v-for="b in todaySchedule" 
              :key="b.id" 
              class="bg-brand-500/5 border border-brand-500/15 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div class="flex gap-3 items-center">
                <img :src="b.fieldImage" alt="Field" class="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 class="font-bold text-xs text-white">{{ b.fieldName }}</h4>
                  <p class="text-[10px] text-brand-400 mt-0.5">{{ b.startTime }} - {{ b.endTime }} ({{ b.duration }} Jam)</p>
                </div>
              </div>
              <router-link 
                :to="`/ticket/${b.id}`" 
                class="bg-brand-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 shadow-md shadow-brand-500/10"
              >
                Tampilkan E-Ticket QR
              </router-link>
            </div>
          </div>
          <div v-else class="py-6 text-center text-xs text-dark-500">
            Tidak ada jadwal bermain terdaftar hari ini.
          </div>
        </div>

        <!-- Upcoming bookings -->
        <div class="glass-card p-6 space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-dark-800">
            <h3 class="font-extrabold text-sm text-white flex items-center gap-2">
              <CalendarDays class="w-4 h-4 text-brand-500" /> Booking Berikutnya
            </h3>
            <router-link 
              to="/dashboard/user/bookings" 
              class="text-xs text-brand-400 font-bold hover:underline flex items-center gap-0.5"
            >
              Semua Booking <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>

          <div v-if="upcomingBookings.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="b in upcomingBookings" 
              :key="b.id" 
              class="bg-dark-950 p-4 border border-dark-900 rounded-2xl space-y-3 relative overflow-hidden group hover:border-dark-850"
            >
              <span class="absolute top-4 right-4 text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">
                {{ b.status }}
              </span>
              
              <div class="flex gap-2.5 items-center">
                <img :src="b.fieldImage" alt="Field" class="w-10 h-10 rounded-lg object-cover" />
                <div class="pr-12">
                  <h4 class="font-bold text-xs text-white truncate">{{ b.fieldName }}</h4>
                  <p class="text-[9px] text-dark-500 mt-0.5 capitalize">{{ b.fieldCity }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[10px] text-dark-300 pt-2 border-t border-dark-900">
                <div class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-brand-400" /> {{ b.date }}
                </div>
                <div class="flex items-center gap-1.5 justify-end">
                  <Clock class="w-3.5 h-3.5 text-brand-400" /> {{ b.startTime }}
                </div>
              </div>

              <router-link 
                :to="`/ticket/${b.id}`" 
                class="block w-full text-center bg-dark-900 hover:bg-dark-800 text-white font-bold py-2 rounded-xl text-[10px]"
              >
                Lihat Detail Tiket
              </router-link>
            </div>
          </div>
          <div v-else class="py-8 text-center text-xs text-dark-500">
            Tidak ada booking terdaftar.
          </div>
        </div>

        <!-- Last transaction info card -->
        <div v-if="lastBooking" class="glass-card p-6 space-y-4">
          <h3 class="font-extrabold text-sm text-white pb-2 border-b border-dark-800">Riwayat Transaksi Terakhir</h3>
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-950/60 p-4 border border-dark-900 rounded-2xl">
            <div class="space-y-1">
              <span class="text-[8px] font-mono font-bold text-dark-500 uppercase tracking-wider block">ID Transaksi: {{ lastBooking.bookingCode }}</span>
              <h4 class="font-bold text-xs text-white">{{ lastBooking.fieldName }}</h4>
              <p class="text-[9px] text-dark-400">Total Pembayaran: <span class="text-brand-400 font-bold">Rp {{ lastBooking.total.toLocaleString("id-ID") }}</span> via {{ lastBooking.paymentMethod }}</p>
            </div>
            
            <div class="flex items-center gap-3">
              <span 
                class="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
                :class="[
                  lastBooking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  lastBooking.status === 'Confirmed' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                  lastBooking.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                ]"
              >
                {{ lastBooking.status }}
              </span>
              <router-link 
                to="/dashboard/user/bookings" 
                class="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5"
              >
                Detail <ChevronRight class="w-4 h-4" />
              </router-link>
            </div>
          </div>
        </div>

      </div>

      <!-- Right side: Favorites and Promos -->
      <div class="space-y-8">
        
        <!-- Favorites courts list -->
        <div class="glass-card p-6 space-y-4">
          <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
            <Heart class="w-4 h-4 text-brand-500 fill-brand-500" /> Lapangan Favorit
          </h3>

          <div class="space-y-4">
            <div 
              v-for="f in favoriteFields" 
              :key="f.id"
              @click="router.push(`/field/${f.id}`)"
              class="flex gap-3 items-center group cursor-pointer"
            >
              <img :src="f.images[0]" alt="Field" class="w-12 h-12 rounded-xl object-cover border border-dark-900 group-hover:scale-105 transition-transform" />
              <div class="flex-grow min-w-0">
                <h4 class="font-bold text-xs text-white truncate group-hover:text-brand-400 transition-colors">{{ f.name }}</h4>
                <p class="text-[9px] text-dark-500 mt-0.5 flex items-center gap-0.5">
                  <MapPin class="w-3 h-3 text-brand-500" /> {{ f.city }}
                </p>
              </div>
              <div class="flex items-center gap-0.5 text-xs font-bold text-yellow-500 fill-yellow-500 flex-shrink-0">
                <Star class="w-3.5 h-3.5" /> {{ f.rating }}
              </div>
            </div>
          </div>
        </div>

        <!-- Latest Promos list -->
        <div class="glass-card p-6 space-y-4">
          <h3 class="font-extrabold text-sm text-white flex items-center gap-2 pb-2 border-b border-dark-800">
            <Percent class="w-4 h-4 text-brand-500" /> Promo Terbaru
          </h3>

          <div class="space-y-4">
            <div 
              v-for="p in latestPromos" 
              :key="p.id" 
              class="bg-dark-950 p-4 border border-dark-900 rounded-2xl relative overflow-hidden group"
            >
              <h4 class="font-bold text-xs text-white">{{ p.name }}</h4>
              <p class="text-[9px] text-dark-500 mt-1">Diskon: {{ p.isPercent ? `${p.value}%` : `Rp ${p.value.toLocaleString("id-ID")}` }}</p>
              
              <div class="flex gap-2 items-center justify-between mt-3 pt-2 border-t border-dark-900/60">
                <span class="font-mono text-[10px] font-bold text-white uppercase tracking-wider">{{ p.code }}</span>
                <button 
                  @click="handlePromoCopy(p.code)"
                  class="bg-brand-500/10 hover:bg-brand-500 hover:text-white border border-brand-500/20 text-brand-400 px-2 py-1 rounded-lg text-[9px] font-extrabold"
                >
                  Salin Kode
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
