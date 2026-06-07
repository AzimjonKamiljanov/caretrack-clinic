// ==========================================
// CareTrack Clinic — Namuna Ma'lumotlar (Seed)
// Bazaga test uchun boshlang'ich ma'lumot kiritish
// ==========================================

const { getDb, runSql, queryAll } = require('./database'); // Baza funksiyalarini yuklash
const bcrypt = require('bcryptjs'); // Parolni shifrlash uchun kutubxona

async function seed() { // Asinxron seed funksiyasi
  console.log('🌱 Ma\'lumotlar bazasiga namuna ma\'lumotlar kiritilmoqda...\n'); // Boshlash xabari

  const db = await getDb(); // Bazani ishga tushirish (jadvallar yaratiladi)

  // ===== ESKI MA'LUMOTLARNI TOZALASH =====
  runSql('DELETE FROM illnesses'); // Barcha tashxislarni o'chirish
  runSql('DELETE FROM patients'); // Barcha bemorlarni o'chirish
  runSql('DELETE FROM doctors'); // Barcha shifokorlarni o'chirish
  runSql('DELETE FROM users'); // Barcha foydalanuvchilarni o'chirish
  try { // Auto-increment raqamlarni qayta boshlash
    runSql("DELETE FROM sqlite_sequence WHERE name IN ('users', 'doctors', 'patients', 'illnesses')");
  } catch (e) {} // Xatolik bo'lsa e'tiborsiz qoldirish (birinchi ishga tushirishda)

  // ===== FOYDALANUVCHILAR (3 ta rol) =====
  const hash = (pwd) => bcrypt.hashSync(pwd, 10); // Parolni shifrlash funksiyasi

  const users = [ // [username, parol_hash, to'liq_ism, rol]
    ['admin', hash('admin123'), 'Abdullayev Jasur', 'admin'], // Administrator
    ['doctor1', hash('doctor123'), 'Dr. Karimov Aziz', 'clinician'], // Shifokor (klinitsist)
    ['doctor2', hash('doctor123'), 'Dr. Rahimova Nilufar', 'clinician'], // Shifokor (klinitsist)
    ['reception1', hash('recep123'), 'Toshmatova Dilfuza', 'receptionist'], // Qabulxona xodimi
  ];

  users.forEach(u => { // Har bir foydalanuvchini bazaga kiritish
    runSql('INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', u);
  });
  console.log(`✅ ${users.length} ta foydalanuvchi qo'shildi`); // Natija xabari

  // ===== SHIFOKORLAR (6 ta) =====
  const doctors = [ // [ism, mutaxassislik, telefon, email, tajriba_yili, biografiya]
    ['Dr. Karimov Aziz', 'Terapevt', '+998901234567', 'karimov@caretrack.uz', 12, 'Ichki kasalliklar bo\'yicha tajribali mutaxassis. ToshMI bitiruvchisi.'],
    ['Dr. Rahimova Nilufar', 'Kardiolog', '+998901234568', 'rahimova@caretrack.uz', 8, 'Yurak-qon tomir kasalliklari bo\'yicha mutaxassis.'],
    ['Dr. Umarov Bekzod', 'Nevropatolog', '+998901234569', 'umarov@caretrack.uz', 15, 'Asab tizimi kasalliklari bo\'yicha professor.'],
    ['Dr. Saidova Malika', 'Pediatr', '+998901234570', 'saidova@caretrack.uz', 6, 'Bolalar kasalliklari bo\'yicha tajribali shifokor.'],
    ['Dr. Xasanov Otabek', 'Ortoped', '+998901234571', 'xasanov@caretrack.uz', 10, 'Suyak va bo\'g\'im kasalliklari bo\'yicha mutaxassis.'],
    ['Dr. Yusupova Gavhar', 'Dermatolog', '+998901234572', 'yusupova@caretrack.uz', 7, 'Teri kasalliklari bo\'yicha mutaxassis.'],
  ];

  doctors.forEach(d => { // Har bir shifokorni bazaga kiritish
    runSql('INSERT INTO doctors (full_name, specialty, phone, email, experience_years, bio) VALUES (?, ?, ?, ?, ?, ?)', d);
  });
  console.log(`✅ ${doctors.length} ta shifokor qo'shildi`); // Natija xabari

  // ===== BEMORLAR (8 ta, har biri shifokorga biriktirilgan) =====
  const patients = [ // [ism, tug'ilgan_sana, jinsi, telefon, manzil, qon_guruhi, favqulodda_aloqa, doctor_id]
    ['Aliyev Sardor', '1990-03-15', 'Erkak', '+998931112233', 'Toshkent, Chilonzor tumani, 7-mavze', 'A+', '+998931112234', 1],
    ['Karimova Zilola', '1985-07-22', 'Ayol', '+998932223344', 'Toshkent, Yakkasaroy tumani', 'B+', '+998932223345', 1],
    ['Rahmonov Jasur', '1978-11-08', 'Erkak', '+998933334455', 'Samarqand, Registon ko\'chasi', 'O-', '+998933334456', 3],
    ['Toshmatova Nargiza', '1995-01-30', 'Ayol', '+998934445566', 'Buxoro, Navoiy ko\'chasi 12', 'AB+', '+998934445567', 4],
    ['Mirzayev Ulugbek', '2000-06-14', 'Erkak', '+998935556677', 'Toshkent, Mirzo Ulug\'bek tumani', 'A-', '+998935556678', 1],
    ['Qosimova Hulkar', '1988-09-03', 'Ayol', '+998936667788', 'Namangan, Mustaqillik ko\'chasi', 'B-', '+998936667789', 5],
    ['Abdullayev Firdavs', '1972-12-25', 'Erkak', '+998937778899', 'Andijon, Bobur shox ko\'chasi', 'O+', '+998937778800', 2],
    ['Yusupova Kamola', '1998-04-18', 'Ayol', '+998938889900', 'Toshkent, Sergeli tumani', 'A+', '+998938889901', 4],
  ];

  patients.forEach(p => { // Har bir bemorni bazaga kiritish
    runSql('INSERT INTO patients (full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);
  });
  console.log(`✅ ${patients.length} ta bemor qo'shildi`); // Natija xabari

  // ===== KASALLIKLAR / TASHXISLAR (10 ta, bemor va shifokorga bog'langan) =====
  const illnesses = [ // [bemor_id, shifokor_id, tashxis, tavsif, dorilar, holat, sana]
    [1, 1, 'Gripp', 'Yuqori harorat, yo\'tal va bosh og\'rig\'i bilan murojaat qilgan', 'Paracetamol 500mg, Vitamin C', 'Tuzalgan', '2026-01-15'],
    [1, 2, 'Gipertoniya', 'Qon bosimi 160/100, bosh aylanishi', 'Amlodipine 5mg, Lisinopril 10mg', 'Davolanmoqda', '2026-03-20'],
    [2, 1, 'Bronxit', 'Surunkali yo\'tal, nafas qisilishi', 'Amoxicillin 500mg, Bromhexine', 'Faol', '2026-04-10'],
    [3, 3, 'Migren', 'Kuchli bosh og\'rig\'i, ko\'z oldida nuqtalar', 'Sumatriptan 50mg, Ibuprofen', 'Davolanmoqda', '2026-02-28'],
    [4, 4, 'Angina', 'Tomoq og\'rig\'i, yutishda qiyinchilik, isitma', 'Azithromycin 500mg, Tantum Verde', 'Tuzalgan', '2026-03-05'],
    [5, 1, 'Gastrit', 'Oshqozon og\'rig\'i, ko\'ngil aynishi', 'Omeprazole 20mg, Antacid', 'Faol', '2026-05-01'],
    [6, 5, 'Osteoartroz', 'Tizza bo\'g\'imida og\'riq va shishish', 'Diclofenac 50mg, Glucosamine', 'Davolanmoqda', '2026-04-22'],
    [7, 2, 'Aritmiya', 'Yurak urishi notekisligi, horg\'inlik', 'Metoprolol 25mg, Aspirin', 'Faol', '2026-05-10'],
    [2, 6, 'Dermatit', 'Teri qichishi va qizarishi', 'Hydrocortisone krem, Cetirizine', 'Davolanmoqda', '2026-05-15'],
    [8, 4, 'ORVI', 'Burun bitishi, yo\'tal, umumiy holsizlik', 'Paracetamol, burun tomchilari', 'Faol', '2026-05-20'],
  ];

  illnesses.forEach(i => { // Har bir tashxisni bazaga kiritish
    runSql('INSERT INTO illnesses (patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date) VALUES (?, ?, ?, ?, ?, ?, ?)', i);
  });
  console.log(`✅ ${illnesses.length} ta kasallik/tashxis qo'shildi`); // Natija xabari

  // ===== YAKUNIY XABAR =====
  console.log('\n🎉 Barcha namuna ma\'lumotlar muvaffaqiyatli kiritildi!'); // Muvaffaqiyat xabari
  console.log('\n📋 Login ma\'lumotlari:'); // Login ma'lumotlari
  console.log('   Admin:       admin / admin123'); // Admin login
  console.log('   Klinitsist:  doctor1 / doctor123'); // Shifokor login
  console.log('   Qabulxona:   reception1 / recep123'); // Qabulxona login
}

seed().catch(err => { // Seed funksiyasini ishga tushirish
  console.error('Xatolik:', err); // Xatolik bo'lsa — chiqarish
  process.exit(1); // Dasturni to'xtatish
});
