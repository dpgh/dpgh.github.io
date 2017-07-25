function scatterPlot(container) {
    var self = this;
    var zoom = d3.zoom()
    .scaleExtent([1, 40]);

    var margin = { top: 50, right: 40, bottom: 60, left: 40 };
    var options = {
        "tipoVisualizzazione": 0,
        "raggruppaFail": false,
        "tooltip": true,
        "selezione": null,
        "filtroAnno": null,
        "allowPanZoom": true,
        "log": false
    }

    this.setOptions = function (opt) {
        for (k in opt) {
            options[k] = opt[k];
        }
    };

    this.resetZoom = function () {
        d3.select(container).select("svg").call(zoom.transform, d3.zoomIdentity);
    };

    function getData(callback) {
        d3.csv("docs/movies.csv", function (data) {
            
            data = data.filter(function (d) {
                return +d.revenue>0 && +d.vote_count > 0;
            });

            if (options.tipoVisualizzazione > 0) {
                data = data.filter(function (d) {
                    switch (options.tipoVisualizzazione) {
                        case 1:
                            confronto = d["genres_id"].split(" ").map(function (n) { return n; });
                            break;
                        case 2:
                            confronto = d["directors_id"].split(" ").map(function (n) { return n; });
                            break;
                        case 3:
                            confronto = d["writers_id"].split(" ").map(function (n) { return n; });
                            break;
                        case 4:
                            confronto = d["companies_id"].split(" ").map(function (n) { return n; });
                            break;
                        case 5:
                            confronto = d["countries_id"].split(" ").map(function (n) { return n; });
                            break;
                    }
                    return confronto.indexOf(options.selezione) > -1;

                });
            }

            if (options.raggruppaFail) {
                data.forEach(function (item, index) {
                    if (item.binary == "FAIL") {
                        item.test = "fail";
                    }
                });
            }


            data = data.filter(function (d) {
                if (options.filtroAnno == null) {
                    return d.year != "";
                } else {
                    return d.year != "" && +d.year >= options.filtroAnno[0] && +d.year <= options.filtroAnno[1];
                }
            });

            callback(data);
        });
    }

    this.start = function () {
    var width = 960;
    var height = 480;
    d3.select(container).selectAll("svg").remove();

        var svg = d3.select(container).append("svg").attr("width", "100%").attr("preserveAspectRatio", "xMinYMin slice").attr("viewBox", "0 0 " + width + " " + height)
        .call(zoom.on("zoom", function () {
            if (options.allowPanZoom) {
                svg.attr("transform", d3.event.transform);
                
                d3.selectAll(".dot").attr("r", 3.5/d3.event.transform.k)
            }
        }))
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        width = width - margin.left - margin.right;
        height = height - margin.top - margin.bottom

        var xValue = function (d) { return d.revenue; }; // data -> value
        if (options.log) {
            xScale = d3.scaleLog().range([0, width]);// value -> display
        } else {

            xScale = d3.scaleLinear().range([0, width]);// value -> display
        }
            xMap = function (d) {
                return xScale(xValue(d));
            }, // data -> display
        xAxis = d3.axisBottom(xScale);

        var yValue = function (d) { return d.vote_average; }, // data -> value
            yScale = d3.scaleLinear().range([height, 0]), // value -> display
            yMap = function (d) { return yScale(yValue(d)); }, // data -> display
        yAxis = d3.axisLeft(yScale);


        var cValue = function (d) { return d.test; };

        var color = d3.scaleOrdinal();
        if (options.raggruppaFail) {
            color
            .domain(["pass", "fail"])
            .range(["#2CA02C", "#D62728"]);
        } else {
            color
            .domain(["pass", "men", "notalk", "nowomen"])
            .range(["#2CA02C", "#1F77B4", "#FF7F0E", "#D62728"]);
        }

        function callback(data) {

            data.forEach(function (d) {
                d.revenue = +d.revenue;
                d.vote_average = +d.vote_average;
            });

            xScale.domain([Math.max(d3.min(data, xValue) - 1, 1), d3.max(data, xValue) + 1]);
            yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

            // asse X
            var hAxis =  svg.append("g")
                  .attr("class", "xaxis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis.ticks(20, "s"));
            hAxis.selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

            hAxis.append("text")
                .attr("class", "label")
                .attr("x", width)
                .attr("y", -6)
                .style("text-anchor", "end")
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "start")
                .text("Incassi");


            // asse Y
            svg.append("g")
                .attr("class", "yaxis")
                .call(yAxis)
              .append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("x", 0)
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .text("Voto");

            // disegna i punti
            svg.selectAll(".dot")
                .data(data)
              .enter().append("circle")
                .attr("class", "dot")
                .attr("r", 3.5)
                .attr("cx", xMap)
                .attr("cy", yMap)
                .style("fill", function (d) {
                    return color(cValue(d));
                })
            .on("mouseover", function (d) {
                $(this).attr("class", "dot highlight");
                $(this).off("click");
                $(this).on("click", function () {
                    window.open(getUrl(d));
                });
                if (options.tooltip) {
                    var div = d3.select("#tooltip");
                    div.style("display", "");
                    div.html(formatTooltip(d));
                    div.transition()
                        .duration(200)
                        .style("opacity", 1);
                    var x = d3.event.pageX;
                    var y = d3.event.pageY;
                    var tooltipWidth = document.getElementById("tooltip").clientWidth;
                    var tooltipHeight = document.getElementById("tooltip").clientHeight;
                    var maxWidth = $(window).width();
                    var maxHeight = $(window).height();
                    x = Math.min(Math.max(20, x - tooltipWidth - 28), maxWidth - tooltipWidth - 20);
                    y = Math.min(Math.max(20, y - tooltipHeight - 28), maxHeight - tooltipHeight - 20);
                    div
                        .style("left", (x) + "px")
                        .style("top", (y) + "px");
                }
            })
        .on("mouseout", function (d) {
            $(this).attr("class", "dot");
            var div = d3.select("#tooltip");
            div.transition()
                .duration(500)
            .style("opacity", 0);
            div.style("display", "none")
        })

            // legenda
            var legend = svg.selectAll(".legend")
                .data(color.domain())
              .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", color);

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) { return d; })

        }

        getData(callback);
    }

    function formatTooltip(item) {
        var s = "";
        s += "<table>";
        s += "<tr><th>Titolo&nbsp;&nbsp;</th><td>" + item.title + "</td></tr>";
        s += "<tr><th>Anno&nbsp;&nbsp;</th><td>" + item.year + "</td></tr>";
        s += "<tr><th>Lingua&nbsp;&nbsp;</th><td>" + item.original_language + "</td></tr>";
        s += "<tr><th>Voto&nbsp;&nbsp;</th><td>" + item.vote_average + "/10</td></tr>";
        s += "<tr><th>Budget&nbsp;&nbsp;</th><td>" + formatCurrency(item.budget) + " $</td></tr>";
        s += "<tr><th>Incassi&nbsp;&nbsp;</th><td>" + formatCurrency(item.revenue) + " $</td></tr>";
        s += "<tr><th>Durata&nbsp;&nbsp;</th><td>" + item.runtime + " '</td></tr>";
        s += "</table>";
        return s;
    }

    function formatCurrency(value) {
        value = value.toString().split("").reverse().join("");
        var newValue = '';
        for (var i = 0; i < value.length; i++) {
            if (i % 3 == 0 && i!=0) {
                newValue += '.';
            }
            newValue += value[i];
        }
        return newValue.split("").reverse().join("");
    }

}
