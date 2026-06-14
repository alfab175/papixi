import { useState, useEffect } from 'react';
import { Menu, X, Search, ChevronDown, Bell } from 'lucide-react';
import { DBUser, DBProfile, PUBLIC_DOMAIN_AVATARS } from '../services/localDB';
import { PapixLogo } from './ui';

interface NavbarProps {
  user: DBUser;
  activeSection: string;
  onSectionChange: (s: 'home' | 'movies' | 'series' | 'cartoons' | 'mylist') => void;
  onAdminClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onProfilesClick: () => void;
  onSearchOpen: () => void;
  onNotificationsClick: () => void;
}

export default function Navbar({ user, activeSection, onSectionChange, onAdminClick, onLogout, onProfileClick, onProfilesClick, onSearchOpen, onNotificationsClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const nav = [
    { id: 'home', label: 'Ana Sayfa' },
    { id: 'movies', label: 'Filmler' },
    { id: 'series', label: 'Diziler' },
    { id: 'cartoons', label: 'Karikatürler' },
    { id: 'mylist', label: 'Listem' },
  ];

  const activeProfile = user.profiles?.find((p: DBProfile) => p.id === user.activeProfileId) || user.profiles?.[0];
  const avatar = PUBLIC_DOMAIN_AVATARS.find(a => a.id === activeProfile?.avatar);

  const handleNav = (id: string) => {
    onSectionChange(id as 'home' | 'movies' | 'series' | 'cartoons' | 'mylist');
    setMobileOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-black/98 shadow-2xl' : 'bg-gradient-to-b from-black/90 to-transparent'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => handleNav('home')} className="flex-shrink-0">
            <PapixLogo size="md" />
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {nav.map(n => (
              <button key={n.id} onClick={() => handleNav(n.id)}
                className={`text-sm font-medium transition-colors ${activeSection === n.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                {n.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button onClick={onSearchOpen} className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10">
              <Search className="w-4 h-4" />
            </button>
            <button onClick={onNotificationsClick} className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10" aria-label="Bildirimler">
              <Bell className="w-4 h-4" />
            </button>

            {user.isAdmin && (
              <button onClick={onAdminClick} className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-400 border border-yellow-600/40 hover:bg-yellow-600/10 transition">
                ⚙️ Admin
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/10 transition"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm bg-gradient-to-br from-gray-700 to-gray-600 flex-shrink-0">
                  {avatar?.emoji || user.firstName?.[0] || 'U'}
                </div>
                <span className="text-white text-xs font-medium hidden sm:block max-w-20 truncate">
                  {activeProfile?.name || user.firstName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 bg-gray-950 border border-gray-800 rounded-xl w-52 overflow-hidden shadow-2xl z-50">
                  {/* Profile list */}
                  <div className="p-2 border-b border-gray-800">
                    {(user.profiles || []).map((profile: DBProfile) => {
                      const pAvatar = PUBLIC_DOMAIN_AVATARS.find(a => a.id === profile.avatar);
                      return (
                        <button key={profile.id} onClick={() => { setShowProfileMenu(false); onProfilesClick(); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left ${user.activeProfileId === profile.id ? 'bg-red-600/20 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                          <span className="text-xl">{pAvatar?.emoji || profile.name[0]}</span>
                          <div>
                            <p className="text-xs font-medium">{profile.name}</p>
                            <p className="text-xs text-gray-600">{profile.type === 'child' ? 'Çocuk' : 'Yetişkin'}</p>
                          </div>
                          {user.activeProfileId === profile.id && <div className="ml-auto w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-1">
                    <button onClick={() => { setShowProfileMenu(false); onProfileClick(); }} className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
                      Hesap & Paket Bilgileri
                    </button>
                    <button onClick={() => { setShowProfileMenu(false); onLogout(); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition">
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-black/98 border-t border-gray-800 py-3 space-y-1">
            {nav.map(n => (
              <button key={n.id} onClick={() => handleNav(n.id)}
                className={`block w-full text-left px-4 py-2.5 text-sm rounded-lg transition ${activeSection === n.id ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {n.label}
              </button>
            ))}
            {user.isAdmin && (
              <button onClick={() => { onAdminClick(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-yellow-600/10 rounded-lg transition">
                ⚙️ Admin Paneli
              </button>
            )}
            <button onClick={() => { onLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-600/10 rounded-lg transition">
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showProfileMenu && <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />}
    </nav>
  );
}
