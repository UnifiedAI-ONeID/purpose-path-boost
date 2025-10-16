import { usePrefs } from '@/prefs/PrefsProvider';

export default function ThemeToggle(){
  const { theme, resolvedTheme, setTheme } = usePrefs();

  return (
    <div className="inline-flex items-center gap-2">
      <label className="text-sm text-muted-foreground hidden sm:inline">Theme</label>
      <select 
        className="h-9 rounded-lg px-3 py-1 bg-surface text-foreground border border-border hover:bg-accent transition-colors text-sm"
        value={theme} 
        onChange={e=>setTheme(e.target.value as 'light'|'dark'|'auto')}
        aria-label="Select theme"
      >
        <option value="auto">Auto ({resolvedTheme})</option>
        <option value="light">☀️ Light</option>
        <option value="dark">🌙 Dark</option>
      </select>
    </div>
  );
}
