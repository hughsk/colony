# colony

In-browser graphs representing the links between your code and its
dependencies. Built for Node, but should work cleanly with CommonJS in general.

![Colony](http://hughsk.github.com/colony/img/screenshot-semi.png)

## Installation

``` bash
$ [sudo] npm install -g colony
```

## Using the Command-Line Interface

```
Usage: colony {files} --npm {modules}

Options:
  -o, --outdir   Output files to a particular folder
  -m, --modules  Traverse node_modules for more code.
                 Use --no-modules to disable.
  -s, --scale    Scales the output graph by a specific size.
  -n, --npm      Download and process an NPM module instead of a local file.           
  -t, --title    Give the source file nodes a custom title                             
  -r, --readme   Readme file. By default will try to guess the first file's
                 readme.
  -j, --json     Output the module data as JSON, instead of generating and
                 writing HTML
  -h, --help     Display this message 
```

The simplest way to use `colony` from the command-line would be:

``` bash
$ colony app.js -o colony
```

This will traverse `app.js`'s dependencies and dump the necessary static
HTML/CSS/JS files to the `./colony` directory, this page being
`./colony/index.html`.

For convenience, you can download and visualise any combination of NPM modules
too:

``` bash
$ colony --npm forever --npm component --npm browserify -o colony-npm
```

## Development

Clone the repository from Github and install the development dependencies:

``` bash
$ git clone git://github.com/hughsk/colony.git
$ cd colony
$ npm install
```

To rebuild/minify the client-side code, run `npm run-script prepublish`.
