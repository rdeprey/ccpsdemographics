// ---- FOR THE GRAPH ---- //

// set the frame and margin for the svg
var margin = {top: 25, right: 50, bottom: 25, left: 50},
	width = 960 - margin.left - margin.right,
	height = 480 - margin.top - margin.bottom;
	
// colors for the chart and map
var c = ["#98abc5", "#8a89a6", "#a05d56", "#ff8c00"]
	
// set the color scale
var color = d3.scale.ordinal()
    .range(c);

// set the ranges
var x = d3.scale.ordinal()
    .rangeRoundBands([0, (width - (margin.right))], .15);
					
var y = d3.scale.linear()
	.rangeRound([height, 0]);
	
// define the axes	
var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

// adds the svg canvas
var svg = d3.select(".g-stacked-bar-chart")
	.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", 
			"translate(" + margin.left + "," + margin.top + ")");

// get the data
d3.csv("data/ccps_summary_by_year.csv", function (error, data){
/* d3.csv("data/ccps_data.csv", function (error, raw_data){

	var data = d3.nest()
		.key(function(d) {return d.year;})
		.sortKeys(d3.ascending)
		.rollup(function(d){
			return {
				white: d3.sum(d, function(g) {return g.white;}),
				black: d3.sum(d, function(g) {return g.black;}),
				hispanic: d3.sum(d, function(g) {return g.hispanic;}),
				other: d3.sum(d, function(g) {return g.other;})
			};
		})
		.entries(raw_data);

	console.log(data)	
		*/
		
	color.domain(d3.keys(data[0]).filter(function(key) { return key !== "year"; }));
	//color.domain(data.map(function(d) {return d;}));

	data.forEach(function(d) {
		var y0 = 0;
		d.group = color.domain().map(function(name) { return {year: d.year, name: name, y0: y0, y1: y0 += +d[name]}; });
		d.total = d.group[d.group.length - 1].y1;
	});

	x.domain(data.map(function(d) { return d.year; }));
	y.domain([0, d3.max(data, function(d) { return d.total; })]);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
	.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 3)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Student Population (#)");

	var group = svg.selectAll(".group")
		.data(data)
	.enter().append("g")
		.attr("class", "g")
		.attr("transform", function(d) { return "translate(" + x(d.year) + ",0)"; });

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
				+ '<p class="tip3"> Race/Ethnicity: <span style="color:' + c + '"> ' + d.name + '</p>' 
				+ '<p class="tip1"> # of Students: <span style="color:' + c + '"> ' + d3.format(",")(d.value ? d.value: d.y1 - d.y0); + '</p>'
				+ '<p class="tip3"> Test: ' + function(v) { return y(v.y1); }; + '</p>'
				return tip;
			});
						
	// define tooltips to work with the stacked bar chart (above)
	
	$('svg rect').tipsy({
		opacity: 1, 
		gravity: 'w', 
		html: true
	});

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
});


// ---- FOR THE MAP ---- //

// Set the map's boundaries  
// SW 37.502194, -77.474207 (Richmond) 
// NE 38.977587, -76.489984 (Annapolis)
// C 38.527515, -76.971666 (La Plata)

var southWest = new L.LatLng(37.50, -77.47),
	northEast = new L.LatLng(38.97, -76.49),
	$bounds = new L.LatLngBounds(southWest, northEast);

var $minZoom = 10,
	$maxZoom = 17;

// build the map in the map div
var $map = new L.Map("map", {
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



/*
function getPos(event) {
	posX = event.clientX;
	posY = event.clientY;
	$('#map-hover-box').css({
		'left': posX - ($('#map-hover-box').outerWidth(true) / 2),
		'top': posY + 40
	});
}

function initHover() {
	$('#map-hover-box').show();
	$(document).bind('mousemove', getPos);
}

function endHover() {
	$('#map-hover-box').hide();
	$(document).unbind('mousemove', getPos);
}


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

function getCat(array) {
	if (array.yr1213) {
		seg = [0,false]
		total = array.yr1213.w+array.yr1213.b+array.yr1213.h+array.yr1213.o
		comparison = [array.yr1213.w,array.yr1213.b,array.yr1213.h,array.yr1213.o]
			$.each(comparison, function(i) {
				if (comparison[i]/total > 0.85) {
					seg[0] = i
					seg[1] = true
				}
			});
		if (seg[1] === true) {
			c = ['#62B360','#648097','#D36D6E','#A067A8']
			return c[seg[0]]

		} else {
			return '#ccc'
		}
	}
}
order = 0
$.each(schools, function(i) {

	if (schools[i].info) {
		$curr = new dot([schools[i].info.lat, schools[i].info.lon], {
			stroke: true,
			color: getCat(schools[i]),
			weight: 1,
			opacity: 1,
			fillColor: getCat(schools[i]),
			fillOpacity: '0.6',
			SVG: true,
			VML: true,
			radius: 5,
			id: i
		}).on('click', function() {
			$('#srcbox').val('')
			$('.miss').removeClass('miss')
			$('#'+i).trigger('click');
		}).on('tap', function() {
			$('#srcbox').val('')
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
			$('#hover-box').text(schools[i].info.name);
		}).on('mouseout', function(e) {
			var $layer = e.target;
			$layer.setStyle({
				weight: 1,
				color: '#aaa'
			});
			$layer.bringToBack();
			endHover();
		}).addTo($map);
		
		$('#school-list > ul').append('<li class="listing" data-order="'+order+'" id="'+i+'"><h3 class="rob heavier">'+schools[i].info.name+'</h3></li>')
		order++
	}
});
*/
