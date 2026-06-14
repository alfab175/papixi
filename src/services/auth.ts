import {
  dbFindByEmail,
  dbCreateUser,
  dbGetSession,
  dbSetSession,
  DBUser,
  dbAdminLogin,
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

  const user = dbCreateUser(firstName, lastName, email, password);
  dbSetSession(user);
  return { success: true, user };
};

// ─── Giriş ──────────────────────────────────────────────────
export const loginUser = async (
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: DBUser }> => {
  const user = dbFindByEmail(email);
  if (!user) return { success: false, error: 'E-posta geçersiz veya hesap bulunamadı. Lütfen önce kayıt olun.' };
  if (user.password !== password) return { success: false, error: 'Şifre hatalı. Lütfen tekrar deneyin.' };
  dbSetSession(user);
  return { success: true, user };
};

// ─── Admin Giriş ────────────────────────────────────────────
export const loginAdmin = (email: string, password: string): boolean =>
  dbAdminLogin(email, password);

// ─── Çıkış ──────────────────────────────────────────────────
export const logoutUser = () => dbSetSession(null);

// ─── Mevcut Kullanıcı ───────────────────────────────────────
export const getCurrentUser = (): DBUser | null => dbGetSession();
