var INTERPOLATOR = INTERPOLATOR || {};

INTERPOLATOR.isInstance = function(obj) {
    if (!obj.hasOwnProperty('getInterpolation')) {
        return false;
    }
    // They should go from 0 to 1, 
    // even though intermediate points may be out of the range [0,1]
    if (obj.getInterpolation(0) != 0) return false;
    if (obj.getInterpolation(1) != 1) return false;
    return true;
}

INTERPOLATOR.getNames = function getNames() {
    return [
        'Linear', 
        'Accelerate', /*'Decelerate',*/ 'AccelerateDecelerate', 
        'Anticipate', 'Overshoot', 'AnticipateOvershoot'
    ];   
}

INTERPOLATOR.Linear = function () {
    this.getInterpolation = function (t) { return t; }
};

INTERPOLATOR.AccelerateDecelerate = function () {
    this.getInterpolation = function (t) { 
        return (Math.cos((t + 1) * Math.PI) / 2.0) + 0.5;
    }
};

INTERPOLATOR.Accelerate = function (factor) {
    this.factor = factor;
    this.getInterpolation = function (t) {
        if (!this.factor || this.factor == 1.0) {
            return t * t;
        }
        return Math.pow(t, this.factor * 2);
    }
};

// An interpolator where the change starts backward then flings forward.
INTERPOLATOR.Anticipate = function(tension) {
    this.tension = tension || 2.0;
    this.getInterpolation = function (t) {
        return t * t * ((this.tension + 1) * t - this.tension);
    }
}

// An interpolator where the change flings forward and overshoots the last value
// then comes back.
INTERPOLATOR.Overshoot = function(tension) {
    this.tension = tension || 2.0;
    this.getInterpolation = function (t) {
        t -= 1.0;
        return t * t * ((this.tension + 1) * t + this.tension) + 1.0;
    }
}

// An interpolator where the change starts backward then flings forward and overshoots
// the target value and finally goes back to the final value.
INTERPOLATOR.AnticipateOvershoot = function(tension) {
    this.tension = tension || 2.0;
    this.tension *= 1.2;
    this.a = function(t, s) { return t * t * ((s + 1) * t - s); }
    this.o = function(t, s) { return t * t * ((s + 1) * t + s); }
    this.getInterpolation = function (t) {
        if (t < 0.5) return 0.5 * this.a(t * 2.0, this.tension);
        else return 0.5 * (this.o(t * 2.0 - 2.0, this.tension) + 2.0);
    }
}

INTERPOLATOR.Bounce = function() {
    this.bounce = function(t) { return t * t * 8.0; }
    this.getInterpolation = function (t) {
        t *= 1.1226;
        if (t < 0.3535) return this.bounce(t);
        else if (t < 0.7408) return this.bounce(t - 0.54719) + 0.7;
        else if (t < 0.9644) return this.bounce(t - 0.8526) + 0.9;
        else return this.bounce(t - 1.0435) + 0.95;
    }
}

INTERPOLATOR.Template = function() {
    this.getInterpolation = function (t) {
        return t;
    }
}


