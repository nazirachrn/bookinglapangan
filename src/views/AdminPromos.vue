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
  Percent, 
  Calendar, 
  Check, 
  X, 
  Sliders,
  DollarSign
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const promos = ref([]);

// Editor states
const showEditor = ref(false);
const editorMode = ref("create"); // create, update
const editingPromoId = ref(null);

const formCode = ref("");
const formName = ref("");
const formIsPercent = ref(true);
const formValue = ref(10);
const formMinPurchase = ref(50000);
const formStartDate = ref("");
const formEndDate = ref("");
const formIsActive = ref(true);

onMounted(() => {
  if (!authStore.isLoggedIn || authStore.user.role !== "admin") {
    router.push("/login");
    return;
  }
  loadPromos();
});

function loadPromos() {
  promos.value = db.getCollection("promos").sort((a, b) => b.isActive - a.isActive);
}

function openCreateForm() {
  editorMode.value = "create";
  editingPromoId.value = null;

  formCode.value = "";
  formName.value = "";
  formIsPercent.value = true;
  formValue.value = 10;
  formMinPurchase.value = 50000;
  
  // Set dates to today and next month
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  formStartDate.value = today.toISOString().split("T")[0];
  formEndDate.value = nextMonth.toISOString().split("T")[0];
  formIsActive.value = true;

  showEditor.value = true;
}

function openEditForm(promoItem) {
  editorMode.value = "update";
  editingPromoId.value = promoItem.id;

  formCode.value = promoItem.code;
  formName.value = promoItem.name;
  formIsPercent.value = promoItem.isPercent;
  formValue.value = promoItem.value;
  formMinPurchase.value = promoItem.minPurchase;
  formStartDate.value = promoItem.startDate;
  formEndDate.value = promoItem.endDate;
  formIsActive.value = promoItem.isActive;

  showEditor.value = true;
}

function handleSavePromo() {
  if (!formCode.value || !formName.value || !formValue.value) {
    alert("Mohon lengkapi kode, nama voucher, dan nilai diskon.");
    return;
  }

  const payload = {
    code: formCode.value.toUpperCase().replace(/\s+/g, ""),
    name: formName.value,
    isPercent: formIsPercent.value,
    value: Number(formValue.value),
    minPurchase: Number(formMinPurchase.value),
    startDate: formStartDate.value,
    endDate: formEndDate.value,
    isActive: formIsActive.value
  };

  if (editorMode.value === "create") {
    db.add("promos", payload);
    notificationStore.addNotification(
      "Promo Dibuat",
      `Voucher baru "${payload.code}" berhasil dibuat dan diaktifkan.`,
      "admin"
    );
  } else {
    db.update("promos", editingPromoId.value, payload);
    notificationStore.addNotification(
      "Promo Diupdate",
      `Voucher "${payload.code}" berhasil diperbarui.`,
      "admin"
    );
  }

  showEditor.value = false;
  loadPromos();
}

function handleDeletePromo(promoId, promoCode) {
  const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus promo "${promoCode}"?`);
  if (!confirmDelete) return;

  const success = db.delete("promos", promoId);
  if (success) {
    notificationStore.addNotification(
      "Promo Dihapus",
      `Voucher "${promoCode}" telah dihapus dari sistem.`,
      "admin"
    );
    loadPromos();
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">Kelola Promo & Voucher</h1>
        <p class="text-xs text-dark-400 mt-1 font-medium">Buat kode kupon diskon belanja baru untuk penyewa lapangan</p>
      </div>

      <button 
        @click="openCreateForm" 
        class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 active:scale-95 shadow-md shadow-brand-500/10"
      >
        <Plus class="w-4 h-4" /> Buat Kupon Baru
      </button>
    </div>

    <!-- Promo grid cards list -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div 
        v-for="promo in promos" 
        :key="promo.id" 
        class="glass-card p-6 flex flex-col justify-between border-l-4 relative overflow-hidden group"
        :class="[promo.isActive ? 'border-l-brand-500 hover:border-l-brand-400' : 'border-l-dark-800 opacity-60']"
      >
        <div class="space-y-4">
          <div class="flex justify-between items-start">
            <span class="bg-brand-500/10 text-brand-400 p-2.5 rounded-xl">
              <Percent class="w-5 h-5" />
            </span>
            <span 
              class="text-[9px] font-bold px-2 py-0.5 rounded uppercase"
              :class="[promo.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-dark-900 text-dark-500 border border-dark-800']"
            >
              {{ promo.isActive ? 'Aktif' : 'Expired / Off' }}
            </span>
          </div>

          <div>
            <h3 class="font-extrabold text-base text-white">{{ promo.name }}</h3>
            <p class="text-xs text-dark-400 mt-1 leading-relaxed">
              Potongan diskon <span class="text-brand-400 font-bold">{{ promo.isPercent ? `${promo.value}%` : `Rp ${promo.value.toLocaleString("id-ID")}` }}</span>. 
              Minimal belanja Rp {{ promo.minPurchase.toLocaleString("id-ID") }}.
            </p>
          </div>

          <div class="flex gap-4 text-[9px] text-dark-500 border-t border-dark-900 pt-3">
            <span class="flex items-center gap-1"><Calendar class="w-3.5 h-3.5" /> {{ promo.startDate }} s.d {{ promo.endDate }}</span>
          </div>
        </div>

        <!-- Voucher Code & crud action triggers -->
        <div class="pt-6 flex justify-between items-center mt-2 border-t border-dark-900/60">
          <span class="font-mono text-xs font-bold text-white px-2 py-1 bg-dark-950 border border-dark-850 rounded">
            {{ promo.code }}
          </span>

          <div class="flex gap-2">
            <button 
              @click="openEditForm(promo)"
              class="bg-dark-950 border border-dark-800 hover:border-brand-500 text-white p-2 rounded-xl active:scale-90"
              title="Edit Promo"
            >
              <Edit3 class="w-3.5 h-3.5" />
            </button>
            <button 
              @click="handleDeletePromo(promo.id, promo.code)"
              class="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 p-2 rounded-xl active:scale-90"
              title="Hapus Promo"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      <div v-if="promos.length === 0" class="col-span-3 glass-card p-12 text-center space-y-4">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-dark-950 border border-dark-800 flex items-center justify-center text-dark-500">
          <Percent class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-sm text-white">Voucher Kupon Kosong</h3>
          <p class="text-xs text-dark-400 mt-1">Belum ada promo terdaftar di sistem. Mulai buat kode promo pertamamu.</p>
        </div>
        <button 
          @click="openCreateForm"
          class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
        >
          Mulai Tambah Promo
        </button>
      </div>

    </div>

    <!-- Sliding Sidebar editor panel dialog form -->
    <div 
      v-if="showEditor" 
      class="fixed inset-0 z-[999] bg-dark-950/80 backdrop-blur-sm flex justify-end"
    >
      <div 
        class="w-full max-w-md bg-dark-900 border-l border-dark-800 h-full overflow-y-auto p-8 shadow-2xl flex flex-col justify-between"
      >
        <div class="space-y-6">
          <div class="flex justify-between items-center pb-4 border-b border-dark-800">
            <h3 class="font-extrabold text-base text-white">
              {{ editorMode === 'create' ? 'Buat Kupon Baru' : 'Edit Kupon' }}
            </h3>
            <button @click="showEditor = false" class="text-dark-500 hover:text-white p-1 rounded">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Promo code -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Kode Kupon / Promo</label>
              <input type="text" v-model="formCode" required placeholder="SPORTSPACE20" class="glass-input w-full uppercase" />
            </div>

            <!-- Promo name -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Nama Promo</label>
              <input type="text" v-model="formName" required placeholder="Promo Launching Hemat" class="glass-input w-full" />
            </div>

            <!-- Discount type select & value grid -->
            <div class="grid grid-cols-2 gap-4 bg-dark-950 border border-dark-900 rounded-xl p-3 items-end">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Tipe Diskon</label>
                <div class="flex gap-2">
                  <button 
                    type="button" 
                    @click="formIsPercent = true"
                    class="px-3 py-1.5 rounded-lg border text-[10px] font-bold w-1/2"
                    :class="[formIsPercent ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-900 text-dark-400 border-dark-800']"
                  >
                    Persentase
                  </button>
                  <button 
                    type="button" 
                    @click="formIsPercent = false"
                    class="px-3 py-1.5 rounded-lg border text-[10px] font-bold w-1/2"
                    :class="[!formIsPercent ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-900 text-dark-400 border-dark-800']"
                  >
                    Nominal
                  </button>
                </div>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">
                  Nilai Diskon ({{ formIsPercent ? '%' : 'Rp' }})
                </label>
                <input type="number" v-model.number="formValue" required class="glass-input w-full" />
              </div>
            </div>

            <!-- Minimum purchase -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Minimal Transaksi Pembelian</label>
              <input type="number" v-model.number="formMinPurchase" required class="glass-input w-full" />
            </div>

            <!-- Start Date & End Date Grid -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Tanggal Mulai</label>
                <input type="date" v-model="formStartDate" required class="glass-input w-full" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Tanggal Berakhir</label>
                <input type="date" v-model="formEndDate" required class="glass-input w-full" />
              </div>
            </div>

            <!-- Active Status checkbox selector -->
            <div class="flex items-center gap-3 py-2 bg-dark-950 border border-dark-900 rounded-xl px-4 mt-2">
              <input 
                type="checkbox" 
                id="formIsActive" 
                v-model="formIsActive" 
                class="rounded border-dark-800 bg-dark-900 accent-brand-500 w-4 h-4"
              />
              <label for="formIsActive" class="font-bold text-xs text-white cursor-pointer select-none">
                Aktifkan Kupon Ini (Dapat digunakan oleh Penyewa)
              </label>
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
            @click="handleSavePromo"
            class="w-1/2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider active:scale-95"
          >
            Simpan Promo
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
