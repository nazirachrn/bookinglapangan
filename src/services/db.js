import { generateSeedData } from "./seedData";
import { firestore } from "../firebase/config";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from "firebase/firestore";

// Initialize Local Database Prefix
const DB_PREFIX = "sportspace_db_";
const COLLECTIONS = ["users", "owners", "promos", "fields", "reviews", "bookings", "activities"];

// Check if Firebase is using mock credentials
const isMockConfig = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes("mock");
let firebaseConnected = false;

// Fallback: Local database initialization (original behavior)
function initLocalDB() {
  if (!localStorage.getItem(`${DB_PREFIX}initialized`)) {
    const data = generateSeedData();
    Object.keys(data).forEach((key) => {
      localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(data[key]));
    });
    localStorage.setItem(`${DB_PREFIX}initialized`, "true");
  }
}

// Upload seed data in batches of 500
async function uploadInBatches(collectionName, items) {
  let batch = writeBatch(firestore);
  let count = 0;
  for (const item of items) {
    const docRef = doc(firestore, collectionName, item.id);
    batch.set(docRef, item);
    count++;
    if (count === 500) {
      await batch.commit();
      batch = writeBatch(firestore);
      count = 0;
    }
  }
  if (count > 0) {
    await batch.commit();
  }
}

// Background Firestore Seeding
async function checkAndSeedFirestore() {
  if (isMockConfig) {
    console.warn("Using mock Firebase configuration. Running in local-only mode.");
    initLocalDB();
    return;
  }

  try {
    const fieldsSnap = await getDocs(collection(firestore, "fields"));
    if (fieldsSnap.empty) {
      console.log("Firestore is empty. Seeding data to Firebase...");
      const data = generateSeedData();
      
      for (const colName of Object.keys(data)) {
        await uploadInBatches(colName, data[colName]);
      }
      // Seeding empty activities
      await uploadInBatches("activities", []);
      console.log("Firestore seeding completed successfully!");
    }
    localStorage.setItem(`${DB_PREFIX}firebase_seeded`, "true");
    localStorage.setItem(`${DB_PREFIX}initialized`, "true");
    firebaseConnected = true;
  } catch (error) {
    console.error("Failed to connect or seed Firestore. Falling back to local storage:", error);
    initLocalDB();
  }
}

// Force database seed/reset
async function forceSeedFirestore() {
  try {
    // Clean up local storage flags
    localStorage.removeItem(`${DB_PREFIX}firebase_seeded`);
    localStorage.removeItem(`${DB_PREFIX}initialized`);

    if (!isMockConfig) {
      console.log("Force seeding Firestore database...");
      const data = generateSeedData();

      // 1. Clear accumulative transactional collections to prevent stale mock data
      const collectionsToClear = ["bookings", "reviews", "activities"];
      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(firestore, colName));
        let batch = writeBatch(firestore);
        let count = 0;
        for (const doc of snap.docs) {
          batch.delete(doc.ref);
          count++;
          if (count === 500) {
            await batch.commit();
            batch = writeBatch(firestore);
            count = 0;
          }
        }
        if (count > 0) {
          await batch.commit();
        }
      }

      // 2. Upload fresh seed data to Firestore
      for (const colName of Object.keys(data)) {
        await uploadInBatches(colName, data[colName]);
      }
      
      // Seed a fresh start activity
      const activityId = `act_${Math.random().toString(36).substr(2, 9)}`;
      const seedActivity = {
        id: activityId,
        message: "Database re-seeded by Administrator.",
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(firestore, "activities", activityId), seedActivity);

      // 3. Write directly to localStorage instantly to avoid network lag
      for (const colName of Object.keys(data)) {
        localStorage.setItem(`${DB_PREFIX}${colName}`, JSON.stringify(data[colName]));
      }
      localStorage.setItem(`${DB_PREFIX}activities`, JSON.stringify([seedActivity]));

      console.log("Firestore force seed finished successfully!");
      firebaseConnected = true;
    } else {
      // Mock Mode Seeding (Clear local storage keys first)
      COLLECTIONS.forEach(col => localStorage.removeItem(`${DB_PREFIX}${col}`));
      initLocalDB();

      // Create a fresh startup activity log so the dashboard feed is not empty
      const seedActivity = {
        id: `act_${Math.random().toString(36).substr(2, 9)}`,
        message: "Database (Mock Mode) re-seeded by Administrator.",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`${DB_PREFIX}activities`, JSON.stringify([seedActivity]));

      // Dispatch update events for all collections to keep UI components in sync
      COLLECTIONS.forEach((colName) => {
        const data = colName === "activities" ? [seedActivity] : JSON.parse(localStorage.getItem(`${DB_PREFIX}${colName}`) || "[]");
        window.dispatchEvent(new CustomEvent(`db-update-${colName}`, { detail: data }));
      });
    }

    localStorage.setItem(`${DB_PREFIX}firebase_seeded`, "true");
    localStorage.setItem(`${DB_PREFIX}initialized`, "true");
    return true;
  } catch (error) {
    console.error("Force seeding failed:", error);
    throw error;
  }
}

// Real-time listener setup to sync Firestore to localStorage
function setupFirestoreListeners() {
  if (isMockConfig || !firebaseConnected) return;

  COLLECTIONS.forEach((colName) => {
    onSnapshot(
      collection(firestore, colName),
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push(doc.data());
        });

        // Special handling for activities to cap at 100
        if (colName === "activities") {
          data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const capped = data.slice(0, 100);
          localStorage.setItem(`${DB_PREFIX}activities`, JSON.stringify(capped));
          window.dispatchEvent(new CustomEvent("db-update-activities", { detail: capped }));
        } else {
          localStorage.setItem(`${DB_PREFIX}${colName}`, JSON.stringify(data));
          window.dispatchEvent(new CustomEvent(`db-update-${colName}`, { detail: data }));
        }
      },
      (error) => {
        console.error(`Error in onSnapshot listener for ${colName}:`, error);
      }
    );
  });
}

// Run Seeding and Listeners
checkAndSeedFirestore().then(() => {
  setupFirestoreListeners();
});

// Core Collection Actions (Synchronous UI interface)
export const db = {
  async forceSeed() {
    return await forceSeedFirestore();
  },

  getCollection(collectionName) {
    const data = localStorage.getItem(`${DB_PREFIX}${collectionName}`);
    return data ? JSON.parse(data) : [];
  },

  saveCollection(collectionName, data) {
    localStorage.setItem(`${DB_PREFIX}${collectionName}`, JSON.stringify(data));
  },

  getAll(collectionName) {
    return this.getCollection(collectionName);
  },

  getById(collectionName, id) {
    const collection = this.getCollection(collectionName);
    return collection.find((item) => item.id === id) || null;
  },

  add(collectionName, item) {
    const collection = this.getCollection(collectionName);
    const newItem = {
      id: item.id || `${collectionName.slice(0, -1)}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...item,
    };
    
    // 1. Optimistic Local Update
    collection.push(newItem);
    this.saveCollection(collectionName, collection);

    // 2. Background Firestore write
    if (firebaseConnected && !isMockConfig) {
      setDoc(doc(firestore, collectionName, newItem.id), newItem)
        .catch((err) => console.error(`Failed to add doc to Firestore collection ${collectionName}:`, err));
    }

    this.addSystemActivity(`New ${collectionName.slice(0, -1)} created: ${newItem.name || newItem.bookingCode || newItem.code || newItem.email}`);
    return newItem;
  },

  update(collectionName, id, updates) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updatedItem = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
    collection[index] = updatedItem;
    this.saveCollection(collectionName, collection);

    // Background Firestore update
    if (firebaseConnected && !isMockConfig) {
      updateDoc(doc(firestore, collectionName, id), updates)
        .catch((err) => console.error(`Failed to update doc in Firestore collection ${collectionName}:`, err));
    }

    return updatedItem;
  },

  delete(collectionName, id) {
    const collection = this.getCollection(collectionName);
    const filtered = collection.filter((item) => item.id !== id);
    if (filtered.length === collection.length) return false;
    this.saveCollection(collectionName, filtered);

    // Background Firestore delete
    if (firebaseConnected && !isMockConfig) {
      deleteDoc(doc(firestore, collectionName, id))
        .catch((err) => console.error(`Failed to delete doc in Firestore collection ${collectionName}:`, err));
    }

    return true;
  },

  // Check slot availability to prevent double booking
  checkAvailability(fieldId, date, startTime, endTime) {
    const bookings = this.getCollection("bookings");
    const field = this.getById("fields", fieldId);
    if (!field) return { available: false, reason: "Lapangan tidak ditemukan" };

    // 1. Check operational hours
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    if (startHour < field.openHour || endHour > field.closeHour) {
      return { available: false, reason: `Jam operasional lapangan adalah ${field.openHour}:00 - ${field.closeHour}:00` };
    }

    // 2. Check maintenance blocks
    const targetSlot = `${startTime}-${endTime}`;
    if (field.maintenanceSlots && field.maintenanceSlots.includes(targetSlot)) {
      return { available: false, reason: "Slot waktu ini sedang dalam pemeliharaan (maintenance)" };
    }

    // 3. Check overlaps with existing bookings (status: Pending or Confirmed or Completed)
    const activeBookings = bookings.filter(
      (b) =>
        b.fieldId === fieldId &&
        b.date === date &&
        (b.status === "Confirmed" || b.status === "Pending" || b.status === "Completed")
    );

    for (const booking of activeBookings) {
      const bStart = parseInt(booking.startTime.split(":")[0]);
      const bEnd = parseInt(booking.endTime.split(":")[0]);

      // Overlap condition: startA < endB and startB < endA
      if (startHour < bEnd && bStart < endHour) {
        return {
          available: false,
          reason: `Slot waktu ini sudah dibooking (${booking.startTime} - ${booking.endTime})`,
        };
      }
    }

    return { available: true };
  },

  // System Activity log generator (for admin dashboard monitoring)
  addSystemActivity(message) {
    const id = `act_${Math.random().toString(36).substr(2, 9)}`;
    const newActivity = {
      id,
      message,
      timestamp: new Date().toISOString()
    };

    // 1. Optimistic Local Update
    const activities = JSON.parse(localStorage.getItem(`${DB_PREFIX}activities`) || "[]");
    activities.unshift(newActivity);
    if (activities.length > 100) activities.pop();
    localStorage.setItem(`${DB_PREFIX}activities`, JSON.stringify(activities));

    // 2. Background Firestore write
    if (firebaseConnected && !isMockConfig) {
      setDoc(doc(firestore, "activities", id), newActivity)
        .catch((err) => console.error("Failed to add activity to Firestore:", err));
    }
  },

  getSystemActivities() {
    return JSON.parse(localStorage.getItem(`${DB_PREFIX}activities`) || "[]");
  },

  // AI Feature: Crowd occupancy prediction
  getCrowdPrediction(fieldId) {
    const field = this.getById("fields", fieldId);
    if (!field) return null;

    // Simulate hourly crowd occupancy (0-100%)
    const hours = [];
    const open = field.openHour;
    const close = field.closeHour;

    for (let h = open; h < close; h++) {
      const timeStr = `${h.toString().padStart(2, "0")}:00`;
      let occupancy = 15; // default base occupancy
      
      // Peak hour logic: high at evenings (17:00-21:00) and early mornings on weekend
      if (h >= 17 && h <= 21) {
        occupancy = field.sport === "Futsal" || field.sport === "Mini Soccer" ? 95 : 85;
      } else if (h >= 15 && h < 17) {
        occupancy = 65;
      } else if (h >= 7 && h <= 9) {
        occupancy = field.sport === "Badminton" ? 70 : 45;
      } else if (h >= 11 && h <= 14) {
        occupancy = 25; // lunch hours are usually quiet
      }

      hours.push({
        time: timeStr,
        occupancy: occupancy,
        status: occupancy > 80 ? "Sangat Ramai" : occupancy > 50 ? "Ramai" : "Sepi"
      });
    }

    const busiest = hours.reduce((prev, current) => (prev.occupancy > current.occupancy ? prev : current), hours[0]);
    const quietest = hours.reduce((prev, current) => (prev.occupancy < current.occupancy ? prev : current), hours[0]);

    return {
      hourlyData: hours,
      busiestTime: busiest.time,
      quietestTime: quietest.time,
      avgOccupancy: Math.round(hours.reduce((sum, item) => sum + item.occupancy, 0) / hours.length)
    };
  },

  // AI Feature: Price Insight
  getPriceInsight(fieldId) {
    const field = this.getById("fields", fieldId);
    if (!field) return null;

    const fields = this.getCollection("fields").filter(f => f.sport === field.sport && f.city === field.city);
    const prices = fields.map(f => f.pricePerHour);
    
    const minPrice = Math.min(...prices, field.pricePerHour * 0.85); // simulate standard morning discounts
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);

    // Morning hours are cheaper
    const cheapestBookingTime = `Pagi Hari (${field.openHour}:00 - 12:00) - Hemat s.d 15%`;
    
    return {
      cheapestPrice: minPrice,
      averagePrice: avgPrice,
      highestPrice: maxPrice,
      savingTime: cheapestBookingTime,
      comparisonText: field.pricePerHour < avgPrice 
        ? "Harga lapangan ini 15% lebih murah dibanding rata-rata lapangan sejenis di kota Anda."
        : "Harga lapangan ini berada di rata-rata pasar. Booking di pagi hari untuk tarif lebih hemat."
    };
  },

  // AI Feature: Smart Recommendations
  getSmartRecommendations(userId, sportType, city) {
    const allFields = this.getCollection("fields");
    const bookings = this.getCollection("bookings");

    let recommended = [];

    // Filter by city
    let list = allFields.filter(f => f.city === city && f.status === "active");
    if (list.length === 0) list = allFields.filter(f => f.status === "active");

    // Preferred sport type
    let sportMatch = list.filter(f => f.sport === sportType);
    if (sportMatch.length > 0) {
      recommended = sportMatch.sort((a, b) => b.rating - a.rating).slice(0, 3);
    } else {
      recommended = list.sort((a, b) => b.rating - a.rating).slice(0, 3);
    }

    // User favorite hour simulation based on their past bookings
    let favoriteHour = "19:00 - 21:00 (Malam)";
    if (userId) {
      const userBookings = bookings.filter(b => b.userId === userId);
      if (userBookings.length > 0) {
        const hours = userBookings.map(b => b.startTime);
        const countMap = hours.reduce((acc, h) => ({ ...acc, [h]: (acc[h] || 0) + 1 }), {});
        const favStart = Object.keys(countMap).reduce((a, b) => countMap[a] > countMap[b] ? a : b, "19:00");
        const favEnd = `${parseInt(favStart.split(":")[0]) + 2}:00`;
        favoriteHour = `${favStart} - ${favEnd}`;
      }
    }

    return {
      recommendations: recommended,
      favoriteHour: favoriteHour,
      nearbyDistanceSim: "1.2 km - 3.5 km dari posisi Anda"
    };
  },

  // Owner Dashboard stats calculator
  getOwnerStats(ownerId) {
    const fields = this.getCollection("fields").filter(f => f.ownerId === ownerId);
    const bookings = this.getCollection("bookings").filter(b => b.ownerId === ownerId);
    
    const totalFields = fields.length;
    const totalBookings = bookings.length;
    
    // Revenue calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const revenueToday = bookings
      .filter(b => b.date === todayStr && b.status === "Completed")
      .reduce((sum, b) => sum + b.total, 0);

    const revenueThisMonth = bookings
      .filter(b => {
        const bDate = new Date(b.date);
        return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear && b.status === "Completed";
      })
      .reduce((sum, b) => sum + b.total, 0);

    // Simulated charts data (daily bookings over last 7 days)
    const dailyBookings = [];
    const dailyLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = bookings.filter(b => b.date === dStr).length;
      dailyBookings.push(count);
      dailyLabels.push(d.toLocaleDateString("id-ID", { weekday: "short" }));
    }

    // Simulated monthly revenue over last 6 months
    const monthlyRevenue = [];
    const monthlyLabels = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIdx = d.getMonth();
      const mYear = d.getFullYear();
      
      const rev = bookings
        .filter(b => {
          const bDate = new Date(b.date);
          return bDate.getMonth() === mIdx && bDate.getFullYear() === mYear && (b.status === "Completed" || b.status === "Confirmed");
        })
        .reduce((sum, b) => sum + b.total, 0);

      monthlyRevenue.push(rev);
      monthlyLabels.push(`${monthNames[mIdx]} ${mYear}`);
    }

    return {
      kpis: {
        totalFields,
        totalBookings,
        revenueToday,
        revenueThisMonth
      },
      charts: {
        dailyBookings: {
          labels: dailyLabels,
          data: dailyBookings
        },
        monthlyRevenue: {
          labels: monthlyLabels,
          data: monthlyRevenue
        }
      },
      recentBookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  },

  // Admin Dashboard stats calculator
  getAdminStats() {
    const users = this.getCollection("users");
    const owners = this.getCollection("owners");
    const fields = this.getCollection("fields");
    const bookings = this.getCollection("bookings");

    const totalUsers = users.length;
    const totalOwners = owners.length;
    const totalFields = fields.length;
    const totalBookings = bookings.length;

    const totalRevenue = bookings
      .filter(b => b.status === "Completed" || b.status === "Confirmed")
      .reduce((sum, b) => sum + (b.total || 0), 0);

    return {
      kpis: {
        totalUsers,
        totalOwners,
        totalFields,
        totalBookings,
        totalRevenue
      },
      recentBookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
      recentUsers: users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  }
};
