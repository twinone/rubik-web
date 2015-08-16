var PI = Math.PI;
var DEFAULTS = {
    SIZE : 3,
    CUBIE_WIDTH : 100,
    CUBIE_SPACING : 0.07, // in terms of CUBIE_WIDTH // TODO: Add stickers, change this to 0
    LABEL_MARGIN : 0.5, // in terms of CUBIE_WIDTH * CUBE_SIZE
    ANIMATION_DURATION : 200 // ms
};

var COLOR = {
    RED : 0xC41E3A,
    GREEN : 0x009E60,
    BLUE : 0x0051BA,
    ORANGE : 0xFF5800,
    YELLOW : 0xFFD500,
    WHITE : 0xFFFFFF,
    BLACK : 0x000000,
    LABEL : 0x88004D40,
    BACKGROUND : 0xFFFFFF,
    CUBE : 0x0
};

var FACE = {
    RIGHT : 1, LEFT : -1,
    BACK : 2, FRONT : -2,
    UP : 3, DOWN: -3
};

var FACES = [FACE.RIGHT, FACE.BACK, FACE.UP, FACE.LEFT, FACE.FRONT, FACE.DOWN];

var AXIS = {
    X : FACE.RIGHT,
    Y : FACE.BACK,
    Z : FACE.UP,
    CUBE_X : FACE.RIGHT,
    CUBE_Y : FACE.UP,
    CUBE_Z : FACE.FRONT
};

var ORIGIN = new THREE.Vector3(0, 0, 0);

var ROTATION_MATRIX = [
    [FACE.UP,   FACE.BACK,   FACE.DOWN,   FACE.FRONT], // X
    [FACE.UP,    FACE.RIGHT,  FACE.DOWN,   FACE.LEFT], // Y
    [FACE.FRONT, FACE.RIGHT,  FACE.BACK,   FACE.LEFT] // Z
];

var Cube = function () {
    this.dt = 0,
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.canvas = document.getElementById("canvas");
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });

    this.animationFrameId = null;
    
    this.size = DEFAULTS.SIZE;
    this.cubieWidth = DEFAULTS.CUBIE_WIDTH;
    this.cubieSpacing = DEFAULTS.CUBIE_SPACING;
    this.labelMargin = DEFAULTS.LABEL_MARGIN;
    
    this.cubies = [];
    this.active = null; // init
    this.labels = null;
    this.axis = new THREE.Object3D();
    this.shouldShowLabels = false;
    
    this.anim = {
        duration : DEFAULTS.ANIMATION_DURATION,
        animating : false,
        current : null,
        queue : [],
        start : null
    };
    
    this.isInitialized = false;
};

Cube.prototype.scramble = function scramble() {
    var turns = (this.size -1) * 10;
    
    for (var i = 0; i < turns; i++) {
        var face = randFace();
        var layer = randInt(0, this.size-1);
        var anim = new Animation(face, [layer]);
        this._enqueueAnimation(anim);
    }
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFace() {
    return FACES[randInt(0, 5)];
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
}
Cube.prototype.width = function() {
    return this.cubieWidth * (1 + this.cubieSpacing)
        * this.SIZE - this.cubieWidth * this.cubieSpacing;
};

Cube.prototype._setupCubies = function() {
    var cubieGeometry = new THREE.BoxGeometry(this.cubieWidth, this.cubieWidth, this.cubieWidth);
    
    for (var i = 0; i < this.size; i++) {
        this.cubies[i] = [];
        for (var j = 0; j < this.size; j++) {
            this.cubies[i][j] = [];
            for (var k = 0; k < this.size; k++) {
                var cubie = new THREE.Mesh(cubieGeometry, this._getFaceMaterial(i, j, k));
                cubie.origX = i;
                cubie.origY = j;
                cubie.origZ = k;
                this.cubies[i][j][k] = cubie;
                cubie.position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing)
                );
                this.scene.add(cubie);
            }
        }
    }   
}

Cube.prototype.init = function init() {
    this._init();
}

Cube.prototype._init = function _init() {
    var self = this;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

    this.keyPressListener = function(e) {
        self._onKeyPress(e);
    }
    window.addEventListener('keypress', this.keyPressListener);
    
    this.resizeListener = function(e) {
        self._onResize(e);   
    }
    window.addEventListener('resize', this.resizeListener);
    
    this.renderer.setClearColor(COLOR.BACKGROUND);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.active = new THREE.Object3D()
    this.scene.add(this.active);
    this._setupCubies();
    
    if (this.shouldShowLabels) {
        this.showLabels();
    }
    
    var camPos = this.cubieWidth* (1+this.cubieSpacing) * this.size/2 * 4;
    this.camera.position.set(-camPos, -camPos, camPos);
    this.camera.up.set(0,0,1);
    this.camera.lookAt(ORIGIN);
    
    new THREE.OrbitControls(this.camera);
        
   
    
    function render () {
        self.dt = self.clock.getDelta();
        self.animationFrameId = requestAnimationFrame(render);

        self._updateLabelOrientation();
        
        if (self.anim.animating) {
            self._updateAnimation();
        } else if (self.anim.queue.length != 0) {
            self.anim.duration = DEFAULTS.ANIMATION_DURATION * 
                Math.max(0.3, Math.pow(0.9, self.anim.queue.length/2));
            self._startAnimation(self.anim.queue.shift());
        }
        self.renderer.render(self.scene, self.camera);
    }
    
    render();
    
    this.isInitialized = true;
}

Cube.prototype.width = function width() {
    return (1+this.cubieSpacing) * this.cubieWidth * this.size;
}

Cube.prototype.destroy = function destroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.renderer.domElement.addEventListener('dblclick', null, false);
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.labels = null;
    empty(this.active);
    this.active = null;
    this.anim.queue = [];
    empty(this.cubies);
    this.anim.animating = false;
    window.removeEventListener('keypress', this.keyPressListener);
    window.removeEventListener('resize', this.resizeListener);
}


Cube.prototype._onResize = function _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
}


function empty(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
}

Cube.prototype._getFaceMaterial = function _getFaceMaterial(x, y, z) {
    var d = new THREE.MeshBasicMaterial({color: COLOR.CUBE});
    var s = this.size -1;
    var materials = [
        // R L B F U D
        x == s ? getColorMaterial(COLOR.GREEN) : d,
        x == 0 ? getColorMaterial(COLOR.BLUE) : d,
        y == s ? getColorMaterial(COLOR.ORANGE) : d,
        y == 0 ? getColorMaterial(COLOR.RED) : d,
        z == s ? getColorMaterial(COLOR.YELLOW) : d,
        z == 0 ? getColorMaterial(COLOR.WHITE) : d
    ];
    return new THREE.MeshFaceMaterial(materials);
}

function getColorMaterial(color) {
    return new THREE.MeshBasicMaterial(
        {color:color, side: THREE.FrontSide}
    );
}


Cube.prototype._updateLabelOrientation = function _updateLabelOrientation() {
    if (!this.labels) return;
    for (var i = 0; i < this.labels.children.length; i++) {
        this.labels.children[i].lookAt(this.camera.position);
        this.labels.children[i].up = this.camera.up;
    }
}
function showAxis() {
    var s = this.cubieWidth * CUBE.SIZE / 2;
    var axisHint = new THREE.Object3D();
    axisHint.add(makeLine(new THREE.Vector3(s, 0, 0), COLOR.RED));
    axisHint.add(makeLine(new THREE.Vector3(0, s, 0), COLOR.GREEN));
    axisHint.add(makeLine(new THREE.Vector3(0, 0, s), COLOR.BLUE));
    
    var s = this.cubieWidth* (1+this.cubieSpacing) * CUBE.SIZE/2;
    axisHint.position.set(-s, -s, -s);

    scene.add(axisHint);
}


Cube.prototype.toggleLabels = function toggleLabels() {
    if (this.labels) this.hideLabels();
    else this.showLabels();
}

Cube.prototype.showLabels = function showLabels() {
    this.hideLabels(); // cleanup if they're there already
    this.labels = new THREE.Object3D();
    var pos = this.width()/2 + this.labelMargin * this.cubieWidth * this.size;
    var s = this.width() / 5;
    for (var i = 0; i < FACES.length; i++) {
        var face = FACES[i];
        var shape = THREE.FontUtils.generateShapes(faceToChar(face), {size: s});
        var geo = new THREE.ShapeGeometry(shape);
        var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLOR.LABEL }));    
        m.position.copy(getAxisVectorFromFace(face)).multiplyScalar(pos);
        
        this.labels.add(m);
    }
    this.scene.add(this.labels);
    this.shouldShowLabels = true;
}

Cube.prototype.hideLabels = function hideLabels() {
    if (!this.labels) return;
    this.scene.remove(this.labels);
    this.labels = null;
    this.shouldShowLabels = false;
}


Cube.prototype._alignCubies = function _alignCubies() {
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            for (var k = 0; k < this.size; k++) {
                this.cubies[i][j][k].position.set(
                    (i-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (j-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing),
                    (k-(this.size-1)/2) * this.cubieWidth*(1+this.cubieSpacing));
                roundRotation(this.cubies[i][j][k]);
            }
        }
    }   
}

function roundRotation(cubie) {
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
    
    var layer = (face == FACE.FRONT || face == FACE.LEFT || face == FACE.DOWN) ? layerNumber : this.size -1 - layerNumber;
    if (face !== null) {
        layerNumber = 0;
        this._enqueueAnimation(new Animation(cw ? face: -face,[layer]));
    }
}
            
function charToFace(letter) {
    switch (letter.toUpperCase()) {
        case 'U': return FACE.UP;        case 'D': return FACE.DOWN;
        case 'L': return FACE.LEFT;      case 'R': return FACE.RIGHT;
        case 'B': return FACE.BACK;      case 'F': return FACE.FRONT;
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

Cube.prototype._enqueueAnimation = function _enqueueAnimation(anim) {
    this.anim.queue.push(anim);
}

Cube.prototype._startAnimation = function _startAnimation(animation) {
    this.anim.current = animation;
    this.active.rotation.set(0, 0, 0);
    this.active.updateMatrixWorld();
    this._addLayersToActiveGroup(this.anim.current.axis, this.anim.current.layers);
    this.anim.start = this.clock.getElapsedTime();
    this.anim.animating = true;
}

Cube.prototype._updateAnimation = function _updateAnimation() {
    
    var dt = (this.clock.getElapsedTime() - this.anim.start);
    var dur = this.anim.duration / 1000;
    var pct = dt / dur;
    
    var angle = (PI/2) * pct;
    if (angle > PI/2) {
        angle = PI/2;
        this.anim.animating = false;
    }
    console.log(angle + " of " + PI/2);
    this.active.rotation.x = angle * this.anim.current.axisVector.x;
    this.active.rotation.y = angle * this.anim.current.axisVector.y;
    this.active.rotation.z = angle * this.anim.current.axisVector.z;
    
    if (!this.anim.animating) this._onAnimationEnd();
}

Cube.prototype._onAnimationEnd = function _onAnimationEnd() {
    console.log("anim end");
    // Re-add items to the scene
    while (this.active.children.length > 0) {
        var child = this.active.children[0];
        THREE.SceneUtils.detach(child, this.active, this.scene);
    }
    this._updateCubiesRotation();
    this._alignCubies();
    this.anim.animating = false;
}

Cube.prototype._updateCubiesRotation = function _updateCubiesRotation() {
    var axis = this.anim.current.axis;
    var userCw = this.anim.current.axis > 0;
    var layer = this.anim.current.layers[0];
    this._rotateLayer(axis, layer, userCw);
}

Cube.prototype._rotateLayer = function _rotateLayer(axis, layer, cw) {
    if (Math.abs(axis) == AXIS.X) this._rotateLayerX(layer, cw);
    if (Math.abs(axis) == AXIS.Y) this._rotateLayerY(layer, cw);
    if (Math.abs(axis) == AXIS.Z) this._rotateLayerZ(layer, cw);
}

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
}

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
}

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
}

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
}

Cube.prototype._addLayerToActiveGroup = function addLayerToActiveGroup(face, layer) {
    if (layer == null) { layer = 0; }
    if (layer < 0 || layer >= this.size) throw "Invalid layer: "+ layer;
    var x, y, z;;
    x = y = z = -1;
    switch (face) {
        case FACE.LEFT:  case FACE.RIGHT: x = layer; break;
        case FACE.FRONT: case FACE.BACK:  y = layer; break;
        case FACE.DOWN:  case FACE.UP:    z = layer; break;
    }
    for (var i = 0; i < this.size; i++) {
        for (var j = 0; j < this.size; j++) {
            for (var k = 0; k < this.size; k++) {
                if ((i == x || x == -1) &&
                    (j == y || y == -1) &&
                    (k == z || z == -1)) {
                    THREE.SceneUtils.attach(this.cubies[i][j][k], this.scene, this.active);
                }
            }
        }
    }
}

function getFaceColor(face) {
    switch (face) {
        case RIGHT: return COLOR.GREEN;     case LEFT:  return COLOR.BLUE;
        case UP:    return COLOR.YELLOW;    case DOWN:  return COLOR.WHITE;
        case FRONT: return COLOR.RED;       case BACK:  return COLOR.ORANGE;
    }
}

function getFaceAxis(face) {
    if (face == LEFT  || face == RIGHT) return AXIS.X;
    if (face == FRONT || face == BACK)  return AXIS.Y;
    if (face == DOWN  || face == UP)    return AXIS.Z;
}


function faceToChar(face) {
    return faceToString(face)[0];   
}
function faceToString(face) {
    switch (face) {
        case FACE.FRONT: return 'FRONT'; case FACE.BACK:  return 'BACK';
        case FACE.UP:    return 'UP';    case FACE.DOWN:  return 'DOWN';
        case FACE.LEFT:  return 'LEFT';  case FACE.RIGHT: return 'RIGHT';
    }
}
function getAxisVectorFromFace(face) {
    var x, y, z;
    x = y = z = 0;
    switch (face) {
        case FACE.LEFT:  x = -1; break; case FACE.RIGHT:x = 1; break;
        case FACE.FRONT: y = -1; break; case FACE.BACK: y = 1; break;
        case FACE.DOWN:  z = -1; break; case FACE.UP:   z = 1; break;
    }
    return new THREE.Vector3(x, y, z);
}

Cubie.prototype = THREE.Mesh.prototype;
Cubie.constructor = Cubie;

function Cubie() {
    
}

function axisToIndex(axis) {
    if (axis == AXIS.X) return 0;
    if (axis == AXIS.Y) return 1;
    if (axis == AXIS.Z) return 2;
    
}

function updateCubieStickerRotation(cubie, axis, cw) {
    var idx = axisToIndex(axis);
    
}


