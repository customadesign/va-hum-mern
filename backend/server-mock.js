const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// Serve local uploads (fallback storage)
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Mock JWT secret
const JWT_SECRET = 'mock-jwt-secret-for-development';

// In-memory settings to simulate persistence
// Schema: top-level { metadata, settings }
// Keep unknown keys for forward compatibility.
const SETTINGS_VERSION = '1.0.0';
let mockSettingsDoc = {
  metadata: {
    version: SETTINGS_VERSION,
    updatedAt: new Date().toISOString()
  },
  settings: {
    // Minimal, backward-compatible baseline. Keep aligned with existing app usage.
    regional: {
      language: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      autoDetectTimezone: false,
      useSystemLocale: false,
      firstDayOfWeek: 'sunday',
    },
    performance: {
      cache: { enabled: false, duration: 6010, strategy: 'memory', maxSize: '100MB' },
      pagination: { defaultLimit: 20, maxLimit: 100 },
      autoSave: { enabled: false, interval: 60, showNotification: false },
      lazyLoading: { enabled: false, threshold: 0.1 },
    },
    // Room for future domains; unknown keys preserved and round-tripped
  }
};

function nowIso() { return new Date().toISOString(); }

function isIsoDate(value) {
  if (typeof value !== 'string') return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString() === value;
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMergeObjects(target, source) {
  // Arrays replaced wholesale; objects merged; scalars overwritten
  if (Array.isArray(target) && Array.isArray(source)) {
    return cloneDeep(source);
  }
  if (typeof target === 'object' && target && typeof source === 'object' && source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (key in target) {
        result[key] = deepMergeObjects(target[key], source[key]);
      } else {
        result[key] = cloneDeep(source[key]);
      }
    }
    return result;
  }
  return cloneDeep(source);
}

function createDefaultSettings() {
  return {
    metadata: {
      version: SETTINGS_VERSION,
      updatedAt: nowIso(),
    },
    settings: cloneDeep(mockSettingsDoc.settings),
  };
}

function validateSettingsDoc(doc) {
  if (typeof doc !== 'object' || doc === null) {
    return { ok: false, code: 'invalid_type', message: 'Root must be an object' };
  }
  const metadata = doc.metadata;
  const settings = doc.settings;
  if (typeof metadata !== 'object' || metadata === null) {
    return { ok: false, code: 'missing_metadata', message: 'metadata must be an object' };
  }
  if (typeof metadata.version !== 'string') {
    return { ok: false, code: 'invalid_version', message: 'metadata.version must be a string' };
  }
  if (typeof metadata.updatedAt !== 'string' || !isIsoDate(metadata.updatedAt)) {
    return { ok: false, code: 'invalid_updatedAt', message: 'metadata.updatedAt must be an ISO timestamp string' };
  }
  if (typeof settings !== 'object' || settings === null) {
    return { ok: false, code: 'invalid_settings', message: 'settings must be an object' };
  }
  // Deny obviously dangerous types (functions, etc.) are not representable in JSON; basic structural check is enough
  return { ok: true };
}

function maskSecretsForExport(doc) {
  const cloned = cloneDeep(doc);
  try {
    // Mask email.sendgridApiKey if present
    if (typeof cloned?.settings?.email?.sendgridApiKey === 'string' && cloned.settings.email.sendgridApiKey.length > 0) {
      cloned.settings.email.sendgridApiKey = '****';
    }
    // Mask notifications.slack.webhookUrl if present
    if (typeof cloned?.settings?.notifications?.slack?.webhookUrl === 'string' && cloned.settings.notifications.slack.webhookUrl.length > 0) {
      cloned.settings.notifications.slack.webhookUrl = '****';
    }
  } catch (e) {
    // If masking fails, return the cloned doc unmodified
  }
  return cloned;
}

function normalizeForSave(incoming) {
  // Preserve unknown keys; normalize updatedAt server-side
  const next = cloneDeep(incoming);
  if (!next.metadata || typeof next.metadata !== 'object') next.metadata = {};
  next.metadata.version = typeof next.metadata.version === 'string' ? next.metadata.version : SETTINGS_VERSION;
  next.metadata.updatedAt = nowIso();
  if (typeof next.settings !== 'object' || next.settings === null) next.settings = {};
  return next;
}

function overwriteSettings(incoming) {
  // Overwrite known keys and preserve unknown keys not present in incoming
  const current = cloneDeep(mockSettingsDoc);
  const next = normalizeForSave({
    ...current,
    ...incoming,
    // keep top-level unknown keys too
  });
  mockSettingsDoc = next;
  return cloneDeep(mockSettingsDoc);
}

function mergeSettings(incoming) {
  // Deep merge objects; arrays replaced wholesale
  const current = cloneDeep(mockSettingsDoc);
  const merged = {
    ...current,
    ...incoming,
    metadata: { ...current.metadata, ...incoming.metadata },
    settings: deepMergeObjects(current.settings || {}, incoming.settings || {})
  };
  mockSettingsDoc = normalizeForSave(merged);
  return cloneDeep(mockSettingsDoc);
}

// Helper to resolve page size from query or persisted settings
function resolvePageSize(req) {
  const q = parseInt(req.query.limit || req.query.pageSize || req.query.perPage, 10);
  if (!Number.isNaN(q) && q > 0) return q;
  const s = mockSettingsDoc?.settings?.performance?.pagination?.defaultLimit;
  return typeof s === 'number' && s > 0 ? s : 20;
}

function resolvePage(req) {
  const p = parseInt(req.query.page || req.query.currentPage, 10);
  if (!Number.isNaN(p) && p > 0) return p;
  return 1;
}

// Mock admin user
const mockAdminUser = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  admin: true,
  avatar: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, admin: user.admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Auth endpoints
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('[Mock Server] Login attempt:', email);
  
  // Check test credentials (include linkage demo account)
  if (
    (email === 'admin@test.com' && password === 'admin123') ||
    (email === 'testadmin@test.com' && password === 'test123') ||
    (email === 'admin@linkage.ph' && password === 'admin123')
  ) {
    const token = generateToken({ ...mockAdminUser, email });
    
    // Set cookies
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.json({
      success: true,
      token,
      user: { ...mockAdminUser, email }
    });
  } else {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      user: mockAdminUser
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true });
});

// Convenience responder for successful auth "clear-session" calls
app.get('/api/auth/clear-session', (req, res) => {
  res.clearCookie('authToken');
  return res.json({ success: true });
});

// Add POST variant for clear-session used by some clients
app.post('/api/auth/clear-session', (req, res) => {
  res.clearCookie('authToken');
  return res.json({ success: true });
});

// Profile/me endpoints for admin header bootstrap
app.get('/api/admin/profile', (req, res) => {
  const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, data: mockAdminUser });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

app.get('/api/admin/me', (req, res) => {
  const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return res.json({ success: true, data: mockAdminUser });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Admin analytics overview used after login/dashboard bootstrap
app.get('/api/admin/analytics', (req, res) => {
  const timeRange = req.query.timeRange || '30';
  return res.json({
    success: true,
    data: {
      timeRange,
      totals: {
        users: 1250,
        vas: 450,
        businesses: 85,
        conversations: 342,
      },
      charts: [],
      trend: 'stable'
    }
  });
});

// Additional auth login aliases to match various frontends
app.post('/api/auth/login', (req, res) => {
  req.url = '/api/auth/admin/login';
  return app._router.handle(req, res, () => {});
});

app.post('/auth/login', (req, res) => {
  req.url = '/api/auth/admin/login';
  return app._router.handle(req, res, () => {});
});

app.post('/api/admin/login', (req, res) => {
  req.url = '/api/auth/admin/login';
  return app._router.handle(req, res, () => {});
});

// Settings aliases (some UIs might hit without /admin)
app.get('/api/site-config', (req, res) => {
  req.url = '/api/admin/settings';
  return app._router.handle(req, res, () => {});
});

app.patch('/api/site-config', (req, res) => {
  req.url = '/api/admin/settings';
  return app._router.handle(req, res, () => {});
});

app.put('/api/site-config', (req, res) => {
  req.url = '/api/admin/settings';
  return app._router.handle(req, res, () => {});
});

// Mock admin endpoints
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1250,
      totalVAs: 450,
      totalBusinesses: 85,
      activeConversations: 342,
      pendingMessages: 27,
      todayNewUsers: 8,
      todayNewVAs: 3,
      todayNewBusinesses: 2,
      activeUsers30Days: 892
    }
  });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 1250,
        totalVAs: 450,
        totalBusinesses: 85,
        activeConversations: 342
      },
      recentActivity: [],
      notifications: []
    }
  });
});

// Mock Settings endpoints (admin + generic for compatibility)
// Settings JSON – canonical source of truth
app.get('/api/admin/settings', (req, res) => {
  return res.json({ success: true, data: cloneDeep(mockSettingsDoc) });
});

app.put('/api/admin/settings', (req, res) => {
  const incoming = req.body || {};
  // Auto-synthesize required fields if client PUTs a partial
  if (!incoming.metadata) incoming.metadata = { version: SETTINGS_VERSION, updatedAt: nowIso() };
  if (!incoming.settings) incoming.settings = {};
  const check = validateSettingsDoc(incoming);
  if (!check.ok) {
    return res.status(400).json({ success: false, code: check.code, error: check.message });
  }
  // Overwrite behavior
  const saved = overwriteSettings(incoming);
  return res.json({ success: true, data: saved });
});

app.get('/api/admin/settings/default', (req, res) => {
  return res.json({ success: true, data: createDefaultSettings() });
});

app.get('/api/admin/settings/export', (req, res) => {
  const out = maskSecretsForExport(mockSettingsDoc);
  const buf = Buffer.from(JSON.stringify(out, null, 2), 'utf8');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="va-hub-settings.json"');
  return res.send(buf);
});

app.post('/api/admin/settings/import', (req, res) => {
  const incoming = req.body || {};
  // Basic validation and migration fill-ins
  if (!incoming.metadata || typeof incoming.metadata !== 'object') {
    incoming.metadata = {};
  }
  if (typeof incoming.metadata.version !== 'string') {
    incoming.metadata.version = SETTINGS_VERSION;
  }
  if (typeof incoming.metadata.updatedAt !== 'string' || !isIsoDate(incoming.metadata.updatedAt)) {
    incoming.metadata.updatedAt = nowIso();
  }
  if (!incoming.settings || typeof incoming.settings !== 'object') {
    incoming.settings = {};
  }
  const check = validateSettingsDoc(incoming);
  if (!check.ok) {
    return res.status(400).json({ success: false, code: check.code, error: check.message });
  }

  // Select overwrite vs merge
  // Accept merge=true from query string or body
  const mergeRequested = (req.query.merge === 'true') || (req.body && req.body.merge === true);
  const toSave = { ...incoming }; // preserve unknown keys
  let saved;
  try {
    saved = mergeRequested ? mergeSettings(toSave) : overwriteSettings(toSave);
  } catch (e) {
    return res.status(500).json({
      success: false,
      code: 'save_error',
      error: 'Failed to persist settings'
    });
  }
  return res.json({ success: true, data: saved });
});

// Provide full configs used by admin-frontend Settings page
app.get('/api/admin/configs', (req, res) => {
  const settings = {
    regional: {
      language: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      autoDetectTimezone: false,
      useSystemLocale: false,
      firstDayOfWeek: 'sunday',
    },
    performance: {
      cache: { enabled: false, duration: 6010, strategy: 'memory', maxSize: '100MB' },
      pagination: { defaultLimit: mockSettingsDoc.settings.performance.pagination.defaultLimit, maxLimit: 100 },
      autoSave: { enabled: false, interval: 60, showNotification: false },
      lazyLoading: { enabled: false, threshold: 0.1 },
    },
  };
  return res.json({ success: true, settings, configs: { settings } });
});

app.put('/api/admin/configs', (req, res) => {
  const body = req.body || {};
  // Accept multiple shapes
  const rawSettings =
    body.settings ||
    (body.configs && (body.configs.settings || body.configs)) ||
    null;

  const defaultLimit =
    rawSettings?.performance?.pagination?.defaultLimit ??
    rawSettings?.performance?.pagination?.defaultPageSize ??
    rawSettings?.performance?.pagination?.pageSize;

  if (typeof defaultLimit !== 'undefined') {
    const n = Number(defaultLimit);
    if (!Number.isNaN(n) && n > 0) {
      // Also reflect into canonical doc
      mockSettingsDoc.settings.performance.pagination.defaultLimit = n;
      mockSettingsDoc.metadata.updatedAt = nowIso();
    }
  }

  const settings = {
    regional: rawSettings?.regional || {
      language: 'en',
      timezone: 'Asia/Manila',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      autoDetectTimezone: false,
      useSystemLocale: false,
      firstDayOfWeek: 'sunday',
    },
    performance: {
      cache: rawSettings?.performance?.cache || { enabled: false, duration: 6010, strategy: 'memory', maxSize: '100MB' },
      pagination: {
        defaultLimit: mockSettingsDoc.settings.performance.pagination.defaultLimit,
        maxLimit: rawSettings?.performance?.pagination?.maxLimit ?? 100,
      },
      autoSave: rawSettings?.performance?.autoSave || { enabled: false, interval: 60, showNotification: false },
      lazyLoading: rawSettings?.performance?.lazyLoading || { enabled: false, threshold: 0.1 },
    },
  };

  return res.json({ success: true, settings, configs: { settings } });
});

// Minimal stubs to silence frontend calls
app.get('/api/admin/invitations', (req, res) => {
  return res.json({ success: true, data: [], total: 0 });
});

app.put('/api/admin/profile', (req, res) => {
  // Accept any updates and echo back current mock admin user
  return res.json({ success: true, data: mockAdminUser });
});

// Mock VA endpoints
app.get('/api/admin/vas', (req, res) => {
  const pageSize = resolvePageSize(req);
  const currentPage = resolvePage(req);
  const totalItems = 100;
  const totalPages = Math.ceil(totalItems / pageSize);
  const data = Array.from({ length: pageSize }, (_, i) => ({
    id: `${(currentPage - 1) * pageSize + i + 1}`,
    name: `VA ${(currentPage - 1) * pageSize + i + 1}`,
  }));
  res.json({
    success: true,
    data,
    totalItems,
    currentPage,
    totalPages
  });
});

// Mock Business endpoints
app.get('/api/admin/businesses', (req, res) => {
  const pageSize = resolvePageSize(req);
  const currentPage = resolvePage(req);
  const totalItems = 55;
  const totalPages = Math.ceil(totalItems / pageSize);
  const data = Array.from({ length: pageSize }, (_, i) => ({
    id: `${(currentPage - 1) * pageSize + i + 1}`,
    name: `Business ${(currentPage - 1) * pageSize + i + 1}`,
  }));
  res.json({
    success: true,
    data,
    totalItems,
    currentPage,
    totalPages
  });
});

// Mock User endpoints
app.get('/api/admin/users', (req, res) => {
  const pageSize = resolvePageSize(req);
  const currentPage = resolvePage(req);
  const totalItems = 77;
  const totalPages = Math.ceil(totalItems / pageSize);
  const data = Array.from({ length: pageSize }, (_, i) => ({
    id: `${(currentPage - 1) * pageSize + i + 1}`,
    email: `user${(currentPage - 1) * pageSize + i + 1}@example.com`,
  }));
  res.json({
    success: true,
    data,
    totalItems,
    currentPage,
    totalPages
  });
});

// Mock Messages endpoints
app.get('/api/admin/messages', (req, res) => {
  res.json({
    success: true,
    data: {
      interceptedMessages: [],
      totalMessages: 0,
      currentPage: 1,
      totalPages: 1
    }
  });
});

// ============================
// Mock Intercepted Conversations (Messenger)
// ============================
const interceptedConversations = [
  {
    _id: 'conv_demo_1',
    businessId: 'biz_1001',
    businessName: 'Acme Widgets Ltd.',
    businessAvatar: null,
    vaId: 'va_2001',
    vaName: 'Maria Santos',
    vaAvatar: null,
    status: 'pending', // pending | forwarded | replied | resolved | spam
    adminStatus: 'pending',
    unreadCount: 2,
    lastMessage: 'Looking forward to working together!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    interceptedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    messages: [
      {
        _id: 'msg_demo_1_1',
        sender: 'business',
        senderModel: 'Business',
        content: 'Hi! I need a VA to handle email and calendar scheduling.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        _id: 'msg_demo_1_2',
        sender: 'admin',
        senderModel: 'Admin',
        content: 'Thanks for reaching out! Could you share your timezone and preferred working hours?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        _id: 'msg_demo_1_3',
        sender: 'business',
        senderModel: 'Business',
        content: 'We are in PST and prefer 9am–1pm support weekdays.',
        createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString()
      }
    ]
  },
  {
    _id: 'conv_demo_2',
    businessId: 'biz_1002',
    businessName: 'Globex Partners',
    businessAvatar: null,
    vaId: 'va_2002',
    vaName: 'Juan Dela Cruz',
    vaAvatar: null,
    status: 'resolved',
    adminStatus: 'resolved',
    archivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 0,
    lastMessage: 'Thank you for the details. We will get back to you shortly.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    interceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    messages: [
      {
        _id: 'msg_demo_2_1',
        sender: 'business',
        senderModel: 'Business',
        content: 'Do you offer weekend support?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString()
      },
      {
        _id: 'msg_demo_2_2',
        sender: 'admin',
        senderModel: 'Admin',
        content: 'Yes, we can arrange weekend coverage. What tasks do you need covered?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
      },
      {
        _id: 'msg_demo_2_3',
        sender: 'business',
        senderModel: 'Business',
        content: 'Mostly inbox triage and basic CRM updates.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString()
      }
    ]
  }
];

function interceptStatusCounts() {
  const counts = { all: 0, pending: 0, forwarded: 0, replied: 0, resolved: 0, spam: 0 };
  interceptedConversations.forEach(c => {
    counts.all += 1;
    if (counts[c.status] !== undefined) counts[c.status] += 1;
  });
  return counts;
}

// GET list of intercepted conversations (optional status filter: pending|resolved)
app.get('/api/admin/intercept/conversations', (req, res) => {
  const status = (req.query.status || '').toString().toLowerCase();
  const list = interceptedConversations.filter(c => {
    if (!status) return c.status !== 'deleted';
    return c.status === status;
  });
  const data = {
    conversations: list,
    statusCounts: interceptStatusCounts(),
    unreadCount: interceptedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  };
  return res.json({ success: true, data });
});

// GET single intercepted conversation
app.get('/api/admin/intercept/conversations/:id', (req, res) => {
  const conv = interceptedConversations.find(c => c._id === req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  return res.json({ success: true, data: conv });
});

// PUT mark conversation as read
app.put('/api/admin/intercept/conversations/:id/read', (req, res) => {
  const conv = interceptedConversations.find(c => c._id === req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  conv.unreadCount = 0;
  conv.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: conv });
});

// POST admin reply to business
app.post('/api/admin/intercept/reply/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const { message, attachments } = req.body || {};
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  const hasText = message && String(message).trim().length > 0;
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  if (!hasText && !hasAttachments) {
    return res.status(400).json({ success: false, error: 'Message or attachments are required' });
  }
  const msg = {
    _id: `msg_${Date.now()}`,
    sender: 'admin',
    senderModel: 'Admin',
    content: hasText ? String(message) : '',
    attachments: hasAttachments ? attachments.map(a => ({
      id: a.id || `upl_${Date.now()}`,
      name: a.name || 'file',
      type: a.mime || a.type || 'application/octet-stream',
      size: a.size || 0,
      url: a.url
    })) : undefined,
    createdAt: new Date().toISOString()
  };
  conv.messages.push(msg);
  if (hasText) {
    conv.lastMessage = msg.content;
  } else if (hasAttachments) {
    conv.lastMessage = `Sent attachment${attachments.length > 1 ? 's' : ''}: ${attachments[0].name || 'file'}`;
  }
  conv.status = conv.status === 'resolved' ? 'replied' : 'replied';
  conv.adminStatus = 'replied';
  conv.updatedAt = msg.createdAt;
  return res.json({ success: true, data: conv });
});

// POST forward conversation to VA
app.post('/api/admin/intercept/forward/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  conv.status = 'forwarded';
  conv.adminStatus = 'forwarded';
  conv.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: conv });
});

// PUT update conversation notes
app.put('/api/admin/intercept/notes/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const { notes } = req.body || {};
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  conv.adminNote = String(notes || '');
  conv.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: conv });
});

// PUT update conversation status (original endpoint)
app.put('/api/admin/intercept/status/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const { status } = req.body || {};
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  const allowed = new Set(['pending', 'forwarded', 'replied', 'resolved', 'spam']);
  if (!allowed.has(String(status))) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }
  conv.status = String(status);
  conv.adminStatus = String(status);
  if (conv.status === 'resolved') {
    conv.archivedAt = new Date().toISOString();
  } else if (conv.archivedAt && conv.status !== 'resolved') {
    delete conv.archivedAt;
  }
  conv.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: conv });
});

// Alias to match frontend path: /conversations/:id/status
app.put('/api/admin/intercept/conversations/:conversationId/status', (req, res) => {
  req.url = `/api/admin/intercept/status/${req.params.conversationId}`;
  return app._router.handle(req, res, () => {});
});

// Archive and Unarchive convenience endpoints
app.put('/api/admin/intercept/conversations/:conversationId/archive', (req, res) => {
  const { conversationId } = req.params;
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  conv.status = 'resolved';
  conv.adminStatus = 'resolved';
  conv.archivedAt = new Date().toISOString();
  conv.updatedAt = conv.archivedAt;
  return res.json({ success: true, data: conv });
});

app.put('/api/admin/intercept/conversations/:conversationId/unarchive', (req, res) => {
  const { conversationId } = req.params;
  const conv = interceptedConversations.find(c => c._id === conversationId);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });
  conv.status = 'pending';
  conv.adminStatus = 'pending';
  if (conv.archivedAt) delete conv.archivedAt;
  conv.updatedAt = new Date().toISOString();
  return res.json({ success: true, data: conv });
});

// POST batch operations (noop mock)
app.post('/api/admin/intercept/batch', (req, res) => {
  return res.json({ success: true, data: { updated: 0 } });
});

// GET intercept stats
app.get('/api/admin/intercept/stats', (req, res) => {
  const counts = interceptStatusCounts();
  const unread = interceptedConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  return res.json({ success: true, data: { statusCounts: counts, unreadCount: unread } });
});

// POST direct message to VA (mock acknowledgement)
app.post('/api/admin/intercept/direct-message/:vaId', (req, res) => {
  const { vaId } = req.params;
  const { message, conversationId } = req.body || {};
  // Optionally attach to an existing conversation for demo
  const conv = interceptedConversations.find(c => c._id === conversationId) || interceptedConversations[0];
  if (conv && message) {
    const msg = {
      _id: `msg_${Date.now()}`,
      sender: 'admin',
      senderModel: 'Admin',
      content: `[DM to VA ${vaId}] ${String(message)}`,
      createdAt: new Date().toISOString()
    };
    conv.messages.push(msg);
    conv.lastMessage = msg.content;
    conv.updatedAt = msg.createdAt;
  }
  return res.json({ success: true, data: { vaId, conversationId: conv?._id || null } });
});

// Optional Supabase client (if environment is configured)
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('[Mock Server] Supabase storage enabled');
  } catch (e) {
    supabase = null;
    console.warn('[Mock Server] Supabase not available; falling back to local storage:', e.message);
  }
}

// Multer setup – memory storage, type and size validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'audio/mpeg',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]);
    if (allowed.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Unsupported file type'));
  }
});

/**
 * Build a clean filename and derive extension.
 */
function makeAvatarKey(uid, originalName, mime) {
  const safeUid = String(uid || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  const base = String(originalName || 'avatar').replace(/[^a-zA-Z0-9._-]/g, '_');
  const extFromName = path.extname(base).toLowerCase();
  const extFromMime = (() => {
    if (!mime) return '';
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/gif') return '.gif';
    return extFromName || '';
  })();
  const ext = extFromName || extFromMime || '.jpg';
  const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `avatars/${safeUid}/${fileId}${ext}`;
}

/**
 * Ensure Supabase bucket exists (best-effort).
 */
async function ensureBucketExists(client, bucket) {
  try {
    const { data: buckets } = await client.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === bucket);
    if (!exists) {
      await client.storage.createBucket(bucket, { public: true });
    }
  } catch (e) {
    // Ignore if feature not available or already created
  }
}

/**
 * Avatar Upload Proxy
 * Route: POST /api/admin/profile/avatar
 * Form fields: userId, file
 * Returns: { url, storage, key, name, size, mime, signedUrl? }
 */
app.post('/api/admin/profile/avatar', upload.single('file'), async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  try {
    const uid = req.body.userId || 'unknown';
    if (!req.file) {
      console.error('[AvatarUpload] No file provided', { requestId, uid });
      return res.status(400).json({ message: 'No file', code: 'NO_FILE', requestId });
    }
    const allowedImage = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedImage.has(req.file.mimetype)) {
      console.error('[AvatarUpload] Invalid type', { requestId, uid, mime: req.file.mimetype });
      return res.status(415).json({ message: 'Invalid image type (jpeg/png/webp only)', code: 'UNSUPPORTED_TYPE', requestId });
    }
    if (req.file.size > 5 * 1024 * 1024) {
      console.error('[AvatarUpload] Too large', { requestId, uid, size: req.file.size });
      return res.status(413).json({ message: 'File too large (max 5MB)', code: 'TOO_LARGE', requestId });
    }

    const key = makeAvatarKey(uid, req.file.originalname, req.file.mimetype);
    let url = null;
    let storage = 'local';

    if (supabase) {
      try {
        await ensureBucketExists(supabase, 'avatars');
        const up = await supabase.storage.from('avatars').upload(key, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false // use unique keys, avoid overwrite
        });
        if (up.error) {
          // Retry with different key on conflict (409)
          if (up.error?.statusCode === 409 || String(up.error?.message || '').toLowerCase().includes('duplicate')) {
            const retryKey = makeAvatarKey(uid, `retry-${req.file.originalname}`, req.file.mimetype);
            const up2 = await supabase.storage.from('avatars').upload(retryKey, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: false
            });
            if (up2.error) {
              console.error('[AvatarUpload] Supabase upload retry failed', { requestId, uid, err: up2.error });
              return res.status(500).json({ message: 'Supabase upload failed', code: 'UPLOAD_FAILED', requestId, detail: up2.error.message });
            }
            const pub = await supabase.storage.from('avatars').getPublicUrl(retryKey);
            url = pub?.data?.publicUrl || null;
            storage = 'supabase';
          } else {
            console.error('[AvatarUpload] Supabase upload failed', { requestId, uid, err: up.error });
            return res.status(500).json({ message: 'Supabase upload failed', code: 'UPLOAD_FAILED', requestId, detail: up.error.message });
          }
        } else {
          const pub = await supabase.storage.from('avatars').getPublicUrl(key);
          url = pub?.data?.publicUrl || null;
          storage = 'supabase';
        }
      } catch (e) {
        console.error('[AvatarUpload] Supabase error', { requestId, uid, err: e });
        // fall back to local
      }
    }

    if (!url) {
      // Fallback to local disk
      const outPath = path.join(uploadsDir, key);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${key}`;
      storage = 'local';
    }

    // Optionally update Supabase public.profiles table (if Supabase configured)
    if (supabase) {
      try {
        // Ensure profiles table has row; update avatar_url where id == uid
        const { error: upErr } = await supabase.from('profiles').upsert({ id: uid, avatar_url: url }).select().single();
        if (upErr) {
          console.warn('[AvatarUpload] profiles upsert warning', { requestId, uid, err: upErr.message });
        }
      } catch (e) {
        console.warn('[AvatarUpload] profiles upsert exception', { requestId, uid, err: e.message });
      }
    }

    console.log('[AvatarUpload] Success', { requestId, uid, storage, key });
    return res.json({
      success: true,
      url,
      storage,
      key,
      name: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
      requestId
    });
  } catch (err) {
    console.error('[AvatarUpload] Fatal error', { requestId, err });
    return res.status(500).json({ message: 'Avatar upload failed', code: 'SERVER_ERROR', requestId, detail: String(err.message || err) });
  }
});

// New upload endpoint used by frontend
app.post('/api/admin/intercept/attachments', upload.single('file'), async (req, res) => {
  await handleAttachmentUpload(req, res);
});

// Backward compatibility alias (older UI path)
app.post('/api/admin/intercept/conversations/:id/upload', upload.single('file'), async (req, res) => {
  req.body.conversationId = req.params.id;
  await handleAttachmentUpload(req, res);
});

// Mock Notifications endpoints
app.get('/api/admin/notifications', (req, res) => {
  res.json({
    success: true,
    data: [],
    totalItems: 0
  });
});

// Mock Site Config endpoints
app.get('/api/admin/site-config', (req, res) => {
  res.json({
    success: true,
    data: {
      businessPricing: {
        monthlyPrice: 99,
        yearlyPrice: 999,
        features: []
      },
      vaPricing: {
        monthlyPrice: 29,
        yearlyPrice: 299,
        features: []
      },
      commissionRates: {
        standard: 10,
        premium: 15
      }
    }
  });
});

// Universal search endpoint
app.get('/api/admin/search/universal', (req, res) => {
  res.json({
    success: true,
    data: {
      vas: [],
      businesses: [],
      users: [],
      messages: [],
      notifications: [],
      conversations: [],
      totalResults: 0
    }
  });
});

// ============================
// Mock Uploads (in-memory store)
// ============================
const uploads = []; // { id, name, type, size, url }

// Tiny 1x1 PNG pixel (transparent)
const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
  'base64'
);

// Very small PDF header bytes to make browsers download; not a real PDF file
const TINY_PDF = Buffer.from('%PDF-1.4\n% Mock PDF\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF', 'utf8');

// Very small DOCX mock (not a valid docx, but good enough to simulate download)
const TINY_DOCX = Buffer.from('PK\u0003\u0004MOCK-DOCX', 'utf8');

function getMockFileBufferByType(type) {
  if (type && type.startsWith('image/')) return ONE_BY_ONE_PNG;
  if (type === 'application/pdf') return TINY_PDF;
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
  ) return TINY_DOCX;
  // default to text
  return Buffer.from('Mock file content', 'utf8');
}

// Serve mock uploaded content
app.get('/api/mock-upload/:id/:filename', (req, res) => {
  const file = uploads.find(u => u.id === req.params.id);
  if (!file) {
    return res.status(404).send('Not found');
  }
  const buf = getMockFileBufferByType(file.type);
  res.setHeader('Content-Type', file.type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
  return res.send(buf);
});

// Catch all for other API routes
app.use('/api/*', (req, res) => {
  console.log('[Mock Server] Unhandled route:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found in mock server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
============================================
Mock Backend Server Running
============================================
Port: ${PORT}
Mode: Development (No Database Required)

Test Credentials:
  Email: admin@test.com OR testadmin@test.com
  Password: admin123 OR test123

This is a mock server for development/testing.
No database connection is required.
============================================
  `);
});