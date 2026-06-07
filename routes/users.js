const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryAll, queryOne, runSql } = require('../database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /users — List all users (admin only)
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  const users = queryAll('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
  res.render('users/index', { title: 'Foydalanuvchilar', users: users });
});

// GET /users/create — Show create form
router.get('/create', isAuthenticated, isAdmin, (req, res) => {
  res.render('users/create', { title: 'Yangi Foydalanuvchi' });
});

// POST /users — Create user
router.post('/', isAuthenticated, isAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body;
  
  if (!username || !password || !full_name || !role) {
    req.session.error = 'Barcha maydonlar to\'ldirilishi shart';
    return res.redirect('/users/create');
  }

  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    req.session.error = 'Bu username allaqachon mavjud';
    return res.redirect('/users/create');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  runSql(
    'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, full_name, role]
  );

  req.session.success = 'Foydalanuvchi muvaffaqiyatli yaratildi';
  res.redirect('/users');
});

// GET /users/:id/edit — Show edit form
router.get('/:id/edit', isAuthenticated, isAdmin, (req, res) => {
  const editUser = queryOne('SELECT id, username, full_name, role FROM users WHERE id = ?', [req.params.id]);
  if (!editUser) {
    req.session.error = 'Foydalanuvchi topilmadi';
    return res.redirect('/users');
  }
  res.render('users/edit', { title: 'Foydalanuvchini Tahrirlash', editUser });
});

// POST /users/:id — Update user
router.post('/:id', isAuthenticated, isAdmin, (req, res) => {
  const { username, password, full_name, role } = req.body;
  
  if (password && password.trim()) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    runSql(
      'UPDATE users SET username=?, password=?, full_name=?, role=? WHERE id=?',
      [username, hashedPassword, full_name, role, req.params.id]
    );
  } else {
    runSql(
      'UPDATE users SET username=?, full_name=?, role=? WHERE id=?',
      [username, full_name, role, req.params.id]
    );
  }

  req.session.success = 'Foydalanuvchi yangilandi';
  res.redirect('/users');
});

// POST /users/:id/delete — Delete user
router.post('/:id/delete', isAuthenticated, isAdmin, (req, res) => {
  // Don't let admin delete themselves
  if (parseInt(req.params.id) === req.session.user.id) {
    req.session.error = 'O\'zingizni o\'chira olmaysiz';
    return res.redirect('/users');
  }
  runSql('DELETE FROM users WHERE id = ?', [req.params.id]);
  req.session.success = 'Foydalanuvchi o\'chirildi';
  res.redirect('/users');
});

module.exports = router;
