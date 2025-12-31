import './style.css'

// Canvas setup
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

canvas.width = 400
canvas.height = 600

// Game constants
const GRAVITY = 0.5
const JUMP_STRENGTH = -8
const BIRD_SIZE = 20
const PIPE_WIDTH = 60
const PIPE_GAP = 150
const PIPE_SPEED = 2
const PIPE_SPAWN_INTERVAL = 2000

// Bird class
class Bird {
  x: number
  y: number
  velocity: number
  size: number

  constructor() {
    this.x = 80
    this.y = canvas.height / 2
    this.velocity = 0
    this.size = BIRD_SIZE
  }

  jump() {
    this.velocity = JUMP_STRENGTH
  }

  update() {
    this.velocity += GRAVITY
    this.y += this.velocity

    // Clamp to canvas bounds
    if (this.y < 0) {
      this.y = 0
      this.velocity = 0
    }
    if (this.y > canvas.height - this.size) {
      this.y = canvas.height - this.size
      this.velocity = 0
    }
  }

  draw() {
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2)
    ctx.fill()

    // Eye
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(this.x + this.size / 2 + 5, this.y + this.size / 2 - 3, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    }
  }
}

// Pipe class
class Pipe {
  x: number
  topHeight: number
  bottomY: number
  passed: boolean

  constructor(x: number) {
    this.x = x
    const minHeight = 50
    const maxHeight = canvas.height - PIPE_GAP - 50
    this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight
    this.bottomY = this.topHeight + PIPE_GAP
    this.passed = false
  }

  update() {
    this.x -= PIPE_SPEED
  }

  draw() {
    ctx.fillStyle = '#228B22'

    // Top pipe
    ctx.fillRect(this.x, 0, PIPE_WIDTH, this.topHeight)

    // Bottom pipe
    ctx.fillRect(this.x, this.bottomY, PIPE_WIDTH, canvas.height - this.bottomY)

    // Pipe caps
    ctx.fillStyle = '#1a6b1a'
    ctx.fillRect(this.x - 5, this.topHeight - 20, PIPE_WIDTH + 10, 20)
    ctx.fillRect(this.x - 5, this.bottomY, PIPE_WIDTH + 10, 20)
  }

  isOffscreen() {
    return this.x + PIPE_WIDTH < 0
  }

  collidesWith(bird: Bird) {
    const bounds = bird.getBounds()

    // Check if bird is horizontally aligned with pipe
    if (bounds.x + bounds.width > this.x && bounds.x < this.x + PIPE_WIDTH) {
      // Check if bird hits top or bottom pipe
      if (bounds.y < this.topHeight || bounds.y + bounds.height > this.bottomY) {
        return true
      }
    }
    return false
  }
}

// Game state
class Game {
  bird: Bird
  pipes: Pipe[]
  score: number
  gameOver: boolean
  lastPipeTime: number
  started: boolean

  constructor() {
    this.bird = new Bird()
    this.pipes = []
    this.score = 0
    this.gameOver = false
    this.lastPipeTime = 0
    this.started = false
  }

  start() {
    this.started = true
    this.bird.jump()
  }

  reset() {
    this.bird = new Bird()
    this.pipes = []
    this.score = 0
    this.gameOver = false
    this.lastPipeTime = 0
    this.started = false
  }

  update(timestamp: number) {
    if (!this.started || this.gameOver) return

    this.bird.update()

    // Spawn pipes
    if (timestamp - this.lastPipeTime > PIPE_SPAWN_INTERVAL) {
      this.pipes.push(new Pipe(canvas.width))
      this.lastPipeTime = timestamp
    }

    // Update pipes and check collisions
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i]
      pipe.update()

      // Check collision
      if (pipe.collidesWith(this.bird)) {
        this.gameOver = true
      }

      // Score point when passing pipe
      if (!pipe.passed && pipe.x + PIPE_WIDTH < this.bird.x) {
        pipe.passed = true
        this.score++
      }

      // Remove offscreen pipes
      if (pipe.isOffscreen()) {
        this.pipes.splice(i, 1)
      }
    }

    // Check if bird hit ground or ceiling
    if (this.bird.y <= 0 || this.bird.y >= canvas.height - this.bird.size) {
      this.gameOver = true
    }
  }

  draw() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw pipes
    this.pipes.forEach(pipe => pipe.draw())

    // Draw bird
    this.bird.draw()

    // Draw score
    ctx.fillStyle = '#000'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(this.score.toString(), canvas.width / 2, 50)

    // Draw instructions or game over
    if (!this.started) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120)

      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('Click or Press Space', canvas.width / 2, canvas.height / 2 - 10)
      ctx.font = '18px sans-serif'
      ctx.fillText('to Start', canvas.width / 2, canvas.height / 2 + 20)
    } else if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 160)

      ctx.fillStyle = '#FFF'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30)
      ctx.font = '24px sans-serif'
      ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 10)
      ctx.font = '18px sans-serif'
      ctx.fillText('Click or Press Space to Restart', canvas.width / 2, canvas.height / 2 + 50)
    }
  }
}

// Initialize game
const game = new Game()
let lastTimestamp = 0

// Game loop
function gameLoop(timestamp: number) {
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp
  }

  game.update(timestamp)
  game.draw()

  requestAnimationFrame(gameLoop)
}

// Input handlers
function handleInput() {
  if (!game.started) {
    game.start()
  } else if (game.gameOver) {
    game.reset()
  } else {
    game.bird.jump()
  }
}

canvas.addEventListener('click', handleInput)

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault() // Prevent scrolling
  handleInput()
})

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    handleInput()
  }
})

// Start the game loop
requestAnimationFrame(gameLoop)
