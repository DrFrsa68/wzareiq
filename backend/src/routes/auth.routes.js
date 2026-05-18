const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, me } = require('../controllers/auth.controller');
const prisma = require('../services/prisma');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);

router.post('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'التوكن مطلوب' });
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken: token }
    });
    res.json({ message: 'تم حفظ التوكن' });
  } catch (err) {
    res.status(500).json({ error: 'خطأ بالسيرفر' });
  }
});

module.exports = router;