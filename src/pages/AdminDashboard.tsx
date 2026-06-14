import { useState, useEffect } from 'react';
import {
  Upload, ArrowLeft, Trash2, CheckCircle, Clock, Film,
  BookOpen, Eye, EyeOff, LayoutDashboard, Users, Shield, Mail, Globe,
} from 'lucide-react';
import { uploadMovie, uploadCartoon, publishMovie, publishCartoon, removeMovie, removeCartoon } from '../services/content';
import {
  dbGetMovies,
  dbGetCartoons,
  dbGetUsers,
  dbAdminLogin,
  DBMovie,
  DBCartoon,
  isAllowedAdminEmail,
  isTrustedAdminNetwork,
} from '../services/localDB';
import toast from 'react-hot-toast';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [authed, setAuthed] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState<'overview' | 'movie' | 'cartoon' | 'users'>('overview');
  const [movies, setMovies] = useState<DBMovie[]>([]);
  const [cartoons, setCartoons] = useState<DBCartoon[]>([]);
  const [loading, setLoading] = useState(false);

  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mGenre, setMGenre] = useState('');
  const [mDuration, setMDuration] = useState('');
  const [mYear, setMYear] = useState(new Date().getFullYear().toString());
  const [mType, setMType] = useState<'movie' | 'series'>('movie');
  const [mVideoFile, setMVideoFile] = useState<File | null>(null);
  const [mPosterFile, setMPosterFile] = useState<File | null>(null);

  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cCategory, setCCategory] = useState('Karikatür');
  const [cCoverFile, setCCoverFile] = useState<File | null>(null);
  const [cPageFiles, setCPageFiles] = useState<File[]>([]);

  const trustedNetwork = isTrustedAdminNetwork();

  const refreshData = () => {
    setMovies(dbGetMovies());
    setCartoons(dbGetCartoons());
  };

  useEffect(() => {
    if (authed) refreshData();
  }, [authed]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAllowedAdminEmail(adminEmail)) {
      toast.error('Bu e-posta Admin Gateway için yetkili değil');
      return;
    }
    if (!trustedNetwork) {
      toast.error('Admin Gateway sadece güvenilir ağ/IP üzerinden erişilebilir');
      return;
    }
    if (!dbAdminLogin(adminEmail, adminPass)) {
      toast.error('E-posta onayı veya şifre doğrulaması başarısız');
      setAdminPass('');
      return;
    }

    setAuthed(true);
    toast.success('Admin Gateway doğrulandı. Yönetici paneline hoş geldiniz!');
  };

  const handleMovieUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim() || !mVideoFile || !mPosterFile || !mDuration) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    setLoading(true);
    toast.loading('Video yükleniyor, lütfen bekleyin...', { id: 'upload' });
    const result = await uploadMovie(
      {
        title: mTitle.trim(),
        description: mDesc,
        genre: mGenre.split(',').map((g) => g.trim()).filter(Boolean),
        duration: parseInt(mDuration, 10),
        type: mType,
        year: parseInt(mYear, 10),
      },
      mVideoFile,
      mPosterFile,
    );
    toast.dismiss('upload');
    if (result.success) {
      toast.success(`"${mTitle}" taslak olarak kaydedildi!`);
      setMTitle('');
      setMDesc('');
      setMGenre('');
      setMDuration('');
      setMVideoFile(null);
      setMPosterFile(null);
      refreshData();
    } else {
      toast.error(result.error || 'Yükleme başarısız');
    }
    setLoading(false);
  };

  const handleCartoonUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim() || !cCoverFile || cPageFiles.length === 0) {
      toast.error('Başlık, kapak ve en az 1 sayfa zorunludur');
      return;
    }
    setLoading(true);
    toast.loading('Görseller yükleniyor...', { id: 'cup' });
    const result = await uploadCartoon(
      { title: cTitle.trim(), description: cDesc, category: cCategory },
      cCoverFile,
      cPageFiles,
    );
    toast.dismiss('cup');
    if (result.success) {
      toast.success(`"${cTitle}" taslak olarak kaydedildi!`);
      setCTitle('');
      setCDesc('');
      setCCoverFile(null);
      setCPageFiles([]);
      refreshData();
    } else {
      toast.error(result.error || 'Yükleme başarısız');
    }
    setLoading(false);
  };

  const handlePublish = (id: string, type: 'movie' | 'cartoon') => {
    if (type === 'movie') publishMovie(id);
    else publishCartoon(id);
    toast.success('İçerik yayınlandı!');
    refreshData();
  };

  const handleDelete = (id: string, type: 'movie' | 'cartoon', title: string) => {
    if (!window.confirm(`"${title}" silinsin mi?`)) return;
    if (type === 'movie') removeMovie(id);
    else removeCartoon(id);
    toast.success('İçerik silindi');
    refreshData();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1a0a00 0%, #000 60%)' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-black tracking-widest mb-1" style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
            <h2 className="text-xl font-bold text-white">Admin Gateway</h2>
            <p className="text-gray-500 text-sm mt-1">E-posta onaylı ve IP kısıtlamalı yönetici erişimi</p>
          </div>

          <form onSubmit={handleAdminLogin} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 text-xs text-gray-400 space-y-2">
              <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-400" /> Ağ durumu: <span className={trustedNetwork ? 'text-green-400' : 'text-red-400'}>{trustedNetwork ? 'Güvenilir ağ tespit edildi' : 'Güvenilir olmayan ağ'}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-yellow-400" /> Sadece yetkili e-posta adresleri erişebilir</div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Yönetici E-postası</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} autoComplete="username" className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition" placeholder="admin@papix.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Şifre</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={adminPass} onChange={(e) => setAdminPass(e.target.value)} autoComplete="current-password" className="w-full px-4 py-3 pr-10 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition" placeholder="Admin şifresi" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>Gateway'e Giriş Yap</button>
            <button type="button" onClick={onBack} className="w-full py-3 rounded-xl font-medium text-gray-400 text-sm bg-gray-900 hover:bg-gray-800 transition border border-gray-800">← Geri Dön</button>
          </form>

          <div className="mt-4 p-3 bg-yellow-950/30 border border-yellow-800/30 rounded-xl text-center">
            <p className="text-yellow-500/70 text-xs">Demo: admin@papix.com / Papix2024! · localhost veya güvenilir ağ üzerinden</p>
          </div>
        </div>
      </div>
    );
  }

  const publishedMovies = movies.filter((m) => m.status === 'published');
  const draftMovies = movies.filter((m) => m.status === 'draft');
  const publishedCartoons = cartoons.filter((c) => c.status === 'published');
  const totalUsers = dbGetUsers().length;

  const inputCls = 'w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition placeholder-gray-600';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-sm"><ArrowLeft className="w-4 h-4" /> Geri</button>
            <div className="text-xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
            <span className="text-gray-600 text-sm">/ Admin</span>
          </div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-green-400 text-xs">Gateway Doğrulandı</span></div>
        </div>
      </div>

      <div className="bg-black/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'movie', label: 'Film Yükle', icon: Film },
            { id: 'cartoon', label: 'Karikatür Yükle', icon: BookOpen },
            { id: 'users', label: 'Kullanıcılar', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)} className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition ${tab === t.id ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Genel Bakış</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Yayındaki Film', value: publishedMovies.length, color: '#3b82f6', icon: '🎬' },
                { label: 'Taslak Film', value: draftMovies.length, color: '#f59e0b', icon: '⏳' },
                { label: 'Yayındaki Karikatür', value: publishedCartoons.length, color: '#10b981', icon: '📚' },
                { label: 'Kayıtlı Kullanıcı', value: totalUsers, color: '#8b5cf6', icon: '👥' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-gray-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Film className="w-4 h-4 text-blue-400" /> Filmler</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {movies.length === 0 && <p className="text-gray-600 text-sm text-center py-6">Henüz film yok</p>}
                  {movies.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-gray-500">{m.type === 'movie' ? 'Film' : 'Dizi'} · {m.year}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'published' ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'}`}>{m.status === 'published' ? 'Yayında' : 'Taslak'}</span>
                        {m.status === 'draft' && <button onClick={() => handlePublish(m.id, 'movie')} className="text-green-400 hover:text-green-300 transition" title="Yayınla"><CheckCircle className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(m.id, 'movie', m.title)} className="text-red-500 hover:text-red-400 transition" title="Sil"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-green-400" /> Karikatürler</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {cartoons.length === 0 && <p className="text-gray-600 text-sm text-center py-6">Henüz karikatür yok</p>}
                  {cartoons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-gray-500">{c.category} · {c.pages.length} sayfa</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'published' ? 'bg-green-900/60 text-green-400' : 'bg-yellow-900/60 text-yellow-400'}`}>{c.status === 'published' ? 'Yayında' : 'Taslak'}</span>
                        {c.status === 'draft' && <button onClick={() => handlePublish(c.id, 'cartoon')} className="text-green-400 hover:text-green-300 transition"><CheckCircle className="w-4 h-4" /></button>}
                        <button onClick={() => handleDelete(c.id, 'cartoon', c.title)} className="text-red-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'movie' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Film className="w-5 h-5 text-blue-400" /> Film / Dizi Yükle</h2>
            <form onSubmit={handleMovieUpload} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={labelCls}>Film / Dizi Başlığı *</label><input type="text" value={mTitle} onChange={(e) => setMTitle(e.target.value)} className={inputCls} placeholder="Örn: Steamboat Willie" /></div>
                <div><label className={labelCls}>İçerik Türü</label><select value={mType} onChange={(e) => setMType(e.target.value as 'movie' | 'series')} className={inputCls}><option value="movie">Film</option><option value="series">Dizi</option></select></div>
                <div><label className={labelCls}>Yıl</label><input type="number" value={mYear} onChange={(e) => setMYear(e.target.value)} className={inputCls} placeholder="2024" min="1888" max="2099" /></div>
                <div><label className={labelCls}>Süre (dakika)</label><input type="number" value={mDuration} onChange={(e) => setMDuration(e.target.value)} className={inputCls} placeholder="120" /></div>
                <div><label className={labelCls}>Kategoriler (virgülle)</label><input type="text" value={mGenre} onChange={(e) => setMGenre(e.target.value)} className={inputCls} placeholder="Aksiyon, Komedi" /></div>
                <div className="col-span-2"><label className={labelCls}>Açıklama</label><textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} rows={3} className={inputCls} placeholder="Kısa açıklama..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Afiş Görseli * (JPG/PNG)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-red-600/50 transition bg-gray-900/50">
                    {mPosterFile ? <div className="text-center px-2"><CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-green-400 text-xs truncate">{mPosterFile.name}</p></div> : <div className="text-center"><Upload className="w-6 h-6 text-gray-500 mx-auto mb-1" /><p className="text-gray-500 text-xs">Afiş seç</p></div>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setMPosterFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Video Dosyası * (MP4)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-red-600/50 transition bg-gray-900/50">
                    {mVideoFile ? <div className="text-center px-2"><CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-green-400 text-xs truncate">{mVideoFile.name}</p><p className="text-gray-500 text-xs">{(mVideoFile.size / 1024 / 1024).toFixed(1)} MB</p></div> : <div className="text-center"><Film className="w-6 h-6 text-gray-500 mx-auto mb-1" /><p className="text-gray-500 text-xs">Video seç</p></div>}
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => setMVideoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-950/30 border border-yellow-800/30 rounded-xl text-xs text-yellow-500"><Clock className="w-4 h-4 flex-shrink-0" /> Yükleme sonrası içerik taslak olarak kaydedilir. Genel Bakış'tan yayınlayabilirsiniz.</div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}><Upload className="w-4 h-4" />{loading ? 'Yükleniyor...' : 'Taslak Olarak Kaydet'}</button>
            </form>
          </div>
        )}

        {tab === 'cartoon' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-green-400" /> Karikatür / Çizgi Roman Yükle</h2>
            <form onSubmit={handleCartoonUpload} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div><label className={labelCls}>Karikatür / Çizgi Roman Başlığı *</label><input type="text" value={cTitle} onChange={(e) => setCTitle(e.target.value)} className={inputCls} placeholder="Örn: Bugs Bunny Serüvenleri" /></div>
              <div><label className={labelCls}>Kategori</label><select value={cCategory} onChange={(e) => setCCategory(e.target.value)} className={inputCls}><option>Karikatür</option><option>Çizgi Roman</option><option>Manga</option><option>Bant Karikatür</option><option>Kamu Malı Eser</option></select></div>
              <div><label className={labelCls}>Açıklama</label><textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} rows={3} className={inputCls} placeholder="Kısa açıklama..." /></div>
              <div>
                <label className={labelCls}>Kapak Görseli * (JPG/PNG)</label>
                <label className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-green-600/50 transition">
                  {cCoverFile ? <><CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" /><span className="text-green-400 text-sm truncate">{cCoverFile.name}</span></> : <><Upload className="w-5 h-5 text-gray-500 flex-shrink-0" /><span className="text-gray-500 text-sm">Kapak görselini seç</span></>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCCoverFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label className={labelCls}>Karikatür Sayfaları * (Çoklu seçim — sırasıyla)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-green-600/50 transition">
                  {cPageFiles.length > 0 ? <div className="text-center"><CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" /><p className="text-green-400 text-sm font-medium">{cPageFiles.length} sayfa seçildi</p><p className="text-gray-500 text-xs">{cPageFiles.map((f) => f.name.slice(0, 12)).join(', ')}...</p></div> : <div className="text-center"><BookOpen className="w-6 h-6 text-gray-500 mx-auto mb-1" /><p className="text-gray-400 text-sm">Sayfaları sırasıyla seç</p><p className="text-gray-600 text-xs">JPG, PNG — Çoklu seçim yapabilirsiniz</p></div>}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setCPageFiles(Array.from(e.target.files || []))} />
                </label>
                {cPageFiles.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{cPageFiles.map((f, i) => <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{i + 1}. {f.name.slice(0, 15)}</span>)}</div>}
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-950/30 border border-yellow-800/30 rounded-xl text-xs text-yellow-500"><Clock className="w-4 h-4 flex-shrink-0" /> Sayfa sırası önemlidir — dosyaları okuma sırasına göre seçin.</div>
              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><Upload className="w-4 h-4" />{loading ? 'Yükleniyor...' : 'Taslak Olarak Kaydet'}</button>
            </form>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /> Kullanıcılar</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3.5 text-gray-400 font-medium">Ad Soyad</th>
                    <th className="text-left px-5 py-3.5 text-gray-400 font-medium">E-posta</th>
                    <th className="text-left px-5 py-3.5 text-gray-400 font-medium">Paket</th>
                    <th className="text-left px-5 py-3.5 text-gray-400 font-medium">Kayıt</th>
                    <th className="text-left px-5 py-3.5 text-gray-400 font-medium">Liste</th>
                  </tr>
                </thead>
                <tbody>
                  {dbGetUsers().length === 0 && <tr><td colSpan={5} className="text-center text-gray-600 py-10">Henüz kayıtlı kullanıcı yok</td></tr>}
                  {dbGetUsers().map((u) => (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="px-5 py-3.5 text-white font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                      <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.package === 'premium' ? 'bg-red-900/60 text-red-400' : u.package === 'standard' ? 'bg-purple-900/60 text-purple-400' : 'bg-gray-800 text-gray-500'}`}>{u.package === 'premium' ? '⚡ Premium' : u.package === 'standard' ? '⭐ Standart' : 'Deneme'}</span></td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td className="px-5 py-3.5 text-gray-400">{u.myList.length} içerik</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
