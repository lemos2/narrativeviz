let slide = 0;
let total_slides = 3;
let olympics_data, country_data;
let country = 'USA';

let colors = {
  "Gold":"#FFD700",
  "Silver":"#C0C0C0", 
  "Bronze":"#CD7F32"
};

var margin = {top: 35, left: 35, bottom: 35, right: 35},
		width = 600 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;

async function init() {

	const data2 = await d3.csv("athlete_events.csv");
	var usadata = data2.filter(function(d) { 
	        if( d['NOC'] == 'USA' && parseInt(d['Year']) >= 1992)
	            return d; 
	});

	country_data = usadata;
	olympics_data = data2;

	var test = d3.nest()
		.key(function(d) { return d['NOC']; })
		.rollup(function(v) { return {
				medal_count: d3.sum(v, function(d) { 
					if( (d.Medal == 'Gold' || d.Medal == 'Silver' || d.Medal == 'Bronze') && d['Year'] >= 1992 )
						return 1; }),
				team: d3.map(v, function(d){return d['Team'];}).keys()
    		};
		})
		.entries(olympics_data);
		test.sort((function(a, b){
		  return a.key.localeCompare(b.key);
		}))

		var options = d3.select("#country").selectAll("option")
		.data(test)
	.enter().append("option")
		.text(d => d['key'])
		.property("selected", function(d){ if(d.value.medal_count > 0) return d['key'] === country; });

	medalsBarChart();
	let prev = document.getElementById('prev');
	prev.setAttribute("disabled", true);
}

function changeCountry(element){
	country = element.value;
	country_data = olympics_data.filter(function(d) { 
	        if( d['NOC'] == country && parseInt(d['Year']) >= 1992)
	            return d; 
	});
	var test = d3.nest()
		.key(function(d) { return d['NOC']; })
		.rollup(function(v) { return {
				team: d3.map(v, function(d){return d['Team'];}).keys()
    		};
		})
		.entries(country_data);
		test.sort((function(a, b){
		  return a.key.localeCompare(b.key);
		}));
	if(slide == 0){
		medalsBarChart();
	}else if(slide == 1){
		medalsBarChartBySport();
	}else if(slide == 2){
		medalCountsByAge();
	}
	var html = country;
	if(test.length > 0)
		html += ` (${test[0].value.team[0]})`;
	d3.select("#selectedCountry").html(html);
}

function prev(){
	let select = document.getElementById('country');
	let prev = document.getElementById('prev');
	let next = document.getElementById('next');
	let color_legend = document.getElementById('color_legend');
	if(slide >= 1)
		slide = slide-1;

	if(slide == 0){
		prev.setAttribute("disabled", true);
		medalsBarChart();
	}else if(slide == 1){
		prev.removeAttribute("disabled");
		next.removeAttribute("disabled");
		color_legend.style.display = "none";
		medalsBarChartBySport();
	}else if(slide == 2){
		next.setAttribute("disabled", true);
		color_legend.style.display = "inline-block";
		medalCountsByAge();
	}
}

function next(){
	let select = document.getElementById('country');
	let prev = document.getElementById('prev');
	let next = document.getElementById('next');
	let color_legend = document.getElementById('color_legend');
	if(slide <= total_slides - 1)
		slide = slide + 1;

	if(slide == 0){
		prev.setAttribute("disabled", true);
		medalsBarChart();
	}else if(slide == 1){
		prev.removeAttribute("disabled");
		next.removeAttribute("disabled");
		color_legend.style.display = "none";
		medalsBarChartBySport();
	}else if(slide == 2){
		next.setAttribute("disabled", true);
		color_legend.style.display = 'inline-block';
		medalCountsByAge();
	}
}

function medalCountsByAge(){
	var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	div.transition()		
        .duration(200)		
        .style("opacity", 0);
	// Clear svg
	d3.selectAll("svg > *").remove();

	let years = [1992, 1996, 2000, 2004, 2008, 2012, 2016];

	var olympics_aggregates2 = d3.nest()
		.key(function(d) { return d.Age; })
		.entries(country_data);

	var keys = [];
	olympics_aggregates2.forEach(function(d) {
		if(d['key'] !== 'NA')
			keys.push(d['key']);
	});

	var data = d3.nest().key(function(d){ return d.Year; }).rollup(function(v){
  	var result = {};
  	var result2 = [];
  		var total = 0
	  keys.forEach(function(key) { // for each key
	    result[key] = d3.sum(v, function(d){if(d.Age == key && (d.Medal == 'Gold' || d.Medal == 'Silver' || d.Medal == 'Bronze')) return 1; });
	    total += result[key];
	    result2.push({'age': key, 'total': result[key]})
	  });
	  result['total'] = total;

	  return result2;
	}).entries(country_data);

	var new_data = []
	for(d in data){
		for( v in data[d].value){
			if(data[d].value[v].total !== 0){
				data[d].value[v].year = data[d].key;
				new_data.push(data[d].value[v]);
			}
		}
	}

	var xValue = function(d) { return d.year;},
    xScale = d3.scaleBand().range([-10, width - margin.right]).padding(0.1),
    xMap = function(d) { return xScale(xValue(d));},
    xAxis = d3.axisBottom(xScale);

	// setup y
	var yValue = function(d) {
			return d.age;
		},
    yScale = d3.scaleLinear().range([height- margin.bottom, margin.top]),
    yMap = function(d) { return yScale(yValue(d));}, 
    yAxis = d3.axisLeft(yScale);

   	var svg = d3.select("#svg1")
  		.append("g")
    	.attr("transform", "translate(" + margin.left + "," + 0 + ")");

    xScale.domain(years);
  	yScale.domain([d3.min(new_data, function(d) {
	  return Math.min(d.age); }), d3.max(new_data, function(d) {
	  return Math.max(d.age); })]);

  	var cValue = function(d) { return d.total;};

    var color = d3.scaleLinear().domain([1,d3.max(new_data, function(d) {
	  return Math.max(d.total); })])
  	.range(["white", "blue"]);

  	continuous("#color_legend", color);

  	function continuous(selector_id, colorscale) {
		var legendheight = 200,
		  legendwidth = 80;

		var canvas = d3.select(selector_id)
		.style("height", legendheight + "px")
		.style("width", legendwidth + "px")
		.style("position", "relative")
		.append("canvas")
		.attr("height", legendheight - margin.top - margin.bottom)
		.attr("width", 1)
		.style("height", (legendheight - margin.top - margin.bottom) + "px")
		.style("width", (legendwidth - margin.left - margin.right) + "px")
		.style("border", "1px solid #000")
		.style("position", "absolute")
		.style("top", (margin.top) + "px")
		.style("left", (margin.left) + "px")
		.node();

		var ctx = canvas.getContext("2d");

		var legendscale = d3.scaleLinear()
		.range([1, legendheight - margin.top - margin.bottom])
		.domain(colorscale.domain());

		var image = ctx.createImageData(1, legendheight);
		d3.range(legendheight).forEach(function(i) {
		var c = d3.rgb(colorscale(legendscale.invert(i)));
		image.data[4*i] = c.r;
		image.data[4*i + 1] = c.g;
		image.data[4*i + 2] = c.b;
		image.data[4*i + 3] = 255;
		});
		ctx.putImageData(image, 0, 0);

		var legendaxis = d3.axisRight()
		.scale(legendscale)
		.tickSize(6)
		.ticks(8);

		var svg = d3.select(selector_id)
		.append("svg")
		.attr("height", (legendheight) + "px")
		.attr("width", (legendwidth) + "px")
		.style("position", "absolute")
		.style("left", "0px")
		.style("top", "0px")

		svg
		.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(" + (legendwidth - margin.left - margin.right + 3) + "," + (margin.top) + ")")
		.call(legendaxis);
	};

    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  	// x-axis
  	svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(10,${height - margin.bottom})`)
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6)
      .text("Years");

  	// y-axis
  	svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "translate(50,50)")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .text("Age");

  	// draw dots
  	svg.selectAll(".dot")
      .data(new_data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", xMap)
      .attr("cy", yMap)
      .attr("transform", "translate(30,0)")
      .style("fill", function(d) { return color(cValue(d));}) 
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html("Age: "+ d["age"] + "<br/> Year:" + xValue(d) + "<br/> Total:" + d.total)
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px")
               .style("background-color", "white")
               .style("height", "40px")
               .style("width", "75px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

	setAxisLabels("Years", "Age");

	var description = 'Compare the ages of medal winning athletes from '+ country+' across recent Summer Olympics.<br/>';
	if(country == 'USA')
		description += 'The USA had athletes as young as 14 in the years 1992 and 1996 and as old as 52 in 2016 Olympics.';
	d3.select("#description").html(description);
}

function medalsBarChart(){

	var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	div.transition()		
        .duration(200)		
        .style("opacity", 0);
	// Clear svg
	d3.selectAll("#svg1 > *").remove();
	var keys = ["Gold", "Silver", "Bronze"];

	var years = [1992, 1996, 2000, 2004, 2008, 2012, 2016];

	var svg = d3.select("#svg1");

	var x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1);

	var y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

	var xAxis = svg.append("g")
		.attr("transform", `translate(10,${height - margin.bottom})`)
		.attr("class", "x-axis")

	var yAxis = svg.append("g")
		.attr("transform", `translate(50,0)`)
		.attr("class", "y-axis")

	var color = d3.scaleOrdinal()
		.range(["#FFD700", "#C0C0C0", "#CD7F32"])
		.domain(keys);

	var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

	var data1 = d3.nest()
	.key(function(d) { return d.Year; })
	.rollup(function(v) { return {
			Gold: d3.sum(v, function(d) { if(d.Medal == 'Gold') return 1; }),
			Silver: d3.sum(v, function(d) { if(d.Medal == 'Silver') return 1; }),
			Bronze: d3.sum(v, function(d) { if(d.Medal == 'Bronze') return 1; }),
			total: d3.sum(v, function(d) { if(d.Medal == 'Bronze' || d.Medal == 'Silver' || d.Medal == 'Gold') return 1; }),
		};
	})
	.entries(country_data);

	let data = [];
	let a = 0;
	let next_year = null;
	for(yr in years){
		if(data1.length ==0){
			next_year = {
				'Gold': 0,
				'Silver': 0,
				'Bronze': 0,
				'total': 0,
				'Year': years[yr]
			};
		}else{
			if(data1[a].key == years[yr]){
				next_year = {
					'Gold': data1[a].value['Gold'],
					'Silver': data1[a].value['Silver'],
					'Bronze': data1[a].value['Bronze'],
					'total': data1[a].value['total'],
					'Year': data1[a].key
				}
				a = a+1;
			}else{
				next_year = {
					'Gold': 0,
					'Silver': 0,
					'Bronze': 0,
					'total': 0,
					'Year': years[yr]
				};
			}
		}
		data.push(next_year);
	}

	y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();

	svg.selectAll(".y-axis").transition().duration(200)
		.call(d3.axisLeft(y).ticks(null, "s"))

	x.domain(data.map(d => d.Year));

	svg.selectAll(".x-axis").transition().duration(200)
		.call(d3.axisBottom(x).tickSizeOuter(0))

	var group = svg.selectAll("g.layer")
		.data(d3.stack().keys(keys)(data), d => d.key);

	group.exit().remove()

	group.enter().append("g")
	.attr("transform", `translate(10,0)`)
		.classed("layer", true)
		.attr("fill", d => color(d.key))
		.on('mouseover', function(d, i) {
			var index = d.index;
			var key = d['key'];
			var col_vals = [59, 117, 182, 247, 311, 376, 441, 506]
			var column = null;
			for(var i=0; i<col_vals.length; i++){
				if(d3.event.pageX >=col_vals[i] && d3.event.pageX <= col_vals[i+1] ){
					column = i;
					break;
				}
			}
			tooltip.transition()
               .duration(200)
               .style("opacity", .9);
		    tooltip.html(key + ": " + d[column]['data'][key] + "<br>Year: " + d[column].data.Year + "")
		    .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px")
               .style("background-color", "white")
               .style("width", "75px")
               .style("height", "40px");
		})
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });
		
	var bars = svg.selectAll("g.layer").selectAll("rect")
		.data(d => d, e => e.data.Year);

	bars.exit().remove()

	bars.enter().append("rect")
		.attr("width", x.bandwidth())
		.merge(bars)
	.transition().duration(200)
		.attr("x", d => x(d.data.Year))
		.attr("y", d => y(d[1]))
		.attr("height", d => y(d[0]) - y(d[1]));

	var text = svg.selectAll(".text")
		.data(data, d => d.Year);

	text.exit().remove()

	text.enter().append("text")
		.attr("class", "text")
		.attr("text-anchor", "middle")
		.merge(text)
	.transition().duration(200)
		.attr("x", d => x(d.Year) + x.bandwidth() / 2)
		.attr("y", d => y(d.total) - 5)
		.text(d => d.total);

	var legend = svg.selectAll(".legend")
      	.data(color.domain().slice())
    	.enter().append("g")
      	.attr("class", "legend")
      	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	legend.append("rect")
		.attr("x", 600 - 18)
      	.attr("width", 10)
      	.attr("height", 10)
      	.style("fill", function(d) {  return colors[d]; });
  
  	legend.append("text")
      	.attr("x", 600 - 24)
      	.attr("y", 9)
      	.attr("dy", ".25em")
      	.style("text-anchor", "end")
      	.attr("font-size", "11px")
      	.text(function(d) { return d; });

	setAxisLabels("Years", country+" Medal Counts");
	var description = 'Explore '+country +' medal counts across several recent Summer Olympics.<br/>';
	if(country == 'USA')
		description += 'One thing of note is that the USA has had more gold medals than silver or bronze in each of the last 7 Summer Olympics.';
	d3.select("#description").html(description);
}

function medalsBarChartBySport(){

	var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	div.transition()		
        .duration(200)		
        .style("opacity", 0);
	// Clear svg
	d3.selectAll("#svg1 > *").remove();

	var olympics_aggregates2 = d3.nest()
		.key(function(d) { return d.Sport; })
		.entries(country_data);

	var keys = [];
	olympics_aggregates2.forEach(function(d) {
		keys.push(d['key']);
	});

	var years = [1992, 1996, 2000, 2004, 2008, 2012, 2016];

	var svg = d3.select("#svg1");

	var x = d3.scaleBand()
		.range([margin.left, width - margin.right])
		.padding(0.1);

	var y = d3.scaleLinear()
		.rangeRound([height - margin.bottom, margin.top])

	var xAxis = svg.append("g")
		.attr("transform", `translate(10,${height - margin.bottom})`)
		.attr("class", "x-axis")

	var yAxis = svg.append("g")
		.attr("transform", `translate(50,0)`)
		.attr("class", "y-axis")

	var color = d3.scaleOrdinal(d3.schemeCategory10);

	var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

	var data1 = d3.nest().key(function(d){ return d.Year; }).rollup(function(v){
		var result = {};
		var total = 0
		keys.forEach(function(key) { // for each key
			result[key] = d3.sum(v, function(d){ if(d.Sport == key && (d.Medal == 'Gold' || d.Medal == 'Silver' || d.Medal == 'Bronze')) return 1; });
			total += result[key];
		});
		result['total'] = total;

		return result;
	}).entries(country_data);

	var data = [];
	var a = 0;
	var next_year = null;
	for(yr in years){
		if(data1.length == 0){
			next_year = {};
			for( k in keys){
				next_year[keys[k]] = 0;
			}
			next_year['Year'] = years[yr];
			next_year['total'] = 0;
		}else{
			if(data1[a].key == years[yr]){
				next_year = {};
				for( k in keys){
					next_year[keys[k]] = data1[a].value[keys[k]];
				}
				next_year['Year'] = years[yr];
				next_year['total'] = data1[a].value.total;
				a = a+1;
			}else{
				next_year = {};
				for( k in keys){
					next_year[keys[k]] = 0;
				}
				next_year['Year'] = years[yr];
				next_year['total'] = 0;
			}
		}
		data.push(next_year);
	}

	y.domain([0, d3.max(data, d => d3.sum(keys, k => +d[k]))]).nice();

	svg.selectAll(".y-axis").transition().duration(200)
		.call(d3.axisLeft(y).ticks(null, "s"))

	x.domain(data.map(d => d.Year));

	svg.selectAll(".x-axis").transition().duration(200)
		.call(d3.axisBottom(x).tickSizeOuter(0));

	var group = svg.selectAll("g.layer")
		.data(d3.stack().keys(keys)(data), d => d.key);

	group.exit().remove()

	group.enter().append("g")
		.attr("transform", `translate(10,0)`)
		.classed("layer", true)
		.attr("fill", d => color(d.key))
		.on('mouseover', function(d, i) {
			var index = d.index;
			var key = d['key'];
			var col_vals = [59, 117, 182, 247, 311, 376, 441, 506]
			var column = null;
			for(var i=0; i<col_vals.length; i++){
				if(d3.event.pageX >=col_vals[i] && d3.event.pageX <= col_vals[i+1] ){
					column = i;
					break;
				}
			}
			tooltip.transition()
               .duration(200)
               .style("opacity", .9);
		    tooltip.html(key + ": " + d[column]['data'][key] + "<br>Year: " + d[column].data.Year + "")
		    .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px")
               .style("background-color", "white")
               .style("width", "130px")
               .style("height", "40px");
		})
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      });

	var bars = svg.selectAll("g.layer").selectAll("rect")
		.data(d => d, e => e.data.Year);

	bars.exit().remove()

	bars.enter().append("rect")
		.attr("width", x.bandwidth())
		.merge(bars)
	.transition().duration(200)
		.attr("x", d => x(d.data.Year))
		.attr("y", d => y(d[1]))
		.attr("height", d => y(d[0]) - y(d[1]));

	var text = svg.selectAll(".text")
		.data(data, d => d.Year);

	text.exit().remove();

	text.enter().append("text")
		.attr("class", "text")
		.attr("text-anchor", "middle")
		.merge(text)
	.transition().duration(200)
		.attr("x", d => x(d.Year) + x.bandwidth() / 2)
		.attr("y", d => y(d.total) - 5)
		.text(d => d.total);


	var legend = svg.selectAll(".legend")
      .data(color.domain().slice().reverse())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 13 + ")"; });


	legend.append("rect")
			.attr("x", 600 - 18)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", color);
  
  legend.append("text")
      .attr("x", 600 - 24)
      .attr("y", 6)
      .attr("dy", ".25em")
      .style("text-anchor", "end")
      .style("font-size","10px")
      .text(function(d) { return d; });

	setAxisLabels("Years", country+" Medal Counts");
	var description = 'Now, compare '+country +' medal counts by sport across several recent Summer Olympics. <br/>';
	if(country == 'USA')
		description += 'Looking at the USA data, it is clear that the USA team has been dominant in swimming throughout the years, ranging from 56-71 medals in that sport each year.';
	d3.select("#description").html(description);
}

function setAxisLabels(x,y){
	d3.select("#svg1").append("text")             
      .attr("transform",
            "translate(" + (500/2) + " ," + 
                           (435) + ")")
      .style("text-anchor", "middle")
      .text(x);

	d3.select("#svg1").append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 10)
      .attr("x",0 - (500 / 2))
      .attr("dy", ".5em")
      .style("text-anchor", "middle")
      .text(y); 
}



