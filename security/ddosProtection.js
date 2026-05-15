import rateLimit from "express-rate-limit";
import {
  addAttackLog,
} from "./attackLogs.js";
const blockedIPs = new Set();

// RATE LIMITER
export const ddosProtection = rateLimit({

  windowMs: 60 * 1000,

  max: 50,

  message: {
    success: false,
    message: "Too many requests detected",
  },

  handler: (req, res) => {

    blockedIPs.add(req.ip);
    addAttackLog(
  req.ip,
  "DDoS Attack"
);
    console.log(
      `DDoS attack blocked from IP: ${req.ip}`
    );

    res.status(429).json({
      success: false,
      message: "DDoS protection activated",
    });
  },
});

// BLOCKED IP CHECK
export const ipBlocker = (
  req,
  res,
  next
) => {

  if (blockedIPs.has(req.ip)) {

    return res.status(403).json({
      success: false,
      message: "IP blocked by firewall",
    });
  }

  next();
};