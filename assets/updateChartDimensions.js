export class UpdateChartDimensions {
  constructor(chartRatio, maxDiscount, sensitivity) {
    this.chartRatio = chartRatio;
    this.maxDiscount = maxDiscount;
    this.sensitivity = sensitivity;
    this.isSnapped = false;
    this.snapThreshold = 0.1;
    this.lastDeltaY = 0;
    this.touchStartDistance = null;

    this.snap = this.snap.bind(this);
    this.unsnap = this.unsnap.bind(this);
    this.toggleSnap = this.toggleSnap.bind(this);
    this.flip = this.flip.bind(this);
    this.setDimensions = this.setDimensions.bind(this);
    this.shouldSnap = this.shouldSnap.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.init = this.init.bind(this);

    // Initialize chart updater
    this.init();
  }

  snap() {
    console.log("@updateChartDimensions.snap");

    // Only snap if there will be meaningful chart dimensions change to full-screen mode
    if (!this.shouldSnap()) return;

    this.isSnapped = true;
    this.flip("snapped", "add");
    this.handleResize();
  }

  unsnap() {
    console.log("@updateChartDimensions.unsnap");

    this.isSnapped = false;
    this.flip("snapped", "remove");
    this.handleResize();
  }

  toggleSnap() {
    console.log("@updateChartDimensions.toggleSnap");

    if (this.isSnapped) {
      this.unsnap();
    } else {
      this.snap();
    }
  }

  flip(styles, action) {
    // Apply FLIP technique (First, Last, invert and play):

    // Hide changes in state
    this.chartContainer.style.visibility = "hidden";
    this.chartContainer.style.transition = "none";

    // FIRST: Record current state
    const first = this.chartContainer.getBoundingClientRect();

    // LAST: Apply the final styles temporarily to measure final state
    if (action === "add") {
      this.chartContainer.classList.add(styles);
    } else {
      this.chartContainer.classList.remove(styles);
    }

    // Force reflow to apply styles
    this.chartContainer.offsetHeight;

    // Get final state with all CSS applied
    const last = this.chartContainer.getBoundingClientRect();

    // Calculate the center point differences
    const firstCenterX = first.left + first.width / 2;
    const firstCenterY = first.top + first.height / 2;
    const lastCenterX = last.left + last.width / 2;
    const lastCenterY = last.top + last.height / 2;

    const deltaX = firstCenterX - lastCenterX;
    const deltaY = firstCenterY - lastCenterY;

    // INVERT: Apply inverted transforms
    if (action === "remove") {
      // Calculate scale difference
      const scaleX = first.width / last.width;
      const scaleY = first.height / last.height;

      // Apply both position and scale transforms
      this.chartContainer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
    } else {
      this.chartContainer.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }

    // Force reflow
    this.chartContainer.offsetHeight;

    // PLAY: Clear inline styles and animate to final position with snapped transition
    this.chartContainer.style.visibility = "visible";
    this.chartContainer.style.position = "";
    this.chartContainer.style.top = "";
    this.chartContainer.style.left = "";
    this.chartContainer.style.width = "";
    this.chartContainer.style.height = "";
    this.chartContainer.style.transform = "";
    this.chartContainer.style.transition = "";
  }

  setDimensions() {
    // Get current viewport dimensions
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.viewportRatio = this.viewportWidth / this.viewportHeight;

    // Calculate how close the viewport ratio is to the chart ratio
    this.ratioDifference = Math.abs(this.viewportRatio - this.chartRatio);

    // Calculate discount factor with inverse relationship
    this.discountFactor =
      this.maxDiscount *
      (1 - Math.min(this.ratioDifference / this.sensitivity, 1));
  }

  shouldSnap() {
    this.setDimensions();

    const containerRect = this.chartContainer.getBoundingClientRect();
    const containerRatio = parseFloat(
      (containerRect.width / containerRect.height).toFixed(2)
    );

    const ratioDifference = Math.abs(containerRatio - this.chartRatio);

    return this.discountFactor > this.snapThreshold || ratioDifference > 0.01;
  }

  handleResize() {
    console.log("@updateChartDimensions.handleResize");

    // Set current viewport dimensions
    this.setDimensions();

    let scaleFactor = 1;
    if (!this.isSnapped) {
      // Apply the scaling factor (1 - discount)
      scaleFactor -= this.discountFactor;
    }

    // Set CSS variables based on current viewport ratio and calculated discount
    const pageContainer = document.getElementById("page-container");
    let pagePadding = getComputedStyle(pageContainer)
      .getPropertyValue("padding")
      .trim()
      .slice(0, -2);
    pagePadding = parseFloat(pagePadding);

    let baseHeight, baseWidth, finalHeight, finalWidth;

    if (this.viewportRatio >= this.chartRatio) {
      // Landscape orientation - height is the limiting factor
      baseHeight = this.viewportHeight - 2 * pagePadding;
      baseWidth = baseHeight * this.chartRatio;

      // Apply scaling
      finalHeight = baseHeight * scaleFactor;
      finalWidth = baseWidth * scaleFactor;

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
      baseWidth = this.viewportWidth - 2 * pagePadding;
      baseHeight = baseWidth / this.chartRatio;

      // Apply scaling
      finalWidth = baseWidth * scaleFactor;
      finalHeight = baseHeight * scaleFactor;

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

    console.log(finalWidth / finalHeight);
  }

  handleWheel(e) {
    // Detect pinch gestures on trackpads (common on Mac)
    if (e.ctrlKey) {
      e.preventDefault();

      // Positive deltaY = zoom out (fingers moving together) = unsnap
      // Negative deltaY = zoom in (fingers moving apart) = snap
      if (e.deltaY > 0) {
        // Zoom out - unsnap
        if (this.isSnapped) {
          this.unsnap();
        }
      } else {
        // Zoom in - snap
        if (!this.isSnapped) {
          this.snap();
        }
      }
      return;
    }

    // Regular scroll behavior for snapping based on scroll direction
    const deltaY = e.deltaY;
    const scrollThreshold = 50; // Minimum scroll distance to trigger

    // Accumulate scroll delta to avoid too sensitive triggering
    this.lastDeltaY += deltaY;

    if (Math.abs(this.lastDeltaY) > scrollThreshold) {
      if (this.lastDeltaY > 0) {
        // Scrolling down - snap to fullscreen
        if (!this.isSnapped) {
          this.snap();
        }
      } else {
        // Scrolling up - unsnap
        if (this.isSnapped) {
          this.unsnap();
        }
      }

      // Reset accumulator
      this.lastDeltaY = 0;
    }
  }

  handleTouch(e) {
    // Only handle two-finger gestures
    if (e.touches.length !== 2 || e.type == "touchend") {
      // Reset touch state
      this.touchStartDistance = null;
      return;
    }

    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    // Calculate distance between two fingers
    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (this.touchStartDistance === null) {
      // First touch - record initial distance
      this.touchStartDistance = currentDistance;
      return;
    }

    // Calculate change in distance
    const distanceChange = currentDistance - this.touchStartDistance;
    const changeThreshold = 50; // Minimum distance change to trigger

    if (Math.abs(distanceChange) > changeThreshold) {
      if (distanceChange > 0) {
        // Fingers moving apart - snap (zoom in)
        if (!this.isSnapped) {
          this.snap();
        }
      } else {
        // Fingers moving together - unsnap (zoom out)
        if (this.isSnapped) {
          this.unsnap();
        }
      }

      // Reset for next gesture
      this.touchStartDistance = currentDistance;
    }
  }

  handleKeyDown(e) {
    if (e.key === "f" || e.key === "F") {
      this.toggleSnap();
    }
  }

  init() {
    console.log("@updateChartDimensions.init");

    const chartContainer = document.getElementById("chart-container");
    const header = document.getElementById("header");
    const footer = document.getElementById("footer");

    if (chartContainer) {
      this.chartContainer = chartContainer;
    } else {
      console.log("Chart container not found.");
      return;
    }

    if (header) {
      this.header = header;
      this.headerHeight = this.header.offsetHeight;
    }
    if (footer) {
      this.footer = footer;
      this.footerHeight = this.footer.offsetHeight;
    }

    // Add wheel listener(s)
    window.addEventListener("wheel", this.handleWheel, { passive: false });

    // Add touch listeners
    window.addEventListener("touchstart", this.handleTouch, { passive: true });
    window.addEventListener("touchmove", this.handleTouch, { passive: true });
    window.addEventListener("touchend", this.handleTouch, { passive: true });

    // Add resize listener(s)
    window.addEventListener("resize", this.handleResize);

    // Add keyboard listener(s)
    window.addEventListener("keydown", this.handleKeyDown);

    this.handleResize();
  }
}
