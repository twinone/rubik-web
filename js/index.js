var CUBIE_SIZE = 0.7;

var COLOR_RED = 0xC41E3A;
var COLOR_GREEN = 0x009E60;
var COLOR_BLUE = 0x0051BA;
var COLOR_ORANGE = 0xFF5800;
var COLOR_YELLOW = 0xFFD500;
var COLOR_WHITE = 0xFFFFFF;
var COLOR_BLACK = 0x000000;

var FRONT = 1;
var LEFT = -2;
var UP = 2;
var BACK = -FRONT;
var RIGHT = -LEFT;
var DOWN = -UP;

var CUBE_COLOR = COLOR_BLACK;
var ORIGIN = new THREE.Vector3(0,0,0);

var scene, camera, renderer;

var cubies = new Array();


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(COLOR_WHITE);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    var cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

    
    // Set up our cubies
    for (var i = 0; i < 3; i++) {
        cubies[i] = new Array();
        for (var j = 0; j < 3; j++) {
            cubies[i][j] = new Array();
            for (var k = 0; k < 3; k++) {
                var cubie = new THREE.Mesh(cubieGeometry, getFaceMaterial(i, j, k));
                cubies[i][j][k] = cubie;
                cubie.position.set((i-1) * CUBIE_SIZE*1.07,
                                   (j-1) * CUBIE_SIZE*1.07,
                                   (k-1) * CUBIE_SIZE*1.07);
                scene.add(cubie);
            }
        }
    }
    
    
    addLine(new THREE.Vector3(0.5, 0, 0), COLOR_RED);
    addLine(new THREE.Vector3(0, 0.5, 0), COLOR_GREEN);
    addLine(new THREE.Vector3(0, 0, 0.5), COLOR_BLUE);


    camera.position.set(-5,-5,5);
    camera.up.set(0,0,1);
    camera.lookAt(ORIGIN);
    
    new THREE.OrbitControls(camera);

    function render() {
        requestAnimationFrame(render);
        rotate(1,1);
        renderer.render(scene, camera);
    }
    render();
}

init();



function addLine(vec, color) {
    var mat = new THREE.LineBasicMaterial({color:color});
    var geo = new THREE.Geometry();
    geo.vertices.push(ORIGIN);
    geo.vertices.push(vec);

    var line = new THREE.Line(geo, mat);
    line.position.x = -CUBIE_SIZE * 5;
    scene.add(line);
}

function rotate(direction, layers) {
/*
    cubies[0][0][0].rotateOnAxis(new THREE.Vector3(0,0,1), 0.01);
*/
}

function getFaceMaterial(x, y , z) {
    console.log("getFaceColor: " + x + ", " + y + ", " + z);
    var def = new THREE.MeshBasicMaterial({color: CUBE_COLOR});
    var materials = [
        ((x==2) ? new THREE.MeshBasicMaterial({color: COLOR_GREEN}) : def), // R
        ((x==0) ? new THREE.MeshBasicMaterial({color: COLOR_BLUE}) : def), // L
        ((y==2) ? new THREE.MeshBasicMaterial({color: COLOR_ORANGE}) : def), // B
        ((y==0) ? new THREE.MeshBasicMaterial({color: COLOR_RED}) : def), // F
        ((z==2) ? new THREE.MeshBasicMaterial({color: COLOR_YELLOW}) : def), // U
        ((z==0) ? new THREE.MeshBasicMaterial({color: COLOR_WHITE}) : def) // D
    ];
    
  /*  materials = [
        new THREE.MeshBasicMaterial({color: COLOR_RED}),
        new THREE.MeshBasicMaterial({color: COLOR_BLUE}),
        new THREE.MeshBasicMaterial({color: COLOR_GREEN}),
        new THREE.MeshBasicMaterial({color: COLOR_RED}),
        new THREE.MeshBasicMaterial({color: COLOR_BLUE}),
        new THREE.MeshBasicMaterial({color: COLOR_GREEN})
        
    ];*/
    return new THREE.MeshFaceMaterial(materials);
}
