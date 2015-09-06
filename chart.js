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

    var yield_years = Object.keys(data[0]).filter(function(x) { return x != 'Date'; }),
        yield_line_list = [],
        selected = ['1','10'];

    var font_size=18;
    

    console.log(yield_years);

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

    var yield_axis = d3.svg.axis()
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

    var focus_list = yield_years.map(function(yld) { return focus.append('g').attr('class', 'focusY' + yld).style('display', 'none'); });

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
        .call(yield_axis);

    context.append("g")
        .attr("class", "x axis context")
        .attr("transform", "translate(0, " + height2 + ")")
        .call(time_axis2)

    yield_curve.append("g")
        .attr("class", "x axis yield_curve")
        .attr("transform", "translate(0, " + height + ")")
        .call(year_axis);

    focus.append('path')
        .datum({x:0, y:0}, {x:0, y: height})
        .attr('class', 'vline')
        .attr('stroke', '#000');

    function draw_vline(pos) {
        var line = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
        d3.select('path.vline')
            .datum([{x: pos, y:0}, {x: pos, y: height}])
            .attr('d', line)
            .classed('hidden', false);
    }
    //for line
    var hist_line_y10 = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.Date))})
        .y(function(d) { return yield_scale(d['10'])});

    var ref_line_y10 = d3.svg.line()
        .x(function(d) { return time_scale(parseDate(d.Date))})
        .y(function(d) { return yield_scale_ref(d['10'])});

    var yield_line = d3.svg.line()
        .x(function(d) { return year_scale(d.year)})
        .y(function(d) { return yield_scale(d.yield)});

    var yield_color_scale = d3.scale.linear()
        .domain([0, yield_years.length - 1])
        .interpolate(d3.interpolateHsl)
        .range(['#ff1493', '#0099ff']);

    
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


    focus.append("rect")
        .attr("class", "overlay")
        .attr("width", width + margin.left)
        .attr("height", height)
        .on("mouseover", function(){
            selected.map(function(yld) {
                focus.select('.focusY' + yld)
                    .style('display', null);
            })
        })
        .on("mouseout", function(){
            selected.map(function(yld) {
                focus.select('.focusY' + yld)
                    .style('display', 'none');
            });

            d3.select('.vline').classed('hidden', true);
        })
        .on("mousemove", mousemove);

    var dashboard = focus.append('g')
        .attr('class', 'dashboard')
        .attr('transform', 'translate(' + (width - 265) + ',' + 10 + ')');

    var square_size = 15;
    console.log(selected);
    dashboard.selectAll('g')
        .data(yield_years)
        .enter()
        .append('g')
        .attr('class', 'component')
        .transition()
        .duration(1000)
        .attr('transform', function(d,i) {
            return 'translate('+ (i * (square_size + 5)) + "," + 0 + ")";
        })
        .each('end', function(d) {
            if (selected.indexOf(d) >= 0) {
                draw_init_hist_yield(d);
            } 
        });


    dashboard.selectAll('.component')
        .append('rect')
        .attr('height', square_size)
        .attr('width', square_size)
        .attr('stroke-width', 2)
        .attr('stroke', function(d,i) { return yield_color_scale(i); })
        .attr("class", function(d) { return "clickable Y" + d; })
        .attr("fill", '#fff')
        .on("click", function(d,i) {
            if (d3.select(".line.Y" + d)[0][0] == null) {
                draw_hist_yield(d, yield_color_scale(i));
                var focus_p = focus_list[yield_years.indexOf(d)];
                focus_p.append('circle')
                    .attr('r', 4.5)
                    .attr('stroke-width', 2)
                    .attr('stroke', yield_color_scale(i))
                    .attr('fill', 'none')
                    .attr('class', 'Y' + d);

                focus_p.append('text')
                    .attr('class', 'Y' + d)
                    .attr('stroke', yield_color_scale(i))
                    .attr('fill', yield_color_scale(i))
                    .attr('font-size', font_size);
                

                d3.select(this).attr("fill", yield_color_scale(i));
                selected = yield_years.filter(function(yld) { return d3.select('.line.Y' + yld)[0][0] != null || yld == d; });
                
                update_yield_scale(selected);
            } else {
                var focus_p = focus_list[yield_years.indexOf(d)];
                focus_p.select('circle').remove();
                focus_p.select('text').remove()
                d3.select('.line.Y' + d).remove();
                d3.select(this).attr('fill', '#fff');
                selected = yield_years.filter(function(yld) { return d3.select('.line.Y' + yld)[0][0] != null && yld != d; });

                update_yield_scale(selected);
            }

        });

    dashboard.selectAll('.component')
        .append('text')
        .text(function(d) { return d + 'Y'; })
        .attr('stroke', function(d,i) { return yield_color_scale(i); })
        .attr('fill', function(d,i) { return yield_color_scale(i); })
        .attr('transform', 'translate(' + 5 + ',' + 0 + ') rotate(' + -45 + ')')


    function update_yield_scale(selected) {
        var new_max =  d3.max(selected.map(function(yld) { return data.map(function(d) { return d[yld]; }) }).reduce(function(x,y) { return x.concat(y); }, []));

        if (new_max != yield_extent[1]) {
            yield_extent[1] = new_max;
            console.log('update yield scale!');
            yield_scale.domain(yield_extent);
            // update yield axis
            focus.select('.y.axis')
                .transition()
                .duration(750)
                .call(yield_axis);

            // update selected yield data
            selected.map(function(yld) {
                d3.select('.line.Y' + yld)
                    .transition()
                    .duration(750)
                    .attr('d', yield_line_list[yield_years.indexOf(yld)](data));
            });
        }
    };
    
    // string, string -> draw chart 
    function draw_hist_yield(yld, stroke) {
        
        // line function
        var hist_line = d3.svg.line()
            .x(function(d) { return time_scale(parseDate(d.Date)); })
            .y(function(d) { return yield_scale(d[yld]); });

        // put line function into yield_line_list
        yield_line_list[yield_years.indexOf(yld)] = hist_line;
        
        // draw line
        focus.append('path')
            .attr('stroke', stroke)        
            .transition()
            .duration(1000)
            .attrTween('d', getInterpolation)
            .attr('clip-path', 'url(#clip)')
            .attr('class', 'line hist Y' + yld);

        // helper function for draw line
        function getInterpolation() {
            // Reference
            // http://big-elephants.com/2014-06/unrolling-line-charts-d3js/
            var interpolate = d3.scale.quantile()
                .domain([0,1])
                .range(d3.range(1, data.length + 1));

            return function(t) {
                return hist_line(data.slice(0, interpolate(t)));
            };
        };

    }
    
    function mousemove() {
        var pos = d3.mouse(this),
            x0 = time_scale.invert(pos[0]),
            i1 = bisectDate(data, x0, 1);

        var i = x0 - data[i1]['Date'] > x0 - data[i1 - 1]['Date'] ? i1 : i1 - 1,
            d = data[i],
            parsed_date = parseDate(d.Date);

        draw_vline(time_scale(parsed_date));

        selected.map(function(yld) {
            focus.select('.focusY' + yld)
                .attr('transform', 'translate(' + time_scale(parsed_date) + ',' + yield_scale(d[yld]) + ')');
            focus.select('text.Y' + yld).text(d[yld]);
        });


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
            .attr("stroke", "#8966ef")
            .transition()
            .duration(1000)
            .attr("d", yield_line(yld));
    }

    function getInterpolation() {
        // Reference
        // http://big-elephants.com/2014-06/unrolling-line-charts-d3js/
        var interpolate = d3.scale.quantile()
            .domain([0,1])
            .range(d3.range(1, data.length + 1));

        return function(t) {
            return hist_line_y10(data.slice(0, interpolate(t)));
        }
    }

    function brushed() {        
        time_scale.domain(brush.empty() ? time_scale2.domain() : brush.extent());

        // update yield_scale for all existing yield line
        yield_years.map(function(y, index) {
            if (d3.select('.line.Y' + y)[0][0] != null) {
                focus.select('.line.Y' + y).attr('d', yield_line_list[index](data))
            }
        });
        focus.select(".x.axis.focus").call(time_axis);
    }

    // initial historical yield line
    function draw_init_hist_yield(yld) {

        var color = yield_color_scale(yield_years.indexOf(yld)),
            focus_p = d3.select('.focusY' + yld);
        draw_hist_yield(yld, color);
        d3.select('.clickable.Y' + yld).attr('fill', color);
        
        focus_p.append('circle')
            .attr('r', 4.5)
            .attr('stroke-width', 2)
            .attr('stroke', color)
            .attr('fill', 'none')
            .attr('class', 'Y' + yld);

        focus_p.append('text')
            .attr('class', 'Y' + yld)
            .attr('stroke', yield_color_scale(yield_years.indexOf(yld)))
            .attr('fill', yield_color_scale(yield_years.indexOf(yld)))
            .attr('font-size', font_size);
    };
}
