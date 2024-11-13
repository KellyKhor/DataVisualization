function init() {
    const width = 900;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };

    // Set up scales
    const xScale = d3.scaleLinear().range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
    const sizeScale = d3.scaleSqrt().range([5, 30]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load the data
    d3.csv("health_expenditure.csv").then(data => {
        // Convert numeric fields
        data.forEach(d => {
            d.year = +d.year;
            d.vaccination_coverage = +d.vaccination_coverage;
            d.health_expenditure_percentage = +d.health_expenditure_percentage;
            d.gdp_per_capita = +d.gdp_per_capita;
        });

        // Set up domains for scales
        xScale.domain(d3.extent(data, d => d.year));
        yScale.domain([0, 1]); // Vaccination coverage is normalized between 0 and 1
        sizeScale.domain([0, d3.max(data, d => d.health_expenditure_percentage)]);
        colorScale.domain([...new Set(data.map(d => d.disease))]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        // Add axis labels
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .text("Year");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", 20)
            .text("Vaccination Coverage");

        // Plot bubbles
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.year))
            .attr("cy", d => yScale(d.vaccination_coverage))
            .attr("r", d => sizeScale(d.health_expenditure_percentage))
            .attr("fill", d => colorScale(d.disease))
            .attr("opacity", 0.8)
            .append("title") // Tooltip
            .text(d => `${d.country}, ${d.year}, ${d.disease}
Coverage: ${(d.vaccination_coverage * 100).toFixed(1)}%
Health Expenditure: ${d.health_expenditure_percentage}%`);

        // Add legend for diseases
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 150}, 30)`);

        const diseases = [...new Set(data.map(d => d.disease))];
        diseases.forEach((disease, i) => {
            legend.append("circle")
                .attr("cx", 10)
                .attr("cy", i * 20)
                .attr("r", 5)
                .attr("fill", colorScale(disease));

            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 5)
                .text(disease);
        });
    });
}

window.onload = init;
