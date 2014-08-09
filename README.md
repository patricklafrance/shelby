Shelby
===========

Shelby is a set of highly extensible objects to quickly build Knockout view models that will handle most of your application business cases. 

**It provided features to:**

* Communicate with REST and RPC HTTP endpoints in an asynchronous way with promises.
* Automatically map or unmap the models observables that are sent or received throught HTTP requests.
* Create a subscription to track all the changes of multiple observables (including arrays items).
* Start a transaction on 1 or multiple observables, providing the ability to commit or undo the changes on the observables.
* Handle the view model lifecycle.

**Shelby is not:**

* An SPA, this is only a set of view models and observable extenders that are highly extensible.

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

## Usages

### Basic

When you are using Shelby, you are basically only working with one of the provided `ViewModel` (there's a few exception, we will talk about those later).

#### Shelby.ViewModel

Provides the _basic features_ of a Shelby view `ViewModel`.

1. Define a `ViewModel`:

    var ClientDetailViewModel = Shelby.ViewModel.extend({
        model: null,

        _initialize: function(clientModel) {
            this.model = clientModel;
        },

        _beforeBind: function() {
            this._fromJs(this.model);
        },
    });

2. Create a `ViewModel` instance from the definition:
    
    var vm = new ClientDetailViewModel({
        firstName: "John",
        lastName: "Doe",
        corporation: "Acme"
    });

3. Bind the `ViewModel`:

    vm.bind();

#### Shelby.HttpViewModel

#### Lifecycle handlers

### Use the native extenders

### Working with arrays

## API

## Extension points

### Mapper

### Extenders

### View models

### Component factory


