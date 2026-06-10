# 🏥 CareTrack Clinic — To'liq Kod Tushuntirishi

## 📂 Loyiha Strukturasi (tozalangandan keyin)

```
caretrack-clinic/
├── server.js          ← Asosiy server fayli (barcha routing, middleware)
├── database.js        ← Ma'lumotlar bazasi moduli (SQLite)
├── seed.js            ← Test ma'lumotlar kiritish skripti
├── package.json       ← Loyiha sozlamalari va kutubxonalar
├── caretrack.db       ← SQLite baza fayli (avtomatik yaratiladi)
├── public/
│   ├── css/
│   │   ├── style.css      ← Asosiy CSS (ranglar, tema, formalar)
│   │   └── premium.css    ← Premium animatsiyalar va effektlar
│   └── js/
│       └── main.js        ← Frontend JavaScript (tema, sidebar, qidirish)
└── views/
    ├── partials/
    │   ├── header.ejs     ← Umumiy bosh qism (sidebar, topbar, alertlar)
    │   └── footer.ejs     ← Umumiy pastki qism (yopuvchi teglar)
    ├── landing.ejs        ← Bosh sahifa (login qilmagan)
    ├── login.ejs          ← Kirish sahifasi
    ├── error.ejs          ← Xato sahifasi (404, 403)
    ├── dashboard.ejs      ← Boshqaruv paneli (grafiklar, statistika)
    ├── doctors/
    │   ├── index.ejs      ← Shifokorlar ro'yxati
    │   ├── create.ejs     ← Yangi shifokor formasi
    │   ├── edit.ejs       ← Shifokor tahrirlash formasi
    │   └── show.ejs       ← Shifokor profil sahifasi
    ├── patients/
    │   ├── index.ejs      ← Bemorlar ro'yxati
    │   ├── create.ejs     ← Yangi bemor formasi
    │   ├── edit.ejs       ← Bemor tahrirlash formasi
    │   └── show.ejs       ← Bemor profil sahifasi
    ├── illnesses/
    │   ├── index.ejs      ← Tashxislar ro'yxati
    │   ├── create.ejs     ← Yangi tashxis formasi
    │   └── edit.ejs       ← Tashxis tahrirlash formasi
    └── users/
        ├── index.ejs      ← Foydalanuvchilar ro'yxati
        ├── create.ejs     ← Yangi foydalanuvchi formasi
        └── edit.ejs       ← Foydalanuvchi tahrirlash formasi
```

> [!IMPORTANT]
> **O'chirilgan papkalar:** `routes/` va `middleware/` — bular ishlatilmagan edi. Barcha routing `server.js` da to'g'ridan-to'g'ri yozilgan.

---

## 🔧 Tuzatilgan Xatolar

| # | Xato | Fayl | Yechim |
|---|------|------|--------|
| 1 | `routes/` va `middleware/` ishlatilmagan | Butun loyiha | O'chirildi |
| 2 | `queryOne()` null qaytarsa crash | [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) | Null tekshiruv qo'shildi |
| 3 | `type="text/theme"` noto'g'ri | [landing.ejs](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/views/landing.ejs) | `type="text/tailwindcss"` ga tuzatildi |
| 4 | Bo'sh SQL bilan `runSql` chaqirilishi | [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) | `helper.redirect` — SQL bo'lsagina bajaradi |
| 5 | SQL injection xavfi `helper.del()` | [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) | Whitelist tekshiruv qo'shildi |
| 6 | `nodemon` dependencies da | [package.json](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/package.json) | `devDependencies` ga ko'chirildi |
| 7 | `error.ejs` login qilmaganda buzilishi | [error.ejs](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/views/error.ejs) | User tekshiruvi bilan qayta yozildi |
| 8 | `database.js` — `db` null bo'lsa crash | [database.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/database.js) | Null himoya qo'shildi |
| 9 | Session secret hardcoded | [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) | `process.env` bilan fallback |
| 10 | Input validatsiya yo'q (login, create) | [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) | Bo'sh maydon tekshiruvlari qo'shildi |

---

## 📄 Fayllar Tushuntirishi

### 1. [server.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/server.js) — Asosiy Server

**Vazifasi:** Express web server, barcha routing, middleware va biznes logika.

**Tuzilishi:**
- **1-12 qator:** Kutubxonalarni yuklash (express, bcrypt, axios, qrcode)
- **14-22 qator:** Express sozlamalari (EJS, form parser, static files)
- **24-28 qator:** Session sozlamalari (maxfiy kalit, saqlash rejimi)
- **30-37 qator:** Global middleware — har bir sahifaga `user`, `success`, `error` uzatadi
- **39-53 qator:** Autentifikatsiya funksiyalari (`isAuth`, `roleCheck`)
- **55-71 qator:** Yordamchi DRY funksiyalar (`helper.render`, `helper.redirect`, `helper.del`)
- **73-100 qator:** Login/Logout/Landing sahifalari
- **102-113 qator:** QR kod API (Lecture talabi)
- **115-167 qator:** Dashboard (statistika, grafiklar, Axios orqali yangiliklar)
- **169-228 qator:** Shifokorlar CRUD (ro'yxat, yaratish, ko'rish, tahrirlash, o'chirish)
- **230-288 qator:** Bemorlar CRUD
- **290-346 qator:** Tashxislar CRUD
- **348-416 qator:** Foydalanuvchilar CRUD (faqat admin)
- **418-424 qator:** 404 handler
- **426-431 qator:** Serverni ishga tushirish

**Asosiy texnologiyalar:**
- `bcryptjs` — parolni shifrlash (hashSync, compareSync)
- `axios` — tashqi API dan ma'lumot olish (.get, .then, .catch)
- `qrcode` — QR kod yaratish (toDataURL)
- `express-session` — foydalanuvchi sessiyasini boshqarish

---

### 2. [database.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/database.js) — Ma'lumotlar Bazasi

**Vazifasi:** SQLite baza bilan ishlash — jadvallar yaratish, CRUD operatsiyalar.

**Funksiyalar:**
| Funksiya | Vazifasi | Qaytaradi |
|----------|---------|-----------|
| `getDb()` | Bazani ishga tushirish, jadvallarni yaratish | `db` obyekti |
| `saveDb()` | Xotiradagi bazani `.db` fayliga yozish | — |
| `queryAll(sql, params)` | SELECT — barcha natijalarni olish | `[{...}, {...}]` massiv |
| `queryOne(sql, params)` | SELECT — bitta natija olish | `{...}` yoki `null` |
| `runSql(sql, params)` | INSERT/UPDATE/DELETE bajarish | `{changes: N}` |

**Jadvallar (4 ta):**
1. **users** — Foydalanuvchilar (login, parol, rol)
2. **doctors** — Shifokorlar (mutaxassislik, tajriba, bio)
3. **patients** — Bemorlar (shaxsiy ma'lumotlar, qon guruhi)
4. **illnesses** — Tashxislar (kasallik, dori, holat)

**Bog'lanishlar (Foreign Keys):**
- `patients.doctor_id` → `doctors.id` (ON DELETE SET NULL)
- `illnesses.patient_id` → `patients.id` (ON DELETE CASCADE)
- `illnesses.doctor_id` → `doctors.id` (ON DELETE CASCADE)

---

### 3. [seed.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/seed.js) — Test Ma'lumotlar

**Vazifasi:** Bazaga namuna ma'lumotlar kiritish (4 foydalanuvchi, 6 shifokor, 8 bemor, 10 tashxis).

**Login ma'lumotlari:**
| Rol | Username | Parol | Imkoniyatlar |
|-----|----------|-------|-------------|
| Admin | admin | admin123 | To'liq CRUD, foydalanuvchi boshqaruvi |
| Klinitsist | doctor1 | doctor123 | Shifokor/bemor/tashxis yaratish va tahrirlash |
| Qabulxona | reception1 | recep123 | Bemor qo'shish, ro'yxatlarni ko'rish |

---

### 4. [public/css/style.css](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/public/css/style.css) — Asosiy CSS

**Vazifasi:** Light/Dark mode ranglar, formalar, modal oynalar, sidebar stili.

**CSS Variables tizimi:**
- `:root` — Light mode ranglar (oq fon, qora matn, oltin tugmalar)
- `.dark` — Dark mode ranglar (qora fon, oq matn, yorqin oltin)
- `--gold-primary`, `--gold-secondary` — oltin rang palitra
- `--badge-faol-*`, `--badge-dav-*`, `--badge-tuz-*` — holat badge ranglari

---

### 5. [public/css/premium.css](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/public/css/premium.css) — Premium Effektlar

**Vazifasi:** Animatsiyalar, glassmorphism, floating table, mesh gradient.

**Komponentlar:**
- `fadeInUp` animatsiya — sahifa yuklanganda elementlar pastdan chiqadi
- `pulse-dot` — holat indikatori (qizil, sariq, yashil puls effekti)
- `mesh-blob` — fon dekorativ gradient bloblar
- `glass-panel` — shaffof panel effekti
- `floating-table` — jadval qatorlari suzib yuradi
- `dash-card` — dashboard kartalar hover effekti

---

### 6. [public/js/main.js](file:///c:/Users/Cyber/OneDrive/Desktop/caretrack-clinic/public/js/main.js) — Frontend JavaScript

**Vazifasi:** Tema almashtirish, mobil sidebar, qidirish, modal, Lucide ikonlar.

**Funksiyalar:**
| Funksiya | Vazifasi |
|----------|---------|
| Theme Toggle | Dark/light mode almashtirish (localStorage da saqlanadi) |
| Mobile Sidebar | Kichik ekranlarda sidebar ochish/yopish |
| Auto-dismiss Alerts | Flash xabarlar 4 soniyadan keyin yo'qoladi |
| `confirmDelete(id)` | O'chirish tasdiqlash modal oynasini ochish |
| `closeModal(id)` | Modal oynani yopish |
| Search Filter | Jadval qatorlarini real-vaqt filtrlash |
| Active Link | Sidebar da joriy sahifa linkni belgilash |

---

### 7. EJS Shablonlar

**Umumiy pattern:** Barcha sahifalar `header.ejs` va `footer.ejs` ni include qiladi.

- **header.ejs** — `<html>`, `<head>`, sidebar, topbar, flash alertlar
- **footer.ejs** — yopuvchi teglar, `main.js` script

**CRUD sahifalar:**
- `index.ejs` — ro'yxat jadvali, qidirish, o'chirish modallari
- `create.ejs` — yaratish formasi
- `edit.ejs` — tahrirlash formasi (mavjud qiymatlar bilan to'ldirilgan)
- `show.ejs` — tafsilotli profil sahifasi

---

## ✅ 5 Bosqichli Test Natijalari

### Test 1: Baza Yaratish ✅
```
✅ 4 ta foydalanuvchi qo'shildi
✅ 6 ta shifokor qo'shildi
✅ 8 ta bemor qo'shildi
✅ 10 ta kasallik/tashxis qo'shildi
```

### Test 2: Bazadan Ma'lumot Olish ✅
```
Foydalanuvchilar: 4 (kutiladi: 4) ✅
Shifokorlar: 6 (kutiladi: 6) ✅
Bemorlar: 8 (kutiladi: 8) ✅
Tashxislar: 10 (kutiladi: 10) ✅
Mavjud emas shifokor (null): OK ✅
JOIN natija: OK (10 ta) ✅
COUNT DISTINCT: OK ✅
Parol tekshiruvi: OK ✅
```

### Test 3: Sintaksis Tekshiruvi ✅
```
server.js:   Sintaksis OK ✅
database.js: Sintaksis OK ✅
seed.js:     Sintaksis OK ✅
```

### Test 4: HTTP Sahifalar (22 ta marshrut) ✅
```
Bosh sahifa:           200 ✅     Shifokor profili:     200 ✅
Login sahifasi:        200 ✅     Bemor profili:        200 ✅
404 sahifa:            404 ✅     Tashxislar:           200 ✅
QR kod API:            200 ✅     Foydalanuvchilar:     200 ✅
Login POST:            302 ✅     Barcha yaratish:      200 ✅
Dashboard:             200 ✅     Barcha tahrirlash:    200 ✅
Shifokorlar:           200 ✅     Mavjud emas → 302:    ✅✅✅
Bemorlar:              200 ✅
```

### Test 5: CRUD Operatsiyalar (11 ta test) ✅
```
Login:                        OK ✅
Shifokor yaratish:            OK ✅
Bemor yaratish:               OK ✅
Tashxis yaratish:             OK ✅
Foydalanuvchi yaratish:       OK ✅
Takror username bloklash:     OK ✅
Shifokor yangilash:           OK ✅
O'zini o'chirish bloklash:    OK ✅
Bo'sh ism validatsiya:        OK ✅
Logout:                       OK ✅
Auth himoya (redirect):       OK ✅
```

> [!TIP]
> **Jami: 46 ta test o'tkazildi, barchasi MUVAFFAQIYATLI ✅**
