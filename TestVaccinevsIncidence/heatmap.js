// loadChart: main function to load the data from selected file and visualize data using heatmap.
function loadChart(year) {
    var year = selectYear();
    var file = getFile(year);

    // set dimensions and margins for the map
    const margin = { top: 150, right: 20, bottom: 70, left: 320 }, // Increased top margin to move the graph further down
        width = 800 - margin.left - margin.right,
        height = 710 - margin.top - margin.bottom;

    // define svg function
    const svg = d3.select('svg');
    // remove previous svg before loading a new one
    svg.selectAll('*').remove();

    // create svg 
    const chartGroup = svg.attr("width", width + margin.left + margin.right)
                          .attr("height", height + margin.top + margin.bottom)
                          .append("g")
                          .attr("transform", `translate(${margin.left},${margin.top})`); // Adjusted position for chart

    // define and append tooltip to the map
    const tooltip = d3.select('body').select('.tooltip');
    if (tooltip.empty()) {
        // styling tooltip 
        d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background-color", "#fff")
          .style("border", "1px solid #ccc")
          .style("padding", "5px")
          .style("font-size", "12px")
          .style("border-radius", "3px")
          .style("pointer-events", "none")
          .style("opacity", 0); // Hidden by default
    }

    // load data from selected file
    d3.csv(file).then(data => {
        // process and format data to be used
        data.forEach(d => {
            // convert data to numeric
            d.incidence = +d.incidence;
            d.vaccine_rate = +d.vaccine_rate * 100;  // convert to percentage
        });

        // get unique lists of countries and diseases
        const countries = [...new Set(data.map(d => d.country))];
        const diseases = [...new Set(data.map(d => d.disease))];

        // create x and y scales
        const xScale = d3.scaleBand()
                         .domain(diseases)
                         .range([0, width])
                         .padding(0.05);

        const yScale = d3.scaleBand()
                         .domain(countries)
                         .range([0, height])
                         .padding(0.05);

        // dynamically set the color scale based on the max incidence value in data
        let maxIncidence = d3.max(data, d => d.incidence);
        const colorScale = d3.scaleSequential(d3.interpolateYlGnBu   )
                             .domain([0, maxIncidence]);

        // add x-axis to the map
        chartGroup.append("g")
                  .attr("transform", `translate(0, ${height})`)
                  .call(d3.axisBottom(xScale))
                  .selectAll("text")
                  .attr("class", "axis-label")
                  .attr("transform", "rotate(-45)")
                  .style("text-anchor", "end");

        // add y-axis to the map
        chartGroup.append("g")
                  .call(d3.axisLeft(yScale))
                  .selectAll("text")       
                  .attr("class", "axis-label");

        // draw the cells of heatmap
        chartGroup.selectAll()
                  .data(data, d => d.country + ':' + d.disease)
                  .enter()
                  .append("rect")
                  .attr("x", d => xScale(d.disease))
                  .attr("y", d => yScale(d.country))
                  .attr("width", xScale.bandwidth())
                  .attr("height", yScale.bandwidth())
                  .style("fill", d => colorScale(d.incidence))
                  .style("stroke", "grey")
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

        // add color legend with increased width
        const legendWidth = 300, legendHeight = 20;

        // create color legend with more space between the heatmap and the legend
        const legend = svg.append("g")
        .attr("transform", `translate(${width - legendWidth + 350}, ${margin.top -50})`); // Added more space here (from 20 to 40)


        const legendScale = d3.scaleLinear()
                              .domain([0, maxIncidence])
                              .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
                             .ticks(5) // Increase or decrease ticks as needed
                             .tickFormat(d3.format(".2s")); // Format for large numbers

        // create legend
        legend.selectAll("rect")
              .data(d3.range(0, 100))
              .enter()
              .append("rect")
              .attr("x", d => legendScale(d * maxIncidence / 100))
              .attr("width", legendWidth / 100)
              .attr("height", legendHeight)
              .attr("fill", d => colorScale(d * maxIncidence / 100));

        legend.append("g")
              .attr("transform", `translate(0, ${legendHeight})`)
              .call(legendAxis);

        legend.append("text")
              .attr("class", "axis-label")
              .attr("x", legendWidth / 2)
              .attr("y", -10)
              .style("text-anchor", "middle")
              .text("No. of Reported Cases");
    });
}

// selectYear: get year from user selection
function selectYear(){
    year = document.querySelector('#year').value;
    return year;
}

// getFile: get the specific csv file based on user's selection
function getFile(year){
    var file;
    switch(+year) {
        case 2013: file = 'VaccineRate_ReportedIncidence2013.csv'; break;
        case 2014: file = 'VaccineRate_ReportedIncidence2014.csv'; break;
        case 2015: file = 'VaccineRate_ReportedIncidence2015.csv'; break;
        case 2016: file = 'VaccineRate_ReportedIncidence2016.csv'; break;
        case 2017: file = 'VaccineRate_ReportedIncidence2017.csv'; break;
        case 2018: file = 'VaccineRate_ReportedIncidence2018.csv'; break;
        case 2019: file = 'VaccineRate_ReportedIncidence2019.csv'; break;
        case 2020: file = 'VaccineRate_ReportedIncidence2020.csv'; break;
        case 2021: file = 'VaccineRate_ReportedIncidence2021.csv'; break;
        case 2022: file = 'VaccineRate_ReportedIncidence2022.csv'; break;
        case 2023: file = 'VaccineRate_ReportedIncidence2023.csv'; break;
    }
    return file; 
}

// load year 2013 data by default on the window
window.onload = function() {
    loadChart(2013);
}

// load specific file data based on user's selection by clicking interaction
document.getElementById('year').addEventListener('click', () => {
    var year = selectYear();
    loadChart(year);
});
