import { TrendingUp, Users, Calendar, FileText, ArrowRight, Zap } from 'lucide-react';

const STAGE_ORDER = ['introduced','in_committee','on_the_floor','passed_house','passed_senate','signed_into_law'];
const STAGE_IDX_MAP = {introduced:0,in_committee:1,on_the_floor:2,passed_house:3,passed_senate:4,passed:4,signed_into_law:5,failed:-1,vetoed:4};

const STATUS_COLORS = {
  signed_into_law: '#15803d',
  passed_house: '#1e40af',
  passed_senate: '#1e40af',
  on_the_floor: '#0369a1',
  in_committee: '#b45309',
  introduced: '#7c3aed',
  failed: '#c41e3a',
  vetoed: '#9b1c1c',
};

const STATUS_LABELS = {
  signed_into_law: 'Signed into Law',
  passed_house: 'Passed House',
  passed_senate: 'Passed Senate',
  on_the_floor: 'On the Floor',
  in_committee: 'In Committee',
  introduced: 'Introduced',
  failed: 'Failed',
  vetoed: 'Vetoed',
};

const IS_LIVE = new Set(['on_the_floor', 'in_committee']);

function MiniPipeline({ status }) {
  const idx = STAGE_IDX_MAP[status] ?? 0;
  const col = STATUS_COLORS[status] || '#6b7280';
  const failed = status === 'failed';

  if (failed) {
    return (
      <div className="flex items-center gap-1 mt-3">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#fee2e2' }}>
          <div className="h-full rounded-full w-1/3" style={{ background: '#c41e3a' }} />
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#c41e3a', fontWeight: 600 }}>FAILED</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STAGE_ORDER.map((s, i) => {
        const done = i <= idx;
        const cur = i === idx;
        const isLiveNode = cur && IS_LIVE.has(status);
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none gap-0.5">
            <div
              className="rounded-full flex-shrink-0"
              style={{
                width: cur ? 8 : 5,
                height: cur ? 8 : 5,
                background: done ? col : '#e2e8f0',
                boxShadow: cur ? `0 0 0 3px ${col}28` : 'none',
                animation: isLiveNode ? 'billPipePulse 1.8s ease-in-out infinite' : 'none',
                transition: 'all 0.2s',
              }}
            />
            {i < STAGE_ORDER.length - 1 && (
              <div className="flex-1 h-px rounded-full overflow-hidden" style={{ background: '#e2e8f0', minWidth: 4 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: i < idx ? col : 'transparent',
                    '--fill-w': i < idx ? '100%' : '0%',
                    width: 'var(--fill-w)',
                    animation: i < idx ? 'billPipeFill 0.5s ease forwards' : 'none',
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      <style>{`@keyframes billPipeFill{from{width:0}to{width:var(--fill-w,100%)}}@keyframes billPipePulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// Featured bill IDs to show in Active Legislation
const FEATURED_IDS = ['b1', 'b3', 'b6', 'b10'];

export function ActiveLegislation({ bills, members, wb, onBillPress }) {
  const featured = bills
    ? FEATURED_IDS.map(id => bills.find(b => b.id === id)).filter(Boolean)
    : [];

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #c41e3a 0%, #9b1c1c 100%)' }}
          >
            <FileText size={18} className="text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h3
              className="text-xl font-semibold text-[#0f1d3a] tracking-tight leading-none mb-0.5"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Active Legislation
            </h3>
            <p className="text-xs text-[#8492a6] font-light" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Bills with recent floor or committee action
            </p>
          </div>
        </div>
        <button
          onClick={() => onBillPress?.('all')}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white transition-all hover:opacity-90 shadow-md"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          View All
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {featured.map((bill) => {
          const sponsor = members?.find(m => m.id === bill.spId);
          const col = STATUS_COLORS[bill.status] || '#7c3aed';
          const statusLabel = STATUS_LABELS[bill.status] || bill.status;
          const isLive = IS_LIVE.has(bill.status);

          let statInfo = null;
          if (bill.votes?.house) {
            statInfo = { label: 'House Vote', value: `${bill.votes.house.yea}–${bill.votes.house.nay}`, icon: 'vote' };
          } else if (bill.last) {
            const d = new Date(bill.last + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            statInfo = { label: 'Last Action', value: d, icon: 'calendar' };
          }

          const initials = sponsor
            ? sponsor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            : '?';
          const partyColor = sponsor?.party === 'Democrat' ? '#1e40af' : sponsor?.party === 'Republican' ? '#c41e3a' : '#7c3aed';
          const partyLetter = sponsor?.party === 'Democrat' ? 'D' : sponsor?.party === 'Republican' ? 'R' : 'I';

          return (
            <div
              key={bill.id}
              onClick={() => onBillPress?.(bill.id)}
              className="group rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: '#ffffff',
                border: `1.5px solid #e8edf5`,
                boxShadow: '0 1px 3px rgba(15,29,58,0.04), 0 4px 16px rgba(15,29,58,0.05)',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col+'44';e.currentTarget.style.boxShadow=`0 8px 32px rgba(15,29,58,0.10), 0 0 0 1px ${col}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#e8edf5';e.currentTarget.style.boxShadow='0 1px 3px rgba(15,29,58,0.04), 0 4px 16px rgba(15,29,58,0.05)';}}
            >
              {/* Card header — colored strip */}
              <div
                className="px-5 pt-4 pb-3 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${col}12 0%, ${col}06 100%)` }}
              >
                {/* Decorative orb */}
                <div
                  className="absolute -right-4 -top-4 w-20 h-20 rounded-full"
                  style={{ background: col + '10', filter: 'blur(12px)' }}
                />

                {/* Status + bill number row */}
                <div className="relative flex items-center justify-between mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-medium shadow-sm"
                    style={{ background: col, fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                  >
                    {isLive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-white inline-block"
                        style={{ animation: 'liveDot 1.6s ease-in-out infinite' }}
                      />
                    )}
                    {statusLabel}
                  </span>
                  <span
                    className="font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: col + 'cc' }}
                  >
                    {bill.num}
                  </span>
                </div>

                {/* Title */}
                <h4
                  className="font-semibold text-[#0f1d3a] leading-snug group-hover:text-[#1e40af] transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, letterSpacing: '-0.2px' }}
                >
                  {bill.title}
                </h4>
                {bill.cat && (
                  <p
                    className="mt-1 font-light"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: col + '99' }}
                  >
                    {bill.cat}
                  </p>
                )}
                <style>{`@keyframes liveDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.4)}}`}</style>
              </div>

              {/* Card body */}
              <div className="px-5 pb-4">
                {/* Stats row */}
                {statInfo && (
                  <div className="flex gap-3 mt-3 mb-3">
                    <div
                      className="flex-1 rounded-2xl px-3 py-2"
                      style={{ background: '#f8fafc' }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {statInfo.icon === 'vote' ? (
                          <TrendingUp size={11} style={{ color: '#15803d' }} strokeWidth={1.5} />
                        ) : (
                          <Calendar size={11} style={{ color: '#b45309' }} strokeWidth={1.5} />
                        )}
                        <span
                          className="font-light"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8492a6' }}
                        >
                          {statInfo.label}
                        </span>
                      </div>
                      <div
                        className="font-semibold text-[#0f1d3a]"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
                      >
                        {statInfo.value}
                      </div>
                    </div>
                    <div
                      className="flex-1 rounded-2xl px-3 py-2"
                      style={{ background: '#f8fafc' }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Users size={11} style={{ color: '#1e40af' }} strokeWidth={1.5} />
                        <span
                          className="font-light"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8492a6' }}
                        >
                          Co-sponsors
                        </span>
                      </div>
                      <div
                        className="font-semibold text-[#0f1d3a]"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
                      >
                        {bill.coIds?.length || 0}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vote bar */}
                {bill.votes?.house && (() => {
                  const { yea, nay } = bill.votes.house;
                  const pct = Math.round((yea / (yea + nay)) * 100);
                  return (
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#15803d', fontWeight: 700 }}>YEA {yea}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#c41e3a', fontWeight: 700 }}>NAY {nay}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#fee2e2' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, #15803d, #16a34a)',
                            '--fill-w': pct + '%',
                            width: 'var(--fill-w)',
                            animation: 'billPipeFill 0.9s ease forwards',
                            animationDelay: '0.2s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Pipeline */}
                <MiniPipeline status={bill.status} />

                {/* Sponsor row */}
                {sponsor && (
                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: '1px solid #f1f5f9' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
                        style={{ background: col, fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div
                          className="font-normal text-[#0f1d3a]"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11 }}
                        >
                          {sponsor.name}
                        </div>
                        <div
                          className="font-light"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#8492a6' }}
                        >
                          Primary Sponsor
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ background: partyColor, fontFamily: "'DM Sans', sans-serif", fontSize: 10 }}
                      >
                        {partyLetter}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full font-light"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 10,
                          color: '#5f7287',
                          background: '#f1f5f9',
                        }}
                      >
                        {sponsor.state}{sponsor.dist ? `-${sponsor.dist}` : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
