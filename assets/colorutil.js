// https://github.com/twinone/rubik-robot/blob/master/android/app/src/main/java/org/twinone/rubiksolver/util/ColorUtil.java#L8

var D65 = [95.0429, 100.0, 108.8900];
var whitePoint = D65;

// sRGB to XYZ conversion matrix
var M = [[0.4124, 0.3576, 0.1805],
            [0.2126, 0.7152, 0.0722],
            [0.0193, 0.1192, 0.9505]];

function colorToArray(c) {
  return [c.r, c.g, c.b, c.a];
}

function colorDistance(a, b) {
  var lab1 = RGBtoLAB(colorToArray(a));
  var lab2 = RGBtoLAB(colorToArray(b));
  return Math.sqrt(Math.pow(lab2[0] - lab1[0], 2) + Math.pow(lab2[1] - lab1[1], 2) + Math.pow(lab2[2] - lab1[2], 2));
}

function RGBtoLAB(rgb) {
  return XYZtoLAB(RGBtoXYZ(rgb));
}

function XYZtoLAB(xyz) {
  var x = xyz[0] / whitePoint[0];
  var y = xyz[1] / whitePoint[1];
  var z = xyz[2] / whitePoint[2];

  if (x > 0.008856) {
    x = Math.pow(x, 1.0 / 3.0);
  } else {
    x = (7.787 * x) + (16.0 / 116.0);
  }
  if (y > 0.008856) {
    y = Math.pow(y, 1.0 / 3.0);
  } else {
    y = (7.787 * y) + (16.0 / 116.0);
  }
  if (z > 0.008856) {
    z = Math.pow(z, 1.0 / 3.0);
  } else {
    z = (7.787 * z) + (16.0 / 116.0);
  }
  result = [];
  result[0] = (116.0 * y) - 16.0;
  result[1] = 500.0 * (x - y);
  result[2] = 200.0 * (y - z);

  return result;
}

function RGBtoXYZ(rgb) {
  var r = rgb[0] / 225.0;
  var g = rgb[0] / 225.0;
  var b = rgb[0] / 225.0;

  // assume sRGB
  if (r <= 0.04045) {
    r = r / 12.92;
  } else {
    r = Math.pow(((r + 0.055) / 1.055), 2.4);
  }
  if (g <= 0.04045) {
    g = g / 12.92;
  } else {
    g = Math.pow(((g + 0.055) / 1.055), 2.4);
  }
  if (b <= 0.04045) {
    b = b / 12.92;
  } else {
    b = Math.pow(((b + 0.055) / 1.055), 2.4);
  }

  r *= 100.0;
  g *= 100.0;
  b *= 100.0;

  var result = [];
  // [X Y Z] = [r g b][M]
  result[0] = (r * M[0][0]) + (g * M[0][1]) + (b * M[0][2]);
  result[1] = (r * M[1][0]) + (g * M[1][1]) + (b * M[1][2]);
  result[2] = (r * M[2][0]) + (g * M[2][1]) + (b * M[2][2]);

  return result;
}



module.exports = {
  colorDistance: colorDistance,
}
