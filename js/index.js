// Number of cubies per axis of this Rubik's cube
var CUBE_SIZE = 2;

var CUBIE_WIDTH = 0.7;

// Time in ms that it should take to rotate a face 90 degrees
var ANIMATION_DURATION = 200;


var COLOR_RED = 0xC41E3A;
var COLOR_GREEN = 0x009E60;
var COLOR_BLUE = 0x0051BA;
var COLOR_ORANGE = 0xFF5800;
var COLOR_YELLOW = 0xFFD500;
var COLOR_WHITE = 0xFFFFFF;
var COLOR_BLACK = 0x000000;

var AXIS_X = 0;
var AXIS_Y = 1;
var AXIS_Z = 2;

var FRONT = 1;
var LEFT = 2;
var UP = 3;
var BACK = -FRONT;
var RIGHT = -LEFT;
var DOWN = -UP;

var CUBE_COLOR = COLOR_BLACK;
var ORIGIN = new THREE.Vector3(0, 0, 0);

var scene, camera, renderer, clock;

var cubies = [];

var active = new THREE.Object3D();

var animQueue = [];
var animating = false;
var currentAnim = new Animation();


function init() {
    window.onkeypress = onKeyPress;
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    clock = new THREE.Clock();
    

    
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(COLOR_WHITE);
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
                cubie.position.set((i-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07,
                                   (j-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07,
                                   (k-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07);
                scene.add(cubie);
            }
        }
    }
    
    
    scene.add(active);

    addLine(new THREE.Vector3(0.5, 0, 0), COLOR_RED);
    addLine(new THREE.Vector3(0, 0.5, 0), COLOR_GREEN);
    addLine(new THREE.Vector3(0, 0, 0.5), COLOR_BLUE);


    camera.position.set(-5,-5,5);
    camera.up.set(0,0,1);
    camera.lookAt(ORIGIN);
    
    new THREE.OrbitControls(camera);
    
    var dt = 0;
    
    function render() {
        dt = clock.getDelta();
        
        requestAnimationFrame(render);
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


function alignCubies() {
    for (var i = 0; i < CUBE_SIZE; i++) {
        for (var j = 0; j < CUBE_SIZE; j++) {
            for (var k = 0; k < CUBE_SIZE; k++) {
                cubies[i][j][k].position.set(
                    (i-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07,
                    (j-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07,
                    (k-(CUBE_SIZE-1)/2) * CUBIE_WIDTH*1.07);
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
    console.log("round(" + what + "," + to + ") = " + (res));
    return res;   
}

function onKeyPress(e) {
    var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which);
    var upper = key.toUpperCase() === key;
    var face = charToFace(key);
    if (face != undefined)
        enqueueAnimation(new Animation((Math.PI/2),face,1,face));
}
            
function charToFace(letter) {
    switch (letter) {
        case 'u': case 'U': return UP;   case 'd': case 'D': return DOWN;
        case 'l': case 'L': return LEFT; case 'r': case 'R': return RIGHT;
        case 'b': case 'b': return BACK; case 'f': case 'F': return FRONT;
    }
    return undefined;
}


function Animation(targetAngle, face, numLayers, axis) {
    this.targetAngle = targetAngle;
    this.face = face;
    this.axis = getAxisVectorFromFace(axis);
    this.numLayers = numLayers;
    this.angle = 0;
}

function enqueueAnimation(anim) {
    animQueue.push(anim);
}

function startAnimation(animation) {
    currentAnim = animation;
    active.rotation.set(0, 0, 0);
    active.updateMatrixWorld();
    addLayerToActiveGroup(currentAnim.face, currentAnim.numLayers);
    animating = true;
}

function updateAnimation(dt) {
    var dr = dt * (Math.PI/2) / (ANIMATION_DURATION / 1000.0);
    currentAnim.angle += dr;
    if (currentAnim.angle >= currentAnim.targetAngle) {
        dr -= currentAnim.angle - currentAnim.targetAngle;
        animating = false;
    }
    active.rotateOnAxis(currentAnim.axis, dr);
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
    var f = currentAnim.face;
    var axis = getFaceAxis(f);
    var layer = (f == FRONT || f == LEFT || f == DOWN) ? 0 : (CUBE_SIZE - 1);
    var cw = (layer != 0);
    rotateLayer(axis, layer, cw);
}

function rotateLayer(axis, layer, cw) {
    // Identify the 4 vertices:
    var s = CUBE_SIZE -1;
    var l = layer;
    var v1, v2, v3, v4;
    if (axis == AXIS_X) { v1 = [l, 0, 0]; v2 = [l, 0, s]; v3 = [l, s, s]; v4 = [l, s, 0]; }
    if (axis == AXIS_Y) { v1 = [0, l, 0]; v2 = [s, l, 0]; v3 = [s, l, s]; v4 = [0, l, s]; }
    if (axis == AXIS_Z) { v1 = [0, 0, l]; v2 = [0, s, l]; v3 = [s, s, l]; v4 = [s, 0, l]; }
    swap4V(cubies, v1, v2, v3, v4, cw);
    
    // edges
    for (var i = 1; i < CUBE_SIZE -1; i++) {
        // Offset is i
    }
    
    // centers
    
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
    console.log("("+x1+","+y1+","+z1+") -> ("+x2+","+y2+","+z2+") ->"+
               " ("+x3+","+y3+","+z3+") -> ("+x4+","+y4+","+z4+")");
}


function addLine(vec, color) {
    var mat = new THREE.LineBasicMaterial({color:color});
    var geo = new THREE.Geometry();
    geo.vertices.push(ORIGIN);
    geo.vertices.push(vec);

    var line = new THREE.Line(geo, mat);
    line.position.x = -CUBIE_WIDTH * 5;
    scene.add(line);
}

function addLayerToActiveGroup(face, layers) {
    if (!layers) { layers = 1; }
    if (layers <= 0 || layers > CUBE_SIZE) throw "Invalid number of layers";
    
    var x, y, z, x2, y2, z2;
    x = y = z = -1;
    x2 = y2 = z2 = -1;
    switch (face) {
        case LEFT:  x = 0; x2 = layers; break; case RIGHT: x = CUBE_SIZE - layers; x2 = CUBE_SIZE; break;
        case FRONT: y = 0; y2 = layers; break; case BACK:  y = CUBE_SIZE - layers; y2 = CUBE_SIZE; break;
        case DOWN:  z = 0; z2 = layers; break; case UP:    z = CUBE_SIZE - layers; z2 = CUBE_SIZE; break;
    }
    for (var i = 0; i < CUBE_SIZE; i++) {
        for (var j = 0; j < CUBE_SIZE; j++) {
            for (var k = 0; k < CUBE_SIZE; k++) {
                if ((i >= x && i < x2 || x == -1) &&
                    (j >= y && j < y2 || y == -1) &&
                    (k >= z && k < z2 || z == -1)) {
                    THREE.SceneUtils.attach(cubies[i][j][k], scene, active);
                }
            }
        }
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
function getAxisVectorFromFace(face) {
    var x, y, z;
    switch (face) {
        case LEFT:  x = 1; break; case RIGHT:x = -1; break;
        case FRONT: y = 1; break; case BACK: y = -1; break;
        case DOWN:  z = 1; break; case UP:   z = -1; break;
    }
    return new THREE.Vector3(x, y, z);
}













