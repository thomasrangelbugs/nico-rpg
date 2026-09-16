type Theme = 'menu' | 'battle' | 'levelup' | 'dead';
type SfxId = 'hit' | 'pickup' | 'level' | 'hurt' | 'select' | 'start';

const MUSIC: Record<Theme, string> = {
  menu: '/assets/audio/music_menu.mp3',
  battle: '/assets/audio/music_battle.mp3',
  levelup: '/assets/audio/music_levelup.mp3',
  dead: '/assets/audio/music_dead.mp3',
};

const SFX: Record<SfxId, string> = {
  hit: '/assets/audio/sfx_hit.mp3',
  pickup: '/assets/audio/sfx_pickup.mp3',
  level: '/assets/audio/sfx_level.mp3',
  hurt: '/assets/audio/sfx_hurt.mp3',
  select: '/assets/audio/sfx_select.mp3',
  start: '/assets/audio/sfx_start.mp3',
};

/** Áudio baseado em arquivos MP3 reais (HTMLAudioElement). */
export class SurvivorAudio {
  private music: HTMLAudioElement | null = null;
  private theme: Theme | null = null;
  private unlocked = false;
  musicVol = 0.65;
  sfxVol = 0.8;
  muted = false;

  /** Precisa de gesto do usuário em browsers modernos. */
  async unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const a = new Audio(SFX.select);
      a.volume = 0.001;
      await a.play();
      a.pause();
    } catch {
      /* ignore */
    }
  }

  setMusic(v: number) {
    this.musicVol = Math.max(0, Math.min(1, v));
    if (this.music) this.music.volume = this.muted ? 0 : this.musicVol;
  }

  setSfx(v: number) {
    this.sfxVol = Math.max(0, Math.min(1, v));
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.music) this.music.volume = m ? 0 : this.musicVol;
  }

  play(theme: Theme) {
    if (this.theme === theme && this.music && !this.music.paused) return;
    this.stop();
    this.theme = theme;
    const el = new Audio(MUSIC[theme]);
    el.loop = theme === 'menu' || theme === 'battle';
    el.volume = this.muted ? 0 : this.musicVol;
    this.music = el;
    void el.play().catch(() => {
      /* autoplay bloqueado até unlock */
    });
  }

  stop() {
    if (this.music) {
      this.music.pause();
      this.music.src = '';
      this.music = null;
    }
    this.theme = null;
  }

  sfx(kind: SfxId) {
    if (this.muted) return;
    const el = new Audio(SFX[kind]);
    el.volume = this.sfxVol;
    void el.play().catch(() => undefined);
  }
}

export const audio = new SurvivorAudio();
