const TOPIC_COLORS = {
  'Gov. Shutdown / DHS': 'bg-[#8b2e2e]',
  'Tax Cuts & TCJA': 'bg-[#d97706]',
  'Border Security': 'bg-[#2d6a4f]',
  'Critical Minerals & AI': 'bg-[#7c3aed]',
  'Voter Eligibility': 'bg-[#1e40af]',
  'Healthcare & Fentanyl': 'bg-[#059669]',
  'Energy Regulation': 'bg-[#b45309]',
  'Defense & ICC': 'bg-[#991b1b]',
};
// Hot topics with urgency (active floor/deadline action)
const HOT_TOPICS = new Set(['Gov. Shutdown / DHS', 'Tax Cuts & TCJA', 'Border Security']);

export function TopicFilters({ trending, activeTopic, onTopicChange }) {
  const all = { name: 'All', count: null };
  const items = [all, ...(trending || [])];

  return (
    <div className="mb-8">
      <h3 className="text-lg font-light text-[#202124] mb-3">Filter by Topic</h3>
      <div className="flex flex-wrap gap-2">
        {items.map(topic => {
          const isActive = activeTopic === topic.name;
          const dotColor = TOPIC_COLORS[topic.name] || 'bg-[#5f6368]';

          const isHot = HOT_TOPICS.has(topic.name);
          return (
            <button
              key={topic.name}
              onClick={() => onTopicChange?.(topic.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all relative overflow-hidden
                ${
                  isActive
                    ? 'bg-[#202124] text-white shadow-md'
                    : 'bg-white text-[#202124] border border-[#e8eaed] hover:shadow-md hover:border-transparent'
                }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${dotColor} flex-shrink-0`}
                style={{ animation: isHot && !isActive ? 'topicDotPulse 1.8s ease-in-out infinite' : 'none' }}
              />
              <span>{topic.name}</span>
              {isHot && !isActive && (
                <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#c41e3a', fontSize: 8, letterSpacing: 0.5 }}>HOT</span>
              )}
              {topic.count != null && (
                <span
                  key={topic.count}
                  className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f1f3f4] text-[#5f6368]'
                  }`}
                  style={{ animation: 'countPop 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
                >
                  {topic.count}
                </span>
              )}
              <style>{`@keyframes countPop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
              <style>{`@keyframes topicDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:0.6}}`}</style>
            </button>
          );
        })}
      </div>
    </div>
  );
}
