/** /*:
 * @author William Ramsey
 * @plugindesc The core for all pro Snap plugins. Leave on top
 * 
 * @param quality
 * @text Quality
 * @desc Use high quality? (webGL required)
 * @default true
 * @type boolean
 * @on High
 * @off Low
 * 
 * @param HDText
 * @text HD Text
 * @desc Modifies the text
 * @type boolean
 * @default true
 * 
 * @param Window
 * @text Window Rendering
 * @desc Modifies the windows opacity
 * @type boolean
 * @default true
 * @on Solid
 * @off Default
 * 
 * @param filterscript
 * @type Text[]
 * @text Filters
 * @desc Load your .js filters here
 * @default ["/js/plugins/uppPixiFilterImports/pixi-filters/dist/pixi-filters.js"]
 * @help
 * 
 * @help
 * This plugin is used for every pro Snap plugin.
 */

/*~font:
 * @param Test
 */

const proSnapCoreInstalled = true;
const proSnapCoreParams = PluginManager.parameters('proSnapCore');
var proSnapQuality = JSON.parse(proSnapCoreParams['quality']);
var proSnapHDText = JSON.parse(proSnapCoreParams['HDText']);
var proSnapWindowState = JSON.parse(proSnapCoreParams['Window']);
const proSnapFilterList = JSON.parse(proSnapCoreParams['filterscript']);


////FILTER MANAGEMENT
////
for (let i in proSnapFilterList) {
    let filterScript = document.createElement('script');
    filterScript.src = proSnapFilterList[i];
    document.body.appendChild(filterScript);
}
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

            proSnapGlobalShaderSettings[i] = new PIXI.filters[i]();
            proSnapGlobalShaderSettings[i].enabled = false;
            proSnapglobalShaders.push(proSnapGlobalShaderSettings[i]);
        } catch (e) {

        }
    }
}

const osb = Scene_Base.prototype.initialize;
Scene_Base.prototype.initialize = function() {
    osb.apply(this, arguments);
}
const osbu = Scene_Base.prototype.update;
Scene_Base.prototype.update = function() {
    osbu.apply(this, arguments);
}
proSnapglobalShaders = [];
proSnapGlobalShaderSettings = {};

/**
 * Draw text HD
 */
(() => {
    console.log(proSnapWindowState);
    if (proSnapHDText === true) {
        Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
            if (text !== undefined) {
                var tx = x;
                var ty = y + lineHeight - (lineHeight - this.fontSize * 0.7) / 2;
                var context = this._context;
                var alpha = context.globalAlpha;
                maxWidth = maxWidth || 0xffffffff;
                if (align === 'center') {
                    tx += maxWidth / 2;
                }
                if (align === 'right') {
                    tx += maxWidth;
                }
                context.save();
                context.font = this._makeFontNameText();
                context.textAlign = align;
                context.textBaseline = 'alphabetic';
                context.globalAlpha = alpha;
                context.filter = 'drop-shadow(0px 1px 0px #000) blur(1px) opacity(50%) brightness(20%)';
                this._drawTextBody(text, tx + 1, ty + 1, maxWidth);
                this._drawTextBody(text, tx - 1, ty + 1, maxWidth);
                context.filter = 'drop-shadow(0px 1px 0px #000)';
                this._drawTextBody(text, tx, ty, maxWidth);

                context.restore();
                this._setDirty();
            }
        };
    }

    if (proSnapWindowState === true) {
        Window_Base.prototype.standardBackOpacity = function() {
            return 255;
        };
    }
})();
/*
 *Mouse Reconfig 
 */
const proMouseCursor = {
    x: 0,
    y: 0
}

let oldTouchIn = TouchInput._onMouseMove;
TouchInput._onMouseMove = function(event) {
    oldTouchIn.apply(this, arguments);
    proMouseCursor.x = Graphics.pageToCanvasX(event.pageX);
    proMouseCursor.y = Graphics.pageToCanvasY(event.pageY);
    proMouseCursor.moved = true;
};


/*
 * Append proSnapSprites to scenemanager.
 */
const proSceneManagerInit = SceneManager.changeScene;
SceneManager.changeScene = function() {
    proSceneManagerInit.apply(this, arguments);
    this._scene.proSnapSprites = [];
};

/**
 * Snap remake
 */
const proCanvasGrab = (stage) => {
    var width = Graphics.width;
    var height = Graphics.height;
    var bitmap = new Bitmap(width, height);
    var context = bitmap._context;
    var renderTexture = PIXI.RenderTexture.create(width, height);
    if (stage) {
        Graphics._renderer.render(stage, renderTexture);
        stage.worldTransform.identity();
        var canvas = null;
        if (Graphics.isWebGL()) {
            canvas = Graphics._renderer.extract.canvas(renderTexture);
        } else {
            canvas = renderTexture.baseTexture._canvasRenderTarget.canvas;
        }
        context.drawImage(canvas, 0, 0);
    } else {

    }
    //renderTexture.destroy({ destroyBase: true });
    bitmap._setDirty();
    return bitmap;
};

/**
 * @class proSnapSprite
 * @description
 * Returns a regular sprite, but with a few added values
 * and changed update/draw functionality.
 * 
 * @param {Bitmap} bitmap - new Bitmap(width,height).
 * @param {Function} finished - Executes code within when sprite is created.
 * 
 * EXTRA VALUES:
 * The sprite created will have the following extra values
 *  * float - used for sin/cos
 *  * counterFrame - increased by 1 per frame, can be used to determine length of existing
 *  * attach() - If sprite is global, append it to current scene with this function
 *  * draw() - Happens after update(). Use update() for non-drawing functions and
 *  use draw() for anything that needs drawn.
 * @example
 this.proSampleSprite = new proSnapSprite(new Bitmap(Graphics.boxWidth, 64), (sprite) => {
        //Add sprite to the scene
        this.addChild(sprite);

        //set sprite values
        sprite.x = 90;
        sprite.y = 90;

        //Set update for sprite
        sprite.update = function() {
            sprite.x = proMouseCursor.x;
            sprite.y = proMouseCursor.y;
        }

        //Draw after sprite is done updating
        sprite.draw = function() {
            this.bitmap.clear();
            this.bitmap.drawText('sample', 0, 0, this.bitmap.width, this.bitmap.height, 'left');
        }
    });
 */
class proSnapSprite {
    constructor(bitmap = new Bitmap(0, 0), finished, target = SceneManager._scene) {
        this.target = target;
        this.sprite = new Sprite(bitmap);

        this.sprite.float = 0;
        this.sprite.counterFrame = 0;

        this.sprite.draw = function() {};
        this.sprite.attach = this.attach;

        this.attach();


        finished(this.sprite);

        const osu = this.sprite.update;
        this.sprite.update = function() {
            osu.apply(this, arguments);
            this.draw();
        }
        return this.sprite;
    }

    attach() {
        try {
            this.target.proSnapSprites.push(this.sprite);
        } catch (e) {
            console.warn(`proSnapSprite Warning\n`, 'No scene to attach sprite to. Please create the sprite inside a scene.\n\nYou can still attach this sprite using the .attach() function inside your scene.')
        }
    }
}

/**
 * @function proSnapWindow
 * @description Window edit, allowing for additional
 * features.
 */
function proSnapWindow() {
    this.initialize.apply(this, arguments);
}
proSnapWindow.prototype = Object.create(Window_Base.prototype);
proSnapWindow.prototype.constructor = proSnapWindow;
proSnapWindow.prototype.initialize = function(x, y, w, h, finished) {
    Window_Base.prototype.initialize.apply(this, arguments);

    this.subWins = [];
    finished(this);
}

proSnapWindow.prototype.refresh = function() {

}

proSnapWindow.prototype.update = function() {
    this.refresh();
}

proSnapWindow.prototype.subWin = function(contents, x, y, w, h, o) {
    this.tempSubWin = {
        x,
        y,
        w,
        h,

        contents,
        o
    }

    this.subWins.push(this.tempSubWin);
}

proSnapWindow.prototype.drawSubWins = function(upd) {
    let target;
    let color;
    let pad = 4;
    for (let i in this.subWins) {
        target = this.subWins[i];
        if (upd) target.contents = upd;
        if (target.o) {
            this.contents.fillRect(target.x - pad / 2, target.y - pad / 2, target.w + pad, target.h + pad, 'rgba(0, 45, 150, 0.95)');
            this.contents.clearRect(1 + target.x - pad / 2, 1 + target.y - pad / 2, target.w + pad - 2, target.h + pad - 2)
            this.contents.fillRect(target.x - pad / 2, target.y - pad / 2, target.w + pad, target.h + pad, 'rgba(0, 0, 0, 0.35)');
        }
        this.drawTextEx(target.contents, target.x, target.y);
    }
}