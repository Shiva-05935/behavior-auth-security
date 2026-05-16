// Fetches the real public IP of the current visitor
// and records session events to the UserSession entity

import { base44 } from "@/api/base44Client";

let cachedIp = null;

export async function getPublicIp() {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    cachedIp = data.ip;
    return cachedIp;
  } catch {
    return "Unknown";
  }
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = "Unknown Device";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) device = "Android";
  else if (/Windows/i.test(ua)) device = "Windows PC";
  else if (/Mac/i.test(ua)) device = "Mac";
  else if (/Linux/i.test(ua)) device = "Linux";

  let browser = "Unknown Browser";
  if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Edge/i.test(ua)) browser = "Edge";

  return `${browser} / ${device}`;
}

export async function recordVisitor() {
  const ip = await getPublicIp();
  if (ip === "Unknown") return;
  const device = getDeviceInfo();
  try {
    // Only create if no existing record for this IP as visitor (avoid spam)
    const existing = await base44.entities.UserSession.filter({ ip, event: "visited" });
    if (existing && existing.length > 0) return; // already tracked
    await base44.entities.UserSession.create({
      email: "visitor@unknown",
      ip,
      device,
      event: "visited",
      status: "active",
      failed_attempts: 0,
      otp_used: false,
    });
  } catch (e) {
    // silent
  }
}

export async function recordSessionEvent({ email, event, behaviorConfidence = null, failedAttempts = 0, otpUsed = false }) {
  const ip = await getPublicIp();
  const device = getDeviceInfo();

  // Check if there's already an active session for this IP + email
  try {
    const existing = await base44.entities.UserSession.filter({ email, ip });
    if (existing && existing.length > 0) {
      // Update the existing record
      await base44.entities.UserSession.update(existing[0].id, {
        event,
        status: otpUsed ? "otp_required" : failedAttempts >= 3 ? "suspicious" : "active",
        behavior_confidence: behaviorConfidence,
        failed_attempts: failedAttempts,
        otp_used: otpUsed,
        device,
      });
      return existing[0].id;
    }
  } catch (e) {
    // continue to create
  }

  const record = await base44.entities.UserSession.create({
    email,
    ip,
    device,
    event,
    status: otpUsed ? "otp_required" : failedAttempts >= 3 ? "suspicious" : "active",
    behavior_confidence: behaviorConfidence,
    failed_attempts: failedAttempts,
    otp_used: otpUsed,
  });
  return record.id;
}

export async function isIpBlocked() {
  const ip = await getPublicIp();
  if (ip === "Unknown") return false;
  try {
    const sessions = await base44.entities.UserSession.filter({ ip, status: "blocked" });
    return sessions && sessions.length > 0;
  } catch {
    return false;
  }
}