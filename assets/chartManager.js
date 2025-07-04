// chartManager.js
import drawBarChart from "../projects/barchart/script.js";
import drawHeatMap from "../projects/heatmap/script.js";
import drawChoroplethMap from "../projects/choroplethmap/script.js";
import drawScatterPlot from "../projects/scatterplot/script.js";
import drawTreeMap from "../projects/treemap/script.js";
import { updateChartDimensions } from "./updateChartDimensions.js";

export class ChartManager {
  constructor() {
    this.chartSVG = document.getElementById("chart");
    this.legendSVG = document.getElementById("legend");
    this.chartViewport = document.querySelector(".chart-viewport");
    this.dialog = document.getElementById("chart-modal");
    this.chartContainer = document.getElementById("chart-container");
    this.navbar = document.getElementById("navbar");
    this.navLinks = document.querySelectorAll("#navbar .nav-link");
    this.cards = document.querySelectorAll("#carousel .chart-image");
    this.tooltip = document.getElementById("tooltip");

    this.delay = 0; // ! TODO: uncomment 12000
    this.last = 0;
    this.currentChart = null;
    this.hoverTimeout = null;
    this.revertTimeout = null;
    this.closeDialogTimeout = null;
    this.clearChartTimeout = null;
    this.isMouseOverNavbar = false;
    this.isMouseOverAnyCard = false;
    this.isChartOpen = false;
    this.isLoading = false;
    this.focused = null;

    this.chartDrawers = {
      "bar-chart": drawBarChart,
      "heat-map": drawHeatMap,
      "choropleth-map": drawChoroplethMap,
      "scatter-plot": drawScatterPlot,
      "tree-map": drawTreeMap,
    };

    // ! TODO: parse --transition-duration as both ms and s
    this.transitionDuration =
      parseFloat(
        window
          .getComputedStyle(document.getElementById("chart-section"))
          .getPropertyValue("--transition-duration")
          .slice(0, -1)
      ) * 1000;

    this.cardEventListeners = this.cardEventListeners.bind(this);
    this.init = this.init.bind(this);
    this.getInteractionState = this.getInteractionState.bind(this);
    this.click = this.click.bind(this);
    this.focus = this.focus.bind(this);
    this.blur = this.blur.bind(this);

    if (document.readyState === "loading") {
      window.addEventListener("load", () => {
        setTimeout(this.init, this.delay);
      });
    } else {
      setTimeout(this.init, this.delay);
    }

    this.updateChartDimensions = null;
    this.setUpdateChartDimensions();
  }

  async setUpdateChartDimensions() {
    this.updateChartDimensions = await updateChartDimensions;
  }

  async loadChart(chartType) {
    // Prevent loading same chart or concurrent loads
    if (this.currentChart === chartType || this.isLoading) return;

    this.chartContainer.classList.remove("chart-loaded");

    // console.log("@loadChart");

    this.isLoading = true;

    // Clear any previous drawn chart
    this.clearChart();

    try {
      // Get the chart drawing function
      const drawChart = this.chartDrawers[chartType];

      if (!drawChart) {
        throw new Error(`Unknown chart type: ${chartType}`);
      }

      // Draw the chart
      await drawChart();

      this.currentChart = chartType;
      // this.hideLoading();
    } catch (error) {
      console.error(`Error loading ${chartType}:`, error);
      this.showError(chartType);
      this.hideChart();
    } finally {
      this.isLoading = false;

      // ! IMPORTANT: Force browser to process the DOM changes - reflow
      // ! So browser renders intermediate state - changes between operations
      // ! and fully resets transition effects
      this.chartContainer.offsetHeight;

      this.dialog.classList.remove("chart-loading");
      this.dialog.classList.add("chart-loaded");
      this.chartContainer.classList.add("chart-loaded");
    }
  }

  showChart(chartType) {
    // console.log("@showChart");

    this.cancelHideTimer();

    if (!this.isChartOpen) {
      this.chartViewport.classList.add("viewport-visible");
      this.isChartOpen = true;
      this.dialog.show(); // Non-modal
    }

    this.loadChart(chartType);
  }

  async clearChart() {
    this.chartContainer.classList.remove("chart-loaded");
    this.dialog.classList.remove("chart-loaded");
    this.dialog.classList.add("chart-loading");

    // Clear tooltip content
    this.tooltip.innerHTML = "";
    // Reset tooltip position
    this.tooltip.style.top = "-100dvh";
    this.tooltip.style.left = "-100dvw";
    this.tooltip.style.opacity = 0;
    this.tooltip.style.visibility = "hidden";

    // Clear SVG elements
    this.chartSVG.innerHTML = "";
    this.legendSVG.innerHTML = "";
    this.legendSVG.classList.remove("set");

    // Clear text content
    document.getElementById("chart-title").textContent = "";
    document.getElementById("chart-title-description").textContent = "";
    document.getElementById("chart-source").querySelector("a").textContent = "";
    document.getElementById("chart-source").querySelector("a").href = "";

    /* TODO & BUG TO FIX: possible implementation with promise
     there is sync bug to solve with this approach
    return new Promise((resolve) => {
      // Initiate fading out effect - transition
      this.dialog.classList.remove("chart-loaded");
      this.dialog.classList.add("chart-loading");

      // clearTimeout(this.clearChartTimeout);

      // Clear previous chart after fading is fully complete
      this.clearChartTimeout = setTimeout(() => {
        const chartElements = this.chartSVG.querySelectorAll("*");
        const legendElements = this.legendSVG.querySelectorAll("*");

        chartElements.forEach((el) => {
          el.remove();
        });

        legendElements.forEach((el) => {
          el.remove();
        });

        resolve();
      }, this.transitionDuration);
    });
    */
  }

  hideChart() {
    // console.log("@hideChart");

    if (!this.isChartOpen) return;

    this.chartViewport.classList.remove("viewport-visible");
    this.isChartOpen = false;

    this.closeDialogTimeout = setTimeout(() => {
      this.dialog.close();
    }, this.transitionDuration);
  }

  startHideTimer() {
    // console.log("@setupChartHiding");
    // Set an arbitrary delay before hiding chart
    // User may hover back onto triggering areas (navbar, cards, chart)
    const delay = 75; // ms

    // Cancel any previous hiding triggers
    this.cancelHideTimer();

    this.hoverTimeout = setTimeout(() => {
      this.hideChart();
    }, delay);
  }

  cancelHideTimer() {
    console.log("@cancelHideTimer");

    clearTimeout(this.hoverTimeout);
    clearTimeout(this.closeDialogTimeout);
    this.hoverTimeout = null;
    this.closeDialogTimeout = null;
  }

  cancelRevertToFocusedChart() {
    // Clear any pending revert to focused chart
    if (this.revertTimeout) {
      clearTimeout(this.revertTimeout);
      this.revertTimeout = null;

      // console.log("canceled revert to focused chart");
    }
  }

  mouseEnter(chartType) {
    return () => {
      this.cancelRevertToFocusedChart();
      this.showChart(chartType);
    };
  }

  mouseLeave(chartType) {
    return () => {
      if (this.focused && this.focused !== chartType) {
        // Small delay to allow new mouseenter to take priority
        this.revertTimeout = setTimeout(() => {
          this.showChart(this.focused);
          this.revertTimeout = null;
        }, 50);
      }
    };
  }

  click(chartType) {
    return (e) => {
      e.preventDefault();

      this.cancelRevertToFocusedChart();

      this.showChart(chartType);

      if (this.updateChartDimensions) {
        this.updateChartDimensions.snap();
      }
    };
  }

  focus(chartType) {
    return (e) => {
      const now = Date.now();
      const elapsed = now - this.last;
      this.last = now;

      console.log("focused:", chartType, elapsed);

      this.focused = chartType;
      this.showChart(chartType);
    };
  }

  blur(chartType) {
    return (e) => {
      const now = Date.now();
      const elapsed = now - this.last;
      this.last = now;

      // Ignore rapid blur - edge case
      if (elapsed < 100) {
        // Refocus the element
        e.target.focus();
        return;
      }

      console.log("blurred:", chartType, elapsed);
      this.focused = null;
      this.startHideTimer();
    };
  }

  getInteractionState(e) {
    const viewportRect = this.chartViewport.getBoundingClientRect();

    const isMouseOverChartViewport =
      e.clientX >= viewportRect.left &&
      e.clientX <= viewportRect.right &&
      e.clientY >= viewportRect.top &&
      e.clientY <= viewportRect.bottom;

    this.isSnapped = this.chartViewport.classList.contains("snapped");

    return {
      shouldClose: [
        this.isChartOpen,
        !isMouseOverChartViewport,
        !this.isMouseOverNavbar,
        !this.isMouseOverAnyCard,
        !this.isSnapped,
        !this.focused,
      ].every((condition) => condition),
      isChartOpen: this.isChartOpen,
      isMouseOverChartViewport,
    };
  }

  navbarEventListeners() {
    this.navbar.addEventListener("mouseenter", () => {
      this.isMouseOverNavbar = true;
    });

    this.navbar.addEventListener("mouseleave", () => {
      this.isMouseOverNavbar = false;
    });
  }

  navLinksEventListeners() {
    // console.log("@navbarHoverListeners");

    this.navLinks.forEach((link) => {
      const chartType = link.id.replace("-link", "");

      link.addEventListener("mouseenter", this.mouseEnter(chartType));
      link.addEventListener("mouseleave", this.mouseLeave(chartType));
      link.addEventListener("click", this.click(chartType));
      link.querySelector("a").addEventListener("focus", this.focus(chartType));
      link.querySelector("a").addEventListener("blur", this.blur(chartType));
    });
  }

  chartViewportEventListeners() {
    // console.log("@chartViewportEventListeners");

    // Event handlers
    const handleMouseMove = (e) => {
      const { shouldClose, isChartOpen, isMouseOverChartViewport } =
        this.getInteractionState(e);

      if (shouldClose) {
        this.startHideTimer();
      } else if (isChartOpen) {
        this.cancelHideTimer();

        if (this.revertTimeout) {
          // Clear the existing timeout
          clearTimeout(this.revertTimeout);

          if (!isMouseOverChartViewport && this.focused) {
            console.log(
              "moving outside chartViewport while focused on:",
              this.focused
            );

            // Create a new timeout with fresh 75ms delay
            this.revertTimeout = setTimeout(() => {
              this.showChart(this.focused);
              this.revertTimeout = null;
            }, 50);
          }
        }
      }
    };

    const handleClick = (e) => {
      const { shouldClose } = this.getInteractionState(e);

      if (shouldClose) {
        console.log("@close with click");
        this.cancelHideTimer();
        this.hideChart();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    const chartClose = document.getElementById("chart-close");

    chartClose.addEventListener("click", () => {
      // console.log("@chartClose click");
      this.cancelHideTimer();
      this.hideChart();
    });

    const chartMaximize = document.getElementById("chart-maximize");
    chartMaximize.addEventListener("focus", () => {
      // console.log("@chartClose click");
      this.cancelHideTimer();
    });
  }

  cardEventListeners(card) {
    // console.log("@cardEventListeners");
    if (!card) return;

    const chartType = card.id.replace("-image", "");

    card.addEventListener("mouseenter", () => {
      if (this.isChartOpen) return;
      this.isMouseOverAnyCard = true;

      this.mouseEnter(chartType)();
    });

    card.addEventListener("mouseleave", () => {
      this.isMouseOverAnyCard = false;
      this.mouseLeave(chartType)();
      /* ! BUG FIXED: chart open and closes intermittently
      when this.startHideTimer(); is set to mouseleave event handler.
      */
    });

    card.addEventListener("click", this.click(chartType));
  }

  cardsEventListeners() {
    // console.log("@cardsEventListeners");

    this.cards.forEach(this.cardEventListeners);
  }

  init() {
    // console.log("@initializeEventListeners");

    this.navbarEventListeners();
    this.navLinksEventListeners();
    this.chartViewportEventListeners();
    this.cardsEventListeners();
  }
}
