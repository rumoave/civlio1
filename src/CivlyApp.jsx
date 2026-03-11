import { useState, useCallback, useMemo, useEffect } from "react";
import { fetchAllMembers, lookupByZip } from "./services/membersService";
import { supabase } from "./services/supabase";
import AuthScreen from "./AuthScreen";
import { Home as HomeIcon, Search as SearchIcon, BarChart2, Bookmark, User, ChevronLeft, ChevronDown, ChevronUp, ChevronRight, X, Filter, Clock, Calendar, Check, Phone, Users, Gavel, Star, MapPin, TrendingUp, Lock, Flame, ArrowRight, Bell } from "lucide-react";

// localStorage shim
const storage={async get(k){const v=localStorage.getItem(k);return v?{key:k,value:v}:null},async set(k,v){localStorage.setItem(k,v);return{key:k,value:v}},async delete(k){localStorage.removeItem(k);return{key:k,deleted:true}}};

// ═══════════════════════════════════════════
// CIVLY — Online Newspaper for Congress
// Inspired by Blog/Newspaper UI Kit aesthetic
// ═══════════════════════════════════════════

const C = {
  bg: "#f8f9fa",
  bg2: "#f1f3f4",
  surface: "#ffffff",
  navy: "#1a73e8",
  navyLight: "#1557b0",
  text: "#202124",
  text2: "#5f6368",
  textM: "#80868b",
  textW: "#ffffff",
  accent: "#ea4335",
  accent2: "#1a73e8",
  border: "#dadce0",
  input: "#f1f3f4",
  success: "#34a853",
  error: "#ea4335",
  card: "#ffffff",
};
const PC = { democrat: "#2563EB", republican: "#E84855", independent: "#8B5CF6" };
const SC = { introduced: "#9CA3AF", in_committee: "#D97706", on_the_floor: "#2563EB", passed_house: "#2563EB", passed_senate: "#2563EB", passed: "#059669", signed_into_law: "#059669", failed: "#E84855", vetoed: "#E84855" };
const SL = { introduced: "Introduced", in_committee: "In Committee", on_the_floor: "On the Floor", passed_house: "Passed House", passed_senate: "Passed Senate", passed: "Passed Both", signed_into_law: "Signed into Law", failed: "Failed", vetoed: "Vetoed" };
const pc = p => PC[(p || "").toLowerCase()] || "#9CA3AF";
const pA = p => p === "Democrat" ? "D" : p === "Republican" ? "R" : p === "Independent" ? "I" : "O";
const fD = d => { if (!d) return ""; return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
const fS = d => { if (!d) return ""; return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
const imgUrl = id => "https://bioguide.congress.gov/photo/" + id + ".jpg";
const F = {
  display: "'Inter', 'Google Sans', system-ui, -apple-system, sans-serif",
  body: "'Inter', 'Google Sans', system-ui, -apple-system, sans-serif",
  mono: "'Roboto Mono', 'Fira Code', monospace",
};
const HERO_IMG="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/US_Capitol_west_side.JPG/1280px-US_Capitol_west_side.JPG";


const staticMembers=[
{id:"m1",name:"Chuck Schumer",pre:"Sen.",party:"Democrat",state:"NY",chamber:"Senate",phone:"(202) 224-6542",yrs:26,bio:"S000148",pos:{Healthcare:88,Environment:82,Economy:62,Defense:55,Education:85,Technology:78,Immigration:65}},
{id:"m2",name:"Mitch McConnell",pre:"Sen.",party:"Republican",state:"KY",chamber:"Senate",phone:"(202) 224-2541",yrs:40,bio:"M000355",pos:{Healthcare:18,Environment:12,Economy:92,Defense:95,Education:22,Technology:45,Immigration:88}},
{id:"m3",name:"Bernie Sanders",pre:"Sen.",party:"Independent",state:"VT",chamber:"Senate",phone:"(202) 224-5141",yrs:18,bio:"S000033",pos:{Healthcare:95,Environment:92,Economy:45,Defense:20,Education:95,Technology:72,Immigration:55}},
{id:"m4",name:"John Fetterman",pre:"Sen.",party:"Democrat",state:"PA",chamber:"Senate",phone:"(202) 224-4254",yrs:2,bio:"F000479",pos:{Healthcare:82,Environment:75,Economy:58,Defense:50,Education:80,Technology:68,Immigration:70}},
{id:"m5",name:"Ted Cruz",pre:"Sen.",party:"Republican",state:"TX",chamber:"Senate",phone:"(202) 224-5922",yrs:12,bio:"C001098",pos:{Healthcare:15,Environment:8,Economy:90,Defense:92,Education:20,Technology:55,Immigration:95}},
{id:"m6",name:"Elizabeth Warren",pre:"Sen.",party:"Democrat",state:"MA",chamber:"Senate",phone:"(202) 224-4543",yrs:12,bio:"W000817",pos:{Healthcare:92,Environment:88,Economy:42,Defense:35,Education:95,Technology:82,Immigration:60}},
{id:"m7",name:"Marco Rubio",pre:"Sen.",party:"Republican",state:"FL",chamber:"Senate",phone:"(202) 224-3041",yrs:14,bio:"R000595",pos:{Healthcare:22,Environment:15,Economy:85,Defense:94,Education:30,Technology:62,Immigration:80}},
{id:"m8",name:"John Thune",pre:"Sen.",party:"Republican",state:"SD",chamber:"Senate",phone:"(202) 224-2321",yrs:20,bio:"T000250",pos:{Healthcare:20,Environment:14,Economy:88,Defense:90,Education:28,Technology:52,Immigration:85}},
{id:"m9",name:"Amy Klobuchar",pre:"Sen.",party:"Democrat",state:"MN",chamber:"Senate",phone:"(202) 224-3244",yrs:18,bio:"K000367",pos:{Healthcare:85,Environment:80,Economy:65,Defense:58,Education:82,Technology:90,Immigration:62}},
{id:"m10",name:"Tim Scott",pre:"Sen.",party:"Republican",state:"SC",chamber:"Senate",phone:"(202) 224-6121",yrs:12,bio:"S001184",pos:{Healthcare:25,Environment:18,Economy:88,Defense:90,Education:45,Technology:65,Immigration:82}},
{id:"m11",name:"Katie Britt",pre:"Sen.",party:"Republican",state:"AL",chamber:"Senate",phone:"(202) 224-5744",yrs:2,bio:"B001319",pos:{Healthcare:30,Environment:15,Economy:85,Defense:88,Education:35,Technology:55,Immigration:92}},
{id:"m12",name:"Lisa Murkowski",pre:"Sen.",party:"Republican",state:"AK",chamber:"Senate",phone:"(202) 224-6665",yrs:22,bio:"M001153",pos:{Healthcare:45,Environment:42,Economy:75,Defense:82,Education:50,Technology:58,Immigration:55}},
{id:"m13",name:"Jon Ossoff",pre:"Sen.",party:"Democrat",state:"GA",chamber:"Senate",phone:"(202) 224-3521",yrs:4,bio:"O000174",pos:{Healthcare:85,Environment:78,Economy:60,Defense:52,Education:80,Technology:88,Immigration:62}},
{id:"m14",name:"Susan Collins",pre:"Sen.",party:"Republican",state:"ME",chamber:"Senate",phone:"(202) 224-2523",yrs:28,bio:"C001035",pos:{Healthcare:48,Environment:45,Economy:78,Defense:85,Education:52,Technology:62,Immigration:52}},
{id:"m15",name:"Mike Johnson",pre:"Rep.",party:"Republican",state:"LA",dist:"4",chamber:"House",phone:"(202) 225-2777",yrs:8,bio:"J000299",pos:{Healthcare:15,Environment:10,Economy:88,Defense:92,Education:18,Technology:48,Immigration:90}},
{id:"m16",name:"Hakeem Jeffries",pre:"Rep.",party:"Democrat",state:"NY",dist:"8",chamber:"House",phone:"(202) 225-5936",yrs:12,bio:"J000294",pos:{Healthcare:90,Environment:85,Economy:58,Defense:50,Education:88,Technology:82,Immigration:62}},
{id:"m17",name:"Alexandria Ocasio-Cortez",pre:"Rep.",party:"Democrat",state:"NY",dist:"14",chamber:"House",phone:"(202) 225-3965",yrs:6,bio:"O000172",pos:{Healthcare:95,Environment:98,Economy:35,Defense:18,Education:95,Technology:85,Immigration:45}},
{id:"m18",name:"Chip Roy",pre:"Rep.",party:"Republican",state:"TX",dist:"21",chamber:"House",phone:"(202) 225-4236",yrs:6,bio:"R000614",pos:{Healthcare:12,Environment:8,Economy:88,Defense:90,Education:15,Technology:42,Immigration:95}},
{id:"m19",name:"Tom Cole",pre:"Rep.",party:"Republican",state:"OK",dist:"4",chamber:"House",phone:"(202) 225-6165",yrs:22,bio:"C001053",pos:{Healthcare:22,Environment:12,Economy:85,Defense:90,Education:28,Technology:50,Immigration:82}},
{id:"m20",name:"Nancy Pelosi",pre:"Rep.",party:"Democrat",state:"CA",dist:"11",chamber:"House",phone:"(202) 225-4965",yrs:38,bio:"P000197",pos:{Healthcare:92,Environment:88,Economy:55,Defense:60,Education:90,Technology:80,Immigration:58}},
{id:"m21",name:"Mike Collins",pre:"Rep.",party:"Republican",state:"GA",dist:"10",chamber:"House",phone:"(202) 225-4101",yrs:2,bio:"C001133",pos:{Healthcare:15,Environment:8,Economy:85,Defense:88,Education:18,Technology:42,Immigration:95}},
{id:"m22",name:"Ro Khanna",pre:"Rep.",party:"Democrat",state:"CA",dist:"17",chamber:"House",phone:"(202) 225-2631",yrs:8,bio:"K000389",pos:{Healthcare:88,Environment:90,Economy:52,Defense:32,Education:85,Technology:95,Immigration:55}},
{id:"m23",name:"Jodey Arrington",pre:"Rep.",party:"Republican",state:"TX",dist:"19",chamber:"House",phone:"(202) 225-4005",yrs:8,bio:"A000375",pos:{Healthcare:18,Environment:10,Economy:90,Defense:88,Education:22,Technology:48,Immigration:90}},
{id:"m24",name:"John James",pre:"Rep.",party:"Republican",state:"MI",dist:"10",chamber:"House",phone:"(202) 225-6276",yrs:2,bio:"J000302",pos:{Healthcare:28,Environment:22,Economy:82,Defense:92,Education:32,Technology:65,Immigration:80}},
{id:"m25",name:"Dan Crenshaw",pre:"Rep.",party:"Republican",state:"TX",dist:"2",chamber:"House",phone:"(202) 225-6565",yrs:6,bio:"C001120",pos:{Healthcare:20,Environment:12,Economy:85,Defense:96,Education:25,Technology:62,Immigration:88}},
{id:"m26",name:"Pramila Jayapal",pre:"Rep.",party:"Democrat",state:"WA",dist:"7",chamber:"House",phone:"(202) 225-3106",yrs:8,bio:"J000298",pos:{Healthcare:95,Environment:90,Economy:40,Defense:22,Education:92,Technology:82,Immigration:48}},
{id:"m27",name:"Rosa DeLauro",pre:"Rep.",party:"Democrat",state:"CT",dist:"3",chamber:"House",phone:"(202) 225-3661",yrs:34,bio:"D000216",pos:{Healthcare:92,Environment:88,Economy:52,Defense:48,Education:95,Technology:78,Immigration:55}},
{id:"m28",name:"Scott Fry",pre:"Rep.",party:"Republican",state:"SC",dist:"7",chamber:"House",phone:"(202) 225-9895",yrs:0,bio:"F000480",pos:{Healthcare:18,Environment:8,Economy:85,Defense:88,Education:22,Technology:45,Immigration:88}},
{id:"m29",name:"Thomas Massie",pre:"Rep.",party:"Republican",state:"KY",dist:"4",chamber:"House",phone:"(202) 225-3465",yrs:12,bio:"M001184",pos:{Healthcare:15,Environment:18,Economy:92,Defense:55,Education:12,Technology:65,Immigration:75}},
{id:"m30",name:"Jared Golden",pre:"Rep.",party:"Democrat",state:"ME",dist:"2",chamber:"House",phone:"(202) 225-6116",yrs:6,bio:"G000592",pos:{Healthcare:72,Environment:65,Economy:68,Defense:72,Education:75,Technology:62,Immigration:68}},
];
let members = staticMembers;

const bills=[
{id:"b1",num:"H.R. 1",title:"One Big Beautiful Bill Act",sum:"The centerpiece of Trump's second-term domestic agenda — a $3.2 trillion reconciliation bill that permanently extends the 2017 TCJA tax cuts, raises the SALT cap to $40K, creates new deductions for tips (up to $25K/yr) and overtime, and bumps the child tax credit to $2,500. Border provisions add $50B+ for wall construction, 10,000 new ICE officers, and Medicaid work requirements the CBO projects will cut coverage for 8.6 million Americans. Passed the House by a single vote (215-214) and the Senate on a VP tiebreaker (51-50), with Sens. Collins and Murkowski as last Republican holdouts.",status:"signed_into_law",cat:"Economy",intro:"2025-05-20",last:"2025-07-04",spId:"m23",coIds:["m15","m19","m8","m18"],tl:[{s:"introduced",d:"2025-05-20",desc:"Reported by Budget Committee",done:true},{s:"on_the_floor",d:"2025-05-22",desc:"Passed House 215-214",done:true},{s:"passed_senate",d:"2025-07-01",desc:"Passed Senate 51-50 (VP tiebreak)",done:true},{s:"signed_into_law",d:"2025-07-04",desc:"Signed by President Trump",done:true,cur:true}],impact:"Extends tax cuts for 150M+ taxpayers. $2,500 child tax credit. New deductions for tips ($25K cap) and overtime. SALT cap raised to $40K.",budget:"$3.2T added to deficit / 10yr",keyProv:["Permanent extension of 2017 TCJA tax rates","$2,500 child tax credit (up from $2,000)","Tips tax deduction up to $25,000/yr","$40,000 SALT deduction cap","Border wall and 10,000 new ICE officers","Medicaid work requirements for able-bodied adults"],votes:{house:{yea:215,nay:214,abstain:4,dBreak:[],rBreak:["m29","m12"]},senate:{yea:51,nay:50,abstain:0,dBreak:[],rBreak:["m14","m12"]},crossParty:[{id:"m14",party:"Republican",vote:"Nay",note:"Opposed Medicaid cuts"},{id:"m12",party:"Republican",vote:"Nay",note:"Opposed deficit impact"},{id:"m29",party:"Republican",vote:"Nay",note:"Opposed spending levels"}]}},
{id:"b2",num:"S. 5",title:"Laken Riley Act",sum:"Named for Laken Riley — a Georgia nursing student killed in 2024 by a Venezuelan man who had entered the U.S. illegally — this law mandates ICE detain any non-citizen merely charged (not convicted) with theft-related or violent crimes and gives state AGs standing to sue DHS for enforcement failures. Notably bipartisan: Sen. Fetterman co-sponsored it, and it cleared the Senate 64-35 with 12 Democrats crossing the aisle, making it the first bill signed by President Trump in the 119th Congress (P.L. 119-1). Critics argue detaining people on unproven charges violates due process; supporters say it closes a critical gap in interior enforcement.",status:"signed_into_law",cat:"Immigration",intro:"2025-01-03",last:"2025-01-29",spId:"m11",coIds:["m8","m5","m4","m7","m10","m21"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced in Senate by Sen. Britt",done:true},{s:"on_the_floor",d:"2025-01-17",desc:"Passed Senate with bipartisan support",done:true},{s:"passed",d:"2025-01-22",desc:"Passed House 263-156",done:true},{s:"signed_into_law",d:"2025-01-29",desc:"Signed by President Trump (P.L. 119-1)",done:true,cur:true}],impact:"Mandatory ICE detention for non-citizens charged with theft-related crimes. States can sue DHS over enforcement failures.",keyProv:["Mandatory ICE detention for theft/burglary charges","States can sue DHS for enforcement failures","Applies to charges, not just convictions","Covers assault on law enforcement officers"],votes:{house:{yea:263,nay:156,abstain:6,dBreak:["m4","m30","m13"],rBreak:[]},senate:{yea:64,nay:35,abstain:1,dBreak:["m4","m13"],rBreak:[]},crossParty:[{id:"m4",party:"Democrat",vote:"Yea",note:"Co-sponsored the bill"},{id:"m30",party:"Democrat",vote:"Yea",note:"Supported in both chambers"},{id:"m13",party:"Democrat",vote:"Yea",note:"Riley was from Georgia"}]}},
{id:"b3",num:"H.R. 22",title:"SAVE Act",sum:"Requires voters to present a birth certificate, U.S. passport, or REAL ID to register for federal elections — a stricter standard than most states currently impose. Proponents cite evidence of non-citizen voter registration; the Brennan Center estimates 21.3 million U.S. citizens lack the required documents, disproportionately affecting elderly, low-income, and minority voters. Passed the House 220-208 on a near-party-line vote; faces a steep path in the Senate where Democrats argue it creates a de facto voter suppression mechanism without solving a documented fraud problem.",status:"passed_house",cat:"Other",intro:"2025-01-03",last:"2025-04-10",spId:"m18",coIds:["m15","m5","m19","m25"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced by Rep. Chip Roy",done:true},{s:"in_committee",d:"2025-03-15",desc:"Markup in House Admin Committee",done:true},{s:"on_the_floor",d:"2025-04-10",desc:"Passed House 220-208",done:true,cur:true},{s:"passed_senate",desc:"Pending Senate action",done:false}],impact:"Would require 150M+ registered voters to have documentary proof of citizenship on file. Critics say 21M+ citizens lack required documents.",keyProv:["Documentary proof of citizenship to register","States must purge non-citizens from rolls","Criminal penalties for non-compliant officials","REAL ID accepted as proof of citizenship"],votes:{house:{yea:220,nay:208,abstain:5,dBreak:["m30"],rBreak:[]},crossParty:[{id:"m30",party:"Democrat",vote:"Yea",note:"One of 4 Democrats to cross party lines"}]}},
{id:"b4",num:"H.R. 7148",title:"Consolidated Appropriations Act, 2026",sum:"An omnibus package that resolved a Feb 1 partial government shutdown by funding five federal departments — HHS, HUD, DOJ, State, and Financial Services — through September 30, 2026 at roughly FY2025-adjusted levels. DHS received only a two-week extension because Republicans and Democrats remained deadlocked over ICE oversight terms, resetting the clock for another shutdown fight by February 14. Freedom Caucus conservatives opposed the spending totals, but the Senate voted 60-39 with nine Democrats crossing the aisle to provide the margin needed for passage.",status:"signed_into_law",cat:"Economy",intro:"2026-01-28",last:"2026-02-03",spId:"m19",coIds:["m15","m27"],tl:[{s:"introduced",d:"2026-01-28",desc:"Introduced in House",done:true},{s:"on_the_floor",d:"2026-01-30",desc:"Passed House",done:true},{s:"passed_senate",d:"2026-01-31",desc:"Senate passed with bipartisan deal",done:true},{s:"signed_into_law",d:"2026-02-03",desc:"Signed by President Trump",done:true,cur:true}],impact:"Funds most of government for FY2026. DHS funded only through Feb 14 pending ICE reform negotiations.",budget:"~$1.7T discretionary",keyProv:["Full-year funding for 5 of 6 spending bills","2-week DHS stopgap through Feb 14","Bipartisan Senate deal on ICE oversight","Ends partial government shutdown"],votes:{house:{yea:228,nay:202,abstain:5,dBreak:["m27","m20","m22"],rBreak:["m18","m29"]},senate:{yea:60,nay:39,abstain:1,dBreak:["m1","m4","m9","m6"],rBreak:[]},crossParty:[{id:"m18",party:"Republican",vote:"Nay",note:"Opposed discretionary spending levels"},{id:"m29",party:"Republican",vote:"Nay",note:"Libertarian opposition to omnibus"},{id:"m27",party:"Democrat",vote:"Yea",note:"Co-sponsored as Appropriations ranking member"},{id:"m20",party:"Democrat",vote:"Yea",note:"Voted to end government shutdown"},{id:"m22",party:"Democrat",vote:"Yea",note:"Bipartisan government funding"},{id:"m1",party:"Democrat",vote:"Yea",note:"Voted to end shutdown"},{id:"m4",party:"Democrat",vote:"Yea",note:"Supported bipartisan deal"},{id:"m9",party:"Democrat",vote:"Yea",note:"Voted to reopen government"},{id:"m6",party:"Democrat",vote:"Yea",note:"Backed appropriations compromise"}]}},
{id:"b5",num:"H.R. 6938",title:"FY2026 Appropriations (CJS, Energy, Interior)",sum:"Part of a January 2026 three-bill spending minibus funding Commerce-Justice-Science (DOJ, FBI, NASA, Census), Energy and Water Development (DOE national labs, Army Corps of Engineers), and Interior-Environment (EPA, National Park Service, BLM) through FY2026. DOE research funding was trimmed 4% from FY2025 levels while DOJ law enforcement grants received a modest increase. Senate cloture was invoked 63-36 after five Democrats crossed the aisle — the package averted a broader shutdown before negotiations over DHS broke down weeks later.",status:"signed_into_law",cat:"Economy",intro:"2026-01-06",last:"2026-01-23",spId:"m19",coIds:["m15"],tl:[{s:"introduced",d:"2026-01-06",desc:"Introduced by Rep. Cole (Approps Chair)",done:true},{s:"on_the_floor",d:"2026-01-08",desc:"Passed House",done:true},{s:"passed_senate",d:"2026-01-15",desc:"Passed Senate (cloture invoked)",done:true},{s:"signed_into_law",d:"2026-01-23",desc:"Signed into law (P.L. 119-74)",done:true,cur:true}],impact:"Funds DOJ, NASA, EPA, DOE, and Interior Dept for FY2026.",keyProv:["Commerce-Justice-Science funding","Energy and Water Development","Interior and Environment programs","Emergency spending provisions"],votes:{house:{yea:220,nay:210,abstain:5,dBreak:["m27","m26"],rBreak:["m29","m18"]},senate:{yea:63,nay:36,abstain:1,dBreak:["m1","m4","m6","m9","m13"],rBreak:[]},crossParty:[{id:"m29",party:"Republican",vote:"Nay",note:"Opposed omnibus spending approach"},{id:"m18",party:"Republican",vote:"Nay",note:"Demanded deeper spending cuts"},{id:"m27",party:"Democrat",vote:"Yea",note:"Supported funding for CJS programs"},{id:"m26",party:"Democrat",vote:"Yea",note:"Backed science and energy funding"},{id:"m1",party:"Democrat",vote:"Yea",note:"Voted for cloture on appropriations"},{id:"m4",party:"Democrat",vote:"Yea",note:"Supported bipartisan deal"},{id:"m6",party:"Democrat",vote:"Yea",note:"Backed energy and science funding"},{id:"m9",party:"Democrat",vote:"Yea",note:"Voted for Commerce-Justice funding"},{id:"m13",party:"Democrat",vote:"Yea",note:"Bipartisan vote on federal spending"}]}},
{id:"b6",num:"H.R. 3617",title:"Securing America's Critical Minerals Supply Act",sum:"China controls 60%+ of global rare earth processing and dominates cobalt, lithium, and graphite supply chains vital to semiconductors, EV batteries, and advanced weapons. This bill directs the Energy Secretary to produce classified and public assessments of U.S. mineral vulnerabilities and build a domestic diversification strategy within 18 months — covering mining, refining, and processing gaps. Bipartisan in framing but contested in approach: House debates center on whether federal subsidies or streamlined permitting should be the primary tool to rebuild U.S. refining capacity.",status:"on_the_floor",cat:"Technology",intro:"2025-05-29",last:"2026-02-09",spId:"m24",coIds:["m19","m25"],tl:[{s:"introduced",d:"2025-05-29",desc:"Introduced by Rep. John James",done:true},{s:"in_committee",d:"2025-12-15",desc:"Reported by Energy and Commerce",done:true},{s:"on_the_floor",d:"2026-02-09",desc:"On House floor calendar this week",done:true,cur:true}],impact:"Secures mineral supply chains for AI, electric vehicles, defense. Reduces dependence on China for critical minerals.",keyProv:["DOE critical energy resource assessments","Domestic mineral production incentives","Supply chain vulnerability reporting","Defense and AI mineral priorities"]},
{id:"b7",num:"H.R. 4593",title:"SHOWER Act",sum:"Tackles Trump's long-running grievance with federal water pressure regulations by adopting the ASME definition of 'showerhead' — measuring flow per showerhead body rather than per nozzle. This allows multi-nozzle shower systems to exceed the current 2.5 gallon-per-minute federal cap, effectively reversing Biden-era efficiency rules. Critics say it undermines water conservation in drought-stricken western states and costs consumers more in water bills; supporters frame it as a deregulatory win for consumer choice. Passed the House 226-197 on a party-line vote.",status:"passed_house",cat:"Other",intro:"2025-07-22",last:"2026-01-08",spId:"m28",coIds:["m18","m19"],tl:[{s:"introduced",d:"2025-07-22",desc:"Introduced by Rep. Fry",done:true},{s:"in_committee",d:"2025-12-17",desc:"Reported by Energy and Commerce 28-20",done:true},{s:"on_the_floor",d:"2026-01-08",desc:"Passed House 226-197",done:true,cur:true},{s:"passed_senate",desc:"Awaiting Senate action",done:false}],impact:"Changes federal showerhead water flow regulations affecting millions of households.",keyProv:["Adopts ASME showerhead definition","Reverses Biden-era water regulations","Follows EO 14264 on water pressure","DOE must revise existing regulations"],votes:{house:{yea:226,nay:197,abstain:10,dBreak:[],rBreak:[]}}},
{id:"b8",num:"H.R. 5184",title:"Affordable HOMES Act",sum:"Strips the Department of Energy of its authority to set energy efficiency standards for manufactured (mobile) homes — Biden-era rules the industry says add $7,000–$10,000 per unit — and transfers remaining authority to HUD, which historically sets safety but not energy standards. Proponents argue the upfront cost savings make manufactured housing more accessible to the ~22 million Americans who live in them; environmental and consumer advocates counter that lower-income residents in less-efficient homes will pay more in utility costs over time, erasing the purchase savings.",status:"passed_house",cat:"Economy",intro:"2025-09-15",last:"2026-01-08",spId:"m15",coIds:["m18","m19","m23"],tl:[{s:"introduced",d:"2025-09-15",desc:"Introduced",done:true},{s:"in_committee",d:"2025-12-17",desc:"Reported by Energy and Commerce",done:true},{s:"on_the_floor",d:"2026-01-08",desc:"Passed House",done:true,cur:true},{s:"passed_senate",desc:"Awaiting Senate action",done:false}],impact:"Could reduce manufactured home costs by $7K-$10K per unit. Affects 22 million Americans living in manufactured housing.",keyProv:["Rescinds DOE manufactured housing standards","Eliminates DOE authority over MH efficiency","Redirects authority to HUD","Aims to lower manufactured housing costs"],votes:{house:{yea:218,nay:207,abstain:10,dBreak:["m30"],rBreak:["m29"]},crossParty:[{id:"m30",party:"Democrat",vote:"Yea",note:"Supported manufactured housing affordability"},{id:"m29",party:"Republican",vote:"Nay",note:"Opposed eliminating energy efficiency standards"}]}},
{id:"b9",num:"H.R. 21",title:"Born-Alive Abortion Survivors Protection Act",sum:"Would impose federal criminal penalties — up to 5 years in prison — on healthcare providers who fail to give standard medical care to infants born alive following a failed abortion attempt. Republicans argue it fills a gap in existing law; the American College of Obstetricians and Gynecologists says the Born-Alive Infants Protection Act of 2002 already requires such care, and that this bill is designed to expose physicians to criminal liability for nuanced, life-and-death clinical decisions. Introduced on the first day of the 119th Congress and currently stalled in the Judiciary Committee.",status:"in_committee",cat:"Healthcare",intro:"2025-01-03",last:"2025-03-20",spId:"m15",coIds:["m18","m19","m25","m23"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced on first day of 119th Congress",done:true},{s:"in_committee",d:"2025-03-20",desc:"Referred to Judiciary Committee",done:true,cur:true}],impact:"Would establish federal criminal penalties for healthcare practitioners. Opponents say existing laws already cover such situations.",keyProv:["Same standard of care as any live birth","Criminal penalties for practitioners","Right of the mother to civil action","Reporting requirements for violations"]},
{id:"b10",num:"H.R. 27",title:"HALT Fentanyl Act",sum:"Fentanyl and its analogues killed over 74,000 Americans in 2023 — more than any other drug. Since 2018, emergency DEA scheduling orders have kept most variants as Schedule I, but manufacturers routinely tweak molecular structures to create technically-unscheduled analogues that evade the law. HALT permanently closes this gap by scheduling all chemical variants of the fentanyl class rather than individual compounds, and increases trafficking penalties. Broadly popular in concept, but committee debate centers on whether blanket analogue scheduling risks sweeping in legitimate pharmaceutical research and pain treatment.",status:"in_committee",cat:"Healthcare",intro:"2025-01-03",last:"2025-04-15",spId:"m19",coIds:["m15","m25","m18"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced in the House",done:true},{s:"in_committee",d:"2025-04-15",desc:"Energy and Commerce markup",done:true,cur:true}],impact:"Permanently schedules all fentanyl analogues. Fentanyl is the leading cause of death for Americans ages 18-45.",keyProv:["Schedule I for all fentanyl-related substances","Closes analogue loopholes","Enhanced penalties for trafficking","Research exemptions preserved"]},
{id:"b11",num:"H.R. 28",title:"Protection of Women and Girls in Sports Act",sum:"Redefines 'sex' under Title IX — the 1972 law prohibiting sex-based discrimination in federally funded education — as 'biological sex determined by reproductive biology and genetics at birth,' barring transgender girls and women from female-category athletic competition at any school receiving federal funds. Non-compliant schools risk losing federal funding. Proponents argue it protects competitive fairness for cisgender women; opponents say it misapplies Title IX, conflicts with medical consensus on gender identity, and would have sweeping effects on how schools treat transgender students well beyond athletics.",status:"in_committee",cat:"Education",intro:"2025-01-03",last:"2025-05-10",spId:"m15",coIds:["m18","m25","m19","m23"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced on first day",done:true},{s:"in_committee",d:"2025-05-10",desc:"Education Committee hearings",done:true,cur:true}],impact:"Would apply to all K-12 and college athletic programs receiving federal funding.",keyProv:["Sex defined by reproductive biology at birth","Applies to all federally funded schools","Title IX compliance framework","No exceptions for hormone therapy"]},
{id:"b12",num:"H.R. 23",title:"Illegitimate Court Counteraction Act",sum:"The U.S. has never ratified the Rome Statute and rejects ICC jurisdiction over American citizens. This bill escalates that posture by imposing asset freezes and visa bans on any foreign person or entity — including allied governments, NGOs, and international banks — that assists the ICC in pursuing U.S. citizens or close allies like Israel. Passed the House Judiciary Committee along party lines; critics argue it would isolate the U.S. from international accountability norms and deter cooperation on war crimes cases involving adversaries; supporters contend the ICC has been weaponized for political purposes against democratic allies.",status:"in_committee",cat:"Defense",intro:"2025-01-03",last:"2025-06-15",spId:"m15",coIds:["m18","m5","m25","m19"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced in the House",done:true},{s:"in_committee",d:"2025-06-15",desc:"Foreign Affairs Committee",done:true,cur:true}],impact:"Sanctions against ICC personnel and cooperating foreign entities. Blocks ICC jurisdiction over U.S. allies.",keyProv:["Sanctions on ICC-cooperating persons","Asset freezes and visa bans","Protects U.S. and allied personnel","Blocks ICC cooperation by U.S. agencies"]},
{id:"b13",num:"H.R. 471",title:"Fix Our Forests Act",sum:"Wildfires burned nearly 9 million acres in 2024, driven partly by overstocked federal forests where NEPA litigation and review delays block prescribed burns and thinning for years. This bill creates categorical exclusions from NEPA for forest management projects up to 10,000 acres, caps litigation delays, and fast-tracks post-fire restoration and replanting. One of the more genuinely bipartisan forest proposals in recent memory — many western Democrats support faster prescribed burn permitting — though environmental groups warn reduced environmental review creates risks of irreversible ecological harm.",status:"in_committee",cat:"Environment",intro:"2025-01-16",last:"2025-08-20",spId:"m25",coIds:["m19","m24"],tl:[{s:"introduced",d:"2025-01-16",desc:"Introduced",done:true},{s:"in_committee",d:"2025-08-20",desc:"Natural Resources and Agriculture Committees",done:true,cur:true}],impact:"Speeds up forest management to prevent catastrophic wildfires. 7M acres burned in 2024 season.",keyProv:["Expedited NEPA review for forest management","Streamlined hazardous fuels reduction","Post-fire restoration fast-tracking","Categorical exclusions for certain projects"]},
{id:"b14",num:"H.R. 199",title:"Implementing DOGE Act",sum:"DOGE — the Elon Musk-led advisory group — currently operates without statutory authority, raising legal questions about FACA compliance and its access to sensitive federal payment systems. This bill would give DOGE formal congressional authorization, a defined structure, mandatory reporting requirements, and subpoena power to compel agency cooperation. Supporters say it legitimizes an efficiency mission that has identified billions in duplicative contracts and improper payments; critics argue it codifies an unaccountable private entity's access to sensitive data on millions of federal employees and benefit recipients.",status:"introduced",cat:"Economy",intro:"2025-01-03",last:"2025-02-15",spId:"m25",coIds:["m18","m23"],tl:[{s:"introduced",d:"2025-01-03",desc:"Introduced",done:true,cur:true},{s:"in_committee",desc:"Awaiting committee referral",done:false}],impact:"Would give statutory authority to DOGE efficiency recommendations. Related to Elon Musk advisory role.",keyProv:["Statutory DOGE commission framework","Federal spending waste elimination","Agency consolidation authority","Spending transparency requirements"]},
{id:"b15",num:"DHS Funding",title:"DHS Appropriations Negotiations",sum:"DHS funds the agencies central to Trump's enforcement agenda — CBP, ICE, TSA, Secret Service, FEMA, and Coast Guard — making this the most politically charged remaining appropriations fight. Republicans seek a record increase in ICE detention beds and funding for deportation flights; Senate Democrats, needing 60 votes for cloture, are conditioning support on due process guardrails around mass deportation operations and meaningful ICE oversight. A lapse on February 14 would trigger the second partial shutdown in two weeks, immediately hitting border operations, airport security staffing, and FEMA disaster response.",status:"on_the_floor",cat:"Immigration",intro:"2026-02-03",last:"2026-02-11",spId:"m8",coIds:["m1","m15","m14"],tl:[{s:"introduced",d:"2026-02-03",desc:"2-week DHS extension signed",done:true},{s:"on_the_floor",d:"2026-02-11",desc:"Active negotiations, Feb 14 deadline",done:true,cur:true},{s:"passed",desc:"Must pass by Feb 14 or shutdown",done:false}],impact:"Funds CBP, ICE, TSA, Secret Service, FEMA, Coast Guard. Lapse would trigger second partial shutdown in two weeks.",keyProv:["ICE enforcement funding levels","Border security operations","Democratic demands for ICE reforms","Feb 14 funding deadline"]},
];

const getSp=b=>members.find(m=>m.id===b.spId);
const getCo=b=>(b.coIds||[]).map(id=>members.find(m=>m.id===id)).filter(Boolean);
const genVotes=mId=>{const s=mId.charCodeAt(1)+(mId.length>2?mId.charCodeAt(2):0);return bills.slice(0,10).map((b,i)=>({billId:b.id,num:b.num,title:b.title,vote:["Yea","Nay","Abstain"][(s+i*3)%3],date:b.last,outcome:b.status==="passed"||b.status==="signed_into_law"?"Passed":"Pending"}));};
const genActivity=m=>{const items=[];bills.filter(b=>b.spId===m.id).forEach(b=>items.push({type:"sponsored",date:b.intro,title:"Introduced "+b.num,desc:b.title,billId:b.id}));genVotes(m.id).slice(0,4).forEach(v=>items.push({type:"vote",date:v.date,title:"Voted "+v.vote+" on "+v.num,desc:v.title,billId:v.billId}));items.push({type:"committee",date:"2025-01-15",title:"Committee Assignment",desc:"Assigned to "+(m.chamber==="Senate"?"Finance":"Ways and Means")+" Committee"});return items.sort((a,b)=>new Date(b.date)-new Date(a.date));};
const trending=[
  {name:"Gov. Shutdown / DHS",count:15,cats:["Economy","Immigration"]},
  {name:"Tax Cuts & TCJA",count:12,cats:["Economy"]},
  {name:"Border Security",count:10,cats:["Immigration"]},
  {name:"Critical Minerals & AI",count:8,cats:["Technology"]},
  {name:"Voter Eligibility",count:7,cats:["Other"]},
  {name:"Healthcare & Fentanyl",count:9,cats:["Healthcare"]},
  {name:"Energy Regulation",count:6,cats:["Environment"]},
  {name:"Defense & ICC",count:5,cats:["Defense"]},
];
const topicKW={"Gov. Shutdown / DHS":["appropriations","shutdown","dhs","funding","spending","consolidated"],"Tax Cuts & TCJA":["tax","tcja","beautiful","reconciliation","salt","child tax","tips","overtime"],"Border Security":["border","immigration","ice","laken","detention","deport","asylum"],"Critical Minerals & AI":["mineral","critical","supply chain","energy resource","ai","technology"],"Voter Eligibility":["voter","save act","citizenship","election","register"],"Healthcare & Fentanyl":["healthcare","fentanyl","born-alive","abortion","drug","opioid"],"Energy Regulation":["shower","energy","forest","manufactured","homes","efficiency","wildfire"],"Defense & ICC":["defense","icc","court","sanctions","military"]};

const scotusCases=[
{id:"sc1",name:"Trump v. CASA",docket:"23-1346",status:"decided",decided:"2025-06-20",arg:"2025-04-23",question:"Whether the executive branch can end birthright citizenship for children of undocumented immigrants born on U.S. soil.",result:"5-4: Upheld lower court injunction blocking the executive order. Birthright citizenship under the 14th Amendment applies regardless of parents' immigration status.",majority:["Roberts","Sotomayor","Kagan","Jackson","Barrett"],dissent:["Thomas","Alito","Gorsuch","Kavanaugh"],topic:"Immigration",impact:"High"},
{id:"sc2",name:"FDA v. Alliance for Hippocratic Medicine",docket:"23-235",status:"decided",decided:"2025-03-15",arg:"2025-01-14",question:"Whether FDA exceeded its authority in approving expanded access to mifepristone, including via telemedicine and mail.",result:"9-0: Dismissed for lack of standing. Plaintiffs failed to show concrete injury from FDA's regulatory actions.",majority:["Roberts","Thomas","Alito","Sotomayor","Kagan","Gorsuch","Kavanaugh","Barrett","Jackson"],dissent:[],topic:"Healthcare",impact:"High"},
{id:"sc3",name:"Murthy v. Missouri",docket:"23-411",status:"decided",decided:"2025-04-01",arg:"2025-03-18",question:"Whether government officials' communications with social media platforms about content moderation constitute unconstitutional coercion violating the First Amendment.",result:"6-3: Government communications did not constitute coercion. Platforms retained independent editorial judgment.",majority:["Roberts","Sotomayor","Kagan","Kavanaugh","Barrett","Jackson"],dissent:["Thomas","Alito","Gorsuch"],topic:"Technology",impact:"High"},
{id:"sc4",name:"United States v. Skrmetti",docket:"23-477",status:"decided",decided:"2025-06-30",arg:"2025-12-04",question:"Whether Tennessee's ban on gender-affirming medical care for minors violates the Equal Protection Clause of the 14th Amendment.",result:"6-3: Upheld Tennessee's law. State has rational basis for regulating medical treatments for minors.",majority:["Roberts","Thomas","Alito","Gorsuch","Kavanaugh","Barrett"],dissent:["Sotomayor","Kagan","Jackson"],topic:"Healthcare",impact:"High"},
{id:"sc5",name:"Oklahoma v. EPA",docket:"24-531",status:"argued",arg:"2025-11-05",question:"Whether the EPA exceeded its authority under the Clean Air Act by imposing emissions standards on existing power plants without explicit congressional authorization.",result:null,majority:[],dissent:[],topic:"Environment",impact:"Medium"},
{id:"sc6",name:"Smith v. Arizona",docket:"22-899",status:"decided",decided:"2025-02-21",arg:"2024-10-02",question:"Whether the Confrontation Clause is violated when an expert who did not perform forensic testing offers opinions based on another analyst's work.",result:"6-3: Confrontation Clause applies. Defendants have the right to cross-examine the actual analyst.",majority:["Roberts","Sotomayor","Kagan","Gorsuch","Jackson","Barrett"],dissent:["Thomas","Alito","Kavanaugh"],topic:"Criminal Justice",impact:"Medium"},
{id:"sc7",name:"Texas v. Department of Energy",docket:"24-712",status:"pending",arg:"2026-03-24",question:"Whether the Department of Energy can mandate renewable energy procurement targets for federal facilities in states that have not adopted renewable portfolio standards.",result:null,majority:[],dissent:[],topic:"Energy",impact:"Medium"},
{id:"sc8",name:"Students for Fair Admissions v. Harvard (Endowment)",docket:"24-889",status:"pending",arg:"2026-04-15",question:"Whether tax-exempt status can be conditioned on universities' compliance with the Court's prior ruling banning race-conscious admissions.",result:null,majority:[],dissent:[],topic:"Education",impact:"High"}
];
const justices=[
{name:"John Roberts",role:"Chief Justice",appointed:"2005",appointedBy:"G.W. Bush",lean:"Center-Right"},
{name:"Clarence Thomas",role:"Associate Justice",appointed:"1991",appointedBy:"G.H.W. Bush",lean:"Conservative"},
{name:"Samuel Alito",role:"Associate Justice",appointed:"2006",appointedBy:"G.W. Bush",lean:"Conservative"},
{name:"Sonia Sotomayor",role:"Associate Justice",appointed:"2009",appointedBy:"Obama",lean:"Liberal"},
{name:"Elena Kagan",role:"Associate Justice",appointed:"2010",appointedBy:"Obama",lean:"Liberal"},
{name:"Neil Gorsuch",role:"Associate Justice",appointed:"2017",appointedBy:"Trump",lean:"Conservative"},
{name:"Brett Kavanaugh",role:"Associate Justice",appointed:"2018",appointedBy:"Trump",lean:"Center-Right"},
{name:"Amy Coney Barrett",role:"Associate Justice",appointed:"2020",appointedBy:"Trump",lean:"Conservative"},
{name:"Ketanji Brown Jackson",role:"Associate Justice",appointed:"2022",appointedBy:"Biden",lean:"Liberal"}
];
const scotusStages=["All","Decided","Argued","Pending"];
const billUpdates=[{id:"u1",billId:"b4",date:"Feb 3",title:"Shutdown Ended",desc:"Consolidated Appropriations Act signed, ending partial shutdown.",ns:"signed_into_law"},{id:"u2",billId:"b15",date:"Feb 11",title:"DHS Deadline Looming",desc:"Two weeks to negotiate DHS funding before Feb 14 expiry."},{id:"u3",billId:"b6",date:"Feb 9",title:"Floor This Week",desc:"Critical Minerals Act on House floor calendar."},{id:"u4",billId:"b3",date:"Feb 10",title:"SAVE Act Push",desc:"Trump and House Republicans lobbying for Senate passage."},{id:"u5",billId:"b1",date:"Jul 4",title:"Signed into Law",desc:"One Big Beautiful Bill signed on Independence Day.",ns:"signed_into_law"}];
const memUpdates=[{id:"mu1",memberId:"m8",date:"Feb 11",title:"DHS Negotiations",desc:"Sen. Thune says Feb 14 DHS deadline is very tight.",billId:"b15"},{id:"mu2",memberId:"m18",date:"Feb 10",title:"SAVE Act Push",desc:"Rep. Roy lobbying for Senate floor vote on SAVE Act.",billId:"b3"},{id:"mu3",memberId:"m24",date:"Feb 9",title:"Floor Action",desc:"Rep. James's Critical Minerals Act on House floor.",billId:"b6"},{id:"mu4",memberId:"m19",date:"Feb 3",title:"Funding Signed",desc:"Rep. Cole's Appropriations Act signed into law.",billId:"b4"}];
const sugMems=["m1","m3","m5","m17","m15","m20"];
const catList=["All","Healthcare","Economy","Defense","Education","Environment","Immigration","Technology","Other"];
const partyList=["All","Democrat","Republican","Independent"];
const stageList=["All","Introduced","In Committee","On the Floor","Passed House","Passed Senate","Signed into Law","Failed"];
const stageMap={"Introduced":"introduced","In Committee":"in_committee","On the Floor":"on_the_floor","Passed House":"passed_house","Passed Senate":"passed_senate","Signed into Law":"signed_into_law","Failed":"failed"};
const allSt=["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const topicColors={"Gov. Shutdown / DHS":"#E84855","Tax Cuts & TCJA":"#D97706","Border Security":"#EA580C","Critical Minerals & AI":"#8B5CF6","Voter Eligibility":"#2563EB","Healthcare & Fentanyl":"#059669","Energy Regulation":"#D97706","Defense & ICC":"#E84855"};

const calendarEvents=[
{id:"ce1",date:"2026-02-11",type:"vote",title:"Senate DHS Floor Vote",desc:"Appropriations bill expected on the floor ahead of deadline",billId:"b15"},
{id:"ce2",date:"2026-02-12",type:"hearing",title:"Critical Minerals Hearing",desc:"House Energy & Commerce — domestic supply chain strategy",billId:"b6"},
{id:"ce3",date:"2026-02-13",type:"markup",title:"SAVE Act Senate Markup",desc:"Judiciary Committee considering voting ID provisions",billId:"b3"},
{id:"ce4",date:"2026-02-14",type:"deadline",title:"DHS Funding Expires",desc:"Partial shutdown returns if Congress misses this hard deadline",billId:"b15",urgent:true},
{id:"ce5",date:"2026-02-18",type:"vote",title:"SHOWER Act Senate Vote",desc:"Expected floor time after 226-197 House passage",billId:"b7"},
{id:"ce6",date:"2026-02-20",type:"markup",title:"Born-Alive Act Subcommittee",desc:"Judiciary subcommittee markup session",billId:"b9"},
{id:"ce7",date:"2026-02-25",type:"hearing",title:"HALT Fentanyl Act Markup",desc:"Energy & Commerce full committee markup",billId:"b10"},
{id:"ce8",date:"2026-03-01",type:"deadline",title:"FY2027 Budget Request",desc:"White House submits presidential budget to Congress"},
];

const weeklyDigest={
weekOf:"Feb 9, 2026",
movedBills:[
{billId:"b6",headline:"Critical Minerals Act hits the House floor",context:"Bipartisan interest but expect a largely partisan vote. Rare to see both parties agree on the problem but disagree on the fix."},
{billId:"b15",headline:"DHS deadline in 3 days — shutdown risk elevated",context:"ICE reform talks stalled. Both sides are pointing fingers publicly but negotiating privately. Watch for a short extension rather than a deal."},
],
watchNext:[
{billId:"b3",reason:"SAVE Act Senate markup Feb 13 — first real test of whether it has a path through the upper chamber. Look for Collins and Murkowski as swing votes."},
{billId:"b7",reason:"SHOWER Act heads to Senate after passing 226-197 House. Lighter lift than expected — bipartisan fatigue on energy mandates may help."},
{billId:"b9",reason:"Born-Alive subcommittee could accelerate the timeline if House leadership wants a messaging win before spring recess."},
],
insight:"One must-pass item this week: DHS funding. Everything else moves on leadership's discretion. Watch Thune's floor schedule — what he actually schedules tells you more than anything members say in press conferences.",
followedActivity:[
{memberId:"m8",date:"Feb 11",action:"DHS Negotiations",note:"Thune: 'The Feb 14 deadline is not moving.' Pressure on both caucuses."},
{memberId:"m18",date:"Feb 10",action:"SAVE Act Push",note:"Roy personally lobbying Senate colleagues for a floor vote."},
{memberId:"m24",date:"Feb 9",action:"Floor Action",note:"James's Critical Minerals Act advanced to House floor calendar."},
],
};

// ═══════════════════════════════════════════
// INFLUENCE & MONEY — Data Layer
// Future data integration: swap INFLUENCE.bills[id] and INFLUENCE.members[id]
// with live API responses from influence.civly.app (OpenSecrets/FEC pipeline)
// Match types: exact | keyword | issue-area | sponsor-industry | committee | member-issue-pattern
// ═══════════════════════════════════════════
const fMoney=n=>{if(!n||n===0)return"$0";if(n>=1e9)return"$"+(n/1e9).toFixed(1)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M";if(n>=1e3)return"$"+(n/1e3).toFixed(0)+"K";return"$"+n;};
const STANCE_COLOR={support:"#34A853",oppose:"#EA4335",mixed:"#F9AB00"};
const MATCH_LABELS={"exact":"Direct match","keyword":"Keyword match","issue-area":"Issue area","sponsor-industry":"Sponsor's donors","committee":"Committee alignment","member-issue-pattern":"Issue pattern"};
const INFLUENCE={
bills:{
b1:{totalLobby:284e6,lobbyOrgs:[{name:"U.S. Chamber of Commerce",spend:95e6,stance:"support",matchType:"exact"},{name:"Nat'l Fed. of Ind. Business",spend:42e6,stance:"support",matchType:"exact"},{name:"AFL-CIO",spend:38e6,stance:"oppose",matchType:"exact"},{name:"Real Estate Roundtable",spend:28e6,stance:"support",matchType:"keyword"},{name:"Pharmaceutical Assoc.",spend:18e6,stance:"mixed",matchType:"issue-area"}],industries:[{name:"Finance/Securities",amount:142e6,pct:50,stance:"support",color:"#4285F4"},{name:"Real Estate",amount:67e6,pct:24,stance:"support",color:"#34A853"},{name:"Labor Unions",amount:38e6,pct:13,stance:"oppose",color:"#EA4335"},{name:"Health Industry",amount:22e6,pct:8,stance:"mixed",color:"#7C3AED"},{name:"Technology",amount:15e6,pct:5,stance:"support",color:"#F9AB00"}],spikes:[{date:"2025-05-17",step:1,desc:"$28M lobbying surge 5 days before House vote — 62 orgs active",orgs:62,spend:28e6},{date:"2025-06-28",step:3,desc:"$31M pre-Senate vote push by finance sector — 48 orgs active",orgs:48,spend:31e6}],explanation:"The TCJA extension attracted the largest combined lobbying campaign of the 119th Congress — led by finance and real estate interests that benefit most from rate extensions and the $40K SALT cap.",confidence:0.95,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b2:{totalLobby:18e6,lobbyOrgs:[{name:"Nat'l Sheriffs' Association",spend:5e6,stance:"support",matchType:"exact"},{name:"ICE Officers' Union",spend:4e6,stance:"support",matchType:"exact"},{name:"ACLU",spend:2.4e6,stance:"oppose",matchType:"exact"},{name:"Immigration Reform Law Inst.",spend:2e6,stance:"support",matchType:"exact"}],industries:[{name:"Law Enforcement",amount:9e6,pct:50,stance:"support",color:"#4285F4"},{name:"Security/Defense",amount:5e6,pct:28,stance:"support",color:"#1a73e8"},{name:"Civil Rights",amount:4e6,pct:22,stance:"oppose",color:"#EA4335"}],spikes:[],explanation:"Law enforcement associations strongly backed mandatory detention requirements; civil liberties groups lobbied against it on due process grounds.",confidence:0.92,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b3:{totalLobby:12e6,lobbyOrgs:[{name:"Heritage Foundation",spend:3.8e6,stance:"support",matchType:"keyword"},{name:"True the Vote",spend:2.6e6,stance:"support",matchType:"exact"},{name:"NAACP Legal Defense Fund",spend:2.2e6,stance:"oppose",matchType:"exact"},{name:"Common Cause",spend:1.8e6,stance:"oppose",matchType:"exact"}],industries:[{name:"Election Integrity",amount:6e6,pct:50,stance:"support",color:"#4285F4"},{name:"Civil Rights",amount:4e6,pct:33,stance:"oppose",color:"#EA4335"},{name:"State Gov. Groups",amount:2e6,pct:17,stance:"mixed",color:"#9CA3AF"}],spikes:[],explanation:"Conservative election integrity groups funded the push; civil rights organizations mounted opposition citing 21M+ Americans who lack required documents.",confidence:0.88,source:"OpenSecrets · Sunlight Foundation",directInferred:"direct",matchType:"exact"},
b4:{totalLobby:156e6,lobbyOrgs:[{name:"Lockheed Martin",spend:28e6,stance:"support",matchType:"committee"},{name:"Boeing",spend:22e6,stance:"support",matchType:"committee"},{name:"AFGE (Gov. Employees Union)",spend:18e6,stance:"mixed",matchType:"issue-area"},{name:"SAIC",spend:14e6,stance:"support",matchType:"committee"}],industries:[{name:"Defense",amount:62e6,pct:40,stance:"support",color:"#1a73e8"},{name:"Gov. Contractors",amount:38e6,pct:24,stance:"support",color:"#9CA3AF"},{name:"Public Sector Unions",amount:22e6,pct:14,stance:"mixed",color:"#F9AB00"},{name:"Technology",amount:18e6,pct:12,stance:"support",color:"#4285F4"},{name:"Health Industry",amount:16e6,pct:10,stance:"support",color:"#7C3AED"}],spikes:[{date:"2026-01-28",step:0,desc:"$42M lobbying push during shutdown threat — 84 orgs mobilized",orgs:84,spend:42e6}],explanation:"Annual appropriations draw the broadest lobbying coalition — defense contractors dominate, followed by government services and healthcare providers protecting their funding lines.",confidence:0.90,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b5:{totalLobby:48e6,lobbyOrgs:[{name:"American Energy Alliance",spend:12e6,stance:"support",matchType:"exact"},{name:"Sierra Club",spend:8e6,stance:"oppose",matchType:"issue-area"},{name:"Nat'l Mining Assoc.",spend:7e6,stance:"support",matchType:"issue-area"}],industries:[{name:"Energy/Oil & Gas",amount:22e6,pct:46,stance:"support",color:"#EA4335"},{name:"Defense",amount:14e6,pct:29,stance:"support",color:"#1a73e8"},{name:"Environmental",amount:8e6,pct:17,stance:"oppose",color:"#34A853"},{name:"Mining/Metals",amount:4e6,pct:8,stance:"support",color:"#9CA3AF"}],spikes:[],explanation:"Energy and defense contractors pushed for favorable appropriations; environmental groups opposed cuts to EPA and Interior budgets.",confidence:0.84,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"issue-area"},
b6:{totalLobby:42e6,lobbyOrgs:[{name:"Mining Assoc. of America",spend:14e6,stance:"support",matchType:"exact"},{name:"Tesla / EV Coalition",spend:8e6,stance:"support",matchType:"keyword"},{name:"Lockheed / Northrop Grumman",spend:7e6,stance:"support",matchType:"keyword"},{name:"Sierra Club / Earthjustice",spend:4e6,stance:"oppose",matchType:"issue-area"}],industries:[{name:"Mining/Metals",amount:18e6,pct:43,stance:"support",color:"#9CA3AF"},{name:"Technology",amount:12e6,pct:29,stance:"support",color:"#4285F4"},{name:"Defense",amount:8e6,pct:19,stance:"support",color:"#1a73e8"},{name:"Environmental",amount:4e6,pct:10,stance:"oppose",color:"#34A853"}],spikes:[],explanation:"Mining and tech companies drove the bill as AI and EV industries face critical mineral shortages. Environmentalists raised concerns about expedited permitting bypassing ecological review.",confidence:0.87,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b7:{totalLobby:8e6,lobbyOrgs:[{name:"Plumbing-Heating-Cooling Contractors",spend:3.2e6,stance:"support",matchType:"exact"},{name:"Kohler / Moen / Delta Faucet",spend:1.8e6,stance:"support",matchType:"sponsor-industry"},{name:"Sierra Club",spend:1.4e6,stance:"oppose",matchType:"issue-area"},{name:"NRDC",spend:1e6,stance:"oppose",matchType:"issue-area"}],industries:[{name:"Plumbing/HVAC",amount:5e6,pct:63,stance:"support",color:"#059669"},{name:"Building Materials",amount:2e6,pct:25,stance:"support",color:"#D97706"},{name:"Environmental",amount:1e6,pct:12,stance:"oppose",color:"#34A853"}],spikes:[],explanation:"The plumbing supply industry, which opposed Biden-era water efficiency standards, backed the bill through trade associations. Faucet manufacturers stand to gain from less restricted product lines.",confidence:0.82,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"sponsor-industry"},
b8:{totalLobby:22e6,lobbyOrgs:[{name:"Manufactured Housing Institute",spend:8.4e6,stance:"support",matchType:"exact"},{name:"Clayton Homes (Berkshire Hathaway)",spend:4.2e6,stance:"support",matchType:"sponsor-industry"},{name:"Nat'l Homebuilders Assoc.",spend:3.8e6,stance:"support",matchType:"keyword"},{name:"Energy Efficiency advocates",spend:2.8e6,stance:"oppose",matchType:"issue-area"}],industries:[{name:"Manufactured Housing",amount:14e6,pct:64,stance:"support",color:"#F9AB00"},{name:"Building Materials",amount:5e6,pct:23,stance:"support",color:"#D97706"},{name:"Environmental",amount:3e6,pct:14,stance:"oppose",color:"#34A853"}],spikes:[],explanation:"The manufactured housing industry had lobbied against DOE energy standards for years — arguing the $7K–$10K cost per unit priced out low-income buyers. Major manufacturers funded the push.",confidence:0.88,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b10:{totalLobby:28e6,lobbyOrgs:[{name:"Nat'l Assoc. of Police Organizations",spend:8.4e6,stance:"support",matchType:"exact"},{name:"DEA Agents Association",spend:4.2e6,stance:"support",matchType:"exact"},{name:"Pharmaceutical Research Inst.",spend:6.8e6,stance:"mixed",matchType:"issue-area"},{name:"ACLU / Drug Policy Alliance",spend:4e6,stance:"oppose",matchType:"issue-area"},{name:"Treatment & Recovery orgs",spend:4.6e6,stance:"support",matchType:"keyword"}],industries:[{name:"Law Enforcement",amount:12e6,pct:43,stance:"support",color:"#4285F4"},{name:"Pharma",amount:8e6,pct:29,stance:"mixed",color:"#7C3AED"},{name:"Recovery/Treatment",amount:5e6,pct:18,stance:"support",color:"#34A853"},{name:"Civil Rights",amount:3e6,pct:11,stance:"oppose",color:"#EA4335"}],spikes:[],explanation:"Broad bipartisan support from law enforcement and recovery advocates. Pharma companies split on research exemptions — some back permanent scheduling; others fear restrictions on legitimate therapies.",confidence:0.85,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
b14:{totalLobby:35e6,lobbyOrgs:[{name:"Elon Musk / SpaceX affiliates",spend:8.2e6,stance:"support",matchType:"sponsor-industry"},{name:"TechNet / Silicon Valley Assoc.",spend:6.4e6,stance:"support",matchType:"keyword"},{name:"AFGE (Federal Employees Union)",spend:9.8e6,stance:"oppose",matchType:"exact"},{name:"Nat'l Contract Mgmt. Assoc.",spend:7.2e6,stance:"oppose",matchType:"issue-area"}],industries:[{name:"Technology",amount:18e6,pct:51,stance:"support",color:"#4285F4"},{name:"Gov. Contractors",amount:12e6,pct:34,stance:"oppose",color:"#9CA3AF"},{name:"Public Sector Unions",amount:5e6,pct:14,stance:"oppose",color:"#F9AB00"}],spikes:[],explanation:"Silicon Valley interests backing the efficiency push vs. government contractors and federal employee unions fearing contract cuts and workforce reductions.",confidence:0.78,source:"OpenSecrets · FEC",directInferred:"inferred",matchType:"sponsor-industry"},
b15:{totalLobby:58e6,lobbyOrgs:[{name:"GEO Group / CoreCivic",spend:14.2e6,stance:"support",matchType:"exact"},{name:"ICE Officers' Union",spend:8.6e6,stance:"support",matchType:"exact"},{name:"SEIU / Immigration advocates",spend:10.4e6,stance:"oppose",matchType:"exact"},{name:"Border security tech contractors",spend:12.8e6,stance:"support",matchType:"committee"},{name:"AFGE (DHS employees)",spend:8e6,stance:"mixed",matchType:"issue-area"}],industries:[{name:"Immigration Enforcement",amount:22e6,pct:38,stance:"support",color:"#EA4335"},{name:"Border Security",amount:18e6,pct:31,stance:"support",color:"#1a73e8"},{name:"Labor/Civil Rights",amount:10e6,pct:17,stance:"oppose",color:"#F9AB00"},{name:"Gov. Contractors",amount:8e6,pct:14,stance:"mixed",color:"#9CA3AF"}],spikes:[{date:"2026-02-10",step:1,desc:"$22M lobbying surge 4 days before deadline — 58 orgs mobilized",orgs:58,spend:22e6}],explanation:"The Feb 14 deadline created a lobbying frenzy — private detention operators want funding continuity; Democratic-allied labor groups pushed for ICE oversight provisions.",confidence:0.91,source:"OpenSecrets · FEC",directInferred:"direct",matchType:"exact"},
},
members:{
m1:{careerTotal:42.8e6,cycle:14.2e6,topIndustries:[{name:"Finance/Securities",amount:8.4e6,pct:20,color:"#4285F4"},{name:"Real Estate",amount:5.1e6,pct:12,color:"#34A853"},{name:"Labor Unions",amount:4.8e6,pct:11,color:"#EA4335"},{name:"Law Firms",amount:3.2e6,pct:8,color:"#F9AB00"},{name:"Health Industry",amount:2.9e6,pct:7,color:"#7C3AED"}],outsideSpend:8.2e6,outsideOrgs:[{org:"Senate Majority PAC",amount:5.2e6,type:"support"},{org:"DSCC",amount:3e6,type:"support"}],lobbyPressure:[{issue:"Finance",orgs:34,spend:22e6,direction:"aligned"},{issue:"Healthcare",orgs:18,spend:8.4e6,direction:"aligned"},{issue:"Immigration",orgs:12,spend:3.2e6,direction:"opposed"}],topDonors:[{name:"Goldman Sachs Group",amount:420000,type:"direct"},{name:"Blackstone Group",amount:380000,type:"direct"},{name:"Citigroup",amount:290000,type:"direct"}],smallDollarPct:18,explanation:"Schumer's fundraising is dominated by New York financial sector donors, consistent with his long record of banking and securities committee work.",confidence:0.91,source:"FEC · OpenSecrets",directInferred:"direct"},
m2:{careerTotal:46.2e6,cycle:12.4e6,topIndustries:[{name:"Finance/Securities",amount:9.2e6,pct:20,color:"#4285F4"},{name:"Energy/Oil & Gas",amount:7.1e6,pct:15,color:"#EA4335"},{name:"Defense",amount:6.2e6,pct:13,color:"#1a73e8"},{name:"Pharma",amount:4.8e6,pct:10,color:"#7C3AED"},{name:"Agriculture",amount:3.9e6,pct:8,color:"#34A853"}],outsideSpend:22.4e6,outsideOrgs:[{org:"Senate Leadership Fund",amount:14.2e6,type:"support"},{org:"American Crossroads",amount:8.2e6,type:"support"}],lobbyPressure:[{issue:"Energy",orgs:28,spend:18e6,direction:"aligned"},{issue:"Finance",orgs:24,spend:14e6,direction:"aligned"},{issue:"Defense",orgs:18,spend:12e6,direction:"aligned"}],topDonors:[{name:"JPMorgan Chase",amount:680000,type:"direct"},{name:"Koch Industries",amount:420000,type:"direct"},{name:"Altria Group",amount:380000,type:"direct"}],smallDollarPct:6,explanation:"McConnell's long tenure in leadership positioned him as a central figure for finance, energy, and defense lobbying — sectors that rely heavily on federal spending and regulatory posture.",confidence:0.93,source:"FEC · OpenSecrets",directInferred:"direct"},
m3:{careerTotal:112e6,cycle:28e6,topIndustries:[{name:"Small Donors <$200",amount:84e6,pct:75,color:"#34A853"},{name:"Labor Unions",amount:15e6,pct:13,color:"#EA4335"},{name:"Education",amount:8e6,pct:7,color:"#4285F4"},{name:"Healthcare",amount:5e6,pct:4,color:"#7C3AED"}],outsideSpend:4.2e6,outsideOrgs:[{org:"Our Revolution PAC",amount:2.8e6,type:"support"},{org:"Progressive Change PAC",amount:1.4e6,type:"support"}],lobbyPressure:[{issue:"Healthcare",orgs:12,spend:4.2e6,direction:"opposed"},{issue:"Finance",orgs:22,spend:14e6,direction:"opposed"}],topDonors:[{name:"Individual donors <$200",amount:84e6,type:"small-dollar"},{name:"SEIU",amount:820000,type:"direct"},{name:"NEA",amount:640000,type:"direct"}],smallDollarPct:75,note:"Raises primarily from small-dollar donations. Does not accept corporate PAC money.",explanation:"Nearly 75% of Sanders' fundraising comes from small-dollar donations under $200 — one of the highest ratios in the Senate. This is a structural choice, not incidental.",confidence:0.96,source:"FEC · OpenSecrets",directInferred:"direct"},
m5:{careerTotal:82.4e6,cycle:18.6e6,topIndustries:[{name:"Finance/Securities",amount:16.2e6,pct:20,color:"#4285F4"},{name:"Energy/Oil & Gas",amount:12.4e6,pct:15,color:"#EA4335"},{name:"Real Estate",amount:9.8e6,pct:12,color:"#34A853"},{name:"Defense",amount:8.2e6,pct:10,color:"#1a73e8"},{name:"Agriculture",amount:5.1e6,pct:6,color:"#F9AB00"}],outsideSpend:28.4e6,outsideOrgs:[{org:"Texans for a Conservative Majority",amount:18.4e6,type:"support"},{org:"NRSC",amount:10e6,type:"support"}],lobbyPressure:[{issue:"Energy",orgs:38,spend:24e6,direction:"aligned"},{issue:"Finance",orgs:28,spend:18e6,direction:"aligned"},{issue:"Immigration",orgs:22,spend:12e6,direction:"aligned"}],topDonors:[{name:"Elliott Management",amount:1.2e6,type:"direct"},{name:"Valero Energy",amount:820000,type:"direct"},{name:"Goldman Sachs",amount:680000,type:"direct"}],smallDollarPct:12,explanation:"Cruz's Texas base means energy and finance sectors dominate — oil & gas interests are especially active around legislation touching EPA authority and energy markets.",confidence:0.92,source:"FEC · OpenSecrets",directInferred:"direct"},
m6:{careerTotal:62.4e6,cycle:10.8e6,topIndustries:[{name:"Small Donors <$200",amount:40e6,pct:64,color:"#34A853"},{name:"Labor Unions",amount:8.4e6,pct:13,color:"#EA4335"},{name:"Education",amount:5.8e6,pct:9,color:"#4285F4"},{name:"Law Firms",amount:4.2e6,pct:7,color:"#F9AB00"},{name:"Health Industry",amount:3.9e6,pct:6,color:"#7C3AED"}],outsideSpend:6.4e6,outsideOrgs:[{org:"Senate Majority PAC",amount:4.2e6,type:"support"},{org:"DSCC",amount:2.2e6,type:"support"}],lobbyPressure:[{issue:"Finance",orgs:28,spend:12e6,direction:"opposed"},{issue:"Healthcare",orgs:16,spend:8e6,direction:"aligned"}],topDonors:[{name:"Individual donors <$200",amount:40e6,type:"small-dollar"},{name:"SEIU",amount:640000,type:"direct"},{name:"Harvard/MIT affiliates",amount:520000,type:"direct"}],smallDollarPct:64,explanation:"Warren's fundraising relies heavily on small-dollar donors — she built her national profile around consumer financial protection and uses small-dollar totals as a political signal against industry money.",confidence:0.90,source:"FEC · OpenSecrets",directInferred:"direct"},
m8:{careerTotal:28.6e6,cycle:8.4e6,topIndustries:[{name:"Agriculture",amount:6.2e6,pct:22,color:"#34A853"},{name:"Finance/Securities",amount:5.4e6,pct:19,color:"#4285F4"},{name:"Energy/Oil & Gas",amount:4.2e6,pct:15,color:"#EA4335"},{name:"Defense",amount:3.6e6,pct:13,color:"#1a73e8"},{name:"Retail/Trade",amount:2.8e6,pct:10,color:"#F9AB00"}],outsideSpend:12.4e6,outsideOrgs:[{org:"Senate Leadership Fund",amount:8.4e6,type:"support"},{org:"NRSC",amount:4e6,type:"support"}],lobbyPressure:[{issue:"Agriculture",orgs:22,spend:14e6,direction:"aligned"},{issue:"Finance",orgs:18,spend:10e6,direction:"aligned"},{issue:"Energy",orgs:14,spend:8e6,direction:"aligned"}],topDonors:[{name:"Wells Fargo",amount:420000,type:"direct"},{name:"Ducks Unlimited",amount:380000,type:"direct"},{name:"Citigroup",amount:290000,type:"direct"}],smallDollarPct:14,explanation:"As Senate Majority Leader from South Dakota, Thune's fundraising is shaped by agriculture and finance — the two dominant industries in his state and committee assignments.",confidence:0.89,source:"FEC · OpenSecrets",directInferred:"direct"},
m11:{careerTotal:12.4e6,cycle:8.2e6,topIndustries:[{name:"Finance/Securities",amount:2.8e6,pct:23,color:"#4285F4"},{name:"Energy/Oil & Gas",amount:2.2e6,pct:18,color:"#EA4335"},{name:"Defense",amount:1.8e6,pct:15,color:"#1a73e8"},{name:"Agriculture",amount:1.6e6,pct:13,color:"#34A853"},{name:"Real Estate",amount:1.4e6,pct:11,color:"#F9AB00"}],outsideSpend:8.6e6,outsideOrgs:[{org:"Senate Republican Leadership PAC",amount:5.4e6,type:"support"},{org:"Alabama Values PAC",amount:3.2e6,type:"support"}],lobbyPressure:[{issue:"Immigration",orgs:18,spend:10e6,direction:"aligned"},{issue:"Finance",orgs:14,spend:6e6,direction:"aligned"}],topDonors:[{name:"Protective Life Corp",amount:340000,type:"direct"},{name:"Regions Financial",amount:280000,type:"direct"},{name:"Encompass Health",amount:240000,type:"direct"}],smallDollarPct:11,explanation:"As the Laken Riley Act's lead sponsor, Britt attracted significant law enforcement and border security lobbying aligned with her signature legislation.",confidence:0.85,source:"FEC · OpenSecrets",directInferred:"direct"},
m15:{careerTotal:24.6e6,cycle:14.2e6,topIndustries:[{name:"Finance/Securities",amount:6.2e6,pct:25,color:"#4285F4"},{name:"Technology",amount:3.8e6,pct:15,color:"#7C3AED"},{name:"Energy/Oil & Gas",amount:3.2e6,pct:13,color:"#EA4335"},{name:"Defense",amount:2.8e6,pct:11,color:"#1a73e8"},{name:"Agriculture",amount:2.2e6,pct:9,color:"#34A853"}],outsideSpend:18.6e6,outsideOrgs:[{org:"House Republican Majority PAC",amount:12.4e6,type:"support"},{org:"Congressional Leadership Fund",amount:6.2e6,type:"support"}],lobbyPressure:[{issue:"Finance",orgs:32,spend:22e6,direction:"aligned"},{issue:"Immigration",orgs:24,spend:18e6,direction:"aligned"},{issue:"Technology",orgs:18,spend:12e6,direction:"aligned"}],topDonors:[{name:"Elliott Management",amount:820000,type:"direct"},{name:"Home Depot",amount:640000,type:"direct"},{name:"Club for Growth",amount:520000,type:"direct"}],smallDollarPct:22,explanation:"As Speaker, Johnson draws from a broad national donor base — finance, tech, and energy sectors all have strong interests in House floor scheduling and what legislation gets a vote.",confidence:0.88,source:"FEC · OpenSecrets",directInferred:"direct"},
m16:{careerTotal:28.4e6,cycle:12.8e6,topIndustries:[{name:"Finance/Securities",amount:7.2e6,pct:25,color:"#4285F4"},{name:"Real Estate",amount:5.4e6,pct:19,color:"#34A853"},{name:"Labor Unions",amount:4.8e6,pct:17,color:"#EA4335"},{name:"Health Industry",amount:3.2e6,pct:11,color:"#7C3AED"},{name:"Technology",amount:2.4e6,pct:8,color:"#F9AB00"}],outsideSpend:14.2e6,outsideOrgs:[{org:"House Majority PAC",amount:9.8e6,type:"support"},{org:"DCCC",amount:4.4e6,type:"support"}],lobbyPressure:[{issue:"Finance",orgs:26,spend:14e6,direction:"aligned"},{issue:"Labor",orgs:18,spend:10e6,direction:"aligned"}],topDonors:[{name:"Blackstone Group",amount:520000,type:"direct"},{name:"Morgan Stanley",amount:440000,type:"direct"},{name:"SEIU",amount:380000,type:"direct"}],smallDollarPct:20,explanation:"Jeffries' Brooklyn/Queens base means finance and real estate dominate donations — common for New York House members regardless of party.",confidence:0.87,source:"FEC · OpenSecrets",directInferred:"direct"},
m17:{careerTotal:18.2e6,cycle:8.6e6,topIndustries:[{name:"Small Donors <$200",amount:13.6e6,pct:75,color:"#34A853"},{name:"Labor Unions",amount:2.4e6,pct:13,color:"#EA4335"},{name:"Education",amount:1.2e6,pct:7,color:"#4285F4"},{name:"Environmental",amount:0.9e6,pct:5,color:"#34A853"}],outsideSpend:2.1e6,outsideOrgs:[{org:"Justice Democrats",amount:1.4e6,type:"support"},{org:"Our Revolution",amount:0.7e6,type:"support"}],lobbyPressure:[{issue:"Finance",orgs:22,spend:14e6,direction:"opposed"},{issue:"Energy",orgs:18,spend:10e6,direction:"opposed"}],topDonors:[{name:"Individual donors <$200",amount:13.6e6,type:"small-dollar"},{name:"SEIU",amount:240000,type:"direct"},{name:"Teachers unions",amount:180000,type:"direct"}],smallDollarPct:75,note:"Rejects corporate PAC money. One of the largest small-dollar fundraisers in the House.",explanation:"AOC's fundraising is almost entirely small-dollar — she rejects corporate PAC money as a founding Squad member. Large industries lobby heavily against her agenda.",confidence:0.95,source:"FEC · OpenSecrets",directInferred:"direct"},
}};

const getIdeology=pos=>{
if(!pos)return null;
const lib=(pos.Healthcare+pos.Environment+pos.Education)/3;
const con=(pos.Economy+pos.Defense+pos.Immigration)/3;
const score=Math.round((lib+(100-con))/2);
let label,color;
if(score>72){label="Progressive";color=PC.democrat;}
else if(score>58){label="Center-Left";color="#5B8DEF";}
else if(score>42){label="Moderate";color="#6B7280";}
else if(score>28){label="Center-Right";color="#E07B6B";}
else{label="Conservative";color=PC.republican;}
const sorted=Object.entries(pos).sort((a,b)=>b[1]-a[1]);
const topIssues=sorted.slice(0,2).map(([k])=>k);
const bottomIssues=sorted.slice(-1).map(([k])=>k);
return{score,label,color,topIssues,bottomIssues};
};

const IP={home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",chart:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",star:"M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",person:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",back:"M15 19l-7-7 7-7",chevDown:"M19 9l-7 7-7-7",chevUp:"M5 15l7-7 7 7",chevRight:"M9 5l7 7-7 7",x:"M6 18L18 6M6 6l12 12",people:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",filter:"M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",check:"M5 13l4 4L19 7",gavel:["M14.25 2.75l3 3-9.5 9.5-3-3 9.5-9.5z","M4 21h16","M10.75 8.25l5 5"],phone:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",bookmark:"M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"};
const topicIcons={"AI Regulation":"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z","Border Security":"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z","Healthcare Reform":"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z","Clean Energy":"M13 10V3L4 14h7v7l9-11h-7z","Tax Reform":"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z","Data Privacy":"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z","Military Funding":"M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"};

// ═══ COMPONENTS ═══
const LMAP={home:HomeIcon,search:SearchIcon,chart:BarChart2,bookmark:Bookmark,person:User,back:ChevronLeft,chevDown:ChevronDown,chevUp:ChevronUp,chevRight:ChevronRight,x:X,filter:Filter,clock:Clock,check:Check,phone:Phone,people:Users,gavel:Gavel,star:Star,trending:TrendingUp,calendar:Calendar,flame:Flame,bell:Bell,mapPin:MapPin};
function Icon({name,size=20,color=C.text,strokeWidth=1.5}){const L=LMAP[name];if(L)return <L size={size} color={color} strokeWidth={strokeWidth}/>;const p=IP[name];if(!p)return null;return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{Array.isArray(p)?p.map((d,i)=><path key={i} d={d}/>):<path d={p}/>}</svg>}
function StatusBadge({status,light}){const col=SC[status]||C.textM;return <span style={{fontFamily:F.body,fontSize:11,fontWeight:300,letterSpacing:0.1,color:light?"#fff":col,background:(light?"rgba(255,255,255,0.18)":col+"12"),padding:"3px 12px",borderRadius:9999,border:light?"1px solid rgba(255,255,255,0.22)":"1px solid "+col+"35",display:"inline-block"}}>{SL[status]||status}</span>}
function PartyBadge({party}){return <span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:pc(party),background:pc(party)+"12",padding:"2px 10px",borderRadius:9999,border:"1px solid "+pc(party)+"30"}}>{party}</span>}
function PD({party,size=6}){return <span style={{width:size,height:size,borderRadius:size,background:pc(party),display:"inline-block",flexShrink:0}}/>}
function Avatar({bio,name,size=36}){
const[loaded,setLoaded]=useState(false);
const[err,setErr]=useState(false);
const initials=name?name.split(" ").filter(Boolean).map(n=>n[0].toUpperCase()).join("").slice(0,2):"?";
const seed=name?name.charCodeAt(0)%6:0;
const bgColors=["#e8f0fe","#fce8e6","#e6f4ea","#fef7e0","#f3e8fd","#e8f4fd"];
const textColors=["#1a73e8","#d93025","#188038","#e37400","#9334e6","#0277bd"];
const bg=bgColors[seed];const fg=textColors[seed];
const fallback=(
<div style={{width:size,height:size,borderRadius:size,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
<span style={{color:fg,fontSize:size*0.36,fontWeight:700,fontFamily:F.body,userSelect:"none"}}>{initials}</span>
</div>
);
if(!bio||err)return fallback;
return(
<div style={{width:size,height:size,borderRadius:size,flexShrink:0,position:"relative",overflow:"hidden",background:bg}}>
{!loaded&&(
<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:bg}}>
<span style={{color:fg,fontSize:size*0.36,fontWeight:700,fontFamily:F.body,userSelect:"none"}}>{initials}</span>
</div>
)}
<img
src={imgUrl(bio)}
alt={name}
loading="lazy"
onLoad={()=>setLoaded(true)}
onError={()=>setErr(true)}
style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"top center",display:loaded?"block":"none",borderRadius:size}}
/>
</div>
);
}
function SaveBtn({active,onToggle,size=16}){return <button onClick={e=>{e.stopPropagation();onToggle()}} style={{all:"unset",cursor:"pointer",padding:4,display:"flex"}}><svg width={size} height={size} viewBox="0 0 24 24" fill={active?C.accent:"none"} stroke={active?C.accent:C.textM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg></button>}
function VoteBar({label,yea,nay,abstain,onClick,expanded,breakCount}){
const total=yea+nay+(abstain||0);
return(<div style={{marginBottom:expanded?0:10,background:C.card,border:"1px solid "+(expanded?C.navy+"50":C.border),borderRadius:expanded?"8px 8px 0 0":8,overflow:"hidden",transition:"border-color 0.15s"}}>
<div onClick={onClick} style={{cursor:onClick?"pointer":"default",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px"}}>
<span style={{fontFamily:F.body,color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
{label}
{breakCount>0&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.navy,background:C.navy+"10",border:"1px solid "+C.navy+"30",padding:"1px 6px",borderRadius:100}}>{breakCount} crossed</span>}
</span>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<span style={{fontFamily:F.mono,color:C.textM,fontSize:10}}>{total} votes</span>
{onClick&&<Icon name={expanded?"chevUp":"chevDown"} size={14} color={expanded?C.navy:C.textM}/>}
</div>
</div>
<div style={{padding:"0 14px 12px"}}>
<div style={{display:"flex",height:8,overflow:"hidden",borderRadius:4,background:C.bg2}}>
<div style={{width:(yea/total*100)+"%",background:C.success}}/>
<div style={{width:1,background:C.card,flexShrink:0}}/>
<div style={{width:(nay/total*100)+"%",background:C.error}}/>
{abstain>0&&<><div style={{width:1,background:C.card,flexShrink:0}}/><div style={{width:(abstain/total*100)+"%",background:C.textM}}/></>}
</div>
<div style={{display:"flex",gap:16,marginTop:6}}>
<span style={{color:C.success,fontSize:11,fontFamily:F.body,fontWeight:500,display:"flex",alignItems:"center",gap:3}}><span style={{fontWeight:700}}>Yea</span> {yea} <span style={{color:C.textM,fontSize:10}}>({Math.round(yea/total*100)}%)</span></span>
<span style={{color:C.error,fontSize:11,fontFamily:F.body,fontWeight:500,display:"flex",alignItems:"center",gap:3}}><span style={{fontWeight:700}}>Nay</span> {nay} <span style={{color:C.textM,fontSize:10}}>({Math.round(nay/total*100)}%)</span></span>
{abstain>0&&<span style={{color:C.textM,fontSize:11,fontFamily:F.body}}>Abstain {abstain}</span>}
</div>
</div>
</div>)
}

function inferVotes(bill,voteData,chamber){
const chamberMembers=members.filter(m=>m.chamber===chamber);
const{dBreak=[],rBreak=[]}=voteData;
const crossParty=bill.votes.crossParty||[];
// Determine which way each party voted using crossParty notes
let rDir=null,dDir=null;
for(const cp of crossParty){
if(cp.party==="Republican"){rDir=cp.vote==="Nay"?"Yea":"Nay";dDir=rDir==="Yea"?"Nay":"Yea";break;}
if(cp.party==="Democrat"){dDir=cp.vote==="Yea"?"Nay":"Yea";rDir=dDir==="Nay"?"Yea":"Nay";break;}
}
if(!rDir){
if(rBreak.length>0){rDir="Yea";dDir="Nay";}
else if(dBreak.length>0){rDir="Yea";dDir="Nay";}
else{const sp=members.find(m=>m.id===bill.spId);rDir=sp?.party==="Democrat"?"Nay":"Yea";dDir=rDir==="Yea"?"Nay":"Yea";}
}
const cpMap={};crossParty.forEach(cp=>{cpMap[cp.id]=cp;});
const rBreakSet=new Set(rBreak);const dBreakSet=new Set(dBreak);
const yea=[],nay=[];
chamberMembers.forEach(m=>{
const isCross=rBreakSet.has(m.id)||dBreakSet.has(m.id);
const cpData=cpMap[m.id];
let vote;
if(cpData){vote=cpData.vote;}
else if(rBreakSet.has(m.id)){vote=rDir==="Yea"?"Nay":"Yea";}
else if(dBreakSet.has(m.id)){vote=dDir==="Yea"?"Nay":"Yea";}
else if(m.party==="Republican"){vote=rDir;}
else if(m.party==="Democrat"){vote=dDir;}
else{vote=rDir;}
const entry={...m,crossover:isCross,note:cpData?.note||""};
if(vote==="Yea")yea.push(entry);else nay.push(entry);
});
const sort=arr=>arr.sort((a,b)=>a.crossover===b.crossover?a.name.localeCompare(b.name):a.crossover?-1:1);
return{yea:sort(yea),nay:sort(nay)};
}

function VoteBreakdown({bill,voteData,chamber,nav}){
const[activeTab,setActiveTab]=useState("yea");
const{yea,nay}=useMemo(()=>inferVotes(bill,voteData,chamber),[bill,voteData,chamber]);
const list=activeTab==="yea"?yea:nay;
const crossCount=list.filter(m=>m.crossover).length;
return(
<div style={{border:"1px solid "+C.navy+"40",borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden",marginBottom:12,background:C.card}}>
{/* Tabs */}
<div style={{display:"flex",borderBottom:"1px solid "+C.border}}>
{[["yea","Yea",yea.length,C.success],["nay","Nay",nay.length,C.error]].map(([key,label,count,color])=>(
<button key={key} onClick={()=>setActiveTab(key)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"11px 0",fontFamily:F.body,fontSize:13,fontWeight:activeTab===key?600:400,color:activeTab===key?color:C.textM,borderBottom:activeTab===key?"2px solid "+color:"2px solid transparent",background:activeTab===key?color+"06":"transparent",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
<span style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:activeTab===key?color:C.textM}}>{count}</span>
<span>{label}</span>
{activeTab===key&&crossCount>0&&<span style={{fontSize:10,color:C.textM,fontWeight:400}}>· {crossCount} crossed</span>}
</button>
))}
</div>
{/* Party breakdown bar */}
<div style={{display:"flex",gap:12,padding:"8px 14px",background:C.bg2,borderBottom:"1px solid "+C.border}}>
{Object.entries(list.reduce((acc,m)=>{acc[m.party]=(acc[m.party]||0)+1;return acc;},{})).map(([party,count])=>(
<span key={party} style={{display:"flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,color:C.text2}}>
<span style={{width:8,height:8,borderRadius:8,background:pc(party),display:"inline-block"}}/>
<b style={{color:C.text,fontWeight:600}}>{count}</b> {party==="Independent"?"Ind.":party.slice(0,3)}
{list.filter(m=>m.party===party&&m.crossover).length>0&&<span style={{fontSize:10,color:pc(party),fontWeight:500}}>({list.filter(m=>m.party===party&&m.crossover).length} crossed)</span>}
</span>
))}
</div>
{/* Voter list */}
<div style={{maxHeight:420,overflowY:"auto"}} className="civly-scroll">
{list.length===0&&<div style={{padding:"20px 14px",fontFamily:F.body,fontSize:12,color:C.textM,textAlign:"center"}}>No member data available</div>}
{list.map((m,i)=>(
<div key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:i<list.length-1?"1px solid "+C.border+"88":"none",cursor:"pointer",background:m.crossover?(activeTab==="yea"?C.success+"06":C.error+"06"):"white",transition:"background 0.1s"}}>
<div style={{position:"relative",flexShrink:0}}>
<Avatar bio={m.bio} name={m.name} size={36}/>
{m.crossover&&<span style={{position:"absolute",bottom:-2,right:-2,width:12,height:12,borderRadius:12,background:activeTab==="yea"?C.success:C.error,border:"2px solid white",display:"block"}}/>}
</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontFamily:F.body,color:C.text,fontSize:13,fontWeight:m.crossover?600:400,display:"flex",alignItems:"center",gap:6}}>
{m.name}
{m.crossover&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:activeTab==="yea"?C.success:C.error,background:(activeTab==="yea"?C.success:C.error)+"12",padding:"1px 5px",borderRadius:100}}>crossed</span>}
</div>
<div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
<PD party={m.party} size={5}/>
<span style={{fontFamily:F.body,fontSize:11,color:C.text2}}>{m.pre} · {m.state}{m.dist?"-"+m.dist:""}</span>
</div>
{m.crossover&&m.note&&<div style={{fontFamily:F.body,color:C.textM,fontSize:10,marginTop:2,fontStyle:"italic"}}>"{m.note}"</div>}
</div>
</div>
))}
</div>
</div>
);
}

// ═══ PREMIUM GATE ═══
function PremiumGate({title,desc}){
return(
<div style={{borderRadius:14,border:"1px dashed "+C.border,padding:"22px 20px",textAlign:"center",background:C.bg2,marginBottom:12}}>
<div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:36,background:"linear-gradient(135deg,#f59e0b,#d97706)",marginBottom:10}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
</div>
<div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{title}</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:"1.55",maxWidth:260,margin:"0 auto 14px"}}>{desc}</div>
<button style={{all:"unset",cursor:"pointer",padding:"8px 22px",borderRadius:20,fontSize:12,fontFamily:F.body,fontWeight:600,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",boxShadow:"0 2px 8px rgba(245,158,11,0.3)"}}>Upgrade to Member</button>
</div>
);}

// ═══ INFLUENCE COMPONENTS ═══════════════════════════════════════════════
function InfluenceBadge({type,label}){
const cfg={lobbying:{color:"#7C3AED",bg:"rgba(124,58,237,0.07)",border:"rgba(124,58,237,0.18)"},donor:{color:"#4285F4",bg:"rgba(66,133,244,0.07)",border:"rgba(66,133,244,0.18)"},outside:{color:"#D97706",bg:"rgba(217,119,6,0.07)",border:"rgba(217,119,6,0.2)"},smalldollar:{color:"#34A853",bg:"rgba(52,168,83,0.07)",border:"rgba(52,168,83,0.18)"}}[type]||{color:C.textM,bg:C.bg2,border:C.border};
return(<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:9999,background:cfg.bg,border:"1px solid "+cfg.border,fontFamily:F.mono,fontSize:9,fontWeight:500,color:cfg.color,letterSpacing:0.3,whiteSpace:"nowrap"}}>
{type==="lobbying"&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>}
{type==="donor"&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
{type==="outside"&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
{type==="smalldollar"&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
{label}</span>);}

function DonorIndustryChip({name,amount,color,stance}){
const bg=(color||"#9CA3AF")+"14";
return(<span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:9999,background:bg,fontFamily:F.body,fontSize:10,fontWeight:300,color:color||C.textM,whiteSpace:"nowrap",border:"1px solid "+(color||"#9CA3AF")+"28"}}>
{stance&&<span style={{width:5,height:5,borderRadius:"50%",background:STANCE_COLOR[stance]||C.textM,flexShrink:0,display:"inline-block"}}/>}
{name}
{amount&&<span style={{fontFamily:F.mono,fontSize:8,opacity:0.65,marginLeft:1}}>{fMoney(amount)}</span>}
</span>);}

function ConfidenceBadge({confidence,directInferred,source}){
return(<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap"}}>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.2,background:C.bg2,padding:"2px 7px",borderRadius:9999,border:"1px solid "+C.border}}>{directInferred==="direct"?"Disclosed":"Inferred"}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>{Math.round(confidence*100)}% confidence</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,marginLeft:"auto",opacity:0.6}}>{source}</span>
</div>);}

function BillMoneySnapshot({billId}){
const d=INFLUENCE.bills[billId];if(!d)return null;
const topInds=d.industries.slice(0,3);const topOrgs=d.lobbyOrgs.slice(0,4);
return(<div style={{background:"rgba(124,58,237,0.035)",borderRadius:16,padding:"14px 16px",marginBottom:16,border:"1px solid rgba(124,58,237,0.13)"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
<div style={{display:"flex",alignItems:"center",gap:7}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#7C3AED",letterSpacing:0.8,textTransform:"uppercase"}}>Disclosed Money & Lobbying</span>
</div>
<span style={{fontFamily:F.mono,fontSize:14,fontWeight:700,color:"#7C3AED"}}>{fMoney(d.totalLobby)}</span>
</div>
<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>
{topInds.map((ind,i)=><DonorIndustryChip key={i} name={ind.name} amount={ind.amount} color={ind.color} stance={ind.stance}/>)}
</div>
<div style={{marginBottom:10}}>
{topOrgs.map((org,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<topOrgs.length-1?"1px solid rgba(124,58,237,0.07)":"none"}}>
<span style={{width:5,height:5,borderRadius:"50%",background:STANCE_COLOR[org.stance]||C.textM,flexShrink:0}}/>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{org.name}</span>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginRight:4}}>{fMoney(org.spend)}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:STANCE_COLOR[org.stance]||C.textM,background:(STANCE_COLOR[org.stance]||C.textM)+"14",padding:"1px 7px",borderRadius:9999}}>{org.stance}</span>
{org.matchType&&<span style={{fontFamily:F.mono,fontSize:7,color:C.textM,background:C.bg2,padding:"1px 5px",borderRadius:9999,border:"1px solid "+C.border}}>{MATCH_LABELS[org.matchType]||org.matchType}</span>}
</div>)}
</div>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.55,marginBottom:2,fontStyle:"italic"}}>"{d.explanation}"</div>
<ConfidenceBadge confidence={d.confidence} directInferred={d.directInferred} source={d.source}/>
</div>);}

function MemberMoneySnapshot({memberId,compact}){
const d=INFLUENCE.members[memberId];if(!d)return null;
const topInds=compact?d.topIndustries.slice(0,3):d.topIndustries;
const isSmallDollar=d.smallDollarPct>=50;
return(<div style={{background:isSmallDollar?"rgba(52,168,83,0.04)":"rgba(66,133,244,0.04)",borderRadius:compact?12:16,padding:compact?"10px 14px":"14px 16px",marginBottom:compact?8:16,border:"1px solid "+(isSmallDollar?"rgba(52,168,83,0.14)":"rgba(66,133,244,0.13)")}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:compact?8:12}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isSmallDollar?"#34A853":"#4285F4"} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:isSmallDollar?"#34A853":"#4285F4",letterSpacing:0.8,textTransform:"uppercase"}}>Disclosed Fundraising</span>
</div>
<div style={{textAlign:"right"}}>
<span style={{fontFamily:F.mono,fontSize:compact?11:13,fontWeight:700,color:isSmallDollar?"#34A853":"#4285F4"}}>{fMoney(d.careerTotal)}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,marginLeft:4}}>career</span>
</div>
</div>
<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:compact?0:8}}>
{topInds.map((ind,i)=><DonorIndustryChip key={i} name={ind.name} color={ind.color}/>)}
</div>
{!compact&&d.outsideSpend>0&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,padding:"6px 10px",borderRadius:10,background:"rgba(217,119,6,0.06)",border:"1px solid rgba(217,119,6,0.16)"}}>
<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:"#D97706"}}>{fMoney(d.outsideSpend)} outside spending</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,marginLeft:"auto"}}>{d.outsideOrgs?.[0]?.org}</span>
</div>}
{d.note&&<div style={{fontFamily:F.mono,fontSize:8,color:"#34A853",marginTop:6,letterSpacing:0.2}}>{d.note}</div>}
{!compact&&<ConfidenceBadge confidence={d.confidence} directInferred={d.directInferred} source={d.source}/>}
</div>);}

function LobbyingSpikeMarker({spike}){
return(<div style={{display:"flex",gap:10,marginBottom:12}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",width:14}}>
<div style={{width:10,height:10,borderRadius:"50%",background:"rgba(124,58,237,0.12)",border:"2px solid #7C3AED",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
<span style={{fontFamily:F.mono,fontSize:6,color:"#7C3AED",fontWeight:700,lineHeight:1}}>$</span>
</div>
<div style={{width:1,flex:1,background:"rgba(124,58,237,0.2)",marginTop:3}}/>
</div>
<div style={{flex:1,background:"rgba(124,58,237,0.04)",borderRadius:10,padding:"7px 10px",border:"1px solid rgba(124,58,237,0.12)"}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
<span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:"#7C3AED"}}>{fMoney(spike.spend)} lobbying</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>· {spike.orgs} orgs active</span>
</div>
<div style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,lineHeight:1.4}}>{spike.desc}</div>
<div style={{fontFamily:F.mono,fontSize:8,color:C.textM,marginTop:2}}>{fD(spike.date)}</div>
</div>
</div>);}

// ═══ CARDS (Newspaper style) ═══
function BillCard({bill,onPress,watched,onToggle,compact,nav}){
const sp=getSp(bill);const cp=(bill.votes&&bill.votes.crossParty)||[];
return(<div onClick={onPress} style={{cursor:"pointer",background:C.card,borderRadius:18,padding:compact?"12px 16px":"18px",marginBottom:8,boxShadow:"0 2px 8px rgba(60,64,67,0.06)",border:"1px solid "+C.border,transition:"box-shadow 0.2s,transform 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px rgba(60,64,67,0.11)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(60,64,67,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><StatusBadge status={bill.status}/><span style={{fontFamily:F.mono,color:C.textM,fontSize:9,letterSpacing:0.4}}>{bill.num}</span></div>
<div style={{fontFamily:F.display,color:C.text,fontSize:15,fontWeight:300,lineHeight:"1.4",letterSpacing:"-0.2px"}}>{bill.title}</div>
</div>
{onToggle&&<SaveBtn active={watched} onToggle={()=>onToggle(bill.id)}/>}
</div>
{!compact&&<div style={{color:C.text2,fontSize:12,fontWeight:300,lineHeight:"1.6",marginTop:8,fontFamily:F.body,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{bill.sum}</div>}
<div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
{sp&&<div onClick={nav?e=>{e.stopPropagation();nav("memberProfile",sp.id);}:undefined} style={{display:"flex",alignItems:"center",gap:6,cursor:nav?"pointer":"default"}}>
<Avatar bio={sp.bio} name={sp.name} size={20}/>
<span style={{color:nav?C.navy:C.text2,fontSize:11,fontFamily:F.body,fontWeight:300}}>{sp.name}</span>
<PD party={sp.party} size={5}/>
</div>}
<span style={{color:C.textM,fontSize:9,fontFamily:F.mono,marginLeft:"auto",letterSpacing:0.3}}>{fS(bill.last||bill.intro)}</span>
</div>
{!compact&&cp.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border}}>
<span style={{fontFamily:F.body,fontSize:10,fontWeight:400,color:"#4285F4",background:"rgba(66,133,244,0.08)",padding:"2px 8px",borderRadius:9999}}>Cross-Party</span>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>{cp.slice(0,4).map((c,i)=>{const m=members.find(x=>x.id===c.id);return m?<span key={i} onClick={nav?e=>{e.stopPropagation();nav("memberProfile",c.id);}:undefined} style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,display:"inline-flex",alignItems:"center",gap:3,cursor:nav?"pointer":"default"}}><PD party={c.party} size={4}/>{m.name.split(" ").pop()} ({c.vote})</span>:null})}{cp.length>4&&<span style={{color:C.textM,fontSize:10}}>+{cp.length-4}</span>}</div>
</div>}
{!compact&&INFLUENCE.bills[bill.id]&&(()=>{const inf=INFLUENCE.bills[bill.id];return(<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
<span style={{fontFamily:F.mono,fontSize:9,color:"#7C3AED",fontWeight:500}}>{fMoney(inf.totalLobby)} lobbied</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>·</span>
{inf.industries.slice(0,2).map((ind,i)=><DonorIndustryChip key={i} name={ind.name} color={ind.color} stance={ind.stance}/>)}
</div>);})()}
</div>)}

function MemberCard({member,onPress,watched,onToggle}){
const mInf=INFLUENCE.members[member.id];
return(<div onClick={onPress} style={{cursor:"pointer",background:C.card,borderRadius:18,padding:"14px 16px",marginBottom:6,boxShadow:"0 2px 8px rgba(60,64,67,0.06)",border:"1px solid "+C.border,display:"flex",alignItems:"center",gap:12,transition:"box-shadow 0.2s,transform 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 18px rgba(60,64,67,0.11)";e.currentTarget.style.transform="translateY(-1px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(60,64,67,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
<Avatar bio={member.bio} name={member.name} size={44}/>
<div style={{flex:1,minWidth:0}}>
<div style={{fontFamily:F.body,color:C.text,fontSize:14,fontWeight:300,letterSpacing:"-0.1px"}}>{member.pre} {member.name}</div>
<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><PartyBadge party={member.party}/><span style={{color:C.textM,fontSize:11,fontFamily:F.body,fontWeight:300}}>{member.state}{member.dist?"-"+member.dist:""}</span></div>
{mInf&&<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
{mInf.topIndustries.slice(0,2).map((ind,i)=><DonorIndustryChip key={i} name={ind.name} color={ind.color}/>)}
{mInf.outsideSpend>5e6&&<InfluenceBadge type="outside" label={fMoney(mInf.outsideSpend)+" outside"}/>}
</div>}
</div>
{onToggle&&<SaveBtn active={watched} onToggle={()=>onToggle(member.id)}/>}
</div>)}

// ═══ HOME SCREEN — Newspaper Feed ═══
const TOPIC_COLORS=["#4285F4","#34A853","#EA4335","#F9AB00","#4285F4","#34A853","#EA4335","#F9AB00"];
const CAL_COLOR={deadline:"#EA4335",vote:"#34A853",markup:"#4285F4",hearing:"#7C3AED"};
const PARTY_COLORS={All:"#4285F4",Republican:"#EA4335",Democrat:"#4285F4",Independent:"#34A853"};

function HomeScreen({nav,wb,toggleB}){
const[q,setQ]=useState("");const[party,setParty]=useState("All");const[stage,setStage]=useState("All");const[filOpen,setFilOpen]=useState(false);const[dateFrom,setDateFrom]=useState("");const[dateTo,setDateTo]=useState("");const[sortOrder,setSortOrder]=useState("newest");const[hoveredCalId,setHoveredCalId]=useState(null);
const filtered=useMemo(()=>{let f=[...bills];if(q){const ql=q.toLowerCase();f=f.filter(b=>b.title.toLowerCase().includes(ql)||b.num.toLowerCase().includes(ql));}if(party!=="All")f=f.filter(b=>getSp(b)?.party===party);if(stage!=="All")f=f.filter(b=>b.status===stageMap[stage]);if(dateFrom)f=f.filter(b=>new Date(b.intro)>=new Date(dateFrom));if(dateTo)f=f.filter(b=>new Date(b.intro)<=new Date(dateTo));if(sortOrder==="oldest")f.sort((a,b)=>new Date(a.intro)-new Date(b.intro));else if(sortOrder==="az")f.sort((a,b)=>a.title.localeCompare(b.title));else if(sortOrder==="za")f.sort((a,b)=>b.title.localeCompare(a.title));else f.sort((a,b)=>new Date(b.intro)-new Date(a.intro));return f;},[q,party,stage,dateFrom,dateTo,sortOrder]);
const hero=bills.find(b=>b.id==="b1");const heroSp=hero?getSp(hero):null;
return(<div>

{/* ── Page header ── */}
<div style={{marginBottom:24}}>
<div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(66,133,244,0.08)",border:"1px solid rgba(66,133,244,0.2)",borderRadius:9999,padding:"4px 14px",marginBottom:12}}>
<TrendingUp size={12} color="#4285F4" strokeWidth={1.5}/>
<span style={{fontFamily:F.mono,fontSize:10,color:"#4285F4",letterSpacing:0.5}}>119th Congressional Session</span>
</div>
<div style={{fontFamily:F.display,fontSize:28,fontWeight:200,color:C.text,letterSpacing:"-0.5px",lineHeight:1.1}}>Latest in Congress</div>
<div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.textM,marginTop:4}}>Tracking every bill, vote, and member — live.</div>
</div>

{/* ── Hero bill card ── */}
{hero&&<div onClick={()=>nav("billDetail",hero.id)} style={{cursor:"pointer",borderRadius:24,overflow:"hidden",position:"relative",height:240,marginBottom:24,backgroundImage:"url("+HERO_IMG+")",backgroundSize:"cover",backgroundPosition:"center",boxShadow:"0 8px 32px rgba(60,64,67,0.18)"}}>
<div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, transparent 20%, rgba(15,18,28,0.92) 100%)"}}/>
<div style={{position:"absolute",bottom:0,left:0,right:0,padding:"20px 22px"}}>
<StatusBadge status={hero.status} light/>
<div style={{fontFamily:F.display,color:"#fff",fontSize:21,fontWeight:200,lineHeight:1.3,marginTop:10,letterSpacing:"-0.3px"}}>{hero.title}</div>
<div style={{display:"flex",alignItems:"center",gap:8,marginTop:12}}>
{heroSp&&<><Avatar bio={heroSp.bio} name={heroSp.name} size={22}/><span style={{color:"rgba(255,255,255,0.8)",fontSize:12,fontFamily:F.body,fontWeight:300}}>{heroSp.name}</span></>}
<span style={{color:"rgba(255,255,255,0.45)",fontSize:10,fontFamily:F.mono,marginLeft:"auto",letterSpacing:0.5}}>{hero.num}</span>
</div>
</div>
<div style={{position:"absolute",top:16,right:16}}><SaveBtn active={wb.includes(hero.id)} onToggle={()=>toggleB(hero.id)} size={20}/></div>
</div>}

{/* ── Trending Topics ── */}
<div style={{marginBottom:28}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
<div style={{fontFamily:F.display,fontSize:26,fontWeight:200,color:C.text,letterSpacing:"-0.5px"}}>Trending Topics</div>
<span style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.textM}}>{trending.length} topics</span>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
{trending.map((t,i)=>{const col=TOPIC_COLORS[i%TOPIC_COLORS.length];return(
<div key={t.name} onClick={()=>nav("topicDetail",t.name)} style={{cursor:"pointer",background:"#fff",borderRadius:12,padding:"10px 12px",border:"1px solid "+C.border,display:"flex",alignItems:"center",gap:9,transition:"box-shadow 0.15s,transform 0.15s",boxShadow:"0 1px 3px rgba(60,64,67,0.06)"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.09)";e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(60,64,67,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
<div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text,flex:1,lineHeight:1.3}}>{t.name}</div>
<div style={{fontFamily:F.mono,fontSize:10,fontWeight:500,color:"#fff",background:col,padding:"2px 8px",borderRadius:9999,flexShrink:0}}>{t.count}</div>
</div>);})}
</div>
</div>

{/* ── This Week in Congress ── */}
<div style={{marginBottom:24}}>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
<Calendar size={22} color="#4285F4" strokeWidth={1.5}/>
<span style={{fontFamily:F.display,fontSize:22,fontWeight:200,color:C.text,letterSpacing:"-0.4px"}}>This Week in Congress</span>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
{calendarEvents.filter(e=>new Date(e.date+"T12:00:00")>=new Date("2026-02-09")).slice(0,4).map(e=>{
const typeColor=CAL_COLOR[e.type]||C.textM;
const typeLabel=e.type==="deadline"?"Deadline":e.type==="vote"?"Floor Vote":e.type==="markup"?"Markup":"Hearing";
const d=new Date(e.date+"T12:00:00");
const weekday=d.toLocaleDateString("en-US",{weekday:"long"});
const month=d.toLocaleDateString("en-US",{month:"short"}).toUpperCase();
return(
<div key={e.id} onClick={e.billId?()=>nav("billDetail",e.billId):undefined}
onMouseEnter={e.billId?()=>setHoveredCalId(e.id):undefined}
onMouseLeave={e.billId?()=>setHoveredCalId(null):undefined}
style={{cursor:e.billId?"pointer":"default",background:typeColor+"10",borderRadius:20,overflow:"hidden",display:"flex",border:"1px solid "+typeColor+"20",transform:hoveredCalId===e.id?"translateY(-2px)":"translateY(0)",boxShadow:hoveredCalId===e.id?"0 8px 24px rgba(0,0,0,0.1)":"none",transition:"box-shadow 0.15s,transform 0.15s"}}>
{/* Left color bar */}
<div style={{width:5,background:typeColor,flexShrink:0}}/>
{/* Card content */}
<div style={{padding:"18px 16px",display:"flex",gap:14,flex:1,minWidth:0}}>
{/* Date box */}
<div style={{background:"#fff",borderRadius:14,padding:"10px 10px",textAlign:"center",flexShrink:0,alignSelf:"flex-start",minWidth:62,boxShadow:"0 1px 6px rgba(0,0,0,0.08)"}}>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,textTransform:"uppercase",letterSpacing:0.6,marginBottom:1}}>{month}</div>
<div style={{fontFamily:F.body,fontSize:30,fontWeight:200,color:typeColor,lineHeight:1}}>{d.getDate()}</div>
<div style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.textM,marginTop:3}}>{weekday}</div>
</div>
{/* Text content */}
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
<span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:typeColor,textTransform:"uppercase",letterSpacing:1}}>{typeLabel}</span>
{e.urgent&&<span style={{fontFamily:F.body,fontSize:10,fontWeight:500,color:"#fff",background:"#EA4335",padding:"2px 12px",borderRadius:9999,letterSpacing:0.2}}>URGENT</span>}
</div>
<div style={{fontFamily:F.body,fontSize:16,fontWeight:300,color:C.text,lineHeight:1.3,letterSpacing:"-0.2px",marginBottom:8}}>{e.title}</div>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text2,lineHeight:1.6}}>{e.desc}</div>
</div>
</div>
</div>
);})}
</div>
</div>

{/* ── 2-col spotlight bills ── */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
{bills.filter(b=>["b3","b10"].includes(b.id)).map((b,i)=>{const sp=getSp(b);const col=i===0?"#EA4335":"#34A853";return(
<div key={b.id} onClick={()=>nav("billDetail",b.id)} style={{cursor:"pointer",background:C.card,borderRadius:20,padding:18,boxShadow:"0 2px 8px rgba(60,64,67,0.06)",border:"1px solid "+C.border,transition:"box-shadow 0.15s,transform 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(60,64,67,0.12)";e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(60,64,67,0.06)";e.currentTarget.style.transform="translateY(0)"}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
<div style={{width:28,height:28,borderRadius:9999,background:col+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
<TrendingUp size={13} color={col} strokeWidth={1.5}/>
</div>
<StatusBadge status={b.status}/>
</div>
<div style={{fontFamily:F.display,color:C.text,fontSize:14,fontWeight:300,lineHeight:1.45,marginBottom:12,letterSpacing:"-0.1px"}}>{b.title}</div>
<div style={{display:"flex",alignItems:"center",gap:6}}>{sp&&<><Avatar bio={sp.bio} name={sp.name} size={16}/><span style={{color:C.text2,fontSize:11,fontFamily:F.body,fontWeight:300}}>{sp.name}</span></>}<span style={{fontFamily:F.mono,color:col,fontSize:9,marginLeft:"auto",background:col+"10",padding:"2px 7px",borderRadius:9999}}>{b.num}</span></div>
</div>);})}
</div>

{/* ── Filters row ── */}
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
<button onClick={()=>setFilOpen(!filOpen)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",background:filOpen?"rgba(66,133,244,0.1)":C.bg2,borderRadius:9999,border:"1px solid "+(filOpen?"rgba(66,133,244,0.3)":C.border)}}>
<Filter size={13} color={filOpen?"#4285F4":C.text2} strokeWidth={1.5}/>
<span style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:filOpen?"#4285F4":C.text2}}>Filters</span>
{filOpen?<ChevronUp size={12} color="#4285F4" strokeWidth={1.5}/>:<ChevronDown size={12} color={C.textM} strokeWidth={1.5}/>}
</button>
<input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{border:"1px solid "+(dateFrom?"rgba(66,133,244,0.4)":C.border),borderRadius:9999,padding:"7px 14px",fontSize:12,fontFamily:F.body,fontWeight:300,color:dateFrom?"#4285F4":C.textM,background:dateFrom?"rgba(66,133,244,0.06)":C.bg2,outline:"none",cursor:"pointer"}} title="From date"/>
<span style={{fontSize:11,color:C.textM,fontFamily:F.body}}>–</span>
<input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{border:"1px solid "+(dateTo?"rgba(66,133,244,0.4)":C.border),borderRadius:9999,padding:"7px 14px",fontSize:12,fontFamily:F.body,fontWeight:300,color:dateTo?"#4285F4":C.textM,background:dateTo?"rgba(66,133,244,0.06)":C.bg2,outline:"none",cursor:"pointer"}} title="To date"/>
{(dateFrom||dateTo)&&<button onClick={()=>{setDateFrom("");setDateTo("");}} style={{all:"unset",cursor:"pointer",fontSize:11,fontWeight:300,color:"#4285F4",fontFamily:F.body,padding:"5px 12px",borderRadius:9999,border:"1px solid rgba(66,133,244,0.3)",background:"rgba(66,133,244,0.06)"}}>✕ clear dates</button>}
<select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{border:"1px solid "+C.border,borderRadius:9999,padding:"7px 16px",fontSize:12,fontFamily:F.body,fontWeight:300,color:C.text,background:C.bg2,outline:"none",cursor:"pointer",marginLeft:"auto"}}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">Title A–Z</option><option value="za">Title Z–A</option></select>
{filOpen&&<div style={{width:"100%",display:"flex",gap:6,flexWrap:"wrap",paddingTop:4}}>
{[["All","#4285F4"],["Republican","#EA4335"],["Democrat","#4285F4"],["Independent","#34A853"]].map(([p,col])=>(
<button key={p} onClick={()=>setParty(p)} style={{all:"unset",cursor:"pointer",padding:"7px 16px",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:300,background:party===p?col:C.card,color:party===p?"#fff":C.text2,border:"1px solid "+(party===p?col:C.border)}}>{p==="Independent"?"Ind.":p}</button>
))}
{stageList.map(s=><button key={s} onClick={()=>setStage(s)} style={{all:"unset",cursor:"pointer",padding:"6px 14px",borderRadius:9999,fontSize:11,fontFamily:F.body,fontWeight:300,background:stage===s?"#4285F4":C.card,color:stage===s?"#fff":C.text2,border:"1px solid "+(stage===s?"#4285F4":C.border)}}>{s}</button>)}
</div>}
</div>

{/* ── All Bills list ── */}
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
<Bookmark size={14} color="#4285F4" strokeWidth={1.5}/>
<span style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text,letterSpacing:"-0.1px"}}>All Bills</span>
<span style={{fontFamily:F.mono,fontSize:10,color:C.textM,background:C.bg2,padding:"2px 8px",borderRadius:9999,marginLeft:4}}>{filtered.length}</span>
</div>
{filtered.length===0?<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:13,fontFamily:F.body,fontWeight:300}}>No bills match your filters</div>:filtered.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={wb.includes(b.id)} onToggle={toggleB} nav={nav}/>)}
</div>)}

function TopicDetailScreen({topic,nav,wb,toggleB}){
const kws=topicKW[topic.name]||[topic.name.toLowerCase()];
const topicBills=bills.filter(b=>{const s=(b.title+" "+b.sum).toLowerCase();return kws.some(k=>s.includes(k));});
return(<div>
<div style={{marginBottom:20}}><div style={{fontFamily:F.display,fontSize:24,fontWeight:400,color:C.text}}>{topic.name}</div><div style={{fontFamily:F.body,color:C.textM,fontSize:13,marginTop:2}}>{topicBills.length} bills</div></div>
{topicBills.length===0?<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>No bills found.</div>:topicBills.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={wb.includes(b.id)} onToggle={toggleB} nav={nav}/>)}
</div>)}

function SearchScreen({nav,wm,toggleM}){
const[q,setQ]=useState("");
const ql=q.toLowerCase();const resMem=q?members.filter(m=>m.name.toLowerCase().includes(ql)||m.state.toLowerCase().includes(ql)):[];const resBill=q?bills.filter(b=>b.title.toLowerCase().includes(ql)||b.num.toLowerCase().includes(ql)):[];const resTopic=q?trending.filter(t=>t.name.toLowerCase().includes(ql)):[];
return(<div>
<div style={{fontFamily:F.display,fontSize:24,fontWeight:400,color:C.text,marginBottom:4}}>Search</div>
<div style={{fontFamily:F.body,fontSize:13,color:C.textM,marginBottom:16}}>Find bills, members, and topics</div>
<div style={{position:"relative",marginBottom:16}}><div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={18} color={C.textM}/></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bills, members, topics..." style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:24,padding:"12px 16px 12px 46px",color:C.text,fontSize:14,fontFamily:F.body,outline:"none"}}/>{q&&<button onClick={()=>setQ("")} style={{all:"unset",position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",cursor:"pointer"}}><Icon name="x" size={16} color={C.textM}/></button>}</div>
{!q&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontFamily:F.mono,fontSize:9,fontWeight:500,letterSpacing:1.5,color:C.textM,textTransform:"uppercase"}}>Suggested Members</span><button onClick={()=>nav("browseMembers")} style={{all:"unset",cursor:"pointer",fontFamily:F.body,color:C.accent,fontSize:11,fontWeight:600}}>Browse All</button></div>
{sugMems.map(id=>{const m=members.find(x=>x.id===id);return m?<MemberCard key={m.id} member={m} onPress={()=>nav("memberProfile",m.id)} watched={wm.includes(m.id)} onToggle={toggleM}/>:null})}</>}
{q&&resTopic.map(t=><div key={t.name} onClick={()=>nav("topicDetail",t.name)} style={{cursor:"pointer",padding:"10px 0",borderBottom:"1px solid "+C.border,fontFamily:F.display,fontSize:14,color:C.text}}>{t.name} <span style={{fontFamily:F.mono,fontSize:10,color:C.textM}}>{t.count}</span></div>)}
{q&&resMem.map(m=><MemberCard key={m.id} member={m} onPress={()=>nav("memberProfile",m.id)} watched={wm.includes(m.id)} onToggle={toggleM}/>)}
{q&&resBill.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={false} nav={nav}/>)}
{q&&resMem.length===0&&resBill.length===0&&resTopic.length===0&&<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>No results</div>}
</div>)}

function MembersScreen({nav,wm,toggleM}){
const[q,setQ]=useState("");
const[party,setParty]=useState("All");
const[chamber,setChamber]=useState("All");
const[st,setSt]=useState("All");
const[sortBy,setSortBy]=useState("name");
const[zip,setZip]=useState("");
const[zipLoading,setZipLoading]=useState(false);
const[zipResult,setZipResult]=useState(null);
const[zipError,setZipError]=useState("");
const[highlighted,setHighlighted]=useState([]);
const filtered=useMemo(()=>{
let f=[...members];
if(q){const ql=q.toLowerCase();f=f.filter(m=>m.name.toLowerCase().includes(ql)||m.state.toLowerCase().includes(ql)||(m.dist&&m.dist.includes(ql)));}
if(party!=="All")f=f.filter(m=>m.party===party);
if(chamber!=="All")f=f.filter(m=>m.chamber===chamber);
if(st!=="All")f=f.filter(m=>m.state===st);
if(sortBy==="name")f.sort((a,b)=>a.name.localeCompare(b.name));
else if(sortBy==="state")f.sort((a,b)=>a.state.localeCompare(b.state)||a.name.localeCompare(b.name));
else if(sortBy==="party")f.sort((a,b)=>a.party.localeCompare(b.party)||a.name.localeCompare(b.name));
else if(sortBy==="yrs")f.sort((a,b)=>(b.yrs||0)-(a.yrs||0));
return f;
},[q,party,chamber,st,sortBy]);
const handleZip=async()=>{
if(!/^\d{5}$/.test(zip)){setZipError("Enter a valid 5-digit ZIP");return;}
setZipLoading(true);setZipError("");
try{
const result=await lookupByZip(zip);
setZipResult(result);
setSt(result.state);
const ids=members.filter(m=>m.state===result.state).map(m=>m.id);
setHighlighted(ids);
}catch(e){setZipError("ZIP not found. Try another.");}
finally{setZipLoading(false);}
};
const clearZip=()=>{setZipResult(null);setSt("All");setHighlighted([]);setZip("");setZipError("");};
const senCount=members.filter(m=>m.chamber==="Senate").length;
const houseCount=members.filter(m=>m.chamber==="House").length;
const demCount=members.filter(m=>m.party==="Democrat").length;
const repCount=members.filter(m=>m.party==="Republican").length;
const indCount=members.filter(m=>m.party==="Independent").length;
return(
<div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
{/* Filter sidebar */}
<div style={{width:232,flexShrink:0}}>
{/* ZIP finder card */}
<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:16,marginBottom:12}}>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:600,color:C.text,marginBottom:2,display:"flex",alignItems:"center",gap:6}}><Icon name="search" size={14} color={C.navy}/>Find My Representatives</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.textM,marginBottom:10}}>Enter your ZIP code to see your senators and representative</div>
<div style={{position:"relative",marginBottom:8}}>
<input value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,"").slice(0,5))} onKeyDown={e=>e.key==="Enter"&&handleZip()} placeholder="e.g. 90210" maxLength={5} style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:6,padding:"9px 12px",fontSize:13,fontFamily:F.body,color:C.text,outline:"none",letterSpacing:1}}/>
</div>
<button onClick={handleZip} disabled={zipLoading} style={{all:"unset",cursor:zipLoading?"not-allowed":"pointer",width:"100%",boxSizing:"border-box",textAlign:"center",padding:"9px 0",background:C.navy,color:C.textW,borderRadius:6,fontSize:13,fontFamily:F.body,fontWeight:500,opacity:zipLoading?0.7:1,display:"block"}}>
{zipLoading?"Looking up...":"Find My Reps"}
</button>
{zipError&&<div style={{fontFamily:F.body,fontSize:11,color:C.error,marginTop:6}}>{zipError}</div>}
{zipResult&&<div style={{marginTop:10,padding:"10px 12px",background:C.navy+"0a",borderRadius:6,border:"1px solid "+C.navy+"25"}}>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:600,color:C.navy}}>{zipResult.city}, {zipResult.state}</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.text2,marginTop:2}}>Showing {highlighted.length} members from {zipResult.state}</div>
<button onClick={clearZip} style={{all:"unset",cursor:"pointer",fontSize:10,color:C.textM,fontFamily:F.body,marginTop:6,display:"block"}}>Clear ✕</button>
</div>}
</div>
{/* Party filter */}
<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:16,marginBottom:12}}>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Party</div>
{[["All",members.length],["Democrat",demCount],["Republican",repCount],["Independent",indCount]].map(([p,cnt])=>(
<div key={p} onClick={()=>setParty(p)} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:6,background:party===p?C.navy+"0f":"transparent",marginBottom:2}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
{p!=="All"&&<span style={{width:8,height:8,borderRadius:8,background:pc(p),display:"inline-block",flexShrink:0}}/>}
{p==="All"&&<span style={{width:8,height:8,display:"inline-block"}}/>}
<span style={{fontFamily:F.body,fontSize:13,color:party===p?C.navy:C.text,fontWeight:party===p?500:400}}>{p}</span>
</div>
<span style={{fontFamily:F.mono,fontSize:10,color:C.textM,background:C.bg2,padding:"1px 6px",borderRadius:100}}>{cnt}</span>
</div>
))}
</div>
{/* Chamber filter */}
<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:16,marginBottom:12}}>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Chamber</div>
{[["All",members.length],["Senate",senCount],["House",houseCount]].map(([ch,cnt])=>(
<div key={ch} onClick={()=>setChamber(ch)} style={{cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:6,background:chamber===ch?C.navy+"0f":"transparent",marginBottom:2}}>
<span style={{fontFamily:F.body,fontSize:13,color:chamber===ch?C.navy:C.text,fontWeight:chamber===ch?500:400}}>{ch}</span>
<span style={{fontFamily:F.mono,fontSize:10,color:C.textM,background:C.bg2,padding:"1px 6px",borderRadius:100}}>{cnt}</span>
</div>
))}
</div>
{/* State filter */}
<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:16}}>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>State</div>
<select value={st} onChange={e=>setSt(e.target.value)} style={{width:"100%",background:C.bg2,border:"1px solid "+C.border,borderRadius:6,padding:"8px 10px",fontSize:13,fontFamily:F.body,color:C.text,outline:"none",cursor:"pointer"}}>
<option value="All">All States</option>
{allSt.map(s=><option key={s} value={s}>{s}</option>)}
</select>
{st!=="All"&&<button onClick={()=>setSt("All")} style={{all:"unset",cursor:"pointer",fontSize:11,color:C.navy,fontFamily:F.body,marginTop:8,display:"block"}}>Clear filter ✕</button>}
</div>
</div>
{/* Main content */}
<div style={{flex:1,minWidth:0}}>
{/* Page header */}
<div style={{marginBottom:20}}>
<div style={{fontFamily:F.display,fontSize:24,fontWeight:400,color:C.text,marginBottom:8}}>Members of Congress</div>
<div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{members.length}</b> total</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{senCount}</b> senators</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{houseCount}</b> representatives</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:"#1a73e8"}}>{demCount}</b> Democrat</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:"#ea4335"}}>{repCount}</b> Republican</span>
</div>
</div>
{/* Search + sort row */}
<div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
<div style={{position:"relative",flex:1}}>
<div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={16} color={C.textM}/></div>
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, state, or district..." style={{width:"100%",boxSizing:"border-box",background:C.card,border:"1px solid "+C.border,borderRadius:24,padding:"10px 16px 10px 42px",fontSize:14,fontFamily:F.body,color:C.text,outline:"none"}}/>
{q&&<button onClick={()=>setQ("")} style={{all:"unset",position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",cursor:"pointer"}}><Icon name="x" size={14} color={C.textM}/></button>}
</div>
<select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:C.card,border:"1px solid "+C.border,borderRadius:8,padding:"9px 14px",fontSize:13,fontFamily:F.body,color:C.text,outline:"none",cursor:"pointer",flexShrink:0}}>
<option value="name">Sort: Name A–Z</option>
<option value="state">Sort: State</option>
<option value="party">Sort: Party</option>
<option value="yrs">Sort: Seniority</option>
</select>
</div>
{/* ZIP result banner */}
{zipResult&&highlighted.length>0&&<div style={{background:C.navy+"0a",border:"1px solid "+C.navy+"30",borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
<Icon name="person" size={18} color={C.navy}/>
<div>
<div style={{fontFamily:F.body,fontSize:13,fontWeight:500,color:C.navy}}>Your representatives for ZIP {zip} — {zipResult.city}, {zipResult.state}</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.text2,marginTop:1}}>Showing all {highlighted.length} members. 2 senators + your House district representative.</div>
</div>
<button onClick={clearZip} style={{all:"unset",cursor:"pointer",marginLeft:"auto",padding:"4px 10px",borderRadius:100,background:C.navy+"15",color:C.navy,fontSize:11,fontFamily:F.body}}>Clear</button>
</div>}
{/* Results count */}
<div style={{fontFamily:F.body,fontSize:12,color:C.textM,marginBottom:12}}>{filtered.length} member{filtered.length!==1?"s":""} {party!=="All"||chamber!=="All"||st!=="All"||q?"matching filters":""}</div>
{/* Member grid */}
{filtered.length===0
?<div style={{textAlign:"center",color:C.textM,padding:60,fontSize:14,fontFamily:F.body}}>No members match your filters</div>
:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(168px,1fr))",gap:10}}>
{filtered.map(m=>(
<div key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",background:highlighted.includes(m.id)?C.navy+"08":C.card,border:"1px solid "+(highlighted.includes(m.id)?C.navy+"50":C.border),borderRadius:8,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",boxShadow:highlighted.includes(m.id)?"0 0 0 2px "+C.navy+"20,0 2px 8px rgba(26,115,232,0.12)":"0 1px 2px rgba(60,64,67,0.08)",transition:"box-shadow 0.15s"}}>
<Avatar bio={m.bio} name={m.name} size={52}/>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:500,color:C.text,marginTop:8,lineHeight:1.3,wordBreak:"break-word"}}>{m.name}</div>
<div style={{display:"flex",alignItems:"center",gap:4,marginTop:5,justifyContent:"center",flexWrap:"wrap"}}>
<span style={{fontFamily:F.body,fontSize:11,color:C.text2}}>{m.pre}</span>
<span style={{width:6,height:6,borderRadius:6,background:pc(m.party),display:"inline-block",flexShrink:0}}/>
<span style={{fontFamily:F.body,fontSize:11,color:C.text2,fontWeight:500}}>{m.state}{m.dist?"-"+m.dist:""}</span>
</div>
<div style={{marginTop:6,display:"flex",justifyContent:"center"}}>
<SaveBtn active={wm.includes(m.id)} onToggle={()=>toggleM(m.id)} size={14}/>
</div>
</div>
))}
</div>}
</div>
</div>
);
}
function BrowseMembersScreen({nav,wm,toggleM}){
const[q,setQ]=useState("");const[chamber,setChamber]=useState("All");const[party,setParty]=useState("All");const[st,setSt]=useState("All");
const filtered=useMemo(()=>{let f=[...members];if(q){const ql=q.toLowerCase();f=f.filter(m=>m.name.toLowerCase().includes(ql)||m.state.toLowerCase().includes(ql));}if(chamber!=="All")f=f.filter(m=>m.chamber===chamber);if(party!=="All")f=f.filter(m=>m.party===party);if(st!=="All")f=f.filter(m=>m.state===st);return f.sort((a,b)=>a.name.localeCompare(b.name));},[q,chamber,party,st]);
return(<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div style={{fontFamily:F.display,fontSize:24,fontWeight:400,color:C.text}}>All Members</div><span style={{fontFamily:F.body,color:C.textM,fontSize:13,background:C.bg2,padding:"4px 12px",borderRadius:100}}>{filtered.length} members</span></div>
<div style={{position:"relative",marginBottom:14}}><div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={16} color={C.textM}/></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search members..." style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:24,padding:"11px 16px 11px 44px",color:C.text,fontSize:13,fontFamily:F.body,outline:"none"}}/></div>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{["All","Senate","House"].map(c=><button key={c} onClick={()=>setChamber(c)} style={{all:"unset",cursor:"pointer",padding:"6px 14px",borderRadius:20,fontSize:12,fontFamily:F.body,fontWeight:500,background:chamber===c?C.navy:C.card,color:chamber===c?C.textW:C.text2,border:"1px solid "+(chamber===c?C.navy:C.border)}}>{c}</button>)}{partyList.map(p=><button key={p} onClick={()=>setParty(p)} style={{all:"unset",cursor:"pointer",padding:"6px 14px",borderRadius:20,fontSize:12,fontFamily:F.body,fontWeight:500,background:party===p?C.navy:C.card,color:party===p?C.textW:C.text2,border:"1px solid "+(party===p?C.navy:C.border)}}>{p==="Independent"?"Ind.":p}</button>)}</div>
<select value={st} onChange={e=>setSt(e.target.value)} style={{background:C.card,color:C.text,border:"1px solid "+C.border,borderRadius:8,padding:"8px 14px",fontSize:12,fontFamily:F.body,width:"100%",outline:"none",marginBottom:12,cursor:"pointer"}}><option value="All">All States</option>{allSt.map(s=><option key={s} value={s}>{s}</option>)}</select>
{filtered.map(m=><MemberCard key={m.id} member={m} onPress={()=>nav("memberProfile",m.id)} watched={wm.includes(m.id)} onToggle={toggleM}/>)}
</div>)}


// ═══ PULSE / WATCHLIST / PROFILE ═══
// Extended calendar event data
const allCalEvents=[
...calendarEvents,
{id:"ce9",date:"2026-03-10",type:"hearing",title:"DHS Oversight Hearing",desc:"Senate Judiciary — Secretary of Homeland Security testifies on border operations and ICE enforcement",billId:"b15"},
{id:"ce10",date:"2026-03-12",type:"vote",title:"FY2027 Budget Resolution",desc:"House Budget Committee vote on framework for FY2027 appropriations process"},
{id:"ce11",date:"2026-03-17",type:"markup",title:"HALT Fentanyl Act Full Committee",desc:"House Energy & Commerce full committee markup — expected to advance to the floor",billId:"b10"},
{id:"ce12",date:"2026-03-24",type:"hearing",title:"SCOTUS Oral Arguments: Texas v. DOE",desc:"Supreme Court hears case on DOE renewable energy mandates for federal facilities"},
{id:"ce13",date:"2026-03-26",type:"deadline",title:"Reconciliation Instruction Deadline",desc:"House Budget must set FY2027 reconciliation instructions or miss leadership's target window"},
{id:"ce14",date:"2026-04-01",type:"vote",title:"Born-Alive Act Floor Vote",desc:"House floor vote expected after Judiciary subcommittee markup — largely party-line result anticipated",billId:"b9"},
{id:"ce15",date:"2026-04-06",type:"deadline",title:"Congressional Recess Begins",desc:"Spring recess — both chambers recess through April 20. No floor votes during this period"},
{id:"ce16",date:"2026-04-15",type:"hearing",title:"SCOTUS Oral Arguments: Students for Fair Admissions v. Harvard (Endowment)",desc:"Supreme Court hears university endowment tax-exempt status case"},
{id:"ce17",date:"2026-04-21",type:"markup",title:"Fix Our Forests Act Markup",desc:"House Natural Resources and Agriculture joint markup on NEPA streamlining for forest management",billId:"b13"},
{id:"ce18",date:"2026-05-01",type:"deadline",title:"FY2027 Appropriations Subcommittee Deadline",desc:"Appropriations subcommittees must report bills to full committee by this date per leadership's schedule"},
];

// Session milestones
const sessionInfo=[
{label:"119th Congress began",date:"Jan 3, 2025",done:true},
{label:"Spring Recess",date:"Apr 6–20, 2026",done:false},
{label:"Memorial Day Recess",date:"May 25–Jun 1, 2026",done:false},
{label:"July 4th Recess",date:"Jul 3–13, 2026",done:false},
{label:"August Recess",date:"Aug 3–Sep 7, 2026",done:false},
{label:"119th Congress adjourns",date:"Jan 3, 2027",done:false},
];

function CalendarScreen({nav}){
const[filter,setFilter]=useState("All");
const[hoveredId,setHoveredId]=useState(null);
const typeLabel={vote:"Floor Vote",hearing:"Hearing",markup:"Markup",deadline:"Deadline"};
const today=new Date("2026-03-10T12:00:00");
const filtered=allCalEvents
.filter(e=>filter==="All"||e.type===filter)
.sort((a,b)=>new Date(a.date)-new Date(b.date));

// Group events by month
const grouped=filtered.reduce((acc,e)=>{
const d=new Date(e.date+"T12:00:00");
const key=d.toLocaleDateString("en-US",{month:"long",year:"numeric"});
if(!acc[key])acc[key]=[];
acc[key].push(e);
return acc;
},{});

return(<div>
{/* Header */}
<div style={{marginBottom:22}}>
<div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(66,133,244,0.08)",border:"1px solid rgba(66,133,244,0.2)",borderRadius:9999,padding:"4px 14px",marginBottom:12}}>
<Calendar size={11} color="#4285F4" strokeWidth={1.5}/>
<span style={{fontFamily:F.mono,fontSize:10,color:"#4285F4",letterSpacing:0.5}}>119th Congressional Session</span>
</div>
<div style={{fontFamily:F.display,fontSize:28,fontWeight:200,color:C.text,letterSpacing:"-0.5px",lineHeight:1.1}}>Legislative Calendar</div>
<div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.textM,marginTop:4}}>Upcoming votes, hearings, markups, and deadlines.</div>
</div>

{/* Session snapshot */}
<div style={{background:"linear-gradient(135deg,#1a73e8,#1557b0)",borderRadius:20,padding:"16px 18px",marginBottom:20}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"rgba(255,255,255,0.6)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>119th Congress · Session Schedule</div>
<div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
{sessionInfo.map((s,i)=><div key={i} style={{flexShrink:0,background:s.done?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.12)",borderRadius:12,padding:"9px 13px",minWidth:110,border:"1px solid rgba(255,255,255,0.12)"}}>
<div style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:"rgba(255,255,255,0.75)",lineHeight:1.3,marginBottom:3}}>{s.label}</div>
<div style={{fontFamily:F.mono,fontSize:9,color:s.done?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.9)",fontWeight:s.done?400:500}}>{s.date}</div>
{s.done&&<div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.35)",marginTop:2}}>PAST</div>}
</div>)}
</div>
</div>

{/* Type filter pills */}
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
{["All","vote","hearing","markup","deadline"].map(t=>{
const col=t==="All"?C.accent2:CAL_COLOR[t]||C.textM;
const active=filter===t;
return(<button key={t} onClick={()=>setFilter(t)} style={{all:"unset",cursor:"pointer",padding:"6px 16px",borderRadius:9999,fontFamily:F.body,fontSize:12,fontWeight:300,background:active?col:C.card,color:active?"#fff":C.text2,border:"1px solid "+(active?col:C.border),transition:"all 0.15s"}}>
{t==="All"?"All Events":typeLabel[t]||t}
</button>);})}
</div>

{/* Events grouped by month */}
{Object.entries(grouped).map(([month,events])=>(
<div key={month} style={{marginBottom:24}}>
<div style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:C.textM,letterSpacing:1.2,textTransform:"uppercase",marginBottom:12,paddingBottom:6,borderBottom:"1px solid "+C.border}}>{month}</div>
{events.map(e=>{
const d=new Date(e.date+"T12:00:00");
const typeColor=CAL_COLOR[e.type]||C.textM;
const isPast=d<today;
const isToday=d.toDateString()===today.toDateString();
const billRef=e.billId?bills.find(b=>b.id===e.billId):null;
const weekday=d.toLocaleDateString("en-US",{weekday:"short"});
const month2=d.toLocaleDateString("en-US",{month:"short"}).toUpperCase();
return(
<div key={e.id} onClick={e.billId?()=>nav("billDetail",e.billId):undefined}
onMouseEnter={e.billId?()=>setHoveredId(e.id):undefined}
onMouseLeave={e.billId?()=>setHoveredId(null):undefined}
style={{cursor:e.billId?"pointer":"default",background:isPast?"#fafafa":C.card,borderRadius:16,marginBottom:8,border:"1px solid "+(e.urgent?"rgba(234,67,53,0.3)":C.border),overflow:"hidden",display:"flex",opacity:isPast?0.65:1,transform:hoveredId===e.id?"translateY(-1px)":"translateY(0)",boxShadow:hoveredId===e.id?"0 6px 18px rgba(0,0,0,0.1)":isToday?"0 0 0 2px "+typeColor+"40,0 2px 10px rgba(0,0,0,0.06)":"0 1px 4px rgba(60,64,67,0.06)",transition:"box-shadow 0.15s,transform 0.15s"}}>
{/* Left color bar */}
<div style={{width:4,background:typeColor,flexShrink:0}}/>
<div style={{display:"flex",gap:12,padding:"14px 16px",flex:1,minWidth:0,alignItems:"flex-start"}}>
{/* Date box */}
<div style={{background:isToday?typeColor:typeColor+"12",borderRadius:12,padding:"8px 9px",textAlign:"center",flexShrink:0,minWidth:48}}>
<div style={{fontFamily:F.mono,fontSize:8,color:isToday?"rgba(255,255,255,0.7)":typeColor,textTransform:"uppercase",letterSpacing:0.5}}>{month2}</div>
<div style={{fontFamily:F.body,fontSize:22,fontWeight:200,color:isToday?"#fff":typeColor,lineHeight:1}}>{d.getDate()}</div>
<div style={{fontFamily:F.body,fontSize:9,fontWeight:300,color:isToday?"rgba(255,255,255,0.7)":C.textM,marginTop:2}}>{weekday}</div>
</div>
{/* Content */}
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,flexWrap:"wrap"}}>
<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:typeColor,textTransform:"uppercase",letterSpacing:0.8}}>{typeLabel[e.type]||e.type}</span>
{isToday&&<span style={{fontFamily:F.mono,fontSize:8,color:"#fff",background:"#34A853",padding:"1px 7px",borderRadius:9999}}>TODAY</span>}
{e.urgent&&<span style={{fontFamily:F.body,fontSize:9,fontWeight:500,color:"#fff",background:"#EA4335",padding:"2px 8px",borderRadius:9999}}>URGENT</span>}
{isPast&&<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,background:C.bg2,padding:"1px 6px",borderRadius:9999}}>PAST</span>}
</div>
<div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text,lineHeight:1.35,marginBottom:4}}>{e.title}</div>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.5}}>{e.desc}</div>
{billRef&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:7}}>
<StatusBadge status={billRef.status}/>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{billRef.num}</span>
<span style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.navy,marginLeft:2}}>View bill →</span>
</div>}
</div>
</div>
</div>);})}
</div>
))}

{filtered.length===0&&<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>No events match this filter</div>}

{/* Bill updates */}
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1.2,textTransform:"uppercase",marginBottom:12,marginTop:4,paddingTop:16,borderTop:"1px solid "+C.border}}>Recent Legislative Updates</div>
{billUpdates.map((u,i)=>{
const billRef=u.billId?bills.find(b=>b.id===u.billId):null;
return(<div key={i} onClick={u.billId?()=>nav("billDetail",u.billId):undefined} style={{cursor:u.billId?"pointer":"default",background:C.card,borderRadius:14,padding:"12px 16px",marginBottom:8,border:"1px solid "+C.border,display:"flex",gap:10,alignItems:"flex-start"}}>
<div style={{width:3,background:C.accent2,borderRadius:2,flexShrink:0,alignSelf:"stretch",minHeight:28}}/>
<div style={{flex:1}}>
<div style={{fontFamily:F.body,color:C.text,fontSize:13,fontWeight:400}}>{u.title}</div>
<div style={{fontFamily:F.body,color:C.text2,fontSize:11,fontWeight:300,marginTop:3,lineHeight:1.5}}>{u.desc}</div>
<div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
<div style={{fontFamily:F.mono,color:C.textM,fontSize:9}}>{u.date}</div>
{billRef&&<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,background:C.bg2,padding:"1px 5px",borderRadius:9999,border:"1px solid "+C.border}}>{billRef.num}</span>}
</div>
</div>
</div>);})}

</div>);}

function WatchlistScreen({nav,wb,toggleB,wm,toggleM,profile,isPremium}){
const[tab,setTab]=useState("bills");
const wBills=bills.filter(b=>wb.includes(b.id));const wMems=members.filter(m=>wm.includes(m.id));
return(<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
<div style={{fontFamily:F.display,fontSize:24,fontWeight:400,color:C.text}}>Saved</div>
{profile&&<span style={{fontFamily:F.body,fontSize:11,color:C.accent,fontWeight:600}}>{profile.first} {profile.lastInit}.</span>}
</div>
<div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
{[["bills","Bills ("+wBills.length+")"],["following","Following ("+wMems.length+")"],["digest","Digest"]].map(([k,l])=>(
<button key={k} onClick={()=>setTab(k)} style={{all:"unset",cursor:"pointer",padding:"7px 20px",fontFamily:F.body,fontSize:13,fontWeight:500,borderRadius:20,background:tab===k?C.navy:C.card,color:tab===k?C.textW:C.text2,border:"1px solid "+(tab===k?C.navy:C.border),display:"flex",alignItems:"center",gap:6}}>
{l}
{k==="digest"&&!isPremium&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
</button>
))}
</div>

{tab==="bills"&&(wBills.length===0
?<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>Bookmark bills to see them here</div>
:wBills.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={true} onToggle={toggleB} nav={nav}/>))}

{tab==="following"&&(<div>
{wMems.length===0
?<div style={{textAlign:"center",color:C.textM,padding:40}}>
<div style={{fontSize:12,fontFamily:F.body,marginBottom:8}}>Follow lawmakers to see their activity here</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.textM}}>Tap the bookmark on any member profile to follow them</div>
</div>
:<div>
{wMems.map(m=>{
const activity=genActivity(m).slice(0,2);
return(<div key={m.id} style={{background:C.card,borderRadius:12,padding:"14px 16px",marginBottom:8,border:"1px solid "+C.border,boxShadow:"0 1px 2px rgba(60,64,67,0.06)"}}>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:activity.length>0?10:0}}>
<div onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10,flex:1}}>
<Avatar bio={m.bio} name={m.name} size={36}/>
<div><div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.text}}>{m.pre} {m.name}</div><div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><PartyBadge party={m.party}/><span style={{fontFamily:F.body,fontSize:11,color:C.textM}}>{m.state}{m.dist?"-"+m.dist:""}</span></div></div>
</div>
<button onClick={()=>toggleM(m.id)} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:C.textM,padding:"4px 10px",borderRadius:20,border:"1px solid "+C.border}}>Unfollow</button>
</div>
{activity.map((a,i)=>(
<div key={i} style={{display:"flex",gap:8,padding:"7px 0",borderTop:"1px solid "+C.border}}>
<div style={{width:2,borderRadius:2,background:a.type==="sponsored"?C.accent2:a.type==="vote"?C.success:C.textM,flexShrink:0,marginTop:2}}/>
<div style={{flex:1}}>
<div style={{fontFamily:F.body,fontSize:12,color:C.text}}>{a.title}</div>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginTop:1}}>{fS(a.date)}</div>
</div>
</div>
))}
</div>);
})}
</div>}
</div>)}

{tab==="digest"&&(<div>
{!isPremium
?<div>
<div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:16,padding:"24px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(26,115,232,0.12)",pointerEvents:"none"}}/>
<div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.4)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Member Feature</div>
<div style={{fontFamily:F.display,fontSize:18,fontWeight:500,color:"#fff",lineHeight:1.3,marginBottom:8}}>Your weekly intelligence digest</div>
<div style={{fontFamily:F.body,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.65,marginBottom:16}}>Every Sunday: what moved in Congress, what to watch next, and a sharp take on what it all means — personalized to the bills and lawmakers you follow.</div>
<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
{[["What moved this week","Ranked by significance, not noise"],["What matters next","Upcoming votes and deadlines that actually affect you"],["One sharp read","A paragraph that tells you what to pay attention to and why"]].map(([t,d])=>(
<div key={t} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
<div style={{width:16,height:16,borderRadius:16,background:"rgba(26,115,232,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
</div>
<div><div style={{fontFamily:F.body,fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.85)"}}>{t}</div><div style={{fontFamily:F.body,fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{d}</div></div>
</div>
))}
</div>
<button style={{all:"unset",cursor:"pointer",padding:"10px 24px",borderRadius:20,fontSize:13,fontFamily:F.body,fontWeight:600,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",boxShadow:"0 4px 16px rgba(245,158,11,0.35)"}}>Upgrade to Member</button>
</div>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Preview — Week of Feb 9</div>
{weeklyDigest.movedBills.slice(0,1).map(item=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} style={{background:C.card,borderRadius:12,padding:"14px 16px",marginBottom:8,border:"1px solid "+C.border,opacity:0.6,pointerEvents:"none"}}>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Moved this week</div>
<div style={{fontFamily:F.display,fontSize:14,fontWeight:500,color:C.text,marginBottom:4}}>{item.headline}</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.5,filter:"blur(3px)"}}>{item.context}</div>
</div>):null;})}
</div>
:<div>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Week of {weeklyDigest.weekOf}</div>

<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.accent2,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>What moved this week</div>
{weeklyDigest.movedBills.map(item=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} onClick={()=>nav("billDetail",item.billId)} style={{cursor:"pointer",paddingBottom:10,marginBottom:10,borderBottom:"1px solid "+C.border}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><StatusBadge status={b.status}/><span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{b.num}</span></div>
<div style={{fontFamily:F.display,fontSize:14,fontWeight:500,color:C.text,marginBottom:4}}>{item.headline}</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.55}}>{item.context}</div>
</div>):null;})}
</div>

<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.success,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Bills to watch next</div>
{weeklyDigest.watchNext.map((item,i)=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} onClick={()=>nav("billDetail",item.billId)} style={{cursor:"pointer",display:"flex",gap:10,paddingBottom:i<weeklyDigest.watchNext.length-1?10:0,marginBottom:i<weeklyDigest.watchNext.length-1?10:0,borderBottom:i<weeklyDigest.watchNext.length-1?"1px solid "+C.border:"none"}}>
<div style={{width:3,borderRadius:2,background:C.success,flexShrink:0,marginTop:3}}/>
<div><div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>{b.title}</div><div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.5}}>{item.reason}</div></div>
</div>):null;})}
</div>

<div style={{background:C.navy+"0a",borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.navy+"25"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.navy,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>The one thing to know</div>
<div style={{fontFamily:F.body,fontSize:13,color:C.text,lineHeight:1.65}}>{weeklyDigest.insight}</div>
</div>

{wMems.length>0&&weeklyDigest.followedActivity.filter(a=>wMems.some(m=>m.id===a.memberId)).length>0&&(
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>From lawmakers you follow</div>
{weeklyDigest.followedActivity.filter(a=>wMems.some(m=>m.id===a.memberId)).map((a,i,arr)=>{const mem=members.find(m=>m.id===a.memberId);return mem?(<div key={i} onClick={()=>nav("memberProfile",a.memberId)} style={{cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start",paddingBottom:i<arr.length-1?10:0,marginBottom:i<arr.length-1?10:0,borderBottom:i<arr.length-1?"1px solid "+C.border:"none"}}>
<Avatar bio={mem.bio} name={mem.name} size={32}/>
<div style={{flex:1}}><div style={{fontFamily:F.body,fontSize:12,fontWeight:600,color:C.text}}>{mem.pre} {mem.name} <span style={{fontWeight:400,color:C.textM}}>· {a.date}</span></div><div style={{fontFamily:F.body,fontSize:12,color:C.text2,marginTop:2}}>{a.note}</div></div>
</div>):null;})}
</div>)}
</div>}
</div>)}
</div>)}

function ProfileScreen({profile,setProfile,wb,wm,user,onSignOut,isPremium,setIsPremium,switchTab}){
// ── state ──────────────────────────────────────────────────
const[editing,setEditing]=useState(false);
const[draftName,setDraftName]=useState(profile?.displayName||user?.user_metadata?.full_name||user?.email?.split("@")[0]||"");
const[draftAge,setDraftAge]=useState(profile?.age||"");
const[draftState,setDraftState]=useState(profile?.state||"");
const[draftRace,setDraftRace]=useState(profile?.race||"");
const[interests,setInterests]=useState(profile?.interests||[]);
const[codeInput,setCodeInput]=useState("");
const[codeError,setCodeError]=useState("");
const[codeSuccess,setCodeSuccess]=useState("");
const[signOutConfirm,setSignOutConfirm]=useState(false);
const[saved,setSaved]=useState(false);

// ── derived ─────────────────────────────────────────────────
const PREMIUM_CODE="CIVLY2026";
const avatar=user?.user_metadata?.avatar_url;
const authName=user?.user_metadata?.full_name||user?.email?.split("@")[0]||"User";
const displayName=profile?.displayName||authName;
const email=user?.email||"Guest";
const provider=user?.app_metadata?.provider||"email";
const initials=displayName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?";

const ageRanges=["18–24","25–34","35–44","45–54","55–64","65+"];
const races=["American Indian or Alaska Native","Asian","Black or African American","Hispanic or Latino","Native Hawaiian or Pacific Islander","White","Two or More Races","Prefer not to say"];

// ── handlers ────────────────────────────────────────────────
const saveProfile=()=>{
  const updated={...(profile||{}),displayName:draftName,age:draftAge,state:draftState,race:draftRace,interests,first:draftName.split(" ")[0]||draftName,lastInit:(draftName.split(" ")[1]||"")[0]||""};
  setProfile(updated);
  setEditing(false);
  setSaved(true);
  setTimeout(()=>setSaved(false),2200);
};
const cancelEdit=()=>{
  setDraftName(profile?.displayName||authName);
  setDraftAge(profile?.age||"");
  setDraftState(profile?.state||"");
  setDraftRace(profile?.race||"");
  setInterests(profile?.interests||[]);
  setEditing(false);
};
const toggleInterest=name=>{
  setInterests(prev=>prev.includes(name)?prev.filter(x=>x!==name):[...prev,name]);
};
const submitCode=()=>{
  if(codeInput.trim().toUpperCase()===PREMIUM_CODE){setIsPremium(true);setCodeSuccess("Member access unlocked!");setCodeError("");setCodeInput("");}
  else{setCodeError("Invalid code. Try again.");setCodeSuccess("");}
};
const revokeAccess=()=>{setIsPremium(false);setCodeSuccess("");setCodeError("");};
const handleSignOut=()=>{
  if(!signOutConfirm){setSignOutConfirm(true);return;}
  onSignOut();
};

// ── sub-renders ──────────────────────────────────────────────
const Row=({label,value,children})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid "+C.border}}>
    <span style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text2}}>{label}</span>
    {children||<span style={{fontFamily:F.body,fontSize:13,color:value?C.text:C.textM}}>{value||"—"}</span>}
  </div>
);
const Field=({label,value,set,type="text",opts})=>(
  <div style={{marginBottom:14}}>
    <div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>{label}</div>
    {opts
      ?<select value={value} onChange={e=>set(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:C.bg2,color:value?C.text:C.textM,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",fontSize:13,fontFamily:F.body,outline:"none",cursor:"pointer"}}>
          <option value="">Select…</option>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      :<input value={value} onChange={e=>set(e.target.value)} type={type} style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:10,padding:"10px 14px",fontSize:13,fontFamily:F.body,color:C.text,outline:"none"}}/>
    }
  </div>
);

return(<div>

{/* ── Hero header ── */}
<div style={{background:"linear-gradient(135deg,#1a73e8 0%,#1557b0 100%)",borderRadius:20,padding:"24px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
  <div style={{position:"absolute",bottom:-20,left:60,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
  <div style={{display:"flex",alignItems:"center",gap:16,position:"relative"}}>
    {avatar
      ?<img src={avatar} alt="" style={{width:68,height:68,borderRadius:68,objectFit:"cover",border:"2px solid rgba(255,255,255,0.3)",flexShrink:0}} referrerPolicy="no-referrer"/>
      :<div style={{width:68,height:68,borderRadius:68,background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontFamily:F.display,color:"#fff",fontSize:24,fontWeight:200}}>{initials}</span>
      </div>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:F.display,color:"#fff",fontSize:20,fontWeight:200,letterSpacing:"-0.3px",lineHeight:1.2}}>{displayName}</div>
      <div style={{fontFamily:F.body,color:"rgba(255,255,255,0.65)",fontSize:12,fontWeight:300,marginTop:3}}>{email}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
        {provider==="google"&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:9999,padding:"3px 10px",fontSize:10,fontFamily:F.body,color:"rgba(255,255,255,0.85)"}}>
          <svg width="9" height="9" viewBox="0 0 48 48"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
          Google
        </span>}
        {provider==="apple"&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:9999,padding:"3px 10px",fontSize:10,fontFamily:F.body,color:"rgba(255,255,255,0.85)"}}>Apple</span>}
        {provider==="email"&&<span style={{display:"inline-flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:9999,padding:"3px 10px",fontSize:10,fontFamily:F.body,color:"rgba(255,255,255,0.85)"}}>Email</span>}
        {isPremium&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#F9AB00",background:"rgba(249,171,0,0.18)",padding:"3px 10px",borderRadius:9999,letterSpacing:0.5,border:"1px solid rgba(249,171,0,0.3)"}}>MEMBER</span>}
      </div>
    </div>
    <button onClick={()=>setEditing(e=>!e)} style={{all:"unset",cursor:"pointer",padding:"7px 16px",borderRadius:9999,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",fontFamily:F.body,fontSize:12,fontWeight:300,color:"#fff",flexShrink:0}}>
      {editing?"Cancel":"Edit"}
    </button>
  </div>
  {saved&&<div style={{marginTop:12,padding:"6px 14px",background:"rgba(52,168,83,0.25)",borderRadius:9999,border:"1px solid rgba(52,168,83,0.4)",display:"inline-flex",alignItems:"center",gap:6}}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    <span style={{fontFamily:F.body,fontSize:11,color:"#4ade80",fontWeight:300}}>Profile saved</span>
  </div>}
</div>

{/* ── Activity stats ── */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
{[["Bills Saved",wb.length,"#4285F4","saved"],["Following",wm.length,"#34A853","members"],["Interests",interests.length,"#F9AB00",null]].map(([l,n,col,dest])=>(
  <div key={l} onClick={dest?()=>switchTab(dest):undefined} style={{background:C.card,borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid "+C.border,cursor:dest?"pointer":"default"}}>
    <div style={{fontFamily:F.display,color:col,fontSize:26,fontWeight:200,lineHeight:1}}>{n}</div>
    <div style={{fontFamily:F.mono,fontSize:8,fontWeight:500,color:C.textM,textTransform:"uppercase",letterSpacing:0.8,marginTop:5}}>{l}</div>
  </div>
))}
</div>

{/* ── Edit form ── */}
{editing&&<div style={{background:C.card,borderRadius:16,border:"1px solid #4285F430",padding:"18px 16px",marginBottom:16,boxShadow:"0 0 0 3px rgba(66,133,244,0.07)"}}>
  <div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#4285F4",letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Edit Profile</div>
  <Field label="Display Name" value={draftName} set={setDraftName}/>
  <Field label="Age Range" value={draftAge} set={setDraftAge} opts={ageRanges}/>
  <Field label="State" value={draftState} set={setDraftState} opts={allSt}/>
  <Field label="Race / Ethnicity" value={draftRace} set={setDraftRace} opts={races}/>
  <div style={{display:"flex",gap:8,marginTop:4}}>
    <button onClick={saveProfile} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"11px 0",background:"#4285F4",color:"#fff",borderRadius:9999,fontSize:13,fontFamily:F.body,fontWeight:400}}>Save Changes</button>
    <button onClick={cancelEdit} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"11px 0",background:C.bg2,color:C.text2,borderRadius:9999,fontSize:13,fontFamily:F.body,fontWeight:300,border:"1px solid "+C.border}}>Cancel</button>
  </div>
</div>}

{/* ── Profile details (read mode) ── */}
{!editing&&<div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,marginBottom:16,overflow:"hidden"}}>
  <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
    <div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Profile Details</div>
  </div>
  <div style={{padding:"0 16px 4px"}}>
    <Row label="Name" value={displayName}/>
    <Row label="Email" value={email}/>
    <Row label="Age Range" value={profile?.age}/>
    <Row label="State" value={profile?.state}/>
    <Row label="Race / Ethnicity" value={profile?.race}/>
  </div>
</div>}

{/* ── Topic interests ── */}
<div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,marginBottom:16,overflow:"hidden"}}>
  <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div>
      <div style={{fontFamily:F.body,fontSize:14,fontWeight:400,color:C.text}}>Topic Interests</div>
      <div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.textM,marginTop:2}}>Select topics to personalize your feed</div>
    </div>
    {interests.length>0&&<span style={{fontFamily:F.mono,fontSize:9,color:"#4285F4",background:"rgba(66,133,244,0.08)",padding:"2px 9px",borderRadius:9999,border:"1px solid rgba(66,133,244,0.2)"}}>{interests.length} selected</span>}
  </div>
  <div style={{padding:"14px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
    {trending.map((t,i)=>{
      const col=TOPIC_COLORS[i%TOPIC_COLORS.length];
      const on=interests.includes(t.name);
      return(<button key={t.name} onClick={()=>toggleInterest(t.name)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,padding:"6px 13px",borderRadius:9999,background:on?col:C.bg2,color:on?"#fff":C.text2,border:"1px solid "+(on?col:C.border),fontFamily:F.body,fontSize:11,fontWeight:300,transition:"all 0.15s"}}>
        {on&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        {t.name}
      </button>);
    })}
  </div>
</div>

{/* ── Member access ── */}
<div style={{background:C.card,borderRadius:16,border:"1px solid "+(isPremium?"rgba(249,171,0,0.35)":C.border),marginBottom:16,overflow:"hidden"}}>
  <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div>
      <div style={{fontFamily:F.body,fontSize:14,fontWeight:400,color:C.text,display:"flex",alignItems:"center",gap:8}}>
        Member Access
        {isPremium&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#D97706",background:"#FEF3C7",padding:"2px 8px",borderRadius:9999}}>ACTIVE</span>}
      </div>
      <div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.textM,marginTop:2}}>{isPremium?"Intel, Digest, and all premium features unlocked.":"Enter your access code to unlock premium features."}</div>
    </div>
    {isPremium&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
  </div>
  {isPremium
    ?<div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span style={{fontFamily:F.body,color:C.success,fontSize:13,fontWeight:300}}>All features unlocked</span>
      </div>
      <button onClick={revokeAccess} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:C.textM,padding:"4px 10px",borderRadius:9999,border:"1px solid "+C.border}}>Remove</button>
    </div>
    :<div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",gap:8}}>
        <input value={codeInput} onChange={e=>{setCodeInput(e.target.value);setCodeError("");setCodeSuccess("");}} onKeyDown={e=>e.key==="Enter"&&submitCode()} placeholder="ENTER CODE" style={{flex:1,background:C.bg2,border:"1px solid "+(codeError?"#EA4335":C.border),borderRadius:10,padding:"10px 14px",fontSize:12,fontFamily:F.mono,color:C.text,outline:"none",letterSpacing:2,textTransform:"uppercase"}}/>
        <button onClick={submitCode} style={{all:"unset",cursor:"pointer",padding:"10px 20px",background:"#4285F4",color:"#fff",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:400,flexShrink:0}}>Unlock</button>
      </div>
      {codeError&&<div style={{fontFamily:F.body,fontSize:11,color:"#EA4335",marginTop:8,display:"flex",alignItems:"center",gap:5}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {codeError}
      </div>}
      {codeSuccess&&<div style={{fontFamily:F.body,fontSize:11,color:"#34A853",marginTop:8}}>{codeSuccess}</div>}
    </div>}
</div>

{/* ── About ── */}
<div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,marginBottom:16,overflow:"hidden"}}>
  <div style={{padding:"14px 16px",borderBottom:"1px solid "+C.border}}>
    <div style={{fontFamily:F.body,fontSize:14,fontWeight:400,color:C.text}}>About Civly</div>
  </div>
  {[
    ["Version","1.0.0 · 119th Congress"],
    ["Data sources","Congress.gov · OpenSecrets · FEC"],
    ["Coverage","January 2025 – present"],
    ["Mission","Non-partisan legislative tracking for every American"],
  ].map(([l,v])=>(
    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid "+C.border}}>
      <span style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text2}}>{l}</span>
      <span style={{fontFamily:F.body,fontSize:12,color:C.text,textAlign:"right",maxWidth:"60%"}}>{v}</span>
    </div>
  ))}
</div>

{/* ── Sign out ── */}
{!signOutConfirm
  ?<button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 0",background:C.card,borderRadius:16,border:"1px solid "+C.border,marginBottom:24}}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    <span style={{fontFamily:F.body,fontSize:13,fontWeight:400,color:"#EA4335"}}>Sign out</span>
  </button>
  :<div style={{background:"rgba(234,67,53,0.05)",borderRadius:16,border:"1px solid rgba(234,67,53,0.25)",padding:"18px 20px",marginBottom:24,textAlign:"center"}}>
    <div style={{fontFamily:F.body,fontSize:14,fontWeight:400,color:C.text,marginBottom:4}}>Sign out of Civly?</div>
    <div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text2,marginBottom:16}}>Your saved bills and preferences will be kept.</div>
    <div style={{display:"flex",gap:10}}>
      <button onClick={()=>setSignOutConfirm(false)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"11px 0",background:C.bg2,color:C.text2,borderRadius:9999,fontSize:13,fontFamily:F.body,fontWeight:300,border:"1px solid "+C.border}}>Cancel</button>
      <button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"11px 0",background:"#EA4335",color:"#fff",borderRadius:9999,fontSize:13,fontFamily:F.body,fontWeight:400,boxShadow:"0 4px 12px rgba(234,67,53,0.3)"}}>Yes, sign out</button>
    </div>
  </div>}

</div>)}


// ═══ SCOTUS / BILL DETAIL / MEMBER PROFILE ═══
function SCOTUSScreen({nav}){
const[filter,setFilter]=useState("All");const[sel,setSel]=useState(null);const[showJustices,setShowJustices]=useState(false);
const filtered=filter==="All"?scotusCases:scotusCases.filter(c=>c.status===filter.toLowerCase());
const stColor=s=>s==="decided"?C.success:s==="argued"?C.accent2:C.accent;
const stLabel=s=>s==="decided"?"Decided":s==="argued"?"Argued":"Pending";
if(sel){const c=scotusCases.find(x=>x.id===sel);if(!c)return null;return(<div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div onClick={()=>setSel(null)} style={{cursor:"pointer",padding:4}}><Icon name="back" size={20} color={C.text}/></div><div style={{flex:1,minWidth:0}}><div style={{fontFamily:F.display,color:C.text,fontSize:16}}>{c.name}</div><div style={{fontFamily:F.mono,color:C.textM,fontSize:10}}>Docket {c.docket}</div></div><span style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:stColor(c.status),textTransform:"uppercase",background:stColor(c.status)+"14",padding:"2px 8px",borderRadius:100}}>{stLabel(c.status)}</span></div>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Question</div>
<div style={{fontFamily:F.body,color:C.text,fontSize:13,lineHeight:"1.6",marginBottom:16}}>{c.question}</div>
<div style={{display:"flex",gap:0,marginBottom:16,background:C.card,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid "+C.border}}>{[["Topic",c.topic,C.accent2],["Impact",c.impact,c.impact==="High"?C.accent:C.accent2],[c.status==="decided"?"Decided":"Oral Arg.",fS(c.decided||c.arg),C.text]].map(([l,v,col],i)=><div key={l} style={{flex:1,textAlign:"center",padding:"12px 8px",borderRight:i<2?"1px solid "+C.border:"none"}}><div style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div><div style={{fontFamily:F.body,fontSize:12,fontWeight:600,color:col,marginTop:3}}>{v}</div></div>)}</div>
{c.result&&<><div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Ruling</div><div style={{fontFamily:F.body,color:C.text,fontSize:13,lineHeight:"1.6",marginBottom:16}}>{c.result}</div></>}
{c.majority.length>0&&<div style={{display:"flex",gap:0,marginBottom:16,background:C.card,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid "+C.border}}>
<div style={{flex:1,padding:14,borderRight:c.dissent.length>0?"1px solid "+C.border:"none"}}><div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.success,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Majority ({c.majority.length})</div>{c.majority.map(j=><div key={j} style={{fontFamily:F.body,color:C.text,fontSize:12,marginBottom:2}}>{j}</div>)}</div>
{c.dissent.length>0&&<div style={{flex:1,padding:14}}><div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Dissent ({c.dissent.length})</div>{c.dissent.map(j=><div key={j} style={{fontFamily:F.body,color:C.text,fontSize:12,marginBottom:2}}>{j}</div>)}</div>}
</div>}
{!c.result&&<div style={{textAlign:"center",padding:20,background:C.bg2,borderRadius:14}}><div style={{fontFamily:F.body,color:C.text2,fontSize:12}}>{c.status==="argued"?"Awaiting decision":"Oral arguments "+fD(c.arg)}</div></div>}
</div>);}
return(<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
<div><div style={{fontFamily:F.display,fontSize:20,color:C.text}}>The Court</div><div style={{fontFamily:F.mono,color:C.textM,fontSize:9,letterSpacing:1}}>SCOTUS Tracker</div></div>
<button onClick={()=>setShowJustices(!showJustices)} style={{all:"unset",cursor:"pointer",padding:"5px 12px",borderRadius:100,fontSize:11,fontFamily:F.body,fontWeight:500,background:showJustices?C.navy:C.bg2,color:showJustices?C.textW:C.text2}}>Justices</button>
</div>
{showJustices&&<div style={{marginBottom:12,background:C.card,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid "+C.border}}>{justices.map((j,i)=><div key={j.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:i<justices.length-1?"1px solid "+C.border:"none"}}><div><div style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:600}}>{j.name}</div><div style={{fontFamily:F.body,color:C.textM,fontSize:10}}>{j.role} · {j.appointed}</div></div><span style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:j.lean.includes("Liberal")?PC.democrat:j.lean.includes("Center")?C.accent2:PC.republican}}>{j.lean}</span></div>)}</div>}
<div style={{display:"flex",gap:4,marginBottom:12}}>{scotusStages.map(s=><button key={s} onClick={()=>setFilter(s)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"6px 4px",fontFamily:F.body,fontSize:11,fontWeight:500,borderRadius:10,background:filter===s?C.navy:C.bg2,color:filter===s?C.textW:C.text2}}>{s}</button>)}</div>
{filtered.length===0?<div style={{textAlign:"center",color:C.textM,padding:30,fontSize:12,fontFamily:F.body}}>No cases match</div>:
filtered.map(c=><div key={c.id} onClick={()=>setSel(c.id)} style={{cursor:"pointer",background:C.card,borderRadius:14,padding:14,marginBottom:8,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid "+C.border}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontFamily:F.mono,color:C.accent2,fontSize:10,fontWeight:500}}>{c.docket}</span><span style={{fontFamily:F.mono,fontSize:8,fontWeight:500,color:stColor(c.status),textTransform:"uppercase",background:stColor(c.status)+"14",padding:"1px 6px",borderRadius:100}}>{stLabel(c.status)}</span>{c.impact==="High"&&<span style={{fontFamily:F.mono,fontSize:8,fontWeight:500,color:C.accent,background:C.accent+"14",padding:"1px 6px",borderRadius:100}}>HIGH</span>}</div>
<div style={{fontFamily:F.display,color:C.text,fontSize:14,lineHeight:"1.3",marginBottom:4}}>{c.name}</div>
<div style={{fontFamily:F.body,color:C.text2,fontSize:11,lineHeight:"1.4",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{c.question}</div>
<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}><span style={{fontFamily:F.body,color:C.textM,fontSize:10}}>{c.topic}</span>{c.majority.length>0&&<span style={{fontFamily:F.mono,color:C.textM,fontSize:10}}>{c.majority.length}-{c.dissent.length}</span>}<span style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginLeft:"auto"}}>{fS(c.decided||c.arg)}</span></div>
</div>)}
</div>)}

function BillDetailScreen({billId,nav,wb,toggleB}){
const bill=bills.find(b=>b.id===billId);if(!bill)return <div style={{padding:20,fontFamily:F.body,color:C.textM}}>Bill not found</div>;
const sp=getSp(bill);const co=getCo(bill);
const[expandedVote,setExpandedVote]=useState(null);
const toggleVote=chamber=>{setExpandedVote(v=>v===chamber?null:chamber);};
const bInf=INFLUENCE.bills[bill.id];const spInf=sp?INFLUENCE.members[sp.id]:null;

// Related bills — same category, exclude self
const related=bills.filter(b=>b.id!==bill.id&&b.cat===bill.cat).slice(0,3);

// Days since introduced
const daysIn=bill.intro?Math.floor((new Date()-new Date(bill.intro+"T12:00:00"))/(1000*60*60*24)):null;

// Legislative pipeline stages in order
const PIPE=[
  {key:"introduced",label:"Introduced",short:"Intro"},
  {key:"in_committee",label:"Committee",short:"Cmte"},
  {key:"on_the_floor",label:"Floor",short:"Floor"},
  {key:"passed_house",label:"Passed House",short:"House"},
  {key:"passed_senate",label:"Passed Senate",short:"Senate"},
  {key:"signed_into_law",label:"Signed",short:"Signed"},
];
const PIPE_FAILED=[{key:"introduced",label:"Introduced",short:"Intro"},{key:"in_committee",label:"Committee",short:"Cmte"},{key:"failed",label:"Failed / Vetoed",short:"Failed"}];
const failed=bill.status==="failed"||bill.status==="vetoed";
const pipe=failed?PIPE_FAILED:PIPE;
const pipeIdx=pipe.findIndex(s=>s.key===bill.status);

// "What happens next" contextual copy
const NEXT_COPY={
  introduced:"Referred to committee — members will decide whether to hold hearings or advance it.",
  in_committee:"Under committee review. A markup session schedules a vote to move it to the floor.",
  on_the_floor:"On the floor for a full chamber vote. Passage requires a simple majority.",
  passed_house:"Passed the House. The Senate must now pass an identical version or a conference committee reconciles differences.",
  passed_senate:"Passed both chambers. Goes to the President to sign into law or veto.",
  signed_into_law:"Enacted. Federal agencies begin implementation; legal challenges may follow.",
  passed:"Passed both chambers — awaiting presidential signature.",
  failed:"Did not advance. Sponsors may reintroduce in the next congressional session.",
  vetoed:"Vetoed by the President. Congress can override with a 2/3 majority in both chambers.",
};

// Recent bill updates
const recentUpdates=billUpdates.filter(u=>u.billId===bill.id);

return(<div>
{/* ── Top row: bill number + save ── */}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:bInf?6:8}}>
<span style={{fontFamily:F.mono,color:C.accent2,fontSize:12,fontWeight:500,background:C.accent2+"0f",padding:"3px 10px",borderRadius:100,border:"1px solid "+C.accent2+"30"}}>{bill.num}</span>
<SaveBtn active={wb.includes(bill.id)} onToggle={()=>toggleB(bill.id)} size={20}/>
</div>

{/* ── Influence signal badges ── */}
{bInf&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
<InfluenceBadge type="lobbying" label={fMoney(bInf.totalLobby)+" lobbied"}/>
{bInf.industries[0]&&<InfluenceBadge type="donor" label={bInf.industries[0].name}/>}
{bInf.directInferred==="inferred"&&<InfluenceBadge type="outside" label="Inferred"/>}
</div>}

{/* ── Hero gradient card ── */}
<div style={{background:"linear-gradient(135deg, "+C.navy+" 0%, "+C.navyLight+" 100%)",borderRadius:20,padding:"20px 18px",marginBottom:14}}>
<StatusBadge status={bill.status} light/>
<div style={{fontFamily:F.display,fontSize:20,color:C.textW,lineHeight:"1.3",marginTop:8,fontWeight:200,letterSpacing:"-0.3px"}}>{bill.title}</div>
{sp&&<div onClick={e=>{e.stopPropagation();nav("memberProfile",sp.id);}} style={{display:"flex",alignItems:"center",gap:8,marginTop:12,cursor:"pointer",opacity:1}} onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
<Avatar bio={sp.bio} name={sp.name} size={24}/>
<div>
<div style={{fontFamily:F.body,color:C.textW,fontSize:12,fontWeight:400}}>{sp.pre} {sp.name}</div>
<div style={{display:"flex",alignItems:"center",gap:4}}><PD party={sp.party} size={5}/><span style={{color:"rgba(255,255,255,0.6)",fontSize:10,fontFamily:F.body}}>{sp.party} · {sp.state}</span></div>
{spInf&&<div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
{spInf.topIndustries.slice(0,2).map((ind,i)=><span key={i} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:9999,background:"rgba(255,255,255,0.1)",fontFamily:F.body,fontSize:9,fontWeight:300,color:"rgba(255,255,255,0.75)",border:"1px solid rgba(255,255,255,0.15)"}}>
<span style={{width:4,height:4,borderRadius:"50%",background:ind.color,flexShrink:0}}/>
{ind.name}
</span>)}
</div>}
</div>
</div>}
</div>

{/* ── Meta strip: category · chamber · days · co-sponsors ── */}
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
{bill.cat&&<span style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,background:C.bg2,padding:"4px 11px",borderRadius:9999,border:"1px solid "+C.border}}>{bill.cat}</span>}
{sp&&<span style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,background:C.bg2,padding:"4px 11px",borderRadius:9999,border:"1px solid "+C.border}}>{sp.chamber==="Senate"?"Senate bill":"House bill"}</span>}
{daysIn!==null&&<span style={{fontFamily:F.mono,fontSize:10,color:C.textM,background:C.bg2,padding:"4px 11px",borderRadius:9999,border:"1px solid "+C.border}}>{daysIn}d in progress</span>}
{co.length>0&&<span style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,background:C.bg2,padding:"4px 11px",borderRadius:9999,border:"1px solid "+C.border}}>{co.length} co-sponsor{co.length!==1?"s":""}</span>}
{bill.budget&&<span style={{fontFamily:F.mono,fontSize:10,fontWeight:500,color:C.accent,background:C.accent+"0d",padding:"4px 11px",borderRadius:9999,border:"1px solid "+C.accent+"22"}}>{bill.budget}</span>}
</div>

{/* ── Legislative progress pipeline ── */}
<div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:16,border:"1px solid "+C.border}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Legislative Progress</div>
<div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:4}}>
{pipe.map((s,i)=>{
const done=pipeIdx>i||(bill.status===s.key);
const active=bill.status===s.key;
const color=active?(SC[s.key]||C.accent2):done?"#34A853":C.textM;
return(<div key={s.key} style={{display:"flex",alignItems:"center",flex:i<pipe.length-1?1:0,minWidth:0}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:40}}>
<div style={{width:active?28:20,height:active?28:20,borderRadius:"50%",background:active?color:done?color+"22":C.bg2,border:"2px solid "+(done||active?color:C.border),display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0}}>
{done&&!active&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
{active&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
</div>
<span style={{fontFamily:F.mono,fontSize:8,color:active?color:done?C.text2:C.textM,fontWeight:active?600:400,textAlign:"center",lineHeight:1.2,whiteSpace:"nowrap"}}>{s.short}</span>
</div>
{i<pipe.length-1&&<div style={{flex:1,height:2,background:done&&pipeIdx>i?"#34A853":C.bg2,minWidth:6,marginBottom:16,borderRadius:1}}/>}
</div>);})}
</div>
</div>

{/* ── Summary ── */}
<div style={{fontFamily:F.body,color:C.text2,fontSize:13,lineHeight:"1.65",marginBottom:16}}>{bill.sum}</div>

{/* ── What happens next ── */}
{NEXT_COPY[bill.status]&&<div style={{background:"rgba(66,133,244,0.05)",borderRadius:14,padding:"12px 16px",marginBottom:16,border:"1px solid rgba(66,133,244,0.14)",display:"flex",gap:12,alignItems:"flex-start"}}>
<div style={{flexShrink:0,marginTop:1}}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
</div>
<div>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#4285F4",letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>What Happens Next</div>
<div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text,lineHeight:1.6}}>{NEXT_COPY[bill.status]}</div>
</div>
</div>}

{/* ── Money & Lobbying snapshot ── */}
<BillMoneySnapshot billId={bill.id}/>

{/* ── Co-Sponsors ── */}
{co.length>0&&<>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Co-Sponsors</div>
<div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:8,marginLeft:-16,paddingLeft:16,marginRight:-16,paddingRight:16}} className="civly-scroll">
{co.map(m=>{const coInf=INFLUENCE.members[m.id];return(<div key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:52}}>
<Avatar bio={m.bio} name={m.name} size={32}/>
<span style={{fontFamily:F.body,color:C.text2,fontSize:9,textAlign:"center"}}>{m.name.split(" ").pop()}</span>
{coInf&&<span style={{fontFamily:F.mono,fontSize:7,color:"#7C3AED",background:"rgba(124,58,237,0.07)",padding:"1px 5px",borderRadius:9999,border:"1px solid rgba(124,58,237,0.15)"}}>{fMoney(coInf.careerTotal)}</span>}
</div>);})}
</div>
{bInf&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>Sponsors' top donors:</span>
{[...new Set(co.slice(0,3).flatMap(m=>INFLUENCE.members[m.id]?.topIndustries.slice(0,1)||[]).map(i=>i.name))].slice(0,3).map((name,i)=>{const ind=Object.values(INFLUENCE.members).flatMap(m=>m.topIndustries).find(x=>x.name===name);return ind?<DonorIndustryChip key={i} name={name} color={ind.color}/>:null;})}
</div>}
</>}

{/* ── Vote Tally ── */}
{bill.votes&&(bill.votes.house||bill.votes.senate)&&<>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5}}>Vote Tally <span style={{fontFamily:F.body,fontSize:10,textTransform:"none",letterSpacing:0,fontWeight:400,color:C.textM}}>— click to see who crossed party lines</span></div>
{bill.votes.house&&<>
<VoteBar label="House" yea={bill.votes.house.yea} nay={bill.votes.house.nay} abstain={bill.votes.house.abstain} onClick={()=>toggleVote("house")} expanded={expandedVote==="house"} breakCount={(bill.votes.house.dBreak||[]).length+(bill.votes.house.rBreak||[]).length}/>
{expandedVote==="house"&&<VoteBreakdown bill={bill} voteData={bill.votes.house} chamber="House" nav={nav}/>}
</>}
{bill.votes.senate&&<>
<VoteBar label="Senate" yea={bill.votes.senate.yea} nay={bill.votes.senate.nay} abstain={bill.votes.senate.abstain} onClick={()=>toggleVote("senate")} expanded={expandedVote==="senate"} breakCount={(bill.votes.senate.dBreak||[]).length+(bill.votes.senate.rBreak||[]).length}/>
{expandedVote==="senate"&&<VoteBreakdown bill={bill} voteData={bill.votes.senate} chamber="Senate" nav={nav}/>}
</>}
</>}

{/* ── Key Provisions ── */}
{bill.keyProv&&<><div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Key Provisions</div>
<div style={{background:C.card,borderRadius:14,padding:"10px 14px",marginBottom:14,border:"1px solid "+C.border}}>
{bill.keyProv.map((p,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<bill.keyProv.length-1?"1px solid "+C.border:"none"}}>
<div style={{width:6,height:6,borderRadius:"50%",background:"#4285F4",flexShrink:0,marginTop:4}}/>
<span style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:300,lineHeight:"1.55"}}>{p}</span>
</div>)}
</div></>}

{/* ── Impact + Budget ── */}
{(bill.impact||bill.budget)&&<div style={{display:"grid",gridTemplateColumns:bill.impact&&bill.budget?"1fr 1fr":"1fr",gap:10,marginBottom:14}}>
{bill.impact&&<div style={{background:C.card,borderRadius:14,padding:"12px 14px",border:"1px solid "+C.border}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Impact</div>
<div style={{fontFamily:F.body,color:C.text2,fontSize:11,fontWeight:300,lineHeight:1.55}}>{bill.impact}</div>
</div>}
{bill.budget&&<div style={{background:"rgba(234,67,53,0.04)",borderRadius:14,padding:"12px 14px",border:"1px solid rgba(234,67,53,0.12)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.accent,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Budget Impact</div>
<div style={{fontFamily:F.mono,color:C.accent,fontSize:12,fontWeight:600,lineHeight:1.4}}>{bill.budget}</div>
</div>}
</div>}

{/* ── Timeline with spike markers ── */}
{bill.tl&&<><div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Timeline</div>
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:14,border:"1px solid "+C.border}}>
{bill.tl.map((t,i)=>{
const spike=bInf?.spikes?.find(s=>s.step===i);
const isCurrent=t.cur;
return(<div key={i}>
<div style={{display:"flex",gap:10,marginBottom:12}}>
<div style={{display:"flex",flexDirection:"column",alignItems:"center",width:14}}>
<div style={{width:isCurrent?10:8,height:isCurrent?10:8,borderRadius:10,background:t.done?SC[t.s]||C.accent:C.bg2,border:t.done?"none":"2px solid "+C.border,flexShrink:0,boxShadow:isCurrent?"0 0 0 3px "+(SC[t.s]||C.accent)+"22":"none"}}/>
{(i<bill.tl.length-1||spike)&&<div style={{width:1,flex:1,background:C.border,marginTop:3}}/>}
</div>
<div style={{flex:1,paddingBottom:2}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<span style={{fontFamily:F.body,color:isCurrent?C.accent2:C.text,fontSize:12,fontWeight:isCurrent?500:400}}>{t.desc}</span>
{isCurrent&&<span style={{fontFamily:F.mono,fontSize:8,color:"#fff",background:C.accent2,padding:"1px 7px",borderRadius:9999}}>NOW</span>}
</div>
<div style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginTop:2}}>{fD(t.d)}</div>
</div>
</div>
{spike&&<LobbyingSpikeMarker spike={spike}/>}
</div>);})}
</div></>}

{/* ── Recent Updates ── */}
{recentUpdates.length>0&&<>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Recent Updates</div>
{recentUpdates.map((u,i)=><div key={i} style={{background:C.card,borderRadius:12,padding:"11px 14px",marginBottom:6,border:"1px solid "+C.border,display:"flex",gap:10,alignItems:"flex-start"}}>
<div style={{width:3,borderRadius:2,background:C.accent2,flexShrink:0,alignSelf:"stretch",minHeight:32}}/>
<div>
<div style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:400}}>{u.title}</div>
<div style={{fontFamily:F.body,color:C.text2,fontSize:11,fontWeight:300,marginTop:2,lineHeight:1.5}}>{u.desc}</div>
<div style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginTop:4}}>{u.date}</div>
</div>
</div>)}
<div style={{height:8}}/>
</>}

{/* ── Related Bills ── */}
{related.length>0&&<>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>Related Bills · {bill.cat}</div>
{related.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={wb.includes(b.id)} onToggle={toggleB} nav={nav} compact/>)}
</>}

</div>)}

function MemberProfileScreen({memberId,nav,wm,toggleM,isPremium}){
const mem=members.find(m=>m.id===memberId);if(!mem)return <div style={{padding:20,fontFamily:F.body,color:C.textM}}>Member not found</div>;
const[tab,setTab]=useState("bills");
const memBills=bills.filter(b=>b.spId===mem.id||b.coIds?.includes(mem.id));
const votes=genVotes(mem.id);const activity=genActivity(mem);
const ideology=getIdeology(mem.pos);
const isFollowing=wm.includes(mem.id);
return(<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
<div/>
<button onClick={()=>toggleM(mem.id)} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:20,fontSize:12,fontFamily:F.body,fontWeight:500,background:isFollowing?C.navy:C.card,color:isFollowing?C.textW:C.text2,border:"1px solid "+(isFollowing?C.navy:C.border),transition:"all 0.15s"}}>
<svg width="12" height="12" viewBox="0 0 24 24" fill={isFollowing?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
{isFollowing?"Following":"Follow"}
</button>
</div>

<div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:16}}>
<Avatar bio={mem.bio} name={mem.name} size={72}/>
<div style={{fontFamily:F.display,color:C.text,fontSize:20,marginTop:10}}>{mem.pre} {mem.name}</div>
<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><PartyBadge party={mem.party}/><span style={{fontFamily:F.body,color:C.textM,fontSize:12}}>{mem.state}{mem.dist?"-"+mem.dist:""} · {mem.chamber}</span></div>
<div style={{fontFamily:F.mono,color:C.textM,fontSize:10,marginTop:3}}>{mem.yrs}yr{mem.yrs!==1?"s":""} in office · {mem.phone}</div>
{ideology&&<div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,padding:"4px 12px",borderRadius:100,background:ideology.color+"14",border:"1px solid "+ideology.color+"30"}}>
<span style={{width:6,height:6,borderRadius:6,background:ideology.color,display:"inline-block"}}/>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:500,color:ideology.color}}>{ideology.label}</span>
</div>}
{/* ── Compact money snapshot below ideology badge ── */}
{INFLUENCE.members[mem.id]&&<div style={{marginTop:10,width:"100%",maxWidth:340}}>
<MemberMoneySnapshot memberId={mem.id} compact/>
</div>}
</div>

<div style={{display:"flex",gap:0,marginBottom:14,background:C.bg2,borderRadius:12,padding:3}}>
{[["bills","Bills"],["votes","Votes"],["activity","Activity"],["intel","Intel"]].map(([k,l])=>(
<button key={k} onClick={()=>setTab(k)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"7px 0",fontFamily:F.body,fontSize:12,fontWeight:600,borderRadius:10,background:tab===k?C.card:"transparent",color:tab===k?C.text:C.text2,boxShadow:tab===k?"0 1px 2px rgba(0,0,0,0.06)":"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
{l}
{k==="intel"&&!isPremium&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
</button>
))}
</div>

{tab==="bills"&&(memBills.length===0?<div style={{color:C.textM,fontSize:12,fontFamily:F.body,padding:20,textAlign:"center"}}>No sponsored bills</div>:memBills.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} nav={nav} compact/>))}
{tab==="votes"&&votes.map((v,i)=><div key={i} style={{background:C.card,borderRadius:12,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",border:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{flex:1}}><div style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:600}}>{v.title}</div><div style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginTop:2}}>{v.num} · {fS(v.date)}</div></div><div style={{textAlign:"right"}}><span style={{fontFamily:F.mono,fontSize:11,fontWeight:600,color:v.vote==="Yea"?C.success:v.vote==="Nay"?C.error:C.textM}}>{v.vote}</span><div style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{v.outcome}</div></div></div>)}
{tab==="activity"&&activity.map((a,i)=><div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid "+C.border}}>
<div style={{width:3,borderRadius:2,background:a.type==="sponsored"?C.accent2:a.type==="vote"?C.success:C.textM,flexShrink:0}}/>
<div><div style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:600}}>{a.title}</div><div style={{fontFamily:F.body,color:C.text2,fontSize:11,marginTop:1}}>{a.desc}</div><div style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginTop:2}}>{fS(a.date)}</div></div></div>)}

{tab==="intel"&&(<div>
{/* Ideology snapshot — free */}
{ideology&&<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Ideology Snapshot</div>
<div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
<div style={{position:"relative",width:64,height:64,flexShrink:0}}>
<svg viewBox="0 0 64 64" width="64" height="64">
<circle cx="32" cy="32" r="28" fill="none" stroke={C.bg2} strokeWidth="8"/>
<circle cx="32" cy="32" r="28" fill="none" stroke={ideology.color} strokeWidth="8"
strokeDasharray={`${ideology.score*1.759} 175.9`} strokeDashoffset="43.97" strokeLinecap="round"/>
</svg>
<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
<span style={{fontFamily:F.mono,fontSize:13,fontWeight:700,color:ideology.color}}>{ideology.score}</span>
</div>
</div>
<div>
<div style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:ideology.color,marginBottom:2}}>{ideology.label}</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.5}}>Strongest on <b style={{color:C.text}}>{ideology.topIssues[0]}</b> and <b style={{color:C.text}}>{ideology.topIssues[1]}</b>.</div>
<div style={{fontFamily:F.body,fontSize:11,color:C.text2,marginTop:2}}>Most moderate on <b style={{color:C.text}}>{ideology.bottomIssues[0]}</b>.</div>
</div>
</div>
<div style={{height:6,borderRadius:3,background:"linear-gradient(90deg,"+PC.republican+",#9CA3AF,"+PC.democrat+")",marginBottom:6,position:"relative"}}>
<div style={{position:"absolute",top:-3,width:12,height:12,borderRadius:12,background:ideology.color,border:"2px solid "+C.card,boxShadow:"0 1px 4px rgba(0,0,0,0.2)",left:"calc("+ideology.score+"% - 6px)",transition:"left 0.3s"}}/>
</div>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:F.mono,fontSize:8,color:PC.republican}}>Conservative</span><span style={{fontFamily:F.mono,fontSize:8,color:PC.democrat}}>Progressive</span></div>
</div>}

{/* Issue alignment — free */}
{mem.pos&&<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Issue Positions</div>
{Object.entries(mem.pos).map(([k,v])=><div key={k} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontFamily:F.body,color:C.text,fontSize:12}}>{k}</span><span style={{fontFamily:F.mono,color:C.textM,fontSize:10}}>{v}%</span></div><div style={{height:4,background:C.bg2,borderRadius:2,overflow:"hidden"}}><div style={{width:v+"%",height:"100%",borderRadius:2,background:v>66?PC.democrat:v>33?C.accent2:PC.republican}}/></div></div>)}
</div>}

{/* ── Money & Influence — always visible ── */}
{INFLUENCE.members[mem.id]&&(()=>{const mInf=INFLUENCE.members[mem.id];return(
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Money & Influence</div>
<MemberMoneySnapshot memberId={mem.id}/>
{/* Top donors */}
{mInf.topDonors&&<><div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,marginTop:4}}>Top Disclosed Donors</div>
{mInf.topDonors.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<mInf.topDonors.length-1?"1px solid "+C.border:"none"}}>
<span style={{width:5,height:5,borderRadius:"50%",background:d.type==="small-dollar"?"#34A853":"#4285F4",flexShrink:0}}/>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{d.name}</span>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fMoney(d.amount)}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:d.type==="small-dollar"?"#34A853":"#4285F4",background:(d.type==="small-dollar"?"#34A853":"#4285F4")+"12",padding:"1px 6px",borderRadius:9999}}>{d.type}</span>
</div>)}</>}
{/* Outside spending */}
{mInf.outsideOrgs?.length>0&&<><div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,marginTop:12}}>Outside Spending</div>
{mInf.outsideOrgs.map((o,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<mInf.outsideOrgs.length-1?"1px solid "+C.border:"none"}}>
<span style={{width:5,height:5,borderRadius:"50%",background:o.type==="support"?C.success:C.error,flexShrink:0}}/>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{o.org}</span>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fMoney(o.amount)}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:o.type==="support"?C.success:C.error,background:(o.type==="support"?C.success:C.error)+"12",padding:"1px 6px",borderRadius:9999}}>{o.type}</span>
</div>)}</>}
{/* Lobbying pressure */}
{mInf.lobbyPressure?.length>0&&<><div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8,marginTop:12}}>Lobbying Pressure by Issue</div>
{mInf.lobbyPressure.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<mInf.lobbyPressure.length-1?"1px solid "+C.border:"none"}}>
<span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{p.issue}</span>
<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{p.orgs} orgs · {fMoney(p.spend)}</span>
<span style={{fontFamily:F.mono,fontSize:8,color:p.direction==="aligned"?C.success:C.error,background:(p.direction==="aligned"?C.success:C.error)+"12",padding:"1px 7px",borderRadius:9999}}>{p.direction}</span>
</div>)}</>}
<div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.55,marginTop:12,fontStyle:"italic"}}>"{mInf.explanation}"</div>
<ConfidenceBadge confidence={mInf.confidence} directInferred={mInf.directInferred} source={mInf.source}/>
</div>);})()||null}

{/* Premium-locked sections */}
{!isPremium&&<>
<PremiumGate
title="Sponsorship trends & voting patterns"
desc={"See which topics "+mem.name.split(" ")[0]+" sponsors most, how their voting record has shifted over time, and which bills they're likely to support next."}
/>
<PremiumGate
title="Recent statements on legislation"
desc={"Floor speeches, committee remarks, and press statements tied directly to active bills — so you know where "+mem.name.split(" ")[0]+" actually stands, not just how they vote."}
/>
</>}

{isPremium&&<>
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Sponsorship Focus</div>
{Object.entries(mem.pos).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([topic,score],i)=>(
<div key={topic} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<2?8:0}}>
<span style={{fontFamily:F.mono,fontSize:10,color:C.textM,minWidth:14}}>{i+1}</span>
<div style={{flex:1}}><div style={{fontFamily:F.body,fontSize:12,color:C.text}}>{topic}</div><div style={{height:3,borderRadius:2,background:C.bg2,marginTop:3,overflow:"hidden"}}><div style={{width:score+"%",height:"100%",background:C.accent2}}/></div></div>
<span style={{fontFamily:F.mono,fontSize:10,color:C.textM}}>{score}%</span>
</div>
))}
</div>
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Recent Statements</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.6,fontStyle:"italic"}}>"No recent public statements on active legislation found."</div>
</div>
</>}
</div>)}
</div>)}


// ═══ APP SHELL — Newspaper UI Kit ═══
export default function CivlyApp(){
const[tab,setTab]=useState("home");const[stack,setStack]=useState([]);
const[profile,setProfile]=useState(null);
const[user,setUser]=useState(null);const[authChecked,setAuthChecked]=useState(false);const[guestMode,setGuestMode]=useState(false);const[isPremium,setIsPremiumState]=useState(()=>localStorage.getItem("civly-premium")==="1");
const setIsPremium=v=>{setIsPremiumState(v);if(v)localStorage.setItem("civly-premium","1");else localStorage.removeItem("civly-premium");};
const[wb,setWb]=useState(["b1","b3"]);const[wm,setWm]=useState(["m17","m3"]);
const[membersReady,setMembersReady]=useState(false);
useEffect(()=>{
// Subscribe to auth state
const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setAuthChecked(true);});
(async()=>{
try{const b=await storage.get("civly-watchlist-bills");if(b)setWb(JSON.parse(b.value));}catch(e){}
try{const m=await storage.get("civly-watchlist-members");if(m)setWm(JSON.parse(m.value));}catch(e){}
try{const p=await storage.get("civly-profile");if(p)setProfile(JSON.parse(p.value));}catch(e){}
// Fetch all current Congress members and merge with static data
try{
  const fetched=await fetchAllMembers();
  const staticBios=new Set(staticMembers.map(m=>m.bio).filter(Boolean));
  const newOnes=fetched.filter(m=>!staticBios.has(m.bio));
  members=[...staticMembers,...newOnes];
}catch(e){console.warn("Could not load all members:",e);}
setMembersReady(true);
})();
return()=>subscription.unsubscribe();
},[]);
const saveProfile=useCallback(p=>{setProfile(p);try{if(p)storage.set("civly-profile",JSON.stringify(p));else storage.delete("civly-profile");}catch(e){}},[]);
const signOut=useCallback(async()=>{await supabase.auth.signOut();setUser(null);},[]);
const toggleB=useCallback(id=>setWb(p=>{const nv=p.includes(id)?p.filter(x=>x!==id):[...p,id];try{storage.set("civly-watchlist-bills",JSON.stringify(nv));}catch(e){}return nv;}),[]);
const toggleM=useCallback(id=>setWm(p=>{const nv=p.includes(id)?p.filter(x=>x!==id):[...p,id];try{storage.set("civly-watchlist-members",JSON.stringify(nv));}catch(e){}return nv;}),[]);
const nav=useCallback((action,param)=>{if(action==="back")setStack(s=>s.slice(0,-1));else setStack(s=>[...s,{type:action,id:param}])},[]);
const switchTab=useCallback(t=>{setTab(t);setStack([])},[]);
const cur=stack.length>0?stack[stack.length-1]:null;
const tabDefs=[{key:"home",label:"Home",icon:"home",color:"#4285F4"},{key:"members",label:"Members",icon:"person",color:"#34A853"},{key:"search",label:"Search",icon:"search",color:"#4285F4"},{key:"scotus",label:"Court",icon:"gavel",color:"#EA4335"},{key:"pulse",label:"Calendar",icon:"calendar",color:"#4285F4"},{key:"saved",label:"Saved",icon:"bookmark",color:"#34A853"},{key:"profile",label:"Profile",icon:"person",color:"#4285F4"}];
const screen=()=>{
if(cur?.type==="billDetail")return <BillDetailScreen billId={cur.id} nav={nav} wb={wb} toggleB={toggleB}/>;
if(cur?.type==="memberProfile")return <MemberProfileScreen memberId={cur.id} nav={nav} wm={wm} toggleM={toggleM} isPremium={isPremium}/>;
if(cur?.type==="browseMembers")return <BrowseMembersScreen nav={nav} wm={wm} toggleM={toggleM}/>;
if(cur?.type==="topicDetail"){const topic=trending.find(t=>t.name===cur.id);if(topic)return <TopicDetailScreen topic={topic} nav={nav} wb={wb} toggleB={toggleB}/>;}
switch(tab){case"home":return <HomeScreen nav={nav} wb={wb} toggleB={toggleB}/>;case"members":return <MembersScreen nav={nav} wm={wm} toggleM={toggleM}/>;case"scotus":return <SCOTUSScreen nav={nav}/>;case"search":return <SearchScreen nav={nav} wm={wm} toggleM={toggleM}/>;case"pulse":return <CalendarScreen nav={nav}/>;case"saved":return <WatchlistScreen nav={nav} wb={wb} toggleB={toggleB} wm={wm} toggleM={toggleM} profile={profile} isPremium={isPremium}/>;case"profile":return <ProfileScreen profile={profile} setProfile={saveProfile} wb={wb} wm={wm} user={user} onSignOut={signOut} isPremium={isPremium} setIsPremium={setIsPremium} switchTab={switchTab}/>;default:return null}};
// Show loading while checking auth, then show auth screen if no user
if(!authChecked)return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#4285f4,#1a73e8)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(26,115,232,0.35)"}}><span style={{color:"#fff",fontWeight:700,fontSize:20,fontFamily:F.display}}>C</span></div><div style={{fontFamily:F.body,color:C.textM,fontSize:13}}>Loading…</div></div></div>);
if(!user&&!guestMode)return <AuthScreen onContinueAsGuest={()=>setGuestMode(true)}/>;
return(
<div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body}}>

{/* ── Top Header ── */}
<div style={{position:"fixed",top:0,left:0,right:0,height:60,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",gap:16,padding:"0 24px",zIndex:200,boxShadow:"0 1px 8px rgba(60,64,67,0.06)"}}>
  {/* Logo */}
  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,minWidth:200}}>
    <div style={{width:34,height:34,borderRadius:10,background:"#4285F4",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(66,133,244,0.35)"}}>
      <span style={{color:"#fff",fontWeight:500,fontSize:15,fontFamily:F.body}}>C</span>
    </div>
    <div>
      <div style={{fontFamily:F.display,fontSize:17,fontWeight:300,color:C.text,lineHeight:1,letterSpacing:"-0.3px"}}>Civly</div>
      <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:1.2,textTransform:"uppercase",marginTop:1}}>119th Congress</div>
    </div>
  </div>
  {/* Search Bar */}
  <div style={{flex:1,maxWidth:680,position:"relative"}}>
    <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><SearchIcon size={16} color={C.textM} strokeWidth={1.5}/></div>
    <input placeholder="Search bills, members, topics..." style={{width:"100%",background:C.bg2,border:"1.5px solid transparent",borderRadius:9999,padding:"9px 20px 9px 44px",fontSize:13,fontFamily:F.body,fontWeight:300,color:C.text,outline:"none",transition:"all 0.2s"}} onFocus={e=>{e.target.style.background="#fff";e.target.style.borderColor="#4285F4";e.target.style.boxShadow="0 0 0 3px rgba(66,133,244,0.1)"}} onBlur={e=>{e.target.style.background=C.bg2;e.target.style.borderColor="transparent";e.target.style.boxShadow="none"}}/>
  </div>
  {/* User area */}
  <div style={{marginLeft:"auto",flexShrink:0}}>
    {(()=>{const avatar=user?.user_metadata?.avatar_url;const name=user?.user_metadata?.full_name||user?.email||"";const initials=(name.split(" ").map(n=>n[0]).join("").slice(0,2)||"?").toUpperCase();return(<div onClick={()=>switchTab("profile")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
      {avatar?<img src={avatar} alt="avatar" style={{width:34,height:34,borderRadius:9999,objectFit:"cover",border:"2px solid "+C.border}} referrerPolicy="no-referrer"/>:<div style={{width:34,height:34,borderRadius:9999,background:"#4285F4",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(66,133,244,0.3)"}}><span style={{color:"#fff",fontSize:12,fontWeight:400,fontFamily:F.body}}>{initials}</span></div>}
    </div>);})()}
  </div>
</div>

{/* ── Body ── */}
<div style={{display:"flex",paddingTop:60}}>

  {/* ── Left Sidebar ── */}
  <div style={{width:240,position:"fixed",top:60,bottom:0,background:C.card,borderRight:"1px solid "+C.border,padding:"16px 0",overflowY:"auto",zIndex:100}}>
    {tabDefs.map(t=>{const isActive=tab===t.key;return(
      <div key={t.key} onClick={()=>switchTab(t.key)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:"0 12px",height:42,margin:"2px 10px",borderRadius:9999,background:isActive?t.color+"14":"transparent",transition:"background 0.15s"}} onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background=C.bg2}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent"}}>
        <div style={{width:32,height:32,borderRadius:9999,background:isActive?t.color+"18":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.15s"}}>
          <Icon name={t.icon} size={18} color={isActive?t.color:C.text2} strokeWidth={isActive?2:1.5}/>
        </div>
        <span style={{fontFamily:F.body,fontSize:13,fontWeight:isActive?400:300,color:isActive?t.color:C.text2,letterSpacing:"-0.1px"}}>{t.label}</span>
        {isActive&&<div style={{width:4,height:4,borderRadius:9999,background:t.color,marginLeft:"auto",flexShrink:0}}/>}
      </div>
    );})}
    <div style={{margin:"14px 18px",borderTop:"1px solid "+C.border}}/>
    {membersReady&&<div style={{padding:"4px 22px 8px",display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:6,height:6,borderRadius:9999,background:"#34A853",flexShrink:0}}/>
      <span style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:0.3}}>{members.length} members loaded</span>
    </div>}
  </div>

  {/* ── Main Content ── */}
  <div style={{marginLeft:240,flex:1,minHeight:"calc(100vh - 60px)",overflowY:"auto"}} className="civly-scroll">
    <div style={{maxWidth:860,margin:"0 auto",padding:"28px 32px"}}>
      {stack.length>0&&<button onClick={()=>nav("back")} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,marginBottom:20,color:"#4285F4",fontSize:13,fontFamily:F.body,fontWeight:300,padding:"7px 16px",borderRadius:9999,background:"rgba(66,133,244,0.08)",border:"1px solid rgba(66,133,244,0.2)"}}>
        <ChevronLeft size={15} color="#4285F4" strokeWidth={1.5}/> Back
      </button>}
      {screen()}
    </div>
  </div>

</div>

<style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=Roboto+Mono:wght@400;500&display=swap');body,html{margin:0;padding:0;font-family:Inter,system-ui,sans-serif}.civly-scroll::-webkit-scrollbar{width:5px}.civly-scroll::-webkit-scrollbar-track{background:transparent}.civly-scroll::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:3px}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}input::placeholder{color:#9aa0a6;font-weight:300}select{-webkit-appearance:auto}a{color:#4285F4}button{font-family:Inter,system-ui,sans-serif}`}</style>
</div>);}
