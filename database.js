const initSqlJs = require('sql.js'); // SQL xotira bazasini yuklash (sql.js)
const fs = require('fs'); // Fayllarni o'qish/yozish moduli
const path = require('path'); // Fayl manzillarini ishlash moduli
const DB_PATH = path.join(__dirname, 'caretrack.db'); // Ma'lumotlar bazasi faylining joylashuvi
let db = null; // Baza obyektini saqlash uchun o'zgaruvchi

async function getDb() { // Ma'lumotlar bazasini ishga tushirish va jadvallarni tekshirish funksiyasi
  if (db) return db; // Agar baza mavjud bo'lsa darhol qaytarish
  const SQL = await initSqlJs(); // sql.js kutubxonasini asinxron ishga tushirish
  db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database(); // Fayl bo'lsa undan, yo'qsa yangi bo'sh baza yaratish
  db.run('PRAGMA foreign_keys = ON'); // Tashqi kalitlar (foreign keys) himoyasini yoqish
  const tables = [ // Yaratiladigan barcha jadvallar SQL kodlari massivi
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, full_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin', 'clinician', 'receptionist')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`, // Foydalanuvchilar jadvali
    `CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, specialty TEXT NOT NULL, phone TEXT, email TEXT, experience_years INTEGER DEFAULT 0, bio TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`, // Shifokorlar jadvali
    `CREATE TABLE IF NOT EXISTS patients (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, date_of_birth TEXT, gender TEXT CHECK(gender IN ('Erkak', 'Ayol')), phone TEXT, address TEXT, blood_type TEXT, emergency_contact TEXT, doctor_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL)`, // Bemorlar jadvali
    `CREATE TABLE IF NOT EXISTS illnesses (id INTEGER PRIMARY KEY AUTOINCREMENT, patient_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, diagnosis TEXT NOT NULL, description TEXT, prescribed_meds TEXT, status TEXT DEFAULT 'Faol' CHECK(status IN ('Faol', 'Davolanmoqda', 'Tuzalgan')), diagnosed_date TEXT DEFAULT (date('now')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE, FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE)` // Tashxislar jadvali
  ]; // Massiv yakunlandi
  tables.forEach(sql => db.run(sql)); // Jadvallarni tsikl orqali bazaga yaratish
  saveDb(); return db; // Bazani faylga saqlash va natijani qaytarish
} // getDb funksiyasi tugadi

const saveDb = () => db && fs.writeFileSync(DB_PATH, Buffer.from(db.export())); // Baza o'zgarganda xotiradagi nusxani faylga yozish funksiyasi
const queryAll = (sql, params = []) => { // Barcha mos natijalarni olish funksiyasi (SELECT yordamchisi)
  const stmt = db.prepare(sql); if (params.length) stmt.bind(params); // SQL so'rovni tayyorlash va parametrlarni ulash
  const res = []; while (stmt.step()) res.push(stmt.getAsObject()); // Barcha qatorlarni aylanib obyekt massiviga yig'ish
  stmt.free(); return res; // Xotirani tozalash va natijani qaytarish
}; // queryAll tugadi

const queryOne = (sql, params = []) => queryAll(sql, params)[0] || null; // queryAll natijasining faqat birinchisini (yoki null) qaytarish
const runSql = (sql, params = []) => { db.run(sql, params); saveDb(); return { changes: db.getRowsModified() }; }; // INSERT/UPDATE/DELETE buyruqlarini bajarish va bazani saqlash

module.exports = { getDb, queryAll, queryOne, runSql, saveDb }; // Funksiyalarni boshqa fayllar foydalanishi uchun eksport qilish
