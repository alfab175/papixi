import { useState } from 'react';
import { registerUser, validatePassword } from '../services/auth';
import { DBUser } from '../services/localDB';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RegisterProps {
  onRegisterSuccess: (user: DBUser) => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onRegisterSuccess, onSwitchToLogin }: RegisterProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const rules = [
    { label: 'En az 8 karakter', ok: password.length >= 8 },
    { label: 'En az bir büyük harf (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'En az bir küçük harf (a-z)', ok: /[a-z]/.test(password) },
    { label: 'En az bir rakam (0-9)', ok: /\d/.test(password) },
  ];
  const allRulesOk = rules.every(r => r.ok);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun'); return;
    }
    if (!acceptedTerms) {
      toast.error('Devam etmek için Kullanım Koşulları ve Gizlilik Politikasını kabul etmelisiniz');
      return;
    }
    if (password !== confirmPassword) { toast.error('Şifreler eşleşmiyor'); return; }
    const pv = validatePassword(password);
    if (!pv.valid) { toast.error(pv.error || 'Geçersiz şifre'); return; }

    setLoading(true);
    const result = await registerUser(firstName.trim(), lastName.trim(), email.trim(), password);
    if (result.success && result.user) {
      toast.success('Hesabınız oluşturuldu! 🎉');
      onRegisterSuccess(result.user);
    } else {
      toast.error(result.error || 'Kayıt başarısız');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col" style={{ backgroundImage: 'radial-gradient(ellipse at 50% -10%, #3d0000 0%, #000 55%)' }}>
      <div className="px-8 py-6">
        <div className="text-3xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="bg-gray-950/90 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-start gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border badge-glow"
                style={{ background: 'linear-gradient(135deg, #ff0000, #b8860b)', borderColor: '#facc15' }}>
                <span className="text-sm font-black tracking-wide text-white">3 AY ÜCRETSİZ</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Hesap Oluştur</h1>
                <p className="text-gray-400 text-sm">Papix'e katıl, 3 ay ücretsiz keşfet ve istediğin zaman iptal et.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Ad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name"
                      className="w-full pl-9 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-sm transition"
                      placeholder="Adınız" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name"
                      className="w-full pl-9 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-sm transition"
                      placeholder="Soyadınız" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                    className="w-full pl-9 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-sm transition"
                    placeholder="ornek@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password"
                    className={`w-full pl-9 pr-10 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 text-sm transition ${password && !allRulesOk ? 'border-red-700 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-red-600 focus:ring-red-600/30'}`}
                    placeholder="Min. 8 karakter, büyük harf, rakam" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2.5 grid grid-cols-2 gap-1">
                    {rules.map(r => (
                      <div key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-green-400' : 'text-gray-600'}`}>
                        {r.ok ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"
                    className={`w-full pl-9 pr-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 text-sm transition ${confirmPassword && confirmPassword !== password ? 'border-red-700 focus:ring-red-500/30' : 'border-gray-700 focus:border-red-600 focus:ring-red-600/30'}`}
                    placeholder="Şifrenizi tekrar girin" />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Şifreler eşleşmiyor</p>
                )}
              </div>

              {/* Terms of Service - ZORUNLU */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${acceptedTerms ? 'bg-red-600 border-red-600' : 'border-gray-600 hover:border-gray-400'}`}
                  >
                    {acceptedTerms && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    Papix'in{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-red-400 hover:text-red-300 underline transition">
                      Kullanım Koşulları
                    </button>
                    {' '}ve{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-red-400 hover:text-red-300 underline transition">
                      Gizlilik Politikası
                    </button>
                    'nı okudum ve kabul ediyorum. 3 aylık ücretsiz deneme sonrasında seçtiğim paket ücreti tahsil edilecektir.
                    {' '}<span className="text-red-500 font-semibold">*</span>
                  </span>
                </label>
                {!acceptedTerms && (
                  <p className="text-yellow-600 text-xs mt-2 ml-8">⚠️ Bu alan zorunludur</p>
                )}
              </div>

              <button type="submit" disabled={loading || !allRulesOk || !acceptedTerms}
                className="w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#FF0000' }}>
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Kayıt yapılıyor...</> : 'Kayıt Ol ve Başla'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-gray-500 text-sm">
                Zaten hesabınız var mı?{' '}
                <button onClick={onSwitchToLogin} className="text-red-500 hover:text-red-400 font-semibold transition">Giriş Yap</button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTerms(false)}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Kullanım Koşulları & Gizlilik Politikası</h2>
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
              <div>
                <h3 className="text-white font-semibold mb-2">1. Hizmet Koşulları</h3>
                <p>Papix platformunu kullanarak bu koşulları kabul etmiş olursunuz. Platform, film, dizi, karikatür ve çizgi roman içeriklerine erişim sağlar.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">2. Abonelik ve Ödeme</h3>
                <p>3 aylık deneme süresi sonunda seçtiğiniz paket (Standart: ₺30/ay veya Premium: ₺50/ay) ücretlendirilir. İstediğiniz zaman iptal edebilirsiniz.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">3. Cihaz Sınırlaması</h3>
                <p>Standart pakette 3 cihaz, Premium pakette 5 cihaz sınırı uygulanır. Sınır aşımında yeni cihaz girişi reddedilir.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">4. Gizlilik Politikası</h3>
                <p>Kişisel verileriniz KVKK kapsamında korunur. Kart bilgileriniz şifreli saklanır ve üçüncü taraflarla paylaşılmaz.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">5. İçerik Kullanım Hakları</h3>
                <p>Platform içeriklerini yalnızca kişisel kullanım amacıyla izleyebilirsiniz. Yeniden dağıtım yasaktır.</p>
              </div>
            </div>
            <button onClick={() => { setAcceptedTerms(true); setShowTerms(false); }}
              className="w-full mt-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #e50914, #c5000f)' }}>
              Okudum, Kabul Ediyorum
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
