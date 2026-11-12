// 衣襟 网页版（第四个，第 18 天 09:05）。照 ~/碰/衣襟/襟.py v3 一句一句搬；随机数换成 mulberry32，跟 py 不是同一串。
var L = 13, GATE = 12;
var WINDY = { 3: "路口", 7: "路口", 11: "门前", 12: "门口" };
var DAYS = ["星期一", "星期二", "星期三", "星期四", "星期五"];
var STRENGTH = [1, 1, 2, 2, 3];
var GAP = [[4, 6], [3, 5], [3, 5], [2, 4], [2, 4]];
var BELL = 22;
var KIDS = ["瓦切克", "维采克", "斯塔希", "约齐奥"];
var SHORT = { "瓦切克": "瓦", "维采克": "维", "斯塔希": "斯", "约齐奥": "约" };
var THINGS = ["纽扣", "石子", "线轴"];
var SPOTS = [1, 2, 4, 5, 6, 8, 9, 10];
var NUM = "零一二三四五六七八九";
var TAKE = {
  "瓦切克": "把{t}放进嘴里咬了咬，揣起来，跟上你，一把攥住你的衣襟。",
  "维采克": "把{t}对着天看了看，说\"好\"，跟上你，攥住你的衣襟。",
  "斯塔希": "接过{t}，什么也没说，跟上你，攥住你的衣襟。",
  "约齐奥": "抢过{t}跑开两步又跑回来，攥住你的衣襟。"
};

function Rng(seed) {
  var a = seed >>> 0;
  this.random = function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  this.choice = function (arr) { return arr[Math.floor(this.random() * arr.length)]; };
  this.randint = function (lo, hi) { return lo + Math.floor(this.random() * (hi - lo + 1)); };
}

function has(arr, x) { return arr.indexOf(x) >= 0; }

function newDay(st, out) {
  var d = st.day;
  var r = new Rng(st.seed * 7919 + d);
  st.pos = 0; st.t = 0; st.jam = null; st.crowdUntil = -1; st.gone = [];
  st.kids = {};
  KIDS.forEach(function (k) { st.kids[k] = r.choice(SPOTS); });
  var gusts = [], t = 0;
  while (t < 40) { t += r.randint(GAP[d][0], GAP[d][1]); gusts.push(t); }
  st.gusts = gusts;
  st.log.push({ day: d, held: [], gate: null, end: null });
  out.push("");
  out.push("—— " + DAYS[d] + " ——");
  if (d === 0) out.push("你从家门出来，往体操学校去。你很轻，路口、门前、门口都有过堂风。");
  else out.push("你又从家门出来。今天比昨天又轻了一点。");
  KIDS.forEach(function (k) {
    if (d > 0 && (k in st.follow) && st.follow[k] === d - 1) {
      var g = st.gifts.filter(function (x) { return x.to === k; }).map(function (x) { return x.thing; });
      out.push(k + "今天没来找你，站在街上玩你给的" + g[g.length - 1] + "。");
    }
  });
  var sp = st.spool;
  if (sp && sp.by) {
    if (d - sp.day < 2) out.push(sp.by + "蹲在墙根削你那个线轴，削出一个尖来了。");
    else if (d - sp.day === 2) out.push(sp.by + "兜里鼓着一个陀螺，是你那个线轴削的，他说今天要在门口甩给大家看。");
  }
}

function followers(st) {
  return KIDS.filter(function (k) { return (k in st.follow) && st.follow[k] >= st.day && !has(st.gone, k); });
}
function topReady(st) { return !!(st.spool && st.spool.by && st.day - st.spool.day >= 2); }
function giftNote(st, k) {
  var g = st.gifts.filter(function (x) { return x.to === k; });
  return g.map(function (x) { return DAYS[x.day] + "你给的" + x.thing; }).join("、");
}

function statusText(st) {
  if (st.over) return "";
  var out = [];
  var f = followers(st);
  out.push(DAYS[st.day] + "，第 " + st.t + " 步（第 " + BELL + " 步打铃）。");
  var stand = KIDS.filter(function (k) { return !has(f, k) && st.kids[k] < L; }).map(function (k) {
    var dd = st.kids[k] - st.pos;
    return k + "在" + (dd === 0 ? "你这儿" : "你" + (dd > 0 ? "前头" : "后头") + Math.abs(dd) + "格");
  });
  if (f.length && st.pos === GATE && st.jam !== null) out.push("跟你挤在门口的：" + f.join("、") + "，都松了手在推。");
  else if (f.length) out.push("拽着你衣襟的：" + f.join("、") + "。");
  else out.push("没有人拽着你。");
  if (stand.length) out.push("街上：" + stand.join("，") + "。");
  if (st.crowdUntil > 0 && st.t < st.crowdUntil) out.push("门口围着一圈人在看陀螺转。");
  if (st.pos === GATE && st.jam) out.push("门口挤成一团，你夹在中间，脚不沾地，还要挤 " + st.jam + " 下才进得去（最后一下就进门）。");
  if (has(st.gusts, st.t + 1) && f.length) out.push(f[0] + "扯了扯你的衣襟，朝地上努嘴：落叶打起转来了。");
  var inv = THINGS.filter(function (t) { return st.inv[t]; }).map(function (t) { return t + st.inv[t]; }).join("，");
  out.push("兜里：" + (inv || "空了") + "。　名册上你名字旁边的圈：" + st.circles + "。");
  return out.join("\n");
}

function endGame(st, out, how) {
  st.over = true;
  out.push("");
  if (how === "卷走") {
    var f = KIDS.filter(function (k) { return (k in st.follow) && st.follow[k] >= st.day; });
    if (f.length) out.push(f[0] + "他们冲进教室，乱伸着手指头喊：\"报告老师，他被风刮走了！\"");
    out.push("老师走到窗前，手搭在眉毛上看了好一会儿天。\"得把他从名册上划掉。\"");
  } else if (how === "圈") {
    out.push("名册上你名字旁边画满了三个圈。老师说：\"得把他从名册上划掉。\"");
  } else {
    out.push("星期五放学了。名册上还有你。");
  }
  out.push("");
  out.push("—— 这一个礼拜 ——");
  st.log.forEach(function (g) {
    out.push(DAYS[g.day] + "：");
    g.held.forEach(function (h) { out.push("  " + h); });
    if (g.gate) out.push("  " + g.gate);
    if (g.end) out.push("  " + g.end);
  });
  if (st.gifts.length) {
    out.push("");
    out.push("你兜里的东西去了哪儿：");
    KIDS.forEach(function (k) { var n = giftNote(st, k); if (n) out.push("  " + k + "：" + n); });
  }
}

function finishDay(st, out, how) {
  var lg = st.log[st.log.length - 1];
  if (how === "进门") {
    st.t += 1;
    lg.end = "第 " + st.t + " 步进了门。";
  } else if (how === "迟到") {
    st.circles += 1;
    lg.end = "铃响了你还没进门，名册上你名字旁边画了一个圈。";
    out.push("铃响了。你进门的时候老师看了你一眼，在名册上你名字旁边画了一个圈。");
  }
  if (st.circles >= 3) { endGame(st, out, "圈"); return; }
  if (st.day === 4) { endGame(st, out, "完"); return; }
  st.day += 1;
  newDay(st, out);
}

function arriveGate(st, out) {
  var f = followers(st);
  var jam = Math.max(0, f.length - 1);
  var who = f.slice();
  if (topReady(st) && has(f, st.spool.by)) {
    jam += 2;
    out.push(st.spool.by + "在门槛前把陀螺一甩，陀螺嗡嗡地转，大家都站住了看。");
  }
  if (st.t < st.crowdUntil) { jam += 2; who.push("看陀螺的那一圈人"); }
  st.jam = jam;
  if (jam) {
    out.push("门窄，" + who.join("、") + "跟你一起往里挤，大家都松了手去推，你夹在中间。");
    st.log[st.log.length - 1].gate = "门口挤着：" + who.map(function (k) {
      return has(KIDS, k) ? k + "（" + giftNote(st, k) + "）" : k;
    }).join("；") + "。";
  }
}

function gust(st, out) {
  var s = STRENGTH[st.day], p = st.pos, lg = st.log[st.log.length - 1];
  out.push("一阵风刮过来。");
  if (!(p in WINDY)) { if (st.saw_wall) { out.push("风从路口那边过去了。"); } else { st.saw_wall = true; out.push("风顺着路口过去了。你站的这一格不是风口，没刮着你。"); } return; }
  if (p === GATE && s < 2 && !st.jam) {
    out.push("风把你托起来半尺，你一把抓住了门框。");
    out.push("这阵风再大一点，你就上去了。");
    lg.held.push("第 " + st.t + " 步在门口被风托起来半尺，你抓住了门框。");
    return;
  }
  if (p === GATE && s < 2) {
    out.push("门口谁也腾不出手来。风把你托起来半尺，后头的人一挤，又把你挤回地上。");
    out.push("这阵风再大一点，你就上去了。");
    lg.held.push("第 " + st.t + " 步在门口被风托起来半尺，是挤着的人把你挤回了地上。");
    return;
  }
  var f = followers(st);
  if (p === GATE) {
    out.push("门口谁也腾不出手来。风从门缝底下把你托起来——");
    out.push("\"亲爱的同学们，救我！\"");
    if (f.length) out.push("你还看见" + f.join("、") + "伸出来的手、张着的嘴。");
    out.push("你翻了一个跟头，往上去了，越过房顶，往黄黄的秋天的天上去了。");
    lg.end = "在门口被风卷走了。";
    endGame(st, out, "卷走");
    return;
  }
  if (f.length >= s) {
    out.push("你脚尖离了地，" + f.join("、") + "把你拽下来了。");
    lg.held.push("第 " + st.t + " 步在" + WINDY[p] + "，" + f.join("、") + "拽住了你。");
  } else {
    var need = NUM[s];
    if (f.length) out.push("你脚尖离了地，" + f.join("、") + "拽不住，这阵风要" + need + "个人才拽得住你。");
    else out.push("没人拽你。这阵风要" + need + "个人才拽得住你。");
    out.push("风把你一路刮回了家门口。");
    if (f.length) out.push(f.join("、") + "追着跑回来，又攥住了你的衣襟。");
    lg.held.push("第 " + st.t + " 步在" + WINDY[p] + "被刮回家门口" + (f.length ? "（拽着的：" + f.join("、") + "）" : "（没人拽着）") + "。");
    st.pos = 0; st.jam = null;
  }
}

function tick(st, out) {
  st.t += 1;
  if (has(st.gusts, st.t)) { gust(st, out); if (st.over) return; }
  if (st.t >= BELL) finishDay(st, out, "迟到");
}

// args: ["走"] ["回"] ["等"] ["松手"] ["松手", 名字] ["给", 名字, 东西]
function act(st, args) {
  var out = [];
  var a = args[0], p = st.pos;
  if (a === "走") {
    if (p === GATE) {
      if (st.jam && st.jam > 1) { st.jam -= 1; out.push("你往里挤了一下。"); }
      else {
        if (st.jam) out.push("你往里挤了最后一下。");
        out.push("你进了门。");
        finishDay(st, out, "进门");
        return out.join("\n");
      }
    } else {
      st.pos = p + 1;
      if (st.pos === GATE) arriveGate(st, out);
    }
  } else if (a === "回") {
    if (p === 0) return "你已经在家门口了。";
    if (p === GATE) st.jam = null;
    st.pos = p - 1;
  } else if (a === "等") {
    out.push("你站着。");
  } else if (a === "松手") {
    var f = followers(st);
    if (!f.length) return "没有人拽着你。";
    if (args.length > 1) {
      if (!has(f, args[1])) return args[1] + "没有拽着你。";
      f = [args[1]];
    }
    var n0 = followers(st).length;
    f.forEach(function (k) { st.kids[k] = L; });
    st.gone = st.gone.concat(f);
    out.push((f.length === 1 ? "你让他松手。" : "你让他们松手。") + f.join("、") + "撒开手，往学校那边跑了。");
    if (p === GATE && st.jam) {
      var drop = Math.max(0, n0 - 1) - Math.max(0, n0 - f.length - 1);
      st.jam = Math.max(0, st.jam - drop);
      out.push(st.jam ? "门口松了一点，还要挤 " + st.jam + " 下。" : "门口一下松开了，再走一下就进门。");
    }
    if (topReady(st) && has(f, st.spool.by) && p !== GATE) {
      st.crowdUntil = st.t + Math.max(1, Math.floor((GATE - p + 1) / 2)) + 4;
      out.push(st.spool.by + "边跑边掏兜里的陀螺。");
    }
  } else if (a === "给") {
    var k = args[1], th = args[2];
    if (st.inv[th] <= 0) return "你兜里没有" + th + "了。";
    if (!has(followers(st), k) && Math.abs(st.kids[k] - p) > 1) return k + "离你太远了，够不着。";
    st.inv[th] -= 1;
    st.gifts.push({ to: k, thing: th, day: st.day });
    if (th === "线轴") {
      st.follow[k] = 4;
      st.spool = { by: k, day: st.day };
      out.push(k + "眼睛亮了，把线轴揣进怀里，说他一直跟着你，攥住了你的衣襟。");
    } else {
      st.follow[k] = Math.max((k in st.follow) ? st.follow[k] : -1, st.day + 1);
      out.push(TAKE[k].replace("{t}", th));
    }
    var gi = st.gone.indexOf(k);
    if (gi >= 0) st.gone.splice(gi, 1);
  }
  tick(st, out);
  return out.join("\n");
}

function newGame(seed) {
  var st = { seed: seed, day: 0, t: 0, pos: 0, inv: { "纽扣": 3, "石子": 3, "线轴": 1 },
    follow: {}, gifts: [], spool: null, circles: 0, log: [], over: false, gone: [] };
  var out = [];
  newDay(st, out);
  st.opening = out.join("\n").replace(/^\n/, "");
  return st;
}

// 能给谁：跟着的，或者在你这格、旁边一格的
function reachable(st) {
  var f = followers(st);
  return KIDS.filter(function (k) { return has(f, k) || (st.kids[k] < L && Math.abs(st.kids[k] - st.pos) <= 1); });
}

if (typeof module !== "undefined") module.exports = { newGame: newGame, act: act, statusText: statusText, followers: followers, reachable: reachable, KIDS: KIDS, THINGS: THINGS, WINDY: WINDY, L: L, GATE: GATE, SHORT: SHORT, NUM: NUM };
