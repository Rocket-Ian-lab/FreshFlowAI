// lib/bridge.js — 입고 전 공백(브리지) 시간축 검증기
//
// 왜 필요한가: 엔진의 recommend()는 신규 선적을 '즉시' 재고에 더해 정적 커버리지를 본다.
// 그러나 신규 선적은 리드타임(ltHours) 뒤에야 FC에 들어온다. 그 전에 재고가 소진되는 FC는
// 신규 선적만으로는 품절을 막을 수 없고, 다른 FC의 기존 재고를 먼저 이관(브리지)해야 한다.
// 이 모듈은 엔진을 바꾸지 않고, 추천이 시간축에서 실행 가능한지 별도로 검증한다.
//
// 가정(명시): 수요는 시간당 균등(demand/24), FC 간 이관 소요 transferHours(피킹·상차·운송, 기본 6h),
// 이관은 지금 출발, 받는 FC는 수용량(capacity)을 넘지 않도록 분할 입고. 검증: test_bridge.mjs

const r1 = (v) => Math.round(v * 10) / 10;

// opts.keepSafetyDays: 보내는 FC가 신규 선적 도착 시점에 남겨야 할 안전재고 일수.
//   미지정 → 각 FC의 safety 그대로(안전 모드). 숫자 → 그만큼만 남기고 더 보냄. "min" → 전량 메우는 데 필요한 최소 수준까지만 헐기.
// opts.inbound: { [fcId]: 신규 선적 배정량 } — 도착 시점 수용량 점검에 사용.
export function planBridge(fcs, ltHours, opts = {}) {
  const transferHours = opts.transferHours ?? 6;
  const bufferHours = opts.bufferHours ?? 4;        // 분할 입고 시 다음 차수가 도착할 때 남겨둘 재고(시간분)
  const ltDays = ltHours / 24;
  const rate = (f) => f.demand / 24;

  const recv = fcs
    .map((f) => ({ f, stockoutAt: f.stock / rate(f), need: Math.max(0, Math.ceil(rate(f) * ltHours - f.stock)) }))
    .filter((x) => x.need > 0)
    .sort((a, b) => a.stockoutAt - b.stockoutAt);   // 먼저 소진되는 FC부터
  const totalNeed = recv.reduce((a, x) => a + x.need, 0);

  // 보내는 FC가 남길 안전재고 일수 결정
  const donorPool = fcs.filter((f) => !recv.some((x) => x.f.id === f.id));
  let keepOf = (f) => f.safety;
  if (opts.keepSafetyDays === "min") {
    const sumStock = donorPool.reduce((a, f) => a + f.stock, 0), sumDemand = donorPool.reduce((a, f) => a + f.demand, 0);
    const k = Math.max(0, (sumStock - ltDays * sumDemand - totalNeed) / (sumDemand || 1)); // 전량 커버에 필요한 최소 안전일수
    keepOf = (f) => Math.min(f.safety, Math.floor(k * 100) / 100);
  } else if (typeof opts.keepSafetyDays === "number") {
    keepOf = (f) => Math.min(f.safety, opts.keepSafetyDays);
  }
  const donors = donorPool
    .map((f) => ({ f, keep: keepOf(f), spare: Math.max(0, Math.floor(f.stock - (ltDays + keepOf(f)) * f.demand)), given: 0 }))
    .sort((a, b) => b.spare - a.spare);

  // 배정 + 수용량을 넘지 않는 분할 입고(차수) 계획
  const receivers = recv.map(({ f, stockoutAt, need }) => {
    let remaining = need, covered = 0;
    const sources = [];
    for (const d of donors) {
      if (remaining <= 0) break;
      const mv = Math.min(remaining, d.spare - d.given);
      if (mv <= 0) continue;
      d.given += mv; remaining -= mv; covered += mv;
      sources.push({ from: d.f.name, fromId: d.f.id, qty: mv });
    }
    // 차수: 첫 차는 transferHours에 도착. 수용량이 모자라면 재고가 buffer까지 내려갈 때 다음 차 도착.
    const waves = [];
    let t = transferHours, stock = Math.max(0, f.stock - rate(f) * t), left = covered;
    const lateHours = Math.max(0, transferHours - stockoutAt);       // 첫 차가 오기 전에 이미 소진된 시간
    while (left > 0 && t < ltHours) {
      const room = f.capacity != null ? Math.max(0, Math.floor(f.capacity - stock)) : left;
      const qty = Math.min(left, room);
      if (qty <= 0) break;
      waves.push({ at: r1(t), qty });
      stock += qty; left -= qty;
      const floor = rate(f) * bufferHours;
      const dt = Math.max(1, (stock - floor) / rate(f));
      stock -= rate(f) * dt; t += dt;
    }
    return {
      id: f.id, name: f.name, stockoutAt: r1(stockoutAt), need, covered, residual: need - covered,
      sources, waves, lateHours: r1(lateHours), feasible: lateHours === 0 && left === 0,
    };
  });

  const donorOut = donors.filter((d) => d.given > 0).map((d) => ({
    id: d.f.id, name: d.f.name, spare: d.spare, given: d.given,
    safetyAfterDays: Math.round(((d.f.stock - d.given) / d.f.demand - ltDays) * 100) / 100, // 도착 시점에 남는 안전재고(일)
  }));

  // 신규 선적 도착 시점 수용량 점검
  const inbound = opts.inbound || {};
  const arrival = fcs.filter((f) => inbound[f.id]).map((f) => {
    const rc = receivers.find((x) => x.id === f.id);
    const dn = donorOut.find((x) => x.id === f.id);
    const stockAt = Math.max(0, f.stock + (rc ? rc.covered : 0) - (dn ? dn.given : 0) - rate(f) * ltHours);
    return { id: f.id, name: f.name, stockAtArrival: Math.round(stockAt), inbound: inbound[f.id], capacity: f.capacity, fits: f.capacity == null || stockAt + inbound[f.id] <= f.capacity };
  });

  const bridged = receivers.reduce((a, x) => a + x.covered, 0);
  const plan = { ltHours: r1(ltHours), transferHours, receivers, donors: donorOut, arrival, totals: { need: totalNeed, bridged, residual: totalNeed - bridged } };
  plan.check = simulate(fcs, ltHours, plan);
  return plan;
}

// 시간축 재고 시뮬레이션(0 → ltHours, 6분 간격): 품절 수량·수용량 초과 여부를 계획과 독립적으로 검산.
export function simulate(fcs, ltHours, plan = null) {
  const step = 0.1;
  const transferHours = plan?.transferHours ?? 0;
  const ev = []; // { at, id, qty }  (+입고 / −출고)
  for (const rc of plan?.receivers ?? []) {
    const total = rc.covered || 1;
    for (const w of rc.waves) {
      ev.push({ at: w.at, id: rc.id, qty: w.qty });
      for (const s of rc.sources) ev.push({ at: Math.max(0, w.at - transferHours), id: s.fromId, qty: -(s.qty * w.qty) / total }); // 차수 비율대로 출고
    }
  }
  let shortage = 0, capacityOk = true;
  const perFc = fcs.map((f) => {
    let stock = f.stock, lost = 0, peak = f.stock;
    const mine = ev.filter((e) => e.id === f.id).sort((a, b) => a.at - b.at);
    let k = 0;
    for (let t = 0; t < ltHours - 1e-9; t += step) {
      while (k < mine.length && mine[k].at <= t + 1e-9) { stock += mine[k].qty; k++; }
      peak = Math.max(peak, stock);
      const dem = (f.demand / 24) * Math.min(step, ltHours - t);
      if (stock >= dem) stock -= dem; else { lost += dem - stock; stock = 0; }
    }
    if (f.capacity != null && peak > f.capacity + 0.5) capacityOk = false;
    shortage += lost;
    return { id: f.id, name: f.name, shortage: Math.round(lost), peak: Math.round(peak), endStock: Math.round(stock) };
  });
  return { shortage: Math.round(shortage), capacityOk, perFc };
}
