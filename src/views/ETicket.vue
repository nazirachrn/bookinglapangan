<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import QRCode from "qrcode";
import { 
  QrCode as QrIcon, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Download, 
  Printer,
  ChevronRight,
  User,
  CreditCard,
  Grid
} from "@lucide/vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const bookingId = computed(() => route.params.id);
const booking = ref(null);
const field = ref(null);
const qrCodeDataUrl = ref("");
const loading = ref(true);

onMounted(() => {
  const b = db.getById("bookings", bookingId.value);
  if (!b) {
    router.push("/");
    return;
  }

  booking.value = b;
  field.value = db.getById("fields", b.fieldId);
  
  // Generate QR Code
  QRCode.toDataURL(b.bookingCode, {
    margin: 1,
    width: 250,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF"
    }
  })
  .then(url => {
    qrCodeDataUrl.value = url;
    loading.value = false;
  })
  .catch(err => {
    console.error("Error generating QR code:", err);
    loading.value = false;
  });
});

function handlePrint() {
  window.print();
}
</script>

<template>
  <div v-if="booking" class="max-w-xl mx-auto px-4 py-10 md:py-16 space-y-8 print:py-0">
    
    <!-- Header Message (Hide on print) -->
    <div class="text-center space-y-2 print:hidden">
      <div 
        class="inline-flex p-3 rounded-full mb-2 border"
        :class="[
          booking.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
          booking.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
          'bg-brand-500/10 text-brand-500 border-brand-500/20'
        ]"
      >
        <component 
          :is="booking.status === 'Pending' ? Clock : booking.status === 'Cancelled' ? XCircle : CheckCircle" 
          class="w-8 h-8"
          :class="{'glow-emerald': booking.status !== 'Pending' && booking.status !== 'Cancelled'}" 
        />
      </div>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
        {{ booking.status === 'Pending' ? 'Booking Tertunda' : booking.status === 'Cancelled' ? 'Booking Dibatalkan' : 'Booking Berhasil!' }}
      </h1>
      <p class="text-xs text-dark-400">
        {{ booking.status === 'Pending' ? 'Pesanan terdaftar. Menunggu konfirmasi pemilik lapangan dan bayar cash di venue.' : booking.status === 'Cancelled' ? 'Pemesanan ini telah dibatalkan.' : 'E-Ticket QR Code Anda telah aktif dan siap digunakan' }}
      </p>
    </div>

    <!-- E-Ticket Main Card Container -->
    <div class="relative bg-white text-dark-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-dark-200">
      
      <!-- Top Section (Venue Name and Sport) -->
      <div class="bg-gradient-to-r from-dark-950 to-dark-900 text-white p-6 relative">
        <div class="absolute right-6 top-6 bg-brand-500 text-white text-[9px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
          {{ booking.fieldSport }}
        </div>
        <h2 class="text-lg font-extrabold tracking-tight pr-16 leading-tight">{{ booking.fieldName }}</h2>
        <p class="text-[10px] text-dark-400 flex items-center gap-1 mt-1 truncate">
          <MapPin class="w-3.5 h-3.5 text-brand-500" /> {{ booking.fieldCity }}
        </p>
      </div>

      <!-- Center Section (QR Code Card) -->
      <div class="p-6 md:p-8 flex flex-col items-center justify-center border-b-2 border-dashed border-dark-200 bg-white text-center space-y-4 relative">
        
        <!-- Ticket cut notch circles (left and right) -->
        <div class="absolute -left-3.5 -bottom-3.5 w-7 h-7 bg-dark-950 rounded-full border border-dark-250 z-10 print:bg-white"></div>
        <div class="absolute -right-3.5 -bottom-3.5 w-7 h-7 bg-dark-950 rounded-full border border-dark-250 z-10 print:bg-white"></div>

        <!-- QR Code Wrapper -->
        <div class="p-3 bg-white border border-dark-100 rounded-2xl shadow-sm relative group overflow-hidden">
          <div v-if="loading" class="w-44 h-44 flex items-center justify-center text-xs text-dark-500">
            Generating Ticket...
          </div>
          <img v-else :src="qrCodeDataUrl" alt="QR Ticket Code" class="w-44 h-44 object-contain" />
        </div>

        <div>
          <p class="text-[10px] text-dark-400 font-extrabold uppercase tracking-widest leading-none">Booking ID</p>
          <p class="text-base font-extrabold text-dark-950 mt-1.5 font-mono select-all">{{ booking.bookingCode }}</p>
        </div>
      </div>

      <!-- Bottom Section (Reservation metadata details) -->
      <div class="p-6 md:p-8 bg-white grid grid-cols-2 gap-5 text-xs">
        
        <div class="space-y-1">
          <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Penyewa</span>
          <p class="font-extrabold text-dark-950 flex items-center gap-1.5 truncate">
            <User class="w-3.5 h-3.5 text-dark-500" /> {{ booking.userName }}
          </p>
        </div>

        <div class="space-y-1">
          <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Metode Pembayaran</span>
          <p class="font-extrabold text-dark-950 flex items-center gap-1.5">
            <CreditCard class="w-3.5 h-3.5 text-dark-500" /> {{ booking.paymentMethod }}
          </p>
        </div>

        <div class="space-y-1">
          <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Tanggal Main</span>
          <p class="font-extrabold text-dark-950 flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5 text-dark-500" /> {{ booking.date }}
          </p>
        </div>

        <div class="space-y-1">
          <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Jam Sewa</span>
          <p class="font-extrabold text-dark-950 flex items-center gap-1.5">
            <Clock class="w-3.5 h-3.5 text-dark-500" /> {{ booking.startTime }} - {{ booking.endTime }}
          </p>
        </div>

        <div class="space-y-1 col-span-2 pt-2 border-t border-dark-100 flex justify-between items-center">
          <div>
            <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Status Tiket</span>
            <span 
              v-if="booking.status === 'Pending'" 
              class="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 mt-1 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100"
            >
              <Clock class="w-3.5 h-3.5" /> Menunggu Konfirmasi
            </span>
            <span 
              v-else-if="booking.status === 'Cancelled'" 
              class="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded border border-red-100"
            >
              <XCircle class="w-3.5 h-3.5" /> Dibatalkan
            </span>
            <span 
              v-else
              class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
            >
              <CheckCircle class="w-3.5 h-3.5" /> Lunas & Aktif
            </span>
          </div>
          <div class="text-right">
            <span class="text-[9px] text-dark-400 uppercase font-bold tracking-wider block">Total Pembayaran</span>
            <p class="text-sm font-extrabold text-dark-950 mt-1">Rp {{ booking.total.toLocaleString("id-ID") }}</p>
          </div>
        </div>

      </div>

    </div>

    <!-- Print / Action Controls (Hide on print) -->
    <div class="flex gap-4 items-center justify-center print:hidden">
      <button 
        @click="handlePrint"
        class="bg-dark-900 hover:bg-dark-800 text-white border border-dark-800 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-md"
      >
        <Printer class="w-4 h-4" /> Cetak Tiket
      </button>

      <router-link 
        to="/dashboard/user"
        class="bg-brand-500 hover:bg-brand-600 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-brand-500/10"
      >
        Dashboard Saya <ChevronRight class="w-4 h-4" />
      </router-link>
    </div>

  </div>
</template>

<style scoped>
@media print {
  body {
    background: white !important;
    color: black !important;
  }
}
</style>
