import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { fetchAllMembers, lookupByZip } from "./services/membersService";
import { fetchBillsFromAPI, fetchMembersFromAPI } from "./services/apiDataFetcher";
import { supabase } from "./services/supabase";
import AuthScreen from "./AuthScreen";
import { Home as HomeIcon, Search as SearchIcon, BarChart2, Bookmark, User, ChevronLeft, ChevronDown, ChevronUp, ChevronRight, X, Filter, Clock, Calendar, Check, Phone, Users, Gavel, Star, MapPin, TrendingUp, Lock, Flame, ArrowRight, Bell, FileText } from "lucide-react";
import { Hero } from "./app/components/Hero";
import { WeeklySchedule } from "./app/components/WeeklySchedule";
import { ActiveLegislation } from "./app/components/BillCards";
import { TopicFilters } from "./app/components/TopicFilters";

// localStorage shim
const storage={async get(k){const v=localStorage.getItem(k);return v?{key:k,value:v}:null},async set(k,v){localStorage.setItem(k,v);return{key:k,value:v}},async delete(k){localStorage.removeItem(k);return{key:k,deleted:true}}};

// ═══════════════════════════════════════════
// CIVLY — Online Newspaper for Congress
// Inspired by Blog/Newspaper UI Kit aesthetic
// ═══════════════════════════════════════════

const C = {
  bg: "#f0f2f7",
  bg2: "#e4e8f2",
  surface: "#ffffff",
  navy: "#0f1d3a",
  navyLight: "#1a3060",
  text: "#0d1117",
  text2: "#3d4a5c",
  textM: "#8492a6",
  textW: "#ffffff",
  accent: "#c41e3a",
  accent2: "#1a4db8",
  border: "#dde2ed",
  input: "#edf0f7",
  success: "#0d7a45",
  error: "#c41e3a",
  card: "#ffffff",
  cardShadow: "0 1px 2px rgba(15,29,58,0.04),0 4px 16px rgba(15,29,58,0.06)",
  cardShadowHover: "0 4px 12px rgba(15,29,58,0.08),0 16px 40px rgba(15,29,58,0.1)",
};
const PC = { democrat: "#1a4db8", republican: "#c41e3a", independent: "#6d28d9" };
const SC = { introduced: "#6d28d9", in_committee: "#b45309", on_the_floor: "#0369a1", passed_house: "#1a4db8", passed_senate: "#1a4db8", passed: "#15803d", signed_into_law: "#15803d", failed: "#c41e3a", vetoed: "#9b1c1c" };
const SL = { introduced: "Introduced", in_committee: "In Committee", on_the_floor: "On the Floor", passed_house: "Passed House", passed_senate: "Passed Senate", passed: "Passed Both", signed_into_law: "Signed into Law", failed: "Failed", vetoed: "Vetoed" };
const pc = p => PC[(p || "").toLowerCase()] || "#9CA3AF";
const pA = p => p === "Democrat" ? "D" : p === "Republican" ? "R" : p === "Independent" ? "I" : "O";
const fD = d => { if (!d) return ""; return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
const fS = d => { if (!d) return ""; return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
const imgUrl = id => "https://bioguide.congress.gov/photo/" + id + ".jpg";
const F = {
  display: "'DM Sans', system-ui, -apple-system, sans-serif",
  body: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};
const HERO_IMG="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/US_Capitol_west_side.JPG/1280px-US_Capitol_west_side.JPG";


const staticMembers=[
{id:"m1",name:"Chuck Schumer",pre:"Sen.",party:"Democrat",state:"NY",chamber:"Senate",phone:"(202) 224-6542",yrs:26,bio:"S000148",twitter:"SenSchumer",pos:{Healthcare:88,Environment:82,Economy:62,Defense:55,Education:85,Technology:78,Immigration:65}},
{id:"m2",name:"Mitch McConnell",pre:"Sen.",party:"Republican",state:"KY",chamber:"Senate",phone:"(202) 224-2541",yrs:40,bio:"M000355",twitter:"LeaderMcConnell",pos:{Healthcare:18,Environment:12,Economy:92,Defense:95,Education:22,Technology:45,Immigration:88}},
{id:"m3",name:"Bernie Sanders",pre:"Sen.",party:"Independent",state:"VT",chamber:"Senate",phone:"(202) 224-5141",yrs:18,bio:"S000033",twitter:"SenSanders",pos:{Healthcare:95,Environment:92,Economy:45,Defense:20,Education:95,Technology:72,Immigration:55}},
{id:"m4",name:"John Fetterman",pre:"Sen.",party:"Democrat",state:"PA",chamber:"Senate",phone:"(202) 224-4254",yrs:2,bio:"F000479",twitter:"JohnFetterman",pos:{Healthcare:82,Environment:75,Economy:58,Defense:50,Education:80,Technology:68,Immigration:70}},
{id:"m5",name:"Ted Cruz",pre:"Sen.",party:"Republican",state:"TX",chamber:"Senate",phone:"(202) 224-5922",yrs:12,bio:"C001098",twitter:"SenTedCruz",pos:{Healthcare:15,Environment:8,Economy:90,Defense:92,Education:20,Technology:55,Immigration:95}},
{id:"m6",name:"Elizabeth Warren",pre:"Sen.",party:"Democrat",state:"MA",chamber:"Senate",phone:"(202) 224-4543",yrs:12,bio:"W000817",twitter:"SenWarren",pos:{Healthcare:92,Environment:88,Economy:42,Defense:35,Education:95,Technology:82,Immigration:60}},
{id:"m7",name:"Marco Rubio",pre:"Sen.",party:"Republican",state:"FL",chamber:"Senate",phone:"(202) 224-3041",yrs:14,bio:"R000595",twitter:"SenRubioPress",pos:{Healthcare:22,Environment:15,Economy:85,Defense:94,Education:30,Technology:62,Immigration:80}},
{id:"m8",name:"John Thune",pre:"Sen.",party:"Republican",state:"SD",chamber:"Senate",phone:"(202) 224-2321",yrs:20,bio:"T000250",twitter:"SenJohnThune",pos:{Healthcare:20,Environment:14,Economy:88,Defense:90,Education:28,Technology:52,Immigration:85}},
{id:"m9",name:"Amy Klobuchar",pre:"Sen.",party:"Democrat",state:"MN",chamber:"Senate",phone:"(202) 224-3244",yrs:18,bio:"K000367",twitter:"amyklobuchar",pos:{Healthcare:85,Environment:80,Economy:65,Defense:58,Education:82,Technology:90,Immigration:62}},
{id:"m10",name:"Tim Scott",pre:"Sen.",party:"Republican",state:"SC",chamber:"Senate",phone:"(202) 224-6121",yrs:12,bio:"S001184",twitter:"SenatorTimScott",pos:{Healthcare:25,Environment:18,Economy:88,Defense:90,Education:45,Technology:65,Immigration:82}},
{id:"m11",name:"Katie Britt",pre:"Sen.",party:"Republican",state:"AL",chamber:"Senate",phone:"(202) 224-5744",yrs:2,bio:"B001319",twitter:"SenKatieBritt",pos:{Healthcare:30,Environment:15,Economy:85,Defense:88,Education:35,Technology:55,Immigration:92}},
{id:"m12",name:"Lisa Murkowski",pre:"Sen.",party:"Republican",state:"AK",chamber:"Senate",phone:"(202) 224-6665",yrs:22,bio:"M001153",twitter:"lisamurkowski",pos:{Healthcare:45,Environment:42,Economy:75,Defense:82,Education:50,Technology:58,Immigration:55}},
{id:"m13",name:"Jon Ossoff",pre:"Sen.",party:"Democrat",state:"GA",chamber:"Senate",phone:"(202) 224-3521",yrs:4,bio:"O000174",twitter:"SenOssoff",pos:{Healthcare:85,Environment:78,Economy:60,Defense:52,Education:80,Technology:88,Immigration:62}},
{id:"m14",name:"Susan Collins",pre:"Sen.",party:"Republican",state:"ME",chamber:"Senate",phone:"(202) 224-2523",yrs:28,bio:"C001035",twitter:"SenatorCollins",pos:{Healthcare:48,Environment:45,Economy:78,Defense:85,Education:52,Technology:62,Immigration:52}},
{id:"m15",name:"Mike Johnson",pre:"Rep.",party:"Republican",state:"LA",dist:"4",chamber:"House",phone:"(202) 225-2777",yrs:8,bio:"J000299",twitter:"SpeakerJohnson",pos:{Healthcare:15,Environment:10,Economy:88,Defense:92,Education:18,Technology:48,Immigration:90}},
{id:"m16",name:"Hakeem Jeffries",pre:"Rep.",party:"Democrat",state:"NY",dist:"8",chamber:"House",phone:"(202) 225-5936",yrs:12,bio:"J000294",twitter:"RepJeffriesNY",pos:{Healthcare:90,Environment:85,Economy:58,Defense:50,Education:88,Technology:82,Immigration:62}},
{id:"m17",name:"Alexandria Ocasio-Cortez",pre:"Rep.",party:"Democrat",state:"NY",dist:"14",chamber:"House",phone:"(202) 225-3965",yrs:6,bio:"O000172",twitter:"AOC",pos:{Healthcare:95,Environment:98,Economy:35,Defense:18,Education:95,Technology:85,Immigration:45}},
{id:"m18",name:"Chip Roy",pre:"Rep.",party:"Republican",state:"TX",dist:"21",chamber:"House",phone:"(202) 225-4236",yrs:6,bio:"R000614",twitter:"ChipRoyTX21",pos:{Healthcare:12,Environment:8,Economy:88,Defense:90,Education:15,Technology:42,Immigration:95}},
{id:"m19",name:"Tom Cole",pre:"Rep.",party:"Republican",state:"OK",dist:"4",chamber:"House",phone:"(202) 225-6165",yrs:22,bio:"C001053",twitter:"TomColeOK04",pos:{Healthcare:22,Environment:12,Economy:85,Defense:90,Education:28,Technology:50,Immigration:82}},
{id:"m20",name:"Nancy Pelosi",pre:"Rep.",party:"Democrat",state:"CA",dist:"11",chamber:"House",phone:"(202) 225-4965",yrs:38,bio:"P000197",twitter:"SpeakerPelosi",pos:{Healthcare:92,Environment:88,Economy:55,Defense:60,Education:90,Technology:80,Immigration:58}},
{id:"m21",name:"Mike Collins",pre:"Rep.",party:"Republican",state:"GA",dist:"10",chamber:"House",phone:"(202) 225-4101",yrs:2,bio:"C001133",twitter:"RepMikeCollins",pos:{Healthcare:15,Environment:8,Economy:85,Defense:88,Education:18,Technology:42,Immigration:95}},
{id:"m22",name:"Ro Khanna",pre:"Rep.",party:"Democrat",state:"CA",dist:"17",chamber:"House",phone:"(202) 225-2631",yrs:8,bio:"K000389",twitter:"RoKhanna",pos:{Healthcare:88,Environment:90,Economy:52,Defense:32,Education:85,Technology:95,Immigration:55}},
{id:"m23",name:"Jodey Arrington",pre:"Rep.",party:"Republican",state:"TX",dist:"19",chamber:"House",phone:"(202) 225-4005",yrs:8,bio:"A000375",twitter:"RepArrington",pos:{Healthcare:18,Environment:10,Economy:90,Defense:88,Education:22,Technology:48,Immigration:90}},
{id:"m24",name:"John James",pre:"Rep.",party:"Republican",state:"MI",dist:"10",chamber:"House",phone:"(202) 225-6276",yrs:2,bio:"J000302",twitter:"RepJohnJames",pos:{Healthcare:28,Environment:22,Economy:82,Defense:92,Education:32,Technology:65,Immigration:80}},
{id:"m25",name:"Dan Crenshaw",pre:"Rep.",party:"Republican",state:"TX",dist:"2",chamber:"House",phone:"(202) 225-6565",yrs:6,bio:"C001120",twitter:"DanCrenshawTX",pos:{Healthcare:20,Environment:12,Economy:85,Defense:96,Education:25,Technology:62,Immigration:88}},
{id:"m26",name:"Pramila Jayapal",pre:"Rep.",party:"Democrat",state:"WA",dist:"7",chamber:"House",phone:"(202) 225-3106",yrs:8,bio:"J000298",twitter:"RepJayapal",pos:{Healthcare:95,Environment:90,Economy:40,Defense:22,Education:92,Technology:82,Immigration:48}},
{id:"m27",name:"Rosa DeLauro",pre:"Rep.",party:"Democrat",state:"CT",dist:"3",chamber:"House",phone:"(202) 225-3661",yrs:34,bio:"D000216",twitter:"rosadelauro",pos:{Healthcare:92,Environment:88,Economy:52,Defense:48,Education:95,Technology:78,Immigration:55}},
{id:"m28",name:"Scott Fry",pre:"Rep.",party:"Republican",state:"SC",dist:"7",chamber:"House",phone:"(202) 225-9895",yrs:0,bio:"F000480",twitter:"RepRussellFry",pos:{Healthcare:18,Environment:8,Economy:85,Defense:88,Education:22,Technology:45,Immigration:88}},
{id:"m29",name:"Thomas Massie",pre:"Rep.",party:"Republican",state:"KY",dist:"4",chamber:"House",phone:"(202) 225-3465",yrs:12,bio:"M001184",twitter:"ThomasMassie",pos:{Healthcare:15,Environment:18,Economy:92,Defense:55,Education:12,Technology:65,Immigration:75}},
{id:"m30",name:"Jared Golden",pre:"Rep.",party:"Democrat",state:"ME",dist:"2",chamber:"House",phone:"(202) 225-6116",yrs:6,bio:"G000592",twitter:"RepGolden",pos:{Healthcare:72,Environment:65,Economy:68,Defense:72,Education:75,Technology:62,Immigration:68}},
];
let members = staticMembers;

let bills=[
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

const getSp=b=>members.find(m=>m.id===b.spId||m.bio===b.spId);
const getCo=b=>(b.coIds||[]).map(id=>members.find(m=>m.id===id||m.bio===id)).filter(Boolean);
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
{name:"John Roberts",role:"Chief Justice",appointed:"2005",appointedBy:"G.W. Bush",lean:"Center-Right",img:"https://www.supremecourt.gov/about/justices/images/roberts.jpg"},
{name:"Clarence Thomas",role:"Associate Justice",appointed:"1991",appointedBy:"G.H.W. Bush",lean:"Conservative",img:"https://www.supremecourt.gov/about/justices/images/thomas.jpg"},
{name:"Samuel Alito",role:"Associate Justice",appointed:"2006",appointedBy:"G.W. Bush",lean:"Conservative",img:"https://www.supremecourt.gov/about/justices/images/alito.jpg"},
{name:"Sonia Sotomayor",role:"Associate Justice",appointed:"2009",appointedBy:"Obama",lean:"Liberal",img:"https://www.supremecourt.gov/about/justices/images/sotomayor.jpg"},
{name:"Elena Kagan",role:"Associate Justice",appointed:"2010",appointedBy:"Obama",lean:"Liberal",img:"https://www.supremecourt.gov/about/justices/images/kagan.jpg"},
{name:"Neil Gorsuch",role:"Associate Justice",appointed:"2017",appointedBy:"Trump",lean:"Conservative",img:"https://www.supremecourt.gov/about/justices/images/gorsuch.jpg"},
{name:"Brett Kavanaugh",role:"Associate Justice",appointed:"2018",appointedBy:"Trump",lean:"Center-Right",img:"https://www.supremecourt.gov/about/justices/images/kavanaugh.jpg"},
{name:"Amy Coney Barrett",role:"Associate Justice",appointed:"2020",appointedBy:"Trump",lean:"Conservative",img:"https://www.supremecourt.gov/about/justices/images/barrett.jpg"},
{name:"Ketanji Brown Jackson",role:"Associate Justice",appointed:"2022",appointedBy:"Biden",lean:"Liberal",img:"https://www.supremecourt.gov/about/justices/images/jackson.jpg"}
];
const scotusStages=["All","Decided","Argued","Pending"];
const ECONOMIC_DATA={
b1:{
  totalCost:"$3.2 trillion",costPeriod:"over 10 years",cboScore:"$3.8T deficit increase (CBO est.)",
  fundingSources:[
    {label:"Deficit financing (borrowing)",amount:"$2.1T",pct:66,color:"#8b2e2e",note:"Added to national debt, serviced by future taxpayers"},
    {label:"Spending cuts (Medicaid, SNAP)",amount:"$880B",pct:28,color:"#d97706",note:"CBO projects 8.6M lose Medicaid coverage over decade"},
    {label:"Revenue from bracket changes",amount:"$220B",pct:6,color:"#2d6a4f",note:"Modest revenue gains from SALT cap and other changes"},
  ],
  analysis:"The bill permanently extends the 2017 TCJA tax cuts, adding an estimated $2.1T to the deficit over a decade. Two-thirds of the cost is debt-financed — meaning future generations bear the interest. The remainder is offset through Medicaid work requirements and SNAP eligibility tightening, which the CBO projects will cut federal spending by ~$880B but remove 8.6M Americans from coverage. Goldman Sachs estimates a 0.3–0.5% GDP boost in 2025–26 from consumer spending, offset by higher long-term borrowing costs.",
  cboBudgetEffect:"Increases deficit by $3.8T over 10 years",
  gdpImpact:"+0.3–0.5% near-term, -0.2% long-term (Goldman Sachs)",
  distributionNote:"Top 20% income earners receive ~65% of tax cut benefits (Tax Policy Center)",
},
b4:{
  totalCost:"$1.7 trillion",costPeriod:"FY2026 discretionary",cboScore:"Within existing debt ceiling",
  fundingSources:[
    {label:"General Fund (income/payroll taxes)",amount:"$980B",pct:58,color:"#1e40af",note:"Federal income and payroll tax receipts"},
    {label:"Deficit financing",amount:"$520B",pct:31,color:"#8b2e2e",note:"Portion not covered by current revenue"},
    {label:"Fees, fines & other receipts",amount:"$200B",pct:11,color:"#2d6a4f",note:"Agency fees, customs duties, and misc. receipts"},
  ],
  analysis:"A continuing-resolution omnibus at roughly FY2025 spending levels. The total discretionary envelope of ~$1.7T is funded primarily through general revenue. The bill avoids new programmatic spending. The $520B deficit component reflects the structural gap between federal revenue and spending, not new obligations. DHS\'s two-week extension creates a second round of shutdown risk, which the OMB estimates could cost $100–150M per day in lost economic activity if a lapse occurs.",
  cboBudgetEffect:"No new net spending; maintains FY2025 baseline",
  gdpImpact:"Neutral; shutdown avoidance prevents -0.1% GDP drag per week",
  distributionNote:"Affects ~1.3M federal employees and thousands of contractors",
},
b5:{
  totalCost:"~$580 billion",costPeriod:"FY2026 (3 departments)",cboScore:"Within existing appropriations",
  fundingSources:[
    {label:"General Fund",amount:"$390B",pct:67,color:"#1e40af",note:"Commerce, Justice, Science agencies"},
    {label:"Discretionary appropriations",amount:"$140B",pct:24,color:"#7c3aed",note:"Energy, water, and environmental programs"},
    {label:"Mandatory & trust funds",amount:"$50B",pct:9,color:"#2d6a4f",note:"Army Corps of Engineers water projects"},
  ],
  analysis:"Funds CJS (DOJ, FBI, NASA, Census), Energy/Water (DOE national labs, Army Corps), and Interior/Environment (EPA, National Parks, BLM). DOE research was trimmed 4% vs FY2025 — the first real-dollar cut to federal science funding since sequestration. Net fiscal impact is negligible relative to the overall deficit; the significance is programmatic, not macroeconomic.",
  cboBudgetEffect:"$580B appropriation within baseline; DOE research cut $23B vs. FY2025",
  gdpImpact:"Neutral to slightly negative (DOE research cuts reduce long-run innovation premium)",
  distributionNote:"Primary beneficiaries are federal agencies, contractors, and science grant recipients",
},
b8:{
  totalCost:"No federal cost",costPeriod:"N/A",cboScore:"CBO: No direct federal outlays",
  fundingSources:[
    {label:"No federal appropriation required",amount:"$0",pct:100,color:"#2d6a4f",note:"Regulatory change only — shifts DOE authority to HUD, no spending"},
  ],
  analysis:"The Affordable HOMES Act eliminates DOE energy efficiency standards for manufactured housing, transferring authority to HUD. This is a regulatory change — no direct federal outlays. Manufactured home buyers save an estimated $7,000–$10,000 upfront per unit. However, lower-efficiency homes generate $400–$900/year in higher utility costs, erasing the purchase savings over 10–12 years. The 22 million Americans in manufactured housing are disproportionately lower-income.",
  cboBudgetEffect:"No federal budget impact",
  gdpImpact:"Marginal; upfront savings offset by long-run utility cost increase",
  distributionNote:"Affects ~22M manufactured housing residents, predominantly lower-income households",
},
b15:{
  totalCost:"~$120 billion",costPeriod:"DHS FY2026 annual budget",cboScore:"Pending — 2-week stopgap only authorized",
  fundingSources:[
    {label:"General Fund (income taxes)",amount:"$78B",pct:65,color:"#1e40af",note:"CBP, ICE, TSA, Secret Service, FEMA operations"},
    {label:"Deficit financing",amount:"$28B",pct:23,color:"#8b2e2e",note:"Portion of DHS budget above current revenue"},
    {label:"User fees (TSA, USCIS)",amount:"$14B",pct:12,color:"#2d6a4f",note:"Aviation security fees and immigration filing fees"},
  ],
  analysis:"DHS funds six critical enforcement and emergency agencies. ICE\'s enforcement budget alone is ~$9B/year; the Republican proposal seeks $12B+ for expanded detention and deportation. A funding lapse after Feb 14 would immediately furlough non-essential DHS staff, suspend FEMA disaster processing, and reduce TSA checkpoint staffing. OMB estimates a full shutdown costs $100–150M per day in economic disruption.",
  cboBudgetEffect:"$120B full-year authorization pending; 2-week stopgap at current rate",
  gdpImpact:"Shutdown lapse: -0.1 to -0.15% GDP per week (OMB); full deal: neutral",
  distributionNote:"Affects border communities, air travelers, FEMA recipients, and ~240,000 DHS employees",
},
};
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
const OUTLET_BRAND={
  "CNN":{color:"#CC0000",bg:"#CC000012",border:"#CC000030"},
  "Fox News":{color:"#003366",bg:"#00336612",border:"#00336630"},
  "MSNBC":{color:"#F37321",bg:"#F3732112",border:"#F3732130"},
  "Reuters":{color:"#FF8000",bg:"#FF800012",border:"#FF800030"},
  "AP":{color:"#CC0000",bg:"#CC000012",border:"#CC000030"},
  "NPR":{color:"#1a6496",bg:"#1a649612",border:"#1a649630"},
  "Politico":{color:"#282828",bg:"#28282812",border:"#28282830"},
  "Washington Post":{color:"#231F20",bg:"#231F2012",border:"#231F2030"},
  "Wall Street Journal":{color:"#004276",bg:"#00427612",border:"#00427630"},
  "Bloomberg":{color:"#1A1A1A",bg:"#1A1A1A12",border:"#1A1A1A30"},
  "NY Times":{color:"#000000",bg:"#00000010",border:"#00000025"},
  "The Hill":{color:"#006633",bg:"#00663312",border:"#00663330"},
  "Tech Crunch":{color:"#0a7d3e",bg:"#0a7d3e12",border:"#0a7d3e30"},
};
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
const LMAP={home:HomeIcon,search:SearchIcon,chart:BarChart2,bookmark:Bookmark,person:User,back:ChevronLeft,chevDown:ChevronDown,chevUp:ChevronUp,chevRight:ChevronRight,x:X,filter:Filter,clock:Clock,check:Check,phone:Phone,people:Users,gavel:Gavel,star:Star,trending:TrendingUp,calendar:Calendar,flame:Flame,bell:Bell,mapPin:MapPin,filetext:FileText};
function Icon({name,size=20,color=C.text,strokeWidth=1.5}){const L=LMAP[name];if(L)return <L size={size} color={color} strokeWidth={strokeWidth}/>;const p=IP[name];if(!p)return null;return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{Array.isArray(p)?p.map((d,i)=><path key={i} d={d}/>):<path d={p}/>}</svg>}
function StatusBadge({status,light}){const col=SC[status]||C.textM;return <span style={{fontFamily:F.body,fontSize:11,fontWeight:500,letterSpacing:0.1,color:light?"#fff":col,background:(light?"rgba(255,255,255,0.15)":col+"12"),padding:"3px 11px",borderRadius:9999,border:light?"1px solid rgba(255,255,255,0.18)":"1px solid "+col+"28",display:"inline-block",backdropFilter:light?"blur(4px)":"none"}}>{SL[status]||status}</span>}
function PartyBadge({party}){return <span style={{fontFamily:F.body,fontSize:11,fontWeight:500,color:pc(party),background:pc(party)+"12",padding:"2px 10px",borderRadius:9999,border:"1px solid "+pc(party)+"22"}}>{party}</span>}
function PD({party,size=6}){return <span style={{width:size,height:size,borderRadius:size,background:pc(party),display:"inline-block",flexShrink:0}}/>}
function Avatar({bio,name,size=36}){
const[loaded,setLoaded]=useState(false);
const[err,setErr]=useState(false);
const initials=name?name.split(" ").filter(Boolean).map(n=>n[0].toUpperCase()).join("").slice(0,2):"?";
const seed=name?name.charCodeAt(0)%6:0;
const bgColors=["#eef1f8","#f5eaea","#e8f0fb","#f0f4e8","#ede8f5","#e8f2f8"];
const textColors=["#1a2744","#8b2e2e","#1a4db8","#2d6a4f","#6d28d9","#0369a1"];
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
{m.crossover&&m.note&&<div style={{fontFamily:F.body,color:C.textM,fontSize:10,marginTop:2}}>"{m.note}"</div>}
</div>
</div>
))}
</div>
</div>
);
}

// ═══ PREMIUM GATE ═══
const MOCK_TWEETS={
  SenSchumer:[
    {id:"t1",text:"Senate Democrats are united in opposition to the One Big Beautiful Bill. Cutting Medicaid to fund tax breaks for billionaires is not a trade-off the American people asked for.",time:"2h",likes:4821,rts:1203,replies:342},
    {id:"t2",text:"I spoke with Leader Jeffries this morning. House Democrats held the line. Every single one of them voted NO on a bill that would throw 8 million Americans off health care.",time:"5h",likes:3102,rts:891,replies:218},
    {id:"t3",text:"The Senate will not rubber-stamp this bill. We will fight for every working family who stands to lose under this reckless reconciliation package.",time:"1d",likes:6750,rts:2104,replies:509},
    {id:"t4",text:"Happy to welcome a group of students from PS 154 in the Bronx to the Capitol today. The next generation is watching — and they deserve better than what's being proposed.",time:"2d",likes:2341,rts:512,replies:88},
    {id:"t5",text:"On the floor now. Asking unanimous consent to bring S. 892, the Medicare Drug Negotiation Expansion Act, to an immediate vote. Blocked again by Republicans.",time:"3d",likes:5120,rts:1890,replies:413},
  ],
  LeaderMcConnell:[
    {id:"t6",text:"The One Big Beautiful Bill is the most consequential piece of legislation since the Tax Cuts and Jobs Act. The Senate must pass it without delay.",time:"3h",likes:3201,rts:890,replies:724},
    {id:"t7",text:"Democrats spent four years growing government at the expense of the taxpayer. This bill begins to reverse that damage.",time:"6h",likes:2890,rts:756,replies:612},
    {id:"t8",text:"Proud to stand with Speaker Johnson. The House did its job. Now the Senate will do ours.",time:"1d",likes:4102,rts:1230,replies:891},
    {id:"t9",text:"Kentucky is built on hard work and low taxes. I've fought for both for 40 years and I'm not stopping now.",time:"2d",likes:3450,rts:780,replies:340},
    {id:"t10",text:"Statement on the passing of former Senator Bob Dole's chief of staff, a true public servant and friend of this institution.",time:"3d",likes:1890,rts:312,replies:72},
  ],
  SenSanders:[
    {id:"t11",text:"Let's be clear about what the One Big Beautiful Bill actually does: it gives a $1.5 TRILLION tax cut to the top 1% while cutting health care for 13 million working people. This is oligarchy.",time:"1h",likes:28400,rts:9102,replies:2103},
    {id:"t12",text:"I've been in Congress for 34 years. I have never seen a bill this cruel to working people pass a chamber of Congress. We must stop it in the Senate.",time:"4h",likes:19200,rts:7320,replies:1890},
    {id:"t13",text:"If you think the $4.5T price tag is the problem, you're missing it. The problem is who pays and who benefits. Poor people lose. Billionaires win. Full stop.",time:"8h",likes:31200,rts:11400,replies:3210},
    {id:"t14",text:"I'm heading to a town hall in Burlington tonight. If your senator is a Republican, I hope you'll be at theirs too asking the same questions.",time:"1d",likes:14200,rts:4890,replies:1203},
    {id:"t15",text:"Medicare for All would save the average American family $5,000 a year in premiums and out-of-pocket costs. This is not a radical idea. It is what every other major country does.",time:"2d",likes:22100,rts:8930,replies:2890},
  ],
  JohnFetterman:[
    {id:"t16",text:"Voted no. Will always vote no on any bill that strips health care from my constituents to pay for a tax cut I didn't ask for.",time:"2h",likes:8920,rts:2340,replies:531},
    {id:"t17",text:"Pennsylvania lost 4,200 manufacturing jobs last quarter. Not a single provision in this bill addresses that. Not one.",time:"5h",likes:6780,rts:1890,replies:412},
    {id:"t18",text:"The border is a real issue. I've said that from day one. But the answer isn't cutting food stamps for 3 million families. C'mon.",time:"1d",likes:11200,rts:3450,replies:892},
    {id:"t19",text:"Just got back from visiting a steel plant in Allentown. These workers don't follow political theater. They want to know who's protecting their pension.",time:"2d",likes:4320,rts:980,replies:213},
    {id:"t20",text:"Big fan of a bipartisan approach on fentanyl. It kills people in red states and blue states equally. This shouldn't be hard.",time:"3d",likes:7890,rts:2100,replies:345},
  ],
  SenTedCruz:[
    {id:"t21",text:"The House passed the greatest legislative achievement in a generation. Now the Senate must lead. No delays, no excuses.",time:"2h",likes:12300,rts:3210,replies:4102},
    {id:"t22",text:"The radical left calls any spending cut 'cruel.' What's cruel is $36 trillion in debt that our children will inherit. Enough.",time:"4h",likes:9870,rts:2890,replies:3450},
    {id:"t23",text:"I introduced an amendment today to add $2B in additional ICE detention capacity to the reconciliation package. We need to enforce the law.",time:"7h",likes:8920,rts:2340,replies:2104},
    {id:"t24",text:"The ICC has no jurisdiction over American citizens or our allies. Period. Proud to co-sponsor the American Servicemembers Protection Enhancement Act.",time:"1d",likes:7650,rts:1980,replies:1890},
    {id:"t25",text:"Texas economy added 18,000 jobs last month. Low taxes, less regulation, and energy dominance work. The rest of the country should try it.",time:"2d",likes:11200,rts:2890,replies:1203},
  ],
  SenWarren:[
    {id:"t26",text:"I've read the CBO score. $3.3 trillion added to the deficit. Paid for by kicking families off Medicaid. This is not fiscal responsibility — it's fiscal cruelty.",time:"3h",likes:14200,rts:4890,replies:1203},
    {id:"t27",text:"Wall Street banks spent $450 million lobbying for this bill. Remember that number when they tell you it's about the middle class.",time:"5h",likes:18900,rts:6780,replies:2103},
    {id:"t28",text:"I'm releasing a full analysis of the funding sources in the reconciliation bill. The math doesn't add up — unless you count on people not noticing.",time:"9h",likes:12100,rts:4320,replies:980},
    {id:"t29",text:"Met with nurses at Mass General today. They're terrified. Not of politics — of what happens to their patients when Medicaid cuts kick in.",time:"1d",likes:9870,rts:3210,replies:712},
    {id:"t30",text:"I've introduced the Corporate Megadonor Disclosure Act. If corporations want to buy legislation, the least they can do is put their name on it.",time:"2d",likes:22100,rts:8930,replies:2890},
  ],
  SenRubioPress:[
    {id:"t31",text:"The threat from China is not hypothetical. The AI Competitiveness Act gives American companies the tools to win the technological race of this century.",time:"4h",likes:5320,rts:1450,replies:892},
    {id:"t32",text:"Critical minerals are the new oil. If we don't control our own supply chain, we will be dependent on Beijing for every EV battery and semiconductor.",time:"7h",likes:4890,rts:1320,replies:612},
    {id:"t33",text:"Proud to vote YES on final passage. America First means actually putting America first in the budget.",time:"1d",likes:7650,rts:2100,replies:1340},
    {id:"t34",text:"Florida families are not interested in ideological experiments. They want lower prices, safer streets, and a future for their kids.",time:"2d",likes:6120,rts:1680,replies:891},
    {id:"t35",text:"Statement on the situation at the southern border: what we are witnessing is not a crisis — it is the intentional result of failed policies. We have the tools to fix it.",time:"3d",likes:8920,rts:2560,replies:1890},
  ],
  SenJohnThune:[
    {id:"t36",text:"Grateful to Speaker Johnson for his leadership. The House delivered. The Senate Finance Committee will begin markup next week.",time:"5h",likes:2890,rts:780,replies:312},
    {id:"t37",text:"South Dakota farmers are counting on the ag provisions in this bill. The estate tax relief alone will save family operations that have been in the same hands for generations.",time:"8h",likes:3210,rts:890,replies:234},
    {id:"t38",text:"As Majority Leader, my job is to get 51 votes. We're working through the concerns of every member. This bill will pass.",time:"1d",likes:4120,rts:1230,replies:512},
    {id:"t39",text:"Met with the South Dakota Farm Bureau today. Their priorities are our priorities.",time:"2d",likes:2340,rts:560,replies:123},
    {id:"t40",text:"The debt ceiling provision in this bill is not optional. It's the responsible thing to do. We cannot hold the economy hostage every two years.",time:"3d",likes:3450,rts:890,replies:412},
  ],
  amyklobuchar:[
    {id:"t41",text:"I just came from a markup in the Judiciary Committee where we introduced the bipartisan AI Transparency Act. Tech companies must be accountable. Full stop.",time:"2h",likes:6780,rts:1890,replies:512},
    {id:"t42",text:"Minnesota families deserve prescription drug prices that don't force them to choose between insulin and groceries. I'll keep fighting until that's the law.",time:"5h",likes:8920,rts:2560,replies:712},
    {id:"t43",text:"On the Ag Committee, we secured $8B in rural broadband funding that almost no one is talking about. That's how you actually help rural America.",time:"9h",likes:5120,rts:1340,replies:312},
    {id:"t44",text:"Voter ID laws that don't accommodate working people, the elderly, and people without cars are voter suppression laws. That's just what they are.",time:"1d",likes:11200,rts:3890,replies:1203},
    {id:"t45",text:"Good bipartisan news: the Fentanyl Accountability Act moved out of Judiciary today with 14-3 support. This is how we're supposed to work.",time:"2d",likes:7650,rts:2100,replies:312},
  ],
  SenatorTimScott:[
    {id:"t46",text:"I grew up in poverty in North Charleston. I know what it looks like when government helps and when it gets in the way. This bill gets out of the way.",time:"3h",likes:8920,rts:2560,replies:1203},
    {id:"t47",text:"Opportunity zones created $100B in private investment in underserved communities. The reconciliation bill makes them permanent. That's a win for everyone.",time:"6h",likes:6780,rts:1890,replies:892},
    {id:"t48",text:"Crime is up in cities that defunded the police. The answer is more investment in law enforcement, not less. This bill delivers that.",time:"1d",likes:9870,rts:2890,replies:2103},
    {id:"t49",text:"The faith community in South Carolina has been asking for expanded school choice for years. I'm proud this bill delivers on that promise.",time:"2d",likes:7650,rts:2100,replies:891},
    {id:"t50",text:"We are not the party of big government. We are the party of big opportunity. There's a difference.",time:"3d",likes:11200,rts:3450,replies:1340},
  ],
  SenKatieBritt:[
    {id:"t51",text:"As a mom, I look at this bill and I see a future for my kids. Lower taxes, secure borders, and a government that doesn't consume every dollar they'll ever earn.",time:"4h",likes:7650,rts:2100,replies:1203},
    {id:"t52",text:"Alabama families are hurting from inflation. This bill cuts spending, cuts taxes, and cuts the bureaucracy that's been choking our economy.",time:"7h",likes:6120,rts:1680,replies:891},
    {id:"t53",text:"Visited Redstone Arsenal today. The men and women defending this country deserve the full $28B in new defense spending this bill provides.",time:"1d",likes:5320,rts:1450,replies:512},
    {id:"t54",text:"The left will tell you this is extreme. Balancing the budget and enforcing immigration law used to be called 'governing.' I'll take that label.",time:"2d",likes:8920,rts:2560,replies:1890},
    {id:"t55",text:"Grateful to serve on the Banking Committee. The deregulatory provisions in this bill will unlock capital for small business owners across the South.",time:"3d",likes:4320,rts:1120,replies:312},
  ],
  lisamurkowski:[
    {id:"t56",text:"I have serious concerns about the Medicaid provisions. Alaska's rural hospitals cannot absorb these cuts. I've made that clear to Leadership.",time:"2h",likes:8920,rts:2890,replies:1203},
    {id:"t57",text:"ANWR development has been a priority for Alaskans for decades. I'm glad this bill keeps that promise. But not at the cost of health care access.",time:"5h",likes:6780,rts:1890,replies:892},
    {id:"t58",text:"I am a yes on the energy provisions. I am undecided on the overall bill. Those are two different things and I wish people would respect that.",time:"9h",likes:11200,rts:3890,replies:1890},
    {id:"t59",text:"Alaska Native communities have been calling my office for three days. The safety net cuts in this bill will hit them harder than almost anyone else.",time:"1d",likes:9870,rts:3210,replies:1023},
    {id:"t60",text:"I've been in the Senate for 22 years. I've never voted just to make my party happy. I never will.",time:"2d",likes:14200,rts:4890,replies:2103},
  ],
  SenOssoff:[
    {id:"t61",text:"Georgia was built by workers. This bill cuts their health care and gives a tax break to their employer's largest shareholders. I'll be voting no.",time:"3h",likes:7650,rts:2100,replies:891},
    {id:"t62",text:"Our office just launched a constituent portal for Georgians who want to track how their benefits are affected by the reconciliation bill. Link in bio.",time:"6h",likes:5320,rts:1450,replies:312},
    {id:"t63",text:"Met with 22 Georgia tech founders today. The AI Competitiveness Act is real and important — but it shouldn't be packaged with Medicaid cuts.",time:"1d",likes:6780,rts:1890,replies:512},
    {id:"t64",text:"Fulton County has 340,000 Medicaid enrollees. That is not an abstraction. Those are my constituents and I will fight for them.",time:"2d",likes:8920,rts:2560,replies:712},
    {id:"t65",text:"National security requires economic security. You can't defend a country whose middle class is collapsing.",time:"3d",likes:9870,rts:3210,replies:891},
  ],
  SenatorCollins:[
    {id:"t66",text:"I cannot support a bill that cuts Medicaid funding to the states without a full CBO analysis of the impact on rural hospitals. I've said this for three weeks.",time:"1h",likes:12300,rts:4120,replies:1890},
    {id:"t67",text:"Maine has the oldest population of any state in the country. Cuts to Medicare Advantage directly affect my constituents more than almost any other state.",time:"4h",likes:9870,rts:3210,replies:1203},
    {id:"t68",text:"I am working with Senators Murkowski and Capito on a targeted amendment to protect rural health care. We need 51 votes. I believe we can get there.",time:"8h",likes:8920,rts:2890,replies:1023},
    {id:"t69",text:"Bipartisanship is not weakness. It is the only path to durable policy. I've been saying this for 28 years and I will keep saying it.",time:"1d",likes:14200,rts:4890,replies:2103},
    {id:"t70",text:"Voted yes on the defense and border provisions. Working through my concerns on health care and SNAP. This is not a final position.",time:"2d",likes:11200,rts:3890,replies:1890},
  ],
  SpeakerJohnson:[
    {id:"t71",text:"The House has done its job. We passed the One Big Beautiful Bill and delivered on every promise we made to the American people. Now it's the Senate's turn.",time:"2h",likes:18900,rts:5670,replies:4102},
    {id:"t72",text:"231 years ago, the Founders warned us about the dangers of big government. Today, we started taking their advice seriously again.",time:"5h",likes:15600,rts:4890,replies:3450},
    {id:"t73",text:"To every Republican who held firm under enormous pressure: I am proud of you. History will remember this vote.",time:"8h",likes:22100,rts:7890,replies:4890},
    {id:"t74",text:"The southern border is 99% more secure than it was 18 months ago. This bill makes those gains permanent.",time:"1d",likes:14200,rts:4320,replies:3210},
    {id:"t75",text:"We cut $1.5 trillion in spending. Not one dollar was taken from Social Security or Medicare beneficiaries. The mainstream media won't tell you that.",time:"2d",likes:19800,rts:6780,replies:5120},
  ],
  RepJeffriesNY:[
    {id:"t76",text:"House Democrats stood together today. Every single member voted no on a bill that cuts health care for millions, guts education funding, and rewards the ultra-wealthy.",time:"3h",likes:14200,rts:4890,replies:1890},
    {id:"t77",text:"The American people are watching. And they will remember who voted to take away their Medicaid so a billionaire could get another tax cut.",time:"6h",likes:18900,rts:6780,replies:2560},
    {id:"t78",text:"I spoke with Senator Schumer this evening. Senate Democrats are united. The fight continues.",time:"9h",likes:9870,rts:3210,replies:891},
    {id:"t79",text:"Brooklyn is my home. It is also 8th Congressional District. The people I represent work double shifts, care for aging parents, and pay their taxes. They deserve a government that works for them.",time:"1d",likes:12300,rts:4120,replies:1023},
    {id:"t80",text:"On the House floor right now for the record: this bill is an act of political cowardice dressed up as fiscal responsibility.",time:"2d",likes:16700,rts:5890,replies:2890},
  ],
  AOC:[
    {id:"t81",text:"They just passed a bill that cuts $800B from Medicaid while giving $1.5T in tax breaks to the ultra-wealthy. In broad daylight. While pretending to care about the deficit.",time:"1h",likes:89200,rts:34100,replies:12300},
    {id:"t82",text:"I spoke for 4 hours on the floor last night. Not because it would change the outcome but because the people losing their health care deserve someone saying their name.",time:"3h",likes:67800,rts:28900,replies:9870},
    {id:"t83",text:"The GOP voted to cut SNAP for 42 million Americans. Many of them voted for Trump. I hope their representatives enjoy explaining that at town halls.",time:"5h",likes:112000,rts:45600,replies:18900},
    {id:"t84",text:"Organizing works. We stopped worse versions of this bill three times. The fight is not over. It moves to the Senate and we need you calling those offices.",time:"8h",likes:78900,rts:31200,replies:8920},
    {id:"t85",text:"The Green New Deal isn't radical. Doing nothing while 100-year floods hit every continent is radical. We have the solutions. What we lack is the political will.",time:"1d",likes:95600,rts:38900,replies:14200},
  ],
  ChipRoyTX21:[
    {id:"t86",text:"I voted yes on the Big Beautiful Bill — not because it's perfect but because the alternative is $2T more in Democrat spending. We take what we can get and keep fighting.",time:"4h",likes:8920,rts:2560,replies:1890},
    {id:"t87",text:"The border is not a talking point. Last month alone, CBP made 54,000 arrests in my district's sector. This is an invasion and we should treat it as one.",time:"7h",likes:11200,rts:3450,replies:2890},
    {id:"t88",text:"I've been called an obstructionist for three years. I prefer: a guy who reads the bill before he votes on it.",time:"1d",likes:14200,rts:4890,replies:3210},
    {id:"t89",text:"Texas has a $32B budget surplus because we don't spend money we don't have. DC should try it.",time:"2d",likes:9870,rts:2890,replies:1890},
    {id:"t90",text:"The House Freedom Caucus will not rubber-stamp anything. Not from Democrats. Not from leadership. Not from anyone.",time:"3d",likes:12300,rts:4120,replies:2560},
  ],
  TomColeOK04:[
    {id:"t91",text:"As Appropriations Chair, I can tell you: this bill is the most significant reordering of federal priorities in 30 years. Oklahoma's interests are protected.",time:"5h",likes:3210,rts:890,replies:312},
    {id:"t92",text:"We funded 14 new tribal health clinics in this package. That doesn't make headlines but it matters enormously to the communities I serve.",time:"8h",likes:4120,rts:1120,replies:213},
    {id:"t93",text:"The Agriculture Committee worked for 8 months on the farm bill provisions in this reconciliation package. It is a fair deal for rural America.",time:"1d",likes:3450,rts:980,replies:189},
    {id:"t94",text:"I've served on Appropriations for 20 years. I know where the bodies are buried. This bill is not perfect but it is significantly better than the baseline.",time:"2d",likes:5120,rts:1450,replies:412},
  ],
  SpeakerPelosi:[
    {id:"t95",text:"Today Republicans chose their donors over their constituents. That is a choice that will define this majority — and end it.",time:"2h",likes:28900,rts:9870,replies:3450},
    {id:"t96",text:"I have seen many bills pass this floor in 38 years. I have never seen one this nakedly designed to hurt working people and reward the wealthy.",time:"5h",likes:22100,rts:7650,replies:2890},
    {id:"t97",text:"Democrats are the party of the ACA, of Medicare, of Social Security. We built those programs. We will defend them. Every single time.",time:"8h",likes:31200,rts:11400,replies:4120},
    {id:"t98",text:"To the young people who are angry today: channel it. Register voters. Organize your precinct. Show up in November. That is how we win.",time:"1d",likes:18900,rts:6780,replies:2103},
  ],
  RepMikeCollins:[
    {id:"t99",text:"Georgia-10 sent me here to cut spending and secure the border. I did both today. Proudly.",time:"6h",likes:4120,rts:1120,replies:712},
    {id:"t100",text:"The left says these spending cuts are cruel. I say leaving $36 trillion in debt for our grandchildren is cruel.",time:"9h",likes:5320,rts:1450,replies:891},
    {id:"t101",text:"Town hall in Greensboro Saturday at 10am. Come ask me anything about the reconciliation vote. I'll be there.",time:"1d",likes:2890,rts:780,replies:213},
  ],
  RoKhanna:[
    {id:"t102",text:"Silicon Valley can't thrive if the workers who built it can't afford to live here. The AI bill is good. The Medicaid cuts are inexcusable. I voted no on the package.",time:"3h",likes:12300,rts:4120,replies:1203},
    {id:"t103",text:"We should be investing in semiconductor manufacturing, not cutting the workforce that operates those factories. This is the wrong bill.",time:"6h",likes:9870,rts:3210,replies:891},
    {id:"t104",text:"I introduced an amendment to strip the Medicaid cuts and keep the tech provisions. It was voted down along party lines. That tells you everything.",time:"1d",likes:8920,rts:2890,replies:712},
    {id:"t105",text:"The future of American competitiveness is not lower wages and fewer benefits. It's innovation, education, and a workforce that can actually participate.",time:"2d",likes:11200,rts:3890,replies:1023},
  ],
  RepArrington:[
    {id:"t106",text:"The Budget Committee delivered. $1.5T in spending cuts over 10 years — the largest in modern history. Texas is proud.",time:"7h",likes:4890,rts:1340,replies:712},
    {id:"t107",text:"We balanced Texas's budget. We can balance America's. It requires discipline and the willingness to say no. This bill says no.",time:"1d",likes:6120,rts:1680,replies:891},
    {id:"t108",text:"If you're outraged by spending cuts, ask yourself: were you equally outraged by the $6T we added to the debt in the last four years?",time:"2d",likes:7650,rts:2100,replies:1340},
  ],
  RepJohnJames:[
    {id:"t109",text:"I'm a combat veteran and a businessman. I know what it takes to build something and what it takes to defend it. This bill does both.",time:"4h",likes:6780,rts:1890,replies:891},
    {id:"t110",text:"Michigan families need lower costs and more jobs — not more government programs. I voted for this bill because it delivers on both.",time:"7h",likes:5320,rts:1450,replies:612},
    {id:"t111",text:"Honored to represent Michigan's 10th. We are a district of autoworkers, farmers, and small business owners. Their voice was heard today.",time:"1d",likes:4120,rts:1120,replies:312},
  ],
  DanCrenshawTX:[
    {id:"t112",text:"The Left wants you to think cutting government growth is the same as cutting government. It is not. We are growing spending less fast. Stop lying.",time:"2h",likes:18900,rts:6780,replies:4120},
    {id:"t113",text:"I spent 10 years in special operations. I know what it costs to lose a war. The $28B in new defense spending in this bill is not enough — but it's a start.",time:"5h",likes:14200,rts:4890,replies:2890},
    {id:"t114",text:"Stop comparing the US to Europe on healthcare. They wait 6 months for an MRI. We don't. There are real tradeoffs and the media won't tell you.",time:"8h",likes:21100,rts:7890,replies:5120},
    {id:"t115",text:"Misinformation about this bill is off the charts. Thread on what it actually does vs. what Democrats claim:",time:"1d",likes:12300,rts:4120,replies:1890},
  ],
  RepJayapal:[
    {id:"t116",text:"I represent Seattle. My constituents include Amazon engineers AND the janitors who clean their offices at night. This bill helps one group. It is not the engineers.",time:"3h",likes:22100,rts:8930,replies:3210},
    {id:"t117",text:"The Progressive Caucus held firm. Every single one of our members voted no. We are not done.",time:"6h",likes:16700,rts:5890,replies:2103},
    {id:"t118",text:"Medicare for All would cover everyone and cost less than the current system. The CBO has confirmed this. The argument that we 'can't afford it' is a choice, not a fact.",time:"9h",likes:19800,rts:7650,replies:2890},
    {id:"t119",text:"The filibuster exists to protect the minority. Right now it is being used to protect the wealthy at the expense of the poor. That is not what the Founders intended.",time:"1d",likes:14200,rts:4890,replies:1890},
  ],
  rosadelauro:[
    {id:"t120",text:"I've served on the Appropriations Committee for 34 years. I have never seen a more reckless assault on the social safety net in a single bill.",time:"4h",likes:8920,rts:2890,replies:891},
    {id:"t121",text:"WIC feeds 6 million mothers and young children. This bill cuts it. Let that sink in.",time:"7h",likes:14200,rts:4890,replies:1890},
    {id:"t122",text:"Connecticut did not send me to Washington to make life harder for working families. I will use every tool available to stop this bill in the Senate.",time:"1d",likes:7650,rts:2560,replies:712},
  ],
  RepRussellFry:[
    {id:"t123",text:"South Carolina needs a secure border, lower taxes, and less Washington. The One Big Beautiful Bill delivers all three. Easy yes.",time:"8h",likes:3210,rts:890,replies:512},
    {id:"t124",text:"My constituents at the Myrtle Beach Chamber asked me one question: will this cut their taxes? Yes. Done.",time:"1d",likes:4120,rts:1120,replies:312},
  ],
  ThomasMassie:[
    {id:"t125",text:"Voted NO. $3.3 trillion added to the debt is not a spending cut. It is a spending increase with better marketing. I won't be gaslit.",time:"1h",likes:28900,rts:12300,replies:3450},
    {id:"t126",text:"The 'savings' in this bill are mostly timing gimmicks. The 'cuts' hit people who need help. The 'investment' goes to defense contractors. I've seen this movie before.",time:"4h",likes:22100,rts:9870,replies:2890},
    {id:"t127",text:"Ron Paul warned us. I listened. Cut the deficit to zero or stop calling yourself a fiscal conservative.",time:"7h",likes:31200,rts:14200,replies:4890},
    {id:"t128",text:"For those asking: yes, I'm aware I'm the only Republican who voted no. I've been the only Republican on the right side before. I'm comfortable here.",time:"1d",likes:45600,rts:18900,replies:6780},
    {id:"t129",text:"Audit the Fed. End the income tax. Repeal the Patriot Act. These are not extreme positions. They used to be called 'Americanism.'",time:"2d",likes:38900,rts:16700,replies:7650},
  ],
};

function TwitterFeed({handle,memberId}){
  const member=memberId?members.find(m=>m.id===memberId):null;
  const tweets=MOCK_TWEETS[handle]||[];
  const partyCol=member?.party==="Republican"?"#8b2e2e":member?.party==="Democrat"?"#1e40af":"#7c3aed";

  const fmtNum=n=>n>=1000?(n/1000).toFixed(1)+"K":n;

  if(!handle)return<div style={{padding:24,textAlign:"center",color:C.textM,fontFamily:F.body,fontSize:12}}>No handle found</div>;

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
        {member&&<div style={{width:36,height:36,borderRadius:9999,background:partyCol+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontFamily:F.body,fontSize:12,fontWeight:500,color:partyCol}}>{member.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</span>
        </div>}
        <div style={{flex:1,minWidth:0}}>
          {member&&<div style={{fontFamily:F.body,fontSize:12,fontWeight:400,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{member.pre} {member.name}</div>}
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={C.textM}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:0.3}}>@{handle}</span>
          </div>
        </div>
        <a href={"https://x.com/"+handle} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:F.body,fontSize:10,color:C.accent2,fontWeight:300,textDecoration:"none",flexShrink:0}}>Open on X →</a>
      </div>

      {/* Tweets */}
      {tweets.length===0&&<div style={{padding:28,textAlign:"center",color:C.textM,fontFamily:F.body,fontSize:12,lineHeight:1.6}}>
        No mock tweets yet.<br/>
        <a href={"https://x.com/"+handle} target="_blank" rel="noopener noreferrer" style={{color:C.accent2,fontSize:12}}>View @{handle} on X →</a>
      </div>}
      {tweets.map((t,i)=>(
        <div key={t.id} style={{padding:"12px 16px",borderBottom:i<tweets.length-1?"1px solid "+C.border:"none",transition:"background 0.1s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text,lineHeight:1.5,marginBottom:9}}>{t.text}</div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{t.time} ago</span>
            <span style={{display:"flex",alignItems:"center",gap:3,fontFamily:F.mono,fontSize:9,color:C.textM}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              {fmtNum(t.replies)}
            </span>
            <span style={{display:"flex",alignItems:"center",gap:3,fontFamily:F.mono,fontSize:9,color:"#2d6a4f"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              {fmtNum(t.rts)}
            </span>
            <span style={{display:"flex",alignItems:"center",gap:3,fontFamily:F.mono,fontSize:9,color:"#8b2e2e"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {fmtNum(t.likes)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── UPGRADE MODAL ─────────────────────────────────────────
function UpgradeModal({onClose,onCheckout}){
  const[plan,setPlan]=useState("annual");
  const p=PLANS[plan];
  const Check=()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const X=()=><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      {/* Backdrop */}
      <div style={{position:"absolute",inset:0,background:"rgba(5,10,22,0.72)",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}/>
      {/* Modal card */}
      <div style={{position:"relative",background:"#fff",borderRadius:24,width:"100%",maxWidth:480,boxShadow:"0 32px 80px rgba(5,10,22,0.3)",overflow:"hidden",animation:"civlyExpandIn 0.22s cubic-bezier(0.22,1,0.36,1) both"}}>
        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#1e3a6e 100%)`,padding:"28px 28px 24px",position:"relative"}}>
          <button onClick={onClose} style={{all:"unset",cursor:"pointer",position:"absolute",top:16,right:16,width:28,height:28,borderRadius:9999,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.6)",transition:"background 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.18)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(249,171,0,0.15)",border:"1px solid rgba(249,171,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F9AB00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Bebas Neue',serif",fontSize:26,color:"#fff",letterSpacing:2,lineHeight:1}}>Civlio Member</div>
              <div style={{fontFamily:F.body,fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:2}}>Full access. No bureaucracy.</div>
            </div>
          </div>
          {/* Plan toggle */}
          <div style={{display:"flex",gap:6,background:"rgba(255,255,255,0.08)",borderRadius:12,padding:4,border:"1px solid rgba(255,255,255,0.1)"}}>
            {Object.values(PLANS).map(pl=>(
              <button key={pl.id} onClick={()=>setPlan(pl.id)}
                style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"8px 0",borderRadius:9,transition:"all 0.18s",position:"relative",
                  background:plan===pl.id?"rgba(255,255,255,0.14)":"transparent",
                  boxShadow:plan===pl.id?"0 1px 4px rgba(0,0,0,0.2)":"none"}}>
                <div style={{fontFamily:F.display,fontSize:13,fontWeight:plan===pl.id?700:400,color:plan===pl.id?"#fff":"rgba(255,255,255,0.5)"}}>{pl.label}</div>
                <div style={{fontFamily:F.mono,fontSize:10,color:plan===pl.id?"#F9AB00":"rgba(255,255,255,0.35)",marginTop:1}}>
                  {pl.id==="annual"?"$2.08/mo · Save 48%":"$3.99/mo"}
                </div>
                {pl.id==="annual"&&<div style={{position:"absolute",top:-8,right:6,background:"#F9AB00",color:C.navy,fontFamily:F.mono,fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:9999,letterSpacing:0.5}}>BEST VALUE</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Price display */}
        <div style={{padding:"20px 28px 0",borderBottom:"1px solid "+C.border}}>
          <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:4}}>
            <span style={{fontFamily:"'Bebas Neue',serif",fontSize:48,color:C.navy,lineHeight:1,letterSpacing:-1}}>${p.price}</span>
            <span style={{fontFamily:F.body,fontSize:13,color:C.textM,fontWeight:300}}>{p.period}</span>
            {plan==="annual"&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:"#15803d",background:"#f0fdf4",padding:"2px 7px",borderRadius:9999,marginLeft:4,border:"1px solid #bbf7d0"}}>Save $22.88/yr</span>}
          </div>
          {plan==="annual"&&<div style={{fontFamily:F.body,fontSize:11,color:C.textM,marginBottom:14}}>Billed once a year. Cancel anytime.</div>}
          {plan==="monthly"&&<div style={{fontFamily:F.body,fontSize:11,color:C.textM,marginBottom:14}}>Billed monthly. Cancel anytime.</div>}
        </div>

        {/* Feature list */}
        <div style={{padding:"16px 28px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"0 16px",marginBottom:8}}>
            <div/>
            <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,textTransform:"uppercase",letterSpacing:0.8,textAlign:"center"}}>Free</div>
            <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:"#F9AB00",textTransform:"uppercase",letterSpacing:0.8,textAlign:"center"}}>Member</div>
          </div>
          {MEMBER_FEATURES.map((f,i)=>(
            <div key={f.label} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"0 16px",alignItems:"center",padding:"7px 0",borderBottom:i<MEMBER_FEATURES.length-1?"1px solid "+C.border+"55":"none"}}>
              <span style={{fontFamily:F.body,fontSize:12,color:C.text,fontWeight:300}}>{f.label}</span>
              <div style={{textAlign:"center",width:54}}>
                {typeof f.free==="string"
                  ?<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{f.free}</span>
                  :f.free?<Check/>:<X/>}
              </div>
              <div style={{textAlign:"center",width:54}}>
                {typeof f.member==="string"
                  ?<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.navy}}>{f.member}</span>
                  :f.member?<Check/>:<X/>}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{padding:"0 28px 24px",display:"flex",flexDirection:"column",gap:10}}>
          <button
            onClick={()=>onCheckout(plan)}
            style={{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",textAlign:"center",padding:"14px 0",borderRadius:14,background:`linear-gradient(135deg,${C.navy},#1e3a6e)`,color:"#fff",fontFamily:F.display,fontSize:15,fontWeight:700,letterSpacing:0.5,boxShadow:"0 4px 16px rgba(10,29,80,0.25)",transition:"opacity 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            Get Member Access — ${p.price}{p.period}
          </button>
          <div style={{textAlign:"center",fontFamily:F.body,fontSize:11,color:C.textM}}>
            Secure checkout via Stripe · 30-day money back guarantee
          </div>
        </div>
      </div>
    </div>
  );
}

function PremiumGate({title,desc,onUpgrade}){
return(
<div style={{borderRadius:14,border:"1.5px dashed "+C.border,padding:"24px 20px",textAlign:"center",background:C.bg2,marginBottom:12}}>
  <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:38,height:38,borderRadius:38,background:"linear-gradient(135deg,#F9AB00,#d97706)",marginBottom:12,boxShadow:"0 4px 12px rgba(249,171,0,0.25)"}}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  </div>
  <div style={{fontFamily:F.display,fontSize:14,fontWeight:700,color:C.text,marginBottom:5,letterSpacing:"-0.2px"}}>{title||"Member Feature"}</div>
  <div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:"1.6",maxWidth:260,margin:"0 auto 16px"}}>{desc||"Upgrade to Civlio Member to unlock this feature."}</div>
  <button onClick={onUpgrade} style={{all:"unset",cursor:"pointer",padding:"9px 24px",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:600,background:`linear-gradient(135deg,${C.navy},#1e3a6e)`,color:"#fff",boxShadow:"0 2px 10px rgba(10,29,80,0.2)",transition:"opacity 0.15s"}}
    onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
    See Member Plans →
  </button>
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
<div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.55,marginBottom:2}}>"{d.explanation}"</div>
<ConfidenceBadge confidence={d.confidence} directInferred={d.directInferred} source={d.source}/>
</div>);}

function MemberMoneySnapshot({memberId,compact}){
const d=INFLUENCE.members[memberId];if(!d)return null;
const topInds=compact?d.topIndustries.slice(0,3):d.topIndustries;
const isSmallDollar=d.smallDollarPct>=50;
return(<div style={{background:isSmallDollar?"rgba(52,168,83,0.04)":"rgba(26,39,68,0.04)",borderRadius:compact?12:16,padding:compact?"10px 14px":"14px 16px",marginBottom:compact?8:16,border:"1px solid "+(isSmallDollar?"rgba(52,168,83,0.14)":"rgba(26,39,68,0.1)")}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:compact?8:12}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isSmallDollar?"#34A853":C.navy} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:isSmallDollar?"#34A853":C.navy,letterSpacing:0.8,textTransform:"uppercase"}}>Disclosed Fundraising</span>
</div>
<div style={{textAlign:"right"}}>
<span style={{fontFamily:F.mono,fontSize:compact?11:13,fontWeight:700,color:isSmallDollar?"#34A853":C.navy}}>{fMoney(d.careerTotal)}</span>
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
const RECENTLY_ACTIVE=new Set(["m8","m18","m24","m19","m4","m1"]);
// Pre-compute which bills have votes within 72h for urgency stamps on cards
const BILL_VOTE_URGENCY=(()=>{
  const out={};
  calendarEvents.forEach(e=>{
    if(!e.billId)return;
    const diff=new Date(e.date+"T12:00:00")-new Date();
    if(diff>0&&diff<72*3600*1000)out[e.billId]={type:e.type,date:e.date,title:e.title};
  });
  return out;
})();
const STAGE_STEPS=["introduced","in_committee","on_the_floor","passed_house","passed_senate","signed_into_law"];
const STAGE_LABELS_SHORT=["Intro","Cmte","Floor","House","Senate","Signed"];
const STAGE_IDX={introduced:0,in_committee:1,on_the_floor:2,passed_house:3,passed_senate:4,passed:4,signed_into_law:5,failed:-1,vetoed:4};
function BillStageBar({status,compact}){
  const idx=STAGE_IDX[status]??0;
  const failed=status==="failed";
  const col=SC[status]||C.textM;
  const activePulse=["on_the_floor","in_committee"].includes(status);
  if(failed)return(<div style={{marginTop:8,display:"flex",alignItems:"center",gap:5}}><div style={{flex:1,height:2,background:"#fde8e8",borderRadius:2}}><div style={{height:"100%",background:C.error,width:"100%",borderRadius:2}}/></div><span style={{fontFamily:F.mono,fontSize:7,color:C.error,flexShrink:0}}>Failed</span></div>);
  return(
    <div style={{marginTop:compact?6:10}}>
      <div style={{display:"flex",alignItems:"center",gap:2}}>
        {STAGE_STEPS.map((s,i)=>{
          const done=i<=idx;const cur=i===idx;
          return(<React.Fragment key={s}>
            <div title={STAGE_LABELS_SHORT[i]} style={{width:cur?9:6,height:cur?9:6,borderRadius:"50%",flexShrink:0,background:done?col:"#dde1ea",boxShadow:cur?"0 0 0 3px "+col+"25":"none",animation:cur&&activePulse?"civlyGlow 1.8s ease-in-out infinite":"none",transition:"background 0.3s,width 0.2s,height 0.2s"}}/>
            {i<STAGE_STEPS.length-1&&(<div style={{flex:1,height:2,background:"#dde1ea",borderRadius:2,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",inset:0,background:col,"--fill-w":i<idx?"100%":"0%",width:"var(--fill-w)",animation:i<idx?"civlyBarFill 0.55s ease forwards":"none",animationDelay:(i*0.1)+"s"}}/>
            </div>)}
          </React.Fragment>);
        })}
      </div>
      {!compact&&<div style={{display:"flex",gap:2,marginTop:4}}>
        {STAGE_STEPS.map((s,i)=>(<span key={s} style={{fontFamily:F.mono,fontSize:7,color:i===idx?col:C.textM,fontWeight:i===idx?600:400,letterSpacing:0.3,flex:i<STAGE_STEPS.length-1?1:"auto",textAlign:"center"}}>{STAGE_LABELS_SHORT[i]}</span>))}
      </div>}
    </div>
  );
}
function CountdownTimer({targetDate,inline}){
  const[rem,setRem]=useState(null);
  useEffect(()=>{
    const calc=()=>{
      const diff=new Date(targetDate+"T00:00:00")-new Date();
      if(diff<=0){setRem("EXPIRED");return;}
      const days=Math.floor(diff/864e5);const hrs=Math.floor((diff%864e5)/36e5);const mins=Math.floor((diff%36e5)/6e4);
      setRem(days>0?`${days}d ${hrs}h`:`${hrs}h ${mins}m`);
    };
    calc();const id=setInterval(calc,30000);return()=>clearInterval(id);
  },[targetDate]);
  if(!rem)return null;
  const expired=rem==="EXPIRED";
  return(<span style={{fontFamily:F.mono,fontSize:inline?8:9,fontWeight:600,color:"#fff",background:expired?"#6b7280":"#c41e3a",padding:inline?"1px 5px":"2px 8px",borderRadius:9999,flexShrink:0,letterSpacing:0.3,display:"inline-flex",alignItems:"center",gap:3}}>
    {!expired&&<svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
    {rem}
  </span>);
}
function BillCard({bill,onPress,watched,onToggle,compact,nav,noAccent}){
const sp=getSp(bill);const cp=(bill.votes&&bill.votes.crossParty)||[];
const accentCol=SC[bill.status]||C.textM;
return(<div onClick={onPress} style={{cursor:"pointer",background:C.card,borderRadius:16,padding:compact?"12px 16px":"18px 20px",marginBottom:8,boxShadow:C.cardShadow,border:"1px solid rgba(221,226,237,0.7)",transition:"box-shadow 0.22s cubic-bezier(0.22,1,0.36,1),transform 0.22s cubic-bezier(0.22,1,0.36,1)"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.cardShadowHover;e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.cardShadow;e.currentTarget.style.transform="translateY(0)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><StatusBadge status={bill.status}/><span style={{fontFamily:F.mono,color:C.textM,fontSize:9,letterSpacing:0.4}}>{bill.num}</span></div>
<div style={{fontFamily:F.display,color:C.text,fontSize:15,fontWeight:600,lineHeight:"1.4",letterSpacing:"-0.2px"}}>{bill.title}</div>
</div>
{onToggle&&<SaveBtn active={watched} onToggle={()=>onToggle(bill.id)}/>}
</div>
{!compact&&<div style={{color:C.text2,fontSize:12,fontWeight:400,lineHeight:"1.6",marginTop:8,fontFamily:F.body,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{bill.sum}</div>}
<div style={{display:"flex",alignItems:"center",gap:6,marginTop:10}}>
{sp&&<div onClick={nav?e=>{e.stopPropagation();nav("memberProfile",sp.id);}:undefined} style={{display:"flex",alignItems:"center",gap:6,cursor:nav?"pointer":"default"}}>
<Avatar bio={sp.bio} name={sp.name} size={20}/>
<span style={{color:nav?C.navy:C.text2,fontSize:11,fontFamily:F.body,fontWeight:300}}>{sp.name}</span>
<PD party={sp.party} size={5}/>
</div>}
<span style={{color:C.textM,fontSize:9,fontFamily:F.mono,marginLeft:"auto",letterSpacing:0.3}}>{fS(bill.last||bill.intro)}</span>
</div>
{!compact&&cp.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border}}>
<span style={{fontFamily:F.body,fontSize:10,fontWeight:400,color:C.navy,background:"rgba(26,39,68,0.07)",padding:"2px 8px",borderRadius:9999}}>Cross-Party</span>
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>{cp.slice(0,4).map((c,i)=>{const m=members.find(x=>x.id===c.id);return m?<span key={i} onClick={nav?e=>{e.stopPropagation();nav("memberProfile",c.id);}:undefined} style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.text2,display:"inline-flex",alignItems:"center",gap:3,cursor:nav?"pointer":"default"}}><PD party={c.party} size={4}/>{m.name.split(" ").pop()} ({c.vote})</span>:null})}{cp.length>4&&<span style={{color:C.textM,fontSize:10}}>+{cp.length-4}</span>}</div>
</div>}
{!compact&&INFLUENCE.bills[bill.id]&&(()=>{const inf=INFLUENCE.bills[bill.id];return(<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
<span style={{fontFamily:F.mono,fontSize:9,color:"#7C3AED",fontWeight:500}}>{fMoney(inf.totalLobby)} lobbied</span>
<span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>·</span>
{inf.industries.slice(0,2).map((ind,i)=><DonorIndustryChip key={i} name={ind.name} color={ind.color} stance={ind.stance}/>)}
</div>);})()}
{!compact&&<BillStageBar status={bill.status}/>}
{!compact&&BILL_VOTE_URGENCY[bill.id]&&(()=>{const u=BILL_VOTE_URGENCY[bill.id];const isDeadline=u.type==="deadline";return(<div style={{marginTop:10,display:"flex",alignItems:"center",gap:7,padding:"7px 11px",borderRadius:8,background:isDeadline?"rgba(196,30,58,0.06)":"rgba(26,106,79,0.06)",border:"1px solid "+(isDeadline?"rgba(196,30,58,0.2)":"rgba(26,106,79,0.2)"),animation:"civlyGlow 2.5s ease-in-out infinite"}}>
<span style={{width:6,height:6,borderRadius:"50%",background:isDeadline?C.error:C.success,display:"inline-block",flexShrink:0,animation:"civlyDotBounce 1.6s ease-in-out infinite"}}/>
<span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:isDeadline?C.error:C.success,letterSpacing:1.2,textTransform:"uppercase"}}>{isDeadline?"DEADLINE":"VOTE SOON"}</span>
<span style={{fontFamily:F.body,fontSize:10,color:C.text2,fontWeight:300,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.title}</span>
<CountdownTimer targetDate={u.date} inline/>
</div>);})()}
</div>)}

function MemberCard({member,onPress,watched,onToggle}){
const mInf=INFLUENCE.members[member.id];
const[flipped,setFlipped]=useState(false);
const partyCol=pc(member.party);
const topPositions=member.pos?Object.entries(member.pos).sort((a,b)=>b[1]-a[1]).slice(0,3):[];
const bottomPositions=member.pos?Object.entries(member.pos).sort((a,b)=>a[1]-b[1]).slice(0,2):[];
return(
<div style={{cursor:"pointer",borderRadius:16,marginBottom:6,height:74,perspective:800,position:"relative"}}
  onClick={onPress}
  onMouseEnter={e=>{setFlipped(true);}}
  onMouseLeave={e=>{setFlipped(false);}}>
  <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transition:"transform 0.42s cubic-bezier(0.22,1,0.36,1)",transform:flipped?"rotateY(180deg)":"rotateY(0deg)"}}>
    {/* FRONT */}
    <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",background:C.card,borderRadius:16,padding:"14px 16px",boxShadow:C.cardShadow,border:"1px solid rgba(221,226,237,0.7)",display:"flex",alignItems:"center",gap:12}}>
      <div style={{position:"relative",flexShrink:0}}>
        <Avatar bio={member.bio} name={member.name} size={44}/>
        {RECENTLY_ACTIVE.has(member.id)&&<span style={{position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:"#16a34a",border:"2.5px solid #fff",display:"block",animation:"civlyDotBounce 2.2s ease-in-out infinite"}} title="Recently active"/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F.body,color:C.text,fontSize:14,fontWeight:500,letterSpacing:"-0.1px"}}>{member.pre} {member.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><PartyBadge party={member.party}/><span style={{color:C.textM,fontSize:11,fontFamily:F.body,fontWeight:300}}>{member.state}{member.dist?"-"+member.dist:""} · {member.chamber}</span></div>
        {mInf&&<div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
          {mInf.topIndustries.slice(0,2).map((ind,i)=><DonorIndustryChip key={i} name={ind.name} color={ind.color}/>)}
        </div>}
      </div>
      {onToggle&&<div onClick={e=>{e.stopPropagation();onToggle(member.id);}} style={{flexShrink:0}}><SaveBtn active={watched}/></div>}
    </div>
    {/* BACK */}
    <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",transform:"rotateY(180deg)",background:"linear-gradient(135deg,"+partyCol+"18,"+partyCol+"08)",borderRadius:16,padding:"10px 14px",boxShadow:C.cardShadowHover,border:"1px solid "+partyCol+"30",display:"flex",flexDirection:"column",justifyContent:"center",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
        <Avatar bio={member.bio} name={member.name} size={22}/>
        <div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.text}}>{member.name.split(" ").pop()}</div>
        <div style={{fontFamily:F.mono,fontSize:8,color:partyCol,background:partyCol+"15",padding:"1px 6px",borderRadius:9999,marginLeft:"auto"}}>{member.chamber}</div>
      </div>
      {topPositions.slice(0,2).map(([k,v])=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.body,fontSize:9,color:C.text2,width:72,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k}</span>
          <div style={{flex:1,height:4,background:C.bg2,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:v+"%",background:v>66?PC.democrat:v>33?"#b45309":PC.republican,borderRadius:2,"--fill-w":v+"%",animation:"civlyBarFill 0.5s ease forwards"}}/>
          </div>
          <span style={{fontFamily:F.mono,fontSize:8,color:C.textM,width:22,textAlign:"right"}}>{v}%</span>
        </div>
      ))}
    </div>
  </div>
</div>)}

// ─── MEMBERSHIP TIER LIMITS ───────────────────────────────
const FREE_BILL_LIMIT=5;
const FREE_MEMBER_LIMIT=3;
const PLANS={
  monthly:{id:"monthly",label:"Monthly",price:3.99,period:"/ month",stripePriceId:"price_MONTHLY_PLACEHOLDER",annualEquiv:47.88},
  annual:{id:"annual",label:"Annual",price:25,period:"/ year",stripePriceId:"price_ANNUAL_PLACEHOLDER",saving:48,monthlyEquiv:2.08},
};
const MEMBER_FEATURES=[
  {label:"Saved bills",free:"Up to 5",member:"Unlimited"},
  {label:"Members followed",free:"Up to 3",member:"Unlimited"},
  {label:"Dashboard panels",free:"View only",member:"Full edit + custom"},
  {label:"Weekly Digest",free:false,member:true},
  {label:"Intel reports",free:false,member:true},
  {label:"Real-time tracking",free:false,member:true},
  {label:"Email bill alerts",free:false,member:true},
  {label:"Data export",free:false,member:true},
];

// ═══ HOME SCREEN — Newspaper Feed ═══
const TOPIC_COLORS=["#1a4db8","#2d6a4f","#8b2e2e","#b45309","#6d28d9","#0369a1","#1a2744","#7c3aed"];
const CAL_COLOR={deadline:"#dc2626",vote:"#16a34a",markup:"#1a4db8",hearing:"#7c3aed"};
const PANEL_DEFS={
  bill:{label:"Bill Tracker",desc:"Follow a specific bill",needsConfig:true,configType:"bill"},
  bill_news:{label:"Bill News",desc:"Latest news coverage for a bill",needsConfig:true,configType:"bill"},
  member_feed:{label:"Member Feed",desc:"X/Twitter feed for a member",needsConfig:true,configType:"member"},
  member_card:{label:"Member Card",desc:"Profile & issue positions",needsConfig:true,configType:"member"},
  calendar:{label:"This Week",desc:"Congressional schedule",needsConfig:false},
  trending:{label:"Topics",desc:"Trending legislative topics",needsConfig:false},
  bills_grid:{label:"Active Bills",desc:"Top active legislation",needsConfig:false},
  watchlist:{label:"My Watchlist",desc:"Your saved bills & members",needsConfig:false},
  leg_chart:{label:"Legislative Progress",desc:"Bills by stage — bar chart",needsConfig:false},
  pipeline:{label:"Bill Pipeline",desc:"Kanban view of all active bills",needsConfig:false},
  markets:{label:"Markets",desc:"Legislative impact on financial markets by sector",needsConfig:false},
  activity:{label:"Activity Feed",desc:"Recent legislative actions",needsConfig:false},
  leaderboard:{label:"Member Activity",desc:"Most active members ranked",needsConfig:false},
  party_votes:{label:"Party Line Votes",desc:"D vs R split on every recorded vote",needsConfig:false},
  vote_scorecard:{label:"Vote Scorecard",desc:"How members voted on key bills",needsConfig:false},
  bill_funnel:{label:"Bill Success Funnel",desc:"Conversion rate through legislative stages",needsConfig:false},
};
// w is 1–12 (12-column grid). Old 1/2/3 system: 1→4, 2→8, 3→12. Min width = 2 cols.
const DEFAULT_PANELS=[
  {id:"dp-pipe",type:"pipeline",config:{},w:5},
  {id:"dp0b",type:"markets",config:{},w:4},
  {id:"dp-act",type:"activity",config:{},w:3},
  {id:"dp-lead",type:"leaderboard",config:{},w:4},
  {id:"dp-funnel",type:"bill_funnel",config:{},w:4},
  {id:"dp0",type:"leg_chart",config:{},w:4},
  {id:"dp1",type:"calendar",config:{},w:5},
  {id:"dp-party",type:"party_votes",config:{},w:4},
  {id:"dp-score",type:"vote_scorecard",config:{},w:7},
  {id:"dp2b",type:"leg_chart",config:{},w:4},
  {id:"dp3",type:"trending",config:{},w:4},
  {id:"dp3b",type:"watchlist",config:{},w:4},
];
const BILL_NEWS={
  b1:[
    {id:"n1",title:"House Passes $4.5T Tax and Spending Package in Narrow Vote",source:"Reuters",date:"2025-05-22",blurb:"The House narrowly approved the sweeping reconciliation bill, extending Trump-era tax cuts and adding $1.5T in new defense and border spending.",url:"https://www.reuters.com/search/?q=one+big+beautiful+bill+house+vote"},
    {id:"n1b",title:"'One Big Beautiful Bill' Clears House — What's Actually In It",source:"CNN",date:"2025-05-22",blurb:"CNN breaks down the 1,116-page package: a $4K income tax deduction for seniors, Medicaid work requirements, and the largest single-year deficit increase since 2020. Republican moderates nearly tanked it over SALT.",url:"https://www.cnn.com/search?q=one+big+beautiful+bill"},
    {id:"n1c",title:"Trump's Signature Win: 'One Big Beautiful Bill' Makes It Through",source:"Fox News",date:"2025-05-22",blurb:"President Trump celebrated the bill's passage, calling it the most consequential domestic legislation in decades. The package delivers on his core campaign promises — tax permanence, border funding, and energy deregulation.",url:"https://www.foxnews.com/search-results/search?q=one+big+beautiful+bill+passed"},
    {id:"n1d",title:"Democrats Call It a 'Wrecking Ball' for the Middle Class",source:"MSNBC",date:"2025-05-21",blurb:"MSNBC analysis finds the bill's Medicaid cuts would eliminate coverage for an estimated 14 million Americans, while the top 1% would see an average tax cut of $72,000 annually. 'This is Robin Hood in reverse,' said Rep. Pramila Jayapal.",url:"https://www.msnbc.com/search/?q=one+big+beautiful+bill+medicaid"},
    {id:"n2",title:"Senate Moderates Signal Concerns Over Deficit Impact",source:"Wall Street Journal",date:"2025-05-20",blurb:"A handful of Republican senators raised alarms over CBO projections showing the bill adds $3.3 trillion to deficits over a decade.",url:"https://www.wsj.com/search?query=one+big+beautiful+bill+deficit"},
    {id:"n3",title:"What's in the 'Big Beautiful Bill'? A Plain-English Breakdown",source:"NPR",date:"2025-05-19",blurb:"From Medicaid cuts to SALT cap changes, here's what the 1,000-page bill would actually do to your taxes and benefits.",url:"https://www.npr.org/search?query=big+beautiful+bill+explainer"},
    {id:"n4",title:"Democrats Unified in Opposition, Call Bill 'Historic Cruelty'",source:"Politico",date:"2025-05-18",blurb:"House Minority Leader Hakeem Jeffries led a marathon floor speech opposing the reconciliation measure, calling it the largest wealth transfer in history.",url:"https://www.politico.com/search#stq=one+big+beautiful+bill+democrats"},
  ],
  b2:[
    {id:"n5",title:"Continuing Resolution Averts Shutdown Through September",source:"AP",date:"2025-03-14",blurb:"Congress passed a stopgap funding bill keeping the government open at current spending levels while negotiations on a full-year budget continue.",url:"https://apnews.com/search?q=continuing+resolution+shutdown+2025"},
    {id:"n5b",title:"Government Stays Open — Barely. What the CR Does and Doesn't Fix",source:"CNN",date:"2025-03-14",blurb:"The last-minute deal keeps the lights on but punts the hard budget decisions to fall. Democrats extracted modest concessions on domestic spending. Defense hawks got a $6B top-line bump.",url:"https://www.cnn.com/search?q=continuing+resolution+government+shutdown"},
    {id:"n5c",title:"House Freedom Caucus Splits on Stopgap — What It Means for Fall",source:"Fox News",date:"2025-03-13",blurb:"The conservative bloc fractured over whether to accept the clean CR or force a shutdown over DHS spending. Johnson secured the votes, but the margin signals turbulence ahead when the deal expires.",url:"https://www.foxnews.com/search-results/search?q=continuing+resolution+freedom+caucus"},
    {id:"n6",title:"DHS Funding Fight Holds Up Stopgap Bill",source:"The Hill",date:"2025-03-10",blurb:"Border hawks in the House demanded increased ICE funding as a condition of their vote, complicating leadership's whip count.",url:"https://thehill.com/search/?q=DHS+funding+continuing+resolution"},
  ],
  b3:[
    {id:"n7",title:"Senate Confirms New DHS Secretary After Contentious Hearing",source:"CNN",date:"2025-04-02",blurb:"The Senate voted 52-47 to confirm the administration's pick, who pledged to prioritize deportations and border wall completion.",url:"https://www.cnn.com/search?q=DHS+secretary+confirmation+senate"},
    {id:"n8",title:"ACLU Challenges New DHS Enforcement Rules in Federal Court",source:"NY Times",date:"2025-03-28",blurb:"Civil liberties groups filed a nationwide injunction request against expanded expedited removal authority granted under the bill.",url:"https://www.nytimes.com/search?query=ACLU+DHS+enforcement+injunction"},
    {id:"n9",title:"Border Crossings Drop 40% Since New Enforcement Took Effect",source:"Fox News",date:"2025-03-20",blurb:"CBP data shows a significant decline in illegal crossings following implementation of enhanced enforcement measures and mandatory detention.",url:"https://www.foxnews.com/search-results/search?q=border+crossings+drop+DHS+enforcement"},
    {id:"n9b",title:"'This Is Not the America We Know': Inside the Detention Surge",source:"MSNBC",date:"2025-03-25",blurb:"Reporting from immigration detention centers along the southern border, MSNBC found overcrowding at 140% capacity in three major facilities. Advocates say due-process violations are now systemic.",url:"https://www.msnbc.com/search/?q=immigration+detention+surge+DHS"},
  ],
  b4:[
    {id:"n10",title:"TCJA Extension Would Add $4T to Debt, CBO Finds",source:"Washington Post",date:"2025-04-15",blurb:"The nonpartisan budget scorekeeper released its analysis, projecting the permanent extension of 2017 tax cuts would dramatically increase deficits.",url:"https://www.washingtonpost.com/search/?query=TCJA+extension+CBO+deficit"},
    {id:"n10b",title:"The Tax Bill Debate: Who Really Benefits?",source:"CNN",date:"2025-04-14",blurb:"CNN's analysis of IRS data finds the TCJA's permanent extension delivers 65% of its benefits to households earning over $400K. The child tax credit expansion, however, offers modest relief to lower-income families.",url:"https://www.cnn.com/search?q=TCJA+extension+tax+cuts+who+benefits"},
    {id:"n10c",title:"Permanent Tax Cuts Will Unleash Long-Term Economic Growth, Economists Say",source:"Fox News",date:"2025-04-13",blurb:"Supply-side economists back the extension, projecting it will add 0.4% to annual GDP growth as business investment accelerates. Critics call those models optimistic.",url:"https://www.foxnews.com/search-results/search?q=TCJA+extension+economic+growth"},
    {id:"n11",title:"Small Business Groups Push for Permanent Pass-Through Deduction",source:"Bloomberg",date:"2025-04-10",blurb:"Industry coalitions are lobbying hard to make Section 199A permanent, saying its expiration would devastate millions of small business owners.",url:"https://www.bloomberg.com/search?query=section+199A+permanent+small+business"},
  ],
  b5:[
    {id:"n12",title:"SAVE Act Passes House 220-202 After Weeks of Debate",source:"Reuters",date:"2025-02-28",blurb:"The bill requiring proof of citizenship to register to vote cleared the House along party lines amid fierce Democratic opposition.",url:"https://www.reuters.com/search/?q=SAVE+act+voter+ID+citizenship"},
    {id:"n12b",title:"SAVE Act: What It Requires and Why Critics Say It Will Suppress Votes",source:"CNN",date:"2025-02-27",blurb:"The bill requires documentary proof of citizenship at registration — a burden, critics say, 21 million eligible voters can't easily meet. Supporters call it common sense safeguarding of elections.",url:"https://www.cnn.com/search?q=SAVE+act+voter+registration+citizenship"},
    {id:"n12c",title:"SAVE Act Closes a Critical Loophole — 'Only Citizens Should Vote'",source:"Fox News",date:"2025-02-26",blurb:"Fox News hosts and guests praised the bill as long-overdue election integrity legislation. Under current law, applicants need only attest to citizenship — there is no document check.",url:"https://www.foxnews.com/search-results/search?q=SAVE+act+election+integrity+citizenship"},
    {id:"n12d",title:"Voter Suppression or Voter Integrity? The SAVE Act's Real-World Impact",source:"MSNBC",date:"2025-02-25",blurb:"MSNBC's data team analyzed which counties would see the most registration barriers under the SAVE Act — they skew heavily toward low-income, minority, and elderly populations.",url:"https://www.msnbc.com/search/?q=SAVE+act+voter+suppression"},
    {id:"n13",title:"Election Officials Warn SAVE Act Would Disenfranchise Millions",source:"NPR",date:"2025-02-20",blurb:"State secretaries of state from both parties warned that documentation requirements would create barriers for millions of eligible citizens.",url:"https://www.npr.org/search?query=SAVE+act+election+officials+warn"},
  ],
  b6:[
    {id:"n14",title:"AI Competitiveness Act Would Fast-Track Permitting for Data Centers",source:"Tech Crunch",date:"2025-03-05",blurb:"The bipartisan bill streamlines environmental review for AI infrastructure projects, framed as essential to compete with China.",url:"https://techcrunch.com/search?q=AI+competitiveness+act+data+centers"},
    {id:"n14b",title:"China's AI Build-Out Is Forcing Congress to Act — But at What Cost?",source:"CNN",date:"2025-03-04",blurb:"The bill's environmental carve-outs for AI data centers and lithium mines have drawn scrutiny. But backers say falling behind China on compute capacity is a national security risk that outweighs local environmental concerns.",url:"https://www.cnn.com/search?q=AI+competitiveness+act+critical+minerals"},
    {id:"n14c",title:"America First: The Bill That Could Secure U.S. Mineral Independence",source:"Fox News",date:"2025-03-03",blurb:"Fox Business highlights provisions slashing permitting timelines from 7 years to 18 months for critical mineral projects — a move champions say ends 'regulatory blockades' on domestic production.",url:"https://www.foxnews.com/search-results/search?q=critical+minerals+AI+competitiveness+act"},
    {id:"n15",title:"Mining Industry Hails Critical Minerals Provisions as 'Game-Changer'",source:"Bloomberg",date:"2025-03-01",blurb:"Executives praised provisions reducing permitting timelines from 7 years to 2 for lithium, cobalt, and rare earth projects on federal land.",url:"https://www.bloomberg.com/search?query=critical+minerals+permitting+AI+bill"},
  ],
  b8:[
    {id:"n16",title:"NDAA Passes with $50B Ukraine Aid Package Attached",source:"Politico",date:"2025-04-18",blurb:"The defense bill cleared committee with a controversial foreign aid rider that could complicate its passage on the full floor.",url:"https://www.politico.com/search#stq=NDAA+Ukraine+aid+2025"},
    {id:"n16b",title:"The NDAA's Buried Provisions: ICC Sanctions, Base Closures, and More",source:"CNN",date:"2025-04-17",blurb:"Beyond the headline Ukraine aid fight, the defense bill contains sanctions on International Criminal Court prosecutors, a new hypersonic missile program, and a commission to review overseas base closures.",url:"https://www.cnn.com/search?q=NDAA+ICC+sanctions+defense+bill"},
    {id:"n16c",title:"$886B Defense Bill: Why the Military-Industrial Complex Is Celebrating",source:"MSNBC",date:"2025-04-16",blurb:"The NDAA represents a 4.2% increase from last year — and Lockheed Martin, Raytheon, and Northrop Grumman all saw their stock jump on passage day. 'The question isn't who wins,' said one analyst, 'it's by how much.'",url:"https://www.msnbc.com/search/?q=NDAA+defense+contractors+military+spending"},
    {id:"n17",title:"ICC Sanctions Provision Sparks Diplomatic Fallout with European Allies",source:"Reuters",date:"2025-04-12",blurb:"European governments lodged formal protests after the House Armed Services Committee approved sanctions targeting ICC prosecutors.",url:"https://www.reuters.com/search/?q=NDAA+ICC+sanctions+European+allies"},
  ],
};
const DCAL_COLOR={deadline:"#8b2e2e",vote:"#2d6a4f",markup:"#1e40af",hearing:"#7c3aed"};
const TOPIC_DOT_COLORS_MAP={"Gov. Shutdown / DHS":"#8b2e2e","Tax Cuts & TCJA":"#d97706","Border Security":"#2d6a4f","Critical Minerals & AI":"#7c3aed","Voter Eligibility":"#1e40af","Healthcare & Fentanyl":"#059669","Energy Regulation":"#b45309","Defense & ICC":"#991b1b"};

const PANEL_ACCENT={
  bill:"#1e40af",
  bill_news:"#c41e3a",
  member_feed:"#0369a1",
  member_card:"#6d28d9",
  calendar:"#1e40af",
  trending:"#b45309",
  bills_grid:"#c41e3a",
  watchlist:"#15803d",
  party_votes:"#c41e3a",
  vote_scorecard:"#1e40af",
  bill_funnel:"#7c3aed",
};
const PANEL_ICON={
  bill:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  bill_news:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></svg>,
  member_feed:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>,
  member_card:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calendar:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  trending:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  bills_grid:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  watchlist:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  leg_chart:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>,
  leg_stats:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  voting_dist:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>,
  pipeline:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="10.5" y="6" width="6" height="15" rx="1"/><rect x="18" y="9" width="3" height="12" rx="1"/></svg>,
  activity:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  leaderboard:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  party_votes:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="22" y2="6"/><line x1="2" y1="12" x2="16" y2="12"/><line x1="2" y1="18" x2="12" y2="18"/></svg>,
  vote_scorecard:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  bill_funnel:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  markets:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};
function PanelShell({panel,onRemove,onResize,onMoveUp,onMoveDown,isFirst,isLast,editMode,locked,children,
  onResizeStart,onDragHeaderDown,panelRef,isDragging,isDragOver}){
  const def=PANEL_DEFS[panel.type]||{label:panel.type};
  const accentCol=PANEL_ACCENT[panel.type]||C.navy;
  const ebs={all:"unset",cursor:"pointer",width:22,height:22,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:5,transition:"all 0.12s",color:C.textM};
  return(
    <div
      ref={panelRef}
      className="civly-panel"
      style={{
        gridColumn:"span "+panel.w,
        background:"#fff",
        borderRadius:12,
        border:"1px solid "+C.border,
        overflow:"hidden",
        display:"flex",flexDirection:"column",
        minHeight:180,
        transition:"box-shadow 0.2s ease,opacity 0.18s,transform 0.2s ease",
        opacity:isDragging?0.15:1,
        position:"relative",
        boxShadow:"0 1px 3px rgba(15,29,58,0.05)",
        transform:isDragging?"scale(0.97) rotate(0.8deg)":"none",
      }}
      onMouseEnter={e=>{if(!isDragging){e.currentTarget.style.boxShadow="0 4px 20px rgba(15,29,58,0.08)";}}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(15,29,58,0.05)";}}
    >
      {/* Header — same white surface, separated by a hairline */}
      <div
        onPointerDown={e=>onDragHeaderDown(e,panel.id)}
        style={{
          display:"flex",alignItems:"center",
          padding:"13px 16px 12px",
          background:"#fff",
          borderBottom:"1px solid #f0f2f7",
          gap:10,flexShrink:0,
          cursor:locked?"default":"grab",
          userSelect:"none",
        }}
        title={locked?"Unlock layout to drag":"Drag to reorder"}
      >
        {/* Title block */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,letterSpacing:"-0.2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
            {def.label}
          </div>
          {panel.config?.name&&(
            <div style={{fontFamily:F.body,fontSize:10,color:C.textM,fontWeight:400,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {panel.config.name}
            </div>
          )}
        </div>
        {/* Drag grip — very subtle, only when unlocked */}
        {!locked&&!editMode&&(
          <svg width="8" height="12" viewBox="0 0 8 12" fill={C.border} style={{flexShrink:0,opacity:0.6}}>
            <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
            <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
            <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
          </svg>
        )}
        {/* Edit controls */}
        {editMode&&(
          <div style={{display:"flex",alignItems:"center",gap:1}} onPointerDown={e=>e.stopPropagation()}>
            <button onClick={()=>onResize(panel.id)} title="Resize" style={ebs}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
            {!isFirst&&<button onClick={()=>onMoveUp(panel.id)} style={ebs}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>}
            {!isLast&&<button onClick={()=>onMoveDown(panel.id)} style={ebs}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>}
            <button onClick={()=>onRemove(panel.id)}
              style={{...ebs,color:C.textM}}
              onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#dc2626";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textM;}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto"}} className="civly-scroll">{children}</div>

      {/* Resize handle */}
      <div
        onMouseDown={e=>onResizeStart(e,panel.id)}
        onMouseEnter={e=>{const b=e.currentTarget.querySelector(".rh-bar");if(b){b.style.opacity="1";b.style.height="40px";}}}
        onMouseLeave={e=>{const b=e.currentTarget.querySelector(".rh-bar");if(b){b.style.opacity="0";b.style.height="20px";}}}
        title="Drag to resize"
        style={{position:"absolute",right:0,top:0,bottom:0,width:8,cursor:locked?"default":"ew-resize",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}
      >
        <div className="rh-bar" style={{width:2,height:20,borderRadius:9999,background:accentCol,opacity:0,transition:"opacity 0.15s,height 0.18s ease"}}/>
      </div>
    </div>
  );
}

function BillPanelContent({config,nav,wb,toggleB}){
  const bill=bills.find(b=>b.id===config.billId);
  if(!bill)return<div style={{padding:20,color:C.textM,fontFamily:F.body,fontSize:12}}>Bill not found</div>;
  const sp=getSp(bill);
  const failed=bill.status==="failed"||bill.status==="vetoed";
  const pipe=failed?[{key:"introduced",short:"Intro"},{key:"in_committee",short:"Cmte"},{key:"failed",short:"Failed"}]:[{key:"introduced",short:"Intro"},{key:"in_committee",short:"Cmte"},{key:"on_the_floor",short:"Floor"},{key:"passed_house",short:"House"},{key:"passed_senate",short:"Senate"},{key:"signed_into_law",short:"Signed"}];
  const pipeIdx=pipe.findIndex(s=>s.key===bill.status);
  return(
    <div style={{padding:16,cursor:"pointer"}} onClick={()=>nav("billDetail",bill.id)}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.textM}}>{bill.num}</span>
          <SaveBtn active={wb?.includes(bill.id)} onToggle={()=>{if(toggleB)toggleB(bill.id);}} size={15}/>
        </div>
      </div>
      <div style={{fontFamily:F.display,fontSize:16,fontWeight:600,color:C.text,lineHeight:1.3,marginBottom:8,letterSpacing:"-0.2px"}}>{bill.title}</div>
      <div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.55,marginBottom:10,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical"}}>{bill.sum}</div>
      {sp&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <Avatar bio={sp.bio} name={sp.name} size={16}/>
        <span style={{fontFamily:F.body,fontSize:11,color:C.text2}}>{sp.pre} {sp.name}</span>
        <PD party={sp.party} size={6}/>
      </div>}
      {bill.votes?.house&&<div style={{marginTop:8,padding:"8px 0",borderTop:"1px solid "+C.border}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.success}}>YEA {bill.votes.house.yea}</span>
          <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.error}}>NAY {bill.votes.house.nay}</span>
        </div>
        <div style={{height:4,background:C.bg2,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:(bill.votes.house.yea/(bill.votes.house.yea+bill.votes.house.nay)*100)+"%",height:"100%",background:C.success,borderRadius:2}}/>
        </div>
      </div>}
      <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid "+C.border}}>
        <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:2}}>
          {pipe.map((s,i)=>{
            const done=pipeIdx>i||(bill.status===s.key);
            const active=bill.status===s.key;
            const color=active?(SC[s.key]||C.accent2):done?"#34A853":C.textM;
            return(<div key={s.key} style={{display:"flex",alignItems:"center",flex:i<pipe.length-1?1:0,minWidth:0,flexShrink:i===pipe.length-1?0:1}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:36}}>
                <div style={{width:active?22:16,height:active?22:16,borderRadius:"50%",background:active?color:done?color+"22":C.bg2,border:"2px solid "+(done||active?color:C.border),display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0}}>
                  {done&&!active&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {active&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}
                </div>
                <span style={{fontFamily:F.mono,fontSize:7,color:active?color:done?C.text2:C.textM,fontWeight:active?600:400,textAlign:"center",lineHeight:1.2,whiteSpace:"nowrap"}}>{s.short}</span>
              </div>
              {i<pipe.length-1&&<div style={{flex:1,height:2,background:done&&pipeIdx>i?"#34A853":C.bg2,minWidth:4,marginBottom:14,borderRadius:1}}/>}
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

function MemberCardPanelContent({config,nav}){
  const mem=members.find(m=>m.id===config.memberId);
  if(!mem)return<div style={{padding:20,color:C.textM,fontFamily:F.body,fontSize:12}}>Member not found</div>;
  const ideology=getIdeology(mem.pos);
  const memBills=bills.filter(b=>b.spId===mem.id).slice(0,3);
  return(
    <div style={{padding:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,cursor:"pointer"}} onClick={()=>nav("memberProfile",mem.id)}>
        <Avatar bio={mem.bio} name={mem.name} size={44}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:C.text}}>{mem.pre} {mem.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
            <PartyBadge party={mem.party}/>
            <span style={{fontFamily:F.body,fontSize:11,color:C.textM}}>{mem.state}{mem.dist?"-"+mem.dist:""} · {mem.chamber}</span>
          </div>
          {ideology&&<span style={{fontFamily:F.body,fontSize:10,color:ideology.color,fontWeight:500,marginTop:2,display:"block"}}>{ideology.label}</span>}
        </div>
      </div>
      {mem.pos&&<div style={{marginBottom:12}}>
        {Object.entries(mem.pos).slice(0,4).map(([k,v])=>(
          <div key={k} style={{marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontFamily:F.body,fontSize:10,color:C.text2}}>{k}</span>
              <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{v}%</span>
            </div>
            <div style={{height:3,background:C.bg2,borderRadius:2,overflow:"hidden"}}>
              <div style={{width:v+"%",height:"100%",borderRadius:2,background:v>66?PC.democrat:v>33?C.accent2:PC.republican}}/>
            </div>
          </div>
        ))}
      </div>}
      {memBills.length>0&&<>
        <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Sponsored Bills</div>
        {memBills.map(b=>(
          <div key={b.id} onClick={e=>{e.stopPropagation();nav("billDetail",b.id);}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:"1px solid "+C.border}}>
            <StatusBadge status={b.status}/>
            <span style={{fontFamily:F.display,fontSize:11,color:C.text,flex:1,lineHeight:1.35,fontWeight:500,letterSpacing:"-0.1px"}}>{b.title}</span>
          </div>
        ))}
      </>}
    </div>
  );
}

function CalendarPanelContent({nav}){
  return(
    <div style={{padding:"4px 0"}}>
      {calendarEvents.slice(0,6).map((event,idx)=>{
        const col=DCAL_COLOR[event.type]||C.textM;
        const typeLabel=event.type==="deadline"?"DEADLINE":event.type==="vote"?"FLOOR VOTE":event.type==="markup"?"MARKUP":"HEARING";
        const d=new Date(event.date+"T12:00:00");
        const isLast=idx===Math.min(calendarEvents.length,6)-1;
        return(
          <div key={event.id} onClick={()=>event.billId&&nav("billDetail",event.billId)}
            style={{cursor:event.billId?"pointer":"default",display:"flex",gap:12,padding:"10px 16px",borderBottom:isLast?"none":"1px solid "+C.border+"60",alignItems:"flex-start",transition:"background 0.12s"}}
            onMouseEnter={e=>{if(event.billId)e.currentTarget.style.background=C.bg+"80";}}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {/* Date block */}
            <div style={{flexShrink:0,width:40,textAlign:"center",background:col+"10",borderRadius:10,padding:"5px 2px",border:"1px solid "+col+"20"}}>
              <div style={{fontFamily:F.mono,fontSize:7,color:col,letterSpacing:0.8,fontWeight:700}}>{d.toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</div>
              <div style={{fontFamily:F.display,fontSize:22,fontWeight:300,color:col,lineHeight:1.1}}>{d.getDate()}</div>
              <div style={{fontFamily:F.body,fontSize:7,color:C.textM,marginTop:1}}>{d.toLocaleDateString("en-US",{weekday:"short"})}</div>
            </div>
            <div style={{flex:1,minWidth:0,paddingTop:1}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
                <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:col,textTransform:"uppercase",letterSpacing:1,background:col+"10",padding:"1.5px 6px",borderRadius:9999}}>{typeLabel}</span>
                {event.urgent&&<span style={{fontFamily:F.mono,fontSize:8,color:"#fff",background:"#c41e3a",padding:"1.5px 6px",borderRadius:9999,fontWeight:700,letterSpacing:0.5}}>URGENT</span>}
                {event.type==="deadline"&&<CountdownTimer targetDate={event.date} inline/>}
              </div>
              <div style={{fontFamily:F.display,fontSize:12,color:C.text,fontWeight:600,lineHeight:1.35,letterSpacing:"-0.1px",marginBottom:2}}>{event.title}</div>
              <div style={{fontFamily:F.body,fontSize:10,color:C.text2,fontWeight:300,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{event.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendingPanelContent({nav}){
  const maxCount=Math.max(...trending.map(t=>t.count));
  return(
    <div style={{padding:"4px 0"}}>
      {trending.map((t,i)=>{
        const col=TOPIC_DOT_COLORS_MAP[t.name]||"#4285F4";
        const pct=Math.round((t.count/maxCount)*100);
        const isLast=i===trending.length-1;
        return(
          <div key={t.name} onClick={()=>nav("topicDetail",t.name)}
            style={{cursor:"pointer",padding:"9px 16px",borderBottom:isLast?"none":"1px solid "+C.border+"60",transition:"background 0.12s"}}
            onMouseEnter={e=>e.currentTarget.style.background=col+"08"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
              {/* Rank badge */}
              <div style={{width:18,height:18,borderRadius:6,background:i<3?col+"18":"transparent",border:i<3?"1px solid "+col+"30":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:i<3?col:C.textM}}>{i+1}</span>
              </div>
              <span style={{fontFamily:F.display,fontSize:12,color:C.text,flex:1,fontWeight:i<2?600:400,letterSpacing:"-0.1px"}}>{t.name}</span>
              <span style={{fontFamily:F.mono,fontSize:9,color:col,fontWeight:700,background:col+"12",padding:"2px 7px",borderRadius:9999}}>{t.count}</span>
            </div>
            <div style={{height:2.5,background:C.bg2,borderRadius:2,overflow:"hidden",marginLeft:27}}>
              <div style={{height:"100%",background:"linear-gradient(90deg,"+col+","+col+"88)",borderRadius:2,"--fill-w":pct+"%",width:"var(--fill-w)",animation:"civlyBarFill 0.6s ease forwards",animationDelay:(i*0.06)+"s"}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActiveBillsPanelContent({nav,wb,toggleB}){
  const featured=["b1","b3","b6","b10"].map(id=>bills.find(b=>b.id===id)).filter(Boolean);
  return(
    <div style={{padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {featured.map(bill=>{
        const sp=getSp(bill);
        const houseVotes=bill.votes?.house;
        const yeaPct=houseVotes?Math.round((houseVotes.yea/(houseVotes.yea+houseVotes.nay))*100):null;
        const col=SC[bill.status]||C.accent2;
        const isLive=["on_the_floor","in_committee"].includes(bill.status);
        return(
          <div key={bill.id} onClick={()=>nav("billDetail",bill.id)}
            style={{cursor:"pointer",background:C.card,borderRadius:14,border:"1.5px solid "+C.border,transition:"box-shadow 0.22s,transform 0.18s,border-color 0.15s",display:"flex",flexDirection:"column",overflow:"hidden"}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=col+"55";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=C.border;}}>
            {/* Colored top strip */}
            <div style={{height:3,background:"linear-gradient(90deg,"+col+","+col+"66)",flexShrink:0}}/>
            <div style={{padding:"10px 11px",flex:1,display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:F.mono,fontSize:8,fontWeight:700,color:col,background:col+"12",padding:"2px 7px",borderRadius:9999,letterSpacing:0.5,textTransform:"uppercase"}}>
                  {isLive&&<span style={{width:5,height:5,borderRadius:"50%",background:col,display:"inline-block",animation:"civlyGlow 1.6s ease-in-out infinite"}}/>}
                  {SL[bill.status]||bill.status}
                </span>
                <span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>{bill.num}</span>
              </div>
              <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,lineHeight:1.35,marginBottom:6,flex:1,letterSpacing:"-0.1px"}}>{bill.title}</div>
              {sp&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:houseVotes?7:4}}>
                <Avatar bio={sp.bio} name={sp.name} size={14}/>
                <span style={{fontFamily:F.body,fontSize:10,color:C.text2}}>{sp.name.split(" ").pop()}</span>
              </div>}
              {houseVotes&&<div style={{marginBottom:4}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontFamily:F.mono,fontSize:8,color:C.success,fontWeight:700}}>YEA {houseVotes.yea}</span>
                  <span style={{fontFamily:F.mono,fontSize:8,color:C.error,fontWeight:700}}>NAY {houseVotes.nay}</span>
                </div>
                <div style={{height:3,background:C.error+"25",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"linear-gradient(90deg,"+C.success+",#16a34a)",borderRadius:2,"--fill-w":yeaPct+"%",width:"var(--fill-w)",animation:"civlyBarFill 0.75s ease forwards",animationDelay:"0.2s"}}/>
                </div>
              </div>}
              <BillStageBar status={bill.status} compact/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewsHeadlineItem({item,last}){
  const[expanded,setExpanded]=useState(false);
  const brand=OUTLET_BRAND[item.source]||{color:"#6B7280",bg:"#6B728012",border:"#6B728030"};
  const openArticle=e=>{e.stopPropagation();if(item.url)window.open(item.url,"_blank","noopener,noreferrer");};
  return(
    <div style={{borderBottom:last?"none":"1px solid "+C.border,transition:"background 0.1s"}}
      onMouseEnter={e=>e.currentTarget.style.background=C.bg2+"80"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div onClick={()=>setExpanded(x=>!x)} style={{padding:"11px 16px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
          <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:brand.color,background:brand.bg,border:"1px solid "+brand.border,padding:"2px 8px",borderRadius:9999,letterSpacing:0.6,flexShrink:0,textTransform:"uppercase"}}>{item.source}</span>
          <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{new Date(item.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
          <span style={{marginLeft:"auto",fontFamily:F.mono,fontSize:9,color:C.textM,flexShrink:0}}>{expanded?"▲":"▼"}</span>
        </div>
        <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,lineHeight:1.4,letterSpacing:"-0.1px"}}>{item.title}</div>
      </div>
      {expanded&&<div style={{padding:"0 16px 12px",marginTop:-4}}>
        <div style={{fontFamily:F.body,fontSize:11,color:C.text2,fontWeight:300,lineHeight:1.6,marginBottom:10}}>{item.blurb}</div>
        {item.url&&<button onClick={openArticle} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.mono,fontSize:10,fontWeight:600,color:brand.color,background:brand.bg,border:"1px solid "+brand.border,padding:"5px 12px",borderRadius:9999,transition:"opacity 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.75"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Read on {item.source}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>}
      </div>}
    </div>
  );
}

function BillNewsPanelContent({config,nav,newsOutlet}){
  const bill=bills.find(b=>b.id===config.billId);
  const allItems=BILL_NEWS[config.billId]||[];
  const newsItems=newsOutlet?allItems.filter(n=>n.source===newsOutlet):allItems;
  if(!bill)return<div style={{padding:20,color:C.textM,fontFamily:F.body,fontSize:12}}>Bill not found</div>;
  return(
    <div>
      <div onClick={()=>nav("billDetail",bill.id)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"10px 16px 8px",borderBottom:"1px solid "+C.border,background:"rgba(26,39,68,0.025)"}}>
        <StatusBadge status={bill.status}/>
        <span style={{fontFamily:F.display,fontSize:12,color:C.text,flex:1,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.1px"}}>{bill.title}</span>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.textM,flexShrink:0}}>{bill.num}</span>
      </div>
      {newsOutlet&&<div style={{padding:"5px 16px 0",display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>Filtered to</span>
        <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:OUTLET_BRAND[newsOutlet]?.color||C.accent2,background:OUTLET_BRAND[newsOutlet]?.bg||C.bg2,border:"1px solid "+(OUTLET_BRAND[newsOutlet]?.border||C.border),padding:"1px 6px",borderRadius:9999,textTransform:"uppercase"}}>{newsOutlet}</span>
      </div>}
      {newsItems.length===0&&<div style={{padding:20,color:C.textM,fontFamily:F.body,fontSize:12,textAlign:"center"}}>No {newsOutlet} coverage found for this bill.</div>}
      {newsItems.map((item,i)=><NewsHeadlineItem key={item.id} item={item} last={i===newsItems.length-1}/>)}
    </div>
  );
}

function WatchlistPanelContent({nav,wb,toggleB,wm,toggleM}){
  const watchedBills=(wb||[]).map(id=>bills.find(b=>b.id===id)).filter(Boolean);
  const watchedMembers=(wm||[]).map(id=>members.find(m=>m.id===id)).filter(Boolean);
  if(watchedBills.length===0&&watchedMembers.length===0){
    return(
      <div style={{padding:"32px 20px",textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:12,background:C.bg2,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:C.textM}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
        </div>
        <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text2,marginBottom:4}}>Your watchlist is empty</div>
        <div style={{fontFamily:F.body,fontSize:11,color:C.textM,lineHeight:1.5}}>Bookmark bills and members<br/>to track them here.</div>
      </div>
    );
  }
  return(
    <div>
      {watchedBills.length>0&&<>
        <div style={{padding:"10px 14px 5px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Bills</span>
          <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:"#fff",background:C.accent2,padding:"1px 6px",borderRadius:9999,letterSpacing:0.5}}>{watchedBills.length}</span>
        </div>
        {watchedBills.map((bill,i)=>{
          const col=SC[bill.status]||C.accent2;
          return(
            <div key={bill.id} onClick={()=>nav("billDetail",bill.id)}
              style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderBottom:i<watchedBills.length-1||watchedMembers.length>0?"1px solid "+C.border+"60":"none",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg+"80"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* Status dot */}
              <div style={{width:7,height:7,borderRadius:"50%",background:col,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F.display,fontSize:12,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.1px"}}>{bill.title}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                  <span style={{fontFamily:F.mono,fontSize:8,color:col,fontWeight:600,background:col+"12",padding:"1px 5px",borderRadius:9999,textTransform:"uppercase",letterSpacing:0.5}}>{SL[bill.status]||bill.status}</span>
                  <span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>{bill.num}</span>
                </div>
              </div>
              <button onClick={e=>{e.stopPropagation();toggleB&&toggleB(bill.id);}}
                style={{all:"unset",cursor:"pointer",color:C.textM,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,fontSize:12,flexShrink:0,transition:"all 0.1s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#c41e3a";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textM;}}>✕</button>
            </div>
          );
        })}
      </>}
      {watchedMembers.length>0&&<>
        <div style={{padding:"10px 14px 5px",display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Members</span>
          <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:"#fff",background:C.success,padding:"1px 6px",borderRadius:9999,letterSpacing:0.5}}>{watchedMembers.length}</span>
        </div>
        {watchedMembers.map((mem,i)=>(
          <div key={mem.id} onClick={()=>nav("memberProfile",mem.id)}
            style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9,padding:"8px 14px",borderBottom:i<watchedMembers.length-1?"1px solid "+C.border+"60":"none",transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg+"80"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Avatar bio={mem.bio} name={mem.name} size={30}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:F.display,fontSize:12,color:C.text,fontWeight:600,letterSpacing:"-0.1px"}}>{mem.pre} {mem.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><PD party={mem.party} size={5}/><span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{mem.state} · {mem.chamber}</span></div>
            </div>
            <button onClick={e=>{e.stopPropagation();toggleM&&toggleM(mem.id);}}
              style={{all:"unset",cursor:"pointer",color:C.textM,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,fontSize:12,flexShrink:0,transition:"all 0.1s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#fef2f2";e.currentTarget.style.color="#c41e3a";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textM;}}>✕</button>
          </div>
        ))}
      </>}
    </div>
  );
}

function AddPanelModal({onAdd,onClose}){
  const[step,setStep]=useState("type");
  const[chosenType,setChosenType]=useState(null);
  const[search,setSearch]=useState("");
  const pickType=type=>{
    if(PANEL_DEFS[type].needsConfig){setChosenType(type);setStep("config");}
    else{onAdd({type,config:{},w:6});}
  };
  const pickConfig=item=>{
    const isM=PANEL_DEFS[chosenType].configType==="member";
    onAdd({type:chosenType,config:isM?{memberId:item.id,name:item.name}:{billId:item.id,name:item.title},w:4});
  };
  const configType=chosenType?PANEL_DEFS[chosenType].configType:null;
  const items=step==="config"
    ?configType==="member"
      ?members.filter(m=>!search||m.name.toLowerCase().includes(search.toLowerCase())||m.state.toLowerCase().includes(search.toLowerCase()))
      :bills.filter(b=>!search||b.title.toLowerCase().includes(search.toLowerCase())||b.num.toLowerCase().includes(search.toLowerCase()))
    :[];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,38,0.5)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",paddingTop:64}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:14,width:520,maxHeight:"72vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(10,18,38,0.22),0 4px 16px rgba(10,18,38,0.08)",border:"1px solid "+C.border}} onClick={e=>e.stopPropagation()}>
        {/* Clean header — no dark zone */}
        <div style={{padding:"18px 20px 14px",borderBottom:"1px solid #f0f2f7",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text,letterSpacing:"-0.3px",lineHeight:1.1}}>
                {step==="type"?"Add a panel":"Choose "+(configType==="member"?"a member":"a bill")}
              </div>
              <div style={{fontFamily:F.body,fontSize:11,color:C.textM,marginTop:4}}>
                {step==="type"?"Select a panel type to add to your dashboard":("Pick the "+(configType==="member"?"member":"bill")+" this panel will track")}
              </div>
              {step==="config"&&(
                <button onClick={()=>{setStep("type");setSearch("");}}
                  style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:C.accent2,marginTop:6,display:"inline-flex",alignItems:"center",gap:3,transition:"opacity 0.12s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.7"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to panel types
                </button>
              )}
            </div>
            <button onClick={onClose}
              style={{all:"unset",cursor:"pointer",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:7,color:C.textM,border:"1px solid "+C.border,transition:"all 0.12s",flexShrink:0,marginTop:2}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.bg2;e.currentTarget.style.color=C.text;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textM;}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        {/* Panel type grid */}
        {step==="type"&&(
          <div style={{padding:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,overflowY:"auto"}} className="civly-scroll">
            {Object.entries(PANEL_DEFS).map(([type,def])=>{
              return(
                <button key={type} onClick={()=>pickType(type)}
                  style={{all:"unset",cursor:"pointer",background:"#fff",borderRadius:10,padding:"14px",border:"1px solid "+C.border,transition:"all 0.15s",display:"flex",flexDirection:"column",gap:6,textAlign:"left"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.boxShadow="0 4px 14px rgba(15,29,58,0.07)";e.currentTarget.style.transform="translateY(-1px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#fff";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                  <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,letterSpacing:"-0.15px"}}>{def.label}</div>
                  <div style={{fontFamily:F.body,fontSize:10,color:C.textM,fontWeight:400,lineHeight:1.45}}>{def.desc}</div>
                </button>
              );
            })}
          </div>
        )}
        {/* Config search */}
        {step==="config"&&(
          <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
            <div style={{padding:"10px 16px 10px",borderBottom:"1px solid #f0f2f7",flexShrink:0}}>
              <div style={{position:"relative"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={"Search "+(configType==="member"?"members…":"bills…")} autoFocus
                  style={{width:"100%",boxSizing:"border-box",background:C.bg,border:"1px solid "+C.border,borderRadius:8,padding:"9px 12px 9px 34px",fontSize:12,fontFamily:F.body,outline:"none",color:C.text,transition:"border-color 0.15s"}}
                  onFocus={e=>e.target.style.borderColor=C.accent2} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            </div>
            <div style={{overflowY:"auto",flex:1}} className="civly-scroll">
              {items.map((item)=>(
                <button key={item.id} onClick={()=>pickConfig(item)}
                  style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",width:"100%",boxSizing:"border-box",borderBottom:"1px solid #f0f2f7",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {configType==="member"
                    ?<><Avatar bio={item.bio} name={item.name} size={30}/>
                       <div style={{flex:1,minWidth:0}}>
                         <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,letterSpacing:"-0.1px"}}>{item.pre} {item.name}</div>
                         <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:1}}>{item.party} · {item.state} · {item.chamber}</div>
                       </div>
                       <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:pc(item.party),background:pc(item.party)+"14",padding:"2px 7px",borderRadius:9999,flexShrink:0}}>{pA(item.party)}</span>
                     </>
                    :<><div style={{flex:1,minWidth:0}}>
                         <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,letterSpacing:"-0.1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                         <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginTop:2,letterSpacing:0.2}}>{item.num} · {SL[item.status]||item.status}</div>
                       </div>
                     </>
                  }
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CHART COMPONENTS
// ─────────────────────────────────────────────────────────

function FilterBtn({options,value,onChange}){
  return(
    <div style={{display:"flex",gap:1,padding:2,background:C.bg2,borderRadius:8,border:"1px solid "+C.border}}>
      {options.map(o=>{
        const isA=value===o.key;
        return(
          <button key={o.key} onClick={()=>onChange(o.key)}
            style={{all:"unset",cursor:"pointer",fontFamily:F.mono,fontSize:9,fontWeight:isA?700:500,color:isA?C.navy:C.textM,background:isA?"#fff":"transparent",padding:"3px 9px",borderRadius:6,transition:"all 0.15s",letterSpacing:0.3,whiteSpace:"nowrap",boxShadow:isA?C.cardShadow:"none"}}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function LegProgressChartPanel({nav}){
  const[filter,setFilter]=useState("all");
  const STATUS_BARS=[
    {key:"introduced",label:"Intro",col:"#7c3aed"},
    {key:"in_committee",label:"Committee",col:"#b45309"},
    {key:"on_the_floor",label:"Floor",col:"#0369a1"},
    {key:"passed_house",label:"Passed H.",col:"#1e40af"},
    {key:"passed_senate",label:"Passed S.",col:"#1a4db8"},
    {key:"signed_into_law",label:"Signed",col:"#15803d"},
    {key:"failed",label:"Failed",col:"#c41e3a"},
  ];
  const filtered=filter==="all"?bills:bills.filter(b=>filter==="senate"?b.spId&&members.find(m=>m.id===b.spId)?.chamber==="Senate":b.spId&&members.find(m=>m.id===b.spId)?.chamber==="House");
  const counts=STATUS_BARS.map(s=>({...s,count:filtered.filter(b=>b.status===s.key).length}));
  const maxC=Math.max(...counts.map(c=>c.count),1);
  const VH=110,PADL=28,PADB=32,PADT=10,PADR=8;
  const barW=30,barGap=10;
  const totalW=counts.length*(barW+barGap)-barGap;
  const svgW=PADL+totalW+PADR;
  const svgH=VH+PADB+PADT;
  const yTicks=[0,Math.ceil(maxC/4),Math.ceil(maxC/2),Math.ceil(maxC*3/4),maxC].filter((v,i,a)=>a.indexOf(v)===i);
  return(
    <div style={{padding:"14px 16px 10px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>Bills by Stage</div>
          <div style={{fontFamily:F.body,fontSize:11,color:C.textM}}>{filtered.length} bills · 119th Congress</div>
        </div>
        <FilterBtn options={[{key:"all",label:"All"},{key:"house",label:"House"},{key:"senate",label:"Senate"}]} value={filter} onChange={setFilter}/>
      </div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{overflow:"visible",display:"block"}}>
        {/* Y-axis gridlines + labels */}
        {yTicks.map(tick=>{
          const y=PADT+VH-(tick/maxC)*VH;
          return(
            <g key={tick}>
              <line x1={PADL} y1={y} x2={PADL+totalW} y2={y} stroke={C.border} strokeWidth="0.5" strokeDasharray="3,2"/>
              <text x={PADL-4} y={y+3} textAnchor="end" fontFamily={F.mono} fontSize="7" fill={C.textM}>{tick}</text>
            </g>
          );
        })}
        {/* Bars */}
        {counts.map((s,i)=>{
          const x=PADL+i*(barW+barGap);
          const bH=s.count>0?(s.count/maxC)*VH:2;
          const y=PADT+VH-bH;
          return(
            <g key={s.key} style={{cursor:"pointer"}} onClick={()=>nav("bills")}>
              {/* Bar shadow / base */}
              <rect x={x} y={PADT+VH-2} width={barW} height={2} rx="1" fill={s.col+"18"}/>
              {/* Animated bar */}
              <rect x={x} y={y} width={barW} height={bH} rx="3"
                fill={s.col} fillOpacity="0.9"
                style={{animation:`civlyBarFill 0.6s ease forwards`,animationDelay:`${i*0.07}s`,transformOrigin:`${x}px ${PADT+VH}px`}}>
              </rect>
              {/* Count label on bar */}
              {s.count>0&&<text x={x+barW/2} y={y-4} textAnchor="middle" fontFamily={F.mono} fontSize="8" fontWeight="700" fill={s.col}>{s.count}</text>}
              {/* X label */}
              <text x={x+barW/2} y={PADT+VH+PADB-4} textAnchor="middle" fontFamily={F.mono} fontSize="7" fill={C.textM} style={{letterSpacing:0}}>{s.label}</text>
            </g>
          );
        })}
        {/* X axis */}
        <line x1={PADL} y1={PADT+VH} x2={PADL+totalW} y2={PADT+VH} stroke={C.border} strokeWidth="1"/>
      </svg>
    </div>
  );
}

// Simulated weekly trend data per status group
const LEG_TREND_WEEKS=["W1","W2","W3","W4","W5","W6","W7","W8"];
const LEG_TREND_SERIES=[
  {label:"Pending",col:"#7c3aed",data:[3,4,5,6,5,7,8,7]},
  {label:"Working",col:"#b45309",data:[1,2,3,3,4,3,4,5]},
  {label:"Committee",col:"#0369a1",data:[2,2,3,4,4,5,4,4]},
  {label:"Floor",col:"#1e40af",data:[0,1,1,2,2,3,3,4]},
  {label:"Completed",col:"#15803d",data:[0,0,1,1,2,2,3,4]},
];

function LegStatsChartPanel(){
  const[hovW,setHovW]=useState(null);
  const VH=120,PADL=24,PADB=28,PADT=10,PADR=8;
  const wCount=LEG_TREND_WEEKS.length;
  const allVals=LEG_TREND_SERIES.flatMap(s=>s.data);
  const maxV=Math.max(...allVals,1);
  const svgW=PADL+280+PADR;
  const svgH=VH+PADB+PADT;
  const xStep=280/(wCount-1);
  const getX=i=>PADL+i*xStep;
  const getY=v=>PADT+VH-(v/maxV)*VH;
  const makePath=data=>data.map((v,i)=>`${i===0?"M":"L"}${getX(i)},${getY(v)}`).join(" ");
  const makeArea=data=>{
    const top=data.map((v,i)=>`${i===0?"M":"L"}${getX(i)},${getY(v)}`).join(" ");
    const bottom=`L${getX(wCount-1)},${PADT+VH} L${getX(0)},${PADT+VH} Z`;
    return top+" "+bottom;
  };
  const yTicks=[0,Math.ceil(maxV/2),maxV];
  return(
    <div style={{padding:"14px 16px 10px"}}>
      <div style={{marginBottom:12}}>
        <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>8-Week Activity Trend</div>
        <div style={{fontFamily:F.body,fontSize:11,color:C.textM}}>Bills in progress by stage</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{overflow:"visible",display:"block"}}
        onMouseLeave={()=>setHovW(null)}>
        <defs>
          {LEG_TREND_SERIES.map(s=>(
            <linearGradient key={s.label} id={`tg-${s.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.col} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={s.col} stopOpacity="0.01"/>
            </linearGradient>
          ))}
        </defs>
        {/* Gridlines */}
        {yTicks.map(tick=>(
          <g key={tick}>
            <line x1={PADL} y1={getY(tick)} x2={PADL+280} y2={getY(tick)} stroke={C.border} strokeWidth="0.5" strokeDasharray="3,2"/>
            <text x={PADL-4} y={getY(tick)+3} textAnchor="end" fontFamily={F.mono} fontSize="7" fill={C.textM}>{tick}</text>
          </g>
        ))}
        {/* Areas */}
        {LEG_TREND_SERIES.map(s=>(
          <path key={s.label+"-area"} d={makeArea(s.data)} fill={`url(#tg-${s.label})`}/>
        ))}
        {/* Lines */}
        {LEG_TREND_SERIES.map(s=>(
          <path key={s.label+"-line"} d={makePath(s.data)} fill="none" stroke={s.col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        ))}
        {/* Dots */}
        {LEG_TREND_SERIES.map(s=>s.data.map((v,i)=>(
          <circle key={s.label+i} cx={getX(i)} cy={getY(v)} r={hovW===i?4:2.5} fill="#fff" stroke={s.col} strokeWidth="1.5"
            style={{transition:"r 0.1s"}}
            onMouseEnter={()=>setHovW(i)}/>
        )))}
        {/* Hover line */}
        {hovW!==null&&<line x1={getX(hovW)} y1={PADT} x2={getX(hovW)} y2={PADT+VH} stroke={C.border} strokeWidth="1" strokeDasharray="2,2"/>}
        {/* X labels */}
        {LEG_TREND_WEEKS.map((w,i)=>(
          <text key={w} x={getX(i)} y={PADT+VH+PADB-4} textAnchor="middle" fontFamily={F.mono} fontSize="7" fill={C.textM}>{w}</text>
        ))}
        {/* X axis */}
        <line x1={PADL} y1={PADT+VH} x2={PADL+280} y2={PADT+VH} stroke={C.border} strokeWidth="1"/>
      </svg>
      {/* Legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px 12px",marginTop:6}}>
        {LEG_TREND_SERIES.map(s=>(
          <div key={s.label} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:8,height:8,borderRadius:2,background:s.col,flexShrink:0}}/>
            <span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VotingDistChartPanel({nav}){
  const withVotes=bills.filter(b=>b.votes?.house);
  const totalYea=withVotes.reduce((s,b)=>s+b.votes.house.yea,0);
  const totalNay=withVotes.reduce((s,b)=>s+b.votes.house.nay,0);
  const total=totalYea+totalNay;
  const yeaPct=total>0?Math.round((totalYea/total)*100):0;
  const nayPct=100-yeaPct;
  // SVG donut
  const R=44,r=28,cx=60,cy=60;
  const toRad=deg=>deg*Math.PI/180;
  const arc=(startDeg,endDeg,outerR,innerR,col)=>{
    if(Math.abs(endDeg-startDeg)>=360)endDeg=startDeg+359.99;
    const s1=toRad(startDeg-90),e1=toRad(endDeg-90);
    const x1=cx+outerR*Math.cos(s1),y1=cy+outerR*Math.sin(s1);
    const x2=cx+outerR*Math.cos(e1),y2=cy+outerR*Math.sin(e1);
    const x3=cx+innerR*Math.cos(e1),y3=cy+innerR*Math.sin(e1);
    const x4=cx+innerR*Math.cos(s1),y4=cy+innerR*Math.sin(s1);
    const lg=endDeg-startDeg>180?1:0;
    return`M${x1},${y1} A${outerR},${outerR} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${lg},0 ${x4},${y4} Z`;
  };
  const yeaDeg=yeaPct/100*360;
  return(
    <div style={{padding:"14px 16px 10px"}}>
      <div style={{marginBottom:12}}>
        <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,marginBottom:2}}>House Vote Results</div>
        <div style={{fontFamily:F.body,fontSize:11,color:C.textM}}>{withVotes.length} bills with recorded votes</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{flexShrink:0}}>
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={(R+r)/2} fill="none" stroke={C.bg2} strokeWidth={R-r}/>
          {/* Yea arc */}
          <path d={arc(0,yeaDeg,R,r,"#15803d")} fill="#15803d" fillOpacity="0.9"/>
          {/* Nay arc */}
          <path d={arc(yeaDeg,360,R,r,"#c41e3a")} fill="#c41e3a" fillOpacity="0.9"/>
          {/* Center text */}
          <text x={cx} y={cy-4} textAnchor="middle" fontFamily={F.mono} fontSize="14" fontWeight="700" fill={C.text}>{yeaPct}%</text>
          <text x={cx} y={cy+10} textAnchor="middle" fontFamily={F.body} fontSize="8" fill={C.textM}>YEA</text>
        </svg>
        <div style={{flex:1,minWidth:0}}>
          {/* Yea */}
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontFamily:F.body,fontSize:11,color:C.text,fontWeight:500}}>Yea votes</span>
              <span style={{fontFamily:F.mono,fontSize:10,fontWeight:700,color:"#15803d"}}>{yeaPct}%</span>
            </div>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}>
              <div style={{width:yeaPct+"%",height:"100%",background:"linear-gradient(90deg,#15803d,#16a34a)",borderRadius:3,"--fill-w":yeaPct+"%",animation:"civlyBarFill 0.8s ease forwards"}}/>
            </div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginTop:2}}>{totalYea.toLocaleString()} total</div>
          </div>
          {/* Nay */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontFamily:F.body,fontSize:11,color:C.text,fontWeight:500}}>Nay votes</span>
              <span style={{fontFamily:F.mono,fontSize:10,fontWeight:700,color:"#c41e3a"}}>{nayPct}%</span>
            </div>
            <div style={{height:6,background:C.bg2,borderRadius:3,overflow:"hidden"}}>
              <div style={{width:nayPct+"%",height:"100%",background:"linear-gradient(90deg,#c41e3a,#e03650)",borderRadius:3,"--fill-w":nayPct+"%",animation:"civlyBarFill 0.8s ease forwards",animationDelay:"0.1s"}}/>
            </div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginTop:2}}>{totalNay.toLocaleString()} total</div>
          </div>
        </div>
      </div>
      <button onClick={()=>nav("bills")} style={{all:"unset",cursor:"pointer",display:"block",width:"100%",textAlign:"center",marginTop:12,padding:"7px 0",borderRadius:8,background:C.bg2,fontFamily:F.body,fontSize:11,color:C.text2,fontWeight:400,border:"1px solid "+C.border,transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.navy;e.currentTarget.style.color="#fff";}}
        onMouseLeave={e=>{e.currentTarget.style.background=C.bg2;e.currentTarget.style.color=C.text2;}}>
        View all voting records →
      </button>
    </div>
  );
}

// Smooth cubic-bezier sparkline
function Sparkline({data,col,h=44,w=160}){
  if(!data||data.length<2)return null;
  const max=Math.max(...data,1);
  const min=Math.min(...data);
  const range=max-min||1;
  const pad=4;
  const coords=data.map((v,i)=>({
    x:(i/(data.length-1))*(w-pad*2)+pad,
    y:h-pad-((v-min)/range)*(h-pad*2),
  }));
  // Catmull-Rom → cubic bezier smooth path
  const smooth=coords.map((p,i)=>{
    if(i===0)return`M${p.x},${p.y}`;
    const prev=coords[i-1];
    const cp1x=prev.x+(p.x-prev.x)*0.45;
    const cp1y=prev.y;
    const cp2x=prev.x+(p.x-prev.x)*0.55;
    const cp2y=p.y;
    return`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
  }).join(" ");
  const area=`${smooth} L${coords[coords.length-1].x},${h} L${coords[0].x},${h} Z`;
  const gId=`sp-${col.replace(/#/g,"")}`;
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block"}}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`}/>
      <path d={smooth} fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* End dot */}
      <circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y} r="2.5" fill={col}/>
    </svg>
  );
}

function DashboardStatsBar({wb,wm,nav}){
  const activeFloor=bills.filter(b=>b.status==="on_the_floor").length;
  const inCommittee=bills.filter(b=>b.status==="in_committee").length;
  const thisWeekCount=calendarEvents.filter(e=>{
    const d=new Date(e.date+"T12:00:00");const now=new Date();
    const diff=(d-now)/(1000*60*60*24);return diff>=0&&diff<=7;
  }).length;
  const signed=bills.filter(b=>b.status==="signed_into_law").length;
  const stats=[
    {label:"Active Floor",value:activeFloor,sub:"Bills on floor now",delta:"+1 this week",up:true,dest:"bills",live:true},
    {label:"In Committee",value:inCommittee,sub:"Under review",delta:null,up:null,dest:"bills"},
    {label:"Enacted",value:signed,sub:"Signed into law",delta:"+"+signed+" total",up:true,dest:"bills"},
    {label:"Watching",value:(wb?.length||0)+(wm?.length||0),sub:`${wb?.length||0} bills · ${wm?.length||0} members`,delta:(wb?.length||0)+(wm?.length||0)>0?"+"+((wb?.length||0)+(wm?.length||0)):null,up:null,dest:"saved"},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
      {stats.map(s=>(
        <div key={s.label} onClick={()=>nav(s.dest)}
          style={{background:"#fff",borderRadius:14,padding:"18px 18px 20px",border:"1px solid "+C.border,cursor:"pointer",transition:"transform 0.18s,box-shadow 0.18s",boxShadow:C.cardShadow,position:"relative"}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 28px rgba(15,29,58,0.09)";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.cardShadow;e.currentTarget.style.transform="none";}}>
          {/* Live dot */}
          {s.live&&<span style={{position:"absolute",top:14,right:14,width:6,height:6,borderRadius:"50%",background:"#c41e3a",animation:"civlyDotBounce 1.6s ease-in-out infinite"}}/>}
          {/* Big number */}
          <div style={{fontFamily:F.display,fontSize:30,fontWeight:700,color:C.text,lineHeight:1,letterSpacing:"-0.5px",marginBottom:6}}>{s.value}</div>
          {/* Label */}
          <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text2,marginBottom:4}}>{s.label}</div>
          {/* Sub + delta */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{s.sub}</span>
            {s.delta&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:s.up?"#15803d":C.textM}}>{s.delta}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BILL PIPELINE (Kanban) ────────────────────────────────
const PIPE_COLS=[
  {key:"in_committee",label:"Committee",live:false},
  {key:"on_the_floor",label:"On Floor",live:true},
  {key:"passed_house",label:"Passed House",live:false},
  {key:"passed_senate",label:"Passed Senate",live:false},
  {key:"signed_into_law",label:"Enacted",live:false},
];
function BillPipelinePanel({nav,wb,toggleB}){
  const[hovBill,setHovBill]=useState(null);
  const colBills=PIPE_COLS.map(col=>({...col,bills:bills.filter(b=>b.status===col.key)}));
  return(
    <div style={{padding:"16px 0 12px"}}>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",padding:"0 18px",marginBottom:16}}>
        <span style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:C.text,letterSpacing:"-0.2px"}}>
          {bills.filter(b=>!["signed_into_law","failed","vetoed"].includes(b.status)).length} bills in progress
        </span>
        <button onClick={()=>nav("bills")} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:12,color:C.textM,display:"flex",alignItems:"center",gap:2,transition:"color 0.12s"}}
          onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.textM}>
          View all <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div style={{display:"flex",gap:0,overflowX:"auto",paddingBottom:8}} className="civly-scroll">
        {colBills.map((col,ci)=>(
          <div key={col.key} style={{minWidth:188,flex:"0 0 188px",paddingLeft:ci===0?18:0,paddingRight:ci===colBills.length-1?18:12}}>
            {/* Column label */}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
              {col.live&&<span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",flexShrink:0,animation:"civlyDotBounce 1.6s ease-in-out infinite"}}/>}
              <span style={{fontFamily:F.body,fontSize:11,fontWeight:500,color:C.text2}}>{col.label}</span>
              <span style={{fontFamily:F.mono,fontSize:10,color:C.textM,marginLeft:"auto"}}>{col.bills.length}</span>
            </div>
            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {col.bills.length===0&&(
                <div style={{padding:"24px 0",textAlign:"center",fontFamily:F.body,fontSize:11,color:C.textM,borderRadius:10,background:C.bg,border:"1px dashed "+C.border}}>—</div>
              )}
              {col.bills.map(bill=>{
                const sp=getSp(bill);
                const isHov=hovBill===bill.id;
                const isW=wb?.includes(bill.id);
                return(
                  <div key={bill.id}
                    onClick={()=>nav("billDetail",bill.id)}
                    onMouseEnter={()=>setHovBill(bill.id)}
                    onMouseLeave={()=>setHovBill(null)}
                    style={{background:"#fff",borderRadius:10,padding:"12px",border:"1px solid "+(isHov?C.border:C.border),cursor:"pointer",transition:"box-shadow 0.18s ease,transform 0.18s ease",boxShadow:isHov?"0 8px 24px rgba(15,29,58,0.1)":"0 1px 3px rgba(15,29,58,0.05)",transform:isHov?"translateY(-2px)":"none"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:0.2}}>{bill.num}</span>
                      <button onClick={e=>{e.stopPropagation();toggleB&&toggleB(bill.id);}}
                        style={{all:"unset",cursor:"pointer",color:isW?C.text:C.textM,opacity:isW?0.8:0.3,transition:"opacity 0.15s",marginTop:-1}}
                        onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity=isW?"0.8":"0.3"}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill={isW?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                      </button>
                    </div>
                    <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,lineHeight:1.45,letterSpacing:"-0.1px",marginBottom:10}}>{bill.title}</div>
                    {sp&&<div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Avatar bio={sp.bio} name={sp.name} size={16}/>
                      <span style={{fontFamily:F.body,fontSize:10,color:C.textM,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.name.split(" ").pop()}</span>
                      <PD party={sp.party} size={5}/>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ─────────────────────────────────────────
function ActivityFeedPanel({nav}){
  const events=[
    ...billUpdates.map(u=>({id:u.id,type:"bill",date:u.date,title:u.title,desc:u.desc,billId:u.billId})),
    ...calendarEvents.slice(0,4).map(e=>({id:"ev-"+e.id,type:e.type,date:e.date,title:e.title,desc:e.desc,billId:e.billId})),
  ].sort((a,b)=>new Date(b.date+"T12:00:00")-new Date(a.date+"T12:00:00")).slice(0,8);
  return(
    <div>
      {events.map((e,i)=>(
        <div key={e.id} onClick={()=>e.billId&&nav("billDetail",e.billId)}
          style={{display:"flex",gap:14,padding:"13px 18px",borderBottom:i<events.length-1?"1px solid "+C.border:"none",cursor:e.billId?"pointer":"default",transition:"background 0.12s"}}
          onMouseEnter={ev=>{if(e.billId)ev.currentTarget.style.background=C.bg;}}
          onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
          {/* Date column */}
          <div style={{width:32,flexShrink:0,paddingTop:2}}>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,lineHeight:1.3}}>{e.date.slice(5).replace("-","/")}</div>
          </div>
          {/* Content */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,letterSpacing:"-0.15px",lineHeight:1.35,marginBottom:3}}>{e.title}</div>
            <div style={{fontFamily:F.body,fontSize:11,color:C.textM,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MEMBER LEADERBOARD ────────────────────────────────────
function MemberLeaderboardPanel({nav}){
  const scored=members.map(m=>{
    const sponsored=bills.filter(b=>b.spId===m.id).length;
    const cosponsored=bills.filter(b=>(b.coIds||[]).includes(m.id)).length;
    const score=sponsored*3+cosponsored;
    return{...m,sponsored,cosponsored,score};
  }).sort((a,b)=>b.score-a.score).slice(0,8);
  const maxScore=scored[0]?.score||1;
  return(
    <div>
      {scored.map((m,i)=>(
        <div key={m.id} onClick={()=>nav("memberProfile",m.id)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",borderBottom:i<scored.length-1?"1px solid "+C.border:"none",cursor:"pointer",transition:"background 0.12s"}}
          onMouseEnter={e=>e.currentTarget.style.background=C.bg}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          {/* Rank number */}
          <div style={{width:16,flexShrink:0,fontFamily:F.mono,fontSize:10,color:C.textM,textAlign:"right"}}>{i+1}</div>
          <Avatar bio={m.bio} name={m.name} size={30}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.15px",marginBottom:5}}>{m.name}</div>
            {/* Thin progress bar */}
            <div style={{height:2,background:C.border,borderRadius:9999,overflow:"hidden"}}>
              <div style={{height:"100%",background:C.text,borderRadius:9999,width:(m.score/maxScore*100)+"%",opacity:0.15+0.45*(m.score/maxScore),transition:"width 0.5s ease"}}/>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,minWidth:28}}>
            <div style={{fontFamily:F.display,fontSize:14,fontWeight:700,color:C.text,lineHeight:1}}>{m.score}</div>
            <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:1}}>{m.sponsored}+{m.cosponsored}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PARTY LINE VOTES ──────────────────────────────────────
function PartyLineVotesPanel({nav}){
  const voted=bills.filter(b=>b.votes?.house);
  const[hover,setHover]=useState(null);
  if(!voted.length)return null;
  const rows=voted.map(b=>{
    const{yea,nay}=b.votes.house;
    const total=yea+nay||1;
    const cp=b.votes.crossParty||[];
    const rCross=cp.filter(x=>x.party==="Republican");
    const dCross=cp.filter(x=>x.party==="Democrat");
    let rDir="Yea",dDir="Nay";
    if(rCross.length>0&&rCross[0].vote==="Nay"){rDir="Yea";dDir="Nay";}
    if(dCross.length>0&&dCross[0].vote==="Yea"){dDir="Yea";rDir="Nay";}
    const rBreak=(b.votes.house.rBreak||[]).length;
    const dBreak=(b.votes.house.dBreak||[]).length;
    const rTotal=220,dTotal=215;
    const rYea=rDir==="Yea"?rTotal-rBreak:rBreak;
    const dYea=dDir==="Yea"?dTotal-dBreak:dBreak;
    const rPct=Math.round((rYea/rTotal)*100);
    const dPct=Math.round((dYea/dTotal)*100);
    return{...b,rPct,dPct,rYea,dYea,rDir,dDir,rBreak,dBreak};
  }).sort((a,b)=>Math.abs(a.rPct-a.dPct)-Math.abs(b.rPct-b.dPct));

  return(
    <div>
      {rows.map((b,i)=>(
        <div key={b.id} onClick={()=>nav("billDetail",b.id)}
          onMouseEnter={()=>setHover(b.id)} onMouseLeave={()=>setHover(null)}
          style={{padding:"13px 18px",borderBottom:i<rows.length-1?"1px solid "+C.border:"none",cursor:"pointer",background:hover===b.id?C.bg:"transparent",transition:"background 0.12s"}}>
          <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,letterSpacing:"-0.15px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:10}}>{b.title}</div>
          {/* Stacked bars — no labels, just the two bars side by side */}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {[{pct:b.rPct,col:PC.republican},{pct:b.dPct,col:PC.democrat}].map(({pct,col},ri)=>(
              <div key={ri} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:4,borderRadius:9999,background:C.border,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:9999,background:col,opacity:0.65,width:pct+"%",transition:"width 0.5s ease"}}/>
                </div>
                <span style={{fontFamily:F.mono,fontSize:10,color:C.textM,width:28,textAlign:"right",flexShrink:0}}>{pct}%</span>
              </div>
            ))}
          </div>
          {(b.rBreak>0||b.dBreak>0)&&(
            <div style={{marginTop:7,fontFamily:F.body,fontSize:10,color:C.textM}}>
              {[b.rBreak>0&&`${b.rBreak}R`,b.dBreak>0&&`${b.dBreak}D`].filter(Boolean).join(" + ")} crossed party line
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── VOTE SCORECARD ────────────────────────────────────────
function VoteScorecardPanel({nav,wb}){
  const[selChamber,setSelChamber]=useState("House");
  const SAMPLE_IDS=["m15","m16","m17","m18","m19","m20","m26","m29","m30"];
  const displayMembers=members.filter(m=>SAMPLE_IDS.includes(m.id)&&m.chamber===selChamber);
  const votedBills=bills.filter(b=>selChamber==="House"?b.votes?.house:b.votes?.senate).slice(0,6);

  const getMemberVote=(bill,memberId)=>{
    const voteData=selChamber==="House"?bill.votes?.house:bill.votes?.senate;
    if(!voteData)return null;
    const cp=(bill.votes?.crossParty||[]).find(x=>x.id===memberId);
    if(cp)return cp.vote;
    const m=members.find(x=>x.id===memberId);
    if(!m)return null;
    const rBreakIds=voteData.rBreak||[];
    const dBreakIds=voteData.dBreak||[];
    if(rBreakIds.includes(memberId)||dBreakIds.includes(memberId))return null;
    const anyCP=(bill.votes?.crossParty||[])[0];
    let rDir="Yea",dDir="Nay";
    if(anyCP?.party==="Republican"){rDir=anyCP.vote==="Nay"?"Yea":"Nay";dDir=rDir==="Yea"?"Nay":"Yea";}
    if(anyCP?.party==="Democrat"){dDir=anyCP.vote==="Yea"?"Yea":"Nay";rDir=dDir==="Yea"?"Nay":"Yea";}
    return m.party==="Republican"?rDir:dDir;
  };

  const voteColor=(v)=>v==="Yea"?"#16a34a":v==="Nay"?"#dc2626":"#cbd5e1";
  const voteLabel=(v)=>v==="Yea"?"✓":v==="Nay"?"✗":"·";

  if(!displayMembers.length||!votedBills.length)return(
    <div style={{padding:24,textAlign:"center",color:C.textM,fontFamily:F.body,fontSize:12}}>No vote data available</div>
  );

  return(
    <div style={{padding:"0 0 8px"}}>
      {/* Chamber toggle */}
      <div style={{display:"flex",gap:16,padding:"10px 16px 10px"}}>
        {["House","Senate"].map(ch=>(
          <button key={ch} onClick={()=>setSelChamber(ch)}
            style={{all:"unset",cursor:"pointer",fontFamily:F.display,fontSize:12,fontWeight:600,
              color:selChamber===ch?C.text:C.textM,
              borderBottom:selChamber===ch?"2px solid "+C.navy:"2px solid transparent",
              paddingBottom:2,transition:"all 0.12s"}}>
            {ch}
          </button>
        ))}
      </div>
      {/* Table */}
      <div style={{overflowX:"auto"}} className="civly-scroll">
        <table style={{borderCollapse:"collapse",width:"100%",minWidth:360}}>
          <thead>
            <tr>
              <th style={{padding:"5px 16px",textAlign:"left",fontFamily:F.body,fontSize:10,fontWeight:500,color:C.textM,borderBottom:"1px solid "+C.border}}>Member</th>
              {votedBills.map(b=>(
                <th key={b.id} style={{padding:"5px 8px",textAlign:"center",fontFamily:F.body,fontSize:10,fontWeight:500,color:C.textM,borderBottom:"1px solid "+C.border,maxWidth:52,whiteSpace:"nowrap"}}>
                  <span title={b.title}>{b.num.replace("H.R.","HR").replace("S.","S")}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayMembers.map((m,mi)=>{
              return(
                <tr key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",transition:"background 0.12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(15,29,58,0.025)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"7px 16px",borderBottom:"1px solid rgba(221,226,237,0.4)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <PD party={m.party}/>
                      <span style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,whiteSpace:"nowrap"}}>{m.name.split(" ").pop()}</span>
                    </div>
                  </td>
                  {votedBills.map(b=>{
                    const v=getMemberVote(b,m.id);
                    const col=voteColor(v);
                    return(
                      <td key={b.id} style={{padding:"7px 8px",textAlign:"center",borderBottom:"1px solid rgba(221,226,237,0.4)"}}>
                        <span style={{fontFamily:F.mono,fontSize:12,fontWeight:700,color:col}}>{voteLabel(v)}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div style={{display:"flex",gap:14,padding:"8px 16px 4px"}}>
        {[["✓","Yea","#16a34a"],["✗","Nay","#dc2626"],["·","No data","#94a3b8"]].map(([sym,lbl,col])=>(
          <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontFamily:F.mono,fontSize:12,fontWeight:700,color:col}}>{sym}</span>
            <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BILL SUCCESS FUNNEL ───────────────────────────────────
function BillFunnelPanel({nav}){
  const[hover,setHover]=useState(null);
  const stages=[
    {key:"introduced",label:"Introduced",keys:["introduced"]},
    {key:"in_committee",label:"In Committee",keys:["in_committee"]},
    {key:"on_the_floor",label:"On the Floor",keys:["on_the_floor"]},
    {key:"passed_one",label:"Passed a Chamber",keys:["passed_house","passed_senate"]},
    {key:"enacted",label:"Enacted",keys:["signed_into_law"]},
  ];
  const counts=stages.map(s=>({...s,n:bills.filter(b=>s.keys.includes(b.status)).length}));
  const terminal=bills.filter(b=>["failed","vetoed"].includes(b.status)).length;
  const total=bills.length||1;
  const maxW=counts[0].n||1;

  return(
    <div style={{padding:"10px 16px 14px"}}>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {counts.map((s,i)=>{
          const barW=Math.round((s.n/maxW)*100);
          const pct=Math.round((s.n/total)*100);
          const isHov=hover===s.key;
          const conv=i>0&&counts[i-1].n>0?Math.round((s.n/counts[i-1].n)*100):100;
          return(
            <div key={s.key} onMouseEnter={()=>setHover(s.key)} onMouseLeave={()=>setHover(null)}>
              {/* Conversion hint */}
              {i>0&&(
                <div style={{padding:"2px 0 2px 8px"}}>
                  <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{conv}% advance</span>
                </div>
              )}
              {/* Stage row */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",borderRadius:6,transition:"background 0.12s",background:isHov?"rgba(15,29,58,0.025)":"transparent",cursor:"default"}}>
                <span style={{fontFamily:F.display,fontSize:18,fontWeight:700,color:C.text,minWidth:36,textAlign:"right",flexShrink:0,lineHeight:1}}>{s.n}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text}}>{s.label}</span>
                    <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{pct}%</span>
                  </div>
                  <div style={{height:3,background:C.bg2,borderRadius:9999,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:9999,background:C.navy,opacity:0.35+0.65*(barW/100),width:barW+"%",transition:"width 0.6s cubic-bezier(0.22,1,0.36,1)"}}/>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {/* Failed/Vetoed */}
        {terminal>0&&(
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px",marginTop:2}}>
            <span style={{fontFamily:F.display,fontSize:18,fontWeight:700,color:C.textM,minWidth:36,textAlign:"right",flexShrink:0,lineHeight:1}}>{terminal}</span>
            <span style={{fontFamily:F.display,fontSize:12,fontWeight:500,color:C.textM,flex:1}}>Failed / Vetoed</span>
            <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{Math.round((terminal/total)*100)}%</span>
          </div>
        )}
      </div>
      {/* Summary row */}
      <div style={{marginTop:12,display:"flex",gap:20,paddingTop:10,borderTop:"1px solid "+C.border}}>
        {[
          {label:"Total bills",val:total},
          {label:"Active",val:bills.filter(b=>!["signed_into_law","failed","vetoed"].includes(b.status)).length},
          {label:"Enacted",val:bills.filter(b=>b.status==="signed_into_law").length},
        ].map(s=>(
          <div key={s.label}>
            <div style={{fontFamily:F.display,fontSize:20,fontWeight:700,color:C.text,lineHeight:1}}>{s.val}</div>
            <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({nav,wb,toggleB,wm,toggleM,newsOutlet,switchTab}){
  const STORAGE_KEY="civly-dashboard-v3";
  const[panels,setPanels]=useState(()=>{try{const s=localStorage.getItem(STORAGE_KEY);return s?JSON.parse(s):DEFAULT_PANELS;}catch{return DEFAULT_PANELS;}});
  const[editMode,setEditMode]=useState(false);
  const[locked,setLocked]=useState(()=>{try{return localStorage.getItem("civly-layout-locked")==="1";}catch{return false;}});
  const toggleLock=()=>{const v=!locked;setLocked(v);try{if(v)localStorage.setItem("civly-layout-locked","1");else localStorage.removeItem("civly-layout-locked");}catch{}};
  const[addOpen,setAddOpen]=useState(false);
  // drag state only tracks id+insertIdx (slot position) — ghost position goes to a ref
  const[drag,setDrag]=useState(null);
  const dragGhostRef=useRef(null); // DOM ref for the floating ghost — updated directly, no setState
  const dragMetaRef=useRef(null);  // {ox,oy,w,h,label} — never causes re-render
  const gridRef=useRef(null);
  const panelsRef=useRef(panels);
  const panelElsRef=useRef({});
  useEffect(()=>{panelsRef.current=panels;},[panels]);

  const save=p=>{setPanels(p);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p));}catch{}};
  const removePanel=useCallback(id=>save(panelsRef.current.filter(p=>p.id!==id)),[]);
  const resizePanel=useCallback(id=>save(panelsRef.current.map(p=>p.id===id?{...p,w:p.w<=4?8:p.w<=8?12:4}:p)),[]);
  const movePanelUp=useCallback(id=>{const ps=panelsRef.current;const i=ps.findIndex(p=>p.id===id);if(i<=0)return;const a=[...ps];[a[i-1],a[i]]=[a[i],a[i-1]];save(a);},[]);
  const movePanelDown=useCallback(id=>{const ps=panelsRef.current;const i=ps.findIndex(p=>p.id===id);if(i>=ps.length-1)return;const a=[...ps];[a[i],a[i+1]]=[a[i+1],a[i]];save(a);},[]);
  const addPanel=cfg=>{save([...panelsRef.current,{...cfg,id:"p"+Date.now()}]);setAddOpen(false);};
  const resetLayout=()=>{save(DEFAULT_PANELS);};

  const startPanelDrag=useCallback((e,panelId)=>{
    if(locked)return;
    if(e.target.tagName==="BUTTON"||e.target.closest("button"))return;
    const el=panelElsRef.current[panelId];
    if(!el)return;
    e.preventDefault();
    const rect=el.getBoundingClientRect();
    const ox=e.clientX-rect.left;
    const oy=e.clientY-rect.top;
    const panel=panelsRef.current.find(p=>p.id===panelId);
    const label=PANEL_DEFS[panel?.type]?.label||"Panel";

    dragMetaRef.current={ox,oy,w:rect.width,h:rect.height,label};

    const getInsertIdx=(clientX,clientY)=>{
      const others=panelsRef.current.filter(p=>p.id!==panelId);
      if(!others.length)return 0;
      let bestI=0,bestDist=Infinity;
      others.forEach((p,i)=>{
        const el2=panelElsRef.current[p.id];
        if(!el2)return;
        const r=el2.getBoundingClientRect();
        const dist=Math.hypot(clientX-(r.left+r.width/2),clientY-(r.top+r.height/2));
        if(dist<bestDist){bestDist=dist;bestI=i;}
      });
      const bestEl=panelElsRef.current[others[bestI].id];
      if(!bestEl)return bestI;
      const r=bestEl.getBoundingClientRect();
      return clientX<r.left+r.width/2?bestI:bestI+1;
    };

    // Initial drag state — triggers one render to show slot
    setDrag({id:panelId,insertIdx:0,w:rect.width,h:rect.height});
    document.body.style.userSelect="none";
    document.body.style.cursor="grabbing";

    // Position ghost via DOM ref — zero React re-renders during move
    if(dragGhostRef.current){
      dragGhostRef.current.style.display="flex";
      dragGhostRef.current.style.left=(e.clientX-ox)+"px";
      dragGhostRef.current.style.top=(e.clientY-oy)+"px";
      dragGhostRef.current.style.width=Math.min(rect.width,400)+"px";
      dragGhostRef.current.querySelector(".ghost-label").textContent=label;
    }

    const onMove=mv=>{
      // Update ghost position directly on DOM — no setState
      if(dragGhostRef.current){
        const meta=dragMetaRef.current;
        dragGhostRef.current.style.left=(mv.clientX-meta.ox)+"px";
        dragGhostRef.current.style.top=(mv.clientY-meta.oy)+"px";
      }
      // Only setState when insertIdx changes (rare)
      const newIdx=getInsertIdx(mv.clientX,mv.clientY);
      setDrag(d=>{
        if(!d||d.insertIdx===newIdx)return d;
        return{...d,insertIdx:newIdx};
      });
    };
    const onUp=()=>{
      if(dragGhostRef.current)dragGhostRef.current.style.display="none";
      setDrag(d=>{
        if(d){
          const ps=panelsRef.current;
          const fromIdx=ps.findIndex(p=>p.id===panelId);
          const others=ps.filter(p=>p.id!==panelId);
          const at=Math.max(0,Math.min(others.length,d.insertIdx??others.length));
          others.splice(at,0,ps[fromIdx]);
          save(others);
        }
        return null;
      });
      document.body.style.userSelect="";
      document.body.style.cursor="";
      window.removeEventListener("pointermove",onMove);
      window.removeEventListener("pointerup",onUp);
    };
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  },[locked]);

  const handleResizeStart=(e,id)=>{
    if(locked){e.preventDefault();return;}
    e.preventDefault();
    const startX=e.clientX;
    const startW=panelsRef.current.find(p=>p.id===id)?.w||4;
    const gridWidth=gridRef.current?.offsetWidth||900;
    const unitWidth=(gridWidth-11*14)/12+14;
    document.body.style.cursor="ew-resize";
    let lastW=startW;
    const onMove=mv=>{
      const dx=mv.clientX-startX;
      const newW=Math.max(2,Math.min(12,Math.round(startW+dx/unitWidth)));
      if(newW===lastW)return; // skip if unchanged
      lastW=newW;
      setPanels(prev=>prev.map(p=>p.id===id?{...p,w:newW}:p));
    };
    const onUp=()=>{
      document.body.style.cursor="";
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(panelsRef.current));}catch{}
    };
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
  };

  const renderContent=panel=>{
    switch(panel.type){
      case"bill":return<BillPanelContent config={panel.config} nav={nav} wb={wb} toggleB={toggleB}/>;
      case"member_feed":{const mem=members.find(m=>m.id===panel.config.memberId);return<TwitterFeed handle={mem?.twitter} memberId={mem?.id}/>;}
      case"member_card":return<MemberCardPanelContent config={panel.config} nav={nav}/>;
      case"calendar":return<CalendarPanelContent nav={nav}/>;
      case"trending":return<TrendingPanelContent nav={nav}/>;
      case"bills_grid":return<ActiveBillsPanelContent nav={nav} wb={wb} toggleB={toggleB}/>;
      case"bill_news":return<BillNewsPanelContent config={panel.config} nav={nav} newsOutlet={newsOutlet}/>;
      case"watchlist":return<WatchlistPanelContent nav={nav} wb={wb} toggleB={toggleB} wm={wm} toggleM={toggleM}/>;
      case"leg_chart":return<LegProgressChartPanel nav={nav}/>;
      case"voting_dist":return<VotingDistChartPanel nav={nav}/>;
      case"pipeline":return<BillPipelinePanel nav={nav} wb={wb} toggleB={toggleB}/>;
      case"activity":return<ActivityFeedPanel nav={nav}/>;
      case"leaderboard":return<MemberLeaderboardPanel nav={nav}/>;
      case"party_votes":return<PartyLineVotesPanel nav={nav}/>;
      case"vote_scorecard":return<VoteScorecardPanel nav={nav} wb={wb}/>;
      case"bill_funnel":return<BillFunnelPanel nav={nav}/>;
      case"markets":return<MarketsDashPanel nav={nav}/>;
      default:return null;
    }
  };

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <div style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.textM,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>119th Congress · 2025–2027</div>
          <div style={{fontFamily:F.display,fontSize:28,fontWeight:700,color:C.text,letterSpacing:"-0.6px",lineHeight:1}}>Dashboard</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {editMode&&<button onClick={()=>setAddOpen(true)} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:12,fontWeight:500,color:"#fff",background:C.accent,padding:"7px 16px",borderRadius:9999,display:"inline-flex",alignItems:"center",gap:5,boxShadow:"0 2px 10px rgba(196,30,58,0.28)"}}>
            <span style={{fontSize:14,lineHeight:1}}>+</span> Add Panel
          </button>}
          <button onClick={resetLayout} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,color:C.textM,padding:"6px 12px",borderRadius:9999,border:"1px solid "+C.border,transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color=C.error;e.currentTarget.style.borderColor=C.error+"44";e.currentTarget.style.background="#fff1f2";}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.textM;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background="transparent";}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
            Reset
          </button>
          <button onClick={toggleLock} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,fontWeight:500,color:locked?"#fff":C.text2,padding:"6px 14px",borderRadius:9999,border:"1px solid "+(locked?C.navy:C.border),background:locked?C.navy:"transparent",transition:"all 0.15s"}}
            onMouseEnter={e=>{if(!locked){e.currentTarget.style.background=C.navy+"10";e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.navy;}}}
            onMouseLeave={e=>{if(!locked){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{locked?<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>:<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>}</svg>
            {locked?"Locked":"Lock"}
          </button>
          <button onClick={()=>setEditMode(!editMode)} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,fontWeight:500,color:editMode?"#fff":C.text2,padding:"6px 14px",borderRadius:9999,border:"1px solid "+(editMode?C.accent2:C.border),background:editMode?C.accent2:"transparent",transition:"all 0.15s"}}>
            {editMode?"Done":"Customize"}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <DashboardStatsBar wb={wb} wm={wm} nav={switchTab}/>

      {/* Edit mode hints */}
      {editMode&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"9px 14px",background:"rgba(26,64,175,0.04)",borderRadius:10,border:"1px solid rgba(26,64,175,0.12)"}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span style={{fontFamily:F.body,fontSize:11,color:C.accent2}}>Drag <b style={{fontWeight:600}}>panel headers</b> to reorder · drag the <b style={{fontWeight:600}}>right edge</b> to resize · <b style={{fontWeight:600}}>✕</b> to remove</span>
      </div>}
      {locked&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"9px 14px",background:"rgba(15,29,58,0.03)",borderRadius:10,border:"1px solid "+C.border}}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <span style={{fontFamily:F.body,fontSize:11,color:C.textM}}>Layout locked — click <b style={{fontWeight:600,color:C.text}}>Lock</b> to rearrange panels.</span>
      </div>}

      {/* Panel grid — with live insertion slot while dragging */}
      <div ref={gridRef} style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:14,alignItems:"start"}}>
        {(()=>{
          if(!drag){
            if(!panels.length)return[<div key="empty" style={{gridColumn:"span 12",textAlign:"center",padding:"60px 20px",color:C.textM,fontFamily:F.body,fontSize:13,background:"#fff",borderRadius:14,border:"1px dashed "+C.border}}>Your dashboard is empty.{" "}<button onClick={()=>{setEditMode(true);setAddOpen(true);}} style={{all:"unset",cursor:"pointer",color:C.accent2,fontWeight:500}}>Add a panel →</button></div>];
            return panels.map((panel,i)=>(
              <PanelShell key={panel.id} panel={panel} editMode={editMode} isFirst={i===0} isLast={i===panels.length-1} locked={locked}
                onRemove={removePanel} onResize={resizePanel} onMoveUp={movePanelUp} onMoveDown={movePanelDown}
                onResizeStart={handleResizeStart} onDragHeaderDown={startPanelDrag}
                panelRef={el=>{if(el)panelElsRef.current[panel.id]=el;else delete panelElsRef.current[panel.id];}}
                isDragging={false} isDragOver={false}>
                {renderContent(panel)}
              </PanelShell>
            ));
          }
          // Drag active — build display list: others + slot at insertIdx
          const dragPanel=panels.find(p=>p.id===drag.id);
          const others=panels.filter(p=>p.id!==drag.id);
          const at=Math.max(0,Math.min(others.length,drag.insertIdx??others.length));
          const display=[...others];
          display.splice(at,0,{__slot:true,w:dragPanel?.w||4});
          return display.map((item,i)=>{
            if(item.__slot)return(
              <div key="__slot__" style={{gridColumn:"span "+item.w,borderRadius:14,border:"1.5px dashed rgba(15,29,58,0.2)",background:"rgba(10,22,40,0.03)",minHeight:Math.max(80,drag.h*0.4),display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.12s"}}>
                <div style={{width:28,height:28,borderRadius:8,background:"rgba(10,22,40,0.07)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(15,29,58,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 5 12 19"/><polyline points="5 12 12 5 19 12"/></svg>
                </div>
              </div>
            );
            const origI=panels.indexOf(item);
            return(
              <PanelShell key={item.id} panel={item} editMode={editMode} isFirst={origI===0} isLast={origI===panels.length-1} locked={locked}
                onRemove={removePanel} onResize={resizePanel} onMoveUp={movePanelUp} onMoveDown={movePanelDown}
                onResizeStart={handleResizeStart} onDragHeaderDown={startPanelDrag}
                panelRef={el=>{if(el)panelElsRef.current[item.id]=el;else delete panelElsRef.current[item.id];}}
                isDragging={false} isDragOver={false}>
                {renderContent(item)}
              </PanelShell>
            );
          });
        })()}
      </div>

      {addOpen&&<AddPanelModal onAdd={addPanel} onClose={()=>setAddOpen(false)}/>}

      {/* Floating ghost — always rendered, shown/hidden via display:none. Position updated via DOM ref, never via setState. */}
      <div ref={dragGhostRef} style={{display:"none",position:"fixed",left:0,top:0,pointerEvents:"none",zIndex:9999,background:C.navy,borderRadius:12,boxShadow:"0 32px 80px rgba(0,0,0,0.4),0 8px 24px rgba(0,0,0,0.2)",transform:"rotate(1.5deg) scale(1.04)",alignItems:"center",padding:"11px 18px",gap:10,overflow:"hidden",opacity:0.96}}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="rgba(255,255,255,0.45)"><circle cx="2.5" cy="2" r="1.5"/><circle cx="7.5" cy="2" r="1.5"/><circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="7.5" cy="12" r="1.5"/></svg>
        <span className="ghost-label" style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.92)",letterSpacing:1.2,textTransform:"uppercase",flex:1}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:50,background:"linear-gradient(90deg,transparent,rgba(0,0,0,0.25))"}}/>
      </div>
    </div>
  );
}
function TopicDetailScreen({topic,nav,wb,toggleB}){
const kws=topicKW[topic.name]||[topic.name.toLowerCase()];
const topicBills=bills.filter(b=>{const s=(b.title+" "+b.sum).toLowerCase();return kws.some(k=>s.includes(k));});
return(<div>
<div style={{marginBottom:20}}><div style={{fontFamily:F.display,fontSize:24,fontWeight:700,color:C.text}}>{topic.name}</div><div style={{fontFamily:F.body,color:C.textM,fontSize:13,marginTop:2}}>{topicBills.length} bills</div></div>
{topicBills.length===0?<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>No bills found.</div>:topicBills.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={wb.includes(b.id)} onToggle={toggleB} nav={nav}/>)}
</div>)}

function PinButton({type,config,label=false}){
  const SK="civly-dashboard-v2";
  const check=()=>{try{const s=localStorage.getItem(SK);const ps=s?JSON.parse(s):[];return ps.some(p=>p.type===type&&(config.billId?p.config?.billId===config.billId:p.config?.memberId===config.memberId));}catch{return false;}};
  const[pinned,setPinned]=useState(check);
  const[flash,setFlash]=useState(false);
  const toggle=e=>{
    e.stopPropagation();
    try{
      const s=localStorage.getItem(SK);
      let ps=s?JSON.parse(s):DEFAULT_PANELS;
      if(pinned){
        ps=ps.filter(p=>!(p.type===type&&(config.billId?p.config?.billId===config.billId:p.config?.memberId===config.memberId)));
      }else{
        ps=[...ps,{id:"p"+Date.now(),type,config,w:4}];
      }
      localStorage.setItem(SK,JSON.stringify(ps));
      setPinned(!pinned);
      setFlash(true);
      setTimeout(()=>setFlash(false),1800);
    }catch{}
  };
  const pinCol="#2d6a4f";
  if(label){
    return(
      <button onClick={toggle} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:9999,background:flash?"rgba(45,106,79,0.1)":pinned?"rgba(45,106,79,0.08)":"rgba(255,255,255,0.12)",border:"1px solid "+(pinned?pinCol+"50":"rgba(255,255,255,0.2)"),transition:"all 0.2s",fontFamily:F.body,fontSize:12,fontWeight:300,color:pinned||flash?"#fff":C.textW,backdropFilter:"blur(4px)"}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill={pinned?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {flash?(pinned?"Pinned to Home":"Removed"):(pinned?"Pinned to Home":"Pin to Home")}
      </button>
    );
  }
  return(
    <button onClick={toggle} title={pinned?"Unpin from Home":"Pin to Home"} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:9999,background:pinned?pinCol+"15":"transparent",border:"1px solid "+(pinned?pinCol+"40":C.border),transition:"all 0.15s",flexShrink:0}}
      onMouseEnter={e=>{if(!pinned){e.currentTarget.style.background=C.bg2;e.currentTarget.style.borderColor=pinCol+"60";}}}
      onMouseLeave={e=>{if(!pinned){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.border;}}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={pinned?pinCol:"none"} stroke={pinned?pinCol:C.textM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </button>
  );
}

function SearchScreen({nav,wm,toggleM}){
const[q,setQ]=useState("");
const ql=q.toLowerCase();const resMem=q?members.filter(m=>m.name.toLowerCase().includes(ql)||m.state.toLowerCase().includes(ql)):[];const resBill=q?bills.filter(b=>b.title.toLowerCase().includes(ql)||b.num.toLowerCase().includes(ql)):[];const resTopic=q?trending.filter(t=>t.name.toLowerCase().includes(ql)):[];
return(<div>
<div style={{fontFamily:F.display,fontSize:24,fontWeight:700,color:C.text,marginBottom:4}}>Search</div>
<div style={{fontFamily:F.body,fontSize:13,color:C.textM,marginBottom:16}}>Find bills, members, and topics</div>
<div style={{position:"relative",marginBottom:16}}><div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={18} color={C.textM}/></div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bills, members, topics..." style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:24,padding:"12px 16px 12px 46px",color:C.text,fontSize:14,fontFamily:F.body,outline:"none"}}/>{q&&<button onClick={()=>setQ("")} style={{all:"unset",position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",cursor:"pointer"}}><Icon name="x" size={16} color={C.textM}/></button>}</div>
{!q&&<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontFamily:F.mono,fontSize:9,fontWeight:500,letterSpacing:1.5,color:C.textM,textTransform:"uppercase"}}>Suggested Members</span><button onClick={()=>nav("browseMembers")} style={{all:"unset",cursor:"pointer",fontFamily:F.body,color:C.accent,fontSize:11,fontWeight:600}}>Browse All</button></div>
{sugMems.map(id=>{const m=members.find(x=>x.id===id);return m?<MemberCard key={m.id} member={m} onPress={()=>nav("memberProfile",m.id)} watched={wm.includes(m.id)} onToggle={toggleM}/>:null})}</>}
{q&&resTopic.map(t=><div key={t.name} onClick={()=>nav("topicDetail",t.name)} style={{cursor:"pointer",padding:"10px 0",borderBottom:"1px solid "+C.border,fontFamily:F.display,fontSize:14,color:C.text}}>{t.name} <span style={{fontFamily:F.mono,fontSize:10,color:C.textM}}>{t.count}</span></div>)}
{q&&resMem.map(m=>(
  <div key={m.id} style={{position:"relative"}}>
    <MemberCard member={m} onPress={()=>nav("memberProfile",m.id)} watched={wm.includes(m.id)} onToggle={toggleM}/>
    <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}>
      <PinButton type="member_card" config={{memberId:m.id,name:m.name}}/>
    </div>
  </div>
))}
{q&&resBill.map(b=>(
  <div key={b.id} style={{position:"relative"}}>
    <BillCard bill={b} onPress={()=>nav("billDetail",b.id)} watched={false} nav={nav}/>
    <div style={{position:"absolute",top:10,right:10}} onClick={e=>e.stopPropagation()}>
      <PinButton type="bill" config={{billId:b.id,name:b.title}}/>
    </div>
  </div>
))}
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
<div style={{fontFamily:F.display,fontSize:24,fontWeight:700,color:C.text,marginBottom:8}}>Members of Congress</div>
<div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{members.length}</b> total</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{senCount}</b> senators</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:C.text}}>{houseCount}</b> representatives</span>
<span style={{fontFamily:F.body,fontSize:12,color:C.text2}}><b style={{color:PC.democrat}}>{demCount}</b> Democrat</span>
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
<div key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",background:highlighted.includes(m.id)?C.navy+"06":C.card,border:"1px solid "+(highlighted.includes(m.id)?"rgba(26,39,68,0.3)":"rgba(221,226,237,0.7)"),borderRadius:16,padding:"16px 12px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",boxShadow:highlighted.includes(m.id)?"0 0 0 2px rgba(26,39,68,0.12),"+C.cardShadow:C.cardShadow,transition:"box-shadow 0.22s cubic-bezier(0.22,1,0.36,1),transform 0.22s cubic-bezier(0.22,1,0.36,1),border-color 0.15s"}}
  onMouseEnter={e=>{const el=e.currentTarget;el.style.boxShadow=C.cardShadowHover;el.style.transform="translateY(-3px)";el.style.borderColor=pc(m.party)+"55";}}
  onMouseLeave={e=>{const el=e.currentTarget;el.style.boxShadow=highlighted.includes(m.id)?"0 0 0 2px rgba(26,39,68,0.12),"+C.cardShadow:C.cardShadow;el.style.transform="translateY(0)";el.style.borderColor=highlighted.includes(m.id)?"rgba(26,39,68,0.3)":"rgba(221,226,237,0.7)";}}>
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
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div style={{fontFamily:F.display,fontSize:24,fontWeight:700,color:C.text}}>All Members</div><span style={{fontFamily:F.body,color:C.textM,fontSize:13,background:C.bg2,padding:"4px 12px",borderRadius:100}}>{filtered.length} members</span></div>
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
const[showPast,setShowPast]=useState(false);
const typeLabel={vote:"Floor Vote",hearing:"Hearing",markup:"Markup",deadline:"Deadline"};
const today=new Date("2026-03-10T12:00:00");

const upcoming=allCalEvents
  .filter(ev=>(filter==="All"||ev.type===filter)&&new Date(ev.date+"T12:00:00")>=today)
  .sort((a,b)=>new Date(a.date)-new Date(b.date));
const past=allCalEvents
  .filter(ev=>(filter==="All"||ev.type===filter)&&new Date(ev.date+"T12:00:00")<today)
  .sort((a,b)=>new Date(b.date)-new Date(a.date));

const grouped=upcoming.reduce((acc,ev)=>{
  const d=new Date(ev.date+"T12:00:00");
  const key=d.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  if(!acc[key])acc[key]=[];
  acc[key].push(ev);
  return acc;
},{});

const typeCounts={All:allCalEvents.length,vote:allCalEvents.filter(ev=>ev.type==="vote").length,hearing:allCalEvents.filter(ev=>ev.type==="hearing").length,markup:allCalEvents.filter(ev=>ev.type==="markup").length,deadline:allCalEvents.filter(ev=>ev.type==="deadline").length};
const nextVote=upcoming.find(ev=>ev.type==="vote");
const nextDeadline=upcoming.find(ev=>ev.type==="deadline");

return(<div>
{/* Header + quick stats */}
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,marginBottom:20,flexWrap:"wrap"}}>
  <div>
    <div style={{fontFamily:F.display,fontSize:28,fontWeight:700,color:C.text,letterSpacing:"-0.5px"}}>Calendar</div>
    <div style={{fontFamily:F.body,fontSize:13,fontWeight:400,color:C.textM,marginTop:4}}>{upcoming.length} upcoming · {past.length} past</div>
  </div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {nextVote&&<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"8px 16px",minWidth:100}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:CAL_COLOR.vote,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Next Vote</div>
      <div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.text}}>{fS(nextVote.date)}</div>
    </div>}
    {nextDeadline&&<div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"8px 16px",minWidth:100}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:CAL_COLOR.deadline,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Next Deadline</div>
      <div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.text}}>{fS(nextDeadline.date)}</div>
    </div>}
    <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"8px 16px",minWidth:80}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>Congress</div>
      <div style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:C.text}}>119th</div>
    </div>
  </div>
</div>

{/* Filter pills with counts */}
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
{["All","vote","hearing","markup","deadline"].map(t=>{
  const col=t==="All"?C.navy:(CAL_COLOR[t]||C.textM);
  const active=filter===t;
  return(<button key={t} onClick={()=>setFilter(t)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,fontFamily:F.body,fontSize:12,fontWeight:500,background:active?col:C.card,color:active?"#fff":C.text2,border:"1px solid "+(active?col:C.border),transition:"all 0.15s"}}>
    {t==="All"?"All":typeLabel[t]||t}
    <span style={{fontFamily:F.mono,fontSize:9,background:active?"rgba(255,255,255,0.2)":C.bg2,color:active?"#fff":C.textM,padding:"1px 5px",borderRadius:4}}>{typeCounts[t]||0}</span>
  </button>);})}
</div>

{/* Upcoming events by month */}
{Object.entries(grouped).map(([month,events])=>(
<div key={month} style={{marginBottom:28}}>
  <div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10,paddingBottom:8,borderBottom:"1px solid "+C.border}}>{month}</div>
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
  {events.map(ev=>{
    const d=new Date(ev.date+"T12:00:00");
    const typeColor=CAL_COLOR[ev.type]||C.textM;
    const isToday=d.toDateString()===today.toDateString();
    const billRef=ev.billId?bills.find(b=>b.id===ev.billId):null;
    const weekday=d.toLocaleDateString("en-US",{weekday:"short"});
    return(
    <div key={ev.id} onClick={ev.billId?()=>nav("billDetail",ev.billId):undefined}
      style={{cursor:ev.billId?"pointer":"default",background:isToday?typeColor+"08":C.card,borderRadius:10,border:"1px solid "+(ev.urgent?C.accent+"40":isToday?typeColor+"30":C.border),padding:"12px 16px",display:"flex",gap:14,alignItems:"flex-start",transition:"box-shadow 0.15s,border-color 0.15s"}}
      onMouseEnter={ev.billId?e=>{e.currentTarget.style.boxShadow=C.cardShadowHover;e.currentTarget.style.borderColor=typeColor+"50";}:undefined}
      onMouseLeave={ev.billId?e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=ev.urgent?C.accent+"40":isToday?typeColor+"30":C.border;}:undefined}>
      {/* Date column */}
      <div style={{flexShrink:0,width:40,textAlign:"center"}}>
        <div style={{fontFamily:F.mono,fontSize:20,fontWeight:700,color:isToday?typeColor:C.text,lineHeight:1}}>{d.getDate()}</div>
        <div style={{fontFamily:F.body,fontSize:10,fontWeight:500,color:C.textM,marginTop:2}}>{weekday}</div>
      </div>
      {/* Color bar */}
      <div style={{width:3,alignSelf:"stretch",background:typeColor+(isToday?"":"60"),borderRadius:2,flexShrink:0}}/>
      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:typeColor,textTransform:"uppercase",letterSpacing:0.8}}>{typeLabel[ev.type]||ev.type}</span>
          {isToday&&<span style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:"#fff",background:CAL_COLOR.vote,padding:"1px 7px",borderRadius:5}}>TODAY</span>}
          {ev.urgent&&<span style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:"#fff",background:C.accent,padding:"1px 7px",borderRadius:5}}>URGENT</span>}
        </div>
        <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,lineHeight:1.35,marginBottom:4,letterSpacing:"-0.15px"}}>{ev.title}</div>
        <div style={{fontFamily:F.body,fontSize:11,fontWeight:400,color:C.text2,lineHeight:1.5}}>{ev.desc}</div>
        {billRef&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:7}}>
          <StatusBadge status={billRef.status}/>
          <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{billRef.num}</span>
          <span style={{fontFamily:F.body,fontSize:10,fontWeight:500,color:C.accent2,marginLeft:2}}>View bill →</span>
        </div>}
      </div>
    </div>);})}
  </div>
</div>
))}

{upcoming.length===0&&<div style={{textAlign:"center",color:C.textM,padding:"48px 20px",fontSize:13,fontFamily:F.body,background:C.card,borderRadius:12,border:"1px solid "+C.border}}>No upcoming events match this filter</div>}

{/* Past events toggle */}
{past.length>0&&<div style={{marginTop:8,marginBottom:24}}>
  <button onClick={()=>setShowPast(x=>!x)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:C.card,border:"1px solid "+C.border,fontFamily:F.body,fontSize:12,fontWeight:500,color:C.text2,transition:"all 0.15s"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.navy+"40";}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points={showPast?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>
    {showPast?"Hide":"Show"} {past.length} past event{past.length!==1?"s":""}
  </button>
  {showPast&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:5}}>
  {past.map(ev=>{
    const d=new Date(ev.date+"T12:00:00");
    const typeColor=CAL_COLOR[ev.type]||C.textM;
    const weekday=d.toLocaleDateString("en-US",{weekday:"short"});
    return(
    <div key={ev.id} onClick={ev.billId?()=>nav("billDetail",ev.billId):undefined} style={{cursor:ev.billId?"pointer":"default",background:C.card,borderRadius:10,border:"1px solid "+C.border,padding:"10px 16px",display:"flex",gap:14,alignItems:"center",opacity:0.55}}>
      <div style={{flexShrink:0,width:40,textAlign:"center"}}>
        <div style={{fontFamily:F.mono,fontSize:18,fontWeight:700,color:C.textM,lineHeight:1}}>{d.getDate()}</div>
        <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:1}}>{weekday}</div>
      </div>
      <div style={{width:3,alignSelf:"stretch",background:C.border,borderRadius:2,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>{typeLabel[ev.type]||ev.type}</div>
        <div style={{fontFamily:F.body,fontSize:12,fontWeight:400,color:C.text2}}>{ev.title}</div>
      </div>
    </div>);
  })}
  </div>}
</div>}

{/* Recent Legislative Updates */}
<div style={{borderTop:"1px solid "+C.border,paddingTop:20}}>
<div style={{fontFamily:F.body,fontSize:11,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Recent Legislative Updates</div>
{billUpdates.map((u,i)=>{
  const billRef=u.billId?bills.find(b=>b.id===u.billId):null;
  return(<div key={i} onClick={u.billId?()=>nav("billDetail",u.billId):undefined} style={{cursor:u.billId?"pointer":"default",background:C.card,borderRadius:10,padding:"12px 16px",marginBottom:8,border:"1px solid "+C.border,display:"flex",gap:10,alignItems:"flex-start",transition:"border-color 0.12s"}}
    onMouseEnter={u.billId?e=>{e.currentTarget.style.borderColor=C.navy+"40";}:undefined}
    onMouseLeave={u.billId?e=>{e.currentTarget.style.borderColor=C.border;}:undefined}>
    <div style={{flex:1}}>
      <div style={{fontFamily:F.body,color:C.text,fontSize:13,fontWeight:500}}>{u.title}</div>
      <div style={{fontFamily:F.body,color:C.text2,fontSize:11,fontWeight:400,marginTop:3,lineHeight:1.5}}>{u.desc}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
        <div style={{fontFamily:F.mono,color:C.textM,fontSize:9}}>{u.date}</div>
        {billRef&&<span style={{fontFamily:F.mono,fontSize:8,color:C.textM,background:C.bg2,padding:"1px 5px",borderRadius:4,border:"1px solid "+C.border}}>{billRef.num}</span>}
      </div>
    </div>
  </div>);})}
</div>

</div>);}

function WatchlistScreen({nav,wb,toggleB,wm,toggleM,profile,isPremium,openUpgrade}){
const[tab,setTab]=useState("bills");
const wBills=bills.filter(b=>wb.includes(b.id));const wMems=members.filter(m=>wm.includes(m.id));
return(<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
<div style={{fontFamily:F.display,fontSize:24,fontWeight:700,color:C.text}}>Saved</div>
{!isPremium&&(
  <button onClick={openUpgrade} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:9999,background:"rgba(249,171,0,0.08)",border:"1px solid rgba(249,171,0,0.25)",transition:"all 0.15s"}}
    onMouseEnter={e=>e.currentTarget.style.background="rgba(249,171,0,0.14)"}
    onMouseLeave={e=>e.currentTarget.style.background="rgba(249,171,0,0.08)"}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:"#d97706",letterSpacing:0.5}}>{wb.length}/{FREE_BILL_LIMIT} bills</span>
    <span style={{fontFamily:F.body,fontSize:10,color:"#b45309"}}>· Upgrade for unlimited</span>
  </button>
)}
</div>
<div style={{display:"flex",gap:5,marginBottom:20,background:C.bg2,borderRadius:12,padding:4,border:"1px solid rgba(221,226,237,0.6)"}}>
{[["bills","Bills ("+wBills.length+")"],["following","Following ("+wMems.length+")"],["digest","Digest"]].map(([k,l])=>(
<button key={k} onClick={()=>setTab(k)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"7px 16px",fontFamily:F.body,fontSize:13,fontWeight:tab===k?500:400,borderRadius:9,background:tab===k?C.card:C.bg2,color:tab===k?C.text:C.textM,boxShadow:tab===k?C.cardShadow:"none",transition:"all 0.18s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
{l}
{k==="digest"&&!isPremium&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
</button>
))}
</div>

{tab==="bills"&&(wBills.length===0
?<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body}}>Bookmark bills to see them here</div>
:wBills.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={true} onToggle={toggleB} nav={nav} noAccent/>))}

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
<div style={{background:"linear-gradient(135deg,"+C.navy+","+C.navyLight+")",borderRadius:16,padding:"24px 20px",marginBottom:16,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none"}}/>
<div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.4)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Member Feature</div>
<div style={{fontFamily:F.display,fontSize:18,fontWeight:500,color:"#fff",lineHeight:1.3,marginBottom:8}}>Your weekly intelligence digest</div>
<div style={{fontFamily:F.body,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.65,marginBottom:16}}>Every Sunday: what moved in Congress, what to watch next, and a sharp take on what it all means — personalized to the bills and lawmakers you follow.</div>
<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
{[["What moved this week","Ranked by significance, not noise"],["What matters next","Upcoming votes and deadlines that actually affect you"],["One sharp read","A paragraph that tells you what to pay attention to and why"]].map(([t,d])=>(
<div key={t} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
<div style={{width:16,height:16,borderRadius:16,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
</div>
<div><div style={{fontFamily:F.body,fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.85)"}}>{t}</div><div style={{fontFamily:F.body,fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1}}>{d}</div></div>
</div>
))}
</div>
<button onClick={openUpgrade} style={{all:"unset",cursor:"pointer",padding:"10px 24px",borderRadius:20,fontSize:13,fontFamily:F.body,fontWeight:600,background:"linear-gradient(135deg,#F9AB00,#d97706)",color:C.navy,boxShadow:"0 4px 16px rgba(249,171,0,0.35)"}}>See Member Plans →</button>
</div>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Preview — Week of Feb 9</div>
{weeklyDigest.movedBills.slice(0,1).map(item=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} style={{background:C.card,borderRadius:12,padding:"14px 16px",marginBottom:8,border:"1px solid "+C.border,opacity:0.6,pointerEvents:"none"}}>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Moved this week</div>
<div style={{fontFamily:F.display,fontSize:14,fontWeight:600,color:C.text,marginBottom:4,letterSpacing:"-0.15px"}}>{item.headline}</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.5,filter:"blur(3px)"}}>{item.context}</div>
</div>):null;})}
</div>
:<div>
<div style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Week of {weeklyDigest.weekOf}</div>

<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.accent2,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>What moved this week</div>
{weeklyDigest.movedBills.map(item=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} onClick={()=>nav("billDetail",item.billId)} style={{cursor:"pointer",paddingBottom:10,marginBottom:10,borderBottom:"1px solid "+C.border}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><StatusBadge status={b.status}/><span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{b.num}</span></div>
<div style={{fontFamily:F.display,fontSize:14,fontWeight:600,color:C.text,marginBottom:4,letterSpacing:"-0.15px"}}>{item.headline}</div>
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.55}}>{item.context}</div>
</div>):null;})}
</div>

<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
<div style={{fontFamily:F.mono,fontSize:9,fontWeight:500,color:C.success,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Bills to watch next</div>
{weeklyDigest.watchNext.map((item,i)=>{const b=bills.find(x=>x.id===item.billId);return b?(<div key={item.billId} onClick={()=>nav("billDetail",item.billId)} style={{cursor:"pointer",paddingBottom:i<weeklyDigest.watchNext.length-1?10:0,marginBottom:i<weeklyDigest.watchNext.length-1?10:0,borderBottom:i<weeklyDigest.watchNext.length-1?"1px solid "+C.border:"none"}}>
<div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text,marginBottom:2,letterSpacing:"-0.15px"}}>{b.title}</div><div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.5}}>{item.reason}</div>
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

function ProfileScreen({profile,setProfile,wb,wm,user,onSignOut,isPremium,setIsPremium,switchTab,newsOutlet,setNewsOutlet,openUpgrade}){
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
// ── notification settings ────────────────────────────────────
const NOTIF_SK="civly-notif-settings";
const defaultNotif={enabled:true,channel:"in-app",scope:"watchlist",billStatus:true,billNews:true,floorVote:true,hearings:true,deadlines:true,memberActivity:false,majorDev:true,weeklyDigest:true,quietStart:"22:00",quietEnd:"07:00"};
const[notif,setNotifRaw]=useState(()=>{try{const s=localStorage.getItem(NOTIF_SK);return s?{...defaultNotif,...JSON.parse(s)}:defaultNotif;}catch{return defaultNotif;}});
const setNotif=patch=>{const next={...notif,...patch};setNotifRaw(next);try{localStorage.setItem(NOTIF_SK,JSON.stringify(next));}catch{}};

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

{/* ── Hero card ── */}
<div style={{background:"linear-gradient(135deg,"+C.navy+" 0%,"+C.navyLight+" 100%)",borderRadius:20,padding:"22px 20px",marginBottom:20,position:"relative",overflow:"hidden"}}>
  <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
  <div style={{display:"flex",alignItems:"center",gap:16,position:"relative"}}>
    {avatar
      ?<img src={avatar} alt="" style={{width:64,height:64,borderRadius:64,objectFit:"cover",border:"2px solid rgba(255,255,255,0.3)",flexShrink:0}} referrerPolicy="no-referrer"/>
      :<div style={{width:64,height:64,borderRadius:64,background:"rgba(255,255,255,0.15)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontFamily:F.display,color:"#fff",fontSize:22,fontWeight:700}}>{initials}</span>
      </div>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontFamily:F.display,color:"#fff",fontSize:19,fontWeight:700,letterSpacing:"-0.3px",lineHeight:1.2}}>{displayName}</div>
      <div style={{fontFamily:F.body,color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:300,marginTop:2}}>{email}</div>
      <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,flexWrap:"wrap"}}>
        {isPremium&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#F9AB00",background:"rgba(249,171,0,0.18)",padding:"2px 9px",borderRadius:9999,border:"1px solid rgba(249,171,0,0.3)",letterSpacing:0.5}}>MEMBER</span>}
        <span style={{fontFamily:F.body,fontSize:10,color:"rgba(255,255,255,0.55)",background:"rgba(255,255,255,0.1)",padding:"2px 8px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.15)"}}>{provider}</span>
        {profile?.state&&<span style={{fontFamily:F.body,fontSize:10,color:"rgba(255,255,255,0.55)",background:"rgba(255,255,255,0.1)",padding:"2px 8px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.15)"}}>{profile.state}</span>}
      </div>
    </div>
  </div>
  {saved&&<div style={{marginTop:12,padding:"5px 12px",background:"rgba(52,168,83,0.25)",borderRadius:9999,border:"1px solid rgba(52,168,83,0.4)",display:"inline-flex",alignItems:"center",gap:6}}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    <span style={{fontFamily:F.body,fontSize:11,color:"#4ade80",fontWeight:300}}>Saved</span>
  </div>}
</div>

{/* ── Stats row ── */}
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:20}}>
  {[
    {label:"Bills Saved",val:wb.length,col:"#2d6a4f",dest:"saved",icon:"M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"},
    {label:"Following",val:wm.length,col:"#1e40af",dest:"members",icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"},
    {label:"Interests",val:interests.length,col:"#d97706",dest:null,icon:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"},
    {label:"Pinned Panels",val:(()=>{try{const s=localStorage.getItem("civly-dashboard-v2");return s?JSON.parse(s).length:0;}catch{return 0;}})(),col:"#7c3aed",dest:"home",icon:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10m-3 0a3 3 0 106 0 3 3 0 00-6 0"},
  ].map(({label,val,col,dest,icon})=>(
    <div key={label} onClick={dest?()=>switchTab(dest):undefined}
      style={{background:C.card,borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid "+C.border,cursor:dest?"pointer":"default",transition:"box-shadow 0.15s"}}
      onMouseEnter={e=>{if(dest)e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.08)";}}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon.split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}</svg>
      </div>
      <div style={{fontFamily:F.display,color:col,fontSize:24,fontWeight:700,lineHeight:1}}>{val}</div>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:500,color:C.textM,textTransform:"uppercase",letterSpacing:0.8,marginTop:4}}>{label}</div>
    </div>
  ))}
</div>

{/* ── Tabs ── */}
{(()=>{
  const[pTab,setPTab]=useState("account");
  const TABS=[
    {k:"account",label:"Account",icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8"},
    {k:"activity",label:"Activity",icon:"M22 12h-4l-3 9L9 3l-3 9H2"},
    {k:"interests",label:"Interests",icon:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"},
    {k:"notifications",label:"Alerts",icon:"M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"},
    {k:"settings",label:"Settings",icon:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"},
  ];
  const Tog=({on,onToggle})=>(
    <div onClick={onToggle} style={{cursor:"pointer",width:38,height:21,borderRadius:10.5,background:on?C.navy:C.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2.5,left:on?19:2.5,width:16,height:16,borderRadius:9999,background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
    </div>
  );
  const Sec=({title,children,noPad})=>(
    <div style={{background:C.card,borderRadius:14,border:"1px solid "+C.border,marginBottom:12,overflow:"hidden"}}>
      {title&&<div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
        <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>{title}</span>
      </div>}
      <div style={noPad?{}:{padding:"4px 16px 8px"}}>{children}</div>
    </div>
  );
  const RowItem=({label,value,note,children})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid "+C.border}}>
      <div>
        <div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text2}}>{label}</div>
        {note&&<div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.textM,marginTop:1}}>{note}</div>}
      </div>
      {children||<span style={{fontFamily:F.body,fontSize:13,color:value?C.text:C.textM,fontWeight:300}}>{value||"—"}</span>}
    </div>
  );

  return(
    <div>
      {/* Tab bar */}
      <div style={{display:"flex",gap:2,marginBottom:16,background:C.bg2,borderRadius:12,padding:4,border:"1px solid "+C.border}}>
        {TABS.map(t=>{
          const isA=pTab===t.k;
          return(
            <button key={t.k} onClick={()=>setPTab(t.k)} style={{all:"unset",cursor:"pointer",flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 4px",borderRadius:9,background:isA?"#fff":"transparent",transition:"all 0.15s",boxShadow:isA?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isA?C.navy:C.textM} strokeWidth={isA?2:1.5} strokeLinecap="round" strokeLinejoin="round">
                {t.icon.split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}
              </svg>
              <span style={{fontFamily:F.mono,fontSize:8,fontWeight:isA?600:400,color:isA?C.navy:C.textM,letterSpacing:0.5,textTransform:"uppercase"}}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── ACCOUNT TAB ── */}
      {pTab==="account"&&<div>
        <Sec title="Personal Info" >
          {editing
            ?<div style={{padding:"12px 0 4px"}}>
              {[["Display Name",draftName,setDraftName,"text",null],["Age Range",draftAge,setDraftAge,"text",ageRanges],["State",draftState,setDraftState,"text",allSt],["Race / Ethnicity",draftRace,setDraftRace,"text",races]].map(([lbl,val,set,tp,opts])=>(
                <div key={lbl} style={{marginBottom:12}}>
                  <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:5}}>{lbl}</div>
                  {opts
                    ?<select value={val} onChange={e=>set(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:C.bg2,color:val?C.text:C.textM,border:"1px solid "+C.border,borderRadius:9,padding:"9px 12px",fontSize:12,fontFamily:F.body,outline:"none"}}>
                      <option value="">Select…</option>
                      {opts.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    :<input value={val} onChange={e=>set(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:C.bg2,border:"1px solid "+C.border,borderRadius:9,padding:"9px 12px",fontSize:12,fontFamily:F.body,color:C.text,outline:"none"}}/>}
                </div>
              ))}
              <div style={{display:"flex",gap:8,paddingTop:4,paddingBottom:8}}>
                <button onClick={saveProfile} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:C.navy,color:"#fff",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:400}}>Save</button>
                <button onClick={cancelEdit} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:C.bg2,color:C.text2,borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:300,border:"1px solid "+C.border}}>Cancel</button>
              </div>
            </div>
            :<div>
              <RowItem label="Name" value={displayName}/>
              <RowItem label="Email" value={email}/>
              <RowItem label="Age Range" value={profile?.age}/>
              <RowItem label="State" value={profile?.state}/>
              <RowItem label="Race / Ethnicity" value={profile?.race}/>
              <div style={{paddingTop:12,paddingBottom:8}}>
                <button onClick={()=>setEditing(true)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9999,background:C.bg2,border:"1px solid "+C.border,fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text2,transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=C.navy;e.currentTarget.style.color=C.navy;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Profile
                </button>
              </div>
            </div>}
        </Sec>

        <Sec title="Membership">
          {isPremium
            ?<div>
              {/* Active member card */}
              <div style={{background:"linear-gradient(135deg,#0a1a3e,#1e3a6e)",borderRadius:12,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(249,171,0,0.06)"}}/>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:34,height:34,borderRadius:9999,background:"rgba(249,171,0,0.14)",border:"1px solid rgba(249,171,0,0.28)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F9AB00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',serif",fontSize:18,color:"#fff",letterSpacing:1.5,lineHeight:1}}>Civlio Member</div>
                    <div style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:0.8,marginTop:2}}>ACTIVE · ALL FEATURES UNLOCKED</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {[["Bills","Unlimited"],["Members","Unlimited"],["Digest","✓ Included"]].map(([lbl,val])=>(
                    <div key={lbl} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                      <div style={{fontFamily:F.mono,fontSize:10,fontWeight:700,color:"#F9AB00"}}>{val}</div>
                      <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5,marginTop:1}}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0 8px"}}>
                <span style={{fontFamily:F.body,fontSize:11,color:C.textM,fontWeight:300}}>Manage billing or cancel via Stripe</span>
                <button onClick={revokeAccess} style={{all:"unset",cursor:"pointer",fontFamily:F.mono,fontSize:9,color:"#EA4335",padding:"3px 10px",borderRadius:9999,border:"1px solid #EA433530",letterSpacing:0.3}}>Cancel membership</button>
              </div>
            </div>
            :<div style={{padding:"12px 0 8px"}}>
              {/* Pricing cards */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {Object.values(PLANS).map(pl=>(
                  <div key={pl.id} style={{borderRadius:12,border:"1.5px solid "+(pl.id==="annual"?"#F9AB00":C.border),padding:"14px 12px",position:"relative",background:pl.id==="annual"?"rgba(249,171,0,0.03)":C.bg2}}>
                    {pl.id==="annual"&&<div style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",background:"#F9AB00",color:C.navy,fontFamily:F.mono,fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:9999,letterSpacing:0.5,whiteSpace:"nowrap"}}>BEST VALUE</div>}
                    <div style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>{pl.label}</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:2}}>
                      <span style={{fontFamily:"'Bebas Neue',serif",fontSize:26,color:C.navy,lineHeight:1}}>${pl.price}</span>
                      <span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{pl.period}</span>
                    </div>
                    {pl.id==="annual"&&<div style={{fontFamily:F.mono,fontSize:9,color:"#15803d",fontWeight:600}}>= $2.08 / month</div>}
                    {pl.id==="monthly"&&<div style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>Cancel anytime</div>}
                    <button onClick={()=>openUpgrade()} style={{all:"unset",cursor:"pointer",display:"block",width:"100%",boxSizing:"border-box",textAlign:"center",marginTop:10,padding:"8px 0",borderRadius:9,background:pl.id==="annual"?C.navy:C.bg,border:"1.5px solid "+(pl.id==="annual"?C.navy:C.border),color:pl.id==="annual"?"#fff":C.text,fontFamily:F.body,fontSize:11,fontWeight:pl.id==="annual"?600:400,transition:"opacity 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.opacity="0.8"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                      Get Started
                    </button>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:F.body,fontSize:11,color:C.textM,textAlign:"center",lineHeight:1.5}}>Secure checkout via Stripe · Cancel anytime · 30-day refund</div>
            </div>}
        </Sec>

        <Sec title="Sign Out" noPad>
          {!signOutConfirm
            ?<button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 0"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:"#EA4335"}}>Sign out</span>
            </button>
            :<div style={{padding:"16px"}}>
              <div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text,marginBottom:12,textAlign:"center"}}>Sign out of Civlio?</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSignOutConfirm(false)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:C.bg2,color:C.text2,borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:300,border:"1px solid "+C.border}}>Cancel</button>
                <button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:"#EA4335",color:"#fff",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:400}}>Sign out</button>
              </div>
            </div>}
        </Sec>
      </div>}

      {/* ── ACTIVITY TAB ── */}
      {pTab==="activity"&&<div>
        {/* Recent bills */}
        <Sec title={"Saved Bills ("+wb.length+")"} noPad>
          {wb.length===0
            ?<div style={{padding:"24px 16px",textAlign:"center",color:C.textM,fontFamily:F.body,fontSize:12}}>No saved bills yet — bookmark bills to track them here.</div>
            :bills.filter(b=>wb.includes(b.id)).slice(0,5).map(b=>{
              const sp=getSp(b);
              return(
                <div key={b.id} onClick={()=>switchTab("bills")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:"1px solid "+C.border,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <StatusBadge status={b.status}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.1px"}}>{b.title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                      <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{b.num}</span>
                      {sp&&<><PD party={sp.party} size={5}/><span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{sp.name.split(" ").pop()}</span></>}
                    </div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              );
            })}
          {wb.length>5&&<div onClick={()=>switchTab("saved")} style={{cursor:"pointer",padding:"10px 16px",textAlign:"center",fontFamily:F.body,fontSize:12,color:C.accent2,fontWeight:300}}>View all {wb.length} saved bills →</div>}
        </Sec>

        {/* Followed members */}
        <Sec title={"Following ("+wm.length+")"} noPad>
          {wm.length===0
            ?<div style={{padding:"24px 16px",textAlign:"center",color:C.textM,fontFamily:F.body,fontSize:12}}>Not following anyone yet.</div>
            :members.filter(m=>wm.includes(m.id)).slice(0,4).map(m=>(
              <div key={m.id} onClick={()=>switchTab("members")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid "+C.border,transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <Avatar bio={m.bio} name={m.name} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:F.body,fontSize:12,fontWeight:400,color:C.text}}>{m.pre} {m.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}><PD party={m.party} size={5}/><span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{m.party} · {m.state} · {m.chamber}</span></div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          {wm.length>4&&<div onClick={()=>switchTab("saved")} style={{cursor:"pointer",padding:"10px 16px",textAlign:"center",fontFamily:F.body,fontSize:12,color:C.accent2,fontWeight:300}}>View all {wm.length} →</div>}
        </Sec>

        {/* Quick stats by party */}
        {wb.length>0&&<Sec title="Your Bills by Party">
          {(()=>{
            const wBills=bills.filter(b=>wb.includes(b.id));
            const byParty={Republican:0,Democrat:0,Independent:0};
            wBills.forEach(b=>{const sp=getSp(b);if(sp?.party)byParty[sp.party]=(byParty[sp.party]||0)+1;});
            const total=Object.values(byParty).reduce((a,b)=>a+b,0)||1;
            const PCOLS={Republican:"#8b2e2e",Democrat:"#1e40af",Independent:"#7c3aed"};
            return(
              <div>
                {Object.entries(byParty).filter(([,n])=>n>0).map(([party,n])=>(
                  <div key={party} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2}}>{party}</span>
                      <span style={{fontFamily:F.mono,fontSize:10,color:C.textM}}>{n} bill{n!==1?"s":""}</span>
                    </div>
                    <div style={{height:4,background:C.bg2,borderRadius:2,overflow:"hidden"}}>
                      <div style={{width:(n/total*100)+"%",height:"100%",background:PCOLS[party],borderRadius:2,transition:"width 0.4s"}}/>
                    </div>
                  </div>
                ))}
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>
                  {(()=>{
                    const byStatus={};
                    wBills.forEach(b=>{byStatus[b.status]=(byStatus[b.status]||0)+1;});
                    const SL2={signed_into_law:"Signed",passed_senate:"Passed Senate",passed_house:"Passed House",on_the_floor:"On Floor",in_committee:"In Committee",introduced:"Introduced",failed:"Failed"};
                    const SC2={signed_into_law:"#2d6a4f",passed_senate:"#1e40af",passed_house:"#1e40af",on_the_floor:"#1e40af",in_committee:"#d97706",introduced:"#7c3aed",failed:"#8b2e2e"};
                    return Object.entries(byStatus).map(([s,n])=>(
                      <span key={s} style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:"#fff",background:(SC2[s]||"#666"),padding:"3px 9px",borderRadius:9999}}>{SL2[s]||s}: {n}</span>
                    ));
                  })()}
                </div>
              </div>
            );
          })()}
        </Sec>}
      </div>}

      {/* ── INTERESTS TAB ── */}
      {pTab==="interests"&&<div>
        <Sec title="Topic Interests">
          <div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.textM,marginBottom:12,lineHeight:1.5,paddingTop:4}}>Select the topics you want to track. This personalizes your feed and notification priority.</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingBottom:8}}>
            {trending.map((t,i)=>{
              const col=TOPIC_COLORS[i%TOPIC_COLORS.length];
              const on=interests.includes(t.name);
              return(
                <button key={t.name} onClick={()=>toggleInterest(t.name)} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:9999,background:on?col:C.bg2,color:on?"#fff":C.text2,border:"1px solid "+(on?col:C.border),fontFamily:F.body,fontSize:12,fontWeight:300,transition:"all 0.15s"}}>
                  {on&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  {t.name}
                </button>
              );
            })}
          </div>
          {interests.length>0&&<div style={{marginTop:8,paddingTop:12,borderTop:"1px solid "+C.border}}>
            <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>Selected ({interests.length})</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {interests.map(name=>(
                <span key={name} onClick={()=>toggleInterest(name)} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,background:C.bg2,border:"1px solid "+C.border,padding:"3px 10px",borderRadius:9999}}>
                  {name}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              ))}
            </div>
          </div>}
        </Sec>
      </div>}

      {/* ── NOTIFICATIONS TAB ── */}
      {pTab==="notifications"&&<div>
        <div style={{background:C.card,borderRadius:14,border:"1px solid "+C.border,marginBottom:12,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={notif.enabled?C.navy:C.textM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span style={{fontFamily:F.body,fontSize:13,fontWeight:400,color:C.text}}>Notifications</span>
            </div>
            <Tog on={notif.enabled} onToggle={()=>setNotif({enabled:!notif.enabled})}/>
          </div>
          <div style={{opacity:notif.enabled?1:0.4,pointerEvents:notif.enabled?"auto":"none",transition:"opacity 0.2s"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
              <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Alert Scope</div>
              {[["watchlist","Watchlist only","Only bills and members you've bookmarked"],["all","All legislation","Any bill with a major status change"],["major","Major developments only","Floor votes, signings, and vetoes"]].map(([k,label,desc])=>(
                <div key={k} onClick={()=>setNotif({scope:k})} style={{cursor:"pointer",display:"flex",alignItems:"flex-start",gap:10,padding:"9px 10px",borderRadius:9,background:notif.scope===k?C.navy+"0a":"transparent",border:"1px solid "+(notif.scope===k?C.navy+"30":"transparent"),marginBottom:4,transition:"all 0.12s"}}>
                  <div style={{width:15,height:15,borderRadius:9999,border:"2px solid "+(notif.scope===k?C.navy:C.border),background:notif.scope===k?C.navy:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    {notif.scope===k&&<div style={{width:5,height:5,borderRadius:9999,background:"#fff"}}/>}
                  </div>
                  <div>
                    <div style={{fontFamily:F.body,fontSize:12,fontWeight:notif.scope===k?400:300,color:notif.scope===k?C.navy:C.text}}>{label}</div>
                    <div style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.textM,marginTop:1}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
              <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Delivery</div>
              <div style={{display:"flex",gap:6}}>
                {[["in-app","In-App"],["email","Email"],["both","Both"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setNotif({channel:k})} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"7px 0",borderRadius:9999,fontFamily:F.body,fontSize:11,fontWeight:notif.channel===k?400:300,background:notif.channel===k?C.navy:"transparent",color:notif.channel===k?"#fff":C.text2,border:"1px solid "+(notif.channel===k?C.navy:C.border),transition:"all 0.15s"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border}}>
              <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Alert Types</div>
              {[["billStatus","Bill status changes"],["floorVote","Floor votes"],["hearings","Committee hearings"],["deadlines","Deadlines & recesses"],["billNews","News coverage"],["memberActivity","Member activity"],["weeklyDigest","Weekly digest"]].map(([k,label])=>(
                <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+C.border}}>
                  <span style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text}}>{label}</span>
                  <Tog on={notif[k]} onToggle={()=>setNotif({[k]:!notif[k]})}/>
                </div>
              ))}
            </div>
            <div style={{padding:"12px 16px"}}>
              <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Quiet Hours</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="time" value={notif.quietStart} onChange={e=>setNotif({quietStart:e.target.value})} style={{flex:1,fontFamily:F.mono,fontSize:12,color:C.text,background:C.bg2,border:"1px solid "+C.border,borderRadius:8,padding:"7px 8px",outline:"none"}}/>
                <span style={{fontFamily:F.body,fontSize:11,color:C.textM}}>to</span>
                <input type="time" value={notif.quietEnd} onChange={e=>setNotif({quietEnd:e.target.value})} style={{flex:1,fontFamily:F.mono,fontSize:12,color:C.text,background:C.bg2,border:"1px solid "+C.border,borderRadius:8,padding:"7px 8px",outline:"none"}}/>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* ── SETTINGS TAB ── */}
      {pTab==="settings"&&<div>
        <Sec title="News Preferences">
          <div style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:C.textM,marginBottom:12,lineHeight:1.5,paddingTop:4}}>Choose your preferred news outlet. Bill coverage will be filtered to show only headlines from that source.</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[["","All Sources","Show headlines from every outlet"],["CNN","CNN","Left-center news coverage"],["Fox News","Fox News","Right-leaning news coverage"],["MSNBC","MSNBC","Left-leaning news coverage"]].map(([val,label,desc])=>{
              const brand=OUTLET_BRAND[val];
              const active=newsOutlet===val;
              return(
                <div key={val} onClick={()=>setNewsOutlet(val)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,border:"1px solid "+(active?(brand?.color||C.navy):C.border),background:active?(brand?.bg||C.navy+"0a"):"transparent",transition:"all 0.15s"}}>
                  <div style={{width:16,height:16,borderRadius:9999,border:"2px solid "+(active?(brand?.color||C.navy):C.border),background:active?(brand?.color||C.navy):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {active&&<div style={{width:5,height:5,borderRadius:9999,background:"#fff"}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:F.body,fontSize:12,fontWeight:active?500:300,color:active?(brand?.color||C.navy):C.text}}>{label}</div>
                    <div style={{fontFamily:F.body,fontSize:10,fontWeight:300,color:C.textM,marginTop:1}}>{desc}</div>
                  </div>
                  {val&&brand&&<span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:brand.color,background:brand.bg,border:"1px solid "+brand.border,padding:"1px 7px",borderRadius:9999,textTransform:"uppercase",letterSpacing:0.5}}>{val}</span>}
                </div>
              );
            })}
          </div>
        </Sec>
        <Sec title="App">
          <RowItem label="Version" value="1.0.0 · 119th Congress"/>
          <RowItem label="Data sources" value="Congress.gov · OpenSecrets · FEC"/>
          <RowItem label="Coverage" value="January 2025 – present"/>
          <RowItem label="Mission" value="Non-partisan legislative tracking"/>
        </Sec>
        <Sec title="Data & Privacy">
          <RowItem label="Profile data" note="Stored locally on your device">
            <button onClick={()=>{if(window.confirm("Clear all local profile data?")){localStorage.removeItem("civly-profile");localStorage.removeItem("civly-notif-settings");localStorage.removeItem("civly-dashboard-v2");window.location.reload();}}} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:"#EA4335",padding:"4px 10px",borderRadius:9999,border:"1px solid rgba(234,67,53,0.3)"}}>Clear</button>
          </RowItem>
          <RowItem label="Watchlist" note={""+wb.length+" bills, "+wm.length+" members"}>
            <button onClick={()=>{if(window.confirm("Clear your entire watchlist?")){localStorage.removeItem("civly-watchlist-bills");localStorage.removeItem("civly-watchlist-members");window.location.reload();}}} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:"#EA4335",padding:"4px 10px",borderRadius:9999,border:"1px solid rgba(234,67,53,0.3)"}}>Clear</button>
          </RowItem>
          <RowItem label="Dashboard layout" note={""+((()=>{try{const s=localStorage.getItem("civly-dashboard-v2");return s?JSON.parse(s).length:0;}catch{return 0;}})())+" panels saved"}>
            <button onClick={()=>{localStorage.removeItem("civly-dashboard-v2");window.location.reload();}} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:"#EA4335",padding:"4px 10px",borderRadius:9999,border:"1px solid rgba(234,67,53,0.3)"}}>Reset</button>
          </RowItem>
        </Sec>
        <Sec title="Sign Out" noPad>
          {!signOutConfirm
            ?<button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",width:"100%",boxSizing:"border-box",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px 0"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:"#EA4335"}}>Sign out</span>
            </button>
            :<div style={{padding:"16px"}}>
              <div style={{fontFamily:F.body,fontSize:13,fontWeight:300,color:C.text,marginBottom:12,textAlign:"center"}}>Sign out of Civlio?</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSignOutConfirm(false)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:C.bg2,color:C.text2,borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:300,border:"1px solid "+C.border}}>Cancel</button>
                <button onClick={handleSignOut} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"10px 0",background:"#EA4335",color:"#fff",borderRadius:9999,fontSize:12,fontFamily:F.body,fontWeight:400}}>Sign out</button>
              </div>
            </div>}
        </Sec>
      </div>}

    </div>
  );
})()}

</div>)}

// ═══ SCOTUS ═══
const JUSTICE_LEAN_COL={Conservative:PC.republican,"Center-Right":"#b45309",Liberal:PC.democrat};
const JUSTICE_INITIALS=n=>n.split(" ").map(w=>w[0]).join("").slice(-2).toUpperCase();
const JUSTICE_IMG=n=>{const j=justices.find(x=>x.name===n);return j?.img||null;};
const TOPIC_COL_SC={Immigration:"#ea580c",Healthcare:"#059669",Technology:"#1e40af","Criminal Justice":"#7c3aed",Education:"#d97706",Energy:"#0369a1",Environment:"#15803d","Economic":"#b45309"};

function JusticeTooltip({j,leanCol,children}){
  const[show,setShow]=useState(false);
  const scotusCasesFiltered=scotusCases.filter(c=>c.majority.includes(j.name)||c.dissent.includes(j.name));
  const majorityCount=scotusCases.filter(c=>c.majority.includes(j.name)).length;
  const dissentCount=scotusCases.filter(c=>c.dissent.includes(j.name)).length;
  return(
    <div style={{position:"relative",display:"inline-flex"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show&&<div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",zIndex:200,pointerEvents:"none",animation:"civlyTooltipIn 0.15s ease both"}}>
        <div style={{background:C.navy,borderRadius:12,padding:"10px 12px",minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:"#fff",marginBottom:2,whiteSpace:"nowrap"}}>{j.name}</div>
          <div style={{fontFamily:F.mono,fontSize:8,color:leanCol,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>{j.role}</div>
          <div style={{fontFamily:F.body,fontSize:10,color:"rgba(255,255,255,0.55)",marginBottom:6}}>Appointed by {j.appointedBy} · {j.appointed}</div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"4px 7px",textAlign:"center"}}>
              <div style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:"#34d399"}}>{majorityCount}</div>
              <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5}}>Majority</div>
            </div>
            <div style={{flex:1,background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"4px 7px",textAlign:"center"}}>
              <div style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:"#f87171"}}>{dissentCount}</div>
              <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:0.5}}>Dissent</div>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:C.navy,border:"1px solid rgba(255,255,255,0.1)",borderTop:"none",borderLeft:"none",rotate:"45deg"}}/>
        </div>
      </div>}
    </div>
  );
}

function JusticeArc(){
  // Arrange 9 justices in a single arc row with lean color + role indicator
  const rows=[justices.slice(0,5),justices.slice(5,9)];
  return(
    <div style={{background:"linear-gradient(180deg,#080f1e 0%,#111d36 100%)",borderRadius:20,padding:"20px 16px 16px",marginBottom:20,position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
      {/* Decorative court dome arc */}
      <div style={{position:"absolute",bottom:-40,left:"50%",transform:"translateX(-50%)",width:420,height:220,borderRadius:"50% 50% 0 0",border:"1px solid rgba(255,255,255,0.04)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-60,left:"50%",transform:"translateX(-50%)",width:520,height:280,borderRadius:"50% 50% 0 0",border:"1px solid rgba(255,255,255,0.03)",pointerEvents:"none"}}/>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',serif",fontSize:22,color:"#fff",letterSpacing:1}}>THE ROBERTS COURT</div>
          <div style={{fontFamily:F.mono,fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>2024–2025 Term · 119th Congress</div>
        </div>
        {/* 6-3 composition pill */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
          <div style={{display:"flex",alignItems:"center",gap:0,height:8,borderRadius:9999,overflow:"hidden",width:90}}>
            <div style={{flex:6,height:"100%",background:PC.republican}}/>
            <div style={{flex:3,height:"100%",background:PC.democrat}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <span style={{fontFamily:F.mono,fontSize:9,color:PC.republican,fontWeight:700}}>6 Conservative</span>
            <span style={{fontFamily:F.mono,fontSize:9,color:PC.democrat,fontWeight:700}}>3 Liberal</span>
          </div>
        </div>
      </div>
      {/* Justices grid */}
      {rows.map((row,ri)=>(
        <div key={ri} style={{display:"flex",justifyContent:ri===0?"space-between":"space-around",gap:8,marginBottom:ri===0?12:0}}>
          {row.map(j=>{
            const leanCol=JUSTICE_LEAN_COL[j.lean.split("-")[0]]||"#9ca3af";
            const isChief=j.role==="Chief Justice";
            return(
              <JusticeTooltip key={j.name} j={j} leanCol={leanCol}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:1,cursor:"pointer"}}>
                  <div style={{position:"relative"}}>
                    <div style={{width:isChief?46:38,height:isChief?46:38,borderRadius:"50%",border:"2px solid "+leanCol+"90",overflow:"hidden",boxShadow:"0 0 12px "+leanCol+"40",flexShrink:0,background:"#1a2744",transition:"box-shadow 0.2s,transform 0.2s"}}
                      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 20px "+leanCol+"80";e.currentTarget.style.transform="scale(1.1)";}}
                      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 0 12px "+leanCol+"40";e.currentTarget.style.transform="scale(1)";}}>
                      <img src={j.img} alt={j.name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}
                        onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML='<span style="font-family:\'JetBrains Mono\',monospace;font-size:'+(isChief?13:11)+'px;font-weight:700;color:'+leanCol+';display:flex;align-items:center;justify-content:center;width:100%;height:100%;">'+JUSTICE_INITIALS(j.name)+'</span>';}}/>
                    </div>
                    {isChief&&<div style={{position:"absolute",bottom:-3,left:"50%",transform:"translateX(-50%)",width:16,height:4,background:leanCol,borderRadius:2,boxShadow:"0 0 6px "+leanCol+"80"}}/>}
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:F.body,fontSize:9,fontWeight:500,color:"rgba(255,255,255,0.85)",lineHeight:1.2,whiteSpace:"nowrap"}}>{j.name.split(" ").pop()}</div>
                    <div style={{fontFamily:F.mono,fontSize:7,color:leanCol+"cc",letterSpacing:0.5,marginTop:1}}>{j.lean}</div>
                  </div>
                </div>
              </JusticeTooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ScotusArgCountdown({argDate}){
  const[parts,setParts]=useState(null);
  useEffect(()=>{
    const calc=()=>{
      const diff=new Date(argDate+"T10:00:00")-new Date();
      if(diff<=0){setParts(null);return;}
      const d=Math.floor(diff/864e5);const h=Math.floor((diff%864e5)/36e5);
      setParts({d,h});
    };
    calc();const id=setInterval(calc,60000);return()=>clearInterval(id);
  },[argDate]);
  if(!parts)return null;
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:F.mono,fontSize:8,fontWeight:600,color:"#fff",background:C.accent,padding:"2px 8px",borderRadius:9999,animation:"civlyDotBounce 2s ease-in-out infinite"}}>
      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Oral arg in {parts.d}d {parts.h}h
    </span>
  );
}

function VoteSplit({majority,dissent}){
  if(!majority.length)return null;
  const total=majority.length+dissent.length;
  const pct=Math.round((majority.length/total)*100);
  // Color by split type
  const isUnanimous=dissent.length===0;
  const isNarrow=majority.length===5&&dissent.length===4;
  const splitCol=isUnanimous?"#15803d":isNarrow?C.accent:C.accent2;
  return(
    <div style={{marginTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.success}}>MAJORITY {majority.length}</span>
        {dissent.length>0&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.error}}>DISSENT {dissent.length}</span>}
        {isUnanimous&&<span style={{fontFamily:F.mono,fontSize:8,color:C.success,fontWeight:600,background:C.success+"12",padding:"1px 6px",borderRadius:9999}}>UNANIMOUS</span>}
        {isNarrow&&<span style={{fontFamily:F.mono,fontSize:8,color:C.error,fontWeight:600,background:C.error+"12",padding:"1px 6px",borderRadius:9999}}>5–4 NARROW</span>}
      </div>
      <div style={{height:4,borderRadius:2,overflow:"hidden",background:C.error+"30"}}>
        <div style={{height:"100%",background:C.success,borderRadius:2,"--fill-w":pct+"%",width:"var(--fill-w)",animation:"civlyBarFill 0.7s ease forwards"}}/>
      </div>
    </div>
  );
}

function SCOTUSCaseDetail({c,onBack}){
  const leanOf=name=>{const j=justices.find(x=>x.name===name);return j?j.lean:"Unknown";};
  const leanColOf=name=>JUSTICE_LEAN_COL[leanOf(name).split("-")[0]]||"#9ca3af";
  const topicCol=TOPIC_COL_SC[c.topic]||C.accent2;
  const stColor=c.status==="decided"?C.success:c.status==="argued"?C.accent2:C.accent;
  const isPending=c.status==="pending"||c.status==="argued";
  return(
    <div>
      {/* Back + header */}
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:20}}>
        <button onClick={onBack} style={{all:"unset",cursor:"pointer",marginTop:3,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,borderRadius:8,background:C.bg2,border:"1px solid "+C.border,transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=C.navy+"10";}}
          onMouseLeave={e=>{e.currentTarget.style.background=C.bg2;}}>
          <ChevronLeft size={16} color={C.text2} strokeWidth={2}/>
        </button>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:stColor,background:stColor+"14",padding:"2px 9px",borderRadius:9999,textTransform:"uppercase",letterSpacing:0.8}}>{c.status}</span>
            <span style={{fontFamily:F.mono,fontSize:9,color:C.accent2,background:C.accent2+"10",padding:"2px 9px",borderRadius:9999}}>No. {c.docket}</span>
            {c.impact==="High"&&<span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:"#fff",background:C.accent,padding:"2px 8px",borderRadius:9999}}>HIGH IMPACT</span>}
          </div>
          <div style={{fontFamily:"'Bebas Neue',serif",fontSize:26,color:C.text,lineHeight:1.15,letterSpacing:0.5}}>{c.name}</div>
        </div>
      </div>

      {/* Dark hero card */}
      <div style={{background:"linear-gradient(135deg,#080f1e 0%,#111d36 100%)",borderRadius:20,padding:"20px 20px",marginBottom:16,border:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:"rgba(255,255,255,0.4)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Legal Question</div>
        <div style={{fontFamily:F.body,fontSize:14,color:"rgba(255,255,255,0.9)",lineHeight:1.65,fontWeight:300,fontStyle:"italic"}}>"{c.question}"</div>
        {/* Meta strip */}
        <div style={{display:"flex",gap:12,marginTop:16,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.07)",flexWrap:"wrap"}}>
          {[
            {label:"Topic",val:c.topic,col:topicCol},
            {label:"Impact",val:c.impact,col:c.impact==="High"?C.accent:C.accent2},
            {label:c.status==="decided"?"Decided":"Oral Arg.",val:fD(c.decided||c.arg)||"TBD",col:"rgba(255,255,255,0.7)"},
          ].map(({label,val,col})=>(
            <div key={label}>
              <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.3)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>{label}</div>
              <div style={{fontFamily:F.body,fontSize:12,fontWeight:500,color:col}}>{val}</div>
            </div>
          ))}
          {isPending&&c.arg&&<ScotusArgCountdown argDate={c.arg}/>}
        </div>
      </div>

      {/* Ruling */}
      {c.result&&(
        <div style={{background:C.success+"08",borderRadius:16,padding:"16px 18px",marginBottom:16,border:"1px solid "+C.success+"25"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.success,letterSpacing:1.5,textTransform:"uppercase"}}>Ruling</span>
          </div>
          <div style={{fontFamily:F.body,fontSize:13,color:C.text,lineHeight:1.65,fontWeight:400}}>{c.result}</div>
        </div>
      )}

      {!c.result&&(
        <div style={{background:C.accent2+"08",borderRadius:16,padding:"16px 18px",marginBottom:16,border:"1px solid "+C.accent2+"25",display:"flex",alignItems:"center",gap:12}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <div>
            <div style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.accent2,letterSpacing:1.2,textTransform:"uppercase",marginBottom:3}}>{c.status==="argued"?"Decision Pending":"Oral Arguments Upcoming"}</div>
            <div style={{fontFamily:F.body,fontSize:12,color:C.text2,fontWeight:300}}>{c.status==="argued"?"The Court heard oral arguments and is deliberating. A decision is expected before the term ends in June.":"Oral arguments are scheduled for "+fD(c.arg)+". The Court will then deliberate and issue a ruling."}</div>
          </div>
        </div>
      )}

      {/* Justice vote grid */}
      {c.majority.length>0&&(
        <div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.textM,letterSpacing:1.5,textTransform:"uppercase"}}>Justice Vote Breakdown</span>
            <span style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:C.text}}>{c.majority.length}–{c.dissent.length}</span>
          </div>
          <div style={{padding:"14px 16px"}}>
            <VoteSplit majority={c.majority} dissent={c.dissent}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}}>
              <div>
                <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.success,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>Majority</div>
                {c.majority.map(name=>{
                  const lCol=leanColOf(name);
                  const lean=leanOf(name);
                  return(
                    <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid "+C.border+"66"}}>
                      <div style={{width:30,height:30,borderRadius:"50%",border:"1.5px solid "+lCol+"70",overflow:"hidden",flexShrink:0,background:lCol+"15"}}>
                        {JUSTICE_IMG(name)?<img src={JUSTICE_IMG(name)} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}/>:<span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:lCol,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{JUSTICE_INITIALS(name)}</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:F.body,fontSize:12,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                        <div style={{fontFamily:F.mono,fontSize:8,color:lCol+"cc",marginTop:1}}>{lean}</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  );
                })}
              </div>
              {c.dissent.length>0&&(
                <div>
                  <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.error,letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>Dissent</div>
                  {c.dissent.map(name=>{
                    const lCol=leanColOf(name);
                    const lean=leanOf(name);
                    return(
                      <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid "+C.border+"66"}}>
                        <div style={{width:30,height:30,borderRadius:"50%",border:"1.5px solid "+lCol+"70",overflow:"hidden",flexShrink:0,background:lCol+"15"}}>
                          {JUSTICE_IMG(name)?<img src={JUSTICE_IMG(name)} alt={name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}/>:<span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:lCol,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>{JUSTICE_INITIALS(name)}</span>}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:F.body,fontSize:12,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                          <div style={{fontFamily:F.mono,fontSize:8,color:lCol+"cc",marginTop:1}}>{lean}</div>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.error} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FINANCE SCREEN ───────────────────────────────────────────
const FINANCE_SECTORS=[
  {key:"all",label:"All Sectors"},
  {key:"equities",label:"Equities"},
  {key:"bonds",label:"Bonds"},
  {key:"energy",label:"Energy"},
  {key:"healthcare",label:"Healthcare"},
  {key:"realestate",label:"Real Estate"},
  {key:"defense",label:"Defense"},
  {key:"tech",label:"Tech"},
  {key:"banking",label:"Banking"},
];

// magnitude: 1-3 (minor / moderate / major market mover)
// passProb: estimated probability of enactment
// tickers: directly exposed equities/ETFs
// mechanism: how the bill creates the impact
// risk: what could change the outlook
const FINANCE_BILLS=[
  {
    billId:"b1",
    passProb:100,
    sectors:["equities","bonds","banking","healthcare"],
    impacts:{
      equities:{
        dir:1,label:"Bullish",magnitude:3,
        tickers:["SPY","QQQ","XLF","IVV"],
        mechanism:"Permanent 21% corporate tax rate removes uncertainty that weighed on forward earnings models since 2025 sunset risk. EPS estimates revised up 4–6% on passage. Tips and overtime deductions boost consumer spending capacity — retail and discretionary sectors see secondary lift.",
        detail:"Morgan Stanley revised S&P 500 EPS target +$12 on passage. Small-cap (IWM) outperforms as TCJA's pass-through deduction disproportionately benefits private businesses that feed public supply chains.",
        risk:"Yield spike from deficit financing could compress multiples and reverse gains. Any Medicaid cut injunction could delay full implementation.",
      },
      bonds:{
        dir:-1,label:"Bearish",magnitude:3,
        tickers:["TLT","IEF","BND","TMF"],
        mechanism:"CBO projects $3.2T added to 10-year deficit. Treasury must issue an estimated $400–500B in additional long-dated bonds annually. Supply-demand imbalance pushes yields up — 10-yr moved from 4.31% to 4.53% in the two weeks following passage.",
        detail:"Primary dealers flagged record coupon issuance in July 2025 refunding announcements. Fed's QT program running simultaneously removes ~$60B/month from market — combined with fiscal expansion, this is the most pressure on long Treasuries since 2022.",
        risk:"If growth disappoints or recession risk rises, flight-to-safety demand could absorb new supply and cap yield upside.",
      },
      banking:{
        dir:1,label:"Bullish",magnitude:2,
        tickers:["XLF","JPM","BAC","GS","KRE"],
        mechanism:"Lower corporate tax rates directly expand after-tax ROE for large banks. Deregulatory stance (reduced CFPB activity, lighter Basel III endgame) compounds the tailwind. Tips deduction increases consumer cash flow, reducing near-term charge-off risk.",
        detail:"JPMorgan guided EPS +$0.40/share from TCJA permanence. Regional banks (KRE) benefit more proportionally — many operate as pass-throughs and see full deduction value. Goldman's capital markets division benefits from M&A reactivation as deal certainty improves with lower rates.",
        risk:"Medicaid cuts reducing healthcare spending could hurt consumer loan performance in southern states with high Medicaid enrollment.",
      },
      healthcare:{
        dir:-1,label:"Bearish",magnitude:2,
        tickers:["UNH","CVS","HUM","MOH","CNC","HCA"],
        mechanism:"Medicaid work requirements eliminate coverage for an estimated 8.6M adults per CBO — 60% of that population is served by managed care organizations (MCOs). Molina (MOH), Centene (CNC), and Humana (HUM) derive 30–55% of revenue from Medicaid. Revenue per member falls as the healthiest members disenroll first, worsening risk pools.",
        detail:"Centene stock fell 11% in the 5 trading days after Senate passage. Hospital sector faces dual pressure: uncompensated care rises as newly uninsured seek emergency services, while Medicaid inpatient days decline. HCA and Tenet Healthcare flagged $200–400M EBITDA exposure annually.",
        risk:"Legal challenges to work requirements in federal courts could delay or block implementation, preserving near-term MCO revenue.",
      },
    },
  },
  {
    billId:"b4",
    passProb:100,
    sectors:["equities","bonds","defense","banking"],
    impacts:{
      equities:{
        dir:0,label:"Neutral",magnitude:1,
        tickers:["SPY","VTI"],
        mechanism:"Government shutdown avoidance is already priced in by day of signing. Markets treat stopgap funding as baseline — no positive re-rating occurs without a structural deficit deal. Averts tail risk of agencies furloughing regulatory staff, which would have delayed M&A reviews at DOJ.",
        detail:"S&P 500 moved less than 0.2% on passage day. The bill's economic significance is primarily in what it avoids rather than what it creates.",
        risk:"DHS two-week extension resets shutdown clock to Feb 14 — any failure there would hit defense, border, and FEMA-adjacent contractors.",
      },
      bonds:{
        dir:-1,label:"Bearish",magnitude:2,
        tickers:["TLT","IEF","GOVT"],
        mechanism:"$1.7T in new discretionary authority adds to the supply of government debt. Continuing resolutions typically fund at prior-year rates plus inflation adjustments — this one is no different, locking in elevated post-COVID spending baselines.",
        detail:"The 10-year yield rose 8bps in the week following passage, partly attributable to fiscal supply concerns layered on top of strong jobs data. The bill represents the fourth consecutive year of $1.7T+ discretionary budgets.",
        risk:"A deficit reduction deal or surprise Fed pivot to cuts would overwhelm fiscal supply pressures.",
      },
      defense:{
        dir:1,label:"Bullish",magnitude:1,
        tickers:["LMT","RTX","NOC","GD","ITA"],
        mechanism:"Baseline DoD funding continues without disruption. Defense contractors avoided the cost overruns and schedule slippage that accompany shutdown-related stop-work orders. Lockheed Martin alone cited $150M in potential quarterly impact from a prolonged shutdown.",
        detail:"The modest DoD top-line bump (approximately +2.4% vs FY2025) covers munitions replenishment commitments made to NATO allies. Raytheon's Stinger and Javelin production lines benefit from continued NDAA-authorized supplemental funding.",
        risk:"DHS funding expiry Feb 14 could create a second partial shutdown affecting some DoD civilian employees — though core military operations continue regardless.",
      },
      banking:{
        dir:0,label:"Neutral",magnitude:1,
        tickers:["XLF","KRE"],
        mechanism:"Government employee direct deposits remain uninterrupted. During 2018–19 shutdown, JPMorgan and others reported elevated overdraft activity and loan payment deferrals from federal workers — all of that avoided here.",
        detail:"The Treasury's General Account was at $620B at signing — no near-term debt ceiling pressure. Short-term T-bill market unaffected.",
        risk:"Prolonged DHS negotiations could trigger payment timing stress in some government contractor supply chains.",
      },
    },
  },
  {
    billId:"b5",
    passProb:100,
    sectors:["energy","tech","bonds"],
    impacts:{
      energy:{
        dir:-1,label:"Bearish",magnitude:1,
        tickers:["ICLN","FSLR","ENPH","NEE","SEDG"],
        mechanism:"DOE Office of Energy Efficiency and Renewable Energy (EERE) funding cut 4% from FY2025. Loan Programs Office (LPO) administrative budget trimmed, slowing clean energy loan guarantee pipeline. Direct impact is modest but signals legislative direction toward fossil fuel deregulation.",
        detail:"First Solar (FSLR) and Enphase (ENPH) are most exposed to federal incentive program continuity. The IRA's 45X manufacturing tax credits remain intact — this appropriations cut does not affect those credits, limiting downside.",
        risk:"IRA manufacturing credits are mandatory spending — appropriations can't cut them. Clean energy equity selloff on this bill overstates the actual policy impact.",
      },
      tech:{
        dir:0,label:"Neutral",magnitude:1,
        tickers:["QQQ","MSFT","GOOG"],
        mechanism:"NIST funding flat means AI safety framework development continues on existing timeline. NASA budget maintained; commercial launch and satellite contracts (SpaceX, ULA, Boeing) unaffected. Census funding matters for tech's ad-targeting data ecosystem but minimally.",
        detail:"The bill funds NSF at $9.1B vs $9.4B requested — a modest drag on university research grants that flow into AI and quantum computing pipelines. Long-term negative for research universities but immaterial to large-cap tech.",
        risk:"Flat NSF funding compounding over multiple years could widen US-China research gap in advanced computing.",
      },
      bonds:{
        dir:-1,label:"Bearish",magnitude:1,
        tickers:["TLT","SHY","IEF"],
        mechanism:"Part of the broader FY2026 appropriations cycle contributing to $1.7T+ discretionary baseline. Incremental supply pressure on Treasuries. Army Corps of Engineers and DOE project financing requires Treasury issuance.",
        detail:"The Army Corps portion funds $8.2B in water infrastructure — much of this via bonds rather than direct appropriations, adding to municipal and agency debt supply.",
        risk:"If spending totals come in below enacted levels due to impoundment (via DOGE), actual debt issuance could undershoot projections.",
      },
    },
  },
  {
    billId:"b6",
    passProb:62,
    sectors:["tech","energy","defense","equities"],
    impacts:{
      tech:{
        dir:1,label:"Bullish",magnitude:3,
        tickers:["NVDA","AMD","INTC","MP","LTHM","ALB","QQQ"],
        mechanism:"Gallium, germanium, cobalt, and rare earth elements are essential for GPU dies, HBM memory, and advanced packaging. China currently controls ~80% of global gallium/germanium processing and restricted exports in 2023. A domestic U.S. supply chain removes single-point-of-failure risk for NVIDIA and AMD fab supply.",
        detail:"MP Materials (MP) — the only rare earth mine and processor operating at scale in the U.S. — is the most direct beneficiary. Livent/Arcadium (ALTM) and Albemarle (ALB) benefit from lithium supply chain grants. Semiconductor equipment companies (AMAT, KLAC) see secondary demand as domestic fabs expand to consume domestically sourced materials.",
        risk:"18-month assessment timeline means no near-term supply chain change. Bill must still pass Senate (62% prob). China could accelerate export restrictions before U.S. supply comes online.",
      },
      energy:{
        dir:1,label:"Bullish",magnitude:2,
        tickers:["MP","LTHM","ALB","SQM","ALTM","XME"],
        mechanism:"Opens federal lands and streamlines permitting for lithium, cobalt, nickel, and manganese extraction. DOE grants for refining infrastructure directly fund companies attempting to build domestic battery-grade material supply chains — a $40B+ market currently dominated by China, Japan, and South Korea.",
        detail:"Nevada Lithium and ioneer's Rhyolite Ridge project are positioned to receive loan guarantees. The bill's supply chain vulnerability report will likely recommend lithium strategic reserve — analogous to the Strategic Petroleum Reserve — which would require government purchases from domestic producers.",
        risk:"Mining permitting reform faces legal challenges from environmental groups. Senate passage probability 62% — any amendment weakening permitting streamlining reduces the bill's economic value.",
      },
      defense:{
        dir:1,label:"Bullish",magnitude:2,
        tickers:["LMT","RTX","NOC","HII","BAH"],
        mechanism:"F-35 requires approximately 900 lbs of rare earth elements per aircraft. Tomahawk cruise missiles, Virginia-class submarine motors, and Aegis radar arrays all depend on neodymium and dysprosium magnets currently sourced from China. Domestic supply reduces cost volatility and eliminates national security supply chain risk.",
        detail:"DoD's Defense Logistics Agency has flagged rare earth supply as a Tier 1 supply chain vulnerability since 2020. The bill requires classified DoD assessment within 6 months — likely to recommend domestic procurement preferences that benefit MP Materials and emerging processors.",
        risk:"Timeline to domestic production scale is 5-7 years minimum — the defense benefit is long-duration. Near-term defense stock move is anticipatory.",
      },
      equities:{
        dir:1,label:"Bullish",magnitude:1,
        tickers:["IWM","XME","REMX"],
        mechanism:"Broad equity tailwind from reduced China supply chain dependency — reduces tail risk across tech, auto, and defense sectors. REMX (VanEck Rare Earth/Strategic Metals ETF) is the most direct play.",
        detail:"REMX holdings include MP Materials, Lynas Rare Earths, and Energy Fuels — all directly benefit from domestic sourcing mandates. Small-cap mining companies benefit from federal grant eligibility.",
        risk:"Bill is still on House floor (not yet passed Senate). Sentiment-driven moves may give back if Senate passage stalls.",
      },
    },
  },
  {
    billId:"b8",
    passProb:55,
    sectors:["realestate","equities","bonds"],
    impacts:{
      realestate:{
        dir:1,label:"Bullish",magnitude:2,
        tickers:["SKY","CVCO","NVR","DHI","TOL","ITB"],
        mechanism:"Manufactured/factory-built homes are the primary affordable housing product for the bottom 30% of the income distribution. Removing DOE energy efficiency mandates (which added $7K–$10K per unit) directly expands the addressable buyer pool. Skyline Champion (SKY) and Cavco Industries (CVCO) are pure-play manufactured home producers.",
        detail:"Skyline Champion shares rallied 8.3% on passage day. The company produces ~50,000 homes annually — at $8K average cost reduction, that's ~$400M in total addressable cost savings. Land-lease community operators (Sun Communities, UDR) benefit indirectly as new home affordability drives community fill rates.",
        risk:"Energy efficiency standards also reduce utility costs over time — lower-income residents in less-efficient homes will face higher long-run operating costs, which could impair mortgage performance. Senate passage at ~55% probability.",
      },
      equities:{
        dir:0,label:"Neutral",magnitude:1,
        tickers:["XHB","ITB"],
        mechanism:"Manufactured home cost reduction expands the housing supply segment below $150K — a segment where site-built builders (DHI, LEN, NVR) don't compete. Minimal cannibalization of traditional homebuilder revenue.",
        detail:"The 22M Americans currently living in manufactured homes represent a captive renovation and replacement market. Manufactured homes turn over at 15-year average cycles vs 25-year for site-built — durable demand floor for SKY and CVCO.",
        risk:"If energy efficiency deregulation triggers state-level mandates as a counterresponse, multi-state manufacturers face compliance patchwork costs.",
      },
      bonds:{
        dir:0,label:"Neutral",magnitude:1,
        tickers:["MBB","VMBS","AGG"],
        mechanism:"Manufactured home mortgages (chattel loans) are typically securitized outside of Fannie/Freddie GSE programs — they trade as non-agency collateral with higher spreads. Expanded origination volume modestly increases non-agency MBS supply.",
        detail:"Freddie Mac's CHOICEHome program provides some agency backing for manufactured housing. Expanded supply under this bill could push Freddie to expand CHOICEHome limits — reducing spreads and improving affordability further.",
        risk:"Non-agency manufactured home MBS has historically underperformed in downturns due to chattel loan structure — not a major systemic risk but worth monitoring in a recession scenario.",
      },
    },
  },
  {
    billId:"b14",
    passProb:38,
    sectors:["equities","bonds","tech","defense"],
    impacts:{
      equities:{
        dir:-1,label:"Bearish",magnitude:2,
        tickers:["SAIC","CACI","LEIDOS","BAH","CSCO","HPE","DXC"],
        mechanism:"DOGE's stated mission is eliminating duplicative contracts and improper payments. Federal IT services and management consulting firms with large government portfolios are directly exposed to contract cancellation. Booz Allen Hamilton (BAH) derives 97% of revenue from government; SAIC and Leidos are similarly concentrated.",
        detail:"In its first 90 days, DOGE cancelled or paused approximately $105B in contracts (per administration claims, contested by GAO). Federal IT modernization contracts — many multi-year — are most exposed. Accenture Federal Services, IBM Federal, and Microsoft's Azure Government division have material exposure but are diversified enough that impact is manageable.",
        risk:"Bill probability only 38% — DOGE currently operates without statutory authority and faces FACA compliance lawsuits. Congressional authorization could normalize its operations and reduce legal uncertainty, potentially capping the downside.",
      },
      bonds:{
        dir:1,label:"Bullish",magnitude:2,
        tickers:["TLT","IEF","GOVT","VGLT"],
        mechanism:"If DOGE identifies and eliminates $500B+ in waste over 10 years (its stated goal, later revised to $150B more realistically), deficit trajectory improves. Bond markets would reprice long-end yields lower. Goldman estimates $100-200B in credible savings could reduce 10-year yields by 15-25bps.",
        detail:"The market currently prices DOGE savings at roughly $50-80B over 10 years — well below stated targets. Statutory authorization and subpoena power would meaningfully increase DOGE's ability to compel agency compliance and achieve larger savings. If realized, this would be the most significant deficit-reducing legislation since the BCA caps of 2011.",
        risk:"Political opposition from agencies and contractors, legal challenges, and implementation complexity make the high-end savings scenario speculative. The bond bull case requires DOGE to actually function effectively post-authorization.",
      },
      tech:{
        dir:-1,label:"Bearish",magnitude:2,
        tickers:["CSCO","DELL","HPE","MSFT","IBM"],
        mechanism:"Federal technology contracts — including cloud infrastructure, cybersecurity, and legacy system modernization — are DOGE's primary identified savings targets. Data center consolidation mandates could disrupt multi-year cloud migration contracts with AWS GovCloud, Microsoft Azure Government, and Oracle Federal.",
        detail:"The federal government spends ~$100B/year on IT. DOGE has already flagged duplicate software licenses ($2B+) and redundant data centers. Cisco's federal networking infrastructure contracts and Dell's hardware refresh cycles face cancellation risk. Microsoft Azure Government and AWS GovCloud are more insulated — cloud consolidation saves money; it doesn't eliminate the spend.",
        risk:"Cloud and AI contracts are likely to survive or grow even under DOGE — efficiency initiatives accelerate migration away from legacy systems, which benefits hyperscalers over legacy IT services firms.",
      },
      defense:{
        dir:-1,label:"Bearish",magnitude:1,
        tickers:["BAH","SAIC","CACI","LEIDOS"],
        mechanism:"Defense consulting and management advisory contracts are within DOGE scope. While core weapons systems and readiness contracts are protected, administrative overhead and support services contracts face scrutiny. Pentagon civilian workforce reduction proposals compound this.",
        detail:"The DoD spent $43B on professional services in FY2024. Even a 10% reduction would materially impact BAH and SAIC revenues. However, NDAA-authorized programs are politically harder to cancel — DOGE's mandate is primarily discretionary civilian spending.",
        risk:"Bipartisan support for defense spending means core defense contractors (LMT, RTX, NOC) are largely insulated. Consulting exposure is the primary risk vector.",
      },
    },
  },
  {
    billId:"b15",
    passProb:78,
    sectors:["equities","bonds","defense","banking"],
    impacts:{
      equities:{
        dir:-1,label:"Bearish",magnitude:2,
        tickers:["SPY","IWM","XLF","TSA-adjacent: AAL","DAL","UAL"],
        mechanism:"A DHS funding lapse shuts down TSA screening operations at major airports within 96 hours, triggering airline operational disruptions. ICE deportation flights halt, pausing the administration's enforcement agenda. FEMA disaster response degrades. Markets price in 0.3–0.6% S&P drawdown for each week of DHS shutdown based on 2018–19 precedent.",
        detail:"Airlines are uniquely exposed — TSA slowdowns reduce throughput and trigger passenger compensation claims. Delta and United saw ~2% declines during the 2018-19 shutdown. Beyond airlines, federal contractor payment delays ripple into supply chains — 40,000+ companies have active DHS contracts.",
        risk:"The Feb 14 deadline creates strong political pressure to resolve — 78% probability of passage. Short-term uncertainty is the primary risk, not structural market damage.",
      },
      bonds:{
        dir:1,label:"Bullish",magnitude:1,
        tickers:["SHY","BIL","TLT"],
        mechanism:"Flight-to-safety bid for short-duration Treasuries (T-bills, 2-year notes) during shutdown uncertainty. Investors rotate from equities and credit into government paper. The effect is short-lived — typically reverses within days of resolution.",
        detail:"2-year Treasury yield compressed 5-8bps during the Feb 1-3 partial shutdown episode. Similar dynamics expected. Long-end unaffected — shutdown doesn't change fiscal trajectory, just creates near-term payment delays.",
        risk:"If shutdown extends beyond 2 weeks, concerns about Treasury debt service reliability (purely symbolic, given Treasury's legal obligation) could perversely hurt long bonds.",
      },
      defense:{
        dir:-1,label:"Bearish",magnitude:1,
        tickers:["LMT","RTX","GD","NOC"],
        mechanism:"DHS is separate from DoD — core military operations are unaffected. However, some FEMA and Coast Guard operations that overlap with defense missions (disaster response, maritime security) face degradation. Defense contractors with DHS-specific contracts (border surveillance, drone systems) face stop-work orders.",
        detail:"L3Harris and Elbit (US subsidiary) have active CBP surveillance contracts worth $1.8B. Palantir has DHS analytical contracts. These enter stop-work status within 24 hours of a lapse. Core DoD programs (F-35, Virginia-class, GBSD) are NDAA-funded and unaffected.",
        risk:"A resolution before Feb 14 (78% likely) means any defense contract disruption is measured in days, not materially impacting quarterly revenue.",
      },
      banking:{
        dir:-1,label:"Bearish",magnitude:1,
        tickers:["JPM","BAC","WFC","USB","KRE"],
        mechanism:"800,000+ DHS and associated federal employees face delayed paychecks. Regional banks and credit unions serving federal employee populations see elevated overdraft requests and loan payment deferrals. JPMorgan, Wells Fargo, and Bank of America all offered fee waivers and emergency loans during the 2018-19 shutdown.",
        detail:"The 2018-19 35-day shutdown resulted in ~$3B in delayed federal worker pay. Banks absorbed roughly $80M in deferred payment costs — immaterial at the system level but notable for institutions with high federal employee customer concentration (USAA, Navy Federal, some mid-Atlantic regionals).",
        risk:"Resolution within days means actual charge-off and credit loss impact is essentially zero. The market impact is sentiment-driven, not fundamental.",
      },
    },
  },
];

const SECTOR_SUMMARY=[
  {key:"equities",label:"US Equities",index:"S&P 500",val:"+1.8%",dir:1,spark:[4.1,4.3,4.0,4.5,4.6,4.4,4.7,4.9],note:"Tax cut tailwinds offset by deficit concerns and DOGE contractor risk"},
  {key:"bonds",label:"Treasuries",index:"10-yr Yield",val:"4.82%",dir:-1,spark:[4.31,4.35,4.40,4.44,4.48,4.55,4.61,4.82],note:"Fiscal expansion pressuring yields; $3.2T+ new debt supply"},
  {key:"energy",label:"Energy",index:"XLE",val:"+0.4%",dir:0,spark:[88,86,87,85,84,86,87,88],note:"Mixed: appropriations cuts offset by critical minerals upside"},
  {key:"tech",label:"Technology",index:"QQQ",val:"+2.1%",dir:1,spark:[420,415,430,440,435,445,458,470],note:"Critical Minerals Act supports domestic chip and AI hardware supply chains"},
];

// ─── MARKETS DASHBOARD PANEL ─────────────────────────────
const MARKET_SECTOR_KEYS=["equities","bonds","energy","healthcare","realestate","defense","tech","banking"];
const SECTOR_LABELS={equities:"Equities",bonds:"Bonds",energy:"Energy",healthcare:"Healthcare",realestate:"Real Estate",defense:"Defense",tech:"Tech",banking:"Banking"};
const SECTOR_COLORS={equities:"#1a4db8",bonds:"#6d28d9",energy:"#b45309",healthcare:"#15803d",realestate:"#0369a1",defense:"#8b2e2e",tech:"#7c3aed",banking:"#1e40af"};

function MarketsDashPanel({nav}){
  const[activeSectors,setActiveSectors]=useState(new Set(["equities","bonds","tech","healthcare"]));
  const toggleSector=k=>setActiveSectors(prev=>{
    const n=new Set(prev);
    if(n.has(k)){if(n.size>1)n.delete(k);}else{n.add(k);}
    return n;
  });
  // collect all bills that have an impact in any active sector
  const rows=[];
  FINANCE_BILLS.forEach(fb=>{
    const bill=bills.find(b=>b.id===fb.billId);
    if(!bill)return;
    MARKET_SECTOR_KEYS.forEach(sk=>{
      if(!activeSectors.has(sk))return;
      const imp=fb.impacts?.[sk];
      if(!imp)return;
      rows.push({bill,fb,sk,imp});
    });
  });
  // sort: bearish (dir -1) first, then bullish, then neutral; then by magnitude desc
  rows.sort((a,b)=>{
    const ds=Math.abs(b.imp.dir)-Math.abs(a.imp.dir);
    if(ds!==0)return ds;
    return b.imp.magnitude-a.imp.magnitude;
  });
  const DIR_COLOR={1:"#15803d","-1":"#dc2626",0:"#b45309"};
  const DIR_LABEL={1:"▲ Bullish","-1":"▼ Bearish",0:"→ Mixed"};
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Sector filter chips */}
      <div style={{padding:"10px 12px 8px",borderBottom:"1px solid "+C.border,flexShrink:0}}>
        <div style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:6}}>Track Sectors</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {MARKET_SECTOR_KEYS.map(k=>{
            const on=activeSectors.has(k);
            const col=SECTOR_COLORS[k];
            return(
              <button key={k} onClick={()=>toggleSector(k)}
                style={{all:"unset",cursor:"pointer",fontFamily:F.mono,fontSize:9,fontWeight:on?700:500,
                  color:on?"#fff":C.textM,
                  background:on?col:C.bg2,
                  border:"1px solid "+(on?col:C.border),
                  padding:"3px 8px",borderRadius:9999,transition:"all 0.12s",letterSpacing:0.2}}>
                {SECTOR_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>
      {/* Bill/sector rows */}
      <div style={{overflowY:"auto",flex:1}} className="civly-scroll">
        {rows.length===0&&(
          <div style={{padding:24,textAlign:"center",fontFamily:F.body,fontSize:12,color:C.textM}}>No market impacts for selected sectors.</div>
        )}
        {rows.map(({bill,fb,sk,imp},i)=>{
          const col=SECTOR_COLORS[sk];
          const dirCol=DIR_COLOR[String(imp.dir)];
          const bars=[1,2,3].map(n=>(
            <span key={n} style={{display:"inline-block",width:4,height:4+n*3,borderRadius:1,background:n<=imp.magnitude?dirCol:"#e2e8f0",marginLeft:1,verticalAlign:"bottom"}}/>
          ));
          return(
            <div key={i} onClick={()=>nav("bill",{id:bill.id})}
              style={{padding:"9px 12px",borderBottom:"1px solid "+C.border,cursor:"pointer",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:col,background:col+"18",padding:"1px 6px",borderRadius:9999,letterSpacing:0.3,flexShrink:0}}>{SECTOR_LABELS[sk]}</span>
                <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:dirCol,flexShrink:0}}>{DIR_LABEL[String(imp.dir)]}</span>
                <span style={{marginLeft:"auto",display:"inline-flex",alignItems:"flex-end",gap:1,flexShrink:0}}>{bars}</span>
              </div>
              <div style={{fontFamily:F.display,fontSize:11,fontWeight:600,color:C.text,letterSpacing:"-0.1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bill.title}</div>
              <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{imp.mechanism?.slice(0,90)}{imp.mechanism?.length>90?"…":""}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceScreen({nav}){
  const[sector,setSector]=useState("all");
  const[expanded,setExpanded]=useState({});

  const toggle=(billId,sk)=>{
    const key=billId+":"+sk;
    setExpanded(e=>({...e,[key]:!e[key]}));
  };

  const filtered=FINANCE_BILLS.filter(fb=>sector==="all"||fb.sectors.includes(sector));
  const statusOrder=["on_the_floor","passed_house","passed_senate","signed_into_law","in_committee","introduced"];
  const sorted=[...filtered].sort((a,b)=>{
    const ba=bills.find(x=>x.id===a.billId);
    const bb=bills.find(x=>x.id===b.billId);
    return statusOrder.indexOf(ba?.status)-statusOrder.indexOf(bb?.status);
  });

  const stageLabel={introduced:"Introduced",in_committee:"In Committee",on_the_floor:"On Floor",passed_house:"Passed House",passed_senate:"Passed Senate",signed_into_law:"Enacted"};
  const stageCol={introduced:C.textM,in_committee:"#b45309",on_the_floor:"#c41e3a",passed_house:"#1e40af",passed_senate:"#1a4db8",signed_into_law:"#15803d"};

  const magLabel=["","Minor","Moderate","Major"];
  const magCol=["","#b45309","#1e40af","#c41e3a"];

  // Inline sparkline for sector summary cards
  const Spark=({data,col})=>{
    const w=80,h=28,pad=2;
    const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
    const pts=data.map((v,i)=>({x:pad+(i/(data.length-1))*(w-pad*2),y:h-pad-((v-min)/range)*(h-pad*2)}));
    const line=pts.map((p,i)=>(i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`)).join(" ");
    const area=`${line} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`;
    return(
      <svg width={w} height={h} style={{display:"block"}}>
        <defs><linearGradient id={"spk-"+col.replace("#","")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.18"/><stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient></defs>
        <path d={area} fill={`url(#spk-${col.replace("#","")})`}/>
        <path d={line} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2" fill={col}/>
      </svg>
    );
  };

  return(
    <div style={{maxWidth:1000,margin:"0 auto"}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{fontFamily:F.display,fontSize:28,fontWeight:700,color:C.text,letterSpacing:"-0.5px",marginBottom:4}}>Markets & Finance</div>
        <div style={{fontFamily:F.body,fontSize:13,color:C.textM}}>Detailed legislative impact analysis by sector, mechanism, and exposed instruments</div>
      </div>

      {/* Sector summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {SECTOR_SUMMARY.map(s=>{
          const col=s.dir>0?"#15803d":s.dir<0?"#c41e3a":"#b45309";
          const isActive=sector===s.key;
          return(
            <div key={s.key} onClick={()=>setSector(isActive?"all":s.key)}
              style={{background:"#fff",borderRadius:12,padding:"16px",border:"1px solid "+(isActive?C.navy:C.border),cursor:"pointer",transition:"all 0.15s",boxShadow:isActive?"0 4px 16px rgba(15,29,58,0.10)":C.cardShadow,position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{if(!isActive){e.currentTarget.style.borderColor=C.navy+"50";e.currentTarget.style.boxShadow="0 4px 16px rgba(15,29,58,0.07)";}}}
              onMouseLeave={e=>{if(!isActive){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow=C.cardShadow;}}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginBottom:2}}>{s.index}</div>
                  <div style={{fontFamily:F.display,fontSize:16,fontWeight:700,color:C.text,lineHeight:1}}>{s.val}</div>
                </div>
                <Spark data={s.spark} col={col}/>
              </div>
              <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,marginBottom:3}}>{s.label}</div>
              <div style={{fontFamily:F.body,fontSize:10,color:C.textM,lineHeight:1.4}}>{s.note}</div>
            </div>
          );
        })}
      </div>

      {/* Sector filter */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
        {FINANCE_SECTORS.map(s=>(
          <button key={s.key} onClick={()=>setSector(s.key)}
            style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,fontWeight:sector===s.key?600:400,
              color:sector===s.key?"#fff":C.text2,
              background:sector===s.key?C.navy:"#fff",
              border:"1px solid "+(sector===s.key?C.navy:C.border),
              padding:"5px 12px",borderRadius:9999,transition:"all 0.12s"}}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Bill cards */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {sorted.map(fb=>{
          const bill=bills.find(b=>b.id===fb.billId);
          if(!bill)return null;
          const stage=bill.status;
          const visibleSectors=sector==="all"?fb.sectors:fb.sectors.filter(s=>s===sector);
          const isEnacted=stage==="signed_into_law";
          return(
            <div key={fb.billId} style={{background:"#fff",borderRadius:14,border:"1px solid "+C.border,overflow:"hidden",boxShadow:C.cardShadow}}>

              {/* Bill header row */}
              <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 20px 14px",cursor:"pointer",borderBottom:"1px solid "+C.border}}
                onClick={()=>nav("billDetail",bill.id)}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{bill.num}</span>
                    <span style={{width:6,height:6,borderRadius:"50%",background:stageCol[stage]||C.textM,flexShrink:0,display:"inline-block"}}/>
                    <span style={{fontFamily:F.body,fontSize:10,color:stageCol[stage]||C.textM,fontWeight:500}}>{stageLabel[stage]||stage}</span>
                    {!isEnacted&&<span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fb.passProb}% enactment probability</span>}
                  </div>
                  <div style={{fontFamily:F.display,fontSize:15,fontWeight:700,color:C.text,lineHeight:1.3,marginBottom:4}}>{bill.title}</div>
                  <div style={{fontFamily:F.body,fontSize:11,color:C.textM,lineHeight:1.5}}>{bill.sum.split(".")[0]}.</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:4}}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* Sector impact sections */}
              <div>
                {visibleSectors.map((sk,si)=>{
                  const imp=fb.impacts[sk];
                  if(!imp)return null;
                  const col=imp.dir>0?"#15803d":imp.dir<0?"#c41e3a":"#b45309";
                  const secDef=FINANCE_SECTORS.find(s=>s.key===sk);
                  const expandKey=fb.billId+":"+sk;
                  const isExp=expanded[expandKey];
                  return(
                    <div key={sk} style={{borderBottom:si<visibleSectors.length-1?"1px solid "+C.border:"none"}}>
                      {/* Sector row — always visible */}
                      <div style={{display:"grid",gridTemplateColumns:"160px 80px 1fr auto",gap:12,alignItems:"start",padding:"14px 20px",cursor:"pointer"}}
                        onClick={()=>toggle(fb.billId,sk)}>
                        {/* Sector + signal */}
                        <div>
                          <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,marginBottom:3}}>{secDef?.label||sk}</div>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <span style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:col}}>{imp.dir>0?"↑":imp.dir<0?"↓":"→"}</span>
                            <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:col}}>{imp.label}</span>
                          </div>
                        </div>
                        {/* Magnitude */}
                        <div>
                          <div style={{fontFamily:F.body,fontSize:9,color:C.textM,marginBottom:3}}>Impact</div>
                          <div style={{display:"flex",gap:2}}>
                            {[1,2,3].map(n=>(
                              <div key={n} style={{width:14,height:4,borderRadius:2,background:n<=imp.magnitude?magCol[imp.magnitude]:C.bg2}}/>
                            ))}
                          </div>
                          <div style={{fontFamily:F.mono,fontSize:8,color:magCol[imp.magnitude],marginTop:2}}>{magLabel[imp.magnitude]}</div>
                        </div>
                        {/* Mechanism summary */}
                        <div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.5}}>{imp.mechanism}</div>
                        {/* Expand chevron */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:2,transform:isExp?"rotate(180deg)":"rotate(0)",transition:"transform 0.15s"}}><polyline points="6 9 12 15 18 9"/></svg>
                      </div>

                      {/* Expanded detail */}
                      {isExp&&(
                        <div style={{padding:"0 20px 16px",marginTop:-6}}>
                          {/* Tickers */}
                          <div style={{marginBottom:12}}>
                            <div style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:0.6,marginBottom:6}}>Exposed Instruments</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {imp.tickers.map(t=>(
                                <span key={t} style={{fontFamily:F.mono,fontSize:10,fontWeight:700,color:C.text,background:C.bg2,border:"1px solid "+C.border,padding:"3px 8px",borderRadius:6}}>{t}</span>
                              ))}
                            </div>
                          </div>
                          {/* Detail */}
                          <div style={{marginBottom:12}}>
                            <div style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:C.textM,textTransform:"uppercase",letterSpacing:0.6,marginBottom:5}}>Analysis</div>
                            <div style={{fontFamily:F.body,fontSize:12,color:C.text,lineHeight:1.65}}>{imp.detail}</div>
                          </div>
                          {/* Risk */}
                          <div style={{background:"rgba(196,30,58,0.04)",border:"1px solid rgba(196,30,58,0.10)",borderRadius:8,padding:"10px 12px"}}>
                            <div style={{fontFamily:F.body,fontSize:9,fontWeight:600,color:"#c41e3a",textTransform:"uppercase",letterSpacing:0.6,marginBottom:4}}>Key Risk</div>
                            <div style={{fontFamily:F.body,fontSize:11,color:C.text,lineHeight:1.55}}>{imp.risk}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {sorted.length===0&&(
          <div style={{textAlign:"center",padding:"40px 0",fontFamily:F.body,fontSize:13,color:C.textM}}>No bills tracked for this sector.</div>
        )}
      </div>
    </div>
  );
}

function SCOTUSScreen({nav}){
const[filter,setFilter]=useState("All");
const[sel,setSel]=useState(null);
const decided=scotusCases.filter(c=>c.status==="decided").length;
const argued=scotusCases.filter(c=>c.status==="argued").length;
const pending=scotusCases.filter(c=>c.status==="pending").length;
const filtered=filter==="All"?scotusCases:scotusCases.filter(c=>c.status===filter.toLowerCase());
const stColor=s=>s==="decided"?C.success:s==="argued"?C.accent2:C.accent;
const stLabel=s=>s==="decided"?"Decided":s==="argued"?"Argued":"Pending";
const topicCol=t=>TOPIC_COL_SC[t]||C.accent2;

if(sel){const c=scotusCases.find(x=>x.id===sel);if(!c)return null;
  return <SCOTUSCaseDetail c={c} onBack={()=>setSel(null)}/>;
}

return(
<div>
  {/* Court composition arc */}
  <JusticeArc/>

  {/* Term at a glance stats */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
    {[
      {label:"Decided",n:decided,col:C.success,icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>},
      {label:"Argued",n:argued,col:C.accent2,icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
      {label:"Pending",n:pending,col:C.accent,icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>},
    ].map(({label,n,col,icon})=>(
      <div key={label} onClick={()=>setFilter(label==="Pending"?"Pending":label)} style={{cursor:"pointer",background:C.card,borderRadius:14,padding:"14px 16px",border:"1px solid "+(filter===label||filter===(label==="Pending"?"Pending":label)?col+"50":C.border),transition:"all 0.15s",boxShadow:filter===label?"0 0 0 2px "+col+"20":"none"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=col+"60";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=filter===label?col+"50":C.border;}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,color:col}}>{icon}<span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:col}}>{label}</span></div>
        <div style={{fontFamily:"'Bebas Neue',serif",fontSize:36,color:col,lineHeight:1,letterSpacing:1}}>{n}</div>
        <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:4,fontWeight:300}}>cases this term</div>
      </div>
    ))}
  </div>

  {/* Filter strip */}
  <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:2}} className="civly-scroll">
    {["All","Decided","Argued","Pending"].map(s=>{
      const isA=filter===s;
      return(
        <button key={s} onClick={()=>setFilter(s)}
          style={{all:"unset",cursor:"pointer",padding:"6px 16px",fontFamily:F.body,fontSize:12,fontWeight:isA?500:300,borderRadius:9999,background:isA?C.navy:C.bg2,color:isA?C.textW:C.text2,border:"1px solid "+(isA?C.navy:C.border),transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0}}>
          {s}
        </button>
      );
    })}
  </div>

  {/* Case list */}
  {filtered.length===0&&<div style={{textAlign:"center",color:C.textM,padding:40,fontSize:12,fontFamily:F.body,background:C.card,borderRadius:14,border:"1px solid "+C.border}}>No cases match</div>}
  <div style={{display:"flex",flexDirection:"column",gap:10}}>
  {filtered.map(c=>{
    const stCol=stColor(c.status);
    const tCol=topicCol(c.topic);
    const isDecided=c.status==="decided";
    const isNarrow=c.majority.length===5&&c.dissent.length===4;
    const isUnanimous=isDecided&&c.dissent.length===0;
    const isHighImpact=c.impact==="High";
    return(
      <div key={c.id} onClick={()=>setSel(c.id)}
        style={{cursor:"pointer",background:C.card,borderRadius:16,border:"1px solid "+C.border,overflow:"hidden",transition:"all 0.18s"}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.cardShadowHover;e.currentTarget.style.borderColor=stCol+"50";e.currentTarget.style.transform="translateY(-2px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";}}>
        <div style={{padding:"14px 16px"}}>
          {/* Top row */}
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:stCol,background:stCol+"14",padding:"2px 8px",borderRadius:9999,letterSpacing:0.8,textTransform:"uppercase"}}>{c.status}</span>
            <span style={{fontFamily:F.mono,fontSize:8,color:C.textM}}>No. {c.docket}</span>
            {isHighImpact&&<span style={{fontFamily:F.mono,fontSize:7,fontWeight:700,color:"#fff",background:C.accent,padding:"1px 7px",borderRadius:9999,letterSpacing:0.8}}>HIGH IMPACT</span>}
            {isNarrow&&<span style={{fontFamily:F.mono,fontSize:7,fontWeight:700,color:C.error,background:C.error+"12",padding:"1px 7px",borderRadius:9999,border:"1px solid "+C.error+"30"}}>5–4</span>}
            {isUnanimous&&<span style={{fontFamily:F.mono,fontSize:7,fontWeight:700,color:C.success,background:C.success+"12",padding:"1px 7px",borderRadius:9999,border:"1px solid "+C.success+"30"}}>9–0 UNANIMOUS</span>}
            <span style={{marginLeft:"auto",fontFamily:F.mono,fontSize:9,color:C.textM}}>{fS(c.decided||c.arg)}</span>
          </div>
          {/* Case name */}
          <div style={{fontFamily:"'Bebas Neue',serif",fontSize:18,color:C.text,lineHeight:1.2,marginBottom:6,letterSpacing:0.5}}>{c.name}</div>
          {/* Question preview */}
          <div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",fontWeight:300,fontStyle:"italic",marginBottom:10}}>"{c.question}"</div>
          {/* Bottom row */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:F.body,fontSize:10,fontWeight:300,color:"#fff",background:tCol,padding:"2px 9px",borderRadius:9999}}>{c.topic}</span>
            {isDecided&&c.majority.length>0&&(
              <div style={{flex:1,maxWidth:140}}>
                <VoteSplit majority={c.majority} dissent={c.dissent}/>
              </div>
            )}
            {!isDecided&&c.arg&&<ScotusArgCountdown argDate={c.arg}/>}
            <span style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:3,fontFamily:F.body,fontSize:10,color:C.navy,fontWeight:400}}>
              View case <ChevronRight size={12} color={C.navy} strokeWidth={2}/>
            </span>
          </div>
        </div>
      </div>
    );
  })}
  </div>
</div>
);
}

function BillsScreen({nav,wb,toggleB}){
  const STAGE_FILTERS=[
    {key:"all",label:"All Stages",col:C.navy},
    {key:"introduced",label:"Introduced",col:"#7c3aed"},
    {key:"in_committee",label:"In Committee",col:"#d97706"},
    {key:"on_the_floor",label:"On the Floor",col:"#1e40af"},
    {key:"passed_house",label:"Passed House",col:"#1e40af"},
    {key:"passed_senate",label:"Passed Senate",col:"#1e40af"},
    {key:"signed_into_law",label:"Signed into Law",col:"#2d6a4f"},
    {key:"failed",label:"Failed / Vetoed",col:"#8b2e2e"},
  ];
  const PARTY_OPTS=[
    {key:"all",label:"All Parties",col:C.navy},
    {key:"Republican",label:"Republican",short:"R",col:"#8b2e2e"},
    {key:"Democrat",label:"Democrat",short:"D",col:"#1e40af"},
    {key:"Independent",label:"Independent",short:"I",col:"#7c3aed"},
  ];
  const topicKWLocal={"Gov. Shutdown / DHS":["shutdown","dhs","homeland","spending","continuing"],"Tax Cuts & TCJA":["tax","tcja","reconciliation","cuts","deduction","salt"],"Border Security":["border","dhs","immigration","ice","enforcement","alien"],"Critical Minerals & AI":["mineral","ai","artificial","tech","data","chip","critical"],"Voter Eligibility":["voter","vote","election","citizen","registration","save act"],"Healthcare & Fentanyl":["health","medicare","medicaid","fentanyl","opioid","drug","prescription"],"Energy Regulation":["energy","coal","oil","gas","pipeline","regulation","offshore"],"Defense & ICC":["defense","military","ndaa","icc","ukraine","nato","armed"]};

  const[q,setQ]=useState("");
  const[stageFilter,setStageFilter]=useState("all");
  const[partyFilter,setPartyFilter]=useState("all");
  const[topicFilter,setTopicFilter]=useState("All");
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[dateField,setDateField]=useState("intro");
  const[sort,setSort]=useState("recent");

  const clearAll=()=>{setQ("");setStageFilter("all");setPartyFilter("all");setTopicFilter("All");setDateFrom("");setDateTo("");};

  const activeFilters=[stageFilter!=="all",partyFilter!=="all",topicFilter!=="All",!!dateFrom||!!dateTo,!!q].filter(Boolean).length;

  let filtered=bills.filter(b=>{
    const sp=getSp(b);
    const stageOk=stageFilter==="all"||(b.status===stageFilter||(stageFilter==="failed"&&(b.status==="failed"||b.status==="vetoed")));
    const partyOk=partyFilter==="all"||sp?.party===partyFilter;
    const qOk=!q||b.title.toLowerCase().includes(q.toLowerCase())||b.num.toLowerCase().includes(q.toLowerCase());
    let topicOk=topicFilter==="All";
    if(!topicOk){const kws=topicKWLocal[topicFilter]||[];topicOk=kws.some(kw=>(b.title+b.sum+b.cat).toLowerCase().includes(kw));}
    const dateVal=b[dateField]||b.intro||b.last;
    const fromOk=!dateFrom||!dateVal||(new Date(dateVal+"T12:00:00")>=new Date(dateFrom));
    const toOk=!dateTo||!dateVal||(new Date(dateVal+"T12:00:00")<=new Date(dateTo));
    return stageOk&&partyOk&&qOk&&topicOk&&fromOk&&toOk;
  });
  filtered=[...filtered].sort((a,b_)=>{
    if(sort==="recent")return new Date(b_.last||b_.intro||0)-new Date(a.last||a.intro||0);
    if(sort==="alpha")return a.title.localeCompare(b_.title);
    if(sort==="status"){const O={signed_into_law:0,passed_senate:1,passed_house:2,on_the_floor:3,in_committee:4,introduced:5,failed:6,vetoed:7};return(O[a.status]||9)-(O[b_.status]||9);}
    return 0;
  });

  const fLabel=style=>({fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:8,...style});
  const inputStyle={fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text,background:C.bg2,border:"1px solid "+C.border,borderRadius:8,padding:"6px 10px",outline:"none",width:"100%",boxSizing:"border-box",transition:"border-color 0.15s"};

  return(
    <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>

      {/* ── LEFT FILTER PANEL ── */}
      <div style={{width:230,flexShrink:0,position:"sticky",top:20}}>
        <div style={{background:C.card,borderRadius:18,border:"1px solid rgba(221,226,237,0.7)",padding:"18px 16px",boxShadow:C.cardShadow}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <Icon name="filter" size={13} color={C.text2}/>
              <span style={{fontFamily:F.body,fontSize:13,fontWeight:400,color:C.text}}>Filters</span>
              {activeFilters>0&&<span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:"#fff",background:C.accent,padding:"1px 7px",borderRadius:9999}}>{activeFilters}</span>}
            </div>
            {activeFilters>0&&<button onClick={clearAll} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,color:"#8b2e2e",fontWeight:300}}>Clear all</button>}
          </div>

          {/* Stage */}
          <div style={{marginBottom:16}}>
            <div style={fLabel({})}>Stage</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {STAGE_FILTERS.map(sf=>{
                const isA=stageFilter===sf.key;
                return(
                  <button key={sf.key} onClick={()=>setStageFilter(sf.key)} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:isA?sf.col+"12":"transparent",transition:"background 0.12s"}}
                    onMouseEnter={e=>{if(!isA)e.currentTarget.style.background=C.bg2;}}
                    onMouseLeave={e=>{if(!isA)e.currentTarget.style.background="transparent";}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:isA?sf.col:C.border,flexShrink:0,transition:"background 0.12s"}}/>
                    <span style={{fontFamily:F.body,fontSize:12,fontWeight:isA?400:300,color:isA?sf.col:C.text2}}>{sf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{borderTop:"1px solid "+C.border,margin:"14px 0"}}/>

          {/* Party */}
          <div style={{marginBottom:16}}>
            <div style={fLabel({})}>Party</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {PARTY_OPTS.map(p=>{
                const isA=partyFilter===p.key;
                return(
                  <button key={p.key} onClick={()=>setPartyFilter(p.key)} style={{all:"unset",cursor:"pointer",padding:"5px 11px",borderRadius:9999,fontFamily:F.body,fontSize:11,fontWeight:isA?400:300,background:isA?p.col:"transparent",color:isA?"#fff":C.text2,border:"1px solid "+(isA?p.col:C.border),transition:"all 0.15s"}}>
                    {p.key==="all"?p.label:<><span style={{fontFamily:F.mono,fontWeight:600}}>{p.short}</span> {p.label}</>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{borderTop:"1px solid "+C.border,margin:"14px 0"}}/>

          {/* Date Range */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div style={fLabel({marginBottom:0})}>Date Range</div>
              <div style={{display:"flex",gap:0,background:C.bg2,borderRadius:6,border:"1px solid "+C.border,overflow:"hidden"}}>
                {[["intro","Introduced"],["last","Last Action"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setDateField(k)} style={{all:"unset",cursor:"pointer",fontFamily:F.mono,fontSize:8,padding:"3px 7px",background:dateField===k?C.navy:"transparent",color:dateField===k?"#fff":C.textM,letterSpacing:0.5,transition:"all 0.12s"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div>
                <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.5,marginBottom:3}}>FROM</div>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
              <div>
                <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.5,marginBottom:3}}>TO</div>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor=C.navy} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            </div>
          </div>

          <div style={{borderTop:"1px solid "+C.border,margin:"14px 0"}}/>

          {/* Topic */}
          <div>
            <div style={fLabel({})}>Topic</div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {["All",...trending.map(t=>t.name)].map(name=>{
                const isA=topicFilter===name;
                const col=TOPIC_DOT_COLORS_MAP[name]||"#4285F4";
                return(
                  <button key={name} onClick={()=>setTopicFilter(name)} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:isA?col+"12":"transparent",transition:"background 0.12s"}}
                    onMouseEnter={e=>{if(!isA)e.currentTarget.style.background=C.bg2;}}
                    onMouseLeave={e=>{if(!isA)e.currentTarget.style.background="transparent";}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:isA?col:C.border,flexShrink:0}}/>
                    <span style={{fontFamily:F.body,fontSize:12,fontWeight:isA?400:300,color:isA?col:C.text2,flex:1}}>{name==="All"?"All Topics":name}</span>
                    {name!=="All"&&<span style={{fontFamily:F.mono,fontSize:9,color:isA?col:C.textM}}>{trending.find(t=>t.name===name)?.count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── RIGHT CONTENT ── */}
      <div style={{flex:1,minWidth:0}}>

        {/* Top bar: title + search + sort */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}>
            <div style={{fontFamily:F.display,fontSize:22,fontWeight:700,color:C.text,letterSpacing:"-0.5px"}}>All Bills</div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.textM,marginTop:1,letterSpacing:0.8,textTransform:"uppercase"}}>{filtered.length} of {bills.length} · 119th Congress</div>
          </div>
          <div style={{position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Icon name="search" size={14} color={C.textM}/></div>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bills…"
              style={{width:200,background:C.bg2,border:"1.5px solid transparent",borderRadius:24,padding:"7px 36px 7px 34px",fontSize:12,fontFamily:F.body,fontWeight:300,color:C.text,outline:"none",transition:"all 0.2s"}}
              onFocus={e=>{e.target.style.background="#fff";e.target.style.borderColor=C.navy;e.target.style.boxShadow="0 0 0 3px rgba(26,39,68,0.09)"}}
              onBlur={e=>{e.target.style.background=C.bg2;e.target.style.borderColor="transparent";e.target.style.boxShadow="none"}}/>
            {q&&<button onClick={()=>setQ("")} style={{all:"unset",cursor:"pointer",position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:C.textM,fontSize:14,lineHeight:1}}>✕</button>}
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center",background:C.bg2,borderRadius:8,padding:3,border:"1px solid "+C.border}}>
            {[["recent","Recent"],["alpha","A–Z"],["status","Status"]].map(([k,l])=>(
              <button key={k} onClick={()=>setSort(k)} style={{all:"unset",cursor:"pointer",fontFamily:F.body,fontSize:11,padding:"4px 10px",borderRadius:6,background:sort===k?"#fff":"transparent",color:sort===k?C.text:C.text2,fontWeight:sort===k?400:300,boxShadow:sort===k?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all 0.12s"}}>{l}</button>
            ))}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
            {stageFilter!=="all"&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,fontWeight:300,background:C.bg2,border:"1px solid "+C.border,borderRadius:9999,padding:"3px 10px",color:C.text2}}>
              Stage: {STAGE_FILTERS.find(s=>s.key===stageFilter)?.label}
              <button onClick={()=>setStageFilter("all")} style={{all:"unset",cursor:"pointer",color:C.textM,fontSize:12,lineHeight:1}}>✕</button>
            </span>}
            {partyFilter!=="all"&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,fontWeight:300,background:C.bg2,border:"1px solid "+C.border,borderRadius:9999,padding:"3px 10px",color:C.text2}}>
              Party: {PARTY_OPTS.find(p=>p.key===partyFilter)?.label}
              <button onClick={()=>setPartyFilter("all")} style={{all:"unset",cursor:"pointer",color:C.textM,fontSize:12,lineHeight:1}}>✕</button>
            </span>}
            {topicFilter!=="All"&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,fontWeight:300,background:C.bg2,border:"1px solid "+C.border,borderRadius:9999,padding:"3px 10px",color:C.text2}}>
              Topic: {topicFilter}
              <button onClick={()=>setTopicFilter("All")} style={{all:"unset",cursor:"pointer",color:C.textM,fontSize:12,lineHeight:1}}>✕</button>
            </span>}
            {(dateFrom||dateTo)&&<span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:11,fontWeight:300,background:C.bg2,border:"1px solid "+C.border,borderRadius:9999,padding:"3px 10px",color:C.text2}}>
              {dateField==="intro"?"Introduced":"Last action"}: {dateFrom||"…"} – {dateTo||"…"}
              <button onClick={()=>{setDateFrom("");setDateTo("");}} style={{all:"unset",cursor:"pointer",color:C.textM,fontSize:12,lineHeight:1}}>✕</button>
            </span>}
          </div>
        )}

        {/* Bill list */}
        {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:C.textM,fontFamily:F.body,fontSize:13,background:C.card,borderRadius:14,border:"1px solid "+C.border}}>
          No bills match your filters. <button onClick={clearAll} style={{all:"unset",cursor:"pointer",color:C.navy,fontWeight:500}}>Clear all filters</button>
        </div>}
        {(()=>{
          const[expandedId,setExpandedId]=useState(null);
          return(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(bill=>{
              const sp=getSp(bill);
              const isW=wb?.includes(bill.id);
              const partyCol=sp?.party==="Republican"?"#8b2e2e":sp?.party==="Democrat"?"#1e40af":"#7c3aed";
              const isExpanded=expandedId===bill.id;
              return(
                <div key={bill.id}
                  style={{background:C.card,borderRadius:16,border:"1px solid "+(isExpanded?"rgba(26,77,184,0.25)":"rgba(221,226,237,0.7)"),boxShadow:isExpanded?C.cardShadowHover:C.cardShadow,transition:"box-shadow 0.22s cubic-bezier(0.22,1,0.36,1),transform 0.22s cubic-bezier(0.22,1,0.36,1),border-color 0.18s",transform:isExpanded?"translateY(-2px)":"translateY(0)"}}
                  onMouseEnter={e=>{if(!isExpanded){e.currentTarget.style.boxShadow=C.cardShadowHover;e.currentTarget.style.borderColor="rgba(26,77,184,0.2)";e.currentTarget.style.transform="translateY(-1px)";}}}
                  onMouseLeave={e=>{if(!isExpanded){e.currentTarget.style.boxShadow=C.cardShadow;e.currentTarget.style.borderColor="rgba(221,226,237,0.7)";e.currentTarget.style.transform="translateY(0)";}}}
                >
                  {/* Main row — click to expand */}
                  <div onClick={()=>setExpandedId(isExpanded?null:bill.id)} style={{cursor:"pointer",padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{paddingTop:2,flexShrink:0}}><StatusBadge status={bill.status}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:5}}>
                        <div style={{fontFamily:F.display,fontSize:15,fontWeight:600,color:C.text,lineHeight:1.35,letterSpacing:"-0.2px"}}>{bill.title}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                          <button onClick={e=>{e.stopPropagation();toggleB&&toggleB(bill.id);}} style={{all:"unset",cursor:"pointer"}}>
                            <SaveBtn active={isW} size={15}/>
                          </button>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:0.4}}>{bill.num}</span>
                        <span style={{fontFamily:F.body,fontSize:11,color:C.text2,background:C.bg2,padding:"1px 8px",borderRadius:9999}}>{bill.cat}</span>
                        {sp&&<div style={{display:"flex",alignItems:"center",gap:5,background:partyCol+"10",borderRadius:9999,padding:"2px 8px"}}>
                          <div style={{width:5,height:5,borderRadius:"50%",background:partyCol,flexShrink:0}}/>
                          <span style={{fontFamily:F.body,fontSize:11,color:partyCol,fontWeight:400}}>{sp.party[0]} · {sp.name.split(" ").pop()} · {sp.state}</span>
                        </div>}
                        {bill.last&&<span style={{fontFamily:F.mono,fontSize:9,color:C.textM,letterSpacing:0.3}}>Updated: {new Date(bill.last+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>}
                      </div>
                      <BillStageBar status={bill.status}/>
                      {BILL_VOTE_URGENCY[bill.id]&&(()=>{const u=BILL_VOTE_URGENCY[bill.id];const isDeadline=u.type==="deadline";return(<div style={{marginTop:8,display:"flex",alignItems:"center",gap:7,padding:"5px 10px",borderRadius:8,background:isDeadline?"rgba(196,30,58,0.06)":"rgba(26,106,79,0.06)",border:"1px solid "+(isDeadline?"rgba(196,30,58,0.2)":"rgba(26,106,79,0.2)")}}><span style={{width:5,height:5,borderRadius:"50%",background:isDeadline?C.error:C.success,display:"inline-block",flexShrink:0,animation:"civlyDotBounce 1.6s ease-in-out infinite"}}/><span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:isDeadline?C.error:C.success,letterSpacing:1,textTransform:"uppercase"}}>{isDeadline?"DEADLINE":"VOTE SOON"}</span><span style={{fontFamily:F.body,fontSize:10,color:C.text2,fontWeight:300,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.title}</span><CountdownTimer targetDate={u.date} inline/></div>);})()}
                    </div>
                  </div>
                  {/* Expanded preview */}
                  {isExpanded&&<div style={{padding:"0 16px 14px 16px",animation:"civlyExpandIn 0.22s cubic-bezier(0.22,1,0.36,1) both",borderTop:"1px solid rgba(221,226,237,0.6)"}}>
                    <div style={{paddingTop:12}}>
                      <div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.65,marginBottom:12,fontWeight:300}}>{bill.sum}</div>
                      {bill.votes?.house&&(()=>{const{yea,nay}=bill.votes.house;const pct=Math.round(yea/(yea+nay)*100);return(
                        <div style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.success}}>YEA {yea}</span><span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.error}}>NAY {nay}</span></div>
                          <div style={{height:5,background:C.error+"20",borderRadius:3,overflow:"hidden"}}><div style={{"--fill-w":pct+"%",width:"var(--fill-w)",height:"100%",background:C.success,borderRadius:3,animation:"civlyBarFill 0.6s ease forwards"}}/></div>
                        </div>
                      );})()}
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={e=>{e.stopPropagation();nav("billDetail",bill.id);}} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:12,fontWeight:500,color:C.accent2,background:C.accent2+"10",border:"1px solid "+C.accent2+"30",padding:"6px 14px",borderRadius:9999,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.accent2+"18"} onMouseLeave={e=>e.currentTarget.style.background=C.accent2+"10"}>
                          Full details
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                        {sp&&<button onClick={e=>{e.stopPropagation();nav("memberProfile",sp.id);}} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,fontFamily:F.body,fontSize:12,fontWeight:300,color:C.text2,background:C.bg2,border:"1px solid "+C.border,padding:"6px 14px",borderRadius:9999}}>
                          <Avatar bio={sp.bio} name={sp.name} size={14}/>{sp.name.split(" ").pop()}
                        </button>}
                      </div>
                    </div>
                  </div>}
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

    </div>
  );
}

function BillDetailScreen({billId,nav,wb,toggleB,newsOutlet}){
const bill=bills.find(b=>b.id===billId);if(!bill)return <div style={{padding:20,fontFamily:F.body,color:C.textM}}>Bill not found</div>;
const sp=getSp(bill);const co=getCo(bill);
const[detailTab,setDetailTab]=useState("overview");
const[expandedVote,setExpandedVote]=useState(null);
const toggleVote=chamber=>{setExpandedVote(v=>v===chamber?null:chamber);};
const bInf=INFLUENCE.bills[bill.id];const spInf=sp?INFLUENCE.members[sp.id]:null;
const related=bills.filter(b=>b.id!==bill.id&&b.cat===bill.cat).slice(0,3);
const daysIn=bill.intro?Math.floor((new Date()-new Date(bill.intro+"T12:00:00"))/(1000*60*60*24)):null;
const econ=ECONOMIC_DATA[bill.id];
const allNews=BILL_NEWS[bill.id]||[];
const filteredNews=newsOutlet?allNews.filter(n=>n.source===newsOutlet):allNews;
const hasVotes=bill.votes&&(bill.votes.house||bill.votes.senate);
const recentUpdates=billUpdates.filter(u=>u.billId===bill.id);

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
const statusCol=SC[bill.status]||C.accent2;

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

const tabs=[
  {key:"overview",label:"Overview"},
  ...(hasVotes?[{key:"votes",label:"Votes"}]:[]),
  ...(econ?[{key:"economic",label:"Economic"}]:[]),
  ...(allNews.length>0?[{key:"news",label:"News"}]:[]),
];

// ── HERO ──
const Hero=()=>(
  <div style={{background:"linear-gradient(160deg,#0c1628 0%,#132040 60%,#1a3060 100%)",borderRadius:24,padding:"24px 24px 20px",marginBottom:20,position:"relative",overflow:"hidden",boxShadow:"0 8px 40px rgba(10,20,50,0.25)"}}>
    {/* Subtle glow orbs */}
    <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,"+statusCol+"18 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div style={{position:"absolute",bottom:-20,left:-20,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,255,255,0.03) 0%,transparent 70%)",pointerEvents:"none"}}/>

    {/* Top row: number + actions */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:F.mono,fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.07)",padding:"3px 10px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.1)",letterSpacing:0.5}}>{bill.num}</span>
        {bill.cat&&<span style={{fontFamily:F.body,fontSize:10,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.05)",padding:"3px 9px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.08)"}}>{bill.cat}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <PinButton type="bill" config={{billId:bill.id,name:bill.title}}/>
        <SaveBtn active={wb.includes(bill.id)} onToggle={()=>toggleB(bill.id)} size={18} light/>
      </div>
    </div>

    {/* Status badge */}
    <div style={{marginBottom:10}}>
      <StatusBadge status={bill.status} light/>
    </div>

    {/* Title */}
    <div style={{fontFamily:F.display,fontSize:22,color:"#ffffff",lineHeight:1.3,fontWeight:600,letterSpacing:"-0.4px",marginBottom:16,maxWidth:640}}>{bill.title}</div>

    {/* Pipeline — flat: nodes + connectors as siblings */}
    <div style={{display:"flex",alignItems:"center",marginBottom:18}}>
      {pipe.map((s,i)=>{
        const done=pipeIdx>=i;const active=bill.status===s.key;
        const lineCol=done&&pipeIdx>i?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.12)";
        return(
          <React.Fragment key={s.key}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0,width:46}}>
              <div style={{width:active?26:18,height:active?26:18,borderRadius:"50%",background:active?statusCol:done?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.07)",border:"2px solid "+(done||active?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.12)"),display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.25s",flexShrink:0,boxShadow:active?"0 0 0 4px "+statusCol+"30":"none"}}>
                {done&&!active&&<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {active&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff",boxShadow:"0 0 6px rgba(255,255,255,0.8)"}}/>}
              </div>
              <span style={{fontFamily:F.mono,fontSize:7,color:active?"rgba(255,255,255,0.95)":done?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.25)",fontWeight:active?700:400,textAlign:"center",whiteSpace:"nowrap",letterSpacing:0.3}}>{s.short}</span>
            </div>
            {i<pipe.length-1&&<div style={{flex:1,height:1.5,background:lineCol,minWidth:8,marginBottom:14,borderRadius:1}}/>}
          </React.Fragment>
        );
      })}
    </div>

    {/* Sponsor row */}
    {sp&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
      <div onClick={()=>nav("memberProfile",sp.id)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9,padding:"6px 10px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",transition:"background 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
        <Avatar bio={sp.bio} name={sp.name} size={28}/>
        <div>
          <div style={{fontFamily:F.body,color:"rgba(255,255,255,0.9)",fontSize:12,fontWeight:500}}>{sp.pre} {sp.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:1}}><PD party={sp.party} size={5}/><span style={{color:"rgba(255,255,255,0.45)",fontSize:10,fontFamily:F.body}}>{sp.party} · {sp.state}</span></div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        {daysIn!==null&&<span style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.06)",padding:"3px 9px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.08)"}}>{daysIn}d active</span>}
        {co.length>0&&<span style={{fontFamily:F.mono,fontSize:9,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.06)",padding:"3px 9px",borderRadius:9999,border:"1px solid rgba(255,255,255,0.08)"}}>{co.length} co-sponsor{co.length!==1?"s":""}</span>}
        {bInf&&<span style={{fontFamily:F.mono,fontSize:9,color:"#fbbf24",background:"rgba(251,191,36,0.1)",padding:"3px 9px",borderRadius:9999,border:"1px solid rgba(251,191,36,0.2)"}}>{fMoney(bInf.totalLobby)} lobbied</span>}
      </div>
    </div>}
  </div>
);

// ── TAB STRIP ──
const TabStrip=()=>(
  <div style={{display:"flex",gap:2,marginBottom:20,background:C.bg2,borderRadius:12,padding:3,border:"1px solid rgba(221,226,237,0.6)"}}>
    {tabs.map(t=>{
      const isA=detailTab===t.key;
      return(<button key={t.key} onClick={()=>setDetailTab(t.key)} style={{all:"unset",cursor:"pointer",flex:1,textAlign:"center",padding:"7px 12px",borderRadius:9,background:isA?C.card:"transparent",color:isA?C.text:C.textM,fontFamily:F.body,fontSize:12,fontWeight:isA?500:400,boxShadow:isA?C.cardShadow:"none",transition:"all 0.18s"}}>{t.label}</button>);
    })}
  </div>
);

// ── SIDEBAR ──
const Sidebar=()=>(
  <div style={{display:"flex",flexDirection:"column",gap:12}}>
    {/* What happens next */}
    {NEXT_COPY[bill.status]&&<div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:statusCol,animation:"civlyDotBounce 1.8s ease-in-out infinite"}}/>
        <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:statusCol,letterSpacing:1,textTransform:"uppercase"}}>What's Next</span>
      </div>
      <div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.65}}>{NEXT_COPY[bill.status]}</div>
    </div>}

    {/* Co-sponsors */}
    {co.length>0&&<div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Co-Sponsors ({co.length})</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {co.map(m=>{const coInf=INFLUENCE.members[m.id];return(
          <div key={m.id} onClick={()=>nav("memberProfile",m.id)} style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            <Avatar bio={m.bio} name={m.name} size={30}/>
            <span style={{fontFamily:F.body,color:C.text2,fontSize:8,textAlign:"center"}}>{m.name.split(" ").pop()}</span>
          </div>
        );})}
      </div>
      {bInf&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border,display:"flex",gap:4,flexWrap:"wrap"}}>
        {[...new Set(co.slice(0,3).flatMap(m=>INFLUENCE.members[m.id]?.topIndustries.slice(0,1)||[]).map(i=>i.name))].slice(0,2).map((name,i)=>{const ind=Object.values(INFLUENCE.members).flatMap(m=>m.topIndustries).find(x=>x.name===name);return ind?<DonorIndustryChip key={i} name={name} color={ind.color}/>:null;})}
      </div>}
    </div>}

    {/* Recent updates */}
    {recentUpdates.length>0&&<div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Recent Updates</div>
      {recentUpdates.map((u,i)=>(
        <div key={i} style={{paddingBottom:i<recentUpdates.length-1?10:0,marginBottom:i<recentUpdates.length-1?10:0,borderBottom:i<recentUpdates.length-1?"1px solid "+C.border:"none"}}>
          <div style={{fontFamily:F.body,color:C.text,fontSize:11,fontWeight:500,marginBottom:2}}>{u.title}</div>
          <div style={{fontFamily:F.body,color:C.text2,fontSize:10,fontWeight:300,lineHeight:1.5}}>{u.desc}</div>
          <div style={{fontFamily:F.mono,color:C.textM,fontSize:8,marginTop:3}}>{u.date}</div>
        </div>
      ))}
    </div>}

    {/* Related bills */}
    {related.length>0&&<div style={{background:C.card,borderRadius:16,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
      <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Related · {bill.cat}</div>
      {related.map(b=><BillCard key={b.id} bill={b} onPress={()=>nav("billDetail",b.id)} watched={wb.includes(b.id)} onToggle={toggleB} nav={nav} compact/>)}
    </div>}
  </div>
);

return(
<div>
  <VoteCountdownBanner billId={bill.id}/>
  <Hero/>
  <TabStrip/>

  {/* Two-column layout */}
  <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>

    {/* ── MAIN CONTENT ── */}
    <div style={{flex:1,minWidth:0}}>

      {/* OVERVIEW TAB */}
      {detailTab==="overview"&&<div style={{animation:"civlyFadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both"}}>
        {/* Summary */}
        <div style={{background:C.card,borderRadius:16,padding:"18px 20px",marginBottom:14,border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Summary</div>
          <div style={{fontFamily:F.body,color:C.text2,fontSize:13,lineHeight:1.7,fontWeight:300}}>{bill.sum}</div>
        </div>

        {/* Key Provisions */}
        {bill.keyProv&&<div style={{background:C.card,borderRadius:16,padding:"18px 20px",marginBottom:14,border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Key Provisions</div>
          {bill.keyProv.map((p,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"9px 0",borderBottom:i<bill.keyProv.length-1?"1px solid "+C.border:"none",alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:statusCol+"12",border:"1px solid "+statusCol+"30",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:statusCol}}>{i+1}</span>
              </div>
              <span style={{fontFamily:F.body,color:C.text,fontSize:12,fontWeight:300,lineHeight:1.6}}>{p}</span>
            </div>
          ))}
        </div>}

        {/* Lobbying snapshot */}
        <BillMoneySnapshot billId={bill.id}/>

        {/* Timeline */}
        {bill.tl&&<div style={{background:C.card,borderRadius:16,padding:"18px 20px",marginBottom:14,border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Timeline</div>
          {bill.tl.map((t,i)=>{
            const spike=bInf?.spikes?.find(s=>s.step===i);
            const isCurrent=t.cur;
            return(<div key={i}>
              <div style={{display:"flex",gap:12,marginBottom:10}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:16}}>
                  <div style={{width:isCurrent?12:8,height:isCurrent?12:8,borderRadius:"50%",background:t.done?SC[t.s]||statusCol:C.bg2,border:t.done?"none":"2px solid "+C.border,flexShrink:0,boxShadow:isCurrent?"0 0 0 3px "+(SC[t.s]||statusCol)+"25":"none",transition:"all 0.2s"}}/>
                  {(i<bill.tl.length-1||spike)&&<div style={{width:1.5,flex:1,background:C.border,marginTop:3}}/>}
                </div>
                <div style={{flex:1,paddingBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontFamily:F.body,color:isCurrent?C.accent2:C.text,fontSize:12,fontWeight:isCurrent?500:400,lineHeight:1.4}}>{t.desc}</span>
                    {isCurrent&&<span style={{fontFamily:F.mono,fontSize:7,color:"#fff",background:C.accent2,padding:"1px 7px",borderRadius:9999,flexShrink:0}}>NOW</span>}
                  </div>
                  <div style={{fontFamily:F.mono,color:C.textM,fontSize:9,marginTop:3}}>{fD(t.d)}</div>
                </div>
              </div>
              {spike&&<LobbyingSpikeMarker spike={spike}/>}
            </div>);
          })}
        </div>}
      </div>}

      {/* VOTES TAB */}
      {detailTab==="votes"&&<div style={{animation:"civlyFadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both"}}>
        <div style={{background:C.card,borderRadius:16,padding:"18px 20px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Vote Tally <span style={{fontFamily:F.body,fontSize:10,fontWeight:400,color:C.textM,textTransform:"none",letterSpacing:0}}>· click to expand</span></div>
          {bill.votes?.house&&<><VoteBar label="House" yea={bill.votes.house.yea} nay={bill.votes.house.nay} abstain={bill.votes.house.abstain} onClick={()=>toggleVote("house")} expanded={expandedVote==="house"} breakCount={(bill.votes.house.dBreak||[]).length+(bill.votes.house.rBreak||[]).length}/>{expandedVote==="house"&&<VoteBreakdown bill={bill} voteData={bill.votes.house} chamber="House" nav={nav}/>}</>}
          {bill.votes?.senate&&<><VoteBar label="Senate" yea={bill.votes.senate.yea} nay={bill.votes.senate.nay} abstain={bill.votes.senate.abstain} onClick={()=>toggleVote("senate")} expanded={expandedVote==="senate"} breakCount={(bill.votes.senate.dBreak||[]).length+(bill.votes.senate.rBreak||[]).length}/>{expandedVote==="senate"&&<VoteBreakdown bill={bill} voteData={bill.votes.senate} chamber="Senate" nav={nav}/>}</>}
        </div>
      </div>}

      {/* ECONOMIC TAB */}
      {detailTab==="economic"&&econ&&<div style={{animation:"civlyFadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both"}}>
        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
          {[{label:"Total Cost",value:econ.totalCost,sub:econ.costPeriod,col:"#1e40af"},{label:"CBO Score",value:null,sub:econ.cboScore,col:"#8b2e2e"},{label:"GDP Impact",value:null,sub:econ.gdpImpact,col:"#2d6a4f"}].map(({label,value,sub,col})=>(
            <div key={label} style={{background:C.card,borderRadius:14,padding:"14px 16px",border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
              <div style={{fontFamily:F.mono,fontSize:8,color:col,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{label}</div>
              {value&&<div style={{fontFamily:F.display,fontSize:18,fontWeight:600,color:C.text,letterSpacing:"-0.3px",marginBottom:2}}>{value}</div>}
              <div style={{fontFamily:F.body,fontSize:11,color:C.text2,fontWeight:300,lineHeight:1.4}}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Funding sources */}
        <div style={{background:C.card,borderRadius:16,padding:"18px 20px",marginBottom:14,border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Where the Money Comes From</div>
          {econ.fundingSources.map((src,i)=>(
            <div key={i} style={{marginBottom:i<econ.fundingSources.length-1?14:0}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:7,flex:1}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:src.color,flexShrink:0}}/>
                  <span style={{fontFamily:F.body,fontSize:12,color:C.text,fontWeight:400}}>{src.label}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:F.mono,fontSize:12,fontWeight:600,color:src.color}}>{src.amount}</span>
                  <span style={{fontFamily:F.mono,fontSize:10,color:C.textM,minWidth:30,textAlign:"right"}}>{src.pct}%</span>
                </div>
              </div>
              <div style={{height:7,borderRadius:4,background:C.bg2,overflow:"hidden",marginBottom:4}}>
                <div style={{width:src.pct+"%",height:"100%",background:src.color,borderRadius:4,"--fill-w":src.pct+"%",animation:"civlyBarFill 0.65s ease forwards",animationDelay:i*0.1+"s"}}/>
              </div>
              <div style={{fontFamily:F.body,fontSize:10,color:C.textM,fontWeight:300,marginLeft:17,lineHeight:1.4}}>{src.note}</div>
            </div>
          ))}
        </div>

        {/* Analysis */}
        <div style={{background:C.card,borderRadius:16,padding:"18px 20px",marginBottom:econ.distributionNote?14:0,border:"1px solid "+C.border,boxShadow:C.cardShadow}}>
          <div style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Economic Analysis</div>
          <div style={{fontFamily:F.body,fontSize:12,color:C.text2,fontWeight:300,lineHeight:1.7}}>{econ.analysis}</div>
        </div>

        {econ.distributionNote&&<div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"12px 14px",background:"rgba(220,38,38,0.04)",borderRadius:12,border:"1px solid rgba(220,38,38,0.12)",marginTop:14}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b2e2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{fontFamily:F.body,fontSize:11,color:"#8b2e2e",fontWeight:300,lineHeight:1.6}}>{econ.distributionNote}</span>
        </div>}

        {/* Market Impact — pulled from FINANCE_BILLS */}
        {(()=>{
          const fb=FINANCE_BILLS.find(x=>x.billId===bill.id);
          if(!fb)return null;
          const magLabel=["","Minor","Moderate","Major"];
          const magCol=["","#b45309","#1e40af","#c41e3a"];
          return(
            <div style={{marginTop:14}}>
              <div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,overflow:"hidden",boxShadow:C.cardShadow}}>
                <div style={{padding:"14px 20px",borderBottom:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.text}}>Market Impact</div>
                  {fb.passProb<100&&<span style={{fontFamily:F.body,fontSize:10,color:C.textM}}>{fb.passProb}% enactment probability</span>}
                </div>
                {fb.sectors.map((sk,si)=>{
                  const imp=fb.impacts[sk];
                  if(!imp)return null;
                  const col=imp.dir>0?"#15803d":imp.dir<0?"#c41e3a":"#b45309";
                  const secDef=FINANCE_SECTORS.find(s=>s.key===sk);
                  return(
                    <div key={sk} style={{borderBottom:si<fb.sectors.length-1?"1px solid "+C.border:"none",padding:"14px 20px"}}>
                      {/* Sector header */}
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                        <span style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.text,minWidth:90}}>{secDef?.label||sk}</span>
                        <span style={{fontFamily:F.mono,fontSize:11,fontWeight:700,color:col}}>{imp.dir>0?"↑":imp.dir<0?"↓":"→"} {imp.label}</span>
                        <div style={{display:"flex",gap:2,marginLeft:4}}>
                          {[1,2,3].map(n=>(
                            <div key={n} style={{width:12,height:4,borderRadius:2,background:n<=imp.magnitude?magCol[imp.magnitude]:C.bg2}}/>
                          ))}
                        </div>
                        <span style={{fontFamily:F.mono,fontSize:9,color:magCol[imp.magnitude]}}>{magLabel[imp.magnitude]}</span>
                      </div>
                      {/* Tickers */}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                        {imp.tickers.map(t=>(
                          <span key={t} style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:C.text,background:C.bg2,border:"1px solid "+C.border,padding:"2px 7px",borderRadius:5}}>{t}</span>
                        ))}
                      </div>
                      {/* Mechanism */}
                      <div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.6,marginBottom:8}}>{imp.mechanism}</div>
                      {/* Detail */}
                      <div style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.6,marginBottom:8}}>{imp.detail}</div>
                      {/* Risk */}
                      <div style={{display:"flex",gap:8,alignItems:"flex-start",padding:"8px 10px",background:"rgba(196,30,58,0.04)",borderRadius:8,border:"1px solid rgba(196,30,58,0.09)"}}>
                        <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:"#c41e3a",flexShrink:0,paddingTop:1}}>RISK</span>
                        <span style={{fontFamily:F.body,fontSize:11,color:C.text2,lineHeight:1.55}}>{imp.risk}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>}

      {/* NEWS TAB */}
      {detailTab==="news"&&<div style={{animation:"civlyFadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both"}}>
        <div style={{background:C.card,borderRadius:16,border:"1px solid "+C.border,overflow:"hidden",boxShadow:C.cardShadow}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 16px",borderBottom:"1px solid "+C.border}}>
            <span style={{fontFamily:F.mono,fontSize:8,fontWeight:700,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Media Coverage</span>
            <div style={{display:"flex",gap:4,marginLeft:"auto",flexWrap:"wrap"}}>
              {newsOutlet
                ?<span style={{fontFamily:F.mono,fontSize:7,fontWeight:700,color:OUTLET_BRAND[newsOutlet]?.color||C.accent2,background:OUTLET_BRAND[newsOutlet]?.bg||C.bg2,border:"1px solid "+(OUTLET_BRAND[newsOutlet]?.border||C.border),padding:"2px 7px",borderRadius:9999,textTransform:"uppercase"}}>{newsOutlet}</span>
                :[...new Set(allNews.map(n=>n.source))].filter(s=>OUTLET_BRAND[s]).slice(0,5).map(s=>(
                  <span key={s} style={{fontFamily:F.mono,fontSize:7,fontWeight:700,color:OUTLET_BRAND[s].color,background:OUTLET_BRAND[s].bg,border:"1px solid "+OUTLET_BRAND[s].border,padding:"2px 7px",borderRadius:9999,textTransform:"uppercase"}}>{s}</span>
                ))
              }
            </div>
          </div>
          {filteredNews.length===0
            ?<div style={{padding:24,color:C.textM,fontFamily:F.body,fontSize:12,textAlign:"center"}}>No {newsOutlet} coverage found.</div>
            :filteredNews.map((item,i,arr)=><NewsHeadlineItem key={item.id} item={item} last={i===arr.length-1}/>)
          }
        </div>
      </div>}

    </div>

    {/* ── SIDEBAR ── */}
    <div style={{width:260,flexShrink:0,position:"sticky",top:20}}>
      <Sidebar/>
    </div>

  </div>
</div>
);}

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
{[["bills","Bills"],["votes","Votes"],["activity","Activity"],["feed","Feed"],["intel","Intel"]].map(([k,l])=>(
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

{tab==="feed"&&(
<div>
{mem.twitter
?<TwitterFeed handle={mem.twitter} memberId={mem.id}/>
:<div style={{textAlign:"center",padding:40,color:C.textM,fontSize:12,fontFamily:F.body}}>No X/Twitter account on record for {mem.pre} {mem.name}.</div>}
</div>)}
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

{/* ── Campaign Finance ── */}
{INFLUENCE.members[mem.id]&&(()=>{const mInf=INFLUENCE.members[mem.id];const isSmallDollar=mInf.smallDollarPct>=50;const accentColor=isSmallDollar?"#34A853":C.navy;return(<>
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Campaign Finance</span>
    <span style={{fontFamily:F.mono,fontSize:7,color:C.textM,marginLeft:"auto",opacity:0.6}}>FEC · OpenSecrets</span>
  </div>
  {/* Cycle vs Career */}
  <div style={{display:"flex",gap:10,marginBottom:14}}>
    <div style={{flex:1,background:C.bg2,borderRadius:10,padding:"10px 12px"}}>
      <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.6,textTransform:"uppercase",marginBottom:4}}>Current Cycle</div>
      <div style={{fontFamily:F.mono,fontSize:16,fontWeight:700,color:accentColor}}>{fMoney(mInf.cycle)}</div>
    </div>
    <div style={{flex:1,background:C.bg2,borderRadius:10,padding:"10px 12px"}}>
      <div style={{fontFamily:F.mono,fontSize:8,color:C.textM,letterSpacing:0.6,textTransform:"uppercase",marginBottom:4}}>Career Total</div>
      <div style={{fontFamily:F.mono,fontSize:16,fontWeight:700,color:C.text}}>{fMoney(mInf.careerTotal)}</div>
    </div>
  </div>
  {/* Small dollar bar */}
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
      <span style={{fontFamily:F.body,fontSize:11,color:C.text2}}>Small donors <span style={{fontFamily:F.mono}}>{"<"}$200</span></span>
      <span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:isSmallDollar?"#34A853":C.textM}}>{mInf.smallDollarPct}%</span>
    </div>
    <div style={{height:5,background:C.bg2,borderRadius:3,overflow:"hidden"}}>
      <div style={{width:mInf.smallDollarPct+"%",height:"100%",background:isSmallDollar?"#34A853":"#9CA3AF",borderRadius:3,transition:"width 0.4s"}}/>
    </div>
  </div>
  {/* Industry breakdown */}
  <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>By Industry</div>
  {mInf.topIndustries.map((ind,i)=>(
    <div key={i} style={{marginBottom:7}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:ind.color,flexShrink:0,display:"inline-block"}}/>
          <span style={{fontFamily:F.body,fontSize:11,color:C.text}}>{ind.name}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fMoney(ind.amount)}</span>
          <span style={{fontFamily:F.mono,fontSize:8,color:C.textM,minWidth:24,textAlign:"right"}}>{ind.pct}%</span>
        </div>
      </div>
      <div style={{height:3,background:C.bg2,borderRadius:2,overflow:"hidden"}}>
        <div style={{width:ind.pct+"%",height:"100%",background:ind.color,borderRadius:2,opacity:0.75}}/>
      </div>
    </div>
  ))}
  {/* Top donors */}
  {mInf.topDonors&&<>
    <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginTop:14,marginBottom:8}}>Top Disclosed Donors</div>
    {mInf.topDonors.map((d,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<mInf.topDonors.length-1?"1px solid "+C.border:"none"}}>
        <span style={{width:5,height:5,borderRadius:"50%",background:d.type==="small-dollar"?"#34A853":C.navy,flexShrink:0}}/>
        <span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{d.name}</span>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fMoney(d.amount)}</span>
        <span style={{fontFamily:F.mono,fontSize:8,color:d.type==="small-dollar"?"#34A853":C.navy,background:(d.type==="small-dollar"?"#34A853":C.navy)+"12",padding:"1px 6px",borderRadius:9999}}>{d.type}</span>
      </div>
    ))}
  </>}
  {mInf.note&&<div style={{fontFamily:F.mono,fontSize:8,color:"#34A853",marginTop:10,letterSpacing:0.2,padding:"6px 10px",background:"rgba(52,168,83,0.06)",borderRadius:8,border:"1px solid rgba(52,168,83,0.14)"}}>{mInf.note}</div>}
</div>

{/* ── Lobbying & Outside Spending ── */}
<div style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:12,border:"1px solid "+C.border,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase"}}>Lobbying & Outside Spending</span>
    <span style={{fontFamily:F.mono,fontSize:7,color:C.textM,marginLeft:"auto",opacity:0.6}}>Senate/House LDA · OpenSecrets</span>
  </div>
  {/* Lobbying pressure by issue */}
  {mInf.lobbyPressure?.length>0&&<>
    <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>Lobbying Pressure by Issue</div>
    {mInf.lobbyPressure.map((p,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<mInf.lobbyPressure.length-1?"1px solid "+C.border:"none"}}>
        <div style={{flex:1}}>
          <div style={{fontFamily:F.body,fontSize:11,color:C.text,marginBottom:2}}>{p.issue}</div>
          <div style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{p.orgs} organizations · {fMoney(p.spend)}</div>
        </div>
        <span style={{fontFamily:F.mono,fontSize:8,color:p.direction==="aligned"?C.success:C.error,background:(p.direction==="aligned"?C.success:C.error)+"12",padding:"2px 8px",borderRadius:9999,border:"1px solid "+(p.direction==="aligned"?C.success:C.error)+"25",flexShrink:0}}>{p.direction==="aligned"?"Aligned":"Opposed"}</span>
      </div>
    ))}
  </>}
  {/* Outside spending */}
  {mInf.outsideOrgs?.length>0&&<>
    <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:0.8,textTransform:"uppercase",marginTop:mInf.lobbyPressure?.length>0?14:0,marginBottom:8}}>Outside Spending</div>
    {mInf.outsideOrgs.map((o,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<mInf.outsideOrgs.length-1?"1px solid "+C.border:"none"}}>
        <div style={{width:5,height:5,borderRadius:"50%",background:o.type==="support"?C.success:C.error,flexShrink:0}}/>
        <span style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text,flex:1}}>{o.org}</span>
        <span style={{fontFamily:F.mono,fontSize:9,color:C.textM}}>{fMoney(o.amount)}</span>
        <span style={{fontFamily:F.mono,fontSize:8,color:o.type==="support"?C.success:C.error,background:(o.type==="support"?C.success:C.error)+"12",padding:"1px 6px",borderRadius:9999}}>{o.type}</span>
      </div>
    ))}
  </>}
  <div style={{fontFamily:F.body,fontSize:11,fontWeight:300,color:C.text2,lineHeight:1.6,marginTop:14,borderTop:"1px solid "+C.border,paddingTop:10}}>"{mInf.explanation}"</div>
  <ConfidenceBadge confidence={mInf.confidence} directInferred={mInf.directInferred} source={mInf.source}/>
</div>
</>);})()||null}

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
<div style={{fontFamily:F.body,fontSize:12,color:C.text2,lineHeight:1.6}}>"No recent public statements on active legislation found."</div>
</div>
</>}

{/* ── Data Sources ── */}
<div style={{borderRadius:12,padding:"12px 14px",marginBottom:8,background:C.bg2,border:"1px solid "+C.border}}>
  <div style={{fontFamily:F.mono,fontSize:8,fontWeight:600,color:C.textM,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Data Sources</div>
  {[
    {label:"FEC.gov",desc:"Campaign finance disclosures — all federal candidates required to file.",url:"https://www.fec.gov"},
    {label:"OpenSecrets",desc:"Aggregated campaign finance, outside spending, and lobbying data by cycle.",url:"https://www.opensecrets.org"},
    {label:"Senate LDA / House LD-2",desc:"Lobbying Disclosure Act filings — registered lobbyists report clients, issues, and spend each quarter.",url:"https://lda.senate.gov"},
  ].map((s,i)=>(
    <div key={i} style={{display:"flex",gap:10,paddingBottom:i<2?8:0,marginBottom:i<2?8:0,borderBottom:i<2?"1px solid "+C.border:"none"}}>
      <div style={{width:3,borderRadius:2,background:C.accent2,flexShrink:0,alignSelf:"stretch"}}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:C.text}}>{s.label}</span>
          <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:F.mono,fontSize:8,color:C.accent2,textDecoration:"none",opacity:0.7}}>{s.url.replace("https://","")}</a>
        </div>
        <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:2,lineHeight:1.45}}>{s.desc}</div>
      </div>
    </div>
  ))}
  <div style={{fontFamily:F.body,fontSize:10,color:C.textM,marginTop:10,lineHeight:1.5}}>Amounts marked <span style={{fontFamily:F.mono,background:C.bg2,padding:"0 4px",borderRadius:3,border:"1px solid "+C.border}}>Inferred</span> are estimated from related filings where direct disclosure was unavailable.</div>
</div>

</div>)}
</div>)}


// ═══ VOTE COUNTDOWN BANNER ═══
// Maps billId → upcoming scheduled vote date (from calendarEvents)
const BILL_VOTE_DATES={};
calendarEvents.filter(e=>e.type==="vote"||e.type==="deadline").forEach(e=>{if(e.billId)BILL_VOTE_DATES[e.billId]=e.date;});

function VoteCountdownBanner({billId}){
  const targetDate=BILL_VOTE_DATES[billId];
  const[parts,setParts]=useState(null);
  useEffect(()=>{
    if(!targetDate)return;
    const calc=()=>{
      const diff=new Date(targetDate+"T12:00:00")-new Date();
      if(diff<=0){setParts({expired:true});return;}
      const total=Math.floor(diff/1000);
      const d=Math.floor(total/86400);
      const h=Math.floor((total%86400)/3600);
      const m=Math.floor((total%3600)/60);
      const s=total%60;
      setParts({d,h,m,s,diff,within24:diff<86400000});
    };
    calc();
    const id=setInterval(calc,1000);
    return()=>clearInterval(id);
  },[targetDate]);
  if(!targetDate||!parts)return null;
  if(parts.expired)return null;
  const{d,h,m,s,within24}=parts;
  const urgent=within24;
  return(
    <div style={{borderRadius:16,marginBottom:16,overflow:"hidden",border:"1px solid "+(urgent?"rgba(196,30,58,0.35)":"rgba(26,39,68,0.18)"),background:urgent?"linear-gradient(135deg,#1a0408 0%,#2d0610 100%)":"linear-gradient(135deg,#080f1e 0%,#111d36 100%)"}}>
      {/* top strip */}
      <div style={{background:urgent?"rgba(196,30,58,0.18)":"rgba(255,255,255,0.04)",padding:"8px 18px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid "+(urgent?"rgba(196,30,58,0.2)":"rgba(255,255,255,0.06)")}}>
        <span style={{width:7,height:7,borderRadius:"50%",background:urgent?"#ff3333":"#16a34a",display:"inline-block",animation:"civlyDotBounce 1.4s ease-in-out infinite",flexShrink:0,boxShadow:"0 0 6px "+(urgent?"#ff3333":"#16a34a")}}/>
        <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:urgent?"rgba(255,180,180,0.95)":"rgba(150,200,150,0.9)",letterSpacing:2,textTransform:"uppercase"}}>
          {urgent?"VOTE IMMINENT":"VOTE SCHEDULED"}
        </span>
        <span style={{fontFamily:F.body,fontSize:10,color:"rgba(255,255,255,0.45)",marginLeft:"auto"}}>
          {new Date(targetDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
        </span>
      </div>
      {/* clock */}
      <div style={{padding:"16px 18px 18px",display:"flex",alignItems:"center",gap:0,justifyContent:"center"}}>
        {(d>0?[{v:d,label:"days"},{v:h,label:"hrs"},{v:m,label:"min"},{v:s,label:"sec"}]:[{v:h,label:"hrs"},{v:m,label:"min"},{v:s,label:"sec"}]).map(({v,label},i,arr)=>(
          <React.Fragment key={label}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:64}}>
              <div style={{fontFamily:F.mono,fontSize:d>0?36:44,fontWeight:700,color:urgent?"#ff6b6b":"rgba(255,255,255,0.95)",lineHeight:1,letterSpacing:-1,textShadow:urgent?"0 0 20px rgba(255,80,80,0.5)":"0 0 20px rgba(100,150,255,0.3)",transition:"all 0.3s"}}>
                {String(v).padStart(2,"0")}
              </div>
              <div style={{fontFamily:F.mono,fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:1.5,textTransform:"uppercase",marginTop:4}}>{label}</div>
            </div>
            {i<arr.length-1&&<div style={{fontFamily:F.mono,fontSize:d>0?28:36,fontWeight:300,color:"rgba(255,255,255,0.2)",marginBottom:16,padding:"0 2px"}}>:</div>}
          </React.Fragment>
        ))}
      </div>
      {urgent&&<div style={{textAlign:"center",fontFamily:F.body,fontSize:11,color:"rgba(255,180,180,0.7)",paddingBottom:14,fontWeight:300}}>Floor vote expected within 24 hours — outcome will update this page</div>}
    </div>
  );
}

// ═══ CONGRESS DAY COUNTER ═══
// 119th Congress sworn in January 3, 2025
const CONGRESS_START=new Date("2025-01-03T12:00:00");
function CongressDayCounter(){
  const[day,setDay]=useState(null);
  useEffect(()=>{
    const calc=()=>{
      const d=Math.floor((new Date()-CONGRESS_START)/864e5)+1;
      setDay(Math.max(1,d));
    };
    calc();const id=setInterval(calc,3600000);return()=>clearInterval(id);
  },[]);
  if(!day)return null;
  return(
    <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",marginLeft:14,paddingLeft:14,borderLeft:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}>
      <div style={{fontFamily:F.mono,fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.95)",lineHeight:1,letterSpacing:-0.5}}>Day {day}</div>
      <div style={{fontFamily:F.mono,fontSize:7,color:"rgba(255,255,255,0.35)",letterSpacing:1.5,textTransform:"uppercase",marginTop:1}}>119th Congress</div>
    </div>
  );
}

// ═══ SESSION STATUS PILL ═══
// Congress is typically in session Mon–Fri excluding recesses.
// We infer "in session" from day-of-week as a best-effort live signal.
function SessionStatusPill(){
  const[status,setStatus]=useState(null);
  useEffect(()=>{
    const calc=()=>{
      const now=new Date();
      const day=now.getDay();// 0=Sun 6=Sat
      const h=now.getHours();
      // Known recess windows (approximate)
      const RECESS_RANGES=[["2026-01-01","2026-01-06"],["2025-12-19","2025-12-31"],["2025-11-28","2025-12-01"],["2025-11-11","2025-11-11"]];
      const todayStr=now.toISOString().slice(0,10);
      const inRecess=RECESS_RANGES.some(([s,e])=>todayStr>=s&&todayStr<=e);
      const weekday=day>=1&&day<=5;
      if(inRecess){setStatus("recess");return;}
      if(weekday&&h>=9&&h<18){setStatus("session");return;}
      if(weekday){setStatus("standby");return;}
      setStatus("weekend");
    };
    calc();const id=setInterval(calc,60000);return()=>clearInterval(id);
  },[]);
  if(!status)return null;
  const cfg={
    session:{dot:"#4ade80",label:"In Session",color:"rgba(74,222,128,0.9)"},
    standby:{dot:"#facc15",label:"Adjourned",color:"rgba(250,204,21,0.75)"},
    recess: {dot:"#94a3b8",label:"In Recess",color:"rgba(148,163,184,0.7)"},
    weekend:{dot:"#94a3b8",label:"Weekend",color:"rgba(148,163,184,0.6)"},
  }[status];
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 8px",borderRadius:9999,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",marginLeft:10,flexShrink:0}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block",flexShrink:0,animation:status==="session"?"civlyDotBounce 2s ease-in-out infinite":"none",boxShadow:status==="session"?"0 0 5px "+cfg.dot:"none"}}/>
      <span style={{fontFamily:F.mono,fontSize:7,fontWeight:600,color:cfg.color,letterSpacing:1.2,textTransform:"uppercase",whiteSpace:"nowrap"}}>{cfg.label}</span>
    </div>
  );
}

// ═══ LIVE TICKER ═══
const TICKER_ITEMS=[
  "DHS funding expires Feb 14 — second partial shutdown in two weeks looming",
  "One Big Beautiful Bill signed into law July 4 — $3.2T, 215-214 House passage",
  "SAVE Act Senate markup Feb 13 — Collins & Murkowski key swing votes to watch",
  "Critical Minerals Act on House floor: China controls 60%+ of rare earth processing",
  "HALT Fentanyl Act: fentanyl kills 74,000+ Americans per year — Energy & Commerce markup",
  "119th Congress · 535 Members · Session Active · 15 Bills Tracked",
  "Laken Riley Act: first bill signed by President Trump in 119th Congress (P.L. 119-1)",
  "SHOWER Act passed House 226-197 — heads to Senate after water pressure deregulation vote",
];
function NewsTicker(){
  return(
    <div style={{position:"fixed",top:64,left:0,right:0,height:34,background:"#5c0f1a",zIndex:199,display:"flex",alignItems:"center",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 2px 12px rgba(0,0,0,0.25)"}}>
      <div style={{background:"#3d0910",padding:"0 18px",height:"100%",display:"flex",alignItems:"center",gap:8,flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.12)"}}>
        <span style={{width:8,height:8,borderRadius:"50%",background:"#ff3333",display:"inline-block",animation:"civlyDotBounce 1.4s ease-in-out infinite",flexShrink:0,boxShadow:"0 0 6px #ff3333"}}/>
        <span style={{fontFamily:F.mono,fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.95)",letterSpacing:2.5,textTransform:"uppercase"}}>LIVE</span>
      </div>
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        <div style={{display:"flex",whiteSpace:"nowrap",animation:"civlyTicker 70s linear infinite"}}>
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
            <span key={i} style={{fontFamily:F.body,fontSize:12,fontWeight:300,color:"rgba(255,255,255,0.88)",padding:"0 22px",display:"inline-flex",alignItems:"center",gap:0}}>
              {item}
              <span style={{color:"rgba(255,255,255,0.2)",margin:"0 8px"}}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ APP SHELL — Newspaper UI Kit ═══
export default function CivlyApp(){
const[tab,setTab]=useState("home");const[stack,setStack]=useState([]);
const[profile,setProfile]=useState(null);
const[user,setUser]=useState(null);const[authChecked,setAuthChecked]=useState(false);const[guestMode,setGuestMode]=useState(false);const[isPremium,setIsPremiumState]=useState(()=>localStorage.getItem("civly-premium")==="1");
const setIsPremium=v=>{setIsPremiumState(v);if(v)localStorage.setItem("civly-premium","1");else localStorage.removeItem("civly-premium");};
const[showUpgrade,setShowUpgrade]=useState(false);
const openUpgrade=()=>setShowUpgrade(true);
// Stripe checkout placeholder — wire in your price IDs once Stripe is connected
const handleStripeCheckout=(planId)=>{
  const plan=PLANS[planId];
  // TODO: call your backend to create a Stripe Checkout session
  // e.g. fetch('/api/create-checkout-session', { method:'POST', body: JSON.stringify({ priceId: plan.stripePriceId }) })
  //      .then(r=>r.json()).then(d=>stripe.redirectToCheckout({ sessionId: d.id }))
  alert(`Stripe checkout will open here for the ${plan.label} plan ($${plan.price}${plan.period}).\nWire in your Stripe price ID: ${plan.stripePriceId}`);
};
const[wb,setWb]=useState(["b1","b3"]);const[wm,setWm]=useState(["m17","m3"]);
const[newsOutlet,setNewsOutletState]=useState(()=>localStorage.getItem("civly-news-outlet")||"");
const setNewsOutlet=v=>{setNewsOutletState(v);try{if(v)localStorage.setItem("civly-news-outlet",v);else localStorage.removeItem("civly-news-outlet");}catch{}};
const[membersReady,setMembersReady]=useState(false);
const[billsReady,setBillsReady]=useState(false);
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
// Fetch current bills from Congress.gov API and merge with curated static bills
try{
  const apiBills=await fetchBillsFromAPI();
  const staticNums=new Set(bills.map(b=>(b.num||'').replace(/[\s.]/g,'').toLowerCase()));
  const newBills=apiBills.filter(b=>!staticNums.has((b.num||'').replace(/[\s.]/g,'').toLowerCase()));
  bills=[...bills,...newBills];
  setBillsReady(true);
}catch(e){console.warn("Could not load API bills:",e);setBillsReady(true);}
})();
return()=>subscription.unsubscribe();
},[]);
const saveProfile=useCallback(p=>{setProfile(p);try{if(p)storage.set("civly-profile",JSON.stringify(p));else storage.delete("civly-profile");}catch(e){}},[]);
const signOut=useCallback(async()=>{await supabase.auth.signOut();setUser(null);setGuestMode(false);},[]);
const toggleB=useCallback((id)=>{
  setWb(p=>{
    if(p.includes(id)){const nv=p.filter(x=>x!==id);try{storage.set("civly-watchlist-bills",JSON.stringify(nv));}catch(e){}return nv;}
    if(!isPremium&&p.length>=FREE_BILL_LIMIT){setShowUpgrade(true);return p;}
    const nv=[...p,id];try{storage.set("civly-watchlist-bills",JSON.stringify(nv));}catch(e){}return nv;
  });
},[isPremium]);
const toggleM=useCallback((id)=>{
  setWm(p=>{
    if(p.includes(id)){const nv=p.filter(x=>x!==id);try{storage.set("civly-watchlist-members",JSON.stringify(nv));}catch(e){}return nv;}
    if(!isPremium&&p.length>=FREE_MEMBER_LIMIT){setShowUpgrade(true);return p;}
    const nv=[...p,id];try{storage.set("civly-watchlist-members",JSON.stringify(nv));}catch(e){}return nv;
  });
},[isPremium]);
const nav=useCallback((action,param)=>{if(action==="back")setStack(s=>s.slice(0,-1));else setStack(s=>[...s,{type:action,id:param}])},[]);
const switchTab=useCallback(t=>{setTab(t);setStack([])},[]);
const cur=stack.length>0?stack[stack.length-1]:null;
const tabDefs=[{key:"home",label:"Home",icon:"home",color:"#8b2e2e",activeBg:"#fef2f2"},{key:"bills",label:"Bills",icon:"filetext",color:"#2d6a4f",activeBg:"#f0f4f2"},{key:"members",label:"Members",icon:"person",color:"#d97706",activeBg:"#fef9f3"},{key:"finance",label:"Markets",icon:"trending",color:"#15803d",activeBg:"#f0fdf4"},{key:"scotus",label:"Court",icon:"gavel",color:"#1e40af",activeBg:"#eff6ff"},{key:"pulse",label:"Calendar",icon:"calendar",color:"#7c3aed",activeBg:"#f5f3ff"},{key:"saved",label:"Saved",icon:"bookmark",color:"#b45309",activeBg:"#fff7ed"},{key:"profile",label:"Profile",icon:"person",color:"#166534",activeBg:"#f0fdf4"}];
const screen=()=>{
if(cur?.type==="billDetail")return <BillDetailScreen billId={cur.id} nav={nav} wb={wb} toggleB={toggleB} newsOutlet={newsOutlet}/>;
if(cur?.type==="memberProfile")return <MemberProfileScreen memberId={cur.id} nav={nav} wm={wm} toggleM={toggleM} isPremium={isPremium}/>;
if(cur?.type==="browseMembers")return <BrowseMembersScreen nav={nav} wm={wm} toggleM={toggleM}/>;
if(cur?.type==="topicDetail"){const topic=trending.find(t=>t.name===cur.id);if(topic)return <TopicDetailScreen topic={topic} nav={nav} wb={wb} toggleB={toggleB}/>;}
switch(tab){case"home":return <HomeScreen nav={nav} wb={wb} toggleB={toggleB} wm={wm} toggleM={toggleM} newsOutlet={newsOutlet} switchTab={switchTab} isPremium={isPremium} openUpgrade={openUpgrade}/>;case"bills":return <BillsScreen nav={nav} wb={wb} toggleB={toggleB}/>;case"members":return <MembersScreen nav={nav} wm={wm} toggleM={toggleM}/>;case"finance":return <FinanceScreen nav={nav} wb={wb} toggleB={toggleB}/>;case"scotus":return <SCOTUSScreen nav={nav}/>;case"search":return <SearchScreen nav={nav} wm={wm} toggleM={toggleM}/>;case"pulse":return <CalendarScreen nav={nav}/>;case"saved":return <WatchlistScreen nav={nav} wb={wb} toggleB={toggleB} wm={wm} toggleM={toggleM} profile={profile} isPremium={isPremium} openUpgrade={openUpgrade}/>;case"profile":return <ProfileScreen profile={profile} setProfile={saveProfile} wb={wb} wm={wm} user={user} onSignOut={signOut} isPremium={isPremium} setIsPremium={setIsPremium} switchTab={switchTab} newsOutlet={newsOutlet} setNewsOutlet={setNewsOutlet} openUpgrade={openUpgrade}/>;default:return null}};
// Show loading while checking auth, then show auth screen if no user
if(!authChecked)return(<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#c41e3a,#e8394d)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(196,30,58,0.35)"}}><span style={{color:"#fff",fontWeight:700,fontSize:20,fontFamily:F.display}}>C</span></div><div style={{fontFamily:F.body,color:C.textM,fontSize:13,letterSpacing:0.2}}>Loading…</div></div></div>);
if(!user&&!guestMode)return <AuthScreen onContinueAsGuest={()=>setGuestMode(true)}/>;
return(
<div style={{minHeight:"100vh",background:C.bg,fontFamily:F.body}}>

{/* ── Upgrade Modal ── */}
{showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)} onCheckout={handleStripeCheckout}/>}

{/* ── Top Header ── */}
<div style={{position:"fixed",top:0,left:0,right:0,height:64,background:"rgba(10,18,38,0.92)",backdropFilter:"blur(24px) saturate(1.6)",WebkitBackdropFilter:"blur(24px) saturate(1.6)",display:"flex",alignItems:"center",padding:"0 24px",zIndex:200,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
  {/* Logo */}
  <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
    <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#c41e3a 0%,#e03650 100%)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 1px rgba(255,255,255,0.12) inset,0 4px 12px rgba(196,30,58,0.45)",flexShrink:0}}>
      <span style={{color:"#fff",fontWeight:700,fontSize:17,fontFamily:"'Bebas Neue',serif",lineHeight:1,letterSpacing:1}}>C</span>
    </div>
    <div>
      <div style={{fontFamily:"'Bebas Neue',serif",fontSize:22,color:"#ffffff",lineHeight:1,letterSpacing:2}}>Civlio</div>
    </div>
    <SessionStatusPill/>
    <CongressDayCounter/>
  </div>
  {/* ── Nav Tabs (center) ── */}
  {(()=>{
    const navTabs=tabDefs.filter(t=>t.key!=="profile");
    return(
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:2,padding:"3px",background:"rgba(255,255,255,0.05)",borderRadius:11,border:"1px solid rgba(255,255,255,0.07)"}}>
          {navTabs.map((t)=>{
            const isActive=tab===t.key;
            return(
              <button key={t.key} onClick={()=>switchTab(t.key)}
                style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"5px 11px",borderRadius:8,fontFamily:F.body,fontSize:12.5,fontWeight:isActive?600:400,whiteSpace:"nowrap",transition:"all 0.18s cubic-bezier(0.22,1,0.36,1)",color:isActive?"#ffffff":"rgba(255,255,255,0.42)",background:isActive?"rgba(255,255,255,0.13)":"transparent",boxShadow:isActive?"0 1px 3px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.12) inset":"none",letterSpacing:isActive?"-0.1px":"0"}}
                onMouseEnter={e=>{if(!isActive){e.currentTarget.style.color="rgba(255,255,255,0.72)";e.currentTarget.style.background="rgba(255,255,255,0.06)";}}}
                onMouseLeave={e=>{if(!isActive){e.currentTarget.style.color="rgba(255,255,255,0.42)";e.currentTarget.style.background="transparent";}}}>
                <Icon name={t.icon} size={13} color={isActive?"#ffffff":"rgba(255,255,255,0.38)"} strokeWidth={isActive?2.2:1.5}/>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  })()}
  {/* Right: member badge + user avatar */}
  <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,flexShrink:0}}>
  {isPremium
    ?<div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px 3px 7px",borderRadius:9999,background:"rgba(249,171,0,0.12)",border:"1px solid rgba(249,171,0,0.25)"}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F9AB00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style={{fontFamily:F.mono,fontSize:9,fontWeight:700,color:"#F9AB00",letterSpacing:0.8}}>MEMBER</span>
      </div>
    :<button onClick={openUpgrade} style={{all:"unset",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:9999,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.13)",transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(249,171,0,0.15)";e.currentTarget.style.borderColor="rgba(249,171,0,0.3)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";e.currentTarget.style.borderColor="rgba(255,255,255,0.13)";}}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span style={{fontFamily:F.body,fontSize:11,color:"rgba(255,255,255,0.55)",fontWeight:400}}>Upgrade</span>
      </button>}

    {(()=>{
      const avatar=user?.user_metadata?.avatar_url;
      const name=user?.user_metadata?.full_name||user?.email||"";
      const initials=(name.split(" ").map(n=>n[0]).join("").slice(0,2)||"?").toUpperCase();
      const isActive=tab==="profile";
      return(
        <div onClick={()=>switchTab("profile")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:"5px 10px 5px 6px",borderRadius:9999,background:isActive?"rgba(255,255,255,0.12)":"transparent",border:"1px solid "+(isActive?"rgba(255,255,255,0.18)":"transparent"),transition:"all 0.18s"}}
          onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}}
          onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}}>
          {avatar
            ?<img src={avatar} alt="avatar" style={{width:28,height:28,borderRadius:9999,objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.25)"}} referrerPolicy="no-referrer"/>
            :<div style={{width:28,height:28,borderRadius:9999,background:"linear-gradient(135deg,#c41e3a,#e03650)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(196,30,58,0.35)"}}><span style={{color:"#fff",fontSize:10,fontWeight:600,fontFamily:F.body}}>{initials}</span></div>}
          <span style={{fontFamily:F.body,fontSize:13,fontWeight:400,color:isActive?"#ffffff":"rgba(255,255,255,0.55)"}}>Profile</span>
        </div>
      );
    })()}
  </div>
</div>

<NewsTicker/>
{/* ── Body ── */}
<div style={{paddingTop:98,minHeight:"100vh"}}>
  {/* ── Main Content ── */}
  <div style={{flex:1,minHeight:"calc(100vh - 60px)",overflowY:"auto"}} className="civly-scroll">
    <div style={{maxWidth:tab==="home"?"none":920,margin:"0 auto",padding:tab==="home"?"20px 28px":"28px 32px"}}>
      {stack.length>0&&<button onClick={()=>nav("back")} style={{all:"unset",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,marginBottom:20,color:C.text2,fontSize:12,fontFamily:F.body,fontWeight:400,padding:"6px 14px",borderRadius:9999,background:C.card,border:"1px solid rgba(221,226,237,0.8)",boxShadow:C.cardShadow,transition:"all 0.18s"}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=C.cardShadowHover;e.currentTarget.style.color=C.navy;}} onMouseLeave={e=>{e.currentTarget.style.boxShadow=C.cardShadow;e.currentTarget.style.color=C.text2;}}>
        <ChevronLeft size={14} color="currentColor" strokeWidth={2}/> Back
      </button>}
      <div key={tab+"-"+(stack.length>0?stack[stack.length-1].id:"")} className="civly-screen-enter">
      {screen()}
      </div>
    </div>
  </div>
</div>

<style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;600;700&family=Bebas+Neue&display=swap');
html,body{margin:0;padding:0;font-family:'DM Sans',system-ui,sans-serif;background:#f0f2f7;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 0%,rgba(26,77,184,0.055) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 100%,rgba(196,30,58,0.04) 0%,transparent 60%);pointer-events:none;z-index:0;}
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
/* Promote panels and heavy containers to their own compositor layer */
.civly-panel{will-change:transform;contain:layout style;}
@keyframes civlyFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes civlyFadeIn{from{opacity:0}to{opacity:1}}
@keyframes civlyPop{0%{transform:scale(0.94);opacity:0}60%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes civlyGlow{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes civlyDotBounce{0%,100%{transform:scale(1)}50%{transform:scale(1.45)}}
@keyframes civlyTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes civlyBarFill{from{width:0}to{width:var(--fill-w,100%)}}
@keyframes civlySlideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes civlyExpandIn{from{opacity:0;max-height:0;transform:translateY(-4px)}to{opacity:1;max-height:200px;transform:translateY(0)}}
@keyframes civlyFlipIn{from{opacity:0;transform:rotateY(-90deg)}to{opacity:1;transform:rotateY(0deg)}}
@keyframes civlyTooltipIn{from{opacity:0;transform:translateY(4px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes civlyCountPop{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.civly-screen-enter{animation:civlyFadeUp 0.24s cubic-bezier(0.22,1,0.36,1) both}
.civly-card-enter{animation:civlyFadeUp 0.18s cubic-bezier(0.22,1,0.36,1) both}
.civly-glass{background:rgba(255,255,255,0.72);backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);}
.civly-card{background:#fff;border-radius:16px;border:1px solid rgba(221,226,237,0.8);box-shadow:0 1px 2px rgba(15,29,58,0.04),0 4px 16px rgba(15,29,58,0.05);}
.civly-card:hover{box-shadow:0 4px 12px rgba(15,29,58,0.08),0 16px 40px rgba(15,29,58,0.09);transform:translateY(-2px);}
.civly-scroll::-webkit-scrollbar{width:3px;height:3px}
.civly-scroll::-webkit-scrollbar-track{background:transparent}
.civly-scroll::-webkit-scrollbar-thumb{background:rgba(15,29,58,0.12);border-radius:3px}
.civly-scroll::-webkit-scrollbar-thumb:hover{background:rgba(15,29,58,0.22)}
input::placeholder{color:#8896ab;font-weight:300}
input:focus,select:focus{outline:none;}
select{-webkit-appearance:auto}
a{color:#1a4db8}
button{font-family:'DM Sans',system-ui,sans-serif}
::selection{background:rgba(196,30,58,0.1)}
:focus-visible{outline:2px solid rgba(26,77,184,0.5);outline-offset:2px;border-radius:4px;}
`}</style>
</div>);}
