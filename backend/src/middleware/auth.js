const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'wzareiq_secret_2024';

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'token غير صالح' });
  }
};
