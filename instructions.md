# colony

Colony is a neat little visualisation tool for exploring Node projects and
their dependencies using [d3.js](http://d3js.org).

Each file is represented as a node in the graph. If one file depends on another,
a link is made between the two files.

Each file is coloured based on the module they belong to. By hovering over a node,
you can see the file's name, the files it depends on (light), and the files that
depend on it (dark).

This demo is a visualisation of `colony`'s own code and dependencies, but you
can use the command-line tool to apply it to almost any NPM module or CommonJS
project. Check out [the repository](http://github.com/hughsk/colony)
on Github for more information.

## Usage

Click on any file to focus on it: this displays the file's source code
and hides any unrelated files on the screen. Click on the file again and the
rest of the project will come back into view. You can effectively explore an
entire codebase this way, including any included modules.

By pressing the tilde (**`~`**) key, you can toggle the size of this text box.