import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import gameConfig from './config.js'

export default function PhaserGame() {
  const gameRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (gameRef.current) return
    gameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: containerRef.current,
    })
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      id="phaser-container"
      style={{ width: '100%', height: '100vh' }}
    />
  )
}
