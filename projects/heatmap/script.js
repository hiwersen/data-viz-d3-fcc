import { colorThemes } from "../../color-themes.js";
import { setTooltipPos } from "../../assets/setTooltipPos.js";

export default function () {
  const url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

  const req = new XMLHttpRequest();

  req.open("GET", url, true);
  req.send();
  req.onload = () => {
    const response = JSON.parse(req.responseText);
    const { monthlyVariance: dataset, baseTemperature } = response;

    dataset.forEach((d) => {
      --d.month;
      d.temperature = baseTemperature + d.variance;
    });

    const minX = d3.min(dataset, (d) => d.year);
    const maxX = d3.max(dataset, (d) => d.year);
    const minY = d3.min(dataset, (d) => d.month);
    const maxY = d3.max(dataset, (d) => d.month);

    const stats = getStats(dataset);
    const maxTemp = stats.max.temperature;
    const maxYear = stats.max.year;
    const maxMonth = stats.max.month;

    const minTemp = stats.min.temperature;
    const minYear = stats.min.year;
    const minMonth = stats.min.month;

    //console.log(stats);

    const aspectRatio = 2.4;
    const viewBoxWidth = 1200;
    const viewBoxHeight = viewBoxWidth / aspectRatio;
    const paddingWidth = 85; // Allow space for vertical axis
    const paddingHeight = 60; // Allow space for horizontal axis
    const domainPadding = 1; // 1 year
    const cellWidth = viewBoxWidth / (maxX - minX + 1);
    const cellHeight = (viewBoxHeight - 2 * paddingHeight) / 12;

    const chart = d3
      .select("#chart")
      .attr("class", "heat-map")
      .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const tooltip = d3.select("#tooltip");

    d3.select("#chart-title").text("Global Land-Surface Temperature");
    d3.select("#chart-title-description").text(
      `${minX} - ${maxX}: base temperature ${baseTemperature}℃`
    );
    d3.select("#chart-source a")
      .text("freeCodeCamp Project Reference Data")
      .attr("href", url);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthScale = d3.scaleQuantize().domain([0, 11]).range(months);

    const colorTheme = colorThemes[2];
    const colorScale = d3
      .scaleQuantize()
      .domain([minTemp, maxTemp])
      .range(colorTheme);

    const xScale = d3
      .scaleLinear()
      .domain([minX, maxX + domainPadding])
      .range([paddingWidth, viewBoxWidth - paddingWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([minY, maxY])
      .range([viewBoxHeight - paddingHeight - cellHeight, paddingHeight]);

    chart
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.year))
      .attr("y", (d) => yScale(d.month))
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", (d) => colorScale(d.temperature))
      .attr("class", "cell")
      .attr("data-year", (d) => d.year)
      .attr("data-month", (d) => d.month)
      .attr("data-temp", (d) => d.temperature)
      .on("mouseover", (event, d) => {
        // Create tooltip content

        const currentYear = d.year;

        const {
          temperature: annualMaxTemp,
          year: annualMaxYear,
          month: annualMaxMonth,
        } = stats.annualMax[currentYear];

        const {
          temperature: annualMinTemp,
          year: annualMinYear,
          month: annualMinMonth,
        } = stats.annualMin[currentYear];

        const tooltipContent = `<div id="tooltip-content">
              <p id="tooltip-title">Global Land-Surface Temperature</p>
              <div id="data-container">

                <div class="data-section max">
                  <div class="data total">
                    <p class="value">Max.: ${maxTemp.toFixed(1)}℃</p>
                    <p class="label">${maxYear} - ${monthScale(maxMonth)}</p>
                  </div>
                  <div class="data year">
                    <p class="value">Annual max.: ${annualMaxTemp.toFixed(1)}℃</p>
                    <p class="label">${annualMaxYear} - ${monthScale(annualMaxMonth)}</p>
                  </div>
                </div>
                
                <div class="data-section current">
                <div class="data">
                  <p class="value">${d.temperature.toFixed(1)}℃</p>
                  <p class="label">${d.year} - ${monthScale(d.month)}</p>
                </div>
                </div>

                <div class="data-section min">
                  <div class="data total">
                    <p class="value">Min.: ${minTemp.toFixed(1)}℃</p>
                    <p class="label">${minYear} - ${monthScale(minMonth)}</p>
                  </div>
                  <div class="data year">
                    <p class="value">Annual min.: ${annualMinTemp.toFixed(1)}℃</p>
                    <p class="label">${annualMinYear} - ${monthScale(annualMinMonth)}</p>
                  </div>
                </div>
                
              </div>
              <div id="tooltip-footer">
                <p>Base temperature ${baseTemperature}℃</p>
              </div>
            </div>`;

        // Set tooltip content
        tooltip
          .html(tooltipContent)
          .attr("data-year", d.year)
          .attr("data-month", d.month)
          .attr("data-temp", d.temperature);

        setTooltipPos(event, tooltip);
      })
      .on("mouseout", (event) => {
        setTooltipPos(event, tooltip);
      });

    const yearFormat = d3.format("d");
    const xAxisGenerator = d3.axisBottom(xScale).tickFormat(yearFormat);
    const yAxisGenerator = d3.axisLeft(yScale).tickFormat(monthScale);

    const xAxis = chart
      .append("g")
      .attr("id", "x-axis")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${viewBoxHeight - paddingHeight})`)
      .call(xAxisGenerator);

    const yAxis = chart
      .append("g")
      .attr("id", "y-axis")
      .attr("class", "axis")
      .attr("transform", `translate(${paddingWidth}, ${cellHeight / 2})`)
      .call(yAxisGenerator);

    xAxis.selectAll("g").attr("class", "tick");
    yAxis.selectAll("g").attr("class", "tick");

    const legendH = colorScale.range().length * cellHeight;

    const legend = chart
      .append("g")
      .attr("id", "legend")
      .attr(
        "transform",
        `translate(${viewBoxWidth - paddingWidth + 15}, ${viewBoxHeight / 2 + legendH / 2})`
      );

    legend
      .selectAll("rect")
      .data(colorScale.range())
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (_, i) => -(++i * cellHeight))
      .attr("height", cellHeight)
      .attr("width", cellWidth)
      .attr("fill", (d) => d);

    const legendScale = d3
      .scaleLinear()
      .domain([minTemp, maxTemp])
      .range([0, -(cellHeight * colorScale.range().length)]);

    const getLegendValues = (minTemp, maxTemp, tickNum) => {
      const values = [];
      const range = (maxTemp - minTemp) / tickNum;
      let value = minTemp;

      while (value <= maxTemp) {
        values.push(value);
        value += range;
      }
      return values;
    };

    const legendAxisGenerator = d3
      .axisRight(legendScale)
      .tickValues(getLegendValues(minTemp, maxTemp, colorScale.range().length))
      .tickFormat(d3.format(".2f"));

    const legendAxis = legend
      .append("g")
      .attr("id", "legend-axis")
      .attr("transform", `translate(${cellWidth},0)`)
      .call(legendAxisGenerator);

    legendAxis.selectAll("g").attr("class", "tick");
  };
}

function getStats(data) {
  const stats = {
    max: data[0],
    min: data[0],
    annualMax: {}, // Dynamically initialized
    annualMin: {}, // Dynamically initialized
  };

  data.forEach((temp) => {
    if (temp.temperature > stats.max.temperature) {
      stats.max = temp;
    }

    if (temp.temperature < stats.min.temperature) {
      stats.min = temp;
    }

    stats.annualMax[temp.year] = stats.annualMax[temp.year] || temp;
    stats.annualMin[temp.year] = stats.annualMin[temp.year] || temp;

    if (temp.temperature > stats.annualMax[temp.year].temperature) {
      stats.annualMax[temp.year] = temp;
    }

    if (temp.temperature < stats.annualMin[temp.year].temperature) {
      stats.annualMin[temp.year] = temp;
    }
  });

  return stats;
}
