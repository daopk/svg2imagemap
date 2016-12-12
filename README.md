# svg2imagemap
Convert svg path to image map coordinates

```javascript
var svg = new SVG2ImageMap(path);

var map = svg.getMap(); // Without transform
var mapTransformed = svg.getMapTransformed();

// Apply a custom transform 
// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/transform
var matrix = math.matrix([
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
]);

map = SVG2ImageMap.applyTransform(map, matrix);

var coords = map.join();
```
