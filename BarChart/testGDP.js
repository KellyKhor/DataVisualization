function init() {
    var w = 800;  // Chart width
    var h = 400;  // Chart height
    var barPadding = 1;
    var currentYear = "2023";
    var sortOrder = "asc"; // Default sorting order

    var svg = d3.select(".chart-container")
        .append("svg")
        .attr("width", w + 100)
        .attr("height", h + 100)
        .append("g")
        .attr("transform", "translate(80, 20)");

    // Tooltip div for displaying data on hover
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("color", "black");

    d3.csv("EuropeanGDP.csv").then(function(data) {
        
        // Initial setup: Draw chart for the selected year
        updateChart(currentYear, sortOrder);

        // Update chart on slider input
        d3.select("#yearSlider").on("input", function() {
            currentYear = this.value;
            d3.select("#yearLabel").text(currentYear);
            updateChart(currentYear, sortOrder);
        });

        // Sort buttons event listeners
        d3.select("#sortAsc").on("click", function() {
            sortOrder = "asc";
            updateChart(currentYear, sortOrder);
        });

        d3.select("#sortDesc").on("click", function() {
            sortOrder = "desc";
            updateChart(currentYear, sortOrder);
        });

        // Function to update the chart for a given year and sort order
        function updateChart(year, order) {
            // Prepare data for the selected year
            var dataset = data.map(d => ({
                country: d.Countries,
                gdp: +d[year] || 0 // Use 0 if data is missing
            })).filter(d => d.gdp > 0);

            // Sort dataset based on order parameter
            dataset.sort((a, b) => order === "asc" ? a.gdp - b.gdp : b.gdp - a.gdp);

            // Set up x and y scales
            var xScale = d3.scaleBand()
                .domain(dataset.map(d => d.country))
                .range([0, w])
                .paddingInner(0.1);

            var yScale = d3.scaleLinear()
                .domain([0, d3.max(dataset, d => d.gdp)])
                .range([h, 0]);

            // Update bars
            var bars = svg.selectAll("rect").data(dataset, d => d.country);

            // Bind hover events to both entering and updating bars
            bars.enter()
                .append("rect")
                .merge(bars)
                .on("mouseover", function(event, d) {
                    tooltip.style("visibility", "visible")
                        .html(`Year: ${year}<br>Country: ${d.country}<br>GDP: ${d.gdp.toLocaleString()}`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                           .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                })
                .transition()
                .duration(500)
                .attr("x", d => xScale(d.country))
                .attr("y", d => yScale(d.gdp))
                .attr("width", xScale.bandwidth())
                .attr("height", d => h - yScale(d.gdp))
                .attr("fill", "steelblue");

            bars.exit().remove();

            // Add x-axis
            svg.selectAll(".x-axis").remove();
            var xAxis = d3.axisBottom(xScale);
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${h})`)
                .call(xAxis)
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            // Add y-axis
            svg.selectAll(".y-axis").remove();
            var yAxis = d3.axisLeft(yScale);
            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            // Add x-axis label
            svg.selectAll(".x-label").remove();
            svg.append("text")
                .attr("class", "x-label")
                .attr("x", w / 2)
                .attr("y", h + 70)
                .style("text-anchor", "middle")
                .text("Country");

            // Add y-axis label
            svg.selectAll(".y-label").remove();
            svg.append("text")
                .attr("class", "y-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -h / 2)
                .attr("y", -60)
                .style("text-anchor", "middle")
                .text("GDP in " + year);
        }

    }).catch(function(error) {
        console.log("Error loading or parsing data:", error);
    });
}

window.onload = init;
