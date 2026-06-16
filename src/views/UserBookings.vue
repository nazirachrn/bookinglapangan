<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  FileText, 
  XCircle, 
  MessageSquare,
  ChevronRight,
  User,
  Activity,
  CheckCircle,
  AlertCircle
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const allBookings = ref([]);
const activeTab = ref("active"); // active, completed, cancelled

// Review Modal State
const showReviewModal = ref(false);
const selectedBookingForReview = ref(null);
const reviewRating = ref(5);
const reviewComment = ref("");
const mockPhotoUploaded = ref(false);

onMounted(() => {
  loadUserBookings();
});

function loadUserBookings() {
  if (!authStore.isLoggedIn) {
    router.push("/login");
    return;
  }
  
  allBookings.value = db.getCollection("bookings")
    .filter(b => b.userId === authStore.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const filteredBookings = computed(() => {
  if (activeTab.value === "active") {
    return allBookings.value.filter(b => b.status === "Confirmed" || b.status === "Pending");
  } else if (activeTab.value === "completed") {
    return allBookings.value.filter(b => b.status === "Completed");
  } else if (activeTab.value === "cancelled") {
    return allBookings.value.filter(b => b.status === "Cancelled");
  }
  return [];
});

function handleCancelBooking(bookingId) {
  const confirmCancel = confirm("Apakah Anda yakin ingin membatalkan booking ini?");
  if (!confirmCancel) return;

  db.update("bookings", bookingId, { status: "Cancelled" });
  notificationStore.addNotification(
    "Booking Dibatalkan",
    `Pemesanan Lapangan Anda telah dibatalkan. Dana (jika sudah terbayar) diproses untuk refund.`,
    "user"
  );
  loadUserBookings();
}

// Open Review Dialog modal
function openReviewDialog(bookingItem) {
  selectedBookingForReview.value = bookingItem;
  reviewRating.value = 5;
  reviewComment.value = "";
  mockPhotoUploaded.value = false;
  showReviewModal.value = true;
}

// Save user review logic
function handleSaveReview() {
  if (!selectedBookingForReview.value) return;

  const newReview = {
    fieldId: selectedBookingForReview.value.fieldId,
    userId: authStore.user.id,
    userName: authStore.user.name,
    userAvatar: authStore.user.avatar,
    rating: reviewRating.value,
    comment: reviewComment.value || "Lapangan sangat bagus dan pelayanan memuaskan!",
    date: new Date().toISOString().split('T')[0]
  };

  // 1. Add review
  db.add("reviews", newReview);

  // 2. Mark booking review status or just keep it simple
  // 3. Recalculate average field rating
  const reviews = db.getCollection("reviews").filter(r => r.fieldId === selectedBookingForReview.value.fieldId);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const count = reviews.length;
  const avgRating = parseFloat((totalRating / count).toFixed(1));

  db.update("fields", selectedBookingForReview.value.fieldId, {
    rating: avgRating,
    reviewCount: count
  });

  notificationStore.addNotification(
    "Ulasan Dikirim",
    `Terima kasih! Ulasan bintang ${reviewRating.value} Anda untuk lapangan berhasil diposting.`,
    "user"
  );

  showReviewModal.value = false;
  selectedBookingForReview.value = null;
}

function handleMockPhotoUpload() {
  mockPhotoUploaded.value = true;
  alert("Foto bermain berhasil diunggah! (Simulasi file berhasil)");
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <!-- Header Page title -->
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Riwayat Booking</h1>
      <p class="text-xs text-dark-400 mt-1">Lihat status booking aktif, selesai, dan tiket invoice sebelumnya</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-dark-800">
      <button 
        v-for="tab in ['active', 'completed', 'cancelled']" 
        :key="tab"
        @click="activeTab = tab"
        class="px-6 py-3 text-xs font-bold capitalize border-b-2 transition-all"
        :class="[activeTab === tab ? 'border-brand-500 text-brand-400' : 'border-transparent text-dark-400 hover:text-white']"
      >
        {{ tab === 'active' ? 'Aktif' : tab === 'completed' ? 'Selesai' : 'Dibatalkan' }}
      </button>
    </div>

    <!-- Bookings list -->
    <div class="space-y-6">
      <div 
        v-for="b in filteredBookings" 
        :key="b.id" 
        class="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <!-- Info segment -->
        <div class="flex gap-4 items-start">
          <img :src="b.fieldImage" alt="Field" class="w-16 h-16 rounded-2xl object-cover border border-dark-900" />
          <div class="space-y-1">
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
            <h3 class="font-extrabold text-sm text-white mt-1">{{ b.fieldName }}</h3>
            <p class="text-[9px] text-dark-500 font-mono">Booking ID: {{ b.bookingCode }}</p>
            
            <div class="flex flex-wrap gap-4 text-[10px] text-dark-300 pt-2">
              <span class="flex items-center gap-1"><Calendar class="w-3.5 h-3.5 text-brand-500" /> {{ b.date }}</span>
              <span class="flex items-center gap-1"><Clock class="w-3.5 h-3.5 text-brand-500" /> {{ b.startTime }} - {{ b.endTime }}</span>
              <span class="flex items-center gap-1"><FileText class="w-3.5 h-3.5 text-brand-500" /> Rp {{ b.total.toLocaleString("id-ID") }}</span>
            </div>
          </div>
        </div>

        <!-- Action segment -->
        <div class="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
          
          <router-link 
            v-if="b.status === 'Confirmed' || b.status === 'Pending'"
            :to="`/ticket/${b.id}`" 
            class="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 shadow-md shadow-brand-500/10"
          >
            Tampilkan Tiket
          </router-link>

          <button 
            v-if="b.status === 'Confirmed' || b.status === 'Pending'"
            @click="handleCancelBooking(b.id)"
            class="bg-dark-950 border border-dark-800 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 text-xs font-bold px-4 py-2 rounded-xl active:scale-95"
          >
            Batalkan Sewa
          </button>

          <button 
            v-if="b.status === 'Completed'"
            @click="openReviewDialog(b)"
            class="bg-brand-500/10 hover:bg-brand-500 hover:text-white border border-brand-500/20 text-brand-400 text-xs font-bold px-4 py-2 rounded-xl active:scale-95 flex items-center gap-1.5"
          >
            <MessageSquare class="w-4 h-4" /> Ulas Lapangan
          </button>

          <!-- Mock invoice printing -->
          <a 
            :href="`javascript:window.print()`"
            class="bg-dark-900 border border-dark-800 hover:bg-dark-800 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 flex items-center gap-1.5"
          >
            Invoice
          </a>

        </div>

      </div>

      <div v-if="filteredBookings.length === 0" class="glass-card p-12 text-center space-y-3">
        <div class="mx-auto w-10 h-10 bg-dark-900 rounded-full border border-dark-800 flex items-center justify-center text-dark-500">
          <FileText class="w-5 h-5" />
        </div>
        <p class="text-xs text-dark-500">Tidak ada riwayat booking pada kategori ini.</p>
      </div>
    </div>

    <!-- Write review popup modal dialog -->
    <div 
      v-if="showReviewModal" 
      class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm"
    >
      <div class="glass-card p-6 max-w-md w-full space-y-6 shadow-2xl relative border-dark-800 animate-slide-up">
        
        <div class="flex justify-between items-center pb-2 border-b border-dark-800">
          <h3 class="font-extrabold text-sm text-white">Tulis Ulasan Lapangan</h3>
          <button @click="showReviewModal = false" class="text-dark-500 hover:text-white font-bold text-xs">Tutup</button>
        </div>

        <div v-if="selectedBookingForReview" class="space-y-4">
          <!-- Court name header -->
          <div class="flex gap-3 items-center">
            <img :src="selectedBookingForReview.fieldImage" class="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h4 class="font-bold text-xs text-white">{{ selectedBookingForReview.fieldName }}</h4>
              <p class="text-[9px] text-dark-500">{{ selectedBookingForReview.date }}</p>
            </div>
          </div>

          <!-- Stars selector -->
          <div class="space-y-1.5 text-center py-2 bg-dark-950/60 border border-dark-900 rounded-2xl">
            <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Beri Rating</label>
            <div class="flex justify-center gap-2 pt-1">
              <Star 
                v-for="s in 5" 
                :key="s" 
                @click="reviewRating = s"
                class="w-8 h-8 cursor-pointer hover:scale-105 transition-transform" 
                :class="[s <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-dark-800']"
              />
            </div>
            <span class="text-xs text-brand-400 font-extrabold mt-1 block">Rating: {{ reviewRating }} / 5</span>
          </div>

          <!-- Comment text area -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Tulis Ulasan Anda</label>
            <textarea 
              v-model="reviewComment"
              rows="3"
              placeholder="Ceritakan pengalaman bermain Anda di lapangan ini..."
              class="glass-input w-full text-xs"
            ></textarea>
          </div>

          <!-- Mock Image upload -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Unggah Foto Bermain</label>
            <button 
              type="button" 
              @click="handleMockPhotoUpload"
              class="w-full bg-dark-950 hover:bg-dark-900 text-dark-300 border border-dark-850 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {{ mockPhotoUploaded ? 'Foto Berhasil Diunggah ✓' : 'Pilih Foto Pengalaman Bermain' }}
            </button>
          </div>

          <!-- Submit button -->
          <button 
            @click="handleSaveReview"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider"
          >
            Kirim Ulasan Lapangan
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
