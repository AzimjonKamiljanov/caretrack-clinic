import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import qr from 'qrcode';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import { getDb, queryAll, queryOne, runSql } from './config/database';
import apiRoutes from './routes/index';
import { isAuth } from './middlewares/auth.middleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'btec-secret-2026',
  resave: false,
  saveUninitialized: false
}));

// ===== GLOBAL MIDDLEWARE =====
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.user = (req.session as any).user || null;
  res.locals.success = (req.session as any).success || null;
  res.locals.error = (req.session as any).error || null;
  delete (req.session as any).success;
  delete (req.session as any).error;
  next();
});

// For testing purposes
if (process.env.NODE_ENV === 'test') {
    app.post('/mock-login', (req, res) => {
        (req.session as any).user = req.body;
        res.send('ok');
    });
}

// Register modular routes
app.use('/', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  if ((req.session as any).user) return res.redirect('/dashboard');
  res.render('landing', { title: 'Bosh sahifa' });
});

app.get('/login', (req: Request, res: Response) => {
  if ((req.session as any).user) return res.redirect('/dashboard');
  res.render('login', { title: 'Kirish' });
});

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    (req.session as any).error = 'Username va parol kiritilishi shart';
    return res.redirect('/login');
  }

  const user = queryOne('SELECT * FROM users WHERE username=?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    (req.session as any).error = 'Noto\'g\'ri username yoki parol';
    return res.redirect('/login');
  }

  (req.session as any).user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  };

  (req.session as any).success = `Xush kelibsiz, ${user.full_name}!`;
  res.redirect('/dashboard');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {});
  res.redirect('/login');
});

app.get('/api/qrcode', async (req: Request, res: Response) => {
  try {
    const text = (req.query.text as string) || 'CareTrack Clinic';
    const qrData = await qr.toDataURL(text);
    res.json({ qr: qrData });
  } catch (err) {
    res.status(500).json({ error: 'QR kod yaratishda xato' });
  }
});

app.get('/dashboard', isAuth, async (req: Request, res: Response) => {
  const doctors = queryAll('SELECT * FROM doctors');
  const patients = queryAll('SELECT * FROM patients');
  const illnesses = queryAll('SELECT * FROM illnesses');

  let healthTips = [];
  try {
    const response = await axios.get('https://jsonplaceholder.typicode.com/posts?_limit=3');
    healthTips = response.data.map((p: any) => ({ title: p.title, body: p.body }));
  } catch (err) {
    healthTips = [{ title: 'Sog\'lom turmush tarzi', body: 'Kuniga kamida 2 litr suv iching — bu organizmni tozalashga yordam beradi.' }];
  }

  const recentIllnesses = queryAll(
    `SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name
     FROM illnesses i
     JOIN patients p ON i.patient_id=p.id
     JOIN doctors d ON i.doctor_id=d.id
     ORDER BY i.created_at DESC LIMIT 5`
  );

  const statusStats = queryAll('SELECT status, COUNT(*) as count FROM illnesses GROUP BY status');
  const genderStats = queryAll('SELECT gender, COUNT(*) as count FROM patients WHERE gender IS NOT NULL GROUP BY gender');

  const doctorWorkload = queryAll(
    `SELECT d.full_name as doctor_name, COUNT(i.id) as patient_count
     FROM doctors d LEFT JOIN illnesses i ON d.id=i.doctor_id
     GROUP BY d.id`
  );

  const ages = patients
    .filter((p: any) => p.date_of_birth)
    .map((p: any) => new Date().getFullYear() - new Date(p.date_of_birth).getFullYear());

  const ageStats = {
    '0-18': ages.filter((a: number) => a <= 18).length,
    '19-35': ages.filter((a: number) => a > 18 && a <= 35).length,
    '36-50': ages.filter((a: number) => a > 35 && a <= 50).length,
    '51+': ages.filter((a: number) => a > 50).length
  };

  res.render('dashboard', {
    title: 'Boshqaruv Paneli',
    stats: {
      doctors: doctors.length,
      patients: patients.length,
      illnesses: illnesses.length,
      activeIllnesses: illnesses.filter((i: any) => i.status === 'Faol').length
    },
    recentIllnesses,
    statusStats,
    genderStats,
    doctorWorkload,
    ageStats,
    healthTips
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).render('error', {
    title: 'Sahifa topilmadi',
    message: 'Siz qidirgan sahifa mavjud emas yoki o\'chirilgan'
  });
});

export const initApp = async () => {
    await getDb();
    return app;
};

export default app;
