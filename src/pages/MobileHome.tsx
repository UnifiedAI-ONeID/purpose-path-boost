import React, { useEffect, useState } from 'react';
import { track } from '@/analytics/events';
import { ROUTES } from '@/nav/routes';
import { ProgramSheet } from '@/components/ProgramSheet';
import { A2HSPrompt } from '@/components/A2HSPrompt';
import MobileShell, { Section, MobileCard, MobileCTA, StatRow } from '@/components/mobile/MobileShell';
import HeroMobile from '@/components/mobile/HeroMobile';

export default function MobileHome() {
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  useEffect(() => {
    track('page_view', { page: 'mobile_home' });
    
    // Track visits for A2HS
    const visits = parseInt(localStorage.getItem('app_visits') || '0');
    localStorage.setItem('app_visits', String(visits + 1));
  }, []);

  const programs = [
    {
      id: "career",
      title: "Career Breakthrough",
      description: "Navigate transitions with clarity",
      duration: "6–8 weeks · 1:1",
      overview: "Designed for professionals navigating career transitions, this program helps you gain clarity on your next move, build confidence in your decisions, and create an actionable roadmap for success.",
      benefits: [
        "Weekly 1:1 coaching sessions (60 min)",
        "Personalized career assessment",
        "Action plan with clear milestones",
        "Email support between sessions",
        "Resources & worksheets"
      ],
      reviews: [
        { name: "Sarah L.", rating: 5, text: "Helped me navigate a major career transition with confidence. The structured approach and personalized guidance were exactly what I needed." },
        { name: "Michael C.", rating: 5, text: "Transformative experience. I gained clarity on my career goals and have a concrete plan to achieve them." }
      ],
      faqs: [
        { q: "How long is each session?", a: "Each session is 60 minutes, conducted via video call at a time that works for your schedule." },
        { q: "What if I need to reschedule?", a: "You can reschedule up to 24 hours before your session with no penalty." },
        { q: "Is this program right for me?", a: "If you're considering a career change, feeling stuck, or want to accelerate your growth, this program is designed for you." }
      ]
    },
    {
      id: "leadership",
      title: "Leadership Accelerator",
      description: "Lead with confidence and impact",
      duration: "6–8 weeks · 1:1",
      overview: "Elevate your leadership presence and effectiveness. This program focuses on developing your authentic leadership style, improving team dynamics, and driving meaningful impact.",
      benefits: [
        "Weekly 1:1 leadership coaching",
        "360° leadership assessment",
        "Communication & influence strategies",
        "Team dynamics workshops",
        "Ongoing support via email"
      ],
      reviews: [
        { name: "Jennifer W.", rating: 5, text: "My team engagement scores improved dramatically. The coaching helped me become the leader I always wanted to be." },
        { name: "David K.", rating: 5, text: "Practical, actionable insights that I could apply immediately. Worth every penny." }
      ],
      faqs: [
        { q: "Do I need to be in a leadership role?", a: "This program is for current leaders and those aspiring to leadership positions." },
        { q: "What tools do you use?", a: "We use proven frameworks and assessments tailored to your specific context and goals." }
      ]
    },
    {
      id: "life",
      title: "Life Reset",
      description: "Realign with your purpose",
      duration: "6–8 weeks · 1:1",
      overview: "Step back, reflect, and realign with what truly matters. This holistic program helps you reconnect with your values, clarify your purpose, and design a life that feels authentic and fulfilling.",
      benefits: [
        "Deep values & purpose exploration",
        "Life design framework",
        "Weekly 1:1 sessions",
        "Meditation & mindfulness practices",
        "Personalized action plan"
      ],
      reviews: [
        { name: "Amanda R.", rating: 5, text: "Life-changing. I finally feel aligned with my values and have a clear vision for my future." }
      ],
      faqs: [
        { q: "Is this therapy?", a: "No, this is coaching focused on forward movement and goal achievement, not clinical therapy." },
        { q: "How is this different from career coaching?", a: "This program takes a holistic view of all life domains, not just career." }
      ]
    },
    {
      id: "executive",
      title: "Executive Presence",
      description: "Elevate your influence",
      duration: "4 weeks · 1:1",
      overview: "Build commanding presence and influence in high-stakes situations. Perfect for executives and senior leaders.",
      benefits: [
        "Intensive 4-week program",
        "Communication mastery",
        "Personal branding strategy",
        "High-stakes presentation coaching"
      ],
      reviews: [
        { name: "Robert T.", rating: 5, text: "Helped me command the room and communicate with clarity at the C-level." }
      ],
      faqs: [
        { q: "Who is this for?", a: "Senior leaders, executives, and high-potential managers." }
      ]
    },
    {
      id: "balance",
      title: "Work-Life Integration",
      description: "Balance without burnout",
      duration: "6 weeks · 1:1",
      overview: "Create sustainable success without sacrificing what matters most.",
      benefits: [
        "Energy management techniques",
        "Boundary-setting strategies",
        "Sustainable productivity systems",
        "Stress reduction practices"
      ],
      reviews: [
        { name: "Lisa M.", rating: 5, text: "Finally found a way to excel at work without burning out. Game-changer." }
      ],
      faqs: [
        { q: "Will I need to work less?", a: "Not necessarily. We focus on working smarter and creating space for what matters." }
      ]
    }
  ];

  return (
    <MobileShell>
      <HeroMobile />

      <Section title="Popular Programs" subtitle="Choose the right path for your growth">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
          {programs.map((program, index) => (
            <button
              key={program.id}
              onClick={() => setSelectedProgram(program)}
              className="min-w-[85%] snap-start shrink-0 p-5 rounded-2xl border border-border bg-card hover:shadow-lg transition-all text-left"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="font-semibold text-lg mb-2">{program.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
              <p className="text-xs text-muted-foreground/80">{program.duration}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Quick Wins" subtitle="Start your journey today">
        <div className="grid gap-3">
          <MobileCard href={ROUTES.quiz}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="font-medium">3-min Clarity Quiz</div>
                <div className="text-sm text-muted-foreground">Get your personalized 90-day plan</div>
              </div>
            </div>
          </MobileCard>

          <MobileCard href={ROUTES.events}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <div className="font-medium">Live Workshops</div>
                <div className="text-sm text-muted-foreground">Join bilingual sessions</div>
              </div>
            </div>
          </MobileCard>

          <MobileCard href={ROUTES.coaching}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-medium">Free Clarity Call</div>
                <div className="text-sm text-muted-foreground">30-min discovery session</div>
              </div>
            </div>
          </MobileCard>
        </div>
      </Section>

      <Section title="Results at a Glance">
        <StatRow items={[
          { label: 'Lead→Client', value: '12%' },
          { label: 'NPS', value: '+62' },
          { label: 'Avg Session', value: '8m' }
        ]} />
      </Section>

      <Section title="Ready to Start?">
        <MobileCTA href={ROUTES.coaching}>Book Your Free Call</MobileCTA>
      </Section>

      <ProgramSheet 
        open={!!selectedProgram} 
        onClose={() => setSelectedProgram(null)} 
        program={selectedProgram} 
      />

      <A2HSPrompt />
    </MobileShell>
  );
}
