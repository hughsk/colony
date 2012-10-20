# colony

In-browser graphs representing the links between your Node.js code and its
dependencies.

![Colony](http://hughsk.github.com/colony/img/screenshot-semi.png)

## Installation

``` bash
$ [sudo] npm install -g colony
```

## Quick Start

``` bash
# Install colony and serve
$ [sudo] npm install -g serve colony
# Download and visualise "browserify" from NPM
$ colony --npm browserify && serve colony
# Open localhost:3000 in your web browser
$ open http://localhost:3000/
```

## Using the Command-Line Interface

```
Usage: colony {files} --npm {modules}

Options:
  -o, --outdir   Output files to a particular folder                                     [default: "./colony"]
  -m, --modules  Traverse node_modules for more code. Use --no-modules to disable.       [default: true]
  -s, --scale    Scales the output graph by a specific size.                             [default: 1]
  -n, --npm      Download and process an NPM module instead of a local file.
  -t, --title    Change the title of the page
  -r, --readme   Readme file. By default will try to guess the first file's readme.
  -j, --json     Output the scripts' data as JSON, instead of generating and writing HTML
  -f, --fork     "Fork me on Github" button, e.g. "hughsk/colony". Hidden by default.
  -h, --help     Display this message
```

The simplest way to use `colony` from the command-line would be:

``` bash
$ colony app.js -o colony
```

This will traverse `app.js`'s dependencies and dump the necessary static
HTML/CSS/JS files to the `./colony` directory, this page being
`./colony/index.html`. Then it's just a matter of serving it up using something
like [serve](http://npm.im/serve), [NGINX](http://nginx.org) or plain old 
[Apache](http://apache.org/).

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
