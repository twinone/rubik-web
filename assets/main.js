var Cube = require("./cube").Cube;

var solver = require("./solver");
var defaults = require("./cube").defaults;
var interpolation = require("./interpolation");

var Face = require("./model").Face;
var State = require("./state").State;
var util = require("./util");
var algorithm = require("./algorithm");

var dat = require("./vendor/dat.gui.min");


gui = new dat.GUI();
controls = {
  size : 3,
  scramble: function(){},
  solve: function(){},
  labels: true,
  camera: function(){},
  interpolator: function(){},
  duration: 300,
  state: "",
  alg: "",
  button: function(){}, // used for other buttons
}




function initGui() {
  function folder(name) {
    var f = gui.addFolder(name);
    f.open();
    return f;
  }

  var c = folder("Cube");
  c.add(controls, 'size').min(1).step(1).name("Size")
    .onChange(function(size) { cube.setSize(size); });
  c.add(controls, 'scramble').name("Scramble")
    .onChange(function() { cube.scramble(); });
  c.add(controls, 'solve').name("Solve")
    .onChange(function() { solve(); });

  var v = folder("View");
  v.add(controls, 'labels').name("Show Labels")
    .onFinishChange(function() { cube.toggleLabels(); });
  v.add(controls, 'camera').name("Reset Camera")
    .onFinishChange(function() { cube.resetCamera(); });

  var a = folder("Animation");
  var interpolators = Object.keys(interpolation.interpolators);
  a.add(controls, "duration").min(0).step(100).setValue(300).name("Duration (ms)")
    .onFinishChange(function(d) { cube.setAnimationDuration(d); });
  a.add(controls, "interpolator", interpolators).setValue(interpolators[0]).name("Interpolator")
    .onFinishChange(function(i) { cube.setInterpolator(i); });

  var st = folder("State");
  st.add(controls, "state").name("Modify State").listen();
  st.add(controls, "button").name("Apply State")
    .onFinishChange(function() { cube.setState(controls.state); });

  var alg = folder("Algorithm");
  alg.add(controls, "alg").name("Edit Algorithm").listen();
  alg.add(controls, "button").name("Run")
    .onFinishChange(function() { cube.algorithm(controls.alg); });
  alg.add(controls, "button").name("Invert")
    .onFinishChange(function() { controls.alg = algorithm.invert(controls.alg); });

  if (screen.width <= 500) gui.close();

}

initGui();

var size = util.getQueryParameter("size") || 3;
var size = Number(size);

var cube = new Cube({
    size : size,
    showLabels: false,
    moveCompleteListener: moveCompleteListener,
});

controls.state = util.getQueryParameter("state");
if (controls.state) cube.setState(controls.state);
else controls.state = cube.getState();

function moveCompleteListener() {
  controls.state = cube.getState();
}

document.getElementById('canvas').focus();


function addListener(toWhat, event, listener) {
    document.getElementById(toWhat).addEventListener(event, listener);
}

addListener('canvas', 'click', function() {
    this.focus();
});

function solve() {
  var alg = solver.solve(new State(cube.getState()));
  var opt = algorithm.optimize(alg);
  cube.algorithm(opt);
  console.log("Algorithm:", alg);
}

// addListener('copy-state', 'click', function() {
//   var url = util.appendQueryParameter(window.location.href, "state", cube.getState());
//   util.copyToClipboard(url);
//   //window.location.href = url;
// });

// var cnt = 0;
// var moves = [];
// var opts = [];
// function avg(w) {
//     var tot = 0;
//     for (var i = 0; i < w.length; i++) { tot += w[i]; }
//     return tot / w.length;
// }
// function benchmark() {
//     // results: benchmark solved 100000 states avg= 144.57862 optimized= 135.18556 in 81.055 s
//     var time = new Date().getTime();
//     for (var i = 0; i < 100000; i++) {
//       var state = new State(3);
//       state.algorithm(algorithm.random(10));
//       var alg = solver.solve(state);
//       var opt = algorithm.optimize(alg);
//       var m = alg.split(" ").length;
//       var o = opt.split(" ").length;
//       moves.push(m);
//       opts.push(o);
//       //if (i%10000==0)console.log("benchmark solved", cnt, "states avg=",avg(moves),"optimized=",avg(opts),"in",(new Date().getTime()-time)/1000,"s");
//       cnt++;
//     }
//     if (i%10000==0)console.log("benchmark solved", cnt, "states avg=",avg(moves),"optimized=",avg(opts),"in",(new Date().getTime()-time)/1000,"s");
// }

module.exports = cube;
