import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { Menu, X, LogOut, ArrowLeft, Crown } from 'lucide-react';

export function TopNav() {
  const { t } = useT();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/agent/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.email) setUser(data);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/agent/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/agent/login');
  }

  const navLinks = [
    { to: '/agent/dashboard', label: t('agent.topnav.dashboard' as any) },
    { to: '/agent/settings', label: t('agent.topnav.settings' as any) },
  ];

  const planLabel = user?.plan_label || 'Free';
  const planColor = user?.plan === 'pro' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    : user?.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/agent/dashboard"
            className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          >
            ColdCopy
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: plan badge + user + logout (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/agent/upgrade"
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80 ${planColor}`}
          >
            <Crown className="w-3 h-3" />
            {planLabel}
          </Link>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            {t('agent.topnav.back' as any)}
          </Link>
          {user?.email && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-400 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 mr-1.5" />
            {t('agent.topnav.logout' as any)}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4 pt-2 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/agent/upgrade"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Crown className="w-4 h-4" />
            Upgrade ({planLabel})
          </Link>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            {t('agent.topnav.back' as any)}
          </Link>
          {user?.email && (
            <p className="py-2 text-sm text-muted-foreground">{user.email}</p>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 mr-1.5" />
            {t('agent.topnav.logout' as any)}
          </Button>
        </div>
      )}
    </nav>
  );
}
