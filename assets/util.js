var Axis = require("./model").Axis;
function swap4V(mat, v1, v2, v3, v4, cw) {
    swap4(mat, v1[0],v1[1],v1[2], v2[0],v2[1],v2[2], v3[0],v3[1],v3[2], v4[0],v4[1],v4[2], cw);
}

function swap4(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, cw) {
    if (cw) swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
    else swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4);
}

function swap4CCW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
    swap4CW(mat, x4,y4,z4, x3,y3,z3, x2,y2,z2, x1,y1,z1);
}

function swap4CW(mat, x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4) {
//    console.log("Swapping ("+x1+","+y1+","+z1+"),"+
//                "("+x2+","+y2+","+z2+"),"+
//                "("+x3+","+y3+","+z3+"),"+
//                "("+x4+","+y4+","+z4+")");
    tmp = mat[x4][y4][z4];
    mat[x4][y4][z4] = mat[x3][y3][z3];
    mat[x3][y3][z3] = mat[x2][y2][z2];
    mat[x2][y2][z2] = mat[x1][y1][z1];
    mat[x1][y1][z1] = tmp;
}



function rotateLayer(mat, axis, layer, cw) {
    if (Math.abs(axis) == Axis.X) rotateLayerX(mat, layer, cw);
    else if (Math.abs(axis) == Axis.Y) rotateLayerY(mat, layer, cw);
    else if (Math.abs(axis) == Axis.Z) rotateLayerZ(mat, layer, cw);
};

function rotateLayerX(mat, layer, cw) {
    var s = mat.length;
    var rings = s / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = s - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(mat, layer,i,i+j,  layer,i+j,s-1-i,   layer,s-1-i, s-1-i-j,   layer,s-1-i-j,i,  cw);
        }
    }
};

function rotateLayerY(mat, layer, cw) {
    var s = mat.length;
    var rings = s / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = s - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(mat, i+j,layer,i,   s-i-1,layer,i+j,   s-i-1-j,layer,s-i-1,   i,layer,s-i-1-j,  cw);
        }
    }
};

function rotateLayerZ(mat, layer, cw) {
    var s = mat.length;
    var rings = s / 2;
    for (var i = 0; i < rings; i++) {
        var ringSize = s - i * 2;
        // offset = i
        for (var j = 0; j < ringSize-1; j++) {
            swap4(mat, i,i+j,layer,  i+j,s-1-i,layer,  s-1-i,s-1-i-j,layer,  s-1-i-j,i,layer,  cw);
        }
    }
};

function empty(elem) {
    while (elem.lastChild) elem.removeChild(elem.lastChild);
}

function deepArrayEquals(a, b) {
    // if any array is a falsy value, return
    if (!a || !b)
        return false;

    // compare lengths - can save a lot of time 
    if (a.length != b.length)
        return false;

    for (var i = 0, l = a.length; i < l; i++) {
        // Check if we have nested arrays
        if (a[i] instanceof Array && b[i] instanceof Array) {
            // recurse into the nested arrays
            if (!deepArrayEquals(a[i], b[i]))
                return false;
        }
        else if (a[i] != b[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}


module.exports = {
    rotateLayer: rotateLayer,
    deepArrayEquals: deepArrayEquals,
    empty: empty,
};