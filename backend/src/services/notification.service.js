const { Expo } = require('expo-server-sdk');
const prisma = require('./prisma');

const expo = new Expo();

exports.sendToUser = async (userId, title, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true }
    });

    if (!user?.pushToken) return;
    if (!Expo.isExpoPushToken(user.pushToken)) return;

    await expo.sendPushNotificationsAsync([{
      to: user.pushToken,
      title,
      body,
      data,
      sound: 'default',
    }]);
  } catch (err) {
    console.error('Notification error:', err);
  }
};

exports.sendToAll = async (title, body, data = {}) => {
  try {
    const users = await prisma.user.findMany({
      where: { pushToken: { not: null } },
      select: { pushToken: true }
    });

    const messages = users
      .filter(u => Expo.isExpoPushToken(u.pushToken))
      .map(u => ({ to: u.pushToken, title, body, data, sound: 'default' }));

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('Notification error:', err);
  }
};