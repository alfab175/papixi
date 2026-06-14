import { useState } from 'react';
import { DBUser, dbUpdateUser, dbSetSession, luhnCheck } from '../services/localDB';
import { CreditCard, Shield, CheckCircle, Star, Zap, AlertTriangle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentProps {
  user: DBUser;
  onComplete: (user: DBUser) => void;
  onSkip: () => void;
}

const PACKAGES = [
  {
    id: 'standard' as const,
    name: 'Standart',
    price: '30',
    color: '#6366f1',
    icon: Star,
    devices: 3,
    features: ['3 Cihaz', 'Karikatür & Çizgi Roman', 'Çizgi Roman İndirme', 'HD Kalite'],
    notIncluded: ['Video İndirme', 'Ultra Kalite'],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '50',
    color: '#e50914',
    icon: Zap,
    devices: 5,
    features: ['5 Cihaz', 'Film, Dizi & Karikatür', 'Video + Çizgi Roman İndirme', 'Ultra Kalite (4K)', 'Öncelikli Destek'],
    notIncluded: [],
    badge: 'En Popüler',
  },
];

export default function Payment({ user, onComplete, onSkip }: PaymentProps) {
  const [selectedPkg, setSelectedPkg] = useState<'standard' | 'premium'>('premium');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'package' | 'card'>('package');
  const [cardError, setCardError] = useState('');
  const [cvvError, setCvvError] = useState('');
  const [expiryError, setExpiryError] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validateExpiry = (value: string) => {
    if (!/^\d{2}\/\d{2}$/.test(value)) return 'Geçerli bir son kullanma tarihi girin';
    const [month, year] = value.split('/').map(Number);
    if (month < 1 || month > 12) return 'Ay bilgisi geçersiz';
    const now = new Date();
    const fullYear = 2000 + year;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
      return 'Kartınızın son kullanma tarihi geçmiş';
    }

    if (fullYear > currentYear + 12) {
      return 'Son kullanma tarihi gerçekçi görünmüyor';
    }

    return '';
  };

  const detectCardBrand = (digits: string) => {
    if (/^4\d{15}$/.test(digits)) return 'visa';
    if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(digits)) return 'mastercard';
    if (/^3[47]\d{13}$/.test(digits)) return 'amex';
    return null;
  };

  const rawCardDigits = cardNumber.replace(/\s/g, '');
  const cardBrand = detectCardBrand(rawCardDigits);
  const isCardComplete = rawCardDigits.length === 16;
  const isCardValid = isCardComplete && !!cardBrand && luhnCheck(rawCardDigits);
  const isExpiryComplete = /^\d{2}\/\d{2}$/.test(cardExpiry);
  const isExpiryValid = isExpiryComplete && !validateExpiry(cardExpiry);
  const isCvvValid = /^\d{3}$/.test(cardCvv);
  const isCardholderValid = cardName.trim().length > 2;
  const isPaymentFormValid = isCardValid && isExpiryValid && isCvvValid && isCardholderValid;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setCardError('');
    const digits = formatted.replace(/\s/g, '');
    if (digits.length === 16 && !luhnCheck(digits)) {
      setCardError('Geçersiz kart numarası. Lütfen kontrol edin.');
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardExpiry(formatted);
    setExpiryError(formatted.length === 5 ? validateExpiry(formatted) : '');
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cvv = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(cvv);
    if (cvv.length > 0 && cvv.length !== 3) setCvvError('Güvenlik kodu hatalı');
    else setCvvError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = cardNumber.replace(/\s/g, '');

    if (rawDigits.length !== 16) {
      toast.error('Ödeme onaylanmadı');
      setCardError('Kart numarası eksik veya hatalı');
      return;
    }
    if (!detectCardBrand(rawDigits)) {
      setCardError('Kart tipi doğrulanamadı');
      toast.error('Ödeme onaylanmadı');
      return;
    }
    if (!luhnCheck(rawDigits)) {
      setCardError('Bu kart numarası geçersiz (Luhn algoritması başarısız).');
      toast.error('Ödeme onaylanmadı');
      return;
    }

    const expiryValidation = validateExpiry(cardExpiry);
    if (expiryValidation) {
      setExpiryError(expiryValidation);
      toast.error('Ödeme onaylanmadı');
      return;
    }

    if (!/^\d{3}$/.test(cardCvv)) {
      setCvvError('Güvenlik kodu hatalı');
      toast.error('Ödeme onaylanmadı');
      return;
    }

    if (!cardName.trim() || cardName.trim().length < 3) {
      toast.error('Ödeme onaylanmadı');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));

    const last4 = rawDigits.slice(-4);
    const updated = dbUpdateUser(user.id, {
      package: selectedPkg,
      cardLast4: last4,
      cardExpiry,
    });

    if (updated) {
      dbSetSession(updated);
      toast.success(`${selectedPkg === 'premium' ? '⚡ Premium' : '⭐ Standart'} paket aktif! 3 ay ücretsiz başladı 🎉`);
      onComplete(updated);
    } else {
      console.error('Payment: dbUpdateUser returned null for user', user.id);
      toast.error('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundImage: 'radial-gradient(ellipse at 50% -10%, #1a0000 0%, #000 50%)' }}>
      <div className="px-8 py-6 border-b border-gray-900">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-3xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
          <button onClick={onSkip} className="text-gray-500 hover:text-gray-300 text-sm transition">Şimdi değil, atla →</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full mb-5 border shadow-2xl badge-glow"
            style={{ background: 'linear-gradient(135deg, #ff0000, #b8860b)', borderColor: '#facc15' }}>
            <Sparkles className="w-5 h-5 text-yellow-200" />
            <span className="text-base md:text-xl font-black tracking-wide text-white">3 AY ÜCRETSİZ DENEME</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Paketini Seç</h1>
          <p className="text-gray-400">Aboneliğinizi başlatın, ilk 3 ay boyunca ücret ödemeden Papix dünyasını keşfedin.</p>
        </div>

        {step === 'package' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const isSelected = selectedPkg === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'border-red-600 bg-red-950/20' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">{pkg.badge}</span>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pkg.color}22`, border: `1px solid ${pkg.color}44` }}>
                          <Icon className="w-5 h-5" style={{ color: pkg.color }} />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{pkg.name}</div>
                          <div className="text-gray-500 text-xs">{pkg.devices} cihaza kadar</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black" style={{ color: pkg.color }}>₺{pkg.price}</div>
                        <div className="text-gray-500 text-xs">/ay</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {pkg.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> {f}
                        </div>
                      ))}
                      {pkg.notIncluded.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-600 line-through">
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep('card')} className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]" style={{ background: '#FF0000' }}>
              Devam Et — {selectedPkg === 'premium' ? '₺50' : '₺30'}/ay
            </button>
            <p className="text-center text-gray-600 text-xs mt-3">İlk 3 ay ücretsiz · Kart bilgileri sansürlü saklanır · Luhn doğrulamalı</p>
          </>
        )}

        {step === 'card' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep('package')} className="text-gray-500 hover:text-gray-300 text-sm mb-6 flex items-center gap-1 transition">
              ← Paket seçimine dön
            </button>

            <div className="relative w-full h-48 rounded-2xl p-6 mb-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #e50914 0%, transparent 50%)' }} />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="text-2xl font-black tracking-widest" style={{ background: 'linear-gradient(135deg, #e50914, #ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAPIX</div>
                  <CreditCard className="w-8 h-8 text-white/30" />
                </div>
                <div>
                  <div className="text-white/50 text-xs mb-1">KART NUMARASI</div>
                  <div className="text-white font-mono text-lg tracking-widest">{cardNumber || '**** **** **** ****'}</div>
                </div>
                <div className="flex justify-between">
                  <div>
                    <div className="text-white/50 text-xs mb-0.5">KART SAHİBİ</div>
                    <div className="text-white text-sm font-medium">{cardName || 'AD SOYAD'}</div>
                  </div>
                  <div>
                    <div className="text-white/50 text-xs mb-0.5">SON KULLANIM</div>
                    <div className="text-white text-sm font-medium">{cardExpiry || 'AA/YY'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-3 mb-5 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 text-xs font-medium">Kart numarası, kart tipi, CVC ve tarih doğrulaması aktif</p>
                <p className="text-blue-400/60 text-xs">Geçersiz veya gerçek dışı bilgilerle aktivasyon tamamlanmaz</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{selectedPkg === 'premium' ? 'Premium' : 'Standart'} Paket</div>
                <div className="text-green-400 text-sm">İlk 3 ay ücretsiz</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs line-through">{selectedPkg === 'premium' ? '₺50' : '₺30'}/ay</div>
                <div className="text-green-400 font-bold">₺0 / Bugün</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Kart Numarası</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  autoComplete="cc-number"
                  className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 font-mono text-sm transition ${cardError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-red-600 focus:ring-red-600/30'}`}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                {cardError && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <p className="text-red-400 text-xs">{cardError}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Kart Üzerindeki Ad</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  autoComplete="cc-name"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 text-sm transition"
                  placeholder="AD SOYAD"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Son Kullanım Tarihi</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    autoComplete="cc-exp"
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 font-mono text-sm transition ${expiryError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-red-600 focus:ring-red-600/30'}`}
                    placeholder="AA/YY"
                    maxLength={5}
                  />
                  {expiryError && <p className="text-red-400 text-xs mt-1.5">{expiryError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">CVC</label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    autoComplete="cc-csc"
                    className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 font-mono text-sm transition ${cvvError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-red-600 focus:ring-red-600/30'}`}
                    placeholder="***"
                    maxLength={3}
                  />
                  {cvvError && <p className="text-red-400 text-xs mt-1.5">{cvvError}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPaymentFormValid || !!cardError || !!cvvError || !!expiryError}
                className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#FF0000' }}
              >
                {loading ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> İşleniyor...</> : <><Shield className="w-5 h-5" /> Güvenli Aktivasyon</>}
              </button>
              {!isPaymentFormValid && (
                <p className="text-amber-400 text-xs mt-2 text-center">Kart bilgilerini kontrol edin</p>
              )}
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 text-gray-600 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>256-bit SSL · Luhn algoritması · CVC ve tarih doğrulaması</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
