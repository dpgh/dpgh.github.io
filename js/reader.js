function processData(rawData) {
    var allTextLines = rawData.split(/\r\n|\n/);
    var header = allTextLines.splice(0, 1)[0].split(',');
    var lines = [];

    while (allTextLines.length > 0) {
        var line = allTextLines.splice(0, 1)[0].split(',');
        if (line.length == header.length) {
            var item = {};
            for (var i = 0; i < header.length; i++) {
                item[header[i]] = line[i];
            }
            lines.push(item);
        }
    }

    return lines;
}

function readItems(movieFileName, movieFK, itemFileName, itemPK, minimumNumberOfMovies, callback) {
    var items;
    var movies;
    $.ajax({
        type: "GET",
        url: itemFileName,
        dataType: "text",
        async: false,
        success: function (data) { items = processData(data) }
    });

    $.ajax({
        type: "GET",
        url: movieFileName,
        dataType: "text",
        async: false,
        success: function (data) { movies = processData(data) }
    });

    // esclude quelli senza anno prima di raggruppare
    movies = movies.filter(function(d) { return d.year != "";}).map(function (d) { return d[movieFK].split(" "); });
    movies = movies.reduce(function (a, b) {
        return a.concat(b);
    });
    movies = d3.nest().key(function (d) { return d; }).rollup(function (d) { return d.length; }).entries(movies);
    movies = movies.filter(function (d) { return d.value >= minimumNumberOfMovies; });
    var output = [];

    processItems(0, items.length, onProcessingComplete);

    function processItems(start, max, cb) {
        var current;
        for (var i = 0; i < 50; i++) {
            current = start + i;
            if (current < max) {
                var item = items[current];
                var itemId = item[itemPK];

                var moviesWithThisitem = movies.filter(function (movie, movieIndex) {
                   return movie.key == itemId;
                });

                if (moviesWithThisitem.length > 0) {
                    item.tot = moviesWithThisitem[0].value;
                    output.push(item);
                }



            } else {
                break;
            }
        }

        if (current < max) {
            setTimeout(function () {
                processItems(current + 1, max, cb);
            }, 0);
        } else {
            cb();
        }

    }

    function onProcessingComplete() {
        output.sort(function (a, b) { return a.name.localeCompare(b.name); });

        callback(output);
    }
}

function readRandomItem(movieFileName, movieFK, itemFileName, itemPK, minimumNumberOfMovies) {
    var items;
    var movies;
    $.ajax({
        type: "GET",
        url: itemFileName,
        dataType: "text",
        async: false,
        success: function (data) { items = processData(data) }
    });

    $.ajax({
        type: "GET",
        url: movieFileName,
        dataType: "text",
        async: false,
        success: function (data) { movies = processData(data) }
    });

    // esclude quelli senza anno prima di raggruppare
    movies = movies.filter(function (d) { return d.year != "" && d[movieFK] != ""; }).map(function (d2) { var x = {}; x["binary"] = d2.binary; x[movieFK] = d2[movieFK]; return x; });
    movies.forEach(function (d) {
        var genres = d[movieFK].split(" ");
        while (genres.length > 1) {
            var add = genres.splice(0, 1)[0];
            var x = {};
            x["binary"] = d["binary"];
            x[movieFK] = add;
            movies.push(x);
        }
        d[movieFK] = genres[0];
    });
    movies = d3.nest().key(function (d) { return d[movieFK]; }).rollup(function (d) {
        var pass = d.filter(function (d2) { return d2.binary == "PASS"; })
        var fail = d.filter(function (d2) { return d2.binary == "FAIL"; })
        return { "pass": pass.length, "fail": fail.length };
    }).entries(movies);
    movies = movies.filter(function (d) { return d.value.fail + d.value.pass >= minimumNumberOfMovies; });

    movies = movies[Math.floor(Math.random() * movies.length)];
    var item = items.filter(function(d) { return d.id == movies.key; })[0];
    var output = { "id": item.id, "name": item.name, "pass": movies.value.pass, "fail": movies.value.fail, "tot": movies.value.fail + movies.value.pass };
    return output;

}