// Shelby.ComponentViewModel
// ---------------------------------

(function(extend, Disposable, Extendable, Http) {
    Shelby.ComponentViewModel = function() {
    };

    var prototype = $.extend(true, {},
        Disposable,
        Extendable,
        Http, {
            _initialize: null,

            dispose: function() {
                this._disposeAllSubscriptions();

                if ($.isFunction(this._handleDispose)) {
                    this._handleDispose.call(this);
                }

                /* jshint -W051 */
                delete this;
                /* jshint +W051 */
            }
        });

    Shelby.ComponentViewModel.prototype = prototype;
    Shelby.ComponentViewModel.extend = extend;
})(Shelby.extend,
   Shelby._ViewModel.Disposable,
   Shelby._ViewModel.Extendable,
   Shelby._ViewModel.Http);