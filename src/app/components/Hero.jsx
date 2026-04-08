import { Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

const STAGE_ORDER = ['introduced','in_committee','on_the_floor','passed_house','passed_senate','signed_into_law'];
const STAGE_IDX_MAP = {introduced:0,in_committee:1,on_the_floor:2,passed_house:3,passed_senate:4,passed:4,signed_into_law:5,failed:-1,vetoed:4};

function HeroStageBar({ status, statusColor }) {
  const idx = STAGE_IDX_MAP[status] ?? 0;
  const failed = status === 'failed';
  return (
    <div className="flex items-center gap-0.5 mt-3">
      {STAGE_ORDER.map((s, i) => {
        const done = !failed && i <= idx;
        const cur = !failed && i === idx;
        return (
          <div key={s} className={`h-1 rounded-full transition-all ${i < STAGE_ORDER.length - 1 ? 'flex-1' : 'w-2'}`}
            style={{
              background: done ? (cur ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)') : 'rgba(255,255,255,0.15)',
              boxShadow: cur ? '0 0 6px rgba(255,255,255,0.6)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

const CAPITOL_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/US_Capitol_west_side.JPG/1280px-US_Capitol_west_side.JPG';

const STATUS_COLORS = {
  signed_into_law: '#2d6a4f',
  passed_house: '#1e40af',
  passed_senate: '#1e40af',
  on_the_floor: '#1e40af',
  in_committee: '#d97706',
  introduced: '#7c3aed',
  failed: '#8b2e2e',
  vetoed: '#8b2e2e',
};

const STATUS_LABELS = {
  signed_into_law: '✓ Signed into Law',
  passed_house: 'Passed House',
  passed_senate: 'Passed Senate',
  on_the_floor: 'On the Floor',
  in_committee: 'In Committee',
  introduced: 'Introduced',
  failed: 'Failed',
  vetoed: 'Vetoed',
};

export function Hero({ bill, sponsor, isWatched, onToggleWatch, onPress }) {
  if (!bill) return null;

  const statusColor = STATUS_COLORS[bill.status] || '#2d6a4f';
  const statusLabel = STATUS_LABELS[bill.status] || bill.status;
  const lastDate = bill.last
    ? new Date(bill.last + 'T12:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const initials = sponsor
    ? sponsor.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  return (
    <div
      className="relative h-[400px] rounded-3xl overflow-hidden mb-10 shadow-lg group cursor-pointer"
      onClick={onPress}
    >
      {/* Background image */}
      <img
        src={CAPITOL_IMG}
        alt="U.S. Capitol"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        {/* Stage pipeline */}
        <HeroStageBar status={bill.status} statusColor={statusColor} />

        {/* Status + date row */}
        <div className="flex items-center gap-3 mt-4 mb-4">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-sm font-normal shadow-lg"
            style={{ backgroundColor: statusColor }}
          >
            {['on_the_floor','in_committee'].includes(bill.status) && (
              <span className="w-2 h-2 rounded-full bg-white inline-block" style={{ animation: 'heroPulse 1.6s ease-in-out infinite' }} />
            )}
            {statusLabel}
          </span>
          {lastDate && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-sm font-light">
              {lastDate}
            </span>
          )}
        </div>
        <style>{`@keyframes heroPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.3)}}`}</style>

        {/* Title */}
        <h2 className="text-4xl font-light text-white mb-3 max-w-3xl leading-tight tracking-tight">
          {bill.title}
        </h2>

        {/* Summary — 2 lines */}
        <p className="text-sm text-white/75 mb-5 max-w-2xl font-light leading-relaxed line-clamp-2">
          {bill.sum}
        </p>

        {/* Bottom row: sponsor + controls */}
        <div className="flex items-center justify-between">
          {sponsor ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {initials}
              </div>
              <div>
                <div className="text-white font-normal text-sm">
                  {sponsor.pre} {sponsor.name}
                </div>
                <div className="text-white/60 text-xs font-light">
                  {sponsor.chamber} · {sponsor.state}
                  {sponsor.dist ? `-${sponsor.dist}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5">
              <span className="text-white font-light text-sm">{bill.num}</span>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleWatch?.();
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isWatched
                  ? 'bg-[#1e40af]'
                  : 'bg-white/20 backdrop-blur-md hover:bg-white/30'
              }`}
            >
              <Bookmark
                size={17}
                className="text-white"
                fill={isWatched ? 'white' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
