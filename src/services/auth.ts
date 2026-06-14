import {
  dbFindByEmail,
  dbCreateUser,
  dbGetSession,
  dbSetSession,
  DBUser,
  dbAdminLogin,
  verifyPassword,
  checkLoginRateLimit,
  recordLoginAttempt,
  clearLoginAttempts,
} from './localDB';

// ─── Şifre Validasyonu ──────────────────────────────────────
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) return { valid: false, error: 'Şifre en az 8 karakter olmalı' };
  if (!/\d/.test(password)) return { valid: false, error: 'Şifre en az bir rakam içermeli' };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, error: 'Şifre en az bir harf içermeli' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Şifre en az bir büyük harf içermeli' };
  return { valid: true };
};

// ─── Kayıt ──────────────────────────────────────────────────
export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: DBUser }> => {
  const pv = validatePassword(password);
  if (!pv.valid) return { success: false, error: pv.error };

  const existing = dbFindByEmail(email);
  if (existing) return { success: false, error: 'Bu e-posta adresi zaten kayıtlı' };

  const user = await dbCreateUser(firstName, lastName, email, password);
  dbSetSession(user);
  return { success: true, user };
};

// ─── Giriş ──────────────────────────────────────────────────
export const loginUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: DBUser }> => {
  const rateLimit = checkLoginRateLimit(email);
  if (!rateLimit.allowed) {
    return { success: false, error: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' };
  }

  const user = dbFindByEmail(email);
  if (!user) {
    recordLoginAttempt(email);
    return { success: false, error: 'E-posta geçersiz veya hesap bulunamadı. Lütfen önce kayıt olun.' };
  }

  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) {
    recordLoginAttempt(email);
    return { success: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' };
  }

  clearLoginAttempts(email);
  dbSetSession(user);
  return { success: true, user };
};

// ─── Admin Giriş ────────────────────────────────────────────
export const loginAdmin = (email: string, password: string): Promise<boolean> =>
  dbAdminLogin(email, password);

// ─── Çıkış ──────────────────────────────────────────────────
export const logoutUser = () => dbSetSession(null);

// ─── Mevcut Kullanıcı ───────────────────────────────────────
export const getCurrentUser = (): DBUser | null => dbGetSession();
