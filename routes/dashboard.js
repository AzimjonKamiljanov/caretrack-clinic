const express = require('express');
const router = express.Router();
const { queryAll, queryOne } = require('../database');
const { isAuthenticated } = require('../middleware/auth');

// GET /dashboard
router.get('/', isAuthenticated, (req, res) => {
  const doctorCount = queryOne('SELECT COUNT(*) as count FROM doctors');
  const patientCount = queryOne('SELECT COUNT(*) as count FROM patients');
  const illnessCount = queryOne('SELECT COUNT(*) as count FROM illnesses');
  const activeIllnesses = queryOne("SELECT COUNT(*) as count FROM illnesses WHERE status = 'Faol'");

  const recentIllnesses = queryAll(`
    SELECT i.*, p.full_name as patient_name, d.full_name as doctor_name
    FROM illnesses i
    JOIN patients p ON i.patient_id = p.id
    JOIN doctors d ON i.doctor_id = d.id
    ORDER BY i.created_at DESC
    LIMIT 5
  `);

  const statusStats = queryAll(`
    SELECT status, COUNT(*) as count FROM illnesses GROUP BY status
  `);

  const genderStats = queryAll(`
    SELECT gender, COUNT(*) as count FROM patients WHERE gender IS NOT NULL GROUP BY gender
  `);

  const doctorWorkload = queryAll(`
    SELECT d.full_name as doctor_name, COUNT(i.id) as patient_count 
    FROM doctors d 
    LEFT JOIN illnesses i ON d.id = i.doctor_id 
    GROUP BY d.id
    ORDER BY patient_count DESC
  `);

  const patientsDOB = queryAll("SELECT date_of_birth FROM patients WHERE date_of_birth IS NOT NULL AND date_of_birth != ''");
  let ageStats = { '0-18': 0, '19-35': 0, '36-50': 0, '51+': 0 };
  const currentYear = new Date().getFullYear();
  patientsDOB.forEach(p => {
    const dob = new Date(p.date_of_birth);
    if (!isNaN(dob.getFullYear())) {
      const age = currentYear - dob.getFullYear();
      if (age <= 18) ageStats['0-18']++;
      else if (age <= 35) ageStats['19-35']++;
      else if (age <= 50) ageStats['36-50']++;
      else ageStats['51+']++;
    }
  });

  res.render('dashboard', {
    title: 'Boshqaruv Paneli',
    stats: {
      doctors: doctorCount.count,
      patients: patientCount.count,
      illnesses: illnessCount.count,
      activeIllnesses: activeIllnesses.count
    },
    recentIllnesses,
    statusStats,
    genderStats,
    doctorWorkload,
    ageStats
  });
});

module.exports = router;
