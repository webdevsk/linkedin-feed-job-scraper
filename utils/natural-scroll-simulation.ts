/**
 * Simulates a natural-feeling scroll interaction
 * The function creates a series of smaller scroll movements with varying speeds
 * to mimic the physics of a natural mouse wheel or touch gesture
 *
 * @param {number} totalDistance - Total distance to scroll in pixels (positive for down, negative for up)
 * @param {number} duration - Total duration of the scroll animation in milliseconds (default: 800ms)
 * @param {string} easingType - Type of easing function: 'easeOut', 'easeInOut', 'bounce' (default: 'easeOut')
 * @returns {Promise<void>} - Promise that resolves when the scroll animation completes
 */
function naturalScroll(
  totalDistance: number,
  duration: number = 800,
  easingType: "easeOut" | "easeInOut" | "bounce" = "easeOut"
): Promise<void> {
  return new Promise((resolve) => {
    // Validate inputs
    if (totalDistance === 0) {
      resolve()
      return
    }

    const startTime = performance.now()
    const startPosition = window.scrollY || document.documentElement.scrollTop
    const targetPosition = startPosition + totalDistance

    // Easing functions
    const easingFunctions = {
      // Slow down as it approaches the end
      easeOut: (t: number): number => 1 - Math.pow(1 - t, 3),

      // Slow at beginning and end, faster in the middle
      easeInOut: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

      // Bouncy effect at the end
      bounce: (t: number): number => {
        const n1 = 7.5625
        const d1 = 2.75

        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      },
    }

    // Slight random variation to make it feel more natural
    const addJitter = (value: number): number => {
      const jitterAmount = Math.random() * 0.03 - 0.015 // ±1.5%
      return value * (1 + jitterAmount)
    }

    // Animation loop
    const scrollStep = (timestamp: number) => {
      const elapsed = timestamp - startTime

      if (elapsed >= duration) {
        // Ensure we end exactly at target position
        window.scrollTo({
          top: targetPosition,
          behavior: "auto",
        })
        resolve()
        return
      }

      // Calculate progress with easing
      const progress = elapsed / duration
      const easedProgress = easingFunctions[easingType](progress)

      // Apply slight jitter for realism
      const jitteredProgress = addJitter(easedProgress)

      // Calculate new position
      const newPosition = startPosition + totalDistance * jitteredProgress

      // Perform scroll
      window.scrollTo({
        top: newPosition,
        behavior: "auto", // Use 'auto' here since we're controlling the animation manually
      })

      // Continue animation
      requestAnimationFrame(scrollStep)
    }

    // Start animation
    requestAnimationFrame(scrollStep)
  })
}

/**
 * Simulates a mouse wheel scroll with multiple small movements
 *
 * @param {number} distance - Distance to scroll in pixels (positive for down, negative for up)
 * @param {number} steps - Number of "wheel ticks" to simulate (default: 5)
 * @param {number} delay - Delay between steps in ms (default: 70)
 * @returns {Promise<void>} - Promise that resolves when finished
 */
async function simulateMouseWheelScroll(distance: number, steps: number = 5, delay: number = 70): Promise<void> {
  const stepDistance = distance / steps

  for (let i = 0; i < steps; i++) {
    // Vary the step distance slightly to appear more natural
    const actualStep = stepDistance * (0.9 + Math.random() * 0.2) // ±10% variation

    // Use the natural scroll for each step with a shorter duration
    await naturalScroll(actualStep, 200 + Math.random() * 100, "easeOut")

    // Add a small random delay between steps
    if (i < steps - 1) {
      await new Promise((r) => setTimeout(r, delay * (0.8 + Math.random() * 0.4)))
    }
  }
}

/**
 * Simulates a touch drag scroll
 *
 * @param {number} distance - Distance to scroll in pixels (positive for down, negative for up)
 * @param {number} speed - Scroll speed factor (1 = normal, 2 = faster, 0.5 = slower)
 * @returns {Promise<void>} - Promise that resolves when finished
 */
async function simulateTouchDragScroll(distance: number, speed: number = 1): Promise<void> {
  // Calculate duration based on distance and speed
  // Faster drags are shorter in duration
  const baseDuration = Math.min(1200, Math.abs(distance) * 2)
  const duration = baseDuration / speed

  // Touch scrolls typically have a bounce effect at the end
  await naturalScroll(distance, duration, "easeOut")

  // Add a small bounce/rubber-band effect at the end for touch scrolls
  if (Math.abs(distance) > 200) {
    const bounceDistance = -distance * 0.08 // Bounce back 8%
    await naturalScroll(bounceDistance, 300, "bounce")
    await naturalScroll(-bounceDistance * 0.5, 200, "easeOut")
  }
}

/**
 * Main function to simulate natural scrolling using either mouse wheel or touch drag style
 *
 * @param {number} distance - Distance to scroll in pixels (positive for down, negative for up)
 * @param {'wheel' | 'touch'} style - Scroll style to simulate (default: 'wheel')
 * @param {number} [speedOrSteps] - For 'wheel': number of steps, for 'touch': speed factor
 * @returns {Promise<void>} - Promise that resolves when scrolling completes
 */
async function simulateNaturalScroll(
  distance: number,
  style: "wheel" | "touch" = "wheel",
  speedOrSteps?: number
): Promise<void> {
  if (style === "wheel") {
    return simulateMouseWheelScroll(distance, speedOrSteps)
  } else {
    return simulateTouchDragScroll(distance, speedOrSteps)
  }
}

export { naturalScroll, simulateMouseWheelScroll, simulateTouchDragScroll, simulateNaturalScroll }
