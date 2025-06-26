import { colorThemes } from "../../color-themes.js";
import { setTooltipPos } from "../../assets/setTooltipPos.js";
export default function () {
  const url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

  const req = new XMLHttpRequest();

  req.open("GET", url, true);
  req.send();
  req.onload = () => {
    const res = JSON.parse(req.responseText);
    const { data: dataset } = res;

    dataset.forEach((d, i) => {
      const date = new Date(d[0]);
      dataset[i][0] = date;
    });

    const aspectRatio = 1.7;
    const viewBoxWidth = 1200;
    const viewBoxHeight = viewBoxWidth / aspectRatio;
    const padding = 100;
    const barWidth = (viewBoxWidth - 2 * padding) / dataset.length;
    const colorTheme = colorThemes[3];

    const minX = d3.min(dataset, (d) => d[0]);
    const maxX = d3.max(dataset, (d) => d[0]);
    const maxY = d3.max(dataset, (d) => d[1]);

    // @see {@link "https://github.com/d3/d3-time-format"}
    const formatYear = d3.timeFormat("%Y");
    const formatDate = d3.timeFormat("%Y-%m-%d");

    // @see {@link "https://github.com/d3/d3-scale/blob/v4.0.2/README.md#time-scales"}
    const xScale = d3
      .scaleTime()
      .domain([minX, maxX])
      .range([padding, viewBoxWidth - padding]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxY])
      .range([viewBoxHeight - padding, padding]);

    const chart = d3
      .select("#chart")
      .attr("class", "bar-chart")
      .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const tooltip = d3.select("#tooltip");

    d3.select("#chart-title").text("US Gross Domestic Product $Bn");

    d3.select("#chart-source a")
      .text("freeCodeCamp Project Reference Data")
      .attr("href", "http://www.bea.gov/national/pdf/nipaguid.pdf");

    // Define gradient in SVG defs (add this before creating bars)
    const defs = chart.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "barGradient")
      .attr("gradientUnits", "userSpaceOnUse") // Gradient uses actual chart's viewBox coordinates
      .attr("x1", "0")
      .attr("y1", padding) // Chart top
      .attr("x2", "0")
      .attr("y2", viewBoxHeight - padding); // Chart bottom

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorTheme[3])
      .attr("stop-opacity", 1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorTheme[1])
      .attr("stop-opacity", 1);

    chart
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d[0]))
      .attr("y", (d) => yScale(d[1]))
      .attr("width", barWidth)
      .attr("height", (d) => viewBoxHeight - padding - yScale(d[1]))
      .attr("class", "bar")
      .attr("fill", "url(#barGradient)")
      .attr("data-date", (d) => formatDate(d[0]))
      .attr("data-gdp", (d) => d[1])
      .on("mouseover", (event, d) => {
        const xAxisRect = d3.select("#x-axis").node().getBoundingClientRect();
        const y = xAxisRect.bottom;
        const date = formatDate(d[0]);

        const tooltipContent = `
        <div id="tooltip-content">
          <p id="tooltip-title">US Gross Domestic Product</p>
          
          <div class="data current">
            <div>
              <p class="value">$${d[1]}</p>
              <p class="label">Billion</p>
            </div>
            
            <p class="label">${date}</p>
          </div>
          
          <div id="tooltip-footer">
            <p>Quarterly Data</p>
          </div>
        </div>`;

        // Set tooltip content
        tooltip.html(tooltipContent).attr("data-date", date);

        setTooltipPos(event, tooltip);
      })
      .on("mouseout", (event) => {
        setTooltipPos(event, tooltip);
      });

    // @see {@link "https://github.com/d3/d3-axis/blob/v3.0.0/README.md#axis_tickPadding"}

    const xAxisGenerator = d3.axisBottom(xScale).tickFormat(formatYear);
    const yAxisGenerator = d3.axisLeft(yScale);

    const xAxis = chart
      .append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${viewBoxHeight - padding})`)
      .call(xAxisGenerator);

    const yAxis = chart
      .append("g")
      .attr("id", "y-axis")
      .attr("class", "axis")
      .attr("transform", `translate(${padding}, 0)`)
      .call(yAxisGenerator);

    xAxis.selectAll("g").attr("class", "tick");
    yAxis.selectAll("g").attr("class", "tick");
  };
}
