var highlight = require('highlight.js').highlight
  , autohighlight = require('highlight.js').highlightAuto
  , spawn = require('child_process').spawn
  , reqursive = require('reqursive')
  , marked = require('marked')
  , wrench = require('wrench')
  , utils = require('./utils')
  , async = require('async')
  , path = require('path')
  , ejs = require('ejs')
  , fs = require('fs')

var colony = module.exports = {}

marked.setOptions({
    gfm: true,
    sanitize: true,
    pedantic: false,
    highlight: function(code, lang) {
        if (!lang) return
        if (!code) return code

        if (lang === 'js') {
            lang = 'javascript'
            return highlight(lang, code).value
        }

        return autohighlight(code).value
    }
})

/**
 * Load the required files' data, plus
 * markdown-formatted readme.
 *
 * @param  {Array|String} filenames One or more filenames to traverse over.
 * @param  {Object}       options
 * @param  {Function}     callback
 */
colony.generate = function(filenames, options, callback) {
    var options = options || {}
      , callback = callback || function(){}

    filenames = Array.isArray(filenames) ? filenames : [filenames]

    options.readme = options.readme ?
        path.resolve(options.readme) :
        utils.guessReadme(filenames)

    return reqursive(filenames, options, function (err, files) {
        if (err) return callback(err)

        files.slice(0, filenames.length).forEach(function(file) {
            file.root = true
        })

        files = files.filter(function(file) {
            return !file.native
        })

        data = colony.force(files)
        data.scale = parseFloat(options.scale) || 1

        fs.readFile(options.readme || '', 'utf8', function(err, readme) {
            var readme = err ? false : marked(readme)

            callback(null, {
                  data: data
                , readme: readme
            })
        })
    })
};

/**
 * Download one or more NPM modules to a temporary
 * folder before calling colony.build() on them.
 *
 * @param  {String}   modules  An array of module names to pass to `npm install`
 * @param  {Object}   options
 * @param  {Function} callback
 */
colony.npm = function(modules, options, callback) {
    var moduleFolder = path.resolve('colony.tmp')
      , cwd = process.cwd()
      , npmName = process.platform === 'win32' ? 'npm.cmd' : 'npm'

    utils.safemkdir(moduleFolder)

    fs.writeFileSync(path.join(moduleFolder, 'package.json'), JSON.stringify({
          name: 'colony-render'
        , description: 'Placeholder for quick install of modules'
        , private: true
    }, null, 2) + '\n', 'utf8')

    var npm = spawn(npmName, ['install'].concat(modules), {
          cwd: moduleFolder
        , env: process.env
    })

    npm.stdout.pipe(process.stdout, { end: false })
    npm.stderr.pipe(process.stderr, { end: false })

    npm.once('exit', function(code) {
        if (code !== 0) return callback(new Error('NPM exited with code ' + code))

        modules = fs.readdirSync(path.join(moduleFolder, 'node_modules'))
        modules = modules.filter(function(folder) {
            return folder.indexOf('.')
        }).map(function(folder) {
            return require.resolve(
                path.resolve(moduleFolder, 'node_modules/' + folder)
            )
        })

        modules = modules.concat(options.others || [])

        callback(null, modules)
    })
};

/**
 * Swaps the results of `reqursive` out for
 * a d3-friendly force layout structure.
 */
colony.force = function(data) {
    var index
      , links
      , nodes

    data = data.filter(function(file) {
        return file.filename
    })

    index = data.reduce(function(index, file, n) {
        file.index = n
        index[file.filename] = file
        return index
    }, {})

    links = data.reduce(function(links, file) {

        file.parents.forEach(function(child) {
            if (!index[child]) return
            if (typeof index[child].index === 'undefined') return

            links.push({
                source: index[child].index,
                target: file.index
            })
        })

        return links
    }, [])

    nodes = data.map(function(file) {
        delete file.parents
        return file
    })

    return {
          nodes: data
        , links: links
    };
};

colony.build = function(filenames, options, callback) {
    var options = options || {}
      , sourcedirs

    var templates = {
          index: ejs.compile(fs.readFileSync(__dirname + '/../views/index.ejs', 'utf8'))
        , readme: ejs.compile(fs.readFileSync(__dirname + '/../views/readme.ejs', 'utf8'))
    };

    filenames = Array.isArray(filenames) ? filenames : [filenames]

    options.directory = options.directory || path.resolve(process.cwd(), 'colony')
    options.filedir   = options.filedir || path.resolve(options.directory, 'files')

    colony.generate(filenames, {
          traverseModules: options.traverseModules
        , readme: options.readme
        , title: options.title
        , scale: options.scale
        , absolute: true
    }, function(err, res) {
        if (err) return callback(err)

        var index = path.resolve(options.directory, 'index.html')

        utils.safemkdir(options.directory)
        utils.safemkdir(options.filedir)

        filenames.forEach(function(name, i) {
            utils.safemkdir(path.resolve(options.filedir, i+''))
        })

        wrench.copyDirSyncRecursive(__dirname + '/../public', options.directory)

        var scripts = res.data.nodes.filter(function(file) {
            return file && file.filename
        }).map(function(file) {
            var source = file.filename

            file.filename = utils.findParent(file.filename, filenames)

            return {
                  source: source
                , dest: path.resolve(options.filedir, file.filename) + '.html'
                , id: file.id
            };
        });

        var html = templates.index({
              files: res.data
            , readme: res.readme
            , title: options.title
            , fork: options.fork || ''
        })

        fs.writeFileSync(index, html, 'utf8')

        buildScriptPages(scripts, templates.readme, callback)
    });
};

function buildScriptPages(scripts, template, callback) {
    async.map(scripts, function(file, next) {
        fs.readFile(file.source, 'utf8', function(err, contents) {
            if (err) return next(null, false)

            contents = contents.split('\n')
            while (/^\s*?$/.test(contents[0])) {
                contents.shift()
            }
            contents = contents.join('\n')

            utils.safemkdirp(path.dirname(file.dest))

            contents = /\.(js|json)$/gi.test(file.source) ?
                  highlight('javascript', contents).value
                : autohighlight(contents).value

            contents = template({
                  name: file.id
                , contents: contents
            })

            fs.writeFile(file.dest, contents, 'utf8', next)
        })
    }, callback)
};
