(function(){
    Window_MapName.prototype.initialize = function() {
        var wight = this.windowWidth();
        var height = this.windowHeight();
    
        /* Edit X variable to position Map name display */
        var x = (Graphics.boxWidth - wight) / 2 - 256 - 48;
        /* -------------------------------------------- */

        Window_Base.prototype.initialize.call(this, x, 0, wight, height);
        this.opacity = 0;
        this.contentsOpacity = 0;
        this._showCount = 0;
        this.refresh();
    };
})();