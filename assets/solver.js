/**
This file implements the solver for a 3x3 Cube
*/

function solve(state) {
    return solveCenters(state);
}
// We rotate the cube so that the white center is down
function solveCenters(state) {
    var f = state.find("D");
    console.log("white center is at: ", f);
    var alg = "";
    switch (f) {
        case "L": alg = "Z'"; break;
        case "R": alg = "Z"; break;
        case "F": alg = "X'"; break;
        case "B": alg = "X"; break;
        case "U": alg = "X X"; break;
    }
    state.algorithm(alg);
}

function solveCross(state) {
}
function solveFirstLayer(state) {
}
function solveSecondLayer(state) {
}
function solveThirdLayer(state) {
}

module.exports = {
  solve: solve,
};
