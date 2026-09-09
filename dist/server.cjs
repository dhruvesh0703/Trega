var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var Sentry = __toESM(require("@sentry/node"), 1);
var import_profiling_node = require("@sentry/profiling-node");
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_vite = require("vite");

// src/lib/firebase-admin.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_auth = require("firebase/auth");
var firebaseConfig = { "projectId": "lithe-disk-8gbcx", "appId": "1:381942828602:web:3d9f6436d3c6eba68faf03", "apiKey": "AIzaSyBVJdwJPCuu-Jkjmg_L79RmeXNCSUZnMlo", "authDomain": "lithe-disk-8gbcx.firebaseapp.com", "firestoreDatabaseId": "ai-studio-tregapunehyperlo-7f965375-01ec-4342-a71b-23e282efc003", "storageBucket": "lithe-disk-8gbcx.firebasestorage.app", "messagingSenderId": "381942828602", "measurementId": "G-YEQZXBH8HV" };
var app;
if ((0, import_app.getApps)().length) {
  app = (0, import_app.getApp)();
} else {
  app = (0, import_app.initializeApp)(firebaseConfig);
}
var db = (0, import_firestore.getFirestore)(app, firebaseConfig.firestoreDatabaseId);
var adminAuth = (0, import_auth.getAuth)(app);

// server.ts
var import_firestore2 = require("firebase/firestore");
var app2 = (0, import_express.default)();
app2.set("trust proxy", 1);
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN,
  integrations: [(0, import_profiling_node.nodeProfilingIntegration)()],
  tracesSampleRate: 1,
  profilesSampleRate: 1
});
var PORT = 3e3;
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    Sentry.captureMessage(`Rate limit exceeded for IP ${req.ip}`, "warning");
    res.status(options.statusCode).json({ error: "Too many requests, please try again later." });
  }
});
var requireCsrfHeader = (req, res, next) => {
  if (req.path.startsWith("/api/cashfree/webhook")) {
    return next();
  }
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const clientHeader = req.headers["x-trega-client"];
    if (clientHeader !== "trega-web-app") {
      Sentry.captureMessage(`CSRF token missing or invalid on ${req.method} ${req.path}`, "warning");
      return res.status(403).json({ error: "Forbidden: CSRF protection triggered. Missing or invalid client header." });
    }
  }
  next();
};
app2.use("/api/", apiLimiter);
app2.use("/api/", requireCsrfHeader);
app2.use(import_express.default.json({
  limit: "25mb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  }
}));
app2.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
var authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    Sentry.captureException(error, { tags: { reason: "token_verification_failed" } });
    return res.status(401).json({ error: "Unauthorized: Token expired or invalid" });
  }
};
var CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
var CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
var CASHFREE_ENV = process.env.CASHFREE_ENV || "SANDBOX";
var CASHFREE_URL = CASHFREE_ENV === "PRODUCTION" ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders";
app2.post("/api/cashfree/create-order", authenticateUser, async (req, res) => {
  try {
    const { amount, currency = "INR", customer_id, buyer_name, phone, email, purpose } = req.body;
    const cleanPhone = (phone || "").replace(/\D/g, "").slice(-10) || "9822100293";
    const payload = {
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: customer_id || "guest",
        customer_phone: cleanPhone,
        customer_email: email || "test@example.com",
        customer_name: (buyer_name || "Guest User").slice(0, 100)
      },
      order_meta: {},
      order_note: (purpose || "").slice(0, 200)
    };
    const response = await fetch(CASHFREE_URL, {
      method: "POST",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Cashfree order creation failed:", data);
      return res.status(400).json({ error: typeof data.message === "string" ? data.message : JSON.stringify(data) });
    }
    return res.json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: data.order_id,
      environment: CASHFREE_ENV
    });
  } catch (error) {
    console.error("Cashfree checkout error:", error);
    return res.status(500).json({ error: "Internal server error while creating Cashfree order" });
  }
});
app2.post("/api/cashfree/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];
    if (!signature || !timestamp) {
      return res.status(200).json({ success: true, message: "Webhook endpoint is active" });
    }
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = import_crypto.default.createHmac("sha256", CASHFREE_SECRET_KEY).update(timestamp + rawBody).digest("base64");
    if (signature !== expectedSignature) {
      console.warn("Cashfree webhook signature mismatch");
      Sentry.captureMessage("Webhook signature verification failed", "error");
      return res.status(403).json({ error: "Forbidden: Invalid webhook signature" });
    }
    const payload = req.body;
    if (payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId = payload.data.order.order_id;
      const orderRef = (0, import_firestore2.doc)(db, "orders", `${orderId}`);
      await (0, import_firestore2.setDoc)(orderRef, {
        paymentStatus: "SUCCESS",
        cashfreeStatus: payload.data.payment.payment_status,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Cashfree webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app2.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "trega-manual-kyc-api",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    pendingKycCount: 0
  });
});
app2.post("/api/metrics", (req, res) => {
  const { type, data, url, userAgent } = req.body;
  console.log(`[Performance Metric] ${type}:`, JSON.stringify({ url, userAgent, ...data }));
  res.json({ success: true });
});
app2.get("/api/cashfree/verify/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const url = CASHFREE_ENV === "PRODUCTION" ? `https://api.cashfree.com/pg/orders/${orderId}` : `https://sandbox.cashfree.com/pg/orders/${orderId}`;
    const response = await fetch(url, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Cashfree verify err:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app2.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found", code: "NOT_FOUND", message: "The requested API endpoint does not exist. Please check your request path." });
});
async function startServer() {
  const validRoutes = ["/", "/policies"];
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/@") || req.path.startsWith("/node_modules/") || req.path.startsWith("/src/") || req.path.includes(".") && !req.path.endsWith(".html")) {
      return next();
    }
    const isKnown = req.path === "/" || validRoutes.some((route) => route !== "/" && req.path.startsWith(route));
    if (!isKnown) {
      return res.status(404).send("# 404 Not Found\n\nPlease visit our [Homepage](/) or check [llms.txt](/llms.txt).");
    }
    next();
  });
  const transporter = import_nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || ""
    }
  });
  app2.post("/api/notify", authenticateUser, async (req, res) => {
    try {
      const { userId, type, data } = req.body;
      const authenticatedUid = req.user.uid;
      if (!userId || !type) {
        return res.status(400).json({ error: "Missing userId or type" });
      }
      if (userId !== authenticatedUid && type !== "OFFER_RECEIVED") {
      }
      const userDocRef = (0, import_firestore2.doc)(db, "users", userId);
      const userSnap = await (0, import_firestore2.getDoc)(userDocRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = userSnap.data();
      if (!user.email) {
        return res.status(400).json({ error: "User has no email configured" });
      }
      let subject = "";
      let text = "";
      let html = "";
      if (type === "OFFER_RECEIVED") {
        subject = `New Offer Received on Trega!`;
        text = `Hi ${user.name},

You received a new offer of \u20B9${data.offeredPrice} for your item "${data.listingTitle}".
Buyer message: "${data.message}"

Login to Trega to accept or decline.`;
        html = `<p>Hi ${user.name},</p><p>You received a new offer of <strong>\u20B9${data.offeredPrice}</strong> for your item "<strong>${data.listingTitle}</strong>".</p><p>Buyer message: "<i>${data.message}</i>"</p><p>Login to Trega to accept or decline.</p>`;
      } else if (type === "DISPUTE_RESOLVED") {
        subject = `Dispute Resolved for Order #${data.orderId}`;
        text = `Hi ${user.name},

Your dispute for order #${data.orderId} has been resolved.
Resolution: ${data.resolutionStatus}

Thank you for using Trega.`;
        html = `<p>Hi ${user.name},</p><p>Your dispute for order <strong>#${data.orderId}</strong> has been resolved.</p><p>Resolution: <strong>${data.resolutionStatus}</strong></p><p>Thank you for using Trega.</p>`;
      } else {
        return res.status(400).json({ error: "Unknown notification type" });
      }
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("[MOCK EMAIL] To:", user.email, "| Subject:", subject);
        return res.json({ success: true, mock: true, message: "SMTP credentials missing, email mocked." });
      }
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Trega Notifications" <noreply@trega.com>',
        to: user.email,
        subject,
        text,
        html
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Email notification error:", err);
      res.status(500).json({ error: "Failed to send email notification" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app2.use(import_express.default.static(distPath));
    app2.get("*", (req, res) => {
      if (req.path.includes(".") && !req.path.endsWith(".html")) {
        return res.status(404).send("404 Not Found");
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app2.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred." : err.message
    });
  });
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Trega Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
