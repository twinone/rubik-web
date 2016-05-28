var Cube = require("./vendor/cubejs/cube");
require("./vendor/cubejs/solve");

self.addEventListener("message", function (e) {
  if (e.data.name !== "solve") return;
  var state = e.data.state;

  // Slice our state into faces, so it's easy to manipulate
  var faces = {};
  "ULFRBD".split("").forEach(function (face, idx) {
    faces[face] = state.substring(idx*9, (idx+1)*9);
  });

  // Map our state to an unrotated one
  var mapping = {}, reverseMapping = {};
  Object.keys(faces).forEach(function (face) {
    mapping[faces[face][4]] = face;
    mapping[face] = faces[face][4];
  });
  Object.keys(faces).forEach(function (face) {
    faces[face] = faces[face].split("").map(function (c) {
      return (c in mapping) ? mapping[c] : c;
    }).join("");
  });

  // Solve!
  var cube = Cube.fromString("URFDLB".split("").map(function (face) {
    return faces[face];
  }).join(""));
  var alg = cube.solve();

  // Undo the mapping
  alg = alg.split("").map(function (c) {
    return (c in reverseMapping) ? reverseMapping[c] : c;
  }).join("");

  self.postMessage({ name: "solved", state: state, alg: alg });
});

Cube.initSolver();
self.postMessage({ name: "ready" });
