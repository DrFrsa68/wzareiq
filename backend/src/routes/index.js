const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use('/auth', require('./auth.routes'));
router.use('/subjects', require('./subject.routes'));
router.use('/exams', require('./exam.routes'));
router.use('/sessions', auth, require('./session.routes'));

module.exports = router;
