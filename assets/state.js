var model = require("./model");
var Face = model.Face;


function State(state) {
    if (typeof(state) !== "string") throw new Error("State should be a string!");
    if (state.length % 6 != 0) throw new Error("State's length must be a multiple of 6");
    var squaredSize = state.length / 6;
    this.size = Math.sqrt(squaredSize);
    if (this.size * this.size != squaredSize) throw new Error("Faces should be square");
    this.state = Array.from(state);
}

State.prototype.rotate = function rotate(face, layers) {
  this._rotateFace(face);
  this._rotateRing(face, layers);
}

// Rotates the stickers on a face
State.prototype._rotateFace = function _rotateFace(face) {
  

}
// Rotates the stickers on a layer
State.prototype._rotateRing = function _rotateRing() {

}

module.exports = { State: State };
