const API_BASE = 'https://api.congress.gov/v3';
const API_KEY = process.env.REACT_APP_CONGRESS_API_KEY;
const KALSHI_API_KEY = process.env.REACT_APP_KALSHI_API_KEY;

const STATE_TO_ABBREV = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
  'North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
  'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN',
  'Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY','District of Columbia':'DC',
  'Puerto Rico':'PR','Guam':'GU','Virgin Islands':'VI','American Samoa':'AS',
  'Northern Mariana Islands':'MP',
};

const BILL_TYPE_DISPLAY = {
  'HR':'H.R.','S':'S.','HJRES':'H.J.Res.','SJRES':'S.J.Res.',
  'HCONRES':'H.Con.Res.','SCONRES':'S.Con.Res.','HRES':'H.Res.','SRES':'S.Res.',
};

// Strip the verbose official-title preamble and "for other purposes" suffix
function cleanTitle(raw) {
  if (!raw) return raw;
  let t = raw.trim();
  // Remove trailing boilerplate
  t = t.replace(/[,;]?\s+and for other purposes\.?$/i, '').trim();
  t = t.replace(/[,;]?\s+for other purposes\.?$/i, '').trim();
  // If the title still starts with "To [verb]..." it's the official long title.
  // Truncate at the first semicolon (each clause separated by "; to ...").
  const semiIdx = t.indexOf(';');
  if (semiIdx > 20) t = t.slice(0, semiIdx).trim();
  return t;
}

function inferBillStatus(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('became public law') || t.includes('signed by president')) return 'signed_into_law';
  if (t.includes('vetoed')) return 'failed';
  if (t.includes('passed/agreed to in senate') || t.includes('passed senate')) return 'passed_senate';
  if (t.includes('passed/agreed to in house') || t.includes('passed house')) return 'passed_house';
  // "Received in the Senate/House" means it already cleared the other chamber
  if (t.includes('received in the senate')) return 'passed_house';
  if (t.includes('received in the house')) return 'passed_senate';
  if (t.includes('ordered to be reported') || t.includes('placed on the')) return 'on_the_floor';
  if (t.includes('referred to') || t.includes('committee')) return 'in_committee';
  return 'introduced';
}

function formatMemberName(apiName) {
  // API returns "Last, First Middle" — convert to "First Middle Last"
  if (!apiName || typeof apiName !== 'string') return '';
  const trimmed = apiName.trim();
  if (!trimmed) return '';
  const idx = trimmed.indexOf(', ');
  if (idx === -1) return trimmed;
  return `${trimmed.slice(idx + 2)} ${trimmed.slice(0, idx)}`;
}

// Resolve display name from a member API object, trying multiple fields
function resolveMemberName(member) {
  // 1. Standard bulk-list field: "Last, First Middle"
  const fromName = formatMemberName(member.name);
  if (fromName) return fromName;
  // 2. Individual endpoint: directOrderName is already "First Last"
  if (member.directOrderName) return member.directOrderName.trim();
  // 3. Separate firstName / lastName fields
  const parts = [member.firstName, member.middleName, member.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  // 4. invertedOrderName fallback (same format as name)
  return formatMemberName(member.invertedOrderName) || '';
}

const PARTY_NORMALIZE = {
  'Democratic': 'Democrat',
  'Democrat': 'Democrat',
  'Republican': 'Republican',
  'Independent': 'Independent',
};
const PARTY_LETTER = { 'D': 'Democrat', 'R': 'Republican', 'I': 'Independent' };

function getMemberChamber(member) {
  const items = member.terms?.item;
  if (items) {
    const arr = Array.isArray(items) ? items : [items];
    // last item = most recent term
    const last = arr[arr.length - 1];
    if (last?.chamber === 'Senate') return 'Senate';
  }
  return 'House';
}

function getMemberYears(member) {
  const items = member.terms?.item;
  if (!items) return 0;
  const arr = Array.isArray(items) ? items : [items];
  const earliest = arr.reduce((min, t) => {
    const y = parseInt(t.startYear) || 9999;
    return y < min ? y : min;
  }, 9999);
  return earliest === 9999 ? 0 : new Date().getFullYear() - earliest;
}

export async function fetchBillsFromAPI(sinceDateTime = null) {
  try {
    const hasTitle = t => t && t.trim() !== '' && t.toLowerCase() !== 'untitled' && t.toLowerCase() !== 'undefined';

    let responses;
    if (sinceDateTime) {
      // INCREMENTAL: only bills updated or introduced since last successful fetch
      responses = await Promise.all([
        fetch(`${API_BASE}/bill/119?limit=250&sort=updateDate+desc&fromDateTime=${sinceDateTime}&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/bill/119?limit=250&sort=introducedDate+desc&fromDateTime=${sinceDateTime}&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
    } else {
      // FULL: 4-way fetch for initial load (wide coverage)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const fromDT = cutoff.toISOString().replace(/\.\d{3}Z$/, 'Z');
      responses = await Promise.all([
        fetch(`${API_BASE}/bill/119?limit=250&sort=updateDate+desc&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/bill/119?limit=250&sort=updateDate+desc&offset=250&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/bill/119?limit=250&sort=updateDate+desc&fromDateTime=${fromDT}&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_BASE}/bill/119?limit=250&sort=introducedDate+desc&api_key=${API_KEY}`)
          .then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
    }

    const mapBill = bill => {
      const sp0 = (bill.sponsors || [])[0] || null;
      // firstName+lastName may be absent in the list endpoint — fall back to parsing fullName
      const spFirstLast = sp0 ? [sp0.firstName, sp0.lastName].filter(Boolean).join(' ').trim() : null;
      const spFromFull = sp0?.fullName
        ? sp0.fullName.replace(/^(Rep\.|Sen\.)\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
        : null;
      const spState = sp0?.state || sp0?.fullName?.match(/\((?:[A-Z]-)?([A-Z]{2})\)/)?.[1] || null;
      const spPartyCode = sp0?.party || sp0?.fullName?.match(/\(([RDI])-/)?.[1] || null;
      return {
        id: `${(bill.type || '').toLowerCase()}${bill.number}`,
        num: `${BILL_TYPE_DISPLAY[bill.type] || bill.type || ''} ${bill.number}`,
        type: (bill.type || '').toLowerCase(),
        number: bill.number,
        title: cleanTitle(bill.title.trim()),
        sum: bill.latestAction?.text || '',
        status: inferBillStatus(bill.latestAction?.text),
        intro: bill.introducedDate || null,
        last: bill.latestAction?.actionDate,
        spId: sp0?.bioguideId || null,
        spName: spFirstLast || spFromFull || null,
        spParty: spPartyCode ? (PARTY_LETTER[spPartyCode] || PARTY_NORMALIZE[spPartyCode] || spPartyCode) : null,
        spState,
        spPre: sp0?.fullName ? (sp0.fullName.startsWith('Sen.') ? 'Sen.' : 'Rep.') : null,
        coIds: [],
      };
    };

    // Merge all result sets, deduplicating by bill ID
    const seen = new Set();
    const merged = [];
    for (const res of responses) {
      for (const b of (res?.bills || [])) {
        if (!hasTitle(b.title)) continue;
        const id = `${(b.type || '').toLowerCase()}${b.number}`;
        if (!seen.has(id)) { seen.add(id); merged.push(b); }
      }
    }

    return merged.map(mapBill);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return [];
  }
}

export async function fetchMembersFromAPI() {
  try {
    const response = await fetch(
      `${API_BASE}/member?currentMember=true&limit=600&api_key=${API_KEY}`
    );
    if (!response.ok) throw new Error(`Members API error: ${response.status}`);
    const data = await response.json();

    return (data.members || []).map(member => {
      const chamber = getMemberChamber(member);
      return {
        id: member.bioguideId,
        bio: member.bioguideId,
        name: resolveMemberName(member),
        party: PARTY_NORMALIZE[member.partyName] || member.partyName || 'Independent',
        state: STATE_TO_ABBREV[member.state] || member.state || '',
        chamber,
        pre: chamber === 'Senate' ? 'Sen.' : 'Rep.',
        dist: member.district ?? null,
        yrs: getMemberYears(member),
        phone: '',
      };
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
}

export async function fetchMemberById(bioguideId) {
  try {
    const res = await fetch(`${API_BASE}/member/${bioguideId}?api_key=${API_KEY}`)
      .then(r => r.ok ? r.json() : null).catch(() => null);
    const member = res?.member;
    if (!member) return null;
    const chamber = getMemberChamber(member);
    return {
      id: member.bioguideId,
      bio: member.bioguideId,
      name: resolveMemberName(member),
      party: PARTY_NORMALIZE[member.partyName] || member.partyName || 'Independent',
      state: STATE_TO_ABBREV[member.state] || member.state || '',
      chamber,
      pre: chamber === 'Senate' ? 'Sen.' : 'Rep.',
      dist: member.district ?? null,
      yrs: getMemberYears(member),
      phone: '',
    };
  } catch (error) {
    console.error('Error fetching member by id:', error);
    return null;
  }
}

// Parse a bill ID like "hr123", "s456", "hjres789" into { type, number }
export function parseBillId(billId) {
  if (!billId) return null;
  const id = billId.toLowerCase();
  // Match longest known prefix first to avoid "s" matching "sres" etc.
  const prefixes = ['hconres','sconres','hjres','sjres','hres','sres','hr','s'];
  for (const pre of prefixes) {
    if (id.startsWith(pre)) {
      const num = id.slice(pre.length);
      if (/^\d+$/.test(num)) return { type: pre, number: parseInt(num, 10) };
    }
  }
  return null;
}

// Fetch a single bill's basic info (for bills not in the local bills array)
export async function fetchBillBasic(type, number) {
  try {
    const typeUpper = type.toUpperCase();
    const res = await fetch(
      `${API_BASE}/bill/119/${typeUpper}/${number}?api_key=${API_KEY}`
    ).then(r => r.ok ? r.json() : null).catch(() => null);
    const bill = res?.bill;
    if (!bill) return null;
    const sp0 = (bill.sponsors || [])[0] || null;
    const spFirstLast2 = sp0 ? [sp0.firstName, sp0.lastName].filter(Boolean).join(' ').trim() : null;
    const spFromFull2 = sp0?.fullName
      ? sp0.fullName.replace(/^(Rep\.|Sen\.)\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
      : null;
    const spState2 = sp0?.state || sp0?.fullName?.match(/\((?:[A-Z]-)?([A-Z]{2})\)/)?.[1] || null;
    const spPartyCode2 = sp0?.party || sp0?.fullName?.match(/\(([RDI])-/)?.[1] || null;
    return {
      id: `${type.toLowerCase()}${number}`,
      num: `${BILL_TYPE_DISPLAY[typeUpper] || typeUpper} ${number}`,
      type: type.toLowerCase(),
      number,
      title: cleanTitle((bill.title || '').trim()),
      sum: bill.latestAction?.text || '',
      status: inferBillStatus(bill.latestAction?.text),
      intro: bill.introducedDate || null,
      last: bill.latestAction?.actionDate,
      spId: sp0?.bioguideId || null,
      spName: spFirstLast2 || spFromFull2 || null,
      spParty: spPartyCode2 ? (PARTY_LETTER[spPartyCode2] || PARTY_NORMALIZE[spPartyCode2] || spPartyCode2) : null,
      spState: spState2,
      spPre: sp0?.fullName ? (sp0.fullName.startsWith('Sen.') ? 'Sen.' : 'Rep.') : null,
      coIds: [],
    };
  } catch (error) {
    console.error('Error fetching bill basic:', error);
    return null;
  }
}

export async function fetchBillDetail(type, number) {
  try {
    const typeUpper = type.toUpperCase();
    const base = `${API_BASE}/bill/119/${typeUpper}/${number}`;
    const [detRes, sumRes, actRes, cosRes, comRes, subRes] = await Promise.all([
      fetch(`${base}?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/summaries?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/actions?limit=250&api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/cosponsors?limit=250&api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/committees?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/subjects?api_key=${API_KEY}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const sponsor = detRes?.bill?.sponsors?.[0] || null;

    // Best available summary — prefer most advanced version code
    const summaries = sumRes?.summaries || [];
    const PREFERRED = ['36','17','07','55','00'];
    const bestSum = PREFERRED.map(v => summaries.find(s => s.versionCode === v)).find(Boolean)
      || summaries[summaries.length - 1] || null;
    const rawSummary = bestSum?.text || '';
    const summary = rawSummary.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    const policyArea = detRes?.bill?.policyArea?.name || subRes?.subjects?.policyArea?.name || null;
    const legislativeSubjects = (subRes?.subjects?.legislativeSubjects || []).map(s => s.name).slice(0, 8);
    const introducedDate = detRes?.bill?.introducedDate || null;
    const cboEstimates = detRes?.bill?.cboCostEstimates || [];
    const shortTitle = (detRes?.bill?.titles || [])
      .find(t => /short title/i.test(t.titleType || ''))?.title || null;

    // Committees — formal assignment from /committees endpoint
    const comList = comRes?.committees || [];
    const primaryCommittee = comList[0]?.name || null;
    const assignedCommittees = comList.map(c => ({
      name: c.name,
      chamber: c.chamber || null,
      subcommittees: (c.subcommittees || []).map(s => s.name),
    }));

    // Actions sorted chronologically
    const actions = [...(actRes?.actions || [])].sort((a, b) =>
      new Date(a.actionDate || 0) - new Date(b.actionDate || 0)
    );

    // Milestone-based timeline
    const MILESTONES = [
      { re: /introduced|presented/i, stage: 'introduced', label: 'Introduced' },
      { re: /referred to/i, stage: 'referred', label: 'Referred to Committee' },
      { re: /hearing/i, stage: 'hearing', label: 'Committee Hearing Held' },
      { re: /ordered to be reported|markup session/i, stage: 'markup', label: 'Committee Markup' },
      { re: /reported (favorably|by|to the)/i, stage: 'reported', label: 'Reported from Committee' },
      { re: /placed on.*calendar|rules committee/i, stage: 'calendar', label: 'Placed on Calendar' },
      { re: /passed\/agreed to in house|passed house|passed the house/i, stage: 'passed_house', label: 'Passed House' },
      { re: /passed\/agreed to in senate|passed senate|passed the senate/i, stage: 'passed_senate', label: 'Passed Senate' },
      { re: /presented to (the )?president|enrolled bill signed/i, stage: 'to_president', label: 'Sent to President' },
      { re: /signed by (the )?president|became public law/i, stage: 'signed_into_law', label: 'Signed into Law' },
      { re: /vetoed/i, stage: 'vetoed', label: 'Vetoed' },
    ];
    const seen = new Set();
    const timeline = [];
    for (const action of actions) {
      const text = action.text || '';
      for (const { re, stage, label } of MILESTONES) {
        if (!seen.has(stage) && re.test(text)) {
          seen.add(stage);
          // Annotate committee referral with actual committee name
          const desc = (stage === 'referred' && primaryCommittee)
            ? `Referred to ${primaryCommittee}`
            : label;
          timeline.push({ desc, d: action.actionDate, done: true, s: stage, detail: text });
          break;
        }
      }
    }

    const sponsorParty = sponsor?.party;
    const allCosponsors = (cosRes?.cosponsors || []).filter(c => !c.sponsorshipWithdrawnDate);
    const cosponsorsCount = allCosponsors.length;
    const crossPartyCosponsors = sponsorParty
      ? allCosponsors.filter(c => c.party && c.party !== sponsorParty)
      : [];

    // ── House vote: parse tally from action text, try member-level from Congress.gov then House Clerk XML ──
    let houseVote = null;
    let crossPartyVoters = [];
    let houseVoteMembers = [];
    // Broaden: find ANY action with a House recorded vote (not just "passed/agreed to")
    const passageAction = actions.find(a => a.recordedVotes?.some(rv => rv.chamber === 'House'));
    if (passageAction) {
      const m = (passageAction.text || '').match(/(\d+)\s*[-–]\s*(\d+)/);
      if (m) houseVote = { yea: parseInt(m[1]), nay: parseInt(m[2]) };
      const rv = passageAction.recordedVotes?.find(r => r.chamber === 'House');
      if (rv?.rollNumber) {
        const sessionNumber = rv.sessionNumber || 1;
        const voteRes = await fetch(
          `${API_BASE}/vote/119/house/${sessionNumber}/${rv.rollNumber}?api_key=${API_KEY}`
        ).then(r => r.ok ? r.json() : null).catch(() => null);
        if (voteRes?.vote) {
          const v = voteRes.vote;
          if (v.totalYea != null) houseVote = { yea: v.totalYea, nay: v.totalNay || 0, notVoting: v.totalNotVoting || 0 };
        }
        // Member-level votes — API returns members as {member:[...]} or a plain array
        const rawM = voteRes?.vote?.members;
        let voteMembers = Array.isArray(rawM) ? rawM
          : Array.isArray(rawM?.member) ? rawM.member
          : [];

        // ── Fallback: parse House Clerk XML if API didn't give member-level data ──
        if (voteMembers.length === 0 && rv?.url) {
          try {
            const xmlText = await fetch(rv.url).then(r => r.ok ? r.text() : null).catch(() => null);
            if (xmlText) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(xmlText, 'text/xml');
              // Extract totals if not yet set
              if (!houseVote) {
                const y = parseInt(doc.querySelector('yea-total')?.textContent || '0');
                const n = parseInt(doc.querySelector('nay-total')?.textContent || '0');
                const nv = parseInt(doc.querySelector('not-voting-total')?.textContent || '0');
                if (y > 0) houseVote = { yea: y, nay: n, notVoting: nv };
              }
              // Extract member votes
              const recVotes = doc.querySelectorAll('recorded-vote');
              if (recVotes.length > 0) {
                voteMembers = Array.from(recVotes).map(rec => {
                  const leg = rec.querySelector('legislator');
                  const partyCode = leg?.getAttribute('party') || '';
                  return {
                    bioguideId: leg?.getAttribute('name-id') || '',
                    name: leg?.textContent?.trim() || '',
                    party: partyCode === 'D' ? 'Democrat' : partyCode === 'R' ? 'Republican' : partyCode,
                    state: leg?.getAttribute('state') || '',
                    vote: rec.querySelector('vote')?.textContent?.trim() || '',
                    // normalize to match existing field conventions
                    votePosition: rec.querySelector('vote')?.textContent?.trim() || '',
                  };
                });
              }
            }
          } catch (e) { /* XML parse failed, leave voteMembers empty */ }
        }

        const crossLetter = sponsorParty === 'D' ? 'R' : sponsorParty === 'R' ? 'D' : null;
        if (crossLetter && voteMembers.length > 0) {
          crossPartyVoters = voteMembers
            .filter(m => {
              const p = m.party === 'Democrat' ? 'D' : m.party === 'Republican' ? 'R' : m.party;
              const v = m.votePosition || m.vote || '';
              return p === crossLetter && /^yea$/i.test(v);
            })
            .slice(0, 8)
            .map(m => ({
              bioguideId: m.bioguideId || m.bioguide || '',
              name: m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
              party: crossLetter === 'D' ? 'Democrat' : 'Republican',
              state: m.state || '',
            }));
        }
        if (voteMembers.length > 0) {
          houseVoteMembers = voteMembers.map(m => ({
            bioguideId: m.bioguideId || m.bioguide || '',
            name: m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
            party: m.party === 'D' ? 'Democrat' : m.party === 'R' ? 'Republican' : m.party || '',
            state: m.state || '',
            vote: m.votePosition || m.vote || '',
          }));
        }
      }
    }

    // ── Committee actions ──
    const committeeActions = actions
      .filter(a => {
        const t = (a.text || '').toLowerCase();
        const code = a.actionCode || '';
        return (
          a.type === 'Committee' ||
          code.startsWith('H18') || code.startsWith('S18') ||
          t.includes('committee') ||
          t.includes('ordered to be reported') ||
          t.includes('markup') ||
          t.includes('hearing')
        );
      })
      .map(a => {
        const t = a.text || '';
        // Try to parse a vote tally from text like "by a vote of 28-10" or "27 to 13"
        const tallyM = t.match(/(\d+)\s*[-–to]+\s*(\d+)/);
        return {
          date: a.actionDate || '',
          text: t,
          yea: tallyM ? parseInt(tallyM[1]) : null,
          nay: tallyM ? parseInt(tallyM[2]) : null,
        };
      })
      .slice(0, 10);

    return { sponsor, summary, policyArea, legislativeSubjects, introducedDate, timeline, cboEstimates, shortTitle, crossPartyCosponsors, cosponsorsCount, houseVote, crossPartyVoters, houseVoteMembers, committeeActions, primaryCommittee, assignedCommittees };
  } catch (error) {
    console.error('Error fetching bill detail:', error);
    return null;
  }
}

export async function fetchMemberBills(bioguideId) {
  try {
    const [sponsoredRes, cosponsoredRes] = await Promise.all([
      fetch(`${API_BASE}/member/${bioguideId}/sponsored-legislation?limit=20&api_key=${API_KEY}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/member/${bioguideId}/cosponsored-legislation?limit=10&api_key=${API_KEY}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const mapLeg = (leg, role) => ({
      id: `${(leg.type || '').toLowerCase()}${leg.number}`,
      num: `${BILL_TYPE_DISPLAY[leg.type] || leg.type || ''} ${leg.number}`,
      type: (leg.type || '').toLowerCase(),
      number: leg.number,
      title: cleanTitle((leg.title || '').trim()),
      sum: leg.latestAction?.text || '',
      status: inferBillStatus(leg.latestAction?.text),
      intro: leg.introducedDate || null,
      last: leg.latestAction?.actionDate,
      role,
      spId: role === 'sponsor' ? bioguideId : null,
      coIds: role === 'cosponsor' ? [bioguideId] : [],
    });
    const validTitle = b => b.title && b.title.trim() !== '' && b.title.toLowerCase() !== 'untitled' && b.title.toLowerCase() !== 'undefined';
    const sponsored = (sponsoredRes?.sponsoredLegislation || [])
      .filter(l => l.congress === 119)
      .map(l => mapLeg(l, 'sponsor'))
      .filter(validTitle);
    const cosponsored = (cosponsoredRes?.cosponsoredLegislation || [])
      .filter(l => l.congress === 119)
      .map(l => mapLeg(l, 'cosponsor'))
      .filter(validTitle);
    const seen = new Set(sponsored.map(b => b.id));
    return [...sponsored, ...cosponsored.filter(b => !seen.has(b.id))];
  } catch (error) {
    console.error('Error fetching member bills:', error);
    return [];
  }
}

export async function fetchKalshiForBill(billTitle) {
  try {
    const STOP = new Set(['the','a','an','and','or','of','to','in','for','on','by','act','bill','resolution','amend','amends','provide','provides','establishes','establishing','require','requires','requiring','relating','authorize','authorizes','authorizing','direct','directs','directing','prohibit','prohibits','prohibiting','make','makes','making','this','that','with','from','such','their','which','have','been','other']);
    const kw = billTitle
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
      .slice(0, 4)
      .join(' ');
    if (!kw) return null;
    const headers = { 'Content-Type': 'application/json' };
    if (KALSHI_API_KEY) headers['Authorization'] = `Bearer ${KALSHI_API_KEY}`;
    const res = await fetch(
      `https://api.kalshi.com/trade-api/v2/markets?search=${encodeURIComponent(kw)}&status=open&limit=10`,
      { headers }
    );
    if (!res.ok) return null;
    const { markets = [] } = await res.json();
    const best = markets.find(m => {
      const t = (m.title || '').toLowerCase();
      return t.includes('pass') || t.includes('sign') || t.includes('become law') || t.includes('enact');
    }) || markets[0];
    if (!best) return null;
    const price = best.last_price ?? ((best.yes_bid ?? 0) + (best.yes_ask ?? 0)) / 2;
    const probability = Math.round(price);
    if (probability <= 0 || probability > 100) return null;
    return {
      ticker: best.ticker,
      title: best.title,
      probability,
      url: `https://kalshi.com/markets/${best.event_ticker || best.ticker}`,
    };
  } catch { return null; }
}

export async function fetchSCOTUSCasesFromAPI() {
  return [
    {id:'sc1',name:'Trump v. CASA',docket:'23-1346',status:'decided',decided:'2025-06-20',question:'Whether the executive branch can end birthright citizenship for children of undocumented immigrants born on U.S. soil.',result:'5-4: Upheld lower court injunction blocking the executive order. Birthright citizenship under the 14th Amendment applies regardless of parents\' immigration status.',majority:['Roberts','Sotomayor','Kagan','Jackson','Barrett'],dissent:['Thomas','Alito','Gorsuch','Kavanaugh'],topic:'Immigration',impact:'High'},
    {id:'sc2',name:'FDA v. Alliance for Hippocratic Medicine',docket:'23-235',status:'decided',decided:'2025-03-15',question:'Whether FDA exceeded its authority in approving expanded access to mifepristone.',result:'9-0: Dismissed for lack of standing.',majority:['Roberts','Thomas','Alito','Sotomayor','Kagan','Gorsuch','Kavanaugh','Barrett','Jackson'],dissent:[],topic:'Healthcare',impact:'High'},
  ];
}
