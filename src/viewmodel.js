// Shelby.ViewModel
// ---------------------------------

(function(extend, Bindable, Disposable, Extendable, Http, HttpEvent) {
    Shelby.ViewModel = function() {
        // This is used by the binding functions.
        this.element = null;
    };

    var prototype = $.extend(true, {}, 
        Bindable,
        Disposable,
        Extendable,
        Http,
        HttpEvent, {
            _initialize: null,

            dispose: function() {
                this._disposeAllSubscriptions();
                this._disposeBindings();

                if ($.isFunction(this._handleDispose)) {
                    this._handleDispose.call(this);
                }

                /* jshint -W051 */
                delete this;
                /* jshint +W051 */
            }
        });
    
    Shelby.ViewModel.prototype = prototype;
    Shelby.ViewModel.extend = extend;
})(Shelby.extend,
   Shelby._ViewModel.Bindable,
   Shelby._ViewModel.Disposable,
   Shelby._ViewModel.Extendable,
   Shelby._ViewModel.Http,
   Shelby._ViewModel.HttpEvent);

