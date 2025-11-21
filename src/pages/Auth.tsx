import { useState, useEffect } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
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
import { invokeApi } from '@/lib/api-client';
import { isMobileDevice } from '@/lib/deviceDetect';

export default function Auth() {
  const { lang } = usePrefs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [resetMode, setResetMode] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);

  useEffect(() => {
    // Check if this is a password recovery callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setUpdatePasswordMode(true);
      setCheckingAuth(false);
      return;
    }

    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Defer navigation and async operations to avoid blocking
        setTimeout(() => {
          handleExistingSession(session);
        }, 0);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [navigate, searchParams]);

  // Separate async function to handle existing session
  const handleExistingSession = async (session: any) => {
    try {
      // For OAuth users, create profile using edge function if it doesn't exist
      console.log('[Auth] Checking/creating profile for OAuth user:', session.user.id);
      
      const response = await supabase.functions.invoke('api-auth-create-profile', {
        body: {
          userId: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!,
          locale: 'en'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('[Auth] OAuth profile creation error:', response.error);
      } else {
        console.log('[Auth] OAuth profile handled:', response.data);
      }
    } catch (profileErr) {
      console.error('[Auth] OAuth profile creation exception:', profileErr);
    }

    // Support both 'returnTo' and 'redirect' parameters for backward compatibility
    const returnTo = searchParams.get('returnTo') || searchParams.get('redirect');

    // Always determine admin status first so we can override incorrect returnTo targets
    let isAdmin = false;
    try {
      const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!adminError) {
        isAdmin = adminData?.is_admin === true;
      } else {
        console.error('[Auth] Admin check error on session restore:', adminError);
      }
    } catch (error) {
      console.error('[Auth] Admin check exception on session restore:', error);
    }

    if (returnTo) {
      // Navigate to the requested page, or default to admin domain for admins without a return path
      if (returnTo !== '/' && returnTo !== '/dashboard') {
        // Allow access to any requested page
        navigate(returnTo);
      } else if (isAdmin) {
        // Redirect to external admin domain
        console.log('[Auth] Routing admin to admin.zhengrowth.com from session restore');
        window.location.href = 'https://admin.zhengrowth.com';
        return;
      } else {
        navigate(returnTo);
      }
    } else {
      // No return path specified
      if (isAdmin) {
        console.log('[Auth] Routing admin to admin.zhengrowth.com from session restore');
        window.location.href = 'https://admin.zhengrowth.com';
        return;
      } else {
        // Default to appropriate dashboard based on device
        let devicePreference: string | null = null;
        try {
          devicePreference = localStorage.getItem('zg.devicePreference');
        } catch (e) {
          console.warn('localStorage not available:', e);
        }
        const shouldUseMobile = devicePreference ? devicePreference === 'mobile' : isMobileDevice();
        const targetRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
        console.log('[Auth] Routing user to', targetRoute, 'from session restore');
        navigate(targetRoute);
      }
    }
    setCheckingAuth(false);
  };

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
      // Send custom branded password reset email via our edge function
      // This will generate the proper Supabase recovery token and send our branded email
      const { data, error: emailError } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          language: lang
        }
      });

      if (emailError) {
        console.error('Password reset error:', emailError);
        throw new Error(emailError.message || 'Failed to send reset email');
      }

      // Check response data for errors (edge function returns 200 with error payload)
      if (!data?.success) {
        console.error('Password reset failed:', data);
        
        // Check for domain verification error
        if (data?.needsDomainVerification) {
          toast.error(
            lang === 'zh-CN' ? '邮件服务需要域名验证。请联系支持团队。' :
            lang === 'zh-TW' ? '郵件服務需要域名驗證。請聯繫支持團隊。' :
            'Email service requires domain verification. Please contact support.'
          );
        } else {
          toast.error(
            data?.error ||
            (lang === 'zh-CN' ? '发送重置邮件失败' :
             lang === 'zh-TW' ? '發送重置郵件失敗' :
             'Failed to send reset email')
          );
        }
        return;
      }

      console.log('Password reset email sent:', data);

      toast.success(
        lang === 'zh-CN' ? '密码重置链接已发送到您的邮箱' :
        lang === 'zh-TW' ? '密碼重置鏈接已發送到您的郵箱' :
        'Password reset link sent to your email'
      );
      setResetMode(false);
      setEmail(''); // Clear email field
    } catch (error: any) {
      console.error('[Auth] Password reset error:', error);
      console.error('[Auth] Error details:', { email, message: error.message });
      toast.error(
        error.message || 
        (lang === 'zh-CN' ? '发送重置邮件失败' :
         lang === 'zh-TW' ? '發送重置郵件失敗' :
         'Failed to send reset email')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error(
        lang === 'zh-CN' ? '密码至少需要6个字符' :
        lang === 'zh-TW' ? '密碼至少需要6個字符' :
        'Password must be at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        lang === 'zh-CN' ? '密码不匹配' :
        lang === 'zh-TW' ? '密碼不匹配' :
        'Passwords do not match'
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Sign out the user after password update
      await supabase.auth.signOut();

      toast.success(
        lang === 'zh-CN' ? '密码已成功更新！请使用新密码登录。' :
        lang === 'zh-TW' ? '密碼已成功更新！請使用新密碼登入。' :
        'Password updated successfully! Please sign in with your new password.'
      );

      // Clear hash and redirect to login screen
      window.history.replaceState(null, '', '/auth');
      setUpdatePasswordMode(false);
      setPassword('');
      setConfirmPassword('');
      setMode('signin');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error(
        error.message || 
        (lang === 'zh-CN' ? '密码更新失败' :
         lang === 'zh-TW' ? '密碼更新失敗' :
         'Failed to update password')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/me`
          }
        });

        if (error) throw error;

        // Create profile immediately after signup using edge function
        if (data.user) {
          console.log('[Auth] Signup successful, creating profile via edge function:', data.user.id);
          
          try {
            // Use edge function with service role to bypass RLS issues
            const { data: { session } } = await supabase.auth.getSession();
            const response = await supabase.functions.invoke('api-auth-create-profile', {
              body: {
                userId: data.user.id,
                email: email,
                name: data.user.user_metadata?.full_name || email,
                locale: 'en'
              },
              headers: session?.access_token ? {
                Authorization: `Bearer ${session.access_token}`
              } : undefined
            });

            if (response.error) {
              console.error('[Auth] Profile creation error:', response.error);
              // Don't block signup - profile can be created later
            } else {
              console.log('[Auth] Profile created successfully:', response.data);
            }
          } catch (profileErr) {
            console.error('[Auth] Profile creation exception:', profileErr);
            // Non-blocking error
          }
        }

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

        // Support both 'returnTo' and 'redirect' parameters for backward compatibility
        const returnTo = searchParams.get('returnTo') || searchParams.get('redirect');
        
        // Determine admin status so we can override incorrect destinations
        let isAdmin = false;
        try {
          const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
            headers: {
              Authorization: `Bearer ${data.session?.access_token}`
            }
          });
          if (!adminError) {
            isAdmin = adminData?.is_admin === true;
          } else {
            console.error('[Auth] Admin check error on login:', adminError);
          }
        } catch (err) {
          console.error('[Auth] Admin check exception on login:', err);
        }
        
        if (returnTo && returnTo !== '/' && returnTo !== '/dashboard') {
          // Allow access to any requested page
          navigate(returnTo);
        } else if (isAdmin) {
          // Redirect to external admin domain
          console.log('[Auth] Routing admin to admin.zhengrowth.com');
          window.location.href = 'https://admin.zhengrowth.com';
          return;
        } else {
          // Route non-admin to appropriate dashboard based on device
          let devicePreference: string | null = null;
          try {
            devicePreference = localStorage.getItem('zg.devicePreference');
          } catch (e) {
            console.warn('localStorage not available:', e);
          }
          
          const shouldUseMobile = devicePreference 
            ? devicePreference === 'mobile' 
            : isMobileDevice();
          
          const targetRoute = shouldUseMobile ? '/pwa/dashboard' : '/me';
          console.log('[Auth] Routing user to', targetRoute);
          navigate(targetRoute);
        }
        
        toast.success(
          lang === 'zh-CN' ? '登录成功！' :
          lang === 'zh-TW' ? '登入成功！' :
          'Signed in successfully!'
        );
      }
    } catch (error: any) {
      console.error('[Auth] Authentication error:', error);
      console.error('[Auth] Error details:', { 
        mode, 
        email, 
        message: error.message,
        code: error.code 
      });
      
      // Enhanced error messages for common scenarios
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = mode === 'signin'
          ? (lang === 'zh-CN' ? '邮箱或密码错误。请检查您的凭据。' :
             lang === 'zh-TW' ? '郵箱或密碼錯誤。請檢查您的憑據。' :
             'Invalid email or password. Please check your credentials.')
          : (lang === 'zh-CN' ? '此邮箱已注册。请登录。' :
             lang === 'zh-TW' ? '此郵箱已註冊。請登入。' :
             'This email is already registered. Please sign in.');
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = lang === 'zh-CN' ? '请确认您的邮箱后再登录。' :
                       lang === 'zh-TW' ? '請確認您的郵箱後再登入。' :
                       'Please confirm your email before signing in.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = lang === 'zh-CN' ? '此邮箱已注册。请登录。' :
                       lang === 'zh-TW' ? '此郵箱已註冊。請登入。' :
                       'This email is already registered. Please sign in.';
      }
      
      toast.error(errorMessage || 
        (lang === 'zh-CN' ? '认证失败，请重试。' :
         lang === 'zh-TW' ? '認證失敗，請重試。' :
         'Authentication failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const title = updatePasswordMode
    ? (lang === 'zh-CN' ? '设置新密码' : lang === 'zh-TW' ? '設置新密碼' : 'Set New Password')
    : resetMode
    ? (lang === 'zh-CN' ? '重置密码' : lang === 'zh-TW' ? '重置密碼' : 'Reset Password')
    : mode === 'signin'
    ? (lang === 'zh-CN' ? '登录' : lang === 'zh-TW' ? '登入' : 'Sign In')
    : (lang === 'zh-CN' ? '创建账户' : lang === 'zh-TW' ? '建立帳戶' : 'Create Account');

  const description = updatePasswordMode
    ? (lang === 'zh-CN' ? '输入您的新密码' : lang === 'zh-TW' ? '輸入您的新密碼' : 'Enter your new password')
    : resetMode
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
              {updatePasswordMode ? (
                // Update Password Form (after clicking reset link from email)
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">
                      {lang === 'zh-CN' ? '新密码' : lang === 'zh-TW' ? '新密碼' : 'New Password'}
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder={lang === 'zh-CN' ? '输入新密码' : lang === 'zh-TW' ? '輸入新密碼' : 'Enter new password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      {lang === 'zh-CN' ? '确认密码' : lang === 'zh-TW' ? '確認密碼' : 'Confirm Password'}
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder={lang === 'zh-CN' ? '再次输入新密码' : lang === 'zh-TW' ? '再次輸入新密碼' : 'Enter new password again'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loading
                      ? (lang === 'zh-CN' ? '更新中...' : lang === 'zh-TW' ? '更新中...' : 'Updating...')
                      : (lang === 'zh-CN' ? '更新密码' : lang === 'zh-TW' ? '更新密碼' : 'Update Password')
                    }
                  </Button>
                </form>
              ) : resetMode ? (
                // Password Reset Request Form
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
                  {/* OAuth Buttons - Hidden until providers are enabled in backend */}

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
