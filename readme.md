# canvas graph
A library to draw interactive graphs on a web browser

## Basic Usage
I assume you have a nice little html page template. In the body, put
```html
<div id="container"></div>
<script src="/path/to/canvas-graph.js"></script>
<script>
    // Your code here, example:
    const graph = new CanvasGraph(document.getElementById('canvasgraph'), {
        fullsize: true,
    });
    graph.drawGrid = true;
    graph.AddFunc(new CanvasGraph.GraphFunc(
        x => Math.exp(-x * x),
        new CanvasGraph.StrokeStyle('red', 3),
    ));
</script>
```
This example creates a graph of the function e^(-x^2). You can click + drag to pan and scroll to zoom.

Theoretically (not tested) it should work with node.js style `module.exports` and `require` (i.e. with babel/webpack). What you get from `require('canvas-graph')` should be the same as including the script.

## Developing
Open `public/index.html` and start making changes and refreshing. idk any way to do this better.

## Plans
- Add babel transpilation to allow library to work on older browsers
- Make `GraphFunc` look better (smoother)
- Add `GraphPoint` class that draws a circle that has same screen radius no matter the zoom
- Add `GraphText` class that draws some text on the screen (option for unit sized or screen size)
- Make scale adjust based on zoom level
- Major + minor grid lines
- Scale on axes and sides of screen if no axis
- More color customization (background, grid lines, etc.) of built in draw methods