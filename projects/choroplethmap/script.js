import { colorThemes } from "../../color-themes.js";

export default function () {
  console.log("hello choropleth map");

  const svgRatio = 1.6;
  const viewBoxWidth = 960;
  const viewBoxHeight = viewBoxWidth / svgRatio;
  const colorTheme = [...colorThemes[1]].reverse(); // CAUTION: reverse "in place" will change the original array
  const stateStroke = colorTheme.at(3); // "white";

  const chartSvg = d3
    .select("#chart")
    //.append("svg")
    //.attr("id", "svg")
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const counties = chartSvg.append("g").attr("id", "counties");
  const states = chartSvg.append("g").attr("id", "states");

  const tooltip = d3.select("#tooltip");
  /*
    .select("#chart-page")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "screen showUp");
    */

  d3.select("#chart-title").text("United States Educational Attainment");
  /*.select("#chart-title")
    .append("h1")
    .text("United States Educational Attainment")
    .attr("id", "title");
    */

  d3.select("#chart-title-description").text(
    "Percentage of adults age 25 and older with a bachelor's degree or higher"
  );
  /*.select("#chart-title")
    .append("p")
    .text(
      "Percentage of adults age 25 and older with a bachelor's degree or higher"
    )
    .attr("id", "title-description");
    */

  d3.select("#chart-source a")
    .text("USDA Economic Research Service")
    .attr(
      "href",
      "https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx"
    );
  /*
  .select("#chart-source").html(
    `Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="_blank">USDA Economic Research Service</a>`
  );
  */

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
            <div id="tooltip-content">
              <p id="tooltip-title">Higher education</p>
              <div id="data-container">

                <div class="data-max">
                  <div class="data national-max">
                    <p class="data-title">National max</p>
                    <p class="data-value">${feature.properties.area_name}, ${feature.properties.state}: ${feature.properties.education}%</p>
                  </div>
                  <div class="data state-max">
                    <p class="data-title">State max</p>
                    <p class="data-value">${feature.properties.area_name}, ${feature.properties.state}: ${feature.properties.education}%</p>
                  </div>
                </div>
                
                <div class="data current-county">
                  <p class="data-title">${feature.properties.area_name}, ${feature.properties.state}:</p>
                  <p class="data-value">${feature.properties.education}%</p>
                </div>

                <div class="data-min">
                  <div class="data national-min">
                    <p class="data-title">National min</p>
                    <p class="data-value">${feature.properties.area_name}, ${feature.properties.state}: ${feature.properties.education}%</p>
                  </div>
                  <div class="data state-min">
                    <p class="data-title">State min</p>
                    <p class="data-value">${feature.properties.area_name}, ${feature.properties.state}: ${feature.properties.education}%</p>
                  </div>
                </div>
                
              </div>
              <div id="county-minimap" class="flex-c">
                  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" >
                      <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
                        <path d="${pathData}"/>
                      </g>
                  </svg>
              </div>
              <div id="tooltip-footer">Adults with a bachelor's degree or higher</div>
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
            .style("opacity", "1");
        })
        .on("mouseout", () => {
          tooltip
            .style("top", "-1000px")
            .style("left", "-1000px")
            .style("opacity", "0");
        });

      states
        .selectAll("path")
        .data(featuresStates)
        .enter()
        .append("path")
        .attr("class", "state")
        .attr("fill", "none")
        .attr("stroke", stateStroke)
        .attr("stroke-width", 0.7)
        .attr("d", d3.geoPath());

      const legendViewBoxWidth = 250;
      const legendViewBoxHeight = 8;
      const legendPadding = 14;
      const legendCellWidth = legendViewBoxWidth / colorScale.range().length;
      const legendViewBox = `0 0 ${legendViewBoxWidth + legendPadding * 2} ${legendViewBoxHeight + legendPadding * 1.5}`;

      const legend = d3
        .select("#legend")
        //.append("svg")
        //.attr("id", "legend")
        .attr("viewBox", legendViewBox)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("id", "legend-bar")
        .attr("transform", `translate(${legendPadding}, 0)`);

      legend
        .selectAll("rect")
        .data(colorScale.range())
        .enter()
        .append("rect")
        .attr("x", (_, i) => i * legendCellWidth)
        .attr("y", 0)
        .attr("width", legendCellWidth)
        .attr("height", legendViewBoxHeight)
        .attr("fill", (d) => d);

      const legendScale = d3
        .scaleLinear()
        .domain([minEdu / 100, maxEdu / 100])
        .range([0, legendViewBoxWidth]);

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
        .attr("transform", `translate(0, ${legendViewBoxHeight})`)
        .call(legendAxisGenerator);

      legendAxis.selectAll("g").attr("class", "tick");
    };
  };
}

/* ! TODO: remove this block once chartManager is implemented

document.addEventListener("DOMContentLoaded", () => {
  // Disable all transitions/animations for initial calculations
  document.body.classList.add("no-transitions");

  new UpdateChartDimensions(
    svgRatio,
    0.1, // 25% max-discount
    0.2
  );

  document.getElementById("chart-modal").show();

  //updateNavbarPosition();
  drawChart();

  // Re-enable transitions/animations
  // Use RAF to ensure all layout calculations are complete
  requestAnimationFrame(() => {
    document.body.classList.remove("no-transitions");
  });
});

window.addEventListener("resize", () => {
  // updateNavbarPosition();
});
*/

// ! TODO: add dynamic max and min data to tooltip:

/**
 * // Before creating the counties, calculate min/max values
function calculateMinMaxValues(data) {
  // Initialize variables to store min/max values
  const stats = {
    nationalMin: { value: Infinity, county: null },
    nationalMax: { value: -Infinity, county: null },
    stateMinMax: {} // Will store min/max for each state
  };
  
  // Process all counties to find national min/max
  data.forEach(feature => {
    const education = feature.properties.education;
    const state = feature.properties.state;
    const countyName = feature.properties.area_name;
    const fips = feature.properties.fips;
    
    // Check for national min/max
    if (education < stats.nationalMin.value) {
      stats.nationalMin = { 
        value: education, 
        county: countyName, 
        state: state,
        fips: fips
      };
    }
    
    if (education > stats.nationalMax.value) {
      stats.nationalMax = { 
        value: education, 
        county: countyName, 
        state: state,
        fips: fips
      };
    }
    
    // Initialize state stats if first time seeing this state
    if (!stats.stateMinMax[state]) {
      stats.stateMinMax[state] = {
        min: { value: Infinity, county: null, fips: null },
        max: { value: -Infinity, county: null, fips: null }
      };
    }
    
    // Check for state min/max
    if (education < stats.stateMinMax[state].min.value) {
      stats.stateMinMax[state].min = { 
        value: education, 
        county: countyName,
        fips: fips
      };
    }
    
    if (education > stats.stateMinMax[state].max.value) {
      stats.stateMinMax[state].max = { 
        value: education, 
        county: countyName,
        fips: fips
      };
    }
  });
  
  return stats;
}

// Calculate stats before rendering
const educationStats = calculateMinMaxValues(featuresCounties);

// Now use these stats in your mouseover handler
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
    // Path setup code remains the same...
    
    // Get state min/max for the current county's state
    const state = feature.properties.state;
    const stateMin = educationStats.stateMinMax[state].min;
    const stateMax = educationStats.stateMinMax[state].max;
    const nationalMin = educationStats.nationalMin;
    const nationalMax = educationStats.nationalMax;
    
    // Create tooltip content with dynamic min/max values
    const tooltipContent = `
      <div id="tooltip-content">
        <p id="tooltip-title">Higher education</p>
        <div id="data-container">

          <div class="data-max">
            <div class="data national-max">
              <p class="data-title">National max</p>
              <p class="data-value">${nationalMax.county}, ${nationalMax.state}: ${nationalMax.value}%</p>
            </div>
            <div class="data state-max">
              <p class="data-title">State max</p>
              <p class="data-value">${stateMax.county}, ${state}: ${stateMax.value}%</p>
            </div>
          </div>
          
          <div class="data current-county">
            <p class="data-title">${feature.properties.area_name}, ${state}:</p>
            <p class="data-value">${feature.properties.education}%</p>
          </div>

          <div class="data-min">
            <div class="data national-min">
              <p class="data-title">National min</p>
              <p class="data-value">${nationalMin.county}, ${nationalMin.state}: ${nationalMin.value}%</p>
            </div>
            <div class="data state-min">
              <p class="data-title">State min</p>
              <p class="data-value">${stateMin.county}, ${state}: ${stateMin.value}%</p>
            </div>
          </div>
          
        </div>
        <div id="county-minimap" class="flex-c">
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" >
                <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
                  <path d="${pathData}" fill="${colorScale(feature.properties.education)}"/>
                </g>
            </svg>
        </div>
        <div id="tooltip-footer">Adults with a bachelor's degree or higher</div>
      </div>`;

    // Rest of your tooltip setup...
    tooltip
      .html(tooltipContent)
      .attr("data-education", feature.properties.education)
      .style("opacity", 1)
      // ... other tooltip styles
  });
*/
