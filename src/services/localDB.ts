// ============================================================
// PAPIX - LOCAL DATABASE SERVICE v5 (Stabilized)
// ============================================================

export interface DBProfile {
  id: string;
  name: string;
  type: 'adult' | 'child';
  avatar: string;
  pin: string;
  isLocked: boolean;
  createdAt: string;
}

export interface DBUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: string;
  trialEndsAt: string;
  package: 'none' | 'standard' | 'premium';
  cardLast4: string;
  cardExpiry: string;
  deviceIds: string[];
  myList: string[];
  ratings: Record<string, number>;
  progress: Record<string, { value: number; updatedAt: string }>;
  profileMyList: Record<string, string[]>;
  profileProgress: Record<string, Record<string, { value: number; updatedAt: string }>>;
  profiles: DBProfile[];
  activeProfileId: string;
  twoFAVerified: boolean;
}

export interface DBMovie {
  id: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  type: 'movie' | 'series';
  posterUrl: string;
  videoUrl: string;
  rating: number;
  votes: number;
  status: 'draft' | 'published';
  createdAt: string;
  year: number;
  ageRating: 'all' | '13+' | '18+';
  languages: string[];
  subtitles: string[];
}

export interface DBCartoon {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  pages: string[];
  category: string;
  rating: number;
  votes: number;
  status: 'draft' | 'published';
  createdAt: string;
  ageRating: 'all' | '13+' | '18+';
}

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const KEYS = {
  USERS: 'papix_users_v5',
  MOVIES: 'papix_movies_v5',
  CARTOONS: 'papix_cartoons_v5',
  SESSION: 'papix_session_v5',
  DEVICE: 'papix_device_id_v5',
  TWO_FA: 'papix_2fa_session_v5',
  LOGIN_ATTEMPTS: 'papix_login_attempts_v5',
};

const get = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const set = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const uid = (): string => {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
};

// ─── PASSWORD HASHING (SHA-256) ──────────────────────────────
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const hashed = await hashPassword(password);
  return hashed === hash;
};

// ─── RATE LIMITING ─────────────────────────────────────────
interface LoginAttemptRecord {
  attempts: number;
  firstAttempt: string;
}

export const checkLoginRateLimit = (email: string): { allowed: boolean; remainingAttempts: number } => {
  const records = get<Record<string, LoginAttemptRecord>>(KEYS.LOGIN_ATTEMPTS, {});
  const record = records[email.toLowerCase()];
  if (!record) return { allowed: true, remainingAttempts: LOGIN_RATE_LIMIT_MAX };

  const elapsed = Date.now() - new Date(record.firstAttempt).getTime();
  if (elapsed > LOGIN_RATE_LIMIT_WINDOW_MS) {
    delete records[email.toLowerCase()];
    set(KEYS.LOGIN_ATTEMPTS, records);
    return { allowed: true, remainingAttempts: LOGIN_RATE_LIMIT_MAX };
  }

  const remaining = LOGIN_RATE_LIMIT_MAX - record.attempts;
  return { allowed: remaining > 0, remainingAttempts: Math.max(0, remaining) };
};

export const recordLoginAttempt = (email: string): void => {
  const records = get<Record<string, LoginAttemptRecord>>(KEYS.LOGIN_ATTEMPTS, {});
  const key = email.toLowerCase();
  const existing = records[key];

  if (!existing || Date.now() - new Date(existing.firstAttempt).getTime() > LOGIN_RATE_LIMIT_WINDOW_MS) {
    records[key] = { attempts: 1, firstAttempt: new Date().toISOString() };
  } else {
    records[key] = { ...existing, attempts: existing.attempts + 1 };
  }
  set(KEYS.LOGIN_ATTEMPTS, records);
};

export const clearLoginAttempts = (email: string): void => {
  const records = get<Record<string, LoginAttemptRecord>>(KEYS.LOGIN_ATTEMPTS, {});
  delete records[email.toLowerCase()];
  set(KEYS.LOGIN_ATTEMPTS, records);
};

export const PUBLIC_DOMAIN_AVATARS = [
  { id: 'bugs', name: 'Bugs Bunny', emoji: '🐰' },
  { id: 'popeye', name: 'Popeye', emoji: '⚓' },
  { id: 'superman', name: 'Superman', emoji: '🦸' },
  { id: 'betty', name: 'Betty Boop', emoji: '💃' },
  { id: 'felix', name: 'Felix', emoji: '🐱' },
  { id: 'woody', name: 'Woody', emoji: '🪵' },
  { id: 'steamboat', name: 'Steamboat', emoji: '🎵' },
  { id: 'daffy', name: 'Daffy', emoji: '🦆' },
];

export const getDeviceId = (): string => {
  let id = localStorage.getItem(KEYS.DEVICE);
  if (!id) {
    id = uid();
    localStorage.setItem(KEYS.DEVICE, id);
  }
  return id;
};

// ─── USERS ──────────────────────────────────────────────────
export const dbGetUsers = (): DBUser[] => get<DBUser[]>(KEYS.USERS, []);
export const dbSaveUsers = (users: DBUser[]) => set(KEYS.USERS, users);
export const dbFindByEmail = (email: string): DBUser | null =>
  dbGetUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;

export const dbCreateUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<DBUser> => {
  const users = dbGetUsers();
  const trial = new Date();
  trial.setDate(trial.getDate() + 90);

  const hashedPassword = await hashPassword(password);

  const defaultProfile: DBProfile = {
    id: uid(),
    name: firstName,
    type: 'adult',
    avatar: 'bugs',
    pin: '',
    isLocked: false,
    createdAt: new Date().toISOString(),
  };

  const user: DBUser = {
    id: uid(),
    firstName,
    lastName,
    email: email.toLowerCase(),
    password: hashedPassword,
    isAdmin: false,
    createdAt: new Date().toISOString(),
    trialEndsAt: trial.toISOString(),
    package: 'none',
    cardLast4: '',
    cardExpiry: '',
    deviceIds: [getDeviceId()],
    myList: [],
    ratings: {},
    progress: {},
    profileMyList: { [defaultProfile.id]: [] },
    profileProgress: { [defaultProfile.id]: {} },
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    twoFAVerified: false,
  };

  users.push(user);
  dbSaveUsers(users);
  return user;
};

export const dbUpdateUser = (id: string, updates: Partial<DBUser>): DBUser | null => {
  const users = dbGetUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  dbSaveUsers(users);
  return users[index];
};

export const dbGetUserById = (id: string): DBUser | null =>
  dbGetUsers().find((u) => u.id === id) || null;

// ─── SESSION ────────────────────────────────────────────────
export const dbGetSession = (): DBUser | null => {
  const raw = localStorage.getItem(KEYS.SESSION);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.createdAt && Date.now() - new Date(session.createdAt).getTime() > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(KEYS.SESSION);
      return null;
    }
    const user = dbGetUserById(session.id) || null;
    if (!user) return null;
    if (!user.profileMyList) user.profileMyList = { [user.activeProfileId]: user.myList || [] };
    if (!user.profileProgress) user.profileProgress = { [user.activeProfileId]: user.progress || {} };
    if (!user.profileMyList[user.activeProfileId]) user.profileMyList[user.activeProfileId] = user.myList || [];
    if (!user.profileProgress[user.activeProfileId]) user.profileProgress[user.activeProfileId] = user.progress || {};
    return user;
  } catch {
    return null;
  }
};

export const dbSetSession = (user: DBUser | null) => {
  if (user) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify({ id: user.id, createdAt: new Date().toISOString() }));
  } else {
    localStorage.removeItem(KEYS.SESSION);
  }
};

// ─── ADMIN GATEWAY ──────────────────────────────────────────
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH ?? '';

export const isAllowedAdminEmail = (email: string) =>
  ADMIN_EMAIL !== '' && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

export const isTrustedAdminNetwork = () => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

export const dbAdminLogin = async (email: string, password: string): Promise<boolean> => {
  if (!isAllowedAdminEmail(email) || !isTrustedAdminNetwork()) return false;
  if (!ADMIN_PASSWORD_HASH) return false;
  const hashed = await hashPassword(password);
  return hashed === ADMIN_PASSWORD_HASH;
};

// ─── MOVIES ─────────────────────────────────────────────────
export const dbGetMovies = (): DBMovie[] => get<DBMovie[]>(KEYS.MOVIES, []);
export const dbSaveMovies = (movies: DBMovie[]) => set(KEYS.MOVIES, movies);
export const dbGetPublishedMovies = (): DBMovie[] => dbGetMovies().filter((m) => m.status === 'published');

export const dbAddMovie = (data: Omit<DBMovie, 'id' | 'createdAt'>): DBMovie => {
  const movies = dbGetMovies();
  const movie: DBMovie = { ...data, id: uid(), createdAt: new Date().toISOString() };
  movies.push(movie);
  dbSaveMovies(movies);
  return movie;
};

export const dbUpdateMovie = (id: string, updates: Partial<DBMovie>) => {
  const movies = dbGetMovies();
  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) return null;
  movies[index] = { ...movies[index], ...updates };
  dbSaveMovies(movies);
  return movies[index];
};

export const dbDeleteMovie = (id: string) => dbSaveMovies(dbGetMovies().filter((m) => m.id !== id));

// ─── CARTOONS ───────────────────────────────────────────────
export const dbGetCartoons = (): DBCartoon[] => get<DBCartoon[]>(KEYS.CARTOONS, []);
export const dbSaveCartoons = (cartoons: DBCartoon[]) => set(KEYS.CARTOONS, cartoons);
export const dbGetPublishedCartoons = (): DBCartoon[] => dbGetCartoons().filter((c) => c.status === 'published');

export const dbAddCartoon = (data: Omit<DBCartoon, 'id' | 'createdAt'>): DBCartoon => {
  const cartoons = dbGetCartoons();
  const cartoon: DBCartoon = { ...data, id: uid(), createdAt: new Date().toISOString() };
  cartoons.push(cartoon);
  dbSaveCartoons(cartoons);
  return cartoon;
};

export const dbUpdateCartoon = (id: string, updates: Partial<DBCartoon>) => {
  const cartoons = dbGetCartoons();
  const index = cartoons.findIndex((c) => c.id === id);
  if (index === -1) return null;
  cartoons[index] = { ...cartoons[index], ...updates };
  dbSaveCartoons(cartoons);
  return cartoons[index];
};

export const dbDeleteCartoon = (id: string) => dbSaveCartoons(dbGetCartoons().filter((c) => c.id !== id));

// ─── RATINGS ────────────────────────────────────────────────
export const dbRateContent = (userId: string, contentId: string, rating: number, type: 'movie' | 'cartoon') => {
  const users = dbGetUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex].ratings[contentId] = rating;
    dbSaveUsers(users);
  }

  if (type === 'movie') {
    const movies = dbGetMovies();
    const movieIndex = movies.findIndex((m) => m.id === contentId);
    if (movieIndex !== -1) {
      const allRatings = dbGetUsers().map((u) => u.ratings[contentId]).filter(Boolean);
      movies[movieIndex].rating = Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
      movies[movieIndex].votes = allRatings.length;
      dbSaveMovies(movies);
    }
  } else {
    const cartoons = dbGetCartoons();
    const cartoonIndex = cartoons.findIndex((c) => c.id === contentId);
    if (cartoonIndex !== -1) {
      const allRatings = dbGetUsers().map((u) => u.ratings[contentId]).filter(Boolean);
      cartoons[cartoonIndex].rating = Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
      cartoons[cartoonIndex].votes = allRatings.length;
      dbSaveCartoons(cartoons);
    }
  }
};

// ─── MY LIST ────────────────────────────────────────────────
export const getActiveProfileList = (user: DBUser): string[] => {
  const profileId = user.activeProfileId;
  if (profileId && user.profileMyList?.[profileId]) return user.profileMyList[profileId];
  return user.myList || [];
};

export const dbToggleMyList = (userId: string, contentId: string, profileId?: string): boolean => {
  const users = dbGetUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const activeProfileId = profileId || users[index].activeProfileId;
  if (!users[index].profileMyList) users[index].profileMyList = {};
  if (!users[index].profileMyList[activeProfileId]) users[index].profileMyList[activeProfileId] = [];

  const list = users[index].profileMyList[activeProfileId];
  const itemIndex = list.indexOf(contentId);
  if (itemIndex === -1) {
    list.push(contentId);
    users[index].myList = list;
    dbSaveUsers(users);
    return true;
  }

  list.splice(itemIndex, 1);
  users[index].myList = list;
  dbSaveUsers(users);
  return false;
};

// ─── PROGRESS ───────────────────────────────────────────────
export const getActiveProfileProgressValue = (user: DBUser, contentId: string): number => {
  const profileId = user.activeProfileId;
  if (profileId && user.profileProgress?.[profileId]?.[contentId]) return user.profileProgress[profileId][contentId].value;
  return user.progress?.[contentId]?.value || 0;
};

export const dbSaveProgress = (userId: string, contentId: string, value: number, profileId?: string) => {
  const users = dbGetUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index !== -1) {
    const activeProfileId = profileId || users[index].activeProfileId;
    if (!users[index].profileProgress) users[index].profileProgress = {};
    if (!users[index].profileProgress[activeProfileId]) users[index].profileProgress[activeProfileId] = {};
    users[index].profileProgress[activeProfileId][contentId] = { value, updatedAt: new Date().toISOString() };
    users[index].progress[contentId] = { value, updatedAt: new Date().toISOString() };
    dbSaveUsers(users);
  }
};

// ─── PROFILES ───────────────────────────────────────────────
export const dbAddProfile = (userId: string, profile: Omit<DBProfile, 'id' | 'createdAt'>): DBProfile | null => {
  const users = dbGetUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;
  if (users[userIndex].profiles.length >= 5) return null;

  const newProfile: DBProfile = {
    ...profile,
    id: uid(),
    createdAt: new Date().toISOString(),
  };

  users[userIndex].profiles.push(newProfile);
  if (!users[userIndex].profileMyList) users[userIndex].profileMyList = {};
  if (!users[userIndex].profileProgress) users[userIndex].profileProgress = {};
  users[userIndex].profileMyList[newProfile.id] = [];
  users[userIndex].profileProgress[newProfile.id] = {};
  dbSaveUsers(users);
  return newProfile;
};

export const dbUpdateProfile = (userId: string, profileId: string, updates: Partial<DBProfile>) => {
  const users = dbGetUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  const profileIndex = users[userIndex].profiles.findIndex((p) => p.id === profileId);
  if (profileIndex === -1) return null;

  users[userIndex].profiles[profileIndex] = { ...users[userIndex].profiles[profileIndex], ...updates };
  dbSaveUsers(users);
  return users[userIndex].profiles[profileIndex];
};

export const dbDeleteProfile = (userId: string, profileId: string) => {
  const users = dbGetUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return;
  if (users[userIndex].profiles.length <= 1) return;

  users[userIndex].profiles = users[userIndex].profiles.filter((p) => p.id !== profileId);
  if (users[userIndex].profileMyList?.[profileId]) delete users[userIndex].profileMyList[profileId];
  if (users[userIndex].profileProgress?.[profileId]) delete users[userIndex].profileProgress[profileId];
  if (users[userIndex].activeProfileId === profileId) {
    users[userIndex].activeProfileId = users[userIndex].profiles[0]?.id || '';
    const nextProfileId = users[userIndex].activeProfileId;
    users[userIndex].myList = users[userIndex].profileMyList?.[nextProfileId] || [];
    users[userIndex].progress = users[userIndex].profileProgress?.[nextProfileId] || {};
  }
  dbSaveUsers(users);
};

// ─── INITIAL PUBLIC DOMAIN CONTENT ──────────────────────────
const seedInitialContent = () => {
  const movies = dbGetMovies();
  const cartoons = dbGetCartoons();
  if (movies.length === 0) {
    dbSaveMovies([
      {
        id: uid(),
        title: 'Falling Hare',
        description: 'Bugs Bunny’nin savaş döneminde geçen kamu malı kısa animasyon seçkisi.',
        genre: ['Animasyon', 'Klasik', 'Komedi'],
        duration: 8,
        type: 'movie',
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        rating: 4.8,
        votes: 421,
        status: 'published',
        createdAt: new Date().toISOString(),
        year: 1943,
        ageRating: 'all',
        languages: ['Türkçe', 'İngilizce'],
        subtitles: ['Türkçe', 'İngilizce'],
      },
      {
        id: uid(),
        title: 'Superman 1941',
        description: 'Kamu malı hale gelmiş klasik süper kahraman kısa film seçkisi.',
        genre: ['Aksiyon', 'Animasyon', 'Klasik'],
        duration: 10,
        type: 'movie',
        posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        rating: 4.7,
        votes: 389,
        status: 'published',
        createdAt: new Date().toISOString(),
        year: 1941,
        ageRating: '13+',
        languages: ['Türkçe', 'İngilizce'],
        subtitles: ['Türkçe', 'İngilizce'],
      },
      {
        id: uid(),
        title: 'Popeye Classics',
        description: 'Temel Reis’in kamu malı klasiklerinden oluşan eğlenceli seçki.',
        genre: ['Komedi', 'Animasyon'],
        duration: 9,
        type: 'movie',
        posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        rating: 4.6,
        votes: 276,
        status: 'published',
        createdAt: new Date().toISOString(),
        year: 1938,
        ageRating: 'all',
        languages: ['Türkçe', 'İngilizce'],
        subtitles: ['Türkçe', 'İngilizce'],
      },
    ]);
  }
  if (cartoons.length === 0) {
    const pageA = 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop';
    const pageB = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop';
    dbSaveCartoons([
      {
        id: uid(),
        title: 'Steamboat Willie Özel Sayı',
        description: 'Kamu malı çizgi roman/karikatür seçkisi.',
        coverUrl: pageA,
        pages: [pageA, pageB, pageA],
        category: 'Kamu Malı Eser',
        rating: 4.5,
        votes: 198,
        status: 'published',
        createdAt: new Date().toISOString(),
        ageRating: 'all',
      },
      {
        id: uid(),
        title: 'Bugs Bunny Günlük Şeritler',
        description: 'Kamu malı komik bant karikatür seçkisi.',
        coverUrl: pageB,
        pages: [pageB, pageA, pageB],
        category: 'Karikatür',
        rating: 4.4,
        votes: 154,
        status: 'published',
        createdAt: new Date().toISOString(),
        ageRating: 'all',
      },
    ]);
  }
};

seedInitialContent();

// ─── FILE TO BASE64 ─────────────────────────────────────────
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── LUHN ALGORITHM ─────────────────────────────────────────
export const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, '');
  if (!/^\d{16}$/.test(digits)) return false;

  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isEven) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

// ─── 2FA SIMULATION ─────────────────────────────────────────
interface TwoFASession {
  email: string;
  code: string;
  expiresAt: string;
}

export const generate2FACode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const send2FACode = (email: string): string => {
  const code = generate2FACode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const payload: TwoFASession = { email: email.toLowerCase(), code, expiresAt };
  set(KEYS.TWO_FA, payload);
  return code;
};

export const verify2FACode = (email: string, code: string): boolean => {
  const session = get<TwoFASession | null>(KEYS.TWO_FA, null);
  if (!session) return false;
  if (session.email !== email.toLowerCase()) return false;
  if (new Date(session.expiresAt).getTime() < Date.now()) return false;
  return session.code === code;
};

export const clear2FASession = () => localStorage.removeItem(KEYS.TWO_FA);

// ─── QR CODE / DEVICE VIEW ──────────────────────────────────
export const generateQRData = (sessionToken: string) => `papix://login?token=${sessionToken}&t=${Date.now()}`;
export const isDesktopLikeViewport = () => window.innerWidth >= 1024;

// ─── SEARCH ─────────────────────────────────────────────────
export const SEARCH_LIBRARY = [
  'Bugs Bunny', 'Falling Hare', 'Daffy Duck', 'Steamboat Willie', 'Popeye', 'Temel Reis', 'Gulliver',
  'Superman 1941', 'The Mechanical Monsters', 'Betty Boop', 'Felix the Cat', 'Sinbad',
  'Donald Duck', 'Mighty Mouse', 'Woody Woodpecker', 'Alice in Wonderland', 'Flash Gordon',
  'Buck Rogers', 'Jungle Comics', 'Planet Comics', 'Snow White', 'Cinderella', 'Pinocchio',
  'Bambi', 'Gulliver’s Travels', 'Little Lulu', 'Casper', 'Krazy Kat', 'Popeye the Sailor',
];

export const dbSearch = (query: string): { movies: DBMovie[]; cartoons: DBCartoon[]; suggestions: string[] } => {
  const q = query.toLowerCase().trim();
  if (!q) return { movies: [], cartoons: [], suggestions: [] };

  const movies = dbGetPublishedMovies().filter(
    (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
  );

  const cartoons = dbGetPublishedCartoons().filter(
    (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  );

  const suggestions = SEARCH_LIBRARY.filter((s) => s.toLowerCase().includes(q));
  return { movies, cartoons, suggestions };
};
