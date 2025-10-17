import React from 'react';
import { usePrefs } from '@/prefs/PrefsProvider';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en' as const, label: 'English', flag: '🇬🇧' },
  { code: 'zh-TW' as const, label: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN' as const, label: '简体中文', flag: '🇨🇳' },
];

export const LanguageSwitcher = () => {
  const { lang, setLang } = usePrefs();

  const currentLang = languages.find(l => l.code === lang) || languages[0];

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-muted-foreground hidden sm:inline">
        <Globe className="h-4 w-4 inline mr-1" />
        Language
      </label>
      <select 
        className="h-9 rounded-lg px-3 py-1 bg-surface text-foreground border border-border hover:bg-accent transition-colors text-sm"
        value={lang} 
        onChange={e=>setLang(e.target.value as 'en'|'zh-CN'|'zh-TW')}
        aria-label="Select language"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
};
