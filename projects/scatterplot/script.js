import { colorThemes } from "../../color-themes.js";
import { setTooltipPos } from "../../assets/setTooltipPos.js";

export default function () {
  const url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";

  const req = new XMLHttpRequest();

  req.open("GET", url, true);
  req.send();
  req.onload = () => {
    const dataset = JSON.parse(req.responseText);

    dataset.forEach((d) => {
      d.Seconds = new Date(d.Seconds * 1000);
    });

    const aspectRatio = 1.7;
    const viewBoxWidth = 1200;
    const viewBoxHeight = viewBoxWidth / aspectRatio;
    const padding = 100;
    const xDomainPadding = 1; // 1 year padding
    const r = 6;

    const minX = d3.min(dataset, (d) => d.Year);
    const maxX = d3.max(dataset, (d) => d.Year);
    const minY = d3.min(dataset, (d) => d.Seconds);
    const maxY = d3.max(dataset, (d) => d.Seconds);

    const [doping, noDoping] = colorThemes[4];

    const chart = d3
      .select("#chart")
      .attr("class", "scatter-plot")
      .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const tooltip = d3.select("#tooltip");

    d3.select("#chart-title").text("Doping in Professional Bicycle Racing");
    d3.select("#chart-title-description").text(
      "35 Fastest times up Alpe d'Huez"
    );
    d3.select("#chart-source a")
      .text("freeCodeCamp Project Reference Data")
      .attr("href", url);

    const xScale = d3
      .scaleLinear()
      .domain([minX - xDomainPadding, maxX + xDomainPadding])
      .range([padding, viewBoxWidth - padding]);

    const yScale = d3
      .scaleTime()
      .domain([minY, maxY])
      .range([padding, viewBoxHeight - padding]);

    chart
      .selectAll("circle")
      .data(dataset)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.Year))
      .attr("cy", (d) => yScale(d.Seconds))
      .attr("r", r)
      .attr("class", "dot")
      .attr("data-xvalue", (d) => d.Year)
      .attr("data-yvalue", (d) => d.Seconds)
      .attr("fill", (d) => (d.Doping ? doping : noDoping)) // .attr instead of style to allow :hover
      .on("mouseover", (event, d) => {
        const tooltipContent = `
        <div id="tooltip-content">
          <p id="tooltip-title">Doping in Professional Bicycle Racing</p>
          
          <div class="data current">
            <p class="value"><span>Time:</span><span>${d.Time}</span></p>
            <p class="label"><span>Year:</span><span>${d.Year}</span></p>
            <p class="label"><span>${d.Name}:</span><span>${d.Nationality}</span></p>
          </div>
          
          <div id="tooltip-footer" style="color: ${d.Doping ? doping : noDoping};">
            <p>${d.Doping || "No doping allegations reported"}</p>
          </div>
        </div>`;

        // Set tooltip content
        tooltip.html(tooltipContent).attr("data-year", d.Year);

        setTooltipPos(event, tooltip);
      })
      .on("mouseout", (event) => {
        setTooltipPos(event, tooltip);
      });

    const xvalueFormat = d3.format("d");
    const yvalueFormat = d3.timeFormat("%M:%S");

    const xAxisGenerator = d3.axisBottom(xScale).tickFormat(xvalueFormat);
    const yAxisGenerator = d3.axisLeft(yScale).tickFormat(yvalueFormat);

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

    chart
      .append("text")
      .text("Time in Minutes")
      .attr("x", padding + 16)
      .attr("y", viewBoxHeight / 2)
      .attr("transform", `rotate(-90, ${padding + 16}, ${viewBoxHeight / 2})`)
      .style("text-anchor", "middle");

    const colorScale = d3
      .scaleOrdinal()
      .domain([
        "Riders with doping allegations",
        "No doping allegations reported",
      ])
      .range([doping, noDoping]);

    const recLength = r * 1.85;

    const legend = chart
      .append("g")
      .attr("id", "legend")
      .attr(
        "transform",
        `translate(${viewBoxWidth - padding - recLength}, ${padding})`
      );

    legend
      .selectAll("g")
      .data(colorScale.domain())
      .enter()
      .append("g")
      .attr("class", "legend-label")
      .attr("transform", (_, i) => {
        return `translate(0, ${i * 20})`;
      });

    legend
      .selectAll("g")
      .append("rect")
      .attr("height", recLength)
      .attr("width", recLength)
      .attr("fill", (d) => colorScale(d));

    legend
      .selectAll("g")
      .append("text")
      .text((d) => d)
      .attr("transform", `translate(-6, 9)`)
      .style("text-anchor", "end");
  };
}
