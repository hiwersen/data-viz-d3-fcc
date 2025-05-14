import { colorThemes } from "../../color-themes.js";
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Create and render the empty SVG root when the page first loads
   * while wait for the JSON files to download
   */
  const svgW = 960;
  const svgH = 600;
  const paddingH = 50;

  const colorTheme = colorThemes[2];

  const svg = d3
    .select("#chart-container .svg-container")
    .append("svg")
    .attr("id", "svg")
    .attr("width", svgW)
    .attr("height", svgH);

  const counties = svg.append("g").attr("class", "counties");
  const states = svg.append("g").attr("class", "states");

  const title = d3
    .select("#chart-container .title-container")
    .append("h1")
    .text("United States Educational Attainment")
    .attr("class", "title");

  const description = d3
    .select("#chart-container .title-container")
    .append("p")
    .text(
      "Percentage of adults age 25 and older with a bachelor's degree or higher"
    )
    .attr("class", "description");

  const source = d3
    .select("#chart-container .legend-container")
    .append("div")
    .attr("class", "source")
    .html(
      `Source: <a href="https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx" target="_blank">USDA Economic Research Service</a>`
    );

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "tooltip")
    .attr("class", "screen")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("left", "-100px")
    .style("top", "-100px");

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
          // console.log(feature);
          // Create a geoPath generator for the tooltip
          const path = d3.geoPath();
          // Get the path data for this county
          const pathData = path(feature);

          // Calculate a good size for the minimap
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

          tooltip
            .html(
              `<div class="tooltip-content flex-c">
                    <p class="title">${feature.properties.area_name}, ${feature.properties.state}</p>
                    <div class="data flex-c">
                        <p class="data-title">Higher education:</p>
                        <p class="data-value">${feature.properties.education}%</p>
                    </div>
                    <div class="county-minimap flex-c">
                        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" >
                            <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
                                <path d="${pathData}"/>
                            </g>
                        </svg>
                    </div>
               </div>`
            )
            .attr("data-education", feature.properties.education)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("top", event.pageY - 30 + "px")
            .style("left", event.pageX + 15 + "px");
        })
        .on("mouseout", () => {
          tooltip
            .style("opacity", 0)
            .style("top", "-100px")
            .style("left", "-100px");
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
      const legendCellW = legendW / colorScale.range().length;

      const legend = svg
        .append("g")
        .attr("id", "legend")
        .attr(
          "transform",
          `translate(${svgW / 2 + legendCellW * 3}, ${paddingH / 2})`
        );

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
