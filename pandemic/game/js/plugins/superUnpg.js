/** /*:
 * 
 * @author William Ramsey
 * @plugindesc [BETA] - Animated foliage, trees and particles
 * 
 * @param Foliage Configuration
 * 
 * @param lpt
 * @text Sprite Limit per Thread
 * @desc How many sprites can a single thread handle?
 * @type Number
 * @default 1000
 * @parent Foliage Configuration
 * 
 * @param detail
 * @text Foliage Detail
 * @desc Amount of foliage generated per tile. (x2 for flowers)
 * @type Number
 * @default 16
 * @parent Foliage Configuration
 * 
 * @help
 * 
 * UNENGINE BETA
 * 
 * Draw foliage with regions!
 * Region 1 = tall grass
 * Region 2 = tree
 * Region 3 = tree + grass combo
 * Region 4 = Tree (passable)
 * Region 5 = Tree (passable) + grass combo
 * 
 * 
 * --SCRIPT CALLS--
 * Create overlays with 
 * UNPG.action.setOverlay('ovName', blend, opacity);
 * 
 * Names:
 * ovForest
 * ovCloud
 * ovAutumnGlow
 * 
 * Blend types:
 * 0: normal
 * 1: add
 * 2: multiply
 * 3: screen
 * 
 * opacity: 0-255
 * 
 * You can determine it's scroll with 
 * UNPG.action.setOverlayScroll(x, y);
 * 
 * --SPAWN PARTICLES--
 * UNPG.action.spawnParticles(amount,tile_x,tile_y,'particleName')
 * 
 * amount: Number of particles to spawn
 * tile_x: X on map to display
 * tile_y: Y on map to display
 * particleName: which particle to spawn
 * 
 * Names:
 * basicParticle
 * splashParticle
 * magicParticle
 * fireParticle
 * fireParticleLarge
 * 
 * PLUGIN COMMANDS:
 * 
 * sunBeam true {enables sunlight}
 * subBeam false {disables sunlight}
 * 
 * sunBeamConf number {where number is intensity of the beams}
 */

//______________________________________________________________
//Create UNPG object
//______________________________________________________________
const UNPG = { RENDERING: 0, PARTICLES: { RENDERING: 0 }, method: Utils.isNwjs() };
UNPG.sc;

(() => {
    let filterScript = document.createElement('script');
    filterScript.src = "/js/plugins/uppPixiFilterImports/pixi-filters/dist/pixi-filters.js";
    document.body.appendChild(filterScript);

    /**
     * Patch the apply functions of filters that wont work, since
     * filterFrame is missing from the equation.
     */
    const osmi = SceneManager.initialize;
    SceneManager.initialize = function() {
        osmi.apply(this, arguments);
        for (let i in PIXI.filters) {
            try {
                const oldFilterReply = PIXI.filters[i].prototype.apply;
                PIXI.filters[i].prototype.apply = function apply(filterManager, input, output, clear) {
                    input.filterFrame = {
                        width: Graphics.boxWidth,
                        height: Graphics.boxHeight
                    }
                    oldFilterReply.apply(this, arguments);
                }


            } catch (e) {

            }
        }
    }
})();

var __nodeWorkers;
if (UNPG.method === true) {

}
UNPG.MAPDATA = {};

UNPG.ONSCREEN0 = [];
UNPG.ONSCREEN1 = [];
UNPG.ONSCREEN2 = [];
UNPG.ONSCREEN3 = [];

UNPG.GLOBAL_WIND_POWER = 3;
UNPG.GLOBAL_WIND_SPEED = 1;
UNPG.GLOBAL_WIND_DIRECTION = 90;

const clearSpriteCache = () => {
    UNPG.ONSCREEN0.length = 0;
    UNPG.ONSCREEN1.length = 0;
    UNPG.ONSCREEN2.length = 0;
    UNPG.ONSCREEN3.length = 0;
    UNPG.SPRITELIMIT_WARNING = false;

    UN_RENDERER[0].postMessage(JSON.stringify({
        sc: { x: 0, y: 0, width: 0, height: 0, spd: UNPG.GLOBAL_WIND_SPEED, pow: UNPG.GLOBAL_WIND_POWER },
        dat: UNPG.ONSCREEN0
    }));

    UN_RENDERER[1].postMessage(JSON.stringify({
        sc: { x: 0, y: 0, width: 0, height: 0, spd: UNPG.GLOBAL_WIND_SPEED, pow: UNPG.GLOBAL_WIND_POWER },
        dat: UNPG.ONSCREEN1
    }));

    UN_RENDERER[2].postMessage(JSON.stringify({
        sc: { x: 0, y: 0, width: 0, height: 0, spd: UNPG.GLOBAL_WIND_SPEED, pow: UNPG.GLOBAL_WIND_POWER },
        dat: UNPG.ONSCREEN2
    }));

    UN_RENDERER[3].postMessage(JSON.stringify({
        sc: { x: 0, y: 0, width: 0, height: 0, spd: UNPG.GLOBAL_WIND_SPEED, pow: UNPG.GLOBAL_WIND_POWER },
        dat: UNPG.ONSCREEN3
    }));
}

const updateUnpgScreenData = () => {
    UNPG.sc = { x: $gameMap._displayX, y: $gameMap._displayY, width: Graphics.boxWidth, height: Graphics.boxHeight, spd: UNPG.GLOBAL_WIND_SPEED, pow: UNPG.GLOBAL_WIND_POWER };
}

//______________________________________________________________
//Create multi-threading ability
//______________________________________________________________
const UN_RENDERER = [
    new Worker('/js/plugins/unWorker.js'),
    new Worker('/js/plugins/unWorker.js'),
    new Worker('/js/plugins/unWorker.js'),
    new Worker('/js/plugins/unWorker.js')
];
UN_RENDERER[0].onmessage = async function(e) {
    await (() => {
        let d = JSON.parse(e.data);
        UNPG.ONSCREEN0 = d.dat;
    })();


}
UN_RENDERER[1].onmessage = async function(e) {
    await (() => {
        let d = JSON.parse(e.data);
        UNPG.ONSCREEN1 = d.dat;
    })();

}
UN_RENDERER[2].onmessage = async function(e) {
    await (() => {
        let d = JSON.parse(e.data);
        UNPG.ONSCREEN2 = d.dat;
    })();

}
UN_RENDERER[3].onmessage = async function(e) {
    await (() => {
        let d = JSON.parse(e.data);
        UNPG.ONSCREEN3 = d.dat;
    })();
}

//______________________________________________________________
//Start the thread loop.
//______________________________________________________________
const __threadLoop = async(thr) => {
    return new Promise((s, f) => {
        UN_RENDERER[0].postMessage(JSON.stringify({
            sc: UNPG.sc,
            dat: UNPG.ONSCREEN0
        }));

        UN_RENDERER[1].postMessage(JSON.stringify({
            sc: UNPG.sc,
            dat: UNPG.ONSCREEN1
        }));

        UN_RENDERER[2].postMessage(JSON.stringify({
            sc: UNPG.sc,
            dat: UNPG.ONSCREEN2
        }));

        UN_RENDERER[3].postMessage(JSON.stringify({
            sc: UNPG.sc,
            dat: UNPG.ONSCREEN3
        }));
        s();
    }).then().catch()
}


UNPG.PARAMS = PluginManager.parameters('superUnpg');


//______________________________________________________________
//Create Sprite class that takes advantage of multi-threads.
//______________________________________________________________
class unSprite {
    constructor(bitmap = new Bitmap(48, 48), target, x, y) {
        this.spr = new Sprite(bitmap);

        this.spr.x = x // - $gameMap._displayX;
        this.spr.y = y // - $gameMap._displayY;

        this.spr.startX = this.spr.x;
        this.spr.startY = this.spr.y;

        this.spr.float = 0;

        this.unRender = target;


        this.rx = 0;
        this.ry = 0;

        let limit = Number(UNPG.PARAMS['lpt']);

        let id = UNPG.ONSCREEN0.length + UNPG.ONSCREEN1.length + UNPG.ONSCREEN2.length + UNPG.ONSCREEN3.length;

        this.PROC = () => { return UNPG.ONSCREEN0; }
        if (UNPG.ONSCREEN0.length < limit) {
            UNPG.ONSCREEN0.push({
                x: this.spr.x,
                y: this.spr.y,
                sx: this.spr.startX,
                sy: this.spr.startY,
                ang: this.spr.angle,
                float: this.spr.float,
                isOnScreen: true,

                id,

                width: this.spr.bitmap.width,
                height: this.spr.bitmap.height
            });
            this.self = UNPG.ONSCREEN0.length - 1;
        } else {
            if (UNPG.ONSCREEN1.length < limit) {
                UNPG.ONSCREEN1.push({
                    x: this.spr.x,
                    y: this.spr.y,
                    sx: this.spr.startX,
                    sy: this.spr.startY,
                    ang: this.spr.angle,
                    float: this.spr.float,
                    isOnScreen: true,

                    id,

                    width: this.spr.bitmap.width,
                    height: this.spr.bitmap.height
                });
                this.self = UNPG.ONSCREEN1.length - 1;
                this.PROC = () => { return UNPG.ONSCREEN1; }
            } else {
                if (UNPG.ONSCREEN2.length < limit) {
                    UNPG.ONSCREEN2.push({
                        x: this.spr.x,
                        y: this.spr.y,
                        sx: this.spr.startX,
                        sy: this.spr.startY,
                        ang: this.spr.angle,
                        float: this.spr.float,
                        isOnScreen: true,

                        id,

                        width: this.spr.bitmap.width,
                        height: this.spr.bitmap.height
                    });
                    this.self = UNPG.ONSCREEN2.length - 1;
                    this.PROC = () => { return UNPG.ONSCREEN2; }
                } else {
                    if (UNPG.ONSCREEN3.length > limit) {
                        if (UNPG.SPRITELIMIT_WARNING === false) {
                            console.warn('SPRITE LIMIT REACHED\nFoliage tick will be reduced to conserve framerate.');
                            UNPG.SPRITELIMIT_WARNING = true;
                        }
                    }
                    UNPG.ONSCREEN3.push({
                        x: this.spr.x,
                        y: this.spr.y,
                        sx: this.spr.startX,
                        sy: this.spr.startY,
                        ang: this.spr.angle,
                        float: this.spr.float,
                        isOnScreen: true,

                        id,

                        width: this.spr.bitmap.width,
                        height: this.spr.bitmap.height
                    });
                    this.self = UNPG.ONSCREEN3.length - 1;
                    this.PROC = () => { return UNPG.ONSCREEN3; }
                }

            }
        }

    }

    async update() {
        return new Promise((s, f) => {
            try {
                let self = this.PROC()[this.self];

                this.spr.isOnScreen = self.isOnScreen;
                if (this.spr.isOnScreen) {
                    this.spr.x = this.spr.startX - ($gameMap._displayX * 48);
                    this.spr.y = this.spr.startY - ($gameMap._displayY * 48);

                    this.rx = Math.round((this.spr.x - 0.5) / 48);
                    this.ry = Math.round((this.spr.y - 0.5) / 48);
                    this.spr.visible = true;

                    if (this.sway !== false) {
                        this.spr.rotation = Math.sin(this.self + (this.spr.float / 8)) / (20 - UNPG.GLOBAL_WIND_POWER);
                    }

                    this.spr.float += UNPG.GLOBAL_WIND_SPEED / 10;

                    UNPG.RENDERING += 1 + (this.spr.children.length);


                } else {
                    this.spr.visible = false;

                }

            } catch (e) {
                this.PROC()[this.self] = {
                    x: this.spr.x,
                    y: this.spr.y,
                    sx: this.spr.startX,
                    sy: this.spr.startY,
                    ang: this.spr.angle,
                    float: this.spr.float,
                    isOnScreen: false,

                    width: this.spr.bitmap.width,
                    height: this.spr.bitmap.height
                }
            }
        }).then().catch();

    }
}

ImageManager.loadUnpg = function(filename, hue) {
    return this.loadBitmap('img/unpg/', filename, hue, true);
};
//Sprite footprint
//Used for stepping on grass.
const SPR_FOOTPRINT = {};

//______________________________________________________________
//Preload the needed sprites
//______________________________________________________________
const PRELOADS = {
    grassBlotch: ImageManager.loadUnpg('unpg_grassBlotch'),
    grassBlotchFlower: ImageManager.loadUnpg('unpg_grassBlotchFlower'),
    bushMask: ImageManager.loadUnpg('unpg_bushMask'),
    pathBlotch: ImageManager.loadUnpg('unpg_pathBlotch'),
    pathBlotchEdge: ImageManager.loadUnpg('unpg_pathBlotchEdge'),

    treeBase: ImageManager.loadUnpg('snapTreeBase'),
    treeBaseWide: ImageManager.loadUnpg('snapTreeBaseWide'),
    treeLeaf: ImageManager.loadUnpg('snapTreeLeaf'),
    treeLeafAlt: ImageManager.loadUnpg('snapTreeLeafAlt'),
    treeLeafAlt2: ImageManager.loadUnpg('snapTreeLeafAlt2'),

    rockBlotch: ImageManager.loadUnpg('unpg_rockBlotch'),
    hardRain: ImageManager.loadUnpg('tex_HardRain'),

    //Overlay preloads
    ovCloud: ImageManager.loadUnpg('overlay.clouds'),
    ovForest: ImageManager.loadUnpg('overlay.forest'),
    ovAutumnGlow: ImageManager.loadUnpg('overlay.autumnGlow'),

    tree: ImageManager.loadUnpg('snapTreeBase'),
    grass: ImageManager.loadUnpg('unpg_grassBlotch'),
    flowers: ImageManager.loadUnpg('unpg_grassBlotchFlower'),
    path: ImageManager.loadUnpg('unpg_pathBlotch'),
    water: ImageManager.loadUnpg('unpg_waterTile'),
}

//Extra functionality
UNPG.action = {
    spawnParticles: (amount, x, y, cmd) => {
        if ($dataMap.meta.unpgEditor) return;
        if (x > -2 + $gameMap._displayX && x < 2 + Graphics.boxWidth / 48 + $gameMap._displayX &&
            y > -2 + $gameMap._displayY && y < 2 + Graphics.boxHeight / 48 + $gameMap._displayY) {
            for (let i = 0; i < amount; i++) {
                SceneManager._scene.createUnpgParticle(UNPG.PARTICLES[cmd](x, y))
            }
        }
    },

    //set Overlay

    setOverlay: (which, blendMode = 2, opacity = 255) => {
        if ($dataMap.meta.unpgEditor) return;
        let target = SceneManager._scene.overlay;
        target.bitmap = PRELOADS[which];

        target.blendMode = blendMode;
        target.opacity = opacity;
    },

    setOverlayScroll: (x, y) => {
        if ($dataMap.meta.unpgEditor) return;
        OVERLAY_SCROLL.lxp = x;
        OVERLAY_SCROLL.lyp = y;
    }
};

OVERLAY_SCROLL = {
    lx: 0,
    ly: 0,
    lxp: 0,
    lyp: 0
};

(() => {
    UNPGDATA = {};

    var xmlhttp = new XMLHttpRequest();
    var url = "unpgDat.json";

    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            UNPGDATA = JSON.parse(this.responseText);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    //Plugin Commands
    const pCommands = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        pCommands.call(this, command, args);

        if (command === 'spawnParticles') {
            let amount = Number(args[0].toLowerCase());
            let x = Number(args[1]);
            let y = Number(args[2]);

            if (x > -2 + $gameMap._displayX && x < 2 + Graphics.boxWidth / 48 + $gameMap._displayX &&
                y > -2 + $gameMap._displayY && y < 2 + Graphics.boxHeight / 48 + $gameMap._displayY) {
                let cmd = UNPG.PARTICLES[args[3]];
                for (let i = 0; i < amount; i++) {
                    SceneManager._scene.createUnpgParticle(cmd(x, y))
                }
            }
            //$gameScreen.changeWeather(which, power, dur);
        }
    }




    //______________________________________________________________
    //Clear sprite cache on startup
    //______________________________________________________________
    const sbi = Scene_Base.prototype.start;
    Scene_Base.prototype.start = function() {
        sbi.apply(this, arguments);
        clearSpriteCache();
        __threadLoop();

        this.createUnpgShadow();
        this.unpgParticles = [];
        this.thrTick = 0;

        this.particleTarget = this;
    }

    Scene_Base.prototype.createUnpgShadow = function() {
        this.__lightSource = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.__lightSource.bitmap.fillAll('#000024');
        this.__lightSource.opacity = 0;
        this.addChild(this.__lightSource);
    }

    //////
    //
    //////
    UNPG.PARTICLES.basicParticle = (x, y) => {
        let bitmap = new Bitmap(8, 8);
        bitmap.context.filter = 'blur(4px)';
        bitmap.drawCircle(4, 4, 4, '#fff');
        let scale = 1 + Math.random();
        let _x = x * 48 + Math.random() * 32;
        let _y = y * 48 + Math.random() * 32;
        return {
            bitmap,
            data: {
                x: _x,
                y: _y,

                rx: _x,
                ry: _y,
                xvelocity: 0,
                yvelocity: 0,
                xgain: Math.random() - Math.random(),
                ygain: Math.random() - Math.random(),
                scalex: scale,
                scaley: scale,

                blendMode: 0,

                z: 4,
                zGain: 0,

                scalexgain: -0.02,
                scaleygain: -0.01,

                opacity: 255,
                opacityGain: -1,

                life: 100 - Math.round(Math.random() * 50),
                lifev: 0
            }
        }
    }

    UNPG.PARTICLES.splashParticle = (x, y) => {
        let bitmap = new Bitmap(8, 8);

        let color = ['#2211ff', '#1177ff', '#00ffff'];
        let index = Math.floor(Math.random() * color.length);
        let blendMode = 3;
        bitmap.drawCircle(4, 4, 1.5, color[index])
        let scale = 1 - Math.random();
        let _x = x * 48 + Math.random() * 32;
        let _y = y * 48;
        return {
            bitmap,
            data: {
                x: _x,
                y: _y,

                rx: _x,
                ry: _y,
                xvelocity: Math.random() - Math.random(),
                yvelocity: -Math.random(),
                xgain: 0,
                ygain: 0.01,
                scalex: scale,
                scaley: scale,

                blendMode: blendMode,

                z: 4,
                zGain: 0,

                scalexgain: 0.02,
                scaleygain: 0.01,

                opacity: 255,
                opacityGain: 0,

                life: 100 - Math.round(Math.random() * 50),
                lifev: 0
            }
        }
    }

    UNPG.PARTICLES.magicParticle = (x, y) => {
        let bitmap = new Bitmap(16, 16);
        bitmap.context.filter = 'blur(2px)';
        let color = ['#ff99ff', '#9988ff', '#5555ff'];
        let index = Math.floor(Math.random() * color.length);
        let blendMode = index;
        bitmap.drawCircle(8, 8, 4, color[index]);
        let scale = 1 + Math.random() / 2;
        let xr = Math.random() * 24;
        let _x = x * 48 + xr;
        let _y = 8 + y * 48 + Math.random() * 32;

        let xv = (xr > 16) ? -0.5 : 0.5
        return {
            bitmap,
            data: {
                x: _x,
                y: _y,

                phase: true,

                rx: _x,
                ry: _y,
                xvelocity: xv,
                yvelocity: -0.051 - Math.random() / 1.5,
                xgain: 0,
                ygain: 0,
                scalex: scale,
                scaley: scale,

                z: 1,
                zGain: 0.1,

                scalexgain: Math.random() * 0.0031 - Math.random() * 0.0031,
                scaleygain: -0.0031,

                opacity: 255,
                opacityGain: -2,

                blendMode: blendMode,

                life: 100 - Math.round(Math.random() * 50),
                lifev: 0
            }
        }
    }


    UNPG.PARTICLES.fireParticle = (x, y) => {
        let bitmap = new Bitmap(16, 16);
        bitmap.context.filter = 'blur(2px)';
        let color = ['#ff990090', '#99000090', '#ffff0090'];
        let index = Math.floor(Math.random() * color.length);
        let blendMode = Math.floor(Math.random() * 2);
        bitmap.drawCircle(8, 8, 4, color[index]);
        let scale = 1 - Math.random() / 2;
        let xr = Math.random() * 8;
        let _x = 4 + x * 48 + xr * 1.5;
        let _y = y * 48 + Math.random() * 32;

        let xv = (xr > 16) ? -0.5 : 0.5
        return {
            bitmap,
            data: {
                x: _x,
                y: _y,

                rx: _x,
                ry: _y,
                xvelocity: xv,
                yvelocity: -0.051 - Math.random() / 1.5,
                xgain: -(xv / 48),
                ygain: 0.005,
                scalex: scale,
                scaley: scale + Math.random(),
                z: 4,
                zGain: 0,

                scalexgain: Math.random() * 0.0031 - Math.random() * 0.0031,
                scaleygain: -0.0031,

                opacity: 255,
                opacityGain: -2,

                blendMode: blendMode,

                life: 100 - Math.round(Math.random() * 50),
                lifev: 0
            }
        }
    }

    UNPG.PARTICLES.fireParticleLarge = (x, y) => {
        let bitmap = new Bitmap(16, 16);
        bitmap.context.filter = 'blur(2px)';
        let color = ['#ff990090', '#99000090', '#ffff0090'];
        let index = Math.floor(Math.random() * color.length);
        let blendMode = Math.floor(Math.random() * 2);
        bitmap.drawCircle(8, 8, 4, color[index]);
        let scale = 1 - Math.random() / 2;
        let xr = Math.random() * 48;
        let _x = x * 48 + xr;
        let _y = y * 48 + Math.random() * 32;

        let xv = (xr > 16) ? -0.5 : 0.5
        return {
            bitmap,
            data: {
                x: _x,
                y: _y,

                rx: _x,
                ry: _y,
                xvelocity: xv,
                yvelocity: -0.051 - Math.random() / 1.5,
                xgain: -(xv / 48),
                ygain: 0.005,
                scalex: scale,
                scaley: scale + Math.random(),

                z: 4,
                zGain: 0,

                scalexgain: Math.random() * 0.0031 - Math.random() * 0.0031,
                scaleygain: -0.0031,

                opacity: 255,
                opacityGain: -2,

                blendMode: blendMode,

                life: 100 - Math.round(Math.random() * 50),
                lifev: 0
            }
        }
    }

    Scene_Base.prototype.createUnpgParticle = function(prop) {
        this.unpgParticles.push({
            spr: new Sprite(prop.bitmap),
            data: prop.data
        });
        this.unpgParticles[this.unpgParticles.length - 1].spr.z = prop.data.z;
        this.unpgParticles[this.unpgParticles.length - 1].spr.pivot.y = this.unpgParticles[this.unpgParticles.length - 1].spr.bitmap.height / 2;
        this.particleTarget.addChild(this.unpgParticles[this.unpgParticles.length - 1].spr);
    }


    const osu = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        this.thrTick++;
        this.warnTime = (UNPG.SPRITELIMIT_WARNING) ? 48 : 8
        if (this.thrTick == this.warnTime) {
            __threadLoop();
            this.thrTick = 0;
        }
        if (this.fixChildren) this.fixChildren();
        osu.apply(this, arguments);

        let target;
        let data;
        for (let i in this.unpgParticles) {
            target = this.unpgParticles[i].spr;
            data = this.unpgParticles[i].data;

            target.x = (data.rx - $gameMap._displayX * 48)
            data.rx += data.xvelocity;
            data.xvelocity += data.xgain;

            target.y = (data.ry - $gameMap._displayY * 48);
            data.ry += data.yvelocity;
            data.yvelocity += data.ygain;

            target.blendMode = data.blendMode

            target.scale.x = data.scalex,
                target.scale.y = data.scaley;

            target.opacity = data.opacity;
            data.opacity += data.opacityGain;

            data.scalex += data.scalexgain;
            data.scaley += data.scaleygain;

            if (data.zGain) {
                target.z += data.zGain;
            }
            data.lifev++;

            if (!data.phase) {
                data.xvelocity += Math.cos(UNPG.GLOBAL_WIND_DIRECTION / (180 / Math.PI)) * ((UNPG.GLOBAL_WIND_POWER / 1000) + UNPG.GLOBAL_WIND_SPEED / 1000);
                data.yvelocity += Math.sin(UNPG.GLOBAL_WIND_DIRECTION / (180 / Math.PI)) * ((UNPG.GLOBAL_WIND_POWER / 1000) + UNPG.GLOBAL_WIND_SPEED / 1000);
            }
            if (data.lifev >= data.life || (target.x < -100 || target.x > Graphics.boxWidth + 100 || target.y < -100 || target.y > Graphics.boxHeight + 100)) {
                this.particleTarget.removeChild(target);
                this.unpgParticles.splice(Number(i), 1)

            }
        }
    }



    //______________________________________________________________
    //Update sprite footprint
    //______________________________________________________________
    const oscp = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        oscp.apply(this, arguments);

        let newx = Math.round((this.x - 0.5) / 48);
        let newy = Math.round((this.y - 0.5) / 48);

        if (!SPR_FOOTPRINT[`${newx}x${newy}`]) {
            SPR_FOOTPRINT[`${newx}x${newy}`] = true;
            setTimeout(() => {
                delete SPR_FOOTPRINT[`${newx}x${newy}`];
            }, 1000 / 20)
        }
    };

    //Make regions block player
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        var flags = this.tilesetFlags();
        var tiles = this.allTiles(x, y);
        let rid = UNPGDATA[$gameMap._mapId].trees[String(x) + 'x' + String(y)];
        if (rid) return false;
        for (var i = 0; i < tiles.length; i++) {
            var flag = flags[tiles[i]];
            if ((flag & 0x10) !== 0) // [*] No effect on passage
                continue;
            if ((flag & bit) === 0) // [o] Passable
                return true;
            if ((flag & bit) === bit) // [x] Impassable
                return false;
        }
        return false;
    };

    //______________________________________________________________
    //Add to map start
    //______________________________________________________________

    const sms = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        sms.apply(this, arguments);
        if ($dataMap.meta.unpgEditor) {
            return;
        }
        this.particleTarget = this._spriteset._tilemap;

        if (!UNPG.MAPDATA[$gameMap._mapId]) {
            UNPG.MAPDATA[$gameMap._mapId] = {
                grassTiles: [],
                treeTiles: [],
                pathTiles: [],
            }

        }
        this.grassTiles = UNPG.MAPDATA[$gameMap._mapId].grassTiles;
        this.treeTiles = UNPG.MAPDATA[$gameMap._mapId].treeTiles;
        this.pathTiles = UNPG.MAPDATA[$gameMap._mapId].pathTiles;

        this.pathPlant = new Sprite(new Bitmap($dataMap.width * 48, $dataMap.height * 48));
        this.pathPlant.z = 1;
        this._spriteset._tilemap.addChild(this.pathPlant);

        if (this.grassTiles.length > 0) {
            for (let i = 0; i < this.grassTiles.length; i++) {
                this._spriteset._tilemap.addChild(this.grassTiles[i].spr)
            }
        } else {
            for (let i = 0; i < $dataMap.width; i++) {
                for (let j = 0; j < $dataMap.height; j++) {
                    //if ($gameMap.regionId(i, j) === 1) {
                    if (UNPGDATA[$gameMap._mapId].grass[String(i) + 'x' + String(j)]) {
                        this.createGrassBlotch(i * 48, j * 48);
                    }
                    if (UNPGDATA[$gameMap._mapId].flowers[String(i) + 'x' + String(j)]) {
                        this.createGrassBlotch(i * 48, j * 48, true);
                    }
                }
            }
        }

        if (this.treeTiles.length > 0) {
            for (let i = 0; i < this.treeTiles.length; i++) {
                this._spriteset._tilemap.addChild(this.treeTiles[i].spr)
            }
        } else {
            for (let i = 0; i < $dataMap.width; i++) {
                for (let j = 0; j < $dataMap.height; j++) {

                    if (UNPGDATA[$gameMap._mapId].grass[String(i) + 'x' + String(j)]) {
                        this.createGrassBlotch(i * 48, j * 48);
                    }

                    if (UNPGDATA[$gameMap._mapId].trees[String(i) + 'x' + String(j)]) {

                        this.createTreeBlotch(i * 48, j * 48);
                    }

                    if (UNPGDATA[$gameMap._mapId].passTrees[String(i) + 'x' + String(j)]) {
                        this.createTreeBlotch(-24 + i * 48, 24 + j * 48, true);
                    }
                }
            }
        }

        for (let i = 0; i < $dataMap.width; i++) {
            for (let j = 0; j < $dataMap.height; j++) {
                if (UNPGDATA[$gameMap._mapId].path[String(i) + 'x' + String(j)]) {
                    this.createPathBlotch(-24 + i * 48, -24 + j * 48, true);
                }
            }
        }

        this.renderDebug = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this.addChild(this.renderDebug);

        this.overlay = new TilingSprite();
        this.overlay.move(0, 0, Graphics.boxWidth, Graphics.boxHeight);
        this.overlay.blendMode = 3;
        this.overlay.z = 8;

        this._spriteset._tilemap.addChild(this.overlay);
    }

    /**
     * @function createGrassBlotch
     * Creates a grass patch
     */
    Scene_Map.prototype.createGrassBlotch = function(x, y, flower) {
        let _x;
        let _y;

        for (let i = 0; i < Number(UNPG.PARAMS['detail']); i++) {
            _x = x + Math.random() * 24 - Math.random() * 24;
            _y = y + Math.random() * 24 - Math.random() * 24;
            _y += 32;
            _x += 16 + Math.random() * 16;
            UNPG.MAPDATA[$gameMap._mapId].grassTiles.push(new unSprite(PRELOADS.grassBlotch, this._spriteset._tilemap, _x, _y));
            let self = UNPG.MAPDATA[$gameMap._mapId].grassTiles[UNPG.MAPDATA[$gameMap._mapId].grassTiles.length - 1];
            self.spr.z = 3;
            self.spr.scale.x = 1;
            self.spr.scale.y = 1;
            self.spr.pivot.y = self.spr.bitmap.height / 1.12;
            self.spr.pivot.x = self.spr.bitmap.width / 2;

            if (flower) {
                if (i % 3 === 1) {
                    self.flower = new Sprite(ImageManager.loadUnpg('unpg_grassBlotchFlower', Math.random() * 255));
                    self.spr.addChild(self.flower);
                }
            }

            this._spriteset._tilemap.addChild(self.spr)
        }
    }

    /**
     * @function createPathBlotch
     * Creates a path patch
     */
    Scene_Map.prototype.createPathBlotch = function(x, y) {
        this.pathPlant.bitmap.blt(PRELOADS['path'], 0, 0, PRELOADS['path'].width, PRELOADS['path'].height, x, y, PRELOADS['path'].width, PRELOADS['path'].height)
    }

    /**
     * @function createTreeBlotch
     * Creates a tree.
     */
    Scene_Map.prototype.createTreeBlotch = function(x, y, bumper = false) {
        let _x;
        let _y;


        _x = x + PRELOADS.treeBase.width / 4;
        _y = y + PRELOADS.treeBase.height / 4;

        UNPG.MAPDATA[$gameMap._mapId].treeTiles.push(new unSprite(PRELOADS.treeBase, this._spriteset._tilemap, _x, _y));
        let self = UNPG.MAPDATA[$gameMap._mapId].treeTiles[UNPG.MAPDATA[$gameMap._mapId].treeTiles.length - 1];
        self.spr.z = 3;
        self.spr.scale.x = 1;
        self.spr.scale.y = 1;

        self.spr.pivot.y = self.spr.bitmap.height / 1.2;
        self.spr.pivot.x = self.spr.bitmap.width / 2.5;
        let _leaf;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 6; j++) {
                let r = -self.spr.bitmap.width / 4 + Math.random() * self.spr.bitmap.width / 2;
                _leaf = new unSprite(PRELOADS.treeLeaf, this._spriteset._tilemap, _x + r, -48 + _y + -PRELOADS.treeLeaf.height / 6 + Math.random() * self.spr.bitmap.height / 2);

                _leaf.spr.pivot.y = _leaf.spr.bitmap.height * 1.5;
                _leaf.spr.pivot.x = 24;
                _leaf.spr.startY += 24 + Math.random() * self.spr.bitmap.height / 3.5;
                _leaf.spr.z = 3;
                this._spriteset._tilemap.addChild(_leaf.spr);
                UNPG.MAPDATA[$gameMap._mapId].treeTiles.push(_leaf);
            }
        }

        self.sway = false;
        this._spriteset._tilemap.addChild(self.spr)

    }

    const smu = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        smu.apply(this, arguments);
        if ($dataMap.meta.unpgEditor) {
            return;
        }
        updateUnpgScreenData();

        this.overlay.origin.x = OVERLAY_SCROLL.lx + $gameMap._displayX * 64;
        this.overlay.origin.y = OVERLAY_SCROLL.ly + $gameMap._displayY * 64;

        this.pathPlant.x = -$gameMap._displayX * 48;
        this.pathPlant.y = -$gameMap._displayY * 48;

        OVERLAY_SCROLL.lx += OVERLAY_SCROLL.lxp;
        OVERLAY_SCROLL.ly += OVERLAY_SCROLL.lyp;

        this.__lightSource.x = -$gameMap._displayX * 48;
        this.__lightSource.y = -$gameMap._displayY * 48;

        for (let i = 0; i < this.grassTiles.length; i++) {
            this.grassTiles[i].update();
            if (SPR_FOOTPRINT[`${this.grassTiles[i].rx}x${this.grassTiles[i].ry}`]) {
                this.grassTiles[i].spr.scale.y /= 1.005;
            } else {
                this.grassTiles[i].spr.scale.y *= 1.005;
            }
            this.grassTiles[i].spr.scale.y = Math.min(Math.max(this.grassTiles[i].spr.scale.y, 0.75), 1);


        }

        for (let i = 0; i < this.treeTiles.length; i++) {
            this.treeTiles[i].update();
        }

        //this.DISPLAY_DEBUG();
    }

    Scene_Map.prototype.fixChildren = async function() {
        if ($dataMap.meta.unpgEditor) {
            return;
        }
        return new Promise((a, s) => {
            for (let i = 0; i < this.grassTiles.length; i++) {
                if (this.grassTiles[i].visible === false) {
                    this._spriteset._tilemap.removeChild(this.grassTiles[i].spr);
                    this.grassTiles[i].REMOVED = true;
                } else {
                    if (this.grassTiles[i].REMOVED === true) {
                        this._spriteset._tilemap.addChild(this.grassTiles[i].spr)
                        this.grassTiles[i].REMOVED = false;
                    }
                }

            }
            a();
        }).then().catch();

    }

    Scene_Map.prototype.DISPLAY_DEBUG = function() {
        this.renderDebug.bitmap.clear();

        this.renderDebug.bitmap.fontSize /= 2;
        this.renderDebug.bitmap.drawText(`[f:${UNPG.RENDERING}, p:${UNPG.PARTICLES.RENDERING}] sprites currently rendering`, 0, 0, 640, 48, 'left')
        this.renderDebug.bitmap.drawText(`Objects`, 0, Window_Base.prototype.lineHeight(), 640, 48, 'left')

        this.renderDebug.bitmap.drawText(`Proc 0: ${UNPG.ONSCREEN0.length}/${UNPG.PARAMS['lpt']}`, 0, Window_Base.prototype.lineHeight() * 1.5, 640, 48, 'left')
        this.renderDebug.bitmap.drawText(`Proc 1: ${UNPG.ONSCREEN1.length}/${UNPG.PARAMS['lpt']}`, 0, Window_Base.prototype.lineHeight() * 2, 640, 48, 'left')
        this.renderDebug.bitmap.drawText(`Proc 2: ${UNPG.ONSCREEN2.length}/${UNPG.PARAMS['lpt']}`, 0, Window_Base.prototype.lineHeight() * 2.5, 640, 48, 'left')
        this.renderDebug.bitmap.drawText(`Proc 3: ${UNPG.ONSCREEN3.length}/${UNPG.PARAMS['lpt']}`, 0, Window_Base.prototype.lineHeight() * 3, 640, 48, 'left')
        this.renderDebug.bitmap.drawText(`Wind: ${UNPG.GLOBAL_WIND_DIRECTION}°`, 0, Window_Base.prototype.lineHeight() * 3.5, 640, 48, 'left')


        if (UNPG.SPRITELIMIT_WARNING) {
            this.renderDebug.bitmap.drawText(`Overload Warning: Reducing unpg tick to improve performance.`, 0, 0, Graphics.boxWidth, 48, 'right')
        }
        this.renderDebug.bitmap.fontSize *= 2;
        UNPG.RENDERING = 0;
        UNPG.PARTICLES.RENDERING = this.unpgParticles.length;

    }
})();


(() => {

    const pCommands = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        pCommands.call(this, command, args);
        if (command === 'sunBeam') {
            switch (args[0]) {
                case 'true':
                    SceneManager._scene.proSunBeam.enabled = true;
                    SceneManager._scene.proSunLight.enabled = true;
                    GLOBAL_ENABLED = true;
                    break;
                case 'false':
                    SceneManager._scene.proSunBeam.enabled = false;
                    SceneManager._scene.proSunLight.enabled = false;
                    GLOBAL_ENABLED = false;
                    break;
            }
        }
        if (command === 'sunBeamConf') {
            SceneManager._scene.proSunBeam.gain = Number(args[0])
        }
    };

    var GLOBAL_ENABLED = false;
    var proSunBeam;
    var proSunLight;

    const sms = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        sms.apply(this, arguments);
        if (!proSunBeam) {
            proSunBeam = new PIXI.filters.GodrayFilter({
                angle: -45,
                parallel: true,
                gain: 0.23,
                lacunarity: 15
            });
            proSunLight = new PIXI.filters.AdjustmentFilter({
                gamma: 0.9,
                saturation: 0.9,
                contrast: 1.1,
                red: 1.1,
                green: 1,
                blue: 0.87
            });
        }

        this.proSunBeam = proSunBeam;
        this.proSunLight = proSunLight;
        proSunBeam.enabled = GLOBAL_ENABLED;
        proSunLight.enabled = GLOBAL_ENABLED;
        proSunBeam.progress = 0;
        proSunLight.blendMode = 0;
        this.proFilters = [];
        this.proFilters.push(proSunBeam);
        this.proFilters.push(proSunLight);
        this.children[0].filters = this.proFilters;
    }

    const smu = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        smu.apply(this, arguments);
        proSunBeam.time = ($gameMap._displayY + $gameMap._displayX) / 16 + proSunBeam.progress;
        proSunBeam.progress += 0.005;
    }

})();


/*-------------EDITOR
 */

(() => {

    const PRELOADS = {
        tree: ImageManager.loadUnpg('snapTreeBase'),
        grass: ImageManager.loadUnpg('unpg_grassBlotch'),
        flowers: ImageManager.loadUnpg('unpg_grassBlotchFlower'),
        path: ImageManager.loadUnpg('unpg_pathBlotch'),
        water: ImageManager.loadUnpg('unpg_waterTile'),
    }
    UNPGDATA = {};
    const fs = require('fs');
    if (!fs.existsSync('./unpgDat.json')) {
        fs.writeFileSync('./unpgDat.json', "{}");
    }
    fs.readFile('./unpgDat.json', (err, data) => {
        if (err) throw err;
        UNPGDATA = JSON.parse(data);
    });

    const MOUSE = {};
    const oldTouchIn = TouchInput._onMouseMove;
    TouchInput._onMouseMove = function(event) {
        oldTouchIn.apply(this, arguments);
        MOUSE.x = Graphics.pageToCanvasX(event.pageX);
        MOUSE.y = Graphics.pageToCanvasY(event.pageY);
        MOUSE.moved = true;
    };

    const orc = TouchInput._onMouseDown
    TouchInput._onMouseDown = function(event) {
        this.which = event.button;

        if (event.button === 0) {
            this._onLeftButtonDown(event);
        } else if (event.button === 1) {
            this._onMiddleButtonDown(event);
        } else if (event.button === 2) {
            this._onRightButtonDown(event);
        }
    };

    TouchInput._onRelease = function(x, y) {
        this._events.released = true;
        this._x = x;
        this._y = y;
        this._mousePressed = false;
        this._pressedTime = 0;
    };

    __EDITING = false;
    TouchInput._onRightButtonDown = function(event) {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        if (Graphics.isInsideCanvas(x, y)) {
            this._onCancel(x, y);

            if (__EDITING) {
                this._mousePressed = true;
                this._pressedTime = 0;
                this._onTrigger(x, y);
            }
        }
    };

    TouchInput._onMouseUp = function(event) {
        if (event.button === 0 || event.button === 2) {
            var x = Graphics.pageToCanvasX(event.pageX);
            var y = Graphics.pageToCanvasY(event.pageY);
            this._mousePressed = false;
            this._onRelease(x, y);
        }
    };

    /**
     * @class uButton
     * Creates a button
     */
    class uButton extends Sprite {
        constructor(text, x, y, width, height) {
            super(new Bitmap(width, height));

            this.text = text;
            this.bgColor = {
                unselected: '#333',
                selected: '#999',
                active: '#229956',
            };
            this.borderColor = {
                unselected: '#999',
                selected: '#333',
                active: '#55ff9a'
            }

            this.active = false;

            this.x = x;
            this.y = y;

            //Set activate function
            this.activeTimer = 0;
        }

        onActivate() {
            console.log('wai');
        }

        /**
         * @method mouseInPosition
         * returns true if mouse is hovering over button.
         */
        mouseInPosition() {
            return (MOUSE.x > this.x && MOUSE.x < this.x + this.bitmap.width &&
                MOUSE.y > this.y && MOUSE.y < this.y + this.bitmap.height)
        }

        /**
         * @method drawButton
         * Draws the button.
         */
        drawButton() {
            this.checkActive();
            this.bitmap.clear();
            if (this.mouseInPosition()) {
                this.bitmap.context.fillStyle = this.bgColor.selected;
                this.bitmap.context.strokeStyle = this.borderColor.selected;

                this.bitmap.context.fillRect(0, 0, this.bitmap.width, this.bitmap.height);
                this.bitmap.context.strokeRect(0, 0, this.bitmap.width, this.bitmap.height);
            } else {
                this.bitmap.context.fillStyle = this.bgColor.unselected;
                this.bitmap.context.strokeStyle = this.borderColor.unselected;

                this.bitmap.context.fillRect(0, 0, this.bitmap.width, this.bitmap.height);
                this.bitmap.context.strokeRect(0, 0, this.bitmap.width, this.bitmap.height);
            }
            if (this.active) {
                this.bitmap.context.fillStyle = this.bgColor.active;
                this.bitmap.context.strokeStyle = this.borderColor.active;

                this.bitmap.context.fillRect(0, 0, this.bitmap.width, this.bitmap.height);
                this.bitmap.context.strokeRect(0, 0, this.bitmap.width, this.bitmap.height);
            }

            this.bitmap.fontSize = this.fontSize();
            this.bitmap.drawText(this.text, 0, 0, this.bitmap.width, this.bitmap.height, 'center');
        }

        /**
         * @method checkActive
         * Activate the button
         */
        checkActive() {
            if (TouchInput.isPressed()) {
                if (this.mouseInPosition()) {
                    this.activeTimer++;
                    if (this.activeTimer === 1) {
                        this.active = true;
                        this.onActivate.apply(this, arguments);
                    }
                }
            } else {
                this.active = false;
                this.activeTimer = 0;
            }
        }

        /**
         * @method fontSize
         * Default font size
         */
        fontSize() {
            return 16;
        }
    }




    const smpt = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (!this.editorMode) {
            smpt.apply(this, arguments);
        } else {
            if (TouchInput.isPressed()) {
                if (TouchInput.y > 48) {
                    let x = Math.round((-24 + TouchInput.x) / 48) + this.editorX;
                    let y = Math.round((-24 + TouchInput.y) / 48) + this.editorY;

                    let ax = Math.round(TouchInput.x / 48) + this.editorX;
                    let ay = Math.round(TouchInput.y / 48) + this.editorY;
                    if (TouchInput.which === 0) {
                        this.uDat[this.editing][String(x) + 'x' + String(y)] = true;
                    }
                    if (TouchInput.which === 2) {
                        delete this.uDat[this.editing][String(x) + 'x' + String(y)];
                    }
                }
            }

        }
    };

    const sms = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        sms.apply(this, arguments);
        if ($dataMap.meta.unpgEditor) {
            __EDITING = true
            if (!UNPGDATA[String($gameMap._mapId)]) {
                UNPGDATA[String($gameMap._mapId)] = {
                    grass: {
                        icon: 'grass',
                        letter: ''
                    },
                    trees: {
                        icon: 'tree',
                        letter: ''
                    },
                    passTrees: {
                        icon: 'tree',
                        letter: '!'
                    },
                    flowers: {
                        icon: 'flowers',
                        letter: ''
                    },
                    water: {
                        icon: 'water',
                        letter: '~'
                    },
                    land: {
                        icon: 'path',
                        letter: ''
                    },
                    path: {
                        icon: 'path',
                        letter: ''
                    }
                }
            }
            this.eraseMode = false;
            this.uDat = UNPGDATA[String($gameMap._mapId)];
            this.editing = 'grass';


            this.editorMode = true;
            this.editorX = -1;
            this.editorY = -1;
            this.editor = new Sprite();
            this.addChild(this.editor);

            this.editorGrid = new Sprite(new Bitmap($dataMap.width * 48, $dataMap.height * 48));
            this.editorGrid.bitmap.context.strokeStyle = '#ffffff90';
            this.editor.addChild(this.editorGrid);

            this.editorDebug = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight))
            this.editor.addChild(this.editorDebug);

            this.createGrid();
            this.createEditorButtons();
            window.addEventListener("keydown", e => {
                if (e.isComposing || e.keyCode === 229) {
                    return;
                }
                this.updateEditorInput(e);
            });
            return;
        }
    }

    Scene_Map.prototype.createGrid = function() {
        this.editorGrid.bitmap.clear();
        for (let i = 0; i < $dataMap.width; i++) {
            for (let j = 0; j < $dataMap.height; j++) {
                this.editorGrid.bitmap.context.strokeRect(i * 48, j * 48, 48, 48);

                //Draw icons
                let bumpIndex = 0;
                for (let k in this.uDat) {
                    if (this.uDat[k][String(i) + 'x' + String(j)]) {
                        let img = PRELOADS[this.uDat[k].icon];
                        this.editorGrid.bitmap.blt(img, 0, 0, img.width, img.height, (i * 48) + bumpIndex, (j * 48) + bumpIndex, 24, 24);
                        this.editorGrid.bitmap.drawText(this.uDat[k].letter, (i * 48) + bumpIndex, (j * 48) + bumpIndex, 24, 24);
                        bumpIndex += 8;
                    }
                }

            }
        }
    }

    const smu = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        smu.apply(this, arguments);
        if (this.editorMode) {
            this.updateEditorDebugInfo();
            $gameMap._displayX = this.editorX;
            $gameMap._displayY = this.editorY;
            this.editorGrid.x = -this.editorX * 48;
            this.editorGrid.y = -this.editorY * 48;
            for (let i in this.buttons) {
                this.buttons[i].drawButton();
            }
            this.createGrid();
        }
    }

    Scene_Map.prototype.updateEditorDebugInfo = function() {
        this.editorDebug.bitmap.clear();
        this.editorDebug.bitmap.fontSize = 16;
        this.editorDebug.bitmap.drawText(`Currently editing [${this.editing}]`, 0, 48, Graphics.boxWidth, 0);
    }

    const smu2 = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        if (this.editorMode) {
            return;
        }
        smu2.apply(this, arguments);
    };

    Scene_Map.prototype.updateEditorInput = function(e) {
        let key = e.keyCode;

        switch (key) {
            case 87:
                this.editorY -= 1;
                break;

            case 83:
                this.editorY += 1;
                break;

            case 65:
                this.editorX -= 1;
                break;

            case 68:
                this.editorX += 1;
                break;
        }
    }


    Scene_Map.prototype.createEditorButtons = function() {
        this.buttons = {};

        this.buttons.save = new uButton('Save', 0, 0, 96, 32);
        this.buttons.grass = new uButton('Grass', 96, 0, 96, 32);
        this.buttons.flowers = new uButton('Flowers', 96 * 2, 0, 96, 32);
        this.buttons.tree = new uButton('Tree', 96 * 3, 0, 96, 32);
        this.buttons.passTree = new uButton('Passthrough Tree', 96 * 4, 0, 192, 32);
        this.buttons.path = new uButton('Path', 480 + 96, 0, 96, 32);
        this.buttons.water = new uButton('Water', 672, 0, 96, 32);

        this.buttons.save.onActivate = function() {
            fs.writeFileSync('./unpgDat.json', JSON.stringify(UNPGDATA));
        }

        let $ = this;
        this.buttons.grass.onActivate = function() {
            $.editing = 'grass';
        }

        this.buttons.flowers.onActivate = function() {
            $.editing = 'flowers';
        }

        this.buttons.tree.onActivate = function() {
            $.editing = 'trees';
        }

        this.buttons.passTree.onActivate = function() {
            $.editing = 'passTrees';
        }

        this.buttons.path.onActivate = function() {
            $.editing = 'path';
        }

        this.buttons.water.onActivate = function() {
            $.editing = 'water';
        }
        this.editor.addChild(this.buttons.save);
        this.editor.addChild(this.buttons.grass);
        this.editor.addChild(this.buttons.flowers);
        this.editor.addChild(this.buttons.tree);
        this.editor.addChild(this.buttons.passTree);
        this.editor.addChild(this.buttons.path);
        this.editor.addChild(this.buttons.water);

        this._activeButton = this.buttons.grass;

    }
})();