navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// Scale the cropping view to this percentage of the camera view
var cropScale = 0.5;
var vid = document.getElementById("capture-video");
var faces = [];



function displayVideo() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia({video: true}, videoSuccess, videoError);
  }
}

function videoSuccess(stream) {
  console.log("videosuccess");
  vid.src = window.URL.createObjectURL(stream);

  vid.onloadedmetadata = function() {
    onVideoLoaded(vid);
  }
}

function onVideoLoaded() {

  var w = vid.offsetWidth;
  var h = vid.offsetHeight;
  var min = Math.min(w, h) * cropScale;
  var dx = (w-min)/2;
  var dy = (h-min)/2;

  var canvas = document.getElementById("capture-overlay");
  canvas.width = w;
  canvas.height = h;
  var c = canvas.getContext("2d");

  var lh = 3;
  c.strokeStyle = "#ffffff";
  c.lineWidth = lh;

  c.rect(dx+lh/2,dy+lh/2,min-lh,min-lh);
  c.stroke();

  c.rect(dx+lh/2,dy+min/3,min-lh,min/3);
  c.stroke();

  c.rect(dx+min/3,dy+lh/2,min/3,min-lh);
  c.stroke();

  canvas.addEventListener("click", function() {
    capture();
  });

}

function videoError(e) {
  console.log("Permission denied for camera");
}


function capture() {
  var w = vid.videoWidth;
  var h = vid.videoHeight;
  var s = Math.min(w, h) * cropScale;
  var dx = (w-s)/2;
  var dy = (h-s)/2;

  console.log("capturing!");
  var scale = 0.3;
  var canvas = document.createElement("canvas");
  canvas.width = s*scale;
  canvas.height = s*scale;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(vid, dx,dy,s,s,0,0,s*scale,s*scale);

  var img = document.createElement("img");
  img.src = canvas.toDataURL();
  var images = document.getElementById("images");
  images.insertBefore(img, images.childNodes[0]);
  faces.push(ctx.getImageData(0,0,s*scale,s*scale));
  if (faces.length == 1) {
    processFaces();
  }
}

function processFaces() {
  var state = [];
  for (var i = 0; i < faces.length; i++) {
      state.push(processFace(faces[i]));
  }
  faces = [];
  console.log(state);
}

function px(img, x, y) {
  var offset = (x+y*img.width)*4;
  return {
    'r': img.data[offset+0],
    'g': img.data[offset+1],
    'b': img.data[offset+2],
    'a': img.data[offset+3],
  }
}

function processFace(img) {
  console.log("Processing", img);
  var colors = [];
  var bs = img.width/3;
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      colors[i*3+j] = {'r': 0, 'g':0, 'b':0, 'a': 0};
      for (var k = 0; k < bs; k++) {
        for (var l = 0; l < bs; l++) {
          pixel = px(img, j*bs+l, i*bs+k);
          colors[i*3+j].r += pixel.r * pixel.r;
          colors[i*3+j].g += pixel.g * pixel.g;
          colors[i*3+j].b += pixel.b * pixel.b;
          colors[i*3+j].a += pixel.a * pixel.a;
        }
      }
      colors[i*3+j].r /= bs*bs;
      colors[i*3+j].g /= bs*bs;
      colors[i*3+j].b /= bs*bs;
      colors[i*3+j].a /= bs*bs;
    }
  }

  for (var i = 0; i < colors.length; i++) {
    colors[i].r = Math.sqrt(colors[i].r);
    colors[i].g = Math.sqrt(colors[i].g);
    colors[i].b = Math.sqrt(colors[i].b);
    colors[i].a = Math.sqrt(colors[i].a);
  }
  return colors;
}


module.exports = {
  displayVideo: displayVideo,
  capture: capture,
}
