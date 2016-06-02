var model = require("./model");
var util = require("./util");
var algorithm = require("./algorithm");

// Faces by their index
var FACES = ["U", "L", "F", "R", "B", "D"];

// Faces adjacent to eachother
// Each line represents a face which is commented
// For each line we have two entries: The first one is the face on the top
// and the second one is the face on the right
var ADJ = [
    ["B", "R", "F", "L"], // UP
    ["U", "F", "D", "B"], // LEFT
    ["U", "R", "D", "L"], // FRONT
    ["U", "B", "D", "F"], // RIGHT
    ["U", "L", "D", "R"], // BACK
    ["F", "R", "B", "L"], // DOWN
];

// Rotations for each of the faces in the ADJ matrix
// each rotation is the amount of degrees to turn the face so that it aligns
// perfectly with the face of that line
// The unit is 90º, so a value of 1 means we have to turn the face 90º so that
// it aligns with the face of that line
// values are [0..3]
var _ = null;
var ROT = [
    [_, 3, 0, 1, 2, _], // U [ULFRBD]
    [1, _, 0, _, 0, 3], // L [ULFRBD]
    [0, 0, _, 0, _, 0], // F [ULFRBD]
    [3, _, 0, _, 0, 1], // R [ULFRBD]
    [2, 0, _, 0, _, 2], // B [ULFRBD]
    [_, 1, 0, 3, 2, _], // D [ULFRBD]
];


function State(state) {
    if (typeof(state) == "number") {
        var s = "";
        for (var i = 0; i < FACES.length; i++) for (var j = 0; j < state*state; j++) s += FACES[i];
        state = s;
    }
    if (typeof(state) !== "string") throw new Error("State should be a string!");
    if (state.length % 6 != 0) throw new Error("State's length must be a multiple of 6");
    this.size = Math.sqrt(state.length / 6);
    if (this.size%1 != 0) throw new Error("Faces should be square");
    this.state = Array.from(state);
}

State.prototype.offset = function offset(face) {
    return FACES.indexOf(face) * this.size * this.size;
}

// index of a sticker inside the state
State.prototype.index = function index(face, row, col) {
    return this.offset(face) + row*this.size + col;
}

State.prototype.row = function row(face, num) {
    return this._line(face, true, num);
}

State.prototype.col = function col(face, num) {
    return this._line(face, false, num);
}

State.prototype._line = function _line(face, isRow, num) {
    res = [];
    var offset = this.offset(face);
    var step;
    if (isRow) {
        step = 1;
        offset += num * this.size;
    } else {
        step = this.size;
        offset += num * 1;
    }
    for (var i = 0; i < this.size; i++) res.push(offset + i*step);
    return res;
}

/*
Rotates layers around a face
*/
State.prototype.rotate = function rotate(face, rot, layers) {
    if (layers == undefined) layers = [0];
    for (var n = 0; n < ((rot%4+4)%4); n++) {
      for (var i = 0; i < layers.length; i++) {
          if (layers[i] == 0) this._rotateFace(face, true);
          if (layers[i] == this.size-1) this._rotateFace(util.opposite(face), false);
          this._rotateRing(face, layers[i], true);
      }
    }
}

// Rotates the stickers on a face
State.prototype._rotateFace = function _rotateFace(face, cw) {
    var s = this.size;
    var rings = s / 2;
    for (var i = 0; i < rings; i++) {
        // offset = i
        for (var j = 0; j < s-i*2-1; j++) {
            swap4(this.state,
                this.index(face, i,i+j),
                this.index(face, i+j,s-1-i),
                this.index(face, s-1-i,s-1-i-j),
                this.index(face, s-1-i-j,i),
                cw
            );
        }
    }
}
// Rotates the stickers on a layer
State.prototype._rotateRing = function _rotateRing(face, layer, cw) {
    var lines = [];
    for (var i = 0; i < 4; i++) lines.push(this._getAdjacentLine(face, i, layer));
    for (var j = 0; j < this.size; j++) {
        swap4(this.state, lines[0][j], lines[1][j], lines[2][j], lines[3][j], cw);
    }
}

State.prototype._getAdjacentLine = function _getAdjacentLine(face, direction, layer) {
    var index = FACES.indexOf(face);
    var dst = ADJ[index][direction]; // target face
    var dsti = FACES.indexOf(dst);
    var fdir = (ROT[index][dsti]+direction+2) % 4;
    return this._getRotatedLine(dst, fdir, layer).reverse();
}

// Gets the clockwise rotated line of a face
State.prototype._getRotatedLine = function _getRotatedLine(face, direction, layer) {
    switch (direction) {
        case 0: return this.row(face, layer);
        case 1: return this.col(face, this.size-1-layer);
        case 2: return this.row(face, this.size-1-layer).reverse();
        case 3: return this.col(face, layer).reverse();
    }
}

// Gets the clockwise rotated index of a line on a face
State.prototype._getRotatedIndex = function _getRotatedIndex(face, direction, offset) {
    var s = this.size;
    switch (direction) {
        case 0: return this.index(face, 0, offset);
        case 1: return this.index(face, offset, s-1);
        case 2: return this.index(face, s-1, s-1-offset);
        case 3: return this.index(face, s-1-offset, 0);
    }
}



// TODO Add support for > 3x3 cubes
// Returns whatever is at the intersecion of the faces, in the same order
State.prototype.get = function get(faces) {
    switch(faces.length) {
        case 1: return this._getCenter(faces);
        case 2: return this._getEdge(faces);
        case 3: return this._getCorner(faces);
        default: throw new Error("Invalid faces");
    }
}

State.prototype._getCenter = function _getCenter(faces) {
    return this.index(faces, this.size/2, this.size/2);
}

State.prototype._getEdge = function _getEdge(f) {
    var r0 = ADJ[FACES.indexOf(f[0])].indexOf(f[1]);
    var r1 = ADJ[FACES.indexOf(f[1])].indexOf(f[0]);
    var i0 = this._getRotatedIndex(f[0], r0, 1);
    var i1 = this._getRotatedIndex(f[1], r1, 1);
    return this.state[i0] + this.state[i1];
}

State.prototype._getCorner = function _getCorner(f) {
    function adj(x,y) { return ADJ[FACES.indexOf(f[x])].indexOf(f[y]); }
    var r01 = adj(0, 1);
    var r02 = adj(0, 2);
    var r10 = adj(1, 0);
    var r20 = adj(2, 0);

    var cw = (r01 +1 == r02);
    var i0 = this._getRotatedIndex(f[0], r01, cw ? this.size-1 : 0);
    var i1 = this._getRotatedIndex(f[1], r10, cw ? 0 : this.size-1);
    var i2 = this._getRotatedIndex(f[2], r20, cw ? this.size-1 : 0);
    return this.state[i0] + this.state[i1] + this.state[i2];
}

// returns the faces in which the piece searched for is located
// in the same order as the input
// For example find(["U", "L"]) would return ["L", "U"]
// if the UL edge was at the correct position but wrong orientation
// stickers: Array of length [0..2] containing the stickers to search for
State.prototype.find = function find(stickers) {
    switch(stickers.length) {
        case 1: return this._findCenter(stickers);
        case 2: return this._findEdge(stickers);
        case 3: return this._findCorner(stickers);
        default: throw new Error("Invalid search");
    }
}

// TODO Add support for > 3x3 cubes
State.prototype._findCenter = function _findCenter(stickers) {
    var s2 = this.size * this.size;
    var offset = parseInt(s2 / 2);
    var step = s2;
    for (var i = 0; i < 6; i++) {
        var pos = offset+step*i;
        if (this.state[pos] == stickers[0]) {
            return {
                "str": FACES[i],
                "pos": [pos],
            };
        }
    }
}

// Finds the next sticker in the given direction
// Example: _next("U", size-1, 3) would give the sticker at Left(0,0)
// Pre: Only valid to find stickers on two different faces
State.prototype._nextIndex = function _nextIndex(face, dir, offset) {
    var index = FACES.indexOf(face);
    var dst = ADJ[index][dir]; // target face
    var dsti = FACES.indexOf(dst);
    var fdir = (ROT[index][dsti]+dir+2) % 4;

    var s = this.size;
    var xx = this._getRotatedIndex(dst, fdir, s-1-offset);
    return this._getRotatedIndex(dst, fdir, s-1-offset);
}

// TODO Add support for > 3x3 cubes
State.prototype._findEdge = function _findEdge(stickers) {
    for (var i = 0; i < FACES.length; i++) {
        var f = FACES[i];
        for (var j = 0; j < 4; j++) {
            var pos = [
                this._getRotatedIndex(f, j, 1),
                this._nextIndex(f, j, 1),
            ];
            if (this.state[pos[0]] != stickers[0]) continue;
            if (this.state[pos[1]] == stickers[1]) {
                return {
                    "str": f + ADJ[i][j],
                    "pos": pos,
                };
            }
        }
    }
}

State.prototype._findCorner = function _findCorner(stickers) {
    for (var i = 0; i < FACES.length; i++) {
        var f = FACES[i];
        for (var j = 0; j < 4; j++) {
            var index = this._getRotatedIndex(f, j, 0);
            if (this.state[index] != stickers[0]) continue;
            var a = this._nextIndex(f, j, 0);
            var b = this._nextIndex(f, (j+3)%4, this.size-1);
            if (this.state[a] == stickers[1] && this.state[b] == stickers[2]) {
                return {
                    "str": f + ADJ[i][j] + ADJ[i][(j+3)%4],
                    "pos": [index, a, b],
                };
            }
            if (this.state[b] == stickers[1] && this.state[a] == stickers[2]) {
                return {
                    "str": f + ADJ[i][(j+3)%4] + ADJ[i][j],
                    "pos": [index, b, a],
                };
            }
        }
    }
}



State.prototype.algorithm = function _algorithm(alg) {
    //console.log("ALG:",alg);
    var moves = alg.split(" ");
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i].trim();
        if (move == "") continue;

        var c = move.charAt(0);
        var face = c.toUpperCase();
        var upper = (c == c.toUpperCase()); // uppercase letter is clockwise
        // process prime (inverts turn direction)
        var rot = algorithm.rot(move);

        if (isFace(face)) {
            var layers = [0];
            if (!upper) layers.push(1);
        } else if (isAxis(c)) {
            var layers = []; for (var j = 0; j < this.size; j++) layers.push(j);
            face = axisToFace(c);
        } else {
            console.log("Invalid move: " + move);
            continue;
        }
        this.rotate(face, rot, layers);
    }
}


State.prototype.rowOf = function rowOf(index) {
    var s = this.size;
    return parseInt((index%(s*s))/s);
}

State.prototype.colOf = function colOf(index) {
    var s = this.size;
    return (index%(s*s))%s;
}

State.prototype.faceOf = function faceOf(index) {
    return FACES[parseInt(index / (this.size*this.size))];
}

State.prototype.describeIndex = function describeIndex(index) {
    var row = this.rowOf(index);
    var col = this.colOf(index);
    var f = this.faceOf(index);
    return index + ":" + this.state[index] + " (f=" + f + ",r=" + row + ",c=" + col + ")";
}

function axisToFace(axis) { switch(axis){ case "X": return "R"; case "Y": return "U"; case "Z": return "F"; }}
function isFace(char) { return FACES.indexOf(char) != -1; }
function isAxis(char) { return "XYZ".indexOf(char) != -1; }
function swap4(v, i0, i1, i2, i3, cw) { if (cw) swap4CW(v, i0, i1, i2, i3); else swap4CCW(v, i0, i1, i2, i3); }
function swap4CCW(v, i0, i1, i2, i3) { swap4CW(v, i3, i2, i1, i0); }
function swap4CW(v, i0, i1, i2, i3) { tmp = v[i3]; v[i3] = v[i2]; v[i2] = v[i1]; v[i1] = v[i0]; v[i0] = tmp; }

window.state = State;
module.exports = { State: State };
