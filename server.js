const express = require('express'); // Express web server kutubxonasini yuklash
const session = require('express-session'); // Sessiyalarni boshqarish kutubxonasini yuklash
const path = require('path'); // Fayl manzillari bilan ishlash moduli
const bcrypt = require('bcryptjs'); // Parollarni xavfsiz shifrlash kutubxonasi
const axios = require('axios'); // Tashqi API bilan ishlash uchun Axios
const qr = require('qrcode'); // QR kod yaratish kutubxonasini yuklash
const { getDb, queryAll, queryOne, runSql } = require('./database'); // Ma'lumotlar bazasi yordamchi funksiyalari

const app = express(); // Express ilovasini yaratish
app.set('view engine', 'ejs'); // EJS shablon tizimini ulash
app.set('views', path.join(__dirname, 'views')); // Shablonlar papkasini sozlash
app.use(express.urlencoded({ extended: true })); // HTML form ma'lumotlarini o'qish
app.use(express.json()); // JSON ma'lumotlarini o'qish
app.use(express.static(path.join(__dirname, 'public'))); // Statik fayllar papkasi
app.use(session({ secret: 'btec-secret-2026', resave: false, saveUninitialized: false })); // Sessiyani maxfiy kalit bilan sozlash

app.use((req, res, next) => { // Global middleware: barcha EJS fayllar uchun
  res.locals.user = req.session.user || null; // Foydalanuvchini uzatish
  res.locals.success = req.session.success || null; delete req.session.success; // Muvaffaqiyat xabari
  res.locals.error = req.session.error || null; delete req.session.error; // Xatolik xabari
  next(); // Keyingi funksiyaga o'tish
}); // Global middleware tugadi

const isAuth = (req, res, next) => req.session.user ? next() : res.redirect('/login'); // Tizimga kirganlikni tekshirish
const roleCheck = (roles) => (req, res, next) => (req.session.user && roles.includes(req.session.user.role)) ? next() : res.status(403).render('error', { title: 'Xato', message: 'Ruxsat yo\'q', user: req.session.user }); // Rollarni tekshirish

app.route('/login') // Login uchun marshrut zanjiri
  .get((req, res) => req.session.user ? res.redirect('/dashboard') : res.render('login', { title: 'Kirish' })) // GET: Formani ko'rsatish
  .post((req, res) => { // POST: Ma'lumotlarni tekshirish
    const user = queryOne('SELECT * FROM users WHERE username=?', [req.body.username]); // Bazadan qidirish
    if (user && bcrypt.compareSync(req.body.password, user.password)) { // Parolni bcrypt bilan tekshirish
      req.session.user = { id: user.id, username: user.username, full_name: user.full_name, role: user.role }; // Sessiyaga yozish
      req.session.success = 'Xush kelibsiz!'; return res.redirect('/dashboard'); // Dashboardga yo'naltirish
    } // Tekshiruv tugadi
    req.session.error = 'Xato login yoki parol'; res.redirect('/login'); // Xatolik qaytarish
  }); // Login zanjiri tugadi

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); }); // Tizimdan chiqish
app.get('/', (req, res) => req.session.user ? res.redirect('/dashboard') : res.render('landing', { title: 'Bosh sahifa' })); // Asosiy sahifa

app.get('/api/qrcode', async (req, res) => { // Lecture API: QR kod yaratish marshruti
  try { res.json({ qr: await qr.toDataURL(req.query.text || 'CareTrack Clinic') }); } // QR kodni Base64 formatida qaytarish
  catch (err) { res.status(500).json({ error: 'QR kod yaratishda xato' }); } // Xato yuz berganda
}); // API tugadi

app.get('/dashboard', isAuth, async (req, res) => { // Boshqaruv paneli marshruti
  const data = { doctors: queryAll('SELECT * FROM doctors'), patients: queryAll('SELECT * FROM patients'), illnesses: queryAll('SELECT * FROM illnesses') }; // Jadvallarni o'qish
  const healthTips = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=3').then(r => r.data.map(p => ({ title: p.title, body: p.body }))).catch(() => [{ title: 'Sog\'lom', body: 'Suv ichish foydali' }]); // Axios bilan yangiliklar olish va .map yordamida formatlash
  res.render('dashboard', { // Dashboard shablonini ko'rsatish
    title: 'Boshqaruv Paneli', // Sarlavha
    stats: { doctors: data.doctors.length, patients: data.patients.length, illnesses: data.illnesses.length, activeIllnesses: data.illnesses.filter(i => i.status === 'Faol').length }, // Raqamli statistika (.filter array metodi)
    recentIllnesses: queryAll('SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name FROM illnesses i JOIN patients p ON i.patient_id=p.id JOIN doctors d ON i.doctor_id=d.id ORDER BY i.created_at DESC LIMIT 5'), // So'nggi tashxislar qatori
    statusStats: queryAll('SELECT status, COUNT(*) as count FROM illnesses GROUP BY status'), // Holat statistikasi
    genderStats: queryAll('SELECT gender, COUNT(*) as count FROM patients WHERE gender IS NOT NULL GROUP BY gender'), // Jins statistikasi
    doctorWorkload: queryAll('SELECT d.full_name as doctor_name, COUNT(i.id) as patient_count FROM doctors d LEFT JOIN illnesses i ON d.id=i.doctor_id GROUP BY d.id'), // Shifokorlar ish yuki
    ageStats: (() => { // Bemorlar yoshini hisoblash funksiyasi
      const ages = data.patients.filter(p => p.date_of_birth).map(p => new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()); // .filter va .map array metodlari orqali yoshlarni topish
      return { '0-18': ages.filter(a => a <= 18).length, '19-35': ages.filter(a => a > 18 && a <= 35).length, '36-50': ages.filter(a => a > 35 && a <= 50).length, '51+': ages.filter(a => a > 50).length }; // Yosh guruhlari boyicha sanash
    })(), // Funksiyani chaqirish
    healthTips // Yangiliklarni uzatish
  }); // Render tugadi
}); // Dashboard tugadi

const helper = { // Qaytariluvchi kodlarni qisqartirish uchun yordamchi DRY (Don't Repeat Yourself) obyekt
  render: (res, view, opts) => res.render(view, opts), // HTML sahifani render qilish qulayligi
  post: (req, res, sql, params, msg, url) => { runSql(sql, params); req.session.success = msg; res.redirect(url); }, // INSERT/UPDATE so'rovlarini bajarish va yo'naltirish
  del: (req, res, table, url) => { runSql(`DELETE FROM ${table} WHERE id=?`, [req.params.id]); req.session.success = 'O\'chirildi'; res.redirect(url); } // O'chirish qulayligi
}; // Yordamchi obyekt tugadi

app.route('/doctors') // Shifokorlar marshrut zanjiri
  .get(isAuth, (req, res) => helper.render(res, 'doctors/index', { title: 'Shifokorlar', doctors: queryAll('SELECT * FROM doctors ORDER BY full_name') })) // GET: Shifokorlar ro'yxati
  .post(isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.post(req, res, 'INSERT INTO doctors (full_name, specialty, phone, email, experience_years, bio) VALUES (?,?,?,?,?,?)', [req.body.full_name, req.body.specialty, req.body.phone, req.body.email, req.body.experience_years, req.body.bio], 'Qo\'shildi', '/doctors')); // POST: Yangi qo'shish
app.get('/doctors/create', isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.render(res, 'doctors/create', { title: 'Yangi' })); // GET: Yaratish formasi
app.route('/doctors/:id') // Muayyan shifokor marshruti zanjiri
  .get(isAuth, (req, res) => helper.render(res, 'doctors/show', { title: 'Shifokor', doctor: queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]), illnesses: queryAll('SELECT i.*, p.full_name as patient_name FROM illnesses i JOIN patients p ON i.patient_id=p.id WHERE i.doctor_id=?', [req.params.id]), patientCount: queryOne('SELECT COUNT(DISTINCT patient_id) as count FROM illnesses WHERE doctor_id=?', [req.params.id]).count })) // GET: Shifokor tafsiloti
  .post(isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.post(req, res, 'UPDATE doctors SET full_name=?, specialty=?, phone=?, email=?, experience_years=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.full_name, req.body.specialty, req.body.phone, req.body.email, req.body.experience_years, req.body.bio, req.params.id], 'Yangilandi', `/doctors/${req.params.id}`)); // POST: Tahrirlashni saqlash
app.get('/doctors/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.render(res, 'doctors/edit', { title: 'Tahrir', doctor: queryOne('SELECT * FROM doctors WHERE id=?', [req.params.id]) })); // GET: Tahrir formasi
app.post('/doctors/:id/delete', isAuth, roleCheck(['admin']), (req, res) => helper.del(req, res, 'doctors', '/doctors')); // POST: Shifokorni o'chirish

app.route('/patients') // Bemorlar marshrut zanjiri
  .get(isAuth, (req, res) => helper.render(res, 'patients/index', { title: 'Bemorlar', patients: queryAll('SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty FROM patients p LEFT JOIN doctors d ON p.doctor_id=d.id ORDER BY p.full_name') })) // GET: Bemorlar ro'yxati
  .post(isAuth, (req, res) => helper.post(req, res, 'INSERT INTO patients (full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id) VALUES (?,?,?,?,?,?,?,?)', [req.body.full_name, req.body.date_of_birth, req.body.gender, req.body.phone, req.body.address, req.body.blood_type, req.body.emergency_contact, req.body.doctor_id], 'Ro\'yxatga olindi', '/patients')); // POST: Bemor qo'shish
app.get('/patients/create', isAuth, (req, res) => helper.render(res, 'patients/create', { title: 'Yangi', doctors: queryAll('SELECT * FROM doctors ORDER BY full_name') })); // GET: Yaratish formasi
app.route('/patients/:id') // Muayyan bemor zanjiri
  .get(isAuth, (req, res) => helper.render(res, 'patients/show', { title: 'Bemor', patient: queryOne('SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty FROM patients p LEFT JOIN doctors d ON p.doctor_id=d.id WHERE p.id=?', [req.params.id]), illnesses: queryAll('SELECT i.*, d.full_name as doctor_name, d.specialty as doctor_specialty FROM illnesses i JOIN doctors d ON i.doctor_id=d.id WHERE i.patient_id=? ORDER BY i.diagnosed_date DESC', [req.params.id]) })) // GET: Bemor tafsiloti
  .post(isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.post(req, res, 'UPDATE patients SET full_name=?, date_of_birth=?, gender=?, phone=?, address=?, blood_type=?, emergency_contact=?, doctor_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.full_name, req.body.date_of_birth, req.body.gender, req.body.phone, req.body.address, req.body.blood_type, req.body.emergency_contact, req.body.doctor_id, req.params.id], 'Yangilandi', `/patients/${req.params.id}`)); // POST: Tahrirlashni saqlash
app.get('/patients/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.render(res, 'patients/edit', { title: 'Tahrir', patient: queryOne('SELECT * FROM patients WHERE id=?', [req.params.id]), doctors: queryAll('SELECT * FROM doctors ORDER BY full_name') })); // GET: Tahrir formasi
app.post('/patients/:id/delete', isAuth, roleCheck(['admin']), (req, res) => helper.del(req, res, 'patients', '/patients')); // POST: O'chirish

app.route('/illnesses') // Tashxislar marshrut zanjiri
  .get(isAuth, (req, res) => helper.render(res, 'illnesses/index', { title: 'Tashxislar', illnesses: queryAll('SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name, d.specialty as doctor_specialty FROM illnesses i JOIN patients p ON i.patient_id=p.id JOIN doctors d ON i.doctor_id=d.id ORDER BY i.diagnosed_date DESC') })) // GET: Tashxislar ro'yxati
  .post(isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.post(req, res, 'INSERT INTO illnesses (patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date) VALUES (?,?,?,?,?,?,?)', [req.body.patient_id, req.body.doctor_id, req.body.diagnosis, req.body.description, req.body.prescribed_meds, req.body.status, req.body.diagnosed_date], 'Qo\'shildi', '/illnesses')); // POST: Tashxis qo'shish
app.get('/illnesses/create', isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.render(res, 'illnesses/create', { title: 'Yangi', patients: queryAll('SELECT * FROM patients ORDER BY full_name'), doctors: queryAll('SELECT * FROM doctors ORDER BY full_name') })); // GET: Yaratish formasi
app.route('/illnesses/:id') // Muayyan tashxis zanjiri
  .post(isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.post(req, res, 'UPDATE illnesses SET patient_id=?, doctor_id=?, diagnosis=?, description=?, prescribed_meds=?, status=?, diagnosed_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.patient_id, req.body.doctor_id, req.body.diagnosis, req.body.description, req.body.prescribed_meds, req.body.status, req.body.diagnosed_date, req.params.id], 'Yangilandi', '/illnesses')); // POST: Tahrirlashni saqlash
app.get('/illnesses/:id/edit', isAuth, roleCheck(['admin', 'clinician']), (req, res) => helper.render(res, 'illnesses/edit', { title: 'Tahrir', illness: queryOne('SELECT * FROM illnesses WHERE id=?', [req.params.id]), patients: queryAll('SELECT * FROM patients ORDER BY full_name'), doctors: queryAll('SELECT * FROM doctors ORDER BY full_name') })); // GET: Tahrir formasi
app.post('/illnesses/:id/delete', isAuth, roleCheck(['admin']), (req, res) => helper.del(req, res, 'illnesses', '/illnesses')); // POST: O'chirish

app.route('/users') // Foydalanuvchilar zanjiri (Faqat Admin)
  .get(isAuth, roleCheck(['admin']), (req, res) => helper.render(res, 'users/index', { title: 'Foydalanuvchilar', users: queryAll('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC') })) // GET: Ro'yxat
  .post(isAuth, roleCheck(['admin']), (req, res) => queryOne('SELECT id FROM users WHERE username=?', [req.body.username]) ? helper.post(req, res, '', [], 'Username band', '/users/create') : helper.post(req, res, 'INSERT INTO users (username, password, full_name, role) VALUES (?,?,?,?)', [req.body.username, bcrypt.hashSync(req.body.password, 10), req.body.full_name, req.body.role], 'Yaratildi', '/users')); // POST: Yangi foydalanuvchi saqlash (bandligini tekshirish bilan)
app.get('/users/create', isAuth, roleCheck(['admin']), (req, res) => helper.render(res, 'users/create', { title: 'Yangi' })); // GET: Yaratish formasi
app.route('/users/:id') // Muayyan foydalanuvchi tahriri
  .post(isAuth, roleCheck(['admin']), (req, res) => req.body.password ? helper.post(req, res, 'UPDATE users SET username=?, password=?, full_name=?, role=? WHERE id=?', [req.body.username, bcrypt.hashSync(req.body.password, 10), req.body.full_name, req.body.role, req.params.id], 'Yangilandi', '/users') : helper.post(req, res, 'UPDATE users SET username=?, full_name=?, role=? WHERE id=?', [req.body.username, req.body.full_name, req.body.role, req.params.id], 'Yangilandi', '/users')); // POST: Parol bor-yo'qligiga qarab yangilash
app.get('/users/:id/edit', isAuth, roleCheck(['admin']), (req, res) => helper.render(res, 'users/edit', { title: 'Tahrir', editUser: queryOne('SELECT id, username, full_name, role FROM users WHERE id=?', [req.params.id]) })); // GET: Tahrir formasi
app.post('/users/:id/delete', isAuth, roleCheck(['admin']), (req, res) => parseInt(req.params.id) === req.session.user.id ? helper.post(req, res, '', [], 'O\'zni o\'chirish taqiqlangan', '/users') : helper.del(req, res, 'users', '/users')); // POST: O'chirish

app.use((req, res) => res.status(404).render('error', { title: 'Xato', message: 'Sahifa yo\'q', user: req.session.user || null })); // 404 Barcha topilmagan sahifalar uchun handler
getDb().then(() => app.listen(process.env.PORT || 3001, () => console.log(`\n🏥 MRMS ishlayapti: http://localhost:${process.env.PORT || 3001}`))); // Bazaga ulanib serverni ishga tushirish
