const width = 960, height = 600;
const svg = d3.select("svg");
const tooltip = d3.select("#tooltip");
const projection = d3.geoOrthographic().scale(280).translate([width / 2, height / 2]).clipAngle(90);
const path = d3.geoPath(projection);
const g = svg.append("g");
svg.append("path").datum({type: "Sphere"}).attr("fill", "rgba(255,255,255,0.1)").attr("d", path);

let countries = [], worldData;

// Load world map
d3.json("countries-110m.json").then(world => {
  worldData = topojson.feature(world, world.objects.countries).features;
  countries = g.selectAll("path")
    .data(worldData)
    .enter()
    .append("path")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5);
  updateYear("2022");
});

// Drag to rotate
let lastPos = null;
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

// Zoom
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
  return "#d96f80"; 
};

// Update map for selected year
function updateYear(year) {
  d3.json(`WC-Data/fifa${year}.json`).then(data => {
    const teamMap = new Map(data.map(d => [d.Team.toLowerCase(), d]));

    countries
      .attr("fill", d => {
        const country = teamMap.get(d.properties.name?.toLowerCase());
        return country ? colorMap(country.Position) : "#cfd8dc";
      })
      .attr("d", path)
      .on("mouseover", function(event, d) {
        const team = teamMap.get(d.properties.name?.toLowerCase());
        if (team) {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
          tooltip
            .style("opacity", 1)
            .html(`<strong>${team.Team}</strong><br>Position: ${team.Position}<br>Points: ${team.Points}<br>Wins: ${team.Win}, Losses: ${team.Loss}`);
        }
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "#333").attr("stroke-width", 0.5);
        tooltip.style("opacity", 0);
      });
  });
}

// Change year dropdown
d3.select("#yearSelect").on("change", function() {
  const selectedYear = this.value;
  updateYear(selectedYear);
});