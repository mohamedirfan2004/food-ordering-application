const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Otp = require('../models/Otp');
const https = require('https');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sendOtpViaMsg91(phone, code) {
  const authkey = process.env.MSG91_AUTHKEY;
  const templateId = process.env.MSG91_TEMPLATE_ID; // Pre-approved template must contain <#> OTP is {{otp}}
  const sender = process.env.MSG91_SENDER_ID || 'MSGIND';
  if (!authkey || !templateId) {
    console.log(`[DEV] OTP for ${phone}: ${code}`);
    return Promise.resolve({ dev: true });
  }

  const payload = JSON.stringify({
    template_id: templateId,
    mobile: phone,
    otp: code,
    sender: sender,
  });

  const options = {
    hostname: 'api.msg91.com',
    path: '/api/v5/otp',
    method: 'POST',
    headers: {
      'authkey': authkey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true });
        else {
          console.error('MSG91 error:', res.statusCode, data);
          resolve({ ok: false, status: res.statusCode, data });
        }
      });
    });
    req.on('error', (e) => {
      console.error('MSG91 request error', e);
      resolve({ ok: false, error: e.message });
    });
    req.write(payload);
    req.end();
  });
}

exports.requestOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone required' });

    // Basic rate limiting: deny if an unexpired OTP exists
    const existing = await Otp.findOne({ phone, expiresAt: { $gt: new Date() } });
    if (existing) return res.status(429).json({ message: 'OTP already sent. Please wait before requesting again.' });

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Otp.create({ phone, codeHash, expiresAt, attempts: 0 });

    const sendRes = await sendOtpViaMsg91(phone, code);
    res.json({ success: true, devHint: sendRes.dev ? code : undefined });
  } catch (e) {
    console.error('requestOtp error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ message: 'Phone and code required' });

    const rec = await Otp.findOne({ phone }).sort({ createdAt: -1 });
    if (!rec || rec.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    if (rec.attempts >= 5) return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });

    const ok = await bcrypt.compare(code, rec.codeHash);
    if (!ok) {
      rec.attempts += 1;
      await rec.save();
      return res.status(400).json({ message: 'Invalid code' });
    }

    // success: delete OTP and issue customer token
    await Otp.deleteMany({ phone });
    const token = jwt.sign({ sub: phone, aud: 'customer' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } catch (e) {
    console.error('verifyOtp error', e);
    res.status(500).json({ message: 'Server error' });
  }
};
