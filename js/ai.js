/**
 * Da Vinci Code - AI Intelligence System
 * Provides 4 levels of AI decision-making (Easy, Medium, Hard, Master).
 */

import { DeductionHelper } from './helper.js';

export class DaVinciAI {
  /**
   * @param {'easy'|'medium'|'hard'|'master'} difficulty 
   */
  constructor(difficulty = 'master') {
    this.difficulty = difficulty;
    this.helper = new DeductionHelper();
  }

  /**
   * AI가 지목할 상대 타일 및 숫자 결정
   * @param {Tile[]} aiHand - AI 자신의 손패
   * @param {Tile[]} userHand - 상대방(플레이어) 손패
   * @param {Array} guessHistory - 지목 기록
   * @param {'none'|'deck_only'|'allow_start'} jokerRule - 조커 규칙
   * @returns {{ targetTile: Tile, guessedValue: number|string }}
   */
  makeDecision(aiHand, userHand, guessHistory = [], jokerRule = 'deck_only') {
    const unrevealedUserTiles = userHand.filter(t => !t.isRevealed);
    if (unrevealedUserTiles.length === 0) return null;

    switch (this.difficulty) {
      case 'easy':
        return this._makeEasyDecision(unrevealedUserTiles, jokerRule);

      case 'medium':
        return this._makeMediumDecision(aiHand, userHand, unrevealedUserTiles, guessHistory, jokerRule);

      case 'hard':
        return this._makeHardDecision(aiHand, userHand, guessHistory, jokerRule);

      case 'master':
      default:
        return this._makeMasterDecision(aiHand, userHand, guessHistory, jokerRule);
    }
  }

  /**
   * Easy AI: 순수 무작위 지목
   */
  _makeEasyDecision(unrevealedUserTiles, jokerRule) {
    const targetTile = unrevealedUserTiles[Math.floor(Math.random() * unrevealedUserTiles.length)];
    const possibleValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (jokerRule !== 'none') possibleValues.push('-');
    
    const guessedValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];
    return { targetTile, guessedValue };
  }

  /**
   * Medium AI: 자신의 카드는 제외하고 무작위 지목
   */
  _makeMediumDecision(aiHand, userHand, unrevealedUserTiles, guessHistory, jokerRule) {
    // 1. 본인 손패 + 공개된 카드 수집
    const knownValues = new Set();
    aiHand.forEach(t => knownValues.add(`${t.color}-${t.value}`));
    userHand.forEach(t => {
      if (t.isRevealed) knownValues.add(`${t.color}-${t.value}`);
    });

    const targetTile = unrevealedUserTiles[Math.floor(Math.random() * unrevealedUserTiles.length)];
    const validCandidates = [];

    for (let val = 0; val <= 11; val++) {
      if (!knownValues.has(`${targetTile.color}-${val}`)) {
        validCandidates.push(val);
      }
    }
    if (jokerRule !== 'none' && !knownValues.has(`${targetTile.color}--`)) {
      validCandidates.push('-');
    }

    const guessedValue = validCandidates.length > 0
      ? validCandidates[Math.floor(Math.random() * validCandidates.length)]
      : Math.floor(Math.random() * 12);

    return { targetTile, guessedValue };
  }

  /**
   * Hard AI: 확률 엔지니어링 기반 최선의 수 선택
   */
  _makeHardDecision(aiHand, userHand, guessHistory, jokerRule) {
    const probMap = this.helper.calculateProbabilities(userHand, aiHand, guessHistory, jokerRule);
    const hint = this.helper.getBestHint(probMap, userHand);

    if (hint) {
      return {
        targetTile: hint.targetTile,
        guessedValue: hint.recommendedVal === '조커(-)' ? '-' : hint.recommendedVal
      };
    }

    // fallback
    return this._makeMediumDecision(aiHand, userHand, userHand.filter(t => !t.isRevealed), guessHistory, jokerRule);
  }

  /**
   * Master AI: 최고 연산 추론 + 적중 확신 타일 선점
   */
  _makeMasterDecision(aiHand, userHand, guessHistory, jokerRule) {
    const probMap = this.helper.calculateProbabilities(userHand, aiHand, guessHistory, jokerRule);
    
    let bestChoice = null;
    let highestProb = -1;

    userHand.forEach((tile) => {
      if (tile.isRevealed) return;

      const probs = probMap.get(tile.id);
      if (!probs) return;

      Object.entries(probs).forEach(([val, prob]) => {
        // 100% 확신이 있는 타일이 존재하면 최우선 지목!
        if (prob >= 99.9) {
          bestChoice = {
            targetTile: tile,
            guessedValue: val === '-' ? '-' : parseInt(val, 10),
            prob: 100
          };
          highestProb = 100;
          return;
        }

        if (prob > highestProb) {
          highestProb = prob;
          bestChoice = {
            targetTile: tile,
            guessedValue: val === '-' ? '-' : parseInt(val, 10),
            prob: prob
          };
        }
      });
    });

    if (bestChoice) {
      return {
        targetTile: bestChoice.targetTile,
        guessedValue: bestChoice.guessedValue
      };
    }

    return this._makeHardDecision(aiHand, userHand, guessHistory, jokerRule);
  }

  /**
   * 추측 성공 후 연속 지목 진행 여부 결정 (Risk vs Reward)
   * @param {Tile[]} userHand 
   * @param {number} currentSuccessCount 
   * @returns {boolean} - true: 계속 지목, false: 턴 종료
   */
  shouldContinueTurn(userHand, currentSuccessCount = 1) {
    if (this.difficulty === 'easy') return Math.random() < 0.5;
    if (this.difficulty === 'medium') return currentSuccessCount < 2 && Math.random() < 0.4;

    // Hard / Master는 남아있는 비공개 카드가 1개이거나 확실성이 높으면 계속 지목
    const unrevealedCount = userHand.filter(t => !t.isRevealed).length;
    if (unrevealedCount === 0) return false;
    if (unrevealedCount === 1) return true; // 마지막 카드는 무조건 계속 지목!

    // 연속 지목 2번 이상 성공했으면 안전하게 턴 종료 (위험 관리)
    return currentSuccessCount < 2;
  }
}
