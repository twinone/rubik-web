var Cube = require("./cube").Cube;

var solver = require("./solver");
var defaults = require("./cube").defaults;
var interpolation = require("./interpolation");

var Face = require("./model").Face;
var State = require("./state").State;
var util = require("./util");
var algorithm = require("./algorithm");

try {
  var cube = new Cube({
      size : 3,
      showLabels: true,
  });

  var state = util.getQueryParameter("state");
  if (state) cube.setState(state);

  document.getElementById('canvas').focus();
} catch (e) {}

// Exported methods

window.setState = function(state) {
  cube.setState(state);
};

window.getState = function() {
  return cube.getState();
};

window.scramble = function () {
  return cube.scramble();
};

window.solve = function(state) {
  if (!state) state = cube.getState();
  return solver.solve(new State(state));
};

window.optimize = function(alg) {
  return algorithm.optimize(alg);
};

window.optimizedSolve = function(state) {
  return window.optimize(window.solve(state));
};

window.invertAlgorithm = function(alg) {
  return window.invertAlgorithm(alg);
};

window.doAlgorithm = function(alg) {
  cube.algorithm(alg);
};

window.toggleLabels = function() {
  cube.toggleLabels();
};

window.resetCamera = function() {
  cube.resetCamera();
};
