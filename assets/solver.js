/**
This file implements the solver for a 3x3 Cube
*/

function solve(state, steps) {
    var alg = [];
    console.log("steps="+steps);
    if (steps == undefined || --steps >= 0) alg = alg.concat(solveCenters(state));
    if (steps == undefined || --steps >= 0) alg = alg.concat(solveCross(state));
    if (steps == undefined || --steps >= 0) alg = alg.concat(solveFirstLayer(state));

    var opt = optimize(alg.slice());

    console.log("Original  algorithm ("+alg.length+"): " + alg.join(" "));
    console.log("Optimized algorithm ("+opt.length+"): " + opt.join(" "));
    return opt.join(" ");
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
                run(inv(right(f)));
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
            var f = edgeOther(w.str, "D");
            run(f);
            run(f);
            pieces.unshift(p);
        }
    }
    console.log("returning",alg);
    return alg;
}
function solveFirstLayer(state) {
    var run = function(x) { alg.push(x); state.algorithm(x); }
    var alg = [];
    var pieces = ["DLF", "DFR", "DRB", "DBL"];
    var crashCount = 0;
    while (pieces.length > 0 && crashCount++ < 20) {
        var p = pieces.shift(); // current piece
        var w = state.find(p) // where the piece was found
        console.log("corner piece", p, "is at", w.str);
        if (w.str == p) continue; // already ok
        if (inLayer(w.str, "U")) {
            // move it to above the target
            console.log("moving "+p);
            var tgt = "U" + p.substr(1);
            while (!eq(w.str, tgt)) { run("U"); w = state.find(p); }
            // if white is up, rotate and insert
            if (w.str[0] == "U") {
                run(w.str[1]);
                run("U'");
                run(inv(w.str[1]));
                pieces.push(p);
            } else if (w.str[2] == "U") { // if white is right (3rd color is up)
                run(w.str[0]);
                run("U");
                run(inv(w.str[0]));
            } else { // white is left
                run(inv(w.str[0]));
                run("U'");
                run(w.str[0]);
            }
        } else {
            // in the result, whatever face is to the left of D, turn that one
            var f = before(w.str, "D");
            run(f);
            run("U");
            run(inv(f));
            // we MUST handle the same piece again directly,
            // if we don't we could have a deadlock: moving one piece up
            // puts another one in it's place, and moving the other one up
            // puts the first one in it's place
            // solving the pieces in order solves this problem
            pieces.unshift(p);
        }
    }
    return alg;
}
function solveSecondLayer(state) {
    var run = function(x) { alg.push(x); state.algorithm(x); }
    var alg = [];
    var pieces = ["DL", "DF", "DR", "DB"];
    while (pieces.length > 0) {
        var p = pieces.shift(); // current piece
        var w = state.find(p) // where the piece was found

    }
    return alg;
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

function eq(a, b) {
    function f(x) { return Array.from(x.toLowerCase()).sort().join(""); }
    return f(a) == f(b);
}

// copy of cube.optimizequeue
// input as an array of moves
function optimize(alg) {
    var found = true;
    while (found) {
        found = false;
        // remove opposite moves
        for (var i = alg.length -2; i >= 0; i--) {
            if (alg[i] == inv(alg[i+1])) {
                found = true;
                alg.splice(i, 2);
                i--;
            }
        }
        // remove 4 consecutive equal moves
        for (var i = alg.length -3; i >= 0; i--) {
            if (alg[i] == alg[i+1] &&
                alg[i+1] == alg[i+2]
            ) {
                found = true;
                alg[i] = inv(alg[i]);
                alg.splice(i+1, 2);
                i--;
            }
        }

    }
    return alg;
};

function inv(move) {
    if (move.slice(-1) == "'") return move.substr(0,move.length-1);
    else return move + "'";
}

// returns the char that comes after this one
function after(piece, char) {
    return piece[(piece.indexOf(char)+1)%piece.length];
}

// returns the char that comes before this one
function before(piece, char) {
    return piece[(piece.indexOf(char)+-1+piece.length)%piece.length];
}

// if 1 argument: returns the piece rotated clockwise 1 step
// if 2 arguments: returns the steps necessary to rotate p to obtain p2
function rot(p, p2) {
    if (!p2) return piece.substr(1) + piece[0];
    var i = 0;
    while (p != p2) { rot(p); i++; }
    return i;
}

function invertAlgorithm(alg) {
    var arr = alg.split(" ").reverse();
    arr.forEach(function(e, i, a) {
        a[i] = inv(e);
    });
    var rev = arr.join(" ");
    console.log("alg=",alg,"rev=",rev);
    return rev;
}

module.exports = {
    solve: solve,
    invertAlgorithm: invertAlgorithm,
};
