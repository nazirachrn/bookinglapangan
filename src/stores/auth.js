import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { auth } from "../services/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(auth.getCurrentUser());

  const isLoggedIn = computed(() => user.value !== null);
  const isUser = computed(() => user.value?.role === "user");
  const isOwner = computed(() => user.value?.role === "owner");
  const isAdmin = computed(() => user.value?.role === "admin");

  function handleLoginResult(result) {
    if (result.success) {
      user.value = result.user;
    }
    return result;
  }

  async function login(email, password) {
    const res = await auth.login(email, password);
    return handleLoginResult(res);
  }

  async function loginGoogle(rolePreference) {
    const res = await auth.loginGoogle(rolePreference);
    return handleLoginResult(res);
  }

  async function register(email, name, phone, role, password) {
    const res = await auth.register(email, name, phone, role, password);
    return handleLoginResult(res);
  }

  async function logout() {
    await auth.logout();
    user.value = null;
  }

  async function forgotPassword(email) {
    return await auth.forgotPassword(email);
  }

  return {
    user,
    isLoggedIn,
    isUser,
    isOwner,
    isAdmin,
    login,
    loginGoogle,
    register,
    logout,
    forgotPassword
  };
});
