/**
This file implements the solver for a 3x3 Cube
*/

function solve(state) {
    return solveCenters(state)
    .concat(solveCross(state))
    .join(" ");
}

// We rotate the cube so that the white center is down and the red at the front
function solveCenters(state) {
    var f = state.find("D").str;
    //console.log("white center is at: ", f);
    var alg = [];
    switch (f) {
        case "L": alg.push("Z'"); break;
        case "R": alg.push("Z"); break;
        case "F": alg.push("X'"); break;
        case "B": alg.push("X"); break;
        case "U": alg.push("X"); alg.push("X"); break;
    }
    state.algorithm(alg.join(" "));
    while (state.find("F").str != "F") { state.algorithm("Y"); alg.push("Y"); }
    return alg;
}

function solveCross(state) {
    var run = function(x) { alg.push(x); state.algorithm(x); }
    var alg = [];
    var pieces = ["DL", "DF", "DR", "DB"];
    while (pieces.length > 0) {
        var p = pieces.shift(); // current piece
        var w = state.find(p) // where the piece was found
        //console.log("piece", p, "is at", w.str);
        if (inLayer(w.str, "U")) {
            while (!inLayer(w.str, p[1])) { run("U"); w = state.find(p); }
            var f = p[1];
            if (w.str[0] == "U") {
                run(f);
                run(f);
            } else {
                run(f);
                run("D");
                run(right(f)+"'");
                run("D'");
            }
        } else if (!inLayer(w.str, "D")) {
            var f = w.str[1];
            var cw = state.colOf(w.pos[1]) == 0;
            run(f+(cw?"":"'"));
            run("U");
            run(f+(!cw?"":"'"));
            pieces.push(p);
        } else if (w.str != p) {
            // bottom layer but not right place
            console.log("moving piece " + p + " up again");
            var f = edgeOther(w.str, "D");
            run(f);
            run(f);
            pieces.push(p); // it's now UP
        }
    }
    return alg;
}
function solveFirstLayer(state) {
}
function solveSecondLayer(state) {
}
function solveThirdLayer(state) {
}

function inLayer(piece, layer) {
    return piece.indexOf(layer) > -1;
}
// returns the face to the left of this face
function left(faceChar) {
    var s = "LFRB";
    return s[(s.indexOf(faceChar)+3)%4];
}
// returns the face to the right of this face
function right(faceChar) {
    var s = "LFRB";
    return s[(s.indexOf(faceChar)+1)%4];
}
function edgeOther(piece, face) {
    return piece.replace(face, "");
}
module.exports = {
    solve: solve,
};
