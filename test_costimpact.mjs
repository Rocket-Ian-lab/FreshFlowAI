// 비용 임팩트(Before/After) 로직 검증 — UI 반영 전 수치 확인 (개발원칙 2)
// 적용 전(선제조치 X): 현재 재고 그대로 → 결품 + 과재고 폐기 발생.
// 적용 후(FreshFlow): 신규선적 배치 + 과재고 이관 → 결품·폐기 감소, 대신 운송비 투입.
const FC_INIT = [
  { name: "인천", stock: 1400, demand: 1000, safety: 1.5 },
  { name: "김포", stock: 5200, demand: 1000, safety: 1.5 },
  { name: "용인", stock: 700,  demand: 1200, safety: 1.5 },
  { name: "안성", stock: 4800, demand: 800,  safety: 1.5 },
];
const ltDays = 61.8 / 24;          // 위기 = 2.575일
const after = FC_INIT.map((f) => ({ ...f }));
after[0].stock += 1559; after[2].stock += 2441; // 선제배치 검증값

const COST = { lostMargin: 0.30, spoilRate: 0.50, inbound: 250, transfer: 700 };
const target = (f) => (f.safety + ltDays) * f.demand;
const stockoutU = (f) => Math.max(0, Math.round(ltDays * f.demand - f.stock));
const overU = (f) => Math.max(0, Math.round(f.stock - target(f)));
const roomU = (f) => Math.max(0, Math.round(target(f) - f.stock));

function impact(beforeFcs, afterFcs, vol, price) {
  let soB = 0, exB = 0;
  for (const f of beforeFcs) { soB += stockoutU(f); exB += overU(f); }
  const before = { so: soB, ex: exB, soCost: soB * price * COST.lostMargin, exCost: exB * price * COST.spoilRate, trCost: 0 };
  before.total = before.soCost + before.exCost;

  let soA = 0, totalOver = 0, totalRoom = 0;
  for (const f of afterFcs) { soA += stockoutU(f); totalOver += overU(f); totalRoom += roomU(f); }
  const moved = Math.min(totalOver, totalRoom);
  const overAfter = totalOver - moved;
  const placed = Math.min(vol, beforeFcs.reduce((a, f) => a + roomU(f), 0));
  const trCost = placed * COST.inbound + moved * COST.transfer;
  const after = { so: soA, ex: overAfter, soCost: soA * price * COST.lostMargin, exCost: overAfter * price * COST.spoilRate, trCost, moved, placed };
  after.total = after.soCost + after.exCost + after.trCost;
  return { before, after, saved: before.total - after.total };
}

const won = (w) => "₩" + Math.round(w).toLocaleString();
const r = impact(FC_INIT, after, 4000, 12000); // 위기·체리
console.log("[적용 전] 결품", r.before.so, "개", won(r.before.soCost), "· 폐기", r.before.ex, "개", won(r.before.exCost), "· 운송 ₩0 · 합계", won(r.before.total));
console.log("[적용 후] 결품", r.after.so, "개", won(r.after.soCost), "· 폐기", r.after.ex, "개", won(r.after.exCost), "· 운송(배치", r.after.placed, "+이관", r.after.moved, ")", won(r.after.trCost), "· 합계", won(r.after.total));
console.log("[순절감]", won(r.saved), `(${Math.round(r.saved / r.before.total * 100)}%)`);
