function random (length) {
  if (!length) length = 30
  function randInt (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  var turns = 'ULFRBD'
  var alg = []
  while (alg.length < length) {
    var m = turns[randInt(0, turns.length - 1)]
    var n = randInt(0, 2)
    if (n == 1) m += '2'
    if (n == 2) m += "'"
    alg.push(m)
    alg = optimize(alg)
  }
  return alg.join(' ')
}

function invert (alg) {
  var arr = alg.split(' ').reverse()
  arr.forEach(function (e, i, a) {
    a[i] = inv(e)
  })
  var rev = arr.join(' ')
  return rev
}

function replaceAll (str, search, replacement) {
  return str.replace(new RegExp(search, 'g'), replacement)
}

function transform (alg, map) {
  var faces = Array.from('ULFRBD')
  faces.forEach(function (c) { alg = replaceAll(alg, c, '_' + c); })
  for (var x in map) {
    if (!map.hasOwnProperty(x)) continue
    alg = replaceAll(alg, '_' + x, map[x])
  }
  faces.forEach(function (c) { alg = replaceAll(alg, '_' + c, c); })
  return alg
}

// copy of cube.optimizequeue
// input as an array of moves
function optimize (algorithm) {
  var alg
  if (typeof (algorithm) == 'string') alg = algorithm.split(' ')
  else alg = algorithm
  var found = true
  while (found) {
    found = false
    // remove opposite moves
    for (var i = alg.length - 2; i >= 0; i--) {
      if (alg[i] == inv(alg[i + 1])) {
        found = true
        alg.splice(i, 2)
        i--
      }
    }
    // remove 4 consecutive equal moves
    for (var i = alg.length - 3; i >= 0; i--) {
      if (alg[i] == alg[i + 1] &&
        alg[i + 1] == alg[i + 2]
      ) {
        found = true
        alg[i] = inv(alg[i])
        alg.splice(i + 1, 2)
        i--
      }
    }
  }
  if (typeof (algorithm) == 'string') return alg.join(' ')
  return alg
}

function inv (move) {
  if (move.slice(-1) == "'") return move.substr(0, move.length - 1)
  else return move + "'"
}

function rot (move) {
  var rot = 1
  if (isTwo(move)) rot *= 2
  if (isPrime(move)) rot *= -1
  return rot
}

function isTwo (move) {
  return move.charAt(1) == '2'
}

function isPrime (move) {
  return move.charAt(move.length - 1) == "'"
}

module.exports = {
  random: random,
  invert: invert,
  transform: transform,
  optimize: optimize,
  rot: rot,
  isTwo: isTwo,
  isPrime: isPrime
}
