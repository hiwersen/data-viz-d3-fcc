import { colorThemes } from "../../color-themes.js";

document.addEventListener("DOMContentLoaded", () => {
  const colorTheme = colorThemes[2];

  const chartWidth = 960; // ! TODO: make it dynamic
  const chartHeight = 600; // ! TODO: make it dynamic

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "screen");

  const chartSvg = d3
    .select("#chart-svg")
    .append("svg")
    .attr("id", "svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight);

  const counties = chartSvg.append("g").attr("id", "counties");
  const states = chartSvg.append("g").attr("id", "states");

  d3.select("#chart-title")
    .append("h1")
    .text("United States Educational Attainment")
    .attr("id", "title");

  d3.select("#chart-title")
    .append("p")
    .text(
      "Percentage of adults age 25 and older with a bachelor's degree or higher"
    )
    .attr("id", "title-description");

  d3.select("#chart-footer")
    .append("div")
    .attr("id", "source")
    .html(
      `Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="_blank">USDA Economic Research Service</a>`
    );

  const req = new XMLHttpRequest();

  const urlCountyData =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
  const urlEducationData =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

  req.open("GET", urlCountyData, true);
  req.send();
  req.onload = () => {
    const countyData = JSON.parse(req.responseText);

    req.open("GET", urlEducationData, true);
    req.send();
    req.onload = () => {
      const educationData = JSON.parse(req.responseText);

      educationData.forEach((elem) => {
        elem.education = elem.bachelorsOrHigher;
        delete elem.bachelorsOrHigher;
      });

      const educationLookup = {};

      educationData.forEach((elem) => {
        educationLookup[elem.fips] = elem;
      });

      const featuresStates = topojson.feature(
        countyData,
        countyData.objects.states
      ).features;
      const featuresCounties = topojson.feature(
        countyData,
        countyData.objects.counties
      ).features;

      featuresCounties.forEach((elem) => {
        elem.properties = educationLookup[elem.id];
      });

      const minEdu = d3.min(educationData, ({ education }) => education);
      const maxEdu = d3.max(educationData, ({ education }) => education);

      const colorScale = d3
        .scaleQuantize()
        .domain([minEdu, maxEdu]) // both are inclusive
        .range(colorTheme);

      counties
        .selectAll("path")
        .data(featuresCounties)
        .enter()
        .append("path")
        .attr("class", "county")
        .attr("data-fips", (feature) => feature.properties.fips)
        .attr("data-education", (feature) => feature.properties.education)
        .attr("fill", (feature) => colorScale(feature.properties.education))
        .attr("d", d3.geoPath())
        .on("mouseover", (event, feature) => {
          // Create a geoPath generator for the tooltip
          const path = d3.geoPath();
          // Get the path data for this county
          const pathData = path(feature);

          // Calculate minimap's size
          const bounds = path.bounds(feature);
          const width = 300; // Fixed width for the minimap
          const height = 300; // Fixed height for the minimap

          // Calculate the center point of the bounds
          const centerX = (bounds[1][0] + bounds[0][0]) / 2;
          const centerY = (bounds[1][1] + bounds[0][1]) / 2;

          // Calculate the scale to fit the county in the minimap
          const boundsWidth = Math.abs(bounds[1][0] - bounds[0][0]);
          const boundsHeight = Math.abs(bounds[1][1] - bounds[0][1]);
          const scale =
            Math.min(width / boundsWidth, height / boundsHeight) * 1.0; // 0.95 adds some padding

          // Calculate the translation to center the county in the minimap
          const translateX = width / 2 - centerX * scale;
          const translateY = height / 2 - centerY * scale;

          // Create tooltip content
          const tooltipContent = `
            <div id="tooltip-content" class="flex-c">
              <p id="tooltip-title">${feature.properties.area_name}, ${feature.properties.state}</p>
                <div id="data-container flex-c">
                  <div class="data">
                    <p class="data-title">Higher education:</p>
                    <p class="data-value">${feature.properties.education}%</p>
                  </div>
                </div>
                <div id="county-minimap" class="flex-c">
                    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" >
                        <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
                          <path d="${pathData}"/>
                        </g>
                    </svg>
                </div>
            </div>`;

          // Set tooltip content
          tooltip
            .html(tooltipContent)
            .attr("data-education", feature.properties.education);

          // Get tooltip dimensions
          const tooltipRect = tooltip.node().getBoundingClientRect();
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;

          // Get viewport dimensions
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Define initial position and margin
          let top = event.pageY - 30;
          let left = event.pageX + 15;
          const margin = 5;

          // Check if tooltip would extend beyond right edge of viewport
          if (left + tooltipWidth > viewportWidth - margin) {
            left = event.pageX - 15 - tooltipWidth; // Place it to the left
          }

          // Check if tooltip would extend beyond bottom edge of viewport
          if (top + tooltipHeight > viewportHeight - margin) {
            top = event.pageY + 30 - tooltipHeight; // Place it above cursor
          }

          // Check if tooltip would extend beyond left edge of viewport
          if (left < margin) {
            left = margin; // Keep it at the left margin
          }

          // Check if tooltip would extend beyond top edge of viewport
          if (top < margin) {
            top = margin; // Keep it at the top margin
          }

          // Apply position make it visible
          tooltip
            .style("top", top + "px")
            .style("left", left + "px")
            .style("visibility", "visible");
        })
        .on("mouseout", () => {
          tooltip
            .style("top", "-1000px")
            .style("left", "-1000px")
            .style("visibility", "hidden");
        });

      states
        .selectAll("path")
        .data(featuresStates)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", d3.geoPath());

      const legendW = 250;
      const legendH = 8;
      const legendPadding = 14;
      const legendCellW = legendW / colorScale.range().length;

      const legend = d3
        .select("#chart-footer")
        .append("div")
        .attr("id", "legend-container")
        .append("svg")
        .attr("width", legendW + legendPadding * 2)
        .attr("height", legendH + legendPadding * 1.5)
        .append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${legendPadding}, 0)`);

      legend
        .selectAll("rect")
        .data(colorScale.range())
        .enter()
        .append("rect")
        .attr("x", (_, i) => i * legendCellW)
        .attr("y", 0)
        .attr("width", legendCellW)
        .attr("height", legendH)
        .attr("fill", (d) => d);

      const legendScale = d3
        .scaleLinear()
        .domain([minEdu / 100, maxEdu / 100])
        .range([0, legendW]);

      const getTickValues = (min, max, Categorynum) => {
        let ticks = [];
        const range = (max - min) / Categorynum;
        let tick = min;

        while (ticks.length <= Categorynum) {
          // The last tick value is inclusive
          ticks.push(Number.parseFloat(tick.toFixed(1)) / 100);
          tick += range;
        }
        return ticks;
      };

      const legendAxisGenerator = d3
        .axisBottom(legendScale)
        .tickValues(getTickValues(minEdu, maxEdu, colorScale.range().length))
        .tickFormat(d3.format("0.0%"));

      const legendAxis = legend
        .append("g")
        .attr("id", "legend-axis")
        .attr("transform", `translate(0, ${legendH})`)
        .call(legendAxisGenerator);

      legendAxis.selectAll("g").attr("class", "tick");
    };
  };
});
