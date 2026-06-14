import { useState } from 'react';
import { registerUser, validatePassword } from '../services/auth';
import { DBUser } from '../services/localDB';
import { Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthPageLayout, FormInput, GradientButton, LoadingSpinner, PromoBadge, ModalBackdrop } from '../components/ui';

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
    <AuthPageLayout>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <div className="bg-gray-950/90 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-start gap-3 mb-6">
              <PromoBadge />
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Hesap Oluştur</h1>
                <p className="text-gray-400 text-sm">Papix'e katıl, 3 ay ücretsiz keşfet ve istediğin zaman iptal et.</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Ad" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" icon={<User className="w-4 h-4" />} placeholder="Adınız" />
                <FormInput label="Soyad" type="text" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" icon={<User className="w-4 h-4" />} placeholder="Soyadınız" />
              </div>

              <FormInput label="E-posta Adresi" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" icon={<Mail className="w-4 h-4" />} placeholder="ornek@email.com" />

              <div>
                <FormInput
                  label="Şifre"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="Min. 8 karakter, büyük harf, rakam"
                  showPasswordToggle
                  showPassword={showPass}
                  onTogglePassword={() => setShowPass(!showPass)}
                  error={password && !allRulesOk ? ' ' : undefined}
                />
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

              <FormInput
                label="Şifre Tekrar"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                icon={<Lock className="w-4 h-4" />}
                placeholder="Şifrenizi tekrar girin"
                error={confirmPassword && confirmPassword !== password ? 'Şifreler eşleşmiyor' : undefined}
              />

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

              <GradientButton type="submit" disabled={loading || !allRulesOk || !acceptedTerms} variant="red" className="mt-2 py-4 rounded-2xl font-black text-base hover:scale-[1.01] active:scale-[0.99]">
                {loading ? <><LoadingSpinner /> Kayıt yapılıyor...</> : 'Kayıt Ol ve Başla'}
              </GradientButton>
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
        <ModalBackdrop onClose={() => setShowTerms(false)}>
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
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
            <GradientButton onClick={() => { setAcceptedTerms(true); setShowTerms(false); }} className="mt-6">
              Okudum, Kabul Ediyorum
            </GradientButton>
          </div>
        </ModalBackdrop>
      )}
    </AuthPageLayout>
  );
}
