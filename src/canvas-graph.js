const CanvasGraph = (function(module) { // eslint-disable-line
    /**
    * Graph class
    */
    class Graph {
        /**
         * @constructor
         * @param {Element} container - Container element of canvas graph
         * @param {GraphOptions} options - Options to use for the graph
         */
        constructor(container, options) {
            const defaultOptions = {
                fullsize: false,
                autosize: true,
                width: undefined,
                height: undefined,
                defaultZoom: 5,
                defaultCenter: [0, 0],
            };

            this.container = container;

            this.options = Object.assign({}, defaultOptions, options);

            this.center = this.options.defaultCenter.slice();
            this.radX = this.options.defaultZoom;

            this.aspect = undefined;

            this.fullsize = this.options.fullsize;
            this.autosize = this.options.autosize && !this.fullsize;
            this.width = this.options.width;
            this.height = this.options.height;

            this.canvas = document.createElement('canvas');
            this.canvas.classList.add("graph");
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');

            this.dragging = false;

            // Things to draw
            this._drawGrid = false;
            /** @property {GraphLine[]} lines */
            this.lines = [];
            /** @property {GraphCircle[]} circles */
            this.circles = [];
            /** @property {GraphRect[]} rects */
            this.rects = [];
            /** @property {GraphFunc[]} funcs */
            this.funcs = [];
            /** @property {GraphDrawer[]} others */
            this.others = [];

            this.initEventHandlers();
            this.resize();

            // Bind functions
            this.gtc = this.gtc.bind(this);
            this.sgtc = this.sgtc.bind(this);
            this.ctg = this.ctg.bind(this);
            this.sctg = this.sctg.bind(this);

            this.drawGraph();
        }

        drawGraph() {
            this.ctx.fillStyle = 'rgba(255, 255, 255)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            if (this.drawGrid) this.drawLines();
            const graphInfo = {
                ctx: this.ctx,
                gtc: this.gtc,
                sgtc: this.sgtc,
                ctg: this.ctg,
                sctg: this.sctg,
                width: this.width,
                height: this.height,
            };
            this.funcs.forEach(func => func.draw(graphInfo));
            this.rects.forEach(rect => rect.draw(graphInfo));
            this.lines.forEach(line => line.draw(graphInfo));
            this.circles.forEach(circle => circle.draw(graphInfo));
            this.others.forEach(other => other.draw(graphInfo));
        }

        drawLines() {
            const { ctx, center, radX, radY, gtc } = this;
            const gridScale = 1;

            ctx.strokeStyle = 'rgb(150, 150, 150)';
            ctx.lineWidth = 1;
            const gridStartX = Math.floor((center[0] - radX) / gridScale) * gridScale;
            const gridEndX = center[0] + radX;
            for (let x = gridStartX; x <= gridEndX; x += gridScale) {
                ctx.beginPath();
                ctx.moveTo(...gtc(x, center[1] + radY));
                ctx.lineTo(...gtc(x, center[1] - radY));
                ctx.stroke();
            }
            const gridStartY = Math.floor((center[1] - radY) / gridScale) * gridScale;
            const gridEndY = center[1] + radY;
            for (let y = gridStartY; y <= gridEndY; y += gridScale) {
                ctx.beginPath();
                ctx.moveTo(...gtc(center[0] - radX, y));
                ctx.lineTo(...gtc(center[0] + radX, y));
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.lineWidth = 2;
            if (0 >= center[0] - radX && 0 <= center[0] + radX) {
                ctx.beginPath();
                ctx.moveTo(...gtc(0, center[1] + radY));
                ctx.lineTo(...gtc(0, center[1] - radY));
                ctx.stroke();
            }
            if (0 >= center[1] - radY && 0 <= center[1] + radY) {
                ctx.beginPath();
                ctx.moveTo(...gtc(center[0] - radX, 0));
                ctx.lineTo(...gtc(center[0] + radX, 0));
                ctx.stroke();
            }
        }

        dragStart() {
            this.dragging = true;
        }
        /**
         * @param {MouseEvent} e 
         */
        dragMove(e) {
            if (!this.dragging) return;

            const dx = e.movementX;
            const dy = e.movementY;
            const gdx = -this.sctg(dx);
            const gdy = this.sctg(dy);
            this.center[0] += gdx;
            this.center[1] += gdy;

            this.drawGraph();
        }
        dragEnd() {
            this.dragging = false;
        }

        /**
         * @param {WheelEvent} e 
         */
        onScroll(e) {
            const { radX, radY, width, height, center } = this;

            // Calculate new radii
            const newRadX = radX * Math.pow(1.05, Math.sign(e.deltaY));
            const newRadY = newRadX / this.aspect;

            // Calculate new position for the center of the graph
            // to keep the mouse over the same graph unit
            const mx = e.clientX;
            const my = e.clientY;
            
            const newCenterX = (mx / width * 2) * (radX - newRadX) + center[0] + newRadX - radX;
            const newCenterY = (2 - my / height * 2) * (radY - newRadY) + center[1] + newRadY - radY;

            this.center[0] = newCenterX;
            this.center[1] = newCenterY;
            this.radX = newRadX;

            // Redraw the graph
            this.drawGraph();
        }

        initEventHandlers() {
            if (this.autosize) {
                this.container.addEventListener('resize', this.resize.bind(this));
            } else if (this.fullsize) {
                window.addEventListener('resize', this.resize.bind(this));
            }

            // TODO: Split up touch and mouse events to be able to handle pinch to zoom on mobile
            this.canvas.addEventListener('mousedown', this.dragStart.bind(this));
            this.canvas.addEventListener('touchstart', this.dragStart.bind(this));

            window.addEventListener('mousemove', this.dragMove.bind(this));
            window.addEventListener('touchmove', this.dragMove.bind(this));

            window.addEventListener('mouseup', this.dragEnd.bind(this));
            window.addEventListener('touchend', this.dragEnd.bind(this));

            window.addEventListener('mousewheel', this.onScroll.bind(this));
        }

        resize() {
            if (this.fullsize) {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
            } else if (this.autosize) {
                const rect = this.container.getBoundingClientRect();
                this.width = rect.width;
                this.height = rect.height;
            }

            this.aspect = this.width / this.height;
            this.setCanvasSize();
        }
        setCanvasSize() {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            if (this.fullsize) {
                this.canvas.style.position = 'absolute';
                this.canvas.style.top = '0';
                this.canvas.style.bottom = '0';
            }
            this.canvas.style.cursor = 'move';
        }

        gtc(x, y) {
            const { center, radX, radY, width, height } = this;
            const cx = (x - center[0] + radX) / radX / 2 * width;
            const cy = (1 - (y - center[1] + radY) / radY / 2) * height;
            return [ Math.floor(cx), Math.floor(cy) ];
        }
        sgtc(n) {
            return n / this.radX / 2 * this.width;
        }
        ctg(x, y) {
            const { center, radX, radY, width, height } = this;
            const gx = x / width * radX * 2 + center[0] - radX;
            const gy = (1 - y / height) * radY * 2 + center[1] - radY;
            return [ gx, gy ];
        }
        sctg(n) {
            return n / this.width * this.radX * 2;
        }

        /**
         * Adds a line to the graph
         * @param {GraphLine} line
         */
        AddLine(line) {
            this.lines.push(line);
            this.drawGraph();
        }
        /**
         * Adds a circle to the graph
         * @param {GraphCircle} circle 
         */
        AddCircle(circle) {
            this.circles.push(circle);
            this.drawGraph();
        }
        /**
         * Adds a rectangle to the graph
         * @param {GraphRect} rect 
         */
        AddRect(rect) {
            this.rects.push(rect);
            this.drawGraph();
        }
        /**
         * Adds a function to the graph
         * @param {GraphFunc} func 
         */
        AddFunc(func) {
            this.funcs.push(func);
            this.drawGraph();
        }
        /**
         * Adds a custom drawer to the graph
         * @param {GraphDrawer} other 
         */
        AddOther(other) {
            this.others.push(other);
            this.drawGraph();
        }

        get radY() { return this.radX / this.aspect; }
        get drawGrid() { return this._drawGrid; }
        set drawGrid(value) {
            this._drawGrid = value;
            this.drawGraph();
        }
    }

    class StrokeStyle {
        constructor(color='rgba(0, 0, 0, 0)', width='2') {
            this.color = color;
            this.width = width;
        }
        set(ctx) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width;
        }
    }
    class FillStyle {
        constructor(color='rgba(0, 0, 0, 0)') {
            this.color = color;
        }
        set(ctx) {
            ctx.fillStyle = this.color;
        }
    }

    /**
     * @typedef {object} GraphDrawerInfo
     * @property {CanvasRenderingContext2D} ctx
     * @property {function} gtc - Transforms graph coordinates to screen coordinates
     * @property {function} sgtc - Scales number from graph size to screen size
     * @property {function} ctg - Transforms screen coordinates to graph coordinates
     * @property {function} sctg - Scales number from screen size to graph size
     * @property {number} width - Width of canvas in pixels
     * @property {number} height - Height of canvas in pixels
     */

    /** Base class for drawing things on the screen */
    class GraphDrawer {
        constructor() { }
        /**
         * @param {GraphDrawerInfo} info 
         */
        draw() {}
    }
    /** Class to straight point-to-point lines on the graph */
    class GraphLine extends GraphDrawer {
        /**
         * Create a Graph Line
         * @param {number} sx - Point 1 x
         * @param {number} sy - Point 1 y
         * @param {number} ex - Point 2 x
         * @param {number} ey - Point 2 y
         * @param {StrokeStyle} stroke 
         */
        constructor(sx, sy, ex, ey, stroke=new StrokeStyle()) {
            super();
            this.sx = sx;
            this.sy = sy;
            this.ex = ex;
            this.ey = ey;
            this.stroke = stroke;
        }

        /**
         * @param {GraphDrawerInfo} info
         */
        draw(info) {
            const { ctx, gtc } = info;
            const [ csx, csy ] = gtc(this.sx, this.sy);
            const [ cex, cey ] = gtc(this.ex, this.ey);
            this.stroke.set(ctx);
            ctx.beginPath();
            ctx.moveTo(csx, csy);
            ctx.lineTo(cex, cey);
            ctx.stroke();
        }
    }
    /** Class to draw circles on the graph */
    class GraphCircle extends GraphDrawer {
        /**
         * Create a Graph Circle
         * @param {number} cx - Center of circle x
         * @param {number} cy - Center of circle y
         * @param {number} r - Radius of circle
         * @param {StrokeStyle} stroke 
         * @param {FillStyle} fill 
         */
        constructor(cx, cy, r, stroke=new StrokeStyle(), fill=new FillStyle()) {
            super();
            this.cx = cx;
            this.cy = cy;
            this.r = r;
            this.stroke = stroke;
            this.fill = fill;
        }

        /**
         * @param {GraphDrawerInfo} info
         */
        draw(info) {
            const { ctx, gtc, sgtc } = info;
            const [ ccx, ccy ] = gtc(this.cx, this.cy);
            const cr = sgtc(this.r);
            this.stroke.set(ctx);
            this.fill.set(ctx);
            ctx.beginPath();
            ctx.ellipse(ccx, ccy, cr, cr, 0, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    }
    /** Class to draw rectangles on the graph */
    class GraphRect extends GraphDrawer {
        /**
         * Create a Graph Rectangle
         * @param {number} x - x of bottom left corner
         * @param {number} y - y of bottom left corner
         * @param {number} w - width of rectangle
         * @param {number} h - height of rectangle
         * @param {StrokeStyle} stroke 
         * @param {FillStyle} fill 
         */
        constructor(x, y, w, h, stroke=new StrokeStyle(), fill=new FillStyle()) {
            super();
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.stroke = stroke;
            this.fill = fill;
        }
        /**
         * @param {GraphDrawerInfo} info
         */
        draw(info) {
            const { ctx, gtc, sgtc } = info;
            this.stroke.set(ctx);
            this.fill.set(ctx);
            const [ cx, cy ] = gtc(this.x, this.y);
            const cw = sgtc(this.w);
            const ch = sgtc(this.h);
            ctx.fillRect(cx, cy, cw, ch);
            ctx.strokeRect(cx, cy, cw, ch);
        }
    }
    /** Class to draw simple y(x) functions on the graph */
    class GraphFunc extends GraphDrawer {
        /**
         * Create a Graph Function
         * @param {function} func - Single variable function to evaluate for each x
         * @param {StrokeStyle} stroke 
         */
        constructor(func, stroke=new StrokeStyle()) {
            super();
            this.func = func;
            this.stroke = stroke;
        }

        /**
         * @param {GraphDrawerInfo} info
         */
        draw(info) {
            const { ctx, gtc, ctg, width } = info;
            this.stroke.set(ctx);
            ctx.beginPath();
            for (let sx = 0; sx <= width; sx++) {
                const [ x ] = ctg(sx, 0);
                const fx = this.func(x);
                if (sx === 0) ctx.moveTo(...gtc(x, fx));
                else ctx.lineTo(...gtc(x, fx));
            }
            ctx.stroke();
        }
    }

    /**
     * @typedef {Object} GraphOptions
     * @property {?boolean} fullsize - Indicates whether the graph should take up the whole screen
     * @property {?boolean} autosize - If true, width and height are equal to size of parent container
     * @property {?number} width - Width of graph in px if not fullscreen
     * @property {?number} height - Height of graph in px if not fullscreen
     * @property {?number} defaultZoom - The radius on x axis visible by default
     * @property {?number[]} defaultCenter - The default point to display as center of the screen
     */

    module.exports = Graph;
    Graph.StrokeStyle = StrokeStyle;
    Graph.FillStyle = FillStyle;
    Graph.GraphLine = GraphLine;
    Graph.GraphCircle = GraphCircle;
    Graph.GraphRect = GraphRect;
    Graph.GraphFunc = GraphFunc;
    Graph.GraphDrawer = GraphDrawer;

    return module;
})(typeof module !== "undefined" ? module : {}).exports; // eslint-disable-line