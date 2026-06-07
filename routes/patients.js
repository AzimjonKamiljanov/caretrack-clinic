const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../database');
const { isAuthenticated, canModify, isAdmin } = require('../middleware/auth');

// GET /patients — List all patients with assigned doctor name (JOIN)
router.get('/', isAuthenticated, (req, res) => {
  const patients = queryAll(`
    SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty
    FROM patients p
    LEFT JOIN doctors d ON p.doctor_id = d.id
    ORDER BY p.full_name
  `);
  res.render('patients/index', { title: 'Bemorlar', patients });
});

// GET /patients/create — Show create form with doctors list
router.get('/create', isAuthenticated, (req, res) => {
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  res.render('patients/create', { title: 'Yangi Bemor', doctors });
});

// POST /patients — Create patient with doctor_id
router.post('/', isAuthenticated, (req, res) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;
  
  if (!full_name) {
    req.session.error = 'Bemor ismi kiritilishi shart';
    return res.redirect('/patients/create');
  }

  runSql(
    'INSERT INTO patients (full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null]
  );

  req.session.success = 'Bemor muvaffaqiyatli ro\'yxatga olindi';
  res.redirect('/patients');
});

// GET /patients/:id — Show patient profile with assigned doctor and illnesses (JOIN)
router.get('/:id', isAuthenticated, (req, res) => {
  const patient = queryOne(`
    SELECT p.*, d.full_name as doctor_name, d.specialty as doctor_specialty
    FROM patients p
    LEFT JOIN doctors d ON p.doctor_id = d.id
    WHERE p.id = ?
  `, [req.params.id]);
  if (!patient) {
    req.session.error = 'Bemor topilmadi';
    return res.redirect('/patients');
  }

  // JOIN: Get illnesses with doctor names
  const illnesses = queryAll(`
    SELECT i.*, d.full_name as doctor_name, d.specialty as doctor_specialty
    FROM illnesses i 
    JOIN doctors d ON i.doctor_id = d.id 
    WHERE i.patient_id = ? 
    ORDER BY i.diagnosed_date DESC
  `, [req.params.id]);

  res.render('patients/show', { title: patient.full_name, patient, illnesses });
});

// GET /patients/:id/edit — Show edit form with doctors list
router.get('/:id/edit', isAuthenticated, canModify, (req, res) => {
  const patient = queryOne('SELECT * FROM patients WHERE id = ?', [req.params.id]);
  if (!patient) {
    req.session.error = 'Bemor topilmadi';
    return res.redirect('/patients');
  }
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  res.render('patients/edit', { title: 'Bemorni Tahrirlash', patient, doctors });
});

// POST /patients/:id — Update patient with doctor_id
router.post('/:id', isAuthenticated, canModify, (req, res) => {
  const { full_name, date_of_birth, gender, phone, address, blood_type, emergency_contact, doctor_id } = req.body;
  
  runSql(
    'UPDATE patients SET full_name=?, date_of_birth=?, gender=?, phone=?, address=?, blood_type=?, emergency_contact=?, doctor_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [full_name, date_of_birth || null, gender || null, phone || null, address || null, blood_type || null, emergency_contact || null, doctor_id ? parseInt(doctor_id) : null, req.params.id]
  );

  req.session.success = 'Bemor ma\'lumotlari yangilandi';
  res.redirect('/patients/' + req.params.id);
});

// POST /patients/:id/delete — Delete patient
router.post('/:id/delete', isAuthenticated, isAdmin, (req, res) => {
  runSql('DELETE FROM patients WHERE id = ?', [req.params.id]);
  req.session.success = 'Bemor o\'chirildi';
  res.redirect('/patients');
});

module.exports = router;
