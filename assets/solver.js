/**
This file implements the solver for a 3x3 Cube
*/
var util = require("./util");
var algorithm = require("./algorithm");

function solve(state) {
    //console.log("Solving", state.state.join(""));
    var alg = [];
    alg = alg.concat(solveCenters(state));
    alg = alg.concat(solveCross(state));
    alg = alg.concat(solveFirstLayer(state));

    alg = alg.concat(solveSecondLayer(state));

    alg = alg.concat(solveYellowCrossOrientation(state));
    alg = alg.concat(solveYellowCrossPermutation(state));

    alg = alg.concat(solveCornersPermutation(state));
    alg = alg.concat(solveCornersOrientation(state));

    return alg.join(" ");
}

// We rotate the cube so that the white center is down and the red at the front
function solveCenters(state) {
    function run(x) { alg.push(x); state.algorithm(x); }
    var f = state.find("D").str;
    var alg = [];
    switch (f) {
        case "L": run("Z'"); break;
        case "R": run("Z"); break;
        case "F": run("X'"); break;
        case "B": run("X"); break;
        case "U": run("X"); run("X"); break;
    }
    while (state.find("F").str != "F") { run("Y"); }
    return alg;
}

function solveCross(state) {
    function run(x,u) { alg.push(x); state.algorithm(x); if (u) w = state.find(p); }
    var alg = [];
    var i = 0;
    var pieces = ["DR","DL", "DF", "DB"];
    while (pieces.length > 0 && i < 10) {
        var p = pieces.shift(); // current piece
        var w = state.find(p); // where the piece was found
        if (inLayer(w.str, "U")) {
            while (!inLayer(w.str, p[1]) && i < 10) { run("U", true); }
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
            pieces.unshift(p);
        } else if (w.str != p) {
            var f = after(w.str, "D");
            run(f);
            run(f);
            pieces.unshift(p);
        }
    }
    return alg;
}
function solveFirstLayer(state) {
    function run(x,u) { alg.push(x); state.algorithm(x); if (u) w = state.find(p); }
    var alg = [];
    var pieces = ["DLF", "DFR", "DRB", "DBL"];
    var crashCount = 0;
    while (pieces.length > 0 && crashCount++ < 20) {
        var p = pieces.shift(); // current piece
        var w = state.find(p); // where the piece was found
        if (w.str == p) continue; // already ok
        if (inLayer(w.str, "U")) {
            // move it to above the target
            var tgt = "U" + p.substr(1);
            while (!eq(w.str, tgt)) { run("U", true); }
            // if white is up, rotate and insert
            if (w.str[0] == "U") {
                run(w.str[1]);
                run("U'");
                run(inv(w.str[1]));
                pieces.unshift(p);
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
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); if (u) w = state.find(p); }
    var alg = [];
    var pieces = ["LF", "FR", "RB", "BL"];
    while (pieces.length > 0) {
        var p = pieces.shift(); // current piece
        var w = state.find(p); // where the piece was found
        if (w.str == p) continue; // already ok
        if (inLayer(w.str, "U")) {
            function up() { return whichIs(p, w.str, "U"); }
            function other() { return after(p, up()); }
            var tgt = util.opposite(up());
            // place the piece at the opposite side of the target
            while (after(w.str, "U") != tgt) run("U", true);
            if (p[0] == other()) sol = "F U F' U' L' U' L"; // for front, left
            else sol = "L' U' L U F U F'"; // mirrorred
            run(algorithm.transform(sol, {"L":p[0], "F": p[1]}));
        } else {
            // move it out
            var a = w.str[0];
            var b = w.str[1];
            if (w.str[0] == right(w.str[1])) { a = w.str[1]; b = w.str[0]; }
            run(algorithm.transform("F U F' U' L' U' L", {"L":a, "F": b}));
            pieces.unshift(p);
        }
    }
    return alg;
}

function solveYellowCrossOrientation(state) {
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); if (u) find(); }
    var alg = [];
    var pieces = ["UL", "UF", "UR", "UB"];
    var w, up, cnt;
    function find() {
        w = []; up = []; cnt = 0;
        for (var i = 0; i < 4; i++) {
            w.push(state.get(pieces[i]));
            up.push(w[i][0] == "U");
            if (up[i]) cnt++;
        }
    }
    find();
    if (cnt == 0) {
        run("F R U R' U' F'");
        run("F R U R' U' F'");
        run("U");
        run("F R U R' U' F'");
    } else if (cnt == 2) {

        var h = up[0] && up[2];
        var v = up[1] && up[3];
        if (v) run("U");
        if (h || v) run ("F R U R' U' F'");
        else { // L shape
            while (!(up[1] && up[2])) { run("U", true); }
            run("F R U R' U' F'");
            run("U");
            run("F R U R' U' F'");
        }
    } else if (cnt != 4) {
        throw new Error("Invalid state "+ cnt);
    }
    return alg;
}

function solveYellowCrossPermutation(state) {
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
    function g(x) { return state.get(x); }
    var alg = [];
    var pieces = ["UL", "UF", "UR", "UB"];
    while (g("UF") != "UF") run("U");

    if (!(g("UL") == "UL" && g("UF") == "UF" && g("UR") == "UR" && g("UB") == "UB")) {
        if      (g("UB") == "UL" && g("UL") == "UB") run("R' U' R U' R' U U R U'"); // L <=> B
        else if (g("UB") == "UR" && g("UR") == "UB") run("L U L' U L U U L' U"); // R <=> B
        else if (g("UB") == "UB")                    run("R' U' R U' R' U U R U'" + " " + "L' U' L U' L' U U L"); // v swap
        else if (g("UL") == "UB")                    run("L' U' L U' L' U U L"); // cw
        else                                         run("R U R' U R U U R'"); // ccw
    }

    return alg;
}

function solveCornersPermutation(state) {
    var niklas_ccw =  "R U' L' U R' U' L U";
    var niklas_cw = "L' U R U' L U R' U'";
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
    var alg = [];
    // First put the UFL corner at it's correct position
    var ufl = state.find("UFL");
    if (!eq(ufl.str, "UFL")) {
        if      (eq(ufl.str, "UBL")) { run("Y"); run(niklas_ccw); run("Y'"); }
        else if (eq(ufl.str, "URB")) { run(niklas_cw); }
        else                         { run("Y"); run(niklas_cw); run("Y'") }
    }
    // now rotate the other 3 pieces
    var ulb = state.find("ULB");
    if (!eq(ulb.str, "ULB")) {
        if (eq(ulb.str, "UBR")) { run(niklas_ccw); }
        else                    { run("Y'"); run(niklas_cw); run("Y"); }
    }
    return alg;
}

function solveCornersOrientation(state) {
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); }
    var alg = [];
    for (var i = 0; i < 4; i++) {
        var rot = state.get("URF").indexOf("U");
        if (rot == 1) run("R' D' R D R' D' R D");
        if (rot == 2) run("D' R' D R D' R' D R");
        run("U");
    }
    return alg;
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


function eq(a, b) {
    function f(x) { return Array.from(x.toLowerCase()).sort().join(""); }
    return f(a) == f(b);
}


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

// returns the char at p of the same index as face at p2
function whichIs(p, p2, face) {
    return p[p2.indexOf(face)];
}


var CubejsWorker = require("worker-loader!./solver_cubejs_worker");
function createCubejsSolver(cb) {
  var worker = new CubejsWorker();
  worker.addEventListener("message", function (e) {
    if (e.data.name !== "ready") return;
    cb(new CubejsSolver(worker));
  });
}

function CubejsSolver(worker) {
  this.worker = worker;
  this.queues = {};
  this.worker.addEventListener("message", function (e) {
    if (e.data.name !== "solved") return;
    this.queues[e.data.state].forEach(function (cb) {
      cb(e.data.alg);
    });
    delete this.queues[e.data.state];
  }.bind(this));
}

CubejsSolver.prototype.solve = function (state, cb) {
  if (state in this.queues) return this.queues[state].push(cb);
  this.queues[state] = [ cb ];
  this.worker.postMessage({ name: "solve", state: state });
};


module.exports = {
    solve: solve,
    createCubejsSolver: createCubejsSolver,
};
