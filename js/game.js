/**
 * Da Vinci Code - Main Game Controller & UI Interactions
 */

import { Deck, Tile } from './deck.js';
import { DeductionHelper } from './helper.js';
import { DaVinciAI } from './ai.js';
import { SoundManager } from './sound.js';

class DaVinciGame {
  constructor() {
    // Game Options
    this.jokerRule = 'none';
    this.aiDifficulty = 'easy';
    this.userColorChoice = '2B2W';

    // Game Core State
    this.deck = null;
    this.userHand = [];
    this.aiHand = [];
    this.drawnTile = null;
    this.currentTurn = 'user'; // 'user' | 'ai'
    this.turnCount = 1;
    this.consecutiveHits = 0;
    this.isGameOver = false;

    // Track recently revealed tile for visual highlight
    this.justRevealedTileId = null;

    // Turn History & Filter State ('all' | 'user' | 'ai')
    this.guessHistory = [];
    this.historyFilter = 'all';

    // Selected Target for Guessing
    this.selectedTargetTile = null;
    this.selectedGuessedValue = null;

    // Dice State
    this.userDiceVal = 0;
    this.aiDiceVal = 0;

    // Modules
    this.helper = new DeductionHelper();
    this.ai = new DaVinciAI(this.aiDifficulty);
    this.sound = new SoundManager();

    this.initDOMs();
    this.bindEvents();
    this.showSettingsModal();
  }

  initDOMs() {
    // Header & Sound Controls
    this.btnToggleSound = document.getElementById('btn-toggle-sound');
    this.soundLabel = document.getElementById('sound-label');
    this.btnShowRules = document.getElementById('btn-show-rules');
    this.btnOpenRulesFromSettings = document.getElementById('btn-open-rules-from-settings');
    this.btnCloseRules = document.getElementById('btn-close-rules');
    this.btnConfirmRules = document.getElementById('btn-confirm-rules');
    this.btnToggleHelper = document.getElementById('btn-toggle-helper');
    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnPassTurn = document.getElementById('btn-pass-turn');
    this.btnHint = document.getElementById('btn-hint');
    this.btnCloseHelper = document.getElementById('btn-close-helper');
    this.btnCloseGuess = document.getElementById('btn-close-guess');
    this.btnConfirmGuess = document.getElementById('btn-confirm-guess');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    // Success Action Modal Elements & Drawn Risk Box
    this.modalSuccessAction = document.getElementById('modal-success-action');
    this.btnContinueGuess = document.getElementById('btn-continue-guess');
    this.btnModalPassTurn = document.getElementById('btn-modal-pass-turn');
    this.successActionDesc = document.getElementById('success-action-desc');
    this.drawnRiskBox = document.getElementById('drawn-risk-box');

    // Dice Modal Elements
    this.modalDice = document.getElementById('modal-dice');
    this.btnRollDice = document.getElementById('btn-roll-dice');
    this.userDiceDisplay = document.getElementById('user-dice-display');
    this.aiDiceDisplay = document.getElementById('ai-dice-display');
    this.diceResultMsg = document.getElementById('dice-result-msg');
    this.turnChoiceGroup = document.getElementById('turn-choice-group');
    this.btnChooseFirst = document.getElementById('btn-choose-first');
    this.btnChooseSecond = document.getElementById('btn-choose-second');

    // Racks & Laidout Deck Rows
    this.userRack = document.getElementById('user-tiles-rack');
    this.aiRack = document.getElementById('ai-tiles-rack');
    this.deckRowBlack = document.getElementById('deck-row-black');
    this.deckRowWhite = document.getElementById('deck-row-white');
    this.drawnTileDisplay = document.getElementById('drawn-tile-display');
    this.deckBlackCount = document.getElementById('deck-black-count');
    this.deckWhiteCount = document.getElementById('deck-white-count');
    this.turnStatusText = document.getElementById('turn-status-text');
    this.turnSubText = document.getElementById('turn-sub-text');
    this.userHiddenCount = document.getElementById('user-hidden-count');
    this.aiHiddenCount = document.getElementById('ai-hidden-count');
    this.aiLevelBadge = document.getElementById('ai-level-badge');

    // Helper Sidebar Dashboard & History Filter Tabs
    this.helperSidebar = document.getElementById('helper-sidebar');
    this.probChartContainer = document.getElementById('prob-chart-container');
    this.helperTargetInfo = document.getElementById('helper-target-info');
    this.matrixGridContainer = document.getElementById('matrix-grid-container');
    this.sidebarHistoryList = document.getElementById('sidebar-history-list');
    this.historyFilterBtns = document.querySelectorAll('.history-filter-btn');
    this.chkAutoDeduce = document.getElementById('chk-auto-deduce');
    this.btnResetMatrix = document.getElementById('btn-reset-matrix');

    // Mobile Bottom Helper Dashboard Tabs & Elements
    this.mobileHelperDashboard = document.getElementById('mobile-helper-dashboard');
    this.mobileTargetInfo = document.getElementById('mobile-target-info');
    this.mobileProbChart = document.getElementById('mobile-prob-chart');
    this.mobileMatrixGridContainer = document.getElementById('mobile-matrix-grid-container');
    this.mobileHistoryList = document.getElementById('mobile-history-list');
    this.mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
    this.mobileTabPanes = document.querySelectorAll('.mobile-tab-pane');
    this.mobileHistoryFilterBtns = document.querySelectorAll('.history-filter-btn-mobile');
    this.chkAutoDeduceMobile = document.getElementById('chk-auto-deduce-mobile');
    this.btnResetMatrixMobile = document.getElementById('btn-reset-matrix-mobile');

    // Modals
    this.modalSettings = document.getElementById('modal-settings');
    this.modalRules = document.getElementById('modal-rules');
    this.modalGuess = document.getElementById('modal-guess');
    this.modalJokerPlace = document.getElementById('modal-joker-place');
    this.modalGameOver = document.getElementById('modal-game-over');
    this.guessTargetDesc = document.getElementById('guess-target-desc');
    this.numberPickerGrid = document.getElementById('number-picker-grid');
    this.guessHistoryTip = document.getElementById('guess-history-tip');

    // Toast
    this.toastHint = document.getElementById('toast-hint');
    this.toastHintBody = document.getElementById('toast-hint-body');
    this.btnCloseToast = document.getElementById('btn-close-toast');
  }

  bindEvents() {
    // Sound Toggle Button
    if (this.btnToggleSound) {
      this.btnToggleSound.addEventListener('click', () => {
        const muted = this.sound.toggleMute();
        if (muted) {
          this.btnToggleSound.classList.add('muted');
          this.btnToggleSound.innerHTML = '🔇';
        } else {
          this.btnToggleSound.classList.remove('muted');
          this.btnToggleSound.innerHTML = '🔊';
          this.sound.playSelect();
        }
      });
    }

    // Rules Modal
    if (this.btnShowRules) this.btnShowRules.addEventListener('click', () => { this.sound.playSelect(); this.showModal(this.modalRules); });
    if (this.btnOpenRulesFromSettings) this.btnOpenRulesFromSettings.addEventListener('click', () => { this.sound.playSelect(); this.showModal(this.modalRules); });
    if (this.btnCloseRules) this.btnCloseRules.addEventListener('click', () => { this.sound.playSelect(); this.hideModal(this.modalRules); });
    if (this.btnConfirmRules) this.btnConfirmRules.addEventListener('click', () => { this.sound.playSelect(); this.hideModal(this.modalRules); });

    // Header Controls
    if (this.btnToggleHelper) this.btnToggleHelper.addEventListener('click', () => { this.sound.playSelect(); this.toggleSidebar(); });
    if (this.btnCloseHelper) this.btnCloseHelper.addEventListener('click', () => { this.sound.playSelect(); this.toggleSidebar(false); });
    if (this.btnNewGame) this.btnNewGame.addEventListener('click', () => { this.sound.playSelect(); this.showSettingsModal(); });

    // Settings Modal Start
    if (this.btnStartGame) this.btnStartGame.addEventListener('click', () => { this.sound.playSelect(); this.openDiceModal(); });

    // Dice Modal Events
    if (this.btnRollDice) this.btnRollDice.addEventListener('click', () => this.rollDice());
    if (this.btnChooseFirst) this.btnChooseFirst.addEventListener('click', () => { this.sound.playSelect(); this.setFirstTurn('user'); });
    if (this.btnChooseSecond) this.btnChooseSecond.addEventListener('click', () => { this.sound.playSelect(); this.setFirstTurn('ai'); });

    // Action Buttons
    if (this.btnPassTurn) this.btnPassTurn.addEventListener('click', () => { this.sound.playSelect(); this.endUserTurn(true); });
    if (this.btnHint) this.btnHint.addEventListener('click', () => { this.sound.playSelect(); this.showAIHint(); });
    if (this.btnCloseToast) this.btnCloseToast.addEventListener('click', () => { this.sound.playSelect(); this.toastHint.style.display = 'none'; });

    // Guess Modal
    if (this.btnCloseGuess) this.btnCloseGuess.addEventListener('click', () => { this.sound.playSelect(); this.hideModal(this.modalGuess); });
    if (this.btnConfirmGuess) this.btnConfirmGuess.addEventListener('click', () => this.executeUserGuess());

    // Success Action Modal Choices
    if (this.btnContinueGuess) {
      this.btnContinueGuess.addEventListener('click', () => {
        this.sound.playSelect();
        this.hideModal(this.modalSuccessAction);
        this.setTurnStatus('🔥 연속 추측 가능!', '상대방의 다른 비공개 타일을 선택하여 계속 지목하세요.');
      });
    }

    if (this.btnModalPassTurn) {
      this.btnModalPassTurn.addEventListener('click', () => {
        this.sound.playSelect();
        this.hideModal(this.modalSuccessAction);
        this.endUserTurn(true);
      });
    }

    // Restart
    if (this.btnRestartGame) {
      this.btnRestartGame.addEventListener('click', () => {
        this.sound.playSelect();
        this.hideModal(this.modalGameOver);
        this.showSettingsModal();
      });
    }

    // History Filter Buttons (전체 / 나 / AI)
    if (this.historyFilterBtns) {
      this.historyFilterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.sound.playSelect();
          this.historyFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.historyFilter = btn.dataset.filter;
          this.renderHistoryList();
        });
      });
    }

    // Matrix Controls
    if (this.chkAutoDeduce) {
      this.chkAutoDeduce.addEventListener('change', (e) => {
        this.sound.playSelect();
        this.helper.autoDeduceEnabled = e.target.checked;
        if (this.chkAutoDeduceMobile) this.chkAutoDeduceMobile.checked = e.target.checked;
        this.renderHelperData();
      });
    }

    if (this.btnResetMatrix) {
      this.btnResetMatrix.addEventListener('click', () => {
        this.sound.playSelect();
        this.helper.resetMatrix();
        this.renderHelperData();
      });
    }

    // Mobile Bottom Dashboard Tabs & Events
    if (this.mobileTabBtns) {
      this.mobileTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playSelect();
          const targetTab = btn.getAttribute('data-tab');
          this.mobileTabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (this.mobileTabPanes) {
            this.mobileTabPanes.forEach(pane => {
              if (pane.id === `mobile-tab-${targetTab}`) pane.classList.add('active');
              else pane.classList.remove('active');
            });
          }
        });
      });
    }

    if (this.mobileHistoryFilterBtns) {
      this.mobileHistoryFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.sound.playSelect();
          this.historyFilter = btn.getAttribute('data-filter');
          if (this.historyFilterBtns) {
            this.historyFilterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === this.historyFilter));
          }
          this.mobileHistoryFilterBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === this.historyFilter));
          this.renderHistoryList();
        });
      });
    }

    if (this.chkAutoDeduceMobile) {
      this.chkAutoDeduceMobile.addEventListener('change', (e) => {
        this.sound.playSelect();
        if (this.chkAutoDeduce) this.chkAutoDeduce.checked = e.target.checked;
        this.helper.autoDeduceEnabled = e.target.checked;
        this.renderHelperData();
      });
    }

    if (this.btnResetMatrixMobile) {
      this.btnResetMatrixMobile.addEventListener('click', () => {
        this.sound.playSelect();
        this.helper.resetMatrix();
        this.renderHelperData();
      });
    }
  }

  showSettingsModal() {
    this.showModal(this.modalSettings);
  }

  showModal(modal) {
    if (modal) modal.classList.add('active');
  }

  hideModal(modal) {
    if (modal) modal.classList.remove('active');
  }

  toggleSidebar(open = null) {
    if (open === null) {
      this.helperSidebar.classList.toggle('open');
    } else if (open) {
      this.helperSidebar.classList.add('open');
    } else {
      this.helperSidebar.classList.remove('open');
    }
  }

  /* ==========================================================================
     Dice Roll System
     ========================================================================== */

  openDiceModal() {
    this.hideModal(this.modalSettings);
    this.turnChoiceGroup.style.display = 'none';
    this.turnChoiceGroup.classList.remove('active');
    this.btnRollDice.style.display = 'block';
    this.renderDiceDisplay(this.userDiceDisplay, 1);
    this.renderDiceDisplay(this.aiDiceDisplay, 1);
    this.diceResultMsg.textContent = '주사위를 굴려 높은 수가 나온 사람이 선공/후공 선택권을 가집니다.';
    this.showModal(this.modalDice);
  }

  renderDiceDisplay(container, val) {
    if (!container) return;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'dice-grid';

    const dotPositions = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };

    const activeIndices = new Set(dotPositions[val] || [4]);

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'dice-dot-cell';

      if (activeIndices.has(i)) {
        const dot = document.createElement('div');
        if (val === 1) {
          dot.className = 'dice-dot-red';
        } else {
          dot.className = 'dice-dot-black';
        }
        cell.appendChild(dot);
      }
      grid.appendChild(cell);
    }

    container.appendChild(grid);
  }

  rollDice() {
    this.sound.playDiceRoll(); // 1.6초 주사위 롤링 음향 재생
    this.userDiceDisplay.classList.add('rolling');
    this.aiDiceDisplay.classList.add('rolling');
    this.btnRollDice.disabled = true;

    let rollCounter = 0;
    const rollInterval = setInterval(() => {
      this.renderDiceDisplay(this.userDiceDisplay, Math.floor(Math.random() * 6) + 1);
      this.renderDiceDisplay(this.aiDiceDisplay, Math.floor(Math.random() * 6) + 1);
      rollCounter++;
      if (rollCounter > 20) clearInterval(rollInterval);
    }, 70);

    // 주사위 롤링 연출 시간을 1.6초(1600ms)로 여유롭게 쫄깃하게 확장
    setTimeout(() => {
      this.userDiceVal = Math.floor(Math.random() * 6) + 1;
      this.aiDiceVal = Math.floor(Math.random() * 6) + 1;

      this.renderDiceDisplay(this.userDiceDisplay, this.userDiceVal);
      this.renderDiceDisplay(this.aiDiceDisplay, this.aiDiceVal);

      this.userDiceDisplay.classList.remove('rolling');
      this.aiDiceDisplay.classList.remove('rolling');
      this.btnRollDice.disabled = false;

      if (this.userDiceVal > this.aiDiceVal) {
        this.sound.playSuccess();
        this.diceResultMsg.innerHTML = `🎉 <strong>승리!</strong> (${this.userDiceVal} vs ${this.aiDiceVal}) 선공/후공을 선택하세요.`;
        this.btnRollDice.style.display = 'none';
        this.turnChoiceGroup.style.display = 'flex';
        this.turnChoiceGroup.classList.add('active');
      } else if (this.aiDiceVal > this.userDiceVal) {
        this.sound.playFail();
        this.diceResultMsg.innerHTML = `🤖 <strong>AI 승리!</strong> (${this.aiDiceVal} vs ${this.userDiceVal}) AI가 선공을 선택했습니다.`;
        this.btnRollDice.style.display = 'none';
        setTimeout(() => this.setFirstTurn('ai'), 1500);
      } else {
        this.diceResultMsg.textContent = `⚖️ 동점입니다! (${this.userDiceVal} vs ${this.aiDiceVal}) 다시 굴려주세요.`;
      }
    }, 1600);
  }

  setFirstTurn(starter) {
    this.currentTurn = starter;
    this.hideModal(this.modalDice);
    this.startNewGame();
  }

  /* ==========================================================================
     Game Initialization & Setup
     ========================================================================== */

  startNewGame() {
    const jokerRadio = document.querySelector('input[name="joker-rule"]:checked');
    const aiRadio = document.querySelector('input[name="ai-difficulty"]:checked');
    const colorRadio = document.querySelector('input[name="hand-color"]:checked');
    
    this.jokerRule = jokerRadio ? jokerRadio.value : 'deck_only';
    this.aiDifficulty = aiRadio ? aiRadio.value : 'master';
    this.userColorChoice = colorRadio ? colorRadio.value : '2B2W';
    this.ai = new DaVinciAI(this.aiDifficulty);

    this.aiLevelBadge.textContent = `Level: ${this.aiDifficulty.toUpperCase()}`;

    this.deck = new Deck(this.jokerRule);
    const { userHand, aiHand } = this.deck.dealInitialHandsCustom(this.userColorChoice);
    this.userHand = userHand;
    this.aiHand = aiHand;
    this.drawnTile = null;
    this.justRevealedTileId = null;
    this.guessHistory = [];
    this.historyFilter = 'all';
    this.turnCount = 1;
    this.consecutiveHits = 0;
    this.isGameOver = false;
    this.helper.resetMatrix();

    const jokersInUserHand = this.userHand.filter(t => t.isJoker);
    if (jokersInUserHand.length > 0) {
      // 조커 배치 팝업 전에 AI 패와 내 패(조커 제외)를 먼저 렌더링 → 팝업 뒤로 패가 선명하게 보임
      this.renderRack(this.aiRack, this.aiHand, false);
      this.renderRack(this.userRack, this.userHand, true);
      this.renderLaidoutDecks();
      this.updateTileCounts();
      this.promptJokerPlacement(jokersInUserHand[0], () => {
        this.finishGameSetup();
      });
    } else {
      this.finishGameSetup();
    }
  }

  finishGameSetup() {
    this.drawnTile = null;
    this.renderAll();

    if (this.currentTurn === 'user') {
      this.setTurnStatus('당신의 턴입니다!', '👉 먼저 윗줄(검은패) 또는 아랫줄(흰패)에서 가져올 패 1장을 직접 선택해 뽑아주세요!');
      this.btnHint.style.display = 'inline-block';
    } else {
      this.setTurnStatus('상대방(AI)의 턴입니다.', 'AI가 신중하게 생각 중입니다...');
      this.btnHint.style.display = 'none';
      setTimeout(() => this.startAITurn(), 1200);
    }
  }

  /* ==========================================================================
     Rendering Pipeline
     ========================================================================== */

  renderAll() {
    this.renderRack(this.userRack, this.userHand, true);
    this.renderRack(this.aiRack, this.aiHand, false);
    this.renderLaidoutDecks();
    this.updateTileCounts();
    this.renderHelperData();
  }

  updateTileCounts() {
    const userHidden = this.userHand.filter(t => !t.isRevealed).length;
    const aiHidden = this.aiHand.filter(t => !t.isRevealed).length;

    this.userHiddenCount.textContent = userHidden;
    this.aiHiddenCount.textContent = aiHidden;

    this.deckBlackCount.textContent = this.deck.remainingBlackCount;
    this.deckWhiteCount.textContent = this.deck.remainingWhiteCount;
  }

  calculateDrawPickRisk(color) {
    if (!this.deck || !this.helper) return null;
    
    // 바닥 더미에 남아있는 해당 색상 타일 수 체크
    const remainingCount = (color === 'black') ? this.deck.remainingBlackCount : this.deck.remainingWhiteCount;
    if (remainingCount === 0) return null;

    // 이미 확인되거나 공개된 타일(유저 손패 + AI 공개패) 값 파악
    const knownValues = new Set();
    this.userHand.forEach(t => {
      if (!t.isJoker) knownValues.add(`${t.color}_${t.value}`);
    });
    this.aiHand.forEach(t => {
      if (t.isRevealed && !t.isJoker) knownValues.add(`${t.color}_${t.value}`);
    });

    // 공개된 타일을 제외하고 바닥에 남아있을 수 있는 미확인 후보 숫자/조커 목록 추출
    const possibleCandidates = [];
    for (let v = 0; v <= 11; v++) {
      if (!knownValues.has(`${color}_${v}`)) {
        possibleCandidates.push({ color, value: v, isJoker: false });
      }
    }

    if (this.jokerRule !== 'none') {
      const isUserJokerKnown = this.userHand.some(t => t.isJoker && t.color === color);
      const isAiJokerKnown = this.aiHand.some(t => t.isRevealed && t.isJoker && t.color === color);
      if (!isUserJokerKnown && !isAiJokerKnown) {
        possibleCandidates.push({ color, value: 'j', isJoker: true });
      }
    }

    if (possibleCandidates.length === 0) return 0;

    let totalRiskSum = 0;
    let validSampleCount = 0;

    // 공개된 타일을 제외한 나머지 각각의 숫자를 가져왔을 때의 노출확률 시뮬레이션
    for (const cand of possibleCandidates) {
      const simTile = {
        id: `sim_draw_target_${cand.color}_${cand.value}`,
        color: cand.color,
        value: cand.value,
        isJoker: cand.isJoker,
        isRevealed: false
      };

      const tempUserHand = [...this.userHand, simTile];
      tempUserHand.sort((a, b) => {
        if (a.isJoker && b.isJoker) return 0;
        if (a.isJoker) return 1;
        if (b.isJoker) return -1;
        if (a.value !== b.value) return a.value - b.value;
        if (a.color === 'black' && b.color === 'white') return -1;
        if (a.color === 'white' && b.color === 'black') return 1;
        return 0;
      });

      // helper.calculateProbabilities(targetHand, myHand, guessHistory, jokerRule)
      // 상대방 AI 입장에서 유저의 손패(tempUserHand)를 예측한 확률 Map(tileId -> { val: pct })
      const probMap = this.helper.calculateProbabilities(tempUserHand, this.aiHand, this.guessHistory, this.jokerRule);

      if (probMap && probMap.has(simTile.id)) {
        const probObj = probMap.get(simTile.id); // { "1": 28.8, "2": 28.8, ... }
        if (probObj) {
          const pcts = Object.values(probObj);
          if (pcts.length > 0) {
            const maxRiskPct = Math.max(...pcts);
            if (!isNaN(maxRiskPct) && isFinite(maxRiskPct)) {
              totalRiskSum += maxRiskPct;
              validSampleCount++;
            }
          }
        }
      }
    }

    if (validSampleCount === 0) return 0;

    // 각 미공개 숫자를 가져왔을 때의 노출확률 산술 평균 산출
    return Math.round(totalRiskSum / validSampleCount);
  }

  renderLaidoutDecks() {
    this.deckRowBlack.innerHTML = '';
    this.deckRowWhite.innerHTML = '';
    this.drawnTileDisplay.innerHTML = '';

    // 바닥패 렌더링 시 유저 턴 & 뽑기 전 상태일 때 예상 노출 위험도 동적 표시
    const blackLabelEl = document.querySelector('.badge-black-label');
    const whiteLabelEl = document.querySelector('.badge-white-label');

    if (this.currentTurn === 'user' && !this.drawnTile && this.deck) {
      const blackRisk = this.calculateDrawPickRisk('black');
      const whiteRisk = this.calculateDrawPickRisk('white');

      if (blackLabelEl && blackRisk !== null) {
        let badgeClass = 'risk-safe';
        let icon = '💡';
        let statusText = '안전';
        if (blackRisk >= 50) { badgeClass = 'risk-high'; icon = '⚠️'; statusText = '위험'; }
        else if (blackRisk >= 25) { badgeClass = 'risk-mid'; icon = '🔍'; statusText = '보통'; }
        blackLabelEl.innerHTML = `🖤 검은패 (남은: <span id="deck-black-count">${this.deck.remainingBlackCount}</span>) <span class="badge-draw-risk ${badgeClass}">${icon} 예상 노출: ${blackRisk}% (${statusText})</span>`;
      }

      if (whiteLabelEl && whiteRisk !== null) {
        let badgeClass = 'risk-safe';
        let icon = '💡';
        let statusText = '안전';
        if (whiteRisk >= 50) { badgeClass = 'risk-high'; icon = '⚠️'; statusText = '위험'; }
        else if (whiteRisk >= 25) { badgeClass = 'risk-mid'; icon = '🔍'; statusText = '보통'; }
        whiteLabelEl.innerHTML = `🤍 흰색패 (남은: <span id="deck-white-count">${this.deck.remainingWhiteCount}</span>) <span class="badge-draw-risk ${badgeClass}">${icon} 예상 노출: ${whiteRisk}% (${statusText})</span>`;
      }
    } else {
      if (blackLabelEl) {
        blackLabelEl.innerHTML = `🖤 검은패 (남은 개수: <span id="deck-black-count">${this.deck ? this.deck.remainingBlackCount : 0}</span>) - 가져올 낱개 카드를 직접 선택하세요`;
      }
      if (whiteLabelEl) {
        whiteLabelEl.innerHTML = `🤍 흰색패 (남은 개수: <span id="deck-white-count">${this.deck ? this.deck.remainingWhiteCount : 0}</span>) - 가져올 낱개 카드를 직접 선택하세요`;
      }
    }

    if (this.drawnTile) {
      const tile = this.drawnTile;
      const displayEl = document.createElement('div');
      displayEl.className = `tile-card tile-${tile.color} ${tile.isJoker ? 'tile-joker' : ''} new-drawn`;
      
      const isUserDrawn = (this.currentTurn === 'user');
      displayEl.innerHTML = `
        <div class="tile-inner">
          <div class="tile-face tile-front">
            <div class="tile-pattern">❓</div>
          </div>
          <div class="tile-face tile-back" style="${isUserDrawn ? 'transform: rotateY(0deg); backface-visibility: visible;' : ''}">
            <div class="tile-number">${tile.value}</div>
            <div class="tile-number-underline"></div>
          </div>
        </div>
      `;
      this.drawnTileDisplay.appendChild(displayEl);
    }

    for (let i = 0; i < this.deck.remainingBlackCount; i++) {
      const item = document.createElement('div');
      item.className = 'deck-tile-item tile-black';
      item.innerHTML = `<div class="tile-pattern">❓</div>`;
      if (this.currentTurn === 'user' && !this.drawnTile) {
        item.title = "이 검은색 패를 직접 선택해서 가져옵니다.";
        item.addEventListener('click', () => this.userDrawPhase('black'));
      }
      this.deckRowBlack.appendChild(item);
    }

    for (let i = 0; i < this.deck.remainingWhiteCount; i++) {
      const item = document.createElement('div');
      item.className = 'deck-tile-item tile-white';
      item.innerHTML = `<div class="tile-pattern">❓</div>`;
      if (this.currentTurn === 'user' && !this.drawnTile) {
        item.title = "이 흰색 패를 직접 선택해서 가져옵니다.";
        item.addEventListener('click', () => this.userDrawPhase('white'));
      }
      this.deckRowWhite.appendChild(item);
    }
  }

  renderRack(container, hand, isUser = false) {
    if (!container) return;
    container.innerHTML = '';

    // 상대방 관점 유저 패 백트래킹 확률 사전 계산
    let userProbMap = null;
    if (isUser) {
      userProbMap = this.helper.calculateProbabilities(this.userHand, this.aiHand, this.guessHistory, this.jokerRule);
    }

    hand.forEach((tile, index) => {
      const tileEl = document.createElement('div');
      
      let extraClasses = '';
      if (tile.isRevealed) extraClasses += ' revealed';
      if (this.drawnTile && tile.id === this.drawnTile.id) extraClasses += ' new-drawn';
      if (this.selectedTargetTile && tile.id === this.selectedTargetTile.id) extraClasses += ' selected';

      // 조커 클래스는 내 패이거나 이미 공개된 경우에만 붙임 (상대 미공개 조커 위치 숨김)
      const showJoker = tile.isJoker && (isUser || tile.isRevealed);
      tileEl.className = `tile-card tile-${tile.color} ${showJoker ? 'tile-joker' : ''}${extraClasses}`;

      let badgeHTML = '';
      if (tile.isRevealed) {
        if (tile.revealReason === 'success') {
          badgeHTML = `<div class="tile-badge-success">✨ 추측성공 공개</div>`;
        } else if (tile.revealReason === 'fail') {
          badgeHTML = `<div class="tile-badge-fail">🚨 실패 공개</div>`;
        } else {
          badgeHTML = `<div class="tile-badge-revealed">👁️ 공개</div>`;
        }
      }

      // 내 비공개 손패(갓 뽑아온 NEW 바닥패 포함) 아래에 상대방 노출 확정 확률 뱃지 표시
      let exposureBadgeHTML = '';
      if (isUser && !tile.isRevealed && userProbMap) {
        const probs = userProbMap.get(tile.id) || {};
        const possibleVals = Object.entries(probs).filter(([val, pct]) => pct > 0);
        
        let riskPct = 0;
        let is100 = false;

        if (possibleVals.length === 1) {
          riskPct = 100;
          is100 = true;
        } else if (possibleVals.length > 0) {
          riskPct = Math.round(Math.max(...possibleVals.map(([val, pct]) => pct)));
          if (riskPct >= 99) is100 = true;
        }

        if (is100) {
          exposureBadgeHTML = `<div class="tile-exposure-badge risk-100">100%</div>`;
        } else if (riskPct >= 50) {
          exposureBadgeHTML = `<div class="tile-exposure-badge risk-high">${riskPct}%</div>`;
        } else {
          exposureBadgeHTML = `<div class="tile-exposure-badge risk-low">${riskPct}%</div>`;
        }
      }

      tileEl.innerHTML = `
        ${badgeHTML}
        <div class="tile-inner">
          <div class="tile-face tile-front">
            <div class="tile-pattern">${showJoker ? '🃏' : '❓'}</div>
          </div>
          <div class="tile-face tile-back">
            <div class="tile-number">${tile.value}</div>
            <div class="tile-number-underline"></div>
          </div>
        </div>
        ${exposureBadgeHTML}
      `;

      if (isUser && !tile.isRevealed) {
        tileEl.querySelector('.tile-front').style.display = 'none';
        tileEl.querySelector('.tile-back').style.transform = 'rotateY(0deg)';
        tileEl.querySelector('.tile-back').style.backfaceVisibility = 'visible';
      }

      if (!isUser && !tile.isRevealed && !this.isGameOver) {
        tileEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.currentTurn === 'user') {
            this.sound.playSelect();
            this.selectTargetTileForGuess(tile, index);
          }
        });
      }

      container.appendChild(tileEl);
    });
  }

  setTurnStatus(mainText, subText = '') {
    this.turnStatusText.textContent = mainText;
    this.turnSubText.textContent = subText;
  }

  /* ==========================================================================
     User Gameplay Logic & Risk Detector for Drawn Tile
     ========================================================================== */

  userDrawPhase(color) {
    if (this.drawnTile) return;

    this.sound.playDrawTile(); // 패 뽑기 효과음 재생
    this.drawnTile = this.deck.drawTileByColor(color);
    if (!this.drawnTile) return;

    this.drawnTile.owner = 'user';
    const colorName = color === 'black' ? '검은색' : '흰색';

    if (this.drawnTile.isJoker) {
      this.promptJokerPlacement(this.drawnTile, () => {
        this.renderAll();
        this.setTurnStatus(`${colorName} 조커를 뽑았습니다!`, '🎯 상대방 타일을 클릭하여 숫자를 지목하세요.');
      });
    } else {
      this.userHand = this.deck.insertTileToHand(this.userHand, this.drawnTile);
      this.renderAll();
      this.setTurnStatus(`${colorName} 타일을 1장 뽑았습니다!`, '🎯 상대방 타일을 클릭하여 숫자를 지목하세요.');
    }
  }

  promptJokerPlacement(jokerTile, onComplete) {
    // ────────────────────────────────────────────────────
    // 배너에 조커 색상 정보 동적 업데이트
    // ────────────────────────────────────────────────────
    const colorName = jokerTile.color === 'black' ? '검정' : '흰색';
    const colorEmoji = jokerTile.color === 'black' ? '⬛' : '⬜';
    const colorStyle = jokerTile.color === 'black'
      ? 'background:#1c2430;color:#fff;border:2px solid #00f2fe;'
      : 'background:#ffffff;color:#1e1e2e;border:2px solid #475569;';

    // 배너 내용 동적 교체
    const bannerHeader = document.querySelector('#modal-joker-place .joker-banner-header');
    if (bannerHeader) {
      bannerHeader.innerHTML = `
        <span class="joker-banner-icon">${colorEmoji}</span>
        <span style="${colorStyle} display:inline-flex;align-items:center;justify-content:center;
              width:36px;height:48px;border-radius:8px;font-size:1.1rem;font-weight:900;
              margin-right:4px;box-shadow:0 2px 8px rgba(0,0,0,0.5);">–</span>
        <span class="joker-banner-title">${colorName} 조커 위치 선택</span>
        <span class="joker-banner-sub">— 아래 내 패에서 <strong style="color:var(--color-gold)">⬇</strong> 클릭하여 <strong style="color:${jokerTile.color === 'black' ? '#00f2fe' : '#ffb703'}">${colorName} 조커</strong>를 삽입할 위치를 선택하세요</span>
      `;
    }

    // ────────────────────────────────────────────────────
    // 내 패(userRack)에 화살표 슬롯을 직접 렌더 — 팝업은 슬림 배너만
    // ────────────────────────────────────────────────────
    const container = this.userRack;
    container.innerHTML = '';

    const nonJokers = this.userHand.filter(t => t.id !== jokerTile.id);
    const numSlots = nonJokers.length + 1;

    // 각 위치에 조커를 배치했을 때 상대 노출 위험도 사전 시뮬레이션
    const slotRisks = [];
    for (let i = 0; i < numSlots; i++) {
      const tempHand = this.deck.insertTileToHand([...nonJokers], jokerTile, i);
      const probMap = this.helper.calculateProbabilities(tempHand, this.aiHand, this.guessHistory, this.jokerRule);
      let totalRisk = 0, count = 0;
      tempHand.forEach(t => {
        if (!t.isRevealed) {
          const probs = probMap.get(t.id) || {};
          totalRisk += Math.max(...Object.values(probs), 0);
          count++;
        }
      });
      slotRisks.push({ index: i, avgRisk: count > 0 ? Math.round(totalRisk / count) : 0 });
    }
    const minRisk = Math.min(...slotRisks.map(s => s.avgRisk));

    // 화살표 슬롯 + 패 카드 번갈아 렌더
    for (let i = 0; i < numSlots; i++) {
      const sim = slotRisks[i];
      const isBest = (sim.avgRisk === minRisk);

      // ▼ 화살표 슬롯 컬럼
      const slotEl = document.createElement('div');
      slotEl.className = `joker-inline-slot${isBest ? ' best' : ''}`;

      const arrowBtn = document.createElement('button');
      arrowBtn.className = 'btn-joker-insert';
      arrowBtn.innerHTML = '⬇';
      arrowBtn.title = `이 위치에 조커 배치 (상대 노출: ${sim.avgRisk}%)`;
      arrowBtn.addEventListener('click', () => {
        this.sound.playSelect();
        this.userHand = this.deck.insertTileToHand(nonJokers, jokerTile, i);
        this.hideModal(this.modalJokerPlace);
        if (onComplete) onComplete();
      });

      const riskLabel = document.createElement('div');
      riskLabel.className = 'joker-inline-risk';
      riskLabel.innerHTML = isBest ? `★ ${sim.avgRisk}%` : `${sim.avgRisk}%`;

      slotEl.appendChild(arrowBtn);
      slotEl.appendChild(riskLabel);
      container.appendChild(slotEl);

      // ▶ 기존 손패 카드 (마지막 슬롯 이후에는 없음)
      if (i < nonJokers.length) {
        const tile = nonJokers[i];
        const tileEl = document.createElement('div');
        const showJokerClass = tile.isJoker ? 'tile-joker' : '';
        tileEl.className = `tile-card tile-${tile.color} ${showJokerClass}`;
        tileEl.innerHTML = `
          <div class="tile-inner">
            <div class="tile-face tile-back" style="transform:rotateY(0deg);backface-visibility:visible;">
              <div class="tile-number">${tile.value}</div>
              <div class="tile-number-underline"></div>
            </div>
          </div>
        `;
        container.appendChild(tileEl);
      }
    }

    // 슬림 배너 팝업 표시 (클릭은 배너를 통과해 화살표 버튼으로 전달됨)
    this.showModal(this.modalJokerPlace);
  }


  /**
   * 내가 새로 가져온 패를 상대방(AI 시점)이 논리로 맞출 확률 분석 엔진
   */
  calculateDrawnTileExposureRisk() {
    if (!this.drawnTile) return { riskPct: 0, is100: false };

    // 상대방(AI) 입장에서의 유저 타일 분석 (상대가 아는 유저 타일 백트래킹)
    const probMap = this.helper.calculateProbabilities(this.userHand, this.aiHand, this.guessHistory, this.jokerRule);
    const probs = probMap.get(this.drawnTile.id) || {};

    const possibleVals = Object.entries(probs).filter(([val, pct]) => pct > 0);
    
    let riskPct = 0;
    let is100 = false;

    if (possibleVals.length === 1) {
      riskPct = 100;
      is100 = true;
    } else if (possibleVals.length > 0) {
      const maxProb = Math.max(...possibleVals.map(([val, pct]) => pct));
      riskPct = maxProb;
      if (maxProb >= 99.9) is100 = true;
    }

    return { riskPct, is100, drawnTile: this.drawnTile };
  }

  selectTargetTileForGuess(tile, index) {
    if (!this.drawnTile && this.deck.remainingCount > 0) {
      this.setTurnStatus(
        '⚠️ 먼저 바닥패를 뽑아주세요!',
        '상대방 타일을 지목하려면 중앙에 펼쳐진 검은패 또는 흰패중 1장을 직접 선택해 뽑아야 합니다.'
      );
      return;
    }

    this.selectedTargetTile = tile;
    this.selectedGuessedValue = null;
    this.btnConfirmGuess.disabled = true;

    // 모바일 하단 대시보드에서 '실시간 확률' 탭으로 자동 전환 & 실시간 분석표 표시
    if (this.mobileTabBtns && this.mobileTabPanes) {
      this.mobileTabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'prob'));
      this.mobileTabPanes.forEach(pane => pane.classList.toggle('active', pane.id === 'mobile-tab-prob'));
    }
    this.renderHelperData();

    this.guessTargetDesc.innerHTML = `상대방의 <strong>${index + 1}번째 (${tile.color === 'black' ? '검은색' : '하얀색'}) 타일</strong>을 선택했습니다.`;

    const failedGuesses = this.guessHistory
      .filter(h => h.targetTileId === tile.id && !h.success)
      .map(h => h.guessedValue);

    if (failedGuesses.length > 0) {
      this.guessHistoryTip.style.display = 'block';
      this.guessHistoryTip.innerHTML = `⚠️ 이전 실패 지목: <strong>[ ${failedGuesses.map(v => DeductionHelper.formatValueNotation(v)).join(', ')} ]</strong> 제외`;
    } else {
      this.guessHistoryTip.style.display = 'none';
    }

    const probMap = this.helper.calculateProbabilities(this.aiHand, this.userHand, this.guessHistory, this.jokerRule);
    const probs = probMap.get(tile.id) || {};

    this.numberPickerGrid.innerHTML = '';
    const possible = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (this.jokerRule !== 'none') possible.push('-');

    possible.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'btn-num-pick';
      btn.textContent = DeductionHelper.formatValueNotation(val);

      const pct = probs[val] || 0;
      
      if (pct > 0 && !failedGuesses.includes(val) && !failedGuesses.includes(String(val))) {
        btn.classList.add('possible');
      } else {
        btn.classList.add('impossible');
      }

      btn.addEventListener('click', () => {
        this.sound.playSelect();
        document.querySelectorAll('.btn-num-pick').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedGuessedValue = val;
        this.btnConfirmGuess.disabled = false;
      });
      this.numberPickerGrid.appendChild(btn);
    });

    this.toggleSidebar(false); // 수동 사이드바 팝업은 열지 않음 (하단 대시보드 실시간 확률표로만 연동)
    this.showModal(this.modalGuess);
    this.renderAll();
  }

  executeUserGuess() {
    if (!this.selectedTargetTile || this.selectedGuessedValue === null) return;

    this.hideModal(this.modalGuess);

    const target = this.selectedTargetTile;
    const guessVal = this.selectedGuessedValue;

    const isCorrect = (String(target.value) === String(guessVal));
    const handStateNotation = DeductionHelper.getHandStateNotation(this.aiHand);
    const targetIdx = this.aiHand.indexOf(target) + 1;

    let revealedTagStr = '';

    if (isCorrect) {
      this.sound.playSuccess(); // 추측 성공 효과음 재생
      target.isRevealed = true;
      target.revealReason = 'success';
      this.consecutiveHits++;

      const historyItem = {
        turn: this.turnCount,
        actor: 'user',
        targetTileId: target.id,
        targetColor: target.color,
        targetIndex: targetIdx,
        guessedValue: guessVal,
        handStateStr: handStateNotation,
        success: true
      };
      this.guessHistory.push(historyItem);

      this.renderAll();

      if (this.checkWinCondition('user')) {
        this.handleGameOver('user');
        return;
      }

      // 내가 뽑아온 타일의 상대방 관점 확정 추측 위험도 분석
      const { riskPct, is100, drawnTile } = this.calculateDrawnTileExposureRisk();

      this.successActionDesc.innerHTML = `상대방의 <strong>${targetIdx}번째 타일 [ ${DeductionHelper.formatValueNotation(guessVal)} ]</strong> (을)를 밝혀냈습니다!`;

      if (drawnTile) {
        const colorName = drawnTile.color === 'black' ? '검은색' : '흰색';
        const valNotated = DeductionHelper.formatValueNotation(drawnTile.value);

        if (is100) {
          this.drawnRiskBox.innerHTML = `
            <div class="risk-header">
              <span>🎯 내가 가져온 패 상대 추측 확정 확률:</span>
              <span class="risk-pct-badge risk-100">100% 확정 노출</span>
            </div>
            <div class="risk-strategy-desc">
              상대방은 이미 정렬 조건과 정보로 내가 가져온 <strong>[ ${colorName} ${valNotated} ]</strong> 패를 <strong>100% 특정</strong>할 수 있습니다.<br>
              💡 <strong>전략 조언:</strong> 어차피 상대 턴이 되면 100% 맞추므로, <strong>손패를 숨기지 말고 과감히 연속 지목</strong>을 이어가는 것이 절대적으로 유리합니다!
            </div>
          `;
        } else {
          this.drawnRiskBox.innerHTML = `
            <div class="risk-header">
              <span>🛡️ 내가 가져온 패 상대 추측 확정 확률:</span>
              <span class="risk-pct-badge risk-safe">${riskPct}% 확률</span>
            </div>
            <div class="risk-strategy-desc">
              상대가 가져온 <strong>[ ${colorName} ${valNotated} ]</strong> 패를 바로 맞출 확률은 <strong>${riskPct}%</strong>입니다.<br>
              상대에게 패를 안 알려주고 턴을 종료해 숨길 것인지, 위험을 감수하고 연속 지목할지 결정하세요.
            </div>
          `;
        }
        this.drawnRiskBox.style.display = 'flex';
      } else {
        this.drawnRiskBox.style.display = 'none';
      }

      this.showModal(this.modalSuccessAction);

    } else {
      this.sound.playFail(); // 추측 실패 효과음 재생
      this.consecutiveHits = 0;
      this.btnPassTurn.style.display = 'none';

      let revealedTile = null;

      if (this.drawnTile) {
        this.drawnTile.isRevealed = true;
        this.drawnTile.revealReason = 'fail';
        revealedTile = this.drawnTile;
        this.setTurnStatus('❌ 추측 실패!', `지목이 틀렸습니다. 이번 턴에 가져온 타일이 공개됩니다.`);
      } else {
        const unrevealedUserTile = this.userHand.find(t => !t.isRevealed);
        if (unrevealedUserTile) {
          unrevealedUserTile.isRevealed = true;
          unrevealedUserTile.revealReason = 'fail';
          revealedTile = unrevealedUserTile;
        }
        this.setTurnStatus('❌ 추측 실패! (바닥패 0개 룰)', `지목이 틀렸습니다. 내 비공개 타일 1장이 공개됩니다!`);
      }

      if (revealedTile) {
        const colorTag = revealedTile.color === 'white' ? 'W' : 'B';
        const valNotated = DeductionHelper.formatValueNotation(revealedTile.value);
        revealedTagStr = `${colorTag}${valNotated}`;
      }

      const historyItem = {
        turn: this.turnCount,
        actor: 'user',
        targetTileId: target.id,
        targetColor: target.color,
        targetIndex: targetIdx,
        guessedValue: guessVal,
        handStateStr: handStateNotation,
        success: false,
        revealedTag: revealedTagStr
      };
      this.guessHistory.push(historyItem);

      this.renderAll();

      if (this.checkWinCondition('ai')) {
        this.handleGameOver('ai');
        return;
      }

      setTimeout(() => {
        this.endUserTurn(false);
      }, 2200);
    }
  }

  endUserTurn(manualPass = false) {
    if (manualPass) {
      this.guessHistory.push({
        turn: this.turnCount,
        actor: 'user',
        isPass: true
      });
    }

    this.btnPassTurn.style.display = 'none';
    this.drawnTile = null;
    this.currentTurn = 'ai';
    this.turnCount++;
    this.renderAll();

    this.setTurnStatus('상대방(AI)의 턴입니다.', 'AI의 지목을 기다립니다...');
    this.btnHint.style.display = 'none';

    setTimeout(() => this.startAITurn(), 1500);
  }

  /* ==========================================================================
     AI Gameplay Logic
     ========================================================================== */

  startAITurn() {
    if (this.isGameOver) return;

    if (this.deck.remainingCount > 0) {
      let chosenColor = 'black';
      if (this.deck.remainingBlackCount > 0 && this.deck.remainingWhiteCount > 0) {
        chosenColor = Math.random() < 0.5 ? 'black' : 'white';
      } else if (this.deck.remainingBlackCount > 0) {
        chosenColor = 'black';
      } else {
        chosenColor = 'white';
      }

      this.drawnTile = this.deck.drawTileByColor(chosenColor);
      if (this.drawnTile) {
        this.drawnTile.owner = 'ai';
        this.aiHand = this.deck.insertTileToHand(this.aiHand, this.drawnTile);
        this.renderAll();
      }
    } else {
      this.drawnTile = null;
    }

    this.processAIGuess();
  }

  processAIGuess() {
    if (this.isGameOver) return;

    const decision = this.ai.makeDecision(this.aiHand, this.userHand, this.guessHistory, this.jokerRule);

    if (!decision) {
      this.endAITurn();
      return;
    }

    const { targetTile, guessedValue } = decision;
    const targetIdx = this.userHand.indexOf(targetTile) + 1;
    const handStateNotation = DeductionHelper.getHandStateNotation(this.userHand);
    const guessedNotation = DeductionHelper.formatValueNotation(guessedValue);

    this.setTurnStatus(`🤖 AI 지목!`, `나의 ${targetIdx}번째 (${targetTile.color === 'black' ? '검은색' : '하얀색'}) 타일을 [ ${guessedNotation} ] (으)로 지목했습니다.`);

    setTimeout(() => {
      const isCorrect = (String(targetTile.value) === String(guessedValue));

      if (isCorrect) {
        this.sound.playFail(); // AI가 내 타일을 맞췄을 때 실패 사운드
        targetTile.isRevealed = true;
        targetTile.revealReason = 'success';

        this.guessHistory.push({
          turn: this.turnCount,
          actor: 'ai',
          targetTileId: targetTile.id,
          targetColor: targetTile.color,
          targetIndex: targetIdx,
          guessedValue: guessedValue,
          handStateStr: handStateNotation,
          success: true
        });

        this.renderAll();

        if (this.checkWinCondition('ai')) {
          this.handleGameOver('ai');
          return;
        }

        if (this.ai.shouldContinueTurn(this.userHand)) {
          this.setTurnStatus(`🤖 AI 추측 성공!`, `AI가 연속 지목을 시도합니다...`);
          setTimeout(() => this.processAIGuess(), 2000);
        } else {
          this.setTurnStatus(`🤖 AI 추측 성공 후 턴 종료!`, `나의 턴이 돌아옵니다.`);
          setTimeout(() => this.endAITurn(), 1800);
        }

      } else {
        this.sound.playSuccess(); // AI 지목 틀렸을 때 나에게 기쁜 성공 사운드
        let revealedTile = null;

        if (this.drawnTile) {
          this.drawnTile.isRevealed = true;
          this.drawnTile.revealReason = 'fail';
          revealedTile = this.drawnTile;
          this.setTurnStatus(`🤖 AI 추측 실패!`, `AI의 가져온 타일이 공개됩니다.`);
        } else {
          const unrevealedAITile = this.aiHand.find(t => !t.isRevealed);
          if (unrevealedAITile) {
            unrevealedAITile.isRevealed = true;
            unrevealedAITile.revealReason = 'fail';
            revealedTile = unrevealedAITile;
          }
          this.setTurnStatus(`🤖 AI 추측 실패! (바닥패 0개 룰)`, `AI의 지목이 틀려 비공개 타일 1장이 공개됩니다.`);
        }

        let revealedTagStr = '';
        if (revealedTile) {
          const colorTag = revealedTile.color === 'white' ? 'W' : 'B';
          const valNotated = DeductionHelper.formatValueNotation(revealedTile.value);
          revealedTagStr = `${colorTag}${valNotated}`;
        }

        this.guessHistory.push({
          turn: this.turnCount,
          actor: 'ai',
          targetTileId: targetTile.id,
          targetColor: targetTile.color,
          targetIndex: targetIdx,
          guessedValue: guessedValue,
          handStateStr: handStateNotation,
          success: false,
          revealedTag: revealedTagStr
        });

        this.renderAll();

        if (this.checkWinCondition('user')) {
          this.handleGameOver('user');
          return;
        }

        setTimeout(() => this.endAITurn(), 2000);
      }
    }, 1800);
  }

  endAITurn() {
    this.drawnTile = null;
    this.currentTurn = 'user';
    this.turnCount++;
    this.renderAll();

    this.setTurnStatus('당신의 턴입니다!', '👉 먼저 윗줄(검은패) 또는 아랫줄(흰패)에서 가져올 패 1장을 직접 선택해 뽑아주세요!');
    this.btnHint.style.display = 'inline-block';
  }

  /* ==========================================================================
     Win Condition & Result
     ========================================================================== */

  checkWinCondition(actor) {
    if (actor === 'user') {
      return this.aiHand.every(t => t.isRevealed);
    } else {
      return this.userHand.every(t => t.isRevealed);
    }
  }

  handleGameOver(winner) {
    this.isGameOver = true;
    const modalIcon = document.getElementById('result-icon');
    const modalTitle = document.getElementById('result-title');
    const modalDesc = document.getElementById('result-desc');
    const modalStats = document.getElementById('result-stats');

    if (winner === 'user') {
      this.sound.playVictory(); // 승리 팡파레 효과음 재생
      modalIcon.textContent = '🏆';
      modalTitle.textContent = 'VICTORY!';
      modalTitle.style.color = 'var(--color-cyan)';
      modalDesc.textContent = `축하합니다! ${this.turnCount}턴 만에 AI의 암호를 완벽히 해독했습니다!`;
    } else {
      this.sound.playDefeat(); // 패배 효과음 재생
      modalIcon.textContent = '💀';
      modalTitle.textContent = 'DEFEAT...';
      modalTitle.style.color = 'var(--color-red)';
      modalDesc.textContent = `AI에게 모든 암호가 패배했습니다. 다시 도전해보세요!`;
    }

    modalStats.innerHTML = `
      <p>총 진행 턴: <strong>${this.turnCount}</strong>턴</p>
      <p>AI 난이도: <strong>${this.aiDifficulty.toUpperCase()}</strong></p>
      <p>조커 규칙: <strong>${this.jokerRule}</strong></p>
      <p>초기 패 구성: <strong>${this.userColorChoice}</strong></p>
    `;

    this.showModal(this.modalGameOver);
  }

  /* ==========================================================================
     Helper Sidebar & History Filtering
     ========================================================================== */

  renderHelperData() {
    const probMap = this.helper.calculateProbabilities(this.aiHand, this.userHand, this.guessHistory, this.jokerRule);
    
    // 1. 실시간 확률 계산기
    if (this.selectedTargetTile && !this.selectedTargetTile.isRevealed) {
      const tileIdx = this.aiHand.indexOf(this.selectedTargetTile) + 1;
      const infoText = `상대방 <strong>${tileIdx}번째 (${this.selectedTargetTile.color === 'black' ? '검은색' : '하얀색'}) 타일</strong>의 확률 분석:`;
      if (this.helperTargetInfo) this.helperTargetInfo.innerHTML = infoText;
      if (this.mobileTargetInfo) this.mobileTargetInfo.innerHTML = infoText;

      const probs = probMap.get(this.selectedTargetTile.id) || {};
      if (this.probChartContainer) this.probChartContainer.innerHTML = '';
      if (this.mobileProbChart) this.mobileProbChart.innerHTML = '';

      Object.entries(probs).forEach(([val, pct]) => {
        const row = document.createElement('div');
        row.className = 'prob-row';
        row.innerHTML = `
          <span class="prob-label">${DeductionHelper.formatValueNotation(val)}</span>
          <div class="prob-bar-wrapper">
            <div class="prob-bar-fill" style="width: ${pct}%;"></div>
          </div>
          <span class="prob-val">${pct}%</span>
        `;
        if (this.probChartContainer) this.probChartContainer.appendChild(row.cloneNode(true));
        if (this.mobileProbChart) this.mobileProbChart.appendChild(row);
      });
    } else {
      const emptyMsg = `<p class="info-msg">상대방 비공개 타일을 클릭하면 각 숫자별 확률 분석표가 나타납니다.</p>`;
      if (this.helperTargetInfo) this.helperTargetInfo.innerHTML = emptyMsg;
      if (this.mobileTargetInfo) this.mobileTargetInfo.innerHTML = emptyMsg;
      if (this.probChartContainer) this.probChartContainer.innerHTML = '';
      if (this.mobileProbChart) this.mobileProbChart.innerHTML = '';
    }

    // 2. 소거 노정표
    this.renderMatrixGrid(probMap);

    // 3. 필터링 연동 상세 지목 기록
    this.renderHistoryList();
  }

  renderMatrixGrid(probMap) {
    const table = document.createElement('table');
    table.className = 'matrix-table';

    let headerHTML = '<thead><tr><th>타일</th>';
    for (let i = 0; i <= 11; i++) headerHTML += `<th>${DeductionHelper.formatValueNotation(i)}</th>`;
    if (this.jokerRule !== 'none') headerHTML += '<th>j</th>';
    headerHTML += '</tr></thead>';

    let bodyHTML = '<tbody>';
    this.aiHand.forEach((tile, index) => {
      const isRevealed = tile.isRevealed;
      const isSelected = (this.selectedTargetTile && this.selectedTargetTile.id === tile.id);

      let rowClass = isRevealed ? 'matrix-row-revealed' : 'matrix-row-unrevealed';
      if (isSelected) rowClass += ' matrix-row-selected';

      bodyHTML += `<tr class="${rowClass}"><td>#${index + 1} (${tile.color === 'black' ? '흑' : '백'})</td>`;
      const probs = probMap.get(tile.id) || {};

      for (let i = 0; i <= 11; i++) {
        const hasProb = probs[i] > 0;
        bodyHTML += `<td class="${hasProb ? 'matrix-cell-chk' : 'matrix-cell-eliminated'}">${hasProb ? 'O' : 'X'}</td>`;
      }

      if (this.jokerRule !== 'none') {
        const hasJokerProb = probs['-'] > 0;
        bodyHTML += `<td class="${hasJokerProb ? 'matrix-cell-chk' : 'matrix-cell-eliminated'}">${hasJokerProb ? 'O' : 'X'}</td>`;
      }
      bodyHTML += '</tr>';
    });
    bodyHTML += '</tbody>';

    table.innerHTML = headerHTML + bodyHTML;
    
    if (this.matrixGridContainer) {
      this.matrixGridContainer.innerHTML = '';
      this.matrixGridContainer.appendChild(table.cloneNode(true));
    }
    if (this.mobileMatrixGridContainer) {
      this.mobileMatrixGridContainer.innerHTML = '';
      this.mobileMatrixGridContainer.appendChild(table);
    }
  }

  /**
   * 상세 지목 기록 (전체 / 나 / AI 필터링 연동)
   */
  renderHistoryList() {
    if (this.sidebarHistoryList) this.sidebarHistoryList.innerHTML = '';
    if (this.mobileHistoryList) this.mobileHistoryList.innerHTML = '';

    // 필터링 적용
    let filteredHistory = [...this.guessHistory];
    if (this.historyFilter === 'user') {
      filteredHistory = filteredHistory.filter(h => h.actor === 'user');
    } else if (this.historyFilter === 'ai') {
      filteredHistory = filteredHistory.filter(h => h.actor === 'ai');
    }

    if (filteredHistory.length === 0) {
      const emptyMsg = `<p class="info-msg">해당 조건의 지목 기록이 없습니다.</p>`;
      if (this.sidebarHistoryList) this.sidebarHistoryList.innerHTML = emptyMsg;
      if (this.mobileHistoryList) this.mobileHistoryList.innerHTML = emptyMsg;
      return;
    }

    filteredHistory.reverse().forEach(h => {
      const item = document.createElement('div');
      const actorName = h.actor === 'user' ? '나' : 'AI';

      if (h.isPass) {
        item.className = `history-line-item ${h.actor === 'ai' ? 'ai-actor' : ''}`;
        item.innerHTML = `<span class="history-line-actor">${actorName}</span> : 턴 패스 (종료)`;
      } else {
        const valNotated = DeductionHelper.formatValueNotation(h.guessedValue);
        item.className = `history-line-item ${h.actor === 'ai' ? 'ai-actor' : ''} ${h.success ? 'success' : 'fail'}`;

        let resultStr = '';
        if (h.success) {
          resultStr = `<span class="history-line-result-success">성공</span>`;
        } else {
          const revealedTag = h.revealedTag ? `(${h.revealedTag} 공개)` : '';
          resultStr = `<span class="history-line-result-fail">실패${revealedTag}</span>`;
        }

        const lineText = `<span class="history-line-actor">${actorName}</span> : ${h.handStateStr} - ${h.targetIndex} - ${valNotated} ${resultStr}`;
        item.innerHTML = `<div class="history-line-code">${lineText}</div>`;
      }

      if (this.sidebarHistoryList) this.sidebarHistoryList.appendChild(item.cloneNode(true));
      if (this.mobileHistoryList) this.mobileHistoryList.appendChild(item);
    });
  }

  showAIHint() {
    const probMap = this.helper.calculateProbabilities(this.aiHand, this.userHand, this.guessHistory, this.jokerRule);
    const hint = this.helper.getBestHint(probMap, this.aiHand);

    if (hint) {
      const recValNotated = DeductionHelper.formatValueNotation(hint.recommendedVal === '조커(-)' ? '-' : hint.recommendedVal);
      this.toastHintBody.innerHTML = `
        가장 적중 확률이 높은 타일은 상대의 <strong>${hint.targetIndex}번째 (${hint.targetTile.color === 'black' ? '검은색' : '하얀색'}) 타일</strong>입니다.<br>
        추천 숫자: <strong>[ ${recValNotated} ]</strong> (확률: <strong>${hint.prob}%</strong>)
      `;
      this.toastHint.style.display = 'block';
    } else {
      this.toastHintBody.textContent = '현재 모든 타일의 확률이 동일합니다. 손패 범위를 소거해 보세요!';
      this.toastHint.style.display = 'block';
    }
  }
}

// Instantiate Game on DOM Content Loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new DaVinciGame();
});
