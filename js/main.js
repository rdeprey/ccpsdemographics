// ---- FOR THE GRAPH ---- //

// **********************************************************************************
// ************************ BEGINNING OF THE COUNTY LEVEL ***************************
// **********************************************************************************

// set the frame and margin for the svg
var margin = {top: 25, right: 50, bottom: 25, left: 50},
	browserwidth = d3.select(".g-stacked-bar-chart").node().clientWidth,
	height = 420 - margin.top - margin.bottom;

var mobiledefaultwidth = 780,
	mobiledefaultheight = 480;

//if ($(window).width() < mobiledefaultwidth || $(window).height() < mobiledefaultheight) {
if ($(window).width() < mobiledefaultwidth) {
	var width = browserwidth;
}
else{
	var width = browserwidth - margin.left - margin.right;
}
	
// colors for the chart and map
var c = ["#98abc5", "#8a89a6", "#a05d56", "#ff8c00"]
//var c = ["#98abc5", "#c6e5d9", "#edc951", "#faa460"]
	
// set the color scale
var color = d3.scale.ordinal()
    .range(c);

// set the ranges
var x = d3.scale.ordinal()
    .rangeRoundBands([0, (width - (margin.right))], .2);
					
var y = d3.scale.linear()
	.rangeRound([height, 0]);
	
// define the axes	
var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");
	//.tickFormat(d3.time.format("%H"));

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");


// adds the svg canvas to the g-stacked-bar-chart div
var svg = d3.select(".g-stacked-bar-chart")
	.append("svg")
		//.attr("width", width + margin.left + margin.right)
		.attr("width", "100%")
		.attr("height", height + (margin.top * 3))
	.append("g")
		.attr("transform", 
			"translate(" + margin.left + "," + margin.top + ")");


// open d3.js bracket
// bind the data file 
d3.csv("data/ccps_data.csv", function (error, raw_data){
	raw_data_again = raw_data;
	redraw();

// **********************************************************************************
// ************************ BEGINNING OF THE SCHOOL LEVEL ***************************
// **********************************************************************************

/*	function reformat (array) {
		var locdata = [];
  		array.map(function (d){
			locdata.push({
 				properties: {
	                white: +d.white,
	                black: +d.black,
	                hispanic: +d.hispanic,
	                other: +d.other,
	                year: d.year,
	                school: d.school,
	                state_id: +d.state_id
      			}, 
           		geometry: {
               		coordinates:[+d.longitude, +d.latitude], 
             		type:"Point"
          		}
      		});
 		});
*/
	function reformat (array) {
		var locdata = [];
  		array.map(function (d){
			locdata.push({
				id: +d.state_id,
 				info: {
	                school: d.school,
	                lat: +d.latitude,
	                lon: +d.longitude
      			}
      		});
 		});
 		return locdata;	
 	}
 	
 	var geoData = reformat(raw_data)
 	console.log(geoData)


	// ---- FOR THE MAP ---- //

	// Set the map's boundaries  
	// SW 37.502194, -77.474207 (Blacksburg) ; NE 38.977587, -76.489984 (Trenton) ; C 38.527515, -76.971666 (La Plata)

	var southWest = new L.LatLng(37.2304,-80.429),
		northEast = new L.LatLng(40.217,-74.774),
		$bounds = new L.LatLngBounds(southWest, northEast);

	var $minZoom = 10,
		$maxZoom = 17;

	// build the map in the map-container div
	var $map = new L.Map("map-container", {
		center: new L.LatLng(38.527515, -76.971666),
		zoom: 10,
		minZoom: $minZoom,
		maxZoom: $maxZoom,
		maxBounds: $bounds,
		touchZoom: false,
		doubleClickZoom: false,
		tapTolerance: 30
	});

	var url='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var attrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var layer = new L.TileLayer(url, {minZoom: $minZoom, maxZoom: $maxZoom, attribution: attrib});		

	$map.addLayer(layer);

	// function to set position of hover box on map points
	function getPos(event) {
		posX = event.clientX;
		posY = event.clientY;
		$('#map-hover-box').css({
			'left': posX - ($('#map-hover-box').outerWidth(true) / 2),
			'top': posY + 40
		});
	}

	// function to show hover box on hover of map points
	function initHover() {
		$('#map-hover-box').show();
		$(document).bind('mousemove', getPos);
	}

	// function to hide hover box on hover of map points
	function endHover() {
		$('#map-hover-box').hide();
		$(document).unbind('mousemove', getPos);
	}

	// dummy dot and focuser to just create the variables
	dot = L.CircleMarker.extend({
		options: {
			id: ''
		}
	});

	focuser = new L.CircleMarker([0, 0], {
		stroke: true,
		color: '#000',
		weight: 4,
		opacity: 1,
		fillOpacity: '0',
		SVG: true,
		VML: true,
		radius: 12,
	}).addTo($map);

	$.each(geoData, function(i) {
		if (geoData[i].info) {
			$curr = new dot([geoData[i].info.lat, geoData[i].info.lon], {
				stroke: true,
				color: '#777',
				weight: 1,
				opacity: 1,
				fillColor: '#777',
				fillOpacity: '0.6',
				SVG: true,
				VML: true,
				radius: 5,
				id: i
			}).on('click', function() {
				$('.miss').removeClass('miss')
				$('#'+i).trigger('click');
			}).on('tap', function() {
				$('.miss').removeClass('miss')
				$('#'+i).trigger('click');
			}).on('mouseover', function(e) {
				initHover();
				$layer = e.target;
				$layer.setStyle({
					weight: 3,
					color: '#000'
				});
				$layer.bringToFront();
				$('#map-hover-box').text(geoData[i].info.school);
			}).on('mouseout', function(e) {
				var $layer = e.target;
				$layer.setStyle({
					weight: 1,
					color: '#777'
				});
				$layer.bringToBack();
				endHover();
			}).addTo($map);
		}
	});

});

function redraw() {
	// roll the raw data up by year and return the summarized value by race as its own object property
	var data = d3.nest()
		.key(function(d) {return d.short_year;})
		.sortKeys(d3.ascending)
		.rollup(function(d){
			return {
				white: d3.sum(d, function(g) {return g.white;}),
				black: d3.sum(d, function(g) {return g.black;}),
				other: d3.sum(d, function(g) {return g.other;}),
				hispanic: d3.sum(d, function(g) {return g.hispanic;})
			};
		})
		.entries(raw_data_again)
		.map(function (d) {
			return {year: d.key, white: d.values.white, black: d.values.black, other: d.values.other, hispanic: d.values.hispanic};
		});

	// assign color to each of the race by grabbing the first object in the data set
	color.domain(d3.keys(data[0]).filter(function(key) { return key !== "year"; }));

	// by year, get the sum and map each race to a block of color
	data.forEach(function(d) {
		var y0 = 0;
		var max = d.white + d.black + d.hispanic + d.other
		d.group = color.domain().map(function(name) { return {year: d.year, name: name, max: max, y0: y0, y1: y0 += +d[name]}; });
		d.total = d.group[d.group.length - 1].y1;
	});

	// set the x and y domain based on the year and total, respectively
	x.domain(data.map(function(d) { return d.year; }));
	y.domain([0, d3.max(data, function(d) { return d.total; })]);
	

	var group = svg.selectAll(".group")
		.data(data)
	.enter().append("g")
		.attr("class", "g")
		.attr("transform", function(d) { return "translate(" + x(d.year) + ",0)"; });

	// draw the chart on the svg using the d.group data set
	group.selectAll("rect")
		.data(function(d) { return d.group; })
	.enter().append("rect")
		.attr("width", x.rangeBand())
		.attr("y", function(d) { return y(d.y1); })
		.attr("height", function(d) { return y(d.y0) - y(d.y1); })
		.style("fill", function(d) { return color(d.name); })
		.attr("title", function (d) {
			var c = color(d.name);
			var tip = '<p class="tip3"> School Year: ' + d.year + '</p>'
				+ '<p class="tip3"> Student Body #: ' + d.max + '</p>'
				+ '<p class="tip3"> -------------------------- </p>'
				+ '<p class="tip3"> Race/Ethnicity: <span style="color:' + c + '"> ' + d.name + '</p>' 
				+ '<p class="tip1"> # of Students: <span style="color:' + c + '"> ' + d3.format(",")(d.value ? d.value: d.y1 - d.y0) + '</p>'
				+ '<p class="tip1"> % of Students: <span style="color:' + c + '"> ' + d3.format(".2%")(d.value ? d.value: (d.y1 - d.y0)/d.max) + '</p>'
				return tip;
			});
						

	if ($(document).width() < mobiledefaultwidth) {
		// draw the legend
    	// small screen, move the legend to the bottom and set it at start of x-axis
    	var svgwidth = $('.g-stacked-bar-chart').width();

		var legend = svg.selectAll(".legend")
			.data(color.domain().slice())
		.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) {return "translate(" + (svgwidth - 230) + "," + (height + (margin.bottom * 1.5)) + ")";});
			//.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    	
    	legend.append("rect")
			.attr("x", function(d, i) {return i * 37 + 25;})
			.attr("width", 8)
			.attr("height", 8)
			.style("fill", color);

		legend.append("text")
			.attr("x", function(d, i) {return i * 37 + 34;})
			.attr("y", 4)
			.attr("dy", ".35em")
			.style("text-anchor", "start")
			.text(function(d) { return d; });

		// draw the x-axis on the svg, rotate text to 45 degrees on mobile
		svg.append("g")
			.attr("class", "x axis")
			.attr("id", "xaxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)        
			.selectAll("text")
				.style("text-anchor", "start")
				.attr("dx", ".8em")
				.attr("dy", ".15em")
				.attr("transform", function(d) {
					return "rotate(45)" 
					});

		// draw the y-axis on the svg, text on the outside on y-axis at middle
		svg.append("g")
			.attr("class", "y axis")
			.attr("id", "yaxis")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", -50)
			.attr("dx","-20em")
			.attr("dy", ".71em")
			.style("text-anchor", "middle")
			.text("Student Population (#)");

		// define tooltips to work with the stacked bar chart (above)	
		$('svg rect').tipsy({
			opacity: 1, 
			gravity: $.fn.tipsy.autoBoundsCustom(175, 'w'), 
			html: true
		});
	}
	else {
		// draw the legend
		// regular screen, move the legend to the upper right of svg
		var legend = svg.selectAll(".legend")
			.data(color.domain().slice().reverse())
		.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
    	
    	legend.append("rect")
			.attr("x", width - 12)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", color);

		legend.append("text")
			.attr("x", width - 15)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
			.text(function(d) { return d; });

		// draw the x-axis on the svg, text is horizontal on regular screen
		svg.append("g")
			.attr("class", "x axis")
			.attr("id", "xaxis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)        
			.selectAll("text");

		// draw the y-axis on the svg, text on the inside of y-axis at top
		svg.append("g")
			.attr("class", "y axis")
			.attr("id", "yaxis")
			.call(yAxis)
		.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 3)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text("Student Population (#)");

		// define tooltips to work with the stacked bar chart (above)	
		$('svg rect').tipsy({
			opacity: 1, 
			gravity: $.fn.tipsy.autoBoundsCustom(300, 'w'), 
			html: true
		});
	}


// **********************************************************************************
// *************************** END OF THE COUNTY LEVEL ******************************
// **********************************************************************************


} // close the redraw function	