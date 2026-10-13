export interface ScoreEntry { initials: string; score: number; }

const LS_KEY = 'galaga_hiscores';
const MAX_ENTRIES = 10;

export class ScoreManager {
  score = 0;
  highScore = 0;
  shotsTotal = 0;
  shotsHit = 0;

  private board: ScoreEntry[] = [];

  constructor() {
    this.loadBoard();
    this.highScore = this.board.length > 0 ? this.board[0].score : 0;
  }

  addScore(pts: number) {
    this.score += pts;
    if (this.score > this.highScore) this.highScore = this.score;
  }

  recordShot() { this.shotsTotal++; }
  recordHit() { this.shotsHit++; }

  get hitRatio(): number {
    if (this.shotsTotal === 0) return 0;
    return Math.floor((this.shotsHit / this.shotsTotal) * 100);
  }

  isHighScore(): boolean {
    if (this.board.length < MAX_ENTRIES) return this.score > 0;
    return this.score > this.board[this.board.length - 1].score;
  }

  submitScore(initials: string) {
    this.board.push({ initials: initials.toUpperCase().substring(0, 3).padEnd(3, ' '), score: this.score });
    this.board.sort((a, b) => b.score - a.score);
    if (this.board.length > MAX_ENTRIES) this.board = this.board.slice(0, MAX_ENTRIES);
    this.saveBoard();
  }

  getBoard(): ScoreEntry[] { return this.board; }

  reset() {
    this.score = 0;
    this.shotsTotal = 0;
    this.shotsHit = 0;
  }

  private loadBoard() {
    try {
      const data = localStorage.getItem(LS_KEY);
      if (data) this.board = JSON.parse(data) as ScoreEntry[];
    } catch { this.board = []; }
  }

  private saveBoard() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.board)); } catch { /* ignore */ }
  }
}
