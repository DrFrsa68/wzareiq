const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const c = require('../controllers/subject.controller');

router.get('/', c.getAll);
router.post('/', auth, admin, c.create);
router.put('/:id', auth, admin, c.update);
router.delete('/:id', auth, admin, c.remove);

module.exports = router;
