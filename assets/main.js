var Cube = require("./cube").Cube;

var solver = require("./solver");
var defaults = require("./cube").defaults;
var interpolation = require("./interpolation");

var Face = require("./model").Face;
var State = require("./state").State;
var util = require("./util");
var algorithm = require("./algorithm");


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
    var alg = solver.solve(new State(cube.getState()));
    var opt = algorithm.optimize(alg);
    cube.algorithm(opt);
    console.log("Algorithm:", alg);
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
addListener('inverse', 'click', function() {
    document.getElementById('algorithm').value = algorithm.invert(document.getElementById('algorithm').value);
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

var cnt = 0;
var moves = [];
var opts = [];
function avg(w) {
    var tot = 0;
    for (var i = 0; i < w.length; i++) { tot += w[i]; }
    return tot / w.length;
}
function benchmark() {
    // results: benchmark solved 100000 states avg= 144.57862 optimized= 135.18556 in 81.055 s
    var time = new Date().getTime();
    for (var i = 0; i < 100000; i++) {
      var state = new State(3);
      state.algorithm(algorithm.random(10));
      var alg = solver.solve(state);
      var opt = algorithm.optimize(alg);
      var m = alg.split(" ").length;
      var o = opt.split(" ").length;
      moves.push(m);
      opts.push(o);
      //if (i%10000==0)console.log("benchmark solved", cnt, "states avg=",avg(moves),"optimized=",avg(opts),"in",(new Date().getTime()-time)/1000,"s");
      cnt++;
    }
    if (i%10000==0)console.log("benchmark solved", cnt, "states avg=",avg(moves),"optimized=",avg(opts),"in",(new Date().getTime()-time)/1000,"s");
}

addListener('test-button', 'click', function() {
});
