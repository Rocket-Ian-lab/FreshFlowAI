// 입고 전 공백(브리지) 시간축 검증 — "61.8시간 뒤 들어오는 물량이 14시간 뒤 품절을 어떻게 막는가"에 대한 답
// 엔진은 소스에서 직접 로드(test_helpers.mjs). 엔진은 변경하지 않고 lib/bridge.js가 추천의 실행 가능성을 별도 검증한다.
import { loadEngine, CRISIS, makeCheck } from "./test_helpers.mjs";
import { planBridge, simulate } from "./lib/bridge.js";

const E = loadEngine();
const { check, done } = makeCheck();
const won = (w) => "₩" + Math.round(w).toLocaleString();

const lt = E.computeLeadtime(CRISIS).total;      // 61.82h
const ltDays = lt / 24;
const rec = E.recommend(E.FC_INIT, ltDays, 4000);
const inbound = Object.fromEntries(rec.after.map((f, i) => [f.id, f.stock - E.FC_INIT[i].stock]).filter(([, q]) => q > 0));
const afterRisk = E.assess(rec.after, ltDays);
const price = 12000;                             // 칠레산 체리
const cost = E.computeCostImpact(E.FC_INIT, rec.after, ltDays, 4000, price);

console.log(`위기 리드타임 ${lt.toFixed(2)}h · 신규 선적 배정 ${JSON.stringify(inbound)}`);

// 1) 엔진 사실 확인 (문서·발표 수치의 기준)
check("엔진: 선제배치 후 High 0개, 인천·용인은 Medium", afterRisk.filter((f) => f.risk === "High").length === 0 && afterRisk[0].risk === "Medium" && afterRisk[2].risk === "Medium", afterRisk.map((f) => `${f.name} ${f.risk}`).join(" · "));
check("엔진 비용모델(정적): 결품 3,567 · 잉여 2,663 · 순절감 90%", cost.before.stockoutUnits === 3567 && cost.before.overUnits === 2663 && Math.round(cost.saved / cost.before.total * 100) === 90, `${won(cost.before.total)} → ${won(cost.after.total)}`);

// 2) 브리지 없이: 신규 선적 도착 전에 품절
const none = simulate(E.FC_INIT, lt);
check("브리지 없으면 도착 전 품절 수량 = 비용모델의 결품 수량", Math.abs(none.shortage - cost.before.stockoutUnits) <= 2, `${none.shortage}개 (용인 ${none.perFc[2].shortage} · 인천 ${none.perFc[0].shortage})`);

// 3) 안전 모드: 보내는 FC의 안전재고 1.5일 유지
const safe = planBridge(E.FC_INIT, lt, { inbound });
const yg = safe.receivers.find((r) => r.name === "용인 FC"), ic = safe.receivers.find((r) => r.name === "인천 FC");
check("소진 시각: 용인 14.0h · 인천 33.6h — 둘 다 신규 선적 도착(61.8h) 전", yg.stockoutAt === 14 && ic.stockoutAt === 33.6 && lt > 33.6);
check("안전 모드: 브리지 2,663개(=잉여) · 잔여 부족 904개", safe.totals.bridged === 2663 && safe.totals.residual === 904, safe.donors.map((d) => `${d.name} −${d.given}(안전재고 ${d.safetyAfterDays}일)`).join(" · "));
check("안전 모드 시뮬레이션: 품절 ≈ 잔여 부족, 수용량 초과 없음", Math.abs(safe.check.shortage - 904) <= 3 && safe.check.capacityOk, `sim ${safe.check.shortage}개`);
check("보내는 FC 안전재고 유지(≥1.5일)", safe.donors.every((d) => d.safetyAfterDays >= 1.5));

// 4) 전량 모드: 안전재고를 필요한 만큼만 낮춰 전량 메움
const full = planBridge(E.FC_INIT, lt, { inbound, keepSafetyDays: "min" });
const fy = full.receivers.find((r) => r.name === "용인 FC");
check("전량 모드: 잔여 부족 0, 시뮬레이션 품절 ≈ 0", full.totals.residual === 0 && full.check.shortage <= 3, `브리지 ${full.totals.bridged}개 · sim ${full.check.shortage}개`);
check("전량 모드의 대가: 보내는 FC 안전재고 1.5일 → 약 1.0일", full.donors.every((d) => d.safetyAfterDays >= 0.95 && d.safetyAfterDays < 1.1), full.donors.map((d) => `${d.name} ${d.safetyAfterDays}일`).join(" · "));
check("용인은 수용량 2,500 때문에 분할 입고(2차 이상), 초과 없음", fy.waves.length >= 2 && full.check.capacityOk, fy.waves.map((w) => `${w.at}h ${w.qty}개`).join(" → "));
check("신규 선적 도착 시점 수용량 OK(재고가 소비된 뒤라 3,141 정적 합계와 다름)", full.arrival.every((a) => a.fits), full.arrival.map((a) => `${a.name} ${a.stockAtArrival}+${a.inbound}≤${a.capacity}`).join(" · "));

// 5) 이관이 소진보다 늦으면 '방지 불가'로 남긴다
const late = planBridge(E.FC_INIT, lt, { inbound, transferHours: 20 });
check("이관 20h 소요 시 용인은 6h 공백 → feasible=false", late.receivers.find((r) => r.name === "용인 FC").lateHours === 6 && late.receivers.find((r) => r.name === "용인 FC").feasible === false);

// 6) 시간축을 반영한 비용 (비용 단가는 엔진 COST 그대로)
const C = E.COST;
const timeCost = (p) => p.totals.residual * price * C.lostMargin + 4000 * C.inbound + p.totals.bridged * C.transfer;
const pct = (after) => Math.round((1 - after / cost.before.total) * 1000) / 10;
const cs = timeCost(safe), cf = timeCost(full);
console.log(`\n[비용] 적용 전 ${won(cost.before.total)}`);
console.log(`  정적 비용모델(엔진)      : ${won(cost.after.total)} → ${pct(cost.after.total)}% 감소 (이관 2,663개로 결품 0 가정)`);
console.log(`  시간축·안전 모드          : ${won(cs)} → ${pct(cs)}% 감소 (잔여 부족 904개 반영)`);
console.log(`  시간축·전량 모드          : ${won(cf)} → ${pct(cf)}% 감소 (안전재고 1.5→1.0일)`);
check("시간축 반영 절감률: 안전 78.8% · 전량 87.9% (정적 모델 90%보다 낮다)", pct(cs) === 78.8 && pct(cf) === 87.9 && pct(cost.after.total) > pct(cf));

done();
