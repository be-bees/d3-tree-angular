import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as shape from 'd3-shape';
import { hierarchy, tree } from 'd3-hierarchy';
import * as d3 from 'd3';
import { treeData } from './data';
import { linkHorizontal } from 'd3-shape';
import * as _ from 'lodash';
// import { flatdata } from './flat-data';
declare var $;
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  blue = '#337ab7';
  green = '#5cb85c';
  yellow = '#f0ad4e';
  blueText = '#4ab1eb';
  purple = '#9467bd';
  nodeVerticalMargin = 180; // Adjust this value as needed
  treeChartSpacing = 200; // Adjust this value as needed
  private treeChartIndex = 0; // Initialize the index at 0

  margin = {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120,
  };
  // Height and width are redefined later in function of the size of the tree
  // (after that the data are loaded)
  width = 800 - this.margin.right - this.margin.left;
  height = 400 - this.margin.top - this.margin.bottom;
  svgWidth = '100%';
  svgHeight = '100%';
  rectNode = { width: 120, height: 45, textMargin: 5 };
  i = 0;
  duration = 750;
  root;
  maxDepth = 0;

  mousedown; // Use to save temporarily 'mousedown.zoom' value
  mouseWheel;
  mouseWheelName;
  isKeydownZoom = false;

  tree;
  baseSvg;
  svgGroup;
  nodeGroup; // If nodes are not grouped together, after a click the svg node will be set after his corresponding tooltip and will hide it
  nodeGroupTooltip;
  linkGroup;
  linkGroupToolTip;
  defs;
  // flatData = flatdata;
  treeRoot;

  d3DotTree;
  d3DotTreemap;
  d3DotHIerarchy;
  temp;
  rectW = 60;
  rectH = 30;
  ngOnInit() {
    window['d3'] = d3;
    console.log('d3', d3);
  }

  ngAfterViewInit() {
    // let tempData = d3
    //   .stratify()
    //   .parentId((d) => {
    //     return d.startNode;
    //   })
    //   .id((d) => {
    //     return d.endNode;
    //   })(this.flatData);

    // console.log(tempData);

    this.d3DotTree = d3.tree().size([this.height, this.width]);
    this.root = treeData.tree;
    if (Array.isArray(this.root))
      this.root = new Object({
        name: 'null',
        children: treeData.tree,
      });
    // this.root.fixed = true;

    // Dynamically set the height of the main svg container
    // breadthFirstTraversal returns the max number of node on a same level
    // and colors the nodes
    this.d3DotHIerarchy = d3.hierarchy(this.root, (d) => d.children);
    this.d3DotHIerarchy.x0 = this.width / 2;
    this.d3DotHIerarchy.y0 = 0;
    // Add this line to add space between tree charts and increment the index
    this.d3DotHIerarchy.x0 += this.treeChartSpacing * this.treeChartIndex;
    this.treeChartIndex++; // Increment the index for the next tree chart
    this.d3DotTreemap = this.d3DotTree(this.d3DotHIerarchy);
    // tree(this.tree);
    let maxTreeWidth = this.breadthFirstTraversal(
      'curr',
      this.d3DotTreemap.descendants()
    );
    // console.log('Max Tree Width - ' + maxTreeWidth)
    // this.height =
    //   maxTreeWidth * (this.rectNode.height + 20) +
    //   20 -
    //   this.margin.right -
    //   this.margin.left;
    // this.width =
    //   this.maxDepth * (this.rectNode.width * 1.5) -
    //   this.margin.top -
    //   this.margin.bottom;

    // this.d3DotHIerarchy = d3.hierarchy(this.root);
    // this.d3DotHIerarchy.x0 = this.height / 2;
    // this.d3DotHIerarchy.y0 = 0;

    this.temp = this;
    this.baseSvg = d3
      .select('#tree-container')
      .append('svg')
      .attr('width', this.svgWidth)
      .attr('height', this.svgHeight)
      .attr('viewBox', '0 0 600 350')
      .append('g')
      .attr('class', 'svgContainer')
      .attr('transform', 'translate(0,' + this.margin.top + ')');
    this.baseSvg.call(this.zoom);
    d3.select('.node').call(this.zoom);
    // d3
    //   .zoom()
    //   .scaleExtent([0.5, 1.5]) // Limit the zoom scale
    //   .on('zoom', () => {
    //     let scale = 1,
    //       translation = [d3.event.transform.x, d3.event.transform.y],
    //       tbound = -this.temp.height * scale,
    //       bbound = this.temp.height * scale,
    //       lbound = (-this.temp.width + this.temp.margin.right) * scale,
    //       rbound = (this.temp.width - this.temp.margin.left) * scale;
    //     // limit translation to thresholds

    //     translation = [
    //       Math.max(Math.min(translation[0], rbound), lbound),
    //       Math.max(Math.min(translation[1], bbound), tbound),
    //     ];
    //     d3.select('.drawarea').attr(
    //       'transform',
    //       'translate(' + translation + ')'
    //     );
    //   })
    // ();
    // console.log({ baseSvg: this.baseSvg });
    // Mouse wheel is desactivated, else after a first drag of the tree, wheel event drags the tree (instead of scrolling the window)
    // this.getMouseWheelEvent();
    // d3.select('#tree-container').select('svg').on(this.mouseWheelName, null);
    // d3.select('#tree-container').select('svg').on('dblclick.zoom', null);
    // SVG elements under nodeGroupTooltip could be associated with nodeGroup,
    // same for linkGroupToolTip and linkGroup,
    // but this separation allows to manage the order on which elements are drew
    // and so tooltips are always on top.
    this.svgGroup = this.baseSvg
      .append('g')
      .attr('class', 'drawarea')
      .append('g')
      .attr(
        'transform',
        Array.isArray(treeData.tree)
          ? 'translate(' +
              (this.margin.left - 150) +
              ',' +
              this.margin.top +
              ')'
          : 'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );

    this.nodeGroup = this.svgGroup.append('g').attr('id', 'nodes');
    this.linkGroup = this.svgGroup.append('g').attr('id', 'links');
    this.defs = this.baseSvg.append('defs');
    this.initArrowDef();
    this.initDropShadow();
    d3.select('#tree-container').call(this.zoom);

    this.update(this.d3DotHIerarchy);
  }

  currentLevelFn(currentLevel) {
    this.maxDepth++;
    currentLevel.forEach(function (node) {
      let blue = '#337ab7';
      let green = '#5cb85c';
      let yellow = '#f0ad4e';
      let blueText = '#4ab1eb';
      let purple = '#9467bd';
      if (node.data.type == 'type1') node.data.color = blue;
      if (node.data.type == 'type2') node.data.color = green;
      if (node.data.type == 'type3') node.data.color = yellow;
      if (node.data.type == 'type4') node.data.color = purple;
    });
  }

  update(source) {
    this.d3DotTreemap = this.d3DotTree(this.d3DotHIerarchy);

    var nodes = this.d3DotTreemap.descendants(),
      links = this.d3DotTreemap.descendants().slice(1);

    console.log({ nodes: nodes, links: links });
    // Check if two nodes are in collision on the ordinates axe and move them
    // this.breadthFirstTraversal("coll", this.tree.descendants(this.root));
    // Normalize for fixed-depth
    nodes.forEach((d, i) => {
      d.y = d.depth * this.nodeVerticalMargin;
    });

    // 1) ******************* Update the nodes *******************
    let node = this.nodeGroup.selectAll('g.node').data(nodes, (d, i) => {
      return d.id || (d.id = ++i);
    });

    // Enter any new nodes at the parent's previous position
    // We use "insert" rather than "append", so when a new child node is added (after a click)
    // it is added at the top of the group, so it is drawed first
    // else the nodes tooltips are drawed before their children nodes and they
    // hide them
    let nodeEnter = node
      .enter()
      .insert('g', 'g.node')
      .attr('class', (d) => {
        return 'node level-' + d.depth;
      })
      .style('display', (d) => (d.depth == 0 ? 'none' : 'block'))
      .attr('transform', (d) => {
        console.log(d);
        return `translate(${d.x + 10},${d.y})`;
      })
      .on('click', (d) => {
        this.click(d);
      });
    // nodeEnter
    //   .append('g')
    //   .append('rect')
    //   .attr('rx', 6)
    //   .attr('ry', 6)
    //   .attr('width', this.rectNode.width)
    //   .attr('height', this.rectNode.height)
    //   .attr('class', 'node-rect')
    //   // .attr('id', d => 'node-rect-of node-rect-of-' + d.data.id)
    //   .attr('fill', (d) => {
    //     return d.data.color;
    //   })
    //   .attr('filter', 'url(#drop-shadow)');

    // console.log({ rectnode: this.rectNode });
    nodeEnter
      .append('foreignObject')
      .attr('x', this.rectNode.textMargin)
      .attr('y', this.rectNode.textMargin)
      .attr('width', () => {
        return this.rectNode.width - this.rectNode.textMargin * 2 < 0
          ? 0
          : this.rectNode.width - this.rectNode.textMargin * 2;
      })
      .attr('height', (d) => {
        const contentHeight = this.calculateContentHeight(d);
        return contentHeight > this.rectNode.height
          ? contentHeight
          : this.rectNode.height;
      })
      .append('xhtml')
      .html((d, i) => {
        let result = '<div class="node-text wordwrap">';
        result += '<table>';
        for (let key in d.data) {
          result += '<tr>';
          result += '<td class="key">' + key + ':</td>';
          result += '<td class="value">' + d.data[key] + '</td>';
          result += '</tr>';
        }
        result += '</table>';
        result += '</div>';
        return result;
      })
      .on('mouseover', (d) => {
        // document.getElementById('nodeInfoID' + d.id).style.visibility =
        //   'visible';
        // document.getElementById('nodeInfoTextID' + d.id).style.visibility =
        //   'visible';
        // $('#nodeInfoID' + d.id).css('visibility', 'visible');
        // $('#nodeInfoTextID' + d.id).css('visibility', 'visible');
      })
      .on('mouseout', (d) => {
        // document.getElementById('nodeInfoID' + d.id).style.visibility =
        //   'hidden';
        // document.getElementById('nodeInfoTextID' + d.id).style.visibility =
        //   'hidden';
        // $('#nodeInfoID' + d.id).css('visibility', 'hidden');
        // $('#nodeInfoTextID' + d.id).css('visibility', 'hidden');
      });
    // Function to calculate the content height based on the number of rows

    // Update
    var nodeUpdate = nodeEnter.merge(node);

    // console.log({ rectNode: this.rectNode });
    // console.log({ rectNode: this.rectNode });
    // console.log({ tooltip: this.tooltip });

    // Transition nodes to their new position.
    nodeUpdate
      .transition()
      .duration(this.duration)
      .attr('transform', (d) => {
        return 'translate(' + (d.x + 10) + ',' + d.y + ')';
      });
    nodeUpdate.select('rect').attr('class', (d) => {
      return d._children ? 'node-rect-closed' : 'node-rect';
    });

    nodeUpdate.select('text').style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position
    let nodeExit = node
      .exit()
      .transition()
      .duration(this.duration)
      .attr('transform', (d) => {
        return 'translate(' + source.x + ',' + source.y + ')';
      })
      .remove();

    nodeExit.select('text').style('fill-opacity', 1e-6);

    // 2) ******************* Update the links *******************
    let link = this.linkGroup.selectAll('path.link').data(links, (d) => {
      return d.id;
    });

    function linkMarkerStart(direction, isSelected) {
      if (direction == 'SYNC') {
        return isSelected ? 'url(#start-arrow-selected)' : 'url(#start-arrow)';
      }
      return '';
    }

    function linkType(link) {
      if (link.direction == 'SYNC') return 'Synchronous [\u2194]';
      else {
        if (link.direction == 'ASYN') return 'Asynchronous [\u2192]';
      }
      return '???';
    }

    d3.selection.prototype.moveToFront = function () {
      // return this.each(function() {
      //   this.parentNode.appendChild(this);
      // });
      this.raise();
    };

    // Enter any new links at the parent's previous position.
    // Enter any new links at the parent's previous position.
    let linkEnter = link
      .enter()
      .insert('path', 'g')
      .attr('class', (d) => {
        return 'link level-' + d.parent.depth;
      })
      .style('display', (d) => (d.parent.depth == 0 ? 'none' : 'block'))
      .attr('id', (d) => {
        return 'linkID' + d.id;
      })
      .attr('d', (d) => {
        return this.curvedLink({
          source: { x: d.parent.x, y: d.parent.y }, // Use the parent's position
          target: { x: d.x, y: d.y },
        });
      });
    // .attr('marker-end', 'url(#end-arrow)')
    // .attr('marker-start', (d) => {
    //   return linkMarkerStart(d.data.link.direction, false);
    // });
    // console.log({ rectNode: this.rectNode });
    // Update
    let linkUpdate = linkEnter
      .merge(link)
      .transition()
      .duration(this.duration)
      .attr('d', (d) => {
        return this.curvedLink({
          source: { x: d.parent.x, y: d.parent.y }, // Update to use current x and y
          target: { x: d.x, y: d.y },
        });
      });

    // Transition links to their new position.
    linkUpdate
      .transition()
      .duration(this.duration)
      .attr('d', (d) => {
        return this.curvedLink({
          source: { x: d.parent.x, y: d.parent.y }, // Update to use current x and y
          target: { x: d.x, y: d.y },
        });
      });
    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(this.duration)
      .attr('d', function (d) {
        var o = { x: source.x, y: source.y };
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // console.log(d3.selectAll('.node-rect-of'))
  }
  calculateContentHeight(d) {
    // Adjust this value as needed for spacing between rows and padding
    const rowHeight = 10;
    const numRows = Object.keys(d.data).length;
    return numRows >= 5 ? (numRows / 2) * rowHeight : numRows * rowHeight;
  }
  // Zoom functionnality is desactivated (user can use browser Ctrl + mouse wheel shortcut)
  zoomAndDrag() {
    //let scale = d3.event.scale,
    let scale = 1,
      translation = d3.event.translate,
      tbound = -this.height * scale,
      bbound = this.height * scale,
      lbound = (-this.width + this.margin.right) * scale,
      rbound = (this.width - this.margin.left) * scale;
    // limit translation to thresholds
    translation = [
      Math.max(Math.min(translation[0], rbound), lbound),
      Math.max(Math.min(translation[1], bbound), tbound),
    ];
    d3.select('.drawarea').attr(
      'transform',
      'translate(' + translation + ')' + ' scale(' + scale + ')'
    );
  }

  // Toggle children on click.
  click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.update(d);
  }

  // Breadth-first traversal of the tree
  // func function is processed on every node of a same level
  // return the max level
  breadthFirstTraversal(str, tree) {
    let max = 0;
    if (tree && tree.length > 0) {
      let currentDepth = tree[0].depth;
      let fifo = [];
      let currentLevel = [];

      fifo.push(tree[0]);
      while (fifo.length > 0) {
        let node = fifo.shift();
        if (node.depth > currentDepth) {
          str == 'coll'
            ? this.collision(currentLevel)
            : this.currentLevelFn(currentLevel);
          currentDepth++;
          max = Math.max(max, currentLevel.length);
          currentLevel = [];
        }
        currentLevel.push(node);
        if (node.children) {
          for (let j = 0; j < node.children.length; j++) {
            fifo.push(node.children[j]);
          }
        }
      }
      str == 'coll'
        ? this.collision(currentLevel)
        : this.currentLevelFn(currentLevel);
      return Math.max(max, currentLevel.length);
    }
    return 0;
  }

  // x = ordoninates and y = abscissas
  collision(siblings) {
    let minPadding = 5;
    var that = this;
    if (siblings) {
      for (let i = 0; i < siblings.length - 1; i++) {
        if (
          siblings[i + 1].x - (siblings[i].x + that.rectNode.height) <
          minPadding
        )
          siblings[i + 1].x = siblings[i].x + that.rectNode.height + minPadding;
      }
    }
    // console.log({'siblings': siblings})
  }

  removeMouseEvents() {
    // Drag and zoom behaviors are temporarily disabled, so tooltip text can be selected
    this.mousedown = d3
      .select('#tree-container')
      .select('svg')
      .on('mousedown.zoom');
    d3.select('#tree-container').select('svg').on('mousedown.zoom', null);
  }

  reactivateMouseEvents() {
    // Reactivate the drag and zoom behaviors
    d3.select('#tree-container')
      .select('svg')
      .on('mousedown.zoom', this.mousedown);
  }

  // Name of the event depends of the browser
  getMouseWheelEvent() {
    if (d3.select('#tree-container').select('svg').on('wheel.zoom')) {
      this.mouseWheelName = 'wheel.zoom';
      return d3.select('#tree-container').select('svg').on('wheel.zoom');
    }
    if (
      d3.select('#tree-container').select('svg').on('mousewheel.zoom') != null
    ) {
      this.mouseWheelName = 'mousewheel.zoom';
      return d3.select('#tree-container').select('svg').on('mousewheel.zoom');
    }
    if (d3.select('#tree-container').select('svg').on('DOMMouseScroll.zoom')) {
      this.mouseWheelName = 'DOMMouseScroll.zoom';
      return d3
        .select('#tree-container')
        .select('svg')
        .on('DOMMouseScroll.zoom');
    }
  }

  diagonal(d) {
    // Calculate the source and target coordinates for the link paths
    const sourceX = d.x + this.rectNode.width / 2; // Middle of the source node
    const sourceY =
      d.y + this.calculateContentHeight(d) + this.rectNode.textMargin; // Start below the content
    const targetX = d.parent.x + this.rectNode.width / 2; // Middle of the target node
    const targetY = d.parent.y - this.rectNode.textMargin; // End above the content

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  }

  initDropShadow() {
    let filter = this.defs
      .append('filter')
      .attr('id', 'drop-shadow')
      .attr('color-interpolation-filters', 'sRGB');

    filter
      .append('feOffset')
      .attr('result', 'offOut')
      .attr('in', 'SourceGraphic')
      .attr('dx', 0)
      .attr('dy', 0);

    filter.append('feGaussianBlur').attr('stdDeviation', 2);

    filter
      .append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'shadow');

    filter
      .append('feComposite')
      .attr('in', 'offOut')
      .attr('in2', 'shadow')
      .attr('operator', 'over');
  }

  initArrowDef() {
    // Build the arrows definitions
    // End arrow
    this.defs
      .append('marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 0)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .attr('class', 'arrow')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

    // End arrow selected
    this.defs
      .append('marker')
      .attr('id', 'end-arrow-selected')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 0)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .attr('class', 'arrowselected')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5');

    // Start arrow
    this.defs
      .append('marker')
      .attr('id', 'start-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 0)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .attr('class', 'arrow')
      .append('path')
      .attr('d', 'M10,-5L0,0L10,5');

    // Start arrow selected
    this.defs
      .append('marker')
      .attr('id', 'start-arrow-selected')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 0)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .attr('class', 'arrowselected')
      .append('path')
      .attr('d', 'M10,-5L0,0L10,5');
  }
  // Add zoom behavior
  zoom = d3
    .zoom()
    .scaleExtent([0.1, 10]) // Limit the zoom scale
    .on('zoom', (event) => {
      console.log(event);
      // let scale = 1,
      //   translation = [d3.event.transform.x, d3.event.transform.y],
      //   tbound = -this.temp.height * scale,
      //   bbound = this.temp.height * scale,
      //   lbound = (-this.temp.width + this.temp.margin.right) * scale,
      //   rbound = (this.temp.width - this.temp.margin.left) * scale;
      // // limit translation to thresholds

      // translation = [
      //   Math.max(Math.min(translation[0], rbound), lbound),
      //   Math.max(Math.min(translation[1], bbound), tbound),
      // ];
      // this.baseSvg.attr('transform', 'translate(' + translation + ')');
      const transform = d3.event.transform;
      this.baseSvg.attr('transform', transform);
    }); // Define a curved link generator
  // Define a curved link generator
  curvedLink = d3
    .linkVertical() // Use linkVertical for top-to-bottom links
    .x((d) => d.x)
    .y((d) => d.y + this.rectNode.height); // Shift the starting point to the bottom of the source node
  // zoomm = d3
  //   .zoom()
  //   .scaleExtent([0.1, 10])
  //   .on(
  //     'zoom',
  //     _.debounce(() => {
  //       // Apply the zoom transform to the 'svgGroup' container
  //       this.svgGroup.attr('transform', d3.event.transform);
  //     }, 50)
  //   );
}
