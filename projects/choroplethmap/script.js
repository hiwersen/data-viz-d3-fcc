import { colorThemes } from "../../color-themes.js";
import { setTooltipPos } from "../../assets/setTooltipPos.js";

export default function () {
  const svgRatio = 1.6;
  const viewBoxWidth = 960;
  const viewBoxHeight = viewBoxWidth / svgRatio;
  const colorTheme = [...colorThemes[1]].reverse(); // CAUTION: reverse in "in place", thus ti will change the original array
  const stateStroke = colorTheme.at(3); // "white";

  const chart = d3
    .select("#chart")
    .attr("class", "choropleth-map")
    .attr("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const counties = chart.append("g").attr("id", "counties");
  const states = chart.append("g").attr("id", "states");

  const tooltip = d3.select("#tooltip");

  d3.select("#chart-title").text("US Higher Education Attainment");

  d3.select("#chart-title-description").text(
    "Percentage of adults age 25 and older with a bachelor's degree or higher"
  );

  d3.select("#chart-source a")
    .text("USDA Economic Research Service")
    .attr(
      "href",
      "https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx"
    );

  const req = new XMLHttpRequest();

  const requested = Date.now();

  const urlCountyData =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
  const urlEducationData =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";

  req.open("GET", urlCountyData, true);
  req.send();
  req.onload = () => {
    const loaded = Date.now();

    console.log(
      "loaded choropleth map in:",
      (loaded - requested) * 0.001 + "s"
    );

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

      // Calculate stats before rendering
      const stats = getStats(featuresCounties);
      const { nationalMin, nationalMax } = stats;

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

          // Get stats for current county
          const state = feature.properties.state;
          const { min: stateMin, max: stateMax } = stats.stateStats[state];

          // Create tooltip content
          const tooltipContent = `
            <div id="tooltip-content">
              <p id="tooltip-title">US Higher Education</p>
              <div id="data-container">

                <div class="data-max">
                  <div class="data national-max">
                    <p class="data-title">National max.: ${nationalMax.education}%</p>
                    <p class="data-value">${nationalMax.county}, ${nationalMax.state}</p>
                  </div>
                  <div class="data state-max">
                    <p class="data-title">State max.: ${stateMax.education}%</p>
                    <p class="data-value">${stateMax.county}, ${state}</p>
                  </div>
                </div>
                
                <div class="data current-county">
                  <p class="data-title">${feature.properties.area_name}, ${state}:</p>
                  <p class="data-value">${feature.properties.education}%</p>
                </div>

                <div class="data-min">
                  <div class="data national-min">
                    <p class="data-title">National min.: ${nationalMin.education}%</p>
                    <p class="data-value">${nationalMin.county}, ${nationalMin.state}</p>
                  </div>
                  <div class="data state-min">
                    <p class="data-title">State min.: ${stateMin.education}%</p>
                    <p class="data-value">${stateMin.county}, ${state}</p>
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

          setTooltipPos(event, tooltip);
        })
        .on("mouseout", (event) => {
          setTooltipPos(event, tooltip);
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

      function setLegend() {
        // Clear existing legend items
        legend.selectAll("*").remove();

        const chartElement = document.querySelector("#chart");
        if (!chartElement.classList.contains("choropleth-map")) return;

        const legendElement = document.querySelector("#chart ~ #legend");
        if (!legendElement.classList.contains("set")) return;

        const legend = d3.select("#chart.choropleth-map ~ #legend");

        const getProp = (id, prop) =>
          parseFloat(
            window
              .getComputedStyle(document.getElementById(id))
              .getPropertyValue(prop)
          );

        const rem = parseFloat(
          window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("font-size")
        );
        const legendPadding = getProp("legend", "--padding") * rem;
        const legendWidth = getProp("legend", "--width") * rem;
        const legendHeight = getProp("legend", "--height") * rem;

        const legendViewBoxWidth = legendWidth;
        const legendViewBoxHeight = legendHeight;

        const legendCellWidth = legendViewBoxWidth / colorScale.range().length;
        const legendViewBox = `0 0 ${legendViewBoxWidth + legendPadding * 2} ${legendViewBoxHeight + legendPadding * 1.5}`;

        legend
          .attr("viewBox", legendViewBox)
          .attr("preserveAspectRatio", "xMidYMid meet")
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
          .attr("class", "set")
          .attr("transform", `translate(0, ${legendViewBoxHeight})`)
          .call(legendAxisGenerator);

        legendAxis.selectAll("g").attr("class", "tick");

        legendElement.classList.add("set");

        requestAnimationFrame(setLegend);
      }

      setLegend();
    };

    const drawn = Date.now();

    console.log("drawn choropleth map in:", (drawn - loaded) * 0.001 + "s");
  };
}

function getStats(data) {
  // Initialize variables to store stats: national and state min/max values
  const stats = {
    nationalMin: { education: Infinity },
    nationalMax: { education: -Infinity },
    // Dynamically create state state stats object
    stateStats: {},
  };

  // Process all counties to find national min/max
  data.forEach((feature) => {
    const { education, state, area_name: county, fips } = feature.properties;

    // Check for national min/max
    if (education < stats.nationalMin.education) {
      stats.nationalMin = {
        education,
        county,
        state,
        fips,
      };
    }

    if (education > stats.nationalMax.education) {
      stats.nationalMax = {
        education,
        county,
        state,
        fips,
      };
    }

    // Initialize state stats if first time seeing this state
    if (!stats.stateStats[state]) {
      stats.stateStats[state] = {
        min: { education: Infinity },
        max: { education: -Infinity },
      };
    }

    // Check for state min/max
    if (education < stats.stateStats[state].min.education) {
      stats.stateStats[state].min = {
        education,
        county,
        fips,
      };
    }

    if (education > stats.stateStats[state].max.education) {
      stats.stateStats[state].max = {
        education,
        county,
        fips,
      };
    }
  });

  return stats;
}
