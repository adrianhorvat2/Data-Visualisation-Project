const width = 1200, height = 800;

const svg = d3.select("svg")
  .attr("width", width) 
  .attr("height", height); 

const tooltip = d3.select("#tooltip");

const projection = d3.geoOrthographic()
  .scale(280)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath(projection);

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
  return "rgb(77, 67, 67)"; 
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
  const dot = d3.select(this);
  const isSelected = dot.classed("selected");

  timeline.selectAll(".dot").classed("selected", false);

  if (isSelected) {
    g.selectAll("path").attr("fill", "rgb(230, 230, 230)"); 
  } 
  else {
    dot.classed("selected", true);
    updateYear(d);
  }
});