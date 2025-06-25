import { colorThemes } from "../../color-themes.js";
import { setTooltipPos } from "../../assets/setTooltipPos.js";

export default function () {
  const url =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";

  const aspectRatio = 2.4; // 1.7
  const viewBoxWidth = 1200;
  const viewBoxHeight = viewBoxWidth / aspectRatio;
  const padding = 1.5; // between tiles
  const colorTheme = colorThemes[5];

  const chart = d3
    .select("#chart")
    .attr("class", "tree-map")
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const tooltip = d3.select("#tooltip");

  d3.select("#chart-title").text("Video Game Sales");
  d3.select("#chart-title-description").text(
    "Top 100 Most Sold Video Games Grouped by Platform"
  );
  d3.select("#chart-source a")
    .text("freeCodeCamp Project Reference Data")
    .attr("href", url);

  const req = new XMLHttpRequest();

  req.open("GET", url, true);
  req.send();
  req.onload = () => {
    const salesData = JSON.parse(req.responseText);

    const treemap = d3
      .treemap()
      .size([viewBoxWidth, viewBoxHeight])
      .paddingInner(padding)
      .paddingOuter(padding);

    const root = d3
      .hierarchy(salesData)
      .sum((d) => d.value)
      .sort((a, b) => b.height - a.height || b.value - a.value);

    treemap(root);

    const nodes = root.leaves();

    const categories = [];
    root.children.forEach((elem) => categories.push(elem.data.name));

    const colorScale = d3.scaleOrdinal().domain(categories).range(colorTheme);

    const defs = chart.append("defs");

    const node = chart
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "tile-wrapper")
      .attr("color", (d) => colorScale(d.data.category))
      .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`)
      .each(function (d, i) {
        // Create unique clipPath for this tile
        const clipId = `clip-${i}`;
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;

        defs
          .append("clipPath")
          .attr("id", clipId)
          .append("rect")
          .attr("width", width)
          .attr("height", height);

        // Apply clipPath to 'this' wrapper
        d3.select(this).attr("clip-path", `url(#${clipId})`);
      });

    node
      .append("rect")
      .attr("id", (d) => `${d.data.category}-${d.data.name}`)
      .attr("class", "tile")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("data-name", (d) => d.data.name)
      .attr("data-category", (d) => d.data.category)
      .attr("data-value", (d) => d.data.value)
      .on("mouseover", (event, { data }) => {
        const tooltipContent = `
        <div id="tooltip-content">
            <p class="label">${data.name}</p>

            <div>
              <p class="value">${data.value}</p>
              <p class="label">Million Units Sold</p>
            </div>
            
            <p class="label">Platform: ${data.category}</p>
        </div>`;

        // Set tooltip content
        tooltip.html(tooltipContent).attr("data-value", data.value);

        setTooltipPos(event, tooltip);
      })
      .on("mouseout", (event) => {
        setTooltipPos(event, tooltip);
      });

    node
      .append("text")
      .attr("class", "tile-text")
      .attr("x", "0")
      .attr("y", "0");

    node.each(function (d) {
      const currentElement = d3.select(this); // returns the current g.group
      const rectangleWidth = currentElement
        .select("rect")
        .node()
        .getAttribute("width");

      const words = d.data.name.split(" ").map((word) => {
        const wordSVGLength = currentElement
          .select("text")
          .text(word)
          .node()
          .getComputedTextLength();
        currentElement.select("text").text("");
        return [word, wordSVGLength];
      });

      const padding = 5;
      let y = 15;
      let text = "";
      let textSVGLength = 0;
      let count = 1;

      while (words.length > 0) {
        let wordSVGLength = words[0][1];

        if (wordSVGLength > rectangleWidth - 10 * padding) {
          text += words.shift()[0];
          textSVGLength = currentElement
            .select("text")
            .append("tspan")
            .text(text) // Single word in the tspan
            .attr("x", padding)
            .attr("y", y * count)
            .node()
            .getComputedTextLength();

          text = "";
          textSVGLength = 0;
          count++;
        } else {
          while (
            textSVGLength + wordSVGLength <= rectangleWidth - 10 * padding &&
            words.length > 0
          ) {
            if (text === "") {
              text += words.shift()[0];
              textSVGLength = currentElement
                .select("text")
                .append("tspan")
                .text(text) // First word in the tspan
                .attr("x", padding)
                .attr("y", y * count)
                .node()
                .getComputedTextLength();
            } else {
              text += " " + words.shift()[0];
              const lastTspan = currentElement
                .selectAll("text tspan")
                .nodes()
                .pop();
              textSVGLength = d3
                .select(lastTspan)
                .text(text)
                .node()
                .getComputedTextLength();
            }

            wordSVGLength = words.length > 0 ? words[0][1] : 0;
          }

          text = "";
          textSVGLength = 0;
          count++;
        }
      }
    });

    createLegend(categories, colorScale);
  };
}

// Legend creation with ResizeObserver
function createLegend(categories, colorScale) {
  const padding = 1.5; // outer padding
  const legendBox = 12;
  const legend = d3.select("#legend");
  const legendElement = legend.node();

  function updateLegendLayout() {
    // Clear existing legend items
    legend.selectAll("g").remove();

    const rem = parseFloat(
      window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("font-size")
    );
    const legendPadding =
      parseFloat(
        window
          .getComputedStyle(legendElement)
          .getPropertyValue("--legend-padding")
      ) * rem;
    const legendWidth =
      legendElement.getBoundingClientRect().width - 2 * legendPadding;

    const legendItemSpacing =
      (legendWidth - legendBox - 2 * padding) / (categories.length - 1);

    legend
      .selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr(
        "transform",
        (_, i) =>
          `translate(${i * legendItemSpacing + padding + legendPadding}, 0)`
      )
      .append("rect")
      .attr("width", legendBox)
      .attr("height", legendBox)
      .attr("class", "legend-item")
      .attr("fill", (d) => colorScale(d))
      .attr("stroke", "none");

    legend
      .selectAll("g")
      .append("text")
      .attr("fill", "red")
      .text((d) => d)
      .attr("x", legendBox / 2) // padding / 2: start at center of the legendBox
      .attr("y", 2 * legendBox + 5)
      .attr("text-anchor", "middle"); // Now, center the text
  }

  // Initial layout after a brief delay for CSS to settle
  setTimeout(() => {
    updateLegendLayout();
  }, 100);

  // Create ResizeObserver to watch the legend element
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // Only respond to size changes, not initial observation
      if (entry.contentRect.width > 0) {
        console.log("@observer");
        const chartSection = document.getElementById("chart-section");
        const transitionDuration = parseFloat(
          window
            .getComputedStyle(chartSection)
            .getPropertyValue("--snapping-to-duration")
        );

        const start = Date.now();

        function animate() {
          console.log("@animate");

          const now = Date.now();
          const elapsed = now - start;

          if (elapsed >= transitionDuration) {
            updateLegendLayout(); // Final update
            return;
          }

          updateLegendLayout();
          requestAnimationFrame(animate);
        }

        // First update
        updateLegendLayout();
        animate();
      }
    }
  });

  // Start observing the legend element
  resizeObserver.observe(legendElement);

  // Return cleanup function
  return () => {
    resizeObserver.disconnect();
  };
}
