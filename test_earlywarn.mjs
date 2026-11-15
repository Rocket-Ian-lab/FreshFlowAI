// 조기경보(detectEarlyWarning) 재현 실험 — 시드 고정, 분모 명시
// 엔진 함수는 소스에서 직접 로드. 시계열 생성은 대시보드 모니터링(useEffect)과 동일한 규칙을 옮겨 적었다:
//   1틱=30분, 40틱. 0~12틱 평소 → 이후 점진 악화(cong·cust +0.6, wx·dock +0.2), 관측마다 ±5% 잡음.
//   경보 임계 = '재고 커버리지 2.5일(60h)인 가상 관찰 FC' (실제 4개 FC 중 하나가 아님).
// 한계(정직성): 합성 시계열이다. 실제 운영 데이터에서의 성능이 아니다.
import { loadEngine, rng, makeCheck } from "./test_helpers.mjs";

const { computeLeadtime, detectEarlyWarning } = loadEngine();
const { check, done } = makeCheck();
const TOTAL = 40, THRESH = 2.5 * 24, RUNS = 200;

const riskAt = {
  degrade: (tick) => { const p = Math.max(0, (tick - 12) / (TOTAL - 12)); return { cong: 0.2 + 0.6 * p, cust: 0.2 + 0.6 * p, wx: 0.1 + 0.2 * p, dock: 0.2 + 0.2 * p }; },
  normal: () => ({ cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 }),
  // 임계에 못 미치는 일시적 스파이크 후 회복: 20~22틱만 중간 수준(약 54.7h, 임계의 91%)
  spike: (tick) => (tick >= 20 && tick <= 22 ? { cong: 0.5, cust: 0.45, wx: 0.3, dock: 0.35 } : { cong: 0.2, cust: 0.2, wx: 0.1, dock: 0.2 }),
};

function run(kind, seed) {
  const rand = rng(seed), history = [];
  let warnTick = null, crossTick = null, shownLead = null;
  for (let tick = 1; tick <= TOTAL; tick++) {
    const lt = computeLeadtime(riskAt[kind](tick)).total * (1 + (rand() * 2 - 1) * 0.05);
    history.push(lt);
    const isHigh = lt >= THRESH;
    if (crossTick == null && isHigh) crossTick = tick;
    const ew = detectEarlyWarning(history, THRESH);
    if (warnTick == null && ew.warn && !isHigh) {
      warnTick = tick;
      shownLead = Math.max(1, (THRESH - lt) / (ew.slope > 0 ? ew.slope : 1)) * 0.5; // 화면에 표시되는 외삽 선행시간(h)
    }
  }
  return { warnTick, crossTick, shownLead };
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f1 = (v) => (Number.isNaN(v) ? "-" : v.toFixed(1));

// 1) 점진 악화 200회
const deg = Array.from({ length: RUNS }, (_, i) => run("degrade", 1000 + i));
const crossed = deg.filter((r) => r.crossTick != null);
const warnedBefore = crossed.filter((r) => r.warnTick != null && r.warnTick < r.crossTick);
const actualLead = warnedBefore.map((r) => (r.crossTick - r.warnTick) * 0.5);
const shownLead = warnedBefore.map((r) => r.shownLead);
const detectRate = warnedBefore.length / crossed.length;
console.log(`[점진 악화 ${RUNS}회] 임계(60h) 도달 ${crossed.length}회 · 도달 전 경보 ${warnedBefore.length}회 (${(detectRate * 100).toFixed(1)}%)`);
console.log(`  선행시간 — 실제(임계 도달시각 − 경보시각): 평균 ${f1(mean(actualLead))}h, 최소 ${f1(Math.min(...actualLead))}h, 최대 ${f1(Math.max(...actualLead))}h`);
console.log(`  선행시간 — 화면 표시값(당시 상승률 외삽): 평균 ${f1(mean(shownLead))}h`);

// 2) 정상 지속 200회 (오경보: 분모 = 시나리오 수)
const nor = Array.from({ length: RUNS }, (_, i) => run("normal", 5000 + i));
const falseNormal = nor.filter((r) => r.warnTick != null).length;
console.log(`[정상 지속 ${RUNS}회] 경보 ${falseNormal}회 → 오경보율 ${(falseNormal / RUNS * 100).toFixed(1)}% (분모: 시나리오)`);

// 3) 일시적 스파이크 200회 (임계 미도달·회복 → 경보가 울리면 오경보)
const spk = Array.from({ length: RUNS }, (_, i) => run("spike", 9000 + i));
const spikeCross = spk.filter((r) => r.crossTick != null).length;
const falseSpike = spk.filter((r) => r.warnTick != null && r.crossTick == null).length;
console.log(`[임계 미만 스파이크 ${RUNS}회] 임계 도달 ${spikeCross}회 · 임계 미도달인데 경보 ${falseSpike}회 → ${(falseSpike / RUNS * 100).toFixed(1)}% (알려진 약점: 임계의 90% 근처까지 급등하면 경보가 울린다)`);

check("점진 악화: 임계 도달 전 경보율 ≥ 95%", detectRate >= 0.95, `${(detectRate * 100).toFixed(1)}%`);
check("점진 악화: 실제 선행시간 평균 ≥ 3h", mean(actualLead) >= 3, `${f1(mean(actualLead))}h`);
check("정상 지속: 오경보율 ≤ 2%", falseNormal / RUNS <= 0.02, `${falseNormal}/${RUNS}`);
done();
