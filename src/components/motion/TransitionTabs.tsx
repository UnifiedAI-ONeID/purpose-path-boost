import { useState } from 'react';
import { triggerHomeAnim } from '@/anim/animator';

type Tab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type Props = {
  tabs: Tab[];
  initial?: number;
};

/**
 * Tab component with smooth transitions using TransitionOverlay
 * 
 * Example usage:
 * ```tsx
 * <TransitionTabs
 *   tabs={[
 *     { id: 'overview', label: 'Overview', content: <OverviewContent /> },
 *     { id: 'details', label: 'Details', content: <DetailsContent /> },
 *     { id: 'faq', label: 'FAQ', content: <FAQContent /> }
 *   ]}
 *   initial={0}
 * />
 * ```
 */
export default function TransitionTabs({ tabs, initial = 0 }: Props) {
  const [activeIndex, setActiveIndex] = useState(initial);

  function switchTab(newIndex: number) {
    if (newIndex === activeIndex) return;
    
    triggerHomeAnim(600);
    setActiveIndex(newIndex);
  }

  return (
    <div className="relative">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              idx === activeIndex
                ? 'bg-card text-card-foreground font-medium border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
            onClick={() => switchTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tabs[activeIndex].content}
      </div>
    </div>
  );
}
