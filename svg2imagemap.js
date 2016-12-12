(function(){
    "use strict";

    var LINE_LENGTH = 6;

    var SVG2ImageMap = function(path)
    {
        this.org_path = path.getAttribute("d");
        this.abs_path = Raphael._pathToAbsolute(this.org_path);
        this.sub_paths = getSubPaths(this.abs_path);
        this.map = [];

        if(path.transform && path.transform.baseVal) {
            var consolidate = path.transform.baseVal.consolidate();
            if (consolidate) {
                var svg_matrix = consolidate.matrix;
                this.M = math.matrix([
                    [svg_matrix.a, svg_matrix.c, svg_matrix.e],
                    [svg_matrix.b, svg_matrix.d, svg_matrix.f],
                    [0, 0, 1]
                ]);
            } else
                this.M = math.matrix([
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ]);
        } else {
            // Identity matrix
            this.M = math.matrix([
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1]
            ]);
        }

        this.getMap = function(){
            if (!this.map.length)
                this.map = getMap(this.sub_paths);
            return this.map;
        }

        this.getMapTransformed = function(_matrix) {
            var maps = this.getMap();
            var matrix = this.M;

            if (_matrix !== undefined)
                matrix = math.multiply(matrix, _matrix);

            return applyTransform(maps, matrix);
        }

        return this;
    }

    function getMap(paths)
    {
        var maps = [];
        paths.forEach(function(path){
            maps.push(
                path2map(path)
            );
        });

        return maps;
    }

    function path2map(path)
    {
        var head = path.shift();

        var points = [[head[1], head[2]]];

        path.forEach(function(d){
            switch (d[0]) {
                case "L":
                    points.push([d[1], d[2]]);
                    break;
                case "C":
                    points = points.concat( getPointsFromCurve(d) );
                    break;
                case "A":
                case "S":
                    var curves = getCurvesFromArc(d);
                    curves.forEach(function(c){
                        points = points.concat( getPointsFromCurve(c) );
                    });
                    break;
                case "H":
                    var last = getLastPoint();
                    points.push([d[1], last[1]]);
                    break;
                case "V":
                    var last = getLastPoint();
                    points.push([last[0], d[1]]);
                    break;
                case "Z":
                    // Unnecessary
                    // points.push(points[0]);
                    break;
                default:
                    console.log(d);
                    break;
            }

        });

        function getCurvesFromArc(a) {
            var last = getLastPoint();
            return Raphael.path2curve(['M'].concat(last, a)).splice(1);
        }

        function getPointsFromCurve(c) {
            var last = getLastPoint();
            c.shift();

            var curve = Bezier.construct(last.concat(c));

            if( isNaN(curve.length()) ) {
                return [];
            }

            var n_points = parseInt(curve.length() / LINE_LENGTH) + 1;

            var LUT = curve.getLUT(n_points);
            if (LUT)
                return LUT.map(function(d) { return [d.x, d.y]; });
            return [];
        }

        function getLastPoint()
        {
            if(points.length == 0) return [];
            return points[points.length - 1];
        }

        return points;
    }

    function getSubPaths(path)
    {
        var rs = [];
        var cur = [];
        path.forEach(function(d) {
            if (d[0] == 'M') {
                if (cur.length) rs.push(cur);
                cur = [];
            }
            cur.push(d);
        });

        rs.push(cur);

        return rs;
    }

    function applyTransform(maps, matrix)
    {
        return maps.map(function(m){
            return m.map(function(d){
                var temp = math.multiply(matrix, [ [d[0]], [d[1]], [1]]).toArray();
                return [temp[0][0], temp[1][0]];
            });
        });
    }

    // Using apply to chain constructors
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
    Function.prototype.construct = function(aArgs) {
        var fConstructor = this, fNewConstr = function() {
            fConstructor.apply(this, aArgs);
        };
        fNewConstr.prototype = fConstructor.prototype;
        return new fNewConstr();
    };

    SVG2ImageMap.getArea = function(map, viewBox, size, href)
    {
        if (viewBox.width &&  viewBox.height) {
            var matrix = SVG2ImageMap.matrix.scale(size.w / viewBox.width, size.h / viewBox.height);
            map = applyTransform(map, matrix);
        }

        var coords = map.join();
        var tag = document.createElement("area")
        tag.setAttribute("shape", "poly");
        tag.setAttribute("href", href);
        tag.setAttribute("coords", coords);
        return tag;
    }

    SVG2ImageMap.applyTransform = applyTransform;

    SVG2ImageMap.matrix = {
        scale : function(x, y) {
            return math.matrix([
                [x, 0, 0],
                [0, y, 0],
                [0, 0, 1]
            ]);
        }
    }

    window.SVG2ImageMap = SVG2ImageMap;
})();