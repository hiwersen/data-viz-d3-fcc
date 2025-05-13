export class TextScramble {
  constructor(el) {
    this.el = el;
    this.innerHTML = el.innerHTML || el.innerText;
    this.textContent = el.textContent;

    // Define target text for animation:
    // use data-target-text if present,
    // otherwise use textContent
    this.targetText = el.dataset.targetText || el.textContent;

    // Normalize target text
    this.normalizedTargetText = this.normalizeText(this.targetText);

    // Get configuration settings
    this.speed = parseFloat(el.dataset.speed) || 1;
    this.direction = el.dataset.direction || "fromLeft";
    this.scrambleLength =
      parseInt(el.dataset.scrambleLength) || this.normalizedTargetText.length;

    // Get and store bezier curve configuration
    // Slow at the end: "0.0, 1.0, 0.0, 1.0"
    // Slow at the start: "1.0, 0.0, 1.0, 0.0"
    const bezierPoints = el.dataset.bezier || "0.0, 1.0, 0.0, 1.0";
    this.bezierPoints = bezierPoints.split(",").map(parseFloat);

    // Define random character sets
    this.uppercase = "░░░░░░░░░░░░░░ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.lowercase = "abcdefghijklmnopqrstuvwxyz";
    this.special = "!@#$%^&*()_+=-[]{}|;:,./<>?~⧞§¶¤←↑→↓≈≠≤≥±÷×";
    this.blocks = "█░▒▓";
  }

  // Handle newlines, returns, tabs and extra white spaces
  normalizeText(text) {
    return text
      .replace(/[\n\r\t]+/g, " ") // Replace newlines, returns and tabs with space
      .replace(/\s+/g, " ") // Collapse multiple spaces into one
      .trim(); // Remove leading/trailing whitespace
  }

  randomChar() {
    return this.uppercase[Math.floor(Math.random() * this.uppercase.length)];
  }

  // Cubic Bezier function implementation
  cubicBezier(t, p0, p1, p2, p3) {
    const cX = 3 * (p1 - p0);
    const bX = 3 * (p2 - p1) - cX;
    const aX = p3 - p0 - cX - bX;

    return aX * Math.pow(t, 3) + bX * Math.pow(t, 2) + cX * t + p0;
  }

  // Apply bezier timing to a linear progress value
  applyBezierTiming(linearProgress) {
    linearProgress = Math.max(0, Math.min(1, linearProgress));
    const [x1, y1, x2, y2] = this.bezierPoints;
    return this.cubicBezier(linearProgress, 0, y1, y2, 1);
  }

  fromLeft(frame, frames) {
    const text = this.normalizedTargetText;

    // Apply bezier timing to the linear progress
    const linearProgress = frame / frames;

    const bezierProgress = this.applyBezierTiming(linearProgress);

    // Calculate how many characters should be completed
    // Math.ceil cuts off the smooth bezier ending progression
    const progress = Math.round(bezierProgress * text.length);

    let textContent = text.slice(0, progress);

    for (let i = progress; i < text.length; i++) {
      this.loopCount++;
      // Character is still scrambling
      textContent += `${this.randomChar()}`;
    }

    this.el.textContent = textContent;
    return progress === text.length;
  }

  fromRight(frame, frames) {
    const text = this.normalizedTargetText;

    // Apply bezier timing to the linear progress
    const linearProgress = frame / frames;
    const bezierProgress = this.applyBezierTiming(linearProgress);

    // Calculate how many characters should be completed
    const progress = Math.round(bezierProgress * this.scrambleLength);

    let textContent = text.slice(this.scrambleLength - progress);

    for (let i = progress; i < this.scrambleLength; i++) {
      this.loopCount++;
      // Character is still scrambling
      textContent = this.randomChar() + textContent;
    }

    this.el.textContent = textContent;
    return progress === this.scrambleLength;
  }

  start() {
    let frames = this.scrambleLength * this.speed;
    let frame = 0;

    const animate = () => {
      let complete;

      if (this.direction === "fromLeft") {
        complete = this.fromLeft(frame, frames);
      }

      if (this.direction === "fromRight") {
        complete = this.fromRight(frame, frames);
      }

      if (complete || frame >= frames) {
        // Ensure final state
        this.el.textContent = this.normalizedTargetText;
      } else {
        frame++;
        requestAnimationFrame(animate);
      }
    };

    animate();
  }
}
