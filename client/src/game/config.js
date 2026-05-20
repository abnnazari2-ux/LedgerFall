import BootScene from './scenes/BootScene.js'
import PreloadScene from './scenes/PreloadScene.js'
import MainMenuScene from './scenes/MainMenuScene.js'
import TutorialScene from './scenes/TutorialScene.js'
import WorldMapScene from './scenes/WorldMapScene.js'
import LevelSelectScene from './scenes/LevelSelectScene.js'
import HUDScene from './scenes/HUDScene.js'
import TaskScene from './scenes/TaskScene.js'
import VictoryScene from './scenes/VictoryScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import LivesRefillScene from './scenes/LivesRefillScene.js'
import RaceScene from './scenes/RaceScene.js'

export default {
  type: Phaser.AUTO,
  backgroundColor: '#0D0D2B',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    min: { width: 320, height: 568 },
    max: { width: 1920, height: 1080 },
  },
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  input: { touch: { capture: true } },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    TutorialScene,
    WorldMapScene,
    LevelSelectScene,
    HUDScene,
    TaskScene,
    VictoryScene,
    GameOverScene,
    LivesRefillScene,
    RaceScene,
  ],
  parent: 'phaser-container',
}
