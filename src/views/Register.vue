<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { Mail, User, Phone, Lock, Landmark, UserCheck } from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref("");
const name = ref("");
const phone = ref("");
const password = ref("");
const role = ref("user"); // default user

const errorMessage = ref("");
const loading = ref(false);

onMounted(() => {
  // Check if role is preselected from query param
  if (route.query.role === "owner") {
    role.value = "owner";
  }
});

function handleRegister() {
  if (!email.value || !name.value || !phone.value || !password.value) {
    errorMessage.value = "Semua field wajib diisi.";
    return;
  }

  errorMessage.value = "";
  loading.value = true;

  setTimeout(async () => {
    const res = await authStore.register(email.value, name.value, phone.value, role.value, password.value);
    loading.value = false;

    if (res.success) {
      notificationStore.addNotification(
        "Pendaftaran Berhasil",
        `Selamat bergabung, ${name.value}! Akun Anda sebagai ${role.value === 'owner' ? 'Owner Lapangan' : 'Penyewa'} telah aktif.`,
        role.value
      );

      // Redirect based on role
      if (role.value === "owner") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard/user");
      }
    } else {
      errorMessage.value = res.message;
    }
  }, 1000);
}
</script>

<template>
  <div class="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Background glow -->
    <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="max-w-lg w-full relative z-10">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-white tracking-tight">
          Daftar <span class="text-brand-500">SportSpace</span>
        </h2>
        <p class="text-xs text-dark-400 mt-2">Daftarkan akunmu dan mulai memesan lapangan dengan mudah</p>
      </div>

      <div class="glass-card p-8 shadow-2xl border-dark-800/80">
        
        <form @submit.prevent="handleRegister" class="space-y-5">
          <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
            {{ errorMessage }}
          </div>

          <!-- Role selection cards (User vs Owner) -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider block mb-2">Tipe Pendaftaran Akun</label>
            <div class="grid grid-cols-2 gap-4">
              
              <!-- Renter Card -->
              <div 
                @click="role = 'user'"
                class="p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all"
                :class="[role === 'user' ? 'bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/5' : 'bg-dark-900 border-dark-800 hover:border-dark-700']"
              >
                <div class="p-2 rounded-lg" :class="[role === 'user' ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-800 text-dark-400']">
                  <UserCheck class="w-5 h-5" />
                </div>
                <div class="text-left">
                  <h4 class="font-bold text-xs text-white">Penyewa</h4>
                  <p class="text-[9px] text-dark-400 mt-0.5">Cari & sewa lapangan</p>
                </div>
              </div>

              <!-- Owner Card -->
              <div 
                @click="role = 'owner'"
                class="p-4 rounded-xl border cursor-pointer flex items-center gap-3 transition-all"
                :class="[role === 'owner' ? 'bg-brand-500/10 border-brand-500 shadow-md shadow-brand-500/5' : 'bg-dark-900 border-dark-800 hover:border-dark-700']"
              >
                <div class="p-2 rounded-lg" :class="[role === 'owner' ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-800 text-dark-400']">
                  <Landmark class="w-5 h-5" />
                </div>
                <div class="text-left">
                  <h4 class="font-bold text-xs text-white">Owner Lapangan</h4>
                  <p class="text-[9px] text-dark-400 mt-0.5">Kelola lapangan & omset</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Email</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                <Mail class="w-4 h-4" />
              </span>
              <input 
                type="email" 
                v-model="email" 
                required
                placeholder="name@email.com" 
                class="glass-input pl-10 w-full text-sm"
              />
            </div>
          </div>

          <!-- Full Name -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Nama Lengkap</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                <User class="w-4 h-4" />
              </span>
              <input 
                type="text" 
                v-model="name" 
                required
                placeholder="Budi Santoso" 
                class="glass-input pl-10 w-full text-sm"
              />
            </div>
          </div>

          <!-- Phone Number -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Nomor WhatsApp</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                <Phone class="w-4 h-4" />
              </span>
              <input 
                type="tel" 
                v-model="phone" 
                required
                placeholder="08123456789" 
                class="glass-input pl-10 w-full text-sm"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                <Lock class="w-4 h-4" />
              </span>
              <input 
                type="password" 
                v-model="password" 
                required
                placeholder="••••••••" 
                class="glass-input pl-10 w-full text-sm"
              />
            </div>
          </div>

          <!-- Register button -->
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
          >
            <span v-if="loading">Mendaftarkan Akun...</span>
            <span v-else>Daftar Sekarang</span>
          </button>
        </form>

        <!-- Redirect to login -->
        <div class="text-center mt-6 pt-6 border-t border-dark-800/60">
          <p class="text-xs text-dark-400">
            Sudah punya akun? 
            <router-link to="/login" class="text-brand-400 hover:text-brand-300 font-bold hover:underline">
              Masuk Disini
            </router-link>
          </p>
        </div>

      </div>

    </div>
  </div>
</template>
