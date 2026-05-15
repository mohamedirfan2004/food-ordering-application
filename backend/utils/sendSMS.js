// utils/sendSMS.js
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  { accountSid: 'AC67db40a575c189f7c80d45ab0c01327c' }
);

const sendOrderConfirmation = async (phone, orderDetails) => {
  try {
    const message = `Thank you for your order #${orderDetails.orderId}\n` +
                   `Items: ${orderDetails.items.map(i => `${i.quantity}x ${i.item}`).join(', ')}\n` +
                   `Total: ₹${orderDetails.total}\n` +
                   `Status: ${orderDetails.status}`;

    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    console.log(`Order confirmation sent to ${phone}`);  
    return true;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return false;
  }
};

module.exports = { sendOrderConfirmation };
