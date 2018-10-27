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

## Classes
There are a number of premade drawing classes. Here are all of them
#### GraphDrawer
Drawing base class. All Drawer classes inherit from this. Feel free to extend from this and write your own GraphDrawer class for your use.

#### GraphLine
Draws a line in graph coordinates
```js
new GraphLine(xStart, yStart, xEnd, yEnd, strokeStyle);
```

#### GraphCircle
Draws a circle in graph coordinates
```js
new GraphCircle(centerX, centerY, radius, strokeStyle, fillStyle);
```

#### GraphRect
Draws a rectangle in graph coordinates
```js
new GraphRect(left, bottom, width, height, strokeStyle, fillStyle);
```

#### GraphFunc
Draws a function y(x)
```js
function yOfX(x) { return x*x; } // Or whatever function you want to graph
new GraphFunc(yOfX, strokeStyle);
```

#### GraphText
Draws text scaled to the screen size, with center at (x, y) with height of `height` units
```js
new GraphText(text, x, y, height, strokeStyle, fillStyle);
```

#### GraphWrapper
Calls the provided function with a `CanvasRenderingContext2D` that autoscales various drawing functions
```js
new GraphWrapper(ctx => {
    // Put in here some code to draw to the canvas, just like normal, except it's all in graph coordinates
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1, 2);
});
```

## Developing
Open `public/index.html` and start making czhanges and refreshing. idk any way to do this better.

## Plans
- Add babel transpilation to allow library to work on older browsers
- Make `GraphFunc` look better (smoother)
- Add `GraphPoint` class that draws a circle that has same screen radius no matter the zoom
- Make scale adjust based on zoom level
- Major + minor grid lines
- Scale on axes and sides of screen if no axis
- More color customization (background, grid lines, etc.) of built in draw methods