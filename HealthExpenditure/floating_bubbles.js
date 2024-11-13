function init() {
    const width = 1200; // Increased width
    const height = 600;
    const margin = 20;

    let currentYear = 2016;
    const years = [2016, 2017, 2018, 2019, 2020];

    // Set up SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scales
    const sizeScale = d3.scaleSqrt().range([10, 50]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

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

        function updateChart(year) {
            const nodes = yearData.get(year).map(d => ({
                ...d,
                radius: sizeScale(d.health_expenditure_percentage)
            }));

            const simulation = d3.forceSimulation(nodes)
                .force("x", d3.forceX(width / 2).strength(0.05))
                .force("y", d3.forceY(height / 2).strength(0.05))
                .force("collision", d3.forceCollide(d => d.radius + 2))
                .on("tick", ticked);

            const bubbles = svg.selectAll(".bubble").data(nodes, d => d.country + d.disease);
            bubbles.exit().remove();

            const newBubbles = bubbles.enter()
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
                .attr("opacity", 0.8);

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

            bubbles.merge(newBubbles);

            function ticked() {
                svg.selectAll(".bubble")
                    .attr("transform", d => `translate(${d.x}, ${d.y})`);
            }
        }

        function dragStart(event, d) {
            if (!event.active) d.fx = d.x, d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnd(event, d) {
            if (!event.active) d.fx = null, d.fy = null;
        }

        updateChart(currentYear);

        d3.select("#prevYear").on("click", () => {
            currentYear = years[(years.indexOf(currentYear) - 1 + years.length) % years.length];
            updateChart(currentYear);
        });

        d3.select("#nextYear").on("click", () => {
            currentYear = years[(years.indexOf(currentYear) + 1) % years.length];
            updateChart(currentYear);
        });

        // Create legend
        const legend = d3.select("#legend")
            .selectAll(".legend-item")
            .data(colorScale.domain())
            .enter()
            .append("div")
            .attr("class", "legend-item");

        legend.append("div")
            .attr("class", "legend-color")
            .style("background-color", d => colorScale(d));

        legend.append("span")
            .text(d => d);
    });
}

window.onload = init;
