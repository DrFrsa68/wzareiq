const router = require('express').Router();
const c = require('../controllers/session.controller');

router.post('/start', c.start);
router.put('/:id/answer', c.saveAnswer);
router.put('/:id/submit', c.submit);
router.get('/history', c.getHistory);
router.get('/:id/result', c.getResult);

module.exports = router;
