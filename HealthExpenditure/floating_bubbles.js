function init() {
    const width = 1200; 
    const height = 600;

    let currentYear = 2016;
    const years = [2016, 2017, 2018, 2019, 2020];

    // Track selected legend item
    let selectedLegend = "All";

    // Set up SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scales
    const sizeScale = d3.scaleSqrt().range([10, 50]); // Square root scale for bubble radius
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid gray")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("visibility", "hidden")
        .style("pointer-events", "none");

    // Populate dropdown
    const yearSelector = d3.select("#yearSelector");
    yearSelector.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Load data
    d3.csv("health_expenditure.csv").then(data => {
        data.forEach(d => {
            d.year = +d.year;
            d.vaccination_coverage = +d.vaccination_coverage;
            d.health_expenditure_percentage = +d.health_expenditure_percentage;
            d.gdp_per_capita = +d.gdp_per_capita;
        });

        const yearData = d3.group(data, d => d.year);
        sizeScale.domain(d3.extent(data, d => d.health_expenditure_percentage));
        colorScale.domain([...new Set(data.map(d => d.disease))]);

        // Create the legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0, 20)");

        // Add "All" legend item at the top
        const legendData = ["All", ...colorScale.domain()];
        const legendItems = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        // Legend circles
        legendItems.append("circle")
            .attr("cx", 10)
            .attr("cy", 10)
            .attr("r", 8)
            .attr("fill", d => (d === "All" ? "gray" : colorScale(d)));

        // Legend text
        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 15)
            .text(d => d)
            .style("font-size", "14px");

        // Add click event to legend items
        legendItems.on("click", function (event, d) {
            selectedLegend = d; // Update selected legend
            updateChart(currentYear); // Update chart based on selection
        });

        function updateChart(year) {
            // Get the data for the selected year
            let nodes = yearData.get(year).map(d => ({
                ...d,
                radius: sizeScale(d.health_expenditure_percentage)
            }));

            // Filter nodes if a specific legend is selected (not "All")
            if (selectedLegend !== "All") {
                nodes = nodes.filter(d => d.disease === selectedLegend);
            }

            // Reset the simulation
            const simulation = d3.forceSimulation(nodes)
                .force("x", d3.forceX(width / 2).strength(0.05))
                .force("y", d3.forceY(height / 2).strength(0.05))
                .force("collision", d3.forceCollide(d => d.radius + 2))
                .alpha(1) 
                .alphaDecay(0.01);

            // Remove existing bubbles
            svg.selectAll(".bubble").remove();

            // Create new bubbles
            const newBubbles = svg.selectAll(".bubble")
                .data(nodes, d => d.country + d.disease)
                .enter()
                .append("g")
                .attr("class", "bubble")
                .call(d3.drag()
                    .on("start", dragStart)
                    .on("drag", dragged)
                    .on("end", dragEnd)
                );

            newBubbles.append("circle")
                .attr("r", d => d.radius)
                .attr("fill", d => colorScale(d.disease))
                .attr("opacity", 0.8)
                .on("mouseover", (event, d) => {
                    tooltip.style("visibility", "visible")
                        .html(`Vaccination Coverage: ${d.vaccination_coverage}%`);
                })
                .on("mousemove", event => {
                    tooltip.style("top", `${event.pageY + 10}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                });

            newBubbles.append("text")
                .selectAll("tspan")
                .data(d => [
                    d.country,
                    `$${d.gdp_per_capita.toFixed(2)}`,
                    `${d.health_expenditure_percentage.toFixed(1)}%`
                ])
                .enter()
                .append("tspan")
                .attr("x", 0)
                .attr("dy", (d, i) => (i === 0 ? 0 : 12))
                .text(d => d);

            simulation.on("tick", () => {
                svg.selectAll(".bubble")
                    .attr("transform", d => `translate(${d.x}, ${d.y})`);
            });
        }

        // Dragging functions
        function dragStart(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
            simulation.alpha(0.3).restart();
        }

        function dragEnd(event, d) {
            if (!event.active) simulation.alphaTarget(0);
        }

        // Update chart based on dropdown selection
        yearSelector.on("change", function () {
            currentYear = +this.value;
            updateChart(currentYear);
        });

        // Initialize chart
        updateChart(currentYear);
    });
}

window.onload = init;
