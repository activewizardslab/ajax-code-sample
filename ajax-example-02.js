function replace(str) {
    return str ? str.replace(/&/, '%26') : str
}

$(function() {
    // default chart
    var filtered = false;
    $("#AssetClass :contains('Equities (Stocks)')").attr("selected", "selected");
    $("#pageLinks :contains('Expense Ratio Ranges')").remove();
    get_data(filtered);

    $('#pageLinks').on('change', function() {
        window.location = $("#pageLinks :selected").data('link');
    });

    $('#Sponsor, #IndexProvider, #ListingRegion, #AssetClass').on('change', function() {
        filtered = true;
        get_data(filtered);
    });

    $('#clear_filters').on('click', function() {
        $("#Sponsor").val('View All');
        $("#IndexProvider").val('View All');
        $("#ListingRegion").val('View All');
        $("#AssetClass").val('View All');
        filtered = false;
        get_data(filtered);
    });

    $('.download').on('click', function() {
        this.href = [
            '/floating/download/',
            '?filtered=', filtered,
            '&sponsor=', replace($("#Sponsor :selected").text()),
            '&index_provider=', replace($("#IndexProvider :selected").text()),
            '&listing_region=', replace($("#ListingRegion :selected").text()),
            '&asset_class=', replace($("#AssetClass :selected").text())
        ].join('');
        return true;
    });

    $('.download_chart').on('click', function() {
        this.href = [
            '/floating/download_chart/',
            '?filtered=', filtered,
            '&sponsor=', replace($("#Sponsor :selected").text()),
            '&index_provider=', replace($("#IndexProvider :selected").text()),
            '&listing_region=', replace($("#ListingRegion :selected").text()),
            '&asset_class=', replace($("#AssetClass :selected").text())
        ].join('');
        return true;
    });

    $("#saveSVGasIMAGE").click(function() {
        saver('floating')
    });
});


function get_data(filtered) {
    $.ajax({
        url: "/floating/filter/",
        type: "GET",
        data: {
            filtered: filtered,
            sponsor: $("#Sponsor :selected").text(),
            index_provider: $("#IndexProvider :selected").text(),
            listing_region: $("#ListingRegion :selected").text(),
            asset_class: $("#AssetClass :selected").text()
        },
        success: function(data) {
            $("svg").remove();
            $('tbody').empty();
            $('.tooltip').remove();
            if (data.categories != 0) {
                render_floating_colunm_chart(data);
                     // create the table rows (table head is created in html)
                var tr = d3.select("tbody").selectAll("tr")
                    .data(data.table_data.slice(0,50)).enter().append("tr");
                    // create cells
                var td = tr.selectAll("td")
                    .data(function(d){return d3.values(d)})
                    .enter().append("td")
                    .text(function(d, i) { return i === 2 ? d ? Math.round(parseFloat(d)*100*1000)/1000 + '%' : '0.0%' : d })
            }
            else {
                $('#noDataModal').modal("show");
            }
        }
    });
}


function render_floating_colunm_chart(data) {
    var margin = {top: 10, right: 10, bottom: 350, left: 40},
        width = 1050 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .5);
    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(function(d) { return d + "%"; })
        .innerTickSize(-width)
        .outerTickSize(0);

    x.domain(data.categories);
    var max_val = d3.max(data.expense_ratios, function(d) { return +d.highest; });
    y.domain([0, max_val*1.1]);

    var svg = d3.select("#FloatingChart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xLabels = svg.append("g")
        .attr("class", "x_axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    xLabels.selectAll("text")
        .attr("transform", "translate(200,0)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font", "14px Arial")
        .attr("transform", function(d) { return "rotate(-80)"; });
    xLabels.selectAll('path, line')
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('shape-rendering', 'crispEdges');

    var yLabels = svg.append("g")
        .attr("class", "y_axis")
        .call(yAxis);
    yLabels.selectAll('path, line')
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('shape-rendering', 'crispEdges');
    yLabels.selectAll("text")
        .style("font", "14px Arial");


        // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    svg.selectAll(".rect")
        .data(data.expense_ratios)
        .enter().append("rect")
        .attr("class", "rect")
        .attr("x", function(d, i) { return x(data.categories[i]); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(+d.highest); })
        .attr("height", function(d) { return height - y(+d.highest - +d.lowest); })
        .attr("fill", 'red')
        .on("mousemove", function (d) {
            div.transition().duration(200).style("opacity", .9);
            div.html(
                "</strong>Category: " + d.category + "</br>" +
                "Max NER: " + d.highest + "%</br>" +
                "Min NER: " + d.lowest + "%</strong>"
                )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px");
        })
        .on("mouseout", function (d) {
            div.transition().duration(300).style("opacity", 0);
        });

    svg.selectAll("circle")
        .data(data.weighted_average)
        .enter().append("circle")
        .attr("cx", function(d, i) {
            return x(data.categories[i]) + x.rangeBand()*0.5; })
        .attr("cy", function(d) { return y(d); })
        .attr("r", 5)
        .on("mousemove", function (d, i) {
            div.transition().duration(200).style("opacity", .9);
            div.html(
                "</strong>Category: " + data.expense_ratios[i].category + "</br>" +
                "Asset Weighted NER: " + +d.toFixed(3) + "%</strong></br>"
                )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px");
            $(this).attr("r", 8);
        })
        .on("mouseout", function (d) {
            div.transition().duration(300).style("opacity", 0);
            $(this).attr("r", 5);
        });
}