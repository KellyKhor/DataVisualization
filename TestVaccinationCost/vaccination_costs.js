function init() {
    var w = 800; 
    var h = 500; 
    var padding = { top: 40, right: 50, bottom: 60, left: 70 };

    // Set up scales
    var xScale = d3.scaleLinear().range([padding.left, w - padding.right]);
    var yScale = d3.scaleLinear().range([h - padding.bottom, padding.top]);

    // Define line generator
    var line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.value));

    // Create SVG container
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", w + 100)
        .attr("height", h);

    // Load data from CSV
    d3.csv("vaccination_costs.csv").then(function (data) {
        // Convert year and values to numbers
        data.forEach(d => {
            d.Year = +d.Year;
            d.HepatitisA = +d.HepatitisA;
            d.Measles = +d.Measles;
            d.Tetanus = +d.Tetanus;
        });

        // Restructure the data for line generation
        var diseases = ["HepatitisA", "Measles", "Tetanus"];
        var dataset = diseases.map(disease => {
            return data.map(d => {
                return { Year: d.Year, value: d[disease], disease: disease };
            });
        });

        // Set up domains for scales
        xScale.domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)]);
        var maxValue = d3.max(data, d => Math.max(d.HepatitisA, d.Measles, d.Tetanus));
        yScale.domain([0, maxValue + 0.01]); // Add 0.01 to the max value to include 0.10

        // Color scale for different lines
        var color = d3.scaleOrdinal()
            .domain(diseases)
            .range(["steelblue", "green", "orange"]);

        // Add grid lines (horizontal for y-axis)
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${padding.left},0)`)
            .call(d3.axisLeft(yScale)
                .tickSize(-w + padding.left + padding.right)
                .tickFormat(''))
            .selectAll("line")
            .attr("stroke", "#e0e0e0") // Light gray grid lines
            ;

        // Add grid lines (vertical for x-axis)
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${h - padding.bottom})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-h + padding.top + padding.bottom)
                .tickFormat(''))
            .selectAll("line")
            .attr("stroke", "#e0e0e0"); // Light gray grid lines

        // Style y-axis line separately
        svg.select(".grid .domain").attr("stroke", "none"); // Remove the domain line

        // Append each line for the diseases
        dataset.forEach(function (diseaseData, i) {
            var path = svg.append("path")
                .datum(diseaseData)
                .attr("fill", "none")
                .attr("stroke", color(diseases[i]))
                .attr("stroke-width", 2)
                .attr("d", line);

            // Animate the line being drawn
            var totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(5000)
                .attr("stroke-dashoffset", 0);

            // Add points
            svg.selectAll(`.point-${diseases[i]}`)
                .data(diseaseData)
                .enter()
                .append("circle")
                .attr("class", `point-${diseases[i]}`)
                .attr("cx", d => xScale(d.Year))
                .attr("cy", d => yScale(d.value))
                .attr("r", 5)
                .attr("fill", color(diseases[i]))
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("r", 8);
                    tooltip.style("visibility", "visible")
                        .text(`${d.disease}: ${d.value} USD`);
                })
                .on("mousemove", function (event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 5);
                    tooltip.style("visibility", "hidden");
                });

        // Animate the line being drawn
        var totalLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
           .transition()
            .duration(5000)
            .attr("stroke-dashoffset", 0)
            .on("end", function () {
                
        // Add labels at the end of the lines after the animation
        svg.append("text")
            .datum(diseaseData[diseaseData.length - 1]) // Use the last data point of each line
            .attr("x", d => xScale(d.Year) + 5)  // Position slightly right of the last point
            .attr("y", d => yScale(d.value))
            .attr("fill", color(diseases[i]))
            .style("opacity", 0) // Start invisible
            .transition()
            .duration(500) // Fade-in effect
            .style("opacity", 1)
            .text(diseases[i]);
    });

        });

        // Add axes
        svg.append("g")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")")
            .call(d3.axisBottom(xScale).ticks(data.length).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", "translate(" + padding.left + ",0)")
            .call(d3.axisLeft(yScale));

        // Add labels
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", w / 2)
            .attr("y", h - 10)
            .text("Year");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -h / 2)
            .attr("y", 15)
            .text("Cost (USD)");

        // Tooltip
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("visibility", "hidden");
    });
}

window.onload = init;
