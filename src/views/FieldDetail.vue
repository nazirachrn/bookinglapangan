<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import { useNotificationStore } from "../stores/notification";
import { 
  Calendar, 
  Clock, 
  Star, 
  MapPin, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  ChevronLeft, 
  MessageSquare,
  Award,
  AlertCircle,
  TrendingDown,
  Users
} from "@lucide/vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();
const notificationStore = useNotificationStore();

const fieldId = computed(() => route.params.id);
const field = ref(null);
const reviews = ref([]);
const isFavorite = ref(false);

// Booking Form State
const selectedDate = ref("");
const selectedStartTime = ref("");
const selectedDuration = ref(1); // Default 1 hour
const availabilityMessage = ref("");
const isAvailable = ref(false);

// AI Feature State
const priceInsight = ref(null);
const crowdPrediction = ref(null);
const recommendations = ref(null);

// Main Image gallery State
const activeImageIndex = ref(0);

// Initialize date to tomorrow's date YYYY-MM-DD
function initTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  selectedDate.value = tomorrow.toISOString().split("T")[0];
}

onMounted(() => {
  loadFieldData();
});

watch(fieldId, () => {
  loadFieldData();
});

function loadFieldData() {
  const f = db.getById("fields", fieldId.value);
  if (!f) {
    router.push("/explore");
    return;
  }
  
  field.value = f;
  activeImageIndex.value = 0;
  initTomorrowDate();
  
  // Load Reviews for this field
  reviews.value = db.getCollection("reviews")
    .filter(r => r.fieldId === fieldId.value)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Load AI Insights
  priceInsight.value = db.getPriceInsight(fieldId.value);
  crowdPrediction.value = db.getCrowdPrediction(fieldId.value);
  recommendations.value = db.getSmartRecommendations(
    authStore.user?.id || null, 
    f.sport, 
    f.city
  );

  // Check if inside favorites (simulated by localStorage)
  const favs = JSON.parse(localStorage.getItem(`favs_${authStore.user?.id || "guest"}`) || "[]");
  isFavorite.value = favs.includes(fieldId.value);

  // Auto pick first available hour
  selectedStartTime.value = `${f.openHour.toString().padStart(2, "0")}:00`;
  checkBookingAvailability();
}

// Calculate hours list for time selections
const availableStartHours = computed(() => {
  if (!field.value) return [];
  const list = [];
  for (let h = field.value.openHour; h < field.value.closeHour; h++) {
    list.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return list;
});

// Watch booking form changes to re-evaluate slot availability
watch([selectedDate, selectedStartTime, selectedDuration], () => {
  checkBookingAvailability();
});

function checkBookingAvailability() {
  if (!field.value || !selectedDate.value || !selectedStartTime.value) return;

  const startHour = parseInt(selectedStartTime.value.split(":")[0]);
  const endHour = startHour + selectedDuration.value;
  const endTimeStr = `${endHour.toString().padStart(2, "0")}:00`;

  const res = db.checkAvailability(
    fieldId.value,
    selectedDate.value,
    selectedStartTime.value,
    endTimeStr
  );

  if (res.available) {
    isAvailable.value = true;
    availabilityMessage.value = "Slot waktu tersedia! Anda dapat melakukan pemesanan.";
  } else {
    isAvailable.value = false;
    availabilityMessage.value = res.reason;
  }
}

// Get slot class status for grid display
function getSlotStatus(hourStr) {
  if (!field.value) return "loading";
  
  const h = parseInt(hourStr.split(":")[0]);
  const targetEndTime = `${(h + 1).toString().padStart(2, "0")}:00`;
  
  // Check maintenance
  const maintenanceSlot = `${hourStr}-${targetEndTime}`;
  if (field.value.maintenanceSlots && field.value.maintenanceSlots.includes(maintenanceSlot)) {
    return "maintenance";
  }

  // Check booked
  const res = db.checkAvailability(fieldId.value, selectedDate.value, hourStr, targetEndTime);
  if (!res.available) {
    return "booked";
  }

  // Check currently selected
  const startH = parseInt(selectedStartTime.value.split(":")[0]);
  const endH = startH + selectedDuration.value;
  if (h >= startH && h < endH) {
    return "selected";
  }

  return "available";
}

// Book now process
function handleProceedBooking() {
  if (!authStore.isLoggedIn) {
    router.push({ name: "Login", query: { redirect: route.fullPath } });
    return;
  }

  if (!isAvailable.value) {
    alert("Slot waktu yang Anda pilih tidak tersedia.");
    return;
  }

  const startHour = parseInt(selectedStartTime.value.split(":")[0]);
  const endHour = startHour + selectedDuration.value;
  const endTimeStr = `${endHour.toString().padStart(2, "0")}:00`;

  // Set checkout details in pinia store
  cartStore.setBookingDetails(
    field.value,
    selectedDate.value,
    selectedStartTime.value,
    endTimeStr,
    selectedDuration.value
  );

  router.push("/checkout");
}

function toggleFavorite() {
  const userId = authStore.user?.id || "guest";
  const favs = JSON.parse(localStorage.getItem(`favs_${userId}`) || "[]");
  
  if (isFavorite.value) {
    const idx = favs.indexOf(fieldId.value);
    if (idx > -1) favs.splice(idx, 1);
    isFavorite.value = false;
    notificationStore.addNotification("Favorit Dihapus", `${field.value.name} dihapus dari daftar favorit.`, "user");
  } else {
    favs.push(fieldId.value);
    isFavorite.value = true;
    notificationStore.addNotification("Favorit Ditambahkan", `${field.value.name} ditambahkan ke daftar favorit.`, "user");
  }
  localStorage.setItem(`favs_${userId}`, JSON.stringify(favs));
}
</script>

<template>
  <div v-if="field" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
    
    <!-- Breadcrumbs & back button -->
    <div class="flex items-center gap-2">
      <router-link to="/explore" class="text-xs text-dark-400 hover:text-white flex items-center gap-1 font-bold">
        <ChevronLeft class="w-4 h-4" /> Kembali ke Explore
      </router-link>
    </div>

    <!-- Main Headings -->
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="bg-brand-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
            {{ field.sport }}
          </span>
          <span class="text-xs font-semibold text-dark-400 border border-dark-800 px-2 py-0.5 rounded">
            {{ field.indoor ? "Indoor Arena" : "Outdoor Arena" }}
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white mt-2 leading-tight">{{ field.name }}</h1>
        <p class="text-xs text-dark-400 mt-1 flex items-center gap-1.5">
          <MapPin class="w-4 h-4 text-brand-500 flex-shrink-0" /> {{ field.address }}
        </p>
      </div>

      <!-- Price Index Header / Favorite action -->
      <div class="flex items-center gap-4 w-full sm:w-auto justify-end">
        <button 
          @click="toggleFavorite"
          class="p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2"
          :class="[isFavorite ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-dark-900 border-dark-800 text-dark-300 hover:border-dark-700']"
        >
          <Heart class="w-4 h-4" :class="{'fill-red-500': isFavorite}" />
          <span>{{ isFavorite ? "Ditambahkan" : "Favorit" }}</span>
        </button>
      </div>
    </div>

    <!-- Gallery & Booking Form -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- Left: Gallery, Description, Amenities, Maps, Reviews -->
      <div class="lg:col-span-2 space-y-10">
        
        <!-- Gallery component -->
        <div class="space-y-3">
          <div class="h-[350px] md:h-[420px] rounded-2xl overflow-hidden bg-dark-900 border border-dark-800 shadow-lg relative">
            <img 
              :src="field.images[activeImageIndex]" 
              :alt="field.name" 
              class="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          <!-- Thumbnails list -->
          <div class="flex gap-3">
            <div 
              v-for="(img, idx) in field.images" 
              :key="idx"
              @click="activeImageIndex = idx"
              class="w-24 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-dark-900"
              :class="[activeImageIndex === idx ? 'border-brand-500 scale-95 shadow-lg shadow-brand-500/10' : 'border-transparent opacity-60 hover:opacity-100']"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <!-- Details Card tab -->
        <div class="glass-card p-6 space-y-6">
          <div>
            <h3 class="font-extrabold text-base text-white">Tentang Lapangan</h3>
            <p class="text-xs text-dark-300 mt-2.5 leading-relaxed">
              {{ field.description }}
            </p>
          </div>

          <!-- Amenities / Facilities -->
          <div class="border-t border-dark-800/60 pt-6">
            <h4 class="font-extrabold text-sm text-white">Fasilitas Arena</h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5">
              <div 
                v-for="am in field.amenities" 
                :key="am" 
                class="bg-dark-950/80 border border-dark-900 rounded-xl p-3 flex items-center gap-2.5"
              >
                <CheckCircle2 class="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span class="text-xs text-dark-200 font-semibold">{{ am }}</span>
              </div>
            </div>
          </div>

          <!-- Google Maps Embed placeholder -->
          <div class="border-t border-dark-800/60 pt-6">
            <h4 class="font-extrabold text-sm text-white">Lokasi Lapangan</h4>
            <div class="h-44 w-full rounded-2xl overflow-hidden border border-dark-800 bg-dark-950 mt-3.5 relative flex items-center justify-center">
              <!-- Grid background pattern -->
              <div class="absolute inset-0 bg-dark-900/60 opacity-30 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div class="text-center relative z-10 space-y-2.5 p-4">
                <MapPin class="w-8 h-8 text-brand-500 mx-auto glow-emerald" />
                <div>
                  <p class="text-xs font-bold text-white">{{ field.city }} - Kecamatan {{ field.district }}</p>
                  <p class="text-[10px] text-dark-400 mt-1 max-w-xs mx-auto">{{ field.address }}</p>
                </div>
                <!-- Mock map action button -->
                <a 
                  :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.name + ' ' + field.address)}`" 
                  target="_blank" 
                  class="inline-block bg-dark-800 border border-dark-700 hover:border-brand-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider"
                >
                  Buka Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Panels Widget -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- AI Panel 1: Price Insight & Recommendations -->
          <div v-if="priceInsight" class="glass-card p-6 border-brand-500/20 relative overflow-hidden">
            <!-- Background element -->
            <div class="absolute -right-6 -top-6 w-16 h-16 bg-brand-500/5 rounded-full"></div>
            
            <div class="flex items-center gap-2 text-brand-400 pb-3 border-b border-dark-800">
              <Sparkles class="w-4 h-4" />
              <h4 class="font-extrabold text-xs text-white uppercase tracking-wider">Price Insight & Smart Recs</h4>
            </div>

            <div class="space-y-4 mt-4">
              <div class="flex items-center justify-between text-xs">
                <span class="text-dark-400">Harga Lapangan Ini:</span>
                <span class="font-extrabold text-white">Rp {{ field.pricePerHour.toLocaleString("id-ID") }}/jam</span>
              </div>
              <div class="flex items-center justify-between text-xs border-b border-dark-850 pb-2.5">
                <span class="text-dark-400">Rata-rata Kota:</span>
                <span class="font-extrabold text-brand-400">Rp {{ priceInsight.averagePrice.toLocaleString("id-ID") }}/jam</span>
              </div>
              <div class="flex gap-2 bg-brand-500/5 border border-brand-500/10 p-3 rounded-xl">
                <TrendingDown class="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <p class="text-[10px] text-dark-300 leading-normal">{{ priceInsight.comparisonText }}</p>
              </div>
              <div v-if="recommendations" class="text-[10px] text-dark-400">
                <span class="font-bold text-dark-200 block mb-1">💡 Jam Main Terhemat Anda (Rekomendasi AI):</span>
                Berdasarkan histori booking Anda, slot <span class="text-brand-400 font-bold">{{ recommendations.favoriteHour }}</span> adalah jam paling favorit dan hemat.
              </div>
            </div>
          </div>

          <!-- AI Panel 2: Occupancy Prediction -->
          <div v-if="crowdPrediction" class="glass-card p-6 border-indigo-500/10 relative overflow-hidden">
            <div class="flex items-center gap-2 text-indigo-400 pb-3 border-b border-dark-800">
              <Users class="w-4 h-4" />
              <h4 class="font-extrabold text-xs text-white uppercase tracking-wider">Prediksi Okupansi Lapangan</h4>
            </div>

            <div class="space-y-4 mt-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-dark-950 p-2.5 border border-dark-900 rounded-xl text-center">
                  <p class="text-[9px] text-dark-500 uppercase font-bold">Jam Terpadat</p>
                  <p class="text-xs font-extrabold text-red-400 mt-0.5">{{ crowdPrediction.busiestTime }}</p>
                </div>
                <div class="bg-dark-950 p-2.5 border border-dark-900 rounded-xl text-center">
                  <p class="text-[9px] text-dark-500 uppercase font-bold">Jam Terlengang</p>
                  <p class="text-xs font-extrabold text-brand-400 mt-0.5">{{ crowdPrediction.quietestTime }}</p>
                </div>
              </div>

              <!-- Occupancy Bar chart mockup -->
              <div class="space-y-2">
                <p class="text-[9px] font-bold text-dark-400 uppercase tracking-wider">Estimasi Keramaian Hari Ini</p>
                <div class="flex items-end justify-between h-12 pt-2 bg-dark-950 rounded-lg px-2 border border-dark-900">
                  <div 
                    v-for="(item, idx) in crowdPrediction.hourlyData.slice(0, 7)" 
                    :key="idx" 
                    class="w-3 rounded-t-sm group relative"
                    :style="{ height: `${item.occupancy}%` }"
                    :class="[item.occupancy > 80 ? 'bg-red-500' : item.occupancy > 50 ? 'bg-yellow-500' : 'bg-brand-500']"
                  >
                    <!-- Tooltip -->
                    <span class="absolute bottom-full left-1/2 -translate-x-1/2 bg-dark-950 border border-dark-800 px-1 py-0.5 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                      {{ item.time }}: {{ item.occupancy }}%
                    </span>
                  </div>
                </div>
                <div class="flex justify-between text-[8px] text-dark-500">
                  <span>{{ crowdPrediction.hourlyData[0]?.time }}</span>
                  <span>{{ crowdPrediction.hourlyData[Math.floor(crowdPrediction.hourlyData.length / 2)]?.time }}</span>
                  <span>{{ crowdPrediction.hourlyData[crowdPrediction.hourlyData.length - 1]?.time }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- User Reviews list -->
        <div class="space-y-4">
          <div class="flex justify-between items-center pb-2 border-b border-dark-800">
            <h3 class="font-extrabold text-base text-white">Review Pengguna ({{ field.reviewCount }})</h3>
            <div class="flex items-center gap-1">
              <Star class="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span class="font-extrabold text-sm text-white">{{ field.rating }}</span>
              <span class="text-xs text-dark-400">/ 5.0</span>
            </div>
          </div>

          <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div 
              v-for="rev in reviews" 
              :key="rev.id" 
              class="glass-card p-4 space-y-3"
            >
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <img :src="rev.userAvatar" alt="Avatar" class="w-8 h-8 rounded-lg bg-dark-800 border border-dark-750" />
                  <div>
                    <h5 class="font-bold text-xs text-white leading-none">{{ rev.userName }}</h5>
                    <span class="text-[9px] text-dark-500 leading-none block mt-1">Diposting: {{ rev.date }}</span>
                  </div>
                </div>
                
                <!-- Review stars count -->
                <div class="flex gap-0.5">
                  <Star 
                    v-for="s in 5" 
                    :key="s" 
                    class="w-3 h-3" 
                    :class="[s <= rev.rating ? 'text-yellow-500 fill-yellow-500' : 'text-dark-800']"
                  />
                </div>
              </div>
              <p class="text-xs text-dark-300 leading-relaxed">{{ rev.comment }}</p>
            </div>

            <div v-if="reviews.length === 0" class="py-10 text-center text-xs text-dark-500">
              Belum ada review untuk lapangan ini. Jadilah yang pertama memberikan ulasan!
            </div>
          </div>
        </div>

      </div>

      <!-- Right: Booking Form Panel -->
      <div class="lg:col-span-1">
        <div class="glass-card p-6 border-brand-500/20 sticky top-24 space-y-6 shadow-2xl">
          
          <div class="pb-3 border-b border-dark-800">
            <h3 class="font-extrabold text-base text-white">Jadwalkan Main</h3>
            <p class="text-xs text-dark-400 mt-1">Isi formulir untuk reservasi slot</p>
          </div>

          <div class="space-y-4">
            <!-- Date picker input -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Tanggal</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                  <Calendar class="w-4 h-4" />
                </span>
                <input 
                  type="date" 
                  v-model="selectedDate"
                  class="glass-input pl-10 w-full text-xs"
                />
              </div>
            </div>

            <!-- Start Time select -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Jam Mulai</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                  <Clock class="w-4 h-4" />
                </span>
                <select 
                  v-model="selectedStartTime"
                  class="glass-input pl-10 w-full text-xs"
                >
                  <option 
                    v-for="hour in availableStartHours" 
                    :key="hour" 
                    :value="hour"
                  >
                    {{ hour }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Duration Select -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Durasi Sewa</label>
              <select v-model.number="selectedDuration" class="glass-input w-full text-xs">
                <option :value="1">1 Jam</option>
                <option :value="2">2 Jam</option>
                <option :value="3">3 Jam</option>
                <option :value="4">4 Jam</option>
              </select>
            </div>
          </div>

          <!-- Schedule Grid Visual Timeline -->
          <div class="space-y-2 pt-2">
            <span class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Timeline Waktu Hari Ini</span>
            <div class="grid grid-cols-4 gap-1.5">
              <div 
                v-for="hour in availableStartHours.slice(0, 12)" 
                :key="hour"
                class="py-2 rounded-xl text-center flex flex-col items-center justify-center border font-semibold text-[9px]"
                :class="[
                  getSlotStatus(hour) === 'available' ? 'bg-dark-950 text-dark-300 border-dark-800' :
                  getSlotStatus(hour) === 'selected' ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/10' :
                  getSlotStatus(hour) === 'maintenance' ? 'bg-red-500/10 text-red-400 border-red-500/20 opacity-60 line-through' :
                  'bg-dark-900 text-dark-600 border-dark-850 opacity-40 line-through'
                ]"
              >
                <span>{{ hour }}</span>
                <span class="text-[7px] font-bold mt-0.5 block uppercase">
                  {{ 
                    getSlotStatus(hour) === 'available' ? 'Kosong' :
                    getSlotStatus(hour) === 'selected' ? 'Pilihan' :
                    getSlotStatus(hour) === 'maintenance' ? 'Maint.' : 'Penuh'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Availability Check Status bar -->
          <div 
            class="p-3 border rounded-xl flex gap-2 text-[10px] leading-relaxed"
            :class="[isAvailable ? 'bg-brand-500/5 border-brand-500/10 text-brand-400' : 'bg-red-500/5 border-red-500/10 text-red-400']"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{{ availabilityMessage }}</p>
          </div>

          <!-- Fees Calculation details -->
          <div class="border-t border-dark-800/60 pt-4 space-y-2.5">
            <div class="flex justify-between items-center text-xs">
              <span class="text-dark-400">Harga Sewa ({{ selectedDuration }} jam)</span>
              <span class="font-semibold text-white">Rp {{ (field.pricePerHour * selectedDuration).toLocaleString("id-ID") }}</span>
            </div>
            <div class="flex justify-between items-center text-xs border-b border-dark-850 pb-2.5">
              <span class="text-dark-400">Pajak (PPN 11%)</span>
              <span class="font-semibold text-white">Rp {{ Math.round((field.pricePerHour * selectedDuration) * 0.11).toLocaleString("id-ID") }}</span>
            </div>
            
            <div class="flex justify-between items-end pt-1">
              <div>
                <p class="text-[9px] text-dark-500 font-bold uppercase leading-none">Total Pembayaran</p>
                <p class="text-base font-extrabold text-brand-400 mt-1.5">
                  Rp {{ Math.round((field.pricePerHour * selectedDuration) * 1.11).toLocaleString("id-ID") }}
                </p>
              </div>
              <span class="text-[9px] text-dark-400">Termasuk pajak</span>
            </div>
          </div>

          <!-- Booking Button -->
          <button 
            @click="handleProceedBooking"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            Lanjut Ke Pembayaran
          </button>
        </div>
      </div>

    </div>

  </div>
</template>
