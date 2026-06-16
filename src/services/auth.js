import { auth as firebaseAuth, googleProvider } from "../firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup 
} from "firebase/auth";
import { db } from "./db";

const SESSION_KEY = "sportspace_session";
const isMockConfig = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes("mock");

export const auth = {
  getCurrentUser() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  async login(email, password) {
    // Hardcoded Admin Credentials Check
    if (email.toLowerCase() === "admin@sportspace.com" && password === "admin123") {
      const adminUser = {
        id: "admin",
        email: "admin@sportspace.com",
        name: "System Admin",
        phone: "081100000000",
        role: "admin",
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=admin",
        createdAt: new Date(2026, 0, 1).toISOString()
      };

      // Ensure the admin user profile exists in local storage "users" collection too
      const users = db.getCollection("users");
      if (!users.some(u => u.email.toLowerCase() === "admin@sportspace.com")) {
        users.push(adminUser);
        db.saveCollection("users", users);
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      db.addSystemActivity(`Admin Login (Hardcoded): ${adminUser.name}`);
      return { success: true, user: adminUser };
    }

    if (isMockConfig) {
      // 1. Check in regular users (includes admin)
      const users = db.getCollection("users");
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        db.addSystemActivity(`Mock Login: ${user.name} (${user.role})`);
        return { success: true, user };
      }

      // 2. Check in owners
      const owners = db.getCollection("owners");
      const owner = owners.find((o) => o.email.toLowerCase() === email.toLowerCase());

      if (owner) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(owner));
        db.addSystemActivity(`Mock Login: ${owner.name} (owner)`);
        return { success: true, user: owner };
      }

      return { success: false, message: "Email atau Password salah (Mock)." };
    }

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      // 2. Get profile details from database
      let profile = null;
      const users = db.getCollection("users");
      profile = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!profile) {
        const owners = db.getCollection("owners");
        profile = owners.find(o => o.email.toLowerCase() === email.toLowerCase());
      }

      // Create fallback database profile if not existing but authenticated
      if (!profile) {
        profile = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || email.split("@")[0],
          role: "user",
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email.split("@")[0]}`,
          phone: ""
        };
        db.add("users", profile);
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      db.addSystemActivity(`User logged in via Firebase: ${profile.name} (${profile.role})`);
      return { success: true, user: profile };

    } catch (error) {
      console.log("Firebase login error, trying migration fallback for seed account:", error);

      // Check if this is a pre-seeded account in local DB
      let seedProfile = null;
      const users = db.getCollection("users");
      seedProfile = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!seedProfile) {
        const owners = db.getCollection("owners");
        seedProfile = owners.find(o => o.email.toLowerCase() === email.toLowerCase());
      }

      // Automatically register seed profile to Firebase Auth on first login
      if (seedProfile) {
        try {
          const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          localStorage.setItem(SESSION_KEY, JSON.stringify(seedProfile));
          db.addSystemActivity(`User auto-migrated & logged in via Firebase: ${seedProfile.name} (${seedProfile.role})`);
          return { success: true, user: seedProfile };
        } catch (migrationError) {
          console.error("Migration to Firebase Auth failed:", migrationError);
        }
      }

      return { success: false, message: "Email atau Password salah." };
    }
  },

  async loginGoogle(rolePreference = "user") {
    if (isMockConfig) {
      if (rolePreference === "owner") {
        const owners = db.getCollection("owners");
        const owner = owners[0]; // owner_1
        localStorage.setItem(SESSION_KEY, JSON.stringify(owner));
        db.addSystemActivity(`Google Login (Mock): ${owner.name} (owner)`);
        return { success: true, user: owner };
      } else if (rolePreference === "admin") {
        const users = db.getCollection("users");
        const admin = users.find(u => u.role === "admin");
        localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
        db.addSystemActivity(`Google Login (Mock): ${admin.name} (admin)`);
        return { success: true, user: admin };
      } else {
        const users = db.getCollection("users").filter(u => u.role === "user");
        const user = users[0]; // user_1
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        db.addSystemActivity(`Google Login (Mock): ${user.name} (user)`);
        return { success: true, user };
      }
    }

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const email = result.user.email;
      const name = result.user.displayName || email.split("@")[0];

      let profile = null;
      const users = db.getCollection("users");
      profile = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!profile) {
        const owners = db.getCollection("owners");
        profile = owners.find(o => o.email.toLowerCase() === email.toLowerCase());
      }

      // If first Google login, create a new profile document
      if (!profile) {
        profile = {
          id: result.user.uid,
          email,
          name,
          phone: result.user.phoneNumber || "",
          role: rolePreference,
          avatar: result.user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s+/g, '')}`,
        };
        db.add(rolePreference === "owner" ? "owners" : "users", profile);
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      db.addSystemActivity(`Google Login: ${profile.name} (${profile.role})`);
      return { success: true, user: profile };

    } catch (error) {
      console.error("Google authentication failed:", error);
      return { success: false, message: "Gagal login dengan Google." };
    }
  },

  async register(email, name, phone, role, password = "password123") {
    if (isMockConfig) {
      const collectionName = role === "owner" ? "owners" : "users";
      const collection = db.getCollection(collectionName);

      const exists = collection.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { success: false, message: "Email sudah terdaftar (Mock)." };
      }

      const newProfile = {
        email,
        name,
        phone,
        role,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s+/g, '')}`,
      };

      const added = db.add(collectionName, newProfile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(added));
      db.addSystemActivity(`New registration (Mock): ${name} (${role})`);
      return { success: true, user: added };
    }

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // 2. Create profile entry in Database
      const newProfile = {
        id: userCredential.user.uid,
        email,
        name,
        phone,
        role,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name.replace(/\s+/g, '')}`,
      };

      const collectionName = role === "owner" ? "owners" : "users";
      const added = db.add(collectionName, newProfile);

      localStorage.setItem(SESSION_KEY, JSON.stringify(added));
      db.addSystemActivity(`New registration via Firebase: ${name} (${role})`);
      return { success: true, user: added };

    } catch (error) {
      console.error("Firebase registration failed:", error);
      if (error.code === "auth/email-already-in-use") {
        return { success: false, message: "Email sudah terdaftar." };
      }
      return { success: false, message: error.message || "Gagal melakukan registrasi." };
    }
  },

  async logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      db.addSystemActivity(`User logged out: ${currentUser.name}`);
    }
    localStorage.removeItem(SESSION_KEY);

    if (!isMockConfig) {
      try {
        await signOut(firebaseAuth);
      } catch (err) {
        console.error("Firebase signOut failed:", err);
      }
    }
  },

  async forgotPassword(email) {
    if (isMockConfig) {
      const users = db.getCollection("users");
      const owners = db.getCollection("owners");
      const found = users.some(u => u.email.toLowerCase() === email.toLowerCase()) || 
                    owners.some(o => o.email.toLowerCase() === email.toLowerCase());

      if (found) {
        return { success: true, message: "Link pemulihan password telah dikirim ke email Anda (Mock)." };
      }
      return { success: false, message: "Email tidak ditemukan (Mock)." };
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { success: true, message: "Link pemulihan password telah dikirim ke email Anda." };
    } catch (error) {
      console.error("Firebase password reset request failed:", error);
      if (error.code === "auth/user-not-found") {
        return { success: false, message: "Email tidak ditemukan." };
      }
      return { success: false, message: "Gagal mengirimkan link reset password." };
    }
  }
};
