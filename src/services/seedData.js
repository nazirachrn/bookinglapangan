// Seed Data Generator for SportSpace
// Generates: 30 Users, 10 Owners, 50 Fields, 500 Bookings, 1000 Reviews, 30 Promos

const CITIES = ["Jakarta", "Bandung", "Surabaya", "Medan", "Tangerang"];
const SPORTS = ["Futsal", "Badminton", "Basket", "Tennis", "Voli", "Mini Soccer"];

const SPORT_ICONS = {
  Futsal: "Trophy",
  Badminton: "Activity",
  Basket: "Target",
  Tennis: "Sun",
  Voli: "Flame",
  "Mini Soccer": "Compass"
};

const AMENITIES = ["Shower Room", "Kantin/Cafe", "Parkir Luas", "Locker Room", "Sewa Alat", "WiFi Gratis", "Mushola", "Tribun Penonton"];

const FIRST_NAMES = [
  "Budi", "Andi", "Dewi", "Rian", "Siti", "Hendra", "Indah", "Taufik", "Rina", "Aditya",
  "Fahri", "Laras", "Gilang", "Rizky", "Putri", "Doni", "Mega", "Yusuf", "Aulia", "Eko",
  "Arif", "Novi", "Bagus", "Fitri", "Agus", "Wulan", "Reza", "Sari", "Dimas", "Ayu"
];

const LAST_NAMES = [
  "Santoso", "Wijaya", "Lestari", "Hidayat", "Rahmawati", "Kurniawan", "Permata", "Pratama", "Siregar", "Saputra",
  "Nugroho", "Sari", "Gunawan", "Utami", "Putro", "Wulandari", "Setiawan", "Pratiwi", "Harahap", "Budiman"
];

const REVIEW_TEMPLATES_GOOD = [
  "Tempatnya bersih banget, karpetnya masih bagus dan tidak licin. Sangat recommended!",
  "Fasilitas lengkap ada shower air hangat dan mushola bersih. Parkiran luas banget.",
  "Sangat puas main di sini. Pencahayaan lapangan terang benderang, pas buat main malam.",
  "Adminnya ramah dan fast response. Proses check-in tiket QR gampang banget tinggal scan.",
  "Lapangan terawat dengan baik. Sirkulasi udara bagus jadi tidak terlalu pengap walau indoor.",
  "Harga sewa sangat sebanding dengan kualitas lapangan. Langganan tetap ini mah!",
  "Lokasi strategis di pinggir jalan raya, akses gampang dicari. Mantap pokoknya.",
  "Sangat nyaman untuk olahraga bareng keluarga atau teman kantor. Recommended!"
];

const REVIEW_TEMPLATES_MID = [
  "Lapangannya bagus, cuma toiletnya agak kurang bersih kemarin pas ke sana.",
  "Pencahayaan oke, karpet lumayan. Sayangnya parkiran motor agak sempit pas jam rame.",
  "Harga standar, lapangan cukup oke. Cuma kantinnya kurang lengkap makanannya.",
  "Sirkulasi udara agak panas kalau siang hari. Tapi kalau main pagi/sore enak kok.",
  "Lapangan bagus tapi agak berisik karena jarak antar lapangan terlalu dekat."
];

const REVIEW_TEMPLATES_BAD = [
  "Karpetnya ada beberapa bagian yang mengelupas, bahaya bikin gampang kesandung.",
  "Lampu lapangan ada yang mati jadi agak redup di sisi kiri. Tolong diperbaiki.",
  "Kurang puas. Pelayanan staff di lokasi kurang ramah dan parkiran mobil susah.",
  "Jadwal agak berantakan, kemaren sempat nunggu 15 menit karena penyewa sebelum telat keluar."
];

// Helper to get random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number in range
const randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to generate unique ID
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export function generateSeedData() {
  console.log("Generating dummy data for SportSpace...");

  // 1. Generate Owners (10 data)
  const owners = [];
  for (let i = 1; i <= 10; i++) {
    const name = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
    owners.push({
      id: `owner_${i}`,
      email: `owner${i}@sportspace.com`,
      name: name,
      phone: `0812${randomRange(10000000, 99999999)}`,
      role: "owner",
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=owner_${i}`,
      createdAt: new Date(2026, 0, 1).toISOString()
    });
  }

  // 2. Generate Users (30 data)
  const users = [];
  // Admin User (Always user_1 or admin)
  users.push({
    id: "admin",
    email: "admin@sportspace.com",
    name: "System Admin",
    phone: "081100000000",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=admin",
    createdAt: new Date(2026, 0, 1).toISOString()
  });

  for (let i = 1; i <= 30; i++) {
    const name = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
    users.push({
      id: `user_${i}`,
      email: `user${i}@sportspace.com`,
      name: name,
      phone: `0856${randomRange(10000000, 99999999)}`,
      role: "user",
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=user_${i}`,
      createdAt: new Date(2026, 1, i).toISOString()
    });
  }

  // 3. Generate Promos (30 data)
  const promos = [];
  const promoNames = [
    "SPORTSPACE10", "MAINSEHAT", "MULAIBOLA", "SMASHHEMAT", "BASKETKU", "VOLIPRO", "SOCCERWEEKEND", 
    "PROMOHEBAT", "DISCOUNT20", "AYOOLAHRAGA", "INDONESIASEHAT", "MAINSENANG", "COURTFINDER", 
    "SEWAPAGI", "MAINSUBOR", "PROSENIN", "MAINKAMIS", "WEEKENDSERU", "PROMOOWNER", "BULUTANGKIS"
  ];
  for (let i = 0; i < 30; i++) {
    const name = promoNames[i] || `PROMO${i+1}`;
    const isPercent = Math.random() > 0.4;
    const discountValue = isPercent ? randomItem([10, 15, 20]) : randomItem([15000, 20000, 25000]);
    const startDate = new Date(2026, 2, 1);
    const endDate = new Date(2026, 8, 30); // Valid through Sep 2026
    
    // Some expired promos for stats
    if (i < 5) {
      startDate.setMonth(startDate.getMonth() - 2);
      endDate.setMonth(endDate.getMonth() - 2);
    }

    promos.push({
      id: `promo_${i + 1}`,
      code: name,
      name: `Voucher ${name}`,
      isPercent: isPercent,
      value: discountValue,
      minPurchase: randomItem([50000, 75000, 100000]),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      isActive: i >= 5
    });
  }

  // 4. Generate Lapangan (50 data)
  const fields = [];
  const sportNames = {
    Futsal: ["Aria Futsal", "Champion Court", "Vidi Arena", "Viva Futsal", "Indo Soccer", "Galaxy Futsal", "Sparta Court", "Siliwangi Sport Center", "Elite Futsal"],
    Badminton: ["Mutiara Hall", "Suryanaga Smash", "Taufik Hidayat Arena", "Sudirman Court", "Bulutangkis Jaya", "Gading Badminton", "Smash Club", "Merdeka Hall"],
    Basket: ["Dewa Basketball Arena", "Dunk Court", "Hoop Space", "Pancasila Court", "Crossover Arena", "Bounce Center", "Viper Basketball"],
    Tennis: ["Nirwana Tennis Club", "Baseline Court", "Ace Tennis Arena", "Grand Tennis Hall", "Slam Tennis Court", "Merdeka Clay Court"],
    Voli: ["Garuda Volley Club", "Spiker Arena", "Volley Dome", "Bhineka Court", "Volley Center"],
    "Mini Soccer": ["Green Field Mini Soccer", "Stadion Mini Kita", "Santiago Soccer Center", "Epic Mini Soccer", "Giga Field", "Samba Mini Soccer", "San Siro Arena"]
  };

  const images = {
    Futsal: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
    ],
    Badminton: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80"
    ],
    Basket: [
      "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800&auto=format&fit=crop&q=80"
    ],
    Tennis: [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop&q=80"
    ],
    Voli: [
      "https://images.unsplash.com/photo-1592656094267-764a45068526?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&auto=format&fit=crop&q=80"
    ],
    "Mini Soccer": [
      "https://images.unsplash.com/photo-1431324155629-1a6edd1d141d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80"
    ]
  };

  const cityDistricts = {
    Jakarta: ["Kuningan", "Kemang", "Senayan", "Kelapa Gading", "Pantai Indah Kapuk"],
    Bandung: ["Dago", "Siliwangi", "Setiabudi", "Cihampelas", "Buah Batu"],
    Surabaya: ["Gubeng", "Dharmahusada", "Wiyung", "Rungkut", "Tunjungan"],
    Medan: ["Medan Baru", "Medan Kota", "Medan Sunggal", "Medan Johor"],
    Tangerang: ["BSD City", "Bintaro", "Gading Serpong", "Karawaci"]
  };

  for (let i = 1; i <= 50; i++) {
    const sport = SPORTS[(i - 1) % SPORTS.length];
    const baseNames = sportNames[sport];
    const namePrefix = baseNames[(i - 1) % baseNames.length];
    const city = CITIES[(i - 1) % CITIES.length];
    const district = randomItem(cityDistricts[city]);
    const address = `Jl. Olahraga No. ${randomRange(10, 150)}, ${district}, ${city}`;
    
    // Price range based on sport
    let basePrice = 80000;
    if (sport === "Futsal") basePrice = randomRange(100000, 150000);
    else if (sport === "Badminton") basePrice = randomRange(40000, 80000);
    else if (sport === "Basket") basePrice = randomRange(90000, 130000);
    else if (sport === "Tennis") basePrice = randomRange(100000, 180000);
    else if (sport === "Voli") basePrice = randomRange(70000, 110000);
    else if (sport === "Mini Soccer") basePrice = randomRange(250000, 450000);

    // Operational Hours
    const openHour = randomItem([6, 7, 8]);
    const closeHour = randomItem([21, 22, 23, 24]);

    // Amenities list (pick 4-6)
    const fieldAmenities = [];
    const numAmenities = randomRange(4, 6);
    while (fieldAmenities.length < numAmenities) {
      const am = randomItem(AMENITIES);
      if (!fieldAmenities.includes(am)) {
        fieldAmenities.push(am);
      }
    }

    // Assign owner
    const ownerId = `owner_${((i - 1) % 10) + 1}`;

    // Randomize average rating initially, it will be accurately computed from reviews
    const avgRating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));

    fields.push({
      id: `field_${i}`,
      name: `${namePrefix} - Court ${((i - 1) % 3) + 1}`,
      sport: sport,
      pricePerHour: basePrice,
      city: city,
      district: district,
      address: address,
      description: `Nikmati keseruan bermain ${sport} di ${namePrefix}. Lapangan kami menggunakan standar internasional dengan perawatan berkala, pencahayaan yang sangat mumpuni, serta lingkungan yang bersih dan nyaman. Sangat cocok digunakan untuk sparing, latihan rutin, maupun turnamen antar komunitas.`,
      amenities: fieldAmenities,
      images: images[sport],
      indoor: Math.random() > 0.3, // Mostly indoor, some outdoor
      ownerId: ownerId,
      openHour: openHour,
      closeHour: closeHour,
      rating: avgRating,
      reviewCount: 0, // will calculate below
      status: "active",
      maintenanceSlots: [`${openHour + 2}:00-${openHour + 3}:00`] // Simple mock maintenance
    });
  }

  // 5. Generate Reviews (1000 data)
  const reviews = [];
  const fieldsReviewCounters = {};

  // Track review counts to distribute them
  fields.forEach(f => {
    fieldsReviewCounters[f.id] = { totalRating: 0, count: 0 };
  });

  for (let i = 1; i <= 1000; i++) {
    const field = randomItem(fields);
    const user = randomItem(users.filter(u => u.role === "user"));
    
    // Choose rating and comment
    const rand = Math.random();
    let rating = 5;
    let comment = "";
    if (rand > 0.4) {
      rating = randomRange(4, 5);
      comment = randomItem(REVIEW_TEMPLATES_GOOD);
    } else if (rand > 0.1) {
      rating = 3;
      comment = randomItem(REVIEW_TEMPLATES_MID);
    } else {
      rating = randomRange(1, 2);
      comment = randomItem(REVIEW_TEMPLATES_BAD);
    }

    const date = new Date(2026, randomRange(1, 4), randomRange(1, 28)); // Feb to May 2026

    reviews.push({
      id: `review_${i}`,
      fieldId: field.id,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: rating,
      comment: comment,
      date: date.toISOString().split('T')[0]
    });

    fieldsReviewCounters[field.id].totalRating += rating;
    fieldsReviewCounters[field.id].count += 1;
  }

  // Recalculate average rating and review counts on fields
  fields.forEach(f => {
    const data = fieldsReviewCounters[f.id];
    if (data.count > 0) {
      f.rating = parseFloat((data.totalRating / data.count).toFixed(1));
      f.reviewCount = data.count;
    } else {
      f.rating = 4.5;
      f.reviewCount = 0;
    }
  });

  // 6. Generate Bookings (500 data)
  const bookings = [];
  const statusOptions = ["Pending", "Confirmed", "Completed", "Cancelled"];

  // Helper to generate hours list
  const formatTime = (h) => `${h.toString().padStart(2, '0')}:00`;

  // We want to generate bookings:
  // 450 past bookings (mostly Completed or Cancelled)
  // 50 upcoming bookings (mostly Confirmed or Pending)
  for (let i = 1; i <= 500; i++) {
    const field = randomItem(fields);
    const user = randomItem(users.filter(u => u.role === "user"));
    const isPast = i <= 450;
    
    let date;
    let status;
    if (isPast) {
      // Past dates: Feb 2026 to May 2026
      date = new Date(2026, randomRange(1, 4), randomRange(1, 28));
      status = Math.random() > 0.15 ? "Completed" : "Cancelled";
    } else {
      // Future dates: June 9, 2026 to June 30, 2026
      date = new Date(2026, 5, randomRange(9, 30));
      status = Math.random() > 0.4 ? "Confirmed" : "Pending";
    }

    const startH = randomRange(field.openHour, field.closeHour - 3);
    const duration = randomItem([1, 2, 3]);
    const endH = startH + duration;

    const startTime = formatTime(startH);
    const endTime = formatTime(endH);

    const pricePerHour = field.pricePerHour;
    const subtotal = pricePerHour * duration;
    
    // Apply promo occasionally
    let discount = 0;
    let promoUsed = "";
    if (Math.random() > 0.7) {
      const activePromos = promos.filter(p => p.isActive);
      if (activePromos.length > 0) {
        const promo = randomItem(activePromos);
        promoUsed = promo.code;
        if (promo.isPercent) {
          discount = Math.floor(subtotal * (promo.value / 100));
        } else {
          discount = Math.min(promo.value, subtotal);
        }
      }
    }

    const tax = Math.floor((subtotal - discount) * 0.11);
    const total = subtotal - discount + tax;

    bookings.push({
      id: `booking_${i}`,
      bookingCode: `SS-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}-${randomRange(1000, 9999)}`,
      fieldId: field.id,
      fieldName: field.name,
      fieldCity: field.city,
      fieldSport: field.sport,
      fieldImage: field.images[0],
      userId: user.id,
      userName: user.name,
      ownerId: field.ownerId,
      date: date.toISOString().split('T')[0],
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      pricePerHour: pricePerHour,
      subtotal: subtotal,
      discount: discount,
      promoCode: promoUsed,
      tax: tax,
      total: total,
      status: status,
      paymentMethod: randomItem(["Transfer Bank", "GoPay", "OVO", "ShopeePay", "Kartu Kredit"]),
      createdAt: new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString() // booked 1 day earlier
    });
  }

  return {
    users,
    owners,
    fields,
    reviews,
    bookings,
    promos
  };
}
