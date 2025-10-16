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
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Support both 'returnTo' and 'redirect' parameters for backward compatibility
        const returnTo = searchParams.get('returnTo') || searchParams.get('redirect');
        
        if (returnTo) {
          navigate(returnTo);
        } else {
          // Check admin status to route appropriately
          const response = await fetch('/api/admin/check-role', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const result = await response.json();
          
          navigate(result.is_admin ? '/admin' : '/me');
        }
      }
      setCheckingAuth(false);
    });
  }, [navigate, searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(
        lang === 'zh-CN' ? '请输入您的邮箱地址' :
        lang === 'zh-TW' ? '請輸入您的郵箱地址' :
        'Please enter your email address'
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;

      toast.success(
        lang === 'zh-CN' ? '密码重置链接已发送到您的邮箱' :
        lang === 'zh-TW' ? '密碼重置鏈接已發送到您的郵箱' :
        'Password reset link sent to your email'
      );
      setResetMode(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

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
          lang === 'zh-CN' ? '注册成功！' :
          lang === 'zh-TW' ? '註冊成功！' :
          'Sign up successful! You can now sign in.'
        );
        setMode('signin');
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          // Provide more specific error messages
          if (error.message.includes('Invalid login credentials')) {
            throw new Error(
              lang === 'zh-CN' ? '邮箱或密码错误。请检查您的凭据或使用"忘记密码"重置。' :
              lang === 'zh-TW' ? '郵箱或密碼錯誤。請檢查您的憑據或使用「忘記密碼」重置。' :
              'Invalid email or password. Please check your credentials or use "Forgot Password" to reset.'
            );
          }
          throw error;
        }

        // Check admin status and route accordingly
        const response = await fetch('/api/admin/check-role', {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        });
        
        const result = await response.json();
        // Support both 'returnTo' and 'redirect' parameters for backward compatibility
        const returnTo = searchParams.get('returnTo') || searchParams.get('redirect');
        
        if (returnTo) {
          navigate(returnTo);
        } else if (result.is_admin) {
          navigate('/admin');
        } else {
          navigate('/me');
        }
        
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
      // Support both 'returnTo' and 'redirect' parameters for backward compatibility
      const returnTo = searchParams.get('returnTo') || searchParams.get('redirect') || '/me';
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

  const title = resetMode
    ? (lang === 'zh-CN' ? '重置密码' : lang === 'zh-TW' ? '重置密碼' : 'Reset Password')
    : mode === 'signin'
    ? (lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Sign In')
    : (lang === 'zh-CN' ? '创建账户' : lang === 'zh-TW' ? '建立帳戶' : 'Create Account');

  const description = resetMode
    ? (lang === 'zh-CN' ? '输入您的邮箱以接收重置链接' : lang === 'zh-TW' ? '輸入您的郵箱以接收重置鏈接' : 'Enter your email to receive a reset link')
    : mode === 'signin'
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
              {resetMode ? (
                // Password Reset Form
                <form onSubmit={handlePasswordReset} className="space-y-4">
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

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loading
                      ? (lang === 'zh-CN' ? '发送中...' : lang === 'zh-TW' ? '發送中...' : 'Sending...')
                      : (lang === 'zh-CN' ? '发送重置链接' : lang === 'zh-TW' ? '發送重置鏈接' : 'Send Reset Link')
                    }
                  </Button>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setResetMode(false)}
                      className="text-primary hover:underline font-medium"
                      disabled={loading}
                    >
                      {lang === 'zh-CN' ? '返回登录' : lang === 'zh-TW' ? '返回登入' : 'Back to sign in'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
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
                        : mode === 'signin' 
                          ? (lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Sign In')
                          : (lang === 'zh-CN' ? '创建账户' : lang === 'zh-TW' ? '建立帳戶' : 'Create Account')
                      }
                    </Button>

                    {mode === 'signin' && (
                      <div className="text-center text-sm">
                        <button
                          type="button"
                          onClick={() => setResetMode(true)}
                          className="text-muted-foreground hover:text-primary hover:underline"
                          disabled={loading}
                        >
                          {lang === 'zh-CN' ? '忘记密码？' : lang === 'zh-TW' ? '忘記密碼？' : 'Forgot password?'}
                        </button>
                      </div>
                    )}

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
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
