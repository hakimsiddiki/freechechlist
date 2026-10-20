const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api/subscribers';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error('MAILERLITE_API_KEY is not configured.');
    return res.status(500).json({ error: 'Signup is temporarily unavailable.' });
  }

  const body = typeof req.body === 'string'
    ? parseJsonBody(req.body)
    : req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid signup details.' });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (email.length > 254 || !EMAIL_PATTERN.test(email) || name.length > 100) {
    return res.status(400).json({ error: 'Enter a valid email address and name.' });
  }

  const groupId = process.env.MAILERLITE_GROUP_ID;
  const subscriber = {
    email,
    fields: name ? { name } : {},
    ...(groupId ? { groups: [groupId] } : {})
  };

  try {
    const response = await fetch(MAILERLITE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(subscriber)
    });

    if (!response.ok) {
      console.error(`MailerLite subscriber request failed with status ${response.status}.`);
      return res.status(502).json({ error: 'Signup could not be completed. Please try again.' });
    }

    return res.status(200).json({ message: 'Signup successful.' });
  } catch (error) {
    console.error('MailerLite request failed.', error);
    return res.status(502).json({ error: 'Signup could not be completed. Please try again.' });
  }
};

function parseJsonBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
