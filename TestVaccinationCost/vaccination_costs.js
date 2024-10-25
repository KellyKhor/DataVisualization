function init() {
    var w = 600;
    var h = 400;
    var padding = { top: 20, right: 30, bottom: 40, left: 50 };

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
    d3.csv("vaccination_costs.csv").then(function(data) {
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
        yScale.domain([0, d3.max(data, d => Math.max(d.HepatitisA, d.Measles, d.Tetanus))]);

        // Color scale for different lines
        var color = d3.scaleOrdinal()
            .domain(diseases)
            .range(["steelblue", "green", "orange"]);

        // Append each line for the diseases
        dataset.forEach(function(diseaseData, i) {
            svg.append("path")
                .datum(diseaseData)
                .attr("fill", "none")
                .attr("stroke", color(diseases[i]))
                .attr("stroke-width", 2)
                .attr("d", line);

            // Add labels at the end of the lines
            svg.append("text")
                .datum(diseaseData[diseaseData.length - 1]) // Use the last data point of each line
                .attr("x", d => xScale(d.Year) + 5)  // Position slightly right of the last point
                .attr("y", d => yScale(d.value))
                .attr("fill", color(diseases[i]))
                .text(diseases[i]);
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
    });
}

window.onload = init;
