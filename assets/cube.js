var THREE = require("./vendor/three");
var orbitcontrols = require("./orbitcontrols");
var OrbitControls = orbitcontrols.OrbitControls;
var sceneutils = require("./vendor/sceneutils");
require("./vendor/helvetiker.min.js");
require("./vendor/projector.js");

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
    [Face.UP,   Face.BACK,   Face.DOWN,   Face.FRONT], // X
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
    this.labelMargin = options.labelMargin || defaults.labelMargin;
    
    this.colors = Object.create(defaults.colors);
    if (options.colors)
        Object.keys(options.colors).forEach(function(key) {
            this.colors[key] = options.colors[key];
        });
    
    this.cubiesObject = null;
    this.cubies = [];
    this.active = null; // init
    this.labels = null;
    this.axis = new THREE.Object3D();
    
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
    this.anim.interpolator = getActualInterpolator(this.anim.interpolator);
    
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

function getActualInterpolator(interpolator) {
    if (typeof interpolator === "string") {
        if (!(interpolator in interpolators))
             throw new Error("Invalid interpolator name given");
        interpolator = interpolators[interpolator]();
    }
    
    if (!interpolation.check(interpolator))
        throw new Error("the interpolator is expected to be a valid function or string");

    return interpolator;
}

Cube.prototype.setInterpolator = function setInterpolator(interpolator) {
    this.anim.interpolator = getActualInterpolator(interpolator);
}

Cube.prototype._setupCamera = function _setupCamera() {
    var camPos = this.cubieWidth* (1+this.cubieSpacing) * this.size/2 * 4;
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
    
	var ray = new THREE.Raycaster(this.camera.position,
                                  vector.sub(this.camera.position).normalize());

	// cubies
	var intersects = ray.intersectObjects(this.cubiesObject.children);
    if (intersects.length > 0) {

        var elem = intersects[0];
        // determine if we hit a cubie
        // probably yes, since we only ask for intersection with cubies
        if (!elem.object.hasOwnProperty("coords")) { console.log("Intersected with non-cubie"); return; }
        
        this._onCubieDragStart(elem.object.coords, elem.face.normal);
    }                
    // labels
    if (this.showLabels) {
        // intersects = ray.intersectObjects(this.labels.children);
            
        // TODO put labels in a container
        // Clicking only the letter is very difficult
    }
    
    
}

Cube.prototype._onCubieDragStart = function _onCubieDragStart(coords, direction) {
    console.log("onCubieDragStart coords=", coords, " normal=", direction);
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

Cube.prototype._optimizeQueue = function _optimizeQueue() {
    var q = this.anim.queue;
    var count = q.length;
    // Remove all consecutive oposite moves
    var found = true; // enter the loop
2. 
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
                var cubie = new THREE.Mesh(cubieGeometry, this._getFaceMaterial(i, j, k, map));
                cubie.origCoords = new THREE.Vector3(i, j, k);
                cubie.coords = new THREE.Vector3(i, j, k);
                cubie.up.set(0, 0, 1);
                this.cubies[i][j][k] = cubie;
                this.cubiesObject.add(cubie);
                cubie.position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing)
                );
            }
        }
    }   
    this.scene.add(this.cubiesObject);
};

Cube.prototype.init = function init() {
    this._init();
};

Cube.prototype._init = function _init() {
    var self = this;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

    this.projector = new THREE.Projector();
   
    this.resizeListener = function(e) {
        self._onResize(e);   
    }
    window.addEventListener('resize', this.resizeListener);
    
    this.renderer.setClearColor(this.colors.background);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.active = new THREE.Object3D();
    this.scene.add(this.active);
    this.cubiesObject = new THREE.Object3D();
    this.scene.add(this.cubiesObject);
    
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
    window.addEventListener('keypress', this.keyPressListener);
    
   
    
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
    empty(this.active);
    empty(this.cubies);
    empty(this.cubiesObject);
    this.anim.queue = [];
    this.anim.animating = false;
    
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDownListener);
    window.removeEventListener('keypress', this.keyPressListener);
    window.removeEventListener('resize', this.resizeListener);
};


Cube.prototype._onResize = function _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
};

Cube.prototype._getFaceMaterial = function _getFaceMaterial(x, y, z, map) {
    var wf = this.wireframe;
    var d = new THREE.MeshBasicMaterial({
        color: this.colors.cube,
        wireframe: wf,
        wireframeLinewidth: 2
    });
    var s = this.size -1;
    var materials = [
        // R L B F U D
        x == s ? getStickerMaterial(this.colors.faceRight, map, wf) : d,
        x == 0 ? getStickerMaterial(this.colors.faceLeft, map, wf) : d,
        y == s ? getStickerMaterial(this.colors.faceBack, map, wf) : d,
        y == 0 ? getStickerMaterial(this.colors.faceFront, map, wf) : d,
        z == s ? getStickerMaterial(this.colors.faceUp, map, wf) : d,
        z == 0 ? getStickerMaterial(this.colors.faceDown, map, wf) : d
    ];
    return new THREE.MeshFaceMaterial(materials);
};

function getStickerMaterial(color, map, wireframe) {
    return new THREE.MeshBasicMaterial({
        color: color,
        map: map,
        wireframe: wireframe,
        wireframeLinewidth: 2,
        side: THREE.FrontSide
    });
}


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
        var shape = THREE.FontUtils.generateShapes(faceToChar(face), {size: s});
        var geo = new THREE.ShapeGeometry(shape);
        var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: this.colors.label }));    
        m.position.copy(getAxisVectorFromFace(face)).multiplyScalar(pos);
        
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

// Sets the cubie's position in the scene according to it's position in the matrix
Cube.prototype._setCubiePosition = function _setCubiePosition(x, y, z) {
    this.cubies[x][y][z].position.set()
}

Cube.prototype._alignCubies = function _alignCubies() {
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            for (var k = 0; k < this.size; k++) {
                roundRotation(this.cubies[i][j][k]);

                this.cubies[i][j][k].position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing));
            }
        }
    }   
};

function roundRotation(cubie) {
    var rot = cubie.rotation;
    cubie.rotation.x = intRound(mod(cubie.rotation.x, PI*2), PI/2);
    cubie.rotation.y = intRound(mod(cubie.rotation.y, PI*2), PI/2);
    cubie.rotation.z = intRound(mod(cubie.rotation.z, PI*2), PI/2);
}
function mod(a, b) {
    var m = a % b;
    if (m < 0) m += b;
    return m;
}
function intRound(what, to) {
    var res = what + to/2 - (what+to/2) % to;
    return res;   
}

var layerNumber = 0;
Cube.prototype._onKeyPress = function onKeyPress(e) {
    var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which);
    if (key >= 0 && key <= 9) {
        layerNumber = Math.min(this.size-1,key);
    }
    
    var cw = key.toUpperCase() === key ^ key.shiftKey;
    var face = charToFace(key);
    
    var layer = (face == Face.FRONT || face == Face.LEFT || face == Face.DOWN) ? layerNumber : this.size -1 - layerNumber;
    if (face !== null) {
        layerNumber = 0;
        this._enqueueAnimation(new Animation(cw ? face: -face,[layer]));
    }
};
            
function charToFace(letter) {
    switch (letter.toUpperCase()) {
        case 'U': return Face.UP;        case 'D': return Face.DOWN;
        case 'L': return Face.LEFT;      case 'R': return Face.RIGHT;
        case 'B': return Face.BACK;      case 'F': return Face.FRONT;
    }
    return null;
}


function Animation(axis, layers) {
    this.targetAngle = (PI/2);
    this.angle = 0;
    this.axisVector = getAxisVectorFromFace(axis);
    this.axisVector.multiplyScalar(-1);

    this.axis = axis;
    this.layers = layers;
}

// Returns true if this animation is the opposite of anim,
// That is, if this and anim were queued one after the other
// the state after the animation would be the same as the current state
Animation.prototype.cancels = function cancels(anim) {
    return this.axis + anim.axis == 0
        && deepArrayEquals(this.layers.sort(), anim.layers.sort());
};

Animation.prototype.equals = function equals(anim) {
    return this.axis == anim.axis
        && deepArrayEquals(this.layers.sort(), anim.layers.sort());
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
        sceneutils.detach(child, this.active, this.scene);
    }
    this._updateCubiesRotation();
    this._alignCubies();
    this.anim.animating = false;
};

Cube.prototype._updateCubiesRotation = function _updateCubiesRotation() {
    var axis = this.anim.current.axis;
    var userCw = this.anim.current.axis > 0;
    var layer = this.anim.current.layers[0];
    this._rotateLayer(axis, layer, userCw);
};

Cube.prototype._rotateLayer = function _rotateLayer(axis, layer, cw) {
    if (Math.abs(axis) == Axis.X) this._rotateLayerX(layer, cw);
    if (Math.abs(axis) == Axis.Y) this._rotateLayerY(layer, cw);
    if (Math.abs(axis) == Axis.Z) this._rotateLayerZ(layer, cw);
};

Cube.prototype._rotateLayerX = function _rotateLayerX(layer, cw) {
    var s = this.size;
    var rings = this.size / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = this.size - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(this.cubies, layer,i,i+j,  layer,i+j,s-1-i,   layer,s-1-i, s-1-i-j,   layer,s-1-i-j,i,  cw);
        }
    }
};

Cube.prototype._rotateLayerY = function _rotateLayerY(layer, cw) {
    var s = this.size;
    var rings = this.size / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = this.size - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(this.cubies, i+j,layer,i,   s-i-1,layer,i+j,   s-i-1-j,layer,s-i-1,   i,layer,s-i-1-j,  cw);
        }
    }
};

Cube.prototype._rotateLayerZ = function _rotateLayerZ(layer, cw) {
    var s = this.size;
    var rings = this.size / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = this.size - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(this.cubies, i,i+j,layer,  i+j,s-1-i,layer,  s-1-i,s-1-i-j,layer,  s-1-i-j,i,layer,  cw);
        }
    }
};

function swap4V(mat, v1, v2, v3, v4, cw) {
    swap4(mat, v1[0],v1[1],v1[2], v2[0],v2[1],v2[2], v3[0],v3[1],v3[2], v4[0],v4[1],v4[2], cw);
}

function swap4(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, cw) {
    if (cw) swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
    else swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
}

function swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
    swap4CW(mat, x4,y4,z4, x3,y3,z3, x2,y2,z2, x1,y1,z1);
}

function swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
    tmp = mat[x4][y4][z4];
    mat[x4][y4][z4] = mat[x3][y3][z3];
    mat[x3][y3][z3] = mat[x2][y2][z2];
    mat[x2][y2][z2] = mat[x1][y1][z1];
    mat[x1][y1][z1] = tmp;
}

function makeLine(vec, color) {
    var mat = new THREE.LineBasicMaterial({color:color, linewidth:3});
    var geo = new THREE.Geometry();
    geo.vertices.push(ORIGIN);
    geo.vertices.push(vec);

    var line = new THREE.Line(geo, mat);
    scene.add(line);
    return line;
}


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

function faceToChar(face) {
    return faceToString(face)[0];   
}
function faceToString(face) {
    switch (face) {
        case Face.FRONT: return 'FRONT'; case Face.BACK:  return 'BACK';
        case Face.UP:    return 'UP';    case Face.DOWN:  return 'DOWN';
        case Face.LEFT:  return 'LEFT';  case Face.RIGHT: return 'RIGHT';
    }
}
function getAxisVectorFromFace(face) {
    var x, y, z;
    x = y = z = 0;
    switch (face) {
        case Face.LEFT:  x = -1; break; case Face.RIGHT:x = 1; break;
        case Face.FRONT: y = -1; break; case Face.BACK: y = 1; break;
        case Face.DOWN:  z = -1; break; case Face.UP:   z = 1; break;
    }
    return new THREE.Vector3(x, y, z);
}

Cubie.prototype = Object.create(THREE.Mesh.prototype);
Cubie.prototype.constructor = Cubie;

function Cubie() {
    
}


module.exports = {
    defaults: defaults,
    Cube: Cube,
    Cubie: Cubie,
    Animation: Animation,
};


function empty(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
}

function deepArrayEquals(a, b) {
    // if any array is a falsy value, return
    if (!a || !b)
        return false;

    // compare lengths - can save a lot of time 
    if (a.length != b.length)
        return false;

    for (var i = 0, l = a.length; i < l; i++) {
        // Check if we have nested arrays
        if (a[i] instanceof Array && b[i] instanceof Array) {
            // recurse into the nested arrays
            if (!deepArrayEquals(a[i], b[i]))
                return false;
        }
        else if (a[i] != b[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
