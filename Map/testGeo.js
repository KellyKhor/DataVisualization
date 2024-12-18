function init() {
    const w = 950;
    const h = 1000;

    const color = d3.scaleQuantize()
    .range([
        "#d4f4dd", // light green
        "#a8e6b1", // soft green
        "#70d492", // medium green
        "#36b3b1", // teal
        "#0066cc"  // deep blue
    ]);

    const projection = d3.geoMercator()
    .center([20, 50])  
    .translate([w / 2, h / 2])
    .scale(600); 

    const path = d3.geoPath().projection(projection);
    const svg = d3.select(".map-container")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

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

    let currentDataset = "Hepatitis B";  
    let currentYear = 2013;  

    let populationData = {};

    // Load population data
    d3.csv("population.csv").then(function(data) {
        data.forEach(d => {
            const country = d["Country Name"].trim();
            populationData[country] = {};
            for (let year = 2013; year <= 2023; year++) {
                populationData[country][year] = +d[year];
            }
        });

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
                            feature.properties.population = populationData[country] ? populationData[country][year] : "No data";
                        });

                        const paths = svg.selectAll("path").data(json.features);

                        paths.enter()
                            .append("path")
                            .attr("d", path)
                            .merge(paths)
                            .style("fill", d => d.properties.value ? color(d.properties.value) : "#ccc")
                            .style("stroke", "black")
                            .on("mouseover", function(event, d) {
                                const value = d.properties.value !== null ? (d.properties.value * 100).toFixed(2) + "%" : "No data";
                                const population = d.properties.population !== "No data" ? d.properties.population.toLocaleString() : "No data";
                                tooltip.style("visibility", "visible")
                                    .html(`<strong>${d.properties.NAME}</strong><br>Vaccination Coverage: ${value}<br>Population: ${population}`);
                            
                                svg.selectAll("path")
                                    .style("opacity", 0.3);
                            
                                d3.select(this)
                                    .style("opacity", 1);
                            })
                            .on("mousemove", function(event) {
                                tooltip.style("top", (event.pageY - 10) + "px")
                                    .style("left", (event.pageX + 10) + "px");
                            })
                            .on("mouseout", function() {
                                tooltip.style("visibility", "hidden");
                                svg.selectAll("path")
                                    .style("opacity", 1);
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
    }).catch(error => console.error("Error loading Population CSV:", error));
}

window.onload = init;
