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

    console.log("@loadChart");

    this.isLoading = true;
    // this.showLoading();

    try {
      // Get the chart drawing function
      const drawChart = this.chartDrawers[chartType];

      if (!drawChart) {
        throw new Error(`Unknown chart type: ${chartType}`);
      }

      // Clear any previous drawn chart
      this.clearChart();

      // Draw the chart
      await drawChart();

      this.currentChart = chartType;
      // this.hideLoading();
    } catch (error) {
      console.error(`Error loading ${chartType}:`, error);
      this.showError(chartType);
    } finally {
      this.isLoading = false;
    }
  }

  clearChart() {
    // Clear previous chart
    const chartElements = this.chartSVG.querySelectorAll("*");
    const legendElements = this.legendSVG.querySelectorAll("*");

    chartElements.forEach((el) => {
      el.remove();
    });

    legendElements.forEach((el) => {
      el.remove();
    });
  }

  /*
  showLoading() {
    const chartContainer = document.getElementById("chart-container");
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "chart-loading";
    loadingDiv.innerHTML =
      '<div class="loading-spinner"></div><p>Loading chart...</p>';

    // Hide charts but keep container structure
    document.getElementById("chart").style.opacity = "0.1";
    document.getElementById("legend").style.opacity = "0.1";

    chartContainer.appendChild(loadingDiv);
  }
    */
  /*
  hideLoading() {
    const loadingDiv = document.querySelector(".chart-loading");
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // Show charts
    document.getElementById("chart").style.opacity = "1";
    document.getElementById("legend").style.opacity = "1";
  }
  */
  /*
  showError(chartType) {
    const chartContainer = document.getElementById("chart-container");
    const errorDiv = document.createElement("div");
    errorDiv.className = "chart-error";
    errorDiv.innerHTML = `<p>Error loading ${chartType.replace("-", " ")}</p>`;

    chartContainer.appendChild(errorDiv);
  }
    */

  showChart() {
    console.log("@showChart");

    if (this.isChartOpen) return;

    this.chartViewport.classList.add("chart-visible");
    this.isChartOpen = true;

    this.dialog.show(); // Non-modal
  }

  hideChart() {
    console.log("@hideChart");

    if (!this.isChartOpen) return;

    this.chartViewport.classList.remove("chart-visible");
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
    console.log("@setupChartHiding");
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
      this.cancelHideTimer();
    });

    this.navbar.addEventListener("mouseleave", () => {
      this.isMouseOverNavbar = false;
      this.startHideTimer();
    });
  }

  navLinksEventListeners() {
    console.log("@navbarHoverListeners");

    this.navLinks.forEach((link) => {
      const chartType = link.id.replace("-link", "");
      link.addEventListener("mouseenter", () => {
        this.showChart();
        this.loadChart(chartType);
      });
    });
  }

  chartViewportEventListeners() {
    console.log("@chartViewportEventListeners");

    // Global mousemove tracking
    document.addEventListener("mousemove", (e) => {
      const viewportRect = this.chartViewport.getBoundingClientRect();

      const isMouseOverChartViewport =
        e.clientX >= viewportRect.left &&
        e.clientX <= viewportRect.right &&
        e.clientY >= viewportRect.top &&
        e.clientY <= viewportRect.bottom;

      if (this.isChartOpen) {
        if (isMouseOverChartViewport) {
          if (this.hoverTimeout) {
            this.cancelHideTimer();
          }
        } else {
          if (!this.isMouseOverNavbar && !this.isMouseOverAnyCard) {
            this.startHideTimer();
          }
        }
      }
    });
  }

  cardEventListeners(card) {
    console.log("@cardEventListeners");

    if (!card) return;

    const chartType = card.id.replace("-image", "");

    card.addEventListener("mouseenter", () => {
      this.isMouseOverAnyCard = true;
      this.cancelHideTimer();
      this.showChart();
      this.loadChart(chartType);
    });

    card.addEventListener("mouseleave", () => {
      this.isMouseOverAnyCard = false;
      this.startHideTimer();
    });
  }

  cardsEventListeners() {
    console.log("@cardsEventListeners");

    this.cards.forEach(this.cardEventListeners);
  }

  init() {
    console.log("@initializeEventListeners");

    this.navbarEventListeners();
    this.navLinksEventListeners();
    this.chartViewportEventListeners();
    this.cardsEventListeners();
  }
}
