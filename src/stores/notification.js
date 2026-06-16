import { defineStore } from "pinia";
import { ref } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref([
    {
      id: "notif_1",
      title: "Booking Berhasil",
      message: "Selamat! Booking lapangan Futsal - Court 1 Anda telah dikonfirmasi.",
      time: "5 menit yang lalu",
      read: false,
      role: "user"
    },
    {
      id: "notif_2",
      title: "Promo Baru Menanti",
      message: "Gunakan kode promo SPORTSPACE10 untuk diskon 10% di booking berikutnya!",
      time: "2 jam yang lalu",
      read: false,
      role: "user"
    },
    {
      id: "notif_3",
      title: "Booking Masuk Baru",
      message: "Ada 1 booking baru menunggu konfirmasi Anda.",
      time: "10 menit yang lalu",
      read: false,
      role: "owner"
    },
    {
      id: "notif_4",
      title: "Sistem Baru Terpantau",
      message: "5 pendaftaran pengguna baru hari ini.",
      time: "1 jam yang lalu",
      read: false,
      role: "admin"
    }
  ]);

  const toasts = ref([]);

  function addNotification(title, message, role = "user") {
    notifications.value.unshift({
      id: `notif_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      time: "Baru saja",
      read: false,
      role
    });
    
    // Also push a temporary toast notification
    const toastId = Math.random().toString(36).substr(2, 9);
    toasts.value.push({ id: toastId, title, message });
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== toastId);
    }, 4000);
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true);
  }

  function clearNotification(id) {
    notifications.value = notifications.value.filter(n => n.id !== id);
  }

  return {
    notifications,
    toasts,
    addNotification,
    markAllAsRead,
    clearNotification
  };
});
