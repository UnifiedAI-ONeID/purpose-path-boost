import { useEffect } from 'react';
import { usePWAPrompt } from '@/hooks/usePWAPrompt';
import { usePrefs } from '@/prefs/PrefsProvider';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, Share, Apple, Chrome } from 'lucide-react';
import logo from '@/assets/images/logo.png';

export default function Install() {
  const { deferred, installed, isiOS } = usePWAPrompt();
  const { lang } = usePrefs();

  useEffect(() => {
    // Track page visit
    if (typeof window !== 'undefined') {
      console.log('Install page visited');
    }
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;

    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('zg.pwa.installed', '1');
    }
  };

  const title = lang === 'zh-CN' ? '安装 ZhenGrowth' : lang === 'zh-TW' ? '安裝 ZhenGrowth' : 'Install ZhenGrowth';
  const subtitle = lang === 'zh-CN' 
    ? '获得完整的应用体验，支持离线访问和更快的加载速度'
    : lang === 'zh-TW'
    ? '獲得完整的應用體驗，支援離線訪問和更快的載入速度'
    : 'Get the full app experience with offline access and faster loading';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <img src={logo} alt="ZhenGrowth" className="relative w-20 h-20 rounded-2xl mx-auto" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {installed ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {lang === 'zh-CN' ? '已安装！' : lang === 'zh-TW' ? '已安裝！' : 'Already Installed!'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {lang === 'zh-CN' 
                  ? '您可以在主屏幕上找到 ZhenGrowth'
                  : lang === 'zh-TW'
                  ? '您可以在主畫面上找到 ZhenGrowth'
                  : 'You can find ZhenGrowth on your home screen'}
              </p>
              <Button asChild size="lg">
                <SmartLink to={ROUTES.home}>
                  {lang === 'zh-CN' ? '前往应用' : lang === 'zh-TW' ? '前往應用' : 'Go to App'}
                </SmartLink>
              </Button>
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-lg">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {lang === 'zh-CN' ? '离线访问' : lang === 'zh-TW' ? '離線訪問' : 'Works Offline'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh-CN' 
                        ? '即使没有网络也能访问您的内容'
                        : lang === 'zh-TW'
                        ? '即使沒有網路也能訪問您的內容'
                        : 'Access your content even without internet'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-lg">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {lang === 'zh-CN' ? '快速原生' : lang === 'zh-TW' ? '快速原生' : 'Fast & Native'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh-CN' 
                        ? '像真正的应用一样瞬间加载'
                        : lang === 'zh-TW'
                        ? '像真正的應用一樣瞬間載入'
                        : 'Loads instantly like a real app'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-lg">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {lang === 'zh-CN' ? '主屏幕访问' : lang === 'zh-TW' ? '主畫面訪問' : 'Home Screen'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'zh-CN' 
                        ? '从您的设备快速访问'
                        : lang === 'zh-TW'
                        ? '從您的裝置快速訪問'
                        : 'Quick access from your device'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Install Button or Instructions */}
              {deferred && !isiOS ? (
                <Button 
                  onClick={handleInstall}
                  className="w-full"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {lang === 'zh-CN' ? '安装应用' : lang === 'zh-TW' ? '安裝應用' : 'Install App'}
                </Button>
              ) : (
                <div className="space-y-4">
                  {isiOS ? (
                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Apple className="h-5 w-5 text-primary" />
                        <p className="font-medium">
                          {lang === 'zh-CN' ? 'iOS 安装说明' : lang === 'zh-TW' ? 'iOS 安裝說明' : 'iOS Installation'}
                        </p>
                      </div>
                      <ol className="text-sm space-y-3">
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                            1
                          </span>
                          <span>
                            {lang === 'zh-CN' ? '点击 Safari 的分享按钮' : lang === 'zh-TW' ? '點擊 Safari 的分享按鈕' : 'Tap the Share button'}
                            <Share className="inline-block ml-1 h-4 w-4" />
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                            2
                          </span>
                          <span>
                            {lang === 'zh-CN' ? '选择"添加到主屏幕"' : lang === 'zh-TW' ? '選擇「加入主畫面」' : 'Select "Add to Home Screen"'}
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                            3
                          </span>
                          <span>
                            {lang === 'zh-CN' ? '确认并点击"添加"' : lang === 'zh-TW' ? '確認並點擊「加入」' : 'Confirm and tap "Add"'}
                          </span>
                        </li>
                      </ol>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Chrome className="h-5 w-5 text-primary" />
                        <p className="font-medium">
                          {lang === 'zh-CN' ? 'Android 安装说明' : lang === 'zh-TW' ? 'Android 安裝說明' : 'Android Installation'}
                        </p>
                      </div>
                      <p className="text-sm">
                        {lang === 'zh-CN' 
                          ? '点击菜单 (⋮) → "安装应用" 或 "添加到主屏幕"'
                          : lang === 'zh-TW'
                          ? '點擊選單 (⋮) → 「安裝應用」或「新增至主畫面」'
                          : 'Tap Menu (⋮) → "Install App" or "Add to Home Screen"'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button 
                asChild
                variant="outline"
                className="w-full"
                size="lg"
              >
                <SmartLink to={ROUTES.home}>
                  {lang === 'zh-CN' ? '在浏览器中继续' : lang === 'zh-TW' ? '在瀏覽器中繼續' : 'Continue in Browser'}
                </SmartLink>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}