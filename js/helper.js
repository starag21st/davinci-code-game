/**
 * Da Vinci Code - Smart Deduction Helper & Probability Engine
 * Solves Constraint Satisfaction Problems (CSP) for exact card probability calculation.
 * Uses full Recursive Backtracking to test valid hand assignments.
 */

export class DeductionHelper {
  constructor() {
    // 수동/자동 소거 매트릭스 상태: { tileId: Set<value> }
    this.matrixEliminations = new Map();
    this.autoDeduceEnabled = true;
  }

  /**
   * 상대방 손패 타일의 정밀 확률 분포 계산 (Full Backtracking CSP Engine)
   * @param {Tile[]} targetHand - 상대방 손패
   * @param {Tile[]} myHand - 내 손패
   * @param {Array} guessHistory - 과거 지목 히스토리
   * @param {'none'|'deck_only'|'allow_start'} jokerRule - 조커 규칙
   * @returns {Map<string, Object<string|number, number>>} tileId -> { value: probabilityPercentage }
   */
  calculateProbabilities(targetHand, myHand, guessHistory = [], jokerRule = 'deck_only') {
    const results = new Map();

    // 1. 이미 차단된(사용된) 타일 집합 (내 손패 + 공개된 상대 타일)
    const usedTiles = new Set();
    myHand.forEach(t => usedTiles.add(`${t.color}-${t.value}`));
    targetHand.forEach(t => {
      if (t.isRevealed) {
        usedTiles.add(`${t.color}-${t.value}`);
      }
    });

    // 2. 과거 지목 실패 히스토리 (tileId -> Set of failed values)
    const failedGuessesPerTile = new Map();
    guessHistory.forEach(h => {
      if (h.targetTileId && !h.success) {
        if (!failedGuessesPerTile.has(h.targetTileId)) {
          failedGuessesPerTile.set(h.targetTileId, new Set());
        }
        failedGuessesPerTile.get(h.targetTileId).add(String(h.guessedValue));
      }
    });

    // 3. 남아있는 사용 가능한 전체 타일 덱 후보 풀 구축
    const availableBlackValues = [];
    const availableWhiteValues = [];

    for (let v = 0; v <= 11; v++) {
      if (!usedTiles.has(`black-${v}`)) availableBlackValues.push(v);
      if (!usedTiles.has(`white-${v}`)) availableWhiteValues.push(v);
    }
    const availableBlackJoker = (jokerRule !== 'none' && !usedTiles.has('black--'));
    const availableWhiteJoker = (jokerRule !== 'none' && !usedTiles.has('white--'));

    // 4. 각 비공개 타일 위치별 개별 후보군 산출
    const tileCandidatesMap = new Map();

    targetHand.forEach((tile) => {
      if (tile.isRevealed) {
        tileCandidatesMap.set(tile.id, [tile.value]);
        return;
      }

      const failedSet = failedGuessesPerTile.get(tile.id) || new Set();
      const manualEliminated = this.matrixEliminations.get(tile.id) || new Set();

      const candidates = [];
      const pool = (tile.color === 'black') ? availableBlackValues : availableWhiteValues;

      pool.forEach(v => {
        if (!failedSet.has(String(v)) && !(this.autoDeduceEnabled && manualEliminated.has(String(v)))) {
          candidates.push(v);
        }
      });

      const hasJokerInPool = (tile.color === 'black') ? availableBlackJoker : availableWhiteJoker;
      if (hasJokerInPool && !failedSet.has('-') && !(this.autoDeduceEnabled && manualEliminated.has('-'))) {
        candidates.push('-');
      }

      tileCandidatesMap.set(tile.id, candidates);
    });

    // 5. 전체 손패 배열에 대해 백트래킹으로 유효한 조합(Valid World Assignments) 카운트
    // validValueCounts: { tileId: { value: count } }
    const validValueCounts = new Map();
    targetHand.forEach(t => {
      validValueCounts.set(t.id, {});
    });

    let totalValidWorlds = 0;

    const currentAssignment = new Array(targetHand.length);

    const solveBacktrack = (index, usedInThisSearch) => {
      if (index === targetHand.length) {
        // 검증: 오름차순 및 규칙 만족 확인
        if (this._isValidHandAssignment(currentAssignment, targetHand)) {
          totalValidWorlds++;
          currentAssignment.forEach((val, i) => {
            const tid = targetHand[i].id;
            const counts = validValueCounts.get(tid);
            counts[val] = (counts[val] || 0) + 1;
          });
        }
        return;
      }

      const tile = targetHand[index];

      if (tile.isRevealed) {
        currentAssignment[index] = tile.value;
        solveBacktrack(index + 1, usedInThisSearch);
        return;
      }

      const candidates = tileCandidatesMap.get(tile.id) || [];
      for (const val of candidates) {
        const key = `${tile.color}-${val}`;
        if (usedInThisSearch.has(key)) continue; // 이 탐색 내에서 같은 카드 중복 할당 불가

        // 가지치기 (Pruning): 오름차순 위반 시 즉시 탐색 중단
        if (index > 0) {
          const prevVal = currentAssignment[index - 1];
          const prevTile = targetHand[index - 1];
          if (prevVal !== '-' && val !== '-') {
            if (prevVal > val) continue;
            if (prevVal === val && prevTile.color === 'white' && tile.color === 'black') continue; // (흑,5) < (백,5) 규칙
          }
        }

        currentAssignment[index] = val;
        usedInThisSearch.add(key);

        solveBacktrack(index + 1, usedInThisSearch);

        usedInThisSearch.delete(key);
      }
    };

    solveBacktrack(0, new Set());

    // 6. 카운트 결과를 기반으로 최종 확률(%) 계산
    targetHand.forEach((tile) => {
      if (tile.isRevealed) {
        const probMap = {};
        probMap[tile.value] = 100;
        results.set(tile.id, probMap);
        return;
      }

      const counts = validValueCounts.get(tile.id) || {};
      const probMap = {};

      if (totalValidWorlds > 0) {
        Object.entries(counts).forEach(([val, cnt]) => {
          const pct = ((cnt / totalValidWorlds) * 100).toFixed(1);
          probMap[val] = parseFloat(pct);
        });
      }

      results.set(tile.id, probMap);
    });

    return results;
  }

  /**
   * 오름차순 및 다빈치코드 정렬 규칙 검증
   */
  _isValidHandAssignment(assignment, targetHand) {
    let lastNum = -1;
    let lastColor = null;

    for (let i = 0; i < assignment.length; i++) {
      const val = assignment[i];
      const color = targetHand[i].color;

      if (val === '-') continue; // 조커는 어디든 배치 가능

      if (lastNum !== -1) {
        if (val < lastNum) return false;
        if (val === lastNum) {
          // 같은 숫자인 경우 검은색 타일이 왼쪽이어야 함
          if (lastColor === 'white' && color === 'black') return false;
        }
      }
      lastNum = val;
      lastColor = color;
    }

    return true;
  }

  /**
   * 플레이어를 위한 최적의 힌트 추천
   */
  getBestHint(probMap, targetHand) {
    let best = null;
    let highestProb = -1;

    targetHand.forEach((tile, index) => {
      if (tile.isRevealed) return;

      const probs = probMap.get(tile.id);
      if (!probs) return;

      Object.entries(probs).forEach(([val, prob]) => {
        if (prob > highestProb) {
          highestProb = prob;
          best = {
            targetTile: tile,
            targetIndex: index + 1,
            recommendedVal: val === '-' ? '조커(-)' : parseInt(val, 10),
            prob: prob
          };
        }
      });
    });

    return best;
  }

  static getHandStateNotation(hand) {
    return hand.map(tile => {
      if (!tile.isRevealed) {
        if (tile.isJoker) return 'J';
        return tile.color === 'white' ? 'W' : 'B';
      } else {
        if (tile.isJoker) return 'j';
        if (tile.value === 10) return 't';
        if (tile.value === 11) return 'e';
        return String(tile.value);
      }
    }).join('');
  }

  static formatValueNotation(val) {
    if (val === '-' || val === 'joker') return 'j';
    const num = parseInt(val, 10);
    if (num === 10) return 't';
    if (num === 11) return 'e';
    return String(val);
  }

  toggleElimination(tileId, val) {
    if (!this.matrixEliminations.has(tileId)) {
      this.matrixEliminations.set(tileId, new Set());
    }
    const set = this.matrixEliminations.get(tileId);
    const strVal = String(val);
    if (set.has(strVal)) {
      set.delete(strVal);
    } else {
      set.add(strVal);
    }
  }

  resetMatrix() {
    this.matrixEliminations.clear();
  }
}
