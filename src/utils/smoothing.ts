export class ExponentialSmoother {
  private value: number
  private readonly halfLife: number

  constructor(initialValue: number, halfLife: number) {
    this.value = initialValue
    this.halfLife = halfLife
  }

  update(target: number, dt: number): number {
    const factor = 1 - Math.pow(0.5, dt / this.halfLife)
    this.value += (target - this.value) * factor
    return this.value
  }

  get(): number {
    return this.value
  }

  set(value: number): void {
    this.value = value
  }
}

export class RollingAverage {
  private samples: number[] = []
  private sum = 0
  private readonly window: number

  constructor(windowSeconds: number, estimatedFps = 90) {
    this.window = Math.ceil(windowSeconds * estimatedFps)
  }

  push(value: number): number {
    this.samples.push(value)
    this.sum += value
    while (this.samples.length > this.window) {
      this.sum -= this.samples.shift()!
    }
    return this.sum / this.samples.length
  }

  get(): number {
    return this.samples.length > 0 ? this.sum / this.samples.length : 0
  }
}
