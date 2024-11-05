// Set dimensions and margins
const margin = { top: 50, right: 20, bottom: 70, left: 100 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("position", "absolute")
                  .style("background-color", "#fff")
                  .style("border", "1px solid #ccc")
                  .style("padding", "5px")
                  .style("font-size", "12px")
                  .style("border-radius", "3px")
                  .style("pointer-events", "none")
                  .style("opacity", 0); // Hidden by default

// Load data
d3.csv("VaccineRate_ReportedIncidence2018.csv").then(data => {
    // Data preprocessing
    data.forEach(d => {
        d.incidence = +d.incidence;
        d.vaccine_rate = +d.vaccine_rate * 100;  // Convert to percentage
    });

    // Get unique lists of countries and diseases
    const countries = [...new Set(data.map(d => d.country))];
    const diseases = [...new Set(data.map(d => d.disease))];

    // Create scales
    const xScale = d3.scaleBand()
                     .domain(diseases)
                     .range([0, width])
                     .padding(0.05);

    const yScale = d3.scaleBand()
                     .domain(countries)
                     .range([0, height])
                     .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateInferno)
                         .domain([0, 100]);  // 0-100% vaccine rate

    // Add x-axis
    svg.append("g")
       .attr("transform", `translate(0, ${height})`)
       .call(d3.axisBottom(xScale))
       .selectAll("text")
       .attr("class", "axis-label")
       .attr("transform", "rotate(-45)")
       .style("text-anchor", "end");

    // Add y-axis
    svg.append("g")
       .call(d3.axisLeft(yScale))
       .selectAll("text")
       .attr("class", "axis-label");

    // Draw cells
    svg.selectAll()
       .data(data, d => d.country + ':' + d.disease)
       .enter()
       .append("rect")
       .attr("x", d => xScale(d.disease))
       .attr("y", d => yScale(d.country))
       .attr("width", xScale.bandwidth())
       .attr("height", yScale.bandwidth())
       .style("fill", d => colorScale(d.vaccine_rate))
       .style("stroke", "grey")
       // Mouse interaction for tooltip
       .on("mouseover", (event, d) => {
           tooltip.style("opacity", 1)
                  .html(`Country: ${d.country}<br>Disease: ${d.disease}<br>Vaccination Rate: ${d.vaccine_rate}%<br>Reported Cases: ${d.incidence}`)
                  .style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
       })
       .on("mousemove", (event) => {
           tooltip.style("left", (event.pageX + 10) + "px")
                  .style("top", (event.pageY - 28) + "px");
       })
       .on("mouseout", () => {
           tooltip.style("opacity", 0);
       });

    // Add color legend
    const legendWidth = 200, legendHeight = 20;

    const legend = svg.append("g")
                      .attr("transform", `translate(${width - legendWidth - 20}, -30)`);

    const legendScale = d3.scaleLinear()
                          .domain([0, 100])
                          .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d => d + "%");

    legend.selectAll("rect")
          .data(d3.range(0, 100))
          .enter()
          .append("rect")
          .attr("x", d => legendScale(d))
          .attr("width", legendWidth / 100)
          .attr("height", legendHeight)
          .attr("fill", d => colorScale(d));

    legend.append("g")
          .attr("transform", `translate(0, ${legendHeight})`)
          .call(legendAxis);

    legend.append("text")
          .attr("class", "axis-label")
          .attr("x", legendWidth / 2)
          .attr("y", -10)
          .style("text-anchor", "middle")
          .text("Vaccination Rate (%)");
});
