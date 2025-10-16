# Framer Motion Animation System

Complete animation utilities for ZhenGrowth, respecting `prefers-reduced-motion` and optimized for mobile.

## 🎯 Components

### 1. **MotionProvider** - Global Config
```tsx
import MotionProvider from '@/components/motion/MotionProvider';

<MotionProvider>
  <App />
</MotionProvider>
```
- Auto-detects `prefers-reduced-motion`
- Sets global easing: `[0.22, 1, 0.36, 1]`
- Handles AnimatePresence for route transitions

---

### 2. **ScrollReveal** - Intersection Observer Animations
```tsx
import ScrollReveal from '@/components/motion/ScrollReveal';

<ScrollReveal dir="up" delay={0.1}>
  <h2>Clarity, fast.</h2>
</ScrollReveal>
```

**Props:**
- `dir`: `"up" | "down" | "left" | "right" | "none"`
- `delay`: number (seconds)
- `once`: boolean (default: true)
- `threshold`: number (default: 0.25)
- `as`: any motion component (default: motion.div)
- `className`: string

**Use Cases:**
- Hero headlines
- Section titles
- Feature cards
- CTA blocks

---

### 3. **StaggerList / StaggerItem** - List Animations
```tsx
import { StaggerList, StaggerItem } from '@/components/motion/StaggerList';

<StaggerList>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <div className="card">{item.title}</div>
    </StaggerItem>
  ))}
</StaggerList>
```

**Features:**
- Auto-staggers children by 0.06s
- Viewport trigger (once: true, amount: 0.2)
- Blur-in effect

**Use Cases:**
- Testimonials
- Feature lists
- Pricing cards
- Blog posts

---

### 4. **ParallaxHero** - Parallax Scrolling
```tsx
import ParallaxHero from '@/components/motion/Parallax';

<ParallaxHero height={380}>
  <div>
    <h1>Your Hero Text</h1>
    <SmartCTA>Book Now</SmartCTA>
  </div>
</ParallaxHero>
```

**Props:**
- `height`: number (px, default: 360)
- `children`: React.ReactNode

**How it works:**
- Background drifts -80px on scroll
- Text drifts -20px (subtle)
- Creates depth effect

---

### 5. **CountUp** - Animated Numbers
```tsx
import CountUp from '@/components/motion/CountUp';

<div className="text-2xl font-bold">
  <CountUp to={12} suffix="%" />
</div>
```

**Props:**
- `to`: number (target)
- `dur`: number (ms, default: 800)
- `suffix`: string (e.g., "%", "K", "+")

**Features:**
- Triggers on viewport intersection (40% threshold)
- Smooth easing
- Locale-aware number formatting

**Use Cases:**
- KPI cards
- Stats sections
- Conversion rates

---

### 6. **SmartCTA** - Animated Call-to-Action
```tsx
import SmartCTA from '@/components/motion/SmartCTA';

<SmartCTA onClick={() => navigate('/book')}>
  Book Free Call
</SmartCTA>
```

**Features:**
- Hover: lifts -1px + shadow
- Tap: scales 0.98
- Auto-ping after 3s (2.2s duration)
- Uses design tokens for shadow

**Use Cases:**
- Hero CTAs
- Sticky mobile buttons
- Form submit buttons

---

### 7. **PageTransition** - Route Transitions
```tsx
import PageTransition from '@/components/motion/PageTransition';

export default function SomePage() {
  return (
    <PageTransition>
      <div>Page content...</div>
    </PageTransition>
  );
}
```

**Animation:**
- Enter: fade + blur + y:6
- Exit: fade + blur + y:-6
- Duration: 0.35s

**Use with:**
- All page components
- MotionProvider's AnimatePresence

---

### 8. **MicroInteractions** - Toast & Shake
```tsx
import { Toast, Shake } from '@/components/motion/MicroInteractions';

// Error shake
<Shake>
  <Input hasError={true} />
</Shake>

// Success toast
<AnimatePresence>
  {showToast && <Toast ok={true} text="Saved!" />}
</AnimatePresence>
```

**Toast Props:**
- `ok`: boolean (green vs red)
- `text`: string

**Features:**
- Toast: fixed bottom-24, auto-center
- Shake: x-axis wobble in 0.35s

---

## 🎨 BottomSheet Integration

Updated `BottomSheet.tsx` with spring animation:
```tsx
<motion.div
  initial={{ y: "100%" }}
  animate={{ y: 0 }}
  exit={{ y: "100%" }}
  transition={{ type: "spring", stiffness: 260, damping: 30 }}
  className="..."
>
  {children}
</motion.div>
```

**Effect:**
- Native-feeling slide-up
- Spring physics (iOS-like)
- Backdrop fade-in/out

---

## 📱 Complete Page Example

```tsx
import MotionProvider from '@/components/motion/MotionProvider';
import PageTransition from '@/components/motion/PageTransition';
import ScrollReveal from '@/components/motion/ScrollReveal';
import ParallaxHero from '@/components/motion/Parallax';
import SmartCTA from '@/components/motion/SmartCTA';
import CountUp from '@/components/motion/CountUp';

export default function Home() {
  return (
    <MotionProvider>
      <PageTransition>
        <ParallaxHero height={380}>
          <div>
            <ScrollReveal dir="up">
              <h1 className="text-3xl font-semibold">
                Clarity • Confidence • Consistency
              </h1>
            </ScrollReveal>
            <ScrollReveal dir="up" delay={0.05}>
              <p className="text-muted">Bilingual coaching (EN/中文)</p>
            </ScrollReveal>
            <div className="mt-3">
              <SmartCTA onClick={() => navigate('/book')}>
                Book a Free Call
              </SmartCTA>
            </div>
          </div>
        </ParallaxHero>

        <section className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Lead→Client', value: 12, suffix: '%' },
            { label: 'NPS', value: 62, prefix: '+' },
            { label: 'Mobile CVR', value: 2.8, suffix: '%' }
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} dir="up" delay={i * 0.04}>
              <div className="card text-center">
                <div className="text-xs text-muted">{stat.label}</div>
                <div className="text-lg font-semibold">
                  {stat.prefix}
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </section>
      </PageTransition>
    </MotionProvider>
  );
}
```

---

## ⚡ Performance Tips

1. **Reduced Motion:**
   - MotionProvider auto-respects `prefers-reduced-motion`
   - All animations disabled when user requests

2. **Intersection Observer:**
   - ScrollReveal only animates when in viewport
   - CountUp triggers once at 40% visibility
   - Stagger uses `whileInView` (no scroll listeners)

3. **GPU Acceleration:**
   - All transforms use `x`, `y`, `scale`, `opacity`
   - Avoid animating `width`, `height`, `top`, `left`
   - `filter: blur()` composited on GPU

4. **Mobile Optimizations:**
   - Spring physics for sheets (natural feel)
   - Shorter durations (0.35s avg)
   - No complex parallax on mobile (check `isMobile()`)

---

## 🎯 Design System Integration

All animations use design tokens:
```tsx
// Colors
boxShadow: "0 8px 24px hsl(var(--primary) / 0.22)"
background: 'radial-gradient(..., hsl(var(--primary) / 0.15), transparent)'

// Timing
transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
```

**No hardcoded:**
- ❌ `#22d3ee`, `#0f9488`
- ✅ `hsl(var(--primary))`, `hsl(var(--accent))`

---

## 🧪 Testing Checklist

- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Verify scroll-triggered animations on mobile
- [ ] Check BottomSheet spring on iOS Safari
- [ ] Ensure CountUp triggers once per viewport entry
- [ ] Test SmartCTA ping timing (3s delay)
- [ ] Validate PageTransition on route changes
- [ ] Check Parallax performance (disable on low-end devices)

---

## 🔮 Future Enhancements

1. **Gesture Animations:**
   - Swipe to dismiss sheets
   - Pull-to-refresh

2. **Loading States:**
   - Skeleton screens with shimmer
   - Progress indicators

3. **Interactive Charts:**
   - Animated line/bar charts
   - CountUp + chart sync

4. **Micro-Feedback:**
   - Haptic feedback on mobile
   - Sound effects (optional)

---

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Motion Accessibility](https://www.framer.com/motion/accessibility/)
- [Spring Physics](https://www.framer.com/motion/transition/#spring)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

---

**Status:** ✅ Complete  
**Last Updated:** 2025-01-16  
**Maintained by:** Lovable AI
