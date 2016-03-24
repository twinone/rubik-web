var Face = {
    RIGHT: 1, LEFT: -1,
    BACK: 2, FRONT: -2,
    UP: 3, DOWN: -3,
};

var faces = [Face.RIGHT, Face.BACK, Face.UP, Face.LEFT, Face.FRONT, Face.DOWN];

var Axis = {
    X: Face.RIGHT,
    Y: Face.BACK,
    Z: Face.UP,
    CUBE_X: Face.RIGHT,
    CUBE_Y: Face.UP,
    CUBE_Z: Face.FRONT,
};

function getFaceAxis(face) {
    if (face == LEFT  || face == RIGHT) return Axis.X;
    if (face == FRONT || face == BACK)  return Axis.Y;
    if (face == DOWN  || face == UP)    return Axis.Z;
}

function axisToIndex(axis) {
    if (axis == Axis.X) return 0;
    if (axis == Axis.Y) return 1;
    if (axis == Axis.Z) return 2;
}

function State(state) {
    if (typeof(state) !== "string") throw new Error("State should be a string!");
    if (state.length % 6 != 0) throw new Error("State's length must be a multiple of 6");
    var squaredSize = state.length / 6;
    size = Math.sqrt(squaredSize);
    if (this.size * this.size != squaredSize) throw new Error("Faces should be square");
    // TODO check if state is valid by checking permutations, etc?
    this.state = state;
}


module.exports = {
    Axis: Axis,
    Face: Face,
    faces: faces,
    getFaceAxis: getFaceAxis,
    axisToIndex: axisToIndex,
};
