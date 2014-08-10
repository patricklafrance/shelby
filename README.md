Shelby
===========

Shelby is a set of highly extensible objects to quickly build Knockout view models that will handle most of your application business cases. 

**It provided features to:**

* Communicate with REST and RPC endpoints in an asynchronous way with promises.
* Automatically map or unmap the models observables that are sent or received throught HTTP requests.
* Create a subscription to track all the changes of a set of observables (including arrays items).
* Start a transaction on 1 or multiple observables, providing the ability to commit or rollback the changes on the observables.

**Shelby is not:**

* An SPA, this is only a set of view models and observable extenders.

## Installation

Download a copy of shelby-x.y.z.js from [the dist folder](https://github.com/patricklafrance/shelby/tree/master/dist) and reference it in your web application:

Shelby depends on knockout.js, jQuery and a KO plugin called knockout.viewmodel. You must grab a copy of those or use the ones provided in [the dist/lib folder](https://github.com/patricklafrance/shelby/tree/master/dist/lib).

```javascript
<script src="jquery-x.y.z.js"></script>
<script src="knockout-x.y.z.js"></script>
<script src="knockout.viewmodel.js"></script>
<script src="shelby-x.y.z.js"></script>

## Usages

When you are using Shelby, you are basically only working with one of the provided view model (there's a few exception, we will talk about those later). Here's a very basic usage of Shelby.

Define a basic view model

    var EmployeeDetailViewModel = Shelby.ViewModel.extend({
        model: null,

        _initialize: function(clientModel) {
            this.model = this._fromJs(clientModel);
        }
    });

Create a view model instance from the definition
    
    var vm = new EmployeeDetailViewModel({
        firstName: "John",
        lastName: "Doe"
    });

Bind the view model

    vm.bind();

Later, dispose the view model _(optionnal)_

    vm.dispose();

### The extend function

### Communicate with an HTTP endpoint

Shelby provided an `HttpViewModel` to communicate with a REST or RPC endpoint. 

Shelby take for granted that your view model communicate with a single endpoint and will try to infer which type of HTTP endpoint (REST or RPC) you are working with by the URL structure that you provide in your view model definition. If your view model communicate with multiple endpoints, dont worry, you can still leverage all the HTTP features of Shelby, but you need to write a little more code.

#### Single endpoint

To define your URLs, you must override the `_url` property when you define your view model.

If you use a REST endpoint

    Shelby.ViewModel.extend({
        _url: "REST_ENDPOINT_URL"
    });

Otherwise, for an RPC endpoint (you only define the URLs that you need)

    Shelby.ViewModel.extend({
        _url: {
            all: "ALL_URL",
            detail: "DETAIL_URL",
            add: "ADD_URL",
            update: "UPDATE_URL",
            remove: "REMOVE_URL"
        }
    });

Those functions are available on the view model and will use the URLs that you provided in your view model definition.

* `all(criteria, options)`
* `detail(id, options)`
* `add(model, options)`
* `update(/* [id], model, [options] */)`
* `remove(target, options)`

```javascript
Shelby.ViewModel.extend({
    _url: {
        all: "ALL_URL",
        detail: "DETAIL_URL",
        add: "ADD_URL",
        update: "UPDATE_URL",
        remove: "REMOVE_URL"
    },

    fetchEmployees: function() {
        this._handleResult(this.all());
    },

    fetchEmployee: function(employeeId) {
        this._handleResult(this.detail(employeeId));
    },

    addNewEmployee: function(employee) {
        this._handleResult(this.add(employee));
    },

    updateExistingEmployee: function(updatedEmployee) {
        this._handleResult(this.update(updatedEmployee));
    },

    removeEmployee: function(employee) {
        this._handleResult(this.remove(employee));
    },

    _handleResult(promise) {
        promise.done(function() { console.log("Succeeded"); });
        promise.fail(function() { console.log("Failed"); });
    }
});

For more informations about those functions you can look at [the API section](#).

#### Multiple endpoints

If you're view model use multiple endpoints you cannot use the high level HTTP functions of Shelby, but still can use the low level functions.

* `_fetch(options)`
* `_save(options)`
* `_remove(options)`


Map / unmap automatiquement (avec extenders)

Sample code

You can see a sample of a Shelby `HttpViewModel` [here](#).

### Extenders

An extender is something that augment the behavior of an observable property [(see knockout.js extender documentation)](http://knockoutjs.com/documentation/extenders.html) or in Shelby, it can also augment an object. Shelby automatically applied all the registered extenders to all the matching observables when you use Shelby to map your model properties to observables (dont worry you can prevent that).

To prevent any name clashing, all the extenders are added inside a `shelby` object:

    var extendedModel = Shelby.ViewModel.prototype._fromJS({
        firstName: "John",
        lastName: "Doe",
        address: {
            civicNumber: "123"
            street: "Foo avenue",
            city: "Bar city"
        }
    });

    // Extended observable
    extendedModel.firstName.shelby.myExtender();

    // Extended object
    extendedModel.address.shelby.myExtender();

You can learn more about the extenders system [in the API section](#).

#### Native extenders

Shelby comes with a set of native extenders that are registered by default. Those extenders offers advanced subscriptions, transactions and much more.

If you dont need one (or all) of the native extender you can easily remove it.

    Shelby.ViewModel.removeEditExtender();
    Shelby.ViewModel.removeSubscribeExtender();
    Shelby.ViewModel.removeUtilityExtender();

The most usefull extenders are the subscription and edit extenders (those that offer the advanced subscription and transaction capabilities).

##### Subscription extender

The subscription extender give you the ability to create a subscription on a single observable or a set of observables to track all their changes and react to them. The difference between this extender and the KO native `subscribe` function is that you can:

* Create a subscription on a set of observables instead a single observable.
* Pause / resume the subscription.
* Automatically add the new array items to the subscription when they are push to an observable array that is part of the subscription.

If you have the following model that has been extended by Shelby

    var extendedModel = Shelby.ViewModel.prototype._fromJS({
        firstName: "John",
        lastName: "Doe",
        address: {
            civicNumber: "123"
            street: "Foo avenue",
            city: "Bar city"
        },
        departments: [{ id: 1, name: "Sales" }]
    });

You can subscribe to a single observable

    var firstNameSubscription 
        = extendedModel.firstName.shelby.subscribe(firstChangedFunction);

Or to a set of observables

    var addressSubscription 
        = extendedModel.address.shelby.subscribe(addressChangedFunction);

You can pause and resume the subscriptions

    firstNameSubscription.pause();
    // Do not trigger anything.
    extendedModel.firstName("Jane Doe");
    firstNameSubscription.resume();

Or you can pause and resume the observable directly

    extendedModel.firstName.shelby.pause();
    // Do not trigger anything.
    extendedModel.firstName("Jane Doe");
    extendedModel.firstName.shelby.resume();

When you create a subscription on an array, the default behavior is to:

Trigger when an item is added or removed from the array

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // Call departmentsChangedFunction
    extendedModel.departments.push(accountingDepartment);

Trigger when any of the items is updated

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // Call "departmentsChangedFunction"
    extendedModel.departments.peek()[1].name("Accounting2");

Automatically add to the subscriptions all the items that are added to the array

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // "accountingDepartment" has been automatically added to the subscription.
    extendedModel.departments.push(accountingDepartment);

Automatically removed from the subscriptions all the items that are removed from the array

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);
    extendedModel.departments.push(accountingDepartment); 

    // "accountingDepartment" has been automatically removed from the subscription.
    extendedModel.departments.remove(accountingDepartment);

This is the basic usage of the subscription extender, other features and options are available, like the ability to filter which properties of an object should be added to a subscription, you can learn about them [in the API section](#).

##### Edit extender

The edit extender give you the ability to create a transaction for a single observable or a set of observables. The transaction provided the ability to commit or rollback the changes on the observables.

If you have the following model that has been extended by Shelby

    var extendedModel = Shelby.ViewModel.prototype._fromJS({
        firstName: "John",
        lastName: "Doe",
        address: {
            civicNumber: "123"
            street: "Foo avenue",
            city: "Bar city"
        },
        departments: [{ id: 1, name: "Sales" }]
    });

You can edit a single observable

    extendedModel.firstName.shelby.beginEdit();
    extendedModel.firstName("Jane");

Or a set of observables

    extendedModel.address.shelby.beginEdit();
    extendedModel.address.civicNumber("456");

If you are satisfied with the changes you can commit them

    extendedModel.firstName.shelby.endEdit();

Otherwise, you just rollback them

    // Rollback the values but do not end the transaction
    extendedModel.firstName.shelby.resetEdit();

    // Rollback the values and ends the transaction
    extendedModel.firstName.shelby.cancelEdit();

While the observables are in a transaction, _all the subscriptions on those observables are paused_, this means that the observables will not trigger. When you commit the transaction, all the observables that changed during the transaction _will trigger with their final value_.

This is the basic usage of the subscription extender, other features and options are available, you can learn about them [in the API section](#).

#### Custom extenders

You can register a custom extender to Shelby with the `registerExtender` function

    Shelby.ViewModel.registerExtender("CustomExtenderKey", extender);

Your `extender` must follow some rules, you can learn about them [in the API section](#).

### View model events

There is several events that occurs during the lifeycle of a view model that you can hook too. You can hook to those events by providing handlers when you are defining a view model or, most of them can be provided globally, i.e. that they will be called **when the event occurs in any view models**. 

To see all the events that you can hook to, [see the API section](#).

#### View model specific event handler

To provide an handler for a specific model, all you got to do, is to override the event handler function that correspond to the event when you are defining your view model.

    Shelby.ViewModel.extend({
        _beforeBind: function() {
            // Call the base event handler.
            Shelby.ViewModel._beforeBind.call(this);

            // Do stuff.
        }
    });

The following event handler functions can be overrided for every view models:

* `_beforeBind`
* `_afterBind`
* `_handleDispose`

If you're view model is an `HttpViewModel`, you can also override there event handler functions:

* `_beforeFetch`
* `_beforeSave`
* `_beforeRemove`
* `_afterFetch`
* `_afterSave`
* `_afterRemove`
* `_handleOperationError`
* `_handleOperationSuccess`

When you override an event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
This is recommended that you always call the base event handler, but not mendatory.

You can see a complete sample that use view model specific event handlers [here](#).

#### Global event handler

To add a global event handler you can use the `registerEventHandler` function.

    Shelby.ViewModel.registerEventHandler("beforeFetch", handlerFunction);

If you need to remove that event handler later, you must use a **_named_** event.

    Shelby.ViewModel.registerEventHandler("context:beforeFetch", handlerFunction);
    Shelby.ViewModel.removeEventHandler("context:beforeFetch");

The following event handlers are available:

* beforeFetch
* beforeSave
* afterFetch
* afterSave
* afterRemove
* handleOperationError
* handleOperationSuccess

You can see a sample that use global event handlers [here](#).

## Components

### Mapper

### Extenders

### View models

### Replace a native components

## API

## Building Shelby from sources

If you prefer to build the library yourself:

 1. **Clone the repo from GitHub**

        git clone https://github.com/patricklafrance/shelby.git
        cd shelby

 2. **Acquire build dependencies.** Make sure you have [Node.js](http://nodejs.org/) installed on your workstation. This is only needed to _build_ Shelby from sources. Shelby itself has no dependency on Node.js once it is built (it works with any server technology or none). Now run:

        npm install -g gulp
        npm install

    The first `npm` command sets up the popular [Gulp](http://gulpjs.com/) build tool. You might need to run this command with `sudo` if you're on Linux or Mac OS X, or in an Administrator command prompt on Windows. The second `npm` command fetches the remaining build dependencies.

 3. **Run the build tool**

        gulp

    Now you'll find the built files in `dist`.

## Running the tests

Build the sources with Gulp and then the specs can be runned in a browser, simply open:

* test/runner-jquery-1.html
* test/runner-jquery-2.html
* test/exports/runner-browserify.html
* test/exports/runner-requirejs.html


