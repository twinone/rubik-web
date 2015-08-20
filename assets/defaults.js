var prod_defaults = {
    size: 3,
    cubieWidth: 100,
    cubieSpacing: 0, // in terms of cubieWidth (now only for debugging)
    showLabels: true,
    labelMargin: 0.5, // in terms of cubieWidth * cubieSize
    
    colors: {
        faceRight: 0x009E60,
        faceLeft: 0x0051BA,
        faceUp: 0xFFD500,
        faceDown: 0xFFFFFF,
        faceFront: 0xC41E3A,
        faceBack: 0xFF5800,
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
    }
};

var dbg_defaults = {
    size: 3,
    cubieWidth: 100,
    cubieSpacing: 0, // in terms of cubieWidth (now only for debugging)
    showLabels: true,
    labelMargin: 0.5, // in terms of cubieWidth * cubieSize
    
    colors: {
        faceRight: 0x009E60,
        faceLeft: 0x0051BA,
        faceUp: 0xFFD500,
        faceDown: 0xFFFFFF,
        faceFront: 0xC41E3A,
        faceBack: 0xFF5800,
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
    }
};

module.exports = { defaults: prod_defaults };