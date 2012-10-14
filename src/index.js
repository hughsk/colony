var d3 = require('d3')
  , mousetrap = require('mousetrap')
  , debounce = require('debounce')
  , resize = require('./resize')

var root = document.getElementById('colony')
  , colony = window.colony

var nodes = colony.nodes
  , links = colony.links
  , scale = colony.scale
  , focus

var width = 600
  , height = 400
  , link
  , node
  , text
  , textTarget = false

var colors = {
      links: 'FAFAFA'
    , text: {
        subtitle: 'FAFAFA'
    }
    , nodes: {
        method: function(d) {
            return groups[d.group].color
        }
        , hover: 'FAFAFA'
        , dep: '252929'
    }
}

var readme = document.getElementById('readme-contents').innerHTML

links.forEach(function(link) {
    var source = nodes[link.source]
      , target = nodes[link.target]

    source.children = source.children || []
    source.children.push(link.target)

    target.parents = target.parents || []
    target.parents.push(link.source)
})

var groups = nodes.reduce(function(groups, file) {
    var group = file.mgroup || 'none'
      , index = groups.indexOf(group)

    if (index === -1) {
        index = groups.length
        groups.push(group)
    }

    file.group = index

    return groups
}, [])

groups = groups.map(function(name, n) {
    var color = d3.hsl(n / groups.length * 300, 0.7, 0.725)

    return {
          name: name
        , color: color.toString()
    };
})

var force = d3.layout.force()
    .size([width, height])
    .charge(-50 * colony.scale)
    .linkDistance(20 * colony.scale)
    .on('tick', function() {
        link.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; })

        node.attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })

        if (textTarget) {
            text.attr('transform'
                    , 'translate(' + textTarget.x + ',' + textTarget.y + ')')
        }
    })

var vis = d3.select(root)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

force.nodes(nodes)
     .links(links)
     .start()

link = vis.selectAll('line.link').data(links)
node = vis.selectAll('circle.node')
    .data(nodes, function(d) { return d.filename })

link.enter()
    .insert('line', '.node')
    .attr('class', 'link')
    .attr('x1', function(d) { return d.source.x; })
    .attr('y1', function(d) { return d.source.y; })
    .attr('x2', function(d) { return d.target.x; })
    .attr('y2', function(d) { return d.target.y; })
    .style('stroke', colors.links)
    .style('opacity', function(d) {
        return d.target.module ? 0.2 : 0.3
    })

node.enter()
    .append('circle')
    .attr('class', 'node')
    .attr('cx', function(d) { return d.x })
    .attr('cy', function(d) { return d.y })
    .attr('r', function(d) {
        return scale * (d.root ? 8 : d.module && !d.native ? 5 : 3)
    })
    .style('fill', colors.nodes.method)
    .call(force.drag)
    .on('mouseover', function(d) {
        textTarget = d

        text.attr('transform', 'translate(' + d.x + ',' + d.y + ')')
            .text(d.id)
            .style('display', null)

        d3.select(this)
          .style('fill', colors.nodes.hover)

        d3.selectAll(childNodes(d))
            .style('fill', colors.nodes.hover)
            .style('stroke', colors.nodes.method)
            .style('stroke-width', 2)

        d3.selectAll(parentNodes(d))
            .style('fill', colors.nodes.dep)
            .style('stroke', colors.nodes.method)
            .style('stroke-width', 2)
    })
    .on('mouseout', function(d) {
        textTarget = false

        text.style('display', 'none')

        d3.select(this)
          .style('fill', colors.nodes.method)

        d3.selectAll(childNodes(d))
            .style('fill', colors.nodes.method)
            .style('stroke', null)

        d3.selectAll(parentNodes(d))
            .style('fill', colors.nodes.method)
            .style('stroke', null)
    })
    .on('click', function(d) {
        if (focus === d) {
            force.charge(-50 * colony.scale)
                 .linkDistance(20 * colony.scale)
                 .linkStrength(1)
                 .start()

            node.style('opacity', 1)
            link.style('opacity', function(d) {
                return d.target.module ? 0.2 : 0.3
            })

            focus = false

            d3.select('#readme-contents')
              .html(readme)
              .classed('showing-code', false)

            return
        }

        focus = d

        d3.xhr('./files/' + d.filename + '.html', function(res) {
            if (!res) return

            d3.select('#readme-contents')
              .html(res.responseText)
              .classed('showing-code', true)

            document.getElementById('readme')
                    .scrollTop = 0
        })

        node.style('opacity', function(o) {
            o.active = connected(d, o)
            return o.active ? 1 : 0.2
        })

        force.charge(function(o) {
            return (o.active ? -100 : -5) * colony.scale
        }).linkDistance(function(l) {
            return (l.source.active && l.target.active ? 100 : 20) * colony.scale
        }).linkStrength(function(l) {
            return (l.source === d || l.target === d ? 1 : 0) * colony.scale
        }).start()

        link.style('opacity', function(l, i) {
            return l.source.active && l.target.active ? 0.2 : 0.02
        })
    })

text = vis.selectAll('.nodetext')
    .data([
          [-1.5,  1.5,  1] // "Shadows"
        , [ 1.5,  1.5,  1]
        , [-1.5, -1.5,  1]
        , [ 1.5, -1.5,  1]
        , [ 0.0,  0.0,  0] // Actual Text
    ])
  .enter()
    .insert('text', ':last-child')
    .attr('class', 'nodetext')
    .classed('shadow', function(d) { return d[2] })
    .attr('dy', function(d) { return d[0] - 10 })
    .attr('dx', function(d) { return d[1] })
    .attr('text-anchor', 'middle')

function refresh(e) {
    width = Math.max(window.innerWidth * 0.5, 500)
    height = window.innerHeight

    force.size([width, height])
         .resume()

    vis.attr('width', window.innerWidth)
       .attr('height', height)
};

function childNodes(d) {
    if (!d.children) return []

    return d.children
        .map(function(child) {
            return node[0][child]
        }).filter(function(child) {
            return child
        })
};

function parentNodes(d) {
    if (!d.parents) return []

    return d.parents
        .map(function(parent) {
            return node[0][parent]
        }).filter(function(parent) {
            return parent
        })
};

function connected(d, o) {
    return o.index === d.index ||
        (d.children && d.children.indexOf(o.index) !== -1) ||
        (o.children && o.children.indexOf(d.index) !== -1) ||
        (o.parents && o.parents.indexOf(d.index) !== -1) ||
        (d.parents && d.parents.indexOf(o.index) !== -1)
};

function restartForce() {
    var theta = force.theta()

    force.start()
         .theta(theta)
};

resize(debounce(refresh, 500))
refresh()

mousetrap.bind(['~', '`'], function() {
    var readme = d3.select('#readme')

    readme.classed('enlarged', !readme.classed('enlarged'))
})
