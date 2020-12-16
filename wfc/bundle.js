(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dat = require("dat.gui");
const heap_js_1 = require("heap-js");
let config = {};
window.onload = function () {
    var gui = new Dat.GUI();
    const readableName = (n) => n.replace(/([A-Z])/g, ' $1').toLowerCase();
    function addConfig(name, initial, min, max) {
        config[name] = initial;
        return gui.add(config, name, min, max).name(readableName(name));
    }
    addConfig("includeRotatedAndFlipped", false).onFinishChange(initTiles);
    addConfig("tileSize", 3, 2, 10).step(1).onFinishChange(initTiles);
    addConfig("outputWidth", 50, 5, 1000).step(5).onFinishChange(initTiles);
    addConfig("outputHeight", 50, 5, 1000).step(5).onFinishChange(initTiles);
    addConfig("input", "tiles/Water.png", [
        "tiles/3Bricks.png", "tiles/Angular.png", "tiles/Cat.png", "tiles/Cats.png", "tiles/Cave.png", "tiles/Chess.png",
        "tiles/City.png", "tiles/ColoredCity.png", "tiles/Dungeon.png", "tiles/Fabric.png", "tiles/Flowers.png", "tiles/Forest.png",
        "tiles/Grid.png", "tiles/GridLong.png", "tiles/Hogs.png", "tiles/Knot.png", "tiles/Lake.png", "tiles/LessRooms.png", "tiles/Link.png",
        "tiles/Link2.png", "tiles/MagicOffice.png", "tiles/Maze.png", "tiles/Mazelike.png", "tiles/MoreFlowers.png", "tiles/Mountains.png",
        "tiles/Nested.png", "tiles/Office.png", "tiles/Office2.png", "tiles/Paths.png", "tiles/Platformer.png", "tiles/Qud.png", "tiles/RedDot.png",
        "tiles/RedMaze.png", "tiles/Rooms.png", "tiles/Rule126.png", "tiles/ScaledMaze.png", "tiles/Sewers.png", "tiles/SimpleKnot.png",
        "tiles/SimpleMaze.png", "tiles/SimpleWall.png", "tiles/Skew1.png", "tiles/Skew2.png", "tiles/Skyline.png", "tiles/Skyline2.png",
        "tiles/SmileCity.png", "tiles/Spirals.png", "tiles/Town.png", "tiles/TrickKnot.png", "tiles/Village.png", "tiles/Wall.png", "tiles/Water.png",
    ]).onFinishChange(initTiles);
    gui.useLocalStorage = true;
    initTiles();
};
let intervalId;
function initTiles() {
    let img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = config.input;
    if (intervalId)
        window.clearInterval(intervalId);
    img.onload = function () {
        // Update the input tile display.
        {
            let canvas = $("input");
            let context = canvas.getContext('2d');
            if (!context)
                return;
            context.imageSmoothingEnabled = false;
            // [canvas.width, canvas.height] = [img.width, img.height];
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        // Get the image data from the image.
        {
            let canvas = new OffscreenCanvas(img.width, img.height);
            let context = canvas.getContext('2d');
            if (!context)
                return;
            context.drawImage(img, 0, 0);
            let imageData = context.getImageData(0, 0, img.width, img.height);
            let results = parseImage(imageData);
            let core = new CoreState(...results);
            core.init();
            core.render();
            let paused = true;
            window.onclick = () => { paused = !paused; };
            intervalId = window.setInterval(() => {
                if (paused)
                    return;
                if (!core.step())
                    window.clearInterval(intervalId);
                core.render();
            }, 0);
        }
    };
}
ImageData.prototype["get"] = function ([x, y]) {
    let r = 4 * (y * this.width + x);
    return (this.data[r] << 24) | (this.data[r + 1] << 16) | (this.data[r + 2] << 8) | (this.data[r + 3]);
};
ImageData.prototype["set"] = function ([x, y], color) {
    let r = 4 * (y * this.width + x);
    this.data[r + 0] = (color >>> 24) & 0xff;
    this.data[r + 1] = (color >>> 16) & 0xff;
    this.data[r + 2] = (color >>> 8) & 0xff;
    this.data[r + 3] = (color) & 0xff;
};
// Convenience function for iterating over rectangular regions.
function* rectRange([w, h]) {
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            yield [x, y];
        }
    }
}
// Helper for flattening a 2d coord to an index (row-major order).
function pointToIndex([x, y], width) {
    return x + y * width;
}
// Helper to draw an ImageData to a canvas, scaled to that canvas's size.
function renderToCanvas(canvasId, imageData) {
    // Blit to an offscreen canvas first, so we can scale it up when drawing it for real.
    let buffer = new OffscreenCanvas(imageData.width, imageData.height);
    {
        let context = buffer.getContext('2d');
        if (!context)
            return;
        context.putImageData(imageData, 0, 0);
    }
    let canvas = $(canvasId);
    let context = canvas.getContext('2d');
    if (!context)
        return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(buffer, 0, 0, canvas.width, canvas.height);
}
// Full jquery emulation.
const $ = (id) => document.getElementById(id);
// Cardinal directions.
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Left"] = 3] = "Left";
})(Direction || (Direction = {}));
;
(function (Direction) {
    Direction.items = [Direction.Up, Direction.Right, Direction.Down, Direction.Left];
    Direction.toOpposite = [Direction.Down, Direction.Left, Direction.Up, Direction.Right];
    Direction.toOffset = [[0, -1], [1, 0], [0, 1], [-1, 0]];
})(Direction || (Direction = {}));
// Manages relative frequencies of all the tiles. The higher a tile's frequency,
// the more likely that tile will appear in the output.
class FrequencyHints {
    constructor(counts) {
        this._tileWeights = [];
        this._sumWeight = 0;
        this._sumWeightTimesLogWeight = 0;
        this._tileWeights = counts;
    }
    // w[n] - the relative frequency of the given tile. This is simply the number of
    // times it appears in the source image.
    weightForTile(index) {
        return this._tileWeights[index];
    }
    get numTiles() { return this._tileWeights.length; }
}
// Manages rules for which tiles are allowed to be adjacent to which other tiles, in a given direction.
class AdjacencyRules {
    constructor(tiles) {
        this._allowed = []; // _allowed[from][dir] = [tileIndices...]
        for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles.length; j++) {
                for (let dir of Direction.items) {
                    if (AdjacencyRules._isCompatible(tiles[i], tiles[j], dir))
                        this._allow(i, j, dir);
                }
            }
        }
    }
    get numTiles() { return this._allowed.length; }
    // Returns true if we can place tile `to` in the direction `dir` from `from`.
    isAllowed(from, to, dir) {
        return true;
    }
    // Returns an iterator of all the tiles which can be placed one space in direction `dir`
    // from tile `from`.
    *allowedTiles(from, dir) {
        let allowed = this._allowed[from][dir];
        for (let tile of allowed)
            yield tile;
    }
    // Returns true if tile we can place tile `b` in the direction `dir` from `a`.
    static _isCompatible(a, b, dir) {
        let offset = Direction.toOffset[dir];
        for (let [ax, ay] of rectRange([config.tileSize, config.tileSize])) {
            let [bx, by] = [ax - offset[0], ay - offset[1]];
            if (bx < 0 || by < 0 || bx >= config.tileSize || by >= config.tileSize)
                continue; // not an overlapping region, ignore
            if (a.getPixel([ax, ay]) != b.getPixel([bx, by]))
                return false;
        }
        return true;
    }
    // Adds a new rule to the ruleset.
    _allow(from, to, dir) {
        if (!this._allowed[from])
            this._allowed[from] = [];
        if (!this._allowed[from][dir])
            this._allowed[from][dir] = [];
        this._allowed[from][dir].push(to);
    }
}
// Pixel data for a Tile. Only used during pre-processing. During the actual algorithm,
// we refer to tiles by index. The AdjacencyRules and FrequencyHints govern how we
// can place tiles in the grid, and the TileColorMapping tells us what color to use.
class Tile {
    constructor() {
        this._pixels = [];
    }
    topLeftPixel() { return this._pixels[0]; }
    getPixel([x, y]) { return this._pixels[x + y * config.tileSize]; }
    // Map does not provide a way to provide our own hash or equality functions,
    // so we generate our own key based on the tile's pixel data.
    get mapKey() {
        if (!this._mapKey)
            this._mapKey = this._pixels.join(",");
        return this._mapKey;
    }
    // Returns the Tile found at the given coord in the image, wrapping coordinates.
    static fromImageData(imageData, [ix, iy]) {
        let tile = new Tile;
        for (let [tx, ty] of rectRange([config.tileSize, config.tileSize]))
            tile._pixels[pointToIndex([tx, ty], config.tileSize)] = imageData.get([(ix + tx) % imageData.width, (iy + ty) % imageData.height]);
        return tile;
    }
    // Returns a copy of `orig` rotated 90 degrees clockwise.
    static rotated(orig) {
        // (x,y) => (w-y,x)
        let tile = new Tile;
        for (let [x, y] of rectRange([config.tileSize, config.tileSize]))
            tile._pixels[pointToIndex([config.tileSize - 1 - y, x], config.tileSize)] = orig._pixels[pointToIndex([x, y], config.tileSize)];
        return tile;
    }
    // Returns a copy of `orig` flipped vertically.
    static flipped(orig) {
        // (x,y) => (x,w-y)
        let tile = new Tile;
        for (let [x, y] of rectRange([config.tileSize, config.tileSize]))
            tile._pixels[pointToIndex([x, config.tileSize - 1 - y], config.tileSize)] = orig._pixels[pointToIndex([x, y], config.tileSize)];
        return tile;
    }
}
// Maps Tile to appearance count for that tile.
class TileCountMap extends Map {
    addTile(tile) {
        let value = this.get(tile.mapKey) || { tile: tile, count: 0 };
        value.count++;
        this.set(tile.mapKey, value);
        return value.count;
    }
}
// Pre-processing step. Reads an image and cuts it up into NxN tiles (N=tileSize).
// Also calculates the rules that are fed into the main algorithm.
function parseImage(imageData) {
    let tileMap = new TileCountMap();
    for (let p of rectRange([imageData.width, imageData.height])) {
        let tile = Tile.fromImageData(imageData, p);
        let count = tileMap.addTile(tile);
        if (config.includeRotatedAndFlipped) {
            // Add the other 3 rotations, and the 4 rotations of the flipped case (for 0, 90, 180, and 270 degrees)
            let subtile = tile;
            tileMap.addTile(subtile = Tile.rotated(subtile));
            tileMap.addTile(subtile = Tile.rotated(subtile));
            tileMap.addTile(subtile = Tile.rotated(subtile));
            tileMap.addTile(subtile = Tile.flipped(tile));
            tileMap.addTile(subtile = Tile.rotated(subtile));
            tileMap.addTile(subtile = Tile.rotated(subtile));
            tileMap.addTile(subtile = Tile.rotated(subtile));
        }
    }
    let tiles = [];
    let counts = [];
    for (let { tile, count } of tileMap.values()) {
        tiles.push(tile);
        counts.push(count);
    }
    let adjacencyRules = new AdjacencyRules(tiles);
    let frequencyHints = new FrequencyHints(counts);
    let colorForTile = tiles.map(tile => tile.topLeftPixel());
    renderTileset(tiles);
    return [adjacencyRules, frequencyHints, colorForTile];
}
// Draws the tileset to the canvas.
function renderTileset(tiles) {
    let across = Math.floor(Math.sqrt(tiles.length));
    let down = Math.ceil(tiles.length / across);
    let imageData = new ImageData((config.tileSize + 1) * across - 1, (config.tileSize + 1) * down - 1);
    for (let [i, j] of rectRange([across, down])) {
        let tile = i + j * across;
        if (tile >= tiles.length)
            break;
        for (let [x, y] of rectRange([config.tileSize, config.tileSize]))
            imageData.set([(config.tileSize + 1) * i + x, (config.tileSize + 1) * j + y], tiles[tile].getPixel([x, y]));
    }
    renderToCanvas("tileset", imageData);
}
// Represents the state of a single pixel in the output, mainly which tiles are possible to be placed
// in this cell. Possible tiles are eliminated as the algorithm proceeds, until all cells are "collapsed"
// (e.g. they have a single possible tile).
class Cell {
    constructor() {
        // _possible[tileIndex] is true if tileIndex can be placed in this cell, false otherwise.
        this._possible = [];
        this._chosenTile = -1;
        // Cache of sum(w[n]), used in entropy calculations.
        this._sumWeight = 0;
        // Cache of sum(w[n]*log(w[n])), used in entropy calculations.
        this._sumWeightTimesLogWeight = 0;
        // tileEnablerCounts[tileIndex][dir] = for adjacentCell in direction `dir` from this cell, this is the count
        // of possible tiles in adjacentCell that are compatible with `tileIndex` in this cell. Used in propagation.
        this._tileEnablerCounts = [];
    }
    // All Cells start the same, so we clone them from a template.
    static createTemplate(adjacencyRules, frequencyHints) {
        let cell = new Cell;
        cell._possible = new Array(frequencyHints.numTiles).fill(true);
        for (let i = 0; i < frequencyHints.numTiles; i++) {
            let w = frequencyHints.weightForTile(i);
            cell._sumWeight += w;
            cell._sumWeightTimesLogWeight += w * Math.log2(w);
        }
        for (let i = 0; i < adjacencyRules.numTiles; i++) {
            cell._tileEnablerCounts[i] = [0, 0, 0, 0]; // 4 directions
            for (let dir of Direction.items) {
                for (let j of adjacencyRules.allowedTiles(i, dir)) {
                    cell._tileEnablerCounts[i][dir]++;
                }
            }
        }
        return cell;
    }
    // Returns a deep copy of the template.
    static fromTemplate(template) {
        let cell = new Cell;
        cell._possible = Array.from(template._possible);
        cell._sumWeight = template._sumWeight;
        cell._sumWeightTimesLogWeight = template._sumWeightTimesLogWeight;
        cell._tileEnablerCounts = Array.from(template._tileEnablerCounts, inner => Array.from(inner));
        return cell;
    }
    // Returns an iterator of all the tiles that can be placed in this Cell.
    *possibleTiles() {
        for (let i = 0; i < this._possible.length; i++) {
            if (this._possible[i])
                yield i;
        }
    }
    // Picks a tile at random from the remaining possible tiles, with higher
    // frequency tiles being more likely to be picked.
    chooseTile(frequencyHints) {
        let chosenWeight = Math.random() * this._sumWeight;
        for (let tile of this.possibleTiles()) {
            chosenWeight -= frequencyHints.weightForTile(tile);
            if (chosenWeight < 0)
                return this._chosenTile = tile;
        }
        throw new Error("cell weights were invalid");
    }
    // Removes a tile from the list of possible tiles.
    removeTile(tile, frequencyHints = null) {
        this._possible[tile] = false;
        if (frequencyHints) {
            let weight = frequencyHints.weightForTile(tile);
            this._sumWeight -= weight;
            this._sumWeightTimesLogWeight -= weight * Math.log2(weight);
        }
    }
    // Returns true if we've locked in a choice for this tile (e.g. chooseTile was called).
    get isCollapsed() { return this._chosenTile != -1; }
    // Returns true of there are no possible tiles remaining to choose. This signals
    // a contradiction was reached.
    get noPossibleTiles() { return this._sumWeight == 0; }
    // entropy = log(W) - sum(w[n]*log(w[n]))/W where W = sum(w[n])
    get entropy() { return Math.log2(this._sumWeight) - this._sumWeightTimesLogWeight / this._sumWeight; }
    enablerCountsForTile(tile) { return this._tileEnablerCounts[tile]; }
}
class CoreState {
    constructor(a, f, c) {
        this._grid = [];
        this._adjacencyRules = a;
        this._frequencyHints = f;
        this._colorForTile = c;
    }
    // Initalizes the grid, etc.
    init() {
        this._entropyHeap = new heap_js_1.default((a, b) => a.entropy - b.entropy);
        let cellTemplate = Cell.createTemplate(this._adjacencyRules, this._frequencyHints);
        for (let y = 0; y < config.outputHeight; y++) {
            this._grid[y] = [];
            for (let x = 0; x < config.outputWidth; x++) {
                this._grid[y][x] = Cell.fromTemplate(cellTemplate);
                this._entropyHeap.add({ pos: [x, y], entropy: this._grid[y][x].entropy });
            }
        }
    }
    // Handles a single step of the WFC algorithm:
    // 1. Pick the cell with minimum entropy.
    // 2. Choose a tile at random for that cell and eliminate all other options.
    // 3. Propagate the consequences, recursively.
    // Returns true if there is more work to do, false if we're done.
    step() {
        let p = this._chooseCell();
        if (!p)
            return false;
        let removals = this._collapseCell(p);
        return this._propagate(removals);
    }
    // Draws the current state of the generated image to our output canvas.
    // For collapsed cells, use the top-left pixel value of the tile that was chosen for that cell.
    // For uncollapsed cells, use a weighted average of that cell's possible tiles.
    render() {
        let imageData = new ImageData(config.outputWidth, config.outputHeight);
        for (let [x, y] of rectRange([config.outputWidth, config.outputHeight])) {
            let color = 0;
            let sumWeight = 0;
            for (let tile of this._grid[y][x].possibleTiles()) {
                let w = this._frequencyHints.weightForTile(tile);
                color += this._colorForTile[tile] * w;
                sumWeight += w;
            }
            color = (color / sumWeight) | 0xff; // full alpha
            imageData.set([x, y], color);
        }
        renderToCanvas("output", imageData);
    }
    // Returns the lowest-entropy cell, or null if all cells have been collapsed.
    _chooseCell() {
        let cell;
        while (cell = this._entropyHeap.pop()) {
            let [x, y] = cell.pos;
            if (!this._grid[y][x].isCollapsed)
                return cell.pos;
        }
        return null;
    }
    // Chooses a tile for the given cell, and return a list representing the removal of
    // the unchosen tiles.
    _collapseCell([x, y]) {
        let cell = this._grid[y][x];
        let chosenTile = cell.chooseTile(this._frequencyHints);
        let removals = [];
        for (let tile of cell.possibleTiles()) {
            if (chosenTile != tile) {
                cell.removeTile(tile);
                removals.push({ pos: [x, y], tile: tile });
            }
        }
        return removals;
    }
    // Propagates the consequences of removing tiles from a cell's possible list.
    // This involves possibly removing other tiles from adjacent cells when they are
    // incompatible with the remaining tiles around them. Those removals are then
    // propagated in turn, until the grid reaches a steady state.
    _propagate(removals) {
        while (removals.length > 0) {
            let { pos: [rx, ry], tile: removedTile } = removals.shift();
            for (let dir of Direction.items) {
                let offset = Direction.toOffset[dir];
                let oppositeDir = Direction.toOpposite[dir];
                let [ax, ay] = [rx + offset[0], ry + offset[1]];
                if (!(ax >= 0 && ay >= 0 && ax < config.outputWidth && ay < config.outputHeight))
                    continue; // out of bounds
                let adjacentCell = this._grid[ay][ax];
                if (adjacentCell.isCollapsed)
                    continue;
                for (let enabledTile of this._adjacencyRules.allowedTiles(removedTile, dir)) {
                    // For every tile that was enabled by the removed tile, decrement its enabler count.
                    // If a count reaches zero, that tile is impossible, so remove it.
                    let enablerCounts = adjacentCell.enablerCountsForTile(enabledTile);
                    let wasZero = enablerCounts.some(count => count <= 0);
                    let isZero = --enablerCounts[oppositeDir] == 0;
                    // Only remove the tile if this is the first direction to reach 0 enablers (otherwise
                    // we've already removed it).
                    if (isZero && !wasZero) {
                        adjacentCell.removeTile(enabledTile, this._frequencyHints);
                        if (adjacentCell.noPossibleTiles) {
                            console.error(`Contradiction at cell ${ax},${ay}. Removed ${enabledTile} after ${removedTile} was removed in cell ${rx},${ry}.`);
                            return false;
                        }
                        removals.push({ pos: [ax, ay], tile: enabledTile });
                        this._entropyHeap.push({ pos: [ax, ay], entropy: adjacentCell.entropy });
                    }
                }
            }
        }
        return true;
    }
}
},{"dat.gui":2,"heap-js":3}],2:[function(require,module,exports){
/**
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.dat = {})));
}(this, (function (exports) { 'use strict';

function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);

  return css;
}

function colorToString (color, forceCSSHex) {
  var colorFormat = color.__state.conversionName.toString();
  var r = Math.round(color.r);
  var g = Math.round(color.g);
  var b = Math.round(color.b);
  var a = color.a;
  var h = Math.round(color.h);
  var s = color.s.toFixed(1);
  var v = color.v.toFixed(1);
  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
    var str = color.hex.toString(16);
    while (str.length < 6) {
      str = '0' + str;
    }
    return '#' + str;
  } else if (colorFormat === 'CSS_RGB') {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  } else if (colorFormat === 'CSS_RGBA') {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  } else if (colorFormat === 'HEX') {
    return '0x' + color.hex.toString(16);
  } else if (colorFormat === 'RGB_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ']';
  } else if (colorFormat === 'RGBA_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
  } else if (colorFormat === 'RGB_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
  } else if (colorFormat === 'RGBA_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
  } else if (colorFormat === 'HSV_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
  } else if (colorFormat === 'HSVA_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
  }
  return 'unknown format';
}

var ARR_EACH = Array.prototype.forEach;
var ARR_SLICE = Array.prototype.slice;
var Common = {
  BREAK: {},
  extend: function extend(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (!this.isUndefined(obj[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  defaults: function defaults(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (this.isUndefined(target[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  compose: function compose() {
    var toCall = ARR_SLICE.call(arguments);
    return function () {
      var args = ARR_SLICE.call(arguments);
      for (var i = toCall.length - 1; i >= 0; i--) {
        args = [toCall[i].apply(this, args)];
      }
      return args[0];
    };
  },
  each: function each(obj, itr, scope) {
    if (!obj) {
      return;
    }
    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
      obj.forEach(itr, scope);
    } else if (obj.length === obj.length + 0) {
      var key = void 0;
      var l = void 0;
      for (key = 0, l = obj.length; key < l; key++) {
        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
          return;
        }
      }
    } else {
      for (var _key in obj) {
        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
          return;
        }
      }
    }
  },
  defer: function defer(fnc) {
    setTimeout(fnc, 0);
  },
  debounce: function debounce(func, threshold, callImmediately) {
    var timeout = void 0;
    return function () {
      var obj = this;
      var args = arguments;
      function delayed() {
        timeout = null;
        if (!callImmediately) func.apply(obj, args);
      }
      var callNow = callImmediately || !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(delayed, threshold);
      if (callNow) {
        func.apply(obj, args);
      }
    };
  },
  toArray: function toArray(obj) {
    if (obj.toArray) return obj.toArray();
    return ARR_SLICE.call(obj);
  },
  isUndefined: function isUndefined(obj) {
    return obj === undefined;
  },
  isNull: function isNull(obj) {
    return obj === null;
  },
  isNaN: function (_isNaN) {
    function isNaN(_x) {
      return _isNaN.apply(this, arguments);
    }
    isNaN.toString = function () {
      return _isNaN.toString();
    };
    return isNaN;
  }(function (obj) {
    return isNaN(obj);
  }),
  isArray: Array.isArray || function (obj) {
    return obj.constructor === Array;
  },
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },
  isNumber: function isNumber(obj) {
    return obj === obj + 0;
  },
  isString: function isString(obj) {
    return obj === obj + '';
  },
  isBoolean: function isBoolean(obj) {
    return obj === false || obj === true;
  },
  isFunction: function isFunction(obj) {
    return obj instanceof Function;
  }
};

var INTERPRETATIONS = [
{
  litmus: Common.isString,
  conversions: {
    THREE_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
        };
      },
      write: colorToString
    },
    SIX_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9]{6})$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString(), 0)
        };
      },
      write: colorToString
    },
    CSS_RGB: {
      read: function read(original) {
        var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3])
        };
      },
      write: colorToString
    },
    CSS_RGBA: {
      read: function read(original) {
        var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3]),
          a: parseFloat(test[4])
        };
      },
      write: colorToString
    }
  }
},
{
  litmus: Common.isNumber,
  conversions: {
    HEX: {
      read: function read(original) {
        return {
          space: 'HEX',
          hex: original,
          conversionName: 'HEX'
        };
      },
      write: function write(color) {
        return color.hex;
      }
    }
  }
},
{
  litmus: Common.isArray,
  conversions: {
    RGB_ARRAY: {
      read: function read(original) {
        if (original.length !== 3) {
          return false;
        }
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b];
      }
    },
    RGBA_ARRAY: {
      read: function read(original) {
        if (original.length !== 4) return false;
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2],
          a: original[3]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b, color.a];
      }
    }
  }
},
{
  litmus: Common.isObject,
  conversions: {
    RGBA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      }
    },
    RGB_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b
        };
      }
    },
    HSVA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v,
          a: color.a
        };
      }
    },
    HSV_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v
        };
      }
    }
  }
}];
var result = void 0;
var toReturn = void 0;
var interpret = function interpret() {
  toReturn = false;
  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
  Common.each(INTERPRETATIONS, function (family) {
    if (family.litmus(original)) {
      Common.each(family.conversions, function (conversion, conversionName) {
        result = conversion.read(original);
        if (toReturn === false && result !== false) {
          toReturn = result;
          result.conversionName = conversionName;
          result.conversion = conversion;
          return Common.BREAK;
        }
      });
      return Common.BREAK;
    }
  });
  return toReturn;
};

var tmpComponent = void 0;
var ColorMath = {
  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
    var hi = Math.floor(h / 60) % 6;
    var f = h / 60 - Math.floor(h / 60);
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
    return {
      r: c[0] * 255,
      g: c[1] * 255,
      b: c[2] * 255
    };
  },
  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var delta = max - min;
    var h = void 0;
    var s = void 0;
    if (max !== 0) {
      s = delta / max;
    } else {
      return {
        h: NaN,
        s: 0,
        v: 0
      };
    }
    if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h /= 6;
    if (h < 0) {
      h += 1;
    }
    return {
      h: h * 360,
      s: s,
      v: max / 255
    };
  },
  rgb_to_hex: function rgb_to_hex(r, g, b) {
    var hex = this.hex_with_component(0, 2, r);
    hex = this.hex_with_component(hex, 1, g);
    hex = this.hex_with_component(hex, 0, b);
    return hex;
  },
  component_from_hex: function component_from_hex(hex, componentIndex) {
    return hex >> componentIndex * 8 & 0xFF;
  },
  hex_with_component: function hex_with_component(hex, componentIndex, value) {
    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
  }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Color = function () {
  function Color() {
    classCallCheck(this, Color);
    this.__state = interpret.apply(this, arguments);
    if (this.__state === false) {
      throw new Error('Failed to interpret color arguments');
    }
    this.__state.a = this.__state.a || 1;
  }
  createClass(Color, [{
    key: 'toString',
    value: function toString() {
      return colorToString(this);
    }
  }, {
    key: 'toHexString',
    value: function toHexString() {
      return colorToString(this, true);
    }
  }, {
    key: 'toOriginal',
    value: function toOriginal() {
      return this.__state.conversion.write(this);
    }
  }]);
  return Color;
}();
function defineRGBComponent(target, component, componentHexIndex) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'RGB') {
        return this.__state[component];
      }
      Color.recalculateRGB(this, component, componentHexIndex);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'RGB') {
        Color.recalculateRGB(this, component, componentHexIndex);
        this.__state.space = 'RGB';
      }
      this.__state[component] = v;
    }
  });
}
function defineHSVComponent(target, component) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'HSV') {
        return this.__state[component];
      }
      Color.recalculateHSV(this);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'HSV') {
        Color.recalculateHSV(this);
        this.__state.space = 'HSV';
      }
      this.__state[component] = v;
    }
  });
}
Color.recalculateRGB = function (color, component, componentHexIndex) {
  if (color.__state.space === 'HEX') {
    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
  } else if (color.__state.space === 'HSV') {
    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
  } else {
    throw new Error('Corrupted color state');
  }
};
Color.recalculateHSV = function (color) {
  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
  Common.extend(color.__state, {
    s: result.s,
    v: result.v
  });
  if (!Common.isNaN(result.h)) {
    color.__state.h = result.h;
  } else if (Common.isUndefined(color.__state.h)) {
    color.__state.h = 0;
  }
};
Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
defineRGBComponent(Color.prototype, 'r', 2);
defineRGBComponent(Color.prototype, 'g', 1);
defineRGBComponent(Color.prototype, 'b', 0);
defineHSVComponent(Color.prototype, 'h');
defineHSVComponent(Color.prototype, 's');
defineHSVComponent(Color.prototype, 'v');
Object.defineProperty(Color.prototype, 'a', {
  get: function get$$1() {
    return this.__state.a;
  },
  set: function set$$1(v) {
    this.__state.a = v;
  }
});
Object.defineProperty(Color.prototype, 'hex', {
  get: function get$$1() {
    if (this.__state.space !== 'HEX') {
      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
      this.__state.space = 'HEX';
    }
    return this.__state.hex;
  },
  set: function set$$1(v) {
    this.__state.space = 'HEX';
    this.__state.hex = v;
  }
});

var Controller = function () {
  function Controller(object, property) {
    classCallCheck(this, Controller);
    this.initialValue = object[property];
    this.domElement = document.createElement('div');
    this.object = object;
    this.property = property;
    this.__onChange = undefined;
    this.__onFinishChange = undefined;
  }
  createClass(Controller, [{
    key: 'onChange',
    value: function onChange(fnc) {
      this.__onChange = fnc;
      return this;
    }
  }, {
    key: 'onFinishChange',
    value: function onFinishChange(fnc) {
      this.__onFinishChange = fnc;
      return this;
    }
  }, {
    key: 'setValue',
    value: function setValue(newValue) {
      this.object[this.property] = newValue;
      if (this.__onChange) {
        this.__onChange.call(this, newValue);
      }
      this.updateDisplay();
      return this;
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return this.object[this.property];
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      return this;
    }
  }, {
    key: 'isModified',
    value: function isModified() {
      return this.initialValue !== this.getValue();
    }
  }]);
  return Controller;
}();

var EVENT_MAP = {
  HTMLEvents: ['change'],
  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
  KeyboardEvents: ['keydown']
};
var EVENT_MAP_INV = {};
Common.each(EVENT_MAP, function (v, k) {
  Common.each(v, function (e) {
    EVENT_MAP_INV[e] = k;
  });
});
var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
function cssValueToPixels(val) {
  if (val === '0' || Common.isUndefined(val)) {
    return 0;
  }
  var match = val.match(CSS_VALUE_PIXELS);
  if (!Common.isNull(match)) {
    return parseFloat(match[1]);
  }
  return 0;
}
var dom = {
  makeSelectable: function makeSelectable(elem, selectable) {
    if (elem === undefined || elem.style === undefined) return;
    elem.onselectstart = selectable ? function () {
      return false;
    } : function () {};
    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
    elem.unselectable = selectable ? 'on' : 'off';
  },
  makeFullscreen: function makeFullscreen(elem, hor, vert) {
    var vertical = vert;
    var horizontal = hor;
    if (Common.isUndefined(horizontal)) {
      horizontal = true;
    }
    if (Common.isUndefined(vertical)) {
      vertical = true;
    }
    elem.style.position = 'absolute';
    if (horizontal) {
      elem.style.left = 0;
      elem.style.right = 0;
    }
    if (vertical) {
      elem.style.top = 0;
      elem.style.bottom = 0;
    }
  },
  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
    var params = pars || {};
    var className = EVENT_MAP_INV[eventType];
    if (!className) {
      throw new Error('Event type ' + eventType + ' not supported.');
    }
    var evt = document.createEvent(className);
    switch (className) {
      case 'MouseEvents':
        {
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0,
          0,
          clientX,
          clientY,
          false, false, false, false, 0, null);
          break;
        }
      case 'KeyboardEvents':
        {
          var init = evt.initKeyboardEvent || evt.initKeyEvent;
          Common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
          break;
        }
      default:
        {
          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
          break;
        }
    }
    Common.defaults(evt, aux);
    elem.dispatchEvent(evt);
  },
  bind: function bind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.addEventListener) {
      elem.addEventListener(event, func, bool);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + event, func);
    }
    return dom;
  },
  unbind: function unbind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.removeEventListener) {
      elem.removeEventListener(event, func, bool);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + event, func);
    }
    return dom;
  },
  addClass: function addClass(elem, className) {
    if (elem.className === undefined) {
      elem.className = className;
    } else if (elem.className !== className) {
      var classes = elem.className.split(/ +/);
      if (classes.indexOf(className) === -1) {
        classes.push(className);
        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
      }
    }
    return dom;
  },
  removeClass: function removeClass(elem, className) {
    if (className) {
      if (elem.className === className) {
        elem.removeAttribute('class');
      } else {
        var classes = elem.className.split(/ +/);
        var index = classes.indexOf(className);
        if (index !== -1) {
          classes.splice(index, 1);
          elem.className = classes.join(' ');
        }
      }
    } else {
      elem.className = undefined;
    }
    return dom;
  },
  hasClass: function hasClass(elem, className) {
    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
  },
  getWidth: function getWidth(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
  },
  getHeight: function getHeight(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
  },
  getOffset: function getOffset(el) {
    var elem = el;
    var offset = { left: 0, top: 0 };
    if (elem.offsetParent) {
      do {
        offset.left += elem.offsetLeft;
        offset.top += elem.offsetTop;
        elem = elem.offsetParent;
      } while (elem);
    }
    return offset;
  },
  isActive: function isActive(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  }
};

var BooleanController = function (_Controller) {
  inherits(BooleanController, _Controller);
  function BooleanController(object, property) {
    classCallCheck(this, BooleanController);
    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));
    var _this = _this2;
    _this2.__prev = _this2.getValue();
    _this2.__checkbox = document.createElement('input');
    _this2.__checkbox.setAttribute('type', 'checkbox');
    function onChange() {
      _this.setValue(!_this.__prev);
    }
    dom.bind(_this2.__checkbox, 'change', onChange, false);
    _this2.domElement.appendChild(_this2.__checkbox);
    _this2.updateDisplay();
    return _this2;
  }
  createClass(BooleanController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      this.__prev = this.getValue();
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (this.getValue() === true) {
        this.__checkbox.setAttribute('checked', 'checked');
        this.__checkbox.checked = true;
        this.__prev = true;
      } else {
        this.__checkbox.checked = false;
        this.__prev = false;
      }
      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return BooleanController;
}(Controller);

var OptionController = function (_Controller) {
  inherits(OptionController, _Controller);
  function OptionController(object, property, opts) {
    classCallCheck(this, OptionController);
    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));
    var options = opts;
    var _this = _this2;
    _this2.__select = document.createElement('select');
    if (Common.isArray(options)) {
      var map = {};
      Common.each(options, function (element) {
        map[element] = element;
      });
      options = map;
    }
    Common.each(options, function (value, key) {
      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);
      _this.__select.appendChild(opt);
    });
    _this2.updateDisplay();
    dom.bind(_this2.__select, 'change', function () {
      var desiredValue = this.options[this.selectedIndex].value;
      _this.setValue(desiredValue);
    });
    _this2.domElement.appendChild(_this2.__select);
    return _this2;
  }
  createClass(OptionController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (dom.isActive(this.__select)) return this;
      this.__select.value = this.getValue();
      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return OptionController;
}(Controller);

var StringController = function (_Controller) {
  inherits(StringController, _Controller);
  function StringController(object, property) {
    classCallCheck(this, StringController);
    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));
    var _this = _this2;
    function onChange() {
      _this.setValue(_this.__input.value);
    }
    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'keyup', onChange);
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(StringController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (!dom.isActive(this.__input)) {
        this.__input.value = this.getValue();
      }
      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return StringController;
}(Controller);

function numDecimals(x) {
  var _x = x.toString();
  if (_x.indexOf('.') > -1) {
    return _x.length - _x.indexOf('.') - 1;
  }
  return 0;
}
var NumberController = function (_Controller) {
  inherits(NumberController, _Controller);
  function NumberController(object, property, params) {
    classCallCheck(this, NumberController);
    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));
    var _params = params || {};
    _this.__min = _params.min;
    _this.__max = _params.max;
    _this.__step = _params.step;
    if (Common.isUndefined(_this.__step)) {
      if (_this.initialValue === 0) {
        _this.__impliedStep = 1;
      } else {
        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
      }
    } else {
      _this.__impliedStep = _this.__step;
    }
    _this.__precision = numDecimals(_this.__impliedStep);
    return _this;
  }
  createClass(NumberController, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;
      if (this.__min !== undefined && _v < this.__min) {
        _v = this.__min;
      } else if (this.__max !== undefined && _v > this.__max) {
        _v = this.__max;
      }
      if (this.__step !== undefined && _v % this.__step !== 0) {
        _v = Math.round(_v / this.__step) * this.__step;
      }
      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
    }
  }, {
    key: 'min',
    value: function min(minValue) {
      this.__min = minValue;
      return this;
    }
  }, {
    key: 'max',
    value: function max(maxValue) {
      this.__max = maxValue;
      return this;
    }
  }, {
    key: 'step',
    value: function step(stepValue) {
      this.__step = stepValue;
      this.__impliedStep = stepValue;
      this.__precision = numDecimals(stepValue);
      return this;
    }
  }]);
  return NumberController;
}(Controller);

function roundToDecimal(value, decimals) {
  var tenTo = Math.pow(10, decimals);
  return Math.round(value * tenTo) / tenTo;
}
var NumberControllerBox = function (_NumberController) {
  inherits(NumberControllerBox, _NumberController);
  function NumberControllerBox(object, property, params) {
    classCallCheck(this, NumberControllerBox);
    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));
    _this2.__truncationSuspended = false;
    var _this = _this2;
    var prevY = void 0;
    function onChange() {
      var attempted = parseFloat(_this.__input.value);
      if (!Common.isNaN(attempted)) {
        _this.setValue(attempted);
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onBlur() {
      onFinish();
    }
    function onMouseDrag(e) {
      var diff = prevY - e.clientY;
      _this.setValue(_this.getValue() + diff * _this.__impliedStep);
      prevY = e.clientY;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      onFinish();
    }
    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prevY = e.clientY;
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'mousedown', onMouseDown);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
        onFinish();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(NumberControllerBox, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerBox;
}(NumberController);

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}
var NumberControllerSlider = function (_NumberController) {
  inherits(NumberControllerSlider, _NumberController);
  function NumberControllerSlider(object, property, min, max, step) {
    classCallCheck(this, NumberControllerSlider);
    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, { min: min, max: max, step: step }));
    var _this = _this2;
    _this2.__background = document.createElement('div');
    _this2.__foreground = document.createElement('div');
    dom.bind(_this2.__background, 'mousedown', onMouseDown);
    dom.bind(_this2.__background, 'touchstart', onTouchStart);
    dom.addClass(_this2.__background, 'slider');
    dom.addClass(_this2.__foreground, 'slider-fg');
    function onMouseDown(e) {
      document.activeElement.blur();
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      onMouseDrag(e);
    }
    function onMouseDrag(e) {
      e.preventDefault();
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      return false;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onTouchStart(e) {
      if (e.touches.length !== 1) {
        return;
      }
      dom.bind(window, 'touchmove', onTouchMove);
      dom.bind(window, 'touchend', onTouchEnd);
      onTouchMove(e);
    }
    function onTouchMove(e) {
      var clientX = e.touches[0].clientX;
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
    }
    function onTouchEnd() {
      dom.unbind(window, 'touchmove', onTouchMove);
      dom.unbind(window, 'touchend', onTouchEnd);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.updateDisplay();
    _this2.__background.appendChild(_this2.__foreground);
    _this2.domElement.appendChild(_this2.__background);
    return _this2;
  }
  createClass(NumberControllerSlider, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
      this.__foreground.style.width = pct * 100 + '%';
      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerSlider;
}(NumberController);

var FunctionController = function (_Controller) {
  inherits(FunctionController, _Controller);
  function FunctionController(object, property, text) {
    classCallCheck(this, FunctionController);
    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));
    var _this = _this2;
    _this2.__button = document.createElement('div');
    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(_this2.__button, 'click', function (e) {
      e.preventDefault();
      _this.fire();
      return false;
    });
    dom.addClass(_this2.__button, 'button');
    _this2.domElement.appendChild(_this2.__button);
    return _this2;
  }
  createClass(FunctionController, [{
    key: 'fire',
    value: function fire() {
      if (this.__onChange) {
        this.__onChange.call(this);
      }
      this.getValue().call(this.object);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
    }
  }]);
  return FunctionController;
}(Controller);

var ColorController = function (_Controller) {
  inherits(ColorController, _Controller);
  function ColorController(object, property) {
    classCallCheck(this, ColorController);
    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));
    _this2.__color = new Color(_this2.getValue());
    _this2.__temp = new Color(0);
    var _this = _this2;
    _this2.domElement = document.createElement('div');
    dom.makeSelectable(_this2.domElement, false);
    _this2.__selector = document.createElement('div');
    _this2.__selector.className = 'selector';
    _this2.__saturation_field = document.createElement('div');
    _this2.__saturation_field.className = 'saturation-field';
    _this2.__field_knob = document.createElement('div');
    _this2.__field_knob.className = 'field-knob';
    _this2.__field_knob_border = '2px solid ';
    _this2.__hue_knob = document.createElement('div');
    _this2.__hue_knob.className = 'hue-knob';
    _this2.__hue_field = document.createElement('div');
    _this2.__hue_field.className = 'hue-field';
    _this2.__input = document.createElement('input');
    _this2.__input.type = 'text';
    _this2.__input_textShadow = '0 1px 1px ';
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        onBlur.call(this);
      }
    });
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__selector, 'mousedown', function ()        {
      dom.addClass(this, 'drag').bind(window, 'mouseup', function ()        {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    dom.bind(_this2.__selector, 'touchstart', function ()        {
      dom.addClass(this, 'drag').bind(window, 'touchend', function ()        {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    var valueField = document.createElement('div');
    Common.extend(_this2.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });
    Common.extend(_this2.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });
    Common.extend(_this2.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });
    Common.extend(_this2.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });
    Common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });
    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
    Common.extend(_this2.__hue_field.style, {
      width: '15px',
      height: '100px',
      border: '1px solid #555',
      cursor: 'ns-resize',
      position: 'absolute',
      top: '3px',
      right: '3px'
    });
    hueGradient(_this2.__hue_field);
    Common.extend(_this2.__input.style, {
      outline: 'none',
      textAlign: 'center',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
    });
    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);
    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }
    function fieldDownH(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'touchmove', setH);
      dom.bind(window, 'mouseup', fieldUpH);
      dom.bind(window, 'touchend', fieldUpH);
    }
    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }
    function fieldUpH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'touchmove', setH);
      dom.unbind(window, 'mouseup', fieldUpH);
      dom.unbind(window, 'touchend', fieldUpH);
      onFinish();
    }
    function onBlur() {
      var i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
      }
    }
    _this2.__saturation_field.appendChild(valueField);
    _this2.__selector.appendChild(_this2.__field_knob);
    _this2.__selector.appendChild(_this2.__saturation_field);
    _this2.__selector.appendChild(_this2.__hue_field);
    _this2.__hue_field.appendChild(_this2.__hue_knob);
    _this2.domElement.appendChild(_this2.__input);
    _this2.domElement.appendChild(_this2.__selector);
    _this2.updateDisplay();
    function setSV(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__saturation_field.getBoundingClientRect();
      var _ref = e.touches && e.touches[0] || e,
          clientX = _ref.clientX,
          clientY = _ref.clientY;
      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (v > 1) {
        v = 1;
      } else if (v < 0) {
        v = 0;
      }
      if (s > 1) {
        s = 1;
      } else if (s < 0) {
        s = 0;
      }
      _this.__color.v = v;
      _this.__color.s = s;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    function setH(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__hue_field.getBoundingClientRect();
      var _ref2 = e.touches && e.touches[0] || e,
          clientY = _ref2.clientY;
      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (h > 1) {
        h = 1;
      } else if (h < 0) {
        h = 0;
      }
      _this.__color.h = h * 360;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    return _this2;
  }
  createClass(ColorController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var i = interpret(this.getValue());
      if (i !== false) {
        var mismatch = false;
        Common.each(Color.COMPONENTS, function (component) {
          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
            mismatch = true;
            return {};
          }
        }, this);
        if (mismatch) {
          Common.extend(this.__color.__state, i);
        }
      }
      Common.extend(this.__temp.__state, this.__color.__state);
      this.__temp.a = 1;
      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
      var _flip = 255 - flip;
      Common.extend(this.__field_knob.style, {
        marginLeft: 100 * this.__color.s - 7 + 'px',
        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
        backgroundColor: this.__temp.toHexString(),
        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
      });
      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
      this.__temp.s = 1;
      this.__temp.v = 1;
      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
      this.__input.value = this.__color.toString();
      Common.extend(this.__input.style, {
        backgroundColor: this.__color.toHexString(),
        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
      });
    }
  }]);
  return ColorController;
}(Controller);
var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];
function linearGradient(elem, x, a, b) {
  elem.style.background = '';
  Common.each(vendors, function (vendor) {
    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
  });
}
function hueGradient(elem) {
  elem.style.background = '';
  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
}

var css = {
  load: function load(url, indoc) {
    var doc = indoc || document;
    var link = doc.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    doc.getElementsByTagName('head')[0].appendChild(link);
  },
  inject: function inject(cssContent, indoc) {
    var doc = indoc || document;
    var injected = document.createElement('style');
    injected.type = 'text/css';
    injected.innerHTML = cssContent;
    var head = doc.getElementsByTagName('head')[0];
    try {
      head.appendChild(injected);
    } catch (e) {
    }
  }
};

var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

var ControllerFactory = function ControllerFactory(object, property) {
  var initialValue = object[property];
  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
    return new OptionController(object, property, arguments[2]);
  }
  if (Common.isNumber(initialValue)) {
    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
      }
      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
    }
    if (Common.isNumber(arguments[4])) {
      return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3], step: arguments[4] });
    }
    return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });
  }
  if (Common.isString(initialValue)) {
    return new StringController(object, property);
  }
  if (Common.isFunction(initialValue)) {
    return new FunctionController(object, property, '');
  }
  if (Common.isBoolean(initialValue)) {
    return new BooleanController(object, property);
  }
  return null;
};

function requestAnimationFrame(callback) {
  setTimeout(callback, 1000 / 60);
}
var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

var CenteredDiv = function () {
  function CenteredDiv() {
    classCallCheck(this, CenteredDiv);
    this.backgroundElement = document.createElement('div');
    Common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear',
      transition: 'opacity 0.2s linear'
    });
    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';
    this.domElement = document.createElement('div');
    Common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
    });
    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);
    var _this = this;
    dom.bind(this.backgroundElement, 'click', function () {
      _this.hide();
    });
  }
  createClass(CenteredDiv, [{
    key: 'show',
    value: function show() {
      var _this = this;
      this.backgroundElement.style.display = 'block';
      this.domElement.style.display = 'block';
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
      this.layout();
      Common.defer(function () {
        _this.backgroundElement.style.opacity = 1;
        _this.domElement.style.opacity = 1;
        _this.domElement.style.webkitTransform = 'scale(1)';
      });
    }
  }, {
    key: 'hide',
    value: function hide() {
      var _this = this;
      var hide = function hide() {
        _this.domElement.style.display = 'none';
        _this.backgroundElement.style.display = 'none';
        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
        dom.unbind(_this.domElement, 'transitionend', hide);
        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
      };
      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
      dom.bind(this.domElement, 'transitionend', hide);
      dom.bind(this.domElement, 'oTransitionEnd', hide);
      this.backgroundElement.style.opacity = 0;
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
    }
  }, {
    key: 'layout',
    value: function layout() {
      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
    }
  }]);
  return CenteredDiv;
}();

var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

css.inject(styleSheet);
var CSS_NAMESPACE = 'dg';
var HIDE_KEY_CODE = 72;
var CLOSE_BUTTON_HEIGHT = 20;
var DEFAULT_DEFAULT_PRESET_NAME = 'Default';
var SUPPORTS_LOCAL_STORAGE = function () {
  try {
    return !!window.localStorage;
  } catch (e) {
    return false;
  }
}();
var SAVE_DIALOGUE = void 0;
var autoPlaceVirgin = true;
var autoPlaceContainer = void 0;
var hide = false;
var hideableGuis = [];
var GUI = function GUI(pars) {
  var _this = this;
  var params = pars || {};
  this.domElement = document.createElement('div');
  this.__ul = document.createElement('ul');
  this.domElement.appendChild(this.__ul);
  dom.addClass(this.domElement, CSS_NAMESPACE);
  this.__folders = {};
  this.__controllers = [];
  this.__rememberedObjects = [];
  this.__rememberedObjectIndecesToControllers = [];
  this.__listening = [];
  params = Common.defaults(params, {
    closeOnTop: false,
    autoPlace: true,
    width: GUI.DEFAULT_WIDTH
  });
  params = Common.defaults(params, {
    resizable: params.autoPlace,
    hideable: params.autoPlace
  });
  if (!Common.isUndefined(params.load)) {
    if (params.preset) {
      params.load.preset = params.preset;
    }
  } else {
    params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };
  }
  if (Common.isUndefined(params.parent) && params.hideable) {
    hideableGuis.push(this);
  }
  params.resizable = Common.isUndefined(params.parent) && params.resizable;
  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
    params.scrollable = true;
  }
  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
  var saveToLocalStorage = void 0;
  var titleRow = void 0;
  Object.defineProperties(this,
  {
    parent: {
      get: function get$$1() {
        return params.parent;
      }
    },
    scrollable: {
      get: function get$$1() {
        return params.scrollable;
      }
    },
    autoPlace: {
      get: function get$$1() {
        return params.autoPlace;
      }
    },
    closeOnTop: {
      get: function get$$1() {
        return params.closeOnTop;
      }
    },
    preset: {
      get: function get$$1() {
        if (_this.parent) {
          return _this.getRoot().preset;
        }
        return params.load.preset;
      },
      set: function set$$1(v) {
        if (_this.parent) {
          _this.getRoot().preset = v;
        } else {
          params.load.preset = v;
        }
        setPresetSelectIndex(this);
        _this.revert();
      }
    },
    width: {
      get: function get$$1() {
        return params.width;
      },
      set: function set$$1(v) {
        params.width = v;
        setWidth(_this, v);
      }
    },
    name: {
      get: function get$$1() {
        return params.name;
      },
      set: function set$$1(v) {
        params.name = v;
        if (titleRow) {
          titleRow.innerHTML = params.name;
        }
      }
    },
    closed: {
      get: function get$$1() {
        return params.closed;
      },
      set: function set$$1(v) {
        params.closed = v;
        if (params.closed) {
          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
        } else {
          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
        }
        this.onResize();
        if (_this.__closeButton) {
          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
        }
      }
    },
    load: {
      get: function get$$1() {
        return params.load;
      }
    },
    useLocalStorage: {
      get: function get$$1() {
        return useLocalStorage;
      },
      set: function set$$1(bool) {
        if (SUPPORTS_LOCAL_STORAGE) {
          useLocalStorage = bool;
          if (bool) {
            dom.bind(window, 'unload', saveToLocalStorage);
          } else {
            dom.unbind(window, 'unload', saveToLocalStorage);
          }
          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
        }
      }
    }
  });
  if (Common.isUndefined(params.parent)) {
    this.closed = params.closed || false;
    dom.addClass(this.domElement, GUI.CLASS_MAIN);
    dom.makeSelectable(this.domElement, false);
    if (SUPPORTS_LOCAL_STORAGE) {
      if (useLocalStorage) {
        _this.useLocalStorage = true;
        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));
        if (savedGui) {
          params.load = JSON.parse(savedGui);
        }
      }
    }
    this.__closeButton = document.createElement('div');
    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
    if (params.closeOnTop) {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
    } else {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
      this.domElement.appendChild(this.__closeButton);
    }
    dom.bind(this.__closeButton, 'click', function () {
      _this.closed = !_this.closed;
    });
  } else {
    if (params.closed === undefined) {
      params.closed = true;
    }
    var titleRowName = document.createTextNode(params.name);
    dom.addClass(titleRowName, 'controller-name');
    titleRow = addRow(_this, titleRowName);
    var onClickTitle = function onClickTitle(e) {
      e.preventDefault();
      _this.closed = !_this.closed;
      return false;
    };
    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
    dom.addClass(titleRow, 'title');
    dom.bind(titleRow, 'click', onClickTitle);
    if (!params.closed) {
      this.closed = false;
    }
  }
  if (params.autoPlace) {
    if (Common.isUndefined(params.parent)) {
      if (autoPlaceVirgin) {
        autoPlaceContainer = document.createElement('div');
        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
        document.body.appendChild(autoPlaceContainer);
        autoPlaceVirgin = false;
      }
      autoPlaceContainer.appendChild(this.domElement);
      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
    }
    if (!this.parent) {
      setWidth(_this, params.width);
    }
  }
  this.__resizeHandler = function () {
    _this.onResizeDebounced();
  };
  dom.bind(window, 'resize', this.__resizeHandler);
  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
  this.onResize();
  if (params.resizable) {
    addResizeHandle(this);
  }
  saveToLocalStorage = function saveToLocalStorage() {
    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }
  };
  this.saveToLocalStorageIfPossible = saveToLocalStorage;
  function resetWidth() {
    var root = _this.getRoot();
    root.width += 1;
    Common.defer(function () {
      root.width -= 1;
    });
  }
  if (!params.parent) {
    resetWidth();
  }
};
GUI.toggleHide = function () {
  hide = !hide;
  Common.each(hideableGuis, function (gui) {
    gui.domElement.style.display = hide ? 'none' : '';
  });
};
GUI.CLASS_AUTO_PLACE = 'a';
GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
GUI.CLASS_MAIN = 'main';
GUI.CLASS_CONTROLLER_ROW = 'cr';
GUI.CLASS_TOO_TALL = 'taller-than-window';
GUI.CLASS_CLOSED = 'closed';
GUI.CLASS_CLOSE_BUTTON = 'close-button';
GUI.CLASS_CLOSE_TOP = 'close-top';
GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
GUI.CLASS_DRAG = 'drag';
GUI.DEFAULT_WIDTH = 245;
GUI.TEXT_CLOSED = 'Close Controls';
GUI.TEXT_OPEN = 'Open Controls';
GUI._keydownHandler = function (e) {
  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
    GUI.toggleHide();
  }
};
dom.bind(window, 'keydown', GUI._keydownHandler, false);
Common.extend(GUI.prototype,
{
  add: function add(object, property) {
    return _add(this, object, property, {
      factoryArgs: Array.prototype.slice.call(arguments, 2)
    });
  },
  addColor: function addColor(object, property) {
    return _add(this, object, property, {
      color: true
    });
  },
  remove: function remove(controller) {
    this.__ul.removeChild(controller.__li);
    this.__controllers.splice(this.__controllers.indexOf(controller), 1);
    var _this = this;
    Common.defer(function () {
      _this.onResize();
    });
  },
  destroy: function destroy() {
    if (this.parent) {
      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
    }
    if (this.autoPlace) {
      autoPlaceContainer.removeChild(this.domElement);
    }
    var _this = this;
    Common.each(this.__folders, function (subfolder) {
      _this.removeFolder(subfolder);
    });
    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
    removeListeners(this);
  },
  addFolder: function addFolder(name) {
    if (this.__folders[name] !== undefined) {
      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
    }
    var newGuiParams = { name: name, parent: this };
    newGuiParams.autoPlace = this.autoPlace;
    if (this.load &&
    this.load.folders &&
    this.load.folders[name]) {
      newGuiParams.closed = this.load.folders[name].closed;
      newGuiParams.load = this.load.folders[name];
    }
    var gui = new GUI(newGuiParams);
    this.__folders[name] = gui;
    var li = addRow(this, gui.domElement);
    dom.addClass(li, 'folder');
    return gui;
  },
  removeFolder: function removeFolder(folder) {
    this.__ul.removeChild(folder.domElement.parentElement);
    delete this.__folders[folder.name];
    if (this.load &&
    this.load.folders &&
    this.load.folders[folder.name]) {
      delete this.load.folders[folder.name];
    }
    removeListeners(folder);
    var _this = this;
    Common.each(folder.__folders, function (subfolder) {
      folder.removeFolder(subfolder);
    });
    Common.defer(function () {
      _this.onResize();
    });
  },
  open: function open() {
    this.closed = false;
  },
  close: function close() {
    this.closed = true;
  },
  hide: function hide() {
    this.domElement.style.display = 'none';
  },
  show: function show() {
    this.domElement.style.display = '';
  },
  onResize: function onResize() {
    var root = this.getRoot();
    if (root.scrollable) {
      var top = dom.getOffset(root.__ul).top;
      var h = 0;
      Common.each(root.__ul.childNodes, function (node) {
        if (!(root.autoPlace && node === root.__save_row)) {
          h += dom.getHeight(node);
        }
      });
      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
      } else {
        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = 'auto';
      }
    }
    if (root.__resize_handle) {
      Common.defer(function () {
        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
      });
    }
    if (root.__closeButton) {
      root.__closeButton.style.width = root.width + 'px';
    }
  },
  onResizeDebounced: Common.debounce(function () {
    this.onResize();
  }, 50),
  remember: function remember() {
    if (Common.isUndefined(SAVE_DIALOGUE)) {
      SAVE_DIALOGUE = new CenteredDiv();
      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
    }
    if (this.parent) {
      throw new Error('You can only call remember on a top level GUI.');
    }
    var _this = this;
    Common.each(Array.prototype.slice.call(arguments), function (object) {
      if (_this.__rememberedObjects.length === 0) {
        addSaveMenu(_this);
      }
      if (_this.__rememberedObjects.indexOf(object) === -1) {
        _this.__rememberedObjects.push(object);
      }
    });
    if (this.autoPlace) {
      setWidth(this, this.width);
    }
  },
  getRoot: function getRoot() {
    var gui = this;
    while (gui.parent) {
      gui = gui.parent;
    }
    return gui;
  },
  getSaveObject: function getSaveObject() {
    var toReturn = this.load;
    toReturn.closed = this.closed;
    if (this.__rememberedObjects.length > 0) {
      toReturn.preset = this.preset;
      if (!toReturn.remembered) {
        toReturn.remembered = {};
      }
      toReturn.remembered[this.preset] = getCurrentPreset(this);
    }
    toReturn.folders = {};
    Common.each(this.__folders, function (element, key) {
      toReturn.folders[key] = element.getSaveObject();
    });
    return toReturn;
  },
  save: function save() {
    if (!this.load.remembered) {
      this.load.remembered = {};
    }
    this.load.remembered[this.preset] = getCurrentPreset(this);
    markPresetModified(this, false);
    this.saveToLocalStorageIfPossible();
  },
  saveAs: function saveAs(presetName) {
    if (!this.load.remembered) {
      this.load.remembered = {};
      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
    }
    this.load.remembered[presetName] = getCurrentPreset(this);
    this.preset = presetName;
    addPresetOption(this, presetName, true);
    this.saveToLocalStorageIfPossible();
  },
  revert: function revert(gui) {
    Common.each(this.__controllers, function (controller) {
      if (!this.getRoot().load.remembered) {
        controller.setValue(controller.initialValue);
      } else {
        recallSavedValue(gui || this.getRoot(), controller);
      }
      if (controller.__onFinishChange) {
        controller.__onFinishChange.call(controller, controller.getValue());
      }
    }, this);
    Common.each(this.__folders, function (folder) {
      folder.revert(folder);
    });
    if (!gui) {
      markPresetModified(this.getRoot(), false);
    }
  },
  listen: function listen(controller) {
    var init = this.__listening.length === 0;
    this.__listening.push(controller);
    if (init) {
      updateDisplays(this.__listening);
    }
  },
  updateDisplay: function updateDisplay() {
    Common.each(this.__controllers, function (controller) {
      controller.updateDisplay();
    });
    Common.each(this.__folders, function (folder) {
      folder.updateDisplay();
    });
  }
});
function addRow(gui, newDom, liBefore) {
  var li = document.createElement('li');
  if (newDom) {
    li.appendChild(newDom);
  }
  if (liBefore) {
    gui.__ul.insertBefore(li, liBefore);
  } else {
    gui.__ul.appendChild(li);
  }
  gui.onResize();
  return li;
}
function removeListeners(gui) {
  dom.unbind(window, 'resize', gui.__resizeHandler);
  if (gui.saveToLocalStorageIfPossible) {
    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
  }
}
function markPresetModified(gui, modified) {
  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
  if (modified) {
    opt.innerHTML = opt.value + '*';
  } else {
    opt.innerHTML = opt.value;
  }
}
function augmentController(gui, li, controller) {
  controller.__li = li;
  controller.__gui = gui;
  Common.extend(controller,                                   {
    options: function options(_options) {
      if (arguments.length > 1) {
        var nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: nextSibling,
          factoryArgs: [Common.toArray(arguments)]
        });
      }
      if (Common.isArray(_options) || Common.isObject(_options)) {
        var _nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: _nextSibling,
          factoryArgs: [_options]
        });
      }
    },
    name: function name(_name) {
      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
      return controller;
    },
    listen: function listen() {
      controller.__gui.listen(controller);
      return controller;
    },
    remove: function remove() {
      controller.__gui.remove(controller);
      return controller;
    }
  });
  if (controller instanceof NumberControllerSlider) {
    var box = new NumberControllerBox(controller.object, controller.property, { min: controller.__min, max: controller.__max, step: controller.__step });
    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
      var pc = controller[method];
      var pb = box[method];
      controller[method] = box[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        pb.apply(box, args);
        return pc.apply(controller, args);
      };
    });
    dom.addClass(li, 'has-slider');
    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
  } else if (controller instanceof NumberControllerBox) {
    var r = function r(returned) {
      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
        controller.remove();
        var newController = _add(gui, controller.object, controller.property, {
          before: controller.__li.nextElementSibling,
          factoryArgs: [controller.__min, controller.__max, controller.__step]
        });
        newController.name(oldName);
        if (wasListening) newController.listen();
        return newController;
      }
      return returned;
    };
    controller.min = Common.compose(r, controller.min);
    controller.max = Common.compose(r, controller.max);
  } else if (controller instanceof BooleanController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__checkbox, 'click');
    });
    dom.bind(controller.__checkbox, 'click', function (e) {
      e.stopPropagation();
    });
  } else if (controller instanceof FunctionController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__button, 'click');
    });
    dom.bind(li, 'mouseover', function () {
      dom.addClass(controller.__button, 'hover');
    });
    dom.bind(li, 'mouseout', function () {
      dom.removeClass(controller.__button, 'hover');
    });
  } else if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
    controller.updateDisplay = Common.compose(function (val) {
      li.style.borderLeftColor = controller.__color.toString();
      return val;
    }, controller.updateDisplay);
    controller.updateDisplay();
  }
  controller.setValue = Common.compose(function (val) {
    if (gui.getRoot().__preset_select && controller.isModified()) {
      markPresetModified(gui.getRoot(), true);
    }
    return val;
  }, controller.setValue);
}
function recallSavedValue(gui, controller) {
  var root = gui.getRoot();
  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
  if (matchedIndex !== -1) {
    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
    if (controllerMap === undefined) {
      controllerMap = {};
      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
    }
    controllerMap[controller.property] = controller;
    if (root.load && root.load.remembered) {
      var presetMap = root.load.remembered;
      var preset = void 0;
      if (presetMap[gui.preset]) {
        preset = presetMap[gui.preset];
      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
      } else {
        return;
      }
      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
        var value = preset[matchedIndex][controller.property];
        controller.initialValue = value;
        controller.setValue(value);
      }
    }
  }
}
function _add(gui, object, property, params) {
  if (object[property] === undefined) {
    throw new Error('Object "' + object + '" has no property "' + property + '"');
  }
  var controller = void 0;
  if (params.color) {
    controller = new ColorController(object, property);
  } else {
    var factoryArgs = [object, property].concat(params.factoryArgs);
    controller = ControllerFactory.apply(gui, factoryArgs);
  }
  if (params.before instanceof Controller) {
    params.before = params.before.__li;
  }
  recallSavedValue(gui, controller);
  dom.addClass(controller.domElement, 'c');
  var name = document.createElement('span');
  dom.addClass(name, 'property-name');
  name.innerHTML = controller.property;
  var container = document.createElement('div');
  container.appendChild(name);
  container.appendChild(controller.domElement);
  var li = addRow(gui, container, params.before);
  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
  if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
  } else {
    dom.addClass(li, _typeof(controller.getValue()));
  }
  augmentController(gui, li, controller);
  gui.__controllers.push(controller);
  return controller;
}
function getLocalStorageHash(gui, key) {
  return document.location.href + '.' + key;
}
function addPresetOption(gui, name, setSelected) {
  var opt = document.createElement('option');
  opt.innerHTML = name;
  opt.value = name;
  gui.__preset_select.appendChild(opt);
  if (setSelected) {
    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
  }
}
function showHideExplain(gui, explain) {
  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
}
function addSaveMenu(gui) {
  var div = gui.__save_row = document.createElement('li');
  dom.addClass(gui.domElement, 'has-save');
  gui.__ul.insertBefore(div, gui.__ul.firstChild);
  dom.addClass(div, 'save-row');
  var gears = document.createElement('span');
  gears.innerHTML = '&nbsp;';
  dom.addClass(gears, 'button gears');
  var button = document.createElement('span');
  button.innerHTML = 'Save';
  dom.addClass(button, 'button');
  dom.addClass(button, 'save');
  var button2 = document.createElement('span');
  button2.innerHTML = 'New';
  dom.addClass(button2, 'button');
  dom.addClass(button2, 'save-as');
  var button3 = document.createElement('span');
  button3.innerHTML = 'Revert';
  dom.addClass(button3, 'button');
  dom.addClass(button3, 'revert');
  var select = gui.__preset_select = document.createElement('select');
  if (gui.load && gui.load.remembered) {
    Common.each(gui.load.remembered, function (value, key) {
      addPresetOption(gui, key, key === gui.preset);
    });
  } else {
    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
  }
  dom.bind(select, 'change', function () {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
    }
    gui.preset = this.value;
  });
  div.appendChild(select);
  div.appendChild(gears);
  div.appendChild(button);
  div.appendChild(button2);
  div.appendChild(button3);
  if (SUPPORTS_LOCAL_STORAGE) {
    var explain = document.getElementById('dg-local-explain');
    var localStorageCheckBox = document.getElementById('dg-local-storage');
    var saveLocally = document.getElementById('dg-save-locally');
    saveLocally.style.display = 'block';
    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
      localStorageCheckBox.setAttribute('checked', 'checked');
    }
    showHideExplain(gui, explain);
    dom.bind(localStorageCheckBox, 'change', function () {
      gui.useLocalStorage = !gui.useLocalStorage;
      showHideExplain(gui, explain);
    });
  }
  var newConstructorTextArea = document.getElementById('dg-new-constructor');
  dom.bind(newConstructorTextArea, 'keydown', function (e) {
    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
      SAVE_DIALOGUE.hide();
    }
  });
  dom.bind(gears, 'click', function () {
    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
    SAVE_DIALOGUE.show();
    newConstructorTextArea.focus();
    newConstructorTextArea.select();
  });
  dom.bind(button, 'click', function () {
    gui.save();
  });
  dom.bind(button2, 'click', function () {
    var presetName = prompt('Enter a new preset name.');
    if (presetName) {
      gui.saveAs(presetName);
    }
  });
  dom.bind(button3, 'click', function () {
    gui.revert();
  });
}
function addResizeHandle(gui) {
  var pmouseX = void 0;
  gui.__resize_handle = document.createElement('div');
  Common.extend(gui.__resize_handle.style, {
    width: '6px',
    marginLeft: '-3px',
    height: '200px',
    cursor: 'ew-resize',
    position: 'absolute'
  });
  function drag(e) {
    e.preventDefault();
    gui.width += pmouseX - e.clientX;
    gui.onResize();
    pmouseX = e.clientX;
    return false;
  }
  function dragStop() {
    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.unbind(window, 'mousemove', drag);
    dom.unbind(window, 'mouseup', dragStop);
  }
  function dragStart(e) {
    e.preventDefault();
    pmouseX = e.clientX;
    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.bind(window, 'mousemove', drag);
    dom.bind(window, 'mouseup', dragStop);
    return false;
  }
  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
  dom.bind(gui.__closeButton, 'mousedown', dragStart);
  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
}
function setWidth(gui, w) {
  gui.domElement.style.width = w + 'px';
  if (gui.__save_row && gui.autoPlace) {
    gui.__save_row.style.width = w + 'px';
  }
  if (gui.__closeButton) {
    gui.__closeButton.style.width = w + 'px';
  }
}
function getCurrentPreset(gui, useInitialValues) {
  var toReturn = {};
  Common.each(gui.__rememberedObjects, function (val, index) {
    var savedValues = {};
    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
    Common.each(controllerMap, function (controller, property) {
      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
    });
    toReturn[index] = savedValues;
  });
  return toReturn;
}
function setPresetSelectIndex(gui) {
  for (var index = 0; index < gui.__preset_select.length; index++) {
    if (gui.__preset_select[index].value === gui.preset) {
      gui.__preset_select.selectedIndex = index;
    }
  }
}
function updateDisplays(controllerArray) {
  if (controllerArray.length !== 0) {
    requestAnimationFrame$1.call(window, function () {
      updateDisplays(controllerArray);
    });
  }
  Common.each(controllerArray, function (c) {
    c.updateDisplay();
  });
}

var color = {
  Color: Color,
  math: ColorMath,
  interpret: interpret
};
var controllers = {
  Controller: Controller,
  BooleanController: BooleanController,
  OptionController: OptionController,
  StringController: StringController,
  NumberController: NumberController,
  NumberControllerBox: NumberControllerBox,
  NumberControllerSlider: NumberControllerSlider,
  FunctionController: FunctionController,
  ColorController: ColorController
};
var dom$1 = { dom: dom };
var gui = { GUI: GUI };
var GUI$1 = GUI;
var index = {
  color: color,
  controllers: controllers,
  dom: dom$1,
  gui: gui,
  GUI: GUI$1
};

exports.color = color;
exports.controllers = controllers;
exports.dom = dom$1;
exports.gui = gui;
exports.GUI = GUI$1;
exports['default'] = index;

Object.defineProperty(exports, '__esModule', { value: true });

})));


},{}],3:[function(require,module,exports){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.heap = {}));
}(this, (function (exports) { 'use strict';

    var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __read = (undefined && undefined.__read) || function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };
    var __spread = (undefined && undefined.__spread) || function () {
        for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
        return ar;
    };
    var toInt = function (n) { return ~~n; };
    /**
     * Heap
     * @type {Class}
     */
    var Heap = /** @class */ (function () {
        /**
         * Heap instance constructor.
         * @param  {Function} compare Optional comparison function, defaults to Heap.minComparator<number>
         */
        function Heap(compare) {
            var _this = this;
            if (compare === void 0) { compare = Heap.minComparator; }
            this.compare = compare;
            this.heapArray = [];
            this._limit = 0;
            /**
             * Alias of add
             */
            this.offer = this.add;
            /**
             * Alias of peek
             */
            this.element = this.peek;
            /**
             * Alias of pop
             */
            this.poll = this.pop;
            /**
             * Returns the inverse to the comparison function.
             * @return {Function}
             */
            this._invertedCompare = function (a, b) {
                return -1 * _this.compare(a, b);
            };
        }
        /*
                  Static methods
         */
        /**
         * Gets children indices for given index.
         * @param  {Number} idx     Parent index
         * @return {Array(Number)}  Array of children indices
         */
        Heap.getChildrenIndexOf = function (idx) {
            return [idx * 2 + 1, idx * 2 + 2];
        };
        /**
         * Gets parent index for given index.
         * @param  {Number} idx  Children index
         * @return {Number | undefined}      Parent index, -1 if idx is 0
         */
        Heap.getParentIndexOf = function (idx) {
            if (idx <= 0) {
                return -1;
            }
            var whichChildren = idx % 2 ? 1 : 2;
            return Math.floor((idx - whichChildren) / 2);
        };
        /**
         * Gets sibling index for given index.
         * @param  {Number} idx  Children index
         * @return {Number | undefined}      Sibling index, -1 if idx is 0
         */
        Heap.getSiblingIndexOf = function (idx) {
            if (idx <= 0) {
                return -1;
            }
            var whichChildren = idx % 2 ? 1 : -1;
            return idx + whichChildren;
        };
        /**
         * Min heap comparison function, default.
         * @param  {any} a     First element
         * @param  {any} b     Second element
         * @return {Number}    0 if they're equal, positive if `a` goes up, negative if `b` goes up
         */
        Heap.minComparator = function (a, b) {
            if (a > b) {
                return 1;
            }
            else if (a < b) {
                return -1;
            }
            else {
                return 0;
            }
        };
        /**
         * Max heap comparison function.
         * @param  {any} a     First element
         * @param  {any} b     Second element
         * @return {Number}    0 if they're equal, positive if `a` goes up, negative if `b` goes up
         */
        Heap.maxComparator = function (a, b) {
            if (b > a) {
                return 1;
            }
            else if (b < a) {
                return -1;
            }
            else {
                return 0;
            }
        };
        /**
         * Min number heap comparison function, default.
         * @param  {Number} a     First element
         * @param  {Number} b     Second element
         * @return {Number}    0 if they're equal, positive if `a` goes up, negative if `b` goes up
         */
        Heap.minComparatorNumber = function (a, b) {
            return a - b;
        };
        /**
         * Max number heap comparison function.
         * @param  {Number} a     First element
         * @param  {Number} b     Second element
         * @return {Number}    0 if they're equal, positive if `a` goes up, negative if `b` goes up
         */
        Heap.maxComparatorNumber = function (a, b) {
            return b - a;
        };
        /**
         * Default equality function.
         * @param  {any} a    First element
         * @param  {any} b    Second element
         * @return {Boolean}  True if equal, false otherwise
         */
        Heap.defaultIsEqual = function (a, b) {
            return a === b;
        };
        /**
         * Prints a heap.
         * @param  {Heap} heap Heap to be printed
         * @returns {String}
         */
        Heap.print = function (heap) {
            function deep(i) {
                var pi = Heap.getParentIndexOf(i);
                return Math.floor(Math.log2(pi + 1));
            }
            function repeat(str, times) {
                var out = '';
                for (; times > 0; --times) {
                    out += str;
                }
                return out;
            }
            var node = 0;
            var lines = [];
            var maxLines = deep(heap.length - 1) + 2;
            var maxLength = 0;
            while (node < heap.length) {
                var i = deep(node) + 1;
                if (node === 0) {
                    i = 0;
                }
                // Text representation
                var nodeText = String(heap.get(node));
                if (nodeText.length > maxLength) {
                    maxLength = nodeText.length;
                }
                // Add to line
                lines[i] = lines[i] || [];
                lines[i].push(nodeText);
                node += 1;
            }
            return lines
                .map(function (line, i) {
                var times = Math.pow(2, maxLines - i) - 1;
                return (repeat(' ', Math.floor(times / 2) * maxLength) +
                    line
                        .map(function (el) {
                        // centered
                        var half = (maxLength - el.length) / 2;
                        return repeat(' ', Math.ceil(half)) + el + repeat(' ', Math.floor(half));
                    })
                        .join(repeat(' ', times * maxLength)));
            })
                .join('\n');
        };
        /*
                  Python style
         */
        /**
         * Converts an array into an array-heap, in place
         * @param  {Array}    arr      Array to be modified
         * @param  {Function} compare  Optional compare function
         * @return {Heap}              For convenience, it returns a Heap instance
         */
        Heap.heapify = function (arr, compare) {
            var heap = new Heap(compare);
            heap.heapArray = arr;
            heap.init();
            return heap;
        };
        /**
         * Extract the peek of an array-heap
         * @param  {Array}    heapArr  Array to be modified, should be a heap
         * @param  {Function} compare  Optional compare function
         * @return {any}               Returns the extracted peek
         */
        Heap.heappop = function (heapArr, compare) {
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            return heap.pop();
        };
        /**
         * Pushes a item into an array-heap
         * @param  {Array}    heapArr  Array to be modified, should be a heap
         * @param  {any}      item     Item to push
         * @param  {Function} compare  Optional compare function
         */
        Heap.heappush = function (heapArr, item, compare) {
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            heap.push(item);
        };
        /**
         * Push followed by pop, faster
         * @param  {Array}    heapArr  Array to be modified, should be a heap
         * @param  {any}      item     Item to push
         * @param  {Function} compare  Optional compare function
         * @return {any}               Returns the extracted peek
         */
        Heap.heappushpop = function (heapArr, item, compare) {
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            return heap.pushpop(item);
        };
        /**
         * Replace peek with item
         * @param  {Array}    heapArr  Array to be modified, should be a heap
         * @param  {any}      item     Item as replacement
         * @param  {Function} compare  Optional compare function
         * @return {any}               Returns the extracted peek
         */
        Heap.heapreplace = function (heapArr, item, compare) {
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            return heap.replace(item);
        };
        /**
         * Return the `n` most valuable elements of a heap-like Array
         * @param  {Array}    heapArr  Array, should be an array-heap
         * @param  {number}   n        Max number of elements
         * @param  {Function} compare  Optional compare function
         * @return {any}               Elements
         */
        Heap.heaptop = function (heapArr, n, compare) {
            if (n === void 0) { n = 1; }
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            return heap.top(n);
        };
        /**
         * Return the `n` least valuable elements of a heap-like Array
         * @param  {Array}    heapArr  Array, should be an array-heap
         * @param  {number}   n        Max number of elements
         * @param  {Function} compare  Optional compare function
         * @return {any}               Elements
         */
        Heap.heapbottom = function (heapArr, n, compare) {
            if (n === void 0) { n = 1; }
            var heap = new Heap(compare);
            heap.heapArray = heapArr;
            return heap.bottom(n);
        };
        /**
         * Return the `n` most valuable elements of an iterable
         * @param  {number}   n        Max number of elements
         * @param  {Iterable} Iterable Iterable list of elements
         * @param  {Function} compare  Optional compare function
         * @return {any}               Elements
         */
        Heap.nlargest = function (n, iterable, compare) {
            var heap = new Heap(compare);
            heap.heapArray = __spread(iterable);
            heap.init();
            return heap.top(n);
        };
        /**
         * Return the `n` least valuable elements of an iterable
         * @param  {number}   n        Max number of elements
         * @param  {Iterable} Iterable Iterable list of elements
         * @param  {Function} compare  Optional compare function
         * @return {any}               Elements
         */
        Heap.nsmallest = function (n, iterable, compare) {
            var heap = new Heap(compare);
            heap.heapArray = __spread(iterable);
            heap.init();
            return heap.bottom(n);
        };
        /*
                  Instance methods
         */
        /**
         * Adds an element to the heap. Aliases: `offer`.
         * Same as: push(element)
         * @param {any} element Element to be added
         * @return {Boolean} true
         */
        Heap.prototype.add = function (element) {
            this._sortNodeUp(this.heapArray.push(element) - 1);
            this._applyLimit();
            return true;
        };
        /**
         * Adds an array of elements to the heap.
         * Similar as: push(element, element, ...).
         * @param {Array} elements Elements to be added
         * @return {Boolean} true
         */
        Heap.prototype.addAll = function (elements) {
            var _a;
            var i = this.length;
            (_a = this.heapArray).push.apply(_a, __spread(elements));
            for (var l = this.length; i < l; ++i) {
                this._sortNodeUp(i);
            }
            this._applyLimit();
            return true;
        };
        /**
         * Return the bottom (lowest value) N elements of the heap.
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}     Array of length <= N.
         */
        Heap.prototype.bottom = function (n) {
            if (n === void 0) { n = 1; }
            if (this.heapArray.length === 0 || n <= 0) {
                // Nothing to do
                return [];
            }
            else if (this.heapArray.length === 1) {
                // Just the peek
                return [this.heapArray[0]];
            }
            else if (n >= this.heapArray.length) {
                // The whole heap
                return __spread(this.heapArray);
            }
            else {
                // Some elements
                var result = this._bottomN_push(~~n);
                return result;
            }
        };
        /**
         * Check if the heap is sorted, useful for testing purposes.
         * @return {Undefined | Element}  Returns an element if something wrong is found, otherwise it's undefined
         */
        Heap.prototype.check = function () {
            var _this = this;
            return this.heapArray.find(function (el, j) { return !!_this.getChildrenOf(j).find(function (ch) { return _this.compare(el, ch) > 0; }); });
        };
        /**
         * Remove all of the elements from this heap.
         */
        Heap.prototype.clear = function () {
            this.heapArray = [];
        };
        /**
         * Clone this heap
         * @return {Heap}
         */
        Heap.prototype.clone = function () {
            var cloned = new Heap(this.comparator());
            cloned.heapArray = this.toArray();
            cloned._limit = this._limit;
            return cloned;
        };
        /**
         * Returns the comparison function.
         * @return {Function}
         */
        Heap.prototype.comparator = function () {
            return this.compare;
        };
        /**
         * Returns true if this queue contains the specified element.
         * @param  {any}      o   Element to be found
         * @param  {Function} fn  Optional comparison function, receives (element, needle)
         * @return {Boolean}
         */
        Heap.prototype.contains = function (o, fn) {
            if (fn === void 0) { fn = Heap.defaultIsEqual; }
            return this.heapArray.findIndex(function (el) { return fn(el, o); }) >= 0;
        };
        /**
         * Initialise a heap, sorting nodes
         * @param  {Array} array Optional initial state array
         */
        Heap.prototype.init = function (array) {
            if (array) {
                this.heapArray = __spread(array);
            }
            for (var i = Math.floor(this.heapArray.length); i >= 0; --i) {
                this._sortNodeDown(i);
            }
            this._applyLimit();
        };
        /**
         * Test if the heap has no elements.
         * @return {Boolean} True if no elements on the heap
         */
        Heap.prototype.isEmpty = function () {
            return this.length === 0;
        };
        /**
         * Get the leafs of the tree (no children nodes)
         */
        Heap.prototype.leafs = function () {
            if (this.heapArray.length === 0) {
                return [];
            }
            var pi = Heap.getParentIndexOf(this.heapArray.length - 1);
            return this.heapArray.slice(pi + 1);
        };
        Object.defineProperty(Heap.prototype, "length", {
            /**
             * Length of the heap.
             * @return {Number}
             */
            get: function () {
                return this.heapArray.length;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Heap.prototype, "limit", {
            /**
             * Get length limit of the heap.
             * @return {Number}
             */
            get: function () {
                return this._limit;
            },
            /**
             * Set length limit of the heap.
             * @return {Number}
             */
            set: function (_l) {
                this._limit = ~~_l;
                this._applyLimit();
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Top node. Aliases: `element`.
         * Same as: `top(1)[0]`
         * @return {any} Top node
         */
        Heap.prototype.peek = function () {
            return this.heapArray[0];
        };
        /**
         * Extract the top node (root). Aliases: `poll`.
         * @return {any} Extracted top node, undefined if empty
         */
        Heap.prototype.pop = function () {
            var last = this.heapArray.pop();
            if (this.length > 0 && last !== undefined) {
                return this.replace(last);
            }
            return last;
        };
        /**
         * Pushes element(s) to the heap.
         * @param  {...any} elements Elements to insert
         * @return {Boolean} True if elements are present
         */
        Heap.prototype.push = function () {
            var elements = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                elements[_i] = arguments[_i];
            }
            if (elements.length < 1) {
                return false;
            }
            else if (elements.length === 1) {
                return this.add(elements[0]);
            }
            else {
                return this.addAll(elements);
            }
        };
        /**
         * Same as push & pop in sequence, but faster
         * @param  {any} element Element to insert
         * @return {any}  Extracted top node
         */
        Heap.prototype.pushpop = function (element) {
            var _a;
            if (this.compare(this.heapArray[0], element) < 0) {
                _a = __read([this.heapArray[0], element], 2), element = _a[0], this.heapArray[0] = _a[1];
                this._sortNodeDown(0);
            }
            return element;
        };
        /**
         * Remove an element from the heap.
         * @param  {any}   o      Element to be found
         * @param  {Function} fn  Optional function to compare
         * @return {Boolean}      True if the heap was modified
         */
        Heap.prototype.remove = function (o, fn) {
            if (fn === void 0) { fn = Heap.defaultIsEqual; }
            if (this.length > 0) {
                if (o === undefined) {
                    this.pop();
                    return true;
                }
                else {
                    var idx = this.heapArray.findIndex(function (el) { return fn(el, o); });
                    if (idx >= 0) {
                        if (idx === 0) {
                            this.pop();
                        }
                        else if (idx === this.length - 1) {
                            this.heapArray.pop();
                        }
                        else {
                            this.heapArray.splice(idx, 1, this.heapArray.pop());
                            this._sortNodeUp(idx);
                            this._sortNodeDown(idx);
                        }
                        return true;
                    }
                }
            }
            return false;
        };
        /**
         * Pop the current peek value, and add the new item.
         * @param  {any} element  Element to replace peek
         * @return {any}         Old peek
         */
        Heap.prototype.replace = function (element) {
            var peek = this.heapArray[0];
            this.heapArray[0] = element;
            this._sortNodeDown(0);
            return peek;
        };
        /**
         * Size of the heap
         * @return {Number}
         */
        Heap.prototype.size = function () {
            return this.length;
        };
        /**
         * Return the top (highest value) N elements of the heap.
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}    Array of length <= N.
         */
        Heap.prototype.top = function (n) {
            if (n === void 0) { n = 1; }
            if (this.heapArray.length === 0 || n <= 0) {
                // Nothing to do
                return [];
            }
            else if (this.heapArray.length === 1 || n === 1) {
                // Just the peek
                return [this.heapArray[0]];
            }
            else if (n >= this.heapArray.length) {
                // The whole peek
                return __spread(this.heapArray);
            }
            else {
                // Some elements
                var result = this._topN_push(~~n);
                return result;
            }
        };
        /**
         * Clone the heap's internal array
         * @return {Array}
         */
        Heap.prototype.toArray = function () {
            return __spread(this.heapArray);
        };
        /**
         * String output, call to Array.prototype.toString()
         * @return {String}
         */
        Heap.prototype.toString = function () {
            return this.heapArray.toString();
        };
        /**
         * Get the element at the given index.
         * @param  {Number} i Index to get
         * @return {any}       Element at that index
         */
        Heap.prototype.get = function (i) {
            return this.heapArray[i];
        };
        /**
         * Get the elements of these node's children
         * @param  {Number} idx Node index
         * @return {Array(any)}  Children elements
         */
        Heap.prototype.getChildrenOf = function (idx) {
            var _this = this;
            return Heap.getChildrenIndexOf(idx)
                .map(function (i) { return _this.heapArray[i]; })
                .filter(function (e) { return e !== undefined; });
        };
        /**
         * Get the element of this node's parent
         * @param  {Number} idx Node index
         * @return {any}     Parent element
         */
        Heap.prototype.getParentOf = function (idx) {
            var pi = Heap.getParentIndexOf(idx);
            return this.heapArray[pi];
        };
        /**
         * Iterator interface
         */
        Heap.prototype[Symbol.iterator] = function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.length) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pop()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        };
        /**
         * Returns an iterator. To comply with Java interface.
         */
        Heap.prototype.iterator = function () {
            return this;
        };
        /**
         * Limit heap size if needed
         */
        Heap.prototype._applyLimit = function () {
            if (this._limit && this._limit < this.heapArray.length) {
                var rm = this.heapArray.length - this._limit;
                // It's much faster than splice
                while (rm) {
                    this.heapArray.pop();
                    --rm;
                }
            }
        };
        /**
         * Return the bottom (lowest value) N elements of the heap, without corner cases, unsorted
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}     Array of length <= N.
         */
        Heap.prototype._bottomN_push = function (n) {
            // Use an inverted heap
            var bottomHeap = new Heap(this.compare);
            bottomHeap.limit = n;
            bottomHeap.heapArray = this.heapArray.slice(-n);
            bottomHeap.init();
            var startAt = this.heapArray.length - 1 - n;
            var parentStartAt = Heap.getParentIndexOf(startAt);
            var indices = [];
            for (var i = startAt; i > parentStartAt; --i) {
                indices.push(i);
            }
            var arr = this.heapArray;
            while (indices.length) {
                var i = indices.shift();
                if (this.compare(arr[i], bottomHeap.peek()) > 0) {
                    bottomHeap.replace(arr[i]);
                    if (i % 2) {
                        indices.push(Heap.getParentIndexOf(i));
                    }
                }
            }
            return bottomHeap.toArray();
        };
        /**
         * Move a node to a new index, switching places
         * @param  {Number} j First node index
         * @param  {Number} k Another node index
         */
        Heap.prototype._moveNode = function (j, k) {
            var _a;
            _a = __read([this.heapArray[k], this.heapArray[j]], 2), this.heapArray[j] = _a[0], this.heapArray[k] = _a[1];
        };
        /**
         * Move a node down the tree (to the leaves) to find a place where the heap is sorted.
         * @param  {Number} i Index of the node
         */
        Heap.prototype._sortNodeDown = function (i) {
            var _this = this;
            var moveIt = i < this.heapArray.length - 1;
            var self = this.heapArray[i];
            var getPotentialParent = function (best, j) {
                if (_this.heapArray.length > j && _this.compare(_this.heapArray[j], _this.heapArray[best]) < 0) {
                    best = j;
                }
                return best;
            };
            while (moveIt) {
                var childrenIdx = Heap.getChildrenIndexOf(i);
                var bestChildIndex = childrenIdx.reduce(getPotentialParent, childrenIdx[0]);
                var bestChild = this.heapArray[bestChildIndex];
                if (typeof bestChild !== 'undefined' && this.compare(self, bestChild) > 0) {
                    this._moveNode(i, bestChildIndex);
                    i = bestChildIndex;
                }
                else {
                    moveIt = false;
                }
            }
        };
        /**
         * Move a node up the tree (to the root) to find a place where the heap is sorted.
         * @param  {Number} i Index of the node
         */
        Heap.prototype._sortNodeUp = function (i) {
            var moveIt = i > 0;
            while (moveIt) {
                var pi = Heap.getParentIndexOf(i);
                if (pi >= 0 && this.compare(this.heapArray[pi], this.heapArray[i]) > 0) {
                    this._moveNode(i, pi);
                    i = pi;
                }
                else {
                    moveIt = false;
                }
            }
        };
        /**
         * Return the top (highest value) N elements of the heap, without corner cases, unsorted
         * Implementation: push.
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}     Array of length <= N.
         */
        Heap.prototype._topN_push = function (n) {
            // Use an inverted heap
            var topHeap = new Heap(this._invertedCompare);
            topHeap.limit = n;
            var indices = [0];
            var arr = this.heapArray;
            while (indices.length) {
                var i = indices.shift();
                if (i < arr.length) {
                    if (topHeap.length < n) {
                        topHeap.push(arr[i]);
                        indices.push.apply(indices, __spread(Heap.getChildrenIndexOf(i)));
                    }
                    else if (this.compare(arr[i], topHeap.peek()) < 0) {
                        topHeap.replace(arr[i]);
                        indices.push.apply(indices, __spread(Heap.getChildrenIndexOf(i)));
                    }
                }
            }
            return topHeap.toArray();
        };
        /**
         * Return the top (highest value) N elements of the heap, without corner cases, unsorted
         * Implementation: init + push.
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}     Array of length <= N.
         */
        Heap.prototype._topN_fill = function (n) {
            // Use an inverted heap
            var heapArray = this.heapArray;
            var topHeap = new Heap(this._invertedCompare);
            topHeap.limit = n;
            topHeap.heapArray = heapArray.slice(0, n);
            topHeap.init();
            var branch = Heap.getParentIndexOf(n - 1) + 1;
            var indices = [];
            for (var i = branch; i < n; ++i) {
                indices.push.apply(indices, __spread(Heap.getChildrenIndexOf(i).filter(function (l) { return l < heapArray.length; })));
            }
            if ((n - 1) % 2) {
                indices.push(n);
            }
            while (indices.length) {
                var i = indices.shift();
                if (i < heapArray.length) {
                    if (this.compare(heapArray[i], topHeap.peek()) < 0) {
                        topHeap.replace(heapArray[i]);
                        indices.push.apply(indices, __spread(Heap.getChildrenIndexOf(i)));
                    }
                }
            }
            return topHeap.toArray();
        };
        /**
         * Return the top (highest value) N elements of the heap, without corner cases, unsorted
         * Implementation: heap.
         *
         * @param  {Number} n  Number of elements.
         * @return {Array}     Array of length <= N.
         */
        Heap.prototype._topN_heap = function (n) {
            var topHeap = this.clone();
            var result = [];
            for (var i = 0; i < n; ++i) {
                result.push(topHeap.pop());
            }
            return result;
        };
        /**
         * Return index of the top element
         * @param list
         */
        Heap.prototype._topIdxOf = function (list) {
            if (!list.length) {
                return -1;
            }
            var idx = 0;
            var top = list[idx];
            for (var i = 1; i < list.length; ++i) {
                var comp = this.compare(list[i], top);
                if (comp < 0) {
                    idx = i;
                    top = list[i];
                }
            }
            return idx;
        };
        /**
         * Return the top element
         * @param list
         */
        Heap.prototype._topOf = function () {
            var list = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                list[_i] = arguments[_i];
            }
            var heap = new Heap(this.compare);
            heap.init(list);
            return heap.peek();
        };
        return Heap;
    }());

    exports.Heap = Heap;
    exports.default = Heap;
    exports.toInt = toInt;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLnRzIiwibm9kZV9tb2R1bGVzL2RhdC5ndWkvYnVpbGQvZGF0Lmd1aS5qcyIsIm5vZGVfbW9kdWxlcy9oZWFwLWpzL2Rpc3QvaGVhcC1qcy51bWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLCtCQUErQjtBQUMvQixxQ0FBMkI7QUFFM0IsSUFBSSxNQUFNLEdBQU8sRUFBRSxDQUFDO0FBQ3BCLE1BQU0sQ0FBQyxNQUFNLEdBQUc7SUFDZCxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN4QixNQUFNLFlBQVksR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDOUUsU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFFLE9BQVksRUFBRSxHQUFTLEVBQUUsR0FBWTtRQUNwRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkUsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEUsU0FBUyxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxD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LEVBQUUsWUFBWSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELG1DQUFtQztBQUNuQyxTQUFTLGFBQWEsQ0FBQyxLQUFhO0lBQ2xDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNqRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUM7SUFDNUMsSUFBSSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxHQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxHQUFDLElBQUksR0FBRyxDQUFDLENBQWdCLENBQUM7SUFFM0csS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFO1FBQzVDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUMsTUFBTSxDQUFDO1FBQ3hCLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNO1lBQ3RCLE1BQU07UUFDUixLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBQyxD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RjtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBT0Y7O0FDbmhCRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxK0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0ICogYXMgRGF0IGZyb20gXCJkYXQuZ3VpXCI7XHJcbmltcG9ydCBIZWFwIGZyb20gJ2hlYXAtanMnO1xyXG5cclxubGV0IGNvbmZpZzphbnkgPSB7fTtcclxud2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBndWkgPSBuZXcgRGF0LkdVSSgpO1xyXG4gIGNvbnN0IHJlYWRhYmxlTmFtZSA9IChuOiBzdHJpbmcpID0+IG4ucmVwbGFjZSgvKFtBLVpdKS9nLCAnICQxJykudG9Mb3dlckNhc2UoKVxyXG4gIGZ1bmN0aW9uIGFkZENvbmZpZyhuYW1lOiBzdHJpbmcsIGluaXRpYWw6IGFueSwgbWluPzogYW55LCBtYXg/OiBudW1iZXIpIHtcclxuICAgIGNvbmZpZ1tuYW1lXSA9IGluaXRpYWw7XHJcbiAgICByZXR1cm4gZ3VpLmFkZChjb25maWcsIG5hbWUsIG1pbiwgbWF4KS5uYW1lKHJlYWRhYmxlTmFtZShuYW1lKSk7XHJcbiAgfVxyXG4gIGFkZENvbmZpZyhcImluY2x1ZGVSb3RhdGVkQW5kRmxpcHBlZFwiLCBmYWxzZSkub25GaW5pc2hDaGFuZ2UoaW5pdFRpbGVzKTtcclxuICBhZGRDb25maWcoXCJ0aWxlU2l6ZVwiLCAzLCAyLCAxMCkuc3RlcCgxKS5vbkZpbmlzaENoYW5nZShpbml0VGlsZXMpO1xyXG4gIGFkZENvbmZpZyhcIm91dHB1dFdpZHRoXCIsIDUwLCA1LCAxMDAwKS5zdGVwKDUpLm9uRmluaXNoQ2hhbmdlKGluaXRUaWxlcyk7XHJcbiAgYWRkQ29uZmlnKFwib3V0cHV0SGVpZ2h0XCIsIDUwLCA1LCAxMDAwKS5zdGVwKDUpLm9uRmluaXNoQ2hhbmdlKGluaXRUaWxlcyk7XHJcbiAgYWRkQ29uZmlnKFwiaW5wdXRcIiwgXCJ0aWxlcy9XYXRlci5wbmdcIiwgW1xyXG4gICAgXCJ0aWxlcy8zQnJpY2tzLnBuZ1wiLCBcInRpbGVzL0FuZ3VsYXIucG5nXCIsIFwidGlsZXMvQ2F0LnBuZ1wiLCBcInRpbGVzL0NhdHMucG5nXCIsIFwidGlsZXMvQ2F2ZS5wbmdcIiwgXCJ0aWxlcy9DaGVzcy5wbmdcIixcclxuICAgIFwidGlsZXMvQ2l0eS5wbmdcIiwgXCJ0aWxlcy9Db2xvcmVkQ2l0eS5wbmdcIiwgXCJ0aWxlcy9EdW5nZW9uLnBuZ1wiLCBcInRpbGVzL0ZhYnJpYy5wbmdcIiwgXCJ0aWxlcy9GbG93ZXJzLnBuZ1wiLCBcInRpbGVzL0ZvcmVzdC5wbmdcIixcclxuICAgIFwidGlsZXMvR3JpZC5wbmdcIiwgXCJ0aWxlcy9HcmlkTG9uZy5wbmdcIiwgXCJ0aWxlcy9Ib2dzLnBuZ1wiLCBcInRpbGVzL0tub3QucG5nXCIsIFwidGlsZXMvTGFrZS5wbmdcIiwgXCJ0aWxlcy9MZXNzUm9vbXMucG5nXCIsIFwidGlsZXMvTGluay5wbmdcIixcclxuICAgIFwidGlsZXMvTGluazIucG5nXCIsIFwidGlsZXMvTWFnaWNPZmZpY2UucG5nXCIsIFwidGlsZXMvTWF6ZS5wbmdcIiwgXCJ0aWxlcy9NYXplbGlrZS5wbmdcIiwgXCJ0aWxlcy9Nb3JlRmxvd2Vycy5wbmdcIiwgXCJ0aWxlcy9Nb3VudGFpbnMucG5nXCIsXHJcbiAgICBcInRpbGVzL05lc3RlZC5wbmdcIiwgXCJ0aWxlcy9PZmZpY2UucG5nXCIsIFwidGlsZXMvT2ZmaWNlMi5wbmdcIiwgXCJ0aWxlcy9QYXRocy5wbmdcIiwgXCJ0aWxlcy9QbGF0Zm9ybWVyLnBuZ1wiLCBcInRpbGVzL1F1ZC5wbmdcIiwgXCJ0aWxlcy9SZWREb3QucG5nXCIsXHJcbiAgICBcInRpbGVzL1JlZE1hemUucG5nXCIsIFwidGlsZXMvUm9vbXMucG5nXCIsIFwidGlsZXMvUnVsZTEyNi5wbmdcIiwgXCJ0aWxlcy9TY2FsZWRNYXplLnBuZ1wiLCBcInRpbGVzL1Nld2Vycy5wbmdcIiwgXCJ0aWxlcy9TaW1wbGVLbm90LnBuZ1wiLFxyXG4gICAgXCJ0aWxlcy9TaW1wbGVNYXplLnBuZ1wiLCBcInRpbGVzL1NpbXBsZVdhbGwucG5nXCIsIFwidGlsZXMvU2tldzEucG5nXCIsIFwidGlsZXMvU2tldzIucG5nXCIsIFwidGlsZXMvU2t5bGluZS5wbmdcIiwgXCJ0aWxlcy9Ta3lsaW5lMi5wbmdcIixcclxuICAgIFwidGlsZXMvU21pbGVDaXR5LnBuZ1wiLCBcInRpbGVzL1NwaXJhbHMucG5nXCIsIFwidGlsZXMvVG93bi5wbmdcIiwgXCJ0aWxlcy9Ucmlja0tub3QucG5nXCIsIFwidGlsZXMvVmlsbGFnZS5wbmdcIiwgXCJ0aWxlcy9XYWxsLnBuZ1wiLCBcInRpbGVzL1dhdGVyLnBuZ1wiLFxyXG4gIF0pLm9uRmluaXNoQ2hhbmdlKGluaXRUaWxlcyk7XHJcblxyXG4gIGd1aS51c2VMb2NhbFN0b3JhZ2UgPSB0cnVlO1xyXG5cclxuICBpbml0VGlsZXMoKTtcclxufTtcclxuXHJcbmxldCBpbnRlcnZhbElkOiBudW1iZXI7XHJcbmZ1bmN0aW9uIGluaXRUaWxlcygpIHtcclxuICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcbiAgaW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgaW1nLnNyYyA9IGNvbmZpZy5pbnB1dDtcclxuXHJcbiAgaWYgKGludGVydmFsSWQpXHJcbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcclxuXHJcbiAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gVXBkYXRlIHRoZSBpbnB1dCB0aWxlIGRpc3BsYXkuXHJcbiAgICB7XHJcbiAgICAgIGxldCBjYW52YXMgPSAkKFwiaW5wdXRcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICAgIGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgIGlmICghY29udGV4dCkgcmV0dXJuO1xyXG4gICAgICBjb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAvLyBbY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0XSA9IFtpbWcud2lkdGgsIGltZy5oZWlnaHRdO1xyXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIGltYWdlIGRhdGEgZnJvbSB0aGUgaW1hZ2UuXHJcbiAgICB7XHJcbiAgICAgIGxldCBjYW52YXMgPSBuZXcgT2Zmc2NyZWVuQ2FudmFzKGltZy53aWR0aCwgaW1nLmhlaWdodCk7XHJcbiAgICAgIGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgIGlmICghY29udGV4dCkgcmV0dXJuO1xyXG4gICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xyXG4gICAgICBsZXQgaW1hZ2VEYXRhID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KSBhcyBNeUltYWdlRGF0YTtcclxuICAgICAgbGV0IHJlc3VsdHMgPSBwYXJzZUltYWdlKGltYWdlRGF0YSk7XHJcbiAgICAgIGxldCBjb3JlID0gbmV3IENvcmVTdGF0ZSguLi5yZXN1bHRzKTtcclxuICAgICAgY29yZS5pbml0KCk7XHJcbiAgICAgIGNvcmUucmVuZGVyKCk7XHJcbiAgICAgIGxldCBwYXVzZWQgPSB0cnVlO1xyXG4gICAgICB3aW5kb3cub25jbGljayA9ICgpID0+IHtwYXVzZWQgPSAhcGF1c2VkOyB9O1xyXG4gICAgICBpbnRlcnZhbElkID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICBpZiAocGF1c2VkKSByZXR1cm47XHJcbiAgICAgICAgaWYgKCFjb3JlLnN0ZXAoKSlcclxuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICAgIGNvcmUucmVuZGVyKCk7XHJcbiAgICAgIH0sIDApO1xyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcbi8vIFNoYW1lbGVzcyBoYWNrIHRvIGV4dGVuZCBJbWFnZURhdGEgd2l0aCBjb25jaXNlIHBpeGVsIGFjY2Vzc29ycy5cclxuaW50ZXJmYWNlIE15SW1hZ2VEYXRhIGV4dGVuZHMgSW1hZ2VEYXRhIHtcclxuICBnZXQoW3gsIHldOiBQb2ludCk6IENvbG9yO1xyXG4gIHNldChbeCwgeV06IFBvaW50LCBjOiBDb2xvcik6IHZvaWQ7XHJcbn1cclxuSW1hZ2VEYXRhLnByb3RvdHlwZVtcImdldFwiXSA9IGZ1bmN0aW9uKFt4LCB5XTogUG9pbnQpOiBDb2xvciB7XHJcbiAgbGV0IHIgPSA0ICogKHkgKiB0aGlzLndpZHRoICsgeCk7XHJcbiAgcmV0dXJuICh0aGlzLmRhdGFbcl0gPDwgMjQpIHwgKHRoaXMuZGF0YVtyKzFdIDw8IDE2KSB8ICh0aGlzLmRhdGFbcisyXSA8PCA4KSB8ICh0aGlzLmRhdGFbciszXSk7XHJcbn1cclxuSW1hZ2VEYXRhLnByb3RvdHlwZVtcInNldFwiXSA9IGZ1bmN0aW9uKFt4LCB5XTogUG9pbnQsIGNvbG9yOiBDb2xvcik6IHZvaWQge1xyXG4gIGxldCByID0gNCAqICh5ICogdGhpcy53aWR0aCArIHgpO1xyXG4gIHRoaXMuZGF0YVtyKzBdID0gKGNvbG9yID4+PiAyNCkgJiAweGZmO1xyXG4gIHRoaXMuZGF0YVtyKzFdID0gKGNvbG9yID4+PiAxNikgJiAweGZmO1xyXG4gIHRoaXMuZGF0YVtyKzJdID0gKGNvbG9yID4+PiA4KSAmIDB4ZmY7XHJcbiAgdGhpcy5kYXRhW3IrM10gPSAoY29sb3IpICYgMHhmZjtcclxufVxyXG5cclxuLy8gQ29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGl0ZXJhdGluZyBvdmVyIHJlY3Rhbmd1bGFyIHJlZ2lvbnMuXHJcbmZ1bmN0aW9uKiByZWN0UmFuZ2UoW3csIGhdOiBTaXplKSB7XHJcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBoOyB5KyspIHtcclxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgdzsgeCsrKSB7XHJcbiAgICAgIHlpZWxkIDxQb2ludD5beCx5XVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy8gSGVscGVyIGZvciBmbGF0dGVuaW5nIGEgMmQgY29vcmQgdG8gYW4gaW5kZXggKHJvdy1tYWpvciBvcmRlcikuXHJcbmZ1bmN0aW9uIHBvaW50VG9JbmRleChbeCwgeV06IFBvaW50LCB3aWR0aDogbnVtYmVyKTogbnVtYmVyIHtcclxuICByZXR1cm4geCArIHkqd2lkdGg7XHJcbn1cclxuXHJcbi8vIEhlbHBlciB0byBkcmF3IGFuIEltYWdlRGF0YSB0byBhIGNhbnZhcywgc2NhbGVkIHRvIHRoYXQgY2FudmFzJ3Mgc2l6ZS5cclxuZnVuY3Rpb24gcmVuZGVyVG9DYW52YXMoY2FudmFzSWQ6IHN0cmluZywgaW1hZ2VEYXRhOiBJbWFnZURhdGEpOiB2b2lkIHtcclxuICAvLyBCbGl0IHRvIGFuIG9mZnNjcmVlbiBjYW52YXMgZmlyc3QsIHNvIHdlIGNhbiBzY2FsZSBpdCB1cCB3aGVuIGRyYXdpbmcgaXQgZm9yIHJlYWwuXHJcbiAgbGV0IGJ1ZmZlciA9IG5ldyBPZmZzY3JlZW5DYW52YXMoaW1hZ2VEYXRhLndpZHRoLCBpbWFnZURhdGEuaGVpZ2h0KTtcclxuICB7XHJcbiAgICBsZXQgY29udGV4dCA9IGJ1ZmZlci5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgaWYgKCFjb250ZXh0KSByZXR1cm47XHJcbiAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xyXG4gIH1cclxuXHJcbiAgbGV0IGNhbnZhcyA9ICQoY2FudmFzSWQpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xyXG4gIGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgaWYgKCFjb250ZXh0KSByZXR1cm47XHJcbiAgY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcclxuICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gIGNvbnRleHQuZHJhd0ltYWdlKGJ1ZmZlciwgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcclxufVxyXG5cclxuLy8gRnVsbCBqcXVlcnkgZW11bGF0aW9uLlxyXG5jb25zdCAkID0gKGlkOiBzdHJpbmcpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuXHJcbi8vIEhvdyB3ZSBpZGVudGlmeSBhIHRpbGUgLSBqdXN0IGl0cyBpbmRleCBpbnRvIHRoZSBsaXN0IG9mIGFsbCB0aWxlcy5cclxudHlwZSBUaWxlSW5kZXggPSBudW1iZXI7XHJcblxyXG4vLyBBIG51bWJlciBnaXZpbmcgdGhlIHJlbGF0aXZlIGZyZXF1ZW5jeSBvZiBhIHRpbGUuXHJcbnR5cGUgRnJlcXVlbmN5V2VpZ2h0ID0gbnVtYmVyO1xyXG5cclxuLy8gQ2FyZGluYWwgZGlyZWN0aW9ucy5cclxuZW51bSBEaXJlY3Rpb24geyBVcCwgUmlnaHQsIERvd24sIExlZnQgfTtcclxubmFtZXNwYWNlIERpcmVjdGlvbiB7XHJcbiAgZXhwb3J0IGNvbnN0IGl0ZW1zOiBEaXJlY3Rpb25bXSA9IFtEaXJlY3Rpb24uVXAsIERpcmVjdGlvbi5SaWdodCwgRGlyZWN0aW9uLkRvd24sIERpcmVjdGlvbi5MZWZ0XTtcclxuICBleHBvcnQgY29uc3QgdG9PcHBvc2l0ZTogRGlyZWN0aW9uW10gPSBbRGlyZWN0aW9uLkRvd24sIERpcmVjdGlvbi5MZWZ0LCBEaXJlY3Rpb24uVXAsIERpcmVjdGlvbi5SaWdodF07XHJcbiAgZXhwb3J0IGNvbnN0IHRvT2Zmc2V0OiBTaXplW10gPSBbWzAsIC0xXSwgWzEsIDBdLCBbMCwgMV0sIFstMSwgMF1dO1xyXG59XHJcblxyXG4vLyBBIDMyLWJpdCBSR0JBIGNvbG9yLiBGb3JtYXQgaXMgMHhSUkdHQkJBQS5cclxudHlwZSBDb2xvciA9IG51bWJlcjtcclxuXHJcbi8vIEFuIHgseSB0dXBsZS5cclxudHlwZSBQb2ludCA9IFtudW1iZXIsIG51bWJlcl07XHJcbnR5cGUgU2l6ZSA9IFtudW1iZXIsIG51bWJlcl07XHJcblxyXG4vLyBNYXBwaW5nIG9mIFRpbGVJbmRleCAtPiBjb2xvciBvZiB0aGUgdG9wLWxlZnQgcGl4ZWwgb2YgdGhhdCB0aWxlLlxyXG50eXBlIFRpbGVDb2xvck1hcHBpbmcgPSBDb2xvcltdO1xyXG5cclxuLy8gTWFuYWdlcyByZWxhdGl2ZSBmcmVxdWVuY2llcyBvZiBhbGwgdGhlIHRpbGVzLiBUaGUgaGlnaGVyIGEgdGlsZSdzIGZyZXF1ZW5jeSxcclxuLy8gdGhlIG1vcmUgbGlrZWx5IHRoYXQgdGlsZSB3aWxsIGFwcGVhciBpbiB0aGUgb3V0cHV0LlxyXG5jbGFzcyBGcmVxdWVuY3lIaW50cyB7XHJcbiAgY29uc3RydWN0b3IoY291bnRzOiBudW1iZXJbXSkge1xyXG4gICAgdGhpcy5fdGlsZVdlaWdodHMgPSBjb3VudHM7XHJcbiAgfVxyXG4gIC8vIHdbbl0gLSB0aGUgcmVsYXRpdmUgZnJlcXVlbmN5IG9mIHRoZSBnaXZlbiB0aWxlLiBUaGlzIGlzIHNpbXBseSB0aGUgbnVtYmVyIG9mXHJcbiAgLy8gdGltZXMgaXQgYXBwZWFycyBpbiB0aGUgc291cmNlIGltYWdlLlxyXG4gIHdlaWdodEZvclRpbGUoaW5kZXg6IFRpbGVJbmRleCk6IEZyZXF1ZW5jeVdlaWdodCB7XHJcbiAgICByZXR1cm4gdGhpcy5fdGlsZVdlaWdodHNbaW5kZXhdO1xyXG4gIH1cclxuICBnZXQgbnVtVGlsZXMoKSB7IHJldHVybiB0aGlzLl90aWxlV2VpZ2h0cy5sZW5ndGg7IH1cclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfdGlsZVdlaWdodHM6IEZyZXF1ZW5jeVdlaWdodFtdID0gW107XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc3VtV2VpZ2h0OiBGcmVxdWVuY3lXZWlnaHQgPSAwO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgX3N1bVdlaWdodFRpbWVzTG9nV2VpZ2h0OiBudW1iZXIgPSAwO1xyXG59XHJcblxyXG4vLyBNYW5hZ2VzIHJ1bGVzIGZvciB3aGljaCB0aWxlcyBhcmUgYWxsb3dlZCB0byBiZSBhZGphY2VudCB0byB3aGljaCBvdGhlciB0aWxlcywgaW4gYSBnaXZlbiBkaXJlY3Rpb24uXHJcbmNsYXNzIEFkamFjZW5jeVJ1bGVzIHtcclxuICBjb25zdHJ1Y3Rvcih0aWxlczogVGlsZVtdKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGlsZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICBmb3IgKGxldCBkaXIgb2YgRGlyZWN0aW9uLml0ZW1zKSB7XHJcbiAgICAgICAgICBpZiAoQWRqYWNlbmN5UnVsZXMuX2lzQ29tcGF0aWJsZSh0aWxlc1tpXSwgdGlsZXNbal0sIGRpcikpXHJcbiAgICAgICAgICAgIHRoaXMuX2FsbG93KGksIGosIGRpcik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGdldCBudW1UaWxlcygpIHsgcmV0dXJuIHRoaXMuX2FsbG93ZWQubGVuZ3RoOyB9XHJcbiAgLy8gUmV0dXJucyB0cnVlIGlmIHdlIGNhbiBwbGFjZSB0aWxlIGB0b2AgaW4gdGhlIGRpcmVjdGlvbiBgZGlyYCBmcm9tIGBmcm9tYC5cclxuICBpc0FsbG93ZWQoZnJvbTogVGlsZUluZGV4LCB0bzogVGlsZUluZGV4LCBkaXI6IERpcmVjdGlvbik6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIC8vIFJldHVybnMgYW4gaXRlcmF0b3Igb2YgYWxsIHRoZSB0aWxlcyB3aGljaCBjYW4gYmUgcGxhY2VkIG9uZSBzcGFjZSBpbiBkaXJlY3Rpb24gYGRpcmBcclxuICAvLyBmcm9tIHRpbGUgYGZyb21gLlxyXG4gICphbGxvd2VkVGlsZXMoZnJvbTogVGlsZUluZGV4LCBkaXI6IERpcmVjdGlvbikge1xyXG4gICAgbGV0IGFsbG93ZWQgPSB0aGlzLl9hbGxvd2VkW2Zyb21dW2Rpcl07XHJcbiAgICBmb3IgKGxldCB0aWxlIG9mIGFsbG93ZWQpXHJcbiAgICAgIHlpZWxkIHRpbGU7XHJcbiAgfVxyXG5cclxuICAvLyBSZXR1cm5zIHRydWUgaWYgdGlsZSB3ZSBjYW4gcGxhY2UgdGlsZSBgYmAgaW4gdGhlIGRpcmVjdGlvbiBgZGlyYCBmcm9tIGBhYC5cclxuICBwcml2YXRlIHN0YXRpYyBfaXNDb21wYXRpYmxlKGE6IFRpbGUsIGI6IFRpbGUsIGRpcjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XHJcbiAgICBsZXQgb2Zmc2V0ID0gRGlyZWN0aW9uLnRvT2Zmc2V0W2Rpcl07XHJcbiAgICBmb3IgKGxldCBbYXgsIGF5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy50aWxlU2l6ZSwgY29uZmlnLnRpbGVTaXplXSkpIHtcclxuICAgICAgbGV0IFtieCwgYnldID0gW2F4IC0gb2Zmc2V0WzBdLCBheSAtIG9mZnNldFsxXV07XHJcbiAgICAgIGlmIChieCA8IDAgfHwgYnkgPCAwIHx8IGJ4ID49IGNvbmZpZy50aWxlU2l6ZSB8fCBieSA+PSBjb25maWcudGlsZVNpemUpXHJcbiAgICAgICAgY29udGludWU7ICAvLyBub3QgYW4gb3ZlcmxhcHBpbmcgcmVnaW9uLCBpZ25vcmVcclxuICAgICAgaWYgKGEuZ2V0UGl4ZWwoW2F4LCBheV0pICE9IGIuZ2V0UGl4ZWwoW2J4LCBieV0pKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICAvLyBBZGRzIGEgbmV3IHJ1bGUgdG8gdGhlIHJ1bGVzZXQuXHJcbiAgcHJpdmF0ZSBfYWxsb3coZnJvbTogVGlsZUluZGV4LCB0bzogVGlsZUluZGV4LCBkaXI6IERpcmVjdGlvbik6IHZvaWQge1xyXG4gICAgaWYgKCF0aGlzLl9hbGxvd2VkW2Zyb21dKSB0aGlzLl9hbGxvd2VkW2Zyb21dID0gW107XHJcbiAgICBpZiAoIXRoaXMuX2FsbG93ZWRbZnJvbV1bZGlyXSkgdGhpcy5fYWxsb3dlZFtmcm9tXVtkaXJdID0gW107XHJcbiAgICB0aGlzLl9hbGxvd2VkW2Zyb21dW2Rpcl0ucHVzaCh0byk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF9hbGxvd2VkOiBUaWxlSW5kZXhbXVtdW10gPSBbXTsgLy8gX2FsbG93ZWRbZnJvbV1bZGlyXSA9IFt0aWxlSW5kaWNlcy4uLl1cclxufVxyXG5cclxuLy8gUGl4ZWwgZGF0YSBmb3IgYSBUaWxlLiBPbmx5IHVzZWQgZHVyaW5nIHByZS1wcm9jZXNzaW5nLiBEdXJpbmcgdGhlIGFjdHVhbCBhbGdvcml0aG0sXHJcbi8vIHdlIHJlZmVyIHRvIHRpbGVzIGJ5IGluZGV4LiBUaGUgQWRqYWNlbmN5UnVsZXMgYW5kIEZyZXF1ZW5jeUhpbnRzIGdvdmVybiBob3cgd2VcclxuLy8gY2FuIHBsYWNlIHRpbGVzIGluIHRoZSBncmlkLCBhbmQgdGhlIFRpbGVDb2xvck1hcHBpbmcgdGVsbHMgdXMgd2hhdCBjb2xvciB0byB1c2UuXHJcbmNsYXNzIFRpbGUge1xyXG4gIHRvcExlZnRQaXhlbCgpOiBDb2xvciB7IHJldHVybiB0aGlzLl9waXhlbHNbMF07IH1cclxuICBnZXRQaXhlbChbeCwgeV06IFBvaW50KTogQ29sb3IgeyByZXR1cm4gdGhpcy5fcGl4ZWxzW3ggKyB5ICogY29uZmlnLnRpbGVTaXplXTsgfVxyXG5cclxuICAvLyBNYXAgZG9lcyBub3QgcHJvdmlkZSBhIHdheSB0byBwcm92aWRlIG91ciBvd24gaGFzaCBvciBlcXVhbGl0eSBmdW5jdGlvbnMsXHJcbiAgLy8gc28gd2UgZ2VuZXJhdGUgb3VyIG93biBrZXkgYmFzZWQgb24gdGhlIHRpbGUncyBwaXhlbCBkYXRhLlxyXG4gIGdldCBtYXBLZXkoKTogc3RyaW5nIHtcclxuICAgIGlmICghdGhpcy5fbWFwS2V5KVxyXG4gICAgICB0aGlzLl9tYXBLZXkgPSB0aGlzLl9waXhlbHMuam9pbihcIixcIik7XHJcbiAgICByZXR1cm4gdGhpcy5fbWFwS2V5O1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJucyB0aGUgVGlsZSBmb3VuZCBhdCB0aGUgZ2l2ZW4gY29vcmQgaW4gdGhlIGltYWdlLCB3cmFwcGluZyBjb29yZGluYXRlcy5cclxuICBzdGF0aWMgZnJvbUltYWdlRGF0YShpbWFnZURhdGE6IE15SW1hZ2VEYXRhLCBbaXgsIGl5XTogUG9pbnQpOiBUaWxlIHtcclxuICAgIGxldCB0aWxlID0gbmV3IFRpbGU7XHJcbiAgICBmb3IgKGxldCBbdHgsIHR5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy50aWxlU2l6ZSwgY29uZmlnLnRpbGVTaXplXSkpXHJcbiAgICAgIHRpbGUuX3BpeGVsc1twb2ludFRvSW5kZXgoW3R4LCB0eV0sIGNvbmZpZy50aWxlU2l6ZSldID0gaW1hZ2VEYXRhLmdldChbKGl4ICsgdHgpICUgaW1hZ2VEYXRhLndpZHRoLCAoaXkgKyB0eSkgJSBpbWFnZURhdGEuaGVpZ2h0XSk7XHJcbiAgICByZXR1cm4gdGlsZTtcclxuICB9XHJcbiAgLy8gUmV0dXJucyBhIGNvcHkgb2YgYG9yaWdgIHJvdGF0ZWQgOTAgZGVncmVlcyBjbG9ja3dpc2UuXHJcbiAgc3RhdGljIHJvdGF0ZWQob3JpZzogVGlsZSk6IFRpbGUge1xyXG4gICAgLy8gKHgseSkgPT4gKHcteSx4KVxyXG4gICAgbGV0IHRpbGUgPSBuZXcgVGlsZTtcclxuICAgIGZvciAobGV0IFt4LCB5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy50aWxlU2l6ZSwgY29uZmlnLnRpbGVTaXplXSkpXHJcbiAgICAgIHRpbGUuX3BpeGVsc1twb2ludFRvSW5kZXgoW2NvbmZpZy50aWxlU2l6ZSAtIDEgLSB5LCB4XSwgY29uZmlnLnRpbGVTaXplKV0gPSBvcmlnLl9waXhlbHNbcG9pbnRUb0luZGV4KFt4LCB5XSwgY29uZmlnLnRpbGVTaXplKV07XHJcbiAgICByZXR1cm4gdGlsZTtcclxuICB9XHJcbiAgLy8gUmV0dXJucyBhIGNvcHkgb2YgYG9yaWdgIGZsaXBwZWQgdmVydGljYWxseS5cclxuICBzdGF0aWMgZmxpcHBlZChvcmlnOiBUaWxlKTogVGlsZSB7XHJcbiAgICAvLyAoeCx5KSA9PiAoeCx3LXkpXHJcbiAgICBsZXQgdGlsZSA9IG5ldyBUaWxlO1xyXG4gICAgZm9yIChsZXQgW3gsIHldIG9mIHJlY3RSYW5nZShbY29uZmlnLnRpbGVTaXplLCBjb25maWcudGlsZVNpemVdKSlcclxuICAgICAgdGlsZS5fcGl4ZWxzW3BvaW50VG9JbmRleChbeCwgY29uZmlnLnRpbGVTaXplIC0gMSAtIHldLCBjb25maWcudGlsZVNpemUpXSA9IG9yaWcuX3BpeGVsc1twb2ludFRvSW5kZXgoW3gsIHldLCBjb25maWcudGlsZVNpemUpXTtcclxuICAgIHJldHVybiB0aWxlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfcGl4ZWxzOiBDb2xvcltdID0gW107XHJcbiAgcHJpdmF0ZSBfbWFwS2V5OiBzdHJpbmc7XHJcbn1cclxuXHJcbi8vIE1hcHMgVGlsZSB0byBhcHBlYXJhbmNlIGNvdW50IGZvciB0aGF0IHRpbGUuXHJcbmNsYXNzIFRpbGVDb3VudE1hcCBleHRlbmRzIE1hcDxzdHJpbmcsIHt0aWxlOiBUaWxlLCBjb3VudDogbnVtYmVyfT4ge1xyXG4gIGFkZFRpbGUodGlsZTogVGlsZSk6IG51bWJlciB7XHJcbiAgICBsZXQgdmFsdWUgPSB0aGlzLmdldCh0aWxlLm1hcEtleSkgfHwge3RpbGU6IHRpbGUsIGNvdW50OiAwfTtcclxuICAgIHZhbHVlLmNvdW50Kys7XHJcbiAgICB0aGlzLnNldCh0aWxlLm1hcEtleSwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHZhbHVlLmNvdW50O1xyXG4gIH1cclxufVxyXG5cclxuLy8gUHJlLXByb2Nlc3Npbmcgc3RlcC4gUmVhZHMgYW4gaW1hZ2UgYW5kIGN1dHMgaXQgdXAgaW50byBOeE4gdGlsZXMgKE49dGlsZVNpemUpLlxyXG4vLyBBbHNvIGNhbGN1bGF0ZXMgdGhlIHJ1bGVzIHRoYXQgYXJlIGZlZCBpbnRvIHRoZSBtYWluIGFsZ29yaXRobS5cclxuZnVuY3Rpb24gcGFyc2VJbWFnZShpbWFnZURhdGE6IE15SW1hZ2VEYXRhKTogW0FkamFjZW5jeVJ1bGVzLCBGcmVxdWVuY3lIaW50cywgVGlsZUNvbG9yTWFwcGluZ10ge1xyXG4gIGxldCB0aWxlTWFwID0gbmV3IFRpbGVDb3VudE1hcCgpO1xyXG4gIGZvciAobGV0IHAgb2YgcmVjdFJhbmdlKFtpbWFnZURhdGEud2lkdGgsIGltYWdlRGF0YS5oZWlnaHRdKSkge1xyXG4gICAgbGV0IHRpbGUgPSBUaWxlLmZyb21JbWFnZURhdGEoaW1hZ2VEYXRhLCBwKTtcclxuICAgIGxldCBjb3VudCA9IHRpbGVNYXAuYWRkVGlsZSh0aWxlKTtcclxuICAgIGlmIChjb25maWcuaW5jbHVkZVJvdGF0ZWRBbmRGbGlwcGVkKSB7XHJcbiAgICAgIC8vIEFkZCB0aGUgb3RoZXIgMyByb3RhdGlvbnMsIGFuZCB0aGUgNCByb3RhdGlvbnMgb2YgdGhlIGZsaXBwZWQgY2FzZSAoZm9yIDAsIDkwLCAxODAsIGFuZCAyNzAgZGVncmVlcylcclxuICAgICAgbGV0IHN1YnRpbGUgPSB0aWxlO1xyXG4gICAgICB0aWxlTWFwLmFkZFRpbGUoc3VidGlsZSA9IFRpbGUucm90YXRlZChzdWJ0aWxlKSk7XHJcbiAgICAgIHRpbGVNYXAuYWRkVGlsZShzdWJ0aWxlID0gVGlsZS5yb3RhdGVkKHN1YnRpbGUpKTtcclxuICAgICAgdGlsZU1hcC5hZGRUaWxlKHN1YnRpbGUgPSBUaWxlLnJvdGF0ZWQoc3VidGlsZSkpO1xyXG4gICAgICB0aWxlTWFwLmFkZFRpbGUoc3VidGlsZSA9IFRpbGUuZmxpcHBlZCh0aWxlKSk7XHJcbiAgICAgIHRpbGVNYXAuYWRkVGlsZShzdWJ0aWxlID0gVGlsZS5yb3RhdGVkKHN1YnRpbGUpKTtcclxuICAgICAgdGlsZU1hcC5hZGRUaWxlKHN1YnRpbGUgPSBUaWxlLnJvdGF0ZWQoc3VidGlsZSkpO1xyXG4gICAgICB0aWxlTWFwLmFkZFRpbGUoc3VidGlsZSA9IFRpbGUucm90YXRlZChzdWJ0aWxlKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsZXQgdGlsZXM6IFRpbGVbXSA9IFtdO1xyXG4gIGxldCBjb3VudHM6IG51bWJlcltdID0gW107XHJcbiAgZm9yIChsZXQge3RpbGUsIGNvdW50fSBvZiB0aWxlTWFwLnZhbHVlcygpKSB7XHJcbiAgICB0aWxlcy5wdXNoKHRpbGUpO1xyXG4gICAgY291bnRzLnB1c2goY291bnQpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGFkamFjZW5jeVJ1bGVzID0gbmV3IEFkamFjZW5jeVJ1bGVzKHRpbGVzKTtcclxuICBsZXQgZnJlcXVlbmN5SGludHMgPSBuZXcgRnJlcXVlbmN5SGludHMoY291bnRzKTtcclxuICBsZXQgY29sb3JGb3JUaWxlOiBUaWxlQ29sb3JNYXBwaW5nID0gdGlsZXMubWFwKHRpbGUgPT4gdGlsZS50b3BMZWZ0UGl4ZWwoKSk7XHJcblxyXG4gIHJlbmRlclRpbGVzZXQodGlsZXMpO1xyXG4gIHJldHVybiBbYWRqYWNlbmN5UnVsZXMsIGZyZXF1ZW5jeUhpbnRzLCBjb2xvckZvclRpbGVdO1xyXG59XHJcblxyXG4vLyBEcmF3cyB0aGUgdGlsZXNldCB0byB0aGUgY2FudmFzLlxyXG5mdW5jdGlvbiByZW5kZXJUaWxlc2V0KHRpbGVzOiBUaWxlW10pIHtcclxuICBsZXQgYWNyb3NzID0gTWF0aC5mbG9vcihNYXRoLnNxcnQodGlsZXMubGVuZ3RoKSk7XHJcbiAgbGV0IGRvd24gPSBNYXRoLmNlaWwodGlsZXMubGVuZ3RoIC8gYWNyb3NzKTtcclxuICBsZXQgaW1hZ2VEYXRhID0gbmV3IEltYWdlRGF0YSgoY29uZmlnLnRpbGVTaXplKzEpKmFjcm9zcyAtIDEsIChjb25maWcudGlsZVNpemUrMSkqZG93biAtIDEpIGFzIE15SW1hZ2VEYXRhO1xyXG5cclxuICBmb3IgKGxldCBbaSwgal0gb2YgcmVjdFJhbmdlKFthY3Jvc3MsIGRvd25dKSkge1xyXG4gICAgbGV0IHRpbGUgPSBpICsgaiphY3Jvc3M7XHJcbiAgICBpZiAodGlsZSA+PSB0aWxlcy5sZW5ndGgpXHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZm9yIChsZXQgW3gsIHldIG9mIHJlY3RSYW5nZShbY29uZmlnLnRpbGVTaXplLCBjb25maWcudGlsZVNpemVdKSlcclxuICAgICAgaW1hZ2VEYXRhLnNldChbKGNvbmZpZy50aWxlU2l6ZSsxKSppICsgeCwgKGNvbmZpZy50aWxlU2l6ZSsxKSpqICsgeV0sIHRpbGVzW3RpbGVdLmdldFBpeGVsKFt4LHldKSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXJUb0NhbnZhcyhcInRpbGVzZXRcIiwgaW1hZ2VEYXRhKTtcclxufVxyXG5cclxuLy8gUmVwcmVzZW50cyB0aGUgc3RhdGUgb2YgYSBzaW5nbGUgcGl4ZWwgaW4gdGhlIG91dHB1dCwgbWFpbmx5IHdoaWNoIHRpbGVzIGFyZSBwb3NzaWJsZSB0byBiZSBwbGFjZWRcclxuLy8gaW4gdGhpcyBjZWxsLiBQb3NzaWJsZSB0aWxlcyBhcmUgZWxpbWluYXRlZCBhcyB0aGUgYWxnb3JpdGhtIHByb2NlZWRzLCB1bnRpbCBhbGwgY2VsbHMgYXJlIFwiY29sbGFwc2VkXCJcclxuLy8gKGUuZy4gdGhleSBoYXZlIGEgc2luZ2xlIHBvc3NpYmxlIHRpbGUpLlxyXG5jbGFzcyBDZWxsIHtcclxuICAvLyBBbGwgQ2VsbHMgc3RhcnQgdGhlIHNhbWUsIHNvIHdlIGNsb25lIHRoZW0gZnJvbSBhIHRlbXBsYXRlLlxyXG4gIHN0YXRpYyBjcmVhdGVUZW1wbGF0ZShhZGphY2VuY3lSdWxlczogQWRqYWNlbmN5UnVsZXMsIGZyZXF1ZW5jeUhpbnRzOiBGcmVxdWVuY3lIaW50cyk6IENlbGwge1xyXG4gICAgbGV0IGNlbGwgPSBuZXcgQ2VsbDtcclxuICAgIGNlbGwuX3Bvc3NpYmxlID0gbmV3IEFycmF5KGZyZXF1ZW5jeUhpbnRzLm51bVRpbGVzKS5maWxsKHRydWUpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmVxdWVuY3lIaW50cy5udW1UaWxlczsgaSsrKSB7XHJcbiAgICAgIGxldCB3ID0gZnJlcXVlbmN5SGludHMud2VpZ2h0Rm9yVGlsZShpKTtcclxuICAgICAgY2VsbC5fc3VtV2VpZ2h0ICs9IHc7XHJcbiAgICAgIGNlbGwuX3N1bVdlaWdodFRpbWVzTG9nV2VpZ2h0ICs9IHcgKiBNYXRoLmxvZzIodyk7XHJcbiAgICB9XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkamFjZW5jeVJ1bGVzLm51bVRpbGVzOyBpKyspIHtcclxuICAgICAgY2VsbC5fdGlsZUVuYWJsZXJDb3VudHNbaV0gPSBbMCwgMCwgMCwgMF07IC8vIDQgZGlyZWN0aW9uc1xyXG4gICAgICBmb3IgKGxldCBkaXIgb2YgRGlyZWN0aW9uLml0ZW1zKSB7XHJcbiAgICAgICAgZm9yIChsZXQgaiBvZiBhZGphY2VuY3lSdWxlcy5hbGxvd2VkVGlsZXMoaSwgZGlyKSkge1xyXG4gICAgICAgICAgY2VsbC5fdGlsZUVuYWJsZXJDb3VudHNbaV1bZGlyXSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNlbGw7XHJcbiAgfVxyXG4gIC8vIFJldHVybnMgYSBkZWVwIGNvcHkgb2YgdGhlIHRlbXBsYXRlLlxyXG4gIHN0YXRpYyBmcm9tVGVtcGxhdGUodGVtcGxhdGU6IENlbGwpOiBDZWxsIHtcclxuICAgIGxldCBjZWxsID0gbmV3IENlbGw7XHJcbiAgICBjZWxsLl9wb3NzaWJsZSA9IEFycmF5LmZyb20odGVtcGxhdGUuX3Bvc3NpYmxlKTtcclxuICAgIGNlbGwuX3N1bVdlaWdodCA9IHRlbXBsYXRlLl9zdW1XZWlnaHQ7XHJcbiAgICBjZWxsLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodCA9IHRlbXBsYXRlLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodDtcclxuICAgIGNlbGwuX3RpbGVFbmFibGVyQ291bnRzID0gQXJyYXkuZnJvbSh0ZW1wbGF0ZS5fdGlsZUVuYWJsZXJDb3VudHMsIGlubmVyID0+IEFycmF5LmZyb20oaW5uZXIpKTtcclxuICAgIHJldHVybiBjZWxsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gIC8vIFJldHVybnMgYW4gaXRlcmF0b3Igb2YgYWxsIHRoZSB0aWxlcyB0aGF0IGNhbiBiZSBwbGFjZWQgaW4gdGhpcyBDZWxsLlxyXG4gICpwb3NzaWJsZVRpbGVzKCkge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9wb3NzaWJsZS5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAodGhpcy5fcG9zc2libGVbaV0pXHJcbiAgICAgICAgeWllbGQgaTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIFBpY2tzIGEgdGlsZSBhdCByYW5kb20gZnJvbSB0aGUgcmVtYWluaW5nIHBvc3NpYmxlIHRpbGVzLCB3aXRoIGhpZ2hlclxyXG4gIC8vIGZyZXF1ZW5jeSB0aWxlcyBiZWluZyBtb3JlIGxpa2VseSB0byBiZSBwaWNrZWQuXHJcbiAgY2hvb3NlVGlsZShmcmVxdWVuY3lIaW50czogRnJlcXVlbmN5SGludHMpOiBUaWxlSW5kZXgge1xyXG4gICAgbGV0IGNob3NlbldlaWdodCA9IE1hdGgucmFuZG9tKCkgKiB0aGlzLl9zdW1XZWlnaHQ7XHJcbiAgICBmb3IgKGxldCB0aWxlIG9mIHRoaXMucG9zc2libGVUaWxlcygpKSB7XHJcbiAgICAgIGNob3NlbldlaWdodCAtPSBmcmVxdWVuY3lIaW50cy53ZWlnaHRGb3JUaWxlKHRpbGUpO1xyXG4gICAgICBpZiAoY2hvc2VuV2VpZ2h0IDwgMClcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2hvc2VuVGlsZSA9IHRpbGU7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJjZWxsIHdlaWdodHMgd2VyZSBpbnZhbGlkXCIpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVtb3ZlcyBhIHRpbGUgZnJvbSB0aGUgbGlzdCBvZiBwb3NzaWJsZSB0aWxlcy5cclxuICByZW1vdmVUaWxlKHRpbGU6IFRpbGVJbmRleCwgZnJlcXVlbmN5SGludHM6IEZyZXF1ZW5jeUhpbnRzIHwgbnVsbCA9IG51bGwpOiB2b2lkIHtcclxuICAgIHRoaXMuX3Bvc3NpYmxlW3RpbGVdID0gZmFsc2U7XHJcbiAgICBpZiAoZnJlcXVlbmN5SGludHMpIHtcclxuICAgICAgbGV0IHdlaWdodCA9IGZyZXF1ZW5jeUhpbnRzLndlaWdodEZvclRpbGUodGlsZSk7XHJcbiAgICAgIHRoaXMuX3N1bVdlaWdodCAtPSB3ZWlnaHQ7XHJcbiAgICAgIHRoaXMuX3N1bVdlaWdodFRpbWVzTG9nV2VpZ2h0IC09IHdlaWdodCAqIE1hdGgubG9nMih3ZWlnaHQpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gUmV0dXJucyB0cnVlIGlmIHdlJ3ZlIGxvY2tlZCBpbiBhIGNob2ljZSBmb3IgdGhpcyB0aWxlIChlLmcuIGNob29zZVRpbGUgd2FzIGNhbGxlZCkuXHJcbiAgZ2V0IGlzQ29sbGFwc2VkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fY2hvc2VuVGlsZSAhPSAtMTsgfVxyXG5cclxuICAvLyBSZXR1cm5zIHRydWUgb2YgdGhlcmUgYXJlIG5vIHBvc3NpYmxlIHRpbGVzIHJlbWFpbmluZyB0byBjaG9vc2UuIFRoaXMgc2lnbmFsc1xyXG4gIC8vIGEgY29udHJhZGljdGlvbiB3YXMgcmVhY2hlZC5cclxuICBnZXQgbm9Qb3NzaWJsZVRpbGVzKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fc3VtV2VpZ2h0ID09IDA7IH1cclxuICAvLyBlbnRyb3B5ID0gbG9nKFcpIC0gc3VtKHdbbl0qbG9nKHdbbl0pKS9XIHdoZXJlIFcgPSBzdW0od1tuXSlcclxuICBnZXQgZW50cm9weSgpOiBudW1iZXIgeyByZXR1cm4gTWF0aC5sb2cyKHRoaXMuX3N1bVdlaWdodCkgLSB0aGlzLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodCAvIHRoaXMuX3N1bVdlaWdodDsgfVxyXG4gIGVuYWJsZXJDb3VudHNGb3JUaWxlKHRpbGU6IFRpbGVJbmRleCk6IG51bWJlcltdIHsgcmV0dXJuIHRoaXMuX3RpbGVFbmFibGVyQ291bnRzW3RpbGVdOyB9XHJcblxyXG4gIC8vIF9wb3NzaWJsZVt0aWxlSW5kZXhdIGlzIHRydWUgaWYgdGlsZUluZGV4IGNhbiBiZSBwbGFjZWQgaW4gdGhpcyBjZWxsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAgcHJpdmF0ZSBfcG9zc2libGU6IGJvb2xlYW5bXSA9IFtdO1xyXG4gIHByaXZhdGUgX2Nob3NlblRpbGU6IFRpbGVJbmRleCA9IC0xO1xyXG4gIC8vIENhY2hlIG9mIHN1bSh3W25dKSwgdXNlZCBpbiBlbnRyb3B5IGNhbGN1bGF0aW9ucy5cclxuICBwcml2YXRlIF9zdW1XZWlnaHQ6IEZyZXF1ZW5jeVdlaWdodCA9IDA7XHJcbiAgLy8gQ2FjaGUgb2Ygc3VtKHdbbl0qbG9nKHdbbl0pKSwgdXNlZCBpbiBlbnRyb3B5IGNhbGN1bGF0aW9ucy5cclxuICBwcml2YXRlIF9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodDogbnVtYmVyID0gMDtcclxuICAgLy8gdGlsZUVuYWJsZXJDb3VudHNbdGlsZUluZGV4XVtkaXJdID0gZm9yIGFkamFjZW50Q2VsbCBpbiBkaXJlY3Rpb24gYGRpcmAgZnJvbSB0aGlzIGNlbGwsIHRoaXMgaXMgdGhlIGNvdW50XHJcbiAgIC8vIG9mIHBvc3NpYmxlIHRpbGVzIGluIGFkamFjZW50Q2VsbCB0aGF0IGFyZSBjb21wYXRpYmxlIHdpdGggYHRpbGVJbmRleGAgaW4gdGhpcyBjZWxsLiBVc2VkIGluIHByb3BhZ2F0aW9uLlxyXG4gIHByaXZhdGUgX3RpbGVFbmFibGVyQ291bnRzOiBudW1iZXJbXVtdID0gW107XHJcbn1cclxuXHJcbmNsYXNzIENvcmVTdGF0ZSB7XHJcbiAgY29uc3RydWN0b3IoYSwgZiwgYykge1xyXG4gICAgdGhpcy5fYWRqYWNlbmN5UnVsZXMgPSBhO1xyXG4gICAgdGhpcy5fZnJlcXVlbmN5SGludHMgPSBmO1xyXG4gICAgdGhpcy5fY29sb3JGb3JUaWxlID0gYztcclxuICB9XHJcblxyXG4gIC8vIEluaXRhbGl6ZXMgdGhlIGdyaWQsIGV0Yy5cclxuICBpbml0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5fZW50cm9weUhlYXAgPSBuZXcgSGVhcCgoYSwgYikgPT4gYS5lbnRyb3B5IC0gYi5lbnRyb3B5KTtcclxuICAgIGxldCBjZWxsVGVtcGxhdGUgPSBDZWxsLmNyZWF0ZVRlbXBsYXRlKHRoaXMuX2FkamFjZW5jeVJ1bGVzLCB0aGlzLl9mcmVxdWVuY3lIaW50cyk7XHJcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGNvbmZpZy5vdXRwdXRIZWlnaHQ7IHkrKykge1xyXG4gICAgICB0aGlzLl9ncmlkW3ldID0gW107XHJcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgY29uZmlnLm91dHB1dFdpZHRoOyB4KyspIHtcclxuICAgICAgICB0aGlzLl9ncmlkW3ldW3hdID0gQ2VsbC5mcm9tVGVtcGxhdGUoY2VsbFRlbXBsYXRlKTtcclxuICAgICAgICB0aGlzLl9lbnRyb3B5SGVhcC5hZGQoe3BvczogW3gsIHldLCBlbnRyb3B5OiB0aGlzLl9ncmlkW3ldW3hdLmVudHJvcHl9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSGFuZGxlcyBhIHNpbmdsZSBzdGVwIG9mIHRoZSBXRkMgYWxnb3JpdGhtOlxyXG4gIC8vIDEuIFBpY2sgdGhlIGNlbGwgd2l0aCBtaW5pbXVtIGVudHJvcHkuXHJcbiAgLy8gMi4gQ2hvb3NlIGEgdGlsZSBhdCByYW5kb20gZm9yIHRoYXQgY2VsbCBhbmQgZWxpbWluYXRlIGFsbCBvdGhlciBvcHRpb25zLlxyXG4gIC8vIDMuIFByb3BhZ2F0ZSB0aGUgY29uc2VxdWVuY2VzLCByZWN1cnNpdmVseS5cclxuICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgbW9yZSB3b3JrIHRvIGRvLCBmYWxzZSBpZiB3ZSdyZSBkb25lLlxyXG4gIHN0ZXAoKTogYm9vbGVhbiB7XHJcbiAgICBsZXQgcCA9IHRoaXMuX2Nob29zZUNlbGwoKTtcclxuICAgIGlmICghcClcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgbGV0IHJlbW92YWxzID0gdGhpcy5fY29sbGFwc2VDZWxsKHApO1xyXG4gICAgcmV0dXJuIHRoaXMuX3Byb3BhZ2F0ZShyZW1vdmFscyk7XHJcbiAgfVxyXG5cclxuICAvLyBEcmF3cyB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZ2VuZXJhdGVkIGltYWdlIHRvIG91ciBvdXRwdXQgY2FudmFzLlxyXG4gIC8vIEZvciBjb2xsYXBzZWQgY2VsbHMsIHVzZSB0aGUgdG9wLWxlZnQgcGl4ZWwgdmFsdWUgb2YgdGhlIHRpbGUgdGhhdCB3YXMgY2hvc2VuIGZvciB0aGF0IGNlbGwuXHJcbiAgLy8gRm9yIHVuY29sbGFwc2VkIGNlbGxzLCB1c2UgYSB3ZWlnaHRlZCBhdmVyYWdlIG9mIHRoYXQgY2VsbCdzIHBvc3NpYmxlIHRpbGVzLlxyXG4gIHJlbmRlcigpOiB2b2lkIHtcclxuICAgIGxldCBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGNvbmZpZy5vdXRwdXRXaWR0aCwgY29uZmlnLm91dHB1dEhlaWdodCkgYXMgTXlJbWFnZURhdGE7XHJcblxyXG4gICAgZm9yIChsZXQgW3gseV0gb2YgcmVjdFJhbmdlKFtjb25maWcub3V0cHV0V2lkdGgsIGNvbmZpZy5vdXRwdXRIZWlnaHRdKSkge1xyXG4gICAgICBsZXQgY29sb3I6IENvbG9yID0gMDtcclxuICAgICAgbGV0IHN1bVdlaWdodCA9IDA7XHJcbiAgICAgIGZvciAobGV0IHRpbGUgb2YgdGhpcy5fZ3JpZFt5XVt4XS5wb3NzaWJsZVRpbGVzKCkpIHtcclxuICAgICAgICBsZXQgdyA9IHRoaXMuX2ZyZXF1ZW5jeUhpbnRzLndlaWdodEZvclRpbGUodGlsZSk7XHJcbiAgICAgICAgY29sb3IgKz0gdGhpcy5fY29sb3JGb3JUaWxlW3RpbGVdICogdztcclxuICAgICAgICBzdW1XZWlnaHQgKz0gdztcclxuICAgICAgfVxyXG4gICAgICBjb2xvciA9IChjb2xvciAvIHN1bVdlaWdodCkgfCAweGZmOyAvLyBmdWxsIGFscGhhXHJcbiAgICAgIGltYWdlRGF0YS5zZXQoW3gsIHldLCBjb2xvcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyVG9DYW52YXMoXCJvdXRwdXRcIiwgaW1hZ2VEYXRhKTtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIGxvd2VzdC1lbnRyb3B5IGNlbGwsIG9yIG51bGwgaWYgYWxsIGNlbGxzIGhhdmUgYmVlbiBjb2xsYXBzZWQuXHJcbiAgcHJpdmF0ZSBfY2hvb3NlQ2VsbCgpOiBQb2ludCB8IG51bGwge1xyXG4gICAgbGV0IGNlbGw6IEhlYXBDZWxsIHwgdW5kZWZpbmVkO1xyXG4gICAgd2hpbGUgKGNlbGwgPSB0aGlzLl9lbnRyb3B5SGVhcC5wb3AoKSkge1xyXG4gICAgICBsZXQgW3gseV0gPSBjZWxsLnBvcztcclxuICAgICAgaWYgKCF0aGlzLl9ncmlkW3ldW3hdLmlzQ29sbGFwc2VkKVxyXG4gICAgICAgIHJldHVybiBjZWxsLnBvcztcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgLy8gQ2hvb3NlcyBhIHRpbGUgZm9yIHRoZSBnaXZlbiBjZWxsLCBhbmQgcmV0dXJuIGEgbGlzdCByZXByZXNlbnRpbmcgdGhlIHJlbW92YWwgb2ZcclxuICAvLyB0aGUgdW5jaG9zZW4gdGlsZXMuXHJcbiAgcHJpdmF0ZSBfY29sbGFwc2VDZWxsKFt4LCB5XTogUG9pbnQpOiBSZW1vdmVFdmVudFtdIHtcclxuICAgIGxldCBjZWxsID0gdGhpcy5fZ3JpZFt5XVt4XTtcclxuICAgIGxldCBjaG9zZW5UaWxlID0gY2VsbC5jaG9vc2VUaWxlKHRoaXMuX2ZyZXF1ZW5jeUhpbnRzKTtcclxuICAgIGxldCByZW1vdmFsczogUmVtb3ZlRXZlbnRbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgdGlsZSBvZiBjZWxsLnBvc3NpYmxlVGlsZXMoKSkge1xyXG4gICAgICBpZiAoY2hvc2VuVGlsZSAhPSB0aWxlKSB7XHJcbiAgICAgICAgY2VsbC5yZW1vdmVUaWxlKHRpbGUpO1xyXG4gICAgICAgIHJlbW92YWxzLnB1c2goeyBwb3M6IFt4LCB5XSwgdGlsZTogdGlsZSB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlbW92YWxzO1xyXG4gIH1cclxuXHJcbiAgLy8gUHJvcGFnYXRlcyB0aGUgY29uc2VxdWVuY2VzIG9mIHJlbW92aW5nIHRpbGVzIGZyb20gYSBjZWxsJ3MgcG9zc2libGUgbGlzdC5cclxuICAvLyBUaGlzIGludm9sdmVzIHBvc3NpYmx5IHJlbW92aW5nIG90aGVyIHRpbGVzIGZyb20gYWRqYWNlbnQgY2VsbHMgd2hlbiB0aGV5IGFyZVxyXG4gIC8vIGluY29tcGF0aWJsZSB3aXRoIHRoZSByZW1haW5pbmcgdGlsZXMgYXJvdW5kIHRoZW0uIFRob3NlIHJlbW92YWxzIGFyZSB0aGVuXHJcbiAgLy8gcHJvcGFnYXRlZCBpbiB0dXJuLCB1bnRpbCB0aGUgZ3JpZCByZWFjaGVzIGEgc3RlYWR5IHN0YXRlLlxyXG4gIHByaXZhdGUgX3Byb3BhZ2F0ZShyZW1vdmFsczogUmVtb3ZlRXZlbnRbXSk6IGJvb2xlYW4ge1xyXG4gICAgd2hpbGUgKHJlbW92YWxzLmxlbmd0aCA+IDApIHtcclxuICAgICAgbGV0IHsgcG9zOiBbcngsIHJ5XSwgdGlsZTogcmVtb3ZlZFRpbGUgfSA9IHJlbW92YWxzLnNoaWZ0KCkgYXMgUmVtb3ZlRXZlbnQ7XHJcbiAgICAgIGZvciAobGV0IGRpciBvZiBEaXJlY3Rpb24uaXRlbXMpIHtcclxuICAgICAgICBsZXQgb2Zmc2V0ID0gRGlyZWN0aW9uLnRvT2Zmc2V0W2Rpcl07XHJcbiAgICAgICAgbGV0IG9wcG9zaXRlRGlyID0gRGlyZWN0aW9uLnRvT3Bwb3NpdGVbZGlyXTtcclxuICAgICAgICBsZXQgW2F4LCBheV0gPSBbcnggKyBvZmZzZXRbMF0sIHJ5ICsgb2Zmc2V0WzFdXTtcclxuICAgICAgICBpZiAoIShheCA+PSAwICYmIGF5ID49IDAgJiYgYXggPCBjb25maWcub3V0cHV0V2lkdGggJiYgYXkgPCBjb25maWcub3V0cHV0SGVpZ2h0KSlcclxuICAgICAgICAgIGNvbnRpbnVlOyAgLy8gb3V0IG9mIGJvdW5kc1xyXG4gICAgICAgIGxldCBhZGphY2VudENlbGwgPSB0aGlzLl9ncmlkW2F5XVtheF07XHJcbiAgICAgICAgaWYgKGFkamFjZW50Q2VsbC5pc0NvbGxhcHNlZClcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGZvciAobGV0IGVuYWJsZWRUaWxlIG9mIHRoaXMuX2FkamFjZW5jeVJ1bGVzLmFsbG93ZWRUaWxlcyhyZW1vdmVkVGlsZSwgZGlyKSkge1xyXG4gICAgICAgICAgLy8gRm9yIGV2ZXJ5IHRpbGUgdGhhdCB3YXMgZW5hYmxlZCBieSB0aGUgcmVtb3ZlZCB0aWxlLCBkZWNyZW1lbnQgaXRzIGVuYWJsZXIgY291bnQuXHJcbiAgICAgICAgICAvLyBJZiBhIGNvdW50IHJlYWNoZXMgemVybywgdGhhdCB0aWxlIGlzIGltcG9zc2libGUsIHNvIHJlbW92ZSBpdC5cclxuICAgICAgICAgIGxldCBlbmFibGVyQ291bnRzID0gYWRqYWNlbnRDZWxsLmVuYWJsZXJDb3VudHNGb3JUaWxlKGVuYWJsZWRUaWxlKTtcclxuICAgICAgICAgIGxldCB3YXNaZXJvID0gZW5hYmxlckNvdW50cy5zb21lKGNvdW50ID0+IGNvdW50IDw9IDApO1xyXG4gICAgICAgICAgbGV0IGlzWmVybyA9IC0tZW5hYmxlckNvdW50c1tvcHBvc2l0ZURpcl0gPT0gMDtcclxuXHJcbiAgICAgICAgICAvLyBPbmx5IHJlbW92ZSB0aGUgdGlsZSBpZiB0aGlzIGlzIHRoZSBmaXJzdCBkaXJlY3Rpb24gdG8gcmVhY2ggMCBlbmFibGVycyAob3RoZXJ3aXNlXHJcbiAgICAgICAgICAvLyB3ZSd2ZSBhbHJlYWR5IHJlbW92ZWQgaXQpLlxyXG4gICAgICAgICAgaWYgKGlzWmVybyAmJiAhd2FzWmVybykge1xyXG4gICAgICAgICAgICBhZGphY2VudENlbGwucmVtb3ZlVGlsZShlbmFibGVkVGlsZSwgdGhpcy5fZnJlcXVlbmN5SGludHMpO1xyXG4gICAgICAgICAgICBpZiAoYWRqYWNlbnRDZWxsLm5vUG9zc2libGVUaWxlcykge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYENvbnRyYWRpY3Rpb24gYXQgY2VsbCAke2F4fSwke2F5fS4gUmVtb3ZlZCAke2VuYWJsZWRUaWxlfSBhZnRlciAke3JlbW92ZWRUaWxlfSB3YXMgcmVtb3ZlZCBpbiBjZWxsICR7cnh9LCR7cnl9LmApO1xyXG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZW1vdmFscy5wdXNoKHtwb3M6IFtheCwgYXldLCB0aWxlOiBlbmFibGVkVGlsZX0pO1xyXG4gICAgICAgICAgICB0aGlzLl9lbnRyb3B5SGVhcC5wdXNoKHtwb3M6IFtheCwgYXldLCBlbnRyb3B5OiBhZGphY2VudENlbGwuZW50cm9weX0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIF9ncmlkOiBDZWxsW11bXSA9IFtdO1xyXG4gIHByaXZhdGUgX2FkamFjZW5jeVJ1bGVzOiBBZGphY2VuY3lSdWxlcztcclxuICBwcml2YXRlIF9mcmVxdWVuY3lIaW50czogRnJlcXVlbmN5SGludHM7XHJcbiAgcHJpdmF0ZSBfY29sb3JGb3JUaWxlOiBUaWxlQ29sb3JNYXBwaW5nO1xyXG4gIHByaXZhdGUgX2VudHJvcHlIZWFwOiBIZWFwPEhlYXBDZWxsPjtcclxufVxyXG5cclxudHlwZSBIZWFwQ2VsbCA9IHtcclxuICBwb3M6IFBvaW50O1xyXG4gIGVudHJvcHk6IG51bWJlcjtcclxufTtcclxuXHJcbnR5cGUgUmVtb3ZlRXZlbnQgPSB7XHJcbiAgcG9zOiBQb2ludDtcclxuICB0aWxlOiBUaWxlSW5kZXg7XHJcbn07IiwiLyoqXG4gKiBkYXQtZ3VpIEphdmFTY3JpcHQgQ29udHJvbGxlciBMaWJyYXJ5XG4gKiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZGF0LWd1aVxuICpcbiAqIENvcHlyaWdodCAyMDExIERhdGEgQXJ0cyBUZWFtLCBHb29nbGUgQ3JlYXRpdmUgTGFiXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcblx0KGZhY3RvcnkoKGdsb2JhbC5kYXQgPSB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX19fJGluc2VydFN0eWxlKGNzcykge1xuICBpZiAoIWNzcykge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXG4gIHN0eWxlLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICBzdHlsZS5pbm5lckhUTUwgPSBjc3M7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gIHJldHVybiBjc3M7XG59XG5cbmZ1bmN0aW9uIGNvbG9yVG9TdHJpbmcgKGNvbG9yLCBmb3JjZUNTU0hleCkge1xuICB2YXIgY29sb3JGb3JtYXQgPSBjb2xvci5fX3N0YXRlLmNvbnZlcnNpb25OYW1lLnRvU3RyaW5nKCk7XG4gIHZhciByID0gTWF0aC5yb3VuZChjb2xvci5yKTtcbiAgdmFyIGcgPSBNYXRoLnJvdW5kKGNvbG9yLmcpO1xuICB2YXIgYiA9IE1hdGgucm91bmQoY29sb3IuYik7XG4gIHZhciBhID0gY29sb3IuYTtcbiAgdmFyIGggPSBNYXRoLnJvdW5kKGNvbG9yLmgpO1xuICB2YXIgcyA9IGNvbG9yLnMudG9GaXhlZCgxKTtcbiAgdmFyIHYgPSBjb2xvci52LnRvRml4ZWQoMSk7XG4gIGlmIChmb3JjZUNTU0hleCB8fCBjb2xvckZvcm1hdCA9PT0gJ1RIUkVFX0NIQVJfSEVYJyB8fCBjb2xvckZvcm1hdCA9PT0gJ1NJWF9DSEFSX0hFWCcpIHtcbiAgICB2YXIgc3RyID0gY29sb3IuaGV4LnRvU3RyaW5nKDE2KTtcbiAgICB3aGlsZSAoc3RyLmxlbmd0aCA8IDYpIHtcbiAgICAgIHN0ciA9ICcwJyArIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuICcjJyArIHN0cjtcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ0NTU19SR0InKSB7XG4gICAgcmV0dXJuICdyZ2IoJyArIHIgKyAnLCcgKyBnICsgJywnICsgYiArICcpJztcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ0NTU19SR0JBJykge1xuICAgIHJldHVybiAncmdiYSgnICsgciArICcsJyArIGcgKyAnLCcgKyBiICsgJywnICsgYSArICcpJztcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ0hFWCcpIHtcbiAgICByZXR1cm4gJzB4JyArIGNvbG9yLmhleC50b1N0cmluZygxNik7XG4gIH0gZWxzZSBpZiAoY29sb3JGb3JtYXQgPT09ICdSR0JfQVJSQVknKSB7XG4gICAgcmV0dXJuICdbJyArIHIgKyAnLCcgKyBnICsgJywnICsgYiArICddJztcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ1JHQkFfQVJSQVknKSB7XG4gICAgcmV0dXJuICdbJyArIHIgKyAnLCcgKyBnICsgJywnICsgYiArICcsJyArIGEgKyAnXSc7XG4gIH0gZWxzZSBpZiAoY29sb3JGb3JtYXQgPT09ICdSR0JfT0JKJykge1xuICAgIHJldHVybiAne3I6JyArIHIgKyAnLGc6JyArIGcgKyAnLGI6JyArIGIgKyAnfSc7XG4gIH0gZWxzZSBpZiAoY29sb3JGb3JtYXQgPT09ICdSR0JBX09CSicpIHtcbiAgICByZXR1cm4gJ3tyOicgKyByICsgJyxnOicgKyBnICsgJyxiOicgKyBiICsgJyxhOicgKyBhICsgJ30nO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnSFNWX09CSicpIHtcbiAgICByZXR1cm4gJ3toOicgKyBoICsgJyxzOicgKyBzICsgJyx2OicgKyB2ICsgJ30nO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnSFNWQV9PQkonKSB7XG4gICAgcmV0dXJuICd7aDonICsgaCArICcsczonICsgcyArICcsdjonICsgdiArICcsYTonICsgYSArICd9JztcbiAgfVxuICByZXR1cm4gJ3Vua25vd24gZm9ybWF0Jztcbn1cblxudmFyIEFSUl9FQUNIID0gQXJyYXkucHJvdG90eXBlLmZvckVhY2g7XG52YXIgQVJSX1NMSUNFID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIENvbW1vbiA9IHtcbiAgQlJFQUs6IHt9LFxuICBleHRlbmQ6IGZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQpIHtcbiAgICB0aGlzLmVhY2goQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIGtleXMgPSB0aGlzLmlzT2JqZWN0KG9iaikgPyBPYmplY3Qua2V5cyhvYmopIDogW107XG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNVbmRlZmluZWQob2JqW2tleV0pKSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9LFxuICBkZWZhdWx0czogZnVuY3Rpb24gZGVmYXVsdHModGFyZ2V0KSB7XG4gICAgdGhpcy5lYWNoKEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uIChvYmopIHtcbiAgICAgIHZhciBrZXlzID0gdGhpcy5pc09iamVjdChvYmopID8gT2JqZWN0LmtleXMob2JqKSA6IFtdO1xuICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNVbmRlZmluZWQodGFyZ2V0W2tleV0pKSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LCB0aGlzKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9LFxuICBjb21wb3NlOiBmdW5jdGlvbiBjb21wb3NlKCkge1xuICAgIHZhciB0b0NhbGwgPSBBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgYXJncyA9IEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBmb3IgKHZhciBpID0gdG9DYWxsLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbdG9DYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH0sXG4gIGVhY2g6IGZ1bmN0aW9uIGVhY2gob2JqLCBpdHIsIHNjb3BlKSB7XG4gICAgaWYgKCFvYmopIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKEFSUl9FQUNIICYmIG9iai5mb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBBUlJfRUFDSCkge1xuICAgICAgb2JqLmZvckVhY2goaXRyLCBzY29wZSk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSBvYmoubGVuZ3RoICsgMCkge1xuICAgICAgdmFyIGtleSA9IHZvaWQgMDtcbiAgICAgIHZhciBsID0gdm9pZCAwO1xuICAgICAgZm9yIChrZXkgPSAwLCBsID0gb2JqLmxlbmd0aDsga2V5IDwgbDsga2V5KyspIHtcbiAgICAgICAgaWYgKGtleSBpbiBvYmogJiYgaXRyLmNhbGwoc2NvcGUsIG9ialtrZXldLCBrZXkpID09PSB0aGlzLkJSRUFLKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIF9rZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChpdHIuY2FsbChzY29wZSwgb2JqW19rZXldLCBfa2V5KSA9PT0gdGhpcy5CUkVBSykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZGVmZXI6IGZ1bmN0aW9uIGRlZmVyKGZuYykge1xuICAgIHNldFRpbWVvdXQoZm5jLCAwKTtcbiAgfSxcbiAgZGVib3VuY2U6IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHRocmVzaG9sZCwgY2FsbEltbWVkaWF0ZWx5KSB7XG4gICAgdmFyIHRpbWVvdXQgPSB2b2lkIDA7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmdW5jdGlvbiBkZWxheWVkKCkge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKCFjYWxsSW1tZWRpYXRlbHkpIGZ1bmMuYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIHZhciBjYWxsTm93ID0gY2FsbEltbWVkaWF0ZWx5IHx8ICF0aW1lb3V0O1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoZGVsYXllZCwgdGhyZXNob2xkKTtcbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIGZ1bmMuYXBwbHkob2JqLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxuICB0b0FycmF5OiBmdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIGlmIChvYmoudG9BcnJheSkgcmV0dXJuIG9iai50b0FycmF5KCk7XG4gICAgcmV0dXJuIEFSUl9TTElDRS5jYWxsKG9iaik7XG4gIH0sXG4gIGlzVW5kZWZpbmVkOiBmdW5jdGlvbiBpc1VuZGVmaW5lZChvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB1bmRlZmluZWQ7XG4gIH0sXG4gIGlzTnVsbDogZnVuY3Rpb24gaXNOdWxsKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH0sXG4gIGlzTmFOOiBmdW5jdGlvbiAoX2lzTmFOKSB7XG4gICAgZnVuY3Rpb24gaXNOYU4oX3gpIHtcbiAgICAgIHJldHVybiBfaXNOYU4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgaXNOYU4udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX2lzTmFOLnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgICByZXR1cm4gaXNOYU47XG4gIH0oZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBpc05hTihvYmopO1xuICB9KSxcbiAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIG9iai5jb25zdHJ1Y3RvciA9PT0gQXJyYXk7XG4gIH0sXG4gIGlzT2JqZWN0OiBmdW5jdGlvbiBpc09iamVjdChvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfSxcbiAgaXNOdW1iZXI6IGZ1bmN0aW9uIGlzTnVtYmVyKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG9iaiArIDA7XG4gIH0sXG4gIGlzU3RyaW5nOiBmdW5jdGlvbiBpc1N0cmluZyhvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBvYmogKyAnJztcbiAgfSxcbiAgaXNCb29sZWFuOiBmdW5jdGlvbiBpc0Jvb2xlYW4ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gZmFsc2UgfHwgb2JqID09PSB0cnVlO1xuICB9LFxuICBpc0Z1bmN0aW9uOiBmdW5jdGlvbiBpc0Z1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgfVxufTtcblxudmFyIElOVEVSUFJFVEFUSU9OUyA9IFtcbntcbiAgbGl0bXVzOiBDb21tb24uaXNTdHJpbmcsXG4gIGNvbnZlcnNpb25zOiB7XG4gICAgVEhSRUVfQ0hBUl9IRVg6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXiMoW0EtRjAtOV0pKFtBLUYwLTldKShbQS1GMC05XSkkL2kpO1xuICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNwYWNlOiAnSEVYJyxcbiAgICAgICAgICBoZXg6IHBhcnNlSW50KCcweCcgKyB0ZXN0WzFdLnRvU3RyaW5nKCkgKyB0ZXN0WzFdLnRvU3RyaW5nKCkgKyB0ZXN0WzJdLnRvU3RyaW5nKCkgKyB0ZXN0WzJdLnRvU3RyaW5nKCkgKyB0ZXN0WzNdLnRvU3RyaW5nKCkgKyB0ZXN0WzNdLnRvU3RyaW5nKCksIDApXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGNvbG9yVG9TdHJpbmdcbiAgICB9LFxuICAgIFNJWF9DSEFSX0hFWDoge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9eIyhbQS1GMC05XXs2fSkkL2kpO1xuICAgICAgICBpZiAodGVzdCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNwYWNlOiAnSEVYJyxcbiAgICAgICAgICBoZXg6IHBhcnNlSW50KCcweCcgKyB0ZXN0WzFdLnRvU3RyaW5nKCksIDApXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGNvbG9yVG9TdHJpbmdcbiAgICB9LFxuICAgIENTU19SR0I6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYlxcKFxccyooLispXFxzKixcXHMqKC4rKVxccyosXFxzKiguKylcXHMqXFwpLyk7XG4gICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgIHI6IHBhcnNlRmxvYXQodGVzdFsxXSksXG4gICAgICAgICAgZzogcGFyc2VGbG9hdCh0ZXN0WzJdKSxcbiAgICAgICAgICBiOiBwYXJzZUZsb2F0KHRlc3RbM10pXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGNvbG9yVG9TdHJpbmdcbiAgICB9LFxuICAgIENTU19SR0JBOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIHZhciB0ZXN0ID0gb3JpZ2luYWwubWF0Y2goL15yZ2JhXFwoXFxzKiguKylcXHMqLFxccyooLispXFxzKixcXHMqKC4rKVxccyosXFxzKiguKylcXHMqXFwpLyk7XG4gICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgIHI6IHBhcnNlRmxvYXQodGVzdFsxXSksXG4gICAgICAgICAgZzogcGFyc2VGbG9hdCh0ZXN0WzJdKSxcbiAgICAgICAgICBiOiBwYXJzZUZsb2F0KHRlc3RbM10pLFxuICAgICAgICAgIGE6IHBhcnNlRmxvYXQodGVzdFs0XSlcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogY29sb3JUb1N0cmluZ1xuICAgIH1cbiAgfVxufSxcbntcbiAgbGl0bXVzOiBDb21tb24uaXNOdW1iZXIsXG4gIGNvbnZlcnNpb25zOiB7XG4gICAgSEVYOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgIGhleDogb3JpZ2luYWwsXG4gICAgICAgICAgY29udmVyc2lvbk5hbWU6ICdIRVgnXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBjb2xvci5oZXg7XG4gICAgICB9XG4gICAgfVxuICB9XG59LFxue1xuICBsaXRtdXM6IENvbW1vbi5pc0FycmF5LFxuICBjb252ZXJzaW9uczoge1xuICAgIFJHQl9BUlJBWToge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICBpZiAob3JpZ2luYWwubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgIHI6IG9yaWdpbmFsWzBdLFxuICAgICAgICAgIGc6IG9yaWdpbmFsWzFdLFxuICAgICAgICAgIGI6IG9yaWdpbmFsWzJdXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl07XG4gICAgICB9XG4gICAgfSxcbiAgICBSR0JBX0FSUkFZOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGggIT09IDQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgcjogb3JpZ2luYWxbMF0sXG4gICAgICAgICAgZzogb3JpZ2luYWxbMV0sXG4gICAgICAgICAgYjogb3JpZ2luYWxbMl0sXG4gICAgICAgICAgYTogb3JpZ2luYWxbM11cbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iLCBjb2xvci5hXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0sXG57XG4gIGxpdG11czogQ29tbW9uLmlzT2JqZWN0LFxuICBjb252ZXJzaW9uczoge1xuICAgIFJHQkFfT0JKOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIGlmIChDb21tb24uaXNOdW1iZXIob3JpZ2luYWwucikgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmcpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5iKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuYSkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgcjogb3JpZ2luYWwucixcbiAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICBiOiBvcmlnaW5hbC5iLFxuICAgICAgICAgICAgYTogb3JpZ2luYWwuYVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBmdW5jdGlvbiB3cml0ZShjb2xvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHI6IGNvbG9yLnIsXG4gICAgICAgICAgZzogY29sb3IuZyxcbiAgICAgICAgICBiOiBjb2xvci5iLFxuICAgICAgICAgIGE6IGNvbG9yLmFcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFJHQl9PQko6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgaWYgKENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuZykgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmIpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICAgIHI6IG9yaWdpbmFsLnIsXG4gICAgICAgICAgICBnOiBvcmlnaW5hbC5nLFxuICAgICAgICAgICAgYjogb3JpZ2luYWwuYlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBmdW5jdGlvbiB3cml0ZShjb2xvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHI6IGNvbG9yLnIsXG4gICAgICAgICAgZzogY29sb3IuZyxcbiAgICAgICAgICBiOiBjb2xvci5iXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICBIU1ZBX09CSjoge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICBpZiAoQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmgpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5zKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwudikgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmEpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwYWNlOiAnSFNWJyxcbiAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICBzOiBvcmlnaW5hbC5zLFxuICAgICAgICAgICAgdjogb3JpZ2luYWwudixcbiAgICAgICAgICAgIGE6IG9yaWdpbmFsLmFcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoOiBjb2xvci5oLFxuICAgICAgICAgIHM6IGNvbG9yLnMsXG4gICAgICAgICAgdjogY29sb3IudixcbiAgICAgICAgICBhOiBjb2xvci5hXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSxcbiAgICBIU1ZfT0JKOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIGlmIChDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuaCkgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC52KSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzcGFjZTogJ0hTVicsXG4gICAgICAgICAgICBoOiBvcmlnaW5hbC5oLFxuICAgICAgICAgICAgczogb3JpZ2luYWwucyxcbiAgICAgICAgICAgIHY6IG9yaWdpbmFsLnZcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBoOiBjb2xvci5oLFxuICAgICAgICAgIHM6IGNvbG9yLnMsXG4gICAgICAgICAgdjogY29sb3IudlxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxufV07XG52YXIgcmVzdWx0ID0gdm9pZCAwO1xudmFyIHRvUmV0dXJuID0gdm9pZCAwO1xudmFyIGludGVycHJldCA9IGZ1bmN0aW9uIGludGVycHJldCgpIHtcbiAgdG9SZXR1cm4gPSBmYWxzZTtcbiAgdmFyIG9yaWdpbmFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBDb21tb24udG9BcnJheShhcmd1bWVudHMpIDogYXJndW1lbnRzWzBdO1xuICBDb21tb24uZWFjaChJTlRFUlBSRVRBVElPTlMsIGZ1bmN0aW9uIChmYW1pbHkpIHtcbiAgICBpZiAoZmFtaWx5LmxpdG11cyhvcmlnaW5hbCkpIHtcbiAgICAgIENvbW1vbi5lYWNoKGZhbWlseS5jb252ZXJzaW9ucywgZnVuY3Rpb24gKGNvbnZlcnNpb24sIGNvbnZlcnNpb25OYW1lKSB7XG4gICAgICAgIHJlc3VsdCA9IGNvbnZlcnNpb24ucmVhZChvcmlnaW5hbCk7XG4gICAgICAgIGlmICh0b1JldHVybiA9PT0gZmFsc2UgJiYgcmVzdWx0ICE9PSBmYWxzZSkge1xuICAgICAgICAgIHRvUmV0dXJuID0gcmVzdWx0O1xuICAgICAgICAgIHJlc3VsdC5jb252ZXJzaW9uTmFtZSA9IGNvbnZlcnNpb25OYW1lO1xuICAgICAgICAgIHJlc3VsdC5jb252ZXJzaW9uID0gY29udmVyc2lvbjtcbiAgICAgICAgICByZXR1cm4gQ29tbW9uLkJSRUFLO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBDb21tb24uQlJFQUs7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHRvUmV0dXJuO1xufTtcblxudmFyIHRtcENvbXBvbmVudCA9IHZvaWQgMDtcbnZhciBDb2xvck1hdGggPSB7XG4gIGhzdl90b19yZ2I6IGZ1bmN0aW9uIGhzdl90b19yZ2IoaCwgcywgdikge1xuICAgIHZhciBoaSA9IE1hdGguZmxvb3IoaCAvIDYwKSAlIDY7XG4gICAgdmFyIGYgPSBoIC8gNjAgLSBNYXRoLmZsb29yKGggLyA2MCk7XG4gICAgdmFyIHAgPSB2ICogKDEuMCAtIHMpO1xuICAgIHZhciBxID0gdiAqICgxLjAgLSBmICogcyk7XG4gICAgdmFyIHQgPSB2ICogKDEuMCAtICgxLjAgLSBmKSAqIHMpO1xuICAgIHZhciBjID0gW1t2LCB0LCBwXSwgW3EsIHYsIHBdLCBbcCwgdiwgdF0sIFtwLCBxLCB2XSwgW3QsIHAsIHZdLCBbdiwgcCwgcV1dW2hpXTtcbiAgICByZXR1cm4ge1xuICAgICAgcjogY1swXSAqIDI1NSxcbiAgICAgIGc6IGNbMV0gKiAyNTUsXG4gICAgICBiOiBjWzJdICogMjU1XG4gICAgfTtcbiAgfSxcbiAgcmdiX3RvX2hzdjogZnVuY3Rpb24gcmdiX3RvX2hzdihyLCBnLCBiKSB7XG4gICAgdmFyIG1pbiA9IE1hdGgubWluKHIsIGcsIGIpO1xuICAgIHZhciBtYXggPSBNYXRoLm1heChyLCBnLCBiKTtcbiAgICB2YXIgZGVsdGEgPSBtYXggLSBtaW47XG4gICAgdmFyIGggPSB2b2lkIDA7XG4gICAgdmFyIHMgPSB2b2lkIDA7XG4gICAgaWYgKG1heCAhPT0gMCkge1xuICAgICAgcyA9IGRlbHRhIC8gbWF4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoOiBOYU4sXG4gICAgICAgIHM6IDAsXG4gICAgICAgIHY6IDBcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyID09PSBtYXgpIHtcbiAgICAgIGggPSAoZyAtIGIpIC8gZGVsdGE7XG4gICAgfSBlbHNlIGlmIChnID09PSBtYXgpIHtcbiAgICAgIGggPSAyICsgKGIgLSByKSAvIGRlbHRhO1xuICAgIH0gZWxzZSB7XG4gICAgICBoID0gNCArIChyIC0gZykgLyBkZWx0YTtcbiAgICB9XG4gICAgaCAvPSA2O1xuICAgIGlmIChoIDwgMCkge1xuICAgICAgaCArPSAxO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgaDogaCAqIDM2MCxcbiAgICAgIHM6IHMsXG4gICAgICB2OiBtYXggLyAyNTVcbiAgICB9O1xuICB9LFxuICByZ2JfdG9faGV4OiBmdW5jdGlvbiByZ2JfdG9faGV4KHIsIGcsIGIpIHtcbiAgICB2YXIgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoMCwgMiwgcik7XG4gICAgaGV4ID0gdGhpcy5oZXhfd2l0aF9jb21wb25lbnQoaGV4LCAxLCBnKTtcbiAgICBoZXggPSB0aGlzLmhleF93aXRoX2NvbXBvbmVudChoZXgsIDAsIGIpO1xuICAgIHJldHVybiBoZXg7XG4gIH0sXG4gIGNvbXBvbmVudF9mcm9tX2hleDogZnVuY3Rpb24gY29tcG9uZW50X2Zyb21faGV4KGhleCwgY29tcG9uZW50SW5kZXgpIHtcbiAgICByZXR1cm4gaGV4ID4+IGNvbXBvbmVudEluZGV4ICogOCAmIDB4RkY7XG4gIH0sXG4gIGhleF93aXRoX2NvbXBvbmVudDogZnVuY3Rpb24gaGV4X3dpdGhfY29tcG9uZW50KGhleCwgY29tcG9uZW50SW5kZXgsIHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlIDw8ICh0bXBDb21wb25lbnQgPSBjb21wb25lbnRJbmRleCAqIDgpIHwgaGV4ICYgfigweEZGIDw8IHRtcENvbXBvbmVudCk7XG4gIH1cbn07XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIgPyBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiB0eXBlb2Ygb2JqO1xufSA6IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG59O1xuXG5cblxuXG5cblxuXG5cblxuXG5cbnZhciBjbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59O1xuXG52YXIgY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgICBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gIH07XG59KCk7XG5cblxuXG5cblxuXG5cbnZhciBnZXQgPSBmdW5jdGlvbiBnZXQob2JqZWN0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHtcbiAgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7XG5cbiAgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTtcblxuICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBnZXQocGFyZW50LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcInZhbHVlXCIgaW4gZGVzYykge1xuICAgIHJldHVybiBkZXNjLnZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHZhciBnZXR0ZXIgPSBkZXNjLmdldDtcblxuICAgIGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpO1xuICB9XG59O1xuXG52YXIgaW5oZXJpdHMgPSBmdW5jdGlvbiAoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHtcbiAgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSBcImZ1bmN0aW9uXCIgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90IFwiICsgdHlwZW9mIHN1cGVyQ2xhc3MpO1xuICB9XG5cbiAgc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBzdWJDbGFzcyxcbiAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9XG4gIH0pO1xuICBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7XG59O1xuXG5cblxuXG5cblxuXG5cblxuXG5cbnZhciBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuID0gZnVuY3Rpb24gKHNlbGYsIGNhbGwpIHtcbiAgaWYgKCFzZWxmKSB7XG4gICAgdGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKFwidGhpcyBoYXNuJ3QgYmVlbiBpbml0aWFsaXNlZCAtIHN1cGVyKCkgaGFzbid0IGJlZW4gY2FsbGVkXCIpO1xuICB9XG5cbiAgcmV0dXJuIGNhbGwgJiYgKHR5cGVvZiBjYWxsID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBjYWxsID09PSBcImZ1bmN0aW9uXCIpID8gY2FsbCA6IHNlbGY7XG59O1xuXG52YXIgQ29sb3IgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIENvbG9yKCkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIENvbG9yKTtcbiAgICB0aGlzLl9fc3RhdGUgPSBpbnRlcnByZXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAodGhpcy5fX3N0YXRlID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gaW50ZXJwcmV0IGNvbG9yIGFyZ3VtZW50cycpO1xuICAgIH1cbiAgICB0aGlzLl9fc3RhdGUuYSA9IHRoaXMuX19zdGF0ZS5hIHx8IDE7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoQ29sb3IsIFt7XG4gICAga2V5OiAndG9TdHJpbmcnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICAgIHJldHVybiBjb2xvclRvU3RyaW5nKHRoaXMpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RvSGV4U3RyaW5nJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9IZXhTdHJpbmcoKSB7XG4gICAgICByZXR1cm4gY29sb3JUb1N0cmluZyh0aGlzLCB0cnVlKTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd0b09yaWdpbmFsJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdG9PcmlnaW5hbCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fc3RhdGUuY29udmVyc2lvbi53cml0ZSh0aGlzKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIENvbG9yO1xufSgpO1xuZnVuY3Rpb24gZGVmaW5lUkdCQ29tcG9uZW50KHRhcmdldCwgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb21wb25lbnQsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgPT09ICdSR0InKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcbiAgICAgIH1cbiAgICAgIENvbG9yLnJlY2FsY3VsYXRlUkdCKHRoaXMsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpO1xuICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ1JHQicpIHtcbiAgICAgICAgQ29sb3IucmVjYWxjdWxhdGVSR0IodGhpcywgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCk7XG4gICAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdSR0InO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3N0YXRlW2NvbXBvbmVudF0gPSB2O1xuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiBkZWZpbmVIU1ZDb21wb25lbnQodGFyZ2V0LCBjb21wb25lbnQpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29tcG9uZW50LCB7XG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQkJDEoKSB7XG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlID09PSAnSFNWJykge1xuICAgICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG4gICAgICB9XG4gICAgICBDb2xvci5yZWNhbGN1bGF0ZUhTVih0aGlzKTtcbiAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0JCQxKHYpIHtcbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdIU1YnKSB7XG4gICAgICAgIENvbG9yLnJlY2FsY3VsYXRlSFNWKHRoaXMpO1xuICAgICAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnSFNWJztcbiAgICAgIH1cbiAgICAgIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdID0gdjtcbiAgICB9XG4gIH0pO1xufVxuQ29sb3IucmVjYWxjdWxhdGVSR0IgPSBmdW5jdGlvbiAoY29sb3IsIGNvbXBvbmVudCwgY29tcG9uZW50SGV4SW5kZXgpIHtcbiAgaWYgKGNvbG9yLl9fc3RhdGUuc3BhY2UgPT09ICdIRVgnKSB7XG4gICAgY29sb3IuX19zdGF0ZVtjb21wb25lbnRdID0gQ29sb3JNYXRoLmNvbXBvbmVudF9mcm9tX2hleChjb2xvci5fX3N0YXRlLmhleCwgY29tcG9uZW50SGV4SW5kZXgpO1xuICB9IGVsc2UgaWYgKGNvbG9yLl9fc3RhdGUuc3BhY2UgPT09ICdIU1YnKSB7XG4gICAgQ29tbW9uLmV4dGVuZChjb2xvci5fX3N0YXRlLCBDb2xvck1hdGguaHN2X3RvX3JnYihjb2xvci5fX3N0YXRlLmgsIGNvbG9yLl9fc3RhdGUucywgY29sb3IuX19zdGF0ZS52KSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDb3JydXB0ZWQgY29sb3Igc3RhdGUnKTtcbiAgfVxufTtcbkNvbG9yLnJlY2FsY3VsYXRlSFNWID0gZnVuY3Rpb24gKGNvbG9yKSB7XG4gIHZhciByZXN1bHQgPSBDb2xvck1hdGgucmdiX3RvX2hzdihjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iKTtcbiAgQ29tbW9uLmV4dGVuZChjb2xvci5fX3N0YXRlLCB7XG4gICAgczogcmVzdWx0LnMsXG4gICAgdjogcmVzdWx0LnZcbiAgfSk7XG4gIGlmICghQ29tbW9uLmlzTmFOKHJlc3VsdC5oKSkge1xuICAgIGNvbG9yLl9fc3RhdGUuaCA9IHJlc3VsdC5oO1xuICB9IGVsc2UgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChjb2xvci5fX3N0YXRlLmgpKSB7XG4gICAgY29sb3IuX19zdGF0ZS5oID0gMDtcbiAgfVxufTtcbkNvbG9yLkNPTVBPTkVOVFMgPSBbJ3InLCAnZycsICdiJywgJ2gnLCAncycsICd2JywgJ2hleCcsICdhJ107XG5kZWZpbmVSR0JDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAncicsIDIpO1xuZGVmaW5lUkdCQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ2cnLCAxKTtcbmRlZmluZVJHQkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdiJywgMCk7XG5kZWZpbmVIU1ZDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnaCcpO1xuZGVmaW5lSFNWQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3MnKTtcbmRlZmluZUhTVkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICd2Jyk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQ29sb3IucHJvdG90eXBlLCAnYScsIHtcbiAgZ2V0OiBmdW5jdGlvbiBnZXQkJDEoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5hO1xuICB9LFxuICBzZXQ6IGZ1bmN0aW9uIHNldCQkMSh2KSB7XG4gICAgdGhpcy5fX3N0YXRlLmEgPSB2O1xuICB9XG59KTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb2xvci5wcm90b3R5cGUsICdoZXgnLCB7XG4gIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgIT09ICdIRVgnKSB7XG4gICAgICB0aGlzLl9fc3RhdGUuaGV4ID0gQ29sb3JNYXRoLnJnYl90b19oZXgodGhpcy5yLCB0aGlzLmcsIHRoaXMuYik7XG4gICAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnSEVYJztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5oZXg7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24gc2V0JCQxKHYpIHtcbiAgICB0aGlzLl9fc3RhdGUuc3BhY2UgPSAnSEVYJztcbiAgICB0aGlzLl9fc3RhdGUuaGV4ID0gdjtcbiAgfVxufSk7XG5cbnZhciBDb250cm9sbGVyID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBDb250cm9sbGVyKTtcbiAgICB0aGlzLmluaXRpYWxWYWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgdGhpcy5wcm9wZXJ0eSA9IHByb3BlcnR5O1xuICAgIHRoaXMuX19vbkNoYW5nZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UgPSB1bmRlZmluZWQ7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoQ29udHJvbGxlciwgW3tcbiAgICBrZXk6ICdvbkNoYW5nZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uQ2hhbmdlKGZuYykge1xuICAgICAgdGhpcy5fX29uQ2hhbmdlID0gZm5jO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnb25GaW5pc2hDaGFuZ2UnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBvbkZpbmlzaENoYW5nZShmbmMpIHtcbiAgICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZSA9IGZuYztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3NldFZhbHVlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmFsdWUobmV3VmFsdWUpIHtcbiAgICAgIHRoaXMub2JqZWN0W3RoaXMucHJvcGVydHldID0gbmV3VmFsdWU7XG4gICAgICBpZiAodGhpcy5fX29uQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkNoYW5nZS5jYWxsKHRoaXMsIG5ld1ZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudXBkYXRlRGlzcGxheSgpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZ2V0VmFsdWUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRWYWx1ZSgpIHtcbiAgICAgIHJldHVybiB0aGlzLm9iamVjdFt0aGlzLnByb3BlcnR5XTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVEaXNwbGF5JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGlzcGxheSgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2lzTW9kaWZpZWQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBpc01vZGlmaWVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdGlhbFZhbHVlICE9PSB0aGlzLmdldFZhbHVlKCk7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBDb250cm9sbGVyO1xufSgpO1xuXG52YXIgRVZFTlRfTUFQID0ge1xuICBIVE1MRXZlbnRzOiBbJ2NoYW5nZSddLFxuICBNb3VzZUV2ZW50czogWydjbGljaycsICdtb3VzZW1vdmUnLCAnbW91c2Vkb3duJywgJ21vdXNldXAnLCAnbW91c2VvdmVyJ10sXG4gIEtleWJvYXJkRXZlbnRzOiBbJ2tleWRvd24nXVxufTtcbnZhciBFVkVOVF9NQVBfSU5WID0ge307XG5Db21tb24uZWFjaChFVkVOVF9NQVAsIGZ1bmN0aW9uICh2LCBrKSB7XG4gIENvbW1vbi5lYWNoKHYsIGZ1bmN0aW9uIChlKSB7XG4gICAgRVZFTlRfTUFQX0lOVltlXSA9IGs7XG4gIH0pO1xufSk7XG52YXIgQ1NTX1ZBTFVFX1BJWEVMUyA9IC8oXFxkKyhcXC5cXGQrKT8pcHgvO1xuZnVuY3Rpb24gY3NzVmFsdWVUb1BpeGVscyh2YWwpIHtcbiAgaWYgKHZhbCA9PT0gJzAnIHx8IENvbW1vbi5pc1VuZGVmaW5lZCh2YWwpKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgdmFyIG1hdGNoID0gdmFsLm1hdGNoKENTU19WQUxVRV9QSVhFTFMpO1xuICBpZiAoIUNvbW1vbi5pc051bGwobWF0Y2gpKSB7XG4gICAgcmV0dXJuIHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB9XG4gIHJldHVybiAwO1xufVxudmFyIGRvbSA9IHtcbiAgbWFrZVNlbGVjdGFibGU6IGZ1bmN0aW9uIG1ha2VTZWxlY3RhYmxlKGVsZW0sIHNlbGVjdGFibGUpIHtcbiAgICBpZiAoZWxlbSA9PT0gdW5kZWZpbmVkIHx8IGVsZW0uc3R5bGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgIGVsZW0ub25zZWxlY3RzdGFydCA9IHNlbGVjdGFibGUgPyBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSA6IGZ1bmN0aW9uICgpIHt9O1xuICAgIGVsZW0uc3R5bGUuTW96VXNlclNlbGVjdCA9IHNlbGVjdGFibGUgPyAnYXV0bycgOiAnbm9uZSc7XG4gICAgZWxlbS5zdHlsZS5LaHRtbFVzZXJTZWxlY3QgPSBzZWxlY3RhYmxlID8gJ2F1dG8nIDogJ25vbmUnO1xuICAgIGVsZW0udW5zZWxlY3RhYmxlID0gc2VsZWN0YWJsZSA/ICdvbicgOiAnb2ZmJztcbiAgfSxcbiAgbWFrZUZ1bGxzY3JlZW46IGZ1bmN0aW9uIG1ha2VGdWxsc2NyZWVuKGVsZW0sIGhvciwgdmVydCkge1xuICAgIHZhciB2ZXJ0aWNhbCA9IHZlcnQ7XG4gICAgdmFyIGhvcml6b250YWwgPSBob3I7XG4gICAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChob3Jpem9udGFsKSkge1xuICAgICAgaG9yaXpvbnRhbCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChDb21tb24uaXNVbmRlZmluZWQodmVydGljYWwpKSB7XG4gICAgICB2ZXJ0aWNhbCA9IHRydWU7XG4gICAgfVxuICAgIGVsZW0uc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgIGlmIChob3Jpem9udGFsKSB7XG4gICAgICBlbGVtLnN0eWxlLmxlZnQgPSAwO1xuICAgICAgZWxlbS5zdHlsZS5yaWdodCA9IDA7XG4gICAgfVxuICAgIGlmICh2ZXJ0aWNhbCkge1xuICAgICAgZWxlbS5zdHlsZS50b3AgPSAwO1xuICAgICAgZWxlbS5zdHlsZS5ib3R0b20gPSAwO1xuICAgIH1cbiAgfSxcbiAgZmFrZUV2ZW50OiBmdW5jdGlvbiBmYWtlRXZlbnQoZWxlbSwgZXZlbnRUeXBlLCBwYXJzLCBhdXgpIHtcbiAgICB2YXIgcGFyYW1zID0gcGFycyB8fCB7fTtcbiAgICB2YXIgY2xhc3NOYW1lID0gRVZFTlRfTUFQX0lOVltldmVudFR5cGVdO1xuICAgIGlmICghY2xhc3NOYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2ZW50IHR5cGUgJyArIGV2ZW50VHlwZSArICcgbm90IHN1cHBvcnRlZC4nKTtcbiAgICB9XG4gICAgdmFyIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KGNsYXNzTmFtZSk7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIGNhc2UgJ01vdXNlRXZlbnRzJzpcbiAgICAgICAge1xuICAgICAgICAgIHZhciBjbGllbnRYID0gcGFyYW1zLnggfHwgcGFyYW1zLmNsaWVudFggfHwgMDtcbiAgICAgICAgICB2YXIgY2xpZW50WSA9IHBhcmFtcy55IHx8IHBhcmFtcy5jbGllbnRZIHx8IDA7XG4gICAgICAgICAgZXZ0LmluaXRNb3VzZUV2ZW50KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsIHBhcmFtcy5jYW5jZWxhYmxlIHx8IHRydWUsIHdpbmRvdywgcGFyYW1zLmNsaWNrQ291bnQgfHwgMSwgMCxcbiAgICAgICAgICAwLFxuICAgICAgICAgIGNsaWVudFgsXG4gICAgICAgICAgY2xpZW50WSxcbiAgICAgICAgICBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgJ0tleWJvYXJkRXZlbnRzJzpcbiAgICAgICAge1xuICAgICAgICAgIHZhciBpbml0ID0gZXZ0LmluaXRLZXlib2FyZEV2ZW50IHx8IGV2dC5pbml0S2V5RXZlbnQ7XG4gICAgICAgICAgQ29tbW9uLmRlZmF1bHRzKHBhcmFtcywge1xuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGN0cmxLZXk6IGZhbHNlLFxuICAgICAgICAgICAgYWx0S2V5OiBmYWxzZSxcbiAgICAgICAgICAgIHNoaWZ0S2V5OiBmYWxzZSxcbiAgICAgICAgICAgIG1ldGFLZXk6IGZhbHNlLFxuICAgICAgICAgICAga2V5Q29kZTogdW5kZWZpbmVkLFxuICAgICAgICAgICAgY2hhckNvZGU6IHVuZGVmaW5lZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGluaXQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSwgcGFyYW1zLmNhbmNlbGFibGUsIHdpbmRvdywgcGFyYW1zLmN0cmxLZXksIHBhcmFtcy5hbHRLZXksIHBhcmFtcy5zaGlmdEtleSwgcGFyYW1zLm1ldGFLZXksIHBhcmFtcy5rZXlDb2RlLCBwYXJhbXMuY2hhckNvZGUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB7XG4gICAgICAgICAgZXZ0LmluaXRFdmVudChldmVudFR5cGUsIHBhcmFtcy5idWJibGVzIHx8IGZhbHNlLCBwYXJhbXMuY2FuY2VsYWJsZSB8fCB0cnVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBDb21tb24uZGVmYXVsdHMoZXZ0LCBhdXgpO1xuICAgIGVsZW0uZGlzcGF0Y2hFdmVudChldnQpO1xuICB9LFxuICBiaW5kOiBmdW5jdGlvbiBiaW5kKGVsZW0sIGV2ZW50LCBmdW5jLCBuZXdCb29sKSB7XG4gICAgdmFyIGJvb2wgPSBuZXdCb29sIHx8IGZhbHNlO1xuICAgIGlmIChlbGVtLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIGVsZW0uYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuYywgYm9vbCk7XG4gICAgfSBlbHNlIGlmIChlbGVtLmF0dGFjaEV2ZW50KSB7XG4gICAgICBlbGVtLmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XG4gICAgfVxuICAgIHJldHVybiBkb207XG4gIH0sXG4gIHVuYmluZDogZnVuY3Rpb24gdW5iaW5kKGVsZW0sIGV2ZW50LCBmdW5jLCBuZXdCb29sKSB7XG4gICAgdmFyIGJvb2wgPSBuZXdCb29sIHx8IGZhbHNlO1xuICAgIGlmIChlbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZnVuYywgYm9vbCk7XG4gICAgfSBlbHNlIGlmIChlbGVtLmRldGFjaEV2ZW50KSB7XG4gICAgICBlbGVtLmRldGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYyk7XG4gICAgfVxuICAgIHJldHVybiBkb207XG4gIH0sXG4gIGFkZENsYXNzOiBmdW5jdGlvbiBhZGRDbGFzcyhlbGVtLCBjbGFzc05hbWUpIHtcbiAgICBpZiAoZWxlbS5jbGFzc05hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgfSBlbHNlIGlmIChlbGVtLmNsYXNzTmFtZSAhPT0gY2xhc3NOYW1lKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGVsZW0uY2xhc3NOYW1lLnNwbGl0KC8gKy8pO1xuICAgICAgaWYgKGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpID09PSAtMSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goY2xhc3NOYW1lKTtcbiAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKS5yZXBsYWNlKC9eXFxzKy8sICcnKS5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcbiAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gY2xhc3NOYW1lKSB7XG4gICAgICAgIGVsZW0ucmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGNsYXNzZXMgPSBlbGVtLmNsYXNzTmFtZS5zcGxpdCgvICsvKTtcbiAgICAgICAgdmFyIGluZGV4ID0gY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSk7XG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICBjbGFzc2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgZWxlbS5jbGFzc05hbWUgPSBjbGFzc2VzLmpvaW4oJyAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcbiAgaGFzQ2xhc3M6IGZ1bmN0aW9uIGhhc0NsYXNzKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIHJldHVybiBuZXcgUmVnRXhwKCcoPzpefFxcXFxzKyknICsgY2xhc3NOYW1lICsgJyg/OlxcXFxzK3wkKScpLnRlc3QoZWxlbS5jbGFzc05hbWUpIHx8IGZhbHNlO1xuICB9LFxuICBnZXRXaWR0aDogZnVuY3Rpb24gZ2V0V2lkdGgoZWxlbSkge1xuICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbSk7XG4gICAgcmV0dXJuIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2JvcmRlci1sZWZ0LXdpZHRoJ10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLXJpZ2h0LXdpZHRoJ10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1sZWZ0J10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1yaWdodCddKSArIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGUud2lkdGgpO1xuICB9LFxuICBnZXRIZWlnaHQ6IGZ1bmN0aW9uIGdldEhlaWdodChlbGVtKSB7XG4gICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcbiAgICByZXR1cm4gY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLXRvcC13aWR0aCddKSArIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ2JvcmRlci1ib3R0b20td2lkdGgnXSkgKyBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydwYWRkaW5nLXRvcCddKSArIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctYm90dG9tJ10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZS5oZWlnaHQpO1xuICB9LFxuICBnZXRPZmZzZXQ6IGZ1bmN0aW9uIGdldE9mZnNldChlbCkge1xuICAgIHZhciBlbGVtID0gZWw7XG4gICAgdmFyIG9mZnNldCA9IHsgbGVmdDogMCwgdG9wOiAwIH07XG4gICAgaWYgKGVsZW0ub2Zmc2V0UGFyZW50KSB7XG4gICAgICBkbyB7XG4gICAgICAgIG9mZnNldC5sZWZ0ICs9IGVsZW0ub2Zmc2V0TGVmdDtcbiAgICAgICAgb2Zmc2V0LnRvcCArPSBlbGVtLm9mZnNldFRvcDtcbiAgICAgICAgZWxlbSA9IGVsZW0ub2Zmc2V0UGFyZW50O1xuICAgICAgfSB3aGlsZSAoZWxlbSk7XG4gICAgfVxuICAgIHJldHVybiBvZmZzZXQ7XG4gIH0sXG4gIGlzQWN0aXZlOiBmdW5jdGlvbiBpc0FjdGl2ZShlbGVtKSB7XG4gICAgcmV0dXJuIGVsZW0gPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgKGVsZW0udHlwZSB8fCBlbGVtLmhyZWYpO1xuICB9XG59O1xuXG52YXIgQm9vbGVhbkNvbnRyb2xsZXIgPSBmdW5jdGlvbiAoX0NvbnRyb2xsZXIpIHtcbiAgaW5oZXJpdHMoQm9vbGVhbkNvbnRyb2xsZXIsIF9Db250cm9sbGVyKTtcbiAgZnVuY3Rpb24gQm9vbGVhbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIEJvb2xlYW5Db250cm9sbGVyKTtcbiAgICB2YXIgX3RoaXMyID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoQm9vbGVhbkNvbnRyb2xsZXIuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihCb29sZWFuQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBfdGhpczIuX19wcmV2ID0gX3RoaXMyLmdldFZhbHVlKCk7XG4gICAgX3RoaXMyLl9fY2hlY2tib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIF90aGlzMi5fX2NoZWNrYm94LnNldEF0dHJpYnV0ZSgndHlwZScsICdjaGVja2JveCcpO1xuICAgIGZ1bmN0aW9uIG9uQ2hhbmdlKCkge1xuICAgICAgX3RoaXMuc2V0VmFsdWUoIV90aGlzLl9fcHJldik7XG4gICAgfVxuICAgIGRvbS5iaW5kKF90aGlzMi5fX2NoZWNrYm94LCAnY2hhbmdlJywgb25DaGFuZ2UsIGZhbHNlKTtcbiAgICBfdGhpczIuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChfdGhpczIuX19jaGVja2JveCk7XG4gICAgX3RoaXMyLnVwZGF0ZURpc3BsYXkoKTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKEJvb2xlYW5Db250cm9sbGVyLCBbe1xuICAgIGtleTogJ3NldFZhbHVlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0VmFsdWUodikge1xuICAgICAgdmFyIHRvUmV0dXJuID0gZ2V0KEJvb2xlYW5Db250cm9sbGVyLnByb3RvdHlwZS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKEJvb2xlYW5Db250cm9sbGVyLnByb3RvdHlwZSksICdzZXRWYWx1ZScsIHRoaXMpLmNhbGwodGhpcywgdik7XG4gICAgICBpZiAodGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKHRoaXMsIHRoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9fcHJldiA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIHJldHVybiB0b1JldHVybjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVEaXNwbGF5JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGlzcGxheSgpIHtcbiAgICAgIGlmICh0aGlzLmdldFZhbHVlKCkgPT09IHRydWUpIHtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LnNldEF0dHJpYnV0ZSgnY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgICAgIHRoaXMuX19jaGVja2JveC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fX3ByZXYgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fX3ByZXYgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXQoQm9vbGVhbkNvbnRyb2xsZXIucHJvdG90eXBlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoQm9vbGVhbkNvbnRyb2xsZXIucHJvdG90eXBlKSwgJ3VwZGF0ZURpc3BsYXknLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQm9vbGVhbkNvbnRyb2xsZXI7XG59KENvbnRyb2xsZXIpO1xuXG52YXIgT3B0aW9uQ29udHJvbGxlciA9IGZ1bmN0aW9uIChfQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhPcHRpb25Db250cm9sbGVyLCBfQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIE9wdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgb3B0cykge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIE9wdGlvbkNvbnRyb2xsZXIpO1xuICAgIHZhciBfdGhpczIgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChPcHRpb25Db250cm9sbGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT3B0aW9uQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIHZhciBvcHRpb25zID0gb3B0cztcbiAgICB2YXIgX3RoaXMgPSBfdGhpczI7XG4gICAgX3RoaXMyLl9fc2VsZWN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VsZWN0Jyk7XG4gICAgaWYgKENvbW1vbi5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICB2YXIgbWFwID0ge307XG4gICAgICBDb21tb24uZWFjaChvcHRpb25zLCBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICBtYXBbZWxlbWVudF0gPSBlbGVtZW50O1xuICAgICAgfSk7XG4gICAgICBvcHRpb25zID0gbWFwO1xuICAgIH1cbiAgICBDb21tb24uZWFjaChvcHRpb25zLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgb3B0LmlubmVySFRNTCA9IGtleTtcbiAgICAgIG9wdC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdmFsdWUpO1xuICAgICAgX3RoaXMuX19zZWxlY3QuYXBwZW5kQ2hpbGQob3B0KTtcbiAgICB9KTtcbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX3NlbGVjdCwgJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBkZXNpcmVkVmFsdWUgPSB0aGlzLm9wdGlvbnNbdGhpcy5zZWxlY3RlZEluZGV4XS52YWx1ZTtcbiAgICAgIF90aGlzLnNldFZhbHVlKGRlc2lyZWRWYWx1ZSk7XG4gICAgfSk7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fc2VsZWN0KTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKE9wdGlvbkNvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAnc2V0VmFsdWUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWYWx1ZSh2KSB7XG4gICAgICB2YXIgdG9SZXR1cm4gPSBnZXQoT3B0aW9uQ29udHJvbGxlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihPcHRpb25Db250cm9sbGVyLnByb3RvdHlwZSksICdzZXRWYWx1ZScsIHRoaXMpLmNhbGwodGhpcywgdik7XG4gICAgICBpZiAodGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKHRoaXMsIHRoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9SZXR1cm47XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndXBkYXRlRGlzcGxheScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgICBpZiAoZG9tLmlzQWN0aXZlKHRoaXMuX19zZWxlY3QpKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX19zZWxlY3QudmFsdWUgPSB0aGlzLmdldFZhbHVlKCk7XG4gICAgICByZXR1cm4gZ2V0KE9wdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT3B0aW9uQ29udHJvbGxlci5wcm90b3R5cGUpLCAndXBkYXRlRGlzcGxheScsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBPcHRpb25Db250cm9sbGVyO1xufShDb250cm9sbGVyKTtcblxudmFyIFN0cmluZ0NvbnRyb2xsZXIgPSBmdW5jdGlvbiAoX0NvbnRyb2xsZXIpIHtcbiAgaW5oZXJpdHMoU3RyaW5nQ29udHJvbGxlciwgX0NvbnRyb2xsZXIpO1xuICBmdW5jdGlvbiBTdHJpbmdDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBTdHJpbmdDb250cm9sbGVyKTtcbiAgICB2YXIgX3RoaXMyID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoU3RyaW5nQ29udHJvbGxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKFN0cmluZ0NvbnRyb2xsZXIpKS5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpKTtcbiAgICB2YXIgX3RoaXMgPSBfdGhpczI7XG4gICAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2lucHV0LnZhbHVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25CbHVyKCkge1xuICAgICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX3RoaXMyLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIF90aGlzMi5fX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdrZXl1cCcsIG9uQ2hhbmdlKTtcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ2NoYW5nZScsIG9uQ2hhbmdlKTtcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ2JsdXInLCBvbkJsdXIpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICB0aGlzLmJsdXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX2lucHV0KTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKFN0cmluZ0NvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAndXBkYXRlRGlzcGxheScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgICBpZiAoIWRvbS5pc0FjdGl2ZSh0aGlzLl9faW5wdXQpKSB7XG4gICAgICAgIHRoaXMuX19pbnB1dC52YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXQoU3RyaW5nQ29udHJvbGxlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihTdHJpbmdDb250cm9sbGVyLnByb3RvdHlwZSksICd1cGRhdGVEaXNwbGF5JywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIFN0cmluZ0NvbnRyb2xsZXI7XG59KENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBudW1EZWNpbWFscyh4KSB7XG4gIHZhciBfeCA9IHgudG9TdHJpbmcoKTtcbiAgaWYgKF94LmluZGV4T2YoJy4nKSA+IC0xKSB7XG4gICAgcmV0dXJuIF94Lmxlbmd0aCAtIF94LmluZGV4T2YoJy4nKSAtIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG52YXIgTnVtYmVyQ29udHJvbGxlciA9IGZ1bmN0aW9uIChfQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhOdW1iZXJDb250cm9sbGVyLCBfQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIE51bWJlckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgTnVtYmVyQ29udHJvbGxlcik7XG4gICAgdmFyIF90aGlzID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoTnVtYmVyQ29udHJvbGxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKE51bWJlckNvbnRyb2xsZXIpKS5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpKTtcbiAgICB2YXIgX3BhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgICBfdGhpcy5fX21pbiA9IF9wYXJhbXMubWluO1xuICAgIF90aGlzLl9fbWF4ID0gX3BhcmFtcy5tYXg7XG4gICAgX3RoaXMuX19zdGVwID0gX3BhcmFtcy5zdGVwO1xuICAgIGlmIChDb21tb24uaXNVbmRlZmluZWQoX3RoaXMuX19zdGVwKSkge1xuICAgICAgaWYgKF90aGlzLmluaXRpYWxWYWx1ZSA9PT0gMCkge1xuICAgICAgICBfdGhpcy5fX2ltcGxpZWRTdGVwID0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLl9faW1wbGllZFN0ZXAgPSBNYXRoLnBvdygxMCwgTWF0aC5mbG9vcihNYXRoLmxvZyhNYXRoLmFicyhfdGhpcy5pbml0aWFsVmFsdWUpKSAvIE1hdGguTE4xMCkpIC8gMTA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIF90aGlzLl9faW1wbGllZFN0ZXAgPSBfdGhpcy5fX3N0ZXA7XG4gICAgfVxuICAgIF90aGlzLl9fcHJlY2lzaW9uID0gbnVtRGVjaW1hbHMoX3RoaXMuX19pbXBsaWVkU3RlcCk7XG4gICAgcmV0dXJuIF90aGlzO1xuICB9XG4gIGNyZWF0ZUNsYXNzKE51bWJlckNvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAnc2V0VmFsdWUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWYWx1ZSh2KSB7XG4gICAgICB2YXIgX3YgPSB2O1xuICAgICAgaWYgKHRoaXMuX19taW4gIT09IHVuZGVmaW5lZCAmJiBfdiA8IHRoaXMuX19taW4pIHtcbiAgICAgICAgX3YgPSB0aGlzLl9fbWluO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fbWF4ICE9PSB1bmRlZmluZWQgJiYgX3YgPiB0aGlzLl9fbWF4KSB7XG4gICAgICAgIF92ID0gdGhpcy5fX21heDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fc3RlcCAhPT0gdW5kZWZpbmVkICYmIF92ICUgdGhpcy5fX3N0ZXAgIT09IDApIHtcbiAgICAgICAgX3YgPSBNYXRoLnJvdW5kKF92IC8gdGhpcy5fX3N0ZXApICogdGhpcy5fX3N0ZXA7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0KE51bWJlckNvbnRyb2xsZXIucHJvdG90eXBlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTnVtYmVyQ29udHJvbGxlci5wcm90b3R5cGUpLCAnc2V0VmFsdWUnLCB0aGlzKS5jYWxsKHRoaXMsIF92KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdtaW4nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtaW4obWluVmFsdWUpIHtcbiAgICAgIHRoaXMuX19taW4gPSBtaW5WYWx1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ21heCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1heChtYXhWYWx1ZSkge1xuICAgICAgdGhpcy5fX21heCA9IG1heFZhbHVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc3RlcCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0ZXAoc3RlcFZhbHVlKSB7XG4gICAgICB0aGlzLl9fc3RlcCA9IHN0ZXBWYWx1ZTtcbiAgICAgIHRoaXMuX19pbXBsaWVkU3RlcCA9IHN0ZXBWYWx1ZTtcbiAgICAgIHRoaXMuX19wcmVjaXNpb24gPSBudW1EZWNpbWFscyhzdGVwVmFsdWUpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBOdW1iZXJDb250cm9sbGVyO1xufShDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gcm91bmRUb0RlY2ltYWwodmFsdWUsIGRlY2ltYWxzKSB7XG4gIHZhciB0ZW5UbyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XG4gIHJldHVybiBNYXRoLnJvdW5kKHZhbHVlICogdGVuVG8pIC8gdGVuVG87XG59XG52YXIgTnVtYmVyQ29udHJvbGxlckJveCA9IGZ1bmN0aW9uIChfTnVtYmVyQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhOdW1iZXJDb250cm9sbGVyQm94LCBfTnVtYmVyQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIE51bWJlckNvbnRyb2xsZXJCb3gob2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgTnVtYmVyQ29udHJvbGxlckJveCk7XG4gICAgdmFyIF90aGlzMiA9IHBvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKE51bWJlckNvbnRyb2xsZXJCb3guX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihOdW1iZXJDb250cm9sbGVyQm94KSkuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5LCBwYXJhbXMpKTtcbiAgICBfdGhpczIuX190cnVuY2F0aW9uU3VzcGVuZGVkID0gZmFsc2U7XG4gICAgdmFyIF90aGlzID0gX3RoaXMyO1xuICAgIHZhciBwcmV2WSA9IHZvaWQgMDtcbiAgICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICAgIHZhciBhdHRlbXB0ZWQgPSBwYXJzZUZsb2F0KF90aGlzLl9faW5wdXQudmFsdWUpO1xuICAgICAgaWYgKCFDb21tb24uaXNOYU4oYXR0ZW1wdGVkKSkge1xuICAgICAgICBfdGhpcy5zZXRWYWx1ZShhdHRlbXB0ZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBvbkZpbmlzaCgpIHtcbiAgICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICAgIG9uRmluaXNoKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VEcmFnKGUpIHtcbiAgICAgIHZhciBkaWZmID0gcHJldlkgLSBlLmNsaWVudFk7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5nZXRWYWx1ZSgpICsgZGlmZiAqIF90aGlzLl9faW1wbGllZFN0ZXApO1xuICAgICAgcHJldlkgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VVcCgpIHtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgIG9uRmluaXNoKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VEb3duKGUpIHtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgcHJldlkgPSBlLmNsaWVudFk7XG4gICAgfVxuICAgIF90aGlzMi5fX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBfdGhpczIuX19pbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAnY2hhbmdlJywgb25DaGFuZ2UpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAnYmx1cicsIG9uQmx1cik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIF90aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuYmx1cigpO1xuICAgICAgICBfdGhpcy5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSBmYWxzZTtcbiAgICAgICAgb25GaW5pc2goKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX2lucHV0KTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKE51bWJlckNvbnRyb2xsZXJCb3gsIFt7XG4gICAga2V5OiAndXBkYXRlRGlzcGxheScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgICB0aGlzLl9faW5wdXQudmFsdWUgPSB0aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA/IHRoaXMuZ2V0VmFsdWUoKSA6IHJvdW5kVG9EZWNpbWFsKHRoaXMuZ2V0VmFsdWUoKSwgdGhpcy5fX3ByZWNpc2lvbik7XG4gICAgICByZXR1cm4gZ2V0KE51bWJlckNvbnRyb2xsZXJCb3gucHJvdG90eXBlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTnVtYmVyQ29udHJvbGxlckJveC5wcm90b3R5cGUpLCAndXBkYXRlRGlzcGxheScsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBOdW1iZXJDb250cm9sbGVyQm94O1xufShOdW1iZXJDb250cm9sbGVyKTtcblxuZnVuY3Rpb24gbWFwKHYsIGkxLCBpMiwgbzEsIG8yKSB7XG4gIHJldHVybiBvMSArIChvMiAtIG8xKSAqICgodiAtIGkxKSAvIChpMiAtIGkxKSk7XG59XG52YXIgTnVtYmVyQ29udHJvbGxlclNsaWRlciA9IGZ1bmN0aW9uIChfTnVtYmVyQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhOdW1iZXJDb250cm9sbGVyU2xpZGVyLCBfTnVtYmVyQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIE51bWJlckNvbnRyb2xsZXJTbGlkZXIob2JqZWN0LCBwcm9wZXJ0eSwgbWluLCBtYXgsIHN0ZXApIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBOdW1iZXJDb250cm9sbGVyU2xpZGVyKTtcbiAgICB2YXIgX3RoaXMyID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoTnVtYmVyQ29udHJvbGxlclNsaWRlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKE51bWJlckNvbnRyb2xsZXJTbGlkZXIpKS5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHksIHsgbWluOiBtaW4sIG1heDogbWF4LCBzdGVwOiBzdGVwIH0pKTtcbiAgICB2YXIgX3RoaXMgPSBfdGhpczI7XG4gICAgX3RoaXMyLl9fYmFja2dyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX2ZvcmVncm91bmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkb20uYmluZChfdGhpczIuX19iYWNrZ3JvdW5kLCAnbW91c2Vkb3duJywgb25Nb3VzZURvd24pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2JhY2tncm91bmQsICd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgICBkb20uYWRkQ2xhc3MoX3RoaXMyLl9fYmFja2dyb3VuZCwgJ3NsaWRlcicpO1xuICAgIGRvbS5hZGRDbGFzcyhfdGhpczIuX19mb3JlZ3JvdW5kLCAnc2xpZGVyLWZnJyk7XG4gICAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgIG9uTW91c2VEcmFnKGUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbk1vdXNlRHJhZyhlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgYmdSZWN0ID0gX3RoaXMuX19iYWNrZ3JvdW5kLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgX3RoaXMuc2V0VmFsdWUobWFwKGUuY2xpZW50WCwgYmdSZWN0LmxlZnQsIGJnUmVjdC5yaWdodCwgX3RoaXMuX19taW4sIF90aGlzLl9fbWF4KSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VVcCgpIHtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgICAgb25Ub3VjaE1vdmUoZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKGUpIHtcbiAgICAgIHZhciBjbGllbnRYID0gZS50b3VjaGVzWzBdLmNsaWVudFg7XG4gICAgICB2YXIgYmdSZWN0ID0gX3RoaXMuX19iYWNrZ3JvdW5kLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgX3RoaXMuc2V0VmFsdWUobWFwKGNsaWVudFgsIGJnUmVjdC5sZWZ0LCBiZ1JlY3QucmlnaHQsIF90aGlzLl9fbWluLCBfdGhpcy5fX21heCkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvblRvdWNoRW5kKCkge1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCk7XG4gICAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIF90aGlzMi5fX2JhY2tncm91bmQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fZm9yZWdyb3VuZCk7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fYmFja2dyb3VuZCk7XG4gICAgcmV0dXJuIF90aGlzMjtcbiAgfVxuICBjcmVhdGVDbGFzcyhOdW1iZXJDb250cm9sbGVyU2xpZGVyLCBbe1xuICAgIGtleTogJ3VwZGF0ZURpc3BsYXknLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5KCkge1xuICAgICAgdmFyIHBjdCA9ICh0aGlzLmdldFZhbHVlKCkgLSB0aGlzLl9fbWluKSAvICh0aGlzLl9fbWF4IC0gdGhpcy5fX21pbik7XG4gICAgICB0aGlzLl9fZm9yZWdyb3VuZC5zdHlsZS53aWR0aCA9IHBjdCAqIDEwMCArICclJztcbiAgICAgIHJldHVybiBnZXQoTnVtYmVyQ29udHJvbGxlclNsaWRlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihOdW1iZXJDb250cm9sbGVyU2xpZGVyLnByb3RvdHlwZSksICd1cGRhdGVEaXNwbGF5JywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXJTbGlkZXI7XG59KE51bWJlckNvbnRyb2xsZXIpO1xuXG52YXIgRnVuY3Rpb25Db250cm9sbGVyID0gZnVuY3Rpb24gKF9Db250cm9sbGVyKSB7XG4gIGluaGVyaXRzKEZ1bmN0aW9uQ29udHJvbGxlciwgX0NvbnRyb2xsZXIpO1xuICBmdW5jdGlvbiBGdW5jdGlvbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSwgdGV4dCkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIEZ1bmN0aW9uQ29udHJvbGxlcik7XG4gICAgdmFyIF90aGlzMiA9IHBvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKEZ1bmN0aW9uQ29udHJvbGxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKEZ1bmN0aW9uQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBfdGhpczIuX19idXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBfdGhpczIuX19idXR0b24uaW5uZXJIVE1MID0gdGV4dCA9PT0gdW5kZWZpbmVkID8gJ0ZpcmUnIDogdGV4dDtcbiAgICBkb20uYmluZChfdGhpczIuX19idXR0b24sICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBfdGhpcy5maXJlKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gICAgZG9tLmFkZENsYXNzKF90aGlzMi5fX2J1dHRvbiwgJ2J1dHRvbicpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX2J1dHRvbik7XG4gICAgcmV0dXJuIF90aGlzMjtcbiAgfVxuICBjcmVhdGVDbGFzcyhGdW5jdGlvbkNvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAnZmlyZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGZpcmUoKSB7XG4gICAgICBpZiAodGhpcy5fX29uQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkNoYW5nZS5jYWxsKHRoaXMpO1xuICAgICAgfVxuICAgICAgdGhpcy5nZXRWYWx1ZSgpLmNhbGwodGhpcy5vYmplY3QpO1xuICAgICAgaWYgKHRoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbCh0aGlzLCB0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gRnVuY3Rpb25Db250cm9sbGVyO1xufShDb250cm9sbGVyKTtcblxudmFyIENvbG9yQ29udHJvbGxlciA9IGZ1bmN0aW9uIChfQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhDb2xvckNvbnRyb2xsZXIsIF9Db250cm9sbGVyKTtcbiAgZnVuY3Rpb24gQ29sb3JDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBDb2xvckNvbnRyb2xsZXIpO1xuICAgIHZhciBfdGhpczIgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChDb2xvckNvbnRyb2xsZXIuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihDb2xvckNvbnRyb2xsZXIpKS5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHkpKTtcbiAgICBfdGhpczIuX19jb2xvciA9IG5ldyBDb2xvcihfdGhpczIuZ2V0VmFsdWUoKSk7XG4gICAgX3RoaXMyLl9fdGVtcCA9IG5ldyBDb2xvcigwKTtcbiAgICB2YXIgX3RoaXMgPSBfdGhpczI7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkb20ubWFrZVNlbGVjdGFibGUoX3RoaXMyLmRvbUVsZW1lbnQsIGZhbHNlKTtcbiAgICBfdGhpczIuX19zZWxlY3RvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX3NlbGVjdG9yLmNsYXNzTmFtZSA9ICdzZWxlY3Rvcic7XG4gICAgX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX3NhdHVyYXRpb25fZmllbGQuY2xhc3NOYW1lID0gJ3NhdHVyYXRpb24tZmllbGQnO1xuICAgIF90aGlzMi5fX2ZpZWxkX2tub2IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBfdGhpczIuX19maWVsZF9rbm9iLmNsYXNzTmFtZSA9ICdmaWVsZC1rbm9iJztcbiAgICBfdGhpczIuX19maWVsZF9rbm9iX2JvcmRlciA9ICcycHggc29saWQgJztcbiAgICBfdGhpczIuX19odWVfa25vYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX2h1ZV9rbm9iLmNsYXNzTmFtZSA9ICdodWUta25vYic7XG4gICAgX3RoaXMyLl9faHVlX2ZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgX3RoaXMyLl9faHVlX2ZpZWxkLmNsYXNzTmFtZSA9ICdodWUtZmllbGQnO1xuICAgIF90aGlzMi5fX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICBfdGhpczIuX19pbnB1dC50eXBlID0gJ3RleHQnO1xuICAgIF90aGlzMi5fX2lucHV0X3RleHRTaGFkb3cgPSAnMCAxcHggMXB4ICc7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIG9uQmx1ci5jYWxsKHRoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAnYmx1cicsIG9uQmx1cik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fc2VsZWN0b3IsICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSAgICAgICAge1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMsICdkcmFnJykuYmluZCh3aW5kb3csICdtb3VzZXVwJywgZnVuY3Rpb24gKCkgICAgICAgIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKF90aGlzLl9fc2VsZWN0b3IsICdkcmFnJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBkb20uYmluZChfdGhpczIuX19zZWxlY3RvciwgJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoKSAgICAgICAge1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMsICdkcmFnJykuYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGZ1bmN0aW9uICgpICAgICAgICB7XG4gICAgICAgIGRvbS5yZW1vdmVDbGFzcyhfdGhpcy5fX3NlbGVjdG9yLCAnZHJhZycpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIHZhbHVlRmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBDb21tb24uZXh0ZW5kKF90aGlzMi5fX3NlbGVjdG9yLnN0eWxlLCB7XG4gICAgICB3aWR0aDogJzEyMnB4JyxcbiAgICAgIGhlaWdodDogJzEwMnB4JyxcbiAgICAgIHBhZGRpbmc6ICczcHgnLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzIyMicsXG4gICAgICBib3hTaGFkb3c6ICcwcHggMXB4IDNweCByZ2JhKDAsMCwwLDAuMyknXG4gICAgfSk7XG4gICAgQ29tbW9uLmV4dGVuZChfdGhpczIuX19maWVsZF9rbm9iLnN0eWxlLCB7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHdpZHRoOiAnMTJweCcsXG4gICAgICBoZWlnaHQ6ICcxMnB4JyxcbiAgICAgIGJvcmRlcjogX3RoaXMyLl9fZmllbGRfa25vYl9ib3JkZXIgKyAoX3RoaXMyLl9fY29sb3IudiA8IDAuNSA/ICcjZmZmJyA6ICcjMDAwJyksXG4gICAgICBib3hTaGFkb3c6ICcwcHggMXB4IDNweCByZ2JhKDAsMCwwLDAuNSknLFxuICAgICAgYm9yZGVyUmFkaXVzOiAnMTJweCcsXG4gICAgICB6SW5kZXg6IDFcbiAgICB9KTtcbiAgICBDb21tb24uZXh0ZW5kKF90aGlzMi5fX2h1ZV9rbm9iLnN0eWxlLCB7XG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHdpZHRoOiAnMTVweCcsXG4gICAgICBoZWlnaHQ6ICcycHgnLFxuICAgICAgYm9yZGVyUmlnaHQ6ICc0cHggc29saWQgI2ZmZicsXG4gICAgICB6SW5kZXg6IDFcbiAgICB9KTtcbiAgICBDb21tb24uZXh0ZW5kKF90aGlzMi5fX3NhdHVyYXRpb25fZmllbGQuc3R5bGUsIHtcbiAgICAgIHdpZHRoOiAnMTAwcHgnLFxuICAgICAgaGVpZ2h0OiAnMTAwcHgnLFxuICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgICAgbWFyZ2luUmlnaHQ6ICczcHgnLFxuICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXG4gICAgICBjdXJzb3I6ICdwb2ludGVyJ1xuICAgIH0pO1xuICAgIENvbW1vbi5leHRlbmQodmFsdWVGaWVsZC5zdHlsZSwge1xuICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgYmFja2dyb3VuZDogJ25vbmUnXG4gICAgfSk7XG4gICAgbGluZWFyR3JhZGllbnQodmFsdWVGaWVsZCwgJ3RvcCcsICdyZ2JhKDAsMCwwLDApJywgJyMwMDAnKTtcbiAgICBDb21tb24uZXh0ZW5kKF90aGlzMi5fX2h1ZV9maWVsZC5zdHlsZSwge1xuICAgICAgd2lkdGg6ICcxNXB4JyxcbiAgICAgIGhlaWdodDogJzEwMHB4JyxcbiAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjNTU1JyxcbiAgICAgIGN1cnNvcjogJ25zLXJlc2l6ZScsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgIHRvcDogJzNweCcsXG4gICAgICByaWdodDogJzNweCdcbiAgICB9KTtcbiAgICBodWVHcmFkaWVudChfdGhpczIuX19odWVfZmllbGQpO1xuICAgIENvbW1vbi5leHRlbmQoX3RoaXMyLl9faW5wdXQuc3R5bGUsIHtcbiAgICAgIG91dGxpbmU6ICdub25lJyxcbiAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgYm9yZGVyOiAwLFxuICAgICAgZm9udFdlaWdodDogJ2JvbGQnLFxuICAgICAgdGV4dFNoYWRvdzogX3RoaXMyLl9faW5wdXRfdGV4dFNoYWRvdyArICdyZ2JhKDAsMCwwLDAuNyknXG4gICAgfSk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZCwgJ21vdXNlZG93bicsIGZpZWxkRG93bik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZCwgJ3RvdWNoc3RhcnQnLCBmaWVsZERvd24pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2ZpZWxkX2tub2IsICdtb3VzZWRvd24nLCBmaWVsZERvd24pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2ZpZWxkX2tub2IsICd0b3VjaHN0YXJ0JywgZmllbGREb3duKTtcbiAgICBkb20uYmluZChfdGhpczIuX19odWVfZmllbGQsICdtb3VzZWRvd24nLCBmaWVsZERvd25IKTtcbiAgICBkb20uYmluZChfdGhpczIuX19odWVfZmllbGQsICd0b3VjaHN0YXJ0JywgZmllbGREb3duSCk7XG4gICAgZnVuY3Rpb24gZmllbGREb3duKGUpIHtcbiAgICAgIHNldFNWKGUpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0U1YpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAndG91Y2htb3ZlJywgc2V0U1YpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2V1cCcsIGZpZWxkVXBTVik7XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGZpZWxkVXBTVik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpZWxkRG93bkgoZSkge1xuICAgICAgc2V0SChlKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIHNldEgpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAndG91Y2htb3ZlJywgc2V0SCk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgZmllbGRVcEgpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAndG91Y2hlbmQnLCBmaWVsZFVwSCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpZWxkVXBTVigpIHtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0U1YpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd0b3VjaG1vdmUnLCBzZXRTVik7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmaWVsZFVwU1YpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGZpZWxkVXBTVik7XG4gICAgICBvbkZpbmlzaCgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaWVsZFVwSCgpIHtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0SCk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNobW92ZScsIHNldEgpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZXVwJywgZmllbGRVcEgpO1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGZpZWxkVXBIKTtcbiAgICAgIG9uRmluaXNoKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uQmx1cigpIHtcbiAgICAgIHZhciBpID0gaW50ZXJwcmV0KHRoaXMudmFsdWUpO1xuICAgICAgaWYgKGkgIT09IGZhbHNlKSB7XG4gICAgICAgIF90aGlzLl9fY29sb3IuX19zdGF0ZSA9IGk7XG4gICAgICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSBfdGhpcy5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uRmluaXNoKCkge1xuICAgICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5fX2NvbG9yLnRvT3JpZ2luYWwoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIF90aGlzMi5fX3NhdHVyYXRpb25fZmllbGQuYXBwZW5kQ2hpbGQodmFsdWVGaWVsZCk7XG4gICAgX3RoaXMyLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fZmllbGRfa25vYik7XG4gICAgX3RoaXMyLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZCk7XG4gICAgX3RoaXMyLl9fc2VsZWN0b3IuYXBwZW5kQ2hpbGQoX3RoaXMyLl9faHVlX2ZpZWxkKTtcbiAgICBfdGhpczIuX19odWVfZmllbGQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9faHVlX2tub2IpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX2lucHV0KTtcbiAgICBfdGhpczIuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChfdGhpczIuX19zZWxlY3Rvcik7XG4gICAgX3RoaXMyLnVwZGF0ZURpc3BsYXkoKTtcbiAgICBmdW5jdGlvbiBzZXRTVihlKSB7XG4gICAgICBpZiAoZS50eXBlLmluZGV4T2YoJ3RvdWNoJykgPT09IC0xKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICAgIHZhciBmaWVsZFJlY3QgPSBfdGhpcy5fX3NhdHVyYXRpb25fZmllbGQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB2YXIgX3JlZiA9IGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0gfHwgZSxcbiAgICAgICAgICBjbGllbnRYID0gX3JlZi5jbGllbnRYLFxuICAgICAgICAgIGNsaWVudFkgPSBfcmVmLmNsaWVudFk7XG4gICAgICB2YXIgcyA9IChjbGllbnRYIC0gZmllbGRSZWN0LmxlZnQpIC8gKGZpZWxkUmVjdC5yaWdodCAtIGZpZWxkUmVjdC5sZWZ0KTtcbiAgICAgIHZhciB2ID0gMSAtIChjbGllbnRZIC0gZmllbGRSZWN0LnRvcCkgLyAoZmllbGRSZWN0LmJvdHRvbSAtIGZpZWxkUmVjdC50b3ApO1xuICAgICAgaWYgKHYgPiAxKSB7XG4gICAgICAgIHYgPSAxO1xuICAgICAgfSBlbHNlIGlmICh2IDwgMCkge1xuICAgICAgICB2ID0gMDtcbiAgICAgIH1cbiAgICAgIGlmIChzID4gMSkge1xuICAgICAgICBzID0gMTtcbiAgICAgIH0gZWxzZSBpZiAocyA8IDApIHtcbiAgICAgICAgcyA9IDA7XG4gICAgICB9XG4gICAgICBfdGhpcy5fX2NvbG9yLnYgPSB2O1xuICAgICAgX3RoaXMuX19jb2xvci5zID0gcztcbiAgICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0SChlKSB7XG4gICAgICBpZiAoZS50eXBlLmluZGV4T2YoJ3RvdWNoJykgPT09IC0xKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICAgIHZhciBmaWVsZFJlY3QgPSBfdGhpcy5fX2h1ZV9maWVsZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHZhciBfcmVmMiA9IGUudG91Y2hlcyAmJiBlLnRvdWNoZXNbMF0gfHwgZSxcbiAgICAgICAgICBjbGllbnRZID0gX3JlZjIuY2xpZW50WTtcbiAgICAgIHZhciBoID0gMSAtIChjbGllbnRZIC0gZmllbGRSZWN0LnRvcCkgLyAoZmllbGRSZWN0LmJvdHRvbSAtIGZpZWxkUmVjdC50b3ApO1xuICAgICAgaWYgKGggPiAxKSB7XG4gICAgICAgIGggPSAxO1xuICAgICAgfSBlbHNlIGlmIChoIDwgMCkge1xuICAgICAgICBoID0gMDtcbiAgICAgIH1cbiAgICAgIF90aGlzLl9fY29sb3IuaCA9IGggKiAzNjA7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShfdGhpcy5fX2NvbG9yLnRvT3JpZ2luYWwoKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBfdGhpczI7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoQ29sb3JDb250cm9sbGVyLCBbe1xuICAgIGtleTogJ3VwZGF0ZURpc3BsYXknLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5KCkge1xuICAgICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIGlmIChpICE9PSBmYWxzZSkge1xuICAgICAgICB2YXIgbWlzbWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgQ29tbW9uLmVhY2goQ29sb3IuQ09NUE9ORU5UUywgZnVuY3Rpb24gKGNvbXBvbmVudCkge1xuICAgICAgICAgIGlmICghQ29tbW9uLmlzVW5kZWZpbmVkKGlbY29tcG9uZW50XSkgJiYgIUNvbW1vbi5pc1VuZGVmaW5lZCh0aGlzLl9fY29sb3IuX19zdGF0ZVtjb21wb25lbnRdKSAmJiBpW2NvbXBvbmVudF0gIT09IHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pIHtcbiAgICAgICAgICAgIG1pc21hdGNoID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBpZiAobWlzbWF0Y2gpIHtcbiAgICAgICAgICBDb21tb24uZXh0ZW5kKHRoaXMuX19jb2xvci5fX3N0YXRlLCBpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgQ29tbW9uLmV4dGVuZCh0aGlzLl9fdGVtcC5fX3N0YXRlLCB0aGlzLl9fY29sb3IuX19zdGF0ZSk7XG4gICAgICB0aGlzLl9fdGVtcC5hID0gMTtcbiAgICAgIHZhciBmbGlwID0gdGhpcy5fX2NvbG9yLnYgPCAwLjUgfHwgdGhpcy5fX2NvbG9yLnMgPiAwLjUgPyAyNTUgOiAwO1xuICAgICAgdmFyIF9mbGlwID0gMjU1IC0gZmxpcDtcbiAgICAgIENvbW1vbi5leHRlbmQodGhpcy5fX2ZpZWxkX2tub2Iuc3R5bGUsIHtcbiAgICAgICAgbWFyZ2luTGVmdDogMTAwICogdGhpcy5fX2NvbG9yLnMgLSA3ICsgJ3B4JyxcbiAgICAgICAgbWFyZ2luVG9wOiAxMDAgKiAoMSAtIHRoaXMuX19jb2xvci52KSAtIDcgKyAncHgnLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMuX190ZW1wLnRvSGV4U3RyaW5nKCksXG4gICAgICAgIGJvcmRlcjogdGhpcy5fX2ZpZWxkX2tub2JfYm9yZGVyICsgJ3JnYignICsgZmxpcCArICcsJyArIGZsaXAgKyAnLCcgKyBmbGlwICsgJyknXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX19odWVfa25vYi5zdHlsZS5tYXJnaW5Ub3AgPSAoMSAtIHRoaXMuX19jb2xvci5oIC8gMzYwKSAqIDEwMCArICdweCc7XG4gICAgICB0aGlzLl9fdGVtcC5zID0gMTtcbiAgICAgIHRoaXMuX190ZW1wLnYgPSAxO1xuICAgICAgbGluZWFyR3JhZGllbnQodGhpcy5fX3NhdHVyYXRpb25fZmllbGQsICdsZWZ0JywgJyNmZmYnLCB0aGlzLl9fdGVtcC50b0hleFN0cmluZygpKTtcbiAgICAgIHRoaXMuX19pbnB1dC52YWx1ZSA9IHRoaXMuX19jb2xvci50b1N0cmluZygpO1xuICAgICAgQ29tbW9uLmV4dGVuZCh0aGlzLl9faW5wdXQuc3R5bGUsIHtcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLl9fY29sb3IudG9IZXhTdHJpbmcoKSxcbiAgICAgICAgY29sb3I6ICdyZ2IoJyArIGZsaXAgKyAnLCcgKyBmbGlwICsgJywnICsgZmxpcCArICcpJyxcbiAgICAgICAgdGV4dFNoYWRvdzogdGhpcy5fX2lucHV0X3RleHRTaGFkb3cgKyAncmdiYSgnICsgX2ZsaXAgKyAnLCcgKyBfZmxpcCArICcsJyArIF9mbGlwICsgJywuNyknXG4gICAgICB9KTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIENvbG9yQ29udHJvbGxlcjtcbn0oQ29udHJvbGxlcik7XG52YXIgdmVuZG9ycyA9IFsnLW1vei0nLCAnLW8tJywgJy13ZWJraXQtJywgJy1tcy0nLCAnJ107XG5mdW5jdGlvbiBsaW5lYXJHcmFkaWVudChlbGVtLCB4LCBhLCBiKSB7XG4gIGVsZW0uc3R5bGUuYmFja2dyb3VuZCA9ICcnO1xuICBDb21tb24uZWFjaCh2ZW5kb3JzLCBmdW5jdGlvbiAodmVuZG9yKSB7XG4gICAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAnICsgdmVuZG9yICsgJ2xpbmVhci1ncmFkaWVudCgnICsgeCArICcsICcgKyBhICsgJyAwJSwgJyArIGIgKyAnIDEwMCUpOyAnO1xuICB9KTtcbn1cbmZ1bmN0aW9uIGh1ZUdyYWRpZW50KGVsZW0pIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW1vei1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwgI2ZmMDBmZiAxNyUsICMwMDAwZmYgMzQlLCAjMDBmZmZmIDUwJSwgIzAwZmYwMCA2NyUsICNmZmZmMDAgODQlLCAjZmYwMDAwIDEwMCUpOyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW8tbGluZWFyLWdyYWRpZW50KHRvcCwgICNmZjAwMDAgMCUsI2ZmMDBmZiAxNyUsIzAwMDBmZiAzNCUsIzAwZmZmZiA1MCUsIzAwZmYwMCA2NyUsI2ZmZmYwMCA4NCUsI2ZmMDAwMCAxMDAlKTsnO1xuICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6IC1tcy1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvcCwgICNmZjAwMDAgMCUsI2ZmMDBmZiAxNyUsIzAwMDBmZiAzNCUsIzAwZmZmZiA1MCUsIzAwZmYwMCA2NyUsI2ZmZmYwMCA4NCUsI2ZmMDAwMCAxMDAlKTsnO1xufVxuXG52YXIgY3NzID0ge1xuICBsb2FkOiBmdW5jdGlvbiBsb2FkKHVybCwgaW5kb2MpIHtcbiAgICB2YXIgZG9jID0gaW5kb2MgfHwgZG9jdW1lbnQ7XG4gICAgdmFyIGxpbmsgPSBkb2MuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgIGxpbmsudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgbGluay5ocmVmID0gdXJsO1xuICAgIGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGxpbmspO1xuICB9LFxuICBpbmplY3Q6IGZ1bmN0aW9uIGluamVjdChjc3NDb250ZW50LCBpbmRvYykge1xuICAgIHZhciBkb2MgPSBpbmRvYyB8fCBkb2N1bWVudDtcbiAgICB2YXIgaW5qZWN0ZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIGluamVjdGVkLnR5cGUgPSAndGV4dC9jc3MnO1xuICAgIGluamVjdGVkLmlubmVySFRNTCA9IGNzc0NvbnRlbnQ7XG4gICAgdmFyIGhlYWQgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICB0cnkge1xuICAgICAgaGVhZC5hcHBlbmRDaGlsZChpbmplY3RlZCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgIH1cbiAgfVxufTtcblxudmFyIHNhdmVEaWFsb2dDb250ZW50cyA9IFwiPGRpdiBpZD1cXFwiZGctc2F2ZVxcXCIgY2xhc3M9XFxcImRnIGRpYWxvZ3VlXFxcIj5cXG5cXG4gIEhlcmUncyB0aGUgbmV3IGxvYWQgcGFyYW1ldGVyIGZvciB5b3VyIDxjb2RlPkdVSTwvY29kZT4ncyBjb25zdHJ1Y3RvcjpcXG5cXG4gIDx0ZXh0YXJlYSBpZD1cXFwiZGctbmV3LWNvbnN0cnVjdG9yXFxcIj48L3RleHRhcmVhPlxcblxcbiAgPGRpdiBpZD1cXFwiZGctc2F2ZS1sb2NhbGx5XFxcIj5cXG5cXG4gICAgPGlucHV0IGlkPVxcXCJkZy1sb2NhbC1zdG9yYWdlXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCIvPiBBdXRvbWF0aWNhbGx5IHNhdmVcXG4gICAgdmFsdWVzIHRvIDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gb24gZXhpdC5cXG5cXG4gICAgPGRpdiBpZD1cXFwiZGctbG9jYWwtZXhwbGFpblxcXCI+VGhlIHZhbHVlcyBzYXZlZCB0byA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IHdpbGxcXG4gICAgICBvdmVycmlkZSB0aG9zZSBwYXNzZWQgdG8gPGNvZGU+ZGF0LkdVSTwvY29kZT4ncyBjb25zdHJ1Y3Rvci4gVGhpcyBtYWtlcyBpdFxcbiAgICAgIGVhc2llciB0byB3b3JrIGluY3JlbWVudGFsbHksIGJ1dCA8Y29kZT5sb2NhbFN0b3JhZ2U8L2NvZGU+IGlzIGZyYWdpbGUsXFxuICAgICAgYW5kIHlvdXIgZnJpZW5kcyBtYXkgbm90IHNlZSB0aGUgc2FtZSB2YWx1ZXMgeW91IGRvLlxcblxcbiAgICA8L2Rpdj5cXG5cXG4gIDwvZGl2PlxcblxcbjwvZGl2PlwiO1xuXG52YXIgQ29udHJvbGxlckZhY3RvcnkgPSBmdW5jdGlvbiBDb250cm9sbGVyRmFjdG9yeShvYmplY3QsIHByb3BlcnR5KSB7XG4gIHZhciBpbml0aWFsVmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICBpZiAoQ29tbW9uLmlzQXJyYXkoYXJndW1lbnRzWzJdKSB8fCBDb21tb24uaXNPYmplY3QoYXJndW1lbnRzWzJdKSkge1xuICAgIHJldHVybiBuZXcgT3B0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCBhcmd1bWVudHNbMl0pO1xuICB9XG4gIGlmIChDb21tb24uaXNOdW1iZXIoaW5pdGlhbFZhbHVlKSkge1xuICAgIGlmIChDb21tb24uaXNOdW1iZXIoYXJndW1lbnRzWzJdKSAmJiBDb21tb24uaXNOdW1iZXIoYXJndW1lbnRzWzNdKSkge1xuICAgICAgaWYgKENvbW1vbi5pc051bWJlcihhcmd1bWVudHNbNF0pKSB7XG4gICAgICAgIHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlclNsaWRlcihvYmplY3QsIHByb3BlcnR5LCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSwgYXJndW1lbnRzWzRdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlclNsaWRlcihvYmplY3QsIHByb3BlcnR5LCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgfVxuICAgIGlmIChDb21tb24uaXNOdW1iZXIoYXJndW1lbnRzWzRdKSkge1xuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyQm94KG9iamVjdCwgcHJvcGVydHksIHsgbWluOiBhcmd1bWVudHNbMl0sIG1heDogYXJndW1lbnRzWzNdLCBzdGVwOiBhcmd1bWVudHNbNF0gfSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgTnVtYmVyQ29udHJvbGxlckJveChvYmplY3QsIHByb3BlcnR5LCB7IG1pbjogYXJndW1lbnRzWzJdLCBtYXg6IGFyZ3VtZW50c1szXSB9KTtcbiAgfVxuICBpZiAoQ29tbW9uLmlzU3RyaW5nKGluaXRpYWxWYWx1ZSkpIHtcbiAgICByZXR1cm4gbmV3IFN0cmluZ0NvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gIH1cbiAgaWYgKENvbW1vbi5pc0Z1bmN0aW9uKGluaXRpYWxWYWx1ZSkpIHtcbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCAnJyk7XG4gIH1cbiAgaWYgKENvbW1vbi5pc0Jvb2xlYW4oaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgQm9vbGVhbkNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5mdW5jdGlvbiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcbiAgc2V0VGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcbn1cbnZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUkMSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG5cbnZhciBDZW50ZXJlZERpdiA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQ2VudGVyZWREaXYoKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgQ2VudGVyZWREaXYpO1xuICAgIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBDb21tb24uZXh0ZW5kKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUsIHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwwLDAsMC44KScsXG4gICAgICB0b3A6IDAsXG4gICAgICBsZWZ0OiAwLFxuICAgICAgZGlzcGxheTogJ25vbmUnLFxuICAgICAgekluZGV4OiAnMTAwMCcsXG4gICAgICBvcGFjaXR5OiAwLFxuICAgICAgV2Via2l0VHJhbnNpdGlvbjogJ29wYWNpdHkgMC4ycyBsaW5lYXInLFxuICAgICAgdHJhbnNpdGlvbjogJ29wYWNpdHkgMC4ycyBsaW5lYXInXG4gICAgfSk7XG4gICAgZG9tLm1ha2VGdWxsc2NyZWVuKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQpO1xuICAgIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIENvbW1vbi5leHRlbmQodGhpcy5kb21FbGVtZW50LnN0eWxlLCB7XG4gICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgIGRpc3BsYXk6ICdub25lJyxcbiAgICAgIHpJbmRleDogJzEwMDEnLFxuICAgICAgb3BhY2l0eTogMCxcbiAgICAgIFdlYmtpdFRyYW5zaXRpb246ICctd2Via2l0LXRyYW5zZm9ybSAwLjJzIGVhc2Utb3V0LCBvcGFjaXR5IDAuMnMgbGluZWFyJyxcbiAgICAgIHRyYW5zaXRpb246ICd0cmFuc2Zvcm0gMC4ycyBlYXNlLW91dCwgb3BhY2l0eSAwLjJzIGxpbmVhcidcbiAgICB9KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIGRvbS5iaW5kKHRoaXMuYmFja2dyb3VuZEVsZW1lbnQsICdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIF90aGlzLmhpZGUoKTtcbiAgICB9KTtcbiAgfVxuICBjcmVhdGVDbGFzcyhDZW50ZXJlZERpdiwgW3tcbiAgICBrZXk6ICdzaG93JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2hvdygpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB0aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcbiAgICAgIHRoaXMubGF5b3V0KCk7XG4gICAgICBDb21tb24uZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMTtcbiAgICAgICAgX3RoaXMuZG9tRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMTtcbiAgICAgICAgX3RoaXMuZG9tRWxlbWVudC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSAnc2NhbGUoMSknO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnaGlkZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdmFyIGhpZGUgPSBmdW5jdGlvbiBoaWRlKCkge1xuICAgICAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIF90aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIGRvbS51bmJpbmQoX3RoaXMuZG9tRWxlbWVudCwgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBoaWRlKTtcbiAgICAgICAgZG9tLnVuYmluZChfdGhpcy5kb21FbGVtZW50LCAndHJhbnNpdGlvbmVuZCcsIGhpZGUpO1xuICAgICAgICBkb20udW5iaW5kKF90aGlzLmRvbUVsZW1lbnQsICdvVHJhbnNpdGlvbkVuZCcsIGhpZGUpO1xuICAgICAgfTtcbiAgICAgIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBoaWRlKTtcbiAgICAgIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ3RyYW5zaXRpb25lbmQnLCBoaWRlKTtcbiAgICAgIGRvbS5iaW5kKHRoaXMuZG9tRWxlbWVudCwgJ29UcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gICAgICB0aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxLjEpJztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdsYXlvdXQnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBsYXlvdXQoKSB7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUubGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gMiAtIGRvbS5nZXRXaWR0aCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUudG9wID0gd2luZG93LmlubmVySGVpZ2h0IC8gMiAtIGRvbS5nZXRIZWlnaHQodGhpcy5kb21FbGVtZW50KSAvIDIgKyAncHgnO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQ2VudGVyZWREaXY7XG59KCk7XG5cbnZhciBzdHlsZVNoZWV0ID0gX19fJGluc2VydFN0eWxlKFwiLmRnIHVse2xpc3Qtc3R5bGU6bm9uZTttYXJnaW46MDtwYWRkaW5nOjA7d2lkdGg6MTAwJTtjbGVhcjpib3RofS5kZy5hY3twb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MDtoZWlnaHQ6MDt6LWluZGV4OjB9LmRnOm5vdCguYWMpIC5tYWlue292ZXJmbG93OmhpZGRlbn0uZGcubWFpbnstd2Via2l0LXRyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyOy1vLXRyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyOy1tb3otdHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXI7dHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXJ9LmRnLm1haW4udGFsbGVyLXRoYW4td2luZG93e292ZXJmbG93LXk6YXV0b30uZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3cgLmNsb3NlLWJ1dHRvbntvcGFjaXR5OjE7bWFyZ2luLXRvcDotMXB4O2JvcmRlci10b3A6MXB4IHNvbGlkICMyYzJjMmN9LmRnLm1haW4gdWwuY2xvc2VkIC5jbG9zZS1idXR0b257b3BhY2l0eToxICFpbXBvcnRhbnR9LmRnLm1haW46aG92ZXIgLmNsb3NlLWJ1dHRvbiwuZGcubWFpbiAuY2xvc2UtYnV0dG9uLmRyYWd7b3BhY2l0eToxfS5kZy5tYWluIC5jbG9zZS1idXR0b257LXdlYmtpdC10cmFuc2l0aW9uOm9wYWNpdHkgLjFzIGxpbmVhcjstby10cmFuc2l0aW9uOm9wYWNpdHkgLjFzIGxpbmVhcjstbW96LXRyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyO3RyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyO2JvcmRlcjowO2xpbmUtaGVpZ2h0OjE5cHg7aGVpZ2h0OjIwcHg7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5kZy5tYWluIC5jbG9zZS1idXR0b24uY2xvc2UtdG9we3Bvc2l0aW9uOnJlbGF0aXZlfS5kZy5tYWluIC5jbG9zZS1idXR0b24uY2xvc2UtYm90dG9te3Bvc2l0aW9uOmFic29sdXRlfS5kZy5tYWluIC5jbG9zZS1idXR0b246aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMTExfS5kZy5he2Zsb2F0OnJpZ2h0O21hcmdpbi1yaWdodDoxNXB4O292ZXJmbG93LXk6dmlzaWJsZX0uZGcuYS5oYXMtc2F2ZT51bC5jbG9zZS10b3B7bWFyZ2luLXRvcDowfS5kZy5hLmhhcy1zYXZlPnVsLmNsb3NlLWJvdHRvbXttYXJnaW4tdG9wOjI3cHh9LmRnLmEuaGFzLXNhdmU+dWwuY2xvc2Vke21hcmdpbi10b3A6MH0uZGcuYSAuc2F2ZS1yb3d7dG9wOjA7ei1pbmRleDoxMDAyfS5kZy5hIC5zYXZlLXJvdy5jbG9zZS10b3B7cG9zaXRpb246cmVsYXRpdmV9LmRnLmEgLnNhdmUtcm93LmNsb3NlLWJvdHRvbXtwb3NpdGlvbjpmaXhlZH0uZGcgbGl7LXdlYmtpdC10cmFuc2l0aW9uOmhlaWdodCAuMXMgZWFzZS1vdXQ7LW8tdHJhbnNpdGlvbjpoZWlnaHQgLjFzIGVhc2Utb3V0Oy1tb3otdHJhbnNpdGlvbjpoZWlnaHQgLjFzIGVhc2Utb3V0O3RyYW5zaXRpb246aGVpZ2h0IC4xcyBlYXNlLW91dDstd2Via2l0LXRyYW5zaXRpb246b3ZlcmZsb3cgLjFzIGxpbmVhcjstby10cmFuc2l0aW9uOm92ZXJmbG93IC4xcyBsaW5lYXI7LW1vei10cmFuc2l0aW9uOm92ZXJmbG93IC4xcyBsaW5lYXI7dHJhbnNpdGlvbjpvdmVyZmxvdyAuMXMgbGluZWFyfS5kZyBsaTpub3QoLmZvbGRlcil7Y3Vyc29yOmF1dG87aGVpZ2h0OjI3cHg7bGluZS1oZWlnaHQ6MjdweDtwYWRkaW5nOjAgNHB4IDAgNXB4fS5kZyBsaS5mb2xkZXJ7cGFkZGluZzowO2JvcmRlci1sZWZ0OjRweCBzb2xpZCByZ2JhKDAsMCwwLDApfS5kZyBsaS50aXRsZXtjdXJzb3I6cG9pbnRlcjttYXJnaW4tbGVmdDotNHB4fS5kZyAuY2xvc2VkIGxpOm5vdCgudGl0bGUpLC5kZyAuY2xvc2VkIHVsIGxpLC5kZyAuY2xvc2VkIHVsIGxpPip7aGVpZ2h0OjA7b3ZlcmZsb3c6aGlkZGVuO2JvcmRlcjowfS5kZyAuY3J7Y2xlYXI6Ym90aDtwYWRkaW5nLWxlZnQ6M3B4O2hlaWdodDoyN3B4O292ZXJmbG93OmhpZGRlbn0uZGcgLnByb3BlcnR5LW5hbWV7Y3Vyc29yOmRlZmF1bHQ7ZmxvYXQ6bGVmdDtjbGVhcjpsZWZ0O3dpZHRoOjQwJTtvdmVyZmxvdzpoaWRkZW47dGV4dC1vdmVyZmxvdzplbGxpcHNpc30uZGcgLmN7ZmxvYXQ6bGVmdDt3aWR0aDo2MCU7cG9zaXRpb246cmVsYXRpdmV9LmRnIC5jIGlucHV0W3R5cGU9dGV4dF17Ym9yZGVyOjA7bWFyZ2luLXRvcDo0cHg7cGFkZGluZzozcHg7d2lkdGg6MTAwJTtmbG9hdDpyaWdodH0uZGcgLmhhcy1zbGlkZXIgaW5wdXRbdHlwZT10ZXh0XXt3aWR0aDozMCU7bWFyZ2luLWxlZnQ6MH0uZGcgLnNsaWRlcntmbG9hdDpsZWZ0O3dpZHRoOjY2JTttYXJnaW4tbGVmdDotNXB4O21hcmdpbi1yaWdodDowO2hlaWdodDoxOXB4O21hcmdpbi10b3A6NHB4fS5kZyAuc2xpZGVyLWZne2hlaWdodDoxMDAlfS5kZyAuYyBpbnB1dFt0eXBlPWNoZWNrYm94XXttYXJnaW4tdG9wOjdweH0uZGcgLmMgc2VsZWN0e21hcmdpbi10b3A6NXB4fS5kZyAuY3IuZnVuY3Rpb24sLmRnIC5jci5mdW5jdGlvbiAucHJvcGVydHktbmFtZSwuZGcgLmNyLmZ1bmN0aW9uICosLmRnIC5jci5ib29sZWFuLC5kZyAuY3IuYm9vbGVhbiAqe2N1cnNvcjpwb2ludGVyfS5kZyAuY3IuY29sb3J7b3ZlcmZsb3c6dmlzaWJsZX0uZGcgLnNlbGVjdG9ye2Rpc3BsYXk6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTttYXJnaW4tbGVmdDotOXB4O21hcmdpbi10b3A6MjNweDt6LWluZGV4OjEwfS5kZyAuYzpob3ZlciAuc2VsZWN0b3IsLmRnIC5zZWxlY3Rvci5kcmFne2Rpc3BsYXk6YmxvY2t9LmRnIGxpLnNhdmUtcm93e3BhZGRpbmc6MH0uZGcgbGkuc2F2ZS1yb3cgLmJ1dHRvbntkaXNwbGF5OmlubGluZS1ibG9jaztwYWRkaW5nOjBweCA2cHh9LmRnLmRpYWxvZ3Vle2JhY2tncm91bmQtY29sb3I6IzIyMjt3aWR0aDo0NjBweDtwYWRkaW5nOjE1cHg7Zm9udC1zaXplOjEzcHg7bGluZS1oZWlnaHQ6MTVweH0jZGctbmV3LWNvbnN0cnVjdG9ye3BhZGRpbmc6MTBweDtjb2xvcjojMjIyO2ZvbnQtZmFtaWx5Ok1vbmFjbywgbW9ub3NwYWNlO2ZvbnQtc2l6ZToxMHB4O2JvcmRlcjowO3Jlc2l6ZTpub25lO2JveC1zaGFkb3c6aW5zZXQgMXB4IDFweCAxcHggIzg4ODt3b3JkLXdyYXA6YnJlYWstd29yZDttYXJnaW46MTJweCAwO2Rpc3BsYXk6YmxvY2s7d2lkdGg6NDQwcHg7b3ZlcmZsb3cteTpzY3JvbGw7aGVpZ2h0OjEwMHB4O3Bvc2l0aW9uOnJlbGF0aXZlfSNkZy1sb2NhbC1leHBsYWlue2Rpc3BsYXk6bm9uZTtmb250LXNpemU6MTFweDtsaW5lLWhlaWdodDoxN3B4O2JvcmRlci1yYWRpdXM6M3B4O2JhY2tncm91bmQtY29sb3I6IzMzMztwYWRkaW5nOjhweDttYXJnaW4tdG9wOjEwcHh9I2RnLWxvY2FsLWV4cGxhaW4gY29kZXtmb250LXNpemU6MTBweH0jZGF0LWd1aS1zYXZlLWxvY2FsbHl7ZGlzcGxheTpub25lfS5kZ3tjb2xvcjojZWVlO2ZvbnQ6MTFweCAnTHVjaWRhIEdyYW5kZScsIHNhbnMtc2VyaWY7dGV4dC1zaGFkb3c6MCAtMXB4IDAgIzExMX0uZGcubWFpbjo6LXdlYmtpdC1zY3JvbGxiYXJ7d2lkdGg6NXB4O2JhY2tncm91bmQ6IzFhMWExYX0uZGcubWFpbjo6LXdlYmtpdC1zY3JvbGxiYXItY29ybmVye2hlaWdodDowO2Rpc3BsYXk6bm9uZX0uZGcubWFpbjo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWJ7Ym9yZGVyLXJhZGl1czo1cHg7YmFja2dyb3VuZDojNjc2NzY3fS5kZyBsaTpub3QoLmZvbGRlcil7YmFja2dyb3VuZDojMWExYTFhO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICMyYzJjMmN9LmRnIGxpLnNhdmUtcm93e2xpbmUtaGVpZ2h0OjI1cHg7YmFja2dyb3VuZDojZGFkNWNiO2JvcmRlcjowfS5kZyBsaS5zYXZlLXJvdyBzZWxlY3R7bWFyZ2luLWxlZnQ6NXB4O3dpZHRoOjEwOHB4fS5kZyBsaS5zYXZlLXJvdyAuYnV0dG9ue21hcmdpbi1sZWZ0OjVweDttYXJnaW4tdG9wOjFweDtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6OXB4O2xpbmUtaGVpZ2h0OjdweDtwYWRkaW5nOjRweCA0cHggNXB4IDRweDtiYWNrZ3JvdW5kOiNjNWJkYWQ7Y29sb3I6I2ZmZjt0ZXh0LXNoYWRvdzowIDFweCAwICNiMGE1OGY7Ym94LXNoYWRvdzowIC0xcHggMCAjYjBhNThmO2N1cnNvcjpwb2ludGVyfS5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uLmdlYXJze2JhY2tncm91bmQ6I2M1YmRhZCB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBc0FBQUFOQ0FZQUFBQi85WlE3QUFBQUdYUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkpiV0ZuWlZKbFlXUjVjY2xsUEFBQUFRSkpSRUZVZU5waVlLQVUvUC8vUHdHSUMvQXBDQUJpQlNBVytJOEFDbEFjZ0t4UTRUOWhvTUFFVXJ4eDJRU0dONitlZ0RYKy92V1Q0ZTdOODJBTVlvUEF4L2V2d1dvWW9TWWJBQ1gyczdLeEN4emNzZXpEaDNldkZvREVCWVRFRXF5Y2dnV0F6QTlBdVVTUVFnZVlQYTlmUHY2L1lXbS9BY3g1SVBiN3R5L2Z3K1FaYmx3Njd2RHM4UjBZSHlRaGdPYngreUFKa0JxbUc1ZFBQRGgxYVBPR1IvZXVnVzBHNHZsSW9USWZ5RmNBK1Fla2hoSEpoUGRReGJpQUlndU1CVFFaclBENzEwOE02cm9XWURGUWlJQUF2NkFvdy8xYkZ3WGdpcytmMkxVQXlud29JYU5jejhYTngzRGw3TUVKVURHUXB4OWd0UThZQ3VlQitEMjZPRUNBQVFEYWR0N2U0NkQ0MlFBQUFBQkpSVTVFcmtKZ2dnPT0pIDJweCAxcHggbm8tcmVwZWF0O2hlaWdodDo3cHg7d2lkdGg6OHB4fS5kZyBsaS5zYXZlLXJvdyAuYnV0dG9uOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2JhYjE5ZTtib3gtc2hhZG93OjAgLTFweCAwICNiMGE1OGZ9LmRnIGxpLmZvbGRlcntib3JkZXItYm90dG9tOjB9LmRnIGxpLnRpdGxle3BhZGRpbmctbGVmdDoxNnB4O2JhY2tncm91bmQ6IzAwMCB1cmwoZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQlFBRkFKRUFBUC8vLy9QejgvLy8vLy8vL3lINUJBRUFBQUlBTEFBQUFBQUZBQVVBQUFJSWxJK2hLZ0Z4b0NnQU93PT0pIDZweCAxMHB4IG5vLXJlcGVhdDtjdXJzb3I6cG9pbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9LmRnIC5jbG9zZWQgbGkudGl0bGV7YmFja2dyb3VuZC1pbWFnZTp1cmwoZGF0YTppbWFnZS9naWY7YmFzZTY0LFIwbEdPRGxoQlFBRkFKRUFBUC8vLy9QejgvLy8vLy8vL3lINUJBRUFBQUlBTEFBQUFBQUZBQVVBQUFJSWxHSVdxTUNiV0FFQU93PT0pfS5kZyAuY3IuYm9vbGVhbntib3JkZXItbGVmdDozcHggc29saWQgIzgwNjc4N30uZGcgLmNyLmNvbG9ye2JvcmRlci1sZWZ0OjNweCBzb2xpZH0uZGcgLmNyLmZ1bmN0aW9ue2JvcmRlci1sZWZ0OjNweCBzb2xpZCAjZTYxZDVmfS5kZyAuY3IubnVtYmVye2JvcmRlci1sZWZ0OjNweCBzb2xpZCAjMkZBMUQ2fS5kZyAuY3IubnVtYmVyIGlucHV0W3R5cGU9dGV4dF17Y29sb3I6IzJGQTFENn0uZGcgLmNyLnN0cmluZ3tib3JkZXItbGVmdDozcHggc29saWQgIzFlZDM2Zn0uZGcgLmNyLnN0cmluZyBpbnB1dFt0eXBlPXRleHRde2NvbG9yOiMxZWQzNmZ9LmRnIC5jci5mdW5jdGlvbjpob3ZlciwuZGcgLmNyLmJvb2xlYW46aG92ZXJ7YmFja2dyb3VuZDojMTExfS5kZyAuYyBpbnB1dFt0eXBlPXRleHRde2JhY2tncm91bmQ6IzMwMzAzMDtvdXRsaW5lOm5vbmV9LmRnIC5jIGlucHV0W3R5cGU9dGV4dF06aG92ZXJ7YmFja2dyb3VuZDojM2MzYzNjfS5kZyAuYyBpbnB1dFt0eXBlPXRleHRdOmZvY3Vze2JhY2tncm91bmQ6IzQ5NDk0OTtjb2xvcjojZmZmfS5kZyAuYyAuc2xpZGVye2JhY2tncm91bmQ6IzMwMzAzMDtjdXJzb3I6ZXctcmVzaXplfS5kZyAuYyAuc2xpZGVyLWZne2JhY2tncm91bmQ6IzJGQTFENjttYXgtd2lkdGg6MTAwJX0uZGcgLmMgLnNsaWRlcjpob3ZlcntiYWNrZ3JvdW5kOiMzYzNjM2N9LmRnIC5jIC5zbGlkZXI6aG92ZXIgLnNsaWRlci1mZ3tiYWNrZ3JvdW5kOiM0NGFiZGF9XFxuXCIpO1xuXG5jc3MuaW5qZWN0KHN0eWxlU2hlZXQpO1xudmFyIENTU19OQU1FU1BBQ0UgPSAnZGcnO1xudmFyIEhJREVfS0VZX0NPREUgPSA3MjtcbnZhciBDTE9TRV9CVVRUT05fSEVJR0hUID0gMjA7XG52YXIgREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FID0gJ0RlZmF1bHQnO1xudmFyIFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UgPSBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuICEhd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufSgpO1xudmFyIFNBVkVfRElBTE9HVUUgPSB2b2lkIDA7XG52YXIgYXV0b1BsYWNlVmlyZ2luID0gdHJ1ZTtcbnZhciBhdXRvUGxhY2VDb250YWluZXIgPSB2b2lkIDA7XG52YXIgaGlkZSA9IGZhbHNlO1xudmFyIGhpZGVhYmxlR3VpcyA9IFtdO1xudmFyIEdVSSA9IGZ1bmN0aW9uIEdVSShwYXJzKSB7XG4gIHZhciBfdGhpcyA9IHRoaXM7XG4gIHZhciBwYXJhbXMgPSBwYXJzIHx8IHt9O1xuICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdGhpcy5fX3VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgdGhpcy5kb21FbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuX191bCk7XG4gIGRvbS5hZGRDbGFzcyh0aGlzLmRvbUVsZW1lbnQsIENTU19OQU1FU1BBQ0UpO1xuICB0aGlzLl9fZm9sZGVycyA9IHt9O1xuICB0aGlzLl9fY29udHJvbGxlcnMgPSBbXTtcbiAgdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzID0gW107XG4gIHRoaXMuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnMgPSBbXTtcbiAgdGhpcy5fX2xpc3RlbmluZyA9IFtdO1xuICBwYXJhbXMgPSBDb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgY2xvc2VPblRvcDogZmFsc2UsXG4gICAgYXV0b1BsYWNlOiB0cnVlLFxuICAgIHdpZHRoOiBHVUkuREVGQVVMVF9XSURUSFxuICB9KTtcbiAgcGFyYW1zID0gQ29tbW9uLmRlZmF1bHRzKHBhcmFtcywge1xuICAgIHJlc2l6YWJsZTogcGFyYW1zLmF1dG9QbGFjZSxcbiAgICBoaWRlYWJsZTogcGFyYW1zLmF1dG9QbGFjZVxuICB9KTtcbiAgaWYgKCFDb21tb24uaXNVbmRlZmluZWQocGFyYW1zLmxvYWQpKSB7XG4gICAgaWYgKHBhcmFtcy5wcmVzZXQpIHtcbiAgICAgIHBhcmFtcy5sb2FkLnByZXNldCA9IHBhcmFtcy5wcmVzZXQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBhcmFtcy5sb2FkID0geyBwcmVzZXQ6IERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRSB9O1xuICB9XG4gIGlmIChDb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkgJiYgcGFyYW1zLmhpZGVhYmxlKSB7XG4gICAgaGlkZWFibGVHdWlzLnB1c2godGhpcyk7XG4gIH1cbiAgcGFyYW1zLnJlc2l6YWJsZSA9IENvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSAmJiBwYXJhbXMucmVzaXphYmxlO1xuICBpZiAocGFyYW1zLmF1dG9QbGFjZSAmJiBDb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnNjcm9sbGFibGUpKSB7XG4gICAgcGFyYW1zLnNjcm9sbGFibGUgPSB0cnVlO1xuICB9XG4gIHZhciB1c2VMb2NhbFN0b3JhZ2UgPSBTVVBQT1JUU19MT0NBTF9TVE9SQUdFICYmIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2godGhpcywgJ2lzTG9jYWwnKSkgPT09ICd0cnVlJztcbiAgdmFyIHNhdmVUb0xvY2FsU3RvcmFnZSA9IHZvaWQgMDtcbiAgdmFyIHRpdGxlUm93ID0gdm9pZCAwO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLFxuICB7XG4gICAgcGFyZW50OiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5wYXJlbnQ7XG4gICAgICB9XG4gICAgfSxcbiAgICBzY3JvbGxhYmxlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5zY3JvbGxhYmxlO1xuICAgICAgfVxuICAgIH0sXG4gICAgYXV0b1BsYWNlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5hdXRvUGxhY2U7XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9zZU9uVG9wOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5jbG9zZU9uVG9wO1xuICAgICAgfVxuICAgIH0sXG4gICAgcHJlc2V0OiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgaWYgKF90aGlzLnBhcmVudCkge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5nZXRSb290KCkucHJlc2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJhbXMubG9hZC5wcmVzZXQ7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgICBpZiAoX3RoaXMucGFyZW50KSB7XG4gICAgICAgICAgX3RoaXMuZ2V0Um9vdCgpLnByZXNldCA9IHY7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyYW1zLmxvYWQucHJlc2V0ID0gdjtcbiAgICAgICAgfVxuICAgICAgICBzZXRQcmVzZXRTZWxlY3RJbmRleCh0aGlzKTtcbiAgICAgICAgX3RoaXMucmV2ZXJ0KCk7XG4gICAgICB9XG4gICAgfSxcbiAgICB3aWR0aDoge1xuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQkJDEoKSB7XG4gICAgICAgIHJldHVybiBwYXJhbXMud2lkdGg7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgICBwYXJhbXMud2lkdGggPSB2O1xuICAgICAgICBzZXRXaWR0aChfdGhpcywgdik7XG4gICAgICB9XG4gICAgfSxcbiAgICBuYW1lOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5uYW1lO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gc2V0JCQxKHYpIHtcbiAgICAgICAgcGFyYW1zLm5hbWUgPSB2O1xuICAgICAgICBpZiAodGl0bGVSb3cpIHtcbiAgICAgICAgICB0aXRsZVJvdy5pbm5lckhUTUwgPSBwYXJhbXMubmFtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2VkOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5jbG9zZWQ7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgICBwYXJhbXMuY2xvc2VkID0gdjtcbiAgICAgICAgaWYgKHBhcmFtcy5jbG9zZWQpIHtcbiAgICAgICAgICBkb20uYWRkQ2xhc3MoX3RoaXMuX191bCwgR1VJLkNMQVNTX0NMT1NFRCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9tLnJlbW92ZUNsYXNzKF90aGlzLl9fdWwsIEdVSS5DTEFTU19DTE9TRUQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub25SZXNpemUoKTtcbiAgICAgICAgaWYgKF90aGlzLl9fY2xvc2VCdXR0b24pIHtcbiAgICAgICAgICBfdGhpcy5fX2Nsb3NlQnV0dG9uLmlubmVySFRNTCA9IHYgPyBHVUkuVEVYVF9PUEVOIDogR1VJLlRFWFRfQ0xPU0VEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBsb2FkOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy5sb2FkO1xuICAgICAgfVxuICAgIH0sXG4gICAgdXNlTG9jYWxTdG9yYWdlOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHVzZUxvY2FsU3RvcmFnZTtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCQkMShib29sKSB7XG4gICAgICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG4gICAgICAgICAgdXNlTG9jYWxTdG9yYWdlID0gYm9vbDtcbiAgICAgICAgICBpZiAoYm9vbCkge1xuICAgICAgICAgICAgZG9tLmJpbmQod2luZG93LCAndW5sb2FkJywgc2F2ZVRvTG9jYWxTdG9yYWdlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9tLnVuYmluZCh3aW5kb3csICd1bmxvYWQnLCBzYXZlVG9Mb2NhbFN0b3JhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKF90aGlzLCAnaXNMb2NhbCcpLCBib29sKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIGlmIChDb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkpIHtcbiAgICB0aGlzLmNsb3NlZCA9IHBhcmFtcy5jbG9zZWQgfHwgZmFsc2U7XG4gICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgR1VJLkNMQVNTX01BSU4pO1xuICAgIGRvbS5tYWtlU2VsZWN0YWJsZSh0aGlzLmRvbUVsZW1lbnQsIGZhbHNlKTtcbiAgICBpZiAoU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSkge1xuICAgICAgaWYgKHVzZUxvY2FsU3RvcmFnZSkge1xuICAgICAgICBfdGhpcy51c2VMb2NhbFN0b3JhZ2UgPSB0cnVlO1xuICAgICAgICB2YXIgc2F2ZWRHdWkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKHRoaXMsICdndWknKSk7XG4gICAgICAgIGlmIChzYXZlZEd1aSkge1xuICAgICAgICAgIHBhcmFtcy5sb2FkID0gSlNPTi5wYXJzZShzYXZlZEd1aSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5fX2Nsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fX2Nsb3NlQnV0dG9uLmlubmVySFRNTCA9IEdVSS5URVhUX0NMT1NFRDtcbiAgICBkb20uYWRkQ2xhc3ModGhpcy5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfQ0xPU0VfQlVUVE9OKTtcbiAgICBpZiAocGFyYW1zLmNsb3NlT25Ub3ApIHtcbiAgICAgIGRvbS5hZGRDbGFzcyh0aGlzLl9fY2xvc2VCdXR0b24sIEdVSS5DTEFTU19DTE9TRV9UT1ApO1xuICAgICAgdGhpcy5kb21FbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9fY2xvc2VCdXR0b24sIHRoaXMuZG9tRWxlbWVudC5jaGlsZE5vZGVzWzBdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0NMT1NFX0JPVFRPTSk7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX2Nsb3NlQnV0dG9uKTtcbiAgICB9XG4gICAgZG9tLmJpbmQodGhpcy5fX2Nsb3NlQnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5jbG9zZWQgPSAhX3RoaXMuY2xvc2VkO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGlmIChwYXJhbXMuY2xvc2VkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmFtcy5jbG9zZWQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgdGl0bGVSb3dOYW1lID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGFyYW1zLm5hbWUpO1xuICAgIGRvbS5hZGRDbGFzcyh0aXRsZVJvd05hbWUsICdjb250cm9sbGVyLW5hbWUnKTtcbiAgICB0aXRsZVJvdyA9IGFkZFJvdyhfdGhpcywgdGl0bGVSb3dOYW1lKTtcbiAgICB2YXIgb25DbGlja1RpdGxlID0gZnVuY3Rpb24gb25DbGlja1RpdGxlKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIF90aGlzLmNsb3NlZCA9ICFfdGhpcy5jbG9zZWQ7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBkb20uYWRkQ2xhc3ModGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICBkb20uYWRkQ2xhc3ModGl0bGVSb3csICd0aXRsZScpO1xuICAgIGRvbS5iaW5kKHRpdGxlUm93LCAnY2xpY2snLCBvbkNsaWNrVGl0bGUpO1xuICAgIGlmICghcGFyYW1zLmNsb3NlZCkge1xuICAgICAgdGhpcy5jbG9zZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgaWYgKHBhcmFtcy5hdXRvUGxhY2UpIHtcbiAgICBpZiAoQ29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpKSB7XG4gICAgICBpZiAoYXV0b1BsYWNlVmlyZ2luKSB7XG4gICAgICAgIGF1dG9QbGFjZUNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBkb20uYWRkQ2xhc3MoYXV0b1BsYWNlQ29udGFpbmVyLCBDU1NfTkFNRVNQQUNFKTtcbiAgICAgICAgZG9tLmFkZENsYXNzKGF1dG9QbGFjZUNvbnRhaW5lciwgR1VJLkNMQVNTX0FVVE9fUExBQ0VfQ09OVEFJTkVSKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhdXRvUGxhY2VDb250YWluZXIpO1xuICAgICAgICBhdXRvUGxhY2VWaXJnaW4gPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGF1dG9QbGFjZUNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgR1VJLkNMQVNTX0FVVE9fUExBQ0UpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgICBzZXRXaWR0aChfdGhpcywgcGFyYW1zLndpZHRoKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5fX3Jlc2l6ZUhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgX3RoaXMub25SZXNpemVEZWJvdW5jZWQoKTtcbiAgfTtcbiAgZG9tLmJpbmQod2luZG93LCAncmVzaXplJywgdGhpcy5fX3Jlc2l6ZUhhbmRsZXIpO1xuICBkb20uYmluZCh0aGlzLl9fdWwsICd3ZWJraXRUcmFuc2l0aW9uRW5kJywgdGhpcy5fX3Jlc2l6ZUhhbmRsZXIpO1xuICBkb20uYmluZCh0aGlzLl9fdWwsICd0cmFuc2l0aW9uZW5kJywgdGhpcy5fX3Jlc2l6ZUhhbmRsZXIpO1xuICBkb20uYmluZCh0aGlzLl9fdWwsICdvVHJhbnNpdGlvbkVuZCcsIHRoaXMuX19yZXNpemVIYW5kbGVyKTtcbiAgdGhpcy5vblJlc2l6ZSgpO1xuICBpZiAocGFyYW1zLnJlc2l6YWJsZSkge1xuICAgIGFkZFJlc2l6ZUhhbmRsZSh0aGlzKTtcbiAgfVxuICBzYXZlVG9Mb2NhbFN0b3JhZ2UgPSBmdW5jdGlvbiBzYXZlVG9Mb2NhbFN0b3JhZ2UoKSB7XG4gICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaChfdGhpcywgJ2lzTG9jYWwnKSkgPT09ICd0cnVlJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaChfdGhpcywgJ2d1aScpLCBKU09OLnN0cmluZ2lmeShfdGhpcy5nZXRTYXZlT2JqZWN0KCkpKTtcbiAgICB9XG4gIH07XG4gIHRoaXMuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSA9IHNhdmVUb0xvY2FsU3RvcmFnZTtcbiAgZnVuY3Rpb24gcmVzZXRXaWR0aCgpIHtcbiAgICB2YXIgcm9vdCA9IF90aGlzLmdldFJvb3QoKTtcbiAgICByb290LndpZHRoICs9IDE7XG4gICAgQ29tbW9uLmRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJvb3Qud2lkdGggLT0gMTtcbiAgICB9KTtcbiAgfVxuICBpZiAoIXBhcmFtcy5wYXJlbnQpIHtcbiAgICByZXNldFdpZHRoKCk7XG4gIH1cbn07XG5HVUkudG9nZ2xlSGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgaGlkZSA9ICFoaWRlO1xuICBDb21tb24uZWFjaChoaWRlYWJsZUd1aXMsIGZ1bmN0aW9uIChndWkpIHtcbiAgICBndWkuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gaGlkZSA/ICdub25lJyA6ICcnO1xuICB9KTtcbn07XG5HVUkuQ0xBU1NfQVVUT19QTEFDRSA9ICdhJztcbkdVSS5DTEFTU19BVVRPX1BMQUNFX0NPTlRBSU5FUiA9ICdhYyc7XG5HVUkuQ0xBU1NfTUFJTiA9ICdtYWluJztcbkdVSS5DTEFTU19DT05UUk9MTEVSX1JPVyA9ICdjcic7XG5HVUkuQ0xBU1NfVE9PX1RBTEwgPSAndGFsbGVyLXRoYW4td2luZG93JztcbkdVSS5DTEFTU19DTE9TRUQgPSAnY2xvc2VkJztcbkdVSS5DTEFTU19DTE9TRV9CVVRUT04gPSAnY2xvc2UtYnV0dG9uJztcbkdVSS5DTEFTU19DTE9TRV9UT1AgPSAnY2xvc2UtdG9wJztcbkdVSS5DTEFTU19DTE9TRV9CT1RUT00gPSAnY2xvc2UtYm90dG9tJztcbkdVSS5DTEFTU19EUkFHID0gJ2RyYWcnO1xuR1VJLkRFRkFVTFRfV0lEVEggPSAyNDU7XG5HVUkuVEVYVF9DTE9TRUQgPSAnQ2xvc2UgQ29udHJvbHMnO1xuR1VJLlRFWFRfT1BFTiA9ICdPcGVuIENvbnRyb2xzJztcbkdVSS5fa2V5ZG93bkhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50eXBlICE9PSAndGV4dCcgJiYgKGUud2hpY2ggPT09IEhJREVfS0VZX0NPREUgfHwgZS5rZXlDb2RlID09PSBISURFX0tFWV9DT0RFKSkge1xuICAgIEdVSS50b2dnbGVIaWRlKCk7XG4gIH1cbn07XG5kb20uYmluZCh3aW5kb3csICdrZXlkb3duJywgR1VJLl9rZXlkb3duSGFuZGxlciwgZmFsc2UpO1xuQ29tbW9uLmV4dGVuZChHVUkucHJvdG90eXBlLFxue1xuICBhZGQ6IGZ1bmN0aW9uIGFkZChvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgcmV0dXJuIF9hZGQodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwge1xuICAgICAgZmFjdG9yeUFyZ3M6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMilcbiAgICB9KTtcbiAgfSxcbiAgYWRkQ29sb3I6IGZ1bmN0aW9uIGFkZENvbG9yKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gX2FkZCh0aGlzLCBvYmplY3QsIHByb3BlcnR5LCB7XG4gICAgICBjb2xvcjogdHJ1ZVxuICAgIH0pO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZShjb250cm9sbGVyKSB7XG4gICAgdGhpcy5fX3VsLnJlbW92ZUNoaWxkKGNvbnRyb2xsZXIuX19saSk7XG4gICAgdGhpcy5fX2NvbnRyb2xsZXJzLnNwbGljZSh0aGlzLl9fY29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSwgMSk7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBDb21tb24uZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgX3RoaXMub25SZXNpemUoKTtcbiAgICB9KTtcbiAgfSxcbiAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignT25seSB0aGUgcm9vdCBHVUkgc2hvdWxkIGJlIHJlbW92ZWQgd2l0aCAuZGVzdHJveSgpLiAnICsgJ0ZvciBzdWJmb2xkZXJzLCB1c2UgZ3VpLnJlbW92ZUZvbGRlcihmb2xkZXIpIGluc3RlYWQuJyk7XG4gICAgfVxuICAgIGlmICh0aGlzLmF1dG9QbGFjZSkge1xuICAgICAgYXV0b1BsYWNlQ29udGFpbmVyLnJlbW92ZUNoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG4gICAgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgQ29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uIChzdWJmb2xkZXIpIHtcbiAgICAgIF90aGlzLnJlbW92ZUZvbGRlcihzdWJmb2xkZXIpO1xuICAgIH0pO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAna2V5ZG93bicsIEdVSS5fa2V5ZG93bkhhbmRsZXIsIGZhbHNlKTtcbiAgICByZW1vdmVMaXN0ZW5lcnModGhpcyk7XG4gIH0sXG4gIGFkZEZvbGRlcjogZnVuY3Rpb24gYWRkRm9sZGVyKG5hbWUpIHtcbiAgICBpZiAodGhpcy5fX2ZvbGRlcnNbbmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgYWxyZWFkeSBoYXZlIGEgZm9sZGVyIGluIHRoaXMgR1VJIGJ5IHRoZScgKyAnIG5hbWUgXCInICsgbmFtZSArICdcIicpO1xuICAgIH1cbiAgICB2YXIgbmV3R3VpUGFyYW1zID0geyBuYW1lOiBuYW1lLCBwYXJlbnQ6IHRoaXMgfTtcbiAgICBuZXdHdWlQYXJhbXMuYXV0b1BsYWNlID0gdGhpcy5hdXRvUGxhY2U7XG4gICAgaWYgKHRoaXMubG9hZCAmJlxuICAgIHRoaXMubG9hZC5mb2xkZXJzICYmXG4gICAgdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV0pIHtcbiAgICAgIG5ld0d1aVBhcmFtcy5jbG9zZWQgPSB0aGlzLmxvYWQuZm9sZGVyc1tuYW1lXS5jbG9zZWQ7XG4gICAgICBuZXdHdWlQYXJhbXMubG9hZCA9IHRoaXMubG9hZC5mb2xkZXJzW25hbWVdO1xuICAgIH1cbiAgICB2YXIgZ3VpID0gbmV3IEdVSShuZXdHdWlQYXJhbXMpO1xuICAgIHRoaXMuX19mb2xkZXJzW25hbWVdID0gZ3VpO1xuICAgIHZhciBsaSA9IGFkZFJvdyh0aGlzLCBndWkuZG9tRWxlbWVudCk7XG4gICAgZG9tLmFkZENsYXNzKGxpLCAnZm9sZGVyJyk7XG4gICAgcmV0dXJuIGd1aTtcbiAgfSxcbiAgcmVtb3ZlRm9sZGVyOiBmdW5jdGlvbiByZW1vdmVGb2xkZXIoZm9sZGVyKSB7XG4gICAgdGhpcy5fX3VsLnJlbW92ZUNoaWxkKGZvbGRlci5kb21FbGVtZW50LnBhcmVudEVsZW1lbnQpO1xuICAgIGRlbGV0ZSB0aGlzLl9fZm9sZGVyc1tmb2xkZXIubmFtZV07XG4gICAgaWYgKHRoaXMubG9hZCAmJlxuICAgIHRoaXMubG9hZC5mb2xkZXJzICYmXG4gICAgdGhpcy5sb2FkLmZvbGRlcnNbZm9sZGVyLm5hbWVdKSB7XG4gICAgICBkZWxldGUgdGhpcy5sb2FkLmZvbGRlcnNbZm9sZGVyLm5hbWVdO1xuICAgIH1cbiAgICByZW1vdmVMaXN0ZW5lcnMoZm9sZGVyKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIENvbW1vbi5lYWNoKGZvbGRlci5fX2ZvbGRlcnMsIGZ1bmN0aW9uIChzdWJmb2xkZXIpIHtcbiAgICAgIGZvbGRlci5yZW1vdmVGb2xkZXIoc3ViZm9sZGVyKTtcbiAgICB9KTtcbiAgICBDb21tb24uZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgX3RoaXMub25SZXNpemUoKTtcbiAgICB9KTtcbiAgfSxcbiAgb3BlbjogZnVuY3Rpb24gb3BlbigpIHtcbiAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICB9LFxuICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICB9LFxuICBoaWRlOiBmdW5jdGlvbiBoaWRlKCkge1xuICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICB9LFxuICBzaG93OiBmdW5jdGlvbiBzaG93KCkge1xuICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gIH0sXG4gIG9uUmVzaXplOiBmdW5jdGlvbiBvblJlc2l6ZSgpIHtcbiAgICB2YXIgcm9vdCA9IHRoaXMuZ2V0Um9vdCgpO1xuICAgIGlmIChyb290LnNjcm9sbGFibGUpIHtcbiAgICAgIHZhciB0b3AgPSBkb20uZ2V0T2Zmc2V0KHJvb3QuX191bCkudG9wO1xuICAgICAgdmFyIGggPSAwO1xuICAgICAgQ29tbW9uLmVhY2gocm9vdC5fX3VsLmNoaWxkTm9kZXMsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmICghKHJvb3QuYXV0b1BsYWNlICYmIG5vZGUgPT09IHJvb3QuX19zYXZlX3JvdykpIHtcbiAgICAgICAgICBoICs9IGRvbS5nZXRIZWlnaHQobm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRvcCAtIENMT1NFX0JVVFRPTl9IRUlHSFQgPCBoKSB7XG4gICAgICAgIGRvbS5hZGRDbGFzcyhyb290LmRvbUVsZW1lbnQsIEdVSS5DTEFTU19UT09fVEFMTCk7XG4gICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3AgLSBDTE9TRV9CVVRUT05fSEVJR0hUICsgJ3B4JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvbS5yZW1vdmVDbGFzcyhyb290LmRvbUVsZW1lbnQsIEdVSS5DTEFTU19UT09fVEFMTCk7XG4gICAgICAgIHJvb3QuX191bC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyb290Ll9fcmVzaXplX2hhbmRsZSkge1xuICAgICAgQ29tbW9uLmRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcm9vdC5fX3Jlc2l6ZV9oYW5kbGUuc3R5bGUuaGVpZ2h0ID0gcm9vdC5fX3VsLm9mZnNldEhlaWdodCArICdweCc7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHJvb3QuX19jbG9zZUJ1dHRvbikge1xuICAgICAgcm9vdC5fX2Nsb3NlQnV0dG9uLnN0eWxlLndpZHRoID0gcm9vdC53aWR0aCArICdweCc7XG4gICAgfVxuICB9LFxuICBvblJlc2l6ZURlYm91bmNlZDogQ29tbW9uLmRlYm91bmNlKGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9uUmVzaXplKCk7XG4gIH0sIDUwKSxcbiAgcmVtZW1iZXI6IGZ1bmN0aW9uIHJlbWVtYmVyKCkge1xuICAgIGlmIChDb21tb24uaXNVbmRlZmluZWQoU0FWRV9ESUFMT0dVRSkpIHtcbiAgICAgIFNBVkVfRElBTE9HVUUgPSBuZXcgQ2VudGVyZWREaXYoKTtcbiAgICAgIFNBVkVfRElBTE9HVUUuZG9tRWxlbWVudC5pbm5lckhUTUwgPSBzYXZlRGlhbG9nQ29udGVudHM7XG4gICAgfVxuICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgY2FuIG9ubHkgY2FsbCByZW1lbWJlciBvbiBhIHRvcCBsZXZlbCBHVUkuJyk7XG4gICAgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgQ29tbW9uLmVhY2goQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgaWYgKF90aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGFkZFNhdmVNZW51KF90aGlzKTtcbiAgICAgIH1cbiAgICAgIGlmIChfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLmluZGV4T2Yob2JqZWN0KSA9PT0gLTEpIHtcbiAgICAgICAgX3RoaXMuX19yZW1lbWJlcmVkT2JqZWN0cy5wdXNoKG9iamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuYXV0b1BsYWNlKSB7XG4gICAgICBzZXRXaWR0aCh0aGlzLCB0aGlzLndpZHRoKTtcbiAgICB9XG4gIH0sXG4gIGdldFJvb3Q6IGZ1bmN0aW9uIGdldFJvb3QoKSB7XG4gICAgdmFyIGd1aSA9IHRoaXM7XG4gICAgd2hpbGUgKGd1aS5wYXJlbnQpIHtcbiAgICAgIGd1aSA9IGd1aS5wYXJlbnQ7XG4gICAgfVxuICAgIHJldHVybiBndWk7XG4gIH0sXG4gIGdldFNhdmVPYmplY3Q6IGZ1bmN0aW9uIGdldFNhdmVPYmplY3QoKSB7XG4gICAgdmFyIHRvUmV0dXJuID0gdGhpcy5sb2FkO1xuICAgIHRvUmV0dXJuLmNsb3NlZCA9IHRoaXMuY2xvc2VkO1xuICAgIGlmICh0aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgdG9SZXR1cm4ucHJlc2V0ID0gdGhpcy5wcmVzZXQ7XG4gICAgICBpZiAoIXRvUmV0dXJuLnJlbWVtYmVyZWQpIHtcbiAgICAgICAgdG9SZXR1cm4ucmVtZW1iZXJlZCA9IHt9O1xuICAgICAgfVxuICAgICAgdG9SZXR1cm4ucmVtZW1iZXJlZFt0aGlzLnByZXNldF0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuICAgIH1cbiAgICB0b1JldHVybi5mb2xkZXJzID0ge307XG4gICAgQ29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uIChlbGVtZW50LCBrZXkpIHtcbiAgICAgIHRvUmV0dXJuLmZvbGRlcnNba2V5XSA9IGVsZW1lbnQuZ2V0U2F2ZU9iamVjdCgpO1xuICAgIH0pO1xuICAgIHJldHVybiB0b1JldHVybjtcbiAgfSxcbiAgc2F2ZTogZnVuY3Rpb24gc2F2ZSgpIHtcbiAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZCA9IHt9O1xuICAgIH1cbiAgICB0aGlzLmxvYWQucmVtZW1iZXJlZFt0aGlzLnByZXNldF0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuICAgIG1hcmtQcmVzZXRNb2RpZmllZCh0aGlzLCBmYWxzZSk7XG4gICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKCk7XG4gIH0sXG4gIHNhdmVBczogZnVuY3Rpb24gc2F2ZUFzKHByZXNldE5hbWUpIHtcbiAgICBpZiAoIXRoaXMubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZCA9IHt9O1xuICAgICAgdGhpcy5sb2FkLnJlbWVtYmVyZWRbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcywgdHJ1ZSk7XG4gICAgfVxuICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkW3ByZXNldE5hbWVdID0gZ2V0Q3VycmVudFByZXNldCh0aGlzKTtcbiAgICB0aGlzLnByZXNldCA9IHByZXNldE5hbWU7XG4gICAgYWRkUHJlc2V0T3B0aW9uKHRoaXMsIHByZXNldE5hbWUsIHRydWUpO1xuICAgIHRoaXMuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSgpO1xuICB9LFxuICByZXZlcnQ6IGZ1bmN0aW9uIHJldmVydChndWkpIHtcbiAgICBDb21tb24uZWFjaCh0aGlzLl9fY29udHJvbGxlcnMsIGZ1bmN0aW9uIChjb250cm9sbGVyKSB7XG4gICAgICBpZiAoIXRoaXMuZ2V0Um9vdCgpLmxvYWQucmVtZW1iZXJlZCkge1xuICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKGNvbnRyb2xsZXIuaW5pdGlhbFZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY2FsbFNhdmVkVmFsdWUoZ3VpIHx8IHRoaXMuZ2V0Um9vdCgpLCBjb250cm9sbGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChjb250cm9sbGVyLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgY29udHJvbGxlci5fX29uRmluaXNoQ2hhbmdlLmNhbGwoY29udHJvbGxlciwgY29udHJvbGxlci5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgICBDb21tb24uZWFjaCh0aGlzLl9fZm9sZGVycywgZnVuY3Rpb24gKGZvbGRlcikge1xuICAgICAgZm9sZGVyLnJldmVydChmb2xkZXIpO1xuICAgIH0pO1xuICAgIGlmICghZ3VpKSB7XG4gICAgICBtYXJrUHJlc2V0TW9kaWZpZWQodGhpcy5nZXRSb290KCksIGZhbHNlKTtcbiAgICB9XG4gIH0sXG4gIGxpc3RlbjogZnVuY3Rpb24gbGlzdGVuKGNvbnRyb2xsZXIpIHtcbiAgICB2YXIgaW5pdCA9IHRoaXMuX19saXN0ZW5pbmcubGVuZ3RoID09PSAwO1xuICAgIHRoaXMuX19saXN0ZW5pbmcucHVzaChjb250cm9sbGVyKTtcbiAgICBpZiAoaW5pdCkge1xuICAgICAgdXBkYXRlRGlzcGxheXModGhpcy5fX2xpc3RlbmluZyk7XG4gICAgfVxuICB9LFxuICB1cGRhdGVEaXNwbGF5OiBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5KCkge1xuICAgIENvbW1vbi5lYWNoKHRoaXMuX19jb250cm9sbGVycywgZnVuY3Rpb24gKGNvbnRyb2xsZXIpIHtcbiAgICAgIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSgpO1xuICAgIH0pO1xuICAgIENvbW1vbi5lYWNoKHRoaXMuX19mb2xkZXJzLCBmdW5jdGlvbiAoZm9sZGVyKSB7XG4gICAgICBmb2xkZXIudXBkYXRlRGlzcGxheSgpO1xuICAgIH0pO1xuICB9XG59KTtcbmZ1bmN0aW9uIGFkZFJvdyhndWksIG5ld0RvbSwgbGlCZWZvcmUpIHtcbiAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgaWYgKG5ld0RvbSkge1xuICAgIGxpLmFwcGVuZENoaWxkKG5ld0RvbSk7XG4gIH1cbiAgaWYgKGxpQmVmb3JlKSB7XG4gICAgZ3VpLl9fdWwuaW5zZXJ0QmVmb3JlKGxpLCBsaUJlZm9yZSk7XG4gIH0gZWxzZSB7XG4gICAgZ3VpLl9fdWwuYXBwZW5kQ2hpbGQobGkpO1xuICB9XG4gIGd1aS5vblJlc2l6ZSgpO1xuICByZXR1cm4gbGk7XG59XG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZ3VpKSB7XG4gIGRvbS51bmJpbmQod2luZG93LCAncmVzaXplJywgZ3VpLl9fcmVzaXplSGFuZGxlcik7XG4gIGlmIChndWkuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSkge1xuICAgIGRvbS51bmJpbmQod2luZG93LCAndW5sb2FkJywgZ3VpLnNhdmVUb0xvY2FsU3RvcmFnZUlmUG9zc2libGUpO1xuICB9XG59XG5mdW5jdGlvbiBtYXJrUHJlc2V0TW9kaWZpZWQoZ3VpLCBtb2RpZmllZCkge1xuICB2YXIgb3B0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdFtndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXhdO1xuICBpZiAobW9kaWZpZWQpIHtcbiAgICBvcHQuaW5uZXJIVE1MID0gb3B0LnZhbHVlICsgJyonO1xuICB9IGVsc2Uge1xuICAgIG9wdC5pbm5lckhUTUwgPSBvcHQudmFsdWU7XG4gIH1cbn1cbmZ1bmN0aW9uIGF1Z21lbnRDb250cm9sbGVyKGd1aSwgbGksIGNvbnRyb2xsZXIpIHtcbiAgY29udHJvbGxlci5fX2xpID0gbGk7XG4gIGNvbnRyb2xsZXIuX19ndWkgPSBndWk7XG4gIENvbW1vbi5leHRlbmQoY29udHJvbGxlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICBvcHRpb25zOiBmdW5jdGlvbiBvcHRpb25zKF9vcHRpb25zKSB7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZztcbiAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuIF9hZGQoZ3VpLCBjb250cm9sbGVyLm9iamVjdCwgY29udHJvbGxlci5wcm9wZXJ0eSwge1xuICAgICAgICAgIGJlZm9yZTogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgZmFjdG9yeUFyZ3M6IFtDb21tb24udG9BcnJheShhcmd1bWVudHMpXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChDb21tb24uaXNBcnJheShfb3B0aW9ucykgfHwgQ29tbW9uLmlzT2JqZWN0KF9vcHRpb25zKSkge1xuICAgICAgICB2YXIgX25leHRTaWJsaW5nID0gY29udHJvbGxlci5fX2xpLm5leHRFbGVtZW50U2libGluZztcbiAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcbiAgICAgICAgcmV0dXJuIF9hZGQoZ3VpLCBjb250cm9sbGVyLm9iamVjdCwgY29udHJvbGxlci5wcm9wZXJ0eSwge1xuICAgICAgICAgIGJlZm9yZTogX25leHRTaWJsaW5nLFxuICAgICAgICAgIGZhY3RvcnlBcmdzOiBbX29wdGlvbnNdXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgbmFtZTogZnVuY3Rpb24gbmFtZShfbmFtZSkge1xuICAgICAgY29udHJvbGxlci5fX2xpLmZpcnN0RWxlbWVudENoaWxkLmZpcnN0RWxlbWVudENoaWxkLmlubmVySFRNTCA9IF9uYW1lO1xuICAgICAgcmV0dXJuIGNvbnRyb2xsZXI7XG4gICAgfSxcbiAgICBsaXN0ZW46IGZ1bmN0aW9uIGxpc3RlbigpIHtcbiAgICAgIGNvbnRyb2xsZXIuX19ndWkubGlzdGVuKGNvbnRyb2xsZXIpO1xuICAgICAgcmV0dXJuIGNvbnRyb2xsZXI7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgIGNvbnRyb2xsZXIuX19ndWkucmVtb3ZlKGNvbnRyb2xsZXIpO1xuICAgICAgcmV0dXJuIGNvbnRyb2xsZXI7XG4gICAgfVxuICB9KTtcbiAgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBOdW1iZXJDb250cm9sbGVyU2xpZGVyKSB7XG4gICAgdmFyIGJveCA9IG5ldyBOdW1iZXJDb250cm9sbGVyQm94KGNvbnRyb2xsZXIub2JqZWN0LCBjb250cm9sbGVyLnByb3BlcnR5LCB7IG1pbjogY29udHJvbGxlci5fX21pbiwgbWF4OiBjb250cm9sbGVyLl9fbWF4LCBzdGVwOiBjb250cm9sbGVyLl9fc3RlcCB9KTtcbiAgICBDb21tb24uZWFjaChbJ3VwZGF0ZURpc3BsYXknLCAnb25DaGFuZ2UnLCAnb25GaW5pc2hDaGFuZ2UnLCAnc3RlcCcsICdtaW4nLCAnbWF4J10sIGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgIHZhciBwYyA9IGNvbnRyb2xsZXJbbWV0aG9kXTtcbiAgICAgIHZhciBwYiA9IGJveFttZXRob2RdO1xuICAgICAgY29udHJvbGxlclttZXRob2RdID0gYm94W21ldGhvZF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcGIuYXBwbHkoYm94LCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHBjLmFwcGx5KGNvbnRyb2xsZXIsIGFyZ3MpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgICBkb20uYWRkQ2xhc3MobGksICdoYXMtc2xpZGVyJyk7XG4gICAgY29udHJvbGxlci5kb21FbGVtZW50Lmluc2VydEJlZm9yZShib3guZG9tRWxlbWVudCwgY29udHJvbGxlci5kb21FbGVtZW50LmZpcnN0RWxlbWVudENoaWxkKTtcbiAgfSBlbHNlIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgTnVtYmVyQ29udHJvbGxlckJveCkge1xuICAgIHZhciByID0gZnVuY3Rpb24gcihyZXR1cm5lZCkge1xuICAgICAgaWYgKENvbW1vbi5pc051bWJlcihjb250cm9sbGVyLl9fbWluKSAmJiBDb21tb24uaXNOdW1iZXIoY29udHJvbGxlci5fX21heCkpIHtcbiAgICAgICAgdmFyIG9sZE5hbWUgPSBjb250cm9sbGVyLl9fbGkuZmlyc3RFbGVtZW50Q2hpbGQuZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MO1xuICAgICAgICB2YXIgd2FzTGlzdGVuaW5nID0gY29udHJvbGxlci5fX2d1aS5fX2xpc3RlbmluZy5pbmRleE9mKGNvbnRyb2xsZXIpID4gLTE7XG4gICAgICAgIGNvbnRyb2xsZXIucmVtb3ZlKCk7XG4gICAgICAgIHZhciBuZXdDb250cm9sbGVyID0gX2FkZChndWksIGNvbnRyb2xsZXIub2JqZWN0LCBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgYmVmb3JlOiBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nLFxuICAgICAgICAgIGZhY3RvcnlBcmdzOiBbY29udHJvbGxlci5fX21pbiwgY29udHJvbGxlci5fX21heCwgY29udHJvbGxlci5fX3N0ZXBdXG4gICAgICAgIH0pO1xuICAgICAgICBuZXdDb250cm9sbGVyLm5hbWUob2xkTmFtZSk7XG4gICAgICAgIGlmICh3YXNMaXN0ZW5pbmcpIG5ld0NvbnRyb2xsZXIubGlzdGVuKCk7XG4gICAgICAgIHJldHVybiBuZXdDb250cm9sbGVyO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJldHVybmVkO1xuICAgIH07XG4gICAgY29udHJvbGxlci5taW4gPSBDb21tb24uY29tcG9zZShyLCBjb250cm9sbGVyLm1pbik7XG4gICAgY29udHJvbGxlci5tYXggPSBDb21tb24uY29tcG9zZShyLCBjb250cm9sbGVyLm1heCk7XG4gIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIEJvb2xlYW5Db250cm9sbGVyKSB7XG4gICAgZG9tLmJpbmQobGksICdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRvbS5mYWtlRXZlbnQoY29udHJvbGxlci5fX2NoZWNrYm94LCAnY2xpY2snKTtcbiAgICB9KTtcbiAgICBkb20uYmluZChjb250cm9sbGVyLl9fY2hlY2tib3gsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBGdW5jdGlvbkNvbnRyb2xsZXIpIHtcbiAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgZG9tLmZha2VFdmVudChjb250cm9sbGVyLl9fYnV0dG9uLCAnY2xpY2snKTtcbiAgICB9KTtcbiAgICBkb20uYmluZChsaSwgJ21vdXNlb3ZlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGRvbS5hZGRDbGFzcyhjb250cm9sbGVyLl9fYnV0dG9uLCAnaG92ZXInKTtcbiAgICB9KTtcbiAgICBkb20uYmluZChsaSwgJ21vdXNlb3V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgZG9tLnJlbW92ZUNsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBDb2xvckNvbnRyb2xsZXIpIHtcbiAgICBkb20uYWRkQ2xhc3MobGksICdjb2xvcicpO1xuICAgIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSA9IENvbW1vbi5jb21wb3NlKGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgIGxpLnN0eWxlLmJvcmRlckxlZnRDb2xvciA9IGNvbnRyb2xsZXIuX19jb2xvci50b1N0cmluZygpO1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9LCBjb250cm9sbGVyLnVwZGF0ZURpc3BsYXkpO1xuICAgIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSgpO1xuICB9XG4gIGNvbnRyb2xsZXIuc2V0VmFsdWUgPSBDb21tb24uY29tcG9zZShmdW5jdGlvbiAodmFsKSB7XG4gICAgaWYgKGd1aS5nZXRSb290KCkuX19wcmVzZXRfc2VsZWN0ICYmIGNvbnRyb2xsZXIuaXNNb2RpZmllZCgpKSB7XG4gICAgICBtYXJrUHJlc2V0TW9kaWZpZWQoZ3VpLmdldFJvb3QoKSwgdHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG4gIH0sIGNvbnRyb2xsZXIuc2V0VmFsdWUpO1xufVxuZnVuY3Rpb24gcmVjYWxsU2F2ZWRWYWx1ZShndWksIGNvbnRyb2xsZXIpIHtcbiAgdmFyIHJvb3QgPSBndWkuZ2V0Um9vdCgpO1xuICB2YXIgbWF0Y2hlZEluZGV4ID0gcm9vdC5fX3JlbWVtYmVyZWRPYmplY3RzLmluZGV4T2YoY29udHJvbGxlci5vYmplY3QpO1xuICBpZiAobWF0Y2hlZEluZGV4ICE9PSAtMSkge1xuICAgIHZhciBjb250cm9sbGVyTWFwID0gcm9vdC5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVyc1ttYXRjaGVkSW5kZXhdO1xuICAgIGlmIChjb250cm9sbGVyTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRyb2xsZXJNYXAgPSB7fTtcbiAgICAgIHJvb3QuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnNbbWF0Y2hlZEluZGV4XSA9IGNvbnRyb2xsZXJNYXA7XG4gICAgfVxuICAgIGNvbnRyb2xsZXJNYXBbY29udHJvbGxlci5wcm9wZXJ0eV0gPSBjb250cm9sbGVyO1xuICAgIGlmIChyb290LmxvYWQgJiYgcm9vdC5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICAgIHZhciBwcmVzZXRNYXAgPSByb290LmxvYWQucmVtZW1iZXJlZDtcbiAgICAgIHZhciBwcmVzZXQgPSB2b2lkIDA7XG4gICAgICBpZiAocHJlc2V0TWFwW2d1aS5wcmVzZXRdKSB7XG4gICAgICAgIHByZXNldCA9IHByZXNldE1hcFtndWkucHJlc2V0XTtcbiAgICAgIH0gZWxzZSBpZiAocHJlc2V0TWFwW0RFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRV0pIHtcbiAgICAgICAgcHJlc2V0ID0gcHJlc2V0TWFwW0RFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAocHJlc2V0W21hdGNoZWRJbmRleF0gJiYgcHJlc2V0W21hdGNoZWRJbmRleF1bY29udHJvbGxlci5wcm9wZXJ0eV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBwcmVzZXRbbWF0Y2hlZEluZGV4XVtjb250cm9sbGVyLnByb3BlcnR5XTtcbiAgICAgICAgY29udHJvbGxlci5pbml0aWFsVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgY29udHJvbGxlci5zZXRWYWx1ZSh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiBfYWRkKGd1aSwgb2JqZWN0LCBwcm9wZXJ0eSwgcGFyYW1zKSB7XG4gIGlmIChvYmplY3RbcHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ09iamVjdCBcIicgKyBvYmplY3QgKyAnXCIgaGFzIG5vIHByb3BlcnR5IFwiJyArIHByb3BlcnR5ICsgJ1wiJyk7XG4gIH1cbiAgdmFyIGNvbnRyb2xsZXIgPSB2b2lkIDA7XG4gIGlmIChwYXJhbXMuY29sb3IpIHtcbiAgICBjb250cm9sbGVyID0gbmV3IENvbG9yQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgZmFjdG9yeUFyZ3MgPSBbb2JqZWN0LCBwcm9wZXJ0eV0uY29uY2F0KHBhcmFtcy5mYWN0b3J5QXJncyk7XG4gICAgY29udHJvbGxlciA9IENvbnRyb2xsZXJGYWN0b3J5LmFwcGx5KGd1aSwgZmFjdG9yeUFyZ3MpO1xuICB9XG4gIGlmIChwYXJhbXMuYmVmb3JlIGluc3RhbmNlb2YgQ29udHJvbGxlcikge1xuICAgIHBhcmFtcy5iZWZvcmUgPSBwYXJhbXMuYmVmb3JlLl9fbGk7XG4gIH1cbiAgcmVjYWxsU2F2ZWRWYWx1ZShndWksIGNvbnRyb2xsZXIpO1xuICBkb20uYWRkQ2xhc3MoY29udHJvbGxlci5kb21FbGVtZW50LCAnYycpO1xuICB2YXIgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgZG9tLmFkZENsYXNzKG5hbWUsICdwcm9wZXJ0eS1uYW1lJyk7XG4gIG5hbWUuaW5uZXJIVE1MID0gY29udHJvbGxlci5wcm9wZXJ0eTtcbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmFtZSk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb250cm9sbGVyLmRvbUVsZW1lbnQpO1xuICB2YXIgbGkgPSBhZGRSb3coZ3VpLCBjb250YWluZXIsIHBhcmFtcy5iZWZvcmUpO1xuICBkb20uYWRkQ2xhc3MobGksIEdVSS5DTEFTU19DT05UUk9MTEVSX1JPVyk7XG4gIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgQ29sb3JDb250cm9sbGVyKSB7XG4gICAgZG9tLmFkZENsYXNzKGxpLCAnY29sb3InKTtcbiAgfSBlbHNlIHtcbiAgICBkb20uYWRkQ2xhc3MobGksIF90eXBlb2YoY29udHJvbGxlci5nZXRWYWx1ZSgpKSk7XG4gIH1cbiAgYXVnbWVudENvbnRyb2xsZXIoZ3VpLCBsaSwgY29udHJvbGxlcik7XG4gIGd1aS5fX2NvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcik7XG4gIHJldHVybiBjb250cm9sbGVyO1xufVxuZnVuY3Rpb24gZ2V0TG9jYWxTdG9yYWdlSGFzaChndWksIGtleSkge1xuICByZXR1cm4gZG9jdW1lbnQubG9jYXRpb24uaHJlZiArICcuJyArIGtleTtcbn1cbmZ1bmN0aW9uIGFkZFByZXNldE9wdGlvbihndWksIG5hbWUsIHNldFNlbGVjdGVkKSB7XG4gIHZhciBvcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgb3B0LmlubmVySFRNTCA9IG5hbWU7XG4gIG9wdC52YWx1ZSA9IG5hbWU7XG4gIGd1aS5fX3ByZXNldF9zZWxlY3QuYXBwZW5kQ2hpbGQob3B0KTtcbiAgaWYgKHNldFNlbGVjdGVkKSB7XG4gICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdC5sZW5ndGggLSAxO1xuICB9XG59XG5mdW5jdGlvbiBzaG93SGlkZUV4cGxhaW4oZ3VpLCBleHBsYWluKSB7XG4gIGV4cGxhaW4uc3R5bGUuZGlzcGxheSA9IGd1aS51c2VMb2NhbFN0b3JhZ2UgPyAnYmxvY2snIDogJ25vbmUnO1xufVxuZnVuY3Rpb24gYWRkU2F2ZU1lbnUoZ3VpKSB7XG4gIHZhciBkaXYgPSBndWkuX19zYXZlX3JvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gIGRvbS5hZGRDbGFzcyhndWkuZG9tRWxlbWVudCwgJ2hhcy1zYXZlJyk7XG4gIGd1aS5fX3VsLmluc2VydEJlZm9yZShkaXYsIGd1aS5fX3VsLmZpcnN0Q2hpbGQpO1xuICBkb20uYWRkQ2xhc3MoZGl2LCAnc2F2ZS1yb3cnKTtcbiAgdmFyIGdlYXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBnZWFycy5pbm5lckhUTUwgPSAnJm5ic3A7JztcbiAgZG9tLmFkZENsYXNzKGdlYXJzLCAnYnV0dG9uIGdlYXJzJyk7XG4gIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGJ1dHRvbi5pbm5lckhUTUwgPSAnU2F2ZSc7XG4gIGRvbS5hZGRDbGFzcyhidXR0b24sICdidXR0b24nKTtcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbiwgJ3NhdmUnKTtcbiAgdmFyIGJ1dHRvbjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGJ1dHRvbjIuaW5uZXJIVE1MID0gJ05ldyc7XG4gIGRvbS5hZGRDbGFzcyhidXR0b24yLCAnYnV0dG9uJyk7XG4gIGRvbS5hZGRDbGFzcyhidXR0b24yLCAnc2F2ZS1hcycpO1xuICB2YXIgYnV0dG9uMyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgYnV0dG9uMy5pbm5lckhUTUwgPSAnUmV2ZXJ0JztcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbjMsICdidXR0b24nKTtcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbjMsICdyZXZlcnQnKTtcbiAgdmFyIHNlbGVjdCA9IGd1aS5fX3ByZXNldF9zZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgaWYgKGd1aS5sb2FkICYmIGd1aS5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICBDb21tb24uZWFjaChndWkubG9hZC5yZW1lbWJlcmVkLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgYWRkUHJlc2V0T3B0aW9uKGd1aSwga2V5LCBrZXkgPT09IGd1aS5wcmVzZXQpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGFkZFByZXNldE9wdGlvbihndWksIERFRkFVTFRfREVGQVVMVF9QUkVTRVRfTkFNRSwgZmFsc2UpO1xuICB9XG4gIGRvbS5iaW5kKHNlbGVjdCwgJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgZ3VpLl9fcHJlc2V0X3NlbGVjdC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLmlubmVySFRNTCA9IGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLnZhbHVlO1xuICAgIH1cbiAgICBndWkucHJlc2V0ID0gdGhpcy52YWx1ZTtcbiAgfSk7XG4gIGRpdi5hcHBlbmRDaGlsZChzZWxlY3QpO1xuICBkaXYuYXBwZW5kQ2hpbGQoZ2VhcnMpO1xuICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgZGl2LmFwcGVuZENoaWxkKGJ1dHRvbjIpO1xuICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uMyk7XG4gIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG4gICAgdmFyIGV4cGxhaW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGctbG9jYWwtZXhwbGFpbicpO1xuICAgIHZhciBsb2NhbFN0b3JhZ2VDaGVja0JveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1sb2NhbC1zdG9yYWdlJyk7XG4gICAgdmFyIHNhdmVMb2NhbGx5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLXNhdmUtbG9jYWxseScpO1xuICAgIHNhdmVMb2NhbGx5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKGd1aSwgJ2lzTG9jYWwnKSkgPT09ICd0cnVlJykge1xuICAgICAgbG9jYWxTdG9yYWdlQ2hlY2tCb3guc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG4gICAgc2hvd0hpZGVFeHBsYWluKGd1aSwgZXhwbGFpbik7XG4gICAgZG9tLmJpbmQobG9jYWxTdG9yYWdlQ2hlY2tCb3gsICdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBndWkudXNlTG9jYWxTdG9yYWdlID0gIWd1aS51c2VMb2NhbFN0b3JhZ2U7XG4gICAgICBzaG93SGlkZUV4cGxhaW4oZ3VpLCBleHBsYWluKTtcbiAgICB9KTtcbiAgfVxuICB2YXIgbmV3Q29uc3RydWN0b3JUZXh0QXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1uZXctY29uc3RydWN0b3InKTtcbiAgZG9tLmJpbmQobmV3Q29uc3RydWN0b3JUZXh0QXJlYSwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLm1ldGFLZXkgJiYgKGUud2hpY2ggPT09IDY3IHx8IGUua2V5Q29kZSA9PT0gNjcpKSB7XG4gICAgICBTQVZFX0RJQUxPR1VFLmhpZGUoKTtcbiAgICB9XG4gIH0pO1xuICBkb20uYmluZChnZWFycywgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuaW5uZXJIVE1MID0gSlNPTi5zdHJpbmdpZnkoZ3VpLmdldFNhdmVPYmplY3QoKSwgdW5kZWZpbmVkLCAyKTtcbiAgICBTQVZFX0RJQUxPR1VFLnNob3coKTtcbiAgICBuZXdDb25zdHJ1Y3RvclRleHRBcmVhLmZvY3VzKCk7XG4gICAgbmV3Q29uc3RydWN0b3JUZXh0QXJlYS5zZWxlY3QoKTtcbiAgfSk7XG4gIGRvbS5iaW5kKGJ1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGd1aS5zYXZlKCk7XG4gIH0pO1xuICBkb20uYmluZChidXR0b24yLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHByZXNldE5hbWUgPSBwcm9tcHQoJ0VudGVyIGEgbmV3IHByZXNldCBuYW1lLicpO1xuICAgIGlmIChwcmVzZXROYW1lKSB7XG4gICAgICBndWkuc2F2ZUFzKHByZXNldE5hbWUpO1xuICAgIH1cbiAgfSk7XG4gIGRvbS5iaW5kKGJ1dHRvbjMsICdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICBndWkucmV2ZXJ0KCk7XG4gIH0pO1xufVxuZnVuY3Rpb24gYWRkUmVzaXplSGFuZGxlKGd1aSkge1xuICB2YXIgcG1vdXNlWCA9IHZvaWQgMDtcbiAgZ3VpLl9fcmVzaXplX2hhbmRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBDb21tb24uZXh0ZW5kKGd1aS5fX3Jlc2l6ZV9oYW5kbGUuc3R5bGUsIHtcbiAgICB3aWR0aDogJzZweCcsXG4gICAgbWFyZ2luTGVmdDogJy0zcHgnLFxuICAgIGhlaWdodDogJzIwMHB4JyxcbiAgICBjdXJzb3I6ICdldy1yZXNpemUnLFxuICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gIH0pO1xuICBmdW5jdGlvbiBkcmFnKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZ3VpLndpZHRoICs9IHBtb3VzZVggLSBlLmNsaWVudFg7XG4gICAgZ3VpLm9uUmVzaXplKCk7XG4gICAgcG1vdXNlWCA9IGUuY2xpZW50WDtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gZHJhZ1N0b3AoKSB7XG4gICAgZG9tLnJlbW92ZUNsYXNzKGd1aS5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfRFJBRyk7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBkcmFnKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBkcmFnU3RvcCk7XG4gIH1cbiAgZnVuY3Rpb24gZHJhZ1N0YXJ0KGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcG1vdXNlWCA9IGUuY2xpZW50WDtcbiAgICBkb20uYWRkQ2xhc3MoZ3VpLl9fY2xvc2VCdXR0b24sIEdVSS5DTEFTU19EUkFHKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBkcmFnKTtcbiAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgZHJhZ1N0b3ApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBkb20uYmluZChndWkuX19yZXNpemVfaGFuZGxlLCAnbW91c2Vkb3duJywgZHJhZ1N0YXJ0KTtcbiAgZG9tLmJpbmQoZ3VpLl9fY2xvc2VCdXR0b24sICdtb3VzZWRvd24nLCBkcmFnU3RhcnQpO1xuICBndWkuZG9tRWxlbWVudC5pbnNlcnRCZWZvcmUoZ3VpLl9fcmVzaXplX2hhbmRsZSwgZ3VpLmRvbUVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xufVxuZnVuY3Rpb24gc2V0V2lkdGgoZ3VpLCB3KSB7XG4gIGd1aS5kb21FbGVtZW50LnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gIGlmIChndWkuX19zYXZlX3JvdyAmJiBndWkuYXV0b1BsYWNlKSB7XG4gICAgZ3VpLl9fc2F2ZV9yb3cuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgfVxuICBpZiAoZ3VpLl9fY2xvc2VCdXR0b24pIHtcbiAgICBndWkuX19jbG9zZUJ1dHRvbi5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICB9XG59XG5mdW5jdGlvbiBnZXRDdXJyZW50UHJlc2V0KGd1aSwgdXNlSW5pdGlhbFZhbHVlcykge1xuICB2YXIgdG9SZXR1cm4gPSB7fTtcbiAgQ29tbW9uLmVhY2goZ3VpLl9fcmVtZW1iZXJlZE9iamVjdHMsIGZ1bmN0aW9uICh2YWwsIGluZGV4KSB7XG4gICAgdmFyIHNhdmVkVmFsdWVzID0ge307XG4gICAgdmFyIGNvbnRyb2xsZXJNYXAgPSBndWkuX19yZW1lbWJlcmVkT2JqZWN0SW5kZWNlc1RvQ29udHJvbGxlcnNbaW5kZXhdO1xuICAgIENvbW1vbi5lYWNoKGNvbnRyb2xsZXJNYXAsIGZ1bmN0aW9uIChjb250cm9sbGVyLCBwcm9wZXJ0eSkge1xuICAgICAgc2F2ZWRWYWx1ZXNbcHJvcGVydHldID0gdXNlSW5pdGlhbFZhbHVlcyA/IGNvbnRyb2xsZXIuaW5pdGlhbFZhbHVlIDogY29udHJvbGxlci5nZXRWYWx1ZSgpO1xuICAgIH0pO1xuICAgIHRvUmV0dXJuW2luZGV4XSA9IHNhdmVkVmFsdWVzO1xuICB9KTtcbiAgcmV0dXJuIHRvUmV0dXJuO1xufVxuZnVuY3Rpb24gc2V0UHJlc2V0U2VsZWN0SW5kZXgoZ3VpKSB7XG4gIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGlmIChndWkuX19wcmVzZXRfc2VsZWN0W2luZGV4XS52YWx1ZSA9PT0gZ3VpLnByZXNldCkge1xuICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgfVxuICB9XG59XG5mdW5jdGlvbiB1cGRhdGVEaXNwbGF5cyhjb250cm9sbGVyQXJyYXkpIHtcbiAgaWYgKGNvbnRyb2xsZXJBcnJheS5sZW5ndGggIT09IDApIHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUkMS5jYWxsKHdpbmRvdywgZnVuY3Rpb24gKCkge1xuICAgICAgdXBkYXRlRGlzcGxheXMoY29udHJvbGxlckFycmF5KTtcbiAgICB9KTtcbiAgfVxuICBDb21tb24uZWFjaChjb250cm9sbGVyQXJyYXksIGZ1bmN0aW9uIChjKSB7XG4gICAgYy51cGRhdGVEaXNwbGF5KCk7XG4gIH0pO1xufVxuXG52YXIgY29sb3IgPSB7XG4gIENvbG9yOiBDb2xvcixcbiAgbWF0aDogQ29sb3JNYXRoLFxuICBpbnRlcnByZXQ6IGludGVycHJldFxufTtcbnZhciBjb250cm9sbGVycyA9IHtcbiAgQ29udHJvbGxlcjogQ29udHJvbGxlcixcbiAgQm9vbGVhbkNvbnRyb2xsZXI6IEJvb2xlYW5Db250cm9sbGVyLFxuICBPcHRpb25Db250cm9sbGVyOiBPcHRpb25Db250cm9sbGVyLFxuICBTdHJpbmdDb250cm9sbGVyOiBTdHJpbmdDb250cm9sbGVyLFxuICBOdW1iZXJDb250cm9sbGVyOiBOdW1iZXJDb250cm9sbGVyLFxuICBOdW1iZXJDb250cm9sbGVyQm94OiBOdW1iZXJDb250cm9sbGVyQm94LFxuICBOdW1iZXJDb250cm9sbGVyU2xpZGVyOiBOdW1iZXJDb250cm9sbGVyU2xpZGVyLFxuICBGdW5jdGlvbkNvbnRyb2xsZXI6IEZ1bmN0aW9uQ29udHJvbGxlcixcbiAgQ29sb3JDb250cm9sbGVyOiBDb2xvckNvbnRyb2xsZXJcbn07XG52YXIgZG9tJDEgPSB7IGRvbTogZG9tIH07XG52YXIgZ3VpID0geyBHVUk6IEdVSSB9O1xudmFyIEdVSSQxID0gR1VJO1xudmFyIGluZGV4ID0ge1xuICBjb2xvcjogY29sb3IsXG4gIGNvbnRyb2xsZXJzOiBjb250cm9sbGVycyxcbiAgZG9tOiBkb20kMSxcbiAgZ3VpOiBndWksXG4gIEdVSTogR1VJJDFcbn07XG5cbmV4cG9ydHMuY29sb3IgPSBjb2xvcjtcbmV4cG9ydHMuY29udHJvbGxlcnMgPSBjb250cm9sbGVycztcbmV4cG9ydHMuZG9tID0gZG9tJDE7XG5leHBvcnRzLmd1aSA9IGd1aTtcbmV4cG9ydHMuR1VJID0gR1VJJDE7XG5leHBvcnRzWydkZWZhdWx0J10gPSBpbmRleDtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdC5ndWkuanMubWFwXG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICAgIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAgIChnbG9iYWwgPSB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWxUaGlzIDogZ2xvYmFsIHx8IHNlbGYsIGZhY3RvcnkoZ2xvYmFsLmhlYXAgPSB7fSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIF9fZ2VuZXJhdG9yID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19nZW5lcmF0b3IpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XG4gICAgICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XG4gICAgICAgIHJldHVybiBnID0geyBuZXh0OiB2ZXJiKDApLCBcInRocm93XCI6IHZlcmIoMSksIFwicmV0dXJuXCI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgICAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChvcCkge1xuICAgICAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICAgICAgd2hpbGUgKF8pIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XG4gICAgICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIF9fcmVhZCA9ICh1bmRlZmluZWQgJiYgdW5kZWZpbmVkLl9fcmVhZCkgfHwgZnVuY3Rpb24gKG8sIG4pIHtcbiAgICAgICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xuICAgICAgICBpZiAoIW0pIHJldHVybiBvO1xuICAgICAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdoaWxlICgobiA9PT0gdm9pZCAwIHx8IG4tLSA+IDApICYmICEociA9IGkubmV4dCgpKS5kb25lKSBhci5wdXNoKHIudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXI7XG4gICAgfTtcbiAgICB2YXIgX19zcHJlYWQgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX3NwcmVhZCkgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBhciA9IFtdLCBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xuICAgICAgICByZXR1cm4gYXI7XG4gICAgfTtcbiAgICB2YXIgdG9JbnQgPSBmdW5jdGlvbiAobikgeyByZXR1cm4gfn5uOyB9O1xuICAgIC8qKlxuICAgICAqIEhlYXBcbiAgICAgKiBAdHlwZSB7Q2xhc3N9XG4gICAgICovXG4gICAgdmFyIEhlYXAgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBIZWFwIGluc3RhbmNlIGNvbnN0cnVjdG9yLlxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSBPcHRpb25hbCBjb21wYXJpc29uIGZ1bmN0aW9uLCBkZWZhdWx0cyB0byBIZWFwLm1pbkNvbXBhcmF0b3I8bnVtYmVyPlxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gSGVhcChjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUgPT09IHZvaWQgMCkgeyBjb21wYXJlID0gSGVhcC5taW5Db21wYXJhdG9yOyB9XG4gICAgICAgICAgICB0aGlzLmNvbXBhcmUgPSBjb21wYXJlO1xuICAgICAgICAgICAgdGhpcy5oZWFwQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2xpbWl0ID0gMDtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWxpYXMgb2YgYWRkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMub2ZmZXIgPSB0aGlzLmFkZDtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWxpYXMgb2YgcGVla1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLnBlZWs7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEFsaWFzIG9mIHBvcFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLnBvbGwgPSB0aGlzLnBvcDtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyB0aGUgaW52ZXJzZSB0byB0aGUgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLl9pbnZlcnRlZENvbXBhcmUgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMSAqIF90aGlzLmNvbXBhcmUoYSwgYik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICBTdGF0aWMgbWV0aG9kc1xuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgY2hpbGRyZW4gaW5kaWNlcyBmb3IgZ2l2ZW4gaW5kZXguXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaWR4ICAgICBQYXJlbnQgaW5kZXhcbiAgICAgICAgICogQHJldHVybiB7QXJyYXkoTnVtYmVyKX0gIEFycmF5IG9mIGNoaWxkcmVuIGluZGljZXNcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mID0gZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgcmV0dXJuIFtpZHggKiAyICsgMSwgaWR4ICogMiArIDJdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyBwYXJlbnQgaW5kZXggZm9yIGdpdmVuIGluZGV4LlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkeCAgQ2hpbGRyZW4gaW5kZXhcbiAgICAgICAgICogQHJldHVybiB7TnVtYmVyIHwgdW5kZWZpbmVkfSAgICAgIFBhcmVudCBpbmRleCwgLTEgaWYgaWR4IGlzIDBcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuZ2V0UGFyZW50SW5kZXhPZiA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgIGlmIChpZHggPD0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3aGljaENoaWxkcmVuID0gaWR4ICUgMiA/IDEgOiAyO1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKGlkeCAtIHdoaWNoQ2hpbGRyZW4pIC8gMik7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHNpYmxpbmcgaW5kZXggZm9yIGdpdmVuIGluZGV4LlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkeCAgQ2hpbGRyZW4gaW5kZXhcbiAgICAgICAgICogQHJldHVybiB7TnVtYmVyIHwgdW5kZWZpbmVkfSAgICAgIFNpYmxpbmcgaW5kZXgsIC0xIGlmIGlkeCBpcyAwXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmdldFNpYmxpbmdJbmRleE9mID0gZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgaWYgKGlkeCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdoaWNoQ2hpbGRyZW4gPSBpZHggJSAyID8gMSA6IC0xO1xuICAgICAgICAgICAgcmV0dXJuIGlkeCArIHdoaWNoQ2hpbGRyZW47XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNaW4gaGVhcCBjb21wYXJpc29uIGZ1bmN0aW9uLCBkZWZhdWx0LlxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGEgICAgIEZpcnN0IGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtICB7YW55fSBiICAgICBTZWNvbmQgZWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgIDAgaWYgdGhleSdyZSBlcXVhbCwgcG9zaXRpdmUgaWYgYGFgIGdvZXMgdXAsIG5lZ2F0aXZlIGlmIGBiYCBnb2VzIHVwXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLm1pbkNvbXBhcmF0b3IgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgaWYgKGEgPiBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhIDwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogTWF4IGhlYXAgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7YW55fSBhICAgICBGaXJzdCBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gYiAgICAgU2Vjb25kIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7TnVtYmVyfSAgICAwIGlmIHRoZXkncmUgZXF1YWwsIHBvc2l0aXZlIGlmIGBhYCBnb2VzIHVwLCBuZWdhdGl2ZSBpZiBgYmAgZ29lcyB1cFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5tYXhDb21wYXJhdG9yID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIGlmIChiID4gYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYiA8IGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1pbiBudW1iZXIgaGVhcCBjb21wYXJpc29uIGZ1bmN0aW9uLCBkZWZhdWx0LlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGEgICAgIEZpcnN0IGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBiICAgICBTZWNvbmQgZWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgIDAgaWYgdGhleSdyZSBlcXVhbCwgcG9zaXRpdmUgaWYgYGFgIGdvZXMgdXAsIG5lZ2F0aXZlIGlmIGBiYCBnb2VzIHVwXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLm1pbkNvbXBhcmF0b3JOdW1iZXIgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogTWF4IG51bWJlciBoZWFwIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gYSAgICAgRmlyc3QgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGIgICAgIFNlY29uZCBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgMCBpZiB0aGV5J3JlIGVxdWFsLCBwb3NpdGl2ZSBpZiBgYWAgZ29lcyB1cCwgbmVnYXRpdmUgaWYgYGJgIGdvZXMgdXBcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAubWF4Q29tcGFyYXRvck51bWJlciA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYiAtIGE7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IGVxdWFsaXR5IGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGEgICAgRmlyc3QgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGIgICAgU2Vjb25kIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gIFRydWUgaWYgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5kZWZhdWx0SXNFcXVhbCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFByaW50cyBhIGhlYXAuXG4gICAgICAgICAqIEBwYXJhbSAge0hlYXB9IGhlYXAgSGVhcCB0byBiZSBwcmludGVkXG4gICAgICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByaW50ID0gZnVuY3Rpb24gKGhlYXApIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRlZXAoaSkge1xuICAgICAgICAgICAgICAgIHZhciBwaSA9IEhlYXAuZ2V0UGFyZW50SW5kZXhPZihpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLmxvZzIocGkgKyAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmdW5jdGlvbiByZXBlYXQoc3RyLCB0aW1lcykge1xuICAgICAgICAgICAgICAgIHZhciBvdXQgPSAnJztcbiAgICAgICAgICAgICAgICBmb3IgKDsgdGltZXMgPiAwOyAtLXRpbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dCArPSBzdHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbm9kZSA9IDA7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgICAgIHZhciBtYXhMaW5lcyA9IGRlZXAoaGVhcC5sZW5ndGggLSAxKSArIDI7XG4gICAgICAgICAgICB2YXIgbWF4TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChub2RlIDwgaGVhcC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGRlZXAobm9kZSkgKyAxO1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBUZXh0IHJlcHJlc2VudGF0aW9uXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVUZXh0ID0gU3RyaW5nKGhlYXAuZ2V0KG5vZGUpKTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZVRleHQubGVuZ3RoID4gbWF4TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIG1heExlbmd0aCA9IG5vZGVUZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIGxpbmVcbiAgICAgICAgICAgICAgICBsaW5lc1tpXSA9IGxpbmVzW2ldIHx8IFtdO1xuICAgICAgICAgICAgICAgIGxpbmVzW2ldLnB1c2gobm9kZVRleHQpO1xuICAgICAgICAgICAgICAgIG5vZGUgKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsaW5lc1xuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUsIGkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZXMgPSBNYXRoLnBvdygyLCBtYXhMaW5lcyAtIGkpIC0gMTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHJlcGVhdCgnICcsIE1hdGguZmxvb3IodGltZXMgLyAyKSAqIG1heExlbmd0aCkgK1xuICAgICAgICAgICAgICAgICAgICBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2VudGVyZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoYWxmID0gKG1heExlbmd0aCAtIGVsLmxlbmd0aCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcGVhdCgnICcsIE1hdGguY2VpbChoYWxmKSkgKyBlbCArIHJlcGVhdCgnICcsIE1hdGguZmxvb3IoaGFsZikpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4ocmVwZWF0KCcgJywgdGltZXMgKiBtYXhMZW5ndGgpKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCdcXG4nKTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgIFB5dGhvbiBzdHlsZVxuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIGFuIGFycmF5IGludG8gYW4gYXJyYXktaGVhcCwgaW4gcGxhY2VcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9ICAgIGFyciAgICAgIEFycmF5IHRvIGJlIG1vZGlmaWVkXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge0hlYXB9ICAgICAgICAgICAgICBGb3IgY29udmVuaWVuY2UsIGl0IHJldHVybnMgYSBIZWFwIGluc3RhbmNlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmhlYXBpZnkgPSBmdW5jdGlvbiAoYXJyLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBhcnI7XG4gICAgICAgICAgICBoZWFwLmluaXQoKTtcbiAgICAgICAgICAgIHJldHVybiBoZWFwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogRXh0cmFjdCB0aGUgcGVlayBvZiBhbiBhcnJheS1oZWFwXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSB0byBiZSBtb2RpZmllZCwgc2hvdWxkIGJlIGEgaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgUmV0dXJucyB0aGUgZXh0cmFjdGVkIHBlZWtcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcHBvcCA9IGZ1bmN0aW9uIChoZWFwQXJyLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAucG9wKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQdXNoZXMgYSBpdGVtIGludG8gYW4gYXJyYXktaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gICAgaGVhcEFyciAgQXJyYXkgdG8gYmUgbW9kaWZpZWQsIHNob3VsZCBiZSBhIGhlYXBcbiAgICAgICAgICogQHBhcmFtICB7YW55fSAgICAgIGl0ZW0gICAgIEl0ZW0gdG8gcHVzaFxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5oZWFwcHVzaCA9IGZ1bmN0aW9uIChoZWFwQXJyLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgaGVhcC5wdXNoKGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUHVzaCBmb2xsb3dlZCBieSBwb3AsIGZhc3RlclxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gICAgaGVhcEFyciAgQXJyYXkgdG8gYmUgbW9kaWZpZWQsIHNob3VsZCBiZSBhIGhlYXBcbiAgICAgICAgICogQHBhcmFtICB7YW55fSAgICAgIGl0ZW0gICAgIEl0ZW0gdG8gcHVzaFxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgUmV0dXJucyB0aGUgZXh0cmFjdGVkIHBlZWtcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcHB1c2hwb3AgPSBmdW5jdGlvbiAoaGVhcEFyciwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcChjb21wYXJlKTtcbiAgICAgICAgICAgIGhlYXAuaGVhcEFycmF5ID0gaGVhcEFycjtcbiAgICAgICAgICAgIHJldHVybiBoZWFwLnB1c2hwb3AoaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXBsYWNlIHBlZWsgd2l0aCBpdGVtXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSB0byBiZSBtb2RpZmllZCwgc2hvdWxkIGJlIGEgaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9ICAgICAgaXRlbSAgICAgSXRlbSBhcyByZXBsYWNlbWVudFxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgUmV0dXJucyB0aGUgZXh0cmFjdGVkIHBlZWtcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcHJlcGxhY2UgPSBmdW5jdGlvbiAoaGVhcEFyciwgaXRlbSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcChjb21wYXJlKTtcbiAgICAgICAgICAgIGhlYXAuaGVhcEFycmF5ID0gaGVhcEFycjtcbiAgICAgICAgICAgIHJldHVybiBoZWFwLnJlcGxhY2UoaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIGBuYCBtb3N0IHZhbHVhYmxlIGVsZW1lbnRzIG9mIGEgaGVhcC1saWtlIEFycmF5XG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSwgc2hvdWxkIGJlIGFuIGFycmF5LWhlYXBcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgIG4gICAgICAgIE1heCBudW1iZXIgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbXBhcmUgIE9wdGlvbmFsIGNvbXBhcmUgZnVuY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgICAgIEVsZW1lbnRzXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmhlYXB0b3AgPSBmdW5jdGlvbiAoaGVhcEFyciwgbiwgY29tcGFyZSkge1xuICAgICAgICAgICAgaWYgKG4gPT09IHZvaWQgMCkgeyBuID0gMTsgfVxuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcChjb21wYXJlKTtcbiAgICAgICAgICAgIGhlYXAuaGVhcEFycmF5ID0gaGVhcEFycjtcbiAgICAgICAgICAgIHJldHVybiBoZWFwLnRvcChuKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgYG5gIGxlYXN0IHZhbHVhYmxlIGVsZW1lbnRzIG9mIGEgaGVhcC1saWtlIEFycmF5XG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSwgc2hvdWxkIGJlIGFuIGFycmF5LWhlYXBcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgIG4gICAgICAgIE1heCBudW1iZXIgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbXBhcmUgIE9wdGlvbmFsIGNvbXBhcmUgZnVuY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgICAgIEVsZW1lbnRzXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmhlYXBib3R0b20gPSBmdW5jdGlvbiAoaGVhcEFyciwgbiwgY29tcGFyZSkge1xuICAgICAgICAgICAgaWYgKG4gPT09IHZvaWQgMCkgeyBuID0gMTsgfVxuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcChjb21wYXJlKTtcbiAgICAgICAgICAgIGhlYXAuaGVhcEFycmF5ID0gaGVhcEFycjtcbiAgICAgICAgICAgIHJldHVybiBoZWFwLmJvdHRvbShuKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgYG5gIG1vc3QgdmFsdWFibGUgZWxlbWVudHMgb2YgYW4gaXRlcmFibGVcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgIG4gICAgICAgIE1heCBudW1iZXIgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7SXRlcmFibGV9IEl0ZXJhYmxlIEl0ZXJhYmxlIGxpc3Qgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbXBhcmUgIE9wdGlvbmFsIGNvbXBhcmUgZnVuY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgICAgIEVsZW1lbnRzXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLm5sYXJnZXN0ID0gZnVuY3Rpb24gKG4sIGl0ZXJhYmxlLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBfX3NwcmVhZChpdGVyYWJsZSk7XG4gICAgICAgICAgICBoZWFwLmluaXQoKTtcbiAgICAgICAgICAgIHJldHVybiBoZWFwLnRvcChuKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgYG5gIGxlYXN0IHZhbHVhYmxlIGVsZW1lbnRzIG9mIGFuIGl0ZXJhYmxlXG4gICAgICAgICAqIEBwYXJhbSAge251bWJlcn0gICBuICAgICAgICBNYXggbnVtYmVyIG9mIGVsZW1lbnRzXG4gICAgICAgICAqIEBwYXJhbSAge0l0ZXJhYmxlfSBJdGVyYWJsZSBJdGVyYWJsZSBsaXN0IG9mIGVsZW1lbnRzXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgICAgICAgICAgICBFbGVtZW50c1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5uc21hbGxlc3QgPSBmdW5jdGlvbiAobiwgaXRlcmFibGUsIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBoZWFwID0gbmV3IEhlYXAoY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmhlYXBBcnJheSA9IF9fc3ByZWFkKGl0ZXJhYmxlKTtcbiAgICAgICAgICAgIGhlYXAuaW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAuYm90dG9tKG4pO1xuICAgICAgICB9O1xuICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgSW5zdGFuY2UgbWV0aG9kc1xuICAgICAgICAgKi9cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYW4gZWxlbWVudCB0byB0aGUgaGVhcC4gQWxpYXNlczogYG9mZmVyYC5cbiAgICAgICAgICogU2FtZSBhczogcHVzaChlbGVtZW50KVxuICAgICAgICAgKiBAcGFyYW0ge2FueX0gZWxlbWVudCBFbGVtZW50IHRvIGJlIGFkZGVkXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWVcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9zb3J0Tm9kZVVwKHRoaXMuaGVhcEFycmF5LnB1c2goZWxlbWVudCkgLSAxKTtcbiAgICAgICAgICAgIHRoaXMuX2FwcGx5TGltaXQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhbiBhcnJheSBvZiBlbGVtZW50cyB0byB0aGUgaGVhcC5cbiAgICAgICAgICogU2ltaWxhciBhczogcHVzaChlbGVtZW50LCBlbGVtZW50LCAuLi4pLlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBlbGVtZW50cyBFbGVtZW50cyB0byBiZSBhZGRlZFxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5hZGRBbGwgPSBmdW5jdGlvbiAoZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIHZhciBpID0gdGhpcy5sZW5ndGg7XG4gICAgICAgICAgICAoX2EgPSB0aGlzLmhlYXBBcnJheSkucHVzaC5hcHBseShfYSwgX19zcHJlYWQoZWxlbWVudHMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlVXAoaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hcHBseUxpbWl0KCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgYm90dG9tIChsb3dlc3QgdmFsdWUpIE4gZWxlbWVudHMgb2YgdGhlIGhlYXAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gbiAgTnVtYmVyIG9mIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgIEFycmF5IG9mIGxlbmd0aCA8PSBOLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuYm90dG9tID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIGlmIChuID09PSB2b2lkIDApIHsgbiA9IDE7IH1cbiAgICAgICAgICAgIGlmICh0aGlzLmhlYXBBcnJheS5sZW5ndGggPT09IDAgfHwgbiA8PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gTm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaGVhcEFycmF5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIEp1c3QgdGhlIHBlZWtcbiAgICAgICAgICAgICAgICByZXR1cm4gW3RoaXMuaGVhcEFycmF5WzBdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG4gPj0gdGhpcy5oZWFwQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIHdob2xlIGhlYXBcbiAgICAgICAgICAgICAgICByZXR1cm4gX19zcHJlYWQodGhpcy5oZWFwQXJyYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU29tZSBlbGVtZW50c1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9ib3R0b21OX3B1c2gofn5uKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2hlY2sgaWYgdGhlIGhlYXAgaXMgc29ydGVkLCB1c2VmdWwgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gICAgICAgICAqIEByZXR1cm4ge1VuZGVmaW5lZCB8IEVsZW1lbnR9ICBSZXR1cm5zIGFuIGVsZW1lbnQgaWYgc29tZXRoaW5nIHdyb25nIGlzIGZvdW5kLCBvdGhlcndpc2UgaXQncyB1bmRlZmluZWRcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYXBBcnJheS5maW5kKGZ1bmN0aW9uIChlbCwgaikgeyByZXR1cm4gISFfdGhpcy5nZXRDaGlsZHJlbk9mKGopLmZpbmQoZnVuY3Rpb24gKGNoKSB7IHJldHVybiBfdGhpcy5jb21wYXJlKGVsLCBjaCkgPiAwOyB9KTsgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIG9mIHRoZSBlbGVtZW50cyBmcm9tIHRoaXMgaGVhcC5cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5oZWFwQXJyYXkgPSBbXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsb25lIHRoaXMgaGVhcFxuICAgICAgICAgKiBAcmV0dXJuIHtIZWFwfVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2xvbmVkID0gbmV3IEhlYXAodGhpcy5jb21wYXJhdG9yKCkpO1xuICAgICAgICAgICAgY2xvbmVkLmhlYXBBcnJheSA9IHRoaXMudG9BcnJheSgpO1xuICAgICAgICAgICAgY2xvbmVkLl9saW1pdCA9IHRoaXMuX2xpbWl0O1xuICAgICAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIGNvbXBhcmlzb24gZnVuY3Rpb24uXG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuY29tcGFyYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBhcmU7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhpcyBxdWV1ZSBjb250YWlucyB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gICAgICBvICAgRWxlbWVudCB0byBiZSBmb3VuZFxuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gIE9wdGlvbmFsIGNvbXBhcmlzb24gZnVuY3Rpb24sIHJlY2VpdmVzIChlbGVtZW50LCBuZWVkbGUpXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChvLCBmbikge1xuICAgICAgICAgICAgaWYgKGZuID09PSB2b2lkIDApIHsgZm4gPSBIZWFwLmRlZmF1bHRJc0VxdWFsOyB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFwQXJyYXkuZmluZEluZGV4KGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gZm4oZWwsIG8pOyB9KSA+PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5pdGlhbGlzZSBhIGhlYXAsIHNvcnRpbmcgbm9kZXNcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9IGFycmF5IE9wdGlvbmFsIGluaXRpYWwgc3RhdGUgYXJyYXlcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGVhcEFycmF5ID0gX19zcHJlYWQoYXJyYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IE1hdGguZmxvb3IodGhpcy5oZWFwQXJyYXkubGVuZ3RoKTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zb3J0Tm9kZURvd24oaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9hcHBseUxpbWl0KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUZXN0IGlmIHRoZSBoZWFwIGhhcyBubyBlbGVtZW50cy5cbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBubyBlbGVtZW50cyBvbiB0aGUgaGVhcFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgbGVhZnMgb2YgdGhlIHRyZWUgKG5vIGNoaWxkcmVuIG5vZGVzKVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUubGVhZnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5oZWFwQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBpID0gSGVhcC5nZXRQYXJlbnRJbmRleE9mKHRoaXMuaGVhcEFycmF5Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5LnNsaWNlKHBpICsgMSk7XG4gICAgICAgIH07XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShIZWFwLnByb3RvdHlwZSwgXCJsZW5ndGhcIiwge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBMZW5ndGggb2YgdGhlIGhlYXAuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYXBBcnJheS5sZW5ndGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShIZWFwLnByb3RvdHlwZSwgXCJsaW1pdFwiLCB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdldCBsZW5ndGggbGltaXQgb2YgdGhlIGhlYXAuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9saW1pdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFNldCBsZW5ndGggbGltaXQgb2YgdGhlIGhlYXAuXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNldDogZnVuY3Rpb24gKF9sKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGltaXQgPSB+fl9sO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGx5TGltaXQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRvcCBub2RlLiBBbGlhc2VzOiBgZWxlbWVudGAuXG4gICAgICAgICAqIFNhbWUgYXM6IGB0b3AoMSlbMF1gXG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gVG9wIG5vZGVcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLnBlZWsgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFwQXJyYXlbMF07XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFeHRyYWN0IHRoZSB0b3Agbm9kZSAocm9vdCkuIEFsaWFzZXM6IGBwb2xsYC5cbiAgICAgICAgICogQHJldHVybiB7YW55fSBFeHRyYWN0ZWQgdG9wIG5vZGUsIHVuZGVmaW5lZCBpZiBlbXB0eVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmhlYXBBcnJheS5wb3AoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxlbmd0aCA+IDAgJiYgbGFzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVwbGFjZShsYXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBsYXN0O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUHVzaGVzIGVsZW1lbnQocykgdG8gdGhlIGhlYXAuXG4gICAgICAgICAqIEBwYXJhbSAgey4uLmFueX0gZWxlbWVudHMgRWxlbWVudHMgdG8gaW5zZXJ0XG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IFRydWUgaWYgZWxlbWVudHMgYXJlIHByZXNlbnRcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHNbX2ldID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlbGVtZW50cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKGVsZW1lbnRzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZEFsbChlbGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYW1lIGFzIHB1c2ggJiBwb3AgaW4gc2VxdWVuY2UsIGJ1dCBmYXN0ZXJcbiAgICAgICAgICogQHBhcmFtICB7YW55fSBlbGVtZW50IEVsZW1lbnQgdG8gaW5zZXJ0XG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gIEV4dHJhY3RlZCB0b3Agbm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUucHVzaHBvcCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICBpZiAodGhpcy5jb21wYXJlKHRoaXMuaGVhcEFycmF5WzBdLCBlbGVtZW50KSA8IDApIHtcbiAgICAgICAgICAgICAgICBfYSA9IF9fcmVhZChbdGhpcy5oZWFwQXJyYXlbMF0sIGVsZW1lbnRdLCAyKSwgZWxlbWVudCA9IF9hWzBdLCB0aGlzLmhlYXBBcnJheVswXSA9IF9hWzFdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlRG93bigwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFuIGVsZW1lbnQgZnJvbSB0aGUgaGVhcC5cbiAgICAgICAgICogQHBhcmFtICB7YW55fSAgIG8gICAgICBFbGVtZW50IHRvIGJlIGZvdW5kXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgT3B0aW9uYWwgZnVuY3Rpb24gdG8gY29tcGFyZVxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFRydWUgaWYgdGhlIGhlYXAgd2FzIG1vZGlmaWVkXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobywgZm4pIHtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gdm9pZCAwKSB7IGZuID0gSGVhcC5kZWZhdWx0SXNFcXVhbDsgfVxuICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5oZWFwQXJyYXkuZmluZEluZGV4KGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gZm4oZWwsIG8pOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlkeCA9PT0gdGhpcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFwQXJyYXkucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYXBBcnJheS5zcGxpY2UoaWR4LCAxLCB0aGlzLmhlYXBBcnJheS5wb3AoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc29ydE5vZGVVcChpZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlRG93bihpZHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQb3AgdGhlIGN1cnJlbnQgcGVlayB2YWx1ZSwgYW5kIGFkZCB0aGUgbmV3IGl0ZW0uXG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gZWxlbWVudCAgRWxlbWVudCB0byByZXBsYWNlIHBlZWtcbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICAgIE9sZCBwZWVrXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBwZWVrID0gdGhpcy5oZWFwQXJyYXlbMF07XG4gICAgICAgICAgICB0aGlzLmhlYXBBcnJheVswXSA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB0aGlzLl9zb3J0Tm9kZURvd24oMCk7XG4gICAgICAgICAgICByZXR1cm4gcGVlaztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNpemUgb2YgdGhlIGhlYXBcbiAgICAgICAgICogQHJldHVybiB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgdG9wIChoaWdoZXN0IHZhbHVlKSBOIGVsZW1lbnRzIG9mIHRoZSBoZWFwLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IG4gIE51bWJlciBvZiBlbGVtZW50cy5cbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9ICAgIEFycmF5IG9mIGxlbmd0aCA8PSBOLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUudG9wID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIGlmIChuID09PSB2b2lkIDApIHsgbiA9IDE7IH1cbiAgICAgICAgICAgIGlmICh0aGlzLmhlYXBBcnJheS5sZW5ndGggPT09IDAgfHwgbiA8PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gTm90aGluZyB0byBkb1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaGVhcEFycmF5Lmxlbmd0aCA9PT0gMSB8fCBuID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCB0aGUgcGVla1xuICAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5oZWFwQXJyYXlbMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobiA+PSB0aGlzLmhlYXBBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgd2hvbGUgcGVla1xuICAgICAgICAgICAgICAgIHJldHVybiBfX3NwcmVhZCh0aGlzLmhlYXBBcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTb21lIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX3RvcE5fcHVzaCh+fm4pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbG9uZSB0aGUgaGVhcCdzIGludGVybmFsIGFycmF5XG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfX3NwcmVhZCh0aGlzLmhlYXBBcnJheSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdHJpbmcgb3V0cHV0LCBjYWxsIHRvIEFycmF5LnByb3RvdHlwZS50b1N0cmluZygpXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5LnRvU3RyaW5nKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGVsZW1lbnQgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGkgSW5kZXggdG8gZ2V0XG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgICAgRWxlbWVudCBhdCB0aGF0IGluZGV4XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5W2ldO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBlbGVtZW50cyBvZiB0aGVzZSBub2RlJ3MgY2hpbGRyZW5cbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpZHggTm9kZSBpbmRleFxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheShhbnkpfSAgQ2hpbGRyZW4gZWxlbWVudHNcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmdldENoaWxkcmVuT2YgPSBmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mKGlkeClcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChpKSB7IHJldHVybiBfdGhpcy5oZWFwQXJyYXlbaV07IH0pXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZSkgeyByZXR1cm4gZSAhPT0gdW5kZWZpbmVkOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgZWxlbWVudCBvZiB0aGlzIG5vZGUncyBwYXJlbnRcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpZHggTm9kZSBpbmRleFxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICBQYXJlbnQgZWxlbWVudFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuZ2V0UGFyZW50T2YgPSBmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICB2YXIgcGkgPSBIZWFwLmdldFBhcmVudEluZGV4T2YoaWR4KTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYXBBcnJheVtwaV07XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJdGVyYXRvciBpbnRlcmZhY2VcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGVuZ3RoKSByZXR1cm4gWzMgLypicmVhayovLCAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbNCAvKnlpZWxkKi8sIHRoaXMucG9wKCldO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCAwXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGFuIGl0ZXJhdG9yLiBUbyBjb21wbHkgd2l0aCBKYXZhIGludGVyZmFjZS5cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLml0ZXJhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMaW1pdCBoZWFwIHNpemUgaWYgbmVlZGVkXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fYXBwbHlMaW1pdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9saW1pdCAmJiB0aGlzLl9saW1pdCA8IHRoaXMuaGVhcEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBybSA9IHRoaXMuaGVhcEFycmF5Lmxlbmd0aCAtIHRoaXMuX2xpbWl0O1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgbXVjaCBmYXN0ZXIgdGhhbiBzcGxpY2VcbiAgICAgICAgICAgICAgICB3aGlsZSAocm0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWFwQXJyYXkucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIC0tcm07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBib3R0b20gKGxvd2VzdCB2YWx1ZSkgTiBlbGVtZW50cyBvZiB0aGUgaGVhcCwgd2l0aG91dCBjb3JuZXIgY2FzZXMsIHVuc29ydGVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gbiAgTnVtYmVyIG9mIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgIEFycmF5IG9mIGxlbmd0aCA8PSBOLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX2JvdHRvbU5fcHVzaCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICAvLyBVc2UgYW4gaW52ZXJ0ZWQgaGVhcFxuICAgICAgICAgICAgdmFyIGJvdHRvbUhlYXAgPSBuZXcgSGVhcCh0aGlzLmNvbXBhcmUpO1xuICAgICAgICAgICAgYm90dG9tSGVhcC5saW1pdCA9IG47XG4gICAgICAgICAgICBib3R0b21IZWFwLmhlYXBBcnJheSA9IHRoaXMuaGVhcEFycmF5LnNsaWNlKC1uKTtcbiAgICAgICAgICAgIGJvdHRvbUhlYXAuaW5pdCgpO1xuICAgICAgICAgICAgdmFyIHN0YXJ0QXQgPSB0aGlzLmhlYXBBcnJheS5sZW5ndGggLSAxIC0gbjtcbiAgICAgICAgICAgIHZhciBwYXJlbnRTdGFydEF0ID0gSGVhcC5nZXRQYXJlbnRJbmRleE9mKHN0YXJ0QXQpO1xuICAgICAgICAgICAgdmFyIGluZGljZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydEF0OyBpID4gcGFyZW50U3RhcnRBdDsgLS1pKSB7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFyciA9IHRoaXMuaGVhcEFycmF5O1xuICAgICAgICAgICAgd2hpbGUgKGluZGljZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBpbmRpY2VzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tcGFyZShhcnJbaV0sIGJvdHRvbUhlYXAucGVlaygpKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tSGVhcC5yZXBsYWNlKGFycltpXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICUgMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKEhlYXAuZ2V0UGFyZW50SW5kZXhPZihpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYm90dG9tSGVhcC50b0FycmF5KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNb3ZlIGEgbm9kZSB0byBhIG5ldyBpbmRleCwgc3dpdGNoaW5nIHBsYWNlc1xuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGogRmlyc3Qgbm9kZSBpbmRleFxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGsgQW5vdGhlciBub2RlIGluZGV4XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fbW92ZU5vZGUgPSBmdW5jdGlvbiAoaiwgaykge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgX2EgPSBfX3JlYWQoW3RoaXMuaGVhcEFycmF5W2tdLCB0aGlzLmhlYXBBcnJheVtqXV0sIDIpLCB0aGlzLmhlYXBBcnJheVtqXSA9IF9hWzBdLCB0aGlzLmhlYXBBcnJheVtrXSA9IF9hWzFdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogTW92ZSBhIG5vZGUgZG93biB0aGUgdHJlZSAodG8gdGhlIGxlYXZlcykgdG8gZmluZCBhIHBsYWNlIHdoZXJlIHRoZSBoZWFwIGlzIHNvcnRlZC5cbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpIEluZGV4IG9mIHRoZSBub2RlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fc29ydE5vZGVEb3duID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgbW92ZUl0ID0gaSA8IHRoaXMuaGVhcEFycmF5Lmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMuaGVhcEFycmF5W2ldO1xuICAgICAgICAgICAgdmFyIGdldFBvdGVudGlhbFBhcmVudCA9IGZ1bmN0aW9uIChiZXN0LCBqKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzLmhlYXBBcnJheS5sZW5ndGggPiBqICYmIF90aGlzLmNvbXBhcmUoX3RoaXMuaGVhcEFycmF5W2pdLCBfdGhpcy5oZWFwQXJyYXlbYmVzdF0pIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBiZXN0ID0gajtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJlc3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd2hpbGUgKG1vdmVJdCkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbklkeCA9IEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mKGkpO1xuICAgICAgICAgICAgICAgIHZhciBiZXN0Q2hpbGRJbmRleCA9IGNoaWxkcmVuSWR4LnJlZHVjZShnZXRQb3RlbnRpYWxQYXJlbnQsIGNoaWxkcmVuSWR4WzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgYmVzdENoaWxkID0gdGhpcy5oZWFwQXJyYXlbYmVzdENoaWxkSW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYmVzdENoaWxkICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmNvbXBhcmUoc2VsZiwgYmVzdENoaWxkKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZU5vZGUoaSwgYmVzdENoaWxkSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICBpID0gYmVzdENoaWxkSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb3ZlSXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNb3ZlIGEgbm9kZSB1cCB0aGUgdHJlZSAodG8gdGhlIHJvb3QpIHRvIGZpbmQgYSBwbGFjZSB3aGVyZSB0aGUgaGVhcCBpcyBzb3J0ZWQuXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaSBJbmRleCBvZiB0aGUgbm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX3NvcnROb2RlVXAgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIG1vdmVJdCA9IGkgPiAwO1xuICAgICAgICAgICAgd2hpbGUgKG1vdmVJdCkge1xuICAgICAgICAgICAgICAgIHZhciBwaSA9IEhlYXAuZ2V0UGFyZW50SW5kZXhPZihpKTtcbiAgICAgICAgICAgICAgICBpZiAocGkgPj0gMCAmJiB0aGlzLmNvbXBhcmUodGhpcy5oZWFwQXJyYXlbcGldLCB0aGlzLmhlYXBBcnJheVtpXSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVOb2RlKGksIHBpKTtcbiAgICAgICAgICAgICAgICAgICAgaSA9IHBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW92ZUl0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSB0b3AgKGhpZ2hlc3QgdmFsdWUpIE4gZWxlbWVudHMgb2YgdGhlIGhlYXAsIHdpdGhvdXQgY29ybmVyIGNhc2VzLCB1bnNvcnRlZFxuICAgICAgICAgKiBJbXBsZW1lbnRhdGlvbjogcHVzaC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBuICBOdW1iZXIgb2YgZWxlbWVudHMuXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fSAgICAgQXJyYXkgb2YgbGVuZ3RoIDw9IE4uXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fdG9wTl9wdXNoID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIC8vIFVzZSBhbiBpbnZlcnRlZCBoZWFwXG4gICAgICAgICAgICB2YXIgdG9wSGVhcCA9IG5ldyBIZWFwKHRoaXMuX2ludmVydGVkQ29tcGFyZSk7XG4gICAgICAgICAgICB0b3BIZWFwLmxpbWl0ID0gbjtcbiAgICAgICAgICAgIHZhciBpbmRpY2VzID0gWzBdO1xuICAgICAgICAgICAgdmFyIGFyciA9IHRoaXMuaGVhcEFycmF5O1xuICAgICAgICAgICAgd2hpbGUgKGluZGljZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBpbmRpY2VzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCBhcnIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3BIZWFwLmxlbmd0aCA8IG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcEhlYXAucHVzaChhcnJbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoLmFwcGx5KGluZGljZXMsIF9fc3ByZWFkKEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mKGkpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5jb21wYXJlKGFycltpXSwgdG9wSGVhcC5wZWVrKCkpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wSGVhcC5yZXBsYWNlKGFycltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2guYXBwbHkoaW5kaWNlcywgX19zcHJlYWQoSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0b3BIZWFwLnRvQXJyYXkoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgdG9wIChoaWdoZXN0IHZhbHVlKSBOIGVsZW1lbnRzIG9mIHRoZSBoZWFwLCB3aXRob3V0IGNvcm5lciBjYXNlcywgdW5zb3J0ZWRcbiAgICAgICAgICogSW1wbGVtZW50YXRpb246IGluaXQgKyBwdXNoLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IG4gIE51bWJlciBvZiBlbGVtZW50cy5cbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9ICAgICBBcnJheSBvZiBsZW5ndGggPD0gTi5cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl90b3BOX2ZpbGwgPSBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgLy8gVXNlIGFuIGludmVydGVkIGhlYXBcbiAgICAgICAgICAgIHZhciBoZWFwQXJyYXkgPSB0aGlzLmhlYXBBcnJheTtcbiAgICAgICAgICAgIHZhciB0b3BIZWFwID0gbmV3IEhlYXAodGhpcy5faW52ZXJ0ZWRDb21wYXJlKTtcbiAgICAgICAgICAgIHRvcEhlYXAubGltaXQgPSBuO1xuICAgICAgICAgICAgdG9wSGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyYXkuc2xpY2UoMCwgbik7XG4gICAgICAgICAgICB0b3BIZWFwLmluaXQoKTtcbiAgICAgICAgICAgIHZhciBicmFuY2ggPSBIZWFwLmdldFBhcmVudEluZGV4T2YobiAtIDEpICsgMTtcbiAgICAgICAgICAgIHZhciBpbmRpY2VzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gYnJhbmNoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoLmFwcGx5KGluZGljZXMsIF9fc3ByZWFkKEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mKGkpLmZpbHRlcihmdW5jdGlvbiAobCkgeyByZXR1cm4gbCA8IGhlYXBBcnJheS5sZW5ndGg7IH0pKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKG4gLSAxKSAlIDIpIHtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2gobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoaW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGluZGljZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IGhlYXBBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tcGFyZShoZWFwQXJyYXlbaV0sIHRvcEhlYXAucGVlaygpKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcEhlYXAucmVwbGFjZShoZWFwQXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoLmFwcGx5KGluZGljZXMsIF9fc3ByZWFkKEhlYXAuZ2V0Q2hpbGRyZW5JbmRleE9mKGkpKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdG9wSGVhcC50b0FycmF5KCk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIHRvcCAoaGlnaGVzdCB2YWx1ZSkgTiBlbGVtZW50cyBvZiB0aGUgaGVhcCwgd2l0aG91dCBjb3JuZXIgY2FzZXMsIHVuc29ydGVkXG4gICAgICAgICAqIEltcGxlbWVudGF0aW9uOiBoZWFwLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IG4gIE51bWJlciBvZiBlbGVtZW50cy5cbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9ICAgICBBcnJheSBvZiBsZW5ndGggPD0gTi5cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl90b3BOX2hlYXAgPSBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgdmFyIHRvcEhlYXAgPSB0aGlzLmNsb25lKCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRvcEhlYXAucG9wKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiBpbmRleCBvZiB0aGUgdG9wIGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtIGxpc3RcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl90b3BJZHhPZiA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgICAgICAgICBpZiAoIWxpc3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICAgICAgICB2YXIgdG9wID0gbGlzdFtpZHhdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXAgPSB0aGlzLmNvbXBhcmUobGlzdFtpXSwgdG9wKTtcbiAgICAgICAgICAgICAgICBpZiAoY29tcCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gbGlzdFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaWR4O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSB0b3AgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX3RvcE9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgbGlzdFtfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcCh0aGlzLmNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5pbml0KGxpc3QpO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAucGVlaygpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gSGVhcDtcbiAgICB9KCkpO1xuXG4gICAgZXhwb3J0cy5IZWFwID0gSGVhcDtcbiAgICBleHBvcnRzLmRlZmF1bHQgPSBIZWFwO1xuICAgIGV4cG9ydHMudG9JbnQgPSB0b0ludDtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iXX0=
