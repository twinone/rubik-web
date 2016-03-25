var model = require("./model");
var util = require("./util");
var Face = model.Face;

// The order in which faces are serialized
var offsets = {};
offsets[Face.UP] = 0;
offsets[Face.LEFT] = 1;
offsets[Face.FRONT] = 2;
offsets[Face.RIGHT] = 3;
offsets[Face.BACK] = 4;
offsets[Face.DOWN] = 5;

// Faces by their index
var FACES = [Face.UP, Face.LEFT, Face.FRONT, Face.RIGHT, Face.BACK, Face.DOWN];

// Faces adjacent to eachother
// Each line represents a face which is commented
// For each line we have two entries: The first one is the face on the top
// and the second one is the face on the right
var ADJ = [
    [Face.BACK, Face.RIGHT, Face.FRONT, Face.LEFT], // UP
    [Face.UP, Face.FRONT, Face.DOWN, Face.BACK], // LEFT
    [Face.UP, Face.RIGHT, Face.DOWN, Face.LEFT], // FRONT
    [Face.UP, Face.BACK, Face.DOWN, Face.FRONT], // RIGHT
    [Face.UP, Face.LEFT, Face.DOWN, Face.RIGHT], // BACK
    [Face.FRONT, Face.RIGHT, Face.BACK, Face.LEFT], // DOWN
];

// Rotations for each of the faces in the ADJ matrix
// each rotation is the amount of degrees to turn the face so that it aligns
// perfectly with the face of that line
// The unit is 90º, so a value of 1 means we have to turn the face 90º so that
// it aligns with the face of that line
// values are [0..3]
var ROT = [
    [NaN,   3,   0,   1,   2, NaN], // U [U L F R B D]
    [  1, NaN,   0, NaN,   0,   3], // L [U L F R B D]
    [  0,   0, NaN,   0, NaN,   0], // F [U L F R B D]
    [  3, NaN,   0, NaN,   0,   1], // R [U L F R B D]
    [  2,   0, NaN,   0, NaN,   2], // B [U L F R B D]
    [NaN,   1,   0,   3,   2, NaN], // D [U L F R B D]
];


function State(state) {
    if (typeof(state) !== "string") throw new Error("State should be a string!");
    if (state.length % 6 != 0) throw new Error("State's length must be a multiple of 6");
    this.size = Math.sqrt(state.length / 6);
    if (this.size%1 != 0) throw new Error("Faces should be square");
    this.state = Array.from(state);
}

State.prototype.offset = function offset(face) {
    return offsets[face] * this.size * this.size;
}

// index of a sticker inside the state
State.prototype.index = function index(face, row, col) {
    return this.offset(face) + row*this.size + col;
}

State.prototype.row = function row(face, num = 0) {
    return this._line(face, true, num);
}

State.prototype.col = function col(face, num = 0) {
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
State.prototype.rotate = function rotate(face, cw, layers = [0]) {
    for (var i = 0; i < layers.length; i++) {
        if (layers[i] == 0) this._rotateFace(face, cw);
        if (layers[i] == this.size-1) this._rotateFace(-face, !cw);
        this._rotateRing(face, layers[i], cw);
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
State.prototype._rotateRing = function _rotateRing(face, layer = 0, cw) {
    var lines = [];
    for (var i = 0; i < 4; i++) lines.push(this._getAdjacentLine(face, i, layer));
    for (var j = 0; j <= this.size; j++) {
        console.log("swap ",lines[0][j], lines[1][j], lines[2][j], lines[3][j])
        swap4(this.state, lines[0][j], lines[1][j], lines[2][j], lines[3][j], cw);
    }
}

State.prototype._getAdjacentLine = function _getAdjacentLine(face, direction, layer) {
    var index = offsets[face];
    var dst = ADJ[index][direction]; // target face
    var dsti = offsets[dst];
    var fdir = (ROT[index][dsti]+direction+2) % 4;
    //console.log("From face: ", index, "to", dsti, "dir=",direction, "fdir =", fdir);

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

// TODO Add support for > 3x3 cubes
// Returns whatever is at the intersecion of the faces
State.prototype.get = function get(stickers) {

}
// returns the faces in which the piece searched for is located
// in the same order as the input
// For example find([Face.UP, Face.LEFT]) would return [Face.LEFT, Face.UP]
// if the UL edge was at the correct position but wrong orientation
// stickers: Array of length [0..2] containing the stickers to search for
State.prototype.find = function find(stickers) {
    var l = stickers.length;
    if (l < 1 || l > 3) throw new Error("Invalid search");
    if (l == 1) return this._findCenter(stickers);
    if (l == 2) return this._findEdge(stickers);
    if (l == 3) return this._findCorner(stickers);
}

// TODO Add support for > 3x3 cubes
State.prototype._findCenter = function _findCenter(stickers) {
    var s2 = this.size * this.size;
    var offset = parseInt(s2 / 2);
    var step = s2;
    for (var i = 0; i < 6; i++) {
        if (this.state[offset+step*i] == stickers[0]) return util.faceToChar(FACES[i]);
    }
}

// TODO Add support for > 3x3 cubes
State.prototype._findEdge = function _findEdge(stickers) {
    var s = stickers[0];

}

State.prototype._findCorner = function _findCorner(stickers) {
    var s = stickers[0];
}

State.prototype.algorithm = function algorithm(alg) {
    var moves = alg.split(" ");
    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        var p = 0;
        var c = move.charAt(p++);
        var face = util.charToFace(c);
        var axis = util.charToAxis(c);
        var cw = true;
        var upper = c == c.toUpperCase(); // uppercase letter is clockwise
        // process prime (inverts turn direction)
        c = move.charAt(p++);
        if (c == "'") {
            cw = !cw;
        }

        if (face) {
            var layers = [0];
            if (!upper) layers.push(1);
        } else if (axis) {
            var layers = []; for (var i = 0; i < this.size; i++) layers.push(i);
        }
        this.rotate(face, cw, layers);
    }
}


function swap4(v, i0, i1, i2, i3, cw) { if (cw) swap4CW(v, i0, i1, i2, i3); else swap4CCW(v, i0, i1, i2, i3); }
function swap4CCW(v, i0, i1, i2, i3) { console.log("ccw");swap4CW(v, i3, i2, i1, i0); }
function swap4CW(v, i0, i1, i2, i3) {
    tmp = v[i3];
    v[i3] = v[i2];
    v[i2] = v[i1];
    v[i1] = v[i0];
    v[i0] = tmp;
}


module.exports = { State: State };
