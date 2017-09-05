var smart_vs_traditional_beta_level2 = null;
var smart_vs_traditional_beta = 'View All';

function replace(str) {
    return str ? str.replace(/&/, '%26') : str
}

$(function() {
    $("#pageLinks :contains('Listings by Region')").remove();

    $('#pageLinks').on('change', function() {
        window.location = $("#pageLinks :selected").data('link');
    });

    $('#SmartvsTraditionalBeta a:not([data-toggle="dropdown"])').on('click', function() {
        var first_level = $(this).data('first-level');
        var second_level = $(this).data('second-level');
        var filter = $(this).data('second-level') ? ' ' + String.fromCharCode(8594) + ' ' + this.text: '';
        $('#SmartvsTraditionalBeta button').html('<div align="right" style="white-space:nowrap;"><div class="table-dropdown">' +
            first_level + filter + '</div>' + ' <span class="caret"></span></div>');
        smart_vs_traditional_beta = first_level;
        smart_vs_traditional_beta_level2 = second_level;
        load_data();
    });

    $('.download').on('click', function() {
        this.href = [
            '/region/download',
            '?sponsor=', replace($("#Sponsor :selected").text()),
            '&indexProvider=', replace($("#IndexProvider :selected").text()),
            '&assetClass=', replace($("#AssetClass :selected").text()),
            '&smart_vs_traditional_beta=', replace(smart_vs_traditional_beta),
            '&smart_vs_traditional_beta_level2=', replace(smart_vs_traditional_beta_level2),
            '&listing_region=', replace($("#ListingRegion :selected").text()),
            '&listing_country=', replace(get_country_ISO_by_name($("#ListingCountry :selected").text())),
            '&cross_and_share=', $("#region_cross_and_share").is(':checked')
        ].join('');
        return true;
    });

    $('.download_chart').on('click', function() {
         this.href = [
             '/region/download_chart',
             '?sponsor=', replace($("#Sponsor :selected").text()),
             '&indexProvider=', replace($("#IndexProvider :selected").text()),
             '&assetClass=', replace($("#AssetClass :selected").text()),
             '&smart_vs_traditional_beta=', replace(smart_vs_traditional_beta),
             '&smart_vs_traditional_beta_level2=', replace(smart_vs_traditional_beta_level2),
             '&listing_region=', replace($("#ListingRegion :selected").text()),
             '&listing_country=', replace(get_country_ISO_by_name($("#ListingCountry :selected").text())),
             '&cross_and_share=', "true"//$("#region_cross_and_share").is(':checked')
        ].join('');
        return true;
    });

    $('#Sponsor, #IndexProvider, #AssetClass, #ListingRegion, #ListingCountry').on('change', function() {
        load_data();
    });

    $('#clear_filters').on('click', function() {
        //$("#Sponsor :contains('View All')").attr("selected", "selected");
        $("#Sponsor").val('View All');
        $("#IndexProvider").val('View All');
        $("#AssetClass").val('View All');
        $("#smartvsTraditionalBetaBTN").html('<div align="right" style="white-space:nowrap;"><div style="float:left;">' +
            'View All</div><span class="caret"></span></div>');
        smart_vs_traditional_beta_level2 = null;
        smart_vs_traditional_beta = 'View All';
        $("#ListingRegion").val('View All');
        $("#ListingCountry").val('View All');
        $("#region_cross_and_share").prop('checked', false);
        //reset_dropdown(true);
        load_data();
    });

    // two level filter
    /*$('#AssetClass').on("change", function() {
        reset_dropdown();
    });*/
    update_dropdown_selections();

    // load table with default filters
    load_data();

    $("#saveSVGasIMAGE").click(function() {
        saver('region');
    });

    $("#region_cross_and_share").change(function() {
        //console.log($("#region_cross_and_share").is(':checked'));
        load_data();
    });

});

var timerID;
var current_country = {};
var country_loaded = false;
var not_zero_counties = {};
var listings_requests = [];

function reset_dropdown(flag) {
    $.ajax({
        url: '/region/update_smart_list/',
        type: 'GET',
        data: {
           assetClass: $("#AssetClass :selected").text()
        },
        success: function (data) {
            $('.dropdown-menu.main').html('<li><a tabindex="0" data-first-level="View All">View All</a></li>');
            var SvsTBs = Object.keys(data.container).sort(); // all values of SmartvsTraditionalBeta
            for (var i in SvsTBs) {
                var vals = data.container[SvsTBs[i]].sort();
                if (vals.length == 1 && vals[0] == SvsTBs[i]) {
                    $('.dropdown-menu.main').append('<li><a tabindex="0" data-first-level="' + SvsTBs[i] + '" data-second-level="All">' + SvsTBs[i] + '</a></li>')
                } else {
                    $('.dropdown-menu.main').append('<li class="dropdown-submenu"><a tabindex="0" data-toggle="dropdown">'
                        + SvsTBs[i] + '</a><ul class="dropdown-menu" id="dropdown-second-level-' + i + '"></ul></li>');
                    if (vals.length != 1) {
                        $('#dropdown-second-level-' + i).append('<li><a tabindex="0" data-first-level="' + SvsTBs[i] +
                            '" data-second-level="All">All ' + SvsTBs[i] + '</a></li>');
                    }
                    for (var j in vals) {
                        $('#dropdown-second-level-' + i).append('<li><a tabindex="0" data-first-level="' + SvsTBs[i] +
                            '" data-second-level="' + vals[j] + '">' + vals[j] + '</a></li>');
                    }
                }
            }
            if ($.inArray(smart_vs_traditional_beta_level2, data.container[smart_vs_traditional_beta]) != -1 || flag) {
                update_dropdown_selections();
            } else {
                $('#noDataModalText').html(
                    "No data for this selection. </br> Available Smart vs Traditional Beta (both levels) for the selected Asset Class are displayed now"
                );
                $('#noDataModal').modal("show");
                $("#smartvsTraditionalBetaBTN").html('<div align="right" style="white-space:nowrap;"><div style="float:left;">' +
                    'View All</div><span class="caret"></span></div>');
                smart_vs_traditional_beta_level2 = null;
                smart_vs_traditional_beta = 'View All';
                update_dropdown_selections();
            }
        }
    })
}

function update_dropdown_selections(){
    $('.dropdown-submenu > a').submenupicker();
    $('.dropdown a:not([data-toggle="dropdown"])').on('click', function() {
        var first_level = $(this).data('first-level');
        var second_level = $(this).data('second-level');
        var filter = $(this).data('second-level') ? ' [' + this.text + '] ': '';
        $('.dropdown button').html('<div align="right" style="white-space:nowrap;"><div class="smartvstrad-chart-1">' +
            first_level + filter + '</div>' + ' <span class="caret"></span></div>');
        // filter by asset class
        smart_vs_traditional_beta_level2 = second_level;
        smart_vs_traditional_beta = first_level;
        load_data();
    });
}

function get_country_ISO_by_name(name) {
    for (var i in isoCountries) {
        if (name == 'View All') return name;
        if (isoCountries[i].cname == name) return isoCountries[i].ccode;
    }
}

function get_country_name_by_ISO(iso) {
    for (var i in isoCountries) {
        if (isoCountries[i].ccode == iso) return isoCountries[i].cname;
    }
}

function load_data() {
    $.ajax({
        url: '/region/filter/',
        type: 'GET',
        data: {
            sponsor: $("#Sponsor :selected").text(),
            indexProvider: $("#IndexProvider :selected").text(),
            assetClass: $("#AssetClass :selected").text(),
            smart_vs_traditional_beta: smart_vs_traditional_beta,
            smart_vs_traditional_beta_level2: smart_vs_traditional_beta_level2,
            listing_region: $("#ListingRegion :selected").text(),
            listing_country: get_country_ISO_by_name($("#ListingCountry :selected").text()),
            cross_and_share: $("#region_cross_and_share").is(':checked')
        },
        success: function(data) {
            if (data.filtered_data != 0) {
                // fill the table using d3
                // create rows
                $("svg").remove();
                $('tbody').empty();
                var tr = d3.select('tbody').selectAll('tr')
                    .data(data.filtered_data).enter()
                    .append('tr');
                // create cells
                var td = tr.selectAll('td')
                    .data(function(d) {
                        d[6] = d[6].toLocaleString('en-US');
                        if (d[9]) {
                            d[9] = d[9].toLocaleString('en-US');
                        }
                        return d3.values(d);
                    })
                    .enter().append('td')
                    .text(function(d) {return d});

                not_zero_counties = data.not_zero_counties;
                $('#RegionMap').empty();
                d3.select('#map_legend').empty();
                var map = render_map(data.filtered_data, data.top_10_countries);
                d3.select(window).on('resize', function() {
                    map.resize();
                });
                map_for_saving();
            } else {
                //$('#noDataModalText').html("No data for this selection");
                $('#noDataModal').modal("show");
            }

        }
    });
}

function load_data_at_click(country) {
    $.ajax({
        url: '/region/filter/',
        type: 'GET',
        data: {
            sponsor: $("#Sponsor :selected").text(),
            indexProvider: $("#IndexProvider :selected").text(),
            assetClass: $("#AssetClass :selected").text(),
            smart_vs_traditional_beta: smart_vs_traditional_beta,
            smart_vs_traditional_beta_level2: smart_vs_traditional_beta_level2,
            listing_region: 'View All',
            listing_country: country,
            cross_and_share: $("#region_cross_and_share").is(':checked')
        },
        success: function(data) {
            if (data.filtered_data != 0) {
                var country_name = get_country_name_by_ISO(data.country);
                $("#ListingRegion :contains('View All')").attr("selected", "selected");
                $("#ListingCountry :contains('" + country_name + "')").attr("selected", "selected");

                $('tbody').empty();
                $("svg").remove();
                var tr = d3.select('tbody').selectAll('tr')
                    .data(data.filtered_data).enter()
                    .append('tr');
                var td = tr.selectAll('td')
                    .data(function(d) {
                        d[6] = d[6].toLocaleString('en-US');
                        if (d[9]) {
                            d[9] = d[9].toLocaleString('en-US');
                        }
                        return d3.values(d);
                    })
                    .enter().append('td')
                    .text(function(d) {return d});

                not_zero_counties = data.not_zero_counties;
                $('#RegionMap').empty();
                d3.select('#map_legend').empty();
                var map = render_map(data.filtered_data, data.top_10_countries);
                d3.select(window).on('resize', function() {
                    map.resize();
                });
                map_for_saving();
            } else {
                //$('#noDataModalText').html("No data for this selection");
                $('#noDataModal').modal("show");
            }

        }
    });
}

function render_map(table_data, legend_data) {
    //console.log(table_data.map(function(d) {return parseFloat(d[9].replace(",", ".")); }).reduce(function(a,b) {return a+b; }, 0));
    // Add legend
    var width = $("#map_container").width();
    var legendColorBox = {width: 20, height: 20},
        legendTextBox = {width: 260, height: 100};

    var svg = d3.select('#map_legend').append("svg")
        .attr("viewBox", "0 0 " + width + " " + 300)
        .append('g');

    var legendElement = svg.selectAll(".legend")
        .data(legend_data).enter().append("g").attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(" + (i%4)*(legendColorBox.width+legendTextBox.width+12) +
                                      "," + Math.floor(i/4)*(legendTextBox.height+10) + ")";
        });
    legendElement.append("rect").attr("width", legendColorBox.width).attr("height", legendColorBox.height).style("fill", '#FF8C00');

    var rectText = legendElement.append("g");
    rectText.append('text')
        .attr('x', function(d,i) { return i < 9 ? 6 : 2; })
        .attr('y', legendColorBox.height - 4)
        .attr('fill', 'white').attr('font-weight', 'bold').attr('font-size', '14px')
        .text(function(d,i) { return i+1; });

    var legendText = legendElement.append("g").attr("transform", "translate(" + legendColorBox.width + ",0)");
    legendText.append('text').attr('x', 5).attr('y', 15).attr('fill', 'darkblue').attr('font-weight', 'bold').attr('font-size', '14px')
        .text(function(d) {return d.CountryName });
    legendText.append('text').attr('x', 5).attr('y', 38)
        .text(function(d) {return d.PrimaryListingAssets ? 'Primary Listing Assets: ' + d.PrimaryListingAssets.toLocaleString('en-US') : '' });
    legendText.append('text').attr('x', 5).attr('y', 58)
        .text(function(d) {return d.PrimaryListing ? 'Primary Listings: ' + d.PrimaryListing : ''});
    legendText.append('text').attr('x', 5).attr('y', 78)
        .text(function(d) {return d.TotalListings ? 'Total Listings: ' + d.TotalListings : ''});

    var map = new Datamap({
        element: document.getElementById('RegionMap'),
        projection: 'mercator',
        responsive: true,
        fills: {
            'NotZero': '#afe16c',
            defaultFill: '#F8F8F8'
        },
        data: not_zero_counties,
        geographyConfig: {
            borderWidth: 1,
            borderColor: '#000000',
            highlightFillColor: '#088A29',
            highlightBorderColor: '#000000',

            popupTemplate: function(geo) {
                if (current_country.id != geo.id) {
                    // hover on a country
                    current_country.id = geo.id;
                    clearTimeout(timerID);
                    timerID = setTimeout(function() {
                        if (!country_loaded) {
                            get_country_info(geo.id);
                            country_loaded = true;
                        }
                    }, 200);
                }
                // check if data loaded from db
                var counrty_info = 'PrimaryListing' in current_country ? [
                    '<p>Primary Listing Assets ($M): ' + current_country.PrimaryListingAssets.toLocaleString('en-US') + '</p>',
                    '<p>Primary Listings: ' + current_country.PrimaryListing + '</p>',
                    '<p>Total Listings: ' + current_country.TotalListings + '</p>'
                ].join('') : '';

                return ['<div class="hoverinfo"><strong><p>Country:', geo.properties.name,
                    '</p>', counrty_info, '</strong></div>'].join('');
            }
        },
        done: function(datamap) {
            datamap.svg.selectAll('.datamaps-subunit').on('mouseleave', function(geo) {
                // clear info
                clearTimeout(timerID);
                current_country = {};
                country_loaded = false;
                for (var i=0; i < listings_requests.length; i++) {listings_requests[i].abort();}
                listings_requests = [];
            });
            // get data when user click on country
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geo) {
                load_data_at_click(geo.id);

                if (!country_loaded) {
                    get_country_info(geo.id);
                    country_loaded = true;
                }
            });
        }
    });
    return map;
}

function get_country_info(country) {
    listings_requests.push($.ajax({
        url: '/region/listings/',
        type: 'GET',
        data: {
            sponsor: $("#Sponsor :selected").text(),
            indexProvider: $("#IndexProvider :selected").text(),
            assetClass: $("#AssetClass :selected").text(),
            smart_vs_traditional_beta: smart_vs_traditional_beta,
            smart_vs_traditional_beta_level2: smart_vs_traditional_beta_level2,
            listing_region: $("#ListingRegion :selected").text(),
            listing_country: get_country_ISO_by_name($("#ListingCountry :selected").text()),
            country: country,
            cross_and_share: "true"//$("#region_cross_and_share").is(':checked')
        },

        success: function(data) {
            if (!data.PrimaryListingAssets) data.PrimaryListingAssets = 0;
            current_country = data;
            current_country.id = country;
            var popup = $('.hoverinfo strong');

            popup.append('<p>Primary Listing Assets ($M): ' +
                current_country.PrimaryListingAssets.toLocaleString('en-US') + '</p>');
            popup.append('<p>Primary Listings: ' +
                current_country.PrimaryListing + '</p>');
            popup.append('<p>Total Listings: ' +
                current_country.TotalListings + '</p>');
        }
    }));
}

function map_for_saving() {
    $.ajax({
        url: '/region/save/',
        type: 'GET',
        data: {
            sponsor: $("#Sponsor :selected").text(),
            indexProvider: $("#IndexProvider :selected").text(),
            assetClass: $("#AssetClass :selected").text(),
            smart_vs_traditional_beta: smart_vs_traditional_beta,
            smart_vs_traditional_beta_level2: smart_vs_traditional_beta_level2,
            listing_region: $("#ListingRegion :selected").text(),
            listing_country: get_country_ISO_by_name($("#ListingCountry :selected").text()),
            cross_and_share: "true"//$("#region_cross_and_share").is(':checked')
        },
        success: function(data) {
            var top10_countries = data.saving_data.map(function(d) { return d.CountryCodeAlpha3 });
            data.saving_data.push({'CountryName': 'Not TOP 10 countries'});
            data.saving_data.push({'CountryName': 'Other countries'});

            m.draw(data.saving_data, top10_countries, data.nonzero_countries);
        }
    });
}

    // Firefox 1.0+
var isFirefox = typeof InstallTrigger !== 'undefined';

var Map = function() {
    var fill_colors = ['#800000', '#FF0000', '#800080', '#FF00FF', '#008000',
                       '#00FF00', '#FF8C00', '#FFFF00', '#0000FF', '#00FFFF'];
    var legendColorBox = {width: 20, height: 20},
        legendTextBox = {width: 260, height: 100};
    var self = this;
    /* Sets selector of block where map would be placed */
	this.selector = function(s) {
		self._selector = s;
		return self;
	};
    /* Draws the map */
    this.draw = function (legend_data, top10_countries, nonzero_countries) {
        var width = parseInt($('#savingSVG_region').css('width')),
            height = parseInt($('#savingSVG_region').css('height')) - 300;
        var main_height = height + 300;
        var projection = d3.geo.equirectangular()
            .translate([width / 2, height / 2])
            .scale((width + 1) / ( 2 * Math.PI));
        var path = d3.geo.path().projection(projection);

        self.svg = d3.select(self._selector).append("svg");
            // Mozilla Firefox doesn't work with viewBox
        if (isFirefox) {
            //console.log('mozilla');
            self.svg.attr("width", width)
                .attr("height", main_height)
        } else {
            self.svg.attr("viewBox", "0 0 " + width + " " + main_height)
        }
        self.svg.attr("preserveAspectRatio", "xMinYMin");
        self.svg.selectAll('path').remove();
        self.svg.selectAll(".country-shape")
            .data(topojson.feature(worldJson, worldJson.objects.countries).features)
            .enter().append("path")
            .style('fill', function(d) {
                var pos = $.inArray(d.id, top10_countries);
                if ($.inArray(d.id, nonzero_countries) != -1) {
                    return '#afe16c'
                } else if (pos != -1) {
                    return fill_colors[pos]
                } else {
                    return '#D3D3D3'
                }
            })
            .style('stroke', 'black')
            .style('stroke-width', 1)
            .attr("class", function (d) {
                return "country-shape " + d.id;
            })
            .attr("d", path);
        var legend_shift = height - 100;
        var legend = self.svg.append('g').attr("transform", "translate(0, " + legend_shift + ")");
        var legendElement = legend.selectAll(".legend")
            .data(legend_data).enter().append("g").attr("class", "legend")
            .attr("transform", function(d, i) {
                return "translate(" + (i%4)*(legendColorBox.width+legendTextBox.width+12) +
                                      "," + Math.floor(i/4)*(legendTextBox.height+10) + ")";
            });
        legendElement.append("rect").attr("width", legendColorBox.width).attr("height", legendColorBox.height)
            .style("fill", function (d, i) {
                return d.CountryName == 'Not TOP 10 countries' ? '#afe16c' :
                       d.CountryName == 'Other countries' ? '#D3D3D3' : fill_colors[i]
            });
        var legendText = legendElement.append("g").attr("transform", "translate(" + legendColorBox.width + ",0)");
        legendText.append('text').attr('x', 5).attr('y', 15).attr('fill', 'red').attr('font-weight', 'bold').attr('font-size', '16px')
            .text(function(d) {return d.CountryName });
        legendText.append('text').attr('x', 5).attr('y', 38).attr('font-weight', 'bold')
            .text(function(d) {return d.PrimaryListingAssets ? 'Primary Listing Assets: ' + d.PrimaryListingAssets.toLocaleString('en-US') : '' });
        legendText.append('text').attr('x', 5).attr('y', 58).attr('font-weight', 'bold')
            .text(function(d) {return d.PrimaryListing ? 'Primary Listings: ' + d.PrimaryListing : ''});
        legendText.append('text').attr('x', 5).attr('y', 78).attr('font-weight', 'bold')
            .text(function(d) {return d.TotalListings ? 'Total Listings: ' + d.TotalListings : ''});
    }
};
var m = new Map().selector('#savingSVG_region');