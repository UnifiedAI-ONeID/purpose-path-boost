import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEOHelmet } from '@/components/SEOHelmet';
import { usePrefs } from '@/prefs/PrefsProvider';
import { toast } from 'sonner';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleIcon from '@/components/icons/GoogleIcon';
import AppleIcon from '@/components/icons/AppleIcon';

export default function Auth() {
  const { lang } = usePrefs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnTo = searchParams.get('returnTo') || '/me';
        navigate(returnTo);
      }
      setCheckingAuth(false);
    });
  }, [navigate, searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/me`
          }
        });

        if (error) throw error;

        toast.success(
          lang === 'zh-CN' ? '注册成功！请检查您的邮箱以确认账户。' :
          lang === 'zh-TW' ? '註冊成功！請檢查您的郵箱以確認帳戶。' :
          'Sign up successful! Please check your email to confirm your account.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        const returnTo = searchParams.get('returnTo') || '/me';
        navigate(returnTo);
        
        toast.success(
          lang === 'zh-CN' ? '登录成功！' :
          lang === 'zh-TW' ? '登入成功！' :
          'Signed in successfully!'
        );
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(
        error.message || 
        (lang === 'zh-CN' ? '认证失败，请重试。' :
         lang === 'zh-TW' ? '認證失敗，請重試。' :
         'Authentication failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      const returnTo = searchParams.get('returnTo') || '/me';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${returnTo}`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('OAuth error:', error);
      toast.error(
        lang === 'zh-CN' ? 'OAuth 登录失败' :
        lang === 'zh-TW' ? 'OAuth 登入失敗' :
        'OAuth sign in failed'
      );
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = mode === 'signin'
    ? (lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Sign In')
    : (lang === 'zh-CN' ? '创建账户' : lang === 'zh-TW' ? '建立帳戶' : 'Create Account');

  const description = mode === 'signin'
    ? (lang === 'zh-CN' ? '登录以访问您的仪表板' : lang === 'zh-TW' ? '登入以存取您的儀表板' : 'Sign in to access your dashboard')
    : (lang === 'zh-CN' ? '开始您的成长之旅' : lang === 'zh-TW' ? '開始您的成長之旅' : 'Start your growth journey');

  return (
    <>
      <SEOHelmet
        title={`${title} - ZhenGrowth`}
        description={description}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* OAuth Buttons */}
              <div className="space-y-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                >
                  <GoogleIcon className="h-5 w-5" />
                  <span>
                    {lang === 'zh-CN' ? '使用 Google 继续' :
                     lang === 'zh-TW' ? '使用 Google 繼續' :
                     'Continue with Google'}
                  </span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleOAuth('apple')}
                  disabled={loading}
                >
                  <AppleIcon className="h-5 w-5" />
                  <span>
                    {lang === 'zh-CN' ? '使用 Apple 继续' :
                     lang === 'zh-TW' ? '使用 Apple 繼續' :
                     'Continue with Apple'}
                  </span>
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {lang === 'zh-CN' ? '或' : lang === 'zh-TW' ? '或' : 'Or'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {lang === 'zh-CN' ? '邮箱' : lang === 'zh-TW' ? '郵箱' : 'Email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={lang === 'zh-CN' ? '输入您的邮箱' : lang === 'zh-TW' ? '輸入您的郵箱' : 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    {lang === 'zh-CN' ? '密码' : lang === 'zh-TW' ? '密碼' : 'Password'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={lang === 'zh-CN' ? '输入您的密码' : lang === 'zh-TW' ? '輸入您的密碼' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : mode === 'signin' ? (
                    <LogIn className="mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {loading
                    ? (lang === 'zh-CN' ? '处理中...' : lang === 'zh-TW' ? '處理中...' : 'Processing...')
                    : title
                  }
                </Button>

                <div className="text-center text-sm">
                  {mode === 'signin' ? (
                    <>
                      {lang === 'zh-CN' ? '还没有账户？' : lang === 'zh-TW' ? '還沒有帳戶？' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="text-primary hover:underline font-medium"
                        disabled={loading}
                      >
                        {lang === 'zh-CN' ? '注册' : lang === 'zh-TW' ? '註冊' : 'Sign up'}
                      </button>
                    </>
                  ) : (
                    <>
                      {lang === 'zh-CN' ? '已有账户？' : lang === 'zh-TW' ? '已有帳戶？' : 'Already have an account?'}{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="text-primary hover:underline font-medium"
                        disabled={loading}
                      >
                        {lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Sign in'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
