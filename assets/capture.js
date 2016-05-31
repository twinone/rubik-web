navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

// Scale the cropping view to this percentage of the camera view
var cropScale = 0.5;
var vid = document.getElementById("capture-video");


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
  var scale = 0.2;
  var canvas = document.createElement("canvas");
  canvas.width = s*scale;
  canvas.height = s*scale;
  canvas.getContext('2d')
        .drawImage(vid, dx,dy,s,s,0,0,s*scale,s*scale);

  var img = document.createElement("img");
  img.src = canvas.toDataURL();
  var images = document.getElementById("images");
  images.insertBefore(img, images.childNodes[0]);
}


module.exports = {
  displayVideo: displayVideo,
  capture: capture,
}
