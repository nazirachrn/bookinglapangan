<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { useNotificationStore } from "../stores/notification";
import { db } from "../services/db";
import { 
  CreditCard, 
  MapPin, 
  Calendar, 
  Clock, 
  Percent, 
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  DollarSign
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const notificationStore = useNotificationStore();

const promoInput = ref("");
const promoMessage = ref("");
const promoSuccess = ref(false);
const selectedPaymentMethod = ref("GoPay");
const loading = ref(false);

onMounted(() => {
  // Guard check: if cart is empty, redirect back
  if (!cartStore.field) {
    router.push("/explore");
  }
});

function handleApplyPromo() {
  if (!promoInput.value) return;

  const res = cartStore.applyPromo(promoInput.value);
  promoMessage.value = res.message;
  promoSuccess.value = res.success;
}

function handleConfirmPayment() {
  if (!cartStore.field) return;

  loading.value = true;
  
  setTimeout(() => {
    // Generate Booking Record in database
    const today = new Date();
    const dateStr = cartStore.date;
    
    const newBooking = {
      bookingCode: `SS-${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      fieldId: cartStore.field.id,
      fieldName: cartStore.field.name,
      fieldCity: cartStore.field.city,
      fieldSport: cartStore.field.sport,
      fieldImage: cartStore.field.images[0],
      userId: authStore.user.id,
      userName: authStore.user.name,
      ownerId: cartStore.field.ownerId,
      date: dateStr,
      startTime: cartStore.startTime,
      endTime: cartStore.endTime,
      duration: cartStore.duration,
      pricePerHour: cartStore.field.pricePerHour,
      subtotal: cartStore.subtotal,
      discount: cartStore.discount,
      promoCode: cartStore.promoCode,
      tax: cartStore.tax,
      total: cartStore.total,
      status: selectedPaymentMethod.value === "Tunai (Cash)" ? "Pending" : "Confirmed",
      paymentMethod: selectedPaymentMethod.value,
      createdAt: today.toISOString()
    };

    const added = db.add("bookings", newBooking);
    
    loading.value = false;

    // Toast and Notif stack
    notificationStore.addNotification(
      newBooking.status === "Pending" ? "Booking Berhasil Terdaftar" : "Pembayaran Berhasil",
      newBooking.status === "Pending"
        ? `Booking via Tunai (Cash) terdaftar, menunggu konfirmasi pemilik lapangan.`
        : `Pembayaran Rp ${cartStore.total.toLocaleString("id-ID")} via ${selectedPaymentMethod.value} berhasil.`,
      "user"
    );

    // Notify owner if status is Pending
    if (newBooking.status === "Pending") {
      notificationStore.addNotification(
        "Booking Masuk Baru",
        `Booking baru untuk ${newBooking.fieldName} oleh ${newBooking.userName} membutuhkan konfirmasi.`,
        "owner"
      );
    }
    
    // Clear cart
    const bookingId = added.id;
    cartStore.clearCart();

    // Redirect to E-ticket
    router.push(`/ticket/${bookingId}`);
  }, 1200);
}
</script>

<template>
  <div v-if="cartStore.field" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <div class="flex items-center gap-2">
      <button 
        @click="router.back()" 
        class="text-xs text-dark-400 hover:text-white flex items-center gap-1 font-bold"
      >
        <ChevronLeft class="w-4 h-4" /> Kembali ke Detail Lapangan
      </button>
    </div>

    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Checkout Pemesanan</h1>
      <p class="text-xs text-dark-400 mt-1">Review rincian transaksi dan lakukan pembayaran aman</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
      
      <!-- Left side: Booking review and payment methods -->
      <div class="md:col-span-2 space-y-6">
        
        <!-- Field Summary card -->
        <div class="glass-card p-6 flex gap-4">
          <img 
            :src="cartStore.field.images[0]" 
            alt="Field" 
            class="w-24 h-24 rounded-xl object-cover border border-dark-800"
          />
          <div class="space-y-1">
            <span class="bg-brand-500/10 text-brand-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {{ cartStore.field.sport }}
            </span>
            <h3 class="font-extrabold text-base text-white mt-1">{{ cartStore.field.name }}</h3>
            <p class="text-[10px] text-dark-400 flex items-center gap-1">
              <MapPin class="w-3.5 h-3.5 text-dark-500" /> {{ cartStore.field.district }}, {{ cartStore.field.city }}
            </p>
          </div>
        </div>

        <!-- Schedule details -->
        <div class="glass-card p-6 space-y-4">
          <h4 class="font-bold text-sm text-white pb-2 border-b border-dark-800">Detail Jadwal Reservasi</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-dark-950 text-brand-500 border border-dark-900">
                <Calendar class="w-5 h-5" />
              </div>
              <div>
                <p class="text-[9px] text-dark-500 font-bold uppercase">Tanggal Main</p>
                <p class="text-xs font-bold text-white mt-0.5">{{ cartStore.date }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-dark-950 text-brand-500 border border-dark-900">
                <Clock class="w-5 h-5" />
              </div>
              <div>
                <p class="text-[9px] text-dark-500 font-bold uppercase">Jam & Durasi</p>
                <p class="text-xs font-bold text-white mt-0.5">
                  {{ cartStore.startTime }} - {{ cartStore.endTime }} ({{ cartStore.duration }} Jam)
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="glass-card p-6 space-y-4">
          <h4 class="font-bold text-sm text-white pb-2 border-b border-dark-800">Pilih Metode Pembayaran</h4>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div 
              v-for="method in ['GoPay', 'OVO', 'ShopeePay', 'Transfer Bank', 'Kartu Kredit', 'Tunai (Cash)']"
              :key="method"
              @click="selectedPaymentMethod = method"
              class="p-4 rounded-xl border cursor-pointer text-center space-y-1.5 transition-all select-none"
              :class="[selectedPaymentMethod === method ? 'bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/5' : 'bg-dark-950 border-dark-900 hover:border-dark-800']"
            >
              <component :is="method === 'Tunai (Cash)' ? DollarSign : CreditCard" class="w-5 h-5 mx-auto text-dark-400" :class="{'text-brand-400': selectedPaymentMethod === method}" />
              <span class="text-xs font-bold text-white block">{{ method }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Right side: Promo Voucher & Invoice calculations -->
      <div class="md:col-span-1 space-y-6">
        
        <!-- Promo Coupon block -->
        <div class="glass-card p-5 space-y-3">
          <h4 class="font-bold text-xs text-white uppercase tracking-wider">Gunakan Promo / Voucher</h4>
          
          <div class="flex gap-2">
            <input 
              type="text" 
              v-model="promoInput"
              placeholder="KODEPROMO" 
              class="glass-input w-full text-xs uppercase"
              :disabled="cartStore.promoCode !== ''"
            />
            <button 
              @click="handleApplyPromo"
              :disabled="cartStore.promoCode !== ''"
              class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs active:scale-95 disabled:opacity-40"
            >
              Gunakan
            </button>
          </div>

          <!-- Promo application result message -->
          <div 
            v-if="promoMessage" 
            class="p-2.5 border rounded-lg flex gap-1.5 text-[9px] leading-relaxed"
            :class="[promoSuccess ? 'bg-brand-500/5 border-brand-500/10 text-brand-400' : 'bg-red-500/5 border-red-500/10 text-red-400']"
          >
            <component :is="promoSuccess ? CheckCircle : AlertCircle" class="w-3.5 h-3.5 flex-shrink-0" />
            <p>{{ promoMessage }}</p>
          </div>

          <p v-if="cartStore.promoCode" class="text-[9px] text-dark-500">
            Kupon aktif: <span class="text-brand-400 font-bold font-mono">{{ cartStore.promoCode }}</span>
          </p>
        </div>

        <!-- Invoice Breakdown details -->
        <div class="glass-card p-5 space-y-4 shadow-xl">
          <h4 class="font-bold text-xs text-white uppercase tracking-wider pb-2 border-b border-dark-800">Rincian Pembayaran</h4>
          
          <div class="space-y-3 text-xs">
            <div class="flex justify-between items-center text-dark-400">
              <span>Biaya Sewa Lapangan</span>
              <span class="font-semibold text-white">Rp {{ cartStore.subtotal.toLocaleString("id-ID") }}</span>
            </div>
            
            <div v-if="cartStore.discount > 0" class="flex justify-between items-center text-brand-400 font-semibold">
              <span class="flex items-center gap-1"><Percent class="w-3.5 h-3.5" /> Diskon Promo</span>
              <span>- Rp {{ cartStore.discount.toLocaleString("id-ID") }}</span>
            </div>

            <div class="flex justify-between items-center text-dark-400 border-b border-dark-850 pb-3">
              <span>Pajak (PPN 11%)</span>
              <span class="font-semibold text-white">Rp {{ cartStore.tax.toLocaleString("id-ID") }}</span>
            </div>

            <div class="flex justify-between items-end pt-1">
              <div>
                <p class="text-[9px] text-dark-500 font-bold uppercase leading-none">Total Pembayaran</p>
                <p class="text-lg font-extrabold text-brand-400 mt-2">
                  Rp {{ cartStore.total.toLocaleString("id-ID") }}
                </p>
              </div>
              <span class="text-[9px] text-dark-500 leading-none">Lunas PPN</span>
            </div>
          </div>

          <!-- Checkout Confirm Button -->
          <button 
            @click="handleConfirmPayment"
            :disabled="loading"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
          >
            <span v-if="loading">Memproses Pembayaran...</span>
            <span v-else>Bayar & Dapatkan Tiket</span>
          </button>
        </div>

      </div>

    </div>

  </div>
</template>
