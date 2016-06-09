var PI = Math.PI
var THREE = require('./vendor/three')
var util = require('./util')
var Cube = require('./cube').Cube
var Face = require('./model').Face
var faces = require('./model').faces
var Axis = require('./model').Axis

var facemap = {}
facemap[Face.RIGHT] = 0
facemap[Face.LEFT] = 1
facemap[Face.BACK] = 2
facemap[Face.FRONT] = 3
facemap[Face.UP] = 4
facemap[Face.DOWN] = 5

var facestr = [
  'RIGHT',
  'LEFT',
  'BACK',
  'FRONT',
  'UP',
  'DOWN'
]

Cubie.prototype = Object.create(THREE.Mesh.prototype)
Cubie.prototype.constructor = Cubie

function Cubie (geo, map, cube, i, j, k) {
  this.cube = cube
  this.origCoords = new THREE.Vector3(i, j, k)
  this.coords = new THREE.Vector3(i, j, k)
  this.map = map

  this._prepareDefaultStickers()
  var mat = this._getMaterials()
  THREE.Mesh.apply(this, [geo, mat])
}

Cubie.prototype._updateMaterials = function _updateMaterials () {
  var mat = this._getMaterials()
}

// Returns the sticker on the specified face of this cubie
// or null if no sticker on that face
Cubie.prototype.getSticker = function getSticker (face) {
  return this.stickers[face]
}

Cubie.prototype.setSticker = function setSticker (face, sticker) {
  this.stickers[face] = sticker

  var axis = util.faceToAxis(face)
  var r = new THREE.Euler()
  r.copy(this.rotation)
  // need to invert it
  r.set(-r.x, -r.y, -r.z, r.order.split('').reverse().join(''))
  axis.applyEuler(r)
  var f = util.axisToFace(axis)
  var dst = facemap[f]

  this.material.materials[dst].isSticker = true
  this.material.materials[dst].sticker = sticker
  this.material.materials[dst].color.setHex(this.cube.stickers[sticker])
}
// Only valid when all cubies are in their original positions.
// Order:
// R L B F U D
Cubie.prototype.setStickers = function setStickers (stickers) {
  if (stickers.length > 6) {
    throw new Error('stickers.length must be at most 6')
  }
  this.stickers = stickers
}

// Updates the internal state of the stickers to the world rotation
Cubie.prototype._rotateStickers = function _rotateStickers (axis) {
  //    console.log("Rotating stickers... axis=",axis)
  var cw = axis > 0
  if (Math.abs(axis) == Axis.X) rot(this.stickers, [Face.FRONT, Face.UP, Face.BACK, Face.DOWN], cw)
  if (Math.abs(axis) == Axis.Y) rot(this.stickers, [Face.LEFT, Face.DOWN, Face.RIGHT, Face.UP], cw)
  if (Math.abs(axis) == Axis.Z) rot(this.stickers, [Face.FRONT, Face.LEFT, Face.BACK, Face.RIGHT], cw)
}

function rot (obj, indexes, cw) {
  var l = indexes.length
  if (cw) {
    var tmp = obj[indexes[l - 1]]
    for (var i = l - 2; i >= 0; i--) obj[indexes[i + 1]] = obj[indexes[i]]
    obj[indexes[0]] = tmp
  } else {
    var tmp = obj[indexes[0]]
    for (var i = 0; i < l - 1; i++) obj[indexes[i]] = obj[indexes[i + 1]]
    obj[indexes[l - 1]] = tmp
  }
}

Cubie.prototype.roundRotation = function roundRotation () {
  this.rotation.x = intRound(mod(this.rotation.x, PI * 2), PI / 2)
  this.rotation.y = intRound(mod(this.rotation.y, PI * 2), PI / 2)
  this.rotation.z = intRound(mod(this.rotation.z, PI * 2), PI / 2)
}

function mod (a, b) {
  var m = a % b
  if (m < 0) m += b
  return m
}
function intRound (what, to) {
  var res = what + to / 2 - (what + to / 2) % to
  return res
}

Cubie.prototype._prepareDefaultStickers = function _prepareDefaultStickers () {
  var s = this.cube.size - 1

  var stickers = {}
  stickers[Face.RIGHT] = this.coords.x == s ? Face.RIGHT : undefined
  stickers[Face.LEFT] = this.coords.x == 0 ? Face.LEFT : undefined
  stickers[Face.BACK] = this.coords.y == s ? Face.BACK : undefined
  stickers[Face.FRONT] = this.coords.y == 0 ? Face.FRONT : undefined
  stickers[Face.UP] = this.coords.z == s ? Face.UP : undefined
  stickers[Face.DOWN] = this.coords.z == 0 ? Face.DOWN : undefined
  this.setStickers(stickers)
}

Cubie.prototype._getMaterials = function _getMaterials (stickers) {
  var wf = this.cube.wireframe
  var map = this.map
  var d = new THREE.MeshBasicMaterial({
    color: this.cube.colors.cube,
    wireframe: wf,
    wireframeLinewidth: 2,
    map: map
  })
  var self = this
  function mat (face) {
    return self.stickers[face] ?
      getStickerMaterial(self.cube.stickers[self.stickers[face]], map, wf, face) : d
  }
  var materials = [
    // R L B F U D
    mat(Face.RIGHT),
    mat(Face.LEFT),
    mat(Face.BACK),
    mat(Face.FRONT),
    mat(Face.UP),
    mat(Face.DOWN)
  ]
  return new THREE.MeshFaceMaterial(materials)
}

function getStickerMaterial (color, map, wireframe, face) {
  var mat = new THREE.MeshBasicMaterial({
    color: color,
    map: map,
    wireframe: wireframe,
    wireframeLinewidth: 2,
    side: THREE.FrontSide
  })
  mat.isSticker = true
  mat.sticker = face
  return mat
}

Cubie.prototype.invalidateColor = function invalidateColor (face) {
  var dst = facemap[face]
  if (this.material.materials[dst].isSticker)
    this.material.materials[dst].color.setHex(this.cube.stickers[face])
}
Cubie.prototype.invalidateColors = function invalidateColors () {
  var m = this.material.materials
  for (var i = 0; i < m.length; i++) {
    if (m[i].isSticker) m[i].color.setHex(this.cube.stickers[m[i].sticker])
  }
}

module.exports = {
  Cubie: Cubie
}
