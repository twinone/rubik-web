var Cube = require("./cube").Cube;
var interpolation = require("./interpolation");


var sel = document.getElementById('select-interpolator');
var ips = Object.keys(interpolation.interpolators);
for (var i = 0; i < ips.length; i++){
    var opt = document.createElement('option');
    opt.value = ips[i];
    opt.innerHTML = ips[i];
    sel.appendChild(opt);
}

sel.addEventListener('change', function() {
    cube.setInterpolator(this.value);
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function updateUI() {
    document.getElementById('size').textContent = cube.size;
}

function increment(i) {
    var size = cube.size + 1;
    cube.setSize(cube.size + i);
    updateUI();
}


var size = getParameterByName("size");
if (!size) size = 3;

var size = Number(size);

var cube = new Cube();
cube.setSize(size);
cube.init();
cube.showLabels();
updateUI();

document.getElementById('increment-size-button').addEventListener('click', function() {
    increment(+1);
});
document.getElementById('decrement-size-button').addEventListener('click', function() {
    increment(-1);
});
document.getElementById('scramble-button').addEventListener('click', function() {
    cube.scramble();
});
document.getElementById('toggle-labels-button').addEventListener('click', function() {
    cube.toggleLabels();
});
document.getElementById('reset-camera-button').addEventListener('click', function() {
    cube.resetCamera();
});
