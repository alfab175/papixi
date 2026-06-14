import { useEffect, useMemo, useState } from 'react';
import { loginUser } from '../services/auth';
import {
  DBUser,
  verify2FACode,
  send2FACode,
  isDesktopLikeViewport,
  generateQRData,
  dbUpdateUser,
  dbSetSession,
  clear2FASession,
} from '../services/localDB';
import { Mail, Lock, Shield, Smartphone, QrCode, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthPageLayout, FormInput, GradientButton, LoadingSpinner } from '../components/ui';

interface LoginProps {
  onLoginSuccess: (user: DBUser) => void;
  onSwitchToRegister: () => void;
  onAdminClick: () => void;
}

type LoginStep = 'credentials' | 'twofa';

export default function Login({ onLoginSuccess, onSwitchToRegister, onAdminClick }: LoginProps) {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<DBUser | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState(false);
  const [desktopLike, setDesktopLike] = useState(isDesktopLikeViewport());
  const [lastSentCode, setLastSentCode] = useState('');

  const qrToken = useMemo(() => generateQRData(`papix-${Date.now().toString(36).toUpperCase()}`), []);

  useEffect(() => {
    const onResize = () => setDesktopLike(isDesktopLikeViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    const result = await loginUser(email.trim(), password);

    if (result.success && result.user) {
      setPendingUser(result.user);
      const code = send2FACode(email.trim());
      setLastSentCode(code);
      toast.success(`SMS kodu gönderildi. Demo doğrulama kodu: ${code}`, { duration: 5000, icon: '📱' });
      setStep('twofa');
    } else {
      toast.error(result.error || 'Giriş başarısız');
      if ((result.error || '').toLowerCase().includes('hesap bulunamadı')) {
        setTimeout(() => onSwitchToRegister(), 900);
      }
    }

    setLoading(false);
  };

  const handle2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (verify2FACode(email.trim(), twoFACode)) {
      const verifiedUser = dbUpdateUser(pendingUser.id, { twoFAVerified: true }) || pendingUser;
      dbSetSession(verifiedUser);
      clear2FASession();
      toast.success(`Hoş geldin, ${verifiedUser.firstName}! 🎬`);
      onLoginSuccess(verifiedUser);
      return;
    }

    setTwoFAError(true);
    setTwoFACode('');
    setTimeout(() => setTwoFAError(false), 2000);
    toast.error('SMS doğrulama kodu hatalı veya süresi dolmuş.');
  };

  const resendCode = () => {
    const code = send2FACode(email.trim());
    setLastSentCode(code);
    toast.success(`Yeni SMS kodu gönderildi. Demo kodu: ${code}`, { icon: '📱' });
  };

  if (step === 'twofa') {
    return (
      <AuthPageLayout>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-sm">
            <div className="bg-gray-950/90 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
              <button onClick={() => setStep('credentials')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition">
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a3a1a, #0d260d)' }}>
                  <Smartphone className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">SMS Doğrulama</h1>
                <p className="text-gray-400 text-sm">SMS kodu gönderildi</p>
                <p className="text-gray-600 text-xs mt-1">{email}</p>
              </div>

              <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-xl p-3 mb-5 text-center">
                <p className="text-yellow-500/80 text-xs">Demo ortamı için son gönderilen kod:</p>
                <p className="font-mono font-bold tracking-[0.3em] text-yellow-400 text-lg mt-1">{lastSentCode}</p>
              </div>

              <form onSubmit={handle2FA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Doğrulama Kodu</label>
                  <input
                    type="text"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    maxLength={6}
                    className={`w-full text-center text-2xl tracking-[0.5em] py-4 bg-gray-900 border rounded-xl text-white placeholder-gray-700 focus:outline-none transition font-mono ${twoFAError ? 'border-red-500 animate-pulse' : 'border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'}`}
                    placeholder="000000"
                  />
                  {twoFAError && <p className="text-red-400 text-xs mt-1.5 text-center">Hatalı kod. Lütfen tekrar deneyin.</p>}
                </div>

                <GradientButton type="submit" disabled={twoFACode.length !== 6} variant="green">
                  Doğrula ve Giriş Yap
                </GradientButton>
              </form>

              <p className="text-center text-gray-600 text-xs mt-4">
                Kod gelmedi mi?{' '}
                <button className="text-red-500 hover:text-red-400 transition" onClick={resendCode}>
                  Tekrar Gönder
                </button>
              </p>
            </div>
          </div>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="bg-gray-950/90 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl order-2 lg:order-1">
              <h1 className="text-3xl font-bold text-white mb-1">Giriş Yap</h1>
              <p className="text-gray-500 mb-8 text-sm">Papix'e hoş geldiniz — film, dizi & karikatür platformu</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <FormInput
                  label="E-posta Adresi"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="ornek@email.com"
                />

                <FormInput
                  label="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="Şifreniz"
                  showPasswordToggle
                  showPassword={showPass}
                  onTogglePassword={() => setShowPass(!showPass)}
                />

                <GradientButton type="submit" disabled={loading}>
                  {loading ? <><LoadingSpinner /> Kontrol ediliyor...</> : <>Giriş Yap →</>}
                </GradientButton>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Hesabınız yok mu?{' '}
                  <button onClick={onSwitchToRegister} className="text-red-500 hover:text-red-400 font-semibold transition">Ücretsiz Kayıt Ol</button>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <button
                  onClick={onAdminClick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-gray-500 hover:text-yellow-400 transition border border-gray-800 hover:border-yellow-600/40 rounded-xl"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Gateway Bilgilendirmesi
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2 bg-gray-950/80 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center">
              {desktopLike ? (
                <>
                  <div className="flex items-center gap-2 mb-3 text-red-500">
                    <QrCode className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-white">TV / Bilgisayar Girişi</h2>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">Sağdaki QR kodu mobil cihazınızla tarayarak hızlı giriş yapabilirsiniz.</p>
                  <div className="bg-white rounded-2xl aspect-square max-w-[280px] w-full mx-auto flex items-center justify-center relative overflow-hidden p-4">
                    <div className="grid grid-cols-8 gap-1">
                      {Array.from({ length: 64 }).map((_, i) => {
                        const black = i % 3 === 0 || i % 5 === 0 || (i > 20 && i < 44 && i % 2 === 0);
                        return <div key={i} className={`w-7 h-7 ${black ? 'bg-black' : 'bg-white'}`} />;
                      })}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black text-red-600">PAPIX</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs mt-4 text-center break-all">{qrToken}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 text-red-500">
                    <Smartphone className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-white">Mobil Giriş</h2>
                  </div>
                  <p className="text-gray-400 text-sm leading-6">Mobil cihazlarda QR kod gösterilmez. Doğrudan e-posta ve şifrenizle giriş yapabilir, ardından SMS doğrulama kodu ile hesabınızı güvenli biçimde açabilirsiniz.</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">🔐 SMS 2FA Koruması · 🎬 3 ay ücretsiz deneme · İstediğiniz zaman iptal edin</p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
