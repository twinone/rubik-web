var Cube = require("./cube").Cube;

var defaults = require("./cube").defaults;
var interpolation = require("./interpolation");

var Face = require("./model").Face;
var State = require("./state").State;
var util = require("./util");


var sel = document.getElementById('select-interpolator');
var ips = Object.keys(interpolation.interpolators);
for (var i = 0; i < ips.length; i++){
    var opt = document.createElement('option');
    var name = ips[i];
    opt.value = name;
    opt.innerHTML = name.charAt(0).toUpperCase() + name.slice(1);
    sel.appendChild(opt);
}
sel.value = defaults.animation.interpolator;

sel.addEventListener('change', function() {
    cube.setInterpolator(this.value);
});

function updateUI() {
  document.getElementById('size').textContent = cube.size;
  // document.getElementById('fancy-state').innerHTML = cube.getState(true);
  document.getElementById('state').innerHTML = cube.getState(false);
}

var size = util.getQueryParameter("size") || 3;
var size = Number(size);

var state = util.getQueryParameter("state");

function moveCompleteListener() {
  updateUI();
}

var cube = new Cube({
    size : size,
    showLabels: true,
    moveCompleteListener: moveCompleteListener,
});
if (state) cube.setState(state);

document.getElementById('canvas').focus();
updateUI();


function increment(i) {
    cube.setSize(cube.size + i);
    updateUI();
}
function addListener(toWhat, event, listener) {
    document.getElementById(toWhat).addEventListener(event, listener);
}

document.getElementById('anim-duration').value = 300;

addListener('anim-duration', 'change', function() {
    console.log("anim duration changed: " + this.value);
    cube.setAnimationDuration(this.value);
});

addListener('increment-size-button', 'click', function() {
    increment(+1);
});
addListener('decrement-size-button', 'click', function() {
    increment(-1);
});
addListener('scramble-button', 'click', function() {
    cube.scramble();
});
addListener('solve-button', 'click', function() {
    console.log(cube.getSolution());
});

addListener('toggle-labels-button', 'click', function() {
    cube.toggleLabels();
});
addListener('reset-camera-button', 'click', function() {
    cube.resetCamera();
});

addListener('canvas', 'click', function() {
    this.focus();
});

addListener('run-algorithm', 'click', function() {
    cube.algorithm(document.getElementById('algorithm').value);
});

addListener('change-state', 'click', function() {
  cube.setState(document.getElementById('new-state').value);
  updateUI();
});

addListener('copy-state', 'click', function() {
  var url = util.appendQueryParameter(window.location.href, "state", cube.getState());
  util.copyToClipboard(url);
  //window.location.href = url;
});

addListener('test-button', 'click', function() {
    // Test states
  var state = new State(cube.getState());
  var orig = state.state.join("");
  state.rotate(Face.UP, true, [0,1,2]);
  console.log("ORIG=",orig);
  console.log("NEW =",state.state.join(""));
  cube.setState(state.state.join(""));

});
