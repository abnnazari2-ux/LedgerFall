export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Load a minimal splash image or nothing; keep boot fast
  }

  create() {
    // Set base pixel-art rendering settings
    this.cameras.main.setBackgroundColor('#0D0D2B')

    // Brief logo text while true assets load in PreloadScene
    this.add
      .text(195, 422, 'LEDGERFALL', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#C8860A',
        align: 'center',
      })
      .setOrigin(0.5)

    this.add
      .text(195, 460, 'Loading…', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#888888',
        align: 'center',
      })
      .setOrigin(0.5)

    // Proceed to PreloadScene on next frame so the text renders first
    this.time.delayedCall(100, () => {
      this.scene.start('PreloadScene')
    })
  }
}
