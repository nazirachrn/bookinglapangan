import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { db } from "../services/db";

export const useCartStore = defineStore("cart", () => {
  const field = ref(null);
  const date = ref("");
  const startTime = ref("");
  const endTime = ref("");
  const duration = ref(0);
  const promoCode = ref("");
  const discount = ref(0);

  const subtotal = computed(() => {
    if (!field.value || !duration.value) return 0;
    return field.value.pricePerHour * duration.value;
  });

  const tax = computed(() => {
    return Math.round((subtotal.value - discount.value) * 0.11);
  });

  const total = computed(() => {
    return subtotal.value - discount.value + tax.value;
  });

  function setBookingDetails(selectedField, selectedDate, start, end, hrDuration) {
    field.value = selectedField;
    date.value = selectedDate;
    startTime.value = start;
    endTime.value = end;
    duration.value = hrDuration;
    promoCode.value = "";
    discount.value = 0;
  }

  function applyPromo(code) {
    if (!code) return { success: false, message: "Kode promo tidak boleh kosong" };
    
    const promos = db.getCollection("promos");
    const promo = promos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.isActive);
    
    if (!promo) {
      return { success: false, message: "Kode promo tidak valid atau sudah kedaluwarsa" };
    }

    // Check minimum purchase
    if (subtotal.value < promo.minPurchase) {
      return { 
        success: false, 
        message: `Minimal transaksi untuk promo ini adalah Rp ${promo.minPurchase.toLocaleString("id-ID")}` 
      };
    }

    promoCode.value = promo.code;
    if (promo.isPercent) {
      discount.value = Math.round(subtotal.value * (promo.value / 100));
    } else {
      discount.value = Math.min(promo.value, subtotal.value);
    }

    return { 
      success: true, 
      message: `Promo berhasil digunakan! Diskon Rp ${discount.value.toLocaleString("id-ID")}` 
    };
  }

  function clearCart() {
    field.value = null;
    date.value = "";
    startTime.value = "";
    endTime.value = "";
    duration.value = 0;
    promoCode.value = "";
    discount.value = 0;
  }

  return {
    field,
    date,
    startTime,
    endTime,
    duration,
    promoCode,
    discount,
    subtotal,
    tax,
    total,
    setBookingDetails,
    applyPromo,
    clearCart
  };
});
