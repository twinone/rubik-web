navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

function displayVideo() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia({video: true}, videoSuccess, videoError);
  }
}

function videoSuccess(stream) {
  console.log("videosuccess");
  var vid = document.getElementById("capture-video");
  vid.src = window.URL.createObjectURL(stream);

  vid.onloadedmetadata = function() {
    onVideoLoaded(vid);
  }
}

function onVideoLoaded(vid) {

  var w = vid.offsetWidth;
  var h = vid.offsetHeight;
  var min = Math.min(w, h);
  var dx = (w-min)/2;
  var dy = (h-min)/2;

  var canvas = document.getElementById("capture-overlay");
  canvas.width = w;
  canvas.height = h;
  var c = canvas.getContext("2d");

  var lh = 5;
  c.strokeStyle = "#ffffff";
  c.lineWidth = lh;

  c.rect(dx+lh/2,dy+lh/2,min-lh,min-lh);
  c.stroke();

  c.rect(dx+lh/2,dy+min/3,min-lh,min/3);
  c.stroke();

  c.rect(dx+min/3,dy+lh/2,min/3,min-lh);
  c.stroke();

}

function videoError(e) {
  console.log("Permission denied");
}

function capture() {

}


module.exports = {
  displayVideo: displayVideo,
  capture: capture,
}
