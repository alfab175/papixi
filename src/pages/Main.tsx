import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DBUser, DBMovie, DBCartoon,
  dbGetPublishedMovies, dbGetPublishedCartoons,
  dbToggleMyList, dbRateContent, dbSaveProgress,
  dbGetUserById, dbSearch, dbUpdateUser, dbSetSession,
  PUBLIC_DOMAIN_AVATARS, DBProfile, dbAddProfile,
  getActiveProfileList, getActiveProfileProgressValue, dbDeleteProfile,
} from '../services/localDB';
import { logoutUser } from '../services/auth';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ContentRow from '../components/ContentRow';
import {
  Search, X, Star, BookOpen, Film, Plus, Check,
  ChevronLeft, ChevronRight, Settings, Volume2,
  Download, SkipBack, SkipForward, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MainProps {
  user: DBUser;
  onUserUpdate: (u: DBUser) => void;
  onAdminClick: () => void;
  onLogout: () => void;
}

type ModalType = 'video' | 'reader' | 'profile' | 'profiles' | 'notifications' | null;
type ContentItem = DBMovie | DBCartoon;

function StarWidget({ value, onChange, size = 'md' }: { value: number; onChange?: (r: number) => void; size?: 'sm' | 'md' }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange?.(i)} onMouseEnter={() => onChange && setHover(i)} onMouseLeave={() => onChange && setHover(0)} className={`transition-transform ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`} disabled={!onChange}>
          <Star className={`${sz} ${i <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
        </button>
      ))}
    </div>
  );
}

function ProfileModal({ user, onClose, onLogout }: { user: DBUser; onClose: () => void; onLogout: () => void }) {
  const trialEnd = new Date(user.trialEndsAt);
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const profileList = getActiveProfileList(user);
  const packageColors: Record<string, string> = { premium: '#e50914', standard: '#6366f1', none: '#6b7280' };
  const packageLabels: Record<string, string> = { premium: '⚡ Premium', standard: '⭐ Standart', none: '🆓 Deneme' };
  const activeProfile = user.profiles?.find((p: DBProfile) => p.id === user.activeProfileId) || user.profiles?.[0];
  const avatar = PUBLIC_DOMAIN_AVATARS.find((a) => a.id === activeProfile?.avatar);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, #1a1a1a, #333)' }}>
            {avatar?.emoji || user.firstName[0]}
          </div>
          <h3 className="font-bold text-white text-lg">{activeProfile?.name || user.firstName} {user.lastName}</h3>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {activeProfile?.type === 'child' && (
            <span className="inline-block mt-1 text-xs bg-green-900/50 text-green-400 border border-green-700/40 px-2 py-0.5 rounded-full">Çocuk Profili</span>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Paketiniz</span>
            <span className="text-sm font-semibold" style={{ color: packageColors[user.package] || '#6b7280' }}>{packageLabels[user.package] || 'Deneme'}</span>
          </div>
          {user.cardLast4 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Kart</span>
              <span className="text-white text-sm font-mono">**** **** **** {user.cardLast4}</span>
            </div>
          )}
          {user.cardExpiry && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Son Kullanım</span>
              <span className="text-white text-sm font-mono">{user.cardExpiry}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Deneme Süresi</span>
            <span className={`text-sm font-semibold ${daysLeft > 14 ? 'text-green-400' : daysLeft > 7 ? 'text-yellow-400' : 'text-red-400'}`}>{daysLeft} gün kaldı</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">İzleme Listesi</span>
            <span className="text-white text-sm">{profileList.length} içerik</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Cihaz Sınırı</span>
            <span className="text-white text-sm">{user.package === 'premium' ? '5' : user.package === 'standard' ? '3' : '1'} cihaz</span>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm text-gray-300 bg-gray-900 hover:bg-gray-800 border border-gray-800 transition">Kapat</button>
          <button onClick={() => { onLogout(); onClose(); }} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-end p-4" onClick={onClose}>
      <div className="mt-16 w-full max-w-sm bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-white font-bold">Bildirimler</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-white font-medium">Şu anda yeni bildiriminiz yok</p>
          <p className="text-gray-500 text-sm mt-1">İçerik güncellemeleri ve hesap bildirimleri burada görünecek.</p>
        </div>
      </div>
    </div>
  );
}

function ProfileSelector({ user, onClose, onUserUpdate }: { user: DBUser; onClose: () => void; onUserUpdate: (u: DBUser) => void }) {
  const [pinInput, setPinInput] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [pinError, setPinError] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'adult' | 'child'>('child');
  const [newProfileAvatar, setNewProfileAvatar] = useState('');
  const [newProfilePin, setNewProfilePin] = useState('');

  const selectedProfile = user.profiles?.find((p: DBProfile) => p.id === selectedProfileId);
  const reachedLimit = (user.profiles?.length || 0) >= 5;

  const switchProfile = (profileId: string) => {
    const freshUser = dbGetUserById(user.id);
    const nextList = freshUser?.profileMyList?.[profileId] || [];
    const nextProgress = freshUser?.profileProgress?.[profileId] || {};
    const updated = dbUpdateUser(user.id, { activeProfileId: profileId, myList: nextList, progress: nextProgress });
    if (updated) {
      dbSetSession(updated);
      onUserUpdate(updated);
    } else {
      toast('Profil bilgileriniz senkronize ediliyor, lütfen bekleyin', { icon: '⏳' });
    }
    onClose();
  };

  const handleProfileSelect = (profileId: string) => {
    const profile = user.profiles?.find((p: DBProfile) => p.id === profileId);
    if (!profile) return;
    if (profile.isLocked || profile.pin) {
      setSelectedProfileId(profileId);
      setPinInput('');
      setPinError(false);
      return;
    }
    switchProfile(profileId);
  };

  const handlePinSubmit = () => {
    if (!selectedProfileId || !selectedProfile) return;
    if (pinInput === selectedProfile.pin) {
      switchProfile(selectedProfileId);
      return;
    }
    setPinError(true);
    setPinInput('');
    toast.error('Yanlış PIN. Profil açılamadı.');
    setTimeout(() => setPinError(false), 2000);
  };

  const handleAddProfile = () => {
    if (reachedLimit) {
      toast.error('Profil sınırına ulaştınız');
      return;
    }
    if (!newProfileName.trim()) {
      toast.error('Profil adı girin');
      return;
    }
    const created = dbAddProfile(user.id, {
      name: newProfileName.trim(),
      type: newProfileType,
      avatar: newProfileAvatar,
      pin: newProfilePin.trim(),
      isLocked: newProfilePin.trim().length >= 4,
    });
    if (created) {
      const updated = dbGetUserById(user.id);
      if (updated) {
        dbSetSession(updated);
        onUserUpdate(updated);
      }
      setShowAddForm(false);
      setNewProfileName('');
      setNewProfileType('child');
      setNewProfileAvatar('');
      setNewProfilePin('');
      toast.success('Yeni profil eklendi');
    } else {
      toast('Profil bilgileriniz senkronize ediliyor, lütfen bekleyin', { icon: '⏳' });
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    dbDeleteProfile(user.id, profileId);
    const updated = dbGetUserById(user.id);
    if (updated) {
      dbSetSession(updated);
      onUserUpdate(updated);
      toast.success('Profil ve bağlı verileri silindi');
    } else {
      toast('Profil bilgileriniz senkronize ediliyor, lütfen bekleyin', { icon: '⏳' });
    }
  };

  if (selectedProfileId && selectedProfile?.pin) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-xs p-6 text-center">
          <div className="text-4xl mb-3">{PUBLIC_DOMAIN_AVATARS.find((a) => a.id === selectedProfile.avatar)?.emoji || '👤'}</div>
          <h3 className="font-bold text-white mb-1">{selectedProfile.name}</h3>
          <p className="text-gray-500 text-sm mb-5">PIN kodunuzu girin</p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
            maxLength={6}
            autoFocus
            className={`w-full text-center text-xl tracking-[0.5em] py-3 bg-gray-900 border rounded-xl text-white focus:outline-none transition font-mono ${pinError ? 'border-red-500' : 'border-gray-700 focus:border-red-600'}`}
            placeholder="••••"
          />
          {pinError && <p className="text-red-400 text-xs mt-2">Hatalı PIN. Tekrar deneyin.</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setSelectedProfileId(null)} className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 bg-gray-900 border border-gray-800 hover:bg-gray-800 transition">İptal</button>
            <button onClick={handlePinSubmit} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>Giriş</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl py-6">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Profil Seç</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {(user.profiles || []).map((profile: DBProfile) => {
            const avatar = PUBLIC_DOMAIN_AVATARS.find((a) => a.id === profile.avatar);
            const initial = profile.name?.trim()?.charAt(0)?.toUpperCase() || 'P';
            return (
              <div key={profile.id} className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition hover:scale-105 ${user.activeProfileId === profile.id ? 'border-red-600 bg-red-950/20' : 'border-gray-800 hover:border-gray-600 bg-gray-900/50'}`}>
                <button onClick={() => handleProfileSelect(profile.id)} className="w-full flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-gray-800 to-gray-700 relative overflow-hidden">
                    {avatar?.emoji ? <span>{avatar.emoji}</span> : <span className="text-white font-black text-2xl">{initial}</span>}
                    {profile.isLocked && <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-400 bg-gray-900 rounded-full p-0.5" />}
                  </div>
                  <span className="text-white text-xs font-medium text-center truncate w-full">{profile.name}</span>
                  {profile.type === 'child' && <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full">Çocuk</span>}
                </button>
                {user.profiles.length > 1 && (
                  <button onClick={() => handleDeleteProfile(profile.id)} className="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-red-400 transition">Sil</button>
                )}
              </div>
            );
          })}

          <button onClick={() => reachedLimit ? toast.error('Profil sınırına ulaştınız') : setShowAddForm(!showAddForm)} className="flex flex-col items-center justify-center gap-3 p-3 rounded-xl border border-dashed border-red-700/50 bg-red-950/20 hover:bg-red-900/30 transition hover:scale-105 min-h-[124px]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-black bg-[#FF0000] shadow-lg">+</div>
            <span className="text-white text-xs font-semibold text-center">Yeni Profil Ekle</span>
            {reachedLimit && <span className="text-[10px] text-red-400">Profil sınırına ulaştınız</span>}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 mb-6">
            <h3 className="text-white font-bold mb-4">Yeni Profil Oluştur</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Profil Adı</label>
                <input value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600" placeholder="Örn: Çocuk Profili" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Profil Türü</label>
                <select value={newProfileType} onChange={(e) => setNewProfileType(e.target.value as 'adult' | 'child')} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600">
                  <option value="adult">Yetişkin (13+)</option>
                  <option value="child">Çocuk (13-)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-2">Karakter Seç (opsiyonel)</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {PUBLIC_DOMAIN_AVATARS.map((avatar) => (
                    <button key={avatar.id} type="button" onClick={() => setNewProfileAvatar(avatar.id)} className={`h-14 rounded-xl border text-2xl transition ${newProfileAvatar === avatar.id ? 'border-red-600 bg-red-950/30' : 'border-gray-800 bg-gray-900 hover:border-gray-600'}`}>
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-600 mt-2">Karakter seçmezseniz profil adınızın baş harfi gösterilir.</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">Profil Kilidi (PIN)</label>
                <input value={newProfilePin} onChange={(e) => setNewProfilePin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600" placeholder="4-6 haneli PIN girerseniz profil kilitlenir" />
                <p className="text-[11px] text-gray-600 mt-2">PIN eklenen profiller açılmadan önce kilit ekranı gösterilir.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-3 rounded-xl text-sm text-gray-400 bg-gray-900 border border-gray-800 hover:bg-gray-800 transition">Vazgeç</button>
              <button onClick={handleAddProfile} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>Profili Kaydet</button>
            </div>
          </div>
        )}

        <div className="text-center">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm transition">İptal</button>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ movie, user, onClose, onProgress, onToggleList, onRate, isInList, userRating, onPrevMovie, onNextMovie }:
  { movie: DBMovie; user: DBUser; onClose: () => void; onProgress: (id: string, p: number) => void; onToggleList: () => void; onRate: (r: number) => void; isInList: boolean; userRating: number; onPrevMovie: () => void; onNextMovie: () => void }) {
  const [rating, setRating] = useState(userRating);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState((movie.languages || ['Türkçe'])[0]);
  const [selectedSub, setSelectedSub] = useState('Kapalı');
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedProgress = user.progress[movie.id]?.value || 0;
  const canDownload = user.package === 'premium';
  const subtitleOptions = ['Kapalı', ...(movie.subtitles || ['Türkçe', 'İngilizce'])];

  useEffect(() => {
    if (videoRef.current && savedProgress > 0) videoRef.current.currentTime = savedProgress;
  }, [savedProgress]);

  const skip = (sec: number) => { if (videoRef.current) videoRef.current.currentTime += sec; };
  const handleRate = (r: number) => { setRating(r); onRate(r); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"><ChevronLeft className="w-5 h-5" /> Geri</button>
        <div className="text-center">
          <h2 className="text-white font-bold text-sm">{movie.title}</h2>
          <p className="text-gray-500 text-xs">{movie.year} · {movie.duration}dk</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrevMovie} className="p-2 rounded-full border border-gray-700 text-gray-400 hover:text-white transition" aria-label="Önceki video"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={onNextMovie} className="p-2 rounded-full border border-gray-700 text-gray-400 hover:text-white transition" aria-label="Sonraki video"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => canDownload ? toast.success('Video indirme hazırlanıyor') : toast('İndirme işlemi yakında aktif olacak', { icon: '⬇️' })} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1.5 rounded-lg transition"><Download className="w-3.5 h-3.5" /> İndir</button>
          <button onClick={onToggleList} className={`p-2 rounded-full border transition ${isInList ? 'border-red-600 text-red-500' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button>
          <button onClick={onClose} className="p-2 rounded-full border border-gray-700 text-gray-400 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 bg-black flex items-center justify-center relative">
        {movie.videoUrl ? (
          <>
            <video ref={videoRef} src={movie.videoUrl} controls autoPlay className="w-full h-full object-contain" style={{ maxHeight: 'calc(100vh - 180px)' }} onTimeUpdate={(e) => onProgress(movie.id, Math.floor((e.target as HTMLVideoElement).currentTime))} />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <button onClick={() => skip(-10)} className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-gray-700/60 transition"><SkipBack className="w-3.5 h-3.5" /> 10sn</button>
              <button onClick={() => skip(10)} className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-gray-700/60 transition">10sn <SkipForward className="w-3.5 h-3.5" /></button>
            </div>
            <div className="absolute bottom-8 right-4">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-xl border border-gray-700 text-gray-400 hover:text-white transition"><Settings className="w-5 h-5" /></button>
              {showSettings && (
                <div className="absolute bottom-14 right-0 bg-gray-950 border border-gray-700 rounded-xl p-4 w-56 shadow-2xl">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Oynatıcı Ayarları</p>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2"><Volume2 className="w-3.5 h-3.5 text-gray-500" /><span className="text-xs text-gray-400">Ses Dili</span></div>
                    {(movie.languages || ['Türkçe', 'İngilizce']).map((lang) => (
                      <button key={lang} onClick={() => setSelectedAudio(lang)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition mb-1 ${selectedAudio === lang ? 'bg-red-600/30 text-red-400 border border-red-600/40' : 'text-gray-400 hover:bg-gray-800'}`}>{lang}</button>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Star className="w-3.5 h-3.5 text-gray-500" /><span className="text-xs text-gray-400">Altyazı</span></div>
                    {subtitleOptions.map((sub) => (
                      <button key={sub} onClick={() => setSelectedSub(sub)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition mb-1 ${selectedSub === sub ? 'bg-red-600/30 text-red-400 border border-red-600/40' : 'text-gray-400 hover:bg-gray-800'}`}>{sub}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500"><Film className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Video yüklenmemiş</p></div>
        )}
      </div>

      <div className="flex-shrink-0 px-6 py-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white">{movie.title}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{movie.genre?.join(' · ')}</p>
            {movie.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{movie.description}</p>}
            {savedProgress > 0 && <p className="text-red-400 text-xs mt-1">⏱ {Math.floor(savedProgress / 60)}dk {savedProgress % 60}sn'de kalmıştın</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-gray-500 text-xs">Puanınız</p>
            <StarWidget value={rating} onChange={handleRate} />
            <p className="text-gray-600 text-xs">Ort: {movie.rating}/5 ({movie.votes} oy)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartoonReaderModal({ cartoon, user, page, onPageChange, onClose, onProgress, onToggleList, onRate, isInList, userRating }:
  { cartoon: DBCartoon; user: DBUser; page: number; onPageChange: (p: number) => void; onClose: () => void; onProgress: (id: string, p: number) => void; onToggleList: () => void; onRate: (r: number) => void; isInList: boolean; userRating: number }) {
  const [rating, setRating] = useState(userRating);
  const canDownload = user.package === 'standard' || user.package === 'premium';

  const goNext = () => {
    if (page < cartoon.pages.length - 1) {
      const next = page + 1;
      onPageChange(next);
      onProgress(cartoon.id, next);
    }
  };
  const goPrev = () => { if (page > 0) onPageChange(page - 1); };
  const handleRate = (r: number) => { setRating(r); onRate(r); };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm"><ChevronLeft className="w-5 h-5" /> Geri</button>
        <div className="text-center">
          <h2 className="text-white font-semibold text-sm">{cartoon.title}</h2>
          <p className="text-gray-500 text-xs">Sayfa {page + 1} / {cartoon.pages.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {canDownload && <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white border border-gray-700 px-2.5 py-1.5 rounded-lg transition"><Download className="w-3.5 h-3.5" /> İndir</button>}
          <button onClick={onToggleList} className={`p-1.5 rounded-full border transition ${isInList ? 'border-red-600 text-red-500' : 'border-gray-700 text-gray-400'}`}>{isInList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}</button>
          <button onClick={onClose} className="p-1.5 rounded-full border border-gray-700 text-gray-400 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {cartoon.pages.length > 0 ? <img src={cartoon.pages[page]} alt={`Sayfa ${page + 1}`} className="max-h-full max-w-full object-contain select-none" style={{ maxHeight: 'calc(100vh - 140px)' }} /> : <div className="text-center text-gray-500"><BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Sayfa bulunamadı</p></div>}
        {page > 0 && <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 hover:bg-black/90 border border-gray-700 rounded-full flex items-center justify-center transition"><ChevronLeft className="w-5 h-5 text-white" /></button>}
        {page < cartoon.pages.length - 1 && <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/70 hover:bg-black/90 border border-gray-700 rounded-full flex items-center justify-center transition"><ChevronRight className="w-5 h-5 text-white" /></button>}
      </div>

      <div className="flex-shrink-0 px-4 py-3 bg-gray-950 border-t border-gray-800">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-600 text-xs w-8">{page + 1}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden cursor-pointer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const np = Math.round(((e.clientX - rect.left) / rect.width) * (cartoon.pages.length - 1)); onPageChange(Math.max(0, Math.min(cartoon.pages.length - 1, np))); }}>
              <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${((page + 1) / cartoon.pages.length) * 100}%` }} />
            </div>
            <span className="text-gray-600 text-xs w-8 text-right">{cartoon.pages.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={goPrev} disabled={page === 0} className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-40 transition flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /> Önceki</button>
              <button onClick={goNext} disabled={page === cartoon.pages.length - 1} className="px-3 py-1.5 rounded-lg text-xs text-white disabled:opacity-40 transition flex items-center gap-1" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>Sonraki <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <StarWidget value={rating} onChange={handleRate} size="sm" />
              <p className="text-gray-600 text-xs">Ort: {cartoon.rating}/5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Main({ user, onUserUpdate, onAdminClick, onLogout }: MainProps) {
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const [cartoons, setCartoons] = useState<DBCartoon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ movies: DBMovie[]; cartoons: DBCartoon[]; suggestions: string[] } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'movies' | 'series' | 'cartoons' | 'mylist'>('home');
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedMovie, setSelectedMovie] = useState<DBMovie | null>(null);
  const [selectedCartoon, setSelectedCartoon] = useState<DBCartoon | null>(null);
  const [readerPage, setReaderPage] = useState(0);
  const [currentUser, setCurrentUser] = useState<DBUser>(user);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const activeProfile = currentUser.profiles?.find((p: DBProfile) => p.id === currentUser.activeProfileId) || currentUser.profiles?.[0];

  const refreshUser = useCallback(() => {
    const fresh = dbGetUserById(user.id);
    if (fresh) {
      setCurrentUser(fresh);
      onUserUpdate(fresh);
    }
  }, [user.id, onUserUpdate]);

  const loadContent = useCallback(() => {
    setMovies(dbGetPublishedMovies());
    setCartoons(dbGetPublishedCartoons());
  }, []);

  useEffect(() => { loadContent(); }, [loadContent]);
  useEffect(() => { const interval = setInterval(loadContent, 10000); return () => clearInterval(interval); }, [loadContent]);
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults(null);
      return;
    }
    setSearchResults(dbSearch(searchQuery));
  }, [searchQuery]);

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const handleMovieClick = (movie: DBMovie) => { setSelectedMovie(movie); setModal('video'); };
  const handleCartoonClick = (cartoon: DBCartoon) => {
    setSelectedCartoon(cartoon);
    setReaderPage(getActiveProfileProgressValue(currentUser, cartoon.id) || 0);
    setModal('reader');
  };

  const handleToggleMyList = (id: string) => {
    const added = dbToggleMyList(currentUser.id, id, currentUser.activeProfileId);
    refreshUser();
    toast.success(added ? 'Listenize eklendi ✓' : 'Listeden çıkarıldı');
  };

  const handleRate = (id: string, rating: number, type: 'movie' | 'cartoon') => {
    dbRateContent(currentUser.id, id, rating, type);
    refreshUser();
    loadContent();
    toast.success(`${rating} yıldız verildi ⭐`);
  };

  const handleProgress = (contentId: string, progress: number) => dbSaveProgress(currentUser.id, contentId, progress, currentUser.activeProfileId);

  const handleSectionChange = (section: 'home' | 'movies' | 'series' | 'cartoons' | 'mylist') => {
    setActiveSection(section);
    setShowSearch(false);
    requestAnimationFrame(() => {
      contentAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const filterByAge = (items: (DBMovie | DBCartoon)[]) => {
    if (activeProfile?.type === 'child') return items.filter((i) => i.ageRating === 'all');
    return items;
  };

  const activeProfileList = getActiveProfileList(currentUser);
  const myListMovies = movies.filter((m) => activeProfileList.includes(m.id));
  const myListCartoons = cartoons.filter((c) => activeProfileList.includes(c.id));
  const popularMovies = filterByAge(movies.filter((m) => m.type === 'movie')) as DBMovie[];
  const seriesMovies = filterByAge(movies.filter((m) => m.type === 'series')) as DBMovie[];
  const dailyCartoons = filterByAge(cartoons.filter((c) => c.category === 'Karikatür' || c.category === 'Bant Karikatür')) as DBCartoon[];
  const comicBooks = filterByAge(cartoons.filter((c) => c.category === 'Çizgi Roman' || c.category === 'Manga')) as DBCartoon[];
  const publicDomain = filterByAge(cartoons.filter((c) => c.category === 'Kamu Malı Eser')) as DBCartoon[];
  const curatedHeroMovie = popularMovies.find((m) => /falling hare/i.test(m.title)) || popularMovies.find((m) => /bugs bunny|steamboat|superman|popeye|temel reis/i.test(m.title));
  const curatedHeroCartoon = publicDomain.find((c) => /falling hare/i.test(c.title)) || publicDomain.find((c) => /bugs bunny|steamboat|superman|popeye|temel reis/i.test(c.title));
  const heroItem = curatedHeroMovie || curatedHeroCartoon || popularMovies[0] || publicDomain[0] || cartoons[0] || null;
  const recommendedItems = filterByAge([...movies, ...cartoons].sort((a, b) => (b.rating + b.votes) - (a.rating + a.votes)));
  const trendingItems = filterByAge([...movies, ...cartoons].sort((a, b) => b.votes - a.votes));
  const isEmpty = movies.length === 0 && cartoons.length === 0;

  const movieItemClick = (item: ContentItem) => handleMovieClick(item as DBMovie);
  const cartoonItemClick = (item: ContentItem) => handleCartoonClick(item as DBCartoon);

  const filteredMoviePlaylist = filterByAge(movies) as DBMovie[];
  const currentMovieIndex = selectedMovie ? filteredMoviePlaylist.findIndex((m) => m.id === selectedMovie.id) : -1;
  const handlePrevMovie = () => {
    if (!filteredMoviePlaylist.length || currentMovieIndex <= 0) return;
    setSelectedMovie(filteredMoviePlaylist[currentMovieIndex - 1]);
  };
  const handleNextMovie = () => {
    if (!filteredMoviePlaylist.length || currentMovieIndex === -1 || currentMovieIndex >= filteredMoviePlaylist.length - 1) return;
    setSelectedMovie(filteredMoviePlaylist[currentMovieIndex + 1]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar user={currentUser} activeSection={activeSection} onSectionChange={handleSectionChange} onAdminClick={onAdminClick} onLogout={handleLogout} onProfileClick={() => setModal('profile')} onProfilesClick={() => setModal('profiles')} onSearchOpen={() => setShowSearch(!showSearch)} onNotificationsClick={() => setModal('notifications')} />

      {showSearch && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSearch(false)} />
          <div className="fixed top-16 left-0 right-0 z-40 bg-black/98 border-b border-gray-800 px-4 py-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-12 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm" placeholder="Film, dizi, karikatür ara... (Bugs Bunny, Steamboat Willie...)" />
                {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>}
              </div>
              {searchResults && (
                <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  {searchResults.suggestions.length > 0 && (
                    <div className="p-3 border-b border-gray-800">
                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Kütüphanede — Yakında Eklenecek</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.suggestions.slice(0, 6).map((s) => <span key={s} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {s}</span>)}
                      </div>
                    </div>
                  )}
                  {searchResults.movies.map((m) => (
                    <button key={m.id} onClick={() => { handleMovieClick(m); setShowSearch(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left border-b border-gray-800/50">
                      <div className="w-8 h-10 bg-gray-800 rounded overflow-hidden flex-shrink-0">{m.posterUrl ? <img src={m.posterUrl} alt="" className="w-full h-full object-cover" /> : <Film className="w-4 h-4 text-gray-600 m-2" />}</div>
                      <div><p className="text-sm text-white font-medium">{m.title}</p><p className="text-xs text-gray-500">{m.type === 'movie' ? 'Film' : 'Dizi'} · {m.year}</p></div>
                    </button>
                  ))}
                  {searchResults.cartoons.map((c) => (
                    <button key={c.id} onClick={() => { handleCartoonClick(c); setShowSearch(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left border-b border-gray-800/50">
                      <div className="w-8 h-10 bg-gray-800 rounded overflow-hidden flex-shrink-0">{c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 text-gray-600 m-2" />}</div>
                      <div><p className="text-sm text-white font-medium">{c.title}</p><p className="text-xs text-gray-500">{c.category} · {c.pages.length} sayfa</p></div>
                    </button>
                  ))}
                  {searchResults.movies.length === 0 && searchResults.cartoons.length === 0 && searchResults.suggestions.length === 0 && (
                    <div className="px-4 py-8 text-center"><p className="text-gray-500 text-sm">"{searchQuery}" için sonuç bulunamadı</p><p className="text-gray-600 text-xs mt-1">Yakında eklenecek olabilir!</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div ref={contentAreaRef} className={showSearch ? 'pt-40' : 'pt-0'}>
        {activeSection === 'home' && heroItem && !isEmpty && <Hero item={heroItem} isMovie={'videoUrl' in heroItem} onPlay={() => ('videoUrl' in heroItem ? handleMovieClick(heroItem as DBMovie) : handleCartoonClick(heroItem as DBCartoon))} onAddToList={() => handleToggleMyList(heroItem.id)} isInList={currentUser.myList.includes(heroItem.id)} />}

        {isEmpty && activeSection === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
            <div className="relative"><div className="text-8xl">🎬</div><div className="absolute -top-2 -right-4 text-4xl">📚</div></div>
            <div>
              <h2 className="text-3xl font-black text-white mb-3">Platform Hazır!</h2>
              <p className="text-gray-400 max-w-sm text-sm leading-relaxed">Admin panelinden film, dizi, karikatür ve çizgi roman yükleyip yayınladığınızda burada görünecek.</p>
            </div>
            {currentUser.isAdmin && <button onClick={onAdminClick} className="px-8 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>Admin Paneline Git</button>}
          </div>
        )}

        {activeSection === 'home' && !isEmpty && (
          <div className="pb-24">
            {recommendedItems.length > 0 && <ContentRow title="✨ Sizin İçin Önerdiklerimiz" items={recommendedItems as (DBMovie | DBCartoon)[]} type="movie" onItemClick={(item) => ('videoUrl' in item ? handleMovieClick(item as DBMovie) : handleCartoonClick(item as DBCartoon))} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, movies.some((m) => m.id === id) ? 'movie' : 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {trendingItems.length > 0 && <ContentRow title="🔥 Bugün En Çok İzlenenler" items={trendingItems as (DBMovie | DBCartoon)[]} type="movie" onItemClick={(item) => ('videoUrl' in item ? handleMovieClick(item as DBMovie) : handleCartoonClick(item as DBCartoon))} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, movies.some((m) => m.id === id) ? 'movie' : 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {popularMovies.length > 0 && <ContentRow title="🎬 Popüler Filmler" items={popularMovies} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {seriesMovies.length > 0 && <ContentRow title="📺 Yeni Çıkan Diziler" items={seriesMovies} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {dailyCartoons.length > 0 && <ContentRow title="😄 Günün Karikatürleri" items={dailyCartoons} type="cartoon" onItemClick={cartoonItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {comicBooks.length > 0 && <ContentRow title="📚 Çizgi Roman Seçkileri" items={comicBooks} type="cartoon" onItemClick={cartoonItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {publicDomain.length > 0 && <ContentRow title="🏛️ Baş Tacı Eserler" items={publicDomain} type="cartoon" onItemClick={cartoonItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
            {movies.length > 0 && <ContentRow title="⭐ En Yüksek Puanlı" items={[...movies].sort((a, b) => b.rating - a.rating)} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} />}
          </div>
        )}

        {activeSection === 'movies' && <div className="pt-20 pb-24">{popularMovies.length === 0 ? <EmptySection label="Film" /> : <ContentRow title="Tüm Filmler" items={popularMovies} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} grid />}</div>}
        {activeSection === 'series' && <div className="pt-20 pb-24">{seriesMovies.length === 0 ? <EmptySection label="Dizi" /> : <ContentRow title="Tüm Diziler" items={seriesMovies} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} grid />}</div>}
        {activeSection === 'cartoons' && <div className="pt-20 pb-24">{cartoons.length === 0 ? <EmptySection label="Karikatür" /> : <ContentRow title="Tüm Karikatürler & Çizgi Romanlar" items={filterByAge(cartoons) as DBCartoon[]} type="cartoon" onItemClick={cartoonItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} grid />}</div>}
        {activeSection === 'mylist' && (
          <div className="pt-20 pb-24 px-4 md:px-8">
            <h1 className="text-2xl font-bold mb-8">Listem</h1>
            {myListMovies.length === 0 && myListCartoons.length === 0 ? (
              <div className="text-center py-16 text-gray-500"><Plus className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="text-lg font-medium">Listeniz boş</p><p className="text-sm mt-1 text-gray-600">İçeriklerdeki "+" butonunu kullanarak listeye ekleyin</p></div>
            ) : (
              <div className="space-y-4">
                {myListMovies.length > 0 && <ContentRow title="🎬 Filmler & Diziler" items={myListMovies} type="movie" onItemClick={movieItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'movie')} myList={currentUser.myList} userRatings={currentUser.ratings} grid />}
                {myListCartoons.length > 0 && <ContentRow title="📚 Karikatürler & Çizgi Romanlar" items={myListCartoons} type="cartoon" onItemClick={cartoonItemClick} onToggleList={handleToggleMyList} onRate={(id, r) => handleRate(id, r, 'cartoon')} myList={currentUser.myList} userRatings={currentUser.ratings} grid />}
              </div>
            )}
          </div>
        )}
      </div>

      {modal === 'video' && selectedMovie && <VideoModal movie={selectedMovie} user={currentUser} onClose={() => setModal(null)} onProgress={handleProgress} onToggleList={() => handleToggleMyList(selectedMovie.id)} onRate={(r) => handleRate(selectedMovie.id, r, 'movie')} isInList={activeProfileList.includes(selectedMovie.id)} userRating={currentUser.ratings[selectedMovie.id] || 0} onPrevMovie={handlePrevMovie} onNextMovie={handleNextMovie} />}
      {modal === 'reader' && selectedCartoon && <CartoonReaderModal cartoon={selectedCartoon} user={currentUser} page={readerPage} onPageChange={setReaderPage} onClose={() => setModal(null)} onProgress={handleProgress} onToggleList={() => handleToggleMyList(selectedCartoon.id)} onRate={(r) => handleRate(selectedCartoon.id, r, 'cartoon')} isInList={activeProfileList.includes(selectedCartoon.id)} userRating={currentUser.ratings[selectedCartoon.id] || 0} />}
      {modal === 'profile' && <ProfileModal user={currentUser} onClose={() => setModal(null)} onLogout={handleLogout} />}
      {modal === 'profiles' && <ProfileSelector user={currentUser} onClose={() => setModal(null)} onUserUpdate={(u) => { setCurrentUser(u); onUserUpdate(u); }} />}
      {modal === 'notifications' && <NotificationsModal onClose={() => setModal(null)} />}
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-5xl mb-4">📭</div>
      <h2 className="text-xl font-bold text-white mb-2">Henüz {label} Yok</h2>
      <p className="text-gray-500 text-sm">Admin panelinden {label.toLowerCase()} ekleyip yayınladığınızda burada görünecek.</p>
    </div>
  );
}
