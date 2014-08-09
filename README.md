Shelby
===========

Shelby is a set of highly extensible objects to quickly build Knockout view models that will handle most of your application business cases. 

**It provided features to:**

* Communicate with REST and RPC endpoints in an asynchronous way with promises.
* Automatically map or unmap the models observables that are sent or received throught HTTP requests.
* Create a subscription to track all the changes of multiple observables (including arrays items).
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

Here's a very basic usage of Shelby, more complex exemples will be provided later.

1. Define a view model

        var ClientDetailViewModel = Shelby.ViewModel.extend({
            model: null,

            _initialize: function(clientModel) {
                this.model = his._fromJs(clientModel);
            }
        });

2. Create a view model instance from the definition
    
        var vm = new ClientDetailViewModel({
            firstName: "John",
            lastName: "Doe",
            corporation: "Acme"
        });

3. Bind the view model

        vm.bind();

4. Later, dispose the view model _(optionnal)_

        vm.dispose();

#### Lifecycle handlers

There is severals event that occurs during the lifeycle of a view model that you can hook too. You can hook to those events by providing handlers when you are defining a view model or, most of them can be provided globally, i.e. that they will be called **when the event occurs in any view models**. 

To provide an handler for a specific model, all you got to do, is to override the function that correspond to the event when you are defining your view model.

    Shelby.ViewModel.extend({
        _beforeBind: function() {
        }
    });

To see all the events that you can hook to, see the view models API section.

### Native extenders

### Arrays

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


