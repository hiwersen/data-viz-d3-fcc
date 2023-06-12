// @see {@link "https://github.com/d3/d3/blob/main/API.md#d3-api-reference"}

document.addEventListener("DOMContentLoaded", () => {
    const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";
    const req = new XMLHttpRequest();
    
    req.open("GET", url, true);
    req.send();
    req.onload = () => {
        const res = JSON.parse(req.responseText);
        let { data: dataset } = res;

        dataset = dataset.map(d => {
            const date = new Date(d[0]);
            return [date, d[1]];
        });

        const svgW = 600;
        const svgH = 350;
        const padding = 50;
        const barW = (svgW - 2 * padding) / dataset.length;

        const minX = d3.min(dataset, d  => d[0]);
        const maxX = d3.max(dataset, d  => d[0]); 
        const maxY = d3.max(dataset, d  => d[1]);

        // @see {@link "https://github.com/d3/d3-time-format"}
        const formatYear = d3.timeFormat("%Y");
        const formatDate = d3.timeFormat("%Y-%m-%d");

        // @see {@link "https://github.com/d3/d3-scale/blob/v4.0.2/README.md#time-scales"}
        const xScale = d3.scaleTime()
        .domain([minX, maxX])
        .range([padding, svgW - padding]);

        const yScale = d3.scaleLinear()
        .domain([0, maxY])
        .range([svgH - padding, padding]);

        const svg = d3
        .select(".barchart")
        .append("svg")
        .attr("width",svgW)
        .attr("height", svgH)
        .attr("id", "svg");

        const tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);

        svg
        .selectAll("rect")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d[0]))
        .attr('y', d => yScale(d[1]))
        .attr("width", barW)
        .attr("height", d => svgH - padding - yScale(d[1]))
        .attr("class", "bar")
        .attr("data-date", d => formatDate(d[0]))
        .attr("data-gdp", d => d[1])
        .on("mouseover", (event, d) => {
            const xAxisRect = d3.select("#x-axis").node().getBoundingClientRect();
            const y = xAxisRect.bottom;
            const date = formatDate(d[0]);

            tooltip
            .html(`${date}<br>$${d[1]} Billion`)
            .attr("data-date", date)
            .style("position", "absolute")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (y - 80) + "px")
            .style("opacity", 1);
        })
        .on("mouseout", () => { 
            tooltip.style("opacity", 0); 
        });

        // @see {@link "https://github.com/d3/d3-axis/blob/v3.0.0/README.md#axis_tickPadding"}
        
        const xAxisF = d3.axisBottom(xScale).tickFormat(formatYear);
        const yAxisF = d3.axisLeft(yScale);

        const xAxis = svg
        .append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${svgH - padding})`)
        .call(xAxisF);

        const yAxis = svg
        .append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${padding}, 0)`)
        .call(yAxisF);
        
        xAxis.selectAll("g").attr("class", "tick");
        yAxis.selectAll("g").attr("class", "tick");

        svg
        .append("text")
        .text("Gross Domestic Product $Bn")
        .attr("x", ((svgH - 2 * padding) / 2) + padding)
        .attr("y", svgH - padding + 20)
        .attr("transform", `rotate(-90, ${padding}, ${svgH - padding})`)
        .style("text-anchor", "middle")
        .style("font-size", "0.8rem")
        .style("fill", "rgba(45,45,45)");

        svg
        .append("text")
        .text("More Information: http://www.bea.gov/national/pdf/nipaguid.pdf")
        .attr("x", svgW - padding)
        .attr("y", svgH - padding + 35)
        .style("text-anchor", "end")
        .style("font-size", "0.8rem")
        .style("fill", "rgba(45,45,45)");
    };
});

