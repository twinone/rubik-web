var Axis = require("./model").Axis;
var Face = require("./model").Face;
var THREE = require("./vendor/three");

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
    tmp = mat[x4][y4][z4];
    mat[x4][y4][z4] = mat[x3][y3][z3];
    mat[x3][y3][z3] = mat[x2][y2][z2];
    mat[x2][y2][z2] = mat[x1][y1][z1];
    mat[x1][y1][z1] = tmp;
}

// http://threejs.org/docs/#Reference/Renderers/CanvasRenderer
function webglAvailable() {
	try {
		var canvas = document.createElement( 'canvas' );
		return !!( window.WebGLRenderingContext && (
			canvas.getContext( 'webgl' ) ||
			canvas.getContext( 'experimental-webgl' ) )
		);
	} catch ( e ) {
		return false;
	}
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


function faceToChar(face) {
    return faceToString(face)[0];
}
function faceToString(face) {
    switch (face) {
        case Face.FRONT: return 'FRONT'; case Face.BACK:  return 'BACK';
        case Face.UP:    return 'UP';    case Face.DOWN:  return 'DOWN';
        case Face.LEFT:  return 'LEFT';  case Face.RIGHT: return 'RIGHT';
    }
    return "X"
}

function faceToAxis(face) {
    var x, y, z;
    x = y = z = 0;
    switch (face) {
        case Face.LEFT:  x = -1; break; case Face.RIGHT: x = 1; break;
        case Face.FRONT: y = -1; break; case Face.BACK:  y = 1; break;
        case Face.DOWN:  z = -1; break; case Face.UP:    z = 1; break;
    }
    return new THREE.Vector3(x, y, z);
}

function axisToFace(axis) {
    if (axis.x == -1) return Face.LEFT;
    if (axis.x == 1) return Face.RIGHT;
    if (axis.y == -1) return Face.FRONT;
    if (axis.y == 1) return Face.BACK;
    if (axis.z == -1) return Face.DOWN;
    if (axis.z == 1) return Face.UP;
}


function getFaceIndex(face) {
    switch (face) {
        case Face.RIGHT: return 0; case Face.LEFT:  return 1;
        case Face.BACK:  return 2; case Face.FRONT: return 3;
        case Face.UP:    return 4; case Face.DOWN:  return 5;
    }
}


function charToAxis(letter) {
    switch (letter.toUpperCase()) {
        case 'X': return Axis.CUBE_X;
        case 'Y': return Axis.CUBE_Y;
        case 'Z': return Axis.CUBE_Z;
    }
}
function charToFace(letter) {
    switch (letter.toUpperCase()) {
        case 'U': return Face.UP;   case 'D': return Face.DOWN;
        case 'L': return Face.LEFT; case 'R': return Face.RIGHT;
        case 'B': return Face.BACK; case 'F': return Face.FRONT;
    }
    return Face.NONE;
}

function faceToColorString(face) {
    switch (face) {
        case Face.RIGHT: return "GREEN";  case Face.LEFT:  return "BLUE";
        case Face.BACK:  return "ORANGE"; case Face.FRONT: return "RED";
        case Face.UP:    return "YELLOW"; case Face.DOWN:  return "WHITE";
    }
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

// http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
// https://gist.github.com/niyazpk/f8ac616f181f6042d1e0
function appendQueryParameter(uri, key, value) {
    // remove the hash part before operating on the uri
    var i = uri.indexOf('#');
    var hash = i === -1 ? ''  : uri.substr(i);
    uri = i === -1 ? uri : uri.substr(0, i);

    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        uri = uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
        uri = uri + separator + key + "=" + value;
    }
    return uri + hash;  // finally append the hash as well
}

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getQueryParameter(name, url) {
    if (!url) url = window.location.href;
    url = url.toLowerCase(); // This is just to avoid case sensitiveness
    name = name.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// http://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

module.exports = {
    rotateLayer: rotateLayer,
    deepArrayEquals: deepArrayEquals,
    empty: empty,
    faceToChar: faceToChar,
    faceToString: faceToString,
    getFaceIndex: getFaceIndex,
    charToFace: charToFace,
    charToAxis: charToAxis,
    faceToColorString: faceToColorString,
    axisToFace: axisToFace,
    faceToAxis: faceToAxis,
    appendQueryParameter: appendQueryParameter,
    getQueryParameter: getQueryParameter,
    copyToClipboard: copyToClipboard,
    opposite: opposite,
    webglAvailable: webglAvailable,
};
