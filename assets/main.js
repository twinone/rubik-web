var sel = document.getElementById('select-interpolator');
var ips = INTERPOLATOR.getNames();
for (var i = 0; i < ips.length; i++){
    var opt = document.createElement('option');
    opt.value = ips[i];
    opt.innerHTML = ips[i];
    sel.appendChild(opt);
}

sel.addEventListener('change', function() {
    cube.setInterpolator(this.value);
});

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function updateUI() {
    document.getElementById('size').textContent = cube.size;
}

function increment(i) {
    var size = cube.size + 1;
    cube.setSize(cube.size + i);
    updateUI();
}


var size = getParameterByName("size");
if (!size) size = 3;

var size = Number(size);

var cube = new Cube();
cube.setSize(size);
cube.init();
cube.showLabels();
updateUI();
