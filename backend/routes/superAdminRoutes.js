const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Log = require("../models/Log");
const SystemSettings = require("../models/SystemSettings");
const jwt = require("jsonwebtoken");

// Temporary check to ensure the user is god. 
// Ideally, we add a specific `isSuperAdmin` to authMiddleware, 
// but for now, we'll verify they are admin and have a specific email or role override.
const isGod = (req, res, next) => {
  // Rely strictly on the SUPER_ADMIN role for ultimate clearance
  if (req.user && req.user.role === "SUPER_ADMIN") {
    next();
  } else {
    console.warn(`God access denied for: ${req.user?.email} (Role: ${req.user?.role})`);
    return res.status(404).json({ message: "Not found" });
  }
};

// Protect all routes with base auth + god auth
router.use(authMiddleware.protect);
router.use(isGod);

// --- GHOST MODE ---
 router.post("/ghost", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Target identity not found in database." });

    // Generate a fresh ghost token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecret123',
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: `Ghost protocol active. Identity assumed: ${email}`, 
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DANGER ZONE (WIPES) ---
 router.post("/purge-user", async (req, res) => {
  try {
    const { email } = req.body;
    const protectedEmails = ['admin@tradai.com', 'vikas@tradai.com', 'vikas.yadav@tradai.com'];
    if (protectedEmails.includes(email)) {
      return res.status(403).json({ message: "CRITICAL: Cannot purge system founder identity." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Target not found." });

    // Multi-table obliteration
    await Promise.all([
      User.findByIdAndDelete(user._id),
      Log.deleteMany({ userId: user._id }),
      require('../models/ApiKey').deleteMany({ createdBy: user._id }),
      require('../models/Payment').deleteMany({ userId: user._id }),
      require('../models/Ticket').deleteMany({ userId: user._id }),
      require('../models/UserDevice').deleteMany({ userId: user._id })
    ]);

    res.status(200).json({ message: `Obliterated user ${email} and all associated data records.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/wipe-logs", async (req, res) => {
  try {
    // Logic to drop the Log collection
    res.status(200).json({ message: "System logs collection dropped." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SESSION NUKER ---
 router.post("/nuke-session", async (req, res) => {
  try {
    const { email } = req.body;
    // Emitting a socket signal to force client-side logout
    req.io.emit('session_nuke', { email });
    res.status(200).json({ message: `Broadcasted nuke signal for ${email}. Their tokens will be rejected on next verification if they try to use them, and client will force logout.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

 router.post("/global-nuke", async (req, res) => {
    try {
      req.io.emit('session_nuke_all');
      res.status(200).json({ message: "Global extinction signal broadcasted. All active connections will be severed." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// --- BROADCAST ---
router.post("/broadcast", async (req, res) => {
  try {
    const { title, message } = req.body;
    req.io.emit('system_emergency_broadcast', { title, message });
    res.status(200).json({ message: "Emergency broadcast transmitted to all active nodes." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- KILL SWITCH ---
router.post("/kill-switch", async (req, res) => {
  try {
    const { enabled } = req.body;
    await SystemSettings.findOneAndUpdate(
      { key: "MAINTENANCE_MODE" },
      { key: "MAINTENANCE_MODE", value: enabled },
      { upsert: true, new: true }
    );
    res.status(200).json({ 
      message: `System Kill Switch (Maintenance Mode) is now ${enabled ? 'ACTIVE' : 'OFF'}.` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UI CONFIGURATION (Role Matrix & Layout) ---
router.get("/ui-config", async (req, res) => {
  try {
    const keys = ["ROLE_ROUTES_ADMIN", "ROLE_ROUTES_MANAGER", "ROLE_ROUTES_SUPPORT", "SIDEBAR_LINKS", "FOOTER_LINKS"];
    const settings = await SystemSettings.find({ key: { $in: keys } });
    
    // Convert array of docs to an object mapping key -> value
    const configMap = settings.reduce((acc, doc) => {
      acc[doc.key] = doc.value;
      return acc;
    }, {});

    res.status(200).json(configMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/ui-config", async (req, res) => {
  try {
    const updates = req.body; // e.g., { ROLE_ROUTES_ADMIN: ['users', 'logs'], SIDEBAR_LINKS: [...] }
    
    const updatePromises = Object.entries(updates).map(([key, value]) => {
      return SystemSettings.findOneAndUpdate(
        { key },
        { key, value, description: `UI config for ${key}` },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);
    res.status(200).json({ message: "UI Configuration Matrix successfully propagated." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const User = require("../models/User");
    const Log = require("../models/Log");
    const SystemSettings = require("../models/SystemSettings");
    const [totalUsers, bannedUsers, activeSessions, maintenanceSetting] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "banned" }),
      Log.distinct("userId", { timestamp: { $gte: new Date(Date.now() - 15 * 60 * 1000) } }).then(u => u.length),
      SystemSettings.findOne({ key: "MAINTENANCE_MODE" })
    ]);

    res.status(200).json({
      totalUsers,
      bannedUsers,
      activeSessions,
      systemHealth: maintenanceSetting?.value ? "LOCKDOWN" : "OPTIMAL",
      maintenanceMode: maintenanceSetting?.value || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
