// Register an event handler for all the HTTP events of Shelby.ViewModel that occurs before
// an HTTP request is sent to the endpoint.
$.each(["beforeFetch", "beforeSave", "beforeRemove"], function() {
    Shelby.ViewModel.registerEventHandler("sample:" + this, function(context) {
        var text = "";

        switch (context.method) {
            case Shelby.ViewModel.OperationMethod.Get:
                text = "Loading...";
                break;
            case Shelby.ViewModel.OperationMethod.Post:
            case Shelby.ViewModel.OperationMethod.Put:
                text = "Saving...";
                break;
            case Shelby.ViewModel.OperationMethod.Delete:
                text = "Deleting...";
                break;
        };

        toastr.info(text, null, {
            extendedTimeOut: 0,
            timeOut: 0
        });
    });
});

// Register an event handler for all the HTTP events of Shelby.ViewModel that occurs after
// an HTTP request has been sent to the endpoint.
$.each(["afterFetch", "afterSave", "afterRemove"], function() {
    Shelby.ViewModel.registerEventHandler("sample:" + this, function() {
        toastr.clear();
    };
});

// Register an event handler to be notified when an HTTP request succeeded.
Shelby.ViewModel.registerEventHandler("sample:handleOperationSuccess", function(context) {
    setTimeout(function() {
        if (context.method !== Shelby.ViewModel.OperationMethod.Get) {
            toastr.success("Operation succeeded !");
        }
    }, 1500);
});

// Register an event handler to be notified when an HTTP request failed.
Shelby.ViewModel.registerEventHandler("sample:handleOperationError", function(error) {
    toastr.clear();

    setTimeout(function() {
        var text = "";

        switch (error.operationContext.method) {
            case Shelby.ViewModel.OperationMethod.Get:
                text = "An error occured while loading the list items.";
                break;
            case Shelby.ViewModel.OperationMethod.Post:
            case Shelby.ViewModel.OperationMethod.Put:
                if (!Shelby.Utils.isNull(error.data) && Shelby.Utils.isString(error.data.message)) {
                    text = error.data.message;
                }
                else {
                    text = "An error occured while saving a list item.";
                }

                break;
            case Shelby.ViewModel.OperationMethod.Delete:
                text = "An error occured while deleting a list item.";
                break;
        };

        toastr.error(text,null, {
            extendedTimeOut: 0,
            timeOut: 0
        });
    }, 1500);
});