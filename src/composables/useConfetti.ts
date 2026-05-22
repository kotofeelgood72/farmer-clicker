import confetti from 'canvas-confetti'

function burst(opts: confetti.Options) {
  void confetti({
    particleCount: 70,
    spread: 55,
    startVelocity: 42,
    decay: 0.91,
    ...opts,
  })
}

/** Праздничный залп конфетти — для наград и завершения сцен. */
export function fireConfetti() {
  burst({ angle: 60, origin: { x: 0, y: 0.55 } })
  burst({ angle: 120, origin: { x: 1, y: 0.55 } })
}
