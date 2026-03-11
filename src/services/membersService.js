// Fetches all current US Congress members from the unitedstates project
// https://github.com/unitedstates/congress-legislators

const LEGISLATORS_URL =
  'https://theunitedstates.io/congress-legislators/legislators-current.json';

const CACHE_KEY = 'civly-all-members-v3';
const CACHE_TIME_KEY = 'civly-members-cache-ts';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function mapParty(raw) {
  if (!raw) return 'Independent';
  const p = raw.toLowerCase();
  if (p === 'democrat') return 'Democrat';
  if (p === 'republican') return 'Republican';
  return 'Independent';
}

function calcYears(terms) {
  return Math.round(
    terms.reduce((acc, t) => {
      const start = new Date(t.start);
      const end = t.end ? new Date(t.end) : new Date();
      return acc + (end - start) / (1000 * 60 * 60 * 24 * 365.25);
    }, 0)
  );
}

function transformLegislator(m, index) {
  const latestTerm = m.terms[m.terms.length - 1];
  const isSenator = latestTerm.type === 'sen';
  const bioguide = m.id.bioguide;

  const firstName = m.name.first || '';
  const lastName = m.name.last || '';
  const fullName = m.name.official_full || `${firstName} ${lastName}`.trim();

  return {
    id: `ext_${bioguide}`,
    name: fullName,
    pre: isSenator ? 'Sen.' : 'Rep.',
    party: mapParty(latestTerm.party),
    state: latestTerm.state,
    chamber: isSenator ? 'Senate' : 'House',
    dist: latestTerm.district != null ? String(latestTerm.district) : undefined,
    phone: latestTerm.phone || '',
    yrs: calcYears(m.terms),
    bio: bioguide,
    pos: {},
  };
}

export async function fetchAllMembers() {
  // Return cached data if fresh
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TIME_KEY);
    if (cached && ts && Date.now() - parseInt(ts, 10) < CACHE_TTL) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  const res = await fetch(LEGISLATORS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const members = data.map(transformLegislator);

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(members));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (_) {}

  return members;
}

export async function lookupByZip(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!res.ok) throw new Error('ZIP not found');
  const data = await res.json();
  return {
    state: data.places[0]['state abbreviation'],
    city: data.places[0]['place name'],
  };
}
