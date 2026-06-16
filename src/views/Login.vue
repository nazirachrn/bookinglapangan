<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notification";
import { Mail, Lock, Sparkles, KeyRound } from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

const forgotPasswordMode = ref(false);
const forgotEmail = ref("");
const forgotSuccessMessage = ref("");

function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = "Semua field wajib diisi.";
    return;
  }

  errorMessage.value = "";
  loading.value = true;

  setTimeout(async () => {
    const res = await authStore.login(email.value, password.value);
    loading.value = false;

    if (res.success) {
      notificationStore.addNotification(
        "Login Berhasil",
        `Selamat datang kembali, ${res.user.name}!`,
        res.user.role
      );

      // Redirect
      const redirectPath = route.query.redirect;
      if (redirectPath) {
        router.push(redirectPath);
      } else {
        if (res.user.role === "admin") router.push("/dashboard/admin");
        else if (res.user.role === "owner") router.push("/dashboard/owner");
        else router.push("/dashboard/user");
      }
    } else {
      errorMessage.value = res.message;
    }
  }, 800);
}

function handleGoogleLogin() {
  loading.value = true;
  setTimeout(async () => {
    const res = await authStore.loginGoogle("user");
    loading.value = false;
    
    if (res.success) {
      notificationStore.addNotification(
        "Login Google Berhasil",
        `Selamat datang, ${res.user.name}!`,
        res.user.role
      );
      router.push("/dashboard/user");
    } else {
      errorMessage.value = res.message;
    }
  }, 500);
}

function handleForgotPassword() {
  if (!forgotEmail.value) {
    errorMessage.value = "Email wajib diisi.";
    return;
  }
  
  errorMessage.value = "";
  loading.value = true;

  setTimeout(async () => {
    const res = await authStore.forgotPassword(forgotEmail.value);
    loading.value = false;
    if (res.success) {
      forgotSuccessMessage.value = res.message;
    } else {
      errorMessage.value = res.message;
    }
  }, 800);
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Backdrop glows -->
    <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="max-w-md w-full relative z-10">
      
      <!-- Logo header -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-extrabold text-white tracking-tight">
          Sport<span class="text-brand-500">Space</span>
        </h2>
        <p class="text-xs text-dark-400 mt-2">Masuk untuk memesan lapangan olahraga terdekat</p>
      </div>

      <!-- Card container -->
      <div class="glass-card p-8 shadow-2xl border-dark-800/80">
        
        <!-- Standard Login Mode -->
        <template v-if="!forgotPasswordMode">
          <form @submit.prevent="handleLogin" class="space-y-5">
            
            <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              {{ errorMessage }}
            </div>

            <!-- Email Field -->
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

            <!-- Password Field -->
            <div class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  @click="forgotPasswordMode = true; errorMessage = ''; forgotSuccessMessage = ''" 
                  class="text-xs text-brand-400 hover:text-brand-300 hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
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

            <!-- Submit Button -->
            <button 
              type="submit" 
              :disabled="loading"
              class="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <span v-if="loading">Menghubungkan...</span>
              <span v-else>Masuk ke Akun</span>
            </button>

            <!-- Divider -->
            <div class="relative flex py-1 items-center">
              <div class="flex-grow border-t border-dark-800"></div>
              <span class="flex-shrink mx-4 text-[10px] font-bold text-dark-500 uppercase tracking-wider">atau masuk dengan</span>
              <div class="flex-grow border-t border-dark-800"></div>
            </div>

            <!-- Google Login simulation button -->
            <button 
              type="button" 
              @click="handleGoogleLogin"
              class="w-full bg-dark-950 hover:bg-dark-800 text-white border border-dark-800 font-bold py-3 rounded-xl active:scale-95 text-xs flex items-center justify-center gap-2.5 transition-all shadow-md"
            >
              <!-- Google color icons simulated -->
              <svg class="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.51 0-6.357-2.827-6.357-6.3s2.848-6.3 6.357-6.3c1.614 0 3.08.6 4.22 1.637l3.13-3.13C19.345 2.652 15.96 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.79 0 10.5-4.71 10.5-10.5 0-.74-.08-1.46-.22-2.215H12.24z"/>
              </svg>
              Google Sign-In (Simulasi)
            </button>

            <!-- Demo Credentials Info Box (Hidden) -->
            <div v-if="false" class="bg-brand-500/5 border border-brand-500/10 p-4 rounded-2xl space-y-2.5 mt-2 text-left">
              <div class="flex items-center gap-1.5 text-brand-400 font-extrabold text-[9px] uppercase tracking-wider">
                <Sparkles class="w-3.5 h-3.5" /> Akun Demo (Klik untuk Salin)
              </div>
              <div class="text-[10px] text-dark-300 space-y-1.5 leading-normal">
                <div class="flex justify-between items-center bg-dark-950/60 px-2.5 py-1.5 rounded-xl border border-dark-850">
                  <span><strong>Admin:</strong> <span class="text-brand-400 font-mono select-all">admin@sportspace.com</span></span>
                  <span class="text-dark-500 text-[8px] font-semibold">Sandi: admin123</span>
                </div>
                <div class="flex justify-between items-center bg-dark-950/60 px-2.5 py-1.5 rounded-xl border border-dark-850">
                  <span><strong>User:</strong> <span class="text-brand-400 font-mono select-all">user1@sportspace.com</span></span>
                  <span class="text-dark-500 text-[8px] font-semibold">Sandi: bebas</span>
                </div>
                <div class="flex justify-between items-center bg-dark-950/60 px-2.5 py-1.5 rounded-xl border border-dark-850">
                  <span><strong>Owner:</strong> <span class="text-brand-400 font-mono select-all">owner1@sportspace.com</span></span>
                  <span class="text-dark-500 text-[8px] font-semibold">Sandi: bebas</span>
                </div>
              </div>
            </div>

          </form>
        </template>

        <!-- Forgot Password Mode -->
        <template v-else>
          <div class="space-y-6">
            <div class="flex items-center gap-2 text-brand-400 pb-1 border-b border-dark-800">
              <KeyRound class="w-5 h-5" />
              <h3 class="font-bold text-sm text-white">Lupa Password?</h3>
            </div>

            <p class="text-xs text-dark-400 leading-relaxed">
              Masukkan alamat email Anda yang terdaftar. Kami akan mengirimkan instruksi pemulihan berupa tautan reset kata sandi simulasi ke kotak masuk Anda.
            </p>

            <div v-if="forgotSuccessMessage" class="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-xl text-xs font-semibold">
              {{ forgotSuccessMessage }}
            </div>
            
            <div v-if="errorMessage" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
              {{ errorMessage }}
            </div>

            <div v-if="!forgotSuccessMessage" class="space-y-1.5">
              <label class="text-xs font-bold text-dark-300 uppercase tracking-wider">Email Terdaftar</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-500">
                  <Mail class="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  v-model="forgotEmail" 
                  required
                  placeholder="name@email.com" 
                  class="glass-input pl-10 w-full text-sm"
                />
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button 
                type="button"
                @click="forgotPasswordMode = false; errorMessage = ''"
                class="w-1/2 bg-dark-950 border border-dark-800 hover:bg-dark-800 text-white font-bold py-3 rounded-xl text-xs active:scale-95"
              >
                Kembali
              </button>
              <button 
                v-if="!forgotSuccessMessage"
                type="button"
                @click="handleForgotPassword"
                :disabled="loading"
                class="w-1/2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-xs active:scale-95"
              >
                Kirim Tautan
              </button>
            </div>
          </div>
        </template>

        <!-- Redirect to register -->
        <div class="text-center mt-6 pt-6 border-t border-dark-800/60">
          <p class="text-xs text-dark-400">
            Belum punya akun? 
            <router-link to="/register" class="text-brand-400 hover:text-brand-300 font-bold hover:underline">
              Daftar Sekarang
            </router-link>
          </p>
        </div>

      </div>

    </div>
  </div>
</template>
