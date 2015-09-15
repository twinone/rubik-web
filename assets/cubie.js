var PI = Math.PI;
var THREE = require("./vendor/three");
var util = require("./util");
var Cube = require("./cube").Cube;
var Face = require("./model").Face;
var Axis = require("./model").Axis;

Cubie.prototype = Object.create(THREE.Mesh.prototype);
Cubie.prototype.constructor = Cubie;

function Cubie(geo, map, cube, i, j, k) {
    this.cube = cube;
    this.origCoords = new THREE.Vector3(i, j, k);
    this.coords = new THREE.Vector3(i, j, k);
    
    var mat = this._getDefaultFaceMaterials(map);
    THREE.Mesh.apply(this, [geo, mat]);
}

// Returns the sticker on the specified face of this cubie
// or null if no sticker on that face
Cubie.prototype.getSticker = function getSticker(face) {
    // Cubie is rotated!
//    console.log("Stickers", this.stickers);
    var sticker = this.stickers[face];
//    console.log("Sticker on face " + util.faceToString(face) + ":" +sticker);
    return this.stickers[face];
}


// Only valid when all cubies are in their original positions.
// Order:
// R L B F U D
Cubie.prototype.setStickers = function setStickers(stickers) {
    if (stickers.length > 6) {
        throw new Error("stickers.length must be at most 6");
    }
    this.stickers = stickers;
}

// Updates the internal state of the stickers to the world rotation
Cubie.prototype._rotateStickers = function _rotateStickers(axis) {
//    console.log("Rotating stickers... axis=",axis);
    var cw = axis > 0;
    if (Math.abs(axis) == Axis.X) rot(this.stickers, [Face.FRONT, Face.UP,   Face.BACK,  Face.DOWN],  cw);
    if (Math.abs(axis) == Axis.Y) rot(this.stickers, [Face.LEFT,  Face.DOWN, Face.RIGHT, Face.UP],    cw);
    if (Math.abs(axis) == Axis.Z) rot(this.stickers, [Face.FRONT, Face.LEFT, Face.BACK,  Face.RIGHT], cw);
}


function rot(obj, indexes, cw) {
    var l = indexes.length;
    if (cw) {
        var tmp = obj[indexes[l-1]];
        for (var i = l-2; i >= 0; i--) obj[indexes[i+1]] = obj[indexes[i]];
        obj[indexes[0]] = tmp;
    } else {
        var tmp = obj[indexes[0]];
        for (var i = 0; i < l-1; i++) obj[indexes[i]] = obj[indexes[i+1]];
        obj[indexes[l-1]] = tmp;
    }
}



Cubie.prototype.setup = function setup(cube, i, j, k) {
    
    
}

Cubie.prototype.roundRotation = function roundRotation() {
    this.rotation.x = intRound(mod(this.rotation.x, PI*2), PI/2);
    this.rotation.y = intRound(mod(this.rotation.y, PI*2), PI/2);
    this.rotation.z = intRound(mod(this.rotation.z, PI*2), PI/2);
}

function mod(a, b) {
    var m = a % b;
    if (m < 0) m += b;
    return m;
}
function intRound(what, to) {
    var res = what + to/2 - (what+to/2) % to;
    return res;   
}

Cubie.prototype._getDefaultFaceMaterials = function _getDefaultFaceMaterial(map) {
    var wf = this.cube.wireframe;
    var d = new THREE.MeshBasicMaterial({
        color: this.cube.colors.cube,
        wireframe: wf,
        wireframeLinewidth: 2,
        map: map,
    });
    var s = this.cube.size -1;
    
    var stickers = {};
    stickers[Face.RIGHT] = this.coords.x == s ? Face.RIGHT : undefined;
    stickers[Face.LEFT]  = this.coords.x == 0 ? Face.LEFT : undefined;
    stickers[Face.BACK]  = this.coords.y == s ? Face.BACK : undefined;
    stickers[Face.FRONT] = this.coords.y == 0 ? Face.FRONT : undefined;
    stickers[Face.UP]    = this.coords.z == s ? Face.UP : undefined;
    stickers[Face.DOWN]  = this.coords.z == 0 ? Face.DOWN : undefined;
    this.setStickers(stickers);
    
    var materials = [
        // R L B F U D
        stickers[Face.RIGHT] ? getStickerMaterial(this.cube.stickers[stickers[Face.RIGHT]], map, wf) : d,
        stickers[Face.LEFT]  ? getStickerMaterial(this.cube.stickers[stickers[Face.LEFT]],  map, wf) : d,
        stickers[Face.BACK]  ? getStickerMaterial(this.cube.stickers[stickers[Face.BACK]],  map, wf) : d,
        stickers[Face.FRONT] ? getStickerMaterial(this.cube.stickers[stickers[Face.FRONT]], map, wf) : d,
        stickers[Face.UP]    ? getStickerMaterial(this.cube.stickers[stickers[Face.UP]],    map, wf) : d,
        stickers[Face.DOWN]  ? getStickerMaterial(this.cube.stickers[stickers[Face.DOWN]],  map, wf) : d,
    ];
    return new THREE.MeshFaceMaterial(materials);
};


function getStickerMaterial(color, map, wireframe) {
    return new THREE.MeshBasicMaterial({
        color: color,
        map: map,
        wireframe: wireframe,
        wireframeLinewidth: 2,
        side: THREE.FrontSide
    });
}


module.exports = {
    Cubie: Cubie,
}
