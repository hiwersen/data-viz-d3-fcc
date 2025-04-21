document.addEventListener("DOMContentLoaded", () => {
    const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
    const req = new XMLHttpRequest();

    req.open("GET", url, true);
    req.send();
    req.onload = () => {
        const dataset = JSON.parse(req.responseText);

        dataset.forEach(d => {
            d.Seconds = new Date(d.Seconds * 1000);
        });

        const svgW = 600;
        const svgH = 350;
        const padding = 50; // SVG area padding
        const xDomainPadding = 1; // 1 year padding
        const r = 6;

        const minX = d3.min(dataset, d => d.Year);
        const maxX = d3.max(dataset, d => d.Year);
        const minY = d3.min(dataset, d => d.Seconds);
        const maxY = d3.max(dataset, d => d.Seconds);

        const xScale = d3.scaleLinear()
        .domain([minX - xDomainPadding, maxX + xDomainPadding])
        .range([padding, svgW - padding]);

        const yScale = d3.scaleTime()
        .domain([minY, maxY])
        .range([padding, svgH - padding]);

        const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);

        const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", svgW)
        .attr("height", svgH)
        .attr("id", "svg");

        svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Year))
        .attr("cy", d => yScale(d.Seconds))
        .attr("r", r)
        .attr("class", "dot")
        .attr("data-xvalue", d => d.Year)
        .attr("data-yvalue", d => d.Seconds)
        .attr("fill", d => d.Doping ? "orange" : "navy") // .attr instead of style to allow :hover
        .on("mouseover", (event, d) => {
            tooltip
            .attr("data-year", d.Year)
            .html(`${d.Name}: ${d.Nationality}<br>Year: ${d.Year}, Time: ${d.Time}
            ${d.Doping ? '<br><br>' + d.Doping : ''}`)
            .style("opacity", 1)
            .style("position", "absolute")
            .style("top", event.pageY + "px")
            .style("left", event.pageX + "px");
        })
        .on("mouseout", () => {
            tooltip
            .style("opacity", 0)
            // Move the tooltip out of the svg area so that other .dots can reliably be hovered,
            // without the tooltip overlapping them
            .style("top", "0px")
            .style("left", "0px");
        });

        const xvalueFormat = d3.format("d");
        const yvalueFormat = d3.timeFormat("%M:%S");

        const xAxisGenerator = d3.axisBottom(xScale).tickFormat(xvalueFormat);
        const yAxisGenerator = d3.axisLeft(yScale).tickFormat(yvalueFormat);

        const xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${svgH - padding})`)
        .call(xAxisGenerator);

        const yAxis = svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${padding}, 0)`)
        .call(yAxisGenerator);
        
        xAxis.selectAll("g").attr("class", "tick");
        yAxis.selectAll("g").attr("class", "tick");
        
        svg
        .append("text")
        .text("Doping in Professional Bicycle Racing")
        .attr("id", "title")
        .attr("x", svgW / 2)
        .attr("y", padding / 2)
        .style("text-anchor", "middle")
        .style("font-size", "1.2rem");

        svg
        .append("text")
        .text("35 Fastest times up Alpe d'Huez")
        .attr("id", "subtitle")
        .attr("x", svgW / 2)
        .attr("y", (padding / 2) + 20)
        .style("text-anchor", "middle")
        .style("font-size", "0.95rem");

        svg
        .append("text")
        .text("Time in Minutes")
        .attr("x", padding + 12)
        .attr("y", svgH / 2)
        .attr("transform", `rotate(-90, ${padding + 12}, ${svgH / 2})`)
        .style("text-anchor", "middle")
        .style("font-size", "0.7rem");

        const colorScale = d3.scaleOrdinal()
        .domain(["Riders with doping allegations", "No doping allegations"])
        .range(["orange", "navy"]);

        const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${svgW - padding}, ${svgH / 2})`);

        legend.selectAll("g")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("class", "legend-label")
        .attr("transform", (_, i) => {
            return `translate(0, ${i * 20})`;
        });

        legend.selectAll("g")
        .append("rect")
        .attr("height", 12)
        .attr("width", 12)
        .attr("fill", d => colorScale(d));

        legend.selectAll("g")
        .append("text")
        .text(d => d)
        .attr("transform", `translate(-6, 6)`)
        .style("text-anchor", "end")
        .style("font-size", "0.6rem");
    };
});