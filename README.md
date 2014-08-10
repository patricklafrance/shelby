Shelby
===========

Shelby is a set of highly extensible objects to quickly build Knockout view models that will handle most of your application business cases. 

**It provided features to:**

* Communicate with REST and RPC endpoints in an asynchronous way with promises.
* Automatically map or unmap the models observables that are sent or received throught HTTP requests.
* Create a subscription to track all the changes of a set of observables (including arrays items).
* Start a transaction on 1 or multiple observables, providing the ability to commit or undo the changes on the observables.
* Handle the view model lifecycle.

**Shelby is not:**

* An SPA, this is only a set of view models and observable extenders that are highly extensible.

## Installation

Download a copy of shelby-x.y.z.js from [the dist folder](https://github.com/patricklafrance/shelby/tree/master/dist) and reference it in your web application:

Shelby depends on knockout.js, jQuery and a KO plugin called knockout.viewmodel. You must grab a copy of those or use the ones provided in [the dist/lib folder](https://github.com/patricklafrance/shelby/tree/master/dist/lib).

    <script src="jquery-x.y.z.js"></script>
    <script src="knockout-x.y.z.js"></script>
    <script src="knockout.viewmodel.js"></script>
    <script src="shelby-x.y.z.js"></script>

## Usages

### Basic

When you are using Shelby, you are basically only working with one of the provided view model (there's a few exception, we will talk about those later).

Here's a very basic usage of Shelby.

Define a view model.

    var EmployeeDetailViewModel = Shelby.ViewModel.extend({
        model: null,

        _initialize: function(clientModel) {
            this.model = this._fromJs(clientModel);
        }
    });

Create a view model instance from the definition.
    
    var vm = new EmployeeDetailViewModel({
        firstName: "John",
        lastName: "Doe"
    });

Bind the view model.

    vm.bind();

Later, dispose the view model _(optionnal)_.

    vm.dispose();

### Working with an HTTP endpoint

Automatically detect if you're URL are REST or RPC...

Sample code

#### Using REST

#### Using RPC

You can see a complete exemple of a Shelby view model that use HTTP communication [here](#).

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

The subscription extender let you create a subscription on a single or multiple observables to track all their changes and react to them. The difference between this extender and the KO native `subscribe` function is that you can:

* Create a subscription on a set of observables instead a single observable.
* Pause / resume the subscription.
* Automatically add the new array items to the subscription when they are push to an observable array that is part of the subscription.

If you have the following model that has been extended by Shelby.

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

You can subscribe to a single observable.

    var firstNameSubscription 
        = extendedModel.firstName.shelby.subscribe(firstChangedFunction);

Or to a set of observables.

    var addressSubscription 
        = extendedModel.address.shelby.subscribe(addressChangedFunction);

You can pause and resume the subscriptions.

    firstNameSubscription.pause();
    // Do not trigger anything.
    extendedModel.firstName("Jane Doe");
    firstNameSubscription.resume();

Or you can pause and resume the observable directly.

    extendedModel.firstName.shelby.pause();
    // Do not trigger anything.
    extendedModel.firstName("Jane Doe");
    extendedModel.firstName.shelby.resume();

When you create a subscription on an array, the default behavior is to:

Trigger when an item is added or removed from the array.

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // Call departmentsChangedFunction
    extendedModel.departments.push(accountingDepartment);

Trigger when an of the items are updated.

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // Call "departmentsChangedFunction"
    extendedModel.departments.peek()[1].name("Accounting2");

Automatically add to the subscriptions all the items that are added.

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);

    // "accountingDepartment" has been automatically added to the subscription.
    extendedModel.departments.push(accountingDepartment);

Automatically removed from the subscriptions all the items that are removed from the array.

    extendedModel.departments.shelby.subscribe(departmentsChangedFunction);
    extendedModel.departments.push(accountingDepartment); 

    // "accountingDepartment" has been automatically removed from the subscription.
    extendedModel.departments.remove(accountingDepartment);

This is the basic usage of the subscription extender, some options are available, like the ability to filter which properties of an object should be added to a subscription, you can learn about them [in the API section](#).

##### Edit extender

This is the basic usage of the subscription extender, some options are available, you can learn about them [in the API section](#).

#### Custom extenders

You can register a custom extender to Shelby with the `registerExtender` function.

    Shelby.ViewModel.registerExtender("CustomExtenderKey", extender);

Your `extender` must follow some rules, you can learn about them in the API section.

### View model lifecycle

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

When you override an event handler function you throw away the native behavior of that event handler if you dont call the base event handler. 
This is recommended that you always call the base event handler, but not mendatory.

You can see a more complete sample that use view model specific event handlers [here](#).

#### Global event handler

To add a global event handler you can use the `registerEventHandler` function.

    Shelby.ViewModel.registerEventHandler("beforeFetch", handlerFunction);

If you need to remove that event handler later, you must use a **_named_** event.

    Shelby.ViewModel.registerEventHandler("context:beforeFetch", handlerFunction);
    Shelby.ViewModel.removeEventHandler("context:beforeFetch");

You can see a more complete sample that use global event handlers [here](#).

## API

## Extension points

### Mapper

### Extenders

### View models

### Component factory

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



Provides the _basic features_ of a Shelby view model.


Provided the same features as Shelby.ViewModel with the ability to communicate with an HTTP endpoint.


