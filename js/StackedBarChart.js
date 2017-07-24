function stackedBarChart(container) {
    var self = this;
    var zoom = d3.zoom()
    .scaleExtent([1, 40]);
    var cont = container;
    var options = {
        "tipoVisualizzazione": 0,
        "percentuale" : false,
        "raggruppaFail" : false,
        "raggruppaAnno" : false,
        "tooltip" : true,
        "affianca" : false,
        "selezione": ["", ""],
        "filtroAnno": null,
        "allowPanZoom": true
    }

    this.setOptions = function(opt) {
        for (k in opt) {
            options[k] = opt[k];
        }
    };

    this.resetZoom = function () {
        d3.select(container).select("svg").call(zoom.transform, d3.zoomIdentity);
    };

    var margin = { top: 50, right: 20, bottom: 60, left: 40 };
    var keysArray = ["pass", "men", "notalk", "nowomen", "fail", "pass2", "men2", "notalk2", "nowomen2", "fail2"];

    function getData(callback) {

        d3.csv("docs/movies.csv", function (data) {
            //rimuove i film senza l'anno
            data = data.filter(function (d) {
                if (options.filtroAnno == null) {
                    return d.year != "";
                } else {
                    return d.year != "" && +d.year >= options.filtroAnno[0] && +d.year <= options.filtroAnno[1];
                }
            });
            self.data = data;

            if (options.raggruppaFail) {
                data.forEach(function (item, index) {
                    if (item.binary == "FAIL") {
                        item.test = "fail";
                    }
                });
            }
            if (options.raggruppaAnno > 1) {
                var annoMax = d3.max(data, function (d) { return +d.year; });
                var annoMin = d3.min(data, function (d) { return +d.year; });

                var fasce = [];

                for (var i = annoMin; i <= annoMax; i += options.raggruppaAnno) {
                    var k = i + options.raggruppaAnno - 1;
                    fasce.push({ "inizio": i, "fine": k });
                }

                data.forEach(function (item, index) {
                    var anno = +item.year;
                    var fascia = null;
                    var i = 0;
                    var trovato = false;
                    while (i < fasce.length && !trovato) {
                        if (anno >= fasce[i].inizio && anno <= fasce[i].fine) {
                            trovato = true;
                            fascia = fasce[i];
                        }
                        i++;
                    }
                    item.originalYear = item.year;
                    item.year = fascia;
                });
            }


            //definisce due insiemi di dati per le due visualizzazioni.
            //se si sta visualizzando tutto data2 sarà vuoto
            var data1, data2;
            //raggruppa per anno
            data1 = d3.nest()
            .key(function (d) {
                if (options.raggruppaAnno > 1) {
                    return d.year.inizio + " - " + d.year.fine;
                } else {
                    return d.year;
                }
            })
                .rollup(function (d) {
                    var v = {};
                    d.forEach(function (item, index) {
                        if (typeof v[item.test] == "undefined") {
                            v[item.test] = 1;
                        } else {
                            v[item.test] += 1;
                        }
                    });
                    return v;
                })
            .entries(
            data.filter(function (d) {
                //filtra in base al tipo di visualizzazione
                if (options.tipoVisualizzazione == 0) {
                    return true;
                } else {
                    var confronto;
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
                    return confronto.indexOf(options.selezione[0]) > -1;
                }
            }));


            //raggruppa per anno
            data2 = d3.nest()
            .key(function (d) {
                if (options.raggruppaAnno > 1) {
                    return d.year.inizio + " - " + d.year.fine;
                } else {
                    return d.year;
                }
            })
                .rollup(function (d) {
                    var v = {};
                    d.forEach(function (item, index) {
                        if (typeof v[item.test] == "undefined") {
                            v[item.test] = 1;
                        } else {
                            v[item.test] += 1;
                        }
                    });
                    return v;
                })
            .entries(
            data.filter(function (d) {
                if (options.tipoVisualizzazione == 0) {
                    return false;
                } else {
                    if (options.selezione[0] == options.selezione[1]) {
                        return false;
                    }
                    var confronto;
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
                    return confronto.indexOf(options.selezione[1]) > -1;
                }
            }));


            // ordina sull'asse X per anno
            data1.sort(function (a, b) {

                if (options.raggruppaAnno > 1) {
                    return a.key.split(" - ")[0] - b.key.split(" - ")[0];
                } else {
                    return a.key - b.key;
                }
            });
            data2.sort(function (a, b) {
                if (options.raggruppaAnno > 1) {
                    return a.key.split(" - ")[0] - b.key.split(" - ")[0];
                } else {
                    return a.key - b.key;
                }
            });


            var dataTemp = [];

            //fa merge dei due insiemi di dati. Valori negativi corrispondono al grafico ribaltato
            if (data1.length == 0) {
                dataTemp = data2;
            } else if (data2.length == 0) {
                dataTemp = data1;
            } else {
                var i = 0;
                var k = 0;
                while (i < data1.length && k < data2.length) {
                    var key1 = data1[i].key;
                    var key2 = data2[k].key;
                    var item1 = data1[i].value;
                    var item2 = data2[k].value;
                    if (key1 == key2) {
                         //merge e avanza entrambi
                        var temp = {};
                        for (var key in item1) {
                            temp[key] = +item1[key];
                        }
                        for (var key in item2) {
                            temp[key + "2"] = - (+item2[key]);
                        }
                        dataTemp.push({ "key": key1, "value": temp });
                        i++;
                        k++;
                    } else if (key1 < key2) {
                        // aggiunge solo da data1
                        dataTemp.push(data1[i]);
                        i++;
                    } else if (key2 < key1) {
                        // aggiunge solo da data2
                        var temp = {};
                        for (var key in item2) {
                            temp[key + "2"] = -(+item2[key]);
                        }
                        dataTemp.push({ "key": key2, "value": temp });
                        k++;
                    }
                }
                while (i < data1.length) {
                    dataTemp.push(data1[i]);
                    i++;
                }
                while (k < data2.length) {
                    var item2 = data2[k].value;
                    var temp = {};
                    for (var key in item2) {
                        temp[key + "2"] = -(+item2[key]);
                    }
                    dataTemp.push({ "key": data2[k].key, "value": temp });
                    k++;
                }
            }

            data = dataTemp;

            //calcola il totale per ogni anno
            data.forEach(function (item, index) {
                var tPos = 0;
                var tNeg = 0;
                for (var key in item.value) {
                    if (key.charAt(key.length - 1) == "2") {
                        tNeg += item.value[key];
                    } else {
                        tPos += item.value[key];
                    }
                }
                item.total = tPos;
                item.total2 = tNeg;
            });

            //cambia i valori numerici in caso di visualizzazione percentuale
            if (options.percentuale) {
                data.forEach(function (item, index) {
                    for (var key in item.value) {
                        if (key.charAt(key.length - 1) == "2") {
                            var num = item.value[key] * 100 / item.total2;
                            item.value[key] = Math.round(-num * 100) / 100;
                        } else {
                        var num = item.value[key] * 100 / item.total;
                        item.value[key] = Math.round(num * 100) / 100;
                        }
                    }
                    if (item.total != 0) {
                        item.originalTotal = item.total;
                        item.total = 100;
                    }
                    if (item.total2 != 0) {
                        item.originalTotal2 = item.total2;
                        item.total2 = -100;
                    }
                });
            }

            callback(data);
        });
    }

    this.start = function () {
        var width = 960;
        var height = 460;

        d3.select(container).selectAll("svg").remove();
        var svg = d3.select(container).append("svg").attr("width", "100%").attr("preserveAspectRatio", "xMinYMin slice").attr("viewBox", "0 0 " + width + " " + height).call(zoom.on("zoom", function () {
            if (options.allowPanZoom) {
                svg.attr("transform", d3.event.transform);
            }
        }))
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
         width = width - margin.left - margin.right;
         height = height - margin.top - margin.bottom

        self.width = width;
        self.height = height;

        var updateFunction = this.update;
        getData(updateFunction);
    };

    this.update = function (data) {
        if (typeof data == "undefined") {
            getData(callback);
        } else {
            callback(data);
        }

        function callback(data) {

            data.forEach(function (item, index) {
                for (i in keysArray) {
                    if (typeof item.value[keysArray[i]] == "undefined") {
                        item[keysArray[i]] = 0;
                    } else {
                        item[keysArray[i]] = item.value[keysArray[i]];
                    }
                }
                delete item.value;
            });
            // crea lo stack
            var stack = [];
            var keysAffianca = {};
            if (options.affianca) {
                if (options.raggruppaFail) {
                    keysAffianca = { "pass": 0, "fail": 1, "men": 2, "notalk": 3, "nowomen": 4, "pass2": 0, "fail2": 1, "men2": 2, "notalk2": 3, "nowomen2": 4, "length": 2 };
                } else {
                    keysAffianca = { "pass": 0, "men": 1, "notalk": 2, "nowomen": 3, "fail": 4, "pass2": 0, "men2": 1, "notalk2": 2, "nowomen2": 3, "fail2": 4, "length": 5 };
                }
                for (var k in keysAffianca) {
                    if (k != "length") {
                        stack = stack.concat(d3.stack().keys([k])(data));
                    }
                }
            } else {
                var stackA = d3.stack().keys(["pass", "men", "notalk", "nowomen", "fail"])(data);
                var stackB = d3.stack().keys(["pass2", "men2", "notalk2", "nowomen2", "fail2"])(data);
                 stack = stackA.concat(stackB);
            }

            var years;
            years = data.map(function (item) { return item.key; });
            var x = d3.scaleBand()
                .domain(years)
                .rangeRound([0, self.width * 0.95])
                .padding(0.12);

            //calcola i valori massimi e minimi della coordinata y per definire il dominio della scala
            var yMax = d3.max(stack, function (y) { return d3.max(y, function (d) { return d[1]; }); });
            var yMin = d3.min(stack, function (y) { return d3.min(y, function (d) { return d[1]; }); });

            var y = d3.scaleLinear()
                .domain([yMin, yMax])
                .range([self.height, 0]);

            var color = d3.scaleOrdinal()
                .domain(keysArray)
                .range(["#82e0aa", "#58d68d", "#2ecc71", "#28b463", "#28b463", "#f7dc6f", "#f4d03f", "#f1c40f", "#d4ac0d", "#d4ac0d"]);

            var g = d3.select("svg g");
            var series = g.selectAll(".series")
              .data(stack, function (d) {
                  return d.key;
              });
            series.exit().remove();
            series = series.enter().append("g")
              .attr("id", function (d, i) {
                  return keysArray[i];
              })
                .attr("class", "series")
              .attr("fill", function (d, i) {
                  return color(keysArray[i]);
              })
            .merge(series);

            var rect = series.selectAll("rect")
              .data(function (d) {
                  return d;
              });
            rect.enter().append("rect")
              .attr("y", self.height)
              .attr("x", function (d, i) {
                  return x(d.data.key)
              })
              .attr("height", 0)
              .attr("width", 0)
                .on("mouseover", function (d) {
                    $(this).attr("class", "highlight");
                    $(this).off("click");
                    $(this).on("click", function () {
                        window.open(getUrl(d));
                    });
                    if (options.tooltip) {
                        var div = d3.select("#tooltip");
                        div.style("display", "");
                        div.html(formatTooltip($(this).parent()[0].id, d.data));
                        div.transition()
                            .duration(200)
                            .style("opacity", 1);
                        var x = d3.event.pageX;
                        var y = d3.event.pageY;
                        var width = document.getElementById("tooltip").clientWidth;
                        var height = document.getElementById("tooltip").clientHeight;
                        var maxWidth = $(window).width();
                        var maxHeight = $(window).height();
                        //if (x + 24 + width < maxWidth) {
                        //    x = x + 24;
                        //    y = y - 28;
                        //} else if (x - 24 - width > 0) {
                        //    x = x - width - 24;
                        //    y = y - 28;
                        //} else {
                        //    x = x - width / 2;
                        //    y = y + 28;
                        //}
                        x = Math.min(Math.max(20, x - width - 28), maxWidth - width - 20);
                        y = Math.min(Math.max(20, y - height - 28), maxHeight - height - 20 );
                        div
                            .style("left", (x) + "px")
                            .style("top", (y) + "px");
                    }
                })
        .on("mouseout", function (d) {
            $(this).attr("class", "");
            var div = d3.select("#tooltip");
            div.transition()
                .duration(500)
            .style("opacity", 0);
            div.style("display", "none")
        })
          .merge(rect)
              .transition()
              .delay(function (d, i) {
                  return i * 5;
              })
              .attr("x", function (d, i, k) {
                  var thisX;
                  if (options.affianca) {
                      var tipo = k[0].parentElement.id;
                      thisX  = x(d.data.key) + x.bandwidth() * keysAffianca[tipo] / keysAffianca.length;
                  } else {
                      thisX = x(d.data.key);
                  }
                  return thisX;
              })
              .attr("width", function (d, i) {
                  var thisWidth;
                  if (options.affianca) {
                      thisWidth= x.bandwidth() / keysAffianca.length;
                  } else {
                      thisWidth= x.bandwidth();
                  }
                  return thisWidth;
              })
              .attr("y", function (d) {
                  if (d[1] >= 0 && d[0] >= 0) {
                      return y(d[1]);
                  } else {
                      return y(d[0]);
                  }
              })
              .attr("height", function (d) {
                      return Math.abs(y(d[0]) - y(d[1]));
              });
            rect.exit().remove();


            //disegna l'asse X
            d3.selectAll(".axisX").remove();
            var hAxis = g.append("g")
            .attr("class", "axisX")
            .attr("transform", "translate(0," + self.height + ")")
            .call(d3.axisBottom(x));
            hAxis.selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");
            hAxis
              .append("text")
                .attr("x", x.range()[1] + 8)
                .attr("y", 0)
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "start")
                .text("Anno");

            //disegna l'asse Y
            d3.selectAll(".axisY").remove();
            g.append("g")
                .attr("class", "axisY")
                .call(d3.axisLeft(y).ticks(Math.min(10, y.domain()[1] + (options.affianca ? 0 : 1)), "s"))
              .append("text")
                .attr("x", -margin.left / 2)
                .attr("y", y(y.ticks().pop()) - 24)
                .attr("dy", "0.32em")
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "start")
                .text("Film");

            //// disegna la legenda
            //d3.selectAll(".legend").remove();
            //var legend= g.append("g")
            //         .attr("class", "legend")
            //         .attr("font-family", "sans-serif")
            //         .attr("font-size", 10)
            //         .attr("text-anchor", "start")
            //         .attr("transform", function (d, i) { return "translate(" + (-self.width * 0.025) + ",0)"; });
           
            //var legendKeys = keysArray;
            //    legendKeys = keysArray.filter(function (d) {
            //        var e = d.replace("2", "");
            //        return ((!getRaggruppaFail() && e != "fail") || (getRaggruppaFail() && (e == "pass" || e == "fail" || e == "dubious")))
            //        && ((getTipo() != 0 && d != "dubious") || (getTipo() == 0 && d.charAt(d.length - 1) != "2"))
            //        && (!getNascondiDubbi() || (getNascondiDubbi() && e != "dubious"));
            //    });
            //var legendContent = legend.selectAll("g")
            //  .data(legendKeys, function (d) {
            //      return d;
            //  });
            //  var legendEnter = legendContent.enter()
            //      .append("g")
            //    .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });
            //legendEnter.append("rect")
            //    .attr("x", self.width - 19)
            //    .attr("width", 19)
            //    .attr("height", 19)
            //    .attr("fill", function (d) {
            //        return color(d);
            //    });
            //legendEnter.append("text")
            //    .attr("x", self.width + 4)
            //    .attr("y", 9.5)
            //    .attr("dy", "0.32em")
            //    .text(function (d) {
            //        if (d.charAt(d.length - 1) == "2") {
            //            d = d.substring(0, d.length - 1);
            //        }
            //        return d;
            //    })
            //    .attr("fill", "#000");

            //toglie i segni negativi
            $("g .tick text").each(function (index, item) {
                item.innerHTML = item.innerHTML.replace("-", "");
            });
        };
    }

    function getUrl(item) {
        var selezione = options.selezione[item[1] > 0 ? 0:1];
        var anno = item.data.key;
        var url = "table.html?year=" + anno;
        switch (options.tipoVisualizzazione) {
            case 0:
                break;
            case 1:
                url += "&genre=" + selezione;
                break;
            case 2:
                url += "&director=" + selezione;
                break;
            case 3:
                url += "&writer=" + selezione;
                break;
            case 4:
                url += "&company=" + selezione;
                break;
            case 5:
                url += "&country=" + selezione;
                break;
        }
        return url;
    }

    function formatTooltip(tipo, data) {
        var s = "";
        var a = "";
        var b = options.percentuale ? "%" : "";
        if (tipo.charAt(tipo.length - 1) == "2") {
            a = "2";
        } else {
            a = "";
        }
        s = "<strong>" + data.key + " (" + (!options.percentuale ? Math.abs(data["total" + a]) : Math.abs(data["originalTotal" + a])) + " film)</strong><br/></ul>";

        if (Math.abs(data["fail" + a]) > 0) {
            s += "<li" + (tipo == "fail" + a ? " class='highlight'" : "") + "><strong>" + Math.abs(data["fail" + a]) + b + "</strong>: non passano il test.</li>";
        }
        if (Math.abs(data["nowomen" + a]) > 0) {
            s += "<li" + (tipo == "nowomen" + a ? " class='highlight'" : "") + "><strong>" + Math.abs(data["nowomen" + a]) + b + "</strong>: non hanno almeno due personaggi femminili.</li>";
        }
        if (Math.abs(data["notalk" + a]) > 0) {
            s += "<li" + (tipo == "notalk" + a ? " class='highlight'" : "") + "><strong>" + Math.abs(data["notalk" + a]) + b + "</strong>: i personaggi femminili non parlano fra loro.</li>";
        }
        if (Math.abs(data["men" + a]) > 0) {
            s += "<li" + (tipo == "men" + a ? " class='highlight'" : "") + "><strong>" + Math.abs(data["men" + a]) + b + "</strong>: i personaggi femminili parlano di un uomo.</li>";
        }
        if (Math.abs(data["pass" + a]) > 0) {
            s += "<li" + (tipo == "pass" + a ? " class='highlight'" : "") + "><strong>" + Math.abs(data["pass" + a]) + b + "</strong>: passano il test.</li>";
        }
        s += "</ul>";
        return s;
    }
}