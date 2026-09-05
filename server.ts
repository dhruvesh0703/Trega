import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

import { db, adminAuth } from './src/lib/firebase-admin';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const app = express();
app.set('trust proxy', 1);

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

const PORT = 3000;

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Sentry.captureMessage(`Rate limit exceeded for IP ${req.ip}`, 'warning');
    res.status(options.statusCode).json({ error: 'Too many requests, please try again later.' });
  }
});

// CSRF Protection Middleware for API Routes
// Enforces that sensitive requests must come from our own client applications
// by requiring a custom header that browsers won't automatically send cross-origin
const requireCsrfHeader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Exclude webhooks which are server-to-server and authenticated via HMAC signatures
  if (req.path.startsWith('/api/cashfree/webhook')) {
    return next();
  }

  // Only apply to state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const clientHeader = req.headers['x-trega-client'];
    if (clientHeader !== 'trega-web-app') {
      Sentry.captureMessage(`CSRF token missing or invalid on ${req.method} ${req.path}`, 'warning');
      return res.status(403).json({ error: 'Forbidden: CSRF protection triggered. Missing or invalid client header.' });
    }
  }
  next();
};

app.use('/api/', apiLimiter);
app.use('/api/', requireCsrfHeader);

app.use(express.json({ 
  limit: '25mb',
  verify: (req, res, buf) => {
    (req as any).rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

function sanitizeFirestoreObject<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

// Security Middleware to verify Firebase ID Tokens
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decodedToken; 
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    Sentry.captureException(error, { tags: { reason: 'token_verification_failed' } });
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

// Cashfree config
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'SANDBOX';
const CASHFREE_URL = CASHFREE_ENV === 'PRODUCTION' 
  ? 'https://api.cashfree.com/pg/orders'
  : 'https://sandbox.cashfree.com/pg/orders';

app.post('/api/cashfree/create-order', authenticateUser, async (req, res) => {
  try {
    const { amount, currency = 'INR', customer_id, buyer_name, phone, email, purpose } = req.body;
    
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10) || '9822100293';
    
    const payload = {
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customer_id || 'guest',
        customer_phone: cleanPhone,
        customer_email: email || 'test@example.com',
        customer_name: (buyer_name || 'Guest User').slice(0, 100)
      },
      order_meta: {},
      order_note: (purpose || '').slice(0, 200)
    };

    const response = await fetch(CASHFREE_URL, {
      method: 'POST',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Cashfree order creation failed:', data);
      return res.status(400).json({ error: typeof data.message === 'string' ? data.message : JSON.stringify(data) });
    }

    return res.json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      environment: CASHFREE_ENV
    });

  } catch (error) {
    console.error('Cashfree checkout error:', error);
    return res.status(500).json({ error: 'Internal server error while creating Cashfree order' });
  }
});

app.post('/api/cashfree/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(200).json({ success: true, message: 'Webhook endpoint is active' });
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(timestamp + rawBody)
      .digest('base64');

    if (signature !== expectedSignature) {
      console.warn('Cashfree webhook signature mismatch');
      Sentry.captureMessage('Webhook signature verification failed', 'error');
      return res.status(403).json({ error: 'Forbidden: Invalid webhook signature' });
    }

    const payload = req.body;
    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data.order.order_id;
      const orderRef = doc(db, 'orders', `${orderId}`);
      
      await setDoc(orderRef, {
        paymentStatus: 'SUCCESS',
        cashfreeStatus: payload.data.payment.payment_status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'trega-manual-kyc-api',
    time: new Date().toISOString(),
    pendingKycCount: 0,
  });
});

app.post('/api/metrics', (req, res) => {
  const { type, data, url, userAgent } = req.body;
  // This helps identify white-screens and rate limit issues in production
  console.log(`[Performance Metric] ${type}:`, JSON.stringify({ url, userAgent, ...data }));
  res.json({ success: true });
});

app.get('/api/cashfree/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = CASHFREE_ENV === 'PRODUCTION' 
      ? `https://api.cashfree.com/pg/orders/${orderId}`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    const response = await fetch(url, {
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Cashfree verify err:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', code: 'NOT_FOUND', message: 'The requested API endpoint does not exist. Please check your request path.' });
});

async function startServer() {
  const validRoutes = ['/', '/policies'];
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/@') || req.path.startsWith('/node_modules/') || req.path.startsWith('/src/') || (req.path.includes('.') && !req.path.endsWith('.html'))) {
      return next();
    }
    const isKnown = req.path === '/' || validRoutes.some(route => route !== '/' && req.path.startsWith(route));
    if (!isKnown) {
      return res.status(404).send('# 404 Not Found\n\nPlease visit our [Homepage](/) or check [llms.txt](/llms.txt).');
    }
    next();
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  app.post('/api/notify', authenticateUser, async (req, res) => {
    try {
      const { userId, type, data } = req.body;
      const authenticatedUid = (req as any).user.uid;

      if (!userId || !type) {
        return res.status(400).json({ error: 'Missing userId or type' });
      }

      if (userId !== authenticatedUid && type !== 'OFFER_RECEIVED') {
         // Allow system to send to others, but restrict generic self-notifications if needed
         // For stricter security:
         // return res.status(403).json({ error: 'Forbidden: Cannot trigger notifications for other users' });
      }

      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userSnap.data();
      if (!user.email) {
        return res.status(400).json({ error: 'User has no email configured' });
      }

      let subject = '';
      let text = '';
      let html = '';

      if (type === 'OFFER_RECEIVED') {
        subject = `New Offer Received on Trega!`;
        text = `Hi ${user.name},\n\nYou received a new offer of ₹${data.offeredPrice} for your item "${data.listingTitle}".\nBuyer message: "${data.message}"\n\nLogin to Trega to accept or decline.`;
        html = `<p>Hi ${user.name},</p><p>You received a new offer of <strong>₹${data.offeredPrice}</strong> for your item "<strong>${data.listingTitle}</strong>".</p><p>Buyer message: "<i>${data.message}</i>"</p><p>Login to Trega to accept or decline.</p>`;
      } else if (type === 'DISPUTE_RESOLVED') {
        subject = `Dispute Resolved for Order #${data.orderId}`;
        text = `Hi ${user.name},\n\nYour dispute for order #${data.orderId} has been resolved.\nResolution: ${data.resolutionStatus}\n\nThank you for using Trega.`;
        html = `<p>Hi ${user.name},</p><p>Your dispute for order <strong>#${data.orderId}</strong> has been resolved.</p><p>Resolution: <strong>${data.resolutionStatus}</strong></p><p>Thank you for using Trega.</p>`;
      } else {
        return res.status(400).json({ error: 'Unknown notification type' });
      }

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('[MOCK EMAIL] To:', user.email, '| Subject:', subject);
        return res.json({ success: true, mock: true, message: 'SMTP credentials missing, email mocked.' });
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Trega Notifications" <noreply@trega.com>',
        to: user.email,
        subject,
        text,
        html,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Email notification error:', err);
      res.status(500).json({ error: 'Failed to send email notification' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).send('404 Not Found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trega Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
