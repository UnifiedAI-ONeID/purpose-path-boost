import { useEffect, useState } from 'react';
import { track } from '@/analytics/events';
import { Link } from 'react-router-dom';
import { ProgramSheet } from '@/components/ProgramSheet';
import { A2HSPrompt } from '@/components/A2HSPrompt';

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
    <>
      <div className="min-h-screen bg-bg pb-24">
        {/* Compact Hero */}
        <header className="p-6 pt-8">
          <h1 className="text-2xl font-serif font-bold text-fg mb-3 leading-tight">
            Grow with clarity,<br />confidence, purpose
          </h1>
          <p className="text-sm text-muted mb-5">
            Personalized coaching for Chinese-speaking professionals.
          </p>
          <Link 
            to="/book" 
            className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-brand text-white hover:bg-brand/90 transition-all shadow-lg font-medium animate-fade-in"
          >
            Book a clarity session
          </Link>
        </header>

        {/* Horizontal Carousel */}
        <section className="mt-8 px-4">
          <h2 className="font-semibold text-fg mb-4 px-2">Popular programs</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
            {programs.map((program, index) => (
              <button
                key={program.id}
                onClick={() => setSelectedProgram(program)}
                className="min-w-[85%] snap-start shrink-0 p-5 rounded-2xl border border-border bg-surface hover:shadow-lg transition-all animate-fade-in text-left"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-semibold text-fg text-lg mb-2">{program.title}</h3>
                <p className="text-sm text-muted mb-3">{program.description}</p>
                <p className="text-xs text-muted/80">{program.duration}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-6 pointer-events-none z-10">
          <Link 
            to="/book" 
            className="block w-full h-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-2xl hover:bg-brand/90 transition-all pointer-events-auto font-semibold text-base hover-scale"
          >
            Book now
          </Link>
        </div>
      </div>

      <ProgramSheet 
        open={!!selectedProgram} 
        onClose={() => setSelectedProgram(null)} 
        program={selectedProgram} 
      />

      <A2HSPrompt />
    </>
  );
}
