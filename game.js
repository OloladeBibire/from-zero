/* ============================================================
   FROM ZERO — GAME ENGINE
   ============================================================ */

const $ = (s) => document.querySelector(s);
const stage = $("#stage");
const hud = $("#hud");
const modal = $("#modal");
const toastEl = $("#toast");

const SAVE_KEY = "fz_save_v1";
const ACH_KEY = "fz_ach_v1";
const DONE_KEY = "fz_done_v1";

let S = null; // current run state

/* ---------------- helpers ---------------- */
function career() { return CAREERS.find((c) => c.id === S.careerId); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmt(n) {
  const a = Math.abs(Math.round(n));
  return (n < 0 ? "-$" : "$") + a.toLocaleString("en-US");
}
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function dots(lv) { return "●".repeat(lv) + "○".repeat(5 - lv); }
function avgSkill() {
  const v = Object.values(S.skills);
  return v.reduce((a, b) => a + b, 0) / v.length;
}
function loadJSON(key, fb) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fb : v; }
  catch (e) { return fb; }
}
function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

function getAch() { return loadJSON(ACH_KEY, []); }
function awardAch(id) {
  const have = getAch();
  if (have.includes(id)) return;
  have.push(id);
  saveJSON(ACH_KEY, have);
  if (S) { S.newAch = S.newAch || []; S.newAch.push(id); }
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (a) toast(a.ico + " Achievement: " + a.name);
}
function markDone(id) {
  const d = loadJSON(DONE_KEY, []);
  if (!d.includes(id)) { d.push(id); saveJSON(DONE_KEY, d); }
  if (d.length >= CAREERS.length) awardAch("all-five");
}

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  toastEl.classList.remove("pop"); void toastEl.offsetWidth; toastEl.classList.add("pop");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2400);
}

/* ---------------- state ---------------- */
function newState(id) {
  const c = CAREERS.find((x) => x.id === id);
  return {
    careerId: id,
    ep: 0,
    phase: "episode",
    cash: c.startMoney,
    rep: 20, sat: 70, stress: 15,
    skills: Object.assign({}, c.skills),
    kit: c.startKit.slice(),
    items: [],
    flags: [],
    debt: 0,
    hadDebt: false,
    wasBroke: false,
    luckyRun: false,
    totalRev: 0,
    totalExp: 0,
    eventDone: false,
    eventRef: null,
    lastReport: null,
    newAch: []
  };
}

function save() {
  if (S && S.phase !== "ending") saveJSON(SAVE_KEY, S);
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

/* ---------------- fx / requirements ---------------- */
function applyFx(fx) {
  if (!fx) return;
  if (fx.cash) S.cash += fx.cash;
  if (fx.rep) S.rep = clamp(S.rep + fx.rep, 0, 100);
  if (fx.sat) S.sat = clamp(S.sat + fx.sat, 0, 100);
  if (fx.stress) S.stress = clamp(S.stress + fx.stress, 0, 100);
  if (fx.skills) {
    for (const k in fx.skills) {
      S.skills[k] = clamp((S.skills[k] || 0) + fx.skills[k], 0, 5);
    }
  }
  if (fx.flag && !S.flags.includes(fx.flag)) S.flags.push(fx.flag);
  if (S.cash <= 0) S.wasBroke = true;
}

function reqMet(req) {
  if (!req) return true;
  if (req.cash && S.cash < req.cash) return false;
  if (req.rep && S.rep < req.rep) return false;
  if (req.skill) { const [n, l] = req.skill; if ((S.skills[n] || 0) < l) return false; }
  if (req.item && !S.items.includes(req.item)) return false;
  if (req.flag && !S.flags.includes(req.flag)) return false;
  return true;
}
function reqNote(req) {
  if (!req) return "";
  const bits = [];
  if (req.cash) bits.push(fmt(req.cash) + " in the bank");
  if (req.rep) bits.push(req.rep + "+ reputation");
  if (req.skill) bits.push(req.skill[0] + " at level " + req.skill[1]);
  if (req.item) bits.push("own: " + req.item);
  if (req.flag) bits.push("an earlier opportunity");
  return "Requires " + bits.join(", ");
}

function fxSummary(ch) {
  const fx = ch.fx || {};
  const out = [];
  const mk = (v, txt) => {
    if (!v) return;
    const sign = v > 0 ? "+" : "";
    out.push('<span class="delta ' + (v > 0 ? "up" : "down") + '">' + sign + fmt(v) + (txt ? " " + txt : "") + "</span>");
  };
  mk(fx.cash);
  if (fx.rep) out.push('<span class="delta ' + (fx.rep > 0 ? "up" : "down") + '">Rep ' + (fx.rep > 0 ? "+" : "") + fx.rep + "</span>");
  if (fx.sat) out.push('<span class="delta ' + (fx.sat > 0 ? "up" : "down") + '">Satisfaction ' + (fx.sat > 0 ? "+" : "") + fx.sat + "</span>");
  if (fx.stress) out.push('<span class="delta ' + (fx.stress > 0 ? "down" : "up") + '">Stress ' + (fx.stress > 0 ? "+" : "") + fx.stress + "</span>");
  if (fx.skills) for (const k in fx.skills) {
    const d = fx.skills[k];
    out.push('<span class="delta ' + (d > 0 ? "up" : "down") + '">' + esc(k) + " " + (d > 0 ? "+" : "") + d + "</span>");
  }
  if (ch.flag) out.push('<span class="delta up">New opportunity unlocked</span>');
  if (ch.item) out.push('<span class="delta up">Obtained: ' + esc(ch.item) + "</span>");
  return out.join(" ");
}

/* ---------------- business tick ---------------- */
function tick() {
  const c = career();
  const notes = [];
  let mul = 0.6 + 0.4 * (S.rep / 100);
  mul *= 0.75 + avgSkill() * 0.09;

  let incBonus = 0, upkeep = 0;
  S.items.forEach((name) => {
    const it = c.shop.find((s) => s.name === name);
    if (it) { incBonus += it.inc; upkeep += it.upk; }
  });
  mul *= 1 + incBonus;

  let flagRev = 0, flagExp = 0;
  S.flags.forEach((f) => {
    const fe = FLAG_EFFECTS[f];
    if (fe) { flagRev += fe.rev; flagExp += fe.exp; }
  });
  mul *= 1 + flagRev;

  if (S.flags.includes("trained")) {
    S.flags = S.flags.filter((f) => f !== "trained");
  }
  if (S.flags.includes("tax-deferred")) {
    S.debt += 60;
    S.flags = S.flags.filter((f) => f !== "tax-deferred");
    notes.push("Deferred taxes grew: $60 added to your debt.");
  }

  if (S.stress > 60) mul *= 1 - (S.stress - 60) / 100;

  const revenue = Math.max(0, Math.round(c.base * mul));
  const interest = Math.round(S.debt * 0.05);
  const expenses = c.rent + upkeep + flagExp + interest;
  const profit = revenue - expenses;

  S.cash += profit;
  if (S.cash < 0) {
    S.debt += -S.cash;
    notes.push(fmt(-S.cash) + " of losses rolled into debt.");
    S.cash = 0;
  }
  if (S.debt > 0) S.hadDebt = true;
  if (S.cash <= 0) S.wasBroke = true;

  S.totalRev += revenue;
  S.totalExp += expenses;

  if (profit > 0) awardAch("first-profit");
  if (S.rep >= 90) awardAch("legend");
  if (S.hadDebt && S.debt === 0) awardAch("debt-free");
  if (S.wasBroke && S.cash >= 1000) awardAch("comeback");
  if (Object.values(S.skills).some((v) => v >= 5)) awardAch("master");
  if (c.shop.every((it) => S.items.includes(it.name))) awardAch("full-kit");
  if (S.flags.some((f) => ["owner", "empire", "employer", "storefront"].includes(f))) awardAch("boss");

  const report = { revenue, expenses, upkeep, flagExp, interest, profit, notes };
  S.lastReport = report;
  return report;
}

/* ---------------- rendering: HUD ---------------- */
function renderHUD() {
  const c = career();
  const cashNeg = S.cash <= 0;
  let chips = "";
  for (const k in S.skills) {
    chips += '<span class="chip blue">' + esc(k) + " " + dots(S.skills[k]) + "</span>";
  }
  S.kit.concat(S.items).forEach((n) => { chips += '<span class="chip">' + esc(n) + "</span>"; });
  hud.innerHTML =
    '<div class="hud-top">' +
      '<div><div class="hud-career">' + c.icon + " " + esc(c.name) + "</div>" +
      '<div class="hud-ep">Episode ' + (S.ep + 1) + " of " + c.episodes.length + "</div></div>" +
      '<div style="text-align:right"><div class="hud-cash ' + (cashNeg ? "neg" : "") + '">' + fmt(S.cash) + "</div>" +
      (S.debt > 0 ? '<div class="debt-line">Debt ' + fmt(S.debt) + "</div>" : "") + "</div>" +
      '<button class="hud-menu-btn" data-action="menu-open">☰</button>' +
    "</div>" +
    '<div class="bars">' +
      bar("Rep", S.rep, "rep") + bar("Satisfaction", S.sat, "sat") + bar("Stress", S.stress, "stress") +
    "</div>" +
    '<div class="hud-chips">' + chips + "</div>";

  function bar(lbl, val, cls) {
    return '<div class="bar"><div class="lbl"><span>' + lbl + "</span><span>" + val + "</span></div>" +
      '<div class="track"><div class="fill ' + cls + '" style="width:' + val + '%"></div></div></div>';
  }
}

function showGameChrome(show) {
  hud.classList.toggle("hidden", !show);
}

/* ---------------- rendering: screens ---------------- */
function renderStage(html) {
  stage.innerHTML = '<div class="fade">' + html + "</div>";
}

function renderTitle() {
  S = null;
  showGameChrome(false);
  clearSave();
  const hasAch = getAch().length > 0;
  renderStage(
    '<div class="title-wrap">' +
      '<span class="icon-big">🏙️</span>' +
      '<div class="logo">FROM ZERO</div>' +
      '<div class="tagline">Start with nothing. Build something. Become someone.</div>' +
    "</div>" +
    '<button class="btn primary" data-action="nav-select">💼 CHOOSE YOUR CAREER</button>' +
    '<button class="btn" data-action="nav-lucky">🎁 LUCKY DIP<small>Let fate pick your profession — mystery box style</small></button>' +
    (hasAch ? '<button class="btn ghost" data-action="nav-ach">🏆 Achievements</button>' : "") +
    '<button class="btn ghost" data-action="nav-help">❔ How to Play</button>'
  );
}

function renderSelect() {
  showGameChrome(false);
  let cards = "";
  CAREERS.forEach((c) => {
    const skills = Object.keys(c.skills).map((k) => k + " " + dots(c.skills[k])).join(" · ");
    cards +=
      '<div class="career-card" data-action="pick-career" data-id="' + c.id + '">' +
        '<div class="head"><div class="ico">' + c.icon + '</div><div><div class="name">' + esc(c.name) + "</div>" +
        '<div class="dim">' + esc(c.tagline) + "</div></div></div>" +
        '<p style="margin-top:8px">' + esc(c.blurb) + "</p>" +
        '<div class="meta">' +
          '<span class="chip green">Start ' + fmt(c.startMoney) + "</span>" +
          '<span class="chip gold">Rent ' + fmt(c.rent) + "/wk</span>" +
          '<span class="chip">' + esc(c.startKit.join(" + ")) + "</span>" +
        "</div>" +
        '<p class="dim" style="margin-top:8px">Skills: ' + skills + "</p>" +
        '<p class="dim" style="margin-top:4px">⚠ ' + esc(c.challenge) + "</p>" +
      "</div>";
  });
  renderStage(
    '<h2 class="center">Choose Your Career</h2>' +
    '<p class="dim center">Six episodes each. Every choice changes your money, skills and future.</p>' + cards +
    '<button class="btn ghost" data-action="nav-title">← Back</button>'
  );
}

function renderLucky() {
  showGameChrome(false);
  const shuffled = CAREERS.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  window._lucky = shuffled;
  renderStage(
    '<h2 class="center">🎁 Lucky Dip</h2>' +
    '<p class="dim center" style="margin-top:6px">Three mystery boxes. Three careers. Pick one and that is your life now.</p>' +
    '<div class="boxes">' +
      shuffled.map((c, i) =>
        '<div class="box" data-action="box-pick" data-i="' + i + '">?</div>'
      ).join("") +
    "</div>" +
    '<div id="lucky-reveal"></div>' +
    '<button class="btn ghost" data-action="nav-title">← Back</button>'
  );
}

function openBox(i) {
  const boxes = stage.querySelectorAll(".box");
  boxes.forEach((b) => { b.classList.remove("shaking"); b.style.pointerEvents = "none"; });
  const picked = boxes[i];
  picked.classList.add("shaking");
  setTimeout(() => {
    const c = window._lucky[i];
    picked.innerHTML = '<div class="reveal-ico">' + c.icon + '</div><div class="reveal-name">' + esc(c.name) + "</div>";
    picked.classList.add("opened");
    $("#lucky-reveal").innerHTML =
      '<div class="card pop center">' +
        "<h2>" + c.icon + " " + esc(c.name) + "</h2>" +
        '<p>' + esc(c.tagline) + "</p>" +
        '<p class="dim" style="margin-top:6px">Start ' + fmt(c.startMoney) + " · Rent " + fmt(c.rent) + "/wk · " + esc(c.startKit.join(" + ")) + "</p>" +
      "</div>" +
      '<button class="btn primary" data-action="lucky-start" data-id="' + c.id + '">Start as a ' + esc(c.name) + "</button>";
    document.querySelectorAll(".box").forEach((b, bi) => {
      if (bi !== i) { b.style.opacity = ".35"; b.textContent = "?"; }
    });
  }, 850);
}

function startCareer(id, lucky) {
  S = newState(id);
  S.luckyRun = !!lucky;
  if (lucky) awardAch("lucky");
  startEpisode();
}

function startEpisode() {
  S.phase = "episode";
  S.eventDone = false;
  S.eventRef = null;
  renderHUD();
  showGameChrome(true);
  renderEpisode();
  save();
}

function currentChoices() {
  if (S.phase === "event" || S.phase === "event-result") return eventObj().choices;
  return career().episodes[S.ep].choices;
}

function eventObj() {
  if (S.eventRef.type === "career") return career().events[S.eventRef.idx];
  return GENERIC_EVENTS[S.eventRef.idx];
}

function renderEpisode() {
  const c = career();
  const ep = c.episodes[S.ep];
  renderStage(
    '<div style="text-align:center;margin:4px 0 10px"><span class="ep-tag">EPISODE ' + (S.ep + 1) + " / " + c.episodes.length + "</span></div>" +
    '<div class="card"><h2>' + esc(ep.title) + "</h2><p class='story'>" + esc(ep.text) + "</p></div>" +
    '<h3 class="dim" style="margin:12px 0 4px">WHAT DO YOU DO?</h3>' +
    choiceButtons(ep.choices)
  );
}

function choiceButtons(choices) {
  return choices.map((ch, i) => {
    const ok = reqMet(ch.req);
    return '<button class="btn" data-action="choice" data-i="' + i + '"' + (ok ? "" : " disabled") + ">" +
      esc(ch.label) +
      (ch.note ? "<small>" + esc(ch.note) + "</small>" : "") +
      (ok ? "" : "<small>🔒 " + esc(reqNote(ch.req)) + "</small>") +
      "</button>";
  }).join("");
}

function onChoice(i) {
  const ch = currentChoices()[i];
  applyFx(ch.fx);
  if (ch.item && !S.items.includes(ch.item)) S.items.push(ch.item);
  renderHUD();
  const deltas = fxSummary(ch);
  if (S.phase === "event") {
    S.phase = "event-result";
    S.eventOut = ch.out;
    S.eventDeltas = deltas;
  } else {
    S.phase = "result";
    S.lastOut = ch.out;
    S.lastDeltas = deltas;
  }
  renderResult();
  save();
}

function renderResult() {
  const isEvent = S.phase === "event-result";
  const out = isEvent ? S.eventOut : S.lastOut;
  const deltas = isEvent ? S.eventDeltas : S.lastDeltas;
  renderStage(
    '<div class="card pop">' +
      "<h3>" + (isEvent ? "Outcome" : "What happened") + "</h3>" +
      "<p class='story'>" + esc(out) + "</p>" +
      '<div class="result-deltas">' + (deltas || "") + "</div>" +
    "</div>" +
    '<button class="btn primary" data-action="result-continue">' + (isEvent ? "Back to the week" : "Continue") + "</button>"
  );
}

/* result continue: maybe a random event, then the weekly business report */
function afterResult() {
  if (S.phase === "event-result") { gotoHub(); return; }
  if (S.phase === "result" && !S.eventDone && S.ep < career().episodes.length - 1 && Math.random() < 0.5) {
    showEvent();
  } else {
    gotoHub();
  }
}

function showEvent() {
  S.eventDone = true;
  const c = career();
  const pool = [];
  c.events.forEach((e, idx) => pool.push({ type: "career", idx }));
  GENERIC_EVENTS.forEach((e, idx) => pool.push({ type: "generic", idx }));
  // avoid repeats within the run where possible
  const fresh = pool.filter((p) => {
    const e = p.type === "career" ? c.events[p.idx] : GENERIC_EVENTS[p.idx];
    return !(S.seenEvents || []).includes(e.title);
  });
  const pick = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];
  S.eventRef = pick;
  S.phase = "event";
  const e = eventObj();
  renderStage(
    '<div style="text-align:center;margin:4px 0 10px"><span class="ep-tag" style="color:var(--pink);border-color:#7f3a6a">⚡ RANDOM EVENT</span></div>' +
    '<div class="card"><h2>' + esc(e.title) + "</h2><p class='story'>" + esc(e.text) + "</p></div>" +
    choiceButtons(e.choices)
  );
  S.seenEvents = S.seenEvents || [];
  S.seenEvents.push(e.title);
  save();
}

function gotoHub() {
  const report = tick();
  S.phase = "hub";
  renderHUD();
  renderHub(report);
  save();
}

function renderHub(report) {
  const c = career();
  const r = report || S.lastReport || { revenue: 0, expenses: 0, upkeep: 0, flagExp: 0, interest: 0, profit: 0, notes: [] };
  const weekNo = S.ep + 1;

  let reportHtml =
    '<div class="card">' +
      '<h3>📊 Week ' + weekNo + " Business Report</h3>" +
      '<div class="report-line"><span>Revenue</span><b class="pos">' + fmt(r.revenue) + "</b></div>" +
      '<div class="report-line"><span>Rent</span><b class="negv">-' + fmt(c.rent) + "</b></div>" +
      (r.upkeep ? '<div class="report-line"><span>Equipment upkeep</span><b class="negv">-' + fmt(r.upkeep) + "</b></div>" : "") +
      (r.flagExp ? '<div class="report-line"><span>Operating costs (staff, premises)</span><b class="negv">-' + fmt(r.flagExp) + "</b></div>" : "") +
      (r.interest ? '<div class="report-line"><span>Debt interest</span><b class="negv">-' + fmt(r.interest) + "</b></div>" : "") +
      '<div class="total-line"><span>Weekly profit</span><span class="' + (r.profit >= 0 ? "v pos" : "v negv") + '">' + fmt(r.profit) + "</span></div>" +
      '<p class="dim" style="margin-top:8px">All-time: revenue ' + fmt(S.totalRev) + " · expenses " + fmt(S.totalExp) + " · net " + fmt(S.totalRev - S.totalExp) + "</p>" +
      (r.notes || []).map((n) => '<p class="dim" style="margin-top:4px">⚠ ' + esc(n) + "</p>").join("") +
      (S.stress >= 85 ? '<p class="dim" style="margin-top:4px;color:var(--red)">⚠ You are close to burnout. Rest, seriously.</p>' : "") +
    "</div>";

  // equipment shop
  let shopHtml = '<div class="card"><h3>🧰 Equipment Shop</h3>';
  const owned = S.items;
  c.shop.forEach((it) => {
    const has = owned.includes(it.name);
    shopHtml += '<button class="btn" data-action="hub-buy" data-name="' + esc(it.name) + '"' + (has || S.cash < it.price ? " disabled" : "") + ">" +
      (has ? "✓ " : "") + esc(it.name) + " — " + fmt(it.price) +
      "<small>" + esc(it.desc) + " · upkeep " + fmt(it.upk) + "/wk · +(" + Math.round(it.inc * 100) + "% revenue)</small></button>";
  });
  shopHtml += "</div>";

  // courses
  let courseHtml = '<div class="card"><h3>🎓 Learn & Practise</h3>';
  let anyCourse = false;
  for (const k in S.skills) {
    const lv = S.skills[k];
    if (lv >= 5) continue;
    anyCourse = true;
    const cost = 130 * (lv + 1);
    courseHtml += '<button class="btn" data-action="hub-course" data-skill="' + esc(k) + '"' + (S.cash < cost ? " disabled" : "") + ">" +
      esc(k) + " → level " + (lv + 1) + " (" + dots(lv + 1) + ") — " + fmt(cost) +
      "<small>Paid practice & study. Skills raise your weekly revenue.</small></button>";
  }
  if (!anyCourse) courseHtml += '<p class="dim">Every skill is maxed. You are the standard now.</p>';
  courseHtml += "</div>";

  // money moves
  const canLoan = S.debt < 3000;
  const payAmt = Math.min(S.cash, S.debt);
  let moneyHtml = '<div class="card"><h3>🏦 Money Moves</h3>' +
    '<button class="btn" data-action="hub-rest">🛌 Rest & recover<small>Stress −30 · Satisfaction +2</small></button>' +
    '<button class="btn" data-action="hub-loan"' + (canLoan ? "" : " disabled") + '>💳 Take a business loan<small>+ $800 cash now · $950 debt (5% interest per week)</small></button>' +
    '<button class="btn" data-action="hub-repay"' + (payAmt > 0 ? "" : " disabled") + '>💰 Repay debt — ' + fmt(payAmt) + "<small>Pay down what you can afford</small></button>" +
    "</div>";

  renderStage(
    reportHtml + shopHtml + courseHtml + moneyHtml +
    '<button class="btn primary" data-action="hub-continue">' +
      (S.ep + 1 >= c.episodes.length ? "Face the finale →" : "Next episode →") +
    "</button>"
  );
}

function hubBuy(name) {
  const it = career().shop.find((s) => s.name === name);
  if (!it || S.items.includes(name) || S.cash < it.price) return;
  S.cash -= it.price;
  S.items.push(name);
  renderHUD();
  toast("🧰 Bought: " + name);
  renderHub(S.lastReport);
  save();
}
function hubCourse(skill) {
  const lv = S.skills[skill] || 0;
  const cost = 130 * (lv + 1);
  if (lv >= 5 || S.cash < cost) return;
  S.cash -= cost;
  S.skills[skill] = lv + 1;
  renderHUD();
  toast("🎓 " + skill + " is now level " + (lv + 1));
  renderHub(S.lastReport);
  save();
}
function hubRest() {
  S.stress = clamp(S.stress - 30, 0, 100);
  S.sat = clamp(S.sat + 2, 0, 100);
  renderHUD();
  toast("🛌 You feel human again");
  renderHub(S.lastReport);
  save();
}
function hubLoan() {
  if (S.debt >= 3000) return;
  S.cash += 800;
  S.debt += 950;
  S.hadDebt = true;
  renderHUD();
  toast("💳 Loan received");
  renderHub(S.lastReport);
  save();
}
function hubRepay() {
  const pay = Math.min(S.cash, S.debt);
  if (pay <= 0) return;
  S.cash -= pay;
  S.debt -= pay;
  renderHUD();
  toast("💰 Repaid " + fmt(pay));
  if (S.hadDebt && S.debt === 0) awardAch("debt-free");
  renderHub(S.lastReport);
  save();
}
function hubContinue() {
  S.ep++;
  if (S.ep >= career().episodes.length) {
    renderEnding();
  } else {
    startEpisode();
  }
}

/* ---------------- endings ---------------- */
function computeEnding() {
  const nw = S.cash - S.debt;
  const bossFlags = ["owner", "empire", "employer", "storefront", "studio", "course", "franchise"];
  const isBoss = S.flags.some((f) => bossFlags.includes(f));
  if (S.flags.includes("sold"))
    return { ico: "🏁", id: "cashout", title: "The Cash-Out", text: "You built something real and sold it. The money is banked, the risk is gone, and the next chapter is whatever you decide it is. Not a bad way to end a story that started from zero." };
  if (S.cash <= 0 && S.debt >= 1200 || nw <= -1200)
    return { ico: "🕳️", id: "bankrupt", title: "Rock Bottom", text: "The numbers caught up with you. It happens to most people who try. Rock bottom has a floor, and floors are where you push off from — every skill you learned is still yours. Run it again and start smarter." };
  if (S.stress >= 90)
    return { ico: "🔥", id: "burnout", title: "Burned Out", text: "The business survived. You didn't, quite. Success that costs your health sends you a bill you can't defer. Rest, then rebuild — this time with the boundaries you skipped." };
  if (isBoss && nw >= 4000)
    return { ico: "👑", id: "mogul", title: "Empire Builder", text: "You didn't just master a trade — you built the thing other tradespeople work for. Staff, premises, a name that opens doors. From zero to the person people now ask for advice." };
  if (nw >= 2500)
    return { ico: "🌟", id: "madeit", title: "Made It", text: "Real money in the bank, a reputation that markets itself, and craft you can defend to anyone. The early weeks feel like a different life. That's because they are." };
  if (nw >= 500)
    return { ico: "🌤️", id: "solid", title: "On Solid Ground", text: "No fireworks, no catastrophe: a working business, steady profit, and a client list with your name in it. Every empire was this, once." };
  return { ico: "🌱", id: "grinding", title: "Still Grinding", text: "You're standing. The money is thin and the margins are honest, but the skills are real and the reputation is earned. Most careers look exactly like this in the middle of the story." };
}

function renderEnding() {
  S.phase = "ending";
  const e = computeEnding();
  const c = career();
  if (e.id === "solid" || e.id === "madeit" || e.id === "mogul" || e.id === "cashout") {
    if (S.stress <= 30) awardAch("zen");
  }
  markDone(c.id);
  clearSave();
  showGameChrome(true);
  renderHUD();

  const achHtml = (S.newAch && S.newAch.length)
    ? '<div class="card"><h3>🏆 Achievements earned this run</h3>' +
      S.newAch.map((id) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        return '<div class="ach earned"><div class="ico">' + a.ico + '</div><div><div class="t">' + a.name + '</div><div class="d">' + a.desc + "</div></div></div>";
      }).join("") + "</div>"
    : "";

  renderStage(
    '<div style="text-align:center;margin:10px 0"><span class="ending-icon">' + e.ico + "</span></div>" +
    '<div class="ending-title">' + e.title + "</div>" +
    '<p class="dim center" style="margin-top:6px">' + esc(c.name) + " · 6 episodes complete</p>" +
    '<div class="card"><p class="story">' + esc(e.text) + "</p>" +
    '<p class="story" style="margin-top:8px;font-style:italic">' + esc(c.epilogue) + "</p></div>" +
    '<div class="card"><h3>📈 Final Ledger</h3><div class="statgrid">' +
      stat("Cash", fmt(S.cash), S.cash > 0 ? "pos" : "negv") +
      stat("Debt", fmt(S.debt), S.debt > 0 ? "negv" : "pos") +
      stat("Net worth", fmt(S.cash - S.debt), S.cash - S.debt >= 0 ? "pos" : "negv") +
      stat("Reputation", S.rep + "/100", S.rep >= 60 ? "pos" : "") +
      stat("Total revenue", fmt(S.totalRev), "gold") +
      stat("Total expenses", fmt(S.totalExp), S.totalExp > S.totalRev ? "negv" : "") +
      stat("Satisfaction", S.sat + "/100", "") +
      stat("Stress", S.stress + "/100", S.stress >= 70 ? "negv" : "pos") +
    '</div></div>' + achHtml +
    '<button class="btn primary" data-action="ending-replay">🔁 Replay this career</button>' +
    '<button class="btn" data-action="ending-select">💼 Try another career</button>' +
    '<button class="btn ghost" data-action="ending-ach">🏆 All achievements</button>' +
    '<button class="btn ghost" data-action="nav-title">🏠 Main menu</button>'
  );

  function stat(k, v, cls) {
    return '<div class="stat"><div class="k">' + k + '</div><div class="v ' + cls + '">' + v + "</div></div>";
  }
}

/* ---------------- achievements & help screens ---------------- */
function renderAch() {
  const have = getAch();
  const done = loadJSON(DONE_KEY, []);
  showGameChrome(false);
  let html = '<h2 class="center">🏆 Achievements</h2>' +
    '<p class="dim center">' + have.length + " of " + ACHIEVEMENTS.length + " unlocked · careers completed: " + done.length + "/" + CAREERS.length + "</p>";
  ACHIEVEMENTS.forEach((a) => {
    const got = have.includes(a.id);
    html += '<div class="ach ' + (got ? "earned" : "locked") + '"><div class="ico">' + a.ico + "</div><div><div class='t'>" + a.name + "</div><div class='d'>" + a.desc + "</div></div></div>";
  });
  html += '<button class="btn ghost" data-action="nav-title" style="margin-top:12px">← Back</button>';
  renderStage(html);
}

function renderHelp() {
  showGameChrome(false);
  renderStage(
    '<div class="card"><h2>❔ How to Play</h2>' +
    '<p class="story" style="margin-top:6px">Each career plays through six episodes. Every episode is a situation with choices — and every choice moves your numbers.</p>' +
    '<hr class="soft">' +
    '<div class="statgrid">' +
      stat("💵 Cash", "Your money. Rent and upkeep come out weekly.") +
      stat("⭐ Reputation", "Brings customers and unlocks opportunities.") +
      stat("😊 Satisfaction", "How happy clients are. High scores compound.") +
      stat("😰 Stress", "Greed and grind raise it. It cuts your income.") +
      stat("🎓 Skills", "Practice to raise them. They drive revenue.") +
      stat("🧰 Equipment", "Buy gear in the weekly hub. It boosts income.") +
    "</div>" +
    '<hr class="soft">' +
    "<p class='story'>Between episodes you get a <b>weekly business report</b> with your revenue, expenses and profit, then a hub to buy equipment, learn skills, rest, borrow or repay debt. Watch for random events, difficult customers and surprise bills. Finish six episodes to reach one of several endings — then replay another career.</p>" +
    "</div>" +
    '<button class="btn ghost" data-action="nav-title">← Back</button>'
  );
  function stat(k, v) { return '<div class="stat"><div class="k">' + k + '</div><div class="v" style="font-size:12.5px;font-weight:500;color:var(--muted)">' + v + "</div></div>"; }
}

/* ---------------- pause menu ---------------- */
function openMenu() {
  modal.classList.remove("hidden");
  modal.innerHTML = '<div class="sheet">' +
    "<h2 class='center'>⏸ Paused</h2>" +
    '<button class="btn primary" data-action="menu-resume">▶ Resume</button>' +
    '<button class="btn" data-action="menu-restart">🔁 Restart this career</button>' +
    '<button class="btn ghost" data-action="menu-quit">🏠 Main menu (progress lost)</button>' +
    "</div>";
}
function closeMenu() { modal.classList.add("hidden"); modal.innerHTML = ""; }

/* ---------------- event wiring ---------------- */
stage.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  switch (a) {
    case "nav-title": renderTitle(); break;
    case "nav-select": renderSelect(); break;
    case "nav-lucky": renderLucky(); break;
    case "nav-ach": renderAch(); break;
    case "nav-help": renderHelp(); break;
    case "pick-career": startCareer(el.dataset.id, false); break;
    case "box-pick": openBox(Number(el.dataset.i)); break;
    case "lucky-start": startCareer(el.dataset.id, true); break;
    case "choice": {
      onChoice(Number(el.dataset.i));
      break;
    }
    case "result-continue": {
      afterResult();
      break;
    }
    case "hub-buy": hubBuy(el.dataset.name); break;
    case "hub-course": hubCourse(el.dataset.skill); break;
    case "hub-rest": hubRest(); break;
    case "hub-loan": hubLoan(); break;
    case "hub-repay": hubRepay(); break;
    case "hub-continue": hubContinue(); break;
    case "ending-replay": startCareer(S.careerId, false); break;
    case "ending-select": renderSelect(); break;
    case "ending-ach": renderAch(); break;
  }
});

hud.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  if (el.dataset.action === "menu-open") openMenu();
});

modal.addEventListener("click", (ev) => {
  if (ev.target === modal) { closeMenu(); return; }
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  switch (el.dataset.action) {
    case "menu-resume": closeMenu(); break;
    case "menu-restart": closeMenu(); startCareer(S.careerId, S.luckyRun); break;
    case "menu-quit": closeMenu(); renderTitle(); break;
  }
});

/* ---------------- boot ---------------- */
(function boot() {
  const saveData = loadJSON(SAVE_KEY, null);
  if (saveData && saveData.careerId) {
    S = saveData;
    renderHUD();
    showGameChrome(true);
    if (S.phase === "hub") renderHub(null);
    else if (S.phase === "event" || S.phase === "event-result") {
      if (S.phase === "event") {
        const e = eventObj();
        renderStage(
          '<div style="text-align:center;margin:4px 0 10px"><span class="ep-tag" style="color:var(--pink);border-color:#7f3a6a">⚡ RANDOM EVENT</span></div>' +
          '<div class="card"><h2>' + esc(e.title) + "</h2><p class='story'>" + esc(e.text) + "</p></div>" +
          choiceButtons(e.choices)
        );
      } else {
        renderResult();
      }
    } else if (S.phase === "result") {
      renderResult();
    } else renderEpisode();
  } else {
    renderTitle();
  }
})();

/* ---------------- hidden self-test (#test) ----------------
   Simulates one full run of every career by always taking the
   first choice. Prints results to the console. Not reachable
   in normal play and clears its own storage afterwards.      */
(function testHook() {
  if (location.hash === "#demo") {
    setTimeout(() => {
      startCareer("developer", false);
      S.skills["JavaScript"] = 3;
      S.items.push("Mechanical keyboard & chair");
      S.flags.push("contractor");
      S.cash += 400; S.totalRev = 2400; S.totalExp = 1800;
      startEpisode();
      onChoice(0);
      afterResult();
      if (S.phase === "event") { onChoice(0); }
      if (S.phase === "event-result") { afterResult(); }
      if (S.phase === "result") { afterResult(); }
    }, 50);
    return;
  }
  if (location.hash !== "#test") return;
  setTimeout(() => {
    const results = [];
    CAREERS.forEach((c) => {
      startCareer(c.id, false);
      let steps = 0;
      while (S && S.phase !== "ending" && steps < 300) {
        steps++;
        switch (S.phase) {
          case "episode": onChoice(0); break;
          case "result": case "event-result": afterResult(); break;
          case "event": onChoice(0); break;
          case "hub": hubContinue(); break;
          default: steps = 999;
        }
      }
      results.push(
        c.id + ": " + (S ? S.phase + " cash=" + Math.round(S.cash) + " debt=" + Math.round(S.debt) + " stress=" + S.stress + " rep=" + S.rep + " steps=" + steps : "STUCK")
      );
      S = null;
    });
    console.log("TEST RESULTS (all careers, choice 0 always):");
    results.forEach((r) => console.log("  " + r));
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(ACH_KEY); localStorage.removeItem(DONE_KEY); } catch (e) {}
    renderTitle();
  }, 50);
})();