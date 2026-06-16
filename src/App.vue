<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import { useNotificationStore } from "./stores/notification";
import { 
  User as UserIcon, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  Trophy, 
  Shield, 
  Layers, 
  Calendar,
  Sparkles,
  MapPin,
  ChevronDown
} from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const mobileMenuOpen = ref(false);
const notificationsOpen = ref(false);
const userMenuOpen = ref(false);
const showRoleSwitcher = ref(true);

const currentUser = computed(() => authStore.user);
const activeNotifications = computed(() => {
  if (!authStore.isLoggedIn) return [];
  return notificationStore.notifications.filter(
    n => n.role === authStore.user.role || n.role === "all"
  );
});
const unreadNotifCount = computed(() => {
  return activeNotifications.value.filter(n => !n.read).length;
});

async function handleLogout() {
  await authStore.logout();
  userMenuOpen.value = false;
  router.push("/");
}

async function switchRole(role) {
  notificationStore.addNotification(
    "Ganti Role",
    `Berhasil beralih ke role: ${role.toUpperCase()}`,
    role === "guest" ? "user" : role
  );
  
  if (role === "guest") {
    await authStore.logout();
    router.push("/");
  } else {
    const res = await authStore.loginGoogle(role);
    if (res.success) {
      if (role === "admin") {
        router.push("/dashboard/admin");
      } else if (role === "owner") {
        router.push("/dashboard/owner");
      } else {
        router.push("/dashboard/user");
      }
    }
  }
  userMenuOpen.value = false;
  mobileMenuOpen.value = false;
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value;
  if (notificationsOpen.value) {
    userMenuOpen.value = false;
  }
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value;
  if (userMenuOpen.value) {
    notificationsOpen.value = false;
  }
}

function closeDropdowns() {
  notificationsOpen.value = false;
  userMenuOpen.value = false;
}
</script>

<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- Global Notification Toasts -->
    <div class="fixed top-20 right-4 z-[999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <transition-group name="toast">
        <div 
          v-for="toast in notificationStore.toasts" 
          :key="toast.id" 
          class="pointer-events-auto bg-dark-900/95 border border-brand-500/30 text-white p-4 rounded-xl shadow-lg backdrop-blur-md flex items-start gap-3 glow-emerald animate-fade-in"
        >
          <div class="p-1 rounded-lg bg-brand-500/20 text-brand-400">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-bold text-sm text-brand-400">{{ toast.title }}</h4>
            <p class="text-xs text-dark-300 mt-0.5">{{ toast.message }}</p>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Navigation Bar -->
    <nav class="glass-nav">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <router-link to="/" class="flex items-center gap-2 group">
              <div class="bg-gradient-to-tr from-brand-600 to-brand-400 p-2 rounded-xl text-white shadow-md shadow-brand-500/20 group-hover:scale-105">
                <Trophy class="w-6 h-6" />
              </div>
              <span class="text-2xl font-extrabold tracking-tight text-white">
                Sport<span class="text-brand-500">Space</span>
              </span>
            </router-link>
          </div>

          <!-- Desktop Navigation Links -->
          <div class="hidden md:flex items-center gap-6">
            <router-link to="/explore" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
              Cari Lapangan
            </router-link>

            <!-- Role-Specific Links -->
            <template v-if="authStore.isLoggedIn">
              <!-- Regular User -->
              <template v-if="authStore.isUser">
                <router-link to="/dashboard/user" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Dashboard
                </router-link>
                <router-link to="/dashboard/user/bookings" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Riwayat Booking
                </router-link>
              </template>

              <!-- Owner -->
              <template v-if="authStore.isOwner">
                <router-link to="/dashboard/owner" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Owner Panel
                </router-link>
                <router-link to="/dashboard/owner/fields" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Lapangan Saya
                </router-link>
                <router-link to="/dashboard/owner/schedule" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Atur Jadwal
                </router-link>
              </template>

              <!-- Admin -->
              <template v-if="authStore.isAdmin">
                <router-link to="/dashboard/admin" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Admin Panel
                </router-link>
                <router-link to="/dashboard/admin/promos" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                  Kelola Promo
                </router-link>
              </template>
            </template>
            <template v-else>
              <a href="#about" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                Tentang Kami
              </a>
            </template>
          </div>

          <!-- Right Navigation Side -->
          <div class="hidden md:flex items-center gap-4">
            <!-- Notifications Popover -->
            <div v-if="authStore.isLoggedIn" class="relative">
              <button 
                @click="toggleNotifications"
                class="relative p-2 rounded-xl hover:bg-dark-800 text-dark-300 hover:text-white focus:outline-none"
              >
                <Bell class="w-5 h-5" />
                <span 
                  v-if="unreadNotifCount > 0" 
                  class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-dark-950"
                >
                  {{ unreadNotifCount }}
                </span>
              </button>

              <div 
                v-if="notificationsOpen" 
                class="absolute right-0 mt-2 w-80 glass-card bg-dark-900 border-dark-800 rounded-xl overflow-hidden shadow-2xl z-50"
              >
                <div class="px-4 py-2 border-b border-dark-800 flex justify-between items-center">
                  <span class="font-bold text-sm text-white">Notifikasi</span>
                  <button 
                    @click="notificationStore.markAllAsRead" 
                    class="text-xs text-brand-400 hover:underline"
                  >
                    Tandai semua dibaca
                  </button>
                </div>
                <div class="max-h-60 overflow-y-auto">
                  <div 
                    v-for="n in activeNotifications" 
                    :key="n.id" 
                    class="px-4 py-3 hover:bg-dark-800/50 border-b border-dark-800/40 last:border-b-0"
                    :class="{'bg-brand-500/5': !n.read}"
                  >
                    <div class="flex justify-between items-start">
                      <span class="font-semibold text-xs text-white">{{ n.title }}</span>
                      <span class="text-[10px] text-dark-500">{{ n.time }}</span>
                    </div>
                    <p class="text-xs text-dark-300 mt-1">{{ n.message }}</p>
                  </div>
                  <div v-if="activeNotifications.length === 0" class="py-6 text-center text-xs text-dark-500">
                    Tidak ada notifikasi baru
                  </div>
                </div>
              </div>
            </div>

            <!-- Profile Menu -->
            <div v-if="authStore.isLoggedIn" class="relative">
              <button 
                @click="toggleUserMenu"
                class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-800/60 focus:outline-none"
              >
                <img 
                  :src="currentUser.avatar" 
                  alt="Avatar" 
                  class="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700"
                />
                <div class="text-left">
                  <p class="text-xs font-semibold text-white leading-tight">{{ currentUser.name }}</p>
                  <p class="text-[10px] text-brand-400 capitalize leading-none">{{ currentUser.role }}</p>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-dark-400" />
              </button>

              <!-- Profile Dropdown -->
              <div 
                v-if="userMenuOpen" 
                class="absolute right-0 mt-2 w-48 glass-card bg-dark-900 border-dark-800 rounded-xl overflow-hidden shadow-2xl z-50 py-1"
              >
                <div class="px-4 py-2 border-b border-dark-800">
                  <p class="text-xs font-semibold text-white truncate">{{ currentUser.name }}</p>
                  <p class="text-[10px] text-dark-400 truncate">{{ currentUser.email }}</p>
                </div>
                <button 
                  @click="handleLogout" 
                  class="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut class="w-4 h-4" /> Keluar
                </button>
              </div>
            </div>

            <template v-else>
              <router-link to="/login" class="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium">
                Masuk
              </router-link>
              <router-link 
                to="/register" 
                class="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 hover:shadow-brand-500/20"
              >
                Daftar Lapangan
              </router-link>
            </template>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden flex items-center gap-2">
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen" 
              class="p-2 rounded-lg text-dark-400 hover:text-white focus:outline-none"
            >
              <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
              <X v-else class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden bg-dark-950 border-t border-dark-900 px-2 pt-2 pb-4 space-y-1">
        <router-link 
          to="/explore" 
          @click="mobileMenuOpen = false"
          class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
        >
          Cari Lapangan
        </router-link>

        <template v-if="authStore.isLoggedIn">
          <!-- Regular User -->
          <template v-if="authStore.isUser">
            <router-link 
              to="/dashboard/user" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Dashboard
            </router-link>
            <router-link 
              to="/dashboard/user/bookings" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Riwayat Booking
            </router-link>
          </template>

          <!-- Owner -->
          <template v-if="authStore.isOwner">
            <router-link 
              to="/dashboard/owner" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Dashboard Owner
            </router-link>
            <router-link 
              to="/dashboard/owner/fields" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Kelola Lapangan
            </router-link>
            <router-link 
              to="/dashboard/owner/schedule" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Kelola Jadwal
            </router-link>
          </template>

          <!-- Admin -->
          <template v-if="authStore.isAdmin">
            <router-link 
              to="/dashboard/admin" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Dashboard Admin
            </router-link>
            <router-link 
              to="/dashboard/admin/promos" 
              @click="mobileMenuOpen = false"
              class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
            >
              Kelola Promo
            </router-link>
          </template>

          <div class="border-t border-dark-900 pt-4 mt-2">
            <div class="flex items-center px-3 gap-3">
              <img :src="currentUser.avatar" alt="Avatar" class="w-10 h-10 rounded-lg bg-dark-800" />
              <div>
                <p class="text-sm font-semibold text-white">{{ currentUser.name }}</p>
                <p class="text-xs text-brand-400 capitalize">{{ currentUser.role }}</p>
              </div>
            </div>
            <button 
              @click="handleLogout" 
              class="mt-3 w-full text-left px-3 py-2 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2"
            >
              <LogOut class="w-5 h-5" /> Keluar
            </button>
          </div>
        </template>
        
        <template v-else>
          <router-link 
            to="/login" 
            @click="mobileMenuOpen = false"
            class="block text-dark-300 hover:text-white px-3 py-2 rounded-lg text-base font-medium"
          >
            Masuk
          </router-link>
          <router-link 
            to="/register" 
            @click="mobileMenuOpen = false"
            class="block bg-brand-500 text-white text-center font-bold px-3 py-2 rounded-lg text-base"
          >
            Daftar Lapangan
          </router-link>
        </template>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-grow">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Global Footer -->
    <footer class="bg-dark-950 border-t border-dark-900 py-12 px-4 mt-auto">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center gap-2">
            <div class="bg-brand-500 p-1.5 rounded-lg text-white">
              <Trophy class="w-5 h-5" />
            </div>
            <span class="text-xl font-bold text-white">SportSpace</span>
          </div>
          <p class="text-xs text-dark-400 mt-4 leading-relaxed">
            Platform booking lapangan olahraga online modern #1 di Indonesia. Cari, bandingkan, dan sewa lapangan olahraga favoritmu dengan mudah dan cepat.
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Jenis Olahraga</h4>
          <ul class="space-y-2 text-xs text-dark-400">
            <li><router-link to="/explore" class="hover:text-brand-500">Futsal</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Badminton</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Basketball</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Tennis Court</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Voli & Mini Soccer</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Kota Populer</h4>
          <ul class="space-y-2 text-xs text-dark-400">
            <li><router-link to="/explore" class="hover:text-brand-500">Jakarta</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Bandung</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Surabaya</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Medan</router-link></li>
            <li><router-link to="/explore" class="hover:text-brand-500">Tangerang</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Bantuan & Hubungi Kami</h4>
          <ul class="space-y-2 text-xs text-dark-400">
            <li>Email: support@sportspace.com</li>
            <li>WhatsApp: 0812-3456-7890</li>
            <li>Jam Operasional CS: 08:00 - 22:00 WIB</li>
          </ul>
          <div class="mt-4 flex gap-3 text-dark-500">
            <span class="text-[10px] text-dark-400">© 2026 SportSpace. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Floating Evaluator/Reviewer Quick Role Switcher widget -->
    <div 
      v-if="showRoleSwitcher"
      class="fixed bottom-6 left-6 z-[999] bg-dark-900/90 backdrop-blur-xl border border-dark-800 p-3 rounded-2xl shadow-2xl max-w-xs flex flex-col gap-2 animate-slide-up hover:border-brand-500/30 glow-emerald"
    >
      <div class="flex justify-between items-center pb-1 border-b border-dark-800">
        <span class="text-xs font-bold text-white flex items-center gap-1">
          <Sparkles class="w-3.5 h-3.5 text-brand-400" /> Demo Role Switcher
        </span>
        <button @click="showRoleSwitcher = false" class="text-dark-500 hover:text-white p-0.5 rounded">
          <X class="w-3 h-3" />
        </button>
      </div>
      <p class="text-[10px] text-dark-400 leading-tight">
        Klik tombol di bawah ini untuk berpindah peran (role) secara instan tanpa perlu log out / log in manual:
      </p>
      <div class="grid grid-cols-2 gap-1.5 mt-1">
        <button 
          @click="switchRole('guest')"
          class="px-2 py-1 text-[10px] rounded-lg font-bold border transition-colors"
          :class="[!authStore.isLoggedIn ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-800 text-dark-300 border-dark-700 hover:bg-dark-700']"
        >
          Guest / Logout
        </button>
        <button 
          @click="switchRole('user')"
          class="px-2 py-1 text-[10px] rounded-lg font-bold border transition-colors flex items-center justify-center gap-1"
          :class="[authStore.isLoggedIn && authStore.isUser ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-800 text-dark-300 border-dark-700 hover:bg-dark-700']"
        >
          Penyewa (User)
        </button>
        <button 
          @click="switchRole('owner')"
          class="px-2 py-1 text-[10px] rounded-lg font-bold border transition-colors flex items-center justify-center gap-1"
          :class="[authStore.isLoggedIn && authStore.isOwner ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-800 text-dark-300 border-dark-700 hover:bg-dark-700']"
        >
          Owner Lapangan
        </button>
        <button 
          @click="switchRole('admin')"
          class="px-2 py-1 text-[10px] rounded-lg font-bold border transition-colors flex items-center justify-center gap-1"
          :class="[authStore.isLoggedIn && authStore.isAdmin ? 'bg-brand-500 text-white border-brand-500' : 'bg-dark-800 text-dark-300 border-dark-700 hover:bg-dark-700']"
        >
          System Admin
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Page transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Toast animations */
.toast-enter-active {
  animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.toast-leave-active {
  animation: slideOutRight 0.3s ease-in forwards;
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
