// Number of cubies per axis of this Rubik's cube
var CUBE_SIZE = 3;

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

var RIGHT = 1;
var BACK = 2;
var UP = 3;

var LEFT = -RIGHT;
var FRONT = -BACK;
var DOWN = -UP;

var AXIS_X = RIGHT;
var AXIS_Y = BACK;
var AXIS_Z = UP;

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
    return res;   
}

function onKeyPress(e) {
    var key = String.fromCharCode(e.keyCode ? e.keyCode : e.which);
    var cw = key.toUpperCase() === key ^ key.shiftKey;
    var face = charToFace(key);
    
    var layer = (face == FRONT || face == LEFT || face == DOWN) ? 0 : CUBE_SIZE -1;
    
    if (face != undefined)
        enqueueAnimation(new Animation((Math.PI/2), cw ? face: -face,[layer]));
}
            
function charToFace(letter) {
    switch (letter) {
        case 'u': case 'U': return UP;   case 'd': case 'D': return DOWN;
        case 'l': case 'L': return LEFT; case 'r': case 'R': return RIGHT;
        case 'b': case 'B': return BACK; case 'f': case 'F': return FRONT;
    }
    return undefined;
}


function Animation(targetAngle, axis, layers) {
    this.targetAngle = targetAngle;
    this.angle = 0;
    this.axisVector = getAxisVectorFromFace(axis);

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
    console.log("userCw: " + userCw);
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

function sum(v) {
    var s = 0;
    for (var i = 0; i < v.length; i++) s += v[i];
    return s;
}
function add(v1, v2) {
    var ret = [];
    for (var i = 0; i < v1.length; i++) {
        ret[i] = v1[i] + v2[i];
    }
}

function sub(v1, v2) {
    var ret = [];
    for (var i = 0; i < v1.length; i++) {
        ret[i] = v1[i] - v2[i];
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

function addLayersToActiveGroup(face, layers) {
    console.log("adding layerS" + face);
    for (var i = 0; i < layers.length; i++) {
        addLayerToActiveGroup(face, layers[i]); 
    }
}

function addLayerToActiveGroup(face, layer) {
    console.log("ading layer: face="+face, "layer="+layer);
    if (layer == undefined) { layer = 0; }
    if (layer < 0 || layer >= CUBE_SIZE) throw "Invalid layer";
    var x, y, z;;
    x = y = z = -1;
    switch (face) {
        case LEFT:  case RIGHT: x = layer; break;
        case FRONT: case BACK:  y = layer; break;
        case DOWN:  case UP:    z = layer; break;
    }
    console.log("x:"+x+",y:"+y+",z:"+z);
    for (var i = 0; i < CUBE_SIZE; i++) {
        for (var j = 0; j < CUBE_SIZE; j++) {
            for (var k = 0; k < CUBE_SIZE; k++) {
                if ((i == x || x == -1) &&
                    (j == y || y == -1) &&
                    (k == z || z == -1)) {
                    console.log("Attaching cubie" + i + "," + j + "," + k);
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













