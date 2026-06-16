<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db } from "../services/db";
import { 
  Search, 
  MapPin, 
  Activity, 
  Star, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles,
  RotateCcw,
  Sliders,
  DollarSign
} from "@lucide/vue";

const route = useRoute();
const router = useRouter();

// Filter States
const searchVal = ref("");
const selectedSport = ref("");
const selectedCity = ref("");
const maxPrice = ref(500000);
const minRating = ref(0);
const filterIndoor = ref(null); // null = all, true = indoor, false = outdoor
const sortBy = ref("popularity"); // popularity, price_asc, price_desc, rating

// Fields collection
const allFields = ref([]);

onMounted(() => {
  allFields.value = db.getCollection("fields");
  
  // Load query params
  applyQueryParams();
});

function applyQueryParams() {
  if (route.query.sport) selectedSport.value = route.query.sport;
  if (route.query.city) selectedCity.value = route.query.city;
  if (route.query.search) searchVal.value = route.query.search;
}

// Watch route query params to sync state
watch(() => route.query, () => {
  applyQueryParams();
});

// Reset all filters
function resetFilters() {
  searchVal.value = "";
  selectedSport.value = "";
  selectedCity.value = "";
  maxPrice.value = 500000;
  minRating.value = 0;
  filterIndoor.value = null;
  sortBy.value = "popularity";
  router.push({ name: "Explore", query: {} });
}

// Filtered and sorted fields computation
const filteredFields = computed(() => {
  let list = [...allFields.value];

  // 1. Search Query Match
  if (searchVal.value) {
    const q = searchVal.value.toLowerCase();
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q)
    );
  }

  // 2. Sport Type Filter
  if (selectedSport.value) {
    list = list.filter((f) => f.sport === selectedSport.value);
  }

  // 3. City Filter
  if (selectedCity.value) {
    list = list.filter((f) => f.city === selectedCity.value);
  }

  // 4. Max Price Filter
  if (maxPrice.value) {
    list = list.filter((f) => f.pricePerHour <= maxPrice.value);
  }

  // 5. Rating Filter
  if (minRating.value > 0) {
    list = list.filter((f) => f.rating >= minRating.value);
  }

  // 6. Indoor/Outdoor Filter
  if (filterIndoor.value !== null) {
    list = list.filter((f) => f.indoor === filterIndoor.value);
  }

  // 7. Sort Operations
  if (sortBy.value === "popularity") {
    // Sorted by review count + rating
    list.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (sortBy.value === "price_asc") {
    list.sort((a, b) => a.pricePerHour - b.pricePerHour);
  } else if (sortBy.value === "price_desc") {
    list.sort((a, b) => b.pricePerHour - a.pricePerHour);
  } else if (sortBy.value === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list;
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <!-- Title Page Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Cari Lapangan</h1>
        <p class="text-xs text-dark-400 mt-1">Temukan court olahraga terbaik sesuai kriteria Anda</p>
      </div>
      
      <button 
        @click="resetFilters" 
        class="text-xs font-bold text-dark-400 hover:text-white flex items-center gap-1 bg-dark-900 border border-dark-800 px-3.5 py-2 rounded-xl"
      >
        <RotateCcw class="w-3.5 h-3.5" /> Reset Filter
      </button>
    </div>

    <!-- Search Input & Global stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      <!-- Left Filters Sidebar (Desktop) -->
      <div class="space-y-6 md:col-span-1">
        <div class="glass-card p-6 space-y-6 sticky top-24">
          
          <div class="flex items-center gap-2 pb-3 border-b border-dark-800">
            <Sliders class="w-4 h-4 text-brand-500" />
            <h3 class="text-sm font-extrabold text-white">Filter Pencarian</h3>
          </div>

          <!-- City Selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Kota</label>
            <select v-model="selectedCity" class="glass-input w-full text-xs">
              <option value="">Semua Kota</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Medan">Medan</option>
              <option value="Tangerang">Tangerang</option>
            </select>
          </div>

          <!-- Sport type Selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Jenis Olahraga</label>
            <select v-model="selectedSport" class="glass-input w-full text-xs">
              <option value="">Semua Olahraga</option>
              <option value="Futsal">Futsal</option>
              <option value="Badminton">Badminton</option>
              <option value="Basket">Basket</option>
              <option value="Tennis">Tennis</option>
              <option value="Voli">Voli</option>
              <option value="Mini Soccer">Mini Soccer</option>
            </select>
          </div>

          <!-- Price range -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-[10px] font-bold text-dark-400 uppercase tracking-wider">
              <span>Maks. Harga</span>
              <span class="text-brand-400">Rp {{ maxPrice.toLocaleString("id-ID") }}</span>
            </div>
            <input 
              type="range" 
              v-model.number="maxPrice" 
              min="30000" 
              max="500000" 
              step="10000"
              class="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div class="flex justify-between text-[9px] text-dark-500">
              <span>Rp 30rb</span>
              <span>Rp 500rb</span>
            </div>
          </div>

          <!-- Indoor / Outdoor selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Tipe Area</label>
            <div class="grid grid-cols-3 gap-1 bg-dark-950 p-1 border border-dark-800 rounded-lg">
              <button 
                @click="filterIndoor = null"
                class="px-2 py-1.5 text-[10px] font-bold rounded-md"
                :class="[filterIndoor === null ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white']"
              >
                Semua
              </button>
              <button 
                @click="filterIndoor = true"
                class="px-2 py-1.5 text-[10px] font-bold rounded-md"
                :class="[filterIndoor === true ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white']"
              >
                Indoor
              </button>
              <button 
                @click="filterIndoor = false"
                class="px-2 py-1.5 text-[10px] font-bold rounded-md"
                :class="[filterIndoor === false ? 'bg-brand-500 text-white' : 'text-dark-400 hover:text-white']"
              >
                Outdoor
              </button>
            </div>
          </div>

          <!-- Rating -->
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Rating Minimum</label>
            <div class="flex flex-col gap-1.5">
              <button 
                v-for="rate in [0, 4.0, 4.5]" 
                :key="rate"
                @click="minRating = rate"
                class="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border text-left"
                :class="[minRating === rate ? 'bg-brand-500/10 border-brand-500 text-brand-400' : 'bg-dark-900 border-dark-800 hover:border-dark-700 text-dark-300']"
              >
                <Star class="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span>{{ rate === 0 ? "Semua Rating" : `${rate} ke atas` }}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Right Side Fields Results List -->
      <div class="md:col-span-3 space-y-6">
        
        <!-- Search bar & Sorting bar -->
        <div class="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="relative w-full md:max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
              <Search class="w-4 h-4" />
            </span>
            <input 
              type="text" 
              v-model="searchVal"
              placeholder="Cari nama lapangan, area, atau fasilitas..." 
              class="glass-input pl-10 w-full text-xs"
            />
          </div>

          <!-- Sorting selection -->
          <div class="flex items-center gap-2 w-full md:w-auto justify-end">
            <ArrowUpDown class="w-4 h-4 text-dark-500" />
            <select v-model="sortBy" class="glass-input text-xs py-2">
              <option value="popularity">Paling Populer</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="rating">Rating Tertinggi</option>
            </select>
          </div>
        </div>

        <!-- Grid of results -->
        <div 
          v-if="filteredFields.length > 0" 
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div 
            v-for="field in filteredFields" 
            :key="field.id" 
            class="glass-card glass-card-hover overflow-hidden flex flex-col group cursor-pointer"
            @click="router.push(`/field/${field.id}`)"
          >
            <!-- Image & badge header -->
            <div class="h-40 overflow-hidden relative">
              <img 
                :src="field.images[0]" 
                :alt="field.name" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              <div class="absolute top-3 right-3 bg-dark-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 border border-dark-800">
                <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span class="text-xs font-bold text-white">{{ field.rating }}</span>
                <span class="text-[9px] text-dark-500">({{ field.reviewCount }})</span>
              </div>
              
              <div class="absolute bottom-3 left-3 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {{ field.sport }}
              </div>
            </div>

            <!-- Body -->
            <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
              <div>
                <h3 class="font-bold text-sm text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                  {{ field.name }}
                </h3>
                <p class="text-[10px] text-dark-400 flex items-center gap-1 mt-1 truncate">
                  <MapPin class="w-3 h-3 text-dark-500" /> {{ field.district }}, {{ field.city }}
                </p>
                
                <!-- Amenities tags -->
                <div class="flex flex-wrap gap-1 mt-3">
                  <span 
                    v-for="am in field.amenities.slice(0, 3)" 
                    :key="am" 
                    class="text-[8px] bg-dark-950 text-dark-400 px-2 py-0.5 border border-dark-900 rounded"
                  >
                    {{ am }}
                  </span>
                  <span v-if="field.amenities.length > 3" class="text-[8px] text-dark-500 font-bold px-1.5 py-0.5">
                    +{{ field.amenities.length - 3 }}
                  </span>
                </div>
              </div>

              <!-- Price Footer -->
              <div class="flex justify-between items-end pt-3 border-t border-dark-800/60">
                <div>
                  <p class="text-[8px] text-dark-500 leading-none">Harga Sewa</p>
                  <p class="text-xs font-extrabold text-brand-400 mt-1">
                    Rp {{ field.pricePerHour.toLocaleString("id-ID") }}<span class="text-[10px] font-normal text-dark-500">/jam</span>
                  </p>
                </div>
                <div class="text-[9px] font-bold text-dark-300 bg-dark-800 px-2 py-0.5 rounded border border-dark-700">
                  {{ field.indoor ? "Indoor" : "Outdoor" }}
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="glass-card p-12 text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-2xl bg-dark-850 border border-dark-800 flex items-center justify-center text-dark-400">
            <Search class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-sm text-white">Lapangan Tidak Ditemukan</h3>
            <p class="text-xs text-dark-400 mt-1">Tidak ada lapangan yang cocok dengan kriteria filter pencarian Anda. Silakan coba atur ulang filter.</p>
          </div>
          <button 
            @click="resetFilters" 
            class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
          >
            Reset Semua Filter
          </button>
        </div>

      </div>

    </div>

  </div>
</template>
