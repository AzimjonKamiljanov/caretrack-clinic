/**
 * Authentication & RBAC Middleware
 * CareTrack Clinic MRMS
 */

// Check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

// Check if user has required role
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        title: 'Ruxsat yo\'q',
        message: 'Sizda ushbu sahifaga kirish huquqi yo\'q.',
        user: req.session.user
      });
    }
    return next();
  };
}

// Check if user can modify (admin or clinician)
function canModify(req, res, next) {
  const role = req.session.user.role;
  if (role === 'admin' || role === 'clinician') {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Ruxsat yo\'q',
    message: 'Sizda ushbu amalni bajarish huquqi yo\'q.',
    user: req.session.user
  });
}

// Check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Ruxsat yo\'q',
    message: 'Faqat administratorlar uchun.',
    user: req.session.user
  });
}

module.exports = { isAuthenticated, authorizeRoles, canModify, isAdmin };
