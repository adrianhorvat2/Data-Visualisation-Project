const width_globe = 800, height_globe = 664;

const svg = d3.select("#globe")
  .attr("width", width_globe) 
  .attr("height", height_globe); 

const tooltip = d3.select("#tooltip");

const projection = d3.geoOrthographic()
  .scale(280)
  .translate([width_globe / 2, height_globe / 2])
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
    .attr("transform", `translate(${width_globe - 135}, 20)`); 

  legend.append("rect")
    .attr("x", 5)
    .attr("y", -10)
    .attr("width", 120)
    .attr("height", legendData.length * 20 + 10)
    .attr("fill","rgb(251, 249, 249)")
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
    .text(d => d.label)
    .attr("font-weight", "bold");
}

svg.append("path")
  .datum({type: "Sphere"})
  .attr("fill", "#87CEEB")
  .attr("d", path);

const g = svg.append("g");


let countries = [], worldData;
let isYearSelected = false;

function setDefaultHoverBehavior(selection) {
  selection
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "rgb(150, 150, 150)");
      d3.select("#tooltip")
        .style("display", "block")
        .html(`<strong>${d.properties.name}</strong>`);
    })
    .on("mousemove", function(event) {
      d3.select("#tooltip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("fill", "rgb(230, 230, 230)");
      d3.select("#tooltip").style("display", "none");
    })
    .on("click", function(event, d) {
      if (!isYearSelected) {
        showGraphsByCountry(d.properties.name);
      }
    });
    showDefaultMessage();
}

function showDefaultMessage() {
  d3.select("#control-panel")
    .append("div")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("padding", "20px")
    .style("height", "100%") 
    .text("Odaberite državu na globusu ili godinu na liniji za prikaz podataka");
}

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

    setDefaultHoverBehavior(countries);
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
  showGraphs(selectedYear);
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
    
    if (isYearSelected) {
      if (d3.select(this).classed("selected")) {
        isYearSelected = false;
        timeline.selectAll(".dot").classed("selected", false);
        
        g.selectAll("path")
          .attr("fill", "rgb(230, 230, 230)") 

        setDefaultHoverBehavior(g.selectAll("path"));
        d3.select("#control-panel").selectAll("*").remove();
        showDefaultMessage();
      } else {
        timeline.selectAll(".dot").classed("selected", false);
        d3.select(this).classed("selected", true);
        updateYear(d);
        showLegend();
        showGraphsByYear(d);
      }
    } else {
      isYearSelected = true;
      d3.select(this).classed("selected", true);
      updateYear(d);
      showLegend();
      showGraphsByYear(d);
    }
  });

const svgWidth = 800;
const svgHeight = 600;

function drawTop7GoalscorerTeamsGraph(data, container) {
  const top7Data = data
    .sort((a, b) => b["Goals For"] - a["Goals For"])
    .slice(0, 7);

  const barSvg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(top7Data, d => d["Goals For"])])
    .range([svgHeight - 100, 50]);

  const xPositions = [svgWidth / 2 - 270 , svgWidth / 2 - 195, svgWidth / 2 - 120, svgWidth / 2 - 45, svgWidth / 2 + 30, svgWidth / 2 + 105, svgWidth / 2 + 180];
  const graphGroup = barSvg.append("g")
    .attr("transform", "translate(50, 50)");

  const yAxis = d3.axisLeft(yScale);

  const yGrid = d3.axisLeft(yScale)
    .tickSize(-(svgWidth - 250))
    .tickFormat(""); 

  graphGroup.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(100, 0)")
    .call(yGrid)
    .selectAll("line")
    .attr("opacity", 0.2); 


  graphGroup.append("g")
    .attr("transform", "translate(100, 0)")
    .call(yAxis);

  graphGroup.select(".grid")
    .select(".domain")
    .remove();


  const colorScale = d3.scaleLinear()
  .domain([d3.min(top7Data, d => d["Goals For"]), d3.max(top7Data, d => d["Goals For"])])
  .range(["#bbdefb" , "#0d47a1"]); 


  graphGroup.selectAll("rect")
  .data(top7Data)
  .enter()
  .append("rect")
  .attr("x", (d, i) => xPositions[i])
  .attr("y", d => yScale(d["Goals For"]))
  .attr("width", 40)
  .attr("height", d => svgHeight - 100 - yScale(d["Goals For"]))
  .attr("fill", d => colorScale(d["Goals For"]));


graphGroup.selectAll("text.team")
  .data(top7Data)
  .enter()
  .append("text")
  .attr("class", "team")
  .attr("x", (d, i) => xPositions[i] + 20)
  .attr("y", d => yScale(d["Goals For"]) - 10)
  .attr("transform", (d, i) => {
    const x = xPositions[i] + 22;
    const y = yScale(d["Goals For"]) - 10;
    return `rotate(-40, ${x}, ${y})`; 
  })
  .text(d => d.Team)
  .style("font-size", "14px")
  .style("font-weight", "bold");

  barSvg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Top 7 timova po postignutim golovima");
}

function drawGoalsScatterPlot(data, container) {

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const margin = { top: 50, right: 50, bottom: 70, left: 70 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const graphGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d["Goals For"]) + 2])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d["Goals Against"]) + 2])
    .range([height, 0]);

  const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d["Games Played"])])
    .range([5, 15]);

  graphGroup.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Golovi postignuti");

  graphGroup.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Golovi primljeni");

  const xGrid = d3.axisBottom(xScale)
    .tickSize(-height)
    .tickFormat("");
  const yGrid = d3.axisLeft(yScale)
    .tickSize(-width)
    .tickFormat("");

  graphGroup.append("g")
    .attr("class", "grid")
    .call(yGrid)
    .selectAll("line")
    .attr("opacity", 0.2);

  graphGroup.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0, ${height})`)
    .call(xGrid)
    .selectAll("line")
    .attr("opacity", 0.2);

  graphGroup.selectAll(".grid .domain").remove();

  graphGroup.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d["Goals For"]))
    .attr("cy", d => yScale(d["Goals Against"]))
    .attr("r", d => sizeScale(d["Games Played"]))
    .attr("fill", d => colorMap(d.Position))
    .attr("opacity", 1) 
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
      d3.select("#tooltip")
        .style("display", "block")
        .html(`
          <strong>${d.Team}</strong><br>
          <div>Utakmice: ${d["Games Played"]}</div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke", null);
      d3.select("#tooltip").style("display", "none");
    });

  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Odnos primljenih i postignutih golova");
}

function drawMatchResultsChart(data, container) {

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const margin = { top: 50, right: 20, bottom: 20, left: 20 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const graphGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const sortedData = data.sort((a, b) => a.Position - b.Position);

  const gridSize = 4;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;
  const pieRadius = Math.min(cellWidth, cellHeight) / 2 - 10 

  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(d => pieRadius * Math.sqrt(d.data.games / 7)); 

  const colors = {
    Win: "#4caf50", 
    Draw: "#b3b1b1", 
    Loss: "#f44336" 
  };

  sortedData.forEach((team, i) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;

    const pieData = [
      { key: "Win", value: team.Win, label: "Pobjede", games: team["Games Played"] },
      { key: "Draw", value: team.Draw, label: "Neriješeno", games: team["Games Played"] },
      { key: "Loss", value: team.Loss, label: "Porazi", games: team["Games Played"] }
    ].filter(d => d.value > 0); 

    const pieGroup = graphGroup.append("g")
      .attr("transform", `translate(${x}, ${y})`);

    pieGroup.selectAll("path")
      .data(pie(pieData))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => colors[d.data.key])
      .attr("opacity", 0.8)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke", "black").attr("stroke-width", 1);
        d3.select("#tooltip")
          .style("display", "block")
          .html(`
            ${d.data.label}: ${d.data.value}<br>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.8).attr("stroke", null);
        d3.select("#tooltip").style("display", "none");
      });

    pieGroup.append("text")
      .attr("y", pieRadius + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(team.Team);
  });

  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Pobjede, neriješeno i porazi po timovima");
}

function showGraphsByYear(year) {
  d3.json(`WC-Data/fifa${year}.json`).then(data => {
    const graphs = [
      (container) => drawTop7GoalscorerTeamsGraph(data, container),
      (container) => drawGoalsScatterPlot(data, container),
      (container) => drawMatchResultsChart(data, container)
    ];
    let currentGraphIndex = 0;
    const controlPanel = d3.select("#control-panel");
    controlPanel.selectAll("*").remove();

    const navigation = controlPanel.append("div")
      .attr("class", "navigation")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("padding", "10px");

    navigation.append("button")
      .attr("class", "nav-button")
      .text("← Prethodni")
      .on("click", () => {
        currentGraphIndex = (currentGraphIndex - 1 + graphs.length) % graphs.length;
        renderGraph();
      });

    navigation.append("button")
      .attr("class", "nav-button")
      .text("Sljedeći →")
      .on("click", () => {
        currentGraphIndex = (currentGraphIndex + 1) % graphs.length;
        renderGraph();
      });

    const graphContainer = controlPanel.append("div")
      .attr("id", "graph-container");

    function renderGraph() {
      graphContainer.selectAll("*").remove(); 
      graphs[currentGraphIndex](graphContainer); 
    }

    renderGraph();
  }).catch(error => {
    console.error("Error loading data:", error);
  });
}


function drawPositionCountryGraph(container, country) {

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const graphGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  Promise.all(
    years.map(year =>
      d3.json(`WC-Data/fifa${year}.json`).then(data => ({
        year,
        data: data.find(d => d.Team.toLowerCase() === country.toLowerCase())
      }))
    )
  ).then(results => {
    const countryData = results
      .filter(result => result.data)
      .map(result => ({
        year: result.year,
        position: result.data.Position
      }));

    if (countryData.length === 0) {
      svg.append("text")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(`Ekipa ${country} nije nikada sudjelovala na svjetskom prvenstvu.`);
      return;
    }

    const xScale = d3.scalePoint()
      .domain(countryData.map(d => d.year))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([1, Math.max(...countryData.map(d => d.position), 32)])
      .range([0, height]);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.position));


    graphGroup.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "12px")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    graphGroup.append("g")
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -35)
      .attr("fill", "black")
      .attr("transform", "rotate(-90)")
      .text("Pozicija")
      .style("font-size", "14px")
      .style("font-weight", "bold");

    graphGroup.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text") 
      .style("font-size", "12px");

    graphGroup.append("path")
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    graphGroup.selectAll("circle")
      .data(countryData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.position))
      .attr("r", 5)
      .attr("fill", d => d.position === 1 || d.position === 2 || d.position === 3 ? colorMap(d.position) : "steelblue")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        d3.select("#tooltip")
          .style("display", "block")
          .html(`Godina: ${d.year}<br>Pozicija: ${d.position}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 5);
        d3.select("#tooltip").style("display", "none");
      });

    svg.append("text")
      .attr("x", svgWidth / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text(`${country} - Pozicija kroz godine`)
      .style("font-size", "20px")
      .style("font-weight", "bold");
  }).catch(error => {
    console.error("Greška pri učitavanju podataka:", error);
  });
}

function drawCountryStatsRadar(container, country) {

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const radius = Math.min(svgWidth - margin.left - margin.right, svgHeight - margin.top - margin.bottom) / 2 - 50;

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const graphGroup = svg.append("g")
    .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);

  Promise.all(
    years.map(year =>
      d3.json(`WC-Data/fifa${year}.json`).then(data => ({
        year,
        data: data.find(d => d.Team.toLowerCase() === country.toLowerCase())
      }))
    )
  ).then(results => {
    const countryData = results
      .filter(result => result.data)
      .map(result => result.data);

    const totalGames = countryData.reduce((sum, d) => sum + d["Games Played"], 0);
    const totalWins = countryData.reduce((sum, d) => sum + d.Win, 0);
    const totalGoalsFor = countryData.reduce((sum, d) => sum + d["Goals For"], 0);
    const totalGoalsAgainst = countryData.reduce((sum, d) => sum + d["Goals Against"], 0);
    const bestPosition = Math.min(...countryData.map(d => d.Position));
    const appearances = countryData.length;
    
    const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
    const avgGoalsFor = totalGames > 0 ? totalGoalsFor / totalGames : 0;
    const avgGoalsAgainst = totalGames > 0 ? totalGoalsAgainst / totalGames : 0;
    const goalDiffRatio = totalGoalsAgainst > 0 ? totalGoalsFor / totalGoalsAgainst : totalGoalsFor;
    
    const radarData = [
      { 
        axis: "Učestalost kvalifikacija", 
        value: Math.min((appearances / years.length) * 100, 100),
        rawValue: `${appearances}/${years.length}`,
        description: "Broj kvalifikacija / ukupno SP-a"
      },
      { 
        axis: "Postotak pobjeda", 
        value: winRate,
        rawValue: `${winRate.toFixed(1)}%`,
        description: "Postotak pobjeda od ukupnih utakmica"
      },
      { 
        axis: "Napadačka efikasnost", 
        value: Math.min(avgGoalsFor * 20, 100),
        rawValue: avgGoalsFor.toFixed(1),
        description: "Prosjek postignutih golova po utakmici"
      },
      { 
        axis: "Defenzivna efikasnost", 
        value: Math.max(100 - (avgGoalsAgainst * 20), 0),
        rawValue: avgGoalsAgainst.toFixed(1),
        description: "Obrnut prosjek primljenih golova"
      },
      { 
        axis: "Gol razlika", 
        value: Math.min(goalDiffRatio * 25, 100),
        rawValue: goalDiffRatio.toFixed(2),
        description: "Omjer postignutih i primljenih golova"
      },
      { 
        axis: "Najbolji plasman", 
        value: Math.max(100 - (bestPosition - 1) * 3, 0),
        rawValue: bestPosition,
        description: "Najbolja pozicija"
      }
    ];

    const angleSlice = (Math.PI * 2) / radarData.length;

    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      graphGroup.append("circle")
        .attr("r", (radius / levels) * i)
        .attr("fill", "none")
        .attr("stroke", "#CDCDCD")
        .attr("stroke-width", 1)
        .attr("opacity", 0.5);
    }

    radarData.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      graphGroup.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", y)
        .attr("stroke", "#CDCDCD")
        .attr("stroke-width", 1);

      const labelX = Math.cos(angle) * (radius + 30);
      const labelY = Math.sin(angle) * (radius + 30);
      
      graphGroup.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(d.axis);
    });

    const line = d3.lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius(d => (d.value / 100) * radius)
      .curve(d3.curveLinearClosed);

    graphGroup.append("path")
      .datum(radarData)
      .attr("d", line)
      .attr("fill", "rgba(54, 162, 235, 0.3)")
      .attr("stroke", "rgba(54, 162, 235, 1)")
      .attr("stroke-width", 2);

    graphGroup.selectAll("circle.data-point")
      .data(radarData)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", (d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return Math.cos(angle) * ((d.value / 100) * radius);
      })
      .attr("cy", (d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        return Math.sin(angle) * ((d.value / 100) * radius);
      })
      .attr("r", 4)
      .attr("fill", "rgba(54, 162, 235, 1)")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 6);
        d3.select("#tooltip")
          .style("display", "block")
          .html(`
            <strong>${d.axis}</strong><br>
            Vrijednost: ${d.rawValue}<br>
            <em>${d.description}</em>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 4);
        d3.select("#tooltip").style("display", "none");
      });

    for (let i = 1; i <= levels; i++) {
      graphGroup.append("text")
        .attr("x", 5)
        .attr("y", -((radius / levels) * i))
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .style("fill", "#737373")
        .text((100 / levels * i).toFixed(0));
    }

    svg.append("text")
      .attr("x", svgWidth / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text(`${country} - Sveukupna statistika`);

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, ${svgHeight - 120})`);

    legend.append("rect")
      .attr("width", 200)
      .attr("height", 100)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("stroke", "#ccc")
      .attr("rx", 5);

    const legendText = [
      `Ukupno nastupa: ${appearances}`,
      `Ukupno utakmica: ${totalGames}`,
      `Ukupno pobjeda: ${totalWins}`,
      `Najbolji plasman: ${bestPosition}`,
      `Ukupno golova: ${totalGoalsFor}:${totalGoalsAgainst}`
    ];

    legend.selectAll("text")
      .data(legendText)
      .enter()
      .append("text")
      .attr("x", 10)
      .attr("y", (d, i) => 20 + i * 15)
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .text(d => d);

  }).catch(error => {
    console.error("Greška pri učitavanju podataka:", error);
  });
}

function showGraphsByCountry(country) {
  const graphs = [
    (container) => drawPositionCountryGraph(container, country),
    (container) => drawCountryStatsRadar(container, country)
  ];
  let currentGraphIndex = 0;
  const controlPanel = d3.select("#control-panel");
  controlPanel.selectAll("*").remove();

  const navigation = controlPanel.append("div")
    .attr("class", "navigation")
    .style("display", "flex")
    .style("justify-content", "space-between")
    .style("padding", "10px");

  navigation.append("button")
    .attr("class", "nav-button")
    .text("← Prethodni")
    .on("click", () => {
      currentGraphIndex = (currentGraphIndex - 1 + graphs.length) % graphs.length;
      renderGraph();
    });

  navigation.append("button")
    .attr("class", "nav-button")
    .text("Sljedeći →")
    .on("click", () => {
      currentGraphIndex = (currentGraphIndex + 1) % graphs.length;
      renderGraph();
    });

  const graphContainer = controlPanel.append("div")
    .attr("id", "graph-container");

  function renderGraph() {
    graphContainer.selectAll("*").remove();
    graphs[currentGraphIndex](graphContainer);
  }

  renderGraph();
}