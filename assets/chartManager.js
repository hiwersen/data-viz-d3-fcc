// chartManager.js
import drawBarChart from "../projects/barchart/script.js";
import drawHeatMap from "../projects/heatmap/script.js";
import drawChoroplethMap from "../projects/choroplethmap/script.js";
import drawScatterPlot from "../projects/scatterplot/script.js";
import drawTreeMap from "../projects/treemap/script.js";

export class ChartManager {
  constructor() {
    this.chartSVG = document.getElementById("chart");
    this.legendSVG = document.getElementById("legend");
    this.chartViewport = document.querySelector(".chart-viewport");
    this.dialog = document.getElementById("chart-modal");
    this.navbar = document.getElementById("navbar");
    this.navLinks = document.querySelectorAll("#navbar .nav-link");
    this.cards = document.querySelectorAll("#carousel .chart-image");

    this.delay = 12000; // 12s
    this.currentChart = null;
    this.hoverTimeout = null;
    this.closeDialogTimeout = null;
    this.clearChartTimeout = null;
    this.isMouseOverNavbar = false;
    this.isMouseOverAnyCard = false;
    this.isChartOpen = false;
    this.isLoading = false;

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

    if (document.readyState === "loading") {
      window.addEventListener("load", () => {
        setTimeout(this.init, this.delay);
      });
    } else {
      setTimeout(this.init, this.delay);
    }
  }

  async loadChart(chartType) {
    // Prevent loading same chart or concurrent loads
    if (this.currentChart === chartType || this.isLoading) return;

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
    } finally {
      this.isLoading = false;

      // Initiate fading in effect - transition
      this.dialog.classList.remove("chart-loading");
      this.dialog.classList.add("chart-loaded");
    }
  }

  async clearChart() {
    this.dialog.classList.remove("chart-loaded");
    this.dialog.classList.add("chart-loading");

    // Clear SVG elements
    this.chartSVG.innerHTML = "";
    this.legendSVG.innerHTML = "";

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

  showChart() {
    // console.log("@showChart");

    if (this.isChartOpen) return;

    this.chartViewport.classList.add("viewport-visible");
    this.isChartOpen = true;

    this.dialog.show(); // Non-modal
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

  cancelHideTimer() {
    console.log("@cancelHideTimer");

    clearTimeout(this.hoverTimeout);
    clearTimeout(this.closeDialogTimeout);
    this.hoverTimeout = null;
    this.closeDialogTimeout = null;
  }

  startHideTimer() {
    // console.log("@setupChartHiding");
    // Set an arbitrary delay before hiding chart
    // The user may hover back onto triggering areas (navbar, cards, chart)
    const delay = 500; // ms

    // Cancel any previous hiding triggers
    this.cancelHideTimer();

    this.hoverTimeout = setTimeout(() => {
      this.hideChart();
    }, delay);
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
      link.addEventListener("mouseenter", () => {
        this.showChart();
        this.loadChart(chartType);
      });
    });

    // ! TODO: add click event listeners
  }

  chartViewportEventListeners() {
    // console.log("@chartViewportEventListeners");

    const getInteractionState = (e) => {
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
        ].every((condition) => condition),
        isChartOpen: this.isChartOpen,
      };
    };

    // Event handlers
    const handleMouseMove = (e) => {
      const { shouldClose, isChartOpen } = getInteractionState(e);

      if (shouldClose) {
        this.startHideTimer();
      } else if (isChartOpen) {
        this.cancelHideTimer();
      }
    };

    const handleClick = (e) => {
      const { shouldClose } = getInteractionState(e);

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
  }

  cardEventListeners(card) {
    // console.log("@cardEventListeners");

    if (!card) return;

    const chartType = card.id.replace("-image", "");

    card.addEventListener("mouseenter", () => {
      this.isMouseOverAnyCard = true;
      this.showChart();
      this.loadChart(chartType);
    });

    card.addEventListener("mouseleave", () => {
      this.isMouseOverAnyCard = false;
      /* ! BUG FIXED: chart open and closes intermittently
      when this.startHideTimer(); is set to mouseleave event handler.
      */
    });
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
