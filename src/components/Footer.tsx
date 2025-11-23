import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, MessageCircle } from 'lucide-react';
import logo from '@/assets/images/logo.png';

export const Footer = () => {
  const { t, ready } = useTranslation('common');

  // A safe translation function that provides fallbacks if i18next is not ready.
  const tSafe = (key: string) => {
    if (!ready) {
      const fallbacks: Record<string, string> = {
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.coaching': 'Coaching',
        'nav.blog': 'Blog',
        'footer.connect': 'Connect',
        'footer.wechat': 'WeChat',
        'footer.rights': '© 2025 ZhenGrowth. All rights reserved.',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service'
      };
      return fallbacks[key] || key;
    }
    return t(key);
  }

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src={logo} alt="ZhenGrowth Logo" className="h-8 w-8" />
              <h3 className="text-xl font-serif font-bold text-primary">ZhenGrowth</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering professionals to grow with clarity, confidence, and purpose.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">{tSafe('nav.home')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  {tSafe('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/coaching" className="text-muted-foreground hover:text-primary transition-colors">
                  {tSafe('nav.coaching')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  {tSafe('nav.blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4">{tSafe('footer.connect')}</h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:hello@zhengrowth.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                hello@zhengrowth.com
              </a>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{tSafe('footer.wechat')}: ZhenGrowth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>{tSafe('footer.rights')}</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              {tSafe('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              {tSafe('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};