const moduleId = 'rotating-square-template';

Hooks.on('init', () => {
    const getRectShape = function(distance, direction) {

        const r = Ray.fromAngle(0, 0, Math.toRadians(direction), distance / 2 * canvas.dimensions.distancePixels);
        const dx = r.dx - r.dy;
        const dy = r.dy + r.dx;

        const points = [
            dx, dy,
            dy, -dx,
            -dx, -dy,
            -dy, dx,
            dx, dy
        ];

        return new PIXI.Polygon(points);
    };

    const refreshShape = function(prev) {
        if (this.document.t !== "rect" ) {
            return prev.apply(this);
        }

        // Silence libWrapper warnings
        prev.apply(this);

        const {x, y, direction, distance} = this.document;

        this.ray = Ray.fromAngle(x, y, Math.toRadians(direction), distance / 2 * canvas.dimensions.distancePixels);

        // Get the Template shape
        this.shape = this._computeShape();
    };

    const refreshRulerText = function(prev) {
        if ( this.document.t !== "rect" ) {
            return prev.apply(this);
        }

        // Silence libWrapper warnings
        prev.apply(this);

        const d = Math.round(this.document.distance * 10) / 10;
        const u = canvas.scene.grid.units;
        const text = `${d} ${u}`;

        this.ruler.text = text;
        this.ruler.position.set(this.ray.dx + 20, this.ray.dy + 20);
    };

    if (typeof libWrapper === 'function') {
        libWrapper.register(moduleId, 'MeasuredTemplate.getRectShape', function(wrapped, ...args) {
            wrapped.apply(this, args);
            return getRectShape.apply(this, args);
        });
        libWrapper.register(moduleId, 'MeasuredTemplate.prototype._refreshRulerText', function(wrapped, ...args) {
            return refreshRulerText.apply(this, [wrapped, ...args]);
        });
        libWrapper.register(moduleId, 'MeasuredTemplate.prototype._refreshShape', function(wrapped, ...args) {
            return refreshShape.apply(this, [wrapped, ...args]);
        });
    } else {
        CONFIG.MeasuredTemplate.objectClass.getRectShape = getRectShape;

        const previousRulerText = CONFIG.MeasuredTemplate.objectClass.prototype._refreshRulerText;
        CONFIG.MeasuredTemplate.objectClass.prototype._refreshRulerText = function(...args) {
            return refreshRulerText.apply(this, [previousRulerText, ...args]);
        };

        const previousShape = CONFIG.MeasuredTemplate.objectClass.prototype._refreshShape;
        CONFIG.MeasuredTemplate.objectClass.prototype._refreshShape = function(...args) {
            return refreshShape.apply(this, [previousShape, ...args]);
        };
    }
});

Hooks.on('dnd5e.preCreateActivityTemplate', (activity, templateData) => {
    if (templateData.t !== "rect") {
        return;
    }

    templateData.direction = 0;
    templateData.distance = activity.target?.template?.size ?? 0;
})
