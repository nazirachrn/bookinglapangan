<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { 
  Search, 
  MapPin, 
  Activity, 
  Star, 
  ChevronRight, 
  Percent, 
  Trophy, 
  ShieldCheck,
  CalendarCheck,
  Sparkles
} from "@lucide/vue";

const router = useRouter();

// Search parameters
const selectedSport = ref("");
const selectedCity = ref("");

// Data lists
const popularFields = ref([]);
const activePromos = ref([]);

// Stats counters
const totalFields = ref(0);
const totalBookings = ref(0);
const totalReviews = ref(0);

onMounted(() => {
  // Load data
  const fields = db.getCollection("fields");
  popularFields.value = fields
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const promos = db.getCollection("promos");
  activePromos.value = promos.filter(p => p.isActive).slice(0, 3);

  // Load stats counts
  totalFields.value = fields.length;
  totalBookings.value = db.getCollection("bookings").length;
  totalReviews.value = db.getCollection("reviews").length;
});

function handleSearch() {
  const query = {};
  if (selectedSport.value) query.sport = selectedSport.value;
  if (selectedCity.value) query.city = selectedCity.value;
  
  router.push({ name: "Explore", query });
}

function handlePromoCopy(code) {
  navigator.clipboard.writeText(code);
  alert(`Kode promo "${code}" berhasil disalin! gunakan saat checkout.`);
}
</script>

<template>
  <div class="space-y-20 pb-20">
    <!-- Hero Section -->
    <section class="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <!-- Background glows -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center max-w-3xl mx-auto space-y-6">
          <div class="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse-subtle">
            <Sparkles class="w-3.5 h-3.5" /> Booking Lapangan Instan & Anti Double Booking
          </div>
          
          <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Temukan & Booking Lapangan <br />
            <span class="text-gradient-emerald">Olahraga Favoritmu</span>
          </h1>
          
          <p class="text-base md:text-lg text-dark-300 leading-relaxed max-w-2xl mx-auto">
            SportSpace mempermudah pencarian, perbandingan harga, dan pemesanan lapangan olahraga secara real-time. Futsal, Badminton, Basket, Tennis, Voli, hingga Mini Soccer dalam satu aplikasi.
          </p>

          <!-- Search Widget -->
          <div class="pt-6">
            <div class="glass-card p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-4 items-center">
              
              <!-- Sport select -->
              <div class="flex items-center gap-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-dark-800 pb-3 md:pb-0 md:pr-4">
                <div class="text-brand-500 bg-brand-500/10 p-2.5 rounded-xl">
                  <Activity class="w-5 h-5" />
                </div>
                <div class="text-left w-full">
                  <label class="text-[10px] font-semibold text-dark-500 uppercase tracking-wider">Pilih Olahraga</label>
                  <select 
                    v-model="selectedSport"
                    class="bg-transparent border-0 p-0 text-white font-bold text-sm focus:outline-none w-full focus:ring-0 cursor-pointer block mt-0.5"
                  >
                    <option value="" class="bg-dark-950 text-dark-300">Semua Olahraga</option>
                    <option value="Futsal" class="bg-dark-950 text-white">Futsal</option>
                    <option value="Badminton" class="bg-dark-950 text-white">Badminton</option>
                    <option value="Basket" class="bg-dark-950 text-white">Basket</option>
                    <option value="Tennis" class="bg-dark-950 text-white">Tennis</option>
                    <option value="Voli" class="bg-dark-950 text-white">Voli</option>
                    <option value="Mini Soccer" class="bg-dark-950 text-white">Mini Soccer</option>
                  </select>
                </div>
              </div>

              <!-- City Select -->
              <div class="flex items-center gap-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-dark-800 pb-3 md:pb-0 md:pr-4">
                <div class="text-brand-500 bg-brand-500/10 p-2.5 rounded-xl">
                  <MapPin class="w-5 h-5" />
                </div>
                <div class="text-left w-full">
                  <label class="text-[10px] font-semibold text-dark-500 uppercase tracking-wider">Lokasi / Kota</label>
                  <select 
                    v-model="selectedCity"
                    class="bg-transparent border-0 p-0 text-white font-bold text-sm focus:outline-none w-full focus:ring-0 cursor-pointer block mt-0.5"
                  >
                    <option value="" class="bg-dark-950 text-dark-300">Semua Kota</option>
                    <option value="Jakarta" class="bg-dark-950 text-white">Jakarta</option>
                    <option value="Bandung" class="bg-dark-950 text-white">Bandung</option>
                    <option value="Surabaya" class="bg-dark-950 text-white">Surabaya</option>
                    <option value="Medan" class="bg-dark-950 text-white">Medan</option>
                    <option value="Tangerang" class="bg-dark-950 text-white">Tangerang</option>
                  </select>
                </div>
              </div>

              <!-- CTA Search Button -->
              <div class="w-full md:w-1/3">
                <button 
                  @click="handleSearch"
                  class="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transform active:scale-95 text-sm"
                >
                  <Search class="w-4 h-4" /> Cari Lapangan Sekarang
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Statistics Banners -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 bg-dark-900/40 border border-dark-900 rounded-3xl p-8 backdrop-blur-sm">
        <div class="text-center space-y-1">
          <div class="text-3xl md:text-4xl font-extrabold text-brand-500 flex items-center justify-center gap-1">
            {{ totalFields }}+
          </div>
          <p class="text-xs text-dark-400 font-semibold uppercase tracking-wider">Total Lapangan</p>
        </div>
        <div class="text-center space-y-1 border-l border-dark-900">
          <div class="text-3xl md:text-4xl font-extrabold text-brand-500">
            {{ totalBookings }}+
          </div>
          <p class="text-xs text-dark-400 font-semibold uppercase tracking-wider">Booking Berhasil</p>
        </div>
        <div class="text-center space-y-1 border-l border-dark-900">
          <div class="text-3xl md:text-4xl font-extrabold text-brand-500">
            5+
          </div>
          <p class="text-xs text-dark-400 font-semibold uppercase tracking-wider">Kota Besar</p>
        </div>
        <div class="text-center space-y-1 border-l border-dark-900">
          <div class="text-3xl md:text-4xl font-extrabold text-brand-500">
            {{ totalReviews }}+
          </div>
          <p class="text-xs text-dark-400 font-semibold uppercase tracking-wider">Review Pengguna</p>
        </div>
      </div>
    </section>

    <!-- Popular Fields Grid -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white">Lapangan Populer</h2>
          <p class="text-xs text-dark-400 mt-1">Lapangan dengan rating tertinggi pilihan komunitas olahraga</p>
        </div>
        <router-link 
          to="/explore" 
          class="text-xs font-bold text-brand-400 hover:text-brand-500 flex items-center gap-1 hover:underline"
        >
          Lihat Semua <ChevronRight class="w-4 h-4" />
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          v-for="field in popularFields" 
          :key="field.id" 
          class="glass-card glass-card-hover overflow-hidden flex flex-col group cursor-pointer"
          @click="router.push(`/field/${field.id}`)"
        >
          <!-- Image -->
          <div class="h-44 overflow-hidden relative">
            <img 
              :src="field.images[0]" 
              :alt="field.name" 
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute top-3 right-3 bg-dark-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 border border-dark-800">
              <Star class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span class="text-xs font-extrabold text-white">{{ field.rating }}</span>
            </div>
            <div class="absolute bottom-3 left-3 bg-brand-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              {{ field.sport }}
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
            <div>
              <h3 class="font-extrabold text-sm text-white truncate group-hover:text-brand-400 transition-colors">
                {{ field.name }}
              </h3>
              <p class="text-[11px] text-dark-400 flex items-center gap-1 mt-1 truncate">
                <MapPin class="w-3.5 h-3.5 text-dark-500" /> {{ field.district }}, {{ field.city }}
              </p>
            </div>

            <div class="flex justify-between items-center pt-3 border-t border-dark-800/60">
              <div>
                <p class="text-[9px] text-dark-500 leading-tight">Harga Mulai</p>
                <p class="text-xs font-extrabold text-brand-400">
                  Rp {{ field.pricePerHour.toLocaleString("id-ID") }}<span class="text-[10px] font-normal text-dark-400">/jam</span>
                </p>
              </div>
              <div class="text-[10px] font-bold text-dark-300 bg-dark-800 px-2.5 py-1 rounded-lg">
                {{ field.indoor ? "Indoor" : "Outdoor" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Active Promos & Vouchers -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white">Promo Berjalan</h2>
        <p class="text-xs text-dark-400 mt-1">Gunakan kode kupon di bawah ini untuk mendapatkan potongan harga spesial</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          v-for="promo in activePromos" 
          :key="promo.id" 
          class="glass-card p-6 flex flex-col justify-between border-l-4 border-l-brand-500 relative overflow-hidden group hover:border-l-brand-400"
        >
          <!-- Background circle glow -->
          <div class="absolute -right-10 -bottom-10 w-24 h-24 bg-brand-500/5 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <span class="bg-brand-500/10 text-brand-400 p-2 rounded-xl">
                <Percent class="w-5 h-5" />
              </span>
              <span class="text-[10px] text-dark-500 font-bold uppercase">Berakhir: {{ promo.endDate }}</span>
            </div>
            
            <div>
              <h3 class="font-bold text-base text-white">{{ promo.name }}</h3>
              <p class="text-xs text-dark-400 mt-1">
                Diskon <span class="text-brand-400 font-bold">{{ promo.isPercent ? `${promo.value}%` : `Rp ${promo.value.toLocaleString("id-ID")}` }}</span> 
                dengan minimal transaksi Rp {{ promo.minPurchase.toLocaleString("id-ID") }}.
              </p>
            </div>
          </div>

          <div class="pt-6 flex gap-2 items-center">
            <span class="bg-dark-950 border border-dark-800 font-mono text-xs font-bold text-white px-3 py-1.5 rounded-lg select-all">
              {{ promo.code }}
            </span>
            <button 
              @click="handlePromoCopy(promo.code)"
              class="bg-brand-500/10 hover:bg-brand-500 hover:text-white border border-brand-500/20 text-brand-400 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all active:scale-95"
            >
              Salin Kode
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Why SportSpace section -->
    <section id="about" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div class="text-center max-w-3xl mx-auto space-y-2">
        <h2 class="text-2xl md:text-3xl font-extrabold text-white">Kenapa Memilih SportSpace?</h2>
        <p class="text-xs text-dark-400">Kemudahan berolahraga tanpa hambatan manajemen jadwal manual</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="glass-card p-6 text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-sm text-white">Anti Double Booking</h3>
          <p class="text-xs text-dark-400 leading-relaxed">
            Sistem validasi sinkronisasi langsung kami memastikan slot jadwal yang sudah dipesan terkunci rapat, menjamin sesi bermain Anda berjalan lancar.
          </p>
        </div>
        <div class="glass-card p-6 text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <CalendarCheck class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-sm text-white">Pilih Waktu Fleksibel</h3>
          <p class="text-xs text-dark-400 leading-relaxed">
            Pilih tanggal bermain, jam mulai, dan durasi sesuai kenyamanan Anda. Lengkap dengan detail visual ketersediaan jam secara real-time.
          </p>
        </div>
        <div class="glass-card p-6 text-center space-y-4">
          <div class="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
            <Percent class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-sm text-white">Promo & Diskon Eksklusif</h3>
          <p class="text-xs text-dark-400 leading-relaxed">
            Hemat biaya dengan berbagai promo dan diskon kupon belanja dari admin maupun promo eksklusif pemilik lapangan olahraga.
          </p>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div class="text-center max-w-3xl mx-auto space-y-2">
        <h2 class="text-2xl md:text-3xl font-extrabold text-white">Apa Kata Mereka?</h2>
        <p class="text-xs text-dark-400">Testimoni pengguna setia platform SportSpace</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card p-6 flex flex-col justify-between space-y-6">
          <p class="text-xs text-dark-300 italic leading-relaxed">
            "Semenjak pakai SportSpace, nyari lawan tanding futsal jadi gampang karena urusan sewa lapangan beres dalam 2 menit. E-Ticket QR nya keren tinggal scan di pintu lapangan!"
          </p>
          <div class="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Raka" alt="Avatar" class="w-9 h-9 rounded-lg bg-dark-800" />
            <div>
              <p class="text-xs font-bold text-white leading-none">Raka Pratama</p>
              <p class="text-[9px] text-dark-500 mt-1">Penyewa Futsal, Jakarta</p>
            </div>
          </div>
        </div>
        <div class="glass-card p-6 flex flex-col justify-between space-y-6">
          <p class="text-xs text-dark-300 italic leading-relaxed">
            "Sangat terbantu sebagai owner badminton hall. Sekarang tidak ada lagi telpon manual tengah malam buat nanya jadwal kosong. Pendapatan terpantau lengkap di owner dashboard."
          </p>
          <div class="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Hendra" alt="Avatar" class="w-9 h-9 rounded-lg bg-dark-800" />
            <div>
              <p class="text-xs font-bold text-white leading-none">Hendrawan S.</p>
              <p class="text-[9px] text-dark-500 mt-1">Owner Gading Badminton, Surabaya</p>
            </div>
          </div>
        </div>
        <div class="glass-card p-6 flex flex-col justify-between space-y-6">
          <p class="text-xs text-dark-300 italic leading-relaxed">
            "Suka sekali dengan fitur Price Insight dan Crowd Prediction. Kita bisa tahu kapan waktu sewa termurah dan jam paling sepi biar dapet suasana lapang yang kondusif."
          </p>
          <div class="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Siti" alt="Avatar" class="w-9 h-9 rounded-lg bg-dark-800" />
            <div>
              <p class="text-xs font-bold text-white leading-none">Siti Rahma</p>
              <p class="text-[9px] text-dark-500 mt-1">Penyewa Tennis, Bandung</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Join Banner Section (CTA Owner) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 to-indigo-900 p-8 md:p-12 shadow-2xl">
        <div class="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-radial-gradient pointer-events-none"></div>
        <div class="max-w-2xl space-y-6 relative z-10">
          <h2 class="text-2xl md:text-4xl font-extrabold text-white leading-tight">
            Punya Lapangan Olahraga? <br />
            Daftarkan di SportSpace!
          </h2>
          <p class="text-xs md:text-sm text-brand-100 leading-relaxed">
            Kelola jadwal lapangan secara otomatis, hindari double booking, pantau laporan omset harian & bulanan, serta jangkau ribuan atlet lokal di kota Anda. Bergabung bersama 10+ pemilik venue terkemuka hari ini.
          </p>
          <div class="pt-2">
            <router-link 
              to="/register?role=owner" 
              class="inline-flex items-center justify-center bg-white text-brand-700 font-bold px-6 py-3 rounded-xl text-xs hover:bg-brand-50 transition-transform active:scale-95 shadow-lg shadow-black/15"
            >
              Mulai Daftarkan Lapangan
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
