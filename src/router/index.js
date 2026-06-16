import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

// Views
import LandingPage from "../views/LandingPage.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Explore from "../views/Explore.vue";
import FieldDetail from "../views/FieldDetail.vue";
import Checkout from "../views/Checkout.vue";
import ETicket from "../views/ETicket.vue";
import UserDashboard from "../views/UserDashboard.vue";
import UserBookings from "../views/UserBookings.vue";
import OwnerDashboard from "../views/OwnerDashboard.vue";
import OwnerFields from "../views/OwnerFields.vue";
import OwnerSchedule from "../views/OwnerSchedule.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import AdminPromos from "../views/AdminPromos.vue";

const routes = [
  {
    path: "/",
    name: "LandingPage",
    component: LandingPage,
    meta: { title: "SportSpace - Booking Lapangan Olahraga Online" }
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "Login - SportSpace" }
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { title: "Register - SportSpace" }
  },
  {
    path: "/explore",
    name: "Explore",
    component: Explore,
    meta: { title: "Cari Lapangan - SportSpace" }
  },
  {
    path: "/field/:id",
    name: "FieldDetail",
    component: FieldDetail,
    props: true,
    meta: { title: "Detail Lapangan - SportSpace" }
  },
  {
    path: "/checkout",
    name: "Checkout",
    component: Checkout,
    meta: { requiresAuth: true, role: "user", title: "Checkout Booking - SportSpace" }
  },
  {
    path: "/ticket/:id",
    name: "ETicket",
    component: ETicket,
    props: true,
    meta: { requiresAuth: true, role: "user", title: "E-Ticket - SportSpace" }
  },
  // User Dashboard
  {
    path: "/dashboard/user",
    name: "UserDashboard",
    component: UserDashboard,
    meta: { requiresAuth: true, role: "user", title: "Dashboard User - SportSpace" }
  },
  {
    path: "/dashboard/user/bookings",
    name: "UserBookings",
    component: UserBookings,
    meta: { requiresAuth: true, role: "user", title: "Riwayat Booking - SportSpace" }
  },
  // Owner Dashboard
  {
    path: "/dashboard/owner",
    name: "OwnerDashboard",
    component: OwnerDashboard,
    meta: { requiresAuth: true, role: "owner", title: "Dashboard Owner - SportSpace" }
  },
  {
    path: "/dashboard/owner/fields",
    name: "OwnerFields",
    component: OwnerFields,
    meta: { requiresAuth: true, role: "owner", title: "Manajemen Lapangan - SportSpace" }
  },
  {
    path: "/dashboard/owner/schedule",
    name: "OwnerSchedule",
    component: OwnerSchedule,
    meta: { requiresAuth: true, role: "owner", title: "Pengaturan Jadwal - SportSpace" }
  },
  // Admin Dashboard
  {
    path: "/dashboard/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "admin", title: "Dashboard Admin - SportSpace" }
  },
  {
    path: "/dashboard/admin/promos",
    name: "AdminPromos",
    component: AdminPromos,
    meta: { requiresAuth: true, role: "admin", title: "Manajemen Promo - SportSpace" }
  },
  // Catch all redirect
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to, from) => {
  const authStore = useAuthStore();
  
  // Set title
  document.title = to.meta.title || "SportSpace";

  // Check auth requirement
  if (to.meta.requiresAuth) {
    if (!authStore.isLoggedIn) {
      // Redirect to login if not logged in
      return { name: "Login", query: { redirect: to.fullPath } };
    }
    
    // Check role authorization
    const userRole = authStore.user.role;
    const requiredRole = to.meta.role;
    
    if (requiredRole && userRole !== requiredRole) {
      // Redirect to their own dashboard if role mismatch
      if (userRole === "admin") return { name: "AdminDashboard" };
      if (userRole === "owner") return { name: "OwnerDashboard" };
      return { name: "UserDashboard" };
    }
  } else {
    // Prevent logged-in users from visiting login/register
    if ((to.name === "Login" || to.name === "Register") && authStore.isLoggedIn) {
      const userRole = authStore.user.role;
      if (userRole === "admin") return { name: "AdminDashboard" };
      if (userRole === "owner") return { name: "OwnerDashboard" };
      return { name: "UserDashboard" };
    }
  }
});


export default router;
