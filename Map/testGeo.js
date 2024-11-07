function init() {
    const w = 600;
    const h = 700;

    const color = d3.scaleQuantize()
        .range([
            "rgb(242, 240, 247)", 
            "rgb(203, 201, 226)", 
            "rgb(158, 154, 200)", 
            "rgb(117, 107, 177)", 
            "rgb(84, 39, 143)"
        ]);

    const projection = d3.geoMercator()
        .center([10, 50])
        .translate([w / 2, h / 2])
        .scale(400);

    const path = d3.geoPath().projection(projection);
    const svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    // Create tooltip element
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("box-shadow", "0px 0px 5px rgba(0,0,0,0.3)");

    const datasets = {
        "Tetanus": "Tetanus_VaccineCov.csv",
        "Hepatitis B": "HepB_vaccineCov.csv",
        "Measles": "Measles_VaccineCov.csv"
    };

    let currentDataset = "Hepatitis B";  // Default dataset
    let currentYear = 2013;  // Default year

    function loadDataset(datasetName) {
        d3.csv(datasets[datasetName]).then(function(data) {
            const countryData = {};
            data.forEach(d => {
                const country = d.Countries.trim();
                countryData[country] = {};
                for (let year = 2013; year <= 2023; year++) {
                    countryData[country][year] = +d[year];
                }
            });

            function updateMap(year) {
                color.domain([
                    d3.min(Object.values(countryData), d => d[year]),
                    d3.max(Object.values(countryData), d => d[year])
                ]);

                d3.json("europe.json").then(function(json) {
                    json.features.forEach(feature => {
                        const country = feature.properties.NAME.trim();
                        feature.properties.value = countryData[country] ? countryData[country][year] : null;
                    });

                    const paths = svg.selectAll("path").data(json.features);

                    paths.enter()
                        .append("path")
                        .attr("d", path)
                        .merge(paths)
                        .style("fill", d => d.properties.value ? color(d.properties.value) : "#ccc")
                        .style("stroke", "black")
                        .on("mouseover", function(event, d) {
                            // Show tooltip with country name and data value as a percentage
                            const value = d.properties.value !== null ? (d.properties.value * 100).toFixed(2) + "%" : "No data";
                            tooltip.style("visibility", "visible")
                                .html(`<strong>${d.properties.NAME}</strong><br>Value: ${value}`);
                        })
                        .on("mousemove", function(event) {
                            tooltip.style("top", (event.pageY - 10) + "px")
                                .style("left", (event.pageX + 10) + "px");
                        })
                        .on("mouseout", function() {
                            tooltip.style("visibility", "hidden");
                        });

                    paths.exit().remove();
                });
            }

            updateMap(currentYear);

            d3.select(".year-buttons").selectAll("button")
                .on("click", function() {
                    const selectedYear = +d3.select(this).text();
                    currentYear = selectedYear;
                    updateMap(selectedYear);
                    d3.selectAll(".year-buttons button").classed("active", false);
                    d3.select(this).classed("active", true);
                });
        }).catch(error => console.error("Error loading CSV:", error));
    }

    loadDataset(currentDataset);

    d3.select(".dataset-buttons").selectAll("button")
        .data(Object.keys(datasets))
        .enter()
        .append("button")
        .text(d => d)
        .on("click", function(event, d) {
            currentDataset = d;
            loadDataset(d);
            d3.selectAll(".dataset-buttons button").classed("active", false);
            d3.select(this).classed("active", true);
        });

    const years = Array.from({ length: 11 }, (_, i) => 2013 + i);
    const yearButtons = d3.select(".year-buttons");
    years.forEach(year => {
        yearButtons.append("button")
            .text(year)
            .on("click", function() {
                currentYear = year;
                loadDataset(currentDataset);
                yearButtons.selectAll("button").classed("active", false);
                d3.select(this).classed("active", true);
            });
    });
}

window.onload = init;
