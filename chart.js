function draw(data) {
    "use strict";
    console.log(data);
    
    var margin = {top:20, right:320, bottom:180, left:40},
        margin2 = {top:500 - margin.bottom + 40, right: 320, bottom:40, left: 40},
        margin3 = {top:20, right:10, bottom: 180, left:1000 - margin.right + 70},
        width = 1000 - margin.right - margin.left,
        width2 = 1000 - margin3.right - margin3.left,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var parseDate = d3.time.format("%Y/%m/%d").parse,
        bisectDate = d3.bisector(function(d) { return parseDate(d.date); }).left;

    var yield_scale = d3.scale.linear()
        .range([height, margin.top]);

    var yield_scale2 = d3.scale.linear()
        .range([height2, 0])

    var time_scale = d3.time.scale()
        .range([margin.left, width + margin.left]);

    var time_scale2 = d3.time.scale()
        .range([margin.left, width + margin.left]);

    var year_scale = d3.scale.linear()
        .range([0, width2]);

    var time_axis = d3.svg.axis().orient("bottom")
        .scale(time_scale);

    var time_axis2 = d3.svg.axis().orient("bottom")
        .scale(time_scale2);

    var yeild_axis = d3.svg.axis()
        .scale(yield_scale)
        .orient("left");

    var year_axis = d3.svg.axis()
        .scale(year_scale)
        .orient("bottom");

    var brush = d3.svg.brush()
        .x(time_scale2)
        .on("brush", brushed);

    var svg = d3.select(".myChart")
        .append("svg")
        .attr("width", width+margin.right+margin.left)
        .attr("height", height+margin.top+margin.bottom);
    
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("width", width)
        .attr("height", height);


    var yield_extent = d3.extent(
        data['1'].concat(data['10']),
        function(d){ return d.yield; }
    );

    var time_extent = d3.extent(
        data['1'],
        function(d) { return parseDate(d.date); }
    );
    
    yield_scale.domain(yield_extent);
    yield_scale2.domain(yield_extent);
    time_scale.domain(time_extent);
    time_scale2.domain(time_extent);
    year_scale.domain([1, 10]);


    var focus = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top +")");

    var context = svg.append("g")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var yield_curve = svg.append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");
    // call axes
    focus.append("g")
        .attr("class", "x axis focus")
        .attr("transform", "translate(0, " + height + ")")
        .call(time_axis);

    focus.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (margin.left-5) + ", 0)")
        .call(yeild_axis);

    context.append("g")
        .attr("class", "x axis context")
        .attr("transform", "translate(0, " + height2 + ")")
        .call(time_axis2)

    yield_curve.append("g")
        .attr("class", "x axis yield_curve")
        .attr("transform", "translate(0, " + height + ")")
        .call(year_axis);

    //for line
    var line = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.date))})
        .y(function(d) { return yield_scale(d.yield)});

    var line2 = d3.svg.line()
        .x(function(d) { return time_scale2(parseDate(d.date))})
        .y(function(d) { return yield_scale2(d.yield)});

    var yield_line = d3.svg.line()
        .x(function(d) { return year_scale(d.year)})
        .y(function(d) { return yield_scale(d.yield)});
    
    focus.append("path")
        .attr("d", line(data['10']))
        .attr("clip-path", "url(#clip)")
        .attr("class", "line ten");

    focus.append("path")
        .attr("d", line(data['1']))
        .attr("clip-path", "url(#clip)")
        .attr("class", "line one");

    context.append("path")
        .attr("d", line2(data['10']))
        .attr("class", "line ten");

    yield_curve.append("path")
        .attr("class", "line yield_curve");


    // add label for axes
    d3.select(".y.axis")
        .append("text")
        .text("Yield(%)")
        .attr("transform", "rotate (90, " + (-margin.left + 6) + ",0)")
        .attr("x", 30)
        .attr("y", 0);

    d3.select(".x.axis.context")
        .append("text")
        .text("Date")
        .attr("x", function(){ return (width/1.6) - margin.left})
        .attr("y", 40);

    d3.select(".x.axis.yield_curve")
        .append("text")
        .text("Year")
        .attr("x", function(){ return (width2/2)})
        .attr("y", 40);

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    var focus2 = focus.append("g")
        .attr("class", "focus2")
        .style("display", "none");

    var focus1 = focus.append("g")
        .attr("class", "focus1")
        .style("display", "none")


    focus2.append("circle")
        .attr("r", 4.5)
        .attr("stroke-width", 2)
        .attr("class", "ten");

    focus1.append("circle")
        .attr("r", 4.5)
        .attr("stroke-width", 2)
        .attr("class", "one");

    

    focus.append("rect")
        .attr("class", "overlay")
        .attr("width", width + margin.left)
        .attr("height", height)
        .on("mouseover", function(){ 
            focus2.style("display", null);
            focus1.style("display", null);
        })
        .on("mouseout", function(){ 
            focus2.style("display", "none");
            focus1.style("display", "none");
            d3.select(".tooltip").classed("hidden", true);
        })
        .on("mousemove", mousemove);

    function mousemove() {
        var x0 = time_scale.invert(d3.mouse(this)[0]),
            i10 = bisectDate(data['10'], x0, 1),
            i1 = bisectDate(data['1'], x0, 1),
            i5 = bisectDate(data['5'], x0, 1),
            
            d10_0 = data['10'][i10-1],
            d10_1 = data['10'][i10],
            d1_0 = data['1'][i1 - 1],
            d1_1 = data['1'][i1],
            d9_0 = data['9'][i1 - 1],
            d9_1 = data['9'][i1],
            d8_0 = data['8'][i1 - 1],
            d8_1 = data['8'][i1],
            d7_0 = data['7'][i1 - 1],
            d7_1 = data['7'][i1],
            d6_0 = data['6'][i1],
            d6_1 = data['6'][i1 - 1],
            d5_0 = data['5'][i5 - 1],
            d5_1 = data['5'][i5],
            d4_0 = data['4'][i1],
            d4_1 = data['4'][i1 - 1],
            d3_0 = data['3'][i1 - 1],
            d3_1 = data['3'][i1],
            d2_0 = data['2'][i1 - 1],
            d2_1 = data['2'][i1],
            d10 = x0 - d10_0.date > d10_1.date - x0 ? d10_1 : d10_0,
            d1 = x0 - d1_0.date > d1_1.date - x0 ? d1_1 : d1_0,
            d3y = x0 - d3_0.date > d3_1.date - x0 ? d3_1 : d3_0,
            d2 = x0 - d2_0.date > d2_1.date - x0 ? d2_1 : d2_0,
            d4 = x0 - d4_0.date > d4_1.date - x0 ? d4_1 : d4_0,
            d5 = x0 - d5_0.date > d5_1.date - x0 ? d5_1 : d5_0,
            d6 = x0 - d6_0.date > d6_1.date - x0 ? d6_1 : d6_0,
            d7 = x0 - d7_0.date > d7_1.date - x0 ? d7_1 : d7_0,
            d8 = x0 - d8_0.date > d8_1.date - x0 ? d8_1 : d8_0,
            d9 = x0 - d9_0.date > d9_1.date - x0 ? d9_1 : d9_0;

        console.log(d1);
        focus2.attr("transform", "translate(" + time_scale(parseDate(d10.date)) + "," + yield_scale(d10.yield) + ")");
        focus1.attr("transform", "translate(" + time_scale(parseDate(d1.date)) + "," + yield_scale(d1.yield) + ")");

        console.log(d10);
        var yld = [{"year":10, "yield":d10.yield},
                   {"year": 9, "yield":d9.yield},
                   {"year": 8, "yield":d8.yield},
                   {"year": 7, "yield":d7.yield},
                   {"year": 6, "yield":d6.yield},
                   {"year": 5, "yield":d5.yield},
                   {"year": 4, "yield":d4.yield},
                   {"year": 3, "yield":d3y.yield},
                   {"year": 2, "yield":d2.yield},
                   {"year": 1, "yield":d1.yield}];
        d3.select(".line.yield_curve")
            .transition()
            .duration(1000)
            .attr("d", yield_line(yld))
            .attr("stroke", "#8966ef");
        
        var xPos = parseFloat(time_scale(parseDate(d10.date))) + 10;
        var yPos = parseFloat(yield_scale(d10.yield)) - 60;
        d3.select(".tooltip")
            .style("left", xPos + "px")
            .style("top", yPos + "px")
            .select("#value")
            .text(d10.yield);
        d3.select(".tooltip")
            .select("#date")
            .text(d10.date);

        d3.select(".tooltip").classed("hidden", false);
    }

    function brushed() {
        time_scale.domain(brush.empty() ? time_scale2.domain() : brush.extent());
        console.log(time_scale.range());
        focus.select(".line.ten").attr("d", line(data['10']));
        focus.select(".line.one").attr("d", line(data['1']));
        focus.select(".x.axis.focus").call(time_axis); 
    }
}
