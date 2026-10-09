// ==========================================
// CareTrack Clinic — Ma'lumotlar Bazasi Moduli
// sql.js kutubxonasi yordamida SQLite baza boshqaruvi
// ==========================================

import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '../../caretrack.db');
let db: any = null;

// ===== BAZANI ISHGA TUSHIRISH =====
// Bazani yuklash yoki yangi yaratish va jadvallarni tekshirish
async function getDb() {
  if (db) return db; // Agar baza allaqachon yuklangan bo'lsa — qaytarish

  const SQL = await initSqlJs(); // sql.js kutubxonasini asinxron ishga tushirish

  // Fayl mavjud bo'lsa — undan yuklash, yo'qsa — yangi bo'sh baza yaratish
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON'); // Tashqi kalitlar himoyasini yoqish

  // ===== JADVALLAR YARATISH =====
  const tables = [
    // Appointments table
    `CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date DATETIME NOT NULL,
      status TEXT DEFAULT 'Scheduled' CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )`,

    // Foydalanuvchilar jadvali (login, parol, rol)
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'clinician', 'receptionist')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Shifokorlar jadvali (mutaxassislik, tajriba, bio)
    `CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      experience_years INTEGER DEFAULT 0,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Bemorlar jadvali (shaxsiy ma'lumotlar, qon guruhi, shifokor)
    `CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('Erkak', 'Ayol')),
      phone TEXT,
      address TEXT,
      blood_type TEXT,
      emergency_contact TEXT,
      doctor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
    )`,

    // Tashxislar jadvali (kasallik, dori, holat)
    `CREATE TABLE IF NOT EXISTS illnesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      diagnosis TEXT NOT NULL,
      description TEXT,
      prescribed_meds TEXT,
      status TEXT DEFAULT 'Faol' CHECK(status IN ('Faol', 'Davolanmoqda', 'Tuzalgan')),
      diagnosed_date TEXT DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    )`
  ];

  // Barcha jadvallarni tsikl orqali yaratish
  tables.forEach(sql => db.run(sql));

  saveDb(); // Bazani faylga saqlash
  return db; // Baza obyektini qaytarish
}

// ===== BAZANI FAYLGA SAQLASH =====
// Xotiradagi nusxani .db fayliga yozish
const saveDb = () => {
  if (db) fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
};

// ===== BARCHA NATIJALARNI OLISH (SELECT) =====
// SQL so'rovni bajarib, barcha mos qatorlarni massiv sifatida qaytarish
const queryAll = (sql: string, params: any[] = []) => {
  if (!db) return []; // Baza tayyor emas bo'lsa — bo'sh massiv qaytarish
  const stmt = db.prepare(sql); // SQL so'rovni tayyorlash
  if (params.length) stmt.bind(params); // Parametrlarni ulash
  const results: any[] = []; // Natijalar massivi
  while (stmt.step()) results.push(stmt.getAsObject()); // Har bir qatorni obyektga aylantirish
  stmt.free(); // Xotirani tozalash
  return results; // Natijalarni qaytarish
};

// ===== BITTA NATIJANI OLISH =====
// queryAll natijasining faqat birinchi elementini qaytarish (yoki null)
const queryOne = (sql: string, params: any[] = []) => {
  return queryAll(sql, params)[0] || null;
};

// ===== INSERT/UPDATE/DELETE BAJARISH =====
// Ma'lumotlarni o'zgartiruvchi SQL buyruqlarini bajarish va bazani saqlash
const runSql = (sql: string, params: any[] = []) => {
  if (!db) return { changes: 0 }; // Baza tayyor emas bo'lsa
  db.run(sql, params); // SQL buyruqni bajarish
  saveDb(); // O'zgarishlarni faylga saqlash
  return { changes: db.getRowsModified() }; // Nechta qator o'zgarganini qaytarish
};

// ===== EKSPORT =====
// Boshqa fayllar (server.js, seed.js) foydalanishi uchun eksport
export { getDb, queryAll, queryOne, runSql, saveDb, db };
