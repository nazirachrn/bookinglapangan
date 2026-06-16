<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Activity, 
  Image as ImageIcon, 
  X, 
  Star,
  CheckCircle
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const myFields = ref([]);

// CRUD Editor Form State
const showEditor = ref(false);
const editorMode = ref("create"); // create, update
const editingFieldId = ref(null);

const formName = ref("");
const formSport = ref("Futsal");
const formPrice = ref(100000);
const formCity = ref("Jakarta");
const formDistrict = ref("");
const formAddress = ref("");
const formDescription = ref("");
const formIndoor = ref(true);
const formAmenities = ref([]);
const formImages = ref("");

const AMENITIES_OPTIONS = ["Shower Room", "Kantin/Cafe", "Parkir Luas", "Locker Room", "Sewa Alat", "WiFi Gratis", "Mushola", "Tribun Penonton"];
const SPORTS_OPTIONS = ["Futsal", "Badminton", "Basket", "Tennis", "Voli", "Mini Soccer"];
const CITIES_OPTIONS = ["Jakarta", "Bandung", "Surabaya", "Medan", "Tangerang"];

onMounted(() => {
  if (!authStore.isLoggedIn || authStore.user.role !== "owner") {
    router.push("/login");
    return;
  }
  loadFields();
});

function loadFields() {
  const ownerId = authStore.user.id;
  myFields.value = db.getCollection("fields").filter(f => f.ownerId === ownerId);
}

function openCreateForm() {
  editorMode.value = "create";
  editingFieldId.value = null;
  
  formName.value = "";
  formSport.value = "Futsal";
  formPrice.value = 100000;
  formCity.value = "Jakarta";
  formDistrict.value = "";
  formAddress.value = "";
  formDescription.value = "";
  formIndoor.value = true;
  formAmenities.value = ["Shower Room", "Parkir Luas"];
  formImages.value = "";
  
  showEditor.value = true;
}

function openEditForm(fieldItem) {
  editorMode.value = "update";
  editingFieldId.value = fieldItem.id;
  
  formName.value = fieldItem.name;
  formSport.value = fieldItem.sport;
  formPrice.value = fieldItem.pricePerHour;
  formCity.value = fieldItem.city;
  formDistrict.value = fieldItem.district;
  formAddress.value = fieldItem.address;
  formDescription.value = fieldItem.description;
  formIndoor.value = fieldItem.indoor;
  formAmenities.value = [...fieldItem.amenities];
  formImages.value = fieldItem.images.join(", ");
  
  showEditor.value = true;
}

function handleSaveField() {
  if (!formName.value || !formAddress.value || !formDistrict.value) {
    alert("Mohon lengkapi nama lapangan dan alamat lengkap.");
    return;
  }

  // Parse image inputs
  let parsedImages = [];
  if (formImages.value) {
    parsedImages = formImages.value.split(",").map(url => url.trim()).filter(url => url !== "");
  }
  
  // Fallback defaults based on sport category
  if (parsedImages.length === 0) {
    if (formSport.value === "Futsal") parsedImages = ["https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800"];
    else if (formSport.value === "Badminton") parsedImages = ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800"];
    else if (formSport.value === "Basket") parsedImages = ["https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800"];
    else parsedImages = ["https://images.unsplash.com/photo-1431324155629-1a6edd1d141d?w=800"]; // mini soccer / other default
  }

  const payload = {
    name: formName.value,
    sport: formSport.value,
    pricePerHour: Number(formPrice.value),
    city: formCity.value,
    district: formDistrict.value,
    address: formAddress.value,
    description: formDescription.value || `Menyewakan lapangan ${formSport.value} berkualitas tinggi di area ${formDistrict.value}. Hubungi kami untuk jadwal booking.`,
    indoor: formIndoor.value,
    amenities: formAmenities.value,
    images: parsedImages,
    ownerId: authStore.user.id
  };

  if (editorMode.value === "create") {
    // Add new
    payload.rating = 4.8;
    payload.reviewCount = 1;
    payload.status = "active";
    payload.openHour = 8;
    payload.closeHour = 22;
    payload.maintenanceSlots = ["10:00-11:00"];
    
    db.add("fields", payload);
    notificationStore.addNotification(
      "Lapangan Ditambahkan",
      `Lapangan "${payload.name}" berhasil dibuat dan ditambahkan ke inventori.`,
      "owner"
    );
  } else {
    // Update
    db.update("fields", editingFieldId.value, payload);
    notificationStore.addNotification(
      "Lapangan Diperbarui",
      `Detail lapangan "${payload.name}" berhasil diupdate.`,
      "owner"
    );
  }

  showEditor.value = false;
  loadFields();
}

function handleDeleteField(fieldId, fieldName) {
  const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus lapangan "${fieldName}"?`);
  if (!confirmDelete) return;

  const success = db.delete("fields", fieldId);
  if (success) {
    notificationStore.addNotification(
      "Lapangan Dihapus",
      `Lapangan "${fieldName}" berhasil dihapus dari sistem.`,
      "owner"
    );
    loadFields();
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <!-- Header Page CRUD titles -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Kelola Lapangan</h1>
        <p class="text-xs text-dark-400 mt-1">Daftar inventori lapangan olahraga yang Anda miliki</p>
      </div>

      <button 
        @click="openCreateForm" 
        class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 active:scale-95 shadow-md shadow-brand-500/10"
      >
        <Plus class="w-4 h-4" /> Daftarkan Lapangan Baru
      </button>
    </div>

    <!-- Fields inventory grid list -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div 
        v-for="field in myFields" 
        :key="field.id" 
        class="glass-card overflow-hidden flex flex-col justify-between group"
      >
        
        <!-- Image & stats badge -->
        <div class="h-44 overflow-hidden relative bg-dark-900 border-b border-dark-850">
          <img :src="field.images[0]" :alt="field.name" class="w-full h-full object-cover" />
          <div class="absolute top-3 right-3 bg-dark-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 border border-dark-800">
            <Star class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span class="text-xs font-extrabold text-white">{{ field.rating }}</span>
          </div>
          <span class="absolute bottom-3 left-3 bg-brand-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
            {{ field.sport }}
          </span>
        </div>

        <!-- Body specs details -->
        <div class="p-5 flex-grow space-y-4 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-base text-white truncate">{{ field.name }}</h3>
            <p class="text-[10px] text-dark-400 flex items-center gap-1 mt-1 truncate">
              <MapPin class="w-3.5 h-3.5 text-dark-500" /> {{ field.district }}, {{ field.city }}
            </p>
            <p class="text-[10px] text-brand-400 font-extrabold mt-3">
              Rp {{ field.pricePerHour.toLocaleString("id-ID") }}<span class="text-[9px] font-normal text-dark-500">/jam</span>
            </p>
            
            <div class="flex flex-wrap gap-1 mt-3">
              <span 
                v-for="am in field.amenities.slice(0, 3)" 
                :key="am" 
                class="text-[8px] bg-dark-950 text-dark-400 border border-dark-900 px-2 py-0.5 rounded"
              >
                {{ am }}
              </span>
              <span v-if="field.amenities.length > 3" class="text-[8px] text-dark-500 font-bold px-1.5 py-0.5">
                +{{ field.amenities.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Bottom CTA crud operations -->
          <div class="flex gap-2.5 pt-4 border-t border-dark-800/60">
            <button 
              @click="openEditForm(field)"
              class="w-1/2 bg-dark-950 border border-dark-800 hover:border-brand-500 hover:text-brand-400 text-white font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5"
            >
              <Edit3 class="w-3.5 h-3.5" /> Edit Lapangan
            </button>
            <button 
              @click="handleDeleteField(field.id, field.name)"
              class="w-1/2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 font-bold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" /> Hapus
            </button>
          </div>
        </div>

      </div>

      <div v-if="myFields.length === 0" class="col-span-3 glass-card p-12 text-center space-y-4">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-center text-dark-500">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-sm text-white">Lapangan Belum Terdaftar</h3>
          <p class="text-xs text-dark-400 mt-1">Anda belum mendaftarkan lapangan olahraga di platform kami. Silakan buat yang pertama.</p>
        </div>
        <button 
          @click="openCreateForm"
          class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
        >
          Mulai Tambah Lapangan
        </button>
      </div>

    </div>

    <!-- Edit/Create Sliding Drawer Panel Form -->
    <div 
      v-if="showEditor" 
      class="fixed inset-0 z-[999] bg-dark-950/80 backdrop-blur-sm flex justify-end"
    >
      <div 
        class="w-full max-w-lg bg-dark-900 border-l border-dark-800 h-full overflow-y-auto p-8 shadow-2xl flex flex-col justify-between"
      >
        <div class="space-y-6">
          <div class="flex justify-between items-center pb-4 border-b border-dark-800">
            <h3 class="font-extrabold text-base text-white">
              {{ editorMode === 'create' ? 'Tambah Lapangan Baru' : 'Edit Lapangan' }}
            </h3>
            <button @click="showEditor = false" class="text-dark-500 hover:text-white p-1 rounded">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Field name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Nama Arena / Court</label>
              <input type="text" v-model="formName" required placeholder="Elite Futsal Arena - Court 1" class="glass-input w-full" />
            </div>

            <!-- Sport & Price Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Jenis Olahraga</label>
                <select v-model="formSport" class="glass-input w-full">
                  <option v-for="s in SPORTS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Harga Sewa / Jam</label>
                <input type="number" v-model.number="formPrice" required class="glass-input w-full" />
              </div>
            </div>

            <!-- City & District Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Kota</label>
                <select v-model="formCity" class="glass-input w-full">
                  <option v-for="c in CITIES_OPTIONS" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Kecamatan / Area</label>
                <input type="text" v-model="formDistrict" required placeholder="Dago" class="glass-input w-full" />
              </div>
            </div>

            <!-- Address -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Alamat Lengkap</label>
              <input type="text" v-model="formAddress" required placeholder="Jl. Raya Dago No. 12, Bandung" class="glass-input w-full" />
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Deskripsi Lapangan</label>
              <textarea v-model="formDescription" rows="3" placeholder="Jelaskan kualitas karpet, lampu sorot, atau area tunggu lapangan..." class="glass-input w-full"></textarea>
            </div>

            <!-- Area type Indoor/Outdoor checkbox selector -->
            <div class="flex items-center gap-6 py-2 bg-dark-950 border border-dark-900 rounded-xl px-4">
              <span class="font-bold text-dark-300">Tipe Area:</span>
              <label class="flex items-center gap-2 cursor-pointer font-bold text-white">
                <input type="radio" :value="true" v-model="formIndoor" class="accent-brand-500" /> Indoor
              </label>
              <label class="flex items-center gap-2 cursor-pointer font-bold text-white">
                <input type="radio" :value="false" v-model="formIndoor" class="accent-brand-500" /> Outdoor
              </label>
            </div>

            <!-- Amenities checkboxes -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block mb-1">Fasilitas Penunjang</label>
              <div class="grid grid-cols-2 gap-2 bg-dark-950 border border-dark-900 rounded-2xl p-4">
                <label 
                  v-for="am in AMENITIES_OPTIONS" 
                  :key="am"
                  class="flex items-center gap-2 text-dark-300 cursor-pointer font-semibold"
                >
                  <input 
                    type="checkbox" 
                    :value="am" 
                    v-model="formAmenities"
                    class="rounded border-dark-800 bg-dark-900 accent-brand-500"
                  />
                  <span>{{ am }}</span>
                </label>
              </div>
            </div>

            <!-- Image Urls input -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Foto Lapangan (Url)</label>
                <span class="text-[9px] text-dark-500">Pisahkan dengan tanda koma ( , )</span>
              </div>
              <input type="text" v-model="formImages" placeholder="https://unsplash.com/foto1.jpg, https://unsplash.com/foto2.jpg" class="glass-input w-full" />
            </div>

          </div>
        </div>

        <div class="flex gap-4 pt-8 mt-8 border-t border-dark-800/60">
          <button 
            type="button" 
            @click="showEditor = false"
            class="w-1/2 bg-dark-950 border border-dark-800 text-white font-bold py-3.5 rounded-xl text-xs active:scale-95"
          >
            Batal
          </button>
          <button 
            type="button" 
            @click="handleSaveField"
            class="w-1/2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider active:scale-95"
          >
            Simpan Perubahan
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
