/**
 * TRIGDA — Backend Server
 * Node.js + Express
 * Port: 3001
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files statically
app.use(express.static(path.join(__dirname)));

// ─── Data Storage (JSON files) ────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const FILES = {
  demos:    path.join(DATA_DIR, 'demos.json'),
  contacts: path.join(DATA_DIR, 'contacts.json'),
  leads:    path.join(DATA_DIR, 'leads.json'),
};

// Init files
Object.values(FILES).forEach(f => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify([], null, 2));
});

function readData(file)        { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
function writeData(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function saveRecord(file, record) {
  const arr = readData(file);
  arr.push({ ...record, id: Date.now().toString(), createdAt: new Date().toISOString() });
  writeData(file, arr);
  return arr[arr.length - 1];
}

// ─── Validation ───────────────────────────────────────────────
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// ─── ROUTES ──────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TRIGDA API running ✅', timestamp: new Date().toISOString() });
});

// ── Book a Demo ──────────────────────────────────────────────
app.post('/api/demo', (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, companySize, challenge, date, time } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !company) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }
    if (!time) {
      return res.status(400).json({ success: false, error: 'Please select a time slot.' });
    }

    const record = saveRecord(FILES.demos, { firstName, lastName, email, phone, company, companySize, challenge, date, time });

    console.log(`✅ Demo booked: ${firstName} ${lastName} — ${date} at ${time} — ${company}`);

    res.json({
      success: true,
      message: 'Demo booked successfully!',
      bookingId: record.id,
      details: { name: `${firstName} ${lastName}`, date, time }
    });
  } catch (err) {
    console.error('Demo booking error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// ── Contact Form ─────────────────────────────────────────────
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, phone, company, topic, message, urgent } = req.body;

    if (!name || !email || !message || !topic) {
      return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    const record = saveRecord(FILES.contacts, { name, email, phone, company, topic, message, urgent });

    console.log(`📧 Contact message: [${topic}] from ${name} (${email}) — Urgent: ${urgent}`);

    res.json({
      success: true,
      message: 'Message received! We\'ll respond within 4 hours.',
      ticketId: record.id
    });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// ── Lead Capture ──────────────────────────────────────────────
app.post('/api/lead', (req, res) => {
  try {
    const { name, email, phone, source, data: leadData } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email.' });
    }

    const record = saveRecord(FILES.leads, { name, email, phone, source: source || 'website', data: leadData || {} });

    console.log(`🎯 New lead captured: ${name} (${email}) from ${source}`);

    res.json({
      success: true,
      message: 'Lead captured!',
      leadId: record.id
    });
  } catch (err) {
    console.error('Lead error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── Admin: Get all demos ──────────────────────────────────────
app.get('/api/admin/demos', (req, res) => {
  try {
    const demos = readData(FILES.demos);
    res.json({ success: true, count: demos.length, data: demos });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch demos.' });
  }
});

// ── Admin: Get all contacts ───────────────────────────────────
app.get('/api/admin/contacts', (req, res) => {
  try {
    const contacts = readData(FILES.contacts);
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch contacts.' });
  }
});

// ── Admin: Get all leads ──────────────────────────────────────
app.get('/api/admin/leads', (req, res) => {
  try {
    const leads = readData(FILES.leads);
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch leads.' });
  }
});

// ── Admin: Dashboard Stats ────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  try {
    const demos    = readData(FILES.demos);
    const contacts = readData(FILES.contacts);
    const leads    = readData(FILES.leads);
    res.json({
      success: true,
      stats: {
        totalDemos:    demos.length,
        totalContacts: contacts.length,
        totalLeads:    leads.length,
        lastUpdated:   new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Could not fetch stats.' });
  }
});

// ── Catch-all: serve index.html for SPA ──────────────────────
app.get('*', (req, res) => {
  const file = path.join(__dirname, req.path.endsWith('.html') ? req.path : 'index.html');
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 TRIGDA Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/admin/stats`);
  console.log(`   GET  /api/admin/demos`);
  console.log(`   GET  /api/admin/contacts`);
  console.log(`   GET  /api/admin/leads`);
  console.log(`   POST /api/demo`);
  console.log(`   POST /api/contact`);
  console.log(`   POST /api/lead`);
  console.log(`\n🌐 Frontend: http://localhost:${PORT}\n`);
});
