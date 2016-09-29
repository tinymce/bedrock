# REPL Simulation

> NOTE: `bedrock` has only experimental support for REPL Simulation and heavily leverages the capabilities of the browser. It will also only work on bolt ([github](https://github.com/ephox/bolt), [npm](https://www.npmjs.com/package/@ephox/bolt)) projects.


`bedrock-repl` is used to quickly load modules and scripts onto a blank page for convenient debugging. There are two primary command line arguments:

1. --config: the usual bolt config file.
2. --repl: the REPL configuration file. See details below.

Example: `bedrock-repl --config config/bolt/browser.js --repl config/repl/test.repl`


## REPL Configuration

The `repl` configuration file specifies which modules and scripts to load into the global namespace. It is a JSON file with three fields: entries, aliases, and scripts. An example file is below:

```
{
  "entries": [
    "ephox.example.repl.Main"
  ],
  "aliases": {
    "ephox.example.repl.Module1": "Module1",
    "ephox.example.repl.Module2": "Module2"
  },
  "scripts": [ "config/repl/script1.js", "config/repl/script2.js" ]
}
```


### Entries

The `entries` field is an array of top-level bolt module namespaces. It should represent the list of all modules to load in the project, such that every module has been loaded. The `entries` are **not** put into the global namespace.

### Aliases

The `aliases` field is a mapping of bolt module namespace to aliased global variable. All of the modules listed here must have been loaded by following the dependencies of the `entries` or an error will be thrown. `bedrock-repl` does nothing to ensure that you don't have duplicate alias names, so be careful.

### Scripts

The `scripts` field is an array of additional scripts to run after the aliases have been loaded. These scripts can use the aliases and can create additional global variables for debugging.

Example script file `config/repl/script1.js`

```
var newObject = Module1.create(10);
var newObject2 = Module2.create(20);
```

Note, that these scripts execute in the global namespace, so any variables declared will populate the global namespace. If you don't want them to be global, you can put them inside a closure.