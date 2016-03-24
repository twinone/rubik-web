var model = require("./model");
var Face = model.Face;

// The order in which faces are serialized
var offsets = {};
offsets[Face.UP] = 0;
offsets[Face.LEFT] = 1;
offsets[Face.FRONT] = 2;
offsets[Face.RIGHT] = 3;
offsets[Face.BACK] = 4;
offsets[Face.DOWN] = 5;


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

State.prototype.rotate = function rotate(face, cw, layers) {
  this._rotateFace(face, cw);
  // TODO for {}
  this._rotateRing(face, 0, cw);
}

// Rotates the stickers on a face
State.prototype._rotateFace = function _rotateFace(face, cw) {
  var s = this.size;
  var rings = s / 2;
  for (var i = 0; i < rings; i++) {
      // offset = i
      for (var j = 0; j < s-i*2-1; j++) {
        console.log("swapping!",
        this.index(face, i,i+j),
        this.index(face, i+j,s-1-i),
        this.index(face, s-1-i,s-1-i-j),
        this.index(face, s-1-i-j,i)
      );
        swap4(this.state,
          this.index(face, i,i+j),
          this.index(face, i+j,s-1-i),
          this.index(face, s-1-i,s-1-i-j),
          this.index(face, s-1-i-j,i),
            cw);
      }
  }
}
// Rotates the stickers on a layer
State.prototype._rotateRing = function _rotateRing(face, layer, cw) {

}

function swap4(v, i0, i1, i2, i3, cw) { if (cw) swap4CW(v, i0, i1, i2, i3); else swap4CCW(v, i0, i1, i2, i3); }
function swap4CCW(v, i0, i1, i2, i3) { console.log("ccw");swap4CW(v, i3, i2, i1, i0); }
function swap4CW(v, i0, i1, i2, i3) {
  console.log("cw");
  tmp = v[i3];
  v[i3] = v[i2];
  v[i2] = v[i1];
  v[i1] = v[i0];
  v[i0] = tmp;
}


module.exports = { State: State };
