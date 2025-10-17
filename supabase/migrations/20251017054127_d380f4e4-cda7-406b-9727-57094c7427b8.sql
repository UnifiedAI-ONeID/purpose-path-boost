
-- ============================================
-- COMPREHENSIVE DATABASE WIRING - INITIAL DATA
-- ============================================

-- 1. EXPERIMENTS - A/B Testing & Feature Flags
-- ============================================
INSERT INTO public.experiments (key, variants, enabled) VALUES
('pricing_test_vip', ARRAY['control', 'variant_a', 'variant_b'], true),
('pricing_test_dreambuilder', ARRAY['control', 'variant_a'], true),
('funnel_quiz_flow', ARRAY['standard', 'enhanced'], true),
('coaching_page_layout', ARRAY['classic', 'modern'], true),
('express_checkout', ARRAY['single_step', 'multi_step'], false)
ON CONFLICT (key) DO UPDATE SET
  variants = EXCLUDED.variants,
  enabled = EXCLUDED.enabled;

-- 2. LESSON PACKAGES - Group lessons into learning paths
-- ============================================
INSERT INTO public.lesson_packages (slug, title, summary, poster_url, active) VALUES
('foundations', 'Foundations of Growth', 'Essential lessons to start your personal development journey', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800', true),
('confidence-mastery', 'Confidence Mastery Path', 'Build unshakeable confidence and self-belief', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', true),
('goal-achievement', 'Goal Achievement System', 'Master the art of setting and achieving ambitious goals', 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  active = EXCLUDED.active;

-- 3. LESSON ASSIGNMENTS - Link lessons to packages
-- ============================================
INSERT INTO public.lesson_assignments (lesson_slug, offer_slug, tag, order_index) VALUES
-- Foundations package
('getting-started', NULL, 'foundations', 1),
('clarity-foundations', NULL, 'foundations', 2),

-- Confidence Mastery package
('confidence-building', NULL, 'confidence-mastery', 1),
('goal-setting-mastery', NULL, 'confidence-mastery', 2),

-- Link lessons to coaching offers
('getting-started', 'discovery-60', NULL, 1),
('clarity-foundations', 'dreambuilder-3mo', NULL, 1),
('confidence-building', 'dreambuilder-3mo', NULL, 2),
('goal-setting-mastery', 'life-mastery-6mo', NULL, 1)
ON CONFLICT DO NOTHING;

-- 4. COUPONS - Promotional discount codes
-- ============================================
INSERT INTO public.coupons (code, description, percent_off, amount_off_cents, currency, applies_to_slug, valid_from, valid_to, max_redemptions, per_user_limit, active) VALUES
('WELCOME50', 'Welcome offer - 50% off first session', 50, NULL, NULL, 'vip-private-1on1', NOW(), NOW() + INTERVAL '90 days', 100, 1, true),
('EARLYBIRD', 'Early bird discount for programs', NULL, 50000, 'USD', 'dreambuilder-3mo', NOW(), NOW() + INTERVAL '30 days', 50, 1, true),
('GROWTH2025', '25% off any coaching program', 25, NULL, NULL, NULL, NOW(), NOW() + INTERVAL '180 days', 200, 1, true),
('FRIEND20', 'Friend referral - 20% off', 20, NULL, NULL, NULL, NOW(), NOW() + INTERVAL '365 days', NULL, 2, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  valid_to = EXCLUDED.valid_to;

-- 5. FX RATES - Currency exchange rates
-- ============================================
INSERT INTO public.fx_rates (base, rates, updated_at) VALUES
('USD', '{
  "AUD": 1.52,
  "CAD": 1.36,
  "CNY": 7.24,
  "EUR": 0.92,
  "GBP": 0.79,
  "HKD": 7.83,
  "JPY": 149.50,
  "KRW": 1320.00,
  "NZD": 1.65,
  "SGD": 1.34,
  "TWD": 31.50,
  "USD": 1.00
}'::jsonb, NOW())
ON CONFLICT (base) DO UPDATE SET
  rates = EXCLUDED.rates,
  updated_at = NOW();

-- 6. EVENT COUPONS - Event-specific discount codes
-- ============================================
INSERT INTO public.event_coupons (
  event_id,
  code,
  discount_type,
  discount_value,
  starts_at,
  expires_at,
  max_uses,
  per_user_limit,
  applies_to_all,
  active,
  currency
)
SELECT 
  e.id,
  'WORKSHOP50',
  'percent',
  50,
  NOW(),
  NOW() + INTERVAL '30 days',
  50,
  1,
  true,
  true,
  'USD'
FROM events e
WHERE e.slug = 'clarity-workshop-2025'
ON CONFLICT DO NOTHING;

INSERT INTO public.event_coupons (
  event_id,
  code,
  discount_type,
  discount_value,
  starts_at,
  expires_at,
  max_uses,
  per_user_limit,
  applies_to_all,
  active,
  currency
)
SELECT 
  e.id,
  'EARLYACCESS',
  'amount',
  2000,
  NOW(),
  NOW() + INTERVAL '14 days',
  30,
  1,
  true,
  true,
  'USD'
FROM events e
WHERE e.slug = 'clarity-workshop-2025'
ON CONFLICT DO NOTHING;

-- 7. I18N TRANSLATIONS - Multi-language support
-- ============================================
INSERT INTO public.i18n_translations (source_lang, target_lang, scope, source_text, source_hash, translated_text) VALUES
-- Navigation
('en', 'zh-CN', 'nav', 'Dashboard', md5('Dashboard'), '仪表板'),
('en', 'zh-CN', 'nav', 'Coaching', md5('Coaching'), '辅导'),
('en', 'zh-CN', 'nav', 'Events', md5('Events'), '活动'),
('en', 'zh-CN', 'nav', 'Blog', md5('Blog'), '博客'),
('en', 'zh-TW', 'nav', 'Dashboard', md5('Dashboard'), '儀表板'),
('en', 'zh-TW', 'nav', 'Coaching', md5('Coaching'), '輔導'),
('en', 'zh-TW', 'nav', 'Events', md5('Events'), '活動'),
('en', 'zh-TW', 'nav', 'Blog', md5('Blog'), '部落格'),

-- Common actions
('en', 'zh-CN', 'actions', 'Book Now', md5('Book Now'), '立即预订'),
('en', 'zh-CN', 'actions', 'Learn More', md5('Learn More'), '了解更多'),
('en', 'zh-CN', 'actions', 'Get Started', md5('Get Started'), '开始使用'),
('en', 'zh-TW', 'actions', 'Book Now', md5('Book Now'), '立即預訂'),
('en', 'zh-TW', 'actions', 'Learn More', md5('Learn More'), '了解更多'),
('en', 'zh-TW', 'actions', 'Get Started', md5('Get Started'), '開始使用'),

-- Coaching page
('en', 'zh-CN', 'coaching', 'Choose Your Path', md5('Choose Your Path'), '选择您的道路'),
('en', 'zh-CN', 'coaching', 'Pricing', md5('Pricing'), '定价'),
('en', 'zh-TW', 'coaching', 'Choose Your Path', md5('Choose Your Path'), '選擇您的道路'),
('en', 'zh-TW', 'coaching', 'Pricing', md5('Pricing'), '定價'),

-- Status messages
('en', 'zh-CN', 'status', 'Loading...', md5('Loading...'), '加载中...'),
('en', 'zh-CN', 'status', 'Success!', md5('Success!'), '成功！'),
('en', 'zh-CN', 'status', 'Error', md5('Error'), '错误'),
('en', 'zh-TW', 'status', 'Loading...', md5('Loading...'), '載入中...'),
('en', 'zh-TW', 'status', 'Success!', md5('Success!'), '成功！'),
('en', 'zh-TW', 'status', 'Error', md5('Error'), '錯誤')
ON CONFLICT (source_hash, target_lang, scope) DO UPDATE SET
  translated_text = EXCLUDED.translated_text,
  updated_at = NOW();

-- ============================================
-- VERIFICATION QUERIES (for logging)
-- ============================================

-- Count all data
DO $$
DECLARE
  exp_count INT;
  pkg_count INT;
  assign_count INT;
  coupon_count INT;
  fx_count INT;
  event_coupon_count INT;
  i18n_count INT;
BEGIN
  SELECT COUNT(*) INTO exp_count FROM experiments;
  SELECT COUNT(*) INTO pkg_count FROM lesson_packages;
  SELECT COUNT(*) INTO assign_count FROM lesson_assignments;
  SELECT COUNT(*) INTO coupon_count FROM coupons;
  SELECT COUNT(*) INTO fx_count FROM fx_rates;
  SELECT COUNT(*) INTO event_coupon_count FROM event_coupons;
  SELECT COUNT(*) INTO i18n_count FROM i18n_translations;
  
  RAISE NOTICE 'Database wiring complete:';
  RAISE NOTICE '- Experiments: %', exp_count;
  RAISE NOTICE '- Lesson Packages: %', pkg_count;
  RAISE NOTICE '- Lesson Assignments: %', assign_count;
  RAISE NOTICE '- Coupons: %', coupon_count;
  RAISE NOTICE '- FX Rates: %', fx_count;
  RAISE NOTICE '- Event Coupons: %', event_coupon_count;
  RAISE NOTICE '- I18n Translations: %', i18n_count;
END $$;
