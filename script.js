const width = 800, height = 600;

const svg = d3.select("svg")
  .attr("width", width) 
  .attr("height", height); 

const tooltip = d3.select("#tooltip");

const projection = d3.geoOrthographic()
  .scale(280)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath(projection);


function showLegend() {
  const legendData = [
    { position: 1, color: "gold", label: "Prvo mjesto" },
    { position: 2, color: "silver", label: "Drugo mjesto" },
    { position: 3, color: "#cd7f32", label: "Treće mjesto" },
    { position: 4, color: "rgb(126, 117, 117)", label: "Ostali sudionici" }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 130}, 15)`); 

  legend.append("rect")
    .attr("x", 5)
    .attr("y", -10)
    .attr("width", 120)
    .attr("height", legendData.length * 20 + 10)
    .attr("fill", "#fff")
    .attr("stroke", "#ccc")
    .attr("rx", 8) 
    .attr("ry", 8)


  legend.selectAll("rect.color")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("class", "color")
    .attr("x", 20)
    .attr("y", (d, i) => i * 20) 
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => d.color)
    .attr("rx", 8) 
    .attr("ry", 8);

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 37)
    .attr("y", (d, i) => i * 20 + 9)
    .attr("font-size", "11px")
    .attr("fill", "#000") 
    .text(d => d.label)
    .attr("font-weight", "bold");
}

svg.append("path")
  .datum({type: "Sphere"})
  .attr("fill", "#87CEEB")
  .attr("d", path);

const g = svg.append("g");


let countries = [], worldData;


d3.json("countries-110m.json").then(world => {
  worldData = topojson.feature(world, world.objects.countries).features;
  countries = g.selectAll("path")
    .data(worldData)
    .enter()
    .append("path")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .attr("fill", "rgb(230, 230, 230)")
    .attr("d", path);
});


let lastPos;
svg.call(d3.drag()
  .on("start", (event) => lastPos = [event.x, event.y])
  .on("drag", (event) => {
    const [dx, dy] = [event.x - lastPos[0], event.y - lastPos[1]];
    const rotation = projection.rotate();
    projection.rotate([rotation[0] + dx * 0.5, rotation[1] - dy * 0.5]);
    lastPos = [event.x, event.y];
    svg.selectAll("path").attr("d", path);
  })
);

svg.call(d3.zoom()
  .scaleExtent([1, 4])
  .on("zoom", (event) => {
    projection.scale(280 * event.transform.k);
    svg.selectAll("path").attr("d", path);
  })
);

const colorMap = (position) => {
  if (position === 1) return "gold";
  if (position === 2) return "silver";
  if (position === 3) return "#cd7f32";
  return "rgb(126, 117, 117)"; 
};

function updateYear(year) {
  d3.json(`WC-Data/fifa${year}.json`).then(data => {
    const teamMap = new Map(data.map(d => [d.Team.toLowerCase(), d]));

    countries
      .attr("fill", d => {
        const country = teamMap.get(d.properties.name?.toLowerCase());
        return country ? colorMap(country.Position) : "rgb(230, 230, 230)";
      })
      .attr("d", path)
      .on("mouseover", function(event, d) {
        const country = teamMap.get(d.properties.name?.toLowerCase());
        const tooltip = d3.select("#tooltip");

        tooltip
          .style("display", "block")
          .html(`
            <strong>${d.properties.name}</strong><br>
          `);
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select("#tooltip");
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("display", "none");
      });
  });
}

d3.select("#yearSelect").on("change", function() {
  const selectedYear = this.value;
  updateYear(selectedYear);
});




const years = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982,
  1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022
];

const timeline = d3.select("#timeline");

timeline.append("div")
  .attr("class", "line");

timeline.selectAll()
  .data(years)
  .enter()
  .append("div")
  .attr("class", "dot")
  .attr("data-year", d => d)
  .each(function(d) {
    d3.select(this)
      .append("span")
      .text(d); 
  })
  .on("click", function(event, d) {
    svg.select(".legend").remove();
    const dot = d3.select(this);
    const isSelected = dot.classed("selected");

    timeline.selectAll(".dot").classed("selected", false);

    if (isSelected) {
      g.selectAll("path")
        .attr("fill", "rgb(230, 230, 230)") 
        .on("mouseover", null) 
        .on("mousemove", null)
        .on("mouseout", null);
    } else {
      dot.classed("selected", true);
      updateYear(d);
      showLegend();
    }
  });