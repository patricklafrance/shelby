## What is it ?

Shelby is a set of objects to quickly build Knockout view models that will handle most of your business cases. 

**It provided features to:**

1. Communicate with HTTP endpoints in an asynchronous way with promises.
2. Automatically map or unmap the models observables that are sent or received throught HTTP requests.
4. Create a subscription to track all the changes of multiple observables (including arrays items). It also provide the ability to pause / resume those subscriptions.
5. Start a transaction on 1 or multiple observables that gives the ability to commit or undo the changes on the observables.
6. Handle the view model lifecycle.

**Shelby is not:**

1. An SPA, this is only a set of view models and observable extenders that are highly extensible.

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

1. test/runner-jquery-1.html
2. test/runner-jquery-2.html
3. test/exports/runner-browserify.html
4. test/exports/runner-requirejs.html

## Usages

1. **Basic**

    When you are using Shelby, you are basically only working with one of provided view model objects (there's a few exception, we will talk about those later).



2. **Use the native extenders**

3. **Work with arrays**

## API

## Extension points

1. **Mapper**

2. **Extenders**

3. **View models**

4. **Component factory**


