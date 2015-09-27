function chart(data) {
    "use strict";

    console.log(data);
    
    var margin = {top:20, right:320, bottom:180, left:40},
        margin2 = {top:500 - margin.bottom + 40, right: 320, bottom:40, left: 40},
        margin3 = {top:20, right:10, bottom: 180, left:1000 - margin.right + 70},
        width = 1000 - margin.right - margin.left,
        width2 = 1000 - margin3.right - margin3.left,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var font_size=18;

    var yield_years = Object.keys(data[0]).filter(function(x) { return x != 'Date'; }),
        yield_line_list = [],
        selected = ['1','10'];

    var parseDate = d3.time.format("%Y/%m/%d").parse,
        dateFormat = d3.time.format('%b %d %a %Y'),
        bisectDate = d3.bisector(function(d) { return d.Date; }).left;

    data.forEach(function(d) {
        d.Date = parseDate(d.Date);
        yield_years.map(function(y) {
            d[y] = isNaN(d[y]) ? NaN : +d[y];
        });
    })

    function draw(selection) {
        
        // scales
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

        // axes
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

        var svg = selection
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
            data.map(function(d) {
                if (d['1'] !== '-') {
                    return d['1'];
                } else {
                    return 0;
                }}).concat(data.map(function(d) {
                    if (d['10'] !== '-') {
                        return d['10'];
                    } else {
                        return 0;
                    }})),
            function(d){ return d; }
        );
        console.log(yield_extent);
        var time_extent = d3.extent(
            data,
            function(d) { return d.Date; }
        );

        var year_extent = d3.extent(yield_years.map(function(x) { return parseInt(x); }), function(y) { return y});
        console.log(yield_years);
        console.log(year_extent);
        console.log(time_extent);
        console.log(time_extent[1]);

        //defining domain for scale
        yield_scale.domain(yield_extent);
        yield_scale_ref.domain(yield_extent);
        time_scale.domain(time_extent);
        time_scale2.domain(time_extent);
        year_scale.domain(year_extent);


        var focus = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top +")");

        var draw_layer = focus.append('g')
            .attr('class', 'draw_layer')

        var label_layer = focus.append('g')
            .attr('class', 'label_layer')

        var touch_layer = focus.append('g')
            .attr('class', 'touch_layer')
        

        var focus_list = yield_years.map(function(yld) { return draw_layer.append('g').attr('class', 'focusY' + yld).style('display', 'none'); });

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

        label_layer.append('path')
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

        var ref_line = d3.svg.line()
            .x(function(d) { return time_scale(d.Date)})
            .y(function(d) { return yield_scale_ref(d['10'])})
            .defined(function(d) { return !isNaN(d['10']); });

        var yield_line = d3.svg.line()
            .x(function(d) { return year_scale(d.year)})
            .y(function(d) { return yield_scale(d.yield)})
            .defined(function(d) { return !isNaN(d.yield); });

        var yield_color_scale = d3.scale.linear()
            .domain([0, yield_years.length - 1])
            .interpolate(d3.interpolateHsl)
            .range(['#ff25a4', '#11aaff']);

        
        context.append("path")
            .attr("d", ref_line(data))
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


        touch_layer.append("rect")
            .attr("class", "overlay")
            .attr("width", width + margin.left)
            .attr("height", height)
            .on("mouseover", function(){
                selected.map(function(yld) {
                    draw_layer.select('.focusY' + yld)
                        .style('display', null);
                })
            })
            .on("mouseout", function(){
                selected.map(function(yld) {
                    draw_layer.select('.focusY' + yld)
                        .style('display', 'none');
                });
                d3.select('.vline').classed('hidden', true);
                d3.select('.tooltip').classed('hidden', true);
            })
            .on("mousemove", mousemove);

        var create_tooltip = function() {

            var tooltip_width = 90,
                font_size = 20;
            var tooltip = label_layer.append('g')
                .attr('class', 'tooltip')
                .attr('x', 0)
                .attr('y', 0);

            tooltip.append('rect')
                .attr('x', - tooltip_width - 15)
                .attr('y', 10)
                .attr('width', tooltip_width)
                .attr('height', 220)
                .attr('fill', '#fff')
                .attr('opacity', .7)

            tooltip.selectAll('text')
                .data(yield_years)
                .enter()
                .append('text')
                .text(function(d) { return d + 'Y'; })
                .attr('class', 'yield')
                .attr('font-size', font_size)
                .attr('fill', function(d) { return yield_color_scale(yield_years.indexOf(d)); })
                .attr('x', -tooltip_width - 10)
                .attr('y', function(d,i) { return i * font_size + 60; });

            tooltip.append('text')
                .attr('class', 'date')
                .attr('font-size', font_size)
                .attr('x', -tooltip_width - 10)
                .attr('y', function() { return yield_years.length * font_size + 60; });
        }

        create_tooltip();

        var dashboard = touch_layer.append('g')
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
                    

                    d3.select(this).attr("fill", yield_color_scale(i));
                    selected = yield_years.filter(function(yld) { return d3.select('.line.Y' + yld)[0][0] != null || yld == d; });
                    
                    update_yield_scale(selected);
                } else {
                    var focus_p = focus_list[yield_years.indexOf(d)];
                    focus_p.select('circle').remove();
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
            var new_max =  d3.max(selected.map(function(yld) {
                return data.map(function(d) {
                    if (isNaN(d[yld])) {
                        return 0;
                    } else {
                        return d[yld];
                    }
                }) }).reduce(function(x,y) { return x.concat(y); }, []));

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
                .x(function(d) { return time_scale(d.Date); })
                .y(function(d) { return yield_scale(d[yld]); })
                .defined(function(d) { return !isNaN(d[yld]); });

            // put line function into yield_line_list
            yield_line_list[yield_years.indexOf(yld)] = hist_line;
            
            // draw line
            draw_layer.append('path')
                .attr('stroke', stroke)
                .attr('opacity', .8)
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
                i1 = d3.min([bisectDate(data, x0, 1), data.length - 1]);

            var i = x0 - data[i1-1]['Date'] > data[i1]['Date'] - x0 ? i1 : i1 - 1,
                d = data[i],
                parsed_date = d.Date;
            console.log(data[i1]);
            console.log(data[i1-1]);
            draw_vline(time_scale(parsed_date));

            selected.map(function(yld) {
                if (!isNaN(d[yld])) {
                    draw_layer.select('.focusY' + yld)
                        .attr('transform', 'translate(' + time_scale(parsed_date) + ',' + yield_scale(d[yld]) + ')');
                }

            });


            var yld = yield_years.map(function(y) { return {'year': y, 'yield': d[y]}; });
            
            d3.select(".line.yield_curve")
                .attr("stroke", "#8966ef")
                .transition()
                .duration(500)
                .attr("d", yield_line(yld));

            d3.select('.tooltip')
                .classed('hidden', false)
                .attr('transform', function() {
                    var cur_x = pos[0];
                    if (cur_x > 140) {
                        return 'translate(' + cur_x + ',' + 0 + ')';
                    } else {
                        return 'translate(' + (cur_x + 110) + ',' + 0 + ')';
                    }
                })
                .selectAll('text.yield')
                .text(function(yld) {
                    var fmt = d3.format('2d');
                    var yld_text = isNaN(d[yld]) ? '-' : d3.round(d[yld],3)
                    return fmt(parseInt(yld)) + 'Y: ' + yld_text;
                });
            d3.select('.tooltip')
                .select('text.date')
                .text(dateFormat(d.Date));
        }


        function brushed() {        
            time_scale.domain(brush.empty() ? time_scale2.domain() : brush.extent());

            // update yield_scale for all existing yield line
            yield_years.map(function(y, index) {
                if (d3.select('.line.Y' + y)[0][0] != null) {
                    draw_layer.select('.line.Y' + y).attr('d', yield_line_list[index](data))
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

        };

    }

    return draw;
}
