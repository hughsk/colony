var path = require('path')
  , wrench = require('wrench')
  , fs = require('fs')

var utils = module.exports = {}

utils.safemkdirp = function(dir) {
    try {
        wrench.mkdirSyncRecursive(dir)
    } catch(e) { return false }
    return true
};

utils.safemkdir = function(directory) {
    try {
        fs.mkdirSync(directory)
    } catch(e) { return false }
    return true
};

// Works out the most appropriate
// parent group to stick the file in
utils.findParent = function(file, parents) {
    var choice

    choice = parents.map(function(parent, n) {
        parent = path.dirname(parent)
        return {
            dir: path.relative(parent, file)
            , n: n
        }
    }).sort(function(a, b) {
        a = a.dir.match(/\.\./g)
        b = b.dir.match(/\.\./g)

        a = a ? a.length : 0
        b = b ? b.length : 0

        return a - b
    })[0]

    return path.join(choice.n+'', choice.dir)
};

utils.guessReadme = function(filenames) {
    var directories = filenames.map(function(filename) {
        return path.resolve(path.dirname(filename))
    })

    var readmes = directories.map(function(dir) {
        return fs.readdirSync(dir).filter(function(file) {
            return file.match(/^readme\.(md|markdown|)$/i)
        })[0]
    }).filter(function(f) {
        return f
    })

    if (!readmes.length) return false

    return path.resolve(path.dirname(filenames[0]), readmes[0])
};

utils.getModuleVersion = function(filename) {
    var dirname = path.dirname(filename)
      , pkg = path.resolve(dirname, 'package.json')
      , json

    try {
        json = fs.readFileSync(pkg, 'utf8')
        json = JSON.parse(json).version
    } catch(e) {
        return false
    }

    return json
};
