export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'game-dark': '#0D0D2B',
        'game-crimson': '#8B0000',
        'game-amber': '#C8860A',
        'game-gold': '#FFD700',
        'game-blue': '#1A6BCC',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      }
    }
  },
  plugins: []
}
