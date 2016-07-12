var Face = {
  RIGHT: 1, LEFT: -1,
  BACK: 2, FRONT: -2,
  UP: 3, DOWN: -3,
  NONE: 0,
}

var faces = [Face.RIGHT, Face.BACK, Face.UP, Face.LEFT, Face.FRONT, Face.DOWN]

var Axis = {
  X: Face.RIGHT,
  Y: Face.BACK,
  Z: Face.UP,
  CUBE_X: Face.RIGHT,
  CUBE_Y: Face.UP,
  CUBE_Z: Face.FRONT
}

function axisToIndex (axis) {
  if (axis == Axis.X) return 0
  if (axis == Axis.Y) return 1
  if (axis == Axis.Z) return 2
}

module.exports = {
  Axis: Axis,
  Face: Face,
  faces: faces,
  axisToIndex: axisToIndex
}
