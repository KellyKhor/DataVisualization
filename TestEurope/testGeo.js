function init() {
    var w = 600;
    var h = 700;

    var color = d3.scaleQuantize()
        .range([
            "rgb(242, 240, 247)", 
            "rgb(203, 201, 226)", 
            "rgb(158, 154, 200)", 
            "rgb(117, 107, 177)", 
            "rgb(84, 39, 143)"
        ]);

    // Adjust projection for Europe
    var projection = d3.geoMercator()
        .center([10, 50])  // Center on Europe
        .translate([w / 2, h / 2])
        .scale(400);  // Adjust scale

    var path = d3.geoPath().projection(projection);

    var svg = d3.select("body")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    // Load region data from CSV
    d3.csv("Europe_geo.csv").then(function(data) {
        data.forEach(d => {
            d.country = d.country.trim();
            d.region = +d.region;  // Convert to numeric value
        });

        // Set color domain
        color.domain([
            d3.min(data, d => d.region),
            d3.max(data, d => d.region)
        ]);

        // Load GeoJSON data
        d3.json("europe.json").then(function(json) {
            // Merge CSV data with GeoJSON features
            data.forEach(d => {
                const match = json.features.find(f =>
                    f.properties.NAME.trim().toLowerCase() === d.country.toLowerCase()
                );
                if (match) {
                    match.properties.value = d.region;  // Assign region value
                }
            });

            // Draw the map
            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", d => {
                    const value = d.properties.value;
                    return value ? color(value) : "#ccc";  // Default fill if no match
                })
                .style("stroke", "black");  // Optional: Add country borders
        }).catch(error => {
            console.error("Error loading GeoJSON:", error);
        });
    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
}

window.onload = init;
