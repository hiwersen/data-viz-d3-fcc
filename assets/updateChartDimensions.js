export class UpdateChartDimensions {
  constructor(chartRatio, maxDiscount, sensitivity) {
    this.chartRatio = chartRatio;
    this.maxDiscount = maxDiscount;
    this.sensitivity = sensitivity;
    this.update = this.update.bind(this);
  }

  update() {
    // Get current viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    this.viewportRatio = viewportWidth / viewportHeight;

    // Calculate how close the viewport ratio is to the chart ratio
    this.ratioDifference = Math.abs(this.viewportRatio - this.chartRatio);

    // Calculate discount factor with inverse relationship
    this.discount =
      this.maxDiscount *
      (1 - Math.min(this.ratioDifference / this.sensitivity, 1));

    // Apply the scaling factor (1 - discount)
    const scaleFactor = 1 - this.discount;

    // Set CSS variables based on current viewport ratio and calculated discount
    const pageContainer = document.getElementById("page-container");
    let pagePadding = getComputedStyle(pageContainer)
      .getPropertyValue("padding")
      .trim()
      .slice(0, -2);
    pagePadding = parseFloat(pagePadding);

    if (this.viewportRatio >= this.chartRatio) {
      // Landscape orientation - height is the limiting factor
      const baseHeight = viewportHeight - 2 * pagePadding;
      const baseWidth = baseHeight * this.chartRatio;

      // Apply scaling
      const finalHeight = (baseHeight * scaleFactor).toFixed(2);
      const finalWidth = (baseWidth * scaleFactor).toFixed(2);

      // Update CSS variables
      document.documentElement.style.setProperty(
        "--chart-height",
        `${finalHeight}px`
      );
      document.documentElement.style.setProperty(
        "--chart-width",
        `${finalWidth}px`
      );
    } else {
      // Portrait orientation - width is the limiting factor
      const baseWidth = viewportWidth - 2 * pagePadding;
      const baseHeight = baseWidth / this.chartRatio;

      // Apply scaling
      const finalWidth = (baseWidth * scaleFactor).toFixed(2);
      const finalHeight = (baseHeight * scaleFactor).toFixed(2);

      // Update CSS variables
      document.documentElement.style.setProperty(
        "--chart-width",
        `${finalWidth}px`
      );
      document.documentElement.style.setProperty(
        "--chart-height",
        `${finalHeight}px`
      );
    }

    // this.log();
  }

  log() {
    console.log(
      `Viewport ratio: ${this.viewportRatio.toFixed(2)}, Chart ratio: ${this.chartRatio}`
    );
    console.log(
      `Ratio difference: ${this.ratioDifference.toFixed(3)}, Discount: ${(this.discount * 100).toFixed(1)}%`
    );
    console.log(
      `Chart dimensions: ${document.documentElement.style.getPropertyValue("--chart-width")} x ${document.documentElement.style.getPropertyValue("--chart-height")}`
    );
  }
}
