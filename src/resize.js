var resize = module.exports = function(handler) {
    var original = window.onresize || function (){
        return true
    };

    window.onresize = function() {
        var args = Array.prototype.slice.call(arguments)

        return handler.apply(this, args) !== false &&
              original.apply(this, args)
    };
};