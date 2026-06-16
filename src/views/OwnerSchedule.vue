<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { db } from "../services/db";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { 
  Calendar, 
  Clock, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Sliders,
  ChevronRight
} from "@lucide/vue";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const myFields = ref([]);
const selectedFieldId = ref("");
const selectedDate = ref("");

// Operations configuration
const openHourVal = ref(8);
const closeHourVal = ref(22);

onMounted(() => {
  if (!authStore.isLoggedIn || authStore.user.role !== "owner") {
    router.push("/login");
    return;
  }
  
  loadFields();
});

function loadFields() {
  const ownerId = authStore.user.id;
  myFields.value = db.getCollection("fields").filter(f => f.status === "active" && f.ownerId === ownerId);
  
  if (myFields.value.length > 0) {
    selectedFieldId.value = myFields.value[0].id;
  }

  // Set date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  selectedDate.value = tomorrow.toISOString().split("T")[0];
}

// Watch selected field to load its config
watch(selectedFieldId, (newVal) => {
  if (!newVal) return;
  const f = db.getById("fields", newVal);
  if (f) {
    openHourVal.value = f.openHour;
    closeHourVal.value = f.closeHour;
  }
});

const currentField = computed(() => {
  return db.getById("fields", selectedFieldId.value);
});

// Generate slots list
const scheduleSlots = computed(() => {
  if (!currentField.value || !selectedDate.value) return [];

  const list = [];
  const start = currentField.value.openHour;
  const end = currentField.value.closeHour;
  const bookings = db.getCollection("bookings").filter(b => b.fieldId === selectedFieldId.value && b.date === selectedDate.value);

  for (let h = start; h < end; h++) {
    const startStr = `${h.toString().padStart(2, "0")}:00`;
    const endStr = `${(h + 1).toString().padStart(2, "0")}:00`;
    const slotCode = `${startStr}-${endStr}`;

    // 1. Check if booked
    const activeBooking = bookings.find(b => {
      const bStart = parseInt(b.startTime.split(":")[0]);
      const bEnd = parseInt(b.endTime.split(":")[0]);
      return h >= bStart && h < bEnd && (b.status === "Confirmed" || b.status === "Pending" || b.status === "Completed");
    });

    // 2. Check if in maintenance
    const isMaintenance = currentField.value.maintenanceSlots && currentField.value.maintenanceSlots.includes(slotCode);

    list.push({
      start: startStr,
      end: endStr,
      code: slotCode,
      status: activeBooking ? "booked" : isMaintenance ? "maintenance" : "open",
      bookingDetails: activeBooking ? {
        userName: activeBooking.userName,
        paymentMethod: activeBooking.paymentMethod,
        bookingCode: activeBooking.bookingCode,
        status: activeBooking.status
      } : null
    });
  }

  return list;
});

function handleSaveHours() {
  if (openHourVal.value >= closeHourVal.value) {
    alert("Jam tutup harus lebih besar dari jam buka.");
    return;
  }

  db.update("fields", selectedFieldId.value, {
    openHour: openHourVal.value,
    closeHour: closeHourVal.value
  });

  notificationStore.addNotification(
    "Jam Operasional Diupdate",
    `Jam operasional lapangan "${currentField.value.name}" diset menjadi ${openHourVal.value}:00 - ${closeHourVal.value}:00.`,
    "owner"
  );
}

function toggleSlotMaintenance(slotCode, currentStatus) {
  if (!currentField.value) return;

  const currentSlots = currentField.value.maintenanceSlots ? [...currentField.value.maintenanceSlots] : [];
  
  if (currentStatus === "open") {
    currentSlots.push(slotCode);
    db.update("fields", selectedFieldId.value, { maintenanceSlots: currentSlots });
    notificationStore.addNotification(
      "Maintenance Diaktifkan",
      `Slot ${slotCode} diset ke Maintenance (Tutup).`,
      "owner"
    );
  } else if (currentStatus === "maintenance") {
    const idx = currentSlots.indexOf(slotCode);
    if (idx > -1) currentSlots.splice(idx, 1);
    db.update("fields", selectedFieldId.value, { maintenanceSlots: currentSlots });
    notificationStore.addNotification(
      "Slot Diaktifkan",
      `Slot ${slotCode} dibuka kembali untuk disewa.`,
      "owner"
    );
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    
    <!-- Title Section -->
    <div>
      <h1 class="text-3xl font-extrabold text-white tracking-tight">Atur Jadwal & Operasional</h1>
      <p class="text-xs text-dark-400 mt-1">Konfigurasi jam buka-tutup dan atur pemeliharaan slot waktu lapangan</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- Left side: Select field & Operational settings -->
      <div class="space-y-6 lg:col-span-1">
        <div class="glass-card p-6 space-y-6">
          <div class="flex items-center gap-2 pb-3 border-b border-dark-800">
            <Sliders class="w-4 h-4 text-brand-500" />
            <h3 class="text-sm font-extrabold text-white">Konfigurasi Lapangan</h3>
          </div>

          <!-- Select field selection -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block">Pilih Lapangan</label>
            <select v-model="selectedFieldId" class="glass-input w-full text-xs">
              <option v-for="f in myFields" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </div>

          <!-- Open hours config -->
          <div v-if="currentField" class="space-y-4 pt-3 border-t border-dark-800/60">
            <h4 class="font-extrabold text-xs text-white uppercase tracking-wider">Jam Operasional Harian</h4>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Jam Buka</label>
                <select v-model.number="openHourVal" class="glass-input w-full text-xs">
                  <option v-for="h in 24" :key="h" :value="h-1">{{ (h-1).toString().padStart(2, '0') }}:00</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-dark-400 uppercase tracking-wider block">Jam Tutup</label>
                <select v-model.number="closeHourVal" class="glass-input w-full text-xs">
                  <option v-for="h in 24" :key="h" :value="h">{{ h.toString().padStart(2, '0') }}:00</option>
                </select>
              </div>
            </div>

            <button 
              @click="handleSaveHours"
              class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-brand-500/10"
            >
              Simpan Jam Operasional
            </button>
          </div>

        </div>
      </div>

      <!-- Right side: Interactive Scheduler calendar timeline -->
      <div class="lg:col-span-2 space-y-6">
        
        <div class="glass-card p-6 space-y-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-dark-800">
            <h3 class="font-extrabold text-sm text-white">Kalender Jadwal Harian</h3>
            <div class="relative w-full sm:w-auto">
              <input 
                type="date" 
                v-model="selectedDate"
                class="glass-input py-2 text-xs"
              />
            </div>
          </div>

          <div v-if="currentField" class="space-y-4">
            
            <!-- Target visual markers legend -->
            <div class="flex gap-4 text-[10px] text-dark-400 font-bold justify-end">
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-dark-950 border border-dark-800"></span> Buka</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></span> Maintenance</span>
              <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-brand-500/20 border border-brand-500/30"></span> Dipesan (Booked)</span>
            </div>

            <!-- Schedule timeline grid list -->
            <div class="space-y-3">
              <div 
                v-for="slot in scheduleSlots" 
                :key="slot.code" 
                class="p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all"
                :class="[
                  slot.status === 'open' ? 'bg-dark-950/60 border-dark-900 hover:border-dark-800' :
                  slot.status === 'maintenance' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                  'bg-brand-500/5 border-brand-500/10 text-brand-400'
                ]"
              >
                <!-- Time & stats -->
                <div class="flex gap-4 items-center">
                  <div class="p-2.5 rounded-xl bg-dark-900 border border-dark-850 font-mono text-xs font-bold text-white flex items-center gap-1">
                    <Clock class="w-4 h-4 text-brand-500" /> {{ slot.start }} - {{ slot.end }}
                  </div>
                  <div>
                    <span 
                      class="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider block w-max"
                      :class="[
                        slot.status === 'open' ? 'bg-dark-900 text-dark-400 border border-dark-850' :
                        slot.status === 'maintenance' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      ]"
                    >
                      {{ slot.status === 'open' ? 'Buka' : slot.status === 'maintenance' ? 'Maintenance' : 'Dipesan' }}
                    </span>
                    
                    <!-- Booked details -->
                    <p v-if="slot.status === 'booked'" class="text-[10px] text-dark-300 mt-1.5 font-semibold">
                      Penyewa: {{ slot.bookingDetails.userName }} (Booking ID: {{ slot.bookingDetails.bookingCode }})
                    </p>
                  </div>
                </div>

                <!-- Action button toggle -->
                <button 
                  v-if="slot.status !== 'booked'"
                  @click="toggleSlotMaintenance(slot.code, slot.status)"
                  class="bg-dark-900 border border-dark-800 hover:border-brand-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider active:scale-95 transition-all w-full sm:w-auto"
                >
                  {{ slot.status === 'open' ? 'Tutup / Maintenance' : 'Buka Lapangan' }}
                </button>

              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

  </div>
</template>
