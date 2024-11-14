function init() {
    var w = 800;
    var h = 500;
    var padding = { top: 40, right: 100, bottom: 60, left: 70 };  // Increased right padding

    var xScale = d3.scaleLinear().range([padding.left, w - padding.right]);
    var yScale = d3.scaleLinear().range([h - padding.bottom, padding.top]);

    var line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.value));

    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", w + 100)
        .attr("height", h);

    // Load data from CSV
    d3.csv("vaccination_costs.csv").then(function (data) {
        data.forEach(d => {
            d.Year = +d.Year;
            d.HepatitisB = +d.HepatitisB;
            d.Measles = +d.Measles;
            d.Tetanus = +d.Tetanus;
        });

        var diseases = ["HepatitisB", "Measles", "Tetanus"];
        var dataset = diseases.map(disease => {
            return data.map(d => {
                return { Year: d.Year, value: d[disease], disease: disease };
            });
        });

        xScale.domain([d3.min(data, d => d.Year), d3.max(data, d => d.Year)]);
        var maxValue = d3.max(data, d => Math.max(d.HepatitisB, d.Measles, d.Tetanus));
        yScale.domain([0, maxValue + 0.01]);

        var color = d3.scaleOrdinal()
            .domain(diseases)
            .range(["green", "steelblue", "orange"]);

        // Add grid lines
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${padding.left},0)`)
            .call(d3.axisLeft(yScale)
                .tickSize(-w + padding.left + padding.right)
                .tickFormat(''))
            .selectAll("line")
            .attr("stroke", "#e0e0e0");

        svg.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${h - padding.bottom})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-h + padding.top + padding.bottom)
                .tickFormat(''))
            .selectAll("line")
            .attr("stroke", "#e0e0e0");

        svg.select(".grid .domain").attr("stroke", "none");

        // Tooltip setup
        var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #d3d3d3")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("visibility", "hidden");

        dataset.forEach(function (diseaseData, i) {
            var path = svg.append("path")
                .datum(diseaseData)
                .attr("fill", "none")
                .attr("stroke", color(diseases[i]))
                .attr("stroke-width", 2)
                .attr("d", line);

            var totalLength = path.node().getTotalLength();
            path.attr("stroke-dasharray", totalLength + " " + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(5000)
                .attr("stroke-dashoffset", 0);

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
                    const percentageChange = calculatePercentageChange(d.Year, d.value, d.disease);
                    tooltip.style("visibility", "visible")
                        .html(`
                            ${d.disease}: ${d.value} USD <br/>
                            Percentage change: ${percentageChange}%
                        `);
                })
                .on("mousemove", function (event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("r", 5);
                    tooltip.style("visibility", "hidden");
                });
        });

        svg.append("g")
            .attr("transform", "translate(0," + (h - padding.bottom) + ")")
            .call(d3.axisBottom(xScale).ticks(data.length).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", "translate(" + padding.left + ",0)")
            .call(d3.axisLeft(yScale));

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

        // Range Slider for Year Selection
        var slider = d3.select("body").append("input")
            .attr("type", "range")
            .attr("min", d3.min(data, d => d.Year))
            .attr("max", d3.max(data, d => d.Year))
            .attr("step", 1)
            .attr("value", d3.max(data, d => d.Year))
            .attr("id", "yearSlider")
            .on("input", updateChart);

        d3.select("body").append("label")
            .attr("for", "yearSlider")
            .text("Select Year");

        // Update the chart based on slider input
        function updateChart() {
            var selectedYear = +document.getElementById("yearSlider").value;

            // Filter data based on selected year
            var filteredData = dataset.map(function (diseaseData) {
                return diseaseData.filter(d => d.Year <= selectedYear);
            });

            // Redraw lines with updated data
            svg.selectAll("path").remove();
            svg.selectAll("circle").remove();

            dataset.forEach(function (diseaseData, i) {
                var path = svg.append("path")
                    .datum(filteredData[i])
                    .attr("fill", "none")
                    .attr("stroke", color(diseases[i]))
                    .attr("stroke-width", 2)
                    .attr("d", line);

                var totalLength = path.node().getTotalLength();
                path.attr("stroke-dasharray", totalLength + " " + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(5000)
                    .attr("stroke-dashoffset", 0);

                svg.selectAll(`.point-${diseases[i]}`)
                    .data(filteredData[i])
                    .enter()
                    .append("circle")
                    .attr("class", `point-${diseases[i]}`)
                    .attr("cx", d => xScale(d.Year))
                    .attr("cy", d => yScale(d.value))
                    .attr("r", 5)
                    .attr("fill", color(diseases[i]))
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("r", 8);
                        const percentageChange = calculatePercentageChange(d.Year, d.value, d.disease);
                        tooltip.style("visibility", "visible")
                            .html(`
                                ${d.disease}: ${d.value} USD <br/>
                                Percentage change: ${percentageChange}%
                            `);
                    })
                    .on("mousemove", function (event) {
                        tooltip.style("top", (event.pageY - 10) + "px")
                            .style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("r", 5);
                        tooltip.style("visibility", "hidden");
                    });
            });
        }

        // Calculate percentage change
        function calculatePercentageChange(year, value, disease) {
            const prevData = data.find(d => d.Year === year - 1);
            const prevValue = prevData ? prevData[disease] : value;
            if (prevValue === 0) return 0; // Avoid division by zero
            return ((value - prevValue) / prevValue * 100).toFixed(2);
        }

        // Add the legend
        var legend = svg.append("g")
            .attr("transform", `translate(${w - padding.right + 100}, ${padding.top})`);  // Move further to the right

        legend.selectAll(".legend")
            .data(diseases)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legend.selectAll(".legend")
            .append("rect")
            .attr("x", 0)
            .attr("width", 15)
            .attr("height", 15)
            .style("fill", color);

        legend.selectAll(".legend")
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d); // Disease name
    });
}



window.onload = init;
