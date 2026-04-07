const prisma = require('../lib/prisma');

function getAT(apiKey, username) {
  if (!apiKey || !username) throw new Error('SMS not configured');
  return require('africastalking')({ apiKey, username });
}

async function sendSMS(phone, message, businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { atApiKey: true, atUsername: true },
  });
  const AT = getAT(business?.atApiKey, business?.atUsername);
  const sms = AT.SMS;
  return sms.send({ to: [phone], message, from: '' });
}

module.exports = { sendSMS };
