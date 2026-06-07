const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../database');
const { isAuthenticated, canModify, isAdmin } = require('../middleware/auth');

// GET /doctors — List all doctors
router.get('/', isAuthenticated, (req, res) => {
  const doctors = queryAll('SELECT * FROM doctors ORDER BY full_name');
  res.render('doctors/index', { title: 'Shifokorlar', doctors });
});

// GET /doctors/create — Show create form
router.get('/create', isAuthenticated, canModify, (req, res) => {
  res.render('doctors/create', { title: 'Yangi Shifokor' });
});

// POST /doctors — Create doctor
router.post('/', isAuthenticated, canModify, (req, res) => {
  const { full_name, specialty, phone, email, experience_years, bio } = req.body;
  
  if (!full_name || !specialty) {
    req.session.error = 'Ism va mutaxassislik kiritilishi shart';
    return res.redirect('/doctors/create');
  }

  runSql(
    'INSERT INTO doctors (full_name, specialty, phone, email, experience_years, bio) VALUES (?, ?, ?, ?, ?, ?)',
    [full_name, specialty, phone || null, email || null, parseInt(experience_years) || 0, bio || null]
  );

  req.session.success = 'Shifokor muvaffaqiyatli qo\'shildi';
  res.redirect('/doctors');
});

// GET /doctors/:id — Show doctor profile
router.get('/:id', isAuthenticated, (req, res) => {
  const doctor = queryOne('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
  if (!doctor) {
    req.session.error = 'Shifokor topilmadi';
    return res.redirect('/doctors');
  }

  const illnesses = queryAll(`
    SELECT i.*, p.full_name as patient_name 
    FROM illnesses i 
    JOIN patients p ON i.patient_id = p.id 
    WHERE i.doctor_id = ? 
    ORDER BY i.diagnosed_date DESC
  `, [req.params.id]);

  const patientCount = queryOne('SELECT COUNT(DISTINCT patient_id) as count FROM illnesses WHERE doctor_id = ?', [req.params.id]);

  res.render('doctors/show', { 
    title: doctor.full_name, 
    doctor, 
    illnesses, 
    patientCount: patientCount.count 
  });
});

// GET /doctors/:id/edit — Show edit form
router.get('/:id/edit', isAuthenticated, canModify, (req, res) => {
  const doctor = queryOne('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
  if (!doctor) {
    req.session.error = 'Shifokor topilmadi';
    return res.redirect('/doctors');
  }
  res.render('doctors/edit', { title: 'Shifokorni Tahrirlash', doctor });
});

// POST /doctors/:id — Update doctor
router.post('/:id', isAuthenticated, canModify, (req, res) => {
  const { full_name, specialty, phone, email, experience_years, bio } = req.body;
  
  runSql(
    'UPDATE doctors SET full_name=?, specialty=?, phone=?, email=?, experience_years=?, bio=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    [full_name, specialty, phone || null, email || null, parseInt(experience_years) || 0, bio || null, req.params.id]
  );

  req.session.success = 'Shifokor ma\'lumotlari yangilandi';
  res.redirect('/doctors/' + req.params.id);
});

// POST /doctors/:id/delete — Delete doctor
router.post('/:id/delete', isAuthenticated, isAdmin, (req, res) => {
  runSql('DELETE FROM doctors WHERE id = ?', [req.params.id]);
  req.session.success = 'Shifokor o\'chirildi';
  res.redirect('/doctors');
});

module.exports = router;
