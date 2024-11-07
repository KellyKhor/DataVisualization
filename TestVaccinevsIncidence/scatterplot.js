function init() {
    w = 600;
    h = 400;
    const margin = { top: 25, right: 20, bottom: 45, left: 40 };


    d3.csv('VaccineRate_ReportedIncidence2018.csv', function(d) {
        return {
            country: d.country,
            incidence: +d.incidence,
            rate: (+d.vaccine_rate * 100),
            disease: d.disease
        };
    }).then(function(data) {
        scatterPlot(data);
    });

    function scatterPlot(data) {
        // define x scale
        const x = d3.scaleLinear()
                    .domain(d3.extent(data, d => d.rate))
                    .range([margin.left, w - margin.right]);

        // define y scale
        const y = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.incidence)])
                    .range([h - margin.bottom, margin.top]);

        // define color scale
        const color = d3.scaleOrdinal(data.map(d => d.disease), d3.schemeCategory10);
        // const color = d3.scaleOrdinal()
        //                 .domain(["Measles", "Tetanus", "Hepatitis B"])
        //                 .range(d3.schemeCategory10);

        // create SVG 
        const svg = d3.select("#scatterplot")
                    .append("svg")
                    .attr("viewBox", [0, 0, w, h])
                    .attr("width", w)
                    .attr("height", h)
                    .attr("style", "max-width: 100%; height: auto;");

        // append x-axis
        svg.append("g")
            .attr("transform", `translate(0,${h - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(w / 80))
            .call(g => g.select(".domain"))
            .call(g => g.append("text")
            .attr("x", w)
            .attr("y", margin.bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("Vaccination rate (%)"));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(10))
            .call(g => g.select(".domain"))
            .call(g => g.append("text")
            .attr("x", -margin.left + 10)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Reported Incidence (Cases)"));

        // svg.append("g")
        //     .attr("stroke", "currentColor")
        //     .attr("stroke-opacity", 0.1)
        //     .selectAll("line")
        //     .data(x.ticks())
        //     .join("line")
        //     .attr("x1", d => 0.5 + x(d))
        //     .attr("x2", d => 0.5 + x(d))
        //     .attr("y1", margin.top)
        //     .attr("y2", h - margin.bottom);

        svg.append("g")
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .selectAll("line")
            .data(y.ticks())
            .join("line")
            .attr("y1", d => 0.5 + y(d))
            .attr("y2", d => 0.5 + y(d))
            .attr("x1", margin.left)
            .attr("x2", w - margin.right);

        const tooltip = d3.select("#scatterplot").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background-color", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("color", "#333")
            .style("pointer-events", "none")
            .style("opacity", 0);

        svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => x(d.rate))
            .attr("cy", d => y(d.incidence))
            .attr("r", 4)
            .attr("fill", d => color(d.disease))
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(100).style("opacity", 0.9);
                tooltip.html(`${d.country}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition()
                        .duration(100)
                        .style("opacity", 0);
            });

        // Create the legend at the top
        const legend = svg.append('g')
                          .attr('class', 'legend')
                          .attr('transform', `translate(${margin.left},${margin.top - 25})`); // Positioned near the top

        color.domain().forEach((disease, i) => {
        
            const item = legend.append('g')
                               .attr('transform', `translate(${i * 100}, 0)`); // Space items horizontally

            item.append('rect')
                .attr('x', 20)
                .attr('y', 380)
                .attr('width', 18)
                .attr('height', 18)
                .attr('fill', color(disease));

            item.append('text')
                .attr('x', 43)
                .attr('y', 391)
                .text(disease)
                .style('font-size', '15px')
                .attr('alignment-baseline', 'middle');
        });
    }
}

window.onload = init;

