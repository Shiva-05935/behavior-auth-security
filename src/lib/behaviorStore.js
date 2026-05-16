// Simulated user behavior store
const DEFAULT_USERS = {
  "admin@test.com": {
    password: "password123",
    name: "Alex Johnson",
    behaviorProfile: null
  },
  "demo@test.com": {
    password: "demo1234",
    name: "Demo User",
    behaviorProfile: null
  }
};

const STORAGE_KEY = "bba_users";
const SESSION_KEY = "bba_session";

function getUsers() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function registerUser(email, password, name) {
  const users = getUsers();
  const key = email.toLowerCase();
  if (users[key]) return { success: false, error: "Email already registered" };
  users[key] = { password, name, behaviorProfile: null };
  saveUsers(users);
  return { success: true };
}

export function authenticateCredentials(email, password) {
  const users = getUsers();
  const user = users[email.toLowerCase()];
  if (!user) return { success: false, error: "User not found" };
  if (user.password !== password) return { success: false, error: "Invalid password" };
  return { success: true, user: { email: email.toLowerCase(), name: user.name } };
}

export function getUserBehaviorProfile(email) {
  const users = getUsers();
  return users[email.toLowerCase()]?.behaviorProfile || null;
}

export function saveBehaviorProfile(email, profile) {
  const users = getUsers();
  if (users[email.toLowerCase()]) {
    users[email.toLowerCase()].behaviorProfile = profile;
    saveUsers(users);
    return true;
  }
  return false;
}

export function resetPassword(email, newPassword) {
  const users = getUsers();
  const key = email.toLowerCase();
  if (!users[key]) return { success: false, error: "User not found" };
  users[key].password = newPassword;
  saveUsers(users);
  return { success: true };
}

export function compareBehavior(current, saved) {
  if (!saved) return { match: true, confidence: 100, details: "No saved profile — first login" };

  const typingSpeedDiff = Math.abs(current.typingSpeed - saved.typingSpeed) / Math.max(saved.typingSpeed, 1);
  const intervalDiff = Math.abs(current.avgInterval - saved.avgInterval) / Math.max(saved.avgInterval, 1);
  const holdDiff = Math.abs(current.avgHoldDuration - saved.avgHoldDuration) / Math.max(saved.avgHoldDuration, 1);
  const mouseSpeedDiff = Math.abs(current.mouseSpeed - saved.mouseSpeed) / Math.max(saved.mouseSpeed, 1);

  const typingScore = Math.max(0, 100 - typingSpeedDiff * 100);
  const intervalScore = Math.max(0, 100 - intervalDiff * 100);
  const holdScore = Math.max(0, 100 - holdDiff * 100);
  const mouseScore = Math.max(0, 100 - mouseSpeedDiff * 80);

  const confidence = Math.round(typingScore * 0.3 + intervalScore * 0.3 + holdScore * 0.2 + mouseScore * 0.2);
  const match = confidence >= 75;

  return {
    match,
    confidence: Math.min(confidence, 100),
    details: match ? "Behavior pattern matches" : "Behavior mismatch detected",
    breakdown: {
      typingScore: Math.round(typingScore),
      intervalScore: Math.round(intervalScore),
      holdScore: Math.round(holdScore),
      mouseScore: Math.round(mouseScore)
    }
  };
}

export function setSession(userData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...userData, loginTime: Date.now() }));
}

export function getSession() {
  const s = localStorage.getItem(SESSION_KEY);
  if (!s) return null;
  const session = JSON.parse(s);
  if (Date.now() - session.loginTime > 30 * 60 * 1000) {
    clearSession();
    return null;
  }
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}