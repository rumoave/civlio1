import { ChevronRight, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

function CountdownBadge({ targetDate }) {
  const [rem, setRem] = useState(null);
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate + 'T00:00:00') - new Date();
      if (diff <= 0) { setRem('EXPIRED'); return; }
      const days = Math.floor(diff / 864e5);
      const hrs = Math.floor((diff % 864e5) / 36e5);
      setRem(days > 0 ? `${days}d ${hrs}h` : `${hrs}h`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (!rem) return null;
  const expired = rem === 'EXPIRED';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold"
      style={{
        background: expired ? '#f3f4f6' : '#fef2f2',
        color: expired ? '#6b7280' : '#c41e3a',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: 0.5,
        border: `1px solid ${expired ? '#e5e7eb' : '#fecaca'}`,
      }}
    >
      <Clock size={7} strokeWidth={2.5} />
      {rem}
    </span>
  );
}

const TYPE_CONFIG = {
  vote: {
    label: 'FLOOR VOTE',
    color: '#15803d',
    lightBg: '#f0fdf4',
    border: '#bbf7d0',
    iconBg: '#dcfce7',
  },
  hearing: {
    label: 'HEARING',
    color: '#7c3aed',
    lightBg: '#faf5ff',
    border: '#ddd6fe',
    iconBg: '#ede9fe',
  },
  markup: {
    label: 'MARKUP',
    color: '#1e40af',
    lightBg: '#eff6ff',
    border: '#bfdbfe',
    iconBg: '#dbeafe',
  },
  deadline: {
    label: 'DEADLINE',
    color: '#c41e3a',
    lightBg: '#fff1f2',
    border: '#fecdd3',
    iconBg: '#ffe4e6',
  },
};

export function WeeklySchedule({ events, onEventPress }) {
  const upcoming = (events || []).slice(0, 4);

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
            <Calendar size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-[#0f1d3a] tracking-tight leading-none mb-0.5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              This Week in Congress
            </h3>
            <p className="text-xs text-[#8492a6] font-light" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              119th Congress · Upcoming actions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {upcoming.map((event) => {
          const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.hearing;
          const d = new Date(event.date + 'T12:00:00');
          const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          const day = d.getDate();
          const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });

          return (
            <button
              key={event.id}
              onClick={() => onEventPress?.(event)}
              className="group text-left rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              style={{
                background: cfg.lightBg,
                border: `1.5px solid ${cfg.border}`,
              }}
            >
              <div className="p-5">
                {/* Type + badges row */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="font-bold uppercase tracking-widest"
                    style={{
                      color: cfg.color,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 9,
                      letterSpacing: 1.8,
                    }}
                  >
                    {cfg.label}
                  </span>
                  {event.urgent && (
                    <span
                      className="inline-flex items-center gap-1 font-bold text-white px-2 py-0.5 rounded-full"
                      style={{ background: '#c41e3a', fontSize: 8, letterSpacing: 0.5 }}
                    >
                      <AlertCircle size={7} strokeWidth={2.5} />
                      URGENT
                    </span>
                  )}
                  {event.type === 'deadline' && <CountdownBadge targetDate={event.date} />}
                </div>

                {/* Content row */}
                <div className="flex items-start gap-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-sm"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(255,255,255,0.8)',
                      }}
                    >
                      <span
                        className="leading-none mb-0.5"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 8,
                          letterSpacing: 1.2,
                          color: cfg.color,
                          fontWeight: 700,
                        }}
                      >
                        {month}
                      </span>
                      <span
                        className="font-light leading-none"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 30,
                          color: cfg.color,
                          lineHeight: 1,
                        }}
                      >
                        {day}
                      </span>
                    </div>
                    <span
                      className="text-center mt-1.5 font-light"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8492a6' }}
                    >
                      {weekday}
                    </span>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div
                      className="font-semibold text-[#0f1d3a] leading-snug mb-1.5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
                    >
                      {event.title}
                    </div>
                    <div
                      className="text-[#5f7287] font-light leading-relaxed line-clamp-2"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
                    >
                      {event.desc}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={16}
                    className="flex-shrink-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: cfg.color }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
