// PreloadScene.js — loads all 54 game assets with graceful fallback
// Any asset that fails to load is tracked in window.__LF_MISSING_ASSETS
// All scenes check this set before creating sprites and use pixel-art fallbacks.

const ASSET_BASE = '/assets/game/'

const ASSETS = [
  // Characters
  { key: 'male_idle',        path: 'characters/male_idle.png',        type: 'image' },
  { key: 'female_idle',      path: 'characters/female_idle.png',      type: 'image' },
  { key: 'male_victory',     path: 'characters/male_victory.png',     type: 'image' },
  { key: 'female_victory',   path: 'characters/female_victory.png',   type: 'image' },
  { key: 'auditor_working',  path: 'characters/auditor_working.png',  type: 'image' },
  { key: 'auditor_shocked',  path: 'characters/auditor_shocked.png',  type: 'image' },

  // HUD
  { key: 'portrait_frame',   path: 'hud/portrait_frame.png',          type: 'image' },
  { key: 'portrait_face',    path: 'hud/portrait_face.png',           type: 'image' },
  { key: 'hud_bar',          path: 'hud/hud_bar.png',                 type: 'image' },
  { key: 'coffee_cup',       path: 'hud/coffee_cup.png',              type: 'image' },
  { key: 'focus_brain',      path: 'hud/focus_brain.png',             type: 'image' },
  { key: 'focus_bar',        path: 'hud/focus_bar.png',               type: 'image' },
  { key: 'coin_icon',        path: 'hud/coin_icon.png',               type: 'image' },
  { key: 'star_icon',        path: 'hud/star_icon.png',               type: 'image' },
  { key: 'heart_icon',       path: 'hud/heart_icon.png',              type: 'image' },

  // Backgrounds
  { key: 'bg_world1',        path: 'backgrounds/bg_world1.png',       type: 'image' },
  { key: 'bg_world2',        path: 'backgrounds/bg_world2.png',       type: 'image' },
  { key: 'bg_world3',        path: 'backgrounds/bg_world3.png',       type: 'image' },
  { key: 'bg_world4',        path: 'backgrounds/bg_world4.png',       type: 'image' },
  { key: 'bg_world5',        path: 'backgrounds/bg_world5.png',       type: 'image' },
  { key: 'bg_world6',        path: 'backgrounds/bg_world6.png',       type: 'image' },
  { key: 'bg_world7',        path: 'backgrounds/bg_world7.png',       type: 'image' },

  // UI
  { key: 'task_cleared',     path: 'ui/task_cleared.png',             type: 'image' },
  { key: 'world_unlocked',   path: 'ui/world_unlocked.png',           type: 'image' },
  { key: 'mission_checklist',path: 'ui/mission_checklist.png',        type: 'image' },
  { key: 'next_stop_btn',    path: 'ui/next_stop_btn.png',            type: 'image' },
  { key: 'leaderboard_panel',path: 'ui/leaderboard_panel.png',        type: 'image' },
  { key: 'xp_popup',         path: 'ui/xp_popup.png',                 type: 'image' },
  { key: 'world_map',        path: 'ui/world_map.png',                type: 'image' },

  // Documents
  { key: 'invoice_doc',      path: 'documents/invoice_doc.png',       type: 'image' },
  { key: 'grn_doc',          path: 'documents/grn_doc.png',           type: 'image' },
  { key: 'bank_stmt',        path: 'documents/bank_stmt.png',         type: 'image' },
  { key: 'payroll_sheet',    path: 'documents/payroll_sheet.png',     type: 'image' },
  { key: 'supplier_ledger',  path: 'documents/supplier_ledger.png',   type: 'image' },

  // Stamps
  { key: 'stamp_agreed',     path: 'stamps/stamp_agreed.png',         type: 'image' },
  { key: 'stamp_exception',  path: 'stamps/stamp_exception.png',      type: 'image' },
  { key: 'stamp_fraud',      path: 'stamps/stamp_fraud.png',          type: 'image' },
  { key: 'stamp_reconciled', path: 'stamps/stamp_reconciled.png',     type: 'image' },
  { key: 'stamp_mismatch',   path: 'stamps/stamp_mismatch.png',       type: 'image' },

  // Props
  { key: 'textbooks',        path: 'props/textbooks.png',             type: 'image' },
  { key: 'auditor_mug',      path: 'props/auditor_mug.png',           type: 'image' },
  { key: 'trophy',           path: 'props/trophy.png',                type: 'image' },
  { key: 'acca_cert',        path: 'props/acca_cert.png',             type: 'image' },
  { key: 'desk_lamp',        path: 'props/desk_lamp.png',             type: 'image' },
  { key: 'red_chair',        path: 'props/red_chair.png',             type: 'image' },
  { key: 'billboard',        path: 'props/billboard.png',             type: 'image' },
  { key: 'red_flag',         path: 'props/red_flag.png',              type: 'image' },

  // Badges
  { key: 'badge_caffeine',   path: 'badges/badge_caffeine.png',       type: 'image' },
  { key: 'badge_fraud',      path: 'badges/badge_fraud.png',          type: 'image' },
  { key: 'badge_big4',       path: 'badges/badge_big4.png',           type: 'image' },
  { key: 'badge_zero_hints', path: 'badges/badge_zero_hints.png',     type: 'image' },

  // Effects
  { key: 'fireworks',        path: 'effects/fireworks.png',           type: 'spritesheet', frameWidth: 64, frameHeight: 64 },
  { key: 'fraud_flash',      path: 'effects/fraud_flash.png',         type: 'image' },

  // Logo / Icons
  { key: 'main_logo',        path: 'logo/main_logo.png',              type: 'image' },
  { key: 'app_icon',         path: 'logo/app_icon.png',               type: 'image' },
]

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  init() {
    // Global set of missing asset keys — checked in every scene before creating sprites
    if (!window.__LF_MISSING_ASSETS) {
      window.__LF_MISSING_ASSETS = new Set()
    }
  }

  preload() {
    this._createLoadingBar()

    // Track load errors gracefully
    this.load.on('loaderror', (file) => {
      console.warn(`[PreloadScene] Asset failed to load: ${file.key} (${file.url})`)
      window.__LF_MISSING_ASSETS.add(file.key)
    })

    // Queue all assets
    for (const asset of ASSETS) {
      try {
        const url = ASSET_BASE + asset.path
        if (asset.type === 'image') {
          this.load.image(asset.key, url)
        } else if (asset.type === 'spritesheet') {
          this.load.spritesheet(asset.key, url, {
            frameWidth: asset.frameWidth,
            frameHeight: asset.frameHeight,
          })
        } else if (asset.type === 'audio') {
          this.load.audio(asset.key, url)
        }
      } catch (err) {
        console.warn(`[PreloadScene] Error queueing asset ${asset.key}:`, err)
        window.__LF_MISSING_ASSETS.add(asset.key)
      }
    }

    // Loading bar progress
    this.load.on('progress', (value) => {
      this._updateBar(value)
    })

    this.load.on('complete', () => {
      this._onComplete()
    })
  }

  create() {
    // create() is called after preload; start main menu
    this.scene.start('MainMenuScene')
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  _createLoadingBar() {
    const W = 390
    const H = 844
    const cx = W / 2
    const cy = H / 2

    this.cameras.main.setBackgroundColor('#0D0D2B')

    // Logo text placeholder
    this.add
      .text(cx, cy - 120, 'LEDGERFALL', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '22px',
        color: '#C8860A',
      })
      .setOrigin(0.5)

    this.add
      .text(cx, cy - 80, 'Rise Through the Audit', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#AAAAAA',
      })
      .setOrigin(0.5)

    // Loading label
    this._loadingLabel = this.add
      .text(cx, cy - 20, 'LOADING ASSETS…', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#888888',
      })
      .setOrigin(0.5)

    // Bar background
    const barW = 260
    const barH = 18
    const barX = cx - barW / 2
    const barY = cy + 10

    this._barBg = this.add.graphics()
    this._barBg.fillStyle(0x222244, 1)
    this._barBg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4)
    this._barBg.lineStyle(2, 0x4444aa, 1)
    this._barBg.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4)

    this._barFill = this.add.graphics()
    this._barX = barX
    this._barY = barY
    this._barW = barW
    this._barH = barH

    // Percent text
    this._pctText = this.add
      .text(cx, barY + barH + 14, '0%', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#C8860A',
      })
      .setOrigin(0.5)

    // Pixel decoration — small square blocks either side
    for (let i = 0; i < 5; i++) {
      this.add.rectangle(cx - 140 - i * 8, barY + barH / 2, 4, 4, 0xc8860a, 0.6 - i * 0.1)
      this.add.rectangle(cx + 140 + i * 8, barY + barH / 2, 4, 4, 0xc8860a, 0.6 - i * 0.1)
    }

    // Developer credit
    this.add
      .text(cx, H - 30, 'Developed by Abdul Basit Nazari, ACCA', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#555555',
      })
      .setOrigin(0.5)
  }

  _updateBar(value) {
    this._barFill.clear()

    // Segment-style fill
    const segments = 20
    const segW = Math.floor((this._barW - 4) / segments)
    const filled = Math.floor(value * segments)

    for (let i = 0; i < segments; i++) {
      const alpha = i < filled ? 1 : 0.08
      const color = i < filled ? 0xc8860a : 0x333366
      this._barFill.fillStyle(color, alpha)
      this._barFill.fillRect(
        this._barX + 2 + i * segW,
        this._barY + 2,
        segW - 2,
        this._barH - 4
      )
    }

    const pct = Math.round(value * 100)
    this._pctText.setText(`${pct}%`)
    this._loadingLabel.setText(`LOADING ASSETS… ${pct}%`)
  }

  _onComplete() {
    const missing = window.__LF_MISSING_ASSETS.size
    if (missing > 0) {
      console.info(`[PreloadScene] ${missing} asset(s) missing — pixel-art fallbacks active.`)
    }
    this._loadingLabel.setText('COMPLETE!')
    this._pctText.setText('100%')
    this._updateBar(1)
  }
}
