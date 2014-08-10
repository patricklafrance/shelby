var SimpleListViewModel = Shelby.HttpViewModel.extend({
    _url: "http://shelbysamples/api/SimpleListRest",

    list: null,

    editModel: ko.observable(),
    addModel: null,

    _initialize: function() {
        this.addModel = this._fromJS({
            id: "",
            value: ""
        });
    },

    // Return the name of the template to render based on the currently edited model.
    getValueTemplate: function(model) {
        return this.editModel() === model ? "editTemplate" : "readOnlyTemplate";
    },

    onEdit: function(model) {
        this.editModel(model);
        model.shelby.beginEdit();
    },

    onCancel: function(model) {
        this.editModel(null);
        model.shelby.cancelEdit();
    },
    
    onUpdate: function(model) {
        var promise = this.update(model.id.peek(), model);

        promise.done(function() {
            model.shelby.endEdit(true);
            this.editModel(null);
        });

        promise.fail(function() {
            model.shelby.cancelEdit();
        });
    },

    onAdd: function() {
        var promise = this.add(this.addModel);

        promise.done(function() {
            // Clone the added model and extend his properties with extenders.
            this.list.items.push(this._fromJS(this._toJS(this.addModel)));
            this.addModel.shelby.reset();
        });
    },

    onDelete: function(model) {
        this.remove(model.id.peek()).done(function() {
            this.list.items.remove(model);
        });
    },

    onReset: function() {
        this.addModel.shelby.reset();
    },

    _beforeBind: function(callback) {
        // Fetch all the existing list items from the server before applying the bindings.
        var promise = this.all();

        promise.done(function(models) {
            this.list = models;

            // Tell Shelby that the binding is completed.
            callback();
        });

        // Tell Shelby that "_beforeBind" will perform an asynchronous operation.
        return true;
    }
});

var vm = new SimpleListViewModel();
vm.bind();