function check (interpolator) {
  // They should go from 0 to 1, 
  // even though intermediate points may be out of the range [0,1]
  if (interpolator(0) != 0) return false
  if (interpolator(1) != 1) return false
  return true
}

var interpolators = {}

interpolators.linear = function linear () {
  return function interpolator (t) { return t; }
}

interpolators.accelerateDecelerate = function accelerateDecelerate () {
  return function interpolator (t) {
    return (Math.cos((t + 1) * Math.PI) / 2.0) + 0.5
  }
}

interpolators.accelerate = function accelerate (factor) {
  var factor = factor
  return function interpolator (t) {
    if (!factor || factor == 1.0)
      return t * t
    return Math.pow(t, factor * 2)
  }
}

// An interpolator where the change starts backward then flings forward.
interpolators.anticipate = function anticipate (tension) {
  tension = tension || 2.0
  return function interpolator (t) {
    return t * t * ((tension + 1) * t - tension)
  }
}

// An interpolator where the change flings forward and overshoots the last value
// then comes back.
interpolators.overshoot = function overshoot (tension) {
  tension = tension || 2.0
  return function interpolator (t) {
    t -= 1.0
    return t * t * ((tension + 1) * t + tension) + 1.0
  }
}

// An interpolator where the change starts backward then flings forward and overshoots
// the target value and finally goes back to the final value.
interpolators.anticipateOvershoot = function anticipateOvershoot (tension) {
  tension = tension || 2.0
  tension *= 1.2
  var a = function (t, s) { return t * t * ((s + 1) * t - s); }
  var o = function (t, s) { return t * t * ((s + 1) * t + s); }
  return function interpolator (t) {
    if (t < 0.5) return 0.5 * a(t * 2.0, tension)
    else return 0.5 * (o(t * 2.0 - 2.0, tension) + 2.0)
  }
}

interpolators.bounce = function bounce () {
  var bounce = function (t) { return t * t * 8.0; }
  return function interpolator (t) {
    t *= 1.1226
    if (t < 0.3535) return bounce(t)
    else if (t < 0.7408) return bounce(t - 0.54719) + 0.7
    else if (t < 0.9644) return bounce(t - 0.8526) + 0.9
    else return bounce(t - 1.0435) + 0.95
  }
}

function get (interpolator) {
  if (typeof interpolator === 'string') {
    if (!(interpolator in interpolators))
      throw new Error('Invalid interpolator name given')
    interpolator = interpolators[interpolator]()
  }

  if (!check(interpolator))
    throw new Error('the interpolator is expected to be a valid function or string')

  return interpolator
}

module.exports = {
  get: get,
  interpolators: interpolators
}
