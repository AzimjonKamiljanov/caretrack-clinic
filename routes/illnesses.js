const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../database');
const { isAuthenticated, canModify, isAdmin } = require('../middleware/auth');

// GET /illnesses — List all illnesses with patient & doctor names (JOIN)
router.get('/', isAuthenticated, (req, res) => {
  const illnesses = queryAll(`
    SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name, d.specialty as doctor_specialty
    FROM illnesses i
    JOIN patients p ON i.patient_id = p.id
    JOIN doctors d ON i.doctor_id = d.id
    ORDER BY i.diagnosed_date DESC
  `);
  res.render('illnesses/index', { title: 'Kasalliklar / Tashxislar', illnesses });
});

// GET /illnesses/create — Show create form
router.get('/create', isAuthenticated, canModify, (req, res) => {
  const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  res.render('illnesses/create', { title: 'Yangi Tashxis', patients, doctors });
});

// POST /illnesses — Create illness
router.post('/', isAuthenticated, canModify, (req, res) => {
  const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;
  
  if (!patient_id || !doctor_id || !diagnosis) {
    req.session.error = 'Bemor, shifokor va tashxis kiritilishi shart';
    return res.redirect('/illnesses/create');
  }

  runSql(
    'INSERT INTO illnesses (patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status || 'Faol', diagnosed_date || new Date().toISOString().split('T')[0]]
  );

  req.session.success = 'Tashxis muvaffaqiyatli qo\'shildi';
  res.redirect('/illnesses');
});

// GET /illnesses/:id/edit — Show edit form
router.get('/:id/edit', isAuthenticated, canModify, (req, res) => {
  const illness = queryOne('SELECT * FROM illnesses WHERE id = ?', [req.params.id]);
  if (!illness) {
    req.session.error = 'Tashxis topilmadi';
    return res.redirect('/illnesses');
  }

  const patients = queryAll('SELECT id, full_name FROM patients ORDER BY full_name');
  const doctors = queryAll('SELECT id, full_name, specialty FROM doctors ORDER BY full_name');
  
  res.render('illnesses/edit', { title: 'Tashxisni Tahrirlash', illness, patients, doctors });
});

// POST /illnesses/:id — Update illness
router.post('/:id', isAuthenticated, canModify, (req, res) => {
  const { patient_id, doctor_id, diagnosis, description, prescribed_meds, status, diagnosed_date } = req.body;
  
  runSql(
    'UPDATE illnesses SET patient_id=?, doctor_id=?, diagnosis=?, description=?, prescribed_meds=?, status=?, diagnosed_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [parseInt(patient_id), parseInt(doctor_id), diagnosis, description || null, prescribed_meds || null, status, diagnosed_date, req.params.id]
  );

  req.session.success = 'Tashxis yangilandi';
  res.redirect('/illnesses');
});

// POST /illnesses/:id/delete — Delete illness
router.post('/:id/delete', isAuthenticated, isAdmin, (req, res) => {
  runSql('DELETE FROM illnesses WHERE id = ?', [req.params.id]);
  req.session.success = 'Tashxis o\'chirildi';
  res.redirect('/illnesses');
});

module.exports = router;
