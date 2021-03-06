Shelby
===========

Shelby is a toolkit to quickly build Knockout view models that will handle the common business cases.

**It provides features to**

* Communicate with REST and RPC endpoints in an asynchronous way with promises.
* Automatically map or unmap the models observables that are sent or received throught HTTP requests.
* Create a subscription to track all the changes on a set of observables (including arrays items) and pause / resume any subscriptions.
* Start a transaction on a single or a set of observables, providing the ability to commit or rollback the changes.

**Shelby is not**

* An SPA, this is only a set of view models and observable extenders.

**Contents**

* [Installation](#installation)
* [Usage](#usages)
    * [The extend function](#the-extend-function)
    * [Define, create and bind a basic view model](#define-create-and-bind-a-basic-view-model)
    * [Communicate with HTTP endpoints](#communicate-with-http-endpoints)
        * [View model with a single endpoint](#view-model-with-a-single-endpoint)
        * [View model with multiple endpoints](#view-model-with-multiple-endpoints)
    * [Use Shelby property extenders](#use-shelby-property-extenders)
        * [Subscribe extender](#subscribe-extender)
        * [Edit extender](#edit-extender)
        * [How to create a custom property extender](#how-to-create-a-custom-property-extender)
    * [Handle view model events](#handle-view-model-events)
* [Components](#components)
* [API](#api)
* [Building from sources](#building-from-sources)
* [Running the tests](#running-the-tests)

## Installation

Download a copy of shelby-x.y.z.js from [the dist folder](https://github.com/patricklafrance/shelby/tree/master/dist) and reference it in your web application:

Shelby depends on `KO`, `jQuery` and a KO plugin called `knockout.viewmodel`. You must grab a copy of those or use the ones provided in [the dist/lib folder](https://github.com/patricklafrance/shelby/tree/master/dist/lib).

```html
<script src="jquery-x.y.z.js"></script>
<script src="knockout-x.y.z.js"></script>
<script src="knockout.viewmodel.js"></script>
<script src="shelby-x.y.z.js"></script>
```

Once you included the scripts, you can use Shelby from the `window` object, as a `CommonJS` or `AMD` module and with `browserify`. 

## Usages

### The extend function

`extend` is a generic function to perform [prototypal inheritance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain). This function is leverage by Shelby to let you extend any components and property extenders that is part of Shelby. This is pretty usefull when the behavior of a component doesn't fulfill your need, you can extend it, then replace it (we will talk later about how you can replace a native component).

For now, all you need to know is that this function will be use to define your own view model by extending one of Shelby's native view model.

### Define, create and bind a basic view model

Define the view model

```javascript
var EmployeeDetailViewModel = Shelby.ViewModel.extend({
    model: null,

    _initialize: function(clientModel) {
        this.model = this._fromJs(clientModel);
    }
});
```

Create an instance from the definition

```javascript
var vm = new EmployeeDetailViewModel({
    firstName: "John",
    lastName: "Doe"
});
```

Bind the view model

```javascript
vm.bind();
```

### Communicate with HTTP endpoints

Shelby provides an `HttpViewModel` to communicate with a REST or RPC endpoint. The HttpViewModel` is designed to handle view models that communicate with a single endpoint. If your view model communicate with multiple endpoints, dont worry, you can still leverage all the HTTP features of Shelby, but you need to write a little more code.

You can see a sample of a Shelby `HttpViewModel` [here](https://github.com/patricklafrance/shelby/blob/master/samples/http.js).

#### View model with a single endpoint

To define your URLs, you must override the `_url` property when you define your view model. Shelby will infer which type of HTTP endpoint (REST or RPC) you are working with by the URL structure that you provide in your view model definition.

If you use a REST endpoint

```javascript
Shelby.ViewModel.extend({
    _url: "REST_ENDPOINT_URL"
});
```

Otherwise, for an RPC endpoint (you only define the URLs that you need)

```javascript
Shelby.ViewModel.extend({
    _url: {
        all: "ALL_URL",
        detail: "DETAIL_URL",
        add: "ADD_URL",
        update: "UPDATE_URL",
        remove: "REMOVE_URL"
    }
});
```

Those functions are available on the view model and will use the URL(s) that you provided in your view model definition.

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

    fetchAllEmployees: function() {
        this._handleResult(this.all());
    },

    fetchEmployeeDetail: function(employeeId) {
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
```

For more informations about those functions you can look at [the API section](#).

#### View model with multiple endpoints

If you're view model use multiple endpoints you cannot use the high level HTTP functions of Shelby, but can still use the low level functions, they provide the same behavior but they are more verbose.

* `_fetch(options)`
* `_save(options)`
* `_remove(options)`

```javascript
Shelby.ViewModel.extend({
    fetchAllEmployees: function() {
        var requestOptions = {
            request: { url: "ALL_URL" }
        };

        this._handleResult(this._fetch(requestOptions));
    },

    fetchEmployeeDetail: function(employeeId) {
        var requestOptions = {
            request: {
                url: "DETAIL_URL",
                data: { id: employeeId }
            }
        };

        this._handleResult(this._fetch(requestOptions));
    },

    addNewEmployee: function(employee) {
        var requestOptions = {
            request: {
                url: "ADD_URL",
                type: "POST",
                data: employee
            }
        };

        this._handleResult(this._save(requestOptions));
    },

    updateExistingEmployee: function(updatedEmployee) {
        var requestOptions = {
            request: {
                url: "UPDATE_URL",
                type: "PUT",
                data: updatedEmployee
            }
        };

        this._handleResult(this._save(requestOptions));
    },

    removeEmployee: function(employee) {
        var requestOptions = {
            request: {
                url: "DELETE_URL",
                type: "DELETE",
                data: employee
            }
        };

        this._handleResult(this._remove(requestOptions));
    },

    _handleResult(promise) {
        promise.done(function() { console.log("Succeeded"); });
        promise.fail(function() { console.log("Failed"); });
    }
});
```

For more informations about those functions you can look at [the API section](#).

#### Observables mapping / unmapping

When your HTTP request has data that contains observables, they will automatically be unmapped before Shelby send the request

```javascript
var newEmployee = this._fromJs({
    firstName: "John",
    lastName: "Doe"
});

this.addNewEmployee(newEmployee);

addNewEmployee: function(employee) {
    // The add function will automatically unmap the observables 
    // of the employee object.
    this.add(employee);
}
```

When you sucessfully fetch the data, by default:

The response object is automatically mapped to observables

```javascript
fetchAllEmployees: function() {
    this.all().done(function(response) {
        // We can use observables on the response object.
        response.employees()[0].firstName("Jane");
    });
}
```

The extenders are automatically applied to the response object.

```javascript
fetchAllEmployees: function() {
    this.all().done(function(response) {
        // The subscribe extender is available on the response object.
        response.employees()[0].subscribe();
    });
}
```

When you sucessfully update data, by default, if the endpoint returned data, your model will automatically be updated with the returned data.

```javascript
updateExistingEmployee: function(updatedEmployee) {
    this.update(updatedEmployee).done(function(responseEmployee) {
        // The "updatedEmployee" object has automatically been updated with 
        // the values of the "responseEmployee" object.
    });
}
```

#### Promises

Every functions that leverage HTTP will return a jQuery `Promise` object created from a jQuery `Deferred`. You can find more informations [here](http://api.jquery.com/category/deferred-object/).

The most common usage is to use the `done` and `fail` functions

```javascript
var promise = this.all();

promise.done(function() { ... });
promise.fail(function() { ... });
```

### Use Shelby property extenders

A property extender is something that augment the behavior of an observable property [(see knockout.js extender documentation)](http://knockoutjs.com/documentation/extenders.html) or in Shelby, it can also augment a property having an object as value. Shelby automatically apply all the registered property extenders to all the matching observables when you use Shelby to map your model properties to observables (dont worry you can prevent that).

To prevent any name clashing, all the property extenders are added inside a `shelby` object:

```javascript
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
```

You can learn more about the property extenders system [in the API section](#).

#### Native property extenders

Shelby comes with a set of native property extenders that are registered by default. Those property extenders offers advanced subscriptions, transactions and much more.

If you dont need one (or all) of the native property extender you can easily remove them.

```javascript
Shelby.ViewModel.removeEditExtender();
Shelby.ViewModel.removeSubscribeExtender();
Shelby.ViewModel.removeUtilityExtender();
```

> The _edit extender_ depends on the _subscribe extender_. This means that removing the _subscribe extender_ will automatically remove the _edit extender_.

The most usefull property extenders are the subscription extender (add advanced subscriptions) and the edit extender (add transaction capabilities).

##### Subscribe extender

The subscription extender give you the ability to create a subscription on a single observable or a set of observables to track all their changes and react to them. The difference between this extender and the KO native `subscribe` function is that you can:

* Create a subscription on a set of observables instead a single observable.
* Pause / resume the subscription.
* It automatically add to the subscription every items that are added to the array (it can be turn off if desired).

If you have the following model that has been extended by Shelby

```javascript
var model = Shelby.ViewModel.prototype._fromJS({
    firstName: "John",
    lastName: "Doe",
    address: {
        civicNumber: "123"
        street: "Foo avenue",
        city: "Bar city"
    },
    departments: [{ id: 1, name: "Sales" }]
});
```

You can subscribe to a single observable

```javascript
var firstNameSubscription = model.firstName.shelby.subscribe(firstChangedFunction);
```

Or to a set of observables

```javascript
var addressSubscription = model.address.shelby.subscribe(addressChangedFunction);
```

You can pause and resume the subscriptions

```javascript
firstNameSubscription.pause();

// Do not trigger anything.
model.firstName("Jane Doe");

firstNameSubscription.resume();
```

Or you can pause and resume the observable directly

```javascript
model.firstName.shelby.pause();

// Do not trigger anything.
model.firstName("Jane Doe");

model.firstName.shelby.resume();
```

**When you create a subscription on an array, the default behavior is to:**

Trigger when an item is added or removed from the array

```javascript
model.departments.shelby.subscribe(departmentsChangedFunction);
// Call departmentsChangedFunction
model.departments.push(accountingDepartment);
```

Trigger when any of the items is updated

```javascript
model.departments.shelby.subscribe(departmentsChangedFunction);
// Call "departmentsChangedFunction"
model.departments.peek()[1].name("Accounting2");
```

Automatically add to the subscriptions all the items that are added to the array

```javascript
model.departments.shelby.subscribe(departmentsChangedFunction);
// "accountingDepartment" has been automatically added to the subscription.
model.departments.push(accountingDepartment);
```

Automatically remove from the subscriptions all the items that are removed from the array

```javascript
model.departments.shelby.subscribe(departmentsChangedFunction);
model.departments.push(accountingDepartment); 
// "accountingDepartment" has been automatically removed from the subscription.
model.departments.remove(accountingDepartment);
```

This is the basic usage of the subscription extender, other features and options are available, like the ability to filter which properties of an object should be added to a subscription, you can learn about them [in the API section](#).

##### Edit extender

The edit extender give you the ability to create a transaction for a single observable or a set of observables. The transaction can then be commit or rollback. If the transaction is commit the changes are push to the observables, otherwise they are rejected.

If you have the following model that has been extended by Shelby

```javascript
var model = Shelby.ViewModel.prototype._fromJS({
    firstName: "John",
    lastName: "Doe",
    address: {
        civicNumber: "123"
        street: "Foo avenue",
        city: "Bar city"
    },
    departments: [{ id: 1, name: "Sales" }]
});
```

You can edit a single observable

```javascript
model.firstName.shelby.beginEdit();
model.firstName("Jane");
```

Or a set of observables

```javascript
model.address.shelby.beginEdit();
model.address.civicNumber("456");
```

If you are satisfied with the changes you can commit them

```javascript
model.firstName.shelby.endEdit();
```

Otherwise, you just rollback them

```javascript
// Rollback the values but do not end the transaction
model.firstName.shelby.resetEdit();

// Rollback the values and ends the transaction
model.firstName.shelby.cancelEdit();
```

While the observables are in a transaction, **all the subscriptions on those observables are paused**, this means that the observables will not trigger any registered callbacks. When you commit the transaction, all the observables that changed during the transaction **will trigger the registered callback with their final value**.

This is the basic usage of the subscription extender, other features and options are available, you can learn about them [in the API section](#).

#### How to create a custom property extender

If you need to add a custom behavior to multiple observables, you probably want to define a custom property extender. To create a property extender there is some rules that you must follow, you can learn about them [in the API section](#).

Basically, you have to define an extender function. Once it is registered to Shelby, this function will be called for every properties that are being mapped by Shelby and will receive the property being currently mapped and is type.

The property type can either be:

* `Shelby.PropertyType.Object`
* `Shelby.PropertyType.Array`
* `Shelby.PropertyType.Scalar` 

You can use the property type to apply the appropriate strategy to extend the property. 

```javascript
Shelby.Extenders.edit = function(property, propertType) {
    if (propertType !== PropertyType.Object) {
        // If this is not an object, then it must be a KO observable 
        // and it can be extended by using a KO extender 
        property.extend({ shelbyEdit: true });
    }
    
    if (propertType === PropertyType.Object) {
        // An object literal can be extended with the jQuery $.extend function
        $.extend(property["shelby"], {
            beginEdit: function(options) { ... },

            endEdit: function(notifyOnce) { ... },
        });
    }
};
```
When your custom property extender is defined, you must register it to Shelby.

```javascript
Shelby.ViewModel.registerExtender("edit", Shelby.Extenders.edit);
```

You can take a look at the [edit extender](https://github.com/patricklafrance/shelby/blob/master/src/extender.edit.js) to see a complete exemple of a Shelby property extender.

### Handle view model events

There is several events that occurs during the lifeycle of a view model that you can hook too. You can hook to those events by providing handlers. Those handlers can be scoped to a specific view model or globally (they will be triggered **when the event occurs in any view models**).

#### Event handlers scoped to a specific view model

To provide an event handler for a specific view model, you have to override the event handler function that match the desired event when you define the view model.

```javascript
Shelby.ViewModel.extend({
    _beforeFetch: function() {
        // Call the base event handler.
        Shelby.ViewModel._beforeFetch.apply(this, arguments);

        // Do stuff...
    }
});
```

The following event handler functions can be overrided for every view models:

* `_beforeBind`
* `_afterBind`
* `_handleDispose`

If you're view model extend `HttpViewModel`, you can also override there event handler functions:

* `_beforeFetch`
* `_beforeSave`
* `_beforeRemove`
* `_afterFetch`
* `_afterSave`
* `_afterRemove`
* `_handleOperationError`
* `_handleOperationSuccess`

When you override an event handler function **you throw away the native behavior of that event handler if you dont call the base event handler**. 
This is not mandatory, but we recommend that you always call the base event handler.

#### Global event handlers

To add a global event handler you can use the `registerEventHandler` function.

```javascript
Shelby.ViewModel.registerEventHandler("beforeFetch", handlerFunction);
```

If you need to remove that event handler later, you must use a **_named_** event.

```javascript
Shelby.ViewModel.registerEventHandler("beforeFetch.foo", handlerFunction);
Shelby.ViewModel.removeEventHandler("beforeFetch.foo");
```

The following event handlers are available:

* beforeFetch
* beforeSave
* afterFetch
* afterSave
* afterRemove
* operationError
* operationSuccess

You can see a sample [here](https://github.com/patricklafrance/shelby/blob/master/samples/global_events.js).

## Components

Extensibility is at the core of Shelby. To easily let you extend any parts of Shelby, it is build in components. A components factory lazily creates the components when they are needed. That way, you can easily replace any components when your application start, before you use Shelby. 

The components are:

* `Shelby.Parser`: Parse an object.
* `Shelby.Mapper`: Map the properties of an object to observables. The native implementation use knockout.viewmodel.
* `Shelby.PropertyExtender`: Apply the registered extenders to a property.
* `Shelby.Ajax`: Handles the HTTP communication.
* `Shelby.ViewModel`: Provide the basic features of a Shelby view model.
* `Shelby.HttpViewModel`: Provide the same features as `Shelby.ViewModel` in addition to HTTP capabilities.

### Replace a components

The recommended way to replace a native component, is to extend the existing one and override the functions that need to be customized

```javascript
var CustomMapper = Shelby.Mapper.extend({
    fromJS: function() {
        // Do stuff.
    }
});
```

Then register your new component to Shelby

```javascript
Shelby.Components.replace(Shelby.Components.Mapper, CustomMapper);
```

> The components must be replaced before you use any parts of Shelby. Once a component instance has been created by the components factory. that instance will be returned for every subsequent call.

## API

### Shelby.ViewModel

To define a view model without HTTP capabilities you can extend `Shelby.ViewModel`. 

#### Define a view model from Shelby.ViewModel

When you define your view model you can _optionnally_ override the following properties:

```javascript
var EmployeeDetailViewModel = Shelby.ViewModel.extend({
    _initialize: function(param1, param2, ...) { ... },

    _beforeBind: function(callback) { ... },

    _afterBind: function() { ... },

    _handleDispose: function() { ... }
});
```

##### _initialize: function([parameters])

This is the constructor of the view model. It is call after all the initialization logic is done and receive the parameters that are passed to the view model at the instanciation of the object.

```javascript
var EmployeeDetailViewModel = Shelby.ViewModel.extend({
    _initialize: function(firstName, lastName) {
        this._firstName = firstName;
        this._lastName = lastName;
    }
});

var vm = new EmployeeDetailViewModel("John", "Doe");
```

##### _beforeBind: function(callback) : void or true

This event handler is called just before binding the view model with the DOM. If you need to fetch data to initialize your view model, this is the place to do so.`_beforeBind` can be implemented in 2 ways, synchronous and asynchronous.

If you choose to do synchronous stuff you dont have to call the `callback` function or return anything.

```javascript
Shelby.ViewModel.extend({
    _beforeBind: function() {
        // Doing synchronous stuff..
    }
});
```

However, if you do asynchronous stuff, you must return `true` to notify Shelby that `_beforeBind` is doing asynchronous operations and you must call the `callback` function when you are done.

```javascript
Shelby.ViewModel.extend({
    _beforeBind: function(callback) {
        var promise = $.getJSON("...");

        promise.done(function() {
            callback();
        }); 

        return true;
    }
});
```

##### _afterBind: function()

This event handler is called after the call to `ko.applyBindings` has been made.

##### _handleDispose: function()

This function is called when the view model is disposed. A view model can be disposed explicitly be calling the `dispose` function.

#### Use Shelby.ViewModel variables and functions

The following variables and functions should be used but not overrided.

##### bind: function([element]) : jQuery promise

Bind the view model to the DOM. If a DOM `element` is specified, the view model will be bind to the specified element, otherwise the view model is bind to the `body` element. The specified `element` can a jQuery element or a regular JavaScript DOM element.

The function returns a jQuery promise that you can hook too if you need to be notified when the view model is bound to the DOM. This is done that way because the `_beforeBind` event handler can be asynchronous.

```javascript
var promise = vm.bind($("#employee-detail-container"));

promise.done(function() {
   console.log("The view model is bound to the DOM"); 
});
```

##### dispose: function()

Clear the KO bindings and dispose the view model.

##### _element: DOM element

If the view model is binded to a specific element of the DOM, this property value will be that element of the DOM. The property will only have a value after a call to the `bind` function has been made.

##### _fromJs: function(obj, [options]) : Object

Convert all the properties of the object into observables and apply the registered [property extenders](#) to all the properties. By default [knockout.viewmodel](http://coderenaissance.github.io/knockout.viewmodel/) is used to do the mapping.

You can specify any options that is supported by [knockout.viewmodel](http://coderenaissance.github.io/knockout.viewmodel/).

The most common options are:

**Extend a property when mapping**
```javascript
options:{ 
    extend:{
        "{root}.users[i]": function(user){
            user.isDeleted = ko.observable(false);
            return user;
        }
    }
};
```
**Exclude a property from the mapping**
```javascript
options:{ 
    exclude:["{root}.users[i].firstName"]
};
```

##### _toJs: function(obj) : Object

Convert all the properties of the object back to regular JavaScript. It also remove all the applied [property extenders](#).

### Shelby.HttpViewModel

To define a view model with all the features of `Shelby.ViewModel` and HTTP capabilities you can extend `Shelby.HttpViewModel`.

#### Define a view model from Shelby.HttpViewModel

When you define your view model you can _optionnally_ override the following properties:

```javascript
var EmployeeDetailViewModel = Shelby.ViewModel.extend({
    _url: "" OR {},

    _beforeFetch: function(operationContext) { ... },

    _beforeSave: function(operationContext) { ... },

    _beforeRemove: function(operationContext) { ... },

    _afterFetch: function(operationContext) { ... },

    _afterRemove: function(operationContext) { ... },

    _handleOperationError: function(requestError) { ... },

    _handleOperationSuccess: function(operationContext) { ... }
});
```

##### _url: String or Object

`Shelby.HttpViewModel` support REST and RPC endpoints.

If your endpoint implements REST, specify `_url` as a string.

```javascript
Shelby.ViewModel.extend({
    _url: "REST_ENDPOINT_URL"
});
```

If your endpoint implements RPC, specify `_url` as an object. You dont have to define all the URLs.

```javascript
Shelby.ViewModel.extend({
    _url: {
        all: "ALL_URL",
        detail: "DETAIL_URL",
        add: "ADD_URL",
        update: "UPDATE_URL",
        remove: "REMOVE_URL"
    }
});
```

Once you define `_url`,  can you use the _high level_ functions to communicate with your endpoint:

* `all`
* `detail`
* `add`
* `update`
* `remove`

Otherwise, if you dont want to define `_url`, you can use the _low level_ function:

* `_fetch`
* `_save`
* `_remove`

##### _beforeFetch: function(operationContext) : void or false

This event handler is called before an HTTP request to fetch data is send. The request can be initiated by either of `all`, `detail` or `_fetch` functions. To cancel the request you can return `false`, otherwise, do not return anything.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _beforeFetch: function() {
        // Call the base event handler.
        Shelby.ViewModel._beforeFetch.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _beforeSave: function(operationContext) : void or false

This event handler is called before an HTTP request to save data is send. The request can be initiated by either of `add`, `update` or `_save` functions. To cancel the request you can return `false`, otherwise, do not return anything.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _beforeSave: function() {
        // Call the base event handler.
        Shelby.ViewModel._beforeSave.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _beforeRemove: function(operationContext) : void or false

This event handler is called before an HTTP request to delete data is send. The request can be initiated by either of `remove` or `_remove` functions. To cancel the request you can return `false`, otherwise, do not return anything.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _beforeRemove: function() {
        // Call the base event handler.
        Shelby.ViewModel._beforeRemove.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _afterFetch: function(operationContext)

This event handler is called after an HTTP request to fetch data has been sent. The request can have been initiated by either of `all`, `detail` or `_fetch` functions.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _afterFetch: function() {
        // Call the base event handler.
        Shelby.ViewModel._afterFetch.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _afterSave: function(operationContext)

This event handler is called after an HTTP request to save data has been sent. The request can have been initiated by either of `add`, `update` or `_save` functions.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _afterSave: function() {
        // Call the base event handler.
        Shelby.ViewModel._afterSave.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _afterRemove: function(operationContext)

This event handler is called after an HTTP request to delete data has been sent. The request can have been initiated by either of `remove` or `_remove` functions.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _afterRemove: function() {
        // Call the base event handler.
        Shelby.ViewModel._afterRemove.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _handleOperationError: function(requestError)

This event handler is called everytime a request failed (HTTP code 4.\*, 5.\*, timeouts, etc..).

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _handleOperationError: function() {
        // Call the base event handler.
        Shelby.ViewModel._handleOperationError.apply(this, arguments);

        // Do stuff...
    }
});
```

##### _handleOperationSuccess: function(operationContext)

This event handler is called everytime a request is completed successfully.

> When you override this event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
> You should call the base event handler.

```javascript
Shelby.ViewModel.extend({
    _handleOperationSuccess: function() {
        // Call the base event handler.
        Shelby.ViewModel._handleOperationSuccess.apply(this, arguments);

        // Do stuff...
    }
});
```

#### Shelby.HttpViewModel data objects

##### OperationMethod

Represent an HTTP operation method use to communicate with the endpoint.

The values are:

* `Get`
* `Post`
* `Put`
* `Delete`

##### OperationContext

Most event handlers that are specific to HTTP communication receive as parameters an **operationContext**. The operation context is defined as follow:

* `url`: The request URL
* `method`: A value of the `Shelby.HttpViewModel.OperationMethod` enumeration
* `data`: The request data if there was any

##### RequestError

When a request fail the error details is propagate using an object defined as follow:

* `operationContext`
    * `url`: The request URL
    * `method`: A value of the `Shelby.HttpViewModel.OperationMethod` enumeration
    * `data`: The request data if there was any
    * `statusCode`: The HTTP status code
    * `statusText`: The HTTP status text
    * `exception`: The HTTP exception
* `response`: The server response (can be JSON, XML or free text)

#### Use Shelby.HttpViewModel variables and functions

##### all: function([criteria], [options]) : jQuery promise

##### detail: function(id, [options]) : jQuery promise

##### add: function(model, [options]) : jQuery promise

##### update: function([id], model, [options]) : jQuery promise

##### remove: function(target, [options]) : jQuery promise

##### _fetch: function(options) : jQuery promise

##### _save: function(options) : jQuery promise

##### _remove: function(options) : jQuery promise

## Building from sources

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


