// ==========================================
// CareTrack Clinic — Asosiy Server Fayli
// Tibbiy Yozuvlarni Boshqarish Tizimi (MRMS)
// ==========================================

const express = require('express'); // Express web server kutubxonasini yuklash
const session = require('express-session'); // Sessiyalarni boshqarish kutubxonasi
const path = require('path'); // Fayl manzillari bilan ishlash moduli
const bcrypt = require('bcryptjs'); // Parollarni xavfsiz shifrlash kutubxonasi
const axios = require('axios'); // Tashqi API bilan ishlash uchun HTTP client
const qr = require('qrcode'); // QR kod yaratish kutubxonasi
const { getDb, queryAll, queryOne, runSql } = require('./database'); // Baza yordamchi funksiyalari

// ===== EXPRESS ILOVASINI SOZLASH =====
const app = express(); // Express ilovasini yaratish
app.set('view engine', 'ejs'); // EJS shablon tizimini ulash
app.set('views', path.join(__dirname, 'views')); // Shablonlar papkasini sozlash
app.use(express.urlencoded({ extended: true })); // HTML form ma'lumotlarini o'qish
app.use(express.json()); // JSON ma'lumotlarini o'qish
app.use(express.static(path.join(__dirname, 'public'))); // Statik fayllar papkasi (CSS, JS)

// ===== SESSIYA SOZLAMALARI =====
app.use(session({
  secret: process.env.SESSION_SECRET || 'btec-secret-2026', // Sessiya maxfiy kaliti
  resave: false, // Har so'rovda qayta saqlamaslik
  saveUninitialized: false // Bo'sh sessiyalarni saqlamaslik
}));

// ===== GLOBAL MIDDLEWARE =====
// Barcha EJS shablonlarga umumiy o'zgaruvchilarni uzatish
app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Joriy foydalanuvchi
  res.locals.success = req.session.success || null; // Muvaffaqiyat xabari
  res.locals.error = req.session.error || null; // Xatolik xabari
  delete req.session.success; // Xabarni bir marta ko'rsatib o'chirish
  delete req.session.error; // Xabarni bir marta ko'rsatib o'chirish
  next(); // Keyingi funksiyaga o'tish
});

// ===== AUTENTIFIKATSIYA MIDDLEWARE =====
// Tizimga kirganlikni tekshirish
const isAuth = (req, res, next) => {
  if (req.session.user) return next(); // Kirgan bo'lsa — davom etish
  return res.redirect('/login'); // Kirmagan bo'lsa — login sahifaga
};

// Foydalanuvchi rolini tekshirish (admin, clinician, receptionist)
const roleCheck = (roles) => (req, res, next) => {
  if (req.session.user && roles.includes(req.session.user.role)) {
    return next(); // Ruxsat berilgan rol bo'lsa — davom
  }
  return res.status(403).render('error', { // Ruxsat yo'q — xato sahifasi
    title: 'Xato',
    message: 'Sizda ushbu sahifaga kirish huquqi yo\'q'
  });
};

// ===== YORDAMCHI FUNKSIYALAR (DRY PATTERN) =====
const helper = {
  // HTML sahifani render qilish qulayligi
  render: (res, view, opts) => res.render(view, opts),

  // INSERT/UPDATE so'rovini bajarish va yo'naltirish
  redirect: (req, res, sql, params, msg, url) => {
    if (sql) runSql(sql, params); // SQL bo'lsagina bajarish
    req.session.success = msg; // Muvaffaqiyat xabarini yozish
    res.redirect(url); // Berilgan manzilga yo'naltirish
  },

  // Jadvaldan yozuvni o'chirish (whitelist bilan himoyalangan)
  del: (req, res, table, url) => {
    const allowed = ['doctors', 'patients', 'illnesses', 'users']; // Ruxsat berilgan jadvallar
    if (!allowed.includes(table)) return res.redirect(url); // Noto'g'ri jadval — rad etish
    runSql(`DELETE FROM ${table} WHERE id=?`, [req.params.id]); // Yozuvni o'chirish
    req.session.success = 'Muvaffaqiyatli o\'chirildi'; // Xabar yozish
    res.redirect(url); // Ro'yxatga qaytish
  }
};

// ==========================================
// MARSHRUT (ROUTE) GURUHLARI
// ==========================================

// ===== BOSH SAHIFA =====
// Kirgan bo'lsa dashboard ga, kirmagan bo'lsa landing sahifaga
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('landing', { title: 'Bosh sahifa' });
});

// ===== LOGIN / LOGOUT =====
// GET: Login formani ko'rsatish
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard'); // Kirgan bo'lsa — dashboard ga
  res.render('login', { title: 'Kirish' }); // Login sahifasini ko'rsatish
});

// POST: Login ma'lumotlarini tekshirish
app.post('/login', (req, res) => {
  const { username, password } = req.body; // Form dan username va parolni olish

  // Kiritilmagan maydonlarni tekshirish
  if (!username || !password) {
    req.session.error = 'Username va parol kiritilishi shart';
    return res.redirect('/login');
  }

  const user = queryOne('SELECT * FROM users WHERE username=?', [username]); // Bazadan qidirish

  // Foydalanuvchi topilmadi yoki parol noto'g'ri
  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.session.error = 'Noto\'g\'ri username yoki parol';
    return res.redirect('/login');
  }

  // Sessiyaga foydalanuvchi ma'lumotlarini yozish
  req.session.user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  };

  req.session.success = `Xush kelibsiz, ${user.full_name}!`; // Tabrik xabari
  res.redirect('/dashboard'); // Boshqaruv paneliga yo'naltirish
});

// GET: Tizimdan chiqish
app.get('/logout', (req, res) => {
  req.session.destroy(); // Sessiyani to'liq tozalash
  res.redirect('/login'); // Login sahifaga qaytarish
});

// ===== QR KOD API =====
// Tashqi API: QR kod yaratish (Lecture talabi)
app.get('/api/qrcode', async (req, res) => {
  try {
    const text = req.query.text || 'CareTrack Clinic'; // QR kodga yoziladigan matn
    const qrData = await qr.toDataURL(text); // QR kodni Base64 formatiga aylantirish
    res.json({ qr: qrData }); // JSON formatda qaytarish
  } catch (err) {
    res.status(500).json({ error: 'QR kod yaratishda xato' }); // Xato yuz berganda
  }
});

// ===== BOSHQARUV PANELI (DASHBOARD) =====
app.get('/dashboard', isAuth, async (req, res) => {
  // Jadvallardan barcha ma'lumotlarni olish
  const doctors = queryAll('SELECT * FROM doctors');
  const patients = queryAll('SELECT * FROM patients');
  const illnesses = queryAll('SELECT * FROM illnesses');

  // Axios orqali tashqi API'dan sog'liq yangiliklari olish
  let healthTips = [];
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=3');
    healthTips = response.data.map(p => ({ title: p.title, body: p.body })); // .map array metodi
  } catch (err) {
    healthTips = [{ title: 'Sog\'lom turmush tarzi', body: 'Kuniga kamida 2 litr suv iching — bu organizmni tozalashga yordam beradi.' }];
  }

  // So'nggi tashxislar (JOIN orqali bemor va shifokor nomlari bilan)
  const recentIllnesses = queryAll(
    `SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name
     FROM illnesses i
     JOIN patients p ON i.patient_id=p.id
     JOIN doctors d ON i.doctor_id=d.id
     ORDER BY i.created_at DESC LIMIT 5`
  );

  // Kasallik holati statistikasi (GROUP BY bilan)
  const statusStats = queryAll('SELECT status, COUNT(*) as count FROM illnesses GROUP BY status');

  // Bemorlar jinsi statistikasi
  const genderStats = queryAll('SELECT gender, COUNT(*) as count FROM patients WHERE gender IS NOT NULL GROUP BY gender');

  // Shifokorlar ish yuki (LEFT JOIN bilan)
  const doctorWorkload = queryAll(
    `SELECT d.full_name as doctor_name, COUNT(i.id) as patient_count
     FROM doctors d LEFT JOIN illnesses i ON d.id=i.doctor_id
     GROUP BY d.id`
  );

  // Bemorlar yosh guruhlari statistikasi (.filter va .map array metodlari)
  const ages = patients
    .filter(p => p.date_of_birth) // Faqat tug'ilgan sanasi borlarni tanlash
    .map(p => new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()); // Yoshlarni hisoblash
  const ageStats = {
    '0-18': ages.filter(a => a <= 18).length, // Bolalar
    '19-35': ages.filter(a => a > 18 && a <= 35).length, // Yoshlar
    '36-50': ages.filter(a => a > 35 && a <= 50).length, // O'rta yosh
    '51+': ages.filter(a => a > 50).length // Kattalar
  };

  // Dashboard shabloniga barcha ma'lumotlarni uzatish
  res.render('dashboard', {
    title: 'Boshqaruv Paneli',
    stats: {
      doctors: doctors.length, // Shifokorlar soni
      patients: patients.length, // Bemorlar soni
      illnesses: illnesses.length, // Tashxislar soni
      activeIllnesses: illnesses.filter(i => i.status === 'Faol').length // Faol kasalliklar
    },
    recentIllnesses, // So'nggi tashxislar
    statusStats, // Holat statistikasi
    genderStats, // Jins statistikasi
    doctorWorkload, // Ish yuki
    ageStats, // Yosh statistikasi
    healthTips // Yangiliklar (Axios dan)
  });
});

// ===== SHIFOKORLAR CRUD =====

// GET: Shifokorlar ro'yxati
app.get('/doctors', isAuth, (req, res) => {
  const doctors = queryAll('SELECT * FROM doctors ORDER BY full_name'); // Barcha shifokorlar (tartibda)
  helper.render(res, 'doctors/index', { title: 'Shifokorlar', doctors });
});

// GET: Yangi shifokor yaratish formasi
app.get('/doctors/create', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  helper.render(res, 'doctors/create', { title: 'Yangi Shifokor' });
});

// POST: Yangi shifokorni bazaga saqlash
app.post('/doctors', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const { full_name, specialty, phone, email, experience_years, bio } = req.body; // Form ma'lumotlari

  // Majburiy maydonlarni tekshirish
  if (!full_name || !specialty) {
    req.session.error = 'Ism va mutaxassislik kiritilishi shart';
    return res.redirect('/doctors/create');
  }

  helper.redirect(req, res,
    'INSERT INTO doctors (full_name, specialty, phone, email, experience_years, bio) VALUES (?,?,?,?,?,?)',
    [full_name, specialty, phone || null, email || null, parseInt(experience_years) || 0, bio || null],
    'Shifokor muvaffaqiyatli qo\'shildi', '/doctors'
  );
});

// GET: Muayyan shifokor tafsilotlari (JOIN bilan)
app.get('/doctors/:id', isAuth, (req, res) => {
  const doctor = queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]); // Shifokorni topish

  // Shifokor topilmadi — xato va ro'yxatga qaytish
  if (!doctor) {
    req.session.error = 'Shifokor topilmadi';
    return res.redirect('/doctors');
  }

  // Shifokorga tegishli tashxislar (JOIN bilan bemor nomlari)
  const illnesses = queryAll(
    `SELECT i.*, p.full_name as patient_name
     FROM illnesses i JOIN patients p ON i.patient_id=p.id
     WHERE i.doctor_id=? ORDER BY i.diagnosed_date DESC`,
    [req.params.id]
  );

  // Nechta noyob bemor borligini hisoblash
  const result = queryOne('SELECT COUNT(DISTINCT patient_id) as count FROM illnesses WHERE doctor_id=?', [req.params.id]);
  const patientCount = result ? result.count : 0; // Null himoyasi

  helper.render(res, 'doctors/show', { title: doctor.full_name, doctor, illnesses, patientCount });
});

// GET: Shifokorni tahrirlash formasi
app.get('/doctors/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const doctor = queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]); // Shifokorni topish

  if (!doctor) {
    req.session.error = 'Shifokor topilmadi';
    return res.redirect('/doctors');
  }

  helper.render(res, 'doctors/edit', { title: 'Shifokorni Tahrirlash', doctor });
});

// POST: Shifokor ma'lumotlarini yangilash
app.post('/doctors/:id', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const { full_name, specialty, phone, email, experience_years, bio } = req.body;

  helper.redirect(req, res,
    'UPDATE doctors SET full_name=?, specialty=?, phone=?, email=?, experience_years=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [full_name, specialty, phone || null, email || null, parseInt(experience_years) || 0, bio || null, req.params.id],
    'Shifokor ma\'lumotlari yangilandi', `/doctors/${req.params.id}`
  );
});

// POST: Shifokorni o'chirish (faqat admin)
app.post('/doctors/:id/delete', isAuth, roleCheck(['admin']), (req, res) => {
  helper.del(req, res, 'doctors', '/doctors');
});

// ===== BEMORLAR CRUD =====

// GET: Bemorlar ro'yxati (LEFT JOIN bilan shifokor nomlari)
app.get('/patients', isAuth, (req, res) => {
  const patients = queryAll(
    `SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty
     FROM patients p LEFT JOIN doctors d ON p.doctor_id=d.id
     ORDER BY p.full_name`
  );
  helper.render(res, 'patients/index', { title: 'Bemorlar', patients });
});

// GET: Yangi bemor yaratish formasi
app.get('/patients/create', isAuth, (req, res) => {
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  helper.render(res, 'patients/create', { title: 'Yangi Bemor', doctors });
});

// POST: Yangi bemorni bazaga saqlash
app.post('/patients', isAuth, (req, res) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;

  // Ism majburiy maydon
  if (!full_name) {
    req.session.error = 'Bemor ismi kiritilishi shart';
    return res.redirect('/patients/create');
  }

  helper.redirect(req, res,
    'INSERT INTO patients (full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id) VALUES (?,?,?,?,?,?,?,?)',
    [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null],
    'Bemor muvaffaqiyatli ro\'yxatga olindi', '/patients'
  );
});

// GET: Muayyan bemor tafsilotlari (JOIN bilan)
app.get('/patients/:id', isAuth, (req, res) => {
  const patient = queryOne(
    `SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty
     FROM patients p LEFT JOIN doctors d ON p.doctor_id=d.id
     WHERE p.id=?`,
    [req.params.id]
  );

  // Bemor topilmadi
  if (!patient) {
    req.session.error = 'Bemor topilmadi';
    return res.redirect('/patients');
  }

  // Bemorning barcha tashxislari (JOIN bilan shifokor nomlari)
  const illnesses = queryAll(
    `SELECT i.*, d.full_name as doctor_name, d.specialty as doctor_specialty
     FROM illnesses i JOIN doctors d ON i.doctor_id=d.id
     WHERE i.patient_id=? ORDER BY i.diagnosed_date DESC`,
    [req.params.id]
  );

  helper.render(res, 'patients/show', { title: patient.full_name, patient, illnesses });
});

// GET: Bemorni tahrirlash formasi
app.get('/patients/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const patient = queryOne('SELECT * FROM patients WHERE id=?', [req.params.id]);

  if (!patient) {
    req.session.error = 'Bemor topilmadi';
    return res.redirect('/patients');
  }

  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  helper.render(res, 'patients/edit', { title: 'Bemorni Tahrirlash', patient, doctors });
});

// POST: Bemor ma'lumotlarini yangilash
app.post('/patients/:id', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;

  helper.redirect(req, res,
    'UPDATE patients SET full_name=?, date_of_birth=?, gender=?, phone=?, address=?, blood_type=?, emergency_contact=?, doctor_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null, req.params.id],
    'Bemor ma\'lumotlari yangilandi', `/patients/${req.params.id}`
  );
});

// POST: Bemorni o'chirish (faqat admin)
app.post('/patients/:id/delete', isAuth, roleCheck(['admin']), (req, res) => {
  helper.del(req, res, 'patients', '/patients');
});

// ===== TASHXISLAR (ILLNESSES) CRUD =====

// GET: Tashxislar ro'yxati (JOIN bilan bemor va shifokor nomlari)
app.get('/illnesses', isAuth, (req, res) => {
  const illnesses = queryAll(
    `SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name, d.specialty as doctor_specialty
     FROM illnesses i
     JOIN patients p ON i.patient_id=p.id
     JOIN doctors d ON i.doctor_id=d.id
     ORDER BY i.diagnosed_date DESC`
  );
  helper.render(res, 'illnesses/index', { title: 'Kasalliklar / Tashxislar', illnesses });
});

// GET: Yangi tashxis yaratish formasi
app.get('/illnesses/create', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  helper.render(res, 'illnesses/create', { title: 'Yangi Tashxis', patients, doctors });
});

// POST: Yangi tashxisni bazaga saqlash
app.post('/illnesses', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;

  // Majburiy maydonlarni tekshirish
  if (!patient_id || !doctor_id || !diagnosis) {
    req.session.error = 'Bemor, shifokor va tashxis kiritilishi shart';
    return res.redirect('/illnesses/create');
  }

  helper.redirect(req, res,
    'INSERT INTO illnesses (patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date) VALUES (?,?,?,?,?,?,?)',
    [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status || 'Faol', diagnosed_date || new Date().toISOString().split('T')[0]],
    'Tashxis muvaffaqiyatli qo\'shildi', '/illnesses'
  );
});

// GET: Tashxisni tahrirlash formasi
app.get('/illnesses/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const illness = queryOne('SELECT * FROM illnesses WHERE id=?', [req.params.id]);

  if (!illness) {
    req.session.error = 'Tashxis topilmadi';
    return res.redirect('/illnesses');
  }

  const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  helper.render(res, 'illnesses/edit', { title: 'Tashxisni Tahrirlash', illness, patients, doctors });
});

// POST: Tashxis ma'lumotlarini yangilash
app.post('/illnesses/:id', isAuth, roleCheck(['admin', 'clinician']), (req, res) => {
  const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;

  helper.redirect(req, res,
    'UPDATE illnesses SET patient_id=?, doctor_id=?, diagnosis=?, description=?, prescribed_meds=?, status=?, diagnosed_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status, diagnosed_date, req.params.id],
    'Tashxis muvaffaqiyatli yangilandi', '/illnesses'
  );
});

// POST: Tashxisni o'chirish (faqat admin)
app.post('/illnesses/:id/delete', isAuth, roleCheck(['admin']), (req, res) => {
  helper.del(req, res, 'illnesses', '/illnesses');
});

// ===== FOYDALANUVCHILAR CRUD (faqat Admin) =====

// GET: Foydalanuvchilar ro'yxati
app.get('/users', isAuth, roleCheck(['admin']), (req, res) => {
  const users = queryAll('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
  helper.render(res, 'users/index', { title: 'Foydalanuvchilar', users });
});

// GET: Yangi foydalanuvchi yaratish formasi
app.get('/users/create', isAuth, roleCheck(['admin']), (req, res) => {
  helper.render(res, 'users/create', { title: 'Yangi Foydalanuvchi' });
});

// POST: Yangi foydalanuvchini bazaga saqlash
app.post('/users', isAuth, roleCheck(['admin']), (req, res) => {
  const { username, password, full_name, role } = req.body; // Form ma'lumotlari

  // Majburiy maydonlarni tekshirish
  if (!username || !password || !full_name || !role) {
    req.session.error = 'Barcha maydonlar to\'ldirilishi shart';
    return res.redirect('/users/create');
  }

  // Username bandligini tekshirish
  const existing = queryOne('SELECT id FROM users WHERE username=?', [username]);
  if (existing) {
    req.session.error = 'Bu username allaqachon mavjud';
    return res.redirect('/users/create');
  }

  // Parolni shifrlash va saqlash
  const hashedPassword = bcrypt.hashSync(password, 10); // bcrypt bilan 10 salt round
  helper.redirect(req, res,
    'INSERT INTO users (username, password, full_name, role) VALUES (?,?,?,?)',
    [username, hashedPassword, full_name, role],
    'Foydalanuvchi muvaffaqiyatli yaratildi', '/users'
  );
});

// GET: Foydalanuvchini tahrirlash formasi
app.get('/users/:id/edit', isAuth, roleCheck(['admin']), (req, res) => {
  const editUser = queryOne('SELECT id, username, full_name, role FROM users WHERE id=?', [req.params.id]);

  if (!editUser) {
    req.session.error = 'Foydalanuvchi topilmadi';
    return res.redirect('/users');
  }

  helper.render(res, 'users/edit', { title: 'Foydalanuvchini Tahrirlash', editUser });
});

// POST: Foydalanuvchi ma'lumotlarini yangilash
app.post('/users/:id', isAuth, roleCheck(['admin']), (req, res) => {
  const { username, password, full_name, role } = req.body;

  // Agar yangi parol kiritilgan bo'lsa — parolni ham yangilash
  if (password && password.trim()) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    helper.redirect(req, res,
      'UPDATE users SET username=?, password=?, full_name=?, role=? WHERE id=?',
      [username, hashedPassword, full_name, role, req.params.id],
      'Foydalanuvchi yangilandi', '/users'
    );
  } else {
    // Parolsiz yangilash
    helper.redirect(req, res,
      'UPDATE users SET username=?, full_name=?, role=? WHERE id=?',
      [username, full_name, role, req.params.id],
      'Foydalanuvchi yangilandi', '/users'
    );
  }
});

// POST: Foydalanuvchini o'chirish (o'zini o'zini o'chirish taqiqlangan)
app.post('/users/:id/delete', isAuth, roleCheck(['admin']), (req, res) => {
  // O'zini o'zi o'chirish himoyasi
  if (parseInt(req.params.id) === req.session.user.id) {
    req.session.error = 'O\'zingizni o\'chira olmaysiz';
    return res.redirect('/users');
  }
  helper.del(req, res, 'users', '/users');
});

// ===== 404 HANDLER =====
// Barcha topilmagan sahifalar uchun xato sahifasini ko'rsatish
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Sahifa topilmadi',
    message: 'Siz qidirgan sahifa mavjud emas yoki o\'chirilgan'
  });
});

// ===== SERVERNI ISHGA TUSHIRISH =====
const PORT = process.env.PORT || 3001; // Port raqami
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🏥 CareTrack Clinic MRMS ishlayapti: http://localhost:${PORT}`);
    console.log('📋 Admin login: admin / admin123\n');
  });
});
