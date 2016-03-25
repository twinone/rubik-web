var THREE = require("./vendor/three");
var orbitcontrols = require("./orbitcontrols");
var OrbitControls = orbitcontrols.OrbitControls;
var sceneutils = require("./vendor/sceneutils");
var util = require("./util");
require("./vendor/helvetiker.min.js");
require("./vendor/projector.js");
var Cubie = require("./cubie").Cubie;

var solver = require("./solver");
var model = require("./model");
var Axis = model.Axis;
var Face = model.Face;
var faces = model.faces;

var interpolation = require("./interpolation");
var interpolators = interpolation.interpolators;

var defaults = require("./defaults").defaults;

var PI = Math.PI;



var ORIGIN = new THREE.Vector3(0, 0, 0);

var ROTATION_MATRIX = [
    [Face.UP,   Face.BACK,    Face.DOWN,   Face.FRONT], // X
    [Face.UP,    Face.RIGHT,  Face.DOWN,   Face.LEFT], // Y
    [Face.FRONT, Face.RIGHT,  Face.BACK,   Face.LEFT], // Z
];

function Cube(options) {
    if (!options)
    options = {};
    this.dt = 0,
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.canvas = document.getElementById("canvas");
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });

    this.animationFrameId = null;

    this.size = options.size || defaults.size;
    this.cubieWidth = options.cubieWidth || defaults.cubieWidth;
    this.cubieSpacing = options.cubieSpacing || defaults.cubieSpacing;
    this.cubieSpacing = 0;
    this.labelMargin = options.labelMargin || defaults.labelMargin;

    this.colors = options.colors || defaults.colors;
    this.stickers = options.stickers || defaults.stickers;

    this.cubies = [];
    this.active = null; // init
    this.labels = null;

    this.shouldShowLabels = (options.showLabels != undefined) ? options.showLabels : defaults.showLabels;
    this.shouldOptimizeQueue = true;

    this.anim = Object.create(defaults.animation);

    if (options.animation)
    Object.keys(options.animation).forEach(function(key) {
        this.anim[key] = options.animation[key];
    });


    this.anim.animating = false;
    this.anim.current = null;
    this.anim.queue = [];
    this.anim.start = null;
    this.anim.interpolator = interpolation.get(this.anim.interpolator);
    this.moveCompleteListener = options.moveCompleteListener || defaults.moveCompleteListener;

    this.isInitialized = false;

    this.mouse = {
        x: 0,
        y: 0
    }

    this.wireframe = defaults.wireframe;

    this.init();
};

Cube.prototype.isAnimating = function isAnimating() { return this.anim.animating; }

Cube.prototype.setAnimationDuration = function setAnimationDuration(duration) {
    // Don't warn because this may be user input and we don't want
    // developers to do the same checks as we do.
    if (isNaN(duration) || !isFinite(duration)) return;
    if (this.isAnimating()) {
        this.anim.duration = duration;
    } else {
        this.anim.newDuration = duration;
    }
}


/*
If we unfold the cube in the following layout:
U
LFRB
D
A State is the stickers of each face in order ULFRBD in reading order (ltr)
The solved state would be:
uuuuuullllllffffffrrrrrrbbbbbbdddddd

Where u means the "up" color.

*/
Cube.prototype.getState = function getState(fancy = false) {
    var s = this.size;
    var faces = "";
    if (fancy) faces += "UP: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[j][s-1-i][s-1].getSticker(Face.UP));
    if (fancy) faces += "<br>LEFT: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[0][s-1-j][s-1-i].getSticker(Face.LEFT));
    if (fancy) faces += "<br>FRONT: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[j][0][s-1-i].getSticker(Face.FRONT));
    if (fancy) faces += "<br>RIGHT: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[s-1][j][s-1-i].getSticker(Face.RIGHT));
    if (fancy) faces += "<br>BACK: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[s-1-j][s-1][s-1-i].getSticker(Face.BACK));
    if (fancy) faces += "<br>DOWN: ";
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    faces += util.faceToChar(this.cubies[j][i][0].getSticker(Face.DOWN));
    return faces;
}


Cube.prototype.setState = function setState(state) {
    var s = Math.sqrt(state.length/6);
    if (s%1!==0) { console.log("Invalid state length!"); return; }
    if (this.size != s) this.setSize(s);
    var n = 0;
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[j][s-1-i][s-1].setSticker(Face.UP, util.charToFace(state[n++]));
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[0][s-1-j][s-1-i].setSticker(Face.LEFT, util.charToFace(state[n++]));
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[j][0][s-1-i].setSticker(Face.FRONT, util.charToFace(state[n++]));
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[s-1][j][s-1-i].setSticker(Face.RIGHT, util.charToFace(state[n++]));
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[s-1-j][s-1][s-1-i].setSticker(Face.BACK, util.charToFace(state[n++]));
    for (var i = 0; i < s; i++) for (var j = 0; j < s; j++)
    this.cubies[j][i][0].setSticker(Face.DOWN, util.charToFace(state[n++]));
}

Cube.prototype.setInterpolator = function setInterpolator(interpolator) {
    this.anim.interpolator = interpolation.get(interpolator);
}

Cube.prototype._setupCamera = function _setupCamera() {
    var camPos = this.cameraDistance;
    this.camera.position.set(-camPos, -camPos, camPos);
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(ORIGIN);
};

Cube.prototype.resetCamera = function resetCamera() {
    this._setupCamera();

    this.controls.center.set(0,0,0);
};

Cube.prototype._performRaycast = function _performRaycast(e) {
    if (this.anim.animating) { console.log("not raycasting while animating!"); return; }

    // update the mouse position
    // update the mouse variable
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // create a Ray with origin at the mouse position
    // and direction into the scene (camera direction)
    var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
    vector.unproject(this.camera);

    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

    var cubies = [];
    for (var i = 0; i < this.size; i++)
    for (var j = 0; j < this.size; j++)
    for (var k = 0; k < this.size; k++) {
        cubies.push(this.cubies[i][j][k]);
    }
    // cubies
    var intersects = ray.intersectObjects(cubies);
    if (intersects.length > 0) {

        var elem = intersects[0];
        // determine if we hit a cubie
        // probably yes, since we only ask for intersection with cubies
        if (!elem.object.hasOwnProperty("coords")) { console.log("Intersected with non-cubie"); return; }

        this._onCubieClick(elem.object, elem.object.coords, elem.face.normal);
    }
}

Cube.prototype._onCubieClick = function _onCubieClick(cubie, coords, direction) {
    //    console.log("click pos=("+ coords.x + "," + coords.y + "," + coords.z + "), " +
    //                "normal=("   + direction.x + "," + direction.y + "," + direction.z + ")");
    //    console.log(cubie);

    var face = direction; // local coords...
    console.log(
        (cubie.getSticker(Face.RIGHT) ? "(R: "+util.faceToColorString(cubie.getSticker(Face.RIGHT))+") - " : "") +
        (cubie.getSticker(Face.LEFT) ? "(L: "+util.faceToColorString(cubie.getSticker(Face.LEFT))+") - " : "") +
        (cubie.getSticker(Face.BACK) ? "(B: "+util.faceToColorString(cubie.getSticker(Face.BACK))+") - " : "") +
        (cubie.getSticker(Face.FRONT) ? "(F: "+util.faceToColorString(cubie.getSticker(Face.FRONT))+") - " : "") +
        (cubie.getSticker(Face.UP) ? "(U: "+util.faceToColorString(cubie.getSticker(Face.UP))+") - " : "") +
        (cubie.getSticker(Face.DOWN) ? "(D: "+util.faceToColorString(cubie.getSticker(Face.DOWN))+")" : "")
    );
}

Cube.prototype.scramble = function scramble(num) {
    var turns = num || (this.size -1) * 10;
    var expectedLength = this.anim.queue.length + turns;

    while (this.anim.queue.length < expectedLength) {
        var face = randFace();
        var layer = randInt(0, this.size-1);
        var anim = new Animation(face, [layer]);
        this._enqueueAnimation(anim, false);
        this._optimizeQueue();
    }
};

Cube.prototype.getSolution = function getSolution() {
    return solver.Solve(this.getState());
}

Cube.prototype._optimizeQueue = function _optimizeQueue() {
    var q = this.anim.queue;
    var count = q.length;
    // Remove all consecutive oposite moves
    var found = true; // enter the loop
    while (found) {
        found = false;
        for (var i = q.length -2; i >= 0; i--) {
            if (q[i].cancels(q[i+1])) {
                found = true;
                q.splice(i, 2);
                i--;
            }
        }
    }

    // Remove all 4 consecutive turns
    found = true; // enter the loop
    while (found) {
        found = false;
        for (var i = q.length -4; i >= 0; i--) {
            if ((q[i].equals(q[i+1])) &&
            (q[i].equals(q[i+2])) &&
            (q[i].equals(q[i+3]))) {
                found = true;
                q.splice(i, 4);
                i -= 3;
            }
        }
    }

    this.anim.queue = q;
    return count - q.length;
};

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFace() {
    return faces[randInt(0, 5)];
}

Cube.prototype.setSize = function setSize(size) {
    if (isNaN(size) || !isFinite(size)) throw new Error("Size must be a (finite) number");
    if (size < 1) {
        size = 1;
        console.warn("Size " + size + " is not valid, converting to 1");
    }
    this.size = size;
    if (this.isInitialized) {
        this.destroy();
        this.init();
    }
};
Cube.prototype.width = function() {
    return this.cubieWidth * (1 + this.cubieSpacing)
    * this.SIZE - this.cubieWidth * this.cubieSpacing;
};

Cube.prototype._setupCubies = function() {
    var cubieGeometry = new THREE.BoxGeometry(this.cubieWidth, this.cubieWidth, this.cubieWidth);

    var image = document.createElement('img');
    var map = new THREE.Texture(image);
    image.onload = function()  {
        map.needsUpdate = true;
    };
    image.src =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAVklEQVRo3u3RsQ0AIAwDwYT9dzYlTIAUcd+l8ylV0t/1fSSZMbrP7DX9AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACSXrQBS9IDcNBhO+QAAAAASUVORK5CYII=';

    for (var i = 0; i < this.size; i++) {
        this.cubies[i] = [];
        for (var j = 0; j < this.size; j++) {
            this.cubies[i][j] = [];
            for (var k = 0; k < this.size; k++) {
                var cubie = new Cubie(cubieGeometry, map, this, i, j, k);
                cubie.setup(cubieGeometry, map);
                cubie.position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing)
                );
                this.cubies[i][j][k] = cubie;
                this.scene.add(cubie);
            }
        }
    }
};


Cube.prototype.lookAtFace = function lookAtFace(face) {
    var dist = this.cameraDistance;
    dist = Math.sqrt(dist*dist*3);
    var v = util.faceToAxis(face);
    v.multiplyScalar(dist);
    this.camera.position.copy(v);
    this.camera.lookAt(ORIGIN);
}
Cube.prototype.init = function init() {
    this._init();
};

Cube.prototype._init = function _init() {
    var self = this;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    this.cameraDistance = this.cubieWidth* (1+this.cubieSpacing) * this.size/2 * 4;

    this.projector = new THREE.Projector();

    this.resizeListener = function(e) {
        self._onResize(e);
    }
    window.addEventListener('resize', this.resizeListener);

    this.renderer.setClearColor(this.colors.background);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.active = new THREE.Object3D();
    this.scene.add(this.active);

    this._setupCubies();

    if (this.shouldShowLabels) {
        this.showLabels();
    }

    this._setupCamera();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.onMouseDownListener = function onMouseDownListener(e) {
        self._performRaycast(e);
    }
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDownListener);

    this.keyPressListener = function(e) {
        self._onKeyPress(e);
    };
    //var elm = document.getElementById("canvas-container");
    var elm = this.renderer.domElement;
    elm.addEventListener('keypress', this.keyPressListener);



    function render () {
        self.dt = self.clock.getDelta();

        self._updateLabelOrientation();

        if (self.anim.animating) {
            self._updateAnimation();
        } else {
            // see setAnimationDuration()
            if (self.anim.newDuration) {
                self.anim.duration = self.anim.newDuration;
                self.anim.newDuration = undefined;
            }
            if (self.anim.queue.length != 0) {
                self.anim.currDuration = self.anim.duration *
                Math.max(0.3, Math.pow(0.9, self.anim.queue.length/2));
                self._startAnimation(self.anim.queue.shift());
            }
        }

        self.renderer.render(self.scene, self.camera);
        self.animationFrameId = requestAnimationFrame(render);
    }

    render();
    this.isInitialized = true;
};

Cube.prototype.width = function width() {
    return (1+this.cubieSpacing) * this.cubieWidth * this.size;
}

Cube.prototype.destroy = function destroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.labels = null;
    util.empty(this.active);
    this.cubies = [];
    this.anim.queue = [];
    this.anim.animating = false;

    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownListener);
    this.renderer.domElement.removeEventListener('keypress', this.keyPressListener);
    window.removeEventListener('resize', this.resizeListener);
};


Cube.prototype._onResize = function _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
};


Cube.prototype._updateLabelOrientation = function _updateLabelOrientation() {
    if (!this.labels) return;
    for (var i = 0; i < this.labels.children.length; i++) {

        this.labels.children[i].quaternion.copy(this.camera.quaternion);
    }
};

Cube.prototype.toggleLabels = function toggleLabels() {
    if (this.labels) this.hideLabels();
    else this.showLabels();
};

Cube.prototype.showLabels = function showLabels() {
    this.hideLabels(); // cleanup if they're there already
    this.labels = new THREE.Object3D();
    var pos = this.width()/2 + this.labelMargin * this.cubieWidth * this.size;
    var s = this.width() / 5;
    for (var i = 0; i < faces.length; i++) {
        var face = faces[i];
        var shape = THREE.FontUtils.generateShapes(util.faceToChar(face), {size: s});
        var geo = new THREE.ShapeGeometry(shape);
        var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: this.colors.label }));
        m.position.copy(util.faceToAxis(face)).multiplyScalar(pos);

        this.labels.add(m);
    }
    this.scene.add(this.labels);
    this.shouldShowLabels = true;
};

Cube.prototype.hideLabels = function hideLabels() {
    if (!this.labels) return;
    this.scene.remove(this.labels);
    this.labels = null;
    this.shouldShowLabels = false;
};


Cube.prototype._alignCubies = function _alignCubies() {
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            for (var k = 0; k < this.size; k++) {
                this.cubies[i][j][k].roundRotation();
                this.cubies[i][j][k].coords.set(i, j, k);
                this.cubies[i][j][k].position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing)
                );
            }
        }
    }
};

var layerNumber = 0;
Cube.prototype._onKeyPress = function onKeyPress(e) {
    var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which);
    if (key >= 0 && key <= 9) {
        layerNumber = Math.min(this.size-1,key);
    }

    var cw = key.toUpperCase() === key ^ key.shiftKey;
    var face = util.charToFace(key);

    //    console.log("ctrl: ", key.ctrlKey, "face: ", face);
    if (key.ctrlKey && face) {
        e.preventDefault();
        this.lookAtFace(face);
    }

    var layer = (face == Face.FRONT || face == Face.LEFT || face == Face.DOWN)
    ? layerNumber
    : this.size -1 - layerNumber;

    if (face) {
        layerNumber = 0;
        this._enqueueAnimation(new Animation(cw ? face : -face, [layer]));
    } else {
        var axis = util.charToAxis(key);
        var layers = []; for (var i = 0; i < this.size; i++) layers.push(i);
        if (axis) {
            this._enqueueAnimation(new Animation(cw ? axis : -axis, layers));
        }
    }
};

Cube.prototype.algorithm = function algorithm(algorithm) {
    var moves = algorithm.split(" ");
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        var p = 0;
        // process number
        // TODO
        // process letter
        var c = move.charAt(p++);
        var face = util.charToFace(c);
        if (!face) throw "Invalid move: " + c;
        var cw = c == c.toUpperCase(); // uppercase letter is clockwise
        // process prime (inverts turn direction)
        c = move.charAt(p++);
        if (c == "'") {
            cw = !cw;
        }
        var layer = (face == Face.FRONT || face == Face.LEFT || face == Face.DOWN)
        ? layerNumber
        : this.size -1 - layerNumber;
        var layers = [layer];

        this._enqueueAnimation(new Animation(cw ? face: -face, layers), false);
    }
}


function Animation(axis, layers) {
    this.targetAngle = (PI/2);
    this.angle = 0;
    this.axisVector = util.faceToAxis(axis);
    this.axisVector.multiplyScalar(-1);

    this.axis = axis;
    this.layers = layers;
}

// Returns true if this animation is the opposite of anim,
// That is, if this and anim were queued one after the other
// the state after the animation would be the same as the current state
Animation.prototype.cancels = function cancels(anim) {
    return this.axis + anim.axis == 0
    && util.deepArrayEquals(this.layers.sort(), anim.layers.sort());
};

Animation.prototype.equals = function equals(anim) {
    return this.axis == anim.axis
    && util.deepArrayEquals(this.layers.sort(), anim.layers.sort());
};

Cube.prototype._enqueueAnimation = function _enqueueAnimation(anim, optimize) {
    this.anim.queue.push(anim);
    if (this.shouldOptimizeQueue && optimize !== false) {
        this._optimizeQueue();
    }
};

Cube.prototype._startAnimation = function _startAnimation(animation) {
    this.anim.current = animation;
    this.active.rotation.set(0, 0, 0);
    this.active.updateMatrixWorld();
    this._addLayersToActiveGroup(this.anim.current.axis, this.anim.current.layers);
    this.anim.start = this.clock.getElapsedTime();
    this.anim.animating = true;
};

Cube.prototype._updateAnimation = function _updateAnimation() {

    var dt = (this.clock.getElapsedTime() - this.anim.start);
    var dur = this.anim.currDuration / 1000;
    var pct = dt / dur;
    if (pct > 1.0) {
        pct = 1.0;
        this.anim.animating = false;
    }
    pct = this.anim.interpolator(pct);

    var angle = (PI/2) * pct;

    this.active.rotation.x = angle * this.anim.current.axisVector.x;
    this.active.rotation.y = angle * this.anim.current.axisVector.y;
    this.active.rotation.z = angle * this.anim.current.axisVector.z;

    if (!this.anim.animating) this._onAnimationEnd();
};

Cube.prototype._onAnimationEnd = function _onAnimationEnd() {
    this.active.updateMatrixWorld();

    // Re-add items to the scene
    while (this.active.children.length > 0) {
        var child = this.active.children[0];
        child._rotateStickers(this.anim.current.axis);
        sceneutils.detach(child, this.active, this.scene);
    }
    this._updateCubiesRotation();
    this._alignCubies();
    this.anim.animating = false;

    if (this.moveCompleteListener) this.moveCompleteListener();
};

Cube.prototype._updateCubiesRotation = function _updateCubiesRotation() {
    var axis = this.anim.current.axis;
    var userCw = this.anim.current.axis > 0;
    var layers = this.anim.current.layers;
    for (var i = 0; i < layers.length; i++) {
        util.rotateLayer(this.cubies, axis, layers[i], userCw);
    }
};



// If layers is not provided, all are selected
Cube.prototype._addLayersToActiveGroup = function _addLayersToActiveGroup(face, layers) {
    for (var i = 0; i < layers.length; i++) {
        this._addLayerToActiveGroup(face, layers[i]);
    }
};

Cube.prototype._addLayerToActiveGroup = function addLayerToActiveGroup(face, layer) {
    if (layer == null) { layer = 0; }
    if (layer < 0 || layer >= this.size) throw "Invalid layer: "+ layer;
    var x, y, z;;
    x = y = z = -1;
    switch (face) {
        case Face.LEFT:  case Face.RIGHT: x = layer; break;
        case Face.FRONT: case Face.BACK:  y = layer; break;
        case Face.DOWN:  case Face.UP:    z = layer; break;
    }
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            for (var k = 0; k < this.size; k++) {
                if ((i == x || x == -1) &&
                (j == y || y == -1) &&
                (k == z || z == -1)) {
                    sceneutils.attach(this.cubies[i][j][k], this.scene, this.active);
                }
            }
        }
    }
};


module.exports = {
    defaults: defaults,
    Cube: Cube,
    Animation: Animation,
};
