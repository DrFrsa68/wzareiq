const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const c = require('../controllers/exam.controller');

router.get('/search', c.search);
router.get('/years', c.getAvailableYears);
router.get('/rounds', c.getAvailableRounds);
router.get('/:id', c.getById);
router.post('/', auth, admin, c.create);

module.exports = router;
