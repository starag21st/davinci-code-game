/**
 * Da Vinci Code - Deck & Tile Management System
 * Handles tile creation, 3 Joker rules, custom color ratio dealing, hand sorting algorithms,
 * and separate black/white deck draws.
 */

export class Tile {
  /**
   * @param {'black'|'white'} color 
   * @param {number|string} value - 0~11 or '-' for Joker
   * @param {boolean} isJoker 
   * @param {string} id 
   */
  constructor(color, value, isJoker = false, id = '') {
    this.color = color;
    this.value = value;
    this.isJoker = isJoker;
    this.id = id || `${color}-${value}-${Math.random().toString(36).substr(2, 5)}`;
    this.isRevealed = false;
    this.owner = null; // 'user' | 'ai' | 'deck'
    this.customJokerIndex = -1; // 조커 수동 배치 위치 (-1이면 기본)
  }

  clone() {
    const tile = new Tile(this.color, this.value, this.isJoker, this.id);
    tile.isRevealed = this.isRevealed;
    tile.owner = this.owner;
    tile.customJokerIndex = this.customJokerIndex;
    return tile;
  }
}

export class Deck {
  /**
   * @param {'none'|'deck_only'|'allow_start'} jokerRule 
   */
  constructor(jokerRule = 'deck_only') {
    this.jokerRule = jokerRule;
    this.tiles = [];
    this.initDeck();
  }

  initDeck() {
    this.tiles = [];

    // 0 ~ 11 흑/백 타일 생성 (총 24장)
    for (let i = 0; i <= 11; i++) {
      this.tiles.push(new Tile('black', i, false, `black-${i}`));
      this.tiles.push(new Tile('white', i, false, `white-${i}`));
    }

    // 조커 타일 추가 (규칙에 따라)
    if (this.jokerRule !== 'none') {
      this.tiles.push(new Tile('black', '-', true, 'black-joker'));
      this.tiles.push(new Tile('white', '-', true, 'white-joker'));
    }

    this.shuffle();
  }

  shuffle() {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  /**
   * 유저의 초기 4장 흑/백 비율 선택에 따른 맞춤 딜링
   * @param {'2B2W'|'3B1W'|'1B3W'|'4B0W'|'0B4W'} userColorChoice 
   * @returns {{ userHand: Tile[], aiHand: Tile[] }}
   */
  dealInitialHandsCustom(userColorChoice = '2B2W') {
    const userHand = [];
    const aiHand = [];

    let userBlackNeed = 2;
    let userWhiteNeed = 2;

    switch (userColorChoice) {
      case '3B1W': userBlackNeed = 3; userWhiteNeed = 1; break;
      case '1B3W': userBlackNeed = 1; userWhiteNeed = 3; break;
      case '4B0W': userBlackNeed = 4; userWhiteNeed = 0; break;
      case '0B4W': userBlackNeed = 0; userWhiteNeed = 4; break;
      case '2B2W':
      default:
        userBlackNeed = 2; userWhiteNeed = 2; break;
    }

    // 덱에서 흑/백/조커 타일 분류
    let blackTiles = this.tiles.filter(t => t.color === 'black');
    let whiteTiles = this.tiles.filter(t => t.color === 'white');

    if (this.jokerRule === 'deck_only') {
      blackTiles = blackTiles.filter(t => !t.isJoker);
      whiteTiles = whiteTiles.filter(t => !t.isJoker);
    }

    // 유저 손패 추출
    for (let i = 0; i < userBlackNeed; i++) {
      const idx = Math.floor(Math.random() * blackTiles.length);
      const tile = blackTiles.splice(idx, 1)[0];
      userHand.push(tile);
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }

    for (let i = 0; i < userWhiteNeed; i++) {
      const idx = Math.floor(Math.random() * whiteTiles.length);
      const tile = whiteTiles.splice(idx, 1)[0];
      userHand.push(tile);
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }

    // AI 손패 추출 (AI는 흑2 백2 기본 추출)
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(Math.random() * blackTiles.length);
      const tile = blackTiles.splice(idx, 1)[0];
      aiHand.push(tile);
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }

    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(Math.random() * whiteTiles.length);
      const tile = whiteTiles.splice(idx, 1)[0];
      aiHand.push(tile);
      this.tiles.splice(this.tiles.indexOf(tile), 1);
    }

    // 남아있는 덱 셔플
    this.shuffle();

    // 소유자 및 정렬
    userHand.forEach(t => t.owner = 'user');
    aiHand.forEach(t => t.owner = 'ai');

    return {
      userHand: this.sortHand(userHand),
      aiHand: this.sortHand(aiHand)
    };
  }

  /**
   * 특정 색상(black 또는 white) 타일 더미에서 1장 무작위 드로우
   * @param {'black'|'white'} color 
   * @returns {Tile|null}
   */
  drawTileByColor(color) {
    const matchingIndices = [];
    this.tiles.forEach((t, i) => {
      if (t.color === color) matchingIndices.push(i);
    });

    if (matchingIndices.length === 0) return null;

    // 해당 색상 중 임의로 1장 드로우
    const randomMatchIdx = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];
    const tile = this.tiles.splice(randomMatchIdx, 1)[0];
    tile.owner = 'deck';
    return tile;
  }

  /**
   * 중앙 더미에서 아무 색상이나 1장 드로우
   * @returns {Tile|null}
   */
  drawTile() {
    if (this.tiles.length === 0) return null;
    const tile = this.tiles.pop();
    tile.owner = 'deck';
    return tile;
  }

  get remainingCount() {
    return this.tiles.length;
  }

  get remainingBlackCount() {
    return this.tiles.filter(t => t.color === 'black').length;
  }

  get remainingWhiteCount() {
    return this.tiles.filter(t => t.color === 'white').length;
  }

  /**
   * 손패 정렬 로직 (다빈치 코드 공식 규칙)
   * @param {Tile[]} hand 
   * @returns {Tile[]}
   */
  sortHand(hand) {
    const nonJokers = hand.filter(t => !t.isJoker);
    const jokers = hand.filter(t => t.isJoker);

    nonJokers.sort((a, b) => {
      if (a.value !== b.value) {
        return a.value - b.value;
      }
      return a.color === 'black' ? -1 : 1;
    });

    if (jokers.length === 0) {
      return nonJokers;
    }

    let result = [...nonJokers];

    jokers.forEach(joker => {
      if (joker.customJokerIndex >= 0 && joker.customJokerIndex <= result.length) {
        result.splice(joker.customJokerIndex, 0, joker);
      } else {
        const idx = Math.floor(Math.random() * (result.length + 1));
        joker.customJokerIndex = idx;
        result.splice(idx, 0, joker);
      }
    });

    return result;
  }

  insertTileToHand(hand, newTile, targetJokerIndex = -1) {
    if (newTile.isJoker && targetJokerIndex >= 0) {
      newTile.customJokerIndex = targetJokerIndex;
    }
    const newHand = [...hand, newTile];
    return this.sortHand(newHand);
  }
}
