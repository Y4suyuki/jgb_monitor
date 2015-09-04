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
        bisectDate = d3.bisector(function(d) { return parseDate(d.Date); }).left;

    var yield_scale = d3.scale.linear()
        .range([height-10, margin.top]);

    var yield_scale_ref = d3.scale.linear()
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
        data.map(function(d) { return d['1']}).concat(data.map(function(d) { return d['10']})),
        function(d){ return d; }
    );

    var time_extent = d3.extent(
        data,
        function(d) { return parseDate(d.Date); }
    );
    
    yield_scale.domain(yield_extent);
    yield_scale_ref.domain(yield_extent);
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
        .attr("transform", "translate(0, " + (height + 10) + ")")
        .call(time_axis);

    focus.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ", 0)")
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
    var hist_line_y10 = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.Date))})
        .y(function(d) { return yield_scale(d['10'])});

    var hist_line_y1 = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.Date))})
        .y(function(d) { return yield_scale(d['1'])});

    var ref_line_y10 = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.Date))})
        .y(function(d) { return yield_scale_ref(d['10'])});

    var yield_line = d3.svg.line()
        .x(function(d) { return year_scale(d.year)})
        .y(function(d) { return yield_scale(d.yield)});
    
    focus.append("path")
        .attr("d", hist_line_y10(data))
        .attr("clip-path", "url(#clip)")
        .attr("class", "line ten");

    focus.append("path")
        .attr("d", hist_line_y1(data))
        .attr("clip-path", "url(#clip)")
        .attr("class", "line one");

    context.append("path")
        .attr("d", ref_line_y10(data))
        .attr("class", "line ten ref");

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

    var focusY1 = focus.append("g")
        .attr("class", "focusY1")
        .style("display", "none");

    var focusY10 = focus.append("g")
        .attr("class", "focusY10")
        .style("display", "none")


    focusY1.append("circle")
        .attr("r", 4.5)
        .attr("stroke-width", 2)
        .attr("class", "ten");

    focusY10.append("circle")
        .attr("r", 4.5)
        .attr("stroke-width", 2)
        .attr("class", "one");

    

    focus.append("rect")
        .attr("class", "overlay")
        .attr("width", width + margin.left)
        .attr("height", height)
        .on("mouseover", function(){ 
            focusY1.style("display", null);
            focusY10.style("display", null);
        })
        .on("mouseout", function(){ 
            focusY1.style("display", "none");
            focusY10.style("display", "none");
            d3.select(".tooltip").classed("hidden", true);
        })
        .on("mousemove", mousemove);

    function mousemove() {
        var x0 = time_scale.invert(d3.mouse(this)[0]),
            i10 = bisectDate(data, x0, 1),
            i1 = bisectDate(data, x0, 1),
            i5 = bisectDate(data, x0, 1);
        console.log(i10);
        var i = x0 - data[i1]['Date'] > x0 - data[i1 - 1]['Date'] ? i1 : i1 - 1,
            d = data[i];

        focusY1.attr("transform", "translate(" + time_scale(parseDate(d.Date)) + "," + yield_scale(d['10']) + ")");
        focusY10.attr("transform", "translate(" + time_scale(parseDate(d.Date)) + "," + yield_scale(d['1']) + ")");
        var yld = [{"year":10, "yield":d['10']},
                   {"year": 9, "yield":d['9']},
                   {"year": 8, "yield":d['8']},
                   {"year": 7, "yield":d['7']},
                   {"year": 6, "yield":d['6']},
                   {"year": 5, "yield":d['5']},
                   {"year": 4, "yield":d['4']},
                   {"year": 3, "yield":d['3']},
                   {"year": 2, "yield":d['2']},
                   {"year": 1, "yield":d['1']}];
        d3.select(".line.yield_curve")
            .transition()
            .duration(1000)
            .attr("d", yield_line(yld))
            .attr("stroke", "#8966ef");
        
        var xPos = parseFloat(time_scale(parseDate(d.Date))) + 10;
        var yPos = parseFloat(yield_scale(d['10'])) - 60;
        d3.select(".tooltip")
            .style("left", xPos + "px")
            .style("top", yPos + "px")
            .select("#value")
            .text(d['10']);
        d3.select(".tooltip")
            .select("#date")
            .text(d.Date);

        d3.select(".tooltip").classed("hidden", false);
    }

    function brushed() {
        time_scale.domain(brush.empty() ? time_scale2.domain() : brush.extent());
        console.log(time_scale.range());
        focus.select(".line.ten").attr("d", hist_line_y10(data));
        focus.select(".line.one").attr("d", hist_line_y1(data));
        focus.select(".x.axis.focus").call(time_axis); 
    }
}
