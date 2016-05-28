var Face = require("./model").Face;

var stickers = {};
stickers[Face.RIGHT] = 0x009E60;
stickers[Face.LEFT] =  0x0051BA;
stickers[Face.BACK] =  0xFF5800;
stickers[Face.FRONT] = 0xC41E3A;
stickers[Face.UP] =    0xFFD500;
stickers[Face.DOWN] =  0xFFFFFF;

var prod_defaults = {
    size: 3,
    cubieWidth: 100,
    cubieSpacing: 0, // in terms of cubieWidth (now only for debugging)
    showLabels: true,
    labelMargin: 0.5, // in terms of cubieWidth * cubieSize

    // R L B F U D
    stickers: stickers,
    colors: {
        axisX: 0xAA0000,
        axisY: 0x00AA00,
        axisZ: 0x0000AA,
        label: 0x88004D40,
        background: 0xFFFFFF,
        cube: 0x000000,
    },

    wireframe: false,

    animation: {
        duration: 300, //ms
        interpolator: "linear" //name or function
    },

    click: true,
    dclick: false,
    dclickDelay: 400,

    moveStartListener: function(){},
    moveEndListener: function(){},
};

module.exports = { defaults: prod_defaults };
