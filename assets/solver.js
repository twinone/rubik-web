/**
This file implements the solver for a 3x3 Cube
*/

function solve(state, steps) {
    var alg = [];
    if (steps == undefined || steps   > 0) alg = alg.concat(solveCenters(state));
    if (steps == undefined || steps   > 0) alg = alg.concat(solveCross(state));
    if (steps == undefined || steps   > 0) alg = alg.concat(solveFirstLayer(state));

    if (steps == undefined || steps-- > 0) alg = alg.concat(solveSecondLayer(state));

    if (steps == undefined || steps-- > 0) alg = alg.concat(solveYellowCrossOrientation(state));


    var opt = optimize(alg.slice());

    console.log("Original  algorithm ("+alg.length+"): " + alg.join(" "));
    console.log("Optimized algorithm ("+opt.length+"): " + opt.join(" "));
    return opt.join(" ");
}

// We rotate the cube so that the white center is down and the red at the front
function solveCenters(state) {
    function run(x) { alg.push(x); state.algorithm(x); }
    var f = state.find("D").str;
    //console.log("white center is at: ", f);
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
    var pieces = ["DL", "DF", "DR", "DB"];
    while (pieces.length > 0) {
        var p = pieces.shift(); // current piece
        var w = state.find(p) // where the piece was found
        //console.log("piece", p, "is at", w.str);
        if (inLayer(w.str, "U")) {
            while (!inLayer(w.str, p[1])) { run("U", true); }
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
        var w = state.find(p) // where the piece was found
        //console.log("corner piece", p, "is at", w.str);
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
    function run(x,u) { x.split(" ").forEach(function(y) {alg.push(y); state.algorithm(y);}); if (u) w = state.find(p); }
    var alg = [];
    var pieces = ["LF", "FR", "RB", "BL"];
    while (pieces.length > 0) {
        var p = pieces.shift(); // current piece
        var w = state.find(p) // where the piece was found
        if (w.str == p) continue; // already ok
        if (inLayer(w.str, "U")) {
            console.log("piece",p,"is in upper layer");
            function up() { return whichIs(p, w.str, "U"); }
            function other() { return after(p, up()); }
            var tgt = opposite(up());
            // place the piece at the opposite side of the target
            while (after(w.str, "U") != tgt) run("U", true);
            if (p[0] == other()) sol = "F U F' U' L' U' L"; // for front, left
            else sol = "L' U' L U F U F'"; // mirrorred
            console.log("sol=",sol,"replacing L:",p[0], "and F:",p[1]);
            console.log("final sol=",sol.replace("L", p[0]).replace("F", p[1]));
            run(transform(sol, {"L":p[0], "F": p[1]}));
        } else {
            // move it out
            console.log("moving out piece",p,w.str);
            var a = w.str[0];
            var b = w.str[1];
            if (w.str[0] == right(w.str[1])) { a = w.str[1]; b = w.str[0]; }
            run(transform("F U F' U' L' U' L", {"L":a, "F": b}));
            pieces.unshift(p);
        }
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

// returns the char at p of the same index as face at p2
function whichIs(p, p2, face) {
    return p[p2.indexOf(face)];
}

function opposite(face) {
    switch(face.toUpperCase()) {
        case "U": return "D";
        case "D": return "U";
        case "L": return "R";
        case "R": return "L";
        case "F": return "B";
        case "B": return "F";
    }
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

function replaceAll(str, search, replacement) {
    return str.replace(new RegExp(search, 'g'), replacement);
};

function transform(alg, map) {
    var faces = Array.from("ULFRBD");
    faces.forEach(function(c) { alg = replaceAll(alg, c, "_"+c); });
    for (var x in map) {
        if (!map.hasOwnProperty(x)) continue;
        alg = replaceAll(alg, "_"+x, map[x]);
    }
    faces.forEach(function(c) { alg = replaceAll(alg, "_"+c, c); });
    return alg;
}

module.exports = {
    solve: solve,
    invertAlgorithm: invertAlgorithm,
};
