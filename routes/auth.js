const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryOne } = require('../database');

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('login', { title: 'Kirish' });
});

// POST /login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    req.session.error = 'Username va parol kiritilishi shart';
    return res.redirect('/login');
  }

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.session.error = 'Username yoki parol noto\'g\'ri';
    return res.redirect('/login');
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role
  };
  
  req.session.success = `Xush kelibsiz, ${user.full_name}!`;
  res.redirect('/dashboard');
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
