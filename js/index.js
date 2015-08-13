// Number of cubies per axis of this Rubik's cube
var CUBE_SIZE = 4;

var CUBIE_WIDTH = 100;
var CUBIE_SPACING = 0.07; // in terms of CUBIE_WIDTH
var LABEL_MARGIN = 0.5; // in terms of CUBIE_WIDTH * CUBE_SIZE

// Time in ms that it should take to rotate a face 90 degrees
var ANIMATION_DURATION = 200;


var COLOR_RED = 0xC41E3A;
var COLOR_GREEN = 0x009E60;
var COLOR_BLUE = 0x0051BA;
var COLOR_ORANGE = 0xFF5800;
var COLOR_YELLOW = 0xFFD500;
var COLOR_WHITE = 0xFFFFFF;
var COLOR_BLACK = 0x000000;

var COLOR_LABEL = 0x88004D40
var COLOR_BACKGROUND = COLOR_WHITE;
var CUBE_COLOR = COLOR_WHITE;


var RIGHT = 1;
var BACK = 2;
var UP = 3;
var LEFT = -RIGHT;
var FRONT = -BACK;
var DOWN = -UP;
var MIDDLE = 4;
var STANDING = 5;
var EQUATOR = 6;

var AXIS_X = RIGHT;
var AXIS_Y = BACK;
var AXIS_Z = UP;

var CUBE_X = RIGHT;
var CUBE_Y = UP;
var CUBE_Z = FRONT;

var ROTATION_MATRIX = [[UP,    BACK,   DOWN,   FRONT], // X
                [UP,    RIGHT,  DOWN,   LEFT], // Y
                [FRONT, RIGHT,  BACK,   LEFT]]; // Z

var ORIGIN = new THREE.Vector3(0, 0, 0);

var scene, camera, renderer, clock;

var cubies = [];

var active = new THREE.Object3D();

var animQueue = [];
var animating = false;
var currentAnim;

var labels = new THREE.Object3D();


function init() {
    window.onkeypress = onKeyPress;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
    clock = new THREE.Clock();
    

    
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(COLOR_BACKGROUND);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var cubieGeometry = new THREE.BoxGeometry(CUBIE_WIDTH, CUBIE_WIDTH, CUBIE_WIDTH);

    
    // Set up our cubies
    for (var i = 0; i < CUBE_SIZE; i++) {
        cubies[i] = [];
        for (var j = 0; j < CUBE_SIZE; j++) {
            cubies[i][j] = [];
            for (var k = 0; k < CUBE_SIZE; k++) {
                var cubie = new THREE.Mesh(cubieGeometry, getFaceMaterial(i, j, k));
                cubie.origX = i;
                cubie.origY = j;
                cubie.origZ = k;
                cubies[i][j][k] = cubie;
                cubie.position.set((i-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING),
                                   (j-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING),
                                   (k-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING));
                scene.add(cubie);
            }
        }
    }
    
    
    scene.add(active);
    
    showAxis();
    showLabels();
    
    var camPos = CUBIE_WIDTH* (1+CUBIE_SPACING) * CUBE_SIZE/2 * 4;
    camera.position.set(-camPos, -camPos, camPos);
    camera.up.set(0,0,1);
    camera.lookAt(ORIGIN);
    
    new THREE.OrbitControls(camera);
    
    var dt = 0;
    
    function render() {
        dt = clock.getDelta();
        requestAnimationFrame(render);
        
        updateLabelOrientation();
        
        if (animating) {
            updateAnimation(dt);
        } else if (animQueue.length != 0) {
            startAnimation(animQueue.shift());
        }        
        renderer.render(scene, camera);
    }
    render();
}

init();

function updateLabelOrientation() {
    for (var i = 0; i < labels.children.length; i++) {
        labels.children[i].lookAt(camera.position);
        labels.children[i].up = camera.up;
    }
}
function showAxis() {
    var s = CUBIE_WIDTH * CUBE_SIZE / 2;
    var axisHint = new THREE.Object3D();
    axisHint.add(makeLine(new THREE.Vector3(s, 0, 0), COLOR_RED));
    axisHint.add(makeLine(new THREE.Vector3(0, s, 0), COLOR_GREEN));
    axisHint.add(makeLine(new THREE.Vector3(0, 0, s), COLOR_BLUE));
    
    var s = CUBIE_WIDTH* (1+CUBIE_SPACING) * CUBE_SIZE/2;
    axisHint.position.set(-s, -s, -s);

    scene.add(axisHint);
}


function showLabels() {
    labels.add(makeLabel(LEFT));
    labels.add(makeLabel(RIGHT));
    labels.add(makeLabel(UP));
    labels.add(makeLabel(DOWN));
    labels.add(makeLabel(FRONT));
    labels.add(makeLabel(BACK));
    
    scene.add(labels);
}

function makeLabel(face) {
    var s = CUBIE_WIDTH * CUBE_SIZE/2 + LABEL_MARGIN*CUBIE_WIDTH*CUBE_SIZE;
    var lab = makeText(faceToChar(face), COLOR_LABEL);
    lab.position.copy(getAxisVectorFromFace(face)).multiplyScalar(s);
    return lab;
}


function alignCubies() {
    for (var i = 0; i < CUBE_SIZE; i++) {
        for (var j = 0; j < CUBE_SIZE; j++) {
            for (var k = 0; k < CUBE_SIZE; k++) {
                cubies[i][j][k].position.set(
                    (i-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING),
                    (j-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING),
                    (k-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*(1+CUBIE_SPACING));
                roundRotation(cubies[i][j][k]);
            }
        }
    }   
}

function roundRotation(cubie) {
    cubie.rotation.x = intRound(mod(cubie.rotation.x, Math.PI*2), Math.PI/2);
    cubie.rotation.y = intRound(mod(cubie.rotation.y, Math.PI*2), Math.PI/2);
    cubie.rotation.z = intRound(mod(cubie.rotation.z, Math.PI*2), Math.PI/2);
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
function onKeyPress(e) {
    var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which);
    if (key >= 0 && key <= 9) {
        layerNumber = Math.min(CUBE_SIZE-1,key);
    }
    
    var cw = key.toUpperCase() === key ^ key.shiftKey;
    var face = charToFace(key);
    
    var layer = (face == FRONT || face == LEFT || face == DOWN) ? layerNumber : CUBE_SIZE -1 - layerNumber;
    if (face != undefined) {
        layerNumber = 0;
        enqueueAnimation(new Animation((Math.PI/2), cw ? face: -face,[layer]));
    }
}
            
function charToFace(letter) {
    switch (letter.toUpperCase()) {
        case 'U': return UP;        case 'D': return DOWN;
        case 'L': return LEFT;      case 'R': return RIGHT;
        case 'B': return BACK;      case 'F': return FRONT;
    }
    return undefined;
}


function Animation(targetAngle, axis, layers) {
    this.targetAngle = targetAngle;
    this.angle = 0;
    this.axisVector = getAxisVectorFromFace(axis);
    this.axisVector.multiplyScalar(-1);

    this.axis = axis;
    this.layers = layers;
}

function enqueueAnimation(anim) {
    animQueue.push(anim);
}

function startAnimation(animation) {
    currentAnim = animation;
    active.rotation.set(0, 0, 0);
    active.updateMatrixWorld();
    addLayersToActiveGroup(currentAnim.axis, currentAnim.layers);
    animating = true;
}

function updateAnimation(dt) {
    var dr = dt * (Math.PI/2) / (ANIMATION_DURATION / 1000.0);
    currentAnim.angle += dr;
    if (currentAnim.angle >= currentAnim.targetAngle) {
        dr -= currentAnim.angle - currentAnim.targetAngle;
        animating = false;
    }
    active.rotateOnAxis(currentAnim.axisVector, dr);
    if (!animating) onAnimationEnd();
}

function onAnimationEnd() {
    // Re-add items to the scene
    while (active.children.length > 0) {
        var child = active.children[0];
        THREE.SceneUtils.detach(child, active, scene);
    }
    updateCubiesRotation();
    alignCubies();
    animating = false;
}

// Rotate front face clockwise

function updateCubiesRotation() {
    var axis = currentAnim.axis;
    var userCw = currentAnim.axis > 0;
    var layer = currentAnim.layers[0];
    rotateLayer(axis, layer, userCw);
}

function rotateLayer(axis, layer, cw) {
    if (Math.abs(axis) == AXIS_X) rotateLayerX(layer, cw);
    if (Math.abs(axis) == AXIS_Y) rotateLayerY(layer, cw);
    if (Math.abs(axis) == AXIS_Z) rotateLayerZ(layer, cw);
}

function rotateLayerX(layer, cw) {
    var s = CUBE_SIZE;
    var rings = CUBE_SIZE / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = CUBE_SIZE - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(cubies, layer,i,i+j,  layer,i+j,s-1-i,   layer,s-1-i, s-1-i-j,   layer,s-1-i-j,i,  cw);
        }
    }
}

function rotateLayerY(layer, cw) {
    var s = CUBE_SIZE;
    var rings = CUBE_SIZE / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = CUBE_SIZE - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(cubies, i+j,layer,i,   s-i-1,layer,i+j,   s-i-1-j,layer,s-i-1,   i,layer,s-i-1-j,  cw);
        }
    }
}

function rotateLayerZ(layer, cw) {
    var s = CUBE_SIZE;
    var rings = CUBE_SIZE / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = CUBE_SIZE - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(cubies, i,i+j,layer,  i+j,s-1-i,layer,  s-1-i,s-1-i-j,layer,  s-1-i-j,i,layer,  cw);
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
/*
    console.log("("+x1+","+y1+","+z1+") -> ("+x2+","+y2+","+z2+") ->"+
               " ("+x3+","+y3+","+z3+") -> ("+x4+","+y4+","+z4+")");
*/
}

function makeText(text, color) {
    var textShapes = THREE.FontUtils.generateShapes(text);
    var text = new THREE.ShapeGeometry(textShapes);
    var textMesh = new THREE.Mesh(text, new THREE.MeshBasicMaterial({ color: color })) ;
    scene.add(textMesh);
    return textMesh;
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

function addLayersToActiveGroup(face, layers) {
    for (var i = 0; i < layers.length; i++) {
        addLayerToActiveGroup(face, layers[i]); 
    }
}

function addLayerToActiveGroup(face, layer) {
    if (layer == undefined) { layer = 0; }
    if (layer < 0 || layer >= CUBE_SIZE) throw "Invalid layer";
    var x, y, z;;
    x = y = z = -1;
    switch (face) {
        case LEFT:  case RIGHT: x = layer; break;
        case FRONT: case BACK:  y = layer; break;
        case DOWN:  case UP:    z = layer; break;
    }
    for (var i = 0; i < CUBE_SIZE; i++) {
        for (var j = 0; j < CUBE_SIZE; j++) {
            for (var k = 0; k < CUBE_SIZE; k++) {
                if ((i == x || x == -1) &&
                    (j == y || y == -1) &&
                    (k == z || z == -1)) {
                    THREE.SceneUtils.attach(cubies[i][j][k], scene, active);
                }
            }
        }
    }
}

function getFaceColor(face) {
    switch (face) {
        case RIGHT: return COLOR_GREEN;     case LEFT:  return COLOR_BLUE;
        case UP:    return COLOR_YELLOW;    case DOWN:  return COLOR_WHITE;
        case FRONT: return COLOR_RED;       case BACK:  return COLOR_ORANGE;
    }
}
function getFaceMaterial(x, y , z) {
    var def = new THREE.MeshBasicMaterial({color: CUBE_COLOR});
    var materials = [
        ((x == CUBE_SIZE - 1) ? new THREE.MeshBasicMaterial({color: COLOR_GREEN}) : def), // R
        ((x==0) ? new THREE.MeshBasicMaterial({color: COLOR_BLUE}) : def), // L
        ((y == CUBE_SIZE - 1) ? new THREE.MeshBasicMaterial({color: COLOR_ORANGE}) : def), // B
        ((y==0) ? new THREE.MeshBasicMaterial({color: COLOR_RED}) : def), // F
        ((z == CUBE_SIZE - 1) ? new THREE.MeshBasicMaterial({color: COLOR_YELLOW}) : def), // U
        ((z==0) ? new THREE.MeshBasicMaterial({color: COLOR_WHITE}) : def) // D
    ];
    return new THREE.MeshFaceMaterial(materials);
}
function getFaceAxis(face) {
    if (face == LEFT  || face == RIGHT) return AXIS_X;
    if (face == FRONT || face == BACK)  return AXIS_Y;
    if (face == DOWN  || face == UP)    return AXIS_Z;
}


function faceToChar(face) {
    return faceToString(face)[0];   
}
function faceToString(face) {
    switch (face) {
        case FRONT: return 'FRONT'; case BACK:  return 'BACK';
        case UP:    return 'UP';    case DOWN:  return 'DOWN';
        case LEFT:  return 'LEFT';  case RIGHT: return 'RIGHT';
    }
}
function getAxisVectorFromFace(face) {
    var x, y, z;
    x = y = z = 0;
    switch (face) {
        case LEFT:  x = -1; break; case RIGHT:x = 1; break;
        case FRONT: y = -1; break; case BACK: y = 1; break;
        case DOWN:  z = -1; break; case UP:   z = 1; break;
    }
    return new THREE.Vector3(x, y, z);
}

Cubie.prototype = THREE.Mesh.prototype;
Cubie.constructor = Cubie;

function Cubie() {
    
}

function axisToIndex(axis) {
    if (axis == AXIS_X) return 0;
    if (axis == AXIS_Y) return 1;
    if (axis == AXIS_Z) return 2;
    
}

function updateCubieStickerRotation(cubie, axis, cw) {
    var idx = axisToIndex(axis);
    
}











