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

  const requested = Date.now();

  req.open("GET", url, true);
  req.send();
  req.onload = () => {
    const loaded = Date.now();

    console.log("loaded tree map in:", (loaded - requested) * 0.001 + "s");

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

    // Replace the complex text wrapping with this simpler version
    node.each(function (d) {
      const currentElement = d3.select(this);
      const rectangleWidth = currentElement
        .select("rect")
        .node()
        .getAttribute("width");

      // Simple approach: truncate long titles
      const maxChars = Math.floor(rectangleWidth / 8); // Approximate chars that fit
      const title = d.data.name;

      if (title.length <= maxChars) {
        // Short title - just display it
        currentElement
          .select("text")
          .append("tspan")
          .text(title)
          .attr("x", 5)
          .attr("y", 15);
      } else {
        // Long title - split into 2-3 lines max
        const words = title.split(" ");
        const lines = [];
        let currentLine = "";

        words.forEach((word) => {
          if ((currentLine + word).length <= maxChars) {
            currentLine += (currentLine ? " " : "") + word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);

        // Display max 3 lines
        lines.slice(0, 3).forEach((line, i) => {
          currentElement
            .select("text")
            .append("tspan")
            .text(line)
            .attr("x", 5)
            .attr("y", 15 + i * 12);
        });
      }
    });

    const drawn = Date.now();

    console.log("drawn tree map in:", (drawn - loaded) * 0.001 + "s");

    setLegend(categories, colorScale, viewBoxWidth);
  };
}

function setLegend(categories, colorScale, width) {
  // Clear existing legend items
  legend.selectAll("*").remove();

  const legend = d3.select("#chart.tree-map ~ #legend");
  const legendElement = legend.node();

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

  const chartPadding = 1.5;
  const padding = legendPadding + chartPadding;

  const legendViewBoxWidth = width;
  const legendCellLength = 12;
  const legendViewBoxHeight = legendCellLength + 2 * rem;

  const legendItemSpacing =
    (legendViewBoxWidth - legendCellLength - 2 * padding) /
    (categories.length - 1);
  const legendViewBox = `0 0 ${legendViewBoxWidth} ${legendViewBoxHeight}`;

  // ! Important: DO NOT set preserveAspectRatio to "xMidYMid meet"
  // ! This will shorten the legend's viewBox to preserve aspect ratio
  // ! Set height to "auto" in CSS to preserve aspect ratio
  legend.attr("viewBox", legendViewBox).attr("preserveAspectRatio", "none");

  legend
    .selectAll("g")
    .data(categories)
    .enter()
    .append("g")
    .append("rect")
    .attr("x", (_, i) => i * legendItemSpacing + padding)
    .attr("y", 0)
    .attr("width", legendCellLength)
    .attr("height", legendCellLength)
    .attr("class", "legend-item")
    .attr("fill", (d) => colorScale(d))
    .attr("stroke", "none")
    .attr("stroke-width", 0);

  legend
    .selectAll("g")
    .append("text")
    .text((d) => d)
    .attr("x", (_, i) => i * legendItemSpacing + padding + legendCellLength / 2) // padding / 2: start at center of the legendBox
    .attr("y", 2 * legendCellLength + 5)
    .attr("text-anchor", "middle"); // Horizontally enter the text
}
