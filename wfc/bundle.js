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
        // cell._possible = cell._possible.fill(false);
        // cell._possible[Math.floor(Math.random()*cell._possible.length)] = true;
        // cell._possible[Math.floor(Math.random()*cell._possible.length)] = true;
        cell._sumWeight = template._sumWeight;
        cell._sumWeightTimesLogWeight = template._sumWeightTimesLogWeight;
        cell._tileEnablerCounts = Array.from(template._tileEnablerCounts, inner => Array.from(inner));
        return cell;
    }
    *possibleTiles() {
        for (let i = 0; i < this._possible.length; i++) {
            if (this._possible[i])
                yield i;
        }
    }
    chooseTile(frequencyHints) {
        // return this._chosenTile = 12;
        let chosenWeight = Math.random() * this._sumWeight;
        for (let tile of this.possibleTiles()) {
            chosenWeight -= frequencyHints.weightForTile(tile);
            if (chosenWeight < 0)
                return this._chosenTile = tile;
        }
        throw new Error("cell weights were invalid");
    }
    removeTile(tile, frequencyHints = null) {
        this._possible[tile] = false;
        if (frequencyHints) {
            let weight = frequencyHints.weightForTile(tile);
            this._sumWeight -= weight;
            this._sumWeightTimesLogWeight -= weight * Math.log2(weight);
        }
    }
    get isCollapsed() { return this._chosenTile != -1; }
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
    step() {
        let p = this._chooseCell();
        if (!p)
            return false;
        let removals = this._collapseCell(p);
        return this._propagate(removals);
    }
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
    _chooseCell() {
        let cell;
        while (cell = this._entropyHeap.pop()) {
            let [x, y] = cell.pos;
            if (!this._grid[y][x].isCollapsed)
                return cell.pos;
        }
        return null;
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJtYWluLnRzIiwibm9kZV9tb2R1bGVzL2RhdC5ndWkvYnVpbGQvZGF0Lmd1aS5qcyIsIm5vZGVfbW9kdWxlcy9oZWFwLWpzL2Rpc3QvaGVhcC1qcy51bWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLCtCQUErQjtBQUMvQixxQ0FBMkI7QUFFM0IsSUFBSSxNQUFNLEdBQU8sRUFBRSxDQUFDO0FBQ3BCLE1BQU0sQ0FBQyxNQUFNLEdBQUc7SUFDZCxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN4QixNQUFNLFlBQVksR0FBRyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDOUUsU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFFLE9BQVksRUFBRSxHQUFTLEVBQUUsR0FBWTtRQUNwRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUNELFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkUsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDbEUsU0FBUyxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxD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SUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2pELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQztJQUM1QyxJQUFJLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEdBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUMsQ0FBQyxDQUFDLEdBQUMsSUFBSSxHQUFHLENBQUMsQ0FBZ0IsQ0FBQztJQUUzRyxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7UUFDNUMsSUFBSSxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBQyxNQUFNLENBQUM7UUFDeEIsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLE1BQU07WUFDdEIsTUFBTTtRQUNSLEtBQUssSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0RztJQUVELGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELHFHQUFx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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMStFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImltcG9ydCAqIGFzIERhdCBmcm9tIFwiZGF0Lmd1aVwiO1xyXG5pbXBvcnQgSGVhcCBmcm9tICdoZWFwLWpzJztcclxuXHJcbmxldCBjb25maWc6YW55ID0ge307XHJcbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgZ3VpID0gbmV3IERhdC5HVUkoKTtcclxuICBjb25zdCByZWFkYWJsZU5hbWUgPSAobjogc3RyaW5nKSA9PiBuLnJlcGxhY2UoLyhbQS1aXSkvZywgJyAkMScpLnRvTG93ZXJDYXNlKClcclxuICBmdW5jdGlvbiBhZGRDb25maWcobmFtZTogc3RyaW5nLCBpbml0aWFsOiBhbnksIG1pbj86IGFueSwgbWF4PzogbnVtYmVyKSB7XHJcbiAgICBjb25maWdbbmFtZV0gPSBpbml0aWFsO1xyXG4gICAgcmV0dXJuIGd1aS5hZGQoY29uZmlnLCBuYW1lLCBtaW4sIG1heCkubmFtZShyZWFkYWJsZU5hbWUobmFtZSkpO1xyXG4gIH1cclxuICBhZGRDb25maWcoXCJpbmNsdWRlUm90YXRlZEFuZEZsaXBwZWRcIiwgZmFsc2UpLm9uRmluaXNoQ2hhbmdlKGluaXRUaWxlcyk7XHJcbiAgYWRkQ29uZmlnKFwidGlsZVNpemVcIiwgMywgMiwgMTApLnN0ZXAoMSkub25GaW5pc2hDaGFuZ2UoaW5pdFRpbGVzKTtcclxuICBhZGRDb25maWcoXCJvdXRwdXRXaWR0aFwiLCA1MCwgNSwgMTAwMCkuc3RlcCg1KS5vbkZpbmlzaENoYW5nZShpbml0VGlsZXMpO1xyXG4gIGFkZENvbmZpZyhcIm91dHB1dEhlaWdodFwiLCA1MCwgNSwgMTAwMCkuc3RlcCg1KS5vbkZpbmlzaENoYW5nZShpbml0VGlsZXMpO1xyXG4gIGFkZENvbmZpZyhcImlucHV0XCIsIFwidGlsZXMvV2F0ZXIucG5nXCIsIFtcclxuICAgIFwidGlsZXMvM0JyaWNrcy5wbmdcIiwgXCJ0aWxlcy9Bbmd1bGFyLnBuZ1wiLCBcInRpbGVzL0NhdC5wbmdcIiwgXCJ0aWxlcy9DYXRzLnBuZ1wiLCBcInRpbGVzL0NhdmUucG5nXCIsIFwidGlsZXMvQ2hlc3MucG5nXCIsXHJcbiAgICBcInRpbGVzL0NpdHkucG5nXCIsIFwidGlsZXMvQ29sb3JlZENpdHkucG5nXCIsIFwidGlsZXMvRHVuZ2Vvbi5wbmdcIiwgXCJ0aWxlcy9GYWJyaWMucG5nXCIsIFwidGlsZXMvRmxvd2Vycy5wbmdcIiwgXCJ0aWxlcy9Gb3Jlc3QucG5nXCIsXHJcbiAgICBcInRpbGVzL0dyaWQucG5nXCIsIFwidGlsZXMvR3JpZExvbmcucG5nXCIsIFwidGlsZXMvSG9ncy5wbmdcIiwgXCJ0aWxlcy9Lbm90LnBuZ1wiLCBcInRpbGVzL0xha2UucG5nXCIsIFwidGlsZXMvTGVzc1Jvb21zLnBuZ1wiLCBcInRpbGVzL0xpbmsucG5nXCIsXHJcbiAgICBcInRpbGVzL0xpbmsyLnBuZ1wiLCBcInRpbGVzL01hZ2ljT2ZmaWNlLnBuZ1wiLCBcInRpbGVzL01hemUucG5nXCIsIFwidGlsZXMvTWF6ZWxpa2UucG5nXCIsIFwidGlsZXMvTW9yZUZsb3dlcnMucG5nXCIsIFwidGlsZXMvTW91bnRhaW5zLnBuZ1wiLFxyXG4gICAgXCJ0aWxlcy9OZXN0ZWQucG5nXCIsIFwidGlsZXMvT2ZmaWNlLnBuZ1wiLCBcInRpbGVzL09mZmljZTIucG5nXCIsIFwidGlsZXMvUGF0aHMucG5nXCIsIFwidGlsZXMvUGxhdGZvcm1lci5wbmdcIiwgXCJ0aWxlcy9RdWQucG5nXCIsIFwidGlsZXMvUmVkRG90LnBuZ1wiLFxyXG4gICAgXCJ0aWxlcy9SZWRNYXplLnBuZ1wiLCBcInRpbGVzL1Jvb21zLnBuZ1wiLCBcInRpbGVzL1J1bGUxMjYucG5nXCIsIFwidGlsZXMvU2NhbGVkTWF6ZS5wbmdcIiwgXCJ0aWxlcy9TZXdlcnMucG5nXCIsIFwidGlsZXMvU2ltcGxlS25vdC5wbmdcIixcclxuICAgIFwidGlsZXMvU2ltcGxlTWF6ZS5wbmdcIiwgXCJ0aWxlcy9TaW1wbGVXYWxsLnBuZ1wiLCBcInRpbGVzL1NrZXcxLnBuZ1wiLCBcInRpbGVzL1NrZXcyLnBuZ1wiLCBcInRpbGVzL1NreWxpbmUucG5nXCIsIFwidGlsZXMvU2t5bGluZTIucG5nXCIsXHJcbiAgICBcInRpbGVzL1NtaWxlQ2l0eS5wbmdcIiwgXCJ0aWxlcy9TcGlyYWxzLnBuZ1wiLCBcInRpbGVzL1Rvd24ucG5nXCIsIFwidGlsZXMvVHJpY2tLbm90LnBuZ1wiLCBcInRpbGVzL1ZpbGxhZ2UucG5nXCIsIFwidGlsZXMvV2FsbC5wbmdcIiwgXCJ0aWxlcy9XYXRlci5wbmdcIixcclxuICBdKS5vbkZpbmlzaENoYW5nZShpbml0VGlsZXMpO1xyXG5cclxuICBndWkudXNlTG9jYWxTdG9yYWdlID0gdHJ1ZTtcclxuXHJcbiAgaW5pdFRpbGVzKCk7XHJcbn07XHJcblxyXG5sZXQgaW50ZXJ2YWxJZDogbnVtYmVyO1xyXG5mdW5jdGlvbiBpbml0VGlsZXMoKSB7XHJcbiAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xyXG4gIGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gIGltZy5zcmMgPSBjb25maWcuaW5wdXQ7XHJcblxyXG4gIGlmIChpbnRlcnZhbElkKVxyXG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJZCk7XHJcblxyXG4gIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vIFVwZGF0ZSB0aGUgaW5wdXQgdGlsZSBkaXNwbGF5LlxyXG4gICAge1xyXG4gICAgICBsZXQgY2FudmFzID0gJChcImlucHV0XCIpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xyXG4gICAgICBsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuICAgICAgY29udGV4dC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgLy8gW2NhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodF0gPSBbaW1nLndpZHRoLCBpbWcuaGVpZ2h0XTtcclxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IHRoZSBpbWFnZSBkYXRhIGZyb20gdGhlIGltYWdlLlxyXG4gICAge1xyXG4gICAgICBsZXQgY2FudmFzID0gbmV3IE9mZnNjcmVlbkNhbnZhcyhpbWcud2lkdGgsIGltZy5oZWlnaHQpO1xyXG4gICAgICBsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcclxuICAgICAgbGV0IGltYWdlRGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGltZy53aWR0aCwgaW1nLmhlaWdodCkgYXMgTXlJbWFnZURhdGE7XHJcbiAgICAgIGxldCByZXN1bHRzID0gcGFyc2VJbWFnZShpbWFnZURhdGEpO1xyXG4gICAgICBsZXQgY29yZSA9IG5ldyBDb3JlU3RhdGUoLi4ucmVzdWx0cyk7XHJcbiAgICAgIGNvcmUuaW5pdCgpO1xyXG4gICAgICBjb3JlLnJlbmRlcigpO1xyXG4gICAgICBsZXQgcGF1c2VkID0gdHJ1ZTtcclxuICAgICAgd2luZG93Lm9uY2xpY2sgPSAoKSA9PiB7cGF1c2VkID0gIXBhdXNlZDsgfTtcclxuICAgICAgaW50ZXJ2YWxJZCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgaWYgKHBhdXNlZCkgcmV0dXJuO1xyXG4gICAgICAgIGlmICghY29yZS5zdGVwKCkpXHJcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcclxuICAgICAgICBjb3JlLnJlbmRlcigpO1xyXG4gICAgICB9LCAwKTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG4vLyBTaGFtZWxlc3MgaGFjayB0byBleHRlbmQgSW1hZ2VEYXRhIHdpdGggY29uY2lzZSBwaXhlbCBhY2Nlc3NvcnMuXHJcbmludGVyZmFjZSBNeUltYWdlRGF0YSBleHRlbmRzIEltYWdlRGF0YSB7XHJcbiAgZ2V0KFt4LCB5XTogUG9pbnQpOiBDb2xvcjtcclxuICBzZXQoW3gsIHldOiBQb2ludCwgYzogQ29sb3IpOiB2b2lkO1xyXG59XHJcbkltYWdlRGF0YS5wcm90b3R5cGVbXCJnZXRcIl0gPSBmdW5jdGlvbihbeCwgeV06IFBvaW50KTogQ29sb3Ige1xyXG4gIGxldCByID0gNCAqICh5ICogdGhpcy53aWR0aCArIHgpO1xyXG4gIHJldHVybiAodGhpcy5kYXRhW3JdIDw8IDI0KSB8ICh0aGlzLmRhdGFbcisxXSA8PCAxNikgfCAodGhpcy5kYXRhW3IrMl0gPDwgOCkgfCAodGhpcy5kYXRhW3IrM10pO1xyXG59XHJcbkltYWdlRGF0YS5wcm90b3R5cGVbXCJzZXRcIl0gPSBmdW5jdGlvbihbeCwgeV06IFBvaW50LCBjb2xvcjogQ29sb3IpOiB2b2lkIHtcclxuICBsZXQgciA9IDQgKiAoeSAqIHRoaXMud2lkdGggKyB4KTtcclxuICB0aGlzLmRhdGFbciswXSA9IChjb2xvciA+Pj4gMjQpICYgMHhmZjtcclxuICB0aGlzLmRhdGFbcisxXSA9IChjb2xvciA+Pj4gMTYpICYgMHhmZjtcclxuICB0aGlzLmRhdGFbcisyXSA9IChjb2xvciA+Pj4gOCkgJiAweGZmO1xyXG4gIHRoaXMuZGF0YVtyKzNdID0gKGNvbG9yKSAmIDB4ZmY7XHJcbn1cclxuXHJcbi8vIENvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBpdGVyYXRpbmcgb3ZlciByZWN0YW5ndWxhciByZWdpb25zLlxyXG5mdW5jdGlvbiogcmVjdFJhbmdlKFt3LCBoXTogU2l6ZSkge1xyXG4gIGZvciAobGV0IHkgPSAwOyB5IDwgaDsgeSsrKSB7XHJcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHc7IHgrKykge1xyXG4gICAgICB5aWVsZCA8UG9pbnQ+W3gseV1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8vIEhlbHBlciBmb3IgZmxhdHRlbmluZyBhIDJkIGNvb3JkIHRvIGFuIGluZGV4IChyb3ctbWFqb3Igb3JkZXIpLlxyXG5mdW5jdGlvbiBwb2ludFRvSW5kZXgoW3gsIHldOiBQb2ludCwgd2lkdGg6IG51bWJlcik6IG51bWJlciB7XHJcbiAgcmV0dXJuIHggKyB5KndpZHRoO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJUb0NhbnZhcyhjYW52YXNJZDogc3RyaW5nLCBpbWFnZURhdGE6IEltYWdlRGF0YSk6IHZvaWQge1xyXG4gIC8vIEJsaXQgdG8gYW4gb2Zmc2NyZWVuIGNhbnZhcyBmaXJzdCwgc28gd2UgY2FuIHNjYWxlIGl0IHVwIHdoZW4gZHJhd2luZyBpdCBmb3IgcmVhbC5cclxuICBsZXQgYnVmZmVyID0gbmV3IE9mZnNjcmVlbkNhbnZhcyhpbWFnZURhdGEud2lkdGgsIGltYWdlRGF0YS5oZWlnaHQpO1xyXG4gIHtcclxuICAgIGxldCBjb250ZXh0ID0gYnVmZmVyLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XHJcbiAgfVxyXG5cclxuICBsZXQgY2FudmFzID0gJChjYW52YXNJZCkgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgbGV0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICBpZiAoIWNvbnRleHQpIHJldHVybjtcclxuICBjb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xyXG4gIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgY29udGV4dC5kcmF3SW1hZ2UoYnVmZmVyLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xyXG59XHJcblxyXG4vLyBGdWxsIGpxdWVyeSBlbXVsYXRpb24uXHJcbmNvbnN0ICQgPSAoaWQ6IHN0cmluZykgPT4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG5cclxuLy8gSG93IHdlIGlkZW50aWZ5IGEgdGlsZSAtIGp1c3QgaXRzIGluZGV4IGludG8gdGhlIGxpc3Qgb2YgYWxsIHRpbGVzLlxyXG50eXBlIFRpbGVJbmRleCA9IG51bWJlcjtcclxuXHJcbi8vIEEgbnVtYmVyIGdpdmluZyB0aGUgcmVsYXRpdmUgZnJlcXVlbmN5IG9mIGEgdGlsZS5cclxudHlwZSBGcmVxdWVuY3lXZWlnaHQgPSBudW1iZXI7XHJcblxyXG4vLyBDYXJkaW5hbCBkaXJlY3Rpb25zLlxyXG5lbnVtIERpcmVjdGlvbiB7IFVwLCBSaWdodCwgRG93biwgTGVmdCB9O1xyXG5uYW1lc3BhY2UgRGlyZWN0aW9uIHtcclxuICBleHBvcnQgY29uc3QgaXRlbXM6IERpcmVjdGlvbltdID0gW0RpcmVjdGlvbi5VcCwgRGlyZWN0aW9uLlJpZ2h0LCBEaXJlY3Rpb24uRG93biwgRGlyZWN0aW9uLkxlZnRdO1xyXG4gIGV4cG9ydCBjb25zdCB0b09wcG9zaXRlOiBEaXJlY3Rpb25bXSA9IFtEaXJlY3Rpb24uRG93biwgRGlyZWN0aW9uLkxlZnQsIERpcmVjdGlvbi5VcCwgRGlyZWN0aW9uLlJpZ2h0XTtcclxuICBleHBvcnQgY29uc3QgdG9PZmZzZXQ6IFNpemVbXSA9IFtbMCwgLTFdLCBbMSwgMF0sIFswLCAxXSwgWy0xLCAwXV07XHJcbn1cclxuXHJcbi8vIEEgMzItYml0IFJHQkEgY29sb3IuIEZvcm1hdCBpcyAweFJSR0dCQkFBLlxyXG50eXBlIENvbG9yID0gbnVtYmVyO1xyXG5cclxuLy8gQW4geCx5IHR1cGxlLlxyXG50eXBlIFBvaW50ID0gW251bWJlciwgbnVtYmVyXTtcclxudHlwZSBTaXplID0gW251bWJlciwgbnVtYmVyXTtcclxuXHJcbi8vIE1hcHBpbmcgb2YgVGlsZUluZGV4IC0+IGNvbG9yIG9mIHRoZSB0b3AtbGVmdCBwaXhlbCBvZiB0aGF0IHRpbGUuXHJcbnR5cGUgVGlsZUNvbG9yTWFwcGluZyA9IENvbG9yW107XHJcblxyXG4vLyBNYW5hZ2VzIHJlbGF0aXZlIGZyZXF1ZW5jaWVzIG9mIGFsbCB0aGUgdGlsZXMuIFRoZSBoaWdoZXIgYSB0aWxlJ3MgZnJlcXVlbmN5LFxyXG4vLyB0aGUgbW9yZSBsaWtlbHkgdGhhdCB0aWxlIHdpbGwgYXBwZWFyIGluIHRoZSBvdXRwdXQuXHJcbmNsYXNzIEZyZXF1ZW5jeUhpbnRzIHtcclxuICBjb25zdHJ1Y3Rvcihjb3VudHM6IG51bWJlcltdKSB7XHJcbiAgICB0aGlzLl90aWxlV2VpZ2h0cyA9IGNvdW50cztcclxuICB9XHJcbiAgLy8gd1tuXSAtIHRoZSByZWxhdGl2ZSBmcmVxdWVuY3kgb2YgdGhlIGdpdmVuIHRpbGUuIFRoaXMgaXMgc2ltcGx5IHRoZSBudW1iZXIgb2ZcclxuICAvLyB0aW1lcyBpdCBhcHBlYXJzIGluIHRoZSBzb3VyY2UgaW1hZ2UuXHJcbiAgd2VpZ2h0Rm9yVGlsZShpbmRleDogVGlsZUluZGV4KTogRnJlcXVlbmN5V2VpZ2h0IHtcclxuICAgIHJldHVybiB0aGlzLl90aWxlV2VpZ2h0c1tpbmRleF07XHJcbiAgfVxyXG4gIGdldCBudW1UaWxlcygpIHsgcmV0dXJuIHRoaXMuX3RpbGVXZWlnaHRzLmxlbmd0aDsgfVxyXG5cclxuICBwcml2YXRlIHJlYWRvbmx5IF90aWxlV2VpZ2h0czogRnJlcXVlbmN5V2VpZ2h0W10gPSBbXTtcclxuICBwcml2YXRlIHJlYWRvbmx5IF9zdW1XZWlnaHQ6IEZyZXF1ZW5jeVdlaWdodCA9IDA7XHJcbiAgcHJpdmF0ZSByZWFkb25seSBfc3VtV2VpZ2h0VGltZXNMb2dXZWlnaHQ6IG51bWJlciA9IDA7XHJcbn1cclxuXHJcbi8vIE1hbmFnZXMgcnVsZXMgZm9yIHdoaWNoIHRpbGVzIGFyZSBhbGxvd2VkIHRvIGJlIGFkamFjZW50IHRvIHdoaWNoIG90aGVyIHRpbGVzLCBpbiBhIGdpdmVuIGRpcmVjdGlvbi5cclxuY2xhc3MgQWRqYWNlbmN5UnVsZXMge1xyXG4gIGNvbnN0cnVjdG9yKHRpbGVzOiBUaWxlW10pIHtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aWxlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgIGZvciAobGV0IGRpciBvZiBEaXJlY3Rpb24uaXRlbXMpIHtcclxuICAgICAgICAgIGlmIChBZGphY2VuY3lSdWxlcy5faXNDb21wYXRpYmxlKHRpbGVzW2ldLCB0aWxlc1tqXSwgZGlyKSlcclxuICAgICAgICAgICAgdGhpcy5fYWxsb3coaSwgaiwgZGlyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZ2V0IG51bVRpbGVzKCkgeyByZXR1cm4gdGhpcy5fYWxsb3dlZC5sZW5ndGg7IH1cclxuICAvLyBSZXR1cm5zIHRydWUgaWYgd2UgY2FuIHBsYWNlIHRpbGUgYHRvYCBpbiB0aGUgZGlyZWN0aW9uIGBkaXJgIGZyb20gYGZyb21gLlxyXG4gIGlzQWxsb3dlZChmcm9tOiBUaWxlSW5kZXgsIHRvOiBUaWxlSW5kZXgsIGRpcjogRGlyZWN0aW9uKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgLy8gUmV0dXJucyBhbiBpdGVyYXRvciBvZiBhbGwgdGhlIHRpbGVzIHdoaWNoIGNhbiBiZSBwbGFjZWQgb25lIHNwYWNlIGluIGRpcmVjdGlvbiBgZGlyYFxyXG4gIC8vIGZyb20gdGlsZSBgZnJvbWAuXHJcbiAgKmFsbG93ZWRUaWxlcyhmcm9tOiBUaWxlSW5kZXgsIGRpcjogRGlyZWN0aW9uKSB7XHJcbiAgICBsZXQgYWxsb3dlZCA9IHRoaXMuX2FsbG93ZWRbZnJvbV1bZGlyXTtcclxuICAgIGZvciAobGV0IHRpbGUgb2YgYWxsb3dlZClcclxuICAgICAgeWllbGQgdGlsZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgc3RhdGljIF9pc0NvbXBhdGlibGUoYTogVGlsZSwgYjogVGlsZSwgZGlyOiBEaXJlY3Rpb24pOiBib29sZWFuIHtcclxuICAgIGxldCBvZmZzZXQgPSBEaXJlY3Rpb24udG9PZmZzZXRbZGlyXTtcclxuICAgIGZvciAobGV0IFtheCwgYXldIG9mIHJlY3RSYW5nZShbY29uZmlnLnRpbGVTaXplLCBjb25maWcudGlsZVNpemVdKSkge1xyXG4gICAgICBsZXQgW2J4LCBieV0gPSBbYXggLSBvZmZzZXRbMF0sIGF5IC0gb2Zmc2V0WzFdXTtcclxuICAgICAgaWYgKGJ4IDwgMCB8fCBieSA8IDAgfHwgYnggPj0gY29uZmlnLnRpbGVTaXplIHx8IGJ5ID49IGNvbmZpZy50aWxlU2l6ZSlcclxuICAgICAgICBjb250aW51ZTsgIC8vIG5vdCBhbiBvdmVybGFwcGluZyByZWdpb24sIGlnbm9yZVxyXG4gICAgICBpZiAoYS5nZXRQaXhlbChbYXgsIGF5XSkgIT0gYi5nZXRQaXhlbChbYngsIGJ5XSkpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIHByaXZhdGUgX2FsbG93KGZyb206IFRpbGVJbmRleCwgdG86IFRpbGVJbmRleCwgZGlyOiBEaXJlY3Rpb24pOiB2b2lkIHtcclxuICAgIGlmICghdGhpcy5fYWxsb3dlZFtmcm9tXSkgdGhpcy5fYWxsb3dlZFtmcm9tXSA9IFtdO1xyXG4gICAgaWYgKCF0aGlzLl9hbGxvd2VkW2Zyb21dW2Rpcl0pIHRoaXMuX2FsbG93ZWRbZnJvbV1bZGlyXSA9IFtdO1xyXG4gICAgdGhpcy5fYWxsb3dlZFtmcm9tXVtkaXJdLnB1c2godG8pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBfYWxsb3dlZDogVGlsZUluZGV4W11bXVtdID0gW107IC8vIF9hbGxvd2VkW2Zyb21dW2Rpcl0gPSBbdGlsZUluZGljZXMuLi5dXHJcbn1cclxuXHJcbi8vIFBpeGVsIGRhdGEgZm9yIGEgVGlsZS4gT25seSB1c2VkIGR1cmluZyBwcmUtcHJvY2Vzc2luZy4gRHVyaW5nIHRoZSBhY3R1YWwgYWxnb3JpdGhtLFxyXG4vLyB3ZSByZWZlciB0byB0aWxlcyBieSBpbmRleC4gVGhlIEFkamFjZW5jeVJ1bGVzIGFuZCBGcmVxdWVuY3lIaW50cyBnb3Zlcm4gaG93IHdlXHJcbi8vIGNhbiBwbGFjZSB0aWxlcyBpbiB0aGUgZ3JpZCwgYW5kIHRoZSBUaWxlQ29sb3JNYXBwaW5nIHRlbGxzIHVzIHdoYXQgY29sb3IgdG8gdXNlLlxyXG5jbGFzcyBUaWxlIHtcclxuICB0b3BMZWZ0UGl4ZWwoKTogQ29sb3IgeyByZXR1cm4gdGhpcy5fcGl4ZWxzWzBdOyB9XHJcbiAgZ2V0UGl4ZWwoW3gsIHldOiBQb2ludCk6IENvbG9yIHsgcmV0dXJuIHRoaXMuX3BpeGVsc1t4ICsgeSAqIGNvbmZpZy50aWxlU2l6ZV07IH1cclxuICBnZXQgbWFwS2V5KCk6IHN0cmluZyB7XHJcbiAgICBpZiAoIXRoaXMuX21hcEtleSlcclxuICAgICAgdGhpcy5fbWFwS2V5ID0gdGhpcy5fcGl4ZWxzLmpvaW4oXCIsXCIpO1xyXG4gICAgcmV0dXJuIHRoaXMuX21hcEtleTtcclxuICB9XHJcblxyXG4gIC8vIFJldHVybnMgdGhlIFRpbGUgZm91bmQgYXQgdGhlIGdpdmVuIGNvb3JkIGluIHRoZSBpbWFnZSwgd3JhcHBpbmcgY29vcmRpbmF0ZXMuXHJcbiAgc3RhdGljIGZyb21JbWFnZURhdGEoaW1hZ2VEYXRhOiBNeUltYWdlRGF0YSwgW2l4LCBpeV06IFBvaW50KTogVGlsZSB7XHJcbiAgICBsZXQgdGlsZSA9IG5ldyBUaWxlO1xyXG4gICAgZm9yIChsZXQgW3R4LCB0eV0gb2YgcmVjdFJhbmdlKFtjb25maWcudGlsZVNpemUsIGNvbmZpZy50aWxlU2l6ZV0pKVxyXG4gICAgICB0aWxlLl9waXhlbHNbcG9pbnRUb0luZGV4KFt0eCwgdHldLCBjb25maWcudGlsZVNpemUpXSA9IGltYWdlRGF0YS5nZXQoWyhpeCArIHR4KSAlIGltYWdlRGF0YS53aWR0aCwgKGl5ICsgdHkpICUgaW1hZ2VEYXRhLmhlaWdodF0pO1xyXG4gICAgcmV0dXJuIHRpbGU7XHJcbiAgfVxyXG4gIC8vIFJldHVybnMgYSBjb3B5IG9mIGBvcmlnYCByb3RhdGVkIDkwIGRlZ3JlZXMgY2xvY2t3aXNlLlxyXG4gIHN0YXRpYyByb3RhdGVkKG9yaWc6IFRpbGUpOiBUaWxlIHtcclxuICAgIC8vICh4LHkpID0+ICh3LXkseClcclxuICAgIGxldCB0aWxlID0gbmV3IFRpbGU7XHJcbiAgICBmb3IgKGxldCBbeCwgeV0gb2YgcmVjdFJhbmdlKFtjb25maWcudGlsZVNpemUsIGNvbmZpZy50aWxlU2l6ZV0pKVxyXG4gICAgICB0aWxlLl9waXhlbHNbcG9pbnRUb0luZGV4KFtjb25maWcudGlsZVNpemUgLSAxIC0geSwgeF0sIGNvbmZpZy50aWxlU2l6ZSldID0gb3JpZy5fcGl4ZWxzW3BvaW50VG9JbmRleChbeCwgeV0sIGNvbmZpZy50aWxlU2l6ZSldO1xyXG4gICAgcmV0dXJuIHRpbGU7XHJcbiAgfVxyXG4gIC8vIFJldHVybnMgYSBjb3B5IG9mIGBvcmlnYCBmbGlwcGVkIHZlcnRpY2FsbHkuXHJcbiAgc3RhdGljIGZsaXBwZWQob3JpZzogVGlsZSk6IFRpbGUge1xyXG4gICAgLy8gKHgseSkgPT4gKHgsdy15KVxyXG4gICAgbGV0IHRpbGUgPSBuZXcgVGlsZTtcclxuICAgIGZvciAobGV0IFt4LCB5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy50aWxlU2l6ZSwgY29uZmlnLnRpbGVTaXplXSkpXHJcbiAgICAgIHRpbGUuX3BpeGVsc1twb2ludFRvSW5kZXgoW3gsIGNvbmZpZy50aWxlU2l6ZSAtIDEgLSB5XSwgY29uZmlnLnRpbGVTaXplKV0gPSBvcmlnLl9waXhlbHNbcG9pbnRUb0luZGV4KFt4LCB5XSwgY29uZmlnLnRpbGVTaXplKV07XHJcbiAgICByZXR1cm4gdGlsZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX3BpeGVsczogQ29sb3JbXSA9IFtdO1xyXG4gIHByaXZhdGUgX21hcEtleTogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBUaWxlQ291bnRNYXAgZXh0ZW5kcyBNYXA8c3RyaW5nLCB7dGlsZTogVGlsZSwgY291bnQ6IG51bWJlcn0+IHtcclxuICBhZGRUaWxlKHRpbGU6IFRpbGUpOiBudW1iZXIge1xyXG4gICAgbGV0IHZhbHVlID0gdGhpcy5nZXQodGlsZS5tYXBLZXkpIHx8IHt0aWxlOiB0aWxlLCBjb3VudDogMH07XHJcbiAgICB2YWx1ZS5jb3VudCsrO1xyXG4gICAgdGhpcy5zZXQodGlsZS5tYXBLZXksIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZS5jb3VudDtcclxuICB9XHJcbn1cclxuXHJcbi8vIFByZS1wcm9jZXNzaW5nIHN0ZXAuIFJlYWRzIGFuIGltYWdlIGFuZCBjdXRzIGl0IHVwIGludG8gTnhOIHRpbGVzIChOPXRpbGVTaXplKS5cclxuLy8gQWxzbyBjYWxjdWxhdGVzIHRoZSBydWxlcyB0aGF0IGFyZSBmZWQgaW50byB0aGUgbWFpbiBhbGdvcml0aG0uXHJcbmZ1bmN0aW9uIHBhcnNlSW1hZ2UoaW1hZ2VEYXRhOiBNeUltYWdlRGF0YSk6IFtBZGphY2VuY3lSdWxlcywgRnJlcXVlbmN5SGludHMsIFRpbGVDb2xvck1hcHBpbmddIHtcclxuICBsZXQgdGlsZU1hcCA9IG5ldyBUaWxlQ291bnRNYXAoKTtcclxuICBmb3IgKGxldCBwIG9mIHJlY3RSYW5nZShbaW1hZ2VEYXRhLndpZHRoLCBpbWFnZURhdGEuaGVpZ2h0XSkpIHtcclxuICAgIGxldCB0aWxlID0gVGlsZS5mcm9tSW1hZ2VEYXRhKGltYWdlRGF0YSwgcCk7XHJcbiAgICBsZXQgY291bnQgPSB0aWxlTWFwLmFkZFRpbGUodGlsZSk7XHJcbiAgICBpZiAoY29uZmlnLmluY2x1ZGVSb3RhdGVkQW5kRmxpcHBlZCkge1xyXG4gICAgICAvLyBBZGQgdGhlIG90aGVyIDMgcm90YXRpb25zLCBhbmQgdGhlIDQgcm90YXRpb25zIG9mIHRoZSBmbGlwcGVkIGNhc2UgKGZvciAwLCA5MCwgMTgwLCBhbmQgMjcwIGRlZ3JlZXMpXHJcbiAgICAgIGxldCBzdWJ0aWxlID0gdGlsZTtcclxuICAgICAgdGlsZU1hcC5hZGRUaWxlKHN1YnRpbGUgPSBUaWxlLnJvdGF0ZWQoc3VidGlsZSkpO1xyXG4gICAgICB0aWxlTWFwLmFkZFRpbGUoc3VidGlsZSA9IFRpbGUucm90YXRlZChzdWJ0aWxlKSk7XHJcbiAgICAgIHRpbGVNYXAuYWRkVGlsZShzdWJ0aWxlID0gVGlsZS5yb3RhdGVkKHN1YnRpbGUpKTtcclxuICAgICAgdGlsZU1hcC5hZGRUaWxlKHN1YnRpbGUgPSBUaWxlLmZsaXBwZWQodGlsZSkpO1xyXG4gICAgICB0aWxlTWFwLmFkZFRpbGUoc3VidGlsZSA9IFRpbGUucm90YXRlZChzdWJ0aWxlKSk7XHJcbiAgICAgIHRpbGVNYXAuYWRkVGlsZShzdWJ0aWxlID0gVGlsZS5yb3RhdGVkKHN1YnRpbGUpKTtcclxuICAgICAgdGlsZU1hcC5hZGRUaWxlKHN1YnRpbGUgPSBUaWxlLnJvdGF0ZWQoc3VidGlsZSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGV0IHRpbGVzOiBUaWxlW10gPSBbXTtcclxuICBsZXQgY291bnRzOiBudW1iZXJbXSA9IFtdO1xyXG4gIGZvciAobGV0IHt0aWxlLCBjb3VudH0gb2YgdGlsZU1hcC52YWx1ZXMoKSkge1xyXG4gICAgdGlsZXMucHVzaCh0aWxlKTtcclxuICAgIGNvdW50cy5wdXNoKGNvdW50KTtcclxuICB9XHJcblxyXG4gIGxldCBhZGphY2VuY3lSdWxlcyA9IG5ldyBBZGphY2VuY3lSdWxlcyh0aWxlcyk7XHJcbiAgbGV0IGZyZXF1ZW5jeUhpbnRzID0gbmV3IEZyZXF1ZW5jeUhpbnRzKGNvdW50cyk7XHJcbiAgbGV0IGNvbG9yRm9yVGlsZTogVGlsZUNvbG9yTWFwcGluZyA9IHRpbGVzLm1hcCh0aWxlID0+IHRpbGUudG9wTGVmdFBpeGVsKCkpO1xyXG5cclxuICByZW5kZXJUaWxlc2V0KHRpbGVzKTtcclxuICByZXR1cm4gW2FkamFjZW5jeVJ1bGVzLCBmcmVxdWVuY3lIaW50cywgY29sb3JGb3JUaWxlXTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyVGlsZXNldCh0aWxlczogVGlsZVtdKSB7XHJcbiAgbGV0IGFjcm9zcyA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KHRpbGVzLmxlbmd0aCkpO1xyXG4gIGxldCBkb3duID0gTWF0aC5jZWlsKHRpbGVzLmxlbmd0aCAvIGFjcm9zcyk7XHJcbiAgbGV0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEoKGNvbmZpZy50aWxlU2l6ZSsxKSphY3Jvc3MgLSAxLCAoY29uZmlnLnRpbGVTaXplKzEpKmRvd24gLSAxKSBhcyBNeUltYWdlRGF0YTtcclxuXHJcbiAgZm9yIChsZXQgW2ksIGpdIG9mIHJlY3RSYW5nZShbYWNyb3NzLCBkb3duXSkpIHtcclxuICAgIGxldCB0aWxlID0gaSArIGoqYWNyb3NzO1xyXG4gICAgaWYgKHRpbGUgPj0gdGlsZXMubGVuZ3RoKVxyXG4gICAgICBicmVhaztcclxuICAgIGZvciAobGV0IFt4LCB5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy50aWxlU2l6ZSwgY29uZmlnLnRpbGVTaXplXSkpXHJcbiAgICAgIGltYWdlRGF0YS5zZXQoWyhjb25maWcudGlsZVNpemUrMSkqaSArIHgsIChjb25maWcudGlsZVNpemUrMSkqaiArIHldLCB0aWxlc1t0aWxlXS5nZXRQaXhlbChbeCx5XSkpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyVG9DYW52YXMoXCJ0aWxlc2V0XCIsIGltYWdlRGF0YSk7XHJcbn1cclxuXHJcbi8vIFJlcHJlc2VudHMgdGhlIHN0YXRlIG9mIGEgc2luZ2xlIHBpeGVsIGluIHRoZSBvdXRwdXQsIG1haW5seSB3aGljaCB0aWxlcyBhcmUgcG9zc2libGUgdG8gYmUgcGxhY2VkXHJcbi8vIGluIHRoaXMgY2VsbC4gUG9zc2libGUgdGlsZXMgYXJlIGVsaW1pbmF0ZWQgYXMgdGhlIGFsZ29yaXRobSBwcm9jZWVkcywgdW50aWwgYWxsIGNlbGxzIGFyZSBcImNvbGxhcHNlZFwiXHJcbi8vIChlLmcuIHRoZXkgaGF2ZSBhIHNpbmdsZSBwb3NzaWJsZSB0aWxlKS5cclxuY2xhc3MgQ2VsbCB7XHJcbiAgLy8gQWxsIENlbGxzIHN0YXJ0IHRoZSBzYW1lLCBzbyB3ZSBjbG9uZSB0aGVtIGZyb20gYSB0ZW1wbGF0ZS5cclxuICBzdGF0aWMgY3JlYXRlVGVtcGxhdGUoYWRqYWNlbmN5UnVsZXM6IEFkamFjZW5jeVJ1bGVzLCBmcmVxdWVuY3lIaW50czogRnJlcXVlbmN5SGludHMpOiBDZWxsIHtcclxuICAgIGxldCBjZWxsID0gbmV3IENlbGw7XHJcbiAgICBjZWxsLl9wb3NzaWJsZSA9IG5ldyBBcnJheShmcmVxdWVuY3lIaW50cy5udW1UaWxlcykuZmlsbCh0cnVlKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZnJlcXVlbmN5SGludHMubnVtVGlsZXM7IGkrKykge1xyXG4gICAgICBsZXQgdyA9IGZyZXF1ZW5jeUhpbnRzLndlaWdodEZvclRpbGUoaSk7XHJcbiAgICAgIGNlbGwuX3N1bVdlaWdodCArPSB3O1xyXG4gICAgICBjZWxsLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodCArPSB3ICogTWF0aC5sb2cyKHcpO1xyXG4gICAgfVxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhZGphY2VuY3lSdWxlcy5udW1UaWxlczsgaSsrKSB7XHJcbiAgICAgIGNlbGwuX3RpbGVFbmFibGVyQ291bnRzW2ldID0gWzAsIDAsIDAsIDBdOyAvLyA0IGRpcmVjdGlvbnNcclxuICAgICAgZm9yIChsZXQgZGlyIG9mIERpcmVjdGlvbi5pdGVtcykge1xyXG4gICAgICAgIGZvciAobGV0IGogb2YgYWRqYWNlbmN5UnVsZXMuYWxsb3dlZFRpbGVzKGksIGRpcikpIHtcclxuICAgICAgICAgIGNlbGwuX3RpbGVFbmFibGVyQ291bnRzW2ldW2Rpcl0rKztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBjZWxsO1xyXG4gIH1cclxuICAvLyBSZXR1cm5zIGEgZGVlcCBjb3B5IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICBzdGF0aWMgZnJvbVRlbXBsYXRlKHRlbXBsYXRlOiBDZWxsKTogQ2VsbCB7XHJcbiAgICBsZXQgY2VsbCA9IG5ldyBDZWxsO1xyXG4gICAgY2VsbC5fcG9zc2libGUgPSBBcnJheS5mcm9tKHRlbXBsYXRlLl9wb3NzaWJsZSk7XHJcbiAgICAvLyBjZWxsLl9wb3NzaWJsZSA9IGNlbGwuX3Bvc3NpYmxlLmZpbGwoZmFsc2UpO1xyXG4gICAgLy8gY2VsbC5fcG9zc2libGVbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmNlbGwuX3Bvc3NpYmxlLmxlbmd0aCldID0gdHJ1ZTtcclxuICAgIC8vIGNlbGwuX3Bvc3NpYmxlW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpjZWxsLl9wb3NzaWJsZS5sZW5ndGgpXSA9IHRydWU7XHJcbiAgICBjZWxsLl9zdW1XZWlnaHQgPSB0ZW1wbGF0ZS5fc3VtV2VpZ2h0O1xyXG4gICAgY2VsbC5fc3VtV2VpZ2h0VGltZXNMb2dXZWlnaHQgPSB0ZW1wbGF0ZS5fc3VtV2VpZ2h0VGltZXNMb2dXZWlnaHQ7XHJcbiAgICBjZWxsLl90aWxlRW5hYmxlckNvdW50cyA9IEFycmF5LmZyb20odGVtcGxhdGUuX3RpbGVFbmFibGVyQ291bnRzLCBpbm5lciA9PiBBcnJheS5mcm9tKGlubmVyKSk7XHJcbiAgICByZXR1cm4gY2VsbDtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICAqcG9zc2libGVUaWxlcygpIHtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fcG9zc2libGUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHRoaXMuX3Bvc3NpYmxlW2ldKVxyXG4gICAgICAgIHlpZWxkIGk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjaG9vc2VUaWxlKGZyZXF1ZW5jeUhpbnRzOiBGcmVxdWVuY3lIaW50cyk6IFRpbGVJbmRleCB7XHJcbiAgICAvLyByZXR1cm4gdGhpcy5fY2hvc2VuVGlsZSA9IDEyO1xyXG5cclxuICAgIGxldCBjaG9zZW5XZWlnaHQgPSBNYXRoLnJhbmRvbSgpICogdGhpcy5fc3VtV2VpZ2h0O1xyXG4gICAgZm9yIChsZXQgdGlsZSBvZiB0aGlzLnBvc3NpYmxlVGlsZXMoKSkge1xyXG4gICAgICBjaG9zZW5XZWlnaHQgLT0gZnJlcXVlbmN5SGludHMud2VpZ2h0Rm9yVGlsZSh0aWxlKTtcclxuICAgICAgaWYgKGNob3NlbldlaWdodCA8IDApXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nob3NlblRpbGUgPSB0aWxlO1xyXG4gICAgfVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiY2VsbCB3ZWlnaHRzIHdlcmUgaW52YWxpZFwiKTtcclxuICB9XHJcbiAgcmVtb3ZlVGlsZSh0aWxlOiBUaWxlSW5kZXgsIGZyZXF1ZW5jeUhpbnRzOiBGcmVxdWVuY3lIaW50cyB8IG51bGwgPSBudWxsKTogdm9pZCB7XHJcbiAgICB0aGlzLl9wb3NzaWJsZVt0aWxlXSA9IGZhbHNlO1xyXG4gICAgaWYgKGZyZXF1ZW5jeUhpbnRzKSB7XHJcbiAgICAgIGxldCB3ZWlnaHQgPSBmcmVxdWVuY3lIaW50cy53ZWlnaHRGb3JUaWxlKHRpbGUpO1xyXG4gICAgICB0aGlzLl9zdW1XZWlnaHQgLT0gd2VpZ2h0O1xyXG4gICAgICB0aGlzLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodCAtPSB3ZWlnaHQgKiBNYXRoLmxvZzIod2VpZ2h0KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGdldCBpc0NvbGxhcHNlZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuX2Nob3NlblRpbGUgIT0gLTE7IH1cclxuICBnZXQgbm9Qb3NzaWJsZVRpbGVzKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fc3VtV2VpZ2h0ID09IDA7IH1cclxuICAvLyBlbnRyb3B5ID0gbG9nKFcpIC0gc3VtKHdbbl0qbG9nKHdbbl0pKS9XIHdoZXJlIFcgPSBzdW0od1tuXSlcclxuICBnZXQgZW50cm9weSgpOiBudW1iZXIgeyByZXR1cm4gTWF0aC5sb2cyKHRoaXMuX3N1bVdlaWdodCkgLSB0aGlzLl9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodCAvIHRoaXMuX3N1bVdlaWdodDsgfVxyXG4gIGVuYWJsZXJDb3VudHNGb3JUaWxlKHRpbGU6IFRpbGVJbmRleCk6IG51bWJlcltdIHsgcmV0dXJuIHRoaXMuX3RpbGVFbmFibGVyQ291bnRzW3RpbGVdOyB9XHJcblxyXG4gIC8vIF9wb3NzaWJsZVt0aWxlSW5kZXhdIGlzIHRydWUgaWYgdGlsZUluZGV4IGNhbiBiZSBwbGFjZWQgaW4gdGhpcyBjZWxsLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAgcHJpdmF0ZSBfcG9zc2libGU6IGJvb2xlYW5bXSA9IFtdO1xyXG4gIHByaXZhdGUgX2Nob3NlblRpbGU6IFRpbGVJbmRleCA9IC0xO1xyXG4gIC8vIENhY2hlIG9mIHN1bSh3W25dKSwgdXNlZCBpbiBlbnRyb3B5IGNhbGN1bGF0aW9ucy5cclxuICBwcml2YXRlIF9zdW1XZWlnaHQ6IEZyZXF1ZW5jeVdlaWdodCA9IDA7XHJcbiAgLy8gQ2FjaGUgb2Ygc3VtKHdbbl0qbG9nKHdbbl0pKSwgdXNlZCBpbiBlbnRyb3B5IGNhbGN1bGF0aW9ucy5cclxuICBwcml2YXRlIF9zdW1XZWlnaHRUaW1lc0xvZ1dlaWdodDogbnVtYmVyID0gMDtcclxuICAgLy8gdGlsZUVuYWJsZXJDb3VudHNbdGlsZUluZGV4XVtkaXJdID0gZm9yIGFkamFjZW50Q2VsbCBpbiBkaXJlY3Rpb24gYGRpcmAgZnJvbSB0aGlzIGNlbGwsIHRoaXMgaXMgdGhlIGNvdW50XHJcbiAgIC8vIG9mIHBvc3NpYmxlIHRpbGVzIGluIGFkamFjZW50Q2VsbCB0aGF0IGFyZSBjb21wYXRpYmxlIHdpdGggYHRpbGVJbmRleGAgaW4gdGhpcyBjZWxsLiBVc2VkIGluIHByb3BhZ2F0aW9uLlxyXG4gIHByaXZhdGUgX3RpbGVFbmFibGVyQ291bnRzOiBudW1iZXJbXVtdID0gW107XHJcbn1cclxuXHJcbmNsYXNzIENvcmVTdGF0ZSB7XHJcbiAgY29uc3RydWN0b3IoYSwgZiwgYykge1xyXG4gICAgdGhpcy5fYWRqYWNlbmN5UnVsZXMgPSBhO1xyXG4gICAgdGhpcy5fZnJlcXVlbmN5SGludHMgPSBmO1xyXG4gICAgdGhpcy5fY29sb3JGb3JUaWxlID0gYztcclxuICB9XHJcblxyXG4gIGluaXQoKTogdm9pZCB7XHJcbiAgICB0aGlzLl9lbnRyb3B5SGVhcCA9IG5ldyBIZWFwKChhLCBiKSA9PiBhLmVudHJvcHkgLSBiLmVudHJvcHkpO1xyXG4gICAgbGV0IGNlbGxUZW1wbGF0ZSA9IENlbGwuY3JlYXRlVGVtcGxhdGUodGhpcy5fYWRqYWNlbmN5UnVsZXMsIHRoaXMuX2ZyZXF1ZW5jeUhpbnRzKTtcclxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgY29uZmlnLm91dHB1dEhlaWdodDsgeSsrKSB7XHJcbiAgICAgIHRoaXMuX2dyaWRbeV0gPSBbXTtcclxuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBjb25maWcub3V0cHV0V2lkdGg7IHgrKykge1xyXG4gICAgICAgIHRoaXMuX2dyaWRbeV1beF0gPSBDZWxsLmZyb21UZW1wbGF0ZShjZWxsVGVtcGxhdGUpO1xyXG4gICAgICAgIHRoaXMuX2VudHJvcHlIZWFwLmFkZCh7cG9zOiBbeCwgeV0sIGVudHJvcHk6IHRoaXMuX2dyaWRbeV1beF0uZW50cm9weX0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzdGVwKCk6IGJvb2xlYW4ge1xyXG4gICAgbGV0IHAgPSB0aGlzLl9jaG9vc2VDZWxsKCk7XHJcbiAgICBpZiAoIXApXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIGxldCByZW1vdmFscyA9IHRoaXMuX2NvbGxhcHNlQ2VsbChwKTtcclxuICAgIHJldHVybiB0aGlzLl9wcm9wYWdhdGUocmVtb3ZhbHMpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCk6IHZvaWQge1xyXG4gICAgbGV0IGltYWdlRGF0YSA9IG5ldyBJbWFnZURhdGEoY29uZmlnLm91dHB1dFdpZHRoLCBjb25maWcub3V0cHV0SGVpZ2h0KSBhcyBNeUltYWdlRGF0YTtcclxuXHJcbiAgICBmb3IgKGxldCBbeCx5XSBvZiByZWN0UmFuZ2UoW2NvbmZpZy5vdXRwdXRXaWR0aCwgY29uZmlnLm91dHB1dEhlaWdodF0pKSB7XHJcbiAgICAgIGxldCBjb2xvcjogQ29sb3IgPSAwO1xyXG4gICAgICBsZXQgc3VtV2VpZ2h0ID0gMDtcclxuICAgICAgZm9yIChsZXQgdGlsZSBvZiB0aGlzLl9ncmlkW3ldW3hdLnBvc3NpYmxlVGlsZXMoKSkge1xyXG4gICAgICAgIGxldCB3ID0gdGhpcy5fZnJlcXVlbmN5SGludHMud2VpZ2h0Rm9yVGlsZSh0aWxlKTtcclxuICAgICAgICBjb2xvciArPSB0aGlzLl9jb2xvckZvclRpbGVbdGlsZV0gKiB3O1xyXG4gICAgICAgIHN1bVdlaWdodCArPSB3O1xyXG4gICAgICB9XHJcbiAgICAgIGNvbG9yID0gKGNvbG9yIC8gc3VtV2VpZ2h0KSB8IDB4ZmY7IC8vIGZ1bGwgYWxwaGFcclxuICAgICAgaW1hZ2VEYXRhLnNldChbeCwgeV0sIGNvbG9yKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJUb0NhbnZhcyhcIm91dHB1dFwiLCBpbWFnZURhdGEpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfY2hvb3NlQ2VsbCgpOiBQb2ludCB8IG51bGwge1xyXG4gICAgbGV0IGNlbGw6IEhlYXBDZWxsIHwgdW5kZWZpbmVkO1xyXG4gICAgd2hpbGUgKGNlbGwgPSB0aGlzLl9lbnRyb3B5SGVhcC5wb3AoKSkge1xyXG4gICAgICBsZXQgW3gseV0gPSBjZWxsLnBvcztcclxuICAgICAgaWYgKCF0aGlzLl9ncmlkW3ldW3hdLmlzQ29sbGFwc2VkKVxyXG4gICAgICAgIHJldHVybiBjZWxsLnBvcztcclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfY29sbGFwc2VDZWxsKFt4LCB5XTogUG9pbnQpOiBSZW1vdmVFdmVudFtdIHtcclxuICAgIGxldCBjZWxsID0gdGhpcy5fZ3JpZFt5XVt4XTtcclxuICAgIGxldCBjaG9zZW5UaWxlID0gY2VsbC5jaG9vc2VUaWxlKHRoaXMuX2ZyZXF1ZW5jeUhpbnRzKTtcclxuICAgIGxldCByZW1vdmFsczogUmVtb3ZlRXZlbnRbXSA9IFtdO1xyXG4gICAgZm9yIChsZXQgdGlsZSBvZiBjZWxsLnBvc3NpYmxlVGlsZXMoKSkge1xyXG4gICAgICBpZiAoY2hvc2VuVGlsZSAhPSB0aWxlKSB7XHJcbiAgICAgICAgY2VsbC5yZW1vdmVUaWxlKHRpbGUpO1xyXG4gICAgICAgIHJlbW92YWxzLnB1c2goeyBwb3M6IFt4LCB5XSwgdGlsZTogdGlsZSB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlbW92YWxzO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBfcHJvcGFnYXRlKHJlbW92YWxzOiBSZW1vdmVFdmVudFtdKTogYm9vbGVhbiB7XHJcbiAgICB3aGlsZSAocmVtb3ZhbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBsZXQgeyBwb3M6IFtyeCwgcnldLCB0aWxlOiByZW1vdmVkVGlsZSB9ID0gcmVtb3ZhbHMuc2hpZnQoKSBhcyBSZW1vdmVFdmVudDtcclxuICAgICAgZm9yIChsZXQgZGlyIG9mIERpcmVjdGlvbi5pdGVtcykge1xyXG4gICAgICAgIGxldCBvZmZzZXQgPSBEaXJlY3Rpb24udG9PZmZzZXRbZGlyXTtcclxuICAgICAgICBsZXQgb3Bwb3NpdGVEaXIgPSBEaXJlY3Rpb24udG9PcHBvc2l0ZVtkaXJdO1xyXG4gICAgICAgIGxldCBbYXgsIGF5XSA9IFtyeCArIG9mZnNldFswXSwgcnkgKyBvZmZzZXRbMV1dO1xyXG4gICAgICAgIGlmICghKGF4ID49IDAgJiYgYXkgPj0gMCAmJiBheCA8IGNvbmZpZy5vdXRwdXRXaWR0aCAmJiBheSA8IGNvbmZpZy5vdXRwdXRIZWlnaHQpKVxyXG4gICAgICAgICAgY29udGludWU7ICAvLyBvdXQgb2YgYm91bmRzXHJcbiAgICAgICAgbGV0IGFkamFjZW50Q2VsbCA9IHRoaXMuX2dyaWRbYXldW2F4XTtcclxuICAgICAgICBpZiAoYWRqYWNlbnRDZWxsLmlzQ29sbGFwc2VkKVxyXG4gICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgZm9yIChsZXQgZW5hYmxlZFRpbGUgb2YgdGhpcy5fYWRqYWNlbmN5UnVsZXMuYWxsb3dlZFRpbGVzKHJlbW92ZWRUaWxlLCBkaXIpKSB7XHJcbiAgICAgICAgICAvLyBGb3IgZXZlcnkgdGlsZSB0aGF0IHdhcyBlbmFibGVkIGJ5IHRoZSByZW1vdmVkIHRpbGUsIGRlY3JlbWVudCBpdHMgZW5hYmxlciBjb3VudC5cclxuICAgICAgICAgIC8vIElmIGEgY291bnQgcmVhY2hlcyB6ZXJvLCB0aGF0IHRpbGUgaXMgaW1wb3NzaWJsZSwgc28gcmVtb3ZlIGl0LlxyXG4gICAgICAgICAgbGV0IGVuYWJsZXJDb3VudHMgPSBhZGphY2VudENlbGwuZW5hYmxlckNvdW50c0ZvclRpbGUoZW5hYmxlZFRpbGUpO1xyXG4gICAgICAgICAgbGV0IHdhc1plcm8gPSBlbmFibGVyQ291bnRzLnNvbWUoY291bnQgPT4gY291bnQgPD0gMCk7XHJcbiAgICAgICAgICBsZXQgaXNaZXJvID0gLS1lbmFibGVyQ291bnRzW29wcG9zaXRlRGlyXSA9PSAwO1xyXG5cclxuICAgICAgICAgIC8vIE9ubHkgcmVtb3ZlIHRoZSB0aWxlIGlmIHRoaXMgaXMgdGhlIGZpcnN0IGRpcmVjdGlvbiB0byByZWFjaCAwIGVuYWJsZXJzIChvdGhlcndpc2VcclxuICAgICAgICAgIC8vIHdlJ3ZlIGFscmVhZHkgcmVtb3ZlZCBpdCkuXHJcbiAgICAgICAgICBpZiAoaXNaZXJvICYmICF3YXNaZXJvKSB7XHJcbiAgICAgICAgICAgIGFkamFjZW50Q2VsbC5yZW1vdmVUaWxlKGVuYWJsZWRUaWxlLCB0aGlzLl9mcmVxdWVuY3lIaW50cyk7XHJcbiAgICAgICAgICAgIGlmIChhZGphY2VudENlbGwubm9Qb3NzaWJsZVRpbGVzKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQ29udHJhZGljdGlvbiBhdCBjZWxsICR7YXh9LCR7YXl9LiBSZW1vdmVkICR7ZW5hYmxlZFRpbGV9IGFmdGVyICR7cmVtb3ZlZFRpbGV9IHdhcyByZW1vdmVkIGluIGNlbGwgJHtyeH0sJHtyeX0uYCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlbW92YWxzLnB1c2goe3BvczogW2F4LCBheV0sIHRpbGU6IGVuYWJsZWRUaWxlfSk7XHJcbiAgICAgICAgICAgIHRoaXMuX2VudHJvcHlIZWFwLnB1c2goe3BvczogW2F4LCBheV0sIGVudHJvcHk6IGFkamFjZW50Q2VsbC5lbnRyb3B5fSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgX2dyaWQ6IENlbGxbXVtdID0gW107XHJcbiAgcHJpdmF0ZSBfYWRqYWNlbmN5UnVsZXM6IEFkamFjZW5jeVJ1bGVzO1xyXG4gIHByaXZhdGUgX2ZyZXF1ZW5jeUhpbnRzOiBGcmVxdWVuY3lIaW50cztcclxuICBwcml2YXRlIF9jb2xvckZvclRpbGU6IFRpbGVDb2xvck1hcHBpbmc7XHJcbiAgcHJpdmF0ZSBfZW50cm9weUhlYXA6IEhlYXA8SGVhcENlbGw+O1xyXG59XHJcblxyXG50eXBlIEhlYXBDZWxsID0ge1xyXG4gIHBvczogUG9pbnQ7XHJcbiAgZW50cm9weTogbnVtYmVyO1xyXG59O1xyXG5cclxudHlwZSBSZW1vdmVFdmVudCA9IHtcclxuICBwb3M6IFBvaW50O1xyXG4gIHRpbGU6IFRpbGVJbmRleDtcclxufTsiLCIvKipcbiAqIGRhdC1ndWkgSmF2YVNjcmlwdCBDb250cm9sbGVyIExpYnJhcnlcbiAqIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9kYXQtZ3VpXG4gKlxuICogQ29weXJpZ2h0IDIwMTEgRGF0YSBBcnRzIFRlYW0sIEdvb2dsZSBDcmVhdGl2ZSBMYWJcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuXHQoZmFjdG9yeSgoZ2xvYmFsLmRhdCA9IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBfX18kaW5zZXJ0U3R5bGUoY3NzKSB7XG4gIGlmICghY3NzKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cbiAgc3R5bGUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gIHN0eWxlLmlubmVySFRNTCA9IGNzcztcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cbiAgcmV0dXJuIGNzcztcbn1cblxuZnVuY3Rpb24gY29sb3JUb1N0cmluZyAoY29sb3IsIGZvcmNlQ1NTSGV4KSB7XG4gIHZhciBjb2xvckZvcm1hdCA9IGNvbG9yLl9fc3RhdGUuY29udmVyc2lvbk5hbWUudG9TdHJpbmcoKTtcbiAgdmFyIHIgPSBNYXRoLnJvdW5kKGNvbG9yLnIpO1xuICB2YXIgZyA9IE1hdGgucm91bmQoY29sb3IuZyk7XG4gIHZhciBiID0gTWF0aC5yb3VuZChjb2xvci5iKTtcbiAgdmFyIGEgPSBjb2xvci5hO1xuICB2YXIgaCA9IE1hdGgucm91bmQoY29sb3IuaCk7XG4gIHZhciBzID0gY29sb3Iucy50b0ZpeGVkKDEpO1xuICB2YXIgdiA9IGNvbG9yLnYudG9GaXhlZCgxKTtcbiAgaWYgKGZvcmNlQ1NTSGV4IHx8IGNvbG9yRm9ybWF0ID09PSAnVEhSRUVfQ0hBUl9IRVgnIHx8IGNvbG9yRm9ybWF0ID09PSAnU0lYX0NIQVJfSEVYJykge1xuICAgIHZhciBzdHIgPSBjb2xvci5oZXgudG9TdHJpbmcoMTYpO1xuICAgIHdoaWxlIChzdHIubGVuZ3RoIDwgNikge1xuICAgICAgc3RyID0gJzAnICsgc3RyO1xuICAgIH1cbiAgICByZXR1cm4gJyMnICsgc3RyO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnQ1NTX1JHQicpIHtcbiAgICByZXR1cm4gJ3JnYignICsgciArICcsJyArIGcgKyAnLCcgKyBiICsgJyknO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnQ1NTX1JHQkEnKSB7XG4gICAgcmV0dXJuICdyZ2JhKCcgKyByICsgJywnICsgZyArICcsJyArIGIgKyAnLCcgKyBhICsgJyknO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnSEVYJykge1xuICAgIHJldHVybiAnMHgnICsgY29sb3IuaGV4LnRvU3RyaW5nKDE2KTtcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ1JHQl9BUlJBWScpIHtcbiAgICByZXR1cm4gJ1snICsgciArICcsJyArIGcgKyAnLCcgKyBiICsgJ10nO1xuICB9IGVsc2UgaWYgKGNvbG9yRm9ybWF0ID09PSAnUkdCQV9BUlJBWScpIHtcbiAgICByZXR1cm4gJ1snICsgciArICcsJyArIGcgKyAnLCcgKyBiICsgJywnICsgYSArICddJztcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ1JHQl9PQkonKSB7XG4gICAgcmV0dXJuICd7cjonICsgciArICcsZzonICsgZyArICcsYjonICsgYiArICd9JztcbiAgfSBlbHNlIGlmIChjb2xvckZvcm1hdCA9PT0gJ1JHQkFfT0JKJykge1xuICAgIHJldHVybiAne3I6JyArIHIgKyAnLGc6JyArIGcgKyAnLGI6JyArIGIgKyAnLGE6JyArIGEgKyAnfSc7XG4gIH0gZWxzZSBpZiAoY29sb3JGb3JtYXQgPT09ICdIU1ZfT0JKJykge1xuICAgIHJldHVybiAne2g6JyArIGggKyAnLHM6JyArIHMgKyAnLHY6JyArIHYgKyAnfSc7XG4gIH0gZWxzZSBpZiAoY29sb3JGb3JtYXQgPT09ICdIU1ZBX09CSicpIHtcbiAgICByZXR1cm4gJ3toOicgKyBoICsgJyxzOicgKyBzICsgJyx2OicgKyB2ICsgJyxhOicgKyBhICsgJ30nO1xuICB9XG4gIHJldHVybiAndW5rbm93biBmb3JtYXQnO1xufVxuXG52YXIgQVJSX0VBQ0ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcbnZhciBBUlJfU0xJQ0UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgQ29tbW9uID0ge1xuICBCUkVBSzoge30sXG4gIGV4dGVuZDogZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgIHRoaXMuZWFjaChBUlJfU0xJQ0UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbiAob2JqKSB7XG4gICAgICB2YXIga2V5cyA9IHRoaXMuaXNPYmplY3Qob2JqKSA/IE9iamVjdC5rZXlzKG9iaikgOiBbXTtcbiAgICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1VuZGVmaW5lZChvYmpba2V5XSkpIHtcbiAgICAgICAgICB0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH0sXG4gIGRlZmF1bHRzOiBmdW5jdGlvbiBkZWZhdWx0cyh0YXJnZXQpIHtcbiAgICB0aGlzLmVhY2goQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24gKG9iaikge1xuICAgICAgdmFyIGtleXMgPSB0aGlzLmlzT2JqZWN0KG9iaikgPyBPYmplY3Qua2V5cyhvYmopIDogW107XG4gICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBpZiAodGhpcy5pc1VuZGVmaW5lZCh0YXJnZXRba2V5XSkpIHtcbiAgICAgICAgICB0YXJnZXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybiB0YXJnZXQ7XG4gIH0sXG4gIGNvbXBvc2U6IGZ1bmN0aW9uIGNvbXBvc2UoKSB7XG4gICAgdmFyIHRvQ2FsbCA9IEFSUl9TTElDRS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBhcmdzID0gQVJSX1NMSUNFLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIGZvciAodmFyIGkgPSB0b0NhbGwubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFt0b0NhbGxbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfSxcbiAgZWFjaDogZnVuY3Rpb24gZWFjaChvYmosIGl0ciwgc2NvcGUpIHtcbiAgICBpZiAoIW9iaikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoQVJSX0VBQ0ggJiYgb2JqLmZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IEFSUl9FQUNIKSB7XG4gICAgICBvYmouZm9yRWFjaChpdHIsIHNjb3BlKTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09IG9iai5sZW5ndGggKyAwKSB7XG4gICAgICB2YXIga2V5ID0gdm9pZCAwO1xuICAgICAgdmFyIGwgPSB2b2lkIDA7XG4gICAgICBmb3IgKGtleSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBrZXkgPCBsOyBrZXkrKykge1xuICAgICAgICBpZiAoa2V5IGluIG9iaiAmJiBpdHIuY2FsbChzY29wZSwgb2JqW2tleV0sIGtleSkgPT09IHRoaXMuQlJFQUspIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgX2tleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKGl0ci5jYWxsKHNjb3BlLCBvYmpbX2tleV0sIF9rZXkpID09PSB0aGlzLkJSRUFLKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBkZWZlcjogZnVuY3Rpb24gZGVmZXIoZm5jKSB7XG4gICAgc2V0VGltZW91dChmbmMsIDApO1xuICB9LFxuICBkZWJvdW5jZTogZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgdGhyZXNob2xkLCBjYWxsSW1tZWRpYXRlbHkpIHtcbiAgICB2YXIgdGltZW91dCA9IHZvaWQgMDtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZ1bmN0aW9uIGRlbGF5ZWQoKSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWNhbGxJbW1lZGlhdGVseSkgZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgfVxuICAgICAgdmFyIGNhbGxOb3cgPSBjYWxsSW1tZWRpYXRlbHkgfHwgIXRpbWVvdXQ7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChkZWxheWVkLCB0aHJlc2hvbGQpO1xuICAgICAgaWYgKGNhbGxOb3cpIHtcbiAgICAgICAgZnVuYy5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgfVxuICAgIH07XG4gIH0sXG4gIHRvQXJyYXk6IGZ1bmN0aW9uIHRvQXJyYXkob2JqKSB7XG4gICAgaWYgKG9iai50b0FycmF5KSByZXR1cm4gb2JqLnRvQXJyYXkoKTtcbiAgICByZXR1cm4gQVJSX1NMSUNFLmNhbGwob2JqKTtcbiAgfSxcbiAgaXNVbmRlZmluZWQ6IGZ1bmN0aW9uIGlzVW5kZWZpbmVkKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHVuZGVmaW5lZDtcbiAgfSxcbiAgaXNOdWxsOiBmdW5jdGlvbiBpc051bGwob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfSxcbiAgaXNOYU46IGZ1bmN0aW9uIChfaXNOYU4pIHtcbiAgICBmdW5jdGlvbiBpc05hTihfeCkge1xuICAgICAgcmV0dXJuIF9pc05hTi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBpc05hTi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBfaXNOYU4udG9TdHJpbmcoKTtcbiAgICB9O1xuICAgIHJldHVybiBpc05hTjtcbiAgfShmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIGlzTmFOKG9iaik7XG4gIH0pLFxuICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gb2JqLmNvbnN0cnVjdG9yID09PSBBcnJheTtcbiAgfSxcbiAgaXNPYmplY3Q6IGZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9LFxuICBpc051bWJlcjogZnVuY3Rpb24gaXNOdW1iZXIob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gb2JqICsgMDtcbiAgfSxcbiAgaXNTdHJpbmc6IGZ1bmN0aW9uIGlzU3RyaW5nKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG9iaiArICcnO1xuICB9LFxuICBpc0Jvb2xlYW46IGZ1bmN0aW9uIGlzQm9vbGVhbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBmYWxzZSB8fCBvYmogPT09IHRydWU7XG4gIH0sXG4gIGlzRnVuY3Rpb246IGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIEZ1bmN0aW9uO1xuICB9XG59O1xuXG52YXIgSU5URVJQUkVUQVRJT05TID0gW1xue1xuICBsaXRtdXM6IENvbW1vbi5pc1N0cmluZyxcbiAgY29udmVyc2lvbnM6IHtcbiAgICBUSFJFRV9DSEFSX0hFWDoge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9eIyhbQS1GMC05XSkoW0EtRjAtOV0pKFtBLUYwLTldKSQvaSk7XG4gICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgIGhleDogcGFyc2VJbnQoJzB4JyArIHRlc3RbMV0udG9TdHJpbmcoKSArIHRlc3RbMV0udG9TdHJpbmcoKSArIHRlc3RbMl0udG9TdHJpbmcoKSArIHRlc3RbMl0udG9TdHJpbmcoKSArIHRlc3RbM10udG9TdHJpbmcoKSArIHRlc3RbM10udG9TdHJpbmcoKSwgMClcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogY29sb3JUb1N0cmluZ1xuICAgIH0sXG4gICAgU0lYX0NIQVJfSEVYOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIHZhciB0ZXN0ID0gb3JpZ2luYWwubWF0Y2goL14jKFtBLUYwLTldezZ9KSQvaSk7XG4gICAgICAgIGlmICh0ZXN0ID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3BhY2U6ICdIRVgnLFxuICAgICAgICAgIGhleDogcGFyc2VJbnQoJzB4JyArIHRlc3RbMV0udG9TdHJpbmcoKSwgMClcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogY29sb3JUb1N0cmluZ1xuICAgIH0sXG4gICAgQ1NTX1JHQjoge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICB2YXIgdGVzdCA9IG9yaWdpbmFsLm1hdGNoKC9ecmdiXFwoXFxzKiguKylcXHMqLFxccyooLispXFxzKixcXHMqKC4rKVxccypcXCkvKTtcbiAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgcjogcGFyc2VGbG9hdCh0ZXN0WzFdKSxcbiAgICAgICAgICBnOiBwYXJzZUZsb2F0KHRlc3RbMl0pLFxuICAgICAgICAgIGI6IHBhcnNlRmxvYXQodGVzdFszXSlcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogY29sb3JUb1N0cmluZ1xuICAgIH0sXG4gICAgQ1NTX1JHQkE6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgdmFyIHRlc3QgPSBvcmlnaW5hbC5tYXRjaCgvXnJnYmFcXChcXHMqKC4rKVxccyosXFxzKiguKylcXHMqLFxccyooLispXFxzKixcXHMqKC4rKVxccypcXCkvKTtcbiAgICAgICAgaWYgKHRlc3QgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgcjogcGFyc2VGbG9hdCh0ZXN0WzFdKSxcbiAgICAgICAgICBnOiBwYXJzZUZsb2F0KHRlc3RbMl0pLFxuICAgICAgICAgIGI6IHBhcnNlRmxvYXQodGVzdFszXSksXG4gICAgICAgICAgYTogcGFyc2VGbG9hdCh0ZXN0WzRdKVxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBjb2xvclRvU3RyaW5nXG4gICAgfVxuICB9XG59LFxue1xuICBsaXRtdXM6IENvbW1vbi5pc051bWJlcixcbiAgY29udmVyc2lvbnM6IHtcbiAgICBIRVg6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGFjZTogJ0hFWCcsXG4gICAgICAgICAgaGV4OiBvcmlnaW5hbCxcbiAgICAgICAgICBjb252ZXJzaW9uTmFtZTogJ0hFWCdcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIGNvbG9yLmhleDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0sXG57XG4gIGxpdG11czogQ29tbW9uLmlzQXJyYXksXG4gIGNvbnZlcnNpb25zOiB7XG4gICAgUkdCX0FSUkFZOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIGlmIChvcmlnaW5hbC5sZW5ndGggIT09IDMpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgcjogb3JpZ2luYWxbMF0sXG4gICAgICAgICAgZzogb3JpZ2luYWxbMV0sXG4gICAgICAgICAgYjogb3JpZ2luYWxbMl1cbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICB3cml0ZTogZnVuY3Rpb24gd3JpdGUoY29sb3IpIHtcbiAgICAgICAgcmV0dXJuIFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFJHQkFfQVJSQVk6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgaWYgKG9yaWdpbmFsLmxlbmd0aCAhPT0gNCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNwYWNlOiAnUkdCJyxcbiAgICAgICAgICByOiBvcmlnaW5hbFswXSxcbiAgICAgICAgICBnOiBvcmlnaW5hbFsxXSxcbiAgICAgICAgICBiOiBvcmlnaW5hbFsyXSxcbiAgICAgICAgICBhOiBvcmlnaW5hbFszXVxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBmdW5jdGlvbiB3cml0ZShjb2xvcikge1xuICAgICAgICByZXR1cm4gW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIsIGNvbG9yLmFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSxcbntcbiAgbGl0bXVzOiBDb21tb24uaXNPYmplY3QsXG4gIGNvbnZlcnNpb25zOiB7XG4gICAgUkdCQV9PQko6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgaWYgKENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5yKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuZykgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLmIpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5hKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzcGFjZTogJ1JHQicsXG4gICAgICAgICAgICByOiBvcmlnaW5hbC5yLFxuICAgICAgICAgICAgZzogb3JpZ2luYWwuZyxcbiAgICAgICAgICAgIGI6IG9yaWdpbmFsLmIsXG4gICAgICAgICAgICBhOiBvcmlnaW5hbC5hXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcjogY29sb3IucixcbiAgICAgICAgICBnOiBjb2xvci5nLFxuICAgICAgICAgIGI6IGNvbG9yLmIsXG4gICAgICAgICAgYTogY29sb3IuYVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0sXG4gICAgUkdCX09CSjoge1xuICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChvcmlnaW5hbCkge1xuICAgICAgICBpZiAoQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnIpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5nKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuYikpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3BhY2U6ICdSR0InLFxuICAgICAgICAgICAgcjogb3JpZ2luYWwucixcbiAgICAgICAgICAgIGc6IG9yaWdpbmFsLmcsXG4gICAgICAgICAgICBiOiBvcmlnaW5hbC5iXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9LFxuICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKGNvbG9yKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcjogY29sb3IucixcbiAgICAgICAgICBnOiBjb2xvci5nLFxuICAgICAgICAgIGI6IGNvbG9yLmJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIEhTVkFfT0JKOiB7XG4gICAgICByZWFkOiBmdW5jdGlvbiByZWFkKG9yaWdpbmFsKSB7XG4gICAgICAgIGlmIChDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuaCkgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnMpICYmIENvbW1vbi5pc051bWJlcihvcmlnaW5hbC52KSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwuYSkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3BhY2U6ICdIU1YnLFxuICAgICAgICAgICAgaDogb3JpZ2luYWwuaCxcbiAgICAgICAgICAgIHM6IG9yaWdpbmFsLnMsXG4gICAgICAgICAgICB2OiBvcmlnaW5hbC52LFxuICAgICAgICAgICAgYTogb3JpZ2luYWwuYVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBmdW5jdGlvbiB3cml0ZShjb2xvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGg6IGNvbG9yLmgsXG4gICAgICAgICAgczogY29sb3IucyxcbiAgICAgICAgICB2OiBjb2xvci52LFxuICAgICAgICAgIGE6IGNvbG9yLmFcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9LFxuICAgIEhTVl9PQko6IHtcbiAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQob3JpZ2luYWwpIHtcbiAgICAgICAgaWYgKENvbW1vbi5pc051bWJlcihvcmlnaW5hbC5oKSAmJiBDb21tb24uaXNOdW1iZXIob3JpZ2luYWwucykgJiYgQ29tbW9uLmlzTnVtYmVyKG9yaWdpbmFsLnYpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNwYWNlOiAnSFNWJyxcbiAgICAgICAgICAgIGg6IG9yaWdpbmFsLmgsXG4gICAgICAgICAgICBzOiBvcmlnaW5hbC5zLFxuICAgICAgICAgICAgdjogb3JpZ2luYWwudlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSxcbiAgICAgIHdyaXRlOiBmdW5jdGlvbiB3cml0ZShjb2xvcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGg6IGNvbG9yLmgsXG4gICAgICAgICAgczogY29sb3IucyxcbiAgICAgICAgICB2OiBjb2xvci52XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG59XTtcbnZhciByZXN1bHQgPSB2b2lkIDA7XG52YXIgdG9SZXR1cm4gPSB2b2lkIDA7XG52YXIgaW50ZXJwcmV0ID0gZnVuY3Rpb24gaW50ZXJwcmV0KCkge1xuICB0b1JldHVybiA9IGZhbHNlO1xuICB2YXIgb3JpZ2luYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IENvbW1vbi50b0FycmF5KGFyZ3VtZW50cykgOiBhcmd1bWVudHNbMF07XG4gIENvbW1vbi5lYWNoKElOVEVSUFJFVEFUSU9OUywgZnVuY3Rpb24gKGZhbWlseSkge1xuICAgIGlmIChmYW1pbHkubGl0bXVzKG9yaWdpbmFsKSkge1xuICAgICAgQ29tbW9uLmVhY2goZmFtaWx5LmNvbnZlcnNpb25zLCBmdW5jdGlvbiAoY29udmVyc2lvbiwgY29udmVyc2lvbk5hbWUpIHtcbiAgICAgICAgcmVzdWx0ID0gY29udmVyc2lvbi5yZWFkKG9yaWdpbmFsKTtcbiAgICAgICAgaWYgKHRvUmV0dXJuID09PSBmYWxzZSAmJiByZXN1bHQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgdG9SZXR1cm4gPSByZXN1bHQ7XG4gICAgICAgICAgcmVzdWx0LmNvbnZlcnNpb25OYW1lID0gY29udmVyc2lvbk5hbWU7XG4gICAgICAgICAgcmVzdWx0LmNvbnZlcnNpb24gPSBjb252ZXJzaW9uO1xuICAgICAgICAgIHJldHVybiBDb21tb24uQlJFQUs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIENvbW1vbi5CUkVBSztcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gdG9SZXR1cm47XG59O1xuXG52YXIgdG1wQ29tcG9uZW50ID0gdm9pZCAwO1xudmFyIENvbG9yTWF0aCA9IHtcbiAgaHN2X3RvX3JnYjogZnVuY3Rpb24gaHN2X3RvX3JnYihoLCBzLCB2KSB7XG4gICAgdmFyIGhpID0gTWF0aC5mbG9vcihoIC8gNjApICUgNjtcbiAgICB2YXIgZiA9IGggLyA2MCAtIE1hdGguZmxvb3IoaCAvIDYwKTtcbiAgICB2YXIgcCA9IHYgKiAoMS4wIC0gcyk7XG4gICAgdmFyIHEgPSB2ICogKDEuMCAtIGYgKiBzKTtcbiAgICB2YXIgdCA9IHYgKiAoMS4wIC0gKDEuMCAtIGYpICogcyk7XG4gICAgdmFyIGMgPSBbW3YsIHQsIHBdLCBbcSwgdiwgcF0sIFtwLCB2LCB0XSwgW3AsIHEsIHZdLCBbdCwgcCwgdl0sIFt2LCBwLCBxXV1baGldO1xuICAgIHJldHVybiB7XG4gICAgICByOiBjWzBdICogMjU1LFxuICAgICAgZzogY1sxXSAqIDI1NSxcbiAgICAgIGI6IGNbMl0gKiAyNTVcbiAgICB9O1xuICB9LFxuICByZ2JfdG9faHN2OiBmdW5jdGlvbiByZ2JfdG9faHN2KHIsIGcsIGIpIHtcbiAgICB2YXIgbWluID0gTWF0aC5taW4ociwgZywgYik7XG4gICAgdmFyIG1heCA9IE1hdGgubWF4KHIsIGcsIGIpO1xuICAgIHZhciBkZWx0YSA9IG1heCAtIG1pbjtcbiAgICB2YXIgaCA9IHZvaWQgMDtcbiAgICB2YXIgcyA9IHZvaWQgMDtcbiAgICBpZiAobWF4ICE9PSAwKSB7XG4gICAgICBzID0gZGVsdGEgLyBtYXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGg6IE5hTixcbiAgICAgICAgczogMCxcbiAgICAgICAgdjogMFxuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHIgPT09IG1heCkge1xuICAgICAgaCA9IChnIC0gYikgLyBkZWx0YTtcbiAgICB9IGVsc2UgaWYgKGcgPT09IG1heCkge1xuICAgICAgaCA9IDIgKyAoYiAtIHIpIC8gZGVsdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGggPSA0ICsgKHIgLSBnKSAvIGRlbHRhO1xuICAgIH1cbiAgICBoIC89IDY7XG4gICAgaWYgKGggPCAwKSB7XG4gICAgICBoICs9IDE7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBoOiBoICogMzYwLFxuICAgICAgczogcyxcbiAgICAgIHY6IG1heCAvIDI1NVxuICAgIH07XG4gIH0sXG4gIHJnYl90b19oZXg6IGZ1bmN0aW9uIHJnYl90b19oZXgociwgZywgYikge1xuICAgIHZhciBoZXggPSB0aGlzLmhleF93aXRoX2NvbXBvbmVudCgwLCAyLCByKTtcbiAgICBoZXggPSB0aGlzLmhleF93aXRoX2NvbXBvbmVudChoZXgsIDEsIGcpO1xuICAgIGhleCA9IHRoaXMuaGV4X3dpdGhfY29tcG9uZW50KGhleCwgMCwgYik7XG4gICAgcmV0dXJuIGhleDtcbiAgfSxcbiAgY29tcG9uZW50X2Zyb21faGV4OiBmdW5jdGlvbiBjb21wb25lbnRfZnJvbV9oZXgoaGV4LCBjb21wb25lbnRJbmRleCkge1xuICAgIHJldHVybiBoZXggPj4gY29tcG9uZW50SW5kZXggKiA4ICYgMHhGRjtcbiAgfSxcbiAgaGV4X3dpdGhfY29tcG9uZW50OiBmdW5jdGlvbiBoZXhfd2l0aF9jb21wb25lbnQoaGV4LCBjb21wb25lbnRJbmRleCwgdmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPDwgKHRtcENvbXBvbmVudCA9IGNvbXBvbmVudEluZGV4ICogOCkgfCBoZXggJiB+KDB4RkYgPDwgdG1wQ29tcG9uZW50KTtcbiAgfVxufTtcblxudmFyIF90eXBlb2YgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmo7XG59IDogZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajtcbn07XG5cblxuXG5cblxuXG5cblxuXG5cblxudmFyIGNsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gIH1cbn07XG5cbnZhciBjcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfTtcbn0oKTtcblxuXG5cblxuXG5cblxudmFyIGdldCA9IGZ1bmN0aW9uIGdldChvYmplY3QsIHByb3BlcnR5LCByZWNlaXZlcikge1xuICBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7XG4gIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTtcblxuICBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpO1xuXG4gICAgaWYgKHBhcmVudCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGdldChwYXJlbnQsIHByb3BlcnR5LCByZWNlaXZlcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKFwidmFsdWVcIiBpbiBkZXNjKSB7XG4gICAgcmV0dXJuIGRlc2MudmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGdldHRlciA9IGRlc2MuZ2V0O1xuXG4gICAgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7XG4gIH1cbn07XG5cbnZhciBpbmhlcml0cyA9IGZ1bmN0aW9uIChzdWJDbGFzcywgc3VwZXJDbGFzcykge1xuICBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09IFwiZnVuY3Rpb25cIiAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgXCIgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7XG4gIH1cblxuICBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IHN1YkNsYXNzLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG4gIGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzcztcbn07XG5cblxuXG5cblxuXG5cblxuXG5cblxudmFyIHBvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4gPSBmdW5jdGlvbiAoc2VsZiwgY2FsbCkge1xuICBpZiAoIXNlbGYpIHtcbiAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXCJ0aGlzIGhhc24ndCBiZWVuIGluaXRpYWxpc2VkIC0gc3VwZXIoKSBoYXNuJ3QgYmVlbiBjYWxsZWRcIik7XG4gIH1cblxuICByZXR1cm4gY2FsbCAmJiAodHlwZW9mIGNhbGwgPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGNhbGwgPT09IFwiZnVuY3Rpb25cIikgPyBjYWxsIDogc2VsZjtcbn07XG5cbnZhciBDb2xvciA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gQ29sb3IoKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgQ29sb3IpO1xuICAgIHRoaXMuX19zdGF0ZSA9IGludGVycHJldC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh0aGlzLl9fc3RhdGUgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBpbnRlcnByZXQgY29sb3IgYXJndW1lbnRzJyk7XG4gICAgfVxuICAgIHRoaXMuX19zdGF0ZS5hID0gdGhpcy5fX3N0YXRlLmEgfHwgMTtcbiAgfVxuICBjcmVhdGVDbGFzcyhDb2xvciwgW3tcbiAgICBrZXk6ICd0b1N0cmluZycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgcmV0dXJuIGNvbG9yVG9TdHJpbmcodGhpcyk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndG9IZXhTdHJpbmcnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b0hleFN0cmluZygpIHtcbiAgICAgIHJldHVybiBjb2xvclRvU3RyaW5nKHRoaXMsIHRydWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RvT3JpZ2luYWwnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0b09yaWdpbmFsKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZS5jb252ZXJzaW9uLndyaXRlKHRoaXMpO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQ29sb3I7XG59KCk7XG5mdW5jdGlvbiBkZWZpbmVSR0JDb21wb25lbnQodGFyZ2V0LCBjb21wb25lbnQsIGNvbXBvbmVudEhleEluZGV4KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGNvbXBvbmVudCwge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSA9PT0gJ1JHQicpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdO1xuICAgICAgfVxuICAgICAgQ29sb3IucmVjYWxjdWxhdGVSR0IodGhpcywgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCk7XG4gICAgICByZXR1cm4gdGhpcy5fX3N0YXRlW2NvbXBvbmVudF07XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldCQkMSh2KSB7XG4gICAgICBpZiAodGhpcy5fX3N0YXRlLnNwYWNlICE9PSAnUkdCJykge1xuICAgICAgICBDb2xvci5yZWNhbGN1bGF0ZVJHQih0aGlzLCBjb21wb25lbnQsIGNvbXBvbmVudEhleEluZGV4KTtcbiAgICAgICAgdGhpcy5fX3N0YXRlLnNwYWNlID0gJ1JHQic7XG4gICAgICB9XG4gICAgICB0aGlzLl9fc3RhdGVbY29tcG9uZW50XSA9IHY7XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIGRlZmluZUhTVkNvbXBvbmVudCh0YXJnZXQsIGNvbXBvbmVudCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb21wb25lbnQsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgIGlmICh0aGlzLl9fc3RhdGUuc3BhY2UgPT09ICdIU1YnKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGVbY29tcG9uZW50XTtcbiAgICAgIH1cbiAgICAgIENvbG9yLnJlY2FsY3VsYXRlSFNWKHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXMuX19zdGF0ZVtjb21wb25lbnRdO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ0hTVicpIHtcbiAgICAgICAgQ29sb3IucmVjYWxjdWxhdGVIU1YodGhpcyk7XG4gICAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIU1YnO1xuICAgICAgfVxuICAgICAgdGhpcy5fX3N0YXRlW2NvbXBvbmVudF0gPSB2O1xuICAgIH1cbiAgfSk7XG59XG5Db2xvci5yZWNhbGN1bGF0ZVJHQiA9IGZ1bmN0aW9uIChjb2xvciwgY29tcG9uZW50LCBjb21wb25lbnRIZXhJbmRleCkge1xuICBpZiAoY29sb3IuX19zdGF0ZS5zcGFjZSA9PT0gJ0hFWCcpIHtcbiAgICBjb2xvci5fX3N0YXRlW2NvbXBvbmVudF0gPSBDb2xvck1hdGguY29tcG9uZW50X2Zyb21faGV4KGNvbG9yLl9fc3RhdGUuaGV4LCBjb21wb25lbnRIZXhJbmRleCk7XG4gIH0gZWxzZSBpZiAoY29sb3IuX19zdGF0ZS5zcGFjZSA9PT0gJ0hTVicpIHtcbiAgICBDb21tb24uZXh0ZW5kKGNvbG9yLl9fc3RhdGUsIENvbG9yTWF0aC5oc3ZfdG9fcmdiKGNvbG9yLl9fc3RhdGUuaCwgY29sb3IuX19zdGF0ZS5zLCBjb2xvci5fX3N0YXRlLnYpKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvcnJ1cHRlZCBjb2xvciBzdGF0ZScpO1xuICB9XG59O1xuQ29sb3IucmVjYWxjdWxhdGVIU1YgPSBmdW5jdGlvbiAoY29sb3IpIHtcbiAgdmFyIHJlc3VsdCA9IENvbG9yTWF0aC5yZ2JfdG9faHN2KGNvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmIpO1xuICBDb21tb24uZXh0ZW5kKGNvbG9yLl9fc3RhdGUsIHtcbiAgICBzOiByZXN1bHQucyxcbiAgICB2OiByZXN1bHQudlxuICB9KTtcbiAgaWYgKCFDb21tb24uaXNOYU4ocmVzdWx0LmgpKSB7XG4gICAgY29sb3IuX19zdGF0ZS5oID0gcmVzdWx0Lmg7XG4gIH0gZWxzZSBpZiAoQ29tbW9uLmlzVW5kZWZpbmVkKGNvbG9yLl9fc3RhdGUuaCkpIHtcbiAgICBjb2xvci5fX3N0YXRlLmggPSAwO1xuICB9XG59O1xuQ29sb3IuQ09NUE9ORU5UUyA9IFsncicsICdnJywgJ2InLCAnaCcsICdzJywgJ3YnLCAnaGV4JywgJ2EnXTtcbmRlZmluZVJHQkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdyJywgMik7XG5kZWZpbmVSR0JDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAnZycsIDEpO1xuZGVmaW5lUkdCQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ2InLCAwKTtcbmRlZmluZUhTVkNvbXBvbmVudChDb2xvci5wcm90b3R5cGUsICdoJyk7XG5kZWZpbmVIU1ZDb21wb25lbnQoQ29sb3IucHJvdG90eXBlLCAncycpO1xuZGVmaW5lSFNWQ29tcG9uZW50KENvbG9yLnByb3RvdHlwZSwgJ3YnKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb2xvci5wcm90b3R5cGUsICdhJywge1xuICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3N0YXRlLmE7XG4gIH0sXG4gIHNldDogZnVuY3Rpb24gc2V0JCQxKHYpIHtcbiAgICB0aGlzLl9fc3RhdGUuYSA9IHY7XG4gIH1cbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbG9yLnByb3RvdHlwZSwgJ2hleCcsIHtcbiAgZ2V0OiBmdW5jdGlvbiBnZXQkJDEoKSB7XG4gICAgaWYgKHRoaXMuX19zdGF0ZS5zcGFjZSAhPT0gJ0hFWCcpIHtcbiAgICAgIHRoaXMuX19zdGF0ZS5oZXggPSBDb2xvck1hdGgucmdiX3RvX2hleCh0aGlzLnIsIHRoaXMuZywgdGhpcy5iKTtcbiAgICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIRVgnO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3N0YXRlLmhleDtcbiAgfSxcbiAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgIHRoaXMuX19zdGF0ZS5zcGFjZSA9ICdIRVgnO1xuICAgIHRoaXMuX19zdGF0ZS5oZXggPSB2O1xuICB9XG59KTtcblxudmFyIENvbnRyb2xsZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIENvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIENvbnRyb2xsZXIpO1xuICAgIHRoaXMuaW5pdGlhbFZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICB0aGlzLmRvbUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICB0aGlzLnByb3BlcnR5ID0gcHJvcGVydHk7XG4gICAgdGhpcy5fX29uQ2hhbmdlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZSA9IHVuZGVmaW5lZDtcbiAgfVxuICBjcmVhdGVDbGFzcyhDb250cm9sbGVyLCBbe1xuICAgIGtleTogJ29uQ2hhbmdlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25DaGFuZ2UoZm5jKSB7XG4gICAgICB0aGlzLl9fb25DaGFuZ2UgPSBmbmM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvbkZpbmlzaENoYW5nZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uRmluaXNoQ2hhbmdlKGZuYykge1xuICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlID0gZm5jO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnc2V0VmFsdWUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWYWx1ZShuZXdWYWx1ZSkge1xuICAgICAgdGhpcy5vYmplY3RbdGhpcy5wcm9wZXJ0eV0gPSBuZXdWYWx1ZTtcbiAgICAgIGlmICh0aGlzLl9fb25DaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uQ2hhbmdlLmNhbGwodGhpcywgbmV3VmFsdWUpO1xuICAgICAgfVxuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5KCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRWYWx1ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldFZhbHVlKCkge1xuICAgICAgcmV0dXJuIHRoaXMub2JqZWN0W3RoaXMucHJvcGVydHldO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3VwZGF0ZURpc3BsYXknLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5KCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnaXNNb2RpZmllZCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGlzTW9kaWZpZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbml0aWFsVmFsdWUgIT09IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIENvbnRyb2xsZXI7XG59KCk7XG5cbnZhciBFVkVOVF9NQVAgPSB7XG4gIEhUTUxFdmVudHM6IFsnY2hhbmdlJ10sXG4gIE1vdXNlRXZlbnRzOiBbJ2NsaWNrJywgJ21vdXNlbW92ZScsICdtb3VzZWRvd24nLCAnbW91c2V1cCcsICdtb3VzZW92ZXInXSxcbiAgS2V5Ym9hcmRFdmVudHM6IFsna2V5ZG93biddXG59O1xudmFyIEVWRU5UX01BUF9JTlYgPSB7fTtcbkNvbW1vbi5lYWNoKEVWRU5UX01BUCwgZnVuY3Rpb24gKHYsIGspIHtcbiAgQ29tbW9uLmVhY2godiwgZnVuY3Rpb24gKGUpIHtcbiAgICBFVkVOVF9NQVBfSU5WW2VdID0gaztcbiAgfSk7XG59KTtcbnZhciBDU1NfVkFMVUVfUElYRUxTID0gLyhcXGQrKFxcLlxcZCspPylweC87XG5mdW5jdGlvbiBjc3NWYWx1ZVRvUGl4ZWxzKHZhbCkge1xuICBpZiAodmFsID09PSAnMCcgfHwgQ29tbW9uLmlzVW5kZWZpbmVkKHZhbCkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICB2YXIgbWF0Y2ggPSB2YWwubWF0Y2goQ1NTX1ZBTFVFX1BJWEVMUyk7XG4gIGlmICghQ29tbW9uLmlzTnVsbChtYXRjaCkpIHtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG52YXIgZG9tID0ge1xuICBtYWtlU2VsZWN0YWJsZTogZnVuY3Rpb24gbWFrZVNlbGVjdGFibGUoZWxlbSwgc2VsZWN0YWJsZSkge1xuICAgIGlmIChlbGVtID09PSB1bmRlZmluZWQgfHwgZWxlbS5zdHlsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgZWxlbS5vbnNlbGVjdHN0YXJ0ID0gc2VsZWN0YWJsZSA/IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IDogZnVuY3Rpb24gKCkge307XG4gICAgZWxlbS5zdHlsZS5Nb3pVc2VyU2VsZWN0ID0gc2VsZWN0YWJsZSA/ICdhdXRvJyA6ICdub25lJztcbiAgICBlbGVtLnN0eWxlLktodG1sVXNlclNlbGVjdCA9IHNlbGVjdGFibGUgPyAnYXV0bycgOiAnbm9uZSc7XG4gICAgZWxlbS51bnNlbGVjdGFibGUgPSBzZWxlY3RhYmxlID8gJ29uJyA6ICdvZmYnO1xuICB9LFxuICBtYWtlRnVsbHNjcmVlbjogZnVuY3Rpb24gbWFrZUZ1bGxzY3JlZW4oZWxlbSwgaG9yLCB2ZXJ0KSB7XG4gICAgdmFyIHZlcnRpY2FsID0gdmVydDtcbiAgICB2YXIgaG9yaXpvbnRhbCA9IGhvcjtcbiAgICBpZiAoQ29tbW9uLmlzVW5kZWZpbmVkKGhvcml6b250YWwpKSB7XG4gICAgICBob3Jpem9udGFsID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZCh2ZXJ0aWNhbCkpIHtcbiAgICAgIHZlcnRpY2FsID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxlbS5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIGVsZW0uc3R5bGUubGVmdCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLnJpZ2h0ID0gMDtcbiAgICB9XG4gICAgaWYgKHZlcnRpY2FsKSB7XG4gICAgICBlbGVtLnN0eWxlLnRvcCA9IDA7XG4gICAgICBlbGVtLnN0eWxlLmJvdHRvbSA9IDA7XG4gICAgfVxuICB9LFxuICBmYWtlRXZlbnQ6IGZ1bmN0aW9uIGZha2VFdmVudChlbGVtLCBldmVudFR5cGUsIHBhcnMsIGF1eCkge1xuICAgIHZhciBwYXJhbXMgPSBwYXJzIHx8IHt9O1xuICAgIHZhciBjbGFzc05hbWUgPSBFVkVOVF9NQVBfSU5WW2V2ZW50VHlwZV07XG4gICAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRXZlbnQgdHlwZSAnICsgZXZlbnRUeXBlICsgJyBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cbiAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoY2xhc3NOYW1lKTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgY2FzZSAnTW91c2VFdmVudHMnOlxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGNsaWVudFggPSBwYXJhbXMueCB8fCBwYXJhbXMuY2xpZW50WCB8fCAwO1xuICAgICAgICAgIHZhciBjbGllbnRZID0gcGFyYW1zLnkgfHwgcGFyYW1zLmNsaWVudFkgfHwgMDtcbiAgICAgICAgICBldnQuaW5pdE1vdXNlRXZlbnQoZXZlbnRUeXBlLCBwYXJhbXMuYnViYmxlcyB8fCBmYWxzZSwgcGFyYW1zLmNhbmNlbGFibGUgfHwgdHJ1ZSwgd2luZG93LCBwYXJhbXMuY2xpY2tDb3VudCB8fCAxLCAwLFxuICAgICAgICAgIDAsXG4gICAgICAgICAgY2xpZW50WCxcbiAgICAgICAgICBjbGllbnRZLFxuICAgICAgICAgIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgY2FzZSAnS2V5Ym9hcmRFdmVudHMnOlxuICAgICAgICB7XG4gICAgICAgICAgdmFyIGluaXQgPSBldnQuaW5pdEtleWJvYXJkRXZlbnQgfHwgZXZ0LmluaXRLZXlFdmVudDtcbiAgICAgICAgICBDb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgICAgICAgICBjYW5jZWxhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY3RybEtleTogZmFsc2UsXG4gICAgICAgICAgICBhbHRLZXk6IGZhbHNlLFxuICAgICAgICAgICAgc2hpZnRLZXk6IGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogZmFsc2UsXG4gICAgICAgICAgICBrZXlDb2RlOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBjaGFyQ29kZTogdW5kZWZpbmVkXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaW5pdChldmVudFR5cGUsIHBhcmFtcy5idWJibGVzIHx8IGZhbHNlLCBwYXJhbXMuY2FuY2VsYWJsZSwgd2luZG93LCBwYXJhbXMuY3RybEtleSwgcGFyYW1zLmFsdEtleSwgcGFyYW1zLnNoaWZ0S2V5LCBwYXJhbXMubWV0YUtleSwgcGFyYW1zLmtleUNvZGUsIHBhcmFtcy5jaGFyQ29kZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHtcbiAgICAgICAgICBldnQuaW5pdEV2ZW50KGV2ZW50VHlwZSwgcGFyYW1zLmJ1YmJsZXMgfHwgZmFsc2UsIHBhcmFtcy5jYW5jZWxhYmxlIHx8IHRydWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIENvbW1vbi5kZWZhdWx0cyhldnQsIGF1eCk7XG4gICAgZWxlbS5kaXNwYXRjaEV2ZW50KGV2dCk7XG4gIH0sXG4gIGJpbmQ6IGZ1bmN0aW9uIGJpbmQoZWxlbSwgZXZlbnQsIGZ1bmMsIG5ld0Jvb2wpIHtcbiAgICB2YXIgYm9vbCA9IG5ld0Jvb2wgfHwgZmFsc2U7XG4gICAgaWYgKGVsZW0uYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jLCBib29sKTtcbiAgICB9IGVsc2UgaWYgKGVsZW0uYXR0YWNoRXZlbnQpIHtcbiAgICAgIGVsZW0uYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcbiAgdW5iaW5kOiBmdW5jdGlvbiB1bmJpbmQoZWxlbSwgZXZlbnQsIGZ1bmMsIG5ld0Jvb2wpIHtcbiAgICB2YXIgYm9vbCA9IG5ld0Jvb2wgfHwgZmFsc2U7XG4gICAgaWYgKGVsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgICAgZWxlbS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jLCBib29sKTtcbiAgICB9IGVsc2UgaWYgKGVsZW0uZGV0YWNoRXZlbnQpIHtcbiAgICAgIGVsZW0uZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50LCBmdW5jKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvbTtcbiAgfSxcbiAgYWRkQ2xhc3M6IGZ1bmN0aW9uIGFkZENsYXNzKGVsZW0sIGNsYXNzTmFtZSkge1xuICAgIGlmIChlbGVtLmNsYXNzTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9IGVsc2UgaWYgKGVsZW0uY2xhc3NOYW1lICE9PSBjbGFzc05hbWUpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gZWxlbS5jbGFzc05hbWUuc3BsaXQoLyArLyk7XG4gICAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgPT09IC0xKSB7XG4gICAgICAgIGNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xuICAgICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpLnJlcGxhY2UoL15cXHMrLywgJycpLnJlcGxhY2UoL1xccyskLywgJycpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZG9tO1xuICB9LFxuICByZW1vdmVDbGFzczogZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWxlbSwgY2xhc3NOYW1lKSB7XG4gICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgaWYgKGVsZW0uY2xhc3NOYW1lID09PSBjbGFzc05hbWUpIHtcbiAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgY2xhc3NlcyA9IGVsZW0uY2xhc3NOYW1lLnNwbGl0KC8gKy8pO1xuICAgICAgICB2YXIgaW5kZXggPSBjbGFzc2VzLmluZGV4T2YoY2xhc3NOYW1lKTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIGNsYXNzZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICBlbGVtLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW0uY2xhc3NOYW1lID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZG9tO1xuICB9LFxuICBoYXNDbGFzczogZnVuY3Rpb24gaGFzQ2xhc3MoZWxlbSwgY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoJyg/Ol58XFxcXHMrKScgKyBjbGFzc05hbWUgKyAnKD86XFxcXHMrfCQpJykudGVzdChlbGVtLmNsYXNzTmFtZSkgfHwgZmFsc2U7XG4gIH0sXG4gIGdldFdpZHRoOiBmdW5jdGlvbiBnZXRXaWR0aChlbGVtKSB7XG4gICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKTtcbiAgICByZXR1cm4gY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLWxlZnQtd2lkdGgnXSkgKyBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItcmlnaHQtd2lkdGgnXSkgKyBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydwYWRkaW5nLWxlZnQnXSkgKyBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydwYWRkaW5nLXJpZ2h0J10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZS53aWR0aCk7XG4gIH0sXG4gIGdldEhlaWdodDogZnVuY3Rpb24gZ2V0SGVpZ2h0KGVsZW0pIHtcbiAgICB2YXIgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsZW0pO1xuICAgIHJldHVybiBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlWydib3JkZXItdG9wLXdpZHRoJ10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsnYm9yZGVyLWJvdHRvbS13aWR0aCddKSArIGNzc1ZhbHVlVG9QaXhlbHMoc3R5bGVbJ3BhZGRpbmctdG9wJ10pICsgY3NzVmFsdWVUb1BpeGVscyhzdHlsZVsncGFkZGluZy1ib3R0b20nXSkgKyBjc3NWYWx1ZVRvUGl4ZWxzKHN0eWxlLmhlaWdodCk7XG4gIH0sXG4gIGdldE9mZnNldDogZnVuY3Rpb24gZ2V0T2Zmc2V0KGVsKSB7XG4gICAgdmFyIGVsZW0gPSBlbDtcbiAgICB2YXIgb2Zmc2V0ID0geyBsZWZ0OiAwLCB0b3A6IDAgfTtcbiAgICBpZiAoZWxlbS5vZmZzZXRQYXJlbnQpIHtcbiAgICAgIGRvIHtcbiAgICAgICAgb2Zmc2V0LmxlZnQgKz0gZWxlbS5vZmZzZXRMZWZ0O1xuICAgICAgICBvZmZzZXQudG9wICs9IGVsZW0ub2Zmc2V0VG9wO1xuICAgICAgICBlbGVtID0gZWxlbS5vZmZzZXRQYXJlbnQ7XG4gICAgICB9IHdoaWxlIChlbGVtKTtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldDtcbiAgfSxcbiAgaXNBY3RpdmU6IGZ1bmN0aW9uIGlzQWN0aXZlKGVsZW0pIHtcbiAgICByZXR1cm4gZWxlbSA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiAoZWxlbS50eXBlIHx8IGVsZW0uaHJlZik7XG4gIH1cbn07XG5cbnZhciBCb29sZWFuQ29udHJvbGxlciA9IGZ1bmN0aW9uIChfQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhCb29sZWFuQ29udHJvbGxlciwgX0NvbnRyb2xsZXIpO1xuICBmdW5jdGlvbiBCb29sZWFuQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgQm9vbGVhbkNvbnRyb2xsZXIpO1xuICAgIHZhciBfdGhpczIgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChCb29sZWFuQ29udHJvbGxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKEJvb2xlYW5Db250cm9sbGVyKSkuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KSk7XG4gICAgdmFyIF90aGlzID0gX3RoaXMyO1xuICAgIF90aGlzMi5fX3ByZXYgPSBfdGhpczIuZ2V0VmFsdWUoKTtcbiAgICBfdGhpczIuX19jaGVja2JveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgX3RoaXMyLl9fY2hlY2tib3guc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NoZWNrYm94Jyk7XG4gICAgZnVuY3Rpb24gb25DaGFuZ2UoKSB7XG4gICAgICBfdGhpcy5zZXRWYWx1ZSghX3RoaXMuX19wcmV2KTtcbiAgICB9XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fY2hlY2tib3gsICdjaGFuZ2UnLCBvbkNoYW5nZSwgZmFsc2UpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX2NoZWNrYm94KTtcbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIHJldHVybiBfdGhpczI7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoQm9vbGVhbkNvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAnc2V0VmFsdWUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRWYWx1ZSh2KSB7XG4gICAgICB2YXIgdG9SZXR1cm4gPSBnZXQoQm9vbGVhbkNvbnRyb2xsZXIucHJvdG90eXBlLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoQm9vbGVhbkNvbnRyb2xsZXIucHJvdG90eXBlKSwgJ3NldFZhbHVlJywgdGhpcykuY2FsbCh0aGlzLCB2KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX19wcmV2ID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgcmV0dXJuIHRvUmV0dXJuO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3VwZGF0ZURpc3BsYXknLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVEaXNwbGF5KCkge1xuICAgICAgaWYgKHRoaXMuZ2V0VmFsdWUoKSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guc2V0QXR0cmlidXRlKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICAgICAgdGhpcy5fX2NoZWNrYm94LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9fcHJldiA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9fY2hlY2tib3guY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9fcHJldiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldChCb29sZWFuQ29udHJvbGxlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihCb29sZWFuQ29udHJvbGxlci5wcm90b3R5cGUpLCAndXBkYXRlRGlzcGxheScsIHRoaXMpLmNhbGwodGhpcyk7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBCb29sZWFuQ29udHJvbGxlcjtcbn0oQ29udHJvbGxlcik7XG5cbnZhciBPcHRpb25Db250cm9sbGVyID0gZnVuY3Rpb24gKF9Db250cm9sbGVyKSB7XG4gIGluaGVyaXRzKE9wdGlvbkNvbnRyb2xsZXIsIF9Db250cm9sbGVyKTtcbiAgZnVuY3Rpb24gT3B0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCBvcHRzKSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgT3B0aW9uQ29udHJvbGxlcik7XG4gICAgdmFyIF90aGlzMiA9IHBvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKE9wdGlvbkNvbnRyb2xsZXIuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihPcHRpb25Db250cm9sbGVyKSkuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KSk7XG4gICAgdmFyIG9wdGlvbnMgPSBvcHRzO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBfdGhpczIuX19zZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICBpZiAoQ29tbW9uLmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIHZhciBtYXAgPSB7fTtcbiAgICAgIENvbW1vbi5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIG1hcFtlbGVtZW50XSA9IGVsZW1lbnQ7XG4gICAgICB9KTtcbiAgICAgIG9wdGlvbnMgPSBtYXA7XG4gICAgfVxuICAgIENvbW1vbi5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICB2YXIgb3B0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHQuaW5uZXJIVE1MID0ga2V5O1xuICAgICAgb3B0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB2YWx1ZSk7XG4gICAgICBfdGhpcy5fX3NlbGVjdC5hcHBlbmRDaGlsZChvcHQpO1xuICAgIH0pO1xuICAgIF90aGlzMi51cGRhdGVEaXNwbGF5KCk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fc2VsZWN0LCAnY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGRlc2lyZWRWYWx1ZSA9IHRoaXMub3B0aW9uc1t0aGlzLnNlbGVjdGVkSW5kZXhdLnZhbHVlO1xuICAgICAgX3RoaXMuc2V0VmFsdWUoZGVzaXJlZFZhbHVlKTtcbiAgICB9KTtcbiAgICBfdGhpczIuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChfdGhpczIuX19zZWxlY3QpO1xuICAgIHJldHVybiBfdGhpczI7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoT3B0aW9uQ29udHJvbGxlciwgW3tcbiAgICBrZXk6ICdzZXRWYWx1ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldFZhbHVlKHYpIHtcbiAgICAgIHZhciB0b1JldHVybiA9IGdldChPcHRpb25Db250cm9sbGVyLnByb3RvdHlwZS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKE9wdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlKSwgJ3NldFZhbHVlJywgdGhpcykuY2FsbCh0aGlzLCB2KTtcbiAgICAgIGlmICh0aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwodGhpcywgdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0b1JldHVybjtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICd1cGRhdGVEaXNwbGF5JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGlzcGxheSgpIHtcbiAgICAgIGlmIChkb20uaXNBY3RpdmUodGhpcy5fX3NlbGVjdCkpIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy5fX3NlbGVjdC52YWx1ZSA9IHRoaXMuZ2V0VmFsdWUoKTtcbiAgICAgIHJldHVybiBnZXQoT3B0aW9uQ29udHJvbGxlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihPcHRpb25Db250cm9sbGVyLnByb3RvdHlwZSksICd1cGRhdGVEaXNwbGF5JywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIE9wdGlvbkNvbnRyb2xsZXI7XG59KENvbnRyb2xsZXIpO1xuXG52YXIgU3RyaW5nQ29udHJvbGxlciA9IGZ1bmN0aW9uIChfQ29udHJvbGxlcikge1xuICBpbmhlcml0cyhTdHJpbmdDb250cm9sbGVyLCBfQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIFN0cmluZ0NvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIFN0cmluZ0NvbnRyb2xsZXIpO1xuICAgIHZhciBfdGhpczIgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChTdHJpbmdDb250cm9sbGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoU3RyaW5nQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBmdW5jdGlvbiBvbkNoYW5nZSgpIHtcbiAgICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9faW5wdXQudmFsdWUpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbkJsdXIoKSB7XG4gICAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBfdGhpczIuX19pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgX3RoaXMyLl9faW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQnKTtcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ2tleXVwJywgb25DaGFuZ2UpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAnY2hhbmdlJywgb25DaGFuZ2UpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2lucHV0LCAnYmx1cicsIG9uQmx1cik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdrZXlkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIHRoaXMuYmx1cigpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF90aGlzMi51cGRhdGVEaXNwbGF5KCk7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9faW5wdXQpO1xuICAgIHJldHVybiBfdGhpczI7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoU3RyaW5nQ29udHJvbGxlciwgW3tcbiAgICBrZXk6ICd1cGRhdGVEaXNwbGF5JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGlzcGxheSgpIHtcbiAgICAgIGlmICghZG9tLmlzQWN0aXZlKHRoaXMuX19pbnB1dCkpIHtcbiAgICAgICAgdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5nZXRWYWx1ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldChTdHJpbmdDb250cm9sbGVyLnByb3RvdHlwZS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKFN0cmluZ0NvbnRyb2xsZXIucHJvdG90eXBlKSwgJ3VwZGF0ZURpc3BsYXknLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gU3RyaW5nQ29udHJvbGxlcjtcbn0oQ29udHJvbGxlcik7XG5cbmZ1bmN0aW9uIG51bURlY2ltYWxzKHgpIHtcbiAgdmFyIF94ID0geC50b1N0cmluZygpO1xuICBpZiAoX3guaW5kZXhPZignLicpID4gLTEpIHtcbiAgICByZXR1cm4gX3gubGVuZ3RoIC0gX3guaW5kZXhPZignLicpIC0gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbnZhciBOdW1iZXJDb250cm9sbGVyID0gZnVuY3Rpb24gKF9Db250cm9sbGVyKSB7XG4gIGluaGVyaXRzKE51bWJlckNvbnRyb2xsZXIsIF9Db250cm9sbGVyKTtcbiAgZnVuY3Rpb24gTnVtYmVyQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCBwYXJhbXMpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBOdW1iZXJDb250cm9sbGVyKTtcbiAgICB2YXIgX3RoaXMgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChOdW1iZXJDb250cm9sbGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTnVtYmVyQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIHZhciBfcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIF90aGlzLl9fbWluID0gX3BhcmFtcy5taW47XG4gICAgX3RoaXMuX19tYXggPSBfcGFyYW1zLm1heDtcbiAgICBfdGhpcy5fX3N0ZXAgPSBfcGFyYW1zLnN0ZXA7XG4gICAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChfdGhpcy5fX3N0ZXApKSB7XG4gICAgICBpZiAoX3RoaXMuaW5pdGlhbFZhbHVlID09PSAwKSB7XG4gICAgICAgIF90aGlzLl9faW1wbGllZFN0ZXAgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3RoaXMuX19pbXBsaWVkU3RlcCA9IE1hdGgucG93KDEwLCBNYXRoLmZsb29yKE1hdGgubG9nKE1hdGguYWJzKF90aGlzLmluaXRpYWxWYWx1ZSkpIC8gTWF0aC5MTjEwKSkgLyAxMDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgX3RoaXMuX19pbXBsaWVkU3RlcCA9IF90aGlzLl9fc3RlcDtcbiAgICB9XG4gICAgX3RoaXMuX19wcmVjaXNpb24gPSBudW1EZWNpbWFscyhfdGhpcy5fX2ltcGxpZWRTdGVwKTtcbiAgICByZXR1cm4gX3RoaXM7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoTnVtYmVyQ29udHJvbGxlciwgW3tcbiAgICBrZXk6ICdzZXRWYWx1ZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHNldFZhbHVlKHYpIHtcbiAgICAgIHZhciBfdiA9IHY7XG4gICAgICBpZiAodGhpcy5fX21pbiAhPT0gdW5kZWZpbmVkICYmIF92IDwgdGhpcy5fX21pbikge1xuICAgICAgICBfdiA9IHRoaXMuX19taW47XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19tYXggIT09IHVuZGVmaW5lZCAmJiBfdiA+IHRoaXMuX19tYXgpIHtcbiAgICAgICAgX3YgPSB0aGlzLl9fbWF4O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19zdGVwICE9PSB1bmRlZmluZWQgJiYgX3YgJSB0aGlzLl9fc3RlcCAhPT0gMCkge1xuICAgICAgICBfdiA9IE1hdGgucm91bmQoX3YgLyB0aGlzLl9fc3RlcCkgKiB0aGlzLl9fc3RlcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXQoTnVtYmVyQ29udHJvbGxlci5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihOdW1iZXJDb250cm9sbGVyLnByb3RvdHlwZSksICdzZXRWYWx1ZScsIHRoaXMpLmNhbGwodGhpcywgX3YpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ21pbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG1pbihtaW5WYWx1ZSkge1xuICAgICAgdGhpcy5fX21pbiA9IG1pblZhbHVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnbWF4JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gbWF4KG1heFZhbHVlKSB7XG4gICAgICB0aGlzLl9fbWF4ID0gbWF4VmFsdWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdzdGVwJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc3RlcChzdGVwVmFsdWUpIHtcbiAgICAgIHRoaXMuX19zdGVwID0gc3RlcFZhbHVlO1xuICAgICAgdGhpcy5fX2ltcGxpZWRTdGVwID0gc3RlcFZhbHVlO1xuICAgICAgdGhpcy5fX3ByZWNpc2lvbiA9IG51bURlY2ltYWxzKHN0ZXBWYWx1ZSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXI7XG59KENvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiByb3VuZFRvRGVjaW1hbCh2YWx1ZSwgZGVjaW1hbHMpIHtcbiAgdmFyIHRlblRvID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcbiAgcmV0dXJuIE1hdGgucm91bmQodmFsdWUgKiB0ZW5UbykgLyB0ZW5Ubztcbn1cbnZhciBOdW1iZXJDb250cm9sbGVyQm94ID0gZnVuY3Rpb24gKF9OdW1iZXJDb250cm9sbGVyKSB7XG4gIGluaGVyaXRzKE51bWJlckNvbnRyb2xsZXJCb3gsIF9OdW1iZXJDb250cm9sbGVyKTtcbiAgZnVuY3Rpb24gTnVtYmVyQ29udHJvbGxlckJveChvYmplY3QsIHByb3BlcnR5LCBwYXJhbXMpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBOdW1iZXJDb250cm9sbGVyQm94KTtcbiAgICB2YXIgX3RoaXMyID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoTnVtYmVyQ29udHJvbGxlckJveC5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKE51bWJlckNvbnRyb2xsZXJCb3gpKS5jYWxsKHRoaXMsIG9iamVjdCwgcHJvcGVydHksIHBhcmFtcykpO1xuICAgIF90aGlzMi5fX3RydW5jYXRpb25TdXNwZW5kZWQgPSBmYWxzZTtcbiAgICB2YXIgX3RoaXMgPSBfdGhpczI7XG4gICAgdmFyIHByZXZZID0gdm9pZCAwO1xuICAgIGZ1bmN0aW9uIG9uQ2hhbmdlKCkge1xuICAgICAgdmFyIGF0dGVtcHRlZCA9IHBhcnNlRmxvYXQoX3RoaXMuX19pbnB1dC52YWx1ZSk7XG4gICAgICBpZiAoIUNvbW1vbi5pc05hTihhdHRlbXB0ZWQpKSB7XG4gICAgICAgIF90aGlzLnNldFZhbHVlKGF0dGVtcHRlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uRmluaXNoKCkge1xuICAgICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gb25CbHVyKCkge1xuICAgICAgb25GaW5pc2goKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Nb3VzZURyYWcoZSkge1xuICAgICAgdmFyIGRpZmYgPSBwcmV2WSAtIGUuY2xpZW50WTtcbiAgICAgIF90aGlzLnNldFZhbHVlKF90aGlzLmdldFZhbHVlKCkgKyBkaWZmICogX3RoaXMuX19pbXBsaWVkU3RlcCk7XG4gICAgICBwcmV2WSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Nb3VzZVVwKCkge1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgb25GaW5pc2goKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Nb3VzZURvd24oZSkge1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgb25Nb3VzZURyYWcpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgICBwcmV2WSA9IGUuY2xpZW50WTtcbiAgICB9XG4gICAgX3RoaXMyLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIF90aGlzMi5fX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0Jyk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdjaGFuZ2UnLCBvbkNoYW5nZSk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdibHVyJywgb25CbHVyKTtcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ21vdXNlZG93bicsIG9uTW91c2VEb3duKTtcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgX3RoaXMuX190cnVuY2F0aW9uU3VzcGVuZGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5ibHVyKCk7XG4gICAgICAgIF90aGlzLl9fdHJ1bmNhdGlvblN1c3BlbmRlZCA9IGZhbHNlO1xuICAgICAgICBvbkZpbmlzaCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIF90aGlzMi51cGRhdGVEaXNwbGF5KCk7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9faW5wdXQpO1xuICAgIHJldHVybiBfdGhpczI7XG4gIH1cbiAgY3JlYXRlQ2xhc3MoTnVtYmVyQ29udHJvbGxlckJveCwgW3tcbiAgICBrZXk6ICd1cGRhdGVEaXNwbGF5JyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gdXBkYXRlRGlzcGxheSgpIHtcbiAgICAgIHRoaXMuX19pbnB1dC52YWx1ZSA9IHRoaXMuX190cnVuY2F0aW9uU3VzcGVuZGVkID8gdGhpcy5nZXRWYWx1ZSgpIDogcm91bmRUb0RlY2ltYWwodGhpcy5nZXRWYWx1ZSgpLCB0aGlzLl9fcHJlY2lzaW9uKTtcbiAgICAgIHJldHVybiBnZXQoTnVtYmVyQ29udHJvbGxlckJveC5wcm90b3R5cGUuX19wcm90b19fIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihOdW1iZXJDb250cm9sbGVyQm94LnByb3RvdHlwZSksICd1cGRhdGVEaXNwbGF5JywgdGhpcykuY2FsbCh0aGlzKTtcbiAgICB9XG4gIH1dKTtcbiAgcmV0dXJuIE51bWJlckNvbnRyb2xsZXJCb3g7XG59KE51bWJlckNvbnRyb2xsZXIpO1xuXG5mdW5jdGlvbiBtYXAodiwgaTEsIGkyLCBvMSwgbzIpIHtcbiAgcmV0dXJuIG8xICsgKG8yIC0gbzEpICogKCh2IC0gaTEpIC8gKGkyIC0gaTEpKTtcbn1cbnZhciBOdW1iZXJDb250cm9sbGVyU2xpZGVyID0gZnVuY3Rpb24gKF9OdW1iZXJDb250cm9sbGVyKSB7XG4gIGluaGVyaXRzKE51bWJlckNvbnRyb2xsZXJTbGlkZXIsIF9OdW1iZXJDb250cm9sbGVyKTtcbiAgZnVuY3Rpb24gTnVtYmVyQ29udHJvbGxlclNsaWRlcihvYmplY3QsIHByb3BlcnR5LCBtaW4sIG1heCwgc3RlcCkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIE51bWJlckNvbnRyb2xsZXJTbGlkZXIpO1xuICAgIHZhciBfdGhpczIgPSBwb3NzaWJsZUNvbnN0cnVjdG9yUmV0dXJuKHRoaXMsIChOdW1iZXJDb250cm9sbGVyU2xpZGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoTnVtYmVyQ29udHJvbGxlclNsaWRlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSwgeyBtaW46IG1pbiwgbWF4OiBtYXgsIHN0ZXA6IHN0ZXAgfSkpO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBfdGhpczIuX19iYWNrZ3JvdW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgX3RoaXMyLl9fZm9yZWdyb3VuZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2JhY2tncm91bmQsICdtb3VzZWRvd24nLCBvbk1vdXNlRG93bik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fYmFja2dyb3VuZCwgJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQpO1xuICAgIGRvbS5hZGRDbGFzcyhfdGhpczIuX19iYWNrZ3JvdW5kLCAnc2xpZGVyJyk7XG4gICAgZG9tLmFkZENsYXNzKF90aGlzMi5fX2ZvcmVncm91bmQsICdzbGlkZXItZmcnKTtcbiAgICBmdW5jdGlvbiBvbk1vdXNlRG93bihlKSB7XG4gICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIG9uTW91c2VEcmFnKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgb25Nb3VzZURyYWcoZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VEcmFnKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBiZ1JlY3QgPSBfdGhpcy5fX2JhY2tncm91bmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShtYXAoZS5jbGllbnRYLCBiZ1JlY3QubGVmdCwgYmdSZWN0LnJpZ2h0LCBfdGhpcy5fX21pbiwgX3RoaXMuX19tYXgpKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Nb3VzZVVwKCkge1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBvbk1vdXNlRHJhZyk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBvbk1vdXNlVXApO1xuICAgICAgaWYgKF90aGlzLl9fb25GaW5pc2hDaGFuZ2UpIHtcbiAgICAgICAgX3RoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKF90aGlzLCBfdGhpcy5nZXRWYWx1ZSgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KGUpIHtcbiAgICAgIGlmIChlLnRvdWNoZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCk7XG4gICAgICBvblRvdWNoTW92ZShlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Ub3VjaE1vdmUoZSkge1xuICAgICAgdmFyIGNsaWVudFggPSBlLnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICAgIHZhciBiZ1JlY3QgPSBfdGhpcy5fX2JhY2tncm91bmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBfdGhpcy5zZXRWYWx1ZShtYXAoY2xpZW50WCwgYmdSZWN0LmxlZnQsIGJnUmVjdC5yaWdodCwgX3RoaXMuX19taW4sIF90aGlzLl9fbWF4KSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcbiAgICAgIGlmIChfdGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIF90aGlzLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChfdGhpcywgX3RoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIF90aGlzMi51cGRhdGVEaXNwbGF5KCk7XG4gICAgX3RoaXMyLl9fYmFja2dyb3VuZC5hcHBlbmRDaGlsZChfdGhpczIuX19mb3JlZ3JvdW5kKTtcbiAgICBfdGhpczIuZG9tRWxlbWVudC5hcHBlbmRDaGlsZChfdGhpczIuX19iYWNrZ3JvdW5kKTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKE51bWJlckNvbnRyb2xsZXJTbGlkZXIsIFt7XG4gICAga2V5OiAndXBkYXRlRGlzcGxheScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgICB2YXIgcGN0ID0gKHRoaXMuZ2V0VmFsdWUoKSAtIHRoaXMuX19taW4pIC8gKHRoaXMuX19tYXggLSB0aGlzLl9fbWluKTtcbiAgICAgIHRoaXMuX19mb3JlZ3JvdW5kLnN0eWxlLndpZHRoID0gcGN0ICogMTAwICsgJyUnO1xuICAgICAgcmV0dXJuIGdldChOdW1iZXJDb250cm9sbGVyU2xpZGVyLnByb3RvdHlwZS5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKE51bWJlckNvbnRyb2xsZXJTbGlkZXIucHJvdG90eXBlKSwgJ3VwZGF0ZURpc3BsYXknLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gTnVtYmVyQ29udHJvbGxlclNsaWRlcjtcbn0oTnVtYmVyQ29udHJvbGxlcik7XG5cbnZhciBGdW5jdGlvbkNvbnRyb2xsZXIgPSBmdW5jdGlvbiAoX0NvbnRyb2xsZXIpIHtcbiAgaW5oZXJpdHMoRnVuY3Rpb25Db250cm9sbGVyLCBfQ29udHJvbGxlcik7XG4gIGZ1bmN0aW9uIEZ1bmN0aW9uQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5LCB0ZXh0KSB7XG4gICAgY2xhc3NDYWxsQ2hlY2sodGhpcywgRnVuY3Rpb25Db250cm9sbGVyKTtcbiAgICB2YXIgX3RoaXMyID0gcG9zc2libGVDb25zdHJ1Y3RvclJldHVybih0aGlzLCAoRnVuY3Rpb25Db250cm9sbGVyLl9fcHJvdG9fXyB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2YoRnVuY3Rpb25Db250cm9sbGVyKSkuY2FsbCh0aGlzLCBvYmplY3QsIHByb3BlcnR5KSk7XG4gICAgdmFyIF90aGlzID0gX3RoaXMyO1xuICAgIF90aGlzMi5fX2J1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX2J1dHRvbi5pbm5lckhUTUwgPSB0ZXh0ID09PSB1bmRlZmluZWQgPyAnRmlyZScgOiB0ZXh0O1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2J1dHRvbiwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIF90aGlzLmZpcmUoKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgICBkb20uYWRkQ2xhc3MoX3RoaXMyLl9fYnV0dG9uLCAnYnV0dG9uJyk7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9fYnV0dG9uKTtcbiAgICByZXR1cm4gX3RoaXMyO1xuICB9XG4gIGNyZWF0ZUNsYXNzKEZ1bmN0aW9uQ29udHJvbGxlciwgW3tcbiAgICBrZXk6ICdmaXJlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZmlyZSgpIHtcbiAgICAgIGlmICh0aGlzLl9fb25DaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fX29uQ2hhbmdlLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgICB0aGlzLmdldFZhbHVlKCkuY2FsbCh0aGlzLm9iamVjdCk7XG4gICAgICBpZiAodGhpcy5fX29uRmluaXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX19vbkZpbmlzaENoYW5nZS5jYWxsKHRoaXMsIHRoaXMuZ2V0VmFsdWUoKSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBGdW5jdGlvbkNvbnRyb2xsZXI7XG59KENvbnRyb2xsZXIpO1xuXG52YXIgQ29sb3JDb250cm9sbGVyID0gZnVuY3Rpb24gKF9Db250cm9sbGVyKSB7XG4gIGluaGVyaXRzKENvbG9yQ29udHJvbGxlciwgX0NvbnRyb2xsZXIpO1xuICBmdW5jdGlvbiBDb2xvckNvbnRyb2xsZXIob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNsYXNzQ2FsbENoZWNrKHRoaXMsIENvbG9yQ29udHJvbGxlcik7XG4gICAgdmFyIF90aGlzMiA9IHBvc3NpYmxlQ29uc3RydWN0b3JSZXR1cm4odGhpcywgKENvbG9yQ29udHJvbGxlci5fX3Byb3RvX18gfHwgT2JqZWN0LmdldFByb3RvdHlwZU9mKENvbG9yQ29udHJvbGxlcikpLmNhbGwodGhpcywgb2JqZWN0LCBwcm9wZXJ0eSkpO1xuICAgIF90aGlzMi5fX2NvbG9yID0gbmV3IENvbG9yKF90aGlzMi5nZXRWYWx1ZSgpKTtcbiAgICBfdGhpczIuX190ZW1wID0gbmV3IENvbG9yKDApO1xuICAgIHZhciBfdGhpcyA9IF90aGlzMjtcbiAgICBfdGhpczIuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRvbS5tYWtlU2VsZWN0YWJsZShfdGhpczIuZG9tRWxlbWVudCwgZmFsc2UpO1xuICAgIF90aGlzMi5fX3NlbGVjdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgX3RoaXMyLl9fc2VsZWN0b3IuY2xhc3NOYW1lID0gJ3NlbGVjdG9yJztcbiAgICBfdGhpczIuX19zYXR1cmF0aW9uX2ZpZWxkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZC5jbGFzc05hbWUgPSAnc2F0dXJhdGlvbi1maWVsZCc7XG4gICAgX3RoaXMyLl9fZmllbGRfa25vYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIF90aGlzMi5fX2ZpZWxkX2tub2IuY2xhc3NOYW1lID0gJ2ZpZWxkLWtub2InO1xuICAgIF90aGlzMi5fX2ZpZWxkX2tub2JfYm9yZGVyID0gJzJweCBzb2xpZCAnO1xuICAgIF90aGlzMi5fX2h1ZV9rbm9iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgX3RoaXMyLl9faHVlX2tub2IuY2xhc3NOYW1lID0gJ2h1ZS1rbm9iJztcbiAgICBfdGhpczIuX19odWVfZmllbGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBfdGhpczIuX19odWVfZmllbGQuY2xhc3NOYW1lID0gJ2h1ZS1maWVsZCc7XG4gICAgX3RoaXMyLl9faW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgIF90aGlzMi5fX2lucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgX3RoaXMyLl9faW5wdXRfdGV4dFNoYWRvdyA9ICcwIDFweCAxcHggJztcbiAgICBkb20uYmluZChfdGhpczIuX19pbnB1dCwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKGUua2V5Q29kZSA9PT0gMTMpIHtcbiAgICAgICAgb25CbHVyLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9faW5wdXQsICdibHVyJywgb25CbHVyKTtcbiAgICBkb20uYmluZChfdGhpczIuX19zZWxlY3RvciwgJ21vdXNlZG93bicsIGZ1bmN0aW9uICgpICAgICAgICB7XG4gICAgICBkb20uYWRkQ2xhc3ModGhpcywgJ2RyYWcnKS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmdW5jdGlvbiAoKSAgICAgICAge1xuICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoX3RoaXMuX19zZWxlY3RvciwgJ2RyYWcnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX3NlbGVjdG9yLCAndG91Y2hzdGFydCcsIGZ1bmN0aW9uICgpICAgICAgICB7XG4gICAgICBkb20uYWRkQ2xhc3ModGhpcywgJ2RyYWcnKS5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgZnVuY3Rpb24gKCkgICAgICAgIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKF90aGlzLl9fc2VsZWN0b3IsICdkcmFnJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB2YXIgdmFsdWVGaWVsZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIENvbW1vbi5leHRlbmQoX3RoaXMyLl9fc2VsZWN0b3Iuc3R5bGUsIHtcbiAgICAgIHdpZHRoOiAnMTIycHgnLFxuICAgICAgaGVpZ2h0OiAnMTAycHgnLFxuICAgICAgcGFkZGluZzogJzNweCcsXG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjMjIyJyxcbiAgICAgIGJveFNoYWRvdzogJzBweCAxcHggM3B4IHJnYmEoMCwwLDAsMC4zKSdcbiAgICB9KTtcbiAgICBDb21tb24uZXh0ZW5kKF90aGlzMi5fX2ZpZWxkX2tub2Iuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgd2lkdGg6ICcxMnB4JyxcbiAgICAgIGhlaWdodDogJzEycHgnLFxuICAgICAgYm9yZGVyOiBfdGhpczIuX19maWVsZF9rbm9iX2JvcmRlciArIChfdGhpczIuX19jb2xvci52IDwgMC41ID8gJyNmZmYnIDogJyMwMDAnKSxcbiAgICAgIGJveFNoYWRvdzogJzBweCAxcHggM3B4IHJnYmEoMCwwLDAsMC41KScsXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4JyxcbiAgICAgIHpJbmRleDogMVxuICAgIH0pO1xuICAgIENvbW1vbi5leHRlbmQoX3RoaXMyLl9faHVlX2tub2Iuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgd2lkdGg6ICcxNXB4JyxcbiAgICAgIGhlaWdodDogJzJweCcsXG4gICAgICBib3JkZXJSaWdodDogJzRweCBzb2xpZCAjZmZmJyxcbiAgICAgIHpJbmRleDogMVxuICAgIH0pO1xuICAgIENvbW1vbi5leHRlbmQoX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZC5zdHlsZSwge1xuICAgICAgd2lkdGg6ICcxMDBweCcsXG4gICAgICBoZWlnaHQ6ICcxMDBweCcsXG4gICAgICBib3JkZXI6ICcxcHggc29saWQgIzU1NScsXG4gICAgICBtYXJnaW5SaWdodDogJzNweCcsXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcbiAgICAgIGN1cnNvcjogJ3BvaW50ZXInXG4gICAgfSk7XG4gICAgQ29tbW9uLmV4dGVuZCh2YWx1ZUZpZWxkLnN0eWxlLCB7XG4gICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICBiYWNrZ3JvdW5kOiAnbm9uZSdcbiAgICB9KTtcbiAgICBsaW5lYXJHcmFkaWVudCh2YWx1ZUZpZWxkLCAndG9wJywgJ3JnYmEoMCwwLDAsMCknLCAnIzAwMCcpO1xuICAgIENvbW1vbi5leHRlbmQoX3RoaXMyLl9faHVlX2ZpZWxkLnN0eWxlLCB7XG4gICAgICB3aWR0aDogJzE1cHgnLFxuICAgICAgaGVpZ2h0OiAnMTAwcHgnLFxuICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkICM1NTUnLFxuICAgICAgY3Vyc29yOiAnbnMtcmVzaXplJyxcbiAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgdG9wOiAnM3B4JyxcbiAgICAgIHJpZ2h0OiAnM3B4J1xuICAgIH0pO1xuICAgIGh1ZUdyYWRpZW50KF90aGlzMi5fX2h1ZV9maWVsZCk7XG4gICAgQ29tbW9uLmV4dGVuZChfdGhpczIuX19pbnB1dC5zdHlsZSwge1xuICAgICAgb3V0bGluZTogJ25vbmUnLFxuICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgICBib3JkZXI6IDAsXG4gICAgICBmb250V2VpZ2h0OiAnYm9sZCcsXG4gICAgICB0ZXh0U2hhZG93OiBfdGhpczIuX19pbnB1dF90ZXh0U2hhZG93ICsgJ3JnYmEoMCwwLDAsMC43KSdcbiAgICB9KTtcbiAgICBkb20uYmluZChfdGhpczIuX19zYXR1cmF0aW9uX2ZpZWxkLCAnbW91c2Vkb3duJywgZmllbGREb3duKTtcbiAgICBkb20uYmluZChfdGhpczIuX19zYXR1cmF0aW9uX2ZpZWxkLCAndG91Y2hzdGFydCcsIGZpZWxkRG93bik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fZmllbGRfa25vYiwgJ21vdXNlZG93bicsIGZpZWxkRG93bik7XG4gICAgZG9tLmJpbmQoX3RoaXMyLl9fZmllbGRfa25vYiwgJ3RvdWNoc3RhcnQnLCBmaWVsZERvd24pO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2h1ZV9maWVsZCwgJ21vdXNlZG93bicsIGZpZWxkRG93bkgpO1xuICAgIGRvbS5iaW5kKF90aGlzMi5fX2h1ZV9maWVsZCwgJ3RvdWNoc3RhcnQnLCBmaWVsZERvd25IKTtcbiAgICBmdW5jdGlvbiBmaWVsZERvd24oZSkge1xuICAgICAgc2V0U1YoZSk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRTVik7XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaG1vdmUnLCBzZXRTVik7XG4gICAgICBkb20uYmluZCh3aW5kb3csICdtb3VzZXVwJywgZmllbGRVcFNWKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgZmllbGRVcFNWKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmllbGREb3duSChlKSB7XG4gICAgICBzZXRIKGUpO1xuICAgICAgZG9tLmJpbmQod2luZG93LCAnbW91c2Vtb3ZlJywgc2V0SCk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaG1vdmUnLCBzZXRIKTtcbiAgICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmaWVsZFVwSCk7XG4gICAgICBkb20uYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGZpZWxkVXBIKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmllbGRVcFNWKCkge1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRTVik7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNobW92ZScsIHNldFNWKTtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIGZpZWxkVXBTVik7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgZmllbGRVcFNWKTtcbiAgICAgIG9uRmluaXNoKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpZWxkVXBIKCkge1xuICAgICAgZG9tLnVuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBzZXRIKTtcbiAgICAgIGRvbS51bmJpbmQod2luZG93LCAndG91Y2htb3ZlJywgc2V0SCk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmaWVsZFVwSCk7XG4gICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3RvdWNoZW5kJywgZmllbGRVcEgpO1xuICAgICAgb25GaW5pc2goKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25CbHVyKCkge1xuICAgICAgdmFyIGkgPSBpbnRlcnByZXQodGhpcy52YWx1ZSk7XG4gICAgICBpZiAoaSAhPT0gZmFsc2UpIHtcbiAgICAgICAgX3RoaXMuX19jb2xvci5fX3N0YXRlID0gaTtcbiAgICAgICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19jb2xvci50b09yaWdpbmFsKCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IF90aGlzLl9fY29sb3IudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gb25GaW5pc2goKSB7XG4gICAgICBpZiAoX3RoaXMuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICBfdGhpcy5fX29uRmluaXNoQ2hhbmdlLmNhbGwoX3RoaXMsIF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgX3RoaXMyLl9fc2F0dXJhdGlvbl9maWVsZC5hcHBlbmRDaGlsZCh2YWx1ZUZpZWxkKTtcbiAgICBfdGhpczIuX19zZWxlY3Rvci5hcHBlbmRDaGlsZChfdGhpczIuX19maWVsZF9rbm9iKTtcbiAgICBfdGhpczIuX19zZWxlY3Rvci5hcHBlbmRDaGlsZChfdGhpczIuX19zYXR1cmF0aW9uX2ZpZWxkKTtcbiAgICBfdGhpczIuX19zZWxlY3Rvci5hcHBlbmRDaGlsZChfdGhpczIuX19odWVfZmllbGQpO1xuICAgIF90aGlzMi5fX2h1ZV9maWVsZC5hcHBlbmRDaGlsZChfdGhpczIuX19odWVfa25vYik7XG4gICAgX3RoaXMyLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQoX3RoaXMyLl9faW5wdXQpO1xuICAgIF90aGlzMi5kb21FbGVtZW50LmFwcGVuZENoaWxkKF90aGlzMi5fX3NlbGVjdG9yKTtcbiAgICBfdGhpczIudXBkYXRlRGlzcGxheSgpO1xuICAgIGZ1bmN0aW9uIHNldFNWKGUpIHtcbiAgICAgIGlmIChlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA9PT0gLTEpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgICAgdmFyIGZpZWxkUmVjdCA9IF90aGlzLl9fc2F0dXJhdGlvbl9maWVsZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHZhciBfcmVmID0gZS50b3VjaGVzICYmIGUudG91Y2hlc1swXSB8fCBlLFxuICAgICAgICAgIGNsaWVudFggPSBfcmVmLmNsaWVudFgsXG4gICAgICAgICAgY2xpZW50WSA9IF9yZWYuY2xpZW50WTtcbiAgICAgIHZhciBzID0gKGNsaWVudFggLSBmaWVsZFJlY3QubGVmdCkgLyAoZmllbGRSZWN0LnJpZ2h0IC0gZmllbGRSZWN0LmxlZnQpO1xuICAgICAgdmFyIHYgPSAxIC0gKGNsaWVudFkgLSBmaWVsZFJlY3QudG9wKSAvIChmaWVsZFJlY3QuYm90dG9tIC0gZmllbGRSZWN0LnRvcCk7XG4gICAgICBpZiAodiA+IDEpIHtcbiAgICAgICAgdiA9IDE7XG4gICAgICB9IGVsc2UgaWYgKHYgPCAwKSB7XG4gICAgICAgIHYgPSAwO1xuICAgICAgfVxuICAgICAgaWYgKHMgPiAxKSB7XG4gICAgICAgIHMgPSAxO1xuICAgICAgfSBlbHNlIGlmIChzIDwgMCkge1xuICAgICAgICBzID0gMDtcbiAgICAgIH1cbiAgICAgIF90aGlzLl9fY29sb3IudiA9IHY7XG4gICAgICBfdGhpcy5fX2NvbG9yLnMgPSBzO1xuICAgICAgX3RoaXMuc2V0VmFsdWUoX3RoaXMuX19jb2xvci50b09yaWdpbmFsKCkpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRIKGUpIHtcbiAgICAgIGlmIChlLnR5cGUuaW5kZXhPZigndG91Y2gnKSA9PT0gLTEpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgICAgdmFyIGZpZWxkUmVjdCA9IF90aGlzLl9faHVlX2ZpZWxkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgdmFyIF9yZWYyID0gZS50b3VjaGVzICYmIGUudG91Y2hlc1swXSB8fCBlLFxuICAgICAgICAgIGNsaWVudFkgPSBfcmVmMi5jbGllbnRZO1xuICAgICAgdmFyIGggPSAxIC0gKGNsaWVudFkgLSBmaWVsZFJlY3QudG9wKSAvIChmaWVsZFJlY3QuYm90dG9tIC0gZmllbGRSZWN0LnRvcCk7XG4gICAgICBpZiAoaCA+IDEpIHtcbiAgICAgICAgaCA9IDE7XG4gICAgICB9IGVsc2UgaWYgKGggPCAwKSB7XG4gICAgICAgIGggPSAwO1xuICAgICAgfVxuICAgICAgX3RoaXMuX19jb2xvci5oID0gaCAqIDM2MDtcbiAgICAgIF90aGlzLnNldFZhbHVlKF90aGlzLl9fY29sb3IudG9PcmlnaW5hbCgpKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIF90aGlzMjtcbiAgfVxuICBjcmVhdGVDbGFzcyhDb2xvckNvbnRyb2xsZXIsIFt7XG4gICAga2V5OiAndXBkYXRlRGlzcGxheScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgICB2YXIgaSA9IGludGVycHJldCh0aGlzLmdldFZhbHVlKCkpO1xuICAgICAgaWYgKGkgIT09IGZhbHNlKSB7XG4gICAgICAgIHZhciBtaXNtYXRjaCA9IGZhbHNlO1xuICAgICAgICBDb21tb24uZWFjaChDb2xvci5DT01QT05FTlRTLCBmdW5jdGlvbiAoY29tcG9uZW50KSB7XG4gICAgICAgICAgaWYgKCFDb21tb24uaXNVbmRlZmluZWQoaVtjb21wb25lbnRdKSAmJiAhQ29tbW9uLmlzVW5kZWZpbmVkKHRoaXMuX19jb2xvci5fX3N0YXRlW2NvbXBvbmVudF0pICYmIGlbY29tcG9uZW50XSAhPT0gdGhpcy5fX2NvbG9yLl9fc3RhdGVbY29tcG9uZW50XSkge1xuICAgICAgICAgICAgbWlzbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGlmIChtaXNtYXRjaCkge1xuICAgICAgICAgIENvbW1vbi5leHRlbmQodGhpcy5fX2NvbG9yLl9fc3RhdGUsIGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBDb21tb24uZXh0ZW5kKHRoaXMuX190ZW1wLl9fc3RhdGUsIHRoaXMuX19jb2xvci5fX3N0YXRlKTtcbiAgICAgIHRoaXMuX190ZW1wLmEgPSAxO1xuICAgICAgdmFyIGZsaXAgPSB0aGlzLl9fY29sb3IudiA8IDAuNSB8fCB0aGlzLl9fY29sb3IucyA+IDAuNSA/IDI1NSA6IDA7XG4gICAgICB2YXIgX2ZsaXAgPSAyNTUgLSBmbGlwO1xuICAgICAgQ29tbW9uLmV4dGVuZCh0aGlzLl9fZmllbGRfa25vYi5zdHlsZSwge1xuICAgICAgICBtYXJnaW5MZWZ0OiAxMDAgKiB0aGlzLl9fY29sb3IucyAtIDcgKyAncHgnLFxuICAgICAgICBtYXJnaW5Ub3A6IDEwMCAqICgxIC0gdGhpcy5fX2NvbG9yLnYpIC0gNyArICdweCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5fX3RlbXAudG9IZXhTdHJpbmcoKSxcbiAgICAgICAgYm9yZGVyOiB0aGlzLl9fZmllbGRfa25vYl9ib3JkZXIgKyAncmdiKCcgKyBmbGlwICsgJywnICsgZmxpcCArICcsJyArIGZsaXAgKyAnKSdcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fX2h1ZV9rbm9iLnN0eWxlLm1hcmdpblRvcCA9ICgxIC0gdGhpcy5fX2NvbG9yLmggLyAzNjApICogMTAwICsgJ3B4JztcbiAgICAgIHRoaXMuX190ZW1wLnMgPSAxO1xuICAgICAgdGhpcy5fX3RlbXAudiA9IDE7XG4gICAgICBsaW5lYXJHcmFkaWVudCh0aGlzLl9fc2F0dXJhdGlvbl9maWVsZCwgJ2xlZnQnLCAnI2ZmZicsIHRoaXMuX190ZW1wLnRvSGV4U3RyaW5nKCkpO1xuICAgICAgdGhpcy5fX2lucHV0LnZhbHVlID0gdGhpcy5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgICBDb21tb24uZXh0ZW5kKHRoaXMuX19pbnB1dC5zdHlsZSwge1xuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHRoaXMuX19jb2xvci50b0hleFN0cmluZygpLFxuICAgICAgICBjb2xvcjogJ3JnYignICsgZmxpcCArICcsJyArIGZsaXAgKyAnLCcgKyBmbGlwICsgJyknLFxuICAgICAgICB0ZXh0U2hhZG93OiB0aGlzLl9faW5wdXRfdGV4dFNoYWRvdyArICdyZ2JhKCcgKyBfZmxpcCArICcsJyArIF9mbGlwICsgJywnICsgX2ZsaXAgKyAnLC43KSdcbiAgICAgIH0pO1xuICAgIH1cbiAgfV0pO1xuICByZXR1cm4gQ29sb3JDb250cm9sbGVyO1xufShDb250cm9sbGVyKTtcbnZhciB2ZW5kb3JzID0gWyctbW96LScsICctby0nLCAnLXdlYmtpdC0nLCAnLW1zLScsICcnXTtcbmZ1bmN0aW9uIGxpbmVhckdyYWRpZW50KGVsZW0sIHgsIGEsIGIpIHtcbiAgZWxlbS5zdHlsZS5iYWNrZ3JvdW5kID0gJyc7XG4gIENvbW1vbi5lYWNoKHZlbmRvcnMsIGZ1bmN0aW9uICh2ZW5kb3IpIHtcbiAgICBlbGVtLnN0eWxlLmNzc1RleHQgKz0gJ2JhY2tncm91bmQ6ICcgKyB2ZW5kb3IgKyAnbGluZWFyLWdyYWRpZW50KCcgKyB4ICsgJywgJyArIGEgKyAnIDAlLCAnICsgYiArICcgMTAwJSk7ICc7XG4gIH0pO1xufVxuZnVuY3Rpb24gaHVlR3JhZGllbnQoZWxlbSkge1xuICBlbGVtLnN0eWxlLmJhY2tncm91bmQgPSAnJztcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtbW96LWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCAjZmYwMGZmIDE3JSwgIzAwMDBmZiAzNCUsICMwMGZmZmYgNTAlLCAjMDBmZjAwIDY3JSwgI2ZmZmYwMCA4NCUsICNmZjAwMDAgMTAwJSk7JztcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7JztcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiAtby1saW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOyc7XG4gIGVsZW0uc3R5bGUuY3NzVGV4dCArPSAnYmFja2dyb3VuZDogLW1zLWxpbmVhci1ncmFkaWVudCh0b3AsICAjZmYwMDAwIDAlLCNmZjAwZmYgMTclLCMwMDAwZmYgMzQlLCMwMGZmZmYgNTAlLCMwMGZmMDAgNjclLCNmZmZmMDAgODQlLCNmZjAwMDAgMTAwJSk7JztcbiAgZWxlbS5zdHlsZS5jc3NUZXh0ICs9ICdiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG9wLCAgI2ZmMDAwMCAwJSwjZmYwMGZmIDE3JSwjMDAwMGZmIDM0JSwjMDBmZmZmIDUwJSwjMDBmZjAwIDY3JSwjZmZmZjAwIDg0JSwjZmYwMDAwIDEwMCUpOyc7XG59XG5cbnZhciBjc3MgPSB7XG4gIGxvYWQ6IGZ1bmN0aW9uIGxvYWQodXJsLCBpbmRvYykge1xuICAgIHZhciBkb2MgPSBpbmRvYyB8fCBkb2N1bWVudDtcbiAgICB2YXIgbGluayA9IGRvYy5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGluay50eXBlID0gJ3RleHQvY3NzJztcbiAgICBsaW5rLnJlbCA9ICdzdHlsZXNoZWV0JztcbiAgICBsaW5rLmhyZWYgPSB1cmw7XG4gICAgZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQobGluayk7XG4gIH0sXG4gIGluamVjdDogZnVuY3Rpb24gaW5qZWN0KGNzc0NvbnRlbnQsIGluZG9jKSB7XG4gICAgdmFyIGRvYyA9IGluZG9jIHx8IGRvY3VtZW50O1xuICAgIHZhciBpbmplY3RlZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgaW5qZWN0ZWQudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgaW5qZWN0ZWQuaW5uZXJIVE1MID0gY3NzQ29udGVudDtcbiAgICB2YXIgaGVhZCA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIHRyeSB7XG4gICAgICBoZWFkLmFwcGVuZENoaWxkKGluamVjdGVkKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgfVxuICB9XG59O1xuXG52YXIgc2F2ZURpYWxvZ0NvbnRlbnRzID0gXCI8ZGl2IGlkPVxcXCJkZy1zYXZlXFxcIiBjbGFzcz1cXFwiZGcgZGlhbG9ndWVcXFwiPlxcblxcbiAgSGVyZSdzIHRoZSBuZXcgbG9hZCBwYXJhbWV0ZXIgZm9yIHlvdXIgPGNvZGU+R1VJPC9jb2RlPidzIGNvbnN0cnVjdG9yOlxcblxcbiAgPHRleHRhcmVhIGlkPVxcXCJkZy1uZXctY29uc3RydWN0b3JcXFwiPjwvdGV4dGFyZWE+XFxuXFxuICA8ZGl2IGlkPVxcXCJkZy1zYXZlLWxvY2FsbHlcXFwiPlxcblxcbiAgICA8aW5wdXQgaWQ9XFxcImRnLWxvY2FsLXN0b3JhZ2VcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIi8+IEF1dG9tYXRpY2FsbHkgc2F2ZVxcbiAgICB2YWx1ZXMgdG8gPGNvZGU+bG9jYWxTdG9yYWdlPC9jb2RlPiBvbiBleGl0LlxcblxcbiAgICA8ZGl2IGlkPVxcXCJkZy1sb2NhbC1leHBsYWluXFxcIj5UaGUgdmFsdWVzIHNhdmVkIHRvIDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gd2lsbFxcbiAgICAgIG92ZXJyaWRlIHRob3NlIHBhc3NlZCB0byA8Y29kZT5kYXQuR1VJPC9jb2RlPidzIGNvbnN0cnVjdG9yLiBUaGlzIG1ha2VzIGl0XFxuICAgICAgZWFzaWVyIHRvIHdvcmsgaW5jcmVtZW50YWxseSwgYnV0IDxjb2RlPmxvY2FsU3RvcmFnZTwvY29kZT4gaXMgZnJhZ2lsZSxcXG4gICAgICBhbmQgeW91ciBmcmllbmRzIG1heSBub3Qgc2VlIHRoZSBzYW1lIHZhbHVlcyB5b3UgZG8uXFxuXFxuICAgIDwvZGl2PlxcblxcbiAgPC9kaXY+XFxuXFxuPC9kaXY+XCI7XG5cbnZhciBDb250cm9sbGVyRmFjdG9yeSA9IGZ1bmN0aW9uIENvbnRyb2xsZXJGYWN0b3J5KG9iamVjdCwgcHJvcGVydHkpIHtcbiAgdmFyIGluaXRpYWxWYWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gIGlmIChDb21tb24uaXNBcnJheShhcmd1bWVudHNbMl0pIHx8IENvbW1vbi5pc09iamVjdChhcmd1bWVudHNbMl0pKSB7XG4gICAgcmV0dXJuIG5ldyBPcHRpb25Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSk7XG4gIH1cbiAgaWYgKENvbW1vbi5pc051bWJlcihpbml0aWFsVmFsdWUpKSB7XG4gICAgaWYgKENvbW1vbi5pc051bWJlcihhcmd1bWVudHNbMl0pICYmIENvbW1vbi5pc051bWJlcihhcmd1bWVudHNbM10pKSB7XG4gICAgICBpZiAoQ29tbW9uLmlzTnVtYmVyKGFyZ3VtZW50c1s0XSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyU2xpZGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdLCBhcmd1bWVudHNbNF0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyU2xpZGVyKG9iamVjdCwgcHJvcGVydHksIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcbiAgICB9XG4gICAgaWYgKENvbW1vbi5pc051bWJlcihhcmd1bWVudHNbNF0pKSB7XG4gICAgICByZXR1cm4gbmV3IE51bWJlckNvbnRyb2xsZXJCb3gob2JqZWN0LCBwcm9wZXJ0eSwgeyBtaW46IGFyZ3VtZW50c1syXSwgbWF4OiBhcmd1bWVudHNbM10sIHN0ZXA6IGFyZ3VtZW50c1s0XSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBOdW1iZXJDb250cm9sbGVyQm94KG9iamVjdCwgcHJvcGVydHksIHsgbWluOiBhcmd1bWVudHNbMl0sIG1heDogYXJndW1lbnRzWzNdIH0pO1xuICB9XG4gIGlmIChDb21tb24uaXNTdHJpbmcoaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgU3RyaW5nQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfVxuICBpZiAoQ29tbW9uLmlzRnVuY3Rpb24oaW5pdGlhbFZhbHVlKSkge1xuICAgIHJldHVybiBuZXcgRnVuY3Rpb25Db250cm9sbGVyKG9iamVjdCwgcHJvcGVydHksICcnKTtcbiAgfVxuICBpZiAoQ29tbW9uLmlzQm9vbGVhbihpbml0aWFsVmFsdWUpKSB7XG4gICAgcmV0dXJuIG5ldyBCb29sZWFuQ29udHJvbGxlcihvYmplY3QsIHByb3BlcnR5KTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbmZ1bmN0aW9uIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xufVxudmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHJlcXVlc3RBbmltYXRpb25GcmFtZTtcblxudmFyIENlbnRlcmVkRGl2ID0gZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBDZW50ZXJlZERpdigpIHtcbiAgICBjbGFzc0NhbGxDaGVjayh0aGlzLCBDZW50ZXJlZERpdik7XG4gICAgdGhpcy5iYWNrZ3JvdW5kRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIENvbW1vbi5leHRlbmQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZSwge1xuICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLDAsMCwwLjgpJyxcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBkaXNwbGF5OiAnbm9uZScsXG4gICAgICB6SW5kZXg6ICcxMDAwJyxcbiAgICAgIG9wYWNpdHk6IDAsXG4gICAgICBXZWJraXRUcmFuc2l0aW9uOiAnb3BhY2l0eSAwLjJzIGxpbmVhcicsXG4gICAgICB0cmFuc2l0aW9uOiAnb3BhY2l0eSAwLjJzIGxpbmVhcidcbiAgICB9KTtcbiAgICBkb20ubWFrZUZ1bGxzY3JlZW4odGhpcy5iYWNrZ3JvdW5kRWxlbWVudCk7XG4gICAgdGhpcy5iYWNrZ3JvdW5kRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgdGhpcy5kb21FbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgQ29tbW9uLmV4dGVuZCh0aGlzLmRvbUVsZW1lbnQuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgZGlzcGxheTogJ25vbmUnLFxuICAgICAgekluZGV4OiAnMTAwMScsXG4gICAgICBvcGFjaXR5OiAwLFxuICAgICAgV2Via2l0VHJhbnNpdGlvbjogJy13ZWJraXQtdHJhbnNmb3JtIDAuMnMgZWFzZS1vdXQsIG9wYWNpdHkgMC4ycyBsaW5lYXInLFxuICAgICAgdHJhbnNpdGlvbjogJ3RyYW5zZm9ybSAwLjJzIGVhc2Utb3V0LCBvcGFjaXR5IDAuMnMgbGluZWFyJ1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudCk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRvbUVsZW1lbnQpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgZG9tLmJpbmQodGhpcy5iYWNrZ3JvdW5kRWxlbWVudCwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgX3RoaXMuaGlkZSgpO1xuICAgIH0pO1xuICB9XG4gIGNyZWF0ZUNsYXNzKENlbnRlcmVkRGl2LCBbe1xuICAgIGtleTogJ3Nob3cnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzaG93KCkge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEuMSknO1xuICAgICAgdGhpcy5sYXlvdXQoKTtcbiAgICAgIENvbW1vbi5kZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aGlzLmJhY2tncm91bmRFbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgICAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAxO1xuICAgICAgICBfdGhpcy5kb21FbGVtZW50LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICdzY2FsZSgxKSc7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdoaWRlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gaGlkZSgpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgaGlkZSA9IGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgICAgIF90aGlzLmRvbUVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgX3RoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgZG9tLnVuYmluZChfdGhpcy5kb21FbGVtZW50LCAnd2Via2l0VHJhbnNpdGlvbkVuZCcsIGhpZGUpO1xuICAgICAgICBkb20udW5iaW5kKF90aGlzLmRvbUVsZW1lbnQsICd0cmFuc2l0aW9uZW5kJywgaGlkZSk7XG4gICAgICAgIGRvbS51bmJpbmQoX3RoaXMuZG9tRWxlbWVudCwgJ29UcmFuc2l0aW9uRW5kJywgaGlkZSk7XG4gICAgICB9O1xuICAgICAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAnd2Via2l0VHJhbnNpdGlvbkVuZCcsIGhpZGUpO1xuICAgICAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAndHJhbnNpdGlvbmVuZCcsIGhpZGUpO1xuICAgICAgZG9tLmJpbmQodGhpcy5kb21FbGVtZW50LCAnb1RyYW5zaXRpb25FbmQnLCBoaWRlKTtcbiAgICAgIHRoaXMuYmFja2dyb3VuZEVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gJ3NjYWxlKDEuMSknO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2xheW91dCcsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGxheW91dCgpIHtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS5sZWZ0ID0gd2luZG93LmlubmVyV2lkdGggLyAyIC0gZG9tLmdldFdpZHRoKHRoaXMuZG9tRWxlbWVudCkgLyAyICsgJ3B4JztcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5zdHlsZS50b3AgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gZG9tLmdldEhlaWdodCh0aGlzLmRvbUVsZW1lbnQpIC8gMiArICdweCc7XG4gICAgfVxuICB9XSk7XG4gIHJldHVybiBDZW50ZXJlZERpdjtcbn0oKTtcblxudmFyIHN0eWxlU2hlZXQgPSBfX18kaW5zZXJ0U3R5bGUoXCIuZGcgdWx7bGlzdC1zdHlsZTpub25lO21hcmdpbjowO3BhZGRpbmc6MDt3aWR0aDoxMDAlO2NsZWFyOmJvdGh9LmRnLmFje3Bvc2l0aW9uOmZpeGVkO3RvcDowO2xlZnQ6MDtyaWdodDowO2hlaWdodDowO3otaW5kZXg6MH0uZGc6bm90KC5hYykgLm1haW57b3ZlcmZsb3c6aGlkZGVufS5kZy5tYWluey13ZWJraXQtdHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXI7LW8tdHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXI7LW1vei10cmFuc2l0aW9uOm9wYWNpdHkgLjFzIGxpbmVhcjt0cmFuc2l0aW9uOm9wYWNpdHkgLjFzIGxpbmVhcn0uZGcubWFpbi50YWxsZXItdGhhbi13aW5kb3d7b3ZlcmZsb3cteTphdXRvfS5kZy5tYWluLnRhbGxlci10aGFuLXdpbmRvdyAuY2xvc2UtYnV0dG9ue29wYWNpdHk6MTttYXJnaW4tdG9wOi0xcHg7Ym9yZGVyLXRvcDoxcHggc29saWQgIzJjMmMyY30uZGcubWFpbiB1bC5jbG9zZWQgLmNsb3NlLWJ1dHRvbntvcGFjaXR5OjEgIWltcG9ydGFudH0uZGcubWFpbjpob3ZlciAuY2xvc2UtYnV0dG9uLC5kZy5tYWluIC5jbG9zZS1idXR0b24uZHJhZ3tvcGFjaXR5OjF9LmRnLm1haW4gLmNsb3NlLWJ1dHRvbnstd2Via2l0LXRyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyOy1vLXRyYW5zaXRpb246b3BhY2l0eSAuMXMgbGluZWFyOy1tb3otdHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXI7dHJhbnNpdGlvbjpvcGFjaXR5IC4xcyBsaW5lYXI7Ym9yZGVyOjA7bGluZS1oZWlnaHQ6MTlweDtoZWlnaHQ6MjBweDtjdXJzb3I6cG9pbnRlcjt0ZXh0LWFsaWduOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiMwMDB9LmRnLm1haW4gLmNsb3NlLWJ1dHRvbi5jbG9zZS10b3B7cG9zaXRpb246cmVsYXRpdmV9LmRnLm1haW4gLmNsb3NlLWJ1dHRvbi5jbG9zZS1ib3R0b217cG9zaXRpb246YWJzb2x1dGV9LmRnLm1haW4gLmNsb3NlLWJ1dHRvbjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMxMTF9LmRnLmF7ZmxvYXQ6cmlnaHQ7bWFyZ2luLXJpZ2h0OjE1cHg7b3ZlcmZsb3cteTp2aXNpYmxlfS5kZy5hLmhhcy1zYXZlPnVsLmNsb3NlLXRvcHttYXJnaW4tdG9wOjB9LmRnLmEuaGFzLXNhdmU+dWwuY2xvc2UtYm90dG9te21hcmdpbi10b3A6MjdweH0uZGcuYS5oYXMtc2F2ZT51bC5jbG9zZWR7bWFyZ2luLXRvcDowfS5kZy5hIC5zYXZlLXJvd3t0b3A6MDt6LWluZGV4OjEwMDJ9LmRnLmEgLnNhdmUtcm93LmNsb3NlLXRvcHtwb3NpdGlvbjpyZWxhdGl2ZX0uZGcuYSAuc2F2ZS1yb3cuY2xvc2UtYm90dG9te3Bvc2l0aW9uOmZpeGVkfS5kZyBsaXstd2Via2l0LXRyYW5zaXRpb246aGVpZ2h0IC4xcyBlYXNlLW91dDstby10cmFuc2l0aW9uOmhlaWdodCAuMXMgZWFzZS1vdXQ7LW1vei10cmFuc2l0aW9uOmhlaWdodCAuMXMgZWFzZS1vdXQ7dHJhbnNpdGlvbjpoZWlnaHQgLjFzIGVhc2Utb3V0Oy13ZWJraXQtdHJhbnNpdGlvbjpvdmVyZmxvdyAuMXMgbGluZWFyOy1vLXRyYW5zaXRpb246b3ZlcmZsb3cgLjFzIGxpbmVhcjstbW96LXRyYW5zaXRpb246b3ZlcmZsb3cgLjFzIGxpbmVhcjt0cmFuc2l0aW9uOm92ZXJmbG93IC4xcyBsaW5lYXJ9LmRnIGxpOm5vdCguZm9sZGVyKXtjdXJzb3I6YXV0bztoZWlnaHQ6MjdweDtsaW5lLWhlaWdodDoyN3B4O3BhZGRpbmc6MCA0cHggMCA1cHh9LmRnIGxpLmZvbGRlcntwYWRkaW5nOjA7Ym9yZGVyLWxlZnQ6NHB4IHNvbGlkIHJnYmEoMCwwLDAsMCl9LmRnIGxpLnRpdGxle2N1cnNvcjpwb2ludGVyO21hcmdpbi1sZWZ0Oi00cHh9LmRnIC5jbG9zZWQgbGk6bm90KC50aXRsZSksLmRnIC5jbG9zZWQgdWwgbGksLmRnIC5jbG9zZWQgdWwgbGk+KntoZWlnaHQ6MDtvdmVyZmxvdzpoaWRkZW47Ym9yZGVyOjB9LmRnIC5jcntjbGVhcjpib3RoO3BhZGRpbmctbGVmdDozcHg7aGVpZ2h0OjI3cHg7b3ZlcmZsb3c6aGlkZGVufS5kZyAucHJvcGVydHktbmFtZXtjdXJzb3I6ZGVmYXVsdDtmbG9hdDpsZWZ0O2NsZWFyOmxlZnQ7d2lkdGg6NDAlO292ZXJmbG93OmhpZGRlbjt0ZXh0LW92ZXJmbG93OmVsbGlwc2lzfS5kZyAuY3tmbG9hdDpsZWZ0O3dpZHRoOjYwJTtwb3NpdGlvbjpyZWxhdGl2ZX0uZGcgLmMgaW5wdXRbdHlwZT10ZXh0XXtib3JkZXI6MDttYXJnaW4tdG9wOjRweDtwYWRkaW5nOjNweDt3aWR0aDoxMDAlO2Zsb2F0OnJpZ2h0fS5kZyAuaGFzLXNsaWRlciBpbnB1dFt0eXBlPXRleHRde3dpZHRoOjMwJTttYXJnaW4tbGVmdDowfS5kZyAuc2xpZGVye2Zsb2F0OmxlZnQ7d2lkdGg6NjYlO21hcmdpbi1sZWZ0Oi01cHg7bWFyZ2luLXJpZ2h0OjA7aGVpZ2h0OjE5cHg7bWFyZ2luLXRvcDo0cHh9LmRnIC5zbGlkZXItZmd7aGVpZ2h0OjEwMCV9LmRnIC5jIGlucHV0W3R5cGU9Y2hlY2tib3hde21hcmdpbi10b3A6N3B4fS5kZyAuYyBzZWxlY3R7bWFyZ2luLXRvcDo1cHh9LmRnIC5jci5mdW5jdGlvbiwuZGcgLmNyLmZ1bmN0aW9uIC5wcm9wZXJ0eS1uYW1lLC5kZyAuY3IuZnVuY3Rpb24gKiwuZGcgLmNyLmJvb2xlYW4sLmRnIC5jci5ib29sZWFuICp7Y3Vyc29yOnBvaW50ZXJ9LmRnIC5jci5jb2xvcntvdmVyZmxvdzp2aXNpYmxlfS5kZyAuc2VsZWN0b3J7ZGlzcGxheTpub25lO3Bvc2l0aW9uOmFic29sdXRlO21hcmdpbi1sZWZ0Oi05cHg7bWFyZ2luLXRvcDoyM3B4O3otaW5kZXg6MTB9LmRnIC5jOmhvdmVyIC5zZWxlY3RvciwuZGcgLnNlbGVjdG9yLmRyYWd7ZGlzcGxheTpibG9ja30uZGcgbGkuc2F2ZS1yb3d7cGFkZGluZzowfS5kZyBsaS5zYXZlLXJvdyAuYnV0dG9ue2Rpc3BsYXk6aW5saW5lLWJsb2NrO3BhZGRpbmc6MHB4IDZweH0uZGcuZGlhbG9ndWV7YmFja2dyb3VuZC1jb2xvcjojMjIyO3dpZHRoOjQ2MHB4O3BhZGRpbmc6MTVweDtmb250LXNpemU6MTNweDtsaW5lLWhlaWdodDoxNXB4fSNkZy1uZXctY29uc3RydWN0b3J7cGFkZGluZzoxMHB4O2NvbG9yOiMyMjI7Zm9udC1mYW1pbHk6TW9uYWNvLCBtb25vc3BhY2U7Zm9udC1zaXplOjEwcHg7Ym9yZGVyOjA7cmVzaXplOm5vbmU7Ym94LXNoYWRvdzppbnNldCAxcHggMXB4IDFweCAjODg4O3dvcmQtd3JhcDpicmVhay13b3JkO21hcmdpbjoxMnB4IDA7ZGlzcGxheTpibG9jazt3aWR0aDo0NDBweDtvdmVyZmxvdy15OnNjcm9sbDtoZWlnaHQ6MTAwcHg7cG9zaXRpb246cmVsYXRpdmV9I2RnLWxvY2FsLWV4cGxhaW57ZGlzcGxheTpub25lO2ZvbnQtc2l6ZToxMXB4O2xpbmUtaGVpZ2h0OjE3cHg7Ym9yZGVyLXJhZGl1czozcHg7YmFja2dyb3VuZC1jb2xvcjojMzMzO3BhZGRpbmc6OHB4O21hcmdpbi10b3A6MTBweH0jZGctbG9jYWwtZXhwbGFpbiBjb2Rle2ZvbnQtc2l6ZToxMHB4fSNkYXQtZ3VpLXNhdmUtbG9jYWxseXtkaXNwbGF5Om5vbmV9LmRne2NvbG9yOiNlZWU7Zm9udDoxMXB4ICdMdWNpZGEgR3JhbmRlJywgc2Fucy1zZXJpZjt0ZXh0LXNoYWRvdzowIC0xcHggMCAjMTExfS5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhcnt3aWR0aDo1cHg7YmFja2dyb3VuZDojMWExYTFhfS5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci1jb3JuZXJ7aGVpZ2h0OjA7ZGlzcGxheTpub25lfS5kZy5tYWluOjotd2Via2l0LXNjcm9sbGJhci10aHVtYntib3JkZXItcmFkaXVzOjVweDtiYWNrZ3JvdW5kOiM2NzY3Njd9LmRnIGxpOm5vdCguZm9sZGVyKXtiYWNrZ3JvdW5kOiMxYTFhMWE7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgIzJjMmMyY30uZGcgbGkuc2F2ZS1yb3d7bGluZS1oZWlnaHQ6MjVweDtiYWNrZ3JvdW5kOiNkYWQ1Y2I7Ym9yZGVyOjB9LmRnIGxpLnNhdmUtcm93IHNlbGVjdHttYXJnaW4tbGVmdDo1cHg7d2lkdGg6MTA4cHh9LmRnIGxpLnNhdmUtcm93IC5idXR0b257bWFyZ2luLWxlZnQ6NXB4O21hcmdpbi10b3A6MXB4O2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTo5cHg7bGluZS1oZWlnaHQ6N3B4O3BhZGRpbmc6NHB4IDRweCA1cHggNHB4O2JhY2tncm91bmQ6I2M1YmRhZDtjb2xvcjojZmZmO3RleHQtc2hhZG93OjAgMXB4IDAgI2IwYTU4Zjtib3gtc2hhZG93OjAgLTFweCAwICNiMGE1OGY7Y3Vyc29yOnBvaW50ZXJ9LmRnIGxpLnNhdmUtcm93IC5idXR0b24uZ2VhcnN7YmFja2dyb3VuZDojYzViZGFkIHVybChkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFzQUFBQU5DQVlBQUFCLzlaUTdBQUFBR1hSRldIUlRiMlowZDJGeVpRQkJaRzlpWlNCSmJXRm5aVkpsWVdSNWNjbGxQQUFBQVFKSlJFRlVlTnBpWUtBVS9QLy9Qd0dJQy9BcENBQmlCU0FXK0k4QUNsQWNnS3hRNFQ5aG9NQUVVcnh4MlFTR042K2VnRFgrL3ZXVDRlN044MkFNWW9QQXgvZXZ3V29Zb1NZYkFDWDJzN0t4Q3h6Y3NlekRoM2V2Rm9ERUJZVEVFcXljZ2dXQXpBOUF1VVNRUWdlWVBhOWZQdjYvWVdtL0FjeDVJUGI3dHkvZncrUVpibHc2N3ZEczhSMFlIeVFoZ09ieCt5QUprQnFtRzVkUFBEaDFhUE9HUi9ldWdXMEc0dmxJb1RJZnlGY0ErUWVraGhISmhQZFF4YmlBSWd1TUJUUVpyUEQ3MTA4TTZyb1dZREZRaUlBQXY2QW93LzFiRndYZ2lzK2YyTFVBeW53b0lhTmN6OFhOeDNEbDdNRUpVREdRcHg5Z3RROFlDdWVCK0QyNk9FQ0FBUURhZHQ3ZTQ2RDQyUUFBQUFCSlJVNUVya0pnZ2c9PSkgMnB4IDFweCBuby1yZXBlYXQ7aGVpZ2h0OjdweDt3aWR0aDo4cHh9LmRnIGxpLnNhdmUtcm93IC5idXR0b246aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojYmFiMTllO2JveC1zaGFkb3c6MCAtMXB4IDAgI2IwYTU4Zn0uZGcgbGkuZm9sZGVye2JvcmRlci1ib3R0b206MH0uZGcgbGkudGl0bGV7cGFkZGluZy1sZWZ0OjE2cHg7YmFja2dyb3VuZDojMDAwIHVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhCUUFGQUpFQUFQLy8vL1B6OC8vLy8vLy8veUg1QkFFQUFBSUFMQUFBQUFBRkFBVUFBQUlJbEkraEtnRnhvQ2dBT3c9PSkgNnB4IDEwcHggbm8tcmVwZWF0O2N1cnNvcjpwb2ludGVyO2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX0uZGcgLmNsb3NlZCBsaS50aXRsZXtiYWNrZ3JvdW5kLWltYWdlOnVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhCUUFGQUpFQUFQLy8vL1B6OC8vLy8vLy8veUg1QkFFQUFBSUFMQUFBQUFBRkFBVUFBQUlJbEdJV3FNQ2JXQUVBT3c9PSl9LmRnIC5jci5ib29sZWFue2JvcmRlci1sZWZ0OjNweCBzb2xpZCAjODA2Nzg3fS5kZyAuY3IuY29sb3J7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkfS5kZyAuY3IuZnVuY3Rpb257Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkICNlNjFkNWZ9LmRnIC5jci5udW1iZXJ7Ym9yZGVyLWxlZnQ6M3B4IHNvbGlkICMyRkExRDZ9LmRnIC5jci5udW1iZXIgaW5wdXRbdHlwZT10ZXh0XXtjb2xvcjojMkZBMUQ2fS5kZyAuY3Iuc3RyaW5ne2JvcmRlci1sZWZ0OjNweCBzb2xpZCAjMWVkMzZmfS5kZyAuY3Iuc3RyaW5nIGlucHV0W3R5cGU9dGV4dF17Y29sb3I6IzFlZDM2Zn0uZGcgLmNyLmZ1bmN0aW9uOmhvdmVyLC5kZyAuY3IuYm9vbGVhbjpob3ZlcntiYWNrZ3JvdW5kOiMxMTF9LmRnIC5jIGlucHV0W3R5cGU9dGV4dF17YmFja2dyb3VuZDojMzAzMDMwO291dGxpbmU6bm9uZX0uZGcgLmMgaW5wdXRbdHlwZT10ZXh0XTpob3ZlcntiYWNrZ3JvdW5kOiMzYzNjM2N9LmRnIC5jIGlucHV0W3R5cGU9dGV4dF06Zm9jdXN7YmFja2dyb3VuZDojNDk0OTQ5O2NvbG9yOiNmZmZ9LmRnIC5jIC5zbGlkZXJ7YmFja2dyb3VuZDojMzAzMDMwO2N1cnNvcjpldy1yZXNpemV9LmRnIC5jIC5zbGlkZXItZmd7YmFja2dyb3VuZDojMkZBMUQ2O21heC13aWR0aDoxMDAlfS5kZyAuYyAuc2xpZGVyOmhvdmVye2JhY2tncm91bmQ6IzNjM2MzY30uZGcgLmMgLnNsaWRlcjpob3ZlciAuc2xpZGVyLWZne2JhY2tncm91bmQ6IzQ0YWJkYX1cXG5cIik7XG5cbmNzcy5pbmplY3Qoc3R5bGVTaGVldCk7XG52YXIgQ1NTX05BTUVTUEFDRSA9ICdkZyc7XG52YXIgSElERV9LRVlfQ09ERSA9IDcyO1xudmFyIENMT1NFX0JVVFRPTl9IRUlHSFQgPSAyMDtcbnZhciBERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUUgPSAnRGVmYXVsdCc7XG52YXIgU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSA9IGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gISF3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59KCk7XG52YXIgU0FWRV9ESUFMT0dVRSA9IHZvaWQgMDtcbnZhciBhdXRvUGxhY2VWaXJnaW4gPSB0cnVlO1xudmFyIGF1dG9QbGFjZUNvbnRhaW5lciA9IHZvaWQgMDtcbnZhciBoaWRlID0gZmFsc2U7XG52YXIgaGlkZWFibGVHdWlzID0gW107XG52YXIgR1VJID0gZnVuY3Rpb24gR1VJKHBhcnMpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdmFyIHBhcmFtcyA9IHBhcnMgfHwge307XG4gIHRoaXMuZG9tRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB0aGlzLl9fdWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICB0aGlzLmRvbUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fX3VsKTtcbiAgZG9tLmFkZENsYXNzKHRoaXMuZG9tRWxlbWVudCwgQ1NTX05BTUVTUEFDRSk7XG4gIHRoaXMuX19mb2xkZXJzID0ge307XG4gIHRoaXMuX19jb250cm9sbGVycyA9IFtdO1xuICB0aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMgPSBbXTtcbiAgdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVycyA9IFtdO1xuICB0aGlzLl9fbGlzdGVuaW5nID0gW107XG4gIHBhcmFtcyA9IENvbW1vbi5kZWZhdWx0cyhwYXJhbXMsIHtcbiAgICBjbG9zZU9uVG9wOiBmYWxzZSxcbiAgICBhdXRvUGxhY2U6IHRydWUsXG4gICAgd2lkdGg6IEdVSS5ERUZBVUxUX1dJRFRIXG4gIH0pO1xuICBwYXJhbXMgPSBDb21tb24uZGVmYXVsdHMocGFyYW1zLCB7XG4gICAgcmVzaXphYmxlOiBwYXJhbXMuYXV0b1BsYWNlLFxuICAgIGhpZGVhYmxlOiBwYXJhbXMuYXV0b1BsYWNlXG4gIH0pO1xuICBpZiAoIUNvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMubG9hZCkpIHtcbiAgICBpZiAocGFyYW1zLnByZXNldCkge1xuICAgICAgcGFyYW1zLmxvYWQucHJlc2V0ID0gcGFyYW1zLnByZXNldDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcGFyYW1zLmxvYWQgPSB7IHByZXNldDogREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FIH07XG4gIH1cbiAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSAmJiBwYXJhbXMuaGlkZWFibGUpIHtcbiAgICBoaWRlYWJsZUd1aXMucHVzaCh0aGlzKTtcbiAgfVxuICBwYXJhbXMucmVzaXphYmxlID0gQ29tbW9uLmlzVW5kZWZpbmVkKHBhcmFtcy5wYXJlbnQpICYmIHBhcmFtcy5yZXNpemFibGU7XG4gIGlmIChwYXJhbXMuYXV0b1BsYWNlICYmIENvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMuc2Nyb2xsYWJsZSkpIHtcbiAgICBwYXJhbXMuc2Nyb2xsYWJsZSA9IHRydWU7XG4gIH1cbiAgdmFyIHVzZUxvY2FsU3RvcmFnZSA9IFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UgJiYgbG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0TG9jYWxTdG9yYWdlSGFzaCh0aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnO1xuICB2YXIgc2F2ZVRvTG9jYWxTdG9yYWdlID0gdm9pZCAwO1xuICB2YXIgdGl0bGVSb3cgPSB2b2lkIDA7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsXG4gIHtcbiAgICBwYXJlbnQ6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLnBhcmVudDtcbiAgICAgIH1cbiAgICB9LFxuICAgIHNjcm9sbGFibGU6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLnNjcm9sbGFibGU7XG4gICAgICB9XG4gICAgfSxcbiAgICBhdXRvUGxhY2U6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLmF1dG9QbGFjZTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlT25Ub3A6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLmNsb3NlT25Ub3A7XG4gICAgICB9XG4gICAgfSxcbiAgICBwcmVzZXQ6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICBpZiAoX3RoaXMucGFyZW50KSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmdldFJvb3QoKS5wcmVzZXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcmFtcy5sb2FkLnByZXNldDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCQkMSh2KSB7XG4gICAgICAgIGlmIChfdGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICBfdGhpcy5nZXRSb290KCkucHJlc2V0ID0gdjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJhbXMubG9hZC5wcmVzZXQgPSB2O1xuICAgICAgICB9XG4gICAgICAgIHNldFByZXNldFNlbGVjdEluZGV4KHRoaXMpO1xuICAgICAgICBfdGhpcy5yZXZlcnQoKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHdpZHRoOiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uIGdldCQkMSgpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtcy53aWR0aDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCQkMSh2KSB7XG4gICAgICAgIHBhcmFtcy53aWR0aCA9IHY7XG4gICAgICAgIHNldFdpZHRoKF90aGlzLCB2KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLm5hbWU7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbiBzZXQkJDEodikge1xuICAgICAgICBwYXJhbXMubmFtZSA9IHY7XG4gICAgICAgIGlmICh0aXRsZVJvdykge1xuICAgICAgICAgIHRpdGxlUm93LmlubmVySFRNTCA9IHBhcmFtcy5uYW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjbG9zZWQ6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLmNsb3NlZDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldCQkMSh2KSB7XG4gICAgICAgIHBhcmFtcy5jbG9zZWQgPSB2O1xuICAgICAgICBpZiAocGFyYW1zLmNsb3NlZCkge1xuICAgICAgICAgIGRvbS5hZGRDbGFzcyhfdGhpcy5fX3VsLCBHVUkuQ0xBU1NfQ0xPU0VEKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoX3RoaXMuX191bCwgR1VJLkNMQVNTX0NMT1NFRCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuICAgICAgICBpZiAoX3RoaXMuX19jbG9zZUJ1dHRvbikge1xuICAgICAgICAgIF90aGlzLl9fY2xvc2VCdXR0b24uaW5uZXJIVE1MID0gdiA/IEdVSS5URVhUX09QRU4gOiBHVUkuVEVYVF9DTE9TRUQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGxvYWQ6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gcGFyYW1zLmxvYWQ7XG4gICAgICB9XG4gICAgfSxcbiAgICB1c2VMb2NhbFN0b3JhZ2U6IHtcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0JCQxKCkge1xuICAgICAgICByZXR1cm4gdXNlTG9jYWxTdG9yYWdlO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24gc2V0JCQxKGJvb2wpIHtcbiAgICAgICAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcbiAgICAgICAgICB1c2VMb2NhbFN0b3JhZ2UgPSBib29sO1xuICAgICAgICAgIGlmIChib29sKSB7XG4gICAgICAgICAgICBkb20uYmluZCh3aW5kb3csICd1bmxvYWQnLCBzYXZlVG9Mb2NhbFN0b3JhZ2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb20udW5iaW5kKHdpbmRvdywgJ3VubG9hZCcsIHNhdmVUb0xvY2FsU3RvcmFnZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goX3RoaXMsICdpc0xvY2FsJyksIGJvb2wpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChwYXJhbXMucGFyZW50KSkge1xuICAgIHRoaXMuY2xvc2VkID0gcGFyYW1zLmNsb3NlZCB8fCBmYWxzZTtcbiAgICBkb20uYWRkQ2xhc3ModGhpcy5kb21FbGVtZW50LCBHVUkuQ0xBU1NfTUFJTik7XG4gICAgZG9tLm1ha2VTZWxlY3RhYmxlKHRoaXMuZG9tRWxlbWVudCwgZmFsc2UpO1xuICAgIGlmIChTVVBQT1JUU19MT0NBTF9TVE9SQUdFKSB7XG4gICAgICBpZiAodXNlTG9jYWxTdG9yYWdlKSB7XG4gICAgICAgIF90aGlzLnVzZUxvY2FsU3RvcmFnZSA9IHRydWU7XG4gICAgICAgIHZhciBzYXZlZEd1aSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2godGhpcywgJ2d1aScpKTtcbiAgICAgICAgaWYgKHNhdmVkR3VpKSB7XG4gICAgICAgICAgcGFyYW1zLmxvYWQgPSBKU09OLnBhcnNlKHNhdmVkR3VpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9fY2xvc2VCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLl9fY2xvc2VCdXR0b24uaW5uZXJIVE1MID0gR1VJLlRFWFRfQ0xPU0VEO1xuICAgIGRvbS5hZGRDbGFzcyh0aGlzLl9fY2xvc2VCdXR0b24sIEdVSS5DTEFTU19DTE9TRV9CVVRUT04pO1xuICAgIGlmIChwYXJhbXMuY2xvc2VPblRvcCkge1xuICAgICAgZG9tLmFkZENsYXNzKHRoaXMuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0NMT1NFX1RPUCk7XG4gICAgICB0aGlzLmRvbUVsZW1lbnQuaW5zZXJ0QmVmb3JlKHRoaXMuX19jbG9zZUJ1dHRvbiwgdGhpcy5kb21FbGVtZW50LmNoaWxkTm9kZXNbMF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb20uYWRkQ2xhc3ModGhpcy5fX2Nsb3NlQnV0dG9uLCBHVUkuQ0xBU1NfQ0xPU0VfQk9UVE9NKTtcbiAgICAgIHRoaXMuZG9tRWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLl9fY2xvc2VCdXR0b24pO1xuICAgIH1cbiAgICBkb20uYmluZCh0aGlzLl9fY2xvc2VCdXR0b24sICdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIF90aGlzLmNsb3NlZCA9ICFfdGhpcy5jbG9zZWQ7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHBhcmFtcy5jbG9zZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFyYW1zLmNsb3NlZCA9IHRydWU7XG4gICAgfVxuICAgIHZhciB0aXRsZVJvd05hbWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYXJhbXMubmFtZSk7XG4gICAgZG9tLmFkZENsYXNzKHRpdGxlUm93TmFtZSwgJ2NvbnRyb2xsZXItbmFtZScpO1xuICAgIHRpdGxlUm93ID0gYWRkUm93KF90aGlzLCB0aXRsZVJvd05hbWUpO1xuICAgIHZhciBvbkNsaWNrVGl0bGUgPSBmdW5jdGlvbiBvbkNsaWNrVGl0bGUoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgX3RoaXMuY2xvc2VkID0gIV90aGlzLmNsb3NlZDtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIGRvbS5hZGRDbGFzcyh0aGlzLl9fdWwsIEdVSS5DTEFTU19DTE9TRUQpO1xuICAgIGRvbS5hZGRDbGFzcyh0aXRsZVJvdywgJ3RpdGxlJyk7XG4gICAgZG9tLmJpbmQodGl0bGVSb3csICdjbGljaycsIG9uQ2xpY2tUaXRsZSk7XG4gICAgaWYgKCFwYXJhbXMuY2xvc2VkKSB7XG4gICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBpZiAocGFyYW1zLmF1dG9QbGFjZSkge1xuICAgIGlmIChDb21tb24uaXNVbmRlZmluZWQocGFyYW1zLnBhcmVudCkpIHtcbiAgICAgIGlmIChhdXRvUGxhY2VWaXJnaW4pIHtcbiAgICAgICAgYXV0b1BsYWNlQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGRvbS5hZGRDbGFzcyhhdXRvUGxhY2VDb250YWluZXIsIENTU19OQU1FU1BBQ0UpO1xuICAgICAgICBkb20uYWRkQ2xhc3MoYXV0b1BsYWNlQ29udGFpbmVyLCBHVUkuQ0xBU1NfQVVUT19QTEFDRV9DT05UQUlORVIpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGF1dG9QbGFjZUNvbnRhaW5lcik7XG4gICAgICAgIGF1dG9QbGFjZVZpcmdpbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgYXV0b1BsYWNlQ29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZG9tRWxlbWVudCk7XG4gICAgICBkb20uYWRkQ2xhc3ModGhpcy5kb21FbGVtZW50LCBHVUkuQ0xBU1NfQVVUT19QTEFDRSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICAgIHNldFdpZHRoKF90aGlzLCBwYXJhbXMud2lkdGgpO1xuICAgIH1cbiAgfVxuICB0aGlzLl9fcmVzaXplSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBfdGhpcy5vblJlc2l6ZURlYm91bmNlZCgpO1xuICB9O1xuICBkb20uYmluZCh3aW5kb3csICdyZXNpemUnLCB0aGlzLl9fcmVzaXplSGFuZGxlcik7XG4gIGRvbS5iaW5kKHRoaXMuX191bCwgJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCB0aGlzLl9fcmVzaXplSGFuZGxlcik7XG4gIGRvbS5iaW5kKHRoaXMuX191bCwgJ3RyYW5zaXRpb25lbmQnLCB0aGlzLl9fcmVzaXplSGFuZGxlcik7XG4gIGRvbS5iaW5kKHRoaXMuX191bCwgJ29UcmFuc2l0aW9uRW5kJywgdGhpcy5fX3Jlc2l6ZUhhbmRsZXIpO1xuICB0aGlzLm9uUmVzaXplKCk7XG4gIGlmIChwYXJhbXMucmVzaXphYmxlKSB7XG4gICAgYWRkUmVzaXplSGFuZGxlKHRoaXMpO1xuICB9XG4gIHNhdmVUb0xvY2FsU3RvcmFnZSA9IGZ1bmN0aW9uIHNhdmVUb0xvY2FsU3RvcmFnZSgpIHtcbiAgICBpZiAoU1VQUE9SVFNfTE9DQUxfU1RPUkFHRSAmJiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKF90aGlzLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShnZXRMb2NhbFN0b3JhZ2VIYXNoKF90aGlzLCAnZ3VpJyksIEpTT04uc3RyaW5naWZ5KF90aGlzLmdldFNhdmVPYmplY3QoKSkpO1xuICAgIH1cbiAgfTtcbiAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlID0gc2F2ZVRvTG9jYWxTdG9yYWdlO1xuICBmdW5jdGlvbiByZXNldFdpZHRoKCkge1xuICAgIHZhciByb290ID0gX3RoaXMuZ2V0Um9vdCgpO1xuICAgIHJvb3Qud2lkdGggKz0gMTtcbiAgICBDb21tb24uZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgcm9vdC53aWR0aCAtPSAxO1xuICAgIH0pO1xuICB9XG4gIGlmICghcGFyYW1zLnBhcmVudCkge1xuICAgIHJlc2V0V2lkdGgoKTtcbiAgfVxufTtcbkdVSS50b2dnbGVIaWRlID0gZnVuY3Rpb24gKCkge1xuICBoaWRlID0gIWhpZGU7XG4gIENvbW1vbi5lYWNoKGhpZGVhYmxlR3VpcywgZnVuY3Rpb24gKGd1aSkge1xuICAgIGd1aS5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBoaWRlID8gJ25vbmUnIDogJyc7XG4gIH0pO1xufTtcbkdVSS5DTEFTU19BVVRPX1BMQUNFID0gJ2EnO1xuR1VJLkNMQVNTX0FVVE9fUExBQ0VfQ09OVEFJTkVSID0gJ2FjJztcbkdVSS5DTEFTU19NQUlOID0gJ21haW4nO1xuR1VJLkNMQVNTX0NPTlRST0xMRVJfUk9XID0gJ2NyJztcbkdVSS5DTEFTU19UT09fVEFMTCA9ICd0YWxsZXItdGhhbi13aW5kb3cnO1xuR1VJLkNMQVNTX0NMT1NFRCA9ICdjbG9zZWQnO1xuR1VJLkNMQVNTX0NMT1NFX0JVVFRPTiA9ICdjbG9zZS1idXR0b24nO1xuR1VJLkNMQVNTX0NMT1NFX1RPUCA9ICdjbG9zZS10b3AnO1xuR1VJLkNMQVNTX0NMT1NFX0JPVFRPTSA9ICdjbG9zZS1ib3R0b20nO1xuR1VJLkNMQVNTX0RSQUcgPSAnZHJhZyc7XG5HVUkuREVGQVVMVF9XSURUSCA9IDI0NTtcbkdVSS5URVhUX0NMT1NFRCA9ICdDbG9zZSBDb250cm9scyc7XG5HVUkuVEVYVF9PUEVOID0gJ09wZW4gQ29udHJvbHMnO1xuR1VJLl9rZXlkb3duSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50LnR5cGUgIT09ICd0ZXh0JyAmJiAoZS53aGljaCA9PT0gSElERV9LRVlfQ09ERSB8fCBlLmtleUNvZGUgPT09IEhJREVfS0VZX0NPREUpKSB7XG4gICAgR1VJLnRvZ2dsZUhpZGUoKTtcbiAgfVxufTtcbmRvbS5iaW5kKHdpbmRvdywgJ2tleWRvd24nLCBHVUkuX2tleWRvd25IYW5kbGVyLCBmYWxzZSk7XG5Db21tb24uZXh0ZW5kKEdVSS5wcm90b3R5cGUsXG57XG4gIGFkZDogZnVuY3Rpb24gYWRkKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gX2FkZCh0aGlzLCBvYmplY3QsIHByb3BlcnR5LCB7XG4gICAgICBmYWN0b3J5QXJnczogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKVxuICAgIH0pO1xuICB9LFxuICBhZGRDb2xvcjogZnVuY3Rpb24gYWRkQ29sb3Iob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBfYWRkKHRoaXMsIG9iamVjdCwgcHJvcGVydHksIHtcbiAgICAgIGNvbG9yOiB0cnVlXG4gICAgfSk7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKGNvbnRyb2xsZXIpIHtcbiAgICB0aGlzLl9fdWwucmVtb3ZlQ2hpbGQoY29udHJvbGxlci5fX2xpKTtcbiAgICB0aGlzLl9fY29udHJvbGxlcnMuc3BsaWNlKHRoaXMuX19jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpLCAxKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIENvbW1vbi5kZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpO1xuICAgIH0pO1xuICB9LFxuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IHRoZSByb290IEdVSSBzaG91bGQgYmUgcmVtb3ZlZCB3aXRoIC5kZXN0cm95KCkuICcgKyAnRm9yIHN1YmZvbGRlcnMsIHVzZSBndWkucmVtb3ZlRm9sZGVyKGZvbGRlcikgaW5zdGVhZC4nKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYXV0b1BsYWNlKSB7XG4gICAgICBhdXRvUGxhY2VDb250YWluZXIucmVtb3ZlQ2hpbGQodGhpcy5kb21FbGVtZW50KTtcbiAgICB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBDb21tb24uZWFjaCh0aGlzLl9fZm9sZGVycywgZnVuY3Rpb24gKHN1YmZvbGRlcikge1xuICAgICAgX3RoaXMucmVtb3ZlRm9sZGVyKHN1YmZvbGRlcik7XG4gICAgfSk7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICdrZXlkb3duJywgR1VJLl9rZXlkb3duSGFuZGxlciwgZmFsc2UpO1xuICAgIHJlbW92ZUxpc3RlbmVycyh0aGlzKTtcbiAgfSxcbiAgYWRkRm9sZGVyOiBmdW5jdGlvbiBhZGRGb2xkZXIobmFtZSkge1xuICAgIGlmICh0aGlzLl9fZm9sZGVyc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBhbHJlYWR5IGhhdmUgYSBmb2xkZXIgaW4gdGhpcyBHVUkgYnkgdGhlJyArICcgbmFtZSBcIicgKyBuYW1lICsgJ1wiJyk7XG4gICAgfVxuICAgIHZhciBuZXdHdWlQYXJhbXMgPSB7IG5hbWU6IG5hbWUsIHBhcmVudDogdGhpcyB9O1xuICAgIG5ld0d1aVBhcmFtcy5hdXRvUGxhY2UgPSB0aGlzLmF1dG9QbGFjZTtcbiAgICBpZiAodGhpcy5sb2FkICYmXG4gICAgdGhpcy5sb2FkLmZvbGRlcnMgJiZcbiAgICB0aGlzLmxvYWQuZm9sZGVyc1tuYW1lXSkge1xuICAgICAgbmV3R3VpUGFyYW1zLmNsb3NlZCA9IHRoaXMubG9hZC5mb2xkZXJzW25hbWVdLmNsb3NlZDtcbiAgICAgIG5ld0d1aVBhcmFtcy5sb2FkID0gdGhpcy5sb2FkLmZvbGRlcnNbbmFtZV07XG4gICAgfVxuICAgIHZhciBndWkgPSBuZXcgR1VJKG5ld0d1aVBhcmFtcyk7XG4gICAgdGhpcy5fX2ZvbGRlcnNbbmFtZV0gPSBndWk7XG4gICAgdmFyIGxpID0gYWRkUm93KHRoaXMsIGd1aS5kb21FbGVtZW50KTtcbiAgICBkb20uYWRkQ2xhc3MobGksICdmb2xkZXInKTtcbiAgICByZXR1cm4gZ3VpO1xuICB9LFxuICByZW1vdmVGb2xkZXI6IGZ1bmN0aW9uIHJlbW92ZUZvbGRlcihmb2xkZXIpIHtcbiAgICB0aGlzLl9fdWwucmVtb3ZlQ2hpbGQoZm9sZGVyLmRvbUVsZW1lbnQucGFyZW50RWxlbWVudCk7XG4gICAgZGVsZXRlIHRoaXMuX19mb2xkZXJzW2ZvbGRlci5uYW1lXTtcbiAgICBpZiAodGhpcy5sb2FkICYmXG4gICAgdGhpcy5sb2FkLmZvbGRlcnMgJiZcbiAgICB0aGlzLmxvYWQuZm9sZGVyc1tmb2xkZXIubmFtZV0pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmxvYWQuZm9sZGVyc1tmb2xkZXIubmFtZV07XG4gICAgfVxuICAgIHJlbW92ZUxpc3RlbmVycyhmb2xkZXIpO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgQ29tbW9uLmVhY2goZm9sZGVyLl9fZm9sZGVycywgZnVuY3Rpb24gKHN1YmZvbGRlcikge1xuICAgICAgZm9sZGVyLnJlbW92ZUZvbGRlcihzdWJmb2xkZXIpO1xuICAgIH0pO1xuICAgIENvbW1vbi5kZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5vblJlc2l6ZSgpO1xuICAgIH0pO1xuICB9LFxuICBvcGVuOiBmdW5jdGlvbiBvcGVuKCkge1xuICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gIH0sXG4gIGNsb3NlOiBmdW5jdGlvbiBjbG9zZSgpIHtcbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gIH0sXG4gIGhpZGU6IGZ1bmN0aW9uIGhpZGUoKSB7XG4gICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH0sXG4gIHNob3c6IGZ1bmN0aW9uIHNob3coKSB7XG4gICAgdGhpcy5kb21FbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgfSxcbiAgb25SZXNpemU6IGZ1bmN0aW9uIG9uUmVzaXplKCkge1xuICAgIHZhciByb290ID0gdGhpcy5nZXRSb290KCk7XG4gICAgaWYgKHJvb3Quc2Nyb2xsYWJsZSkge1xuICAgICAgdmFyIHRvcCA9IGRvbS5nZXRPZmZzZXQocm9vdC5fX3VsKS50b3A7XG4gICAgICB2YXIgaCA9IDA7XG4gICAgICBDb21tb24uZWFjaChyb290Ll9fdWwuY2hpbGROb2RlcywgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKCEocm9vdC5hdXRvUGxhY2UgJiYgbm9kZSA9PT0gcm9vdC5fX3NhdmVfcm93KSkge1xuICAgICAgICAgIGggKz0gZG9tLmdldEhlaWdodChub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAod2luZG93LmlubmVySGVpZ2h0IC0gdG9wIC0gQ0xPU0VfQlVUVE9OX0hFSUdIVCA8IGgpIHtcbiAgICAgICAgZG9tLmFkZENsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgcm9vdC5fX3VsLnN0eWxlLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodCAtIHRvcCAtIENMT1NFX0JVVFRPTl9IRUlHSFQgKyAncHgnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKHJvb3QuZG9tRWxlbWVudCwgR1VJLkNMQVNTX1RPT19UQUxMKTtcbiAgICAgICAgcm9vdC5fX3VsLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJvb3QuX19yZXNpemVfaGFuZGxlKSB7XG4gICAgICBDb21tb24uZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICByb290Ll9fcmVzaXplX2hhbmRsZS5zdHlsZS5oZWlnaHQgPSByb290Ll9fdWwub2Zmc2V0SGVpZ2h0ICsgJ3B4JztcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocm9vdC5fX2Nsb3NlQnV0dG9uKSB7XG4gICAgICByb290Ll9fY2xvc2VCdXR0b24uc3R5bGUud2lkdGggPSByb290LndpZHRoICsgJ3B4JztcbiAgICB9XG4gIH0sXG4gIG9uUmVzaXplRGVib3VuY2VkOiBDb21tb24uZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMub25SZXNpemUoKTtcbiAgfSwgNTApLFxuICByZW1lbWJlcjogZnVuY3Rpb24gcmVtZW1iZXIoKSB7XG4gICAgaWYgKENvbW1vbi5pc1VuZGVmaW5lZChTQVZFX0RJQUxPR1VFKSkge1xuICAgICAgU0FWRV9ESUFMT0dVRSA9IG5ldyBDZW50ZXJlZERpdigpO1xuICAgICAgU0FWRV9ESUFMT0dVRS5kb21FbGVtZW50LmlubmVySFRNTCA9IHNhdmVEaWFsb2dDb250ZW50cztcbiAgICB9XG4gICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBjYW4gb25seSBjYWxsIHJlbWVtYmVyIG9uIGEgdG9wIGxldmVsIEdVSS4nKTtcbiAgICB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBDb21tb24uZWFjaChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICBpZiAoX3RoaXMuX19yZW1lbWJlcmVkT2JqZWN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgYWRkU2F2ZU1lbnUoX3RoaXMpO1xuICAgICAgfVxuICAgICAgaWYgKF90aGlzLl9fcmVtZW1iZXJlZE9iamVjdHMuaW5kZXhPZihvYmplY3QpID09PSAtMSkge1xuICAgICAgICBfdGhpcy5fX3JlbWVtYmVyZWRPYmplY3RzLnB1c2gob2JqZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy5hdXRvUGxhY2UpIHtcbiAgICAgIHNldFdpZHRoKHRoaXMsIHRoaXMud2lkdGgpO1xuICAgIH1cbiAgfSxcbiAgZ2V0Um9vdDogZnVuY3Rpb24gZ2V0Um9vdCgpIHtcbiAgICB2YXIgZ3VpID0gdGhpcztcbiAgICB3aGlsZSAoZ3VpLnBhcmVudCkge1xuICAgICAgZ3VpID0gZ3VpLnBhcmVudDtcbiAgICB9XG4gICAgcmV0dXJuIGd1aTtcbiAgfSxcbiAgZ2V0U2F2ZU9iamVjdDogZnVuY3Rpb24gZ2V0U2F2ZU9iamVjdCgpIHtcbiAgICB2YXIgdG9SZXR1cm4gPSB0aGlzLmxvYWQ7XG4gICAgdG9SZXR1cm4uY2xvc2VkID0gdGhpcy5jbG9zZWQ7XG4gICAgaWYgKHRoaXMuX19yZW1lbWJlcmVkT2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICB0b1JldHVybi5wcmVzZXQgPSB0aGlzLnByZXNldDtcbiAgICAgIGlmICghdG9SZXR1cm4ucmVtZW1iZXJlZCkge1xuICAgICAgICB0b1JldHVybi5yZW1lbWJlcmVkID0ge307XG4gICAgICB9XG4gICAgICB0b1JldHVybi5yZW1lbWJlcmVkW3RoaXMucHJlc2V0XSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG4gICAgfVxuICAgIHRvUmV0dXJuLmZvbGRlcnMgPSB7fTtcbiAgICBDb21tb24uZWFjaCh0aGlzLl9fZm9sZGVycywgZnVuY3Rpb24gKGVsZW1lbnQsIGtleSkge1xuICAgICAgdG9SZXR1cm4uZm9sZGVyc1trZXldID0gZWxlbWVudC5nZXRTYXZlT2JqZWN0KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRvUmV0dXJuO1xuICB9LFxuICBzYXZlOiBmdW5jdGlvbiBzYXZlKCkge1xuICAgIGlmICghdGhpcy5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkID0ge307XG4gICAgfVxuICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkW3RoaXMucHJlc2V0XSA9IGdldEN1cnJlbnRQcmVzZXQodGhpcyk7XG4gICAgbWFya1ByZXNldE1vZGlmaWVkKHRoaXMsIGZhbHNlKTtcbiAgICB0aGlzLnNhdmVUb0xvY2FsU3RvcmFnZUlmUG9zc2libGUoKTtcbiAgfSxcbiAgc2F2ZUFzOiBmdW5jdGlvbiBzYXZlQXMocHJlc2V0TmFtZSkge1xuICAgIGlmICghdGhpcy5sb2FkLnJlbWVtYmVyZWQpIHtcbiAgICAgIHRoaXMubG9hZC5yZW1lbWJlcmVkID0ge307XG4gICAgICB0aGlzLmxvYWQucmVtZW1iZXJlZFtERUZBVUxUX0RFRkFVTFRfUFJFU0VUX05BTUVdID0gZ2V0Q3VycmVudFByZXNldCh0aGlzLCB0cnVlKTtcbiAgICB9XG4gICAgdGhpcy5sb2FkLnJlbWVtYmVyZWRbcHJlc2V0TmFtZV0gPSBnZXRDdXJyZW50UHJlc2V0KHRoaXMpO1xuICAgIHRoaXMucHJlc2V0ID0gcHJlc2V0TmFtZTtcbiAgICBhZGRQcmVzZXRPcHRpb24odGhpcywgcHJlc2V0TmFtZSwgdHJ1ZSk7XG4gICAgdGhpcy5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKCk7XG4gIH0sXG4gIHJldmVydDogZnVuY3Rpb24gcmV2ZXJ0KGd1aSkge1xuICAgIENvbW1vbi5lYWNoKHRoaXMuX19jb250cm9sbGVycywgZnVuY3Rpb24gKGNvbnRyb2xsZXIpIHtcbiAgICAgIGlmICghdGhpcy5nZXRSb290KCkubG9hZC5yZW1lbWJlcmVkKSB7XG4gICAgICAgIGNvbnRyb2xsZXIuc2V0VmFsdWUoY29udHJvbGxlci5pbml0aWFsVmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVjYWxsU2F2ZWRWYWx1ZShndWkgfHwgdGhpcy5nZXRSb290KCksIGNvbnRyb2xsZXIpO1xuICAgICAgfVxuICAgICAgaWYgKGNvbnRyb2xsZXIuX19vbkZpbmlzaENoYW5nZSkge1xuICAgICAgICBjb250cm9sbGVyLl9fb25GaW5pc2hDaGFuZ2UuY2FsbChjb250cm9sbGVyLCBjb250cm9sbGVyLmdldFZhbHVlKCkpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICAgIENvbW1vbi5lYWNoKHRoaXMuX19mb2xkZXJzLCBmdW5jdGlvbiAoZm9sZGVyKSB7XG4gICAgICBmb2xkZXIucmV2ZXJ0KGZvbGRlcik7XG4gICAgfSk7XG4gICAgaWYgKCFndWkpIHtcbiAgICAgIG1hcmtQcmVzZXRNb2RpZmllZCh0aGlzLmdldFJvb3QoKSwgZmFsc2UpO1xuICAgIH1cbiAgfSxcbiAgbGlzdGVuOiBmdW5jdGlvbiBsaXN0ZW4oY29udHJvbGxlcikge1xuICAgIHZhciBpbml0ID0gdGhpcy5fX2xpc3RlbmluZy5sZW5ndGggPT09IDA7XG4gICAgdGhpcy5fX2xpc3RlbmluZy5wdXNoKGNvbnRyb2xsZXIpO1xuICAgIGlmIChpbml0KSB7XG4gICAgICB1cGRhdGVEaXNwbGF5cyh0aGlzLl9fbGlzdGVuaW5nKTtcbiAgICB9XG4gIH0sXG4gIHVwZGF0ZURpc3BsYXk6IGZ1bmN0aW9uIHVwZGF0ZURpc3BsYXkoKSB7XG4gICAgQ29tbW9uLmVhY2godGhpcy5fX2NvbnRyb2xsZXJzLCBmdW5jdGlvbiAoY29udHJvbGxlcikge1xuICAgICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KCk7XG4gICAgfSk7XG4gICAgQ29tbW9uLmVhY2godGhpcy5fX2ZvbGRlcnMsIGZ1bmN0aW9uIChmb2xkZXIpIHtcbiAgICAgIGZvbGRlci51cGRhdGVEaXNwbGF5KCk7XG4gICAgfSk7XG4gIH1cbn0pO1xuZnVuY3Rpb24gYWRkUm93KGd1aSwgbmV3RG9tLCBsaUJlZm9yZSkge1xuICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICBpZiAobmV3RG9tKSB7XG4gICAgbGkuYXBwZW5kQ2hpbGQobmV3RG9tKTtcbiAgfVxuICBpZiAobGlCZWZvcmUpIHtcbiAgICBndWkuX191bC5pbnNlcnRCZWZvcmUobGksIGxpQmVmb3JlKTtcbiAgfSBlbHNlIHtcbiAgICBndWkuX191bC5hcHBlbmRDaGlsZChsaSk7XG4gIH1cbiAgZ3VpLm9uUmVzaXplKCk7XG4gIHJldHVybiBsaTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhndWkpIHtcbiAgZG9tLnVuYmluZCh3aW5kb3csICdyZXNpemUnLCBndWkuX19yZXNpemVIYW5kbGVyKTtcbiAgaWYgKGd1aS5zYXZlVG9Mb2NhbFN0b3JhZ2VJZlBvc3NpYmxlKSB7XG4gICAgZG9tLnVuYmluZCh3aW5kb3csICd1bmxvYWQnLCBndWkuc2F2ZVRvTG9jYWxTdG9yYWdlSWZQb3NzaWJsZSk7XG4gIH1cbn1cbmZ1bmN0aW9uIG1hcmtQcmVzZXRNb2RpZmllZChndWksIG1vZGlmaWVkKSB7XG4gIHZhciBvcHQgPSBndWkuX19wcmVzZXRfc2VsZWN0W2d1aS5fX3ByZXNldF9zZWxlY3Quc2VsZWN0ZWRJbmRleF07XG4gIGlmIChtb2RpZmllZCkge1xuICAgIG9wdC5pbm5lckhUTUwgPSBvcHQudmFsdWUgKyAnKic7XG4gIH0gZWxzZSB7XG4gICAgb3B0LmlubmVySFRNTCA9IG9wdC52YWx1ZTtcbiAgfVxufVxuZnVuY3Rpb24gYXVnbWVudENvbnRyb2xsZXIoZ3VpLCBsaSwgY29udHJvbGxlcikge1xuICBjb250cm9sbGVyLl9fbGkgPSBsaTtcbiAgY29udHJvbGxlci5fX2d1aSA9IGd1aTtcbiAgQ29tbW9uLmV4dGVuZChjb250cm9sbGVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgIG9wdGlvbnM6IGZ1bmN0aW9uIG9wdGlvbnMoX29wdGlvbnMpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICB2YXIgbmV4dFNpYmxpbmcgPSBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgICBjb250cm9sbGVyLnJlbW92ZSgpO1xuICAgICAgICByZXR1cm4gX2FkZChndWksIGNvbnRyb2xsZXIub2JqZWN0LCBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgYmVmb3JlOiBuZXh0U2libGluZyxcbiAgICAgICAgICBmYWN0b3J5QXJnczogW0NvbW1vbi50b0FycmF5KGFyZ3VtZW50cyldXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKENvbW1vbi5pc0FycmF5KF9vcHRpb25zKSB8fCBDb21tb24uaXNPYmplY3QoX29wdGlvbnMpKSB7XG4gICAgICAgIHZhciBfbmV4dFNpYmxpbmcgPSBjb250cm9sbGVyLl9fbGkubmV4dEVsZW1lbnRTaWJsaW5nO1xuICAgICAgICBjb250cm9sbGVyLnJlbW92ZSgpO1xuICAgICAgICByZXR1cm4gX2FkZChndWksIGNvbnRyb2xsZXIub2JqZWN0LCBjb250cm9sbGVyLnByb3BlcnR5LCB7XG4gICAgICAgICAgYmVmb3JlOiBfbmV4dFNpYmxpbmcsXG4gICAgICAgICAgZmFjdG9yeUFyZ3M6IFtfb3B0aW9uc11cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBuYW1lOiBmdW5jdGlvbiBuYW1lKF9uYW1lKSB7XG4gICAgICBjb250cm9sbGVyLl9fbGkuZmlyc3RFbGVtZW50Q2hpbGQuZmlyc3RFbGVtZW50Q2hpbGQuaW5uZXJIVE1MID0gX25hbWU7XG4gICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICB9LFxuICAgIGxpc3RlbjogZnVuY3Rpb24gbGlzdGVuKCkge1xuICAgICAgY29udHJvbGxlci5fX2d1aS5saXN0ZW4oY29udHJvbGxlcik7XG4gICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgICAgY29udHJvbGxlci5fX2d1aS5yZW1vdmUoY29udHJvbGxlcik7XG4gICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICB9XG4gIH0pO1xuICBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIE51bWJlckNvbnRyb2xsZXJTbGlkZXIpIHtcbiAgICB2YXIgYm94ID0gbmV3IE51bWJlckNvbnRyb2xsZXJCb3goY29udHJvbGxlci5vYmplY3QsIGNvbnRyb2xsZXIucHJvcGVydHksIHsgbWluOiBjb250cm9sbGVyLl9fbWluLCBtYXg6IGNvbnRyb2xsZXIuX19tYXgsIHN0ZXA6IGNvbnRyb2xsZXIuX19zdGVwIH0pO1xuICAgIENvbW1vbi5lYWNoKFsndXBkYXRlRGlzcGxheScsICdvbkNoYW5nZScsICdvbkZpbmlzaENoYW5nZScsICdzdGVwJywgJ21pbicsICdtYXgnXSwgZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgICAgdmFyIHBjID0gY29udHJvbGxlclttZXRob2RdO1xuICAgICAgdmFyIHBiID0gYm94W21ldGhvZF07XG4gICAgICBjb250cm9sbGVyW21ldGhvZF0gPSBib3hbbWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICBwYi5hcHBseShib3gsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gcGMuYXBwbHkoY29udHJvbGxlciwgYXJncyk7XG4gICAgICB9O1xuICAgIH0pO1xuICAgIGRvbS5hZGRDbGFzcyhsaSwgJ2hhcy1zbGlkZXInKTtcbiAgICBjb250cm9sbGVyLmRvbUVsZW1lbnQuaW5zZXJ0QmVmb3JlKGJveC5kb21FbGVtZW50LCBjb250cm9sbGVyLmRvbUVsZW1lbnQuZmlyc3RFbGVtZW50Q2hpbGQpO1xuICB9IGVsc2UgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBOdW1iZXJDb250cm9sbGVyQm94KSB7XG4gICAgdmFyIHIgPSBmdW5jdGlvbiByKHJldHVybmVkKSB7XG4gICAgICBpZiAoQ29tbW9uLmlzTnVtYmVyKGNvbnRyb2xsZXIuX19taW4pICYmIENvbW1vbi5pc051bWJlcihjb250cm9sbGVyLl9fbWF4KSkge1xuICAgICAgICB2YXIgb2xkTmFtZSA9IGNvbnRyb2xsZXIuX19saS5maXJzdEVsZW1lbnRDaGlsZC5maXJzdEVsZW1lbnRDaGlsZC5pbm5lckhUTUw7XG4gICAgICAgIHZhciB3YXNMaXN0ZW5pbmcgPSBjb250cm9sbGVyLl9fZ3VpLl9fbGlzdGVuaW5nLmluZGV4T2YoY29udHJvbGxlcikgPiAtMTtcbiAgICAgICAgY29udHJvbGxlci5yZW1vdmUoKTtcbiAgICAgICAgdmFyIG5ld0NvbnRyb2xsZXIgPSBfYWRkKGd1aSwgY29udHJvbGxlci5vYmplY3QsIGNvbnRyb2xsZXIucHJvcGVydHksIHtcbiAgICAgICAgICBiZWZvcmU6IGNvbnRyb2xsZXIuX19saS5uZXh0RWxlbWVudFNpYmxpbmcsXG4gICAgICAgICAgZmFjdG9yeUFyZ3M6IFtjb250cm9sbGVyLl9fbWluLCBjb250cm9sbGVyLl9fbWF4LCBjb250cm9sbGVyLl9fc3RlcF1cbiAgICAgICAgfSk7XG4gICAgICAgIG5ld0NvbnRyb2xsZXIubmFtZShvbGROYW1lKTtcbiAgICAgICAgaWYgKHdhc0xpc3RlbmluZykgbmV3Q29udHJvbGxlci5saXN0ZW4oKTtcbiAgICAgICAgcmV0dXJuIG5ld0NvbnRyb2xsZXI7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV0dXJuZWQ7XG4gICAgfTtcbiAgICBjb250cm9sbGVyLm1pbiA9IENvbW1vbi5jb21wb3NlKHIsIGNvbnRyb2xsZXIubWluKTtcbiAgICBjb250cm9sbGVyLm1heCA9IENvbW1vbi5jb21wb3NlKHIsIGNvbnRyb2xsZXIubWF4KTtcbiAgfSBlbHNlIGlmIChjb250cm9sbGVyIGluc3RhbmNlb2YgQm9vbGVhbkNvbnRyb2xsZXIpIHtcbiAgICBkb20uYmluZChsaSwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgZG9tLmZha2VFdmVudChjb250cm9sbGVyLl9fY2hlY2tib3gsICdjbGljaycpO1xuICAgIH0pO1xuICAgIGRvbS5iaW5kKGNvbnRyb2xsZXIuX19jaGVja2JveCwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIEZ1bmN0aW9uQ29udHJvbGxlcikge1xuICAgIGRvbS5iaW5kKGxpLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkb20uZmFrZUV2ZW50KGNvbnRyb2xsZXIuX19idXR0b24sICdjbGljaycpO1xuICAgIH0pO1xuICAgIGRvbS5iaW5kKGxpLCAnbW91c2VvdmVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgZG9tLmFkZENsYXNzKGNvbnRyb2xsZXIuX19idXR0b24sICdob3ZlcicpO1xuICAgIH0pO1xuICAgIGRvbS5iaW5kKGxpLCAnbW91c2VvdXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBkb20ucmVtb3ZlQ2xhc3MoY29udHJvbGxlci5fX2J1dHRvbiwgJ2hvdmVyJyk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoY29udHJvbGxlciBpbnN0YW5jZW9mIENvbG9yQ29udHJvbGxlcikge1xuICAgIGRvbS5hZGRDbGFzcyhsaSwgJ2NvbG9yJyk7XG4gICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5ID0gQ29tbW9uLmNvbXBvc2UoZnVuY3Rpb24gKHZhbCkge1xuICAgICAgbGkuc3R5bGUuYm9yZGVyTGVmdENvbG9yID0gY29udHJvbGxlci5fX2NvbG9yLnRvU3RyaW5nKCk7XG4gICAgICByZXR1cm4gdmFsO1xuICAgIH0sIGNvbnRyb2xsZXIudXBkYXRlRGlzcGxheSk7XG4gICAgY29udHJvbGxlci51cGRhdGVEaXNwbGF5KCk7XG4gIH1cbiAgY29udHJvbGxlci5zZXRWYWx1ZSA9IENvbW1vbi5jb21wb3NlKGZ1bmN0aW9uICh2YWwpIHtcbiAgICBpZiAoZ3VpLmdldFJvb3QoKS5fX3ByZXNldF9zZWxlY3QgJiYgY29udHJvbGxlci5pc01vZGlmaWVkKCkpIHtcbiAgICAgIG1hcmtQcmVzZXRNb2RpZmllZChndWkuZ2V0Um9vdCgpLCB0cnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbiAgfSwgY29udHJvbGxlci5zZXRWYWx1ZSk7XG59XG5mdW5jdGlvbiByZWNhbGxTYXZlZFZhbHVlKGd1aSwgY29udHJvbGxlcikge1xuICB2YXIgcm9vdCA9IGd1aS5nZXRSb290KCk7XG4gIHZhciBtYXRjaGVkSW5kZXggPSByb290Ll9fcmVtZW1iZXJlZE9iamVjdHMuaW5kZXhPZihjb250cm9sbGVyLm9iamVjdCk7XG4gIGlmIChtYXRjaGVkSW5kZXggIT09IC0xKSB7XG4gICAgdmFyIGNvbnRyb2xsZXJNYXAgPSByb290Ll9fcmVtZW1iZXJlZE9iamVjdEluZGVjZXNUb0NvbnRyb2xsZXJzW21hdGNoZWRJbmRleF07XG4gICAgaWYgKGNvbnRyb2xsZXJNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udHJvbGxlck1hcCA9IHt9O1xuICAgICAgcm9vdC5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVyc1ttYXRjaGVkSW5kZXhdID0gY29udHJvbGxlck1hcDtcbiAgICB9XG4gICAgY29udHJvbGxlck1hcFtjb250cm9sbGVyLnByb3BlcnR5XSA9IGNvbnRyb2xsZXI7XG4gICAgaWYgKHJvb3QubG9hZCAmJiByb290LmxvYWQucmVtZW1iZXJlZCkge1xuICAgICAgdmFyIHByZXNldE1hcCA9IHJvb3QubG9hZC5yZW1lbWJlcmVkO1xuICAgICAgdmFyIHByZXNldCA9IHZvaWQgMDtcbiAgICAgIGlmIChwcmVzZXRNYXBbZ3VpLnByZXNldF0pIHtcbiAgICAgICAgcHJlc2V0ID0gcHJlc2V0TWFwW2d1aS5wcmVzZXRdO1xuICAgICAgfSBlbHNlIGlmIChwcmVzZXRNYXBbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXSkge1xuICAgICAgICBwcmVzZXQgPSBwcmVzZXRNYXBbREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChwcmVzZXRbbWF0Y2hlZEluZGV4XSAmJiBwcmVzZXRbbWF0Y2hlZEluZGV4XVtjb250cm9sbGVyLnByb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHByZXNldFttYXRjaGVkSW5kZXhdW2NvbnRyb2xsZXIucHJvcGVydHldO1xuICAgICAgICBjb250cm9sbGVyLmluaXRpYWxWYWx1ZSA9IHZhbHVlO1xuICAgICAgICBjb250cm9sbGVyLnNldFZhbHVlKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIF9hZGQoZ3VpLCBvYmplY3QsIHByb3BlcnR5LCBwYXJhbXMpIHtcbiAgaWYgKG9iamVjdFtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignT2JqZWN0IFwiJyArIG9iamVjdCArICdcIiBoYXMgbm8gcHJvcGVydHkgXCInICsgcHJvcGVydHkgKyAnXCInKTtcbiAgfVxuICB2YXIgY29udHJvbGxlciA9IHZvaWQgMDtcbiAgaWYgKHBhcmFtcy5jb2xvcikge1xuICAgIGNvbnRyb2xsZXIgPSBuZXcgQ29sb3JDb250cm9sbGVyKG9iamVjdCwgcHJvcGVydHkpO1xuICB9IGVsc2Uge1xuICAgIHZhciBmYWN0b3J5QXJncyA9IFtvYmplY3QsIHByb3BlcnR5XS5jb25jYXQocGFyYW1zLmZhY3RvcnlBcmdzKTtcbiAgICBjb250cm9sbGVyID0gQ29udHJvbGxlckZhY3RvcnkuYXBwbHkoZ3VpLCBmYWN0b3J5QXJncyk7XG4gIH1cbiAgaWYgKHBhcmFtcy5iZWZvcmUgaW5zdGFuY2VvZiBDb250cm9sbGVyKSB7XG4gICAgcGFyYW1zLmJlZm9yZSA9IHBhcmFtcy5iZWZvcmUuX19saTtcbiAgfVxuICByZWNhbGxTYXZlZFZhbHVlKGd1aSwgY29udHJvbGxlcik7XG4gIGRvbS5hZGRDbGFzcyhjb250cm9sbGVyLmRvbUVsZW1lbnQsICdjJyk7XG4gIHZhciBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBkb20uYWRkQ2xhc3MobmFtZSwgJ3Byb3BlcnR5LW5hbWUnKTtcbiAgbmFtZS5pbm5lckhUTUwgPSBjb250cm9sbGVyLnByb3BlcnR5O1xuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChuYW1lKTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvbnRyb2xsZXIuZG9tRWxlbWVudCk7XG4gIHZhciBsaSA9IGFkZFJvdyhndWksIGNvbnRhaW5lciwgcGFyYW1zLmJlZm9yZSk7XG4gIGRvbS5hZGRDbGFzcyhsaSwgR1VJLkNMQVNTX0NPTlRST0xMRVJfUk9XKTtcbiAgaWYgKGNvbnRyb2xsZXIgaW5zdGFuY2VvZiBDb2xvckNvbnRyb2xsZXIpIHtcbiAgICBkb20uYWRkQ2xhc3MobGksICdjb2xvcicpO1xuICB9IGVsc2Uge1xuICAgIGRvbS5hZGRDbGFzcyhsaSwgX3R5cGVvZihjb250cm9sbGVyLmdldFZhbHVlKCkpKTtcbiAgfVxuICBhdWdtZW50Q29udHJvbGxlcihndWksIGxpLCBjb250cm9sbGVyKTtcbiAgZ3VpLl9fY29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKTtcbiAgcmV0dXJuIGNvbnRyb2xsZXI7XG59XG5mdW5jdGlvbiBnZXRMb2NhbFN0b3JhZ2VIYXNoKGd1aSwga2V5KSB7XG4gIHJldHVybiBkb2N1bWVudC5sb2NhdGlvbi5ocmVmICsgJy4nICsga2V5O1xufVxuZnVuY3Rpb24gYWRkUHJlc2V0T3B0aW9uKGd1aSwgbmFtZSwgc2V0U2VsZWN0ZWQpIHtcbiAgdmFyIG9wdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICBvcHQuaW5uZXJIVE1MID0gbmFtZTtcbiAgb3B0LnZhbHVlID0gbmFtZTtcbiAgZ3VpLl9fcHJlc2V0X3NlbGVjdC5hcHBlbmRDaGlsZChvcHQpO1xuICBpZiAoc2V0U2VsZWN0ZWQpIHtcbiAgICBndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXggPSBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aCAtIDE7XG4gIH1cbn1cbmZ1bmN0aW9uIHNob3dIaWRlRXhwbGFpbihndWksIGV4cGxhaW4pIHtcbiAgZXhwbGFpbi5zdHlsZS5kaXNwbGF5ID0gZ3VpLnVzZUxvY2FsU3RvcmFnZSA/ICdibG9jaycgOiAnbm9uZSc7XG59XG5mdW5jdGlvbiBhZGRTYXZlTWVudShndWkpIHtcbiAgdmFyIGRpdiA9IGd1aS5fX3NhdmVfcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgZG9tLmFkZENsYXNzKGd1aS5kb21FbGVtZW50LCAnaGFzLXNhdmUnKTtcbiAgZ3VpLl9fdWwuaW5zZXJ0QmVmb3JlKGRpdiwgZ3VpLl9fdWwuZmlyc3RDaGlsZCk7XG4gIGRvbS5hZGRDbGFzcyhkaXYsICdzYXZlLXJvdycpO1xuICB2YXIgZ2VhcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGdlYXJzLmlubmVySFRNTCA9ICcmbmJzcDsnO1xuICBkb20uYWRkQ2xhc3MoZ2VhcnMsICdidXR0b24gZ2VhcnMnKTtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgYnV0dG9uLmlubmVySFRNTCA9ICdTYXZlJztcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbiwgJ2J1dHRvbicpO1xuICBkb20uYWRkQ2xhc3MoYnV0dG9uLCAnc2F2ZScpO1xuICB2YXIgYnV0dG9uMiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgYnV0dG9uMi5pbm5lckhUTUwgPSAnTmV3JztcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbjIsICdidXR0b24nKTtcbiAgZG9tLmFkZENsYXNzKGJ1dHRvbjIsICdzYXZlLWFzJyk7XG4gIHZhciBidXR0b24zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICBidXR0b24zLmlubmVySFRNTCA9ICdSZXZlcnQnO1xuICBkb20uYWRkQ2xhc3MoYnV0dG9uMywgJ2J1dHRvbicpO1xuICBkb20uYWRkQ2xhc3MoYnV0dG9uMywgJ3JldmVydCcpO1xuICB2YXIgc2VsZWN0ID0gZ3VpLl9fcHJlc2V0X3NlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NlbGVjdCcpO1xuICBpZiAoZ3VpLmxvYWQgJiYgZ3VpLmxvYWQucmVtZW1iZXJlZCkge1xuICAgIENvbW1vbi5lYWNoKGd1aS5sb2FkLnJlbWVtYmVyZWQsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICBhZGRQcmVzZXRPcHRpb24oZ3VpLCBrZXksIGtleSA9PT0gZ3VpLnByZXNldCk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgYWRkUHJlc2V0T3B0aW9uKGd1aSwgREVGQVVMVF9ERUZBVUxUX1BSRVNFVF9OQU1FLCBmYWxzZSk7XG4gIH1cbiAgZG9tLmJpbmQoc2VsZWN0LCAnY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBndWkuX19wcmVzZXRfc2VsZWN0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgZ3VpLl9fcHJlc2V0X3NlbGVjdFtpbmRleF0uaW5uZXJIVE1MID0gZ3VpLl9fcHJlc2V0X3NlbGVjdFtpbmRleF0udmFsdWU7XG4gICAgfVxuICAgIGd1aS5wcmVzZXQgPSB0aGlzLnZhbHVlO1xuICB9KTtcbiAgZGl2LmFwcGVuZENoaWxkKHNlbGVjdCk7XG4gIGRpdi5hcHBlbmRDaGlsZChnZWFycyk7XG4gIGRpdi5hcHBlbmRDaGlsZChidXR0b24pO1xuICBkaXYuYXBwZW5kQ2hpbGQoYnV0dG9uMik7XG4gIGRpdi5hcHBlbmRDaGlsZChidXR0b24zKTtcbiAgaWYgKFNVUFBPUlRTX0xPQ0FMX1NUT1JBR0UpIHtcbiAgICB2YXIgZXhwbGFpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZy1sb2NhbC1leHBsYWluJyk7XG4gICAgdmFyIGxvY2FsU3RvcmFnZUNoZWNrQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLWxvY2FsLXN0b3JhZ2UnKTtcbiAgICB2YXIgc2F2ZUxvY2FsbHkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGctc2F2ZS1sb2NhbGx5Jyk7XG4gICAgc2F2ZUxvY2FsbHkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldExvY2FsU3RvcmFnZUhhc2goZ3VpLCAnaXNMb2NhbCcpKSA9PT0gJ3RydWUnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2VDaGVja0JveC5zZXRBdHRyaWJ1dGUoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cbiAgICBzaG93SGlkZUV4cGxhaW4oZ3VpLCBleHBsYWluKTtcbiAgICBkb20uYmluZChsb2NhbFN0b3JhZ2VDaGVja0JveCwgJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGd1aS51c2VMb2NhbFN0b3JhZ2UgPSAhZ3VpLnVzZUxvY2FsU3RvcmFnZTtcbiAgICAgIHNob3dIaWRlRXhwbGFpbihndWksIGV4cGxhaW4pO1xuICAgIH0pO1xuICB9XG4gIHZhciBuZXdDb25zdHJ1Y3RvclRleHRBcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RnLW5ldy1jb25zdHJ1Y3RvcicpO1xuICBkb20uYmluZChuZXdDb25zdHJ1Y3RvclRleHRBcmVhLCAna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUubWV0YUtleSAmJiAoZS53aGljaCA9PT0gNjcgfHwgZS5rZXlDb2RlID09PSA2NykpIHtcbiAgICAgIFNBVkVfRElBTE9HVUUuaGlkZSgpO1xuICAgIH1cbiAgfSk7XG4gIGRvbS5iaW5kKGdlYXJzLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgbmV3Q29uc3RydWN0b3JUZXh0QXJlYS5pbm5lckhUTUwgPSBKU09OLnN0cmluZ2lmeShndWkuZ2V0U2F2ZU9iamVjdCgpLCB1bmRlZmluZWQsIDIpO1xuICAgIFNBVkVfRElBTE9HVUUuc2hvdygpO1xuICAgIG5ld0NvbnN0cnVjdG9yVGV4dEFyZWEuZm9jdXMoKTtcbiAgICBuZXdDb25zdHJ1Y3RvclRleHRBcmVhLnNlbGVjdCgpO1xuICB9KTtcbiAgZG9tLmJpbmQoYnV0dG9uLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgZ3VpLnNhdmUoKTtcbiAgfSk7XG4gIGRvbS5iaW5kKGJ1dHRvbjIsICdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJlc2V0TmFtZSA9IHByb21wdCgnRW50ZXIgYSBuZXcgcHJlc2V0IG5hbWUuJyk7XG4gICAgaWYgKHByZXNldE5hbWUpIHtcbiAgICAgIGd1aS5zYXZlQXMocHJlc2V0TmFtZSk7XG4gICAgfVxuICB9KTtcbiAgZG9tLmJpbmQoYnV0dG9uMywgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGd1aS5yZXZlcnQoKTtcbiAgfSk7XG59XG5mdW5jdGlvbiBhZGRSZXNpemVIYW5kbGUoZ3VpKSB7XG4gIHZhciBwbW91c2VYID0gdm9pZCAwO1xuICBndWkuX19yZXNpemVfaGFuZGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIENvbW1vbi5leHRlbmQoZ3VpLl9fcmVzaXplX2hhbmRsZS5zdHlsZSwge1xuICAgIHdpZHRoOiAnNnB4JyxcbiAgICBtYXJnaW5MZWZ0OiAnLTNweCcsXG4gICAgaGVpZ2h0OiAnMjAwcHgnLFxuICAgIGN1cnNvcjogJ2V3LXJlc2l6ZScsXG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgfSk7XG4gIGZ1bmN0aW9uIGRyYWcoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBndWkud2lkdGggKz0gcG1vdXNlWCAtIGUuY2xpZW50WDtcbiAgICBndWkub25SZXNpemUoKTtcbiAgICBwbW91c2VYID0gZS5jbGllbnRYO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBkcmFnU3RvcCgpIHtcbiAgICBkb20ucmVtb3ZlQ2xhc3MoZ3VpLl9fY2xvc2VCdXR0b24sIEdVSS5DTEFTU19EUkFHKTtcbiAgICBkb20udW5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIGRyYWcpO1xuICAgIGRvbS51bmJpbmQod2luZG93LCAnbW91c2V1cCcsIGRyYWdTdG9wKTtcbiAgfVxuICBmdW5jdGlvbiBkcmFnU3RhcnQoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBwbW91c2VYID0gZS5jbGllbnRYO1xuICAgIGRvbS5hZGRDbGFzcyhndWkuX19jbG9zZUJ1dHRvbiwgR1VJLkNMQVNTX0RSQUcpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIGRyYWcpO1xuICAgIGRvbS5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBkcmFnU3RvcCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGRvbS5iaW5kKGd1aS5fX3Jlc2l6ZV9oYW5kbGUsICdtb3VzZWRvd24nLCBkcmFnU3RhcnQpO1xuICBkb20uYmluZChndWkuX19jbG9zZUJ1dHRvbiwgJ21vdXNlZG93bicsIGRyYWdTdGFydCk7XG4gIGd1aS5kb21FbGVtZW50Lmluc2VydEJlZm9yZShndWkuX19yZXNpemVfaGFuZGxlLCBndWkuZG9tRWxlbWVudC5maXJzdEVsZW1lbnRDaGlsZCk7XG59XG5mdW5jdGlvbiBzZXRXaWR0aChndWksIHcpIHtcbiAgZ3VpLmRvbUVsZW1lbnQuc3R5bGUud2lkdGggPSB3ICsgJ3B4JztcbiAgaWYgKGd1aS5fX3NhdmVfcm93ICYmIGd1aS5hdXRvUGxhY2UpIHtcbiAgICBndWkuX19zYXZlX3Jvdy5zdHlsZS53aWR0aCA9IHcgKyAncHgnO1xuICB9XG4gIGlmIChndWkuX19jbG9zZUJ1dHRvbikge1xuICAgIGd1aS5fX2Nsb3NlQnV0dG9uLnN0eWxlLndpZHRoID0gdyArICdweCc7XG4gIH1cbn1cbmZ1bmN0aW9uIGdldEN1cnJlbnRQcmVzZXQoZ3VpLCB1c2VJbml0aWFsVmFsdWVzKSB7XG4gIHZhciB0b1JldHVybiA9IHt9O1xuICBDb21tb24uZWFjaChndWkuX19yZW1lbWJlcmVkT2JqZWN0cywgZnVuY3Rpb24gKHZhbCwgaW5kZXgpIHtcbiAgICB2YXIgc2F2ZWRWYWx1ZXMgPSB7fTtcbiAgICB2YXIgY29udHJvbGxlck1hcCA9IGd1aS5fX3JlbWVtYmVyZWRPYmplY3RJbmRlY2VzVG9Db250cm9sbGVyc1tpbmRleF07XG4gICAgQ29tbW9uLmVhY2goY29udHJvbGxlck1hcCwgZnVuY3Rpb24gKGNvbnRyb2xsZXIsIHByb3BlcnR5KSB7XG4gICAgICBzYXZlZFZhbHVlc1twcm9wZXJ0eV0gPSB1c2VJbml0aWFsVmFsdWVzID8gY29udHJvbGxlci5pbml0aWFsVmFsdWUgOiBjb250cm9sbGVyLmdldFZhbHVlKCk7XG4gICAgfSk7XG4gICAgdG9SZXR1cm5baW5kZXhdID0gc2F2ZWRWYWx1ZXM7XG4gIH0pO1xuICByZXR1cm4gdG9SZXR1cm47XG59XG5mdW5jdGlvbiBzZXRQcmVzZXRTZWxlY3RJbmRleChndWkpIHtcbiAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGd1aS5fX3ByZXNldF9zZWxlY3QubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgaWYgKGd1aS5fX3ByZXNldF9zZWxlY3RbaW5kZXhdLnZhbHVlID09PSBndWkucHJlc2V0KSB7XG4gICAgICBndWkuX19wcmVzZXRfc2VsZWN0LnNlbGVjdGVkSW5kZXggPSBpbmRleDtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZURpc3BsYXlzKGNvbnRyb2xsZXJBcnJheSkge1xuICBpZiAoY29udHJvbGxlckFycmF5Lmxlbmd0aCAhPT0gMCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSQxLmNhbGwod2luZG93LCBmdW5jdGlvbiAoKSB7XG4gICAgICB1cGRhdGVEaXNwbGF5cyhjb250cm9sbGVyQXJyYXkpO1xuICAgIH0pO1xuICB9XG4gIENvbW1vbi5lYWNoKGNvbnRyb2xsZXJBcnJheSwgZnVuY3Rpb24gKGMpIHtcbiAgICBjLnVwZGF0ZURpc3BsYXkoKTtcbiAgfSk7XG59XG5cbnZhciBjb2xvciA9IHtcbiAgQ29sb3I6IENvbG9yLFxuICBtYXRoOiBDb2xvck1hdGgsXG4gIGludGVycHJldDogaW50ZXJwcmV0XG59O1xudmFyIGNvbnRyb2xsZXJzID0ge1xuICBDb250cm9sbGVyOiBDb250cm9sbGVyLFxuICBCb29sZWFuQ29udHJvbGxlcjogQm9vbGVhbkNvbnRyb2xsZXIsXG4gIE9wdGlvbkNvbnRyb2xsZXI6IE9wdGlvbkNvbnRyb2xsZXIsXG4gIFN0cmluZ0NvbnRyb2xsZXI6IFN0cmluZ0NvbnRyb2xsZXIsXG4gIE51bWJlckNvbnRyb2xsZXI6IE51bWJlckNvbnRyb2xsZXIsXG4gIE51bWJlckNvbnRyb2xsZXJCb3g6IE51bWJlckNvbnRyb2xsZXJCb3gsXG4gIE51bWJlckNvbnRyb2xsZXJTbGlkZXI6IE51bWJlckNvbnRyb2xsZXJTbGlkZXIsXG4gIEZ1bmN0aW9uQ29udHJvbGxlcjogRnVuY3Rpb25Db250cm9sbGVyLFxuICBDb2xvckNvbnRyb2xsZXI6IENvbG9yQ29udHJvbGxlclxufTtcbnZhciBkb20kMSA9IHsgZG9tOiBkb20gfTtcbnZhciBndWkgPSB7IEdVSTogR1VJIH07XG52YXIgR1VJJDEgPSBHVUk7XG52YXIgaW5kZXggPSB7XG4gIGNvbG9yOiBjb2xvcixcbiAgY29udHJvbGxlcnM6IGNvbnRyb2xsZXJzLFxuICBkb206IGRvbSQxLFxuICBndWk6IGd1aSxcbiAgR1VJOiBHVUkkMVxufTtcblxuZXhwb3J0cy5jb2xvciA9IGNvbG9yO1xuZXhwb3J0cy5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzO1xuZXhwb3J0cy5kb20gPSBkb20kMTtcbmV4cG9ydHMuZ3VpID0gZ3VpO1xuZXhwb3J0cy5HVUkgPSBHVUkkMTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluZGV4O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0Lmd1aS5qcy5tYXBcbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gICAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gICAgKGdsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwuaGVhcCA9IHt9KSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgX19nZW5lcmF0b3IgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2dlbmVyYXRvcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIGJvZHkpIHtcbiAgICAgICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZztcbiAgICAgICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XG4gICAgICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XG4gICAgICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XG4gICAgICAgICAgICB3aGlsZSAoXykgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XG4gICAgICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgX19yZWFkID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19yZWFkKSB8fCBmdW5jdGlvbiAobywgbikge1xuICAgICAgICB2YXIgbSA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl07XG4gICAgICAgIGlmICghbSkgcmV0dXJuIG87XG4gICAgICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7IGUgPSB7IGVycm9yOiBlcnJvciB9OyB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAociAmJiAhci5kb25lICYmIChtID0gaVtcInJldHVyblwiXSkpIG0uY2FsbChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcjtcbiAgICB9O1xuICAgIHZhciBfX3NwcmVhZCA9ICh1bmRlZmluZWQgJiYgdW5kZWZpbmVkLl9fc3ByZWFkKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBhciA9IGFyLmNvbmNhdChfX3JlYWQoYXJndW1lbnRzW2ldKSk7XG4gICAgICAgIHJldHVybiBhcjtcbiAgICB9O1xuICAgIHZhciB0b0ludCA9IGZ1bmN0aW9uIChuKSB7IHJldHVybiB+fm47IH07XG4gICAgLyoqXG4gICAgICogSGVhcFxuICAgICAqIEB0eXBlIHtDbGFzc31cbiAgICAgKi9cbiAgICB2YXIgSGVhcCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhlYXAgaW5zdGFuY2UgY29uc3RydWN0b3IuXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlIE9wdGlvbmFsIGNvbXBhcmlzb24gZnVuY3Rpb24sIGRlZmF1bHRzIHRvIEhlYXAubWluQ29tcGFyYXRvcjxudW1iZXI+XG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBIZWFwKGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoY29tcGFyZSA9PT0gdm9pZCAwKSB7IGNvbXBhcmUgPSBIZWFwLm1pbkNvbXBhcmF0b3I7IH1cbiAgICAgICAgICAgIHRoaXMuY29tcGFyZSA9IGNvbXBhcmU7XG4gICAgICAgICAgICB0aGlzLmhlYXBBcnJheSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fbGltaXQgPSAwO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBbGlhcyBvZiBhZGRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy5vZmZlciA9IHRoaXMuYWRkO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBBbGlhcyBvZiBwZWVrXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMucGVlaztcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQWxpYXMgb2YgcG9wXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMucG9sbCA9IHRoaXMucG9wO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBSZXR1cm5zIHRoZSBpbnZlcnNlIHRvIHRoZSBjb21wYXJpc29uIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuX2ludmVydGVkQ29tcGFyZSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xICogX3RoaXMuY29tcGFyZShhLCBiKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgIFN0YXRpYyBtZXRob2RzXG4gICAgICAgICAqL1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0cyBjaGlsZHJlbiBpbmRpY2VzIGZvciBnaXZlbiBpbmRleC5cbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpZHggICAgIFBhcmVudCBpbmRleFxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheShOdW1iZXIpfSAgQXJyYXkgb2YgY2hpbGRyZW4gaW5kaWNlc1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YgPSBmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICByZXR1cm4gW2lkeCAqIDIgKyAxLCBpZHggKiAyICsgMl07XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXRzIHBhcmVudCBpbmRleCBmb3IgZ2l2ZW4gaW5kZXguXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaWR4ICBDaGlsZHJlbiBpbmRleFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXIgfCB1bmRlZmluZWR9ICAgICAgUGFyZW50IGluZGV4LCAtMSBpZiBpZHggaXMgMFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5nZXRQYXJlbnRJbmRleE9mID0gZnVuY3Rpb24gKGlkeCkge1xuICAgICAgICAgICAgaWYgKGlkeCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHdoaWNoQ2hpbGRyZW4gPSBpZHggJSAyID8gMSA6IDI7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigoaWR4IC0gd2hpY2hDaGlsZHJlbikgLyAyKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldHMgc2libGluZyBpbmRleCBmb3IgZ2l2ZW4gaW5kZXguXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaWR4ICBDaGlsZHJlbiBpbmRleFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXIgfCB1bmRlZmluZWR9ICAgICAgU2libGluZyBpbmRleCwgLTEgaWYgaWR4IGlzIDBcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuZ2V0U2libGluZ0luZGV4T2YgPSBmdW5jdGlvbiAoaWR4KSB7XG4gICAgICAgICAgICBpZiAoaWR4IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd2hpY2hDaGlsZHJlbiA9IGlkeCAlIDIgPyAxIDogLTE7XG4gICAgICAgICAgICByZXR1cm4gaWR4ICsgd2hpY2hDaGlsZHJlbjtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1pbiBoZWFwIGNvbXBhcmlzb24gZnVuY3Rpb24sIGRlZmF1bHQuXG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gYSAgICAgRmlyc3QgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGIgICAgIFNlY29uZCBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgMCBpZiB0aGV5J3JlIGVxdWFsLCBwb3NpdGl2ZSBpZiBgYWAgZ29lcyB1cCwgbmVnYXRpdmUgaWYgYGJgIGdvZXMgdXBcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAubWluQ29tcGFyYXRvciA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGEgPCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXggaGVhcCBjb21wYXJpc29uIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGEgICAgIEZpcnN0IGVsZW1lbnRcbiAgICAgICAgICogQHBhcmFtICB7YW55fSBiICAgICBTZWNvbmQgZWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgIDAgaWYgdGhleSdyZSBlcXVhbCwgcG9zaXRpdmUgaWYgYGFgIGdvZXMgdXAsIG5lZ2F0aXZlIGlmIGBiYCBnb2VzIHVwXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLm1heENvbXBhcmF0b3IgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgaWYgKGIgPiBhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChiIDwgYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogTWluIG51bWJlciBoZWFwIGNvbXBhcmlzb24gZnVuY3Rpb24sIGRlZmF1bHQuXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gYSAgICAgRmlyc3QgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGIgICAgIFNlY29uZCBlbGVtZW50XG4gICAgICAgICAqIEByZXR1cm4ge051bWJlcn0gICAgMCBpZiB0aGV5J3JlIGVxdWFsLCBwb3NpdGl2ZSBpZiBgYWAgZ29lcyB1cCwgbmVnYXRpdmUgaWYgYGJgIGdvZXMgdXBcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAubWluQ29tcGFyYXRvck51bWJlciA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYXggbnVtYmVyIGhlYXAgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBhICAgICBGaXJzdCBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gYiAgICAgU2Vjb25kIGVsZW1lbnRcbiAgICAgICAgICogQHJldHVybiB7TnVtYmVyfSAgICAwIGlmIHRoZXkncmUgZXF1YWwsIHBvc2l0aXZlIGlmIGBhYCBnb2VzIHVwLCBuZWdhdGl2ZSBpZiBgYmAgZ29lcyB1cFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5tYXhDb21wYXJhdG9yTnVtYmVyID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBiIC0gYTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlZmF1bHQgZXF1YWxpdHkgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gYSAgICBGaXJzdCBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gYiAgICBTZWNvbmQgZWxlbWVudFxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSAgVHJ1ZSBpZiBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmRlZmF1bHRJc0VxdWFsID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUHJpbnRzIGEgaGVhcC5cbiAgICAgICAgICogQHBhcmFtICB7SGVhcH0gaGVhcCBIZWFwIHRvIGJlIHByaW50ZWRcbiAgICAgICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJpbnQgPSBmdW5jdGlvbiAoaGVhcCkge1xuICAgICAgICAgICAgZnVuY3Rpb24gZGVlcChpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBpID0gSGVhcC5nZXRQYXJlbnRJbmRleE9mKGkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgubG9nMihwaSArIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlcGVhdChzdHIsIHRpbWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dCA9ICcnO1xuICAgICAgICAgICAgICAgIGZvciAoOyB0aW1lcyA+IDA7IC0tdGltZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0ICs9IHN0cjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBub2RlID0gMDtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IFtdO1xuICAgICAgICAgICAgdmFyIG1heExpbmVzID0gZGVlcChoZWFwLmxlbmd0aCAtIDEpICsgMjtcbiAgICAgICAgICAgIHZhciBtYXhMZW5ndGggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUgPCBoZWFwLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gZGVlcChub2RlKSArIDE7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFRleHQgcmVwcmVzZW50YXRpb25cbiAgICAgICAgICAgICAgICB2YXIgbm9kZVRleHQgPSBTdHJpbmcoaGVhcC5nZXQobm9kZSkpO1xuICAgICAgICAgICAgICAgIGlmIChub2RlVGV4dC5sZW5ndGggPiBtYXhMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoID0gbm9kZVRleHQubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gbGluZVxuICAgICAgICAgICAgICAgIGxpbmVzW2ldID0gbGluZXNbaV0gfHwgW107XG4gICAgICAgICAgICAgICAgbGluZXNbaV0ucHVzaChub2RlVGV4dCk7XG4gICAgICAgICAgICAgICAgbm9kZSArPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxpbmVzXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobGluZSwgaSkge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lcyA9IE1hdGgucG93KDIsIG1heExpbmVzIC0gaSkgLSAxO1xuICAgICAgICAgICAgICAgIHJldHVybiAocmVwZWF0KCcgJywgTWF0aC5mbG9vcih0aW1lcyAvIDIpICogbWF4TGVuZ3RoKSArXG4gICAgICAgICAgICAgICAgICAgIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjZW50ZXJlZFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhbGYgPSAobWF4TGVuZ3RoIC0gZWwubGVuZ3RoKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwZWF0KCcgJywgTWF0aC5jZWlsKGhhbGYpKSArIGVsICsgcmVwZWF0KCcgJywgTWF0aC5mbG9vcihoYWxmKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuam9pbihyZXBlYXQoJyAnLCB0aW1lcyAqIG1heExlbmd0aCkpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgUHl0aG9uIHN0eWxlXG4gICAgICAgICAqL1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgYW4gYXJyYXkgaW50byBhbiBhcnJheS1oZWFwLCBpbiBwbGFjZVxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gICAgYXJyICAgICAgQXJyYXkgdG8gYmUgbW9kaWZpZWRcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbXBhcmUgIE9wdGlvbmFsIGNvbXBhcmUgZnVuY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7SGVhcH0gICAgICAgICAgICAgIEZvciBjb252ZW5pZW5jZSwgaXQgcmV0dXJucyBhIEhlYXAgaW5zdGFuY2VcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcGlmeSA9IGZ1bmN0aW9uIChhcnIsIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBoZWFwID0gbmV3IEhlYXAoY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmhlYXBBcnJheSA9IGFycjtcbiAgICAgICAgICAgIGhlYXAuaW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXA7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFeHRyYWN0IHRoZSBwZWVrIG9mIGFuIGFycmF5LWhlYXBcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9ICAgIGhlYXBBcnIgIEFycmF5IHRvIGJlIG1vZGlmaWVkLCBzaG91bGQgYmUgYSBoZWFwXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgICAgICAgICAgICBSZXR1cm5zIHRoZSBleHRyYWN0ZWQgcGVla1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5oZWFwcG9wID0gZnVuY3Rpb24gKGhlYXBBcnIsIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBoZWFwID0gbmV3IEhlYXAoY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmhlYXBBcnJheSA9IGhlYXBBcnI7XG4gICAgICAgICAgICByZXR1cm4gaGVhcC5wb3AoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFB1c2hlcyBhIGl0ZW0gaW50byBhbiBhcnJheS1oZWFwXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSB0byBiZSBtb2RpZmllZCwgc2hvdWxkIGJlIGEgaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9ICAgICAgaXRlbSAgICAgSXRlbSB0byBwdXNoXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLmhlYXBwdXNoID0gZnVuY3Rpb24gKGhlYXBBcnIsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBoZWFwID0gbmV3IEhlYXAoY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmhlYXBBcnJheSA9IGhlYXBBcnI7XG4gICAgICAgICAgICBoZWFwLnB1c2goaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQdXNoIGZvbGxvd2VkIGJ5IHBvcCwgZmFzdGVyXG4gICAgICAgICAqIEBwYXJhbSAge0FycmF5fSAgICBoZWFwQXJyICBBcnJheSB0byBiZSBtb2RpZmllZCwgc2hvdWxkIGJlIGEgaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9ICAgICAgaXRlbSAgICAgSXRlbSB0byBwdXNoXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgICAgICAgICAgICBSZXR1cm5zIHRoZSBleHRyYWN0ZWQgcGVla1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5oZWFwcHVzaHBvcCA9IGZ1bmN0aW9uIChoZWFwQXJyLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAucHVzaHBvcChpdGVtKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlcGxhY2UgcGVlayB3aXRoIGl0ZW1cbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9ICAgIGhlYXBBcnIgIEFycmF5IHRvIGJlIG1vZGlmaWVkLCBzaG91bGQgYmUgYSBoZWFwXG4gICAgICAgICAqIEBwYXJhbSAge2FueX0gICAgICBpdGVtICAgICBJdGVtIGFzIHJlcGxhY2VtZW50XG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjb21wYXJlICBPcHRpb25hbCBjb21wYXJlIGZ1bmN0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgICAgICAgICAgICBSZXR1cm5zIHRoZSBleHRyYWN0ZWQgcGVla1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5oZWFwcmVwbGFjZSA9IGZ1bmN0aW9uIChoZWFwQXJyLCBpdGVtLCBjb21wYXJlKSB7XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAucmVwbGFjZShpdGVtKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgYG5gIG1vc3QgdmFsdWFibGUgZWxlbWVudHMgb2YgYSBoZWFwLWxpa2UgQXJyYXlcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9ICAgIGhlYXBBcnIgIEFycmF5LCBzaG91bGQgYmUgYW4gYXJyYXktaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgbiAgICAgICAgTWF4IG51bWJlciBvZiBlbGVtZW50c1xuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgRWxlbWVudHNcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcHRvcCA9IGZ1bmN0aW9uIChoZWFwQXJyLCBuLCBjb21wYXJlKSB7XG4gICAgICAgICAgICBpZiAobiA9PT0gdm9pZCAwKSB7IG4gPSAxOyB9XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAudG9wKG4pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBgbmAgbGVhc3QgdmFsdWFibGUgZWxlbWVudHMgb2YgYSBoZWFwLWxpa2UgQXJyYXlcbiAgICAgICAgICogQHBhcmFtICB7QXJyYXl9ICAgIGhlYXBBcnIgIEFycmF5LCBzaG91bGQgYmUgYW4gYXJyYXktaGVhcFxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgbiAgICAgICAgTWF4IG51bWJlciBvZiBlbGVtZW50c1xuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgRWxlbWVudHNcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAuaGVhcGJvdHRvbSA9IGZ1bmN0aW9uIChoZWFwQXJyLCBuLCBjb21wYXJlKSB7XG4gICAgICAgICAgICBpZiAobiA9PT0gdm9pZCAwKSB7IG4gPSAxOyB9XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKGNvbXBhcmUpO1xuICAgICAgICAgICAgaGVhcC5oZWFwQXJyYXkgPSBoZWFwQXJyO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAuYm90dG9tKG4pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBgbmAgbW9zdCB2YWx1YWJsZSBlbGVtZW50cyBvZiBhbiBpdGVyYWJsZVxuICAgICAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgbiAgICAgICAgTWF4IG51bWJlciBvZiBlbGVtZW50c1xuICAgICAgICAgKiBAcGFyYW0gIHtJdGVyYWJsZX0gSXRlcmFibGUgSXRlcmFibGUgbGlzdCBvZiBlbGVtZW50c1xuICAgICAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY29tcGFyZSAgT3B0aW9uYWwgY29tcGFyZSBmdW5jdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgICAgICAgRWxlbWVudHNcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAubmxhcmdlc3QgPSBmdW5jdGlvbiAobiwgaXRlcmFibGUsIGNvbXBhcmUpIHtcbiAgICAgICAgICAgIHZhciBoZWFwID0gbmV3IEhlYXAoY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmhlYXBBcnJheSA9IF9fc3ByZWFkKGl0ZXJhYmxlKTtcbiAgICAgICAgICAgIGhlYXAuaW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGhlYXAudG9wKG4pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBgbmAgbGVhc3QgdmFsdWFibGUgZWxlbWVudHMgb2YgYW4gaXRlcmFibGVcbiAgICAgICAgICogQHBhcmFtICB7bnVtYmVyfSAgIG4gICAgICAgIE1heCBudW1iZXIgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7SXRlcmFibGV9IEl0ZXJhYmxlIEl0ZXJhYmxlIGxpc3Qgb2YgZWxlbWVudHNcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNvbXBhcmUgIE9wdGlvbmFsIGNvbXBhcmUgZnVuY3Rpb25cbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICAgICAgICAgIEVsZW1lbnRzXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLm5zbWFsbGVzdCA9IGZ1bmN0aW9uIChuLCBpdGVyYWJsZSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGhlYXAgPSBuZXcgSGVhcChjb21wYXJlKTtcbiAgICAgICAgICAgIGhlYXAuaGVhcEFycmF5ID0gX19zcHJlYWQoaXRlcmFibGUpO1xuICAgICAgICAgICAgaGVhcC5pbml0KCk7XG4gICAgICAgICAgICByZXR1cm4gaGVhcC5ib3R0b20obik7XG4gICAgICAgIH07XG4gICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICBJbnN0YW5jZSBtZXRob2RzXG4gICAgICAgICAqL1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhbiBlbGVtZW50IHRvIHRoZSBoZWFwLiBBbGlhc2VzOiBgb2ZmZXJgLlxuICAgICAgICAgKiBTYW1lIGFzOiBwdXNoKGVsZW1lbnQpXG4gICAgICAgICAqIEBwYXJhbSB7YW55fSBlbGVtZW50IEVsZW1lbnQgdG8gYmUgYWRkZWRcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlVXAodGhpcy5oZWFwQXJyYXkucHVzaChlbGVtZW50KSAtIDEpO1xuICAgICAgICAgICAgdGhpcy5fYXBwbHlMaW1pdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGFuIGFycmF5IG9mIGVsZW1lbnRzIHRvIHRoZSBoZWFwLlxuICAgICAgICAgKiBTaW1pbGFyIGFzOiBwdXNoKGVsZW1lbnQsIGVsZW1lbnQsIC4uLikuXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IGVsZW1lbnRzIEVsZW1lbnRzIHRvIGJlIGFkZGVkXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWVcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmFkZEFsbCA9IGZ1bmN0aW9uIChlbGVtZW50cykge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgICAgIChfYSA9IHRoaXMuaGVhcEFycmF5KS5wdXNoLmFwcGx5KF9hLCBfX3NwcmVhZChlbGVtZW50cykpO1xuICAgICAgICAgICAgZm9yICh2YXIgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc29ydE5vZGVVcChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FwcGx5TGltaXQoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBib3R0b20gKGxvd2VzdCB2YWx1ZSkgTiBlbGVtZW50cyBvZiB0aGUgaGVhcC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBuICBOdW1iZXIgb2YgZWxlbWVudHMuXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fSAgICAgQXJyYXkgb2YgbGVuZ3RoIDw9IE4uXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5ib3R0b20gPSBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgaWYgKG4gPT09IHZvaWQgMCkgeyBuID0gMTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaGVhcEFycmF5Lmxlbmd0aCA9PT0gMCB8fCBuIDw9IDApIHtcbiAgICAgICAgICAgICAgICAvLyBOb3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5oZWFwQXJyYXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gSnVzdCB0aGUgcGVla1xuICAgICAgICAgICAgICAgIHJldHVybiBbdGhpcy5oZWFwQXJyYXlbMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobiA+PSB0aGlzLmhlYXBBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgd2hvbGUgaGVhcFxuICAgICAgICAgICAgICAgIHJldHVybiBfX3NwcmVhZCh0aGlzLmhlYXBBcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTb21lIGVsZW1lbnRzXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX2JvdHRvbU5fcHVzaCh+fm4pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiB0aGUgaGVhcCBpcyBzb3J0ZWQsIHVzZWZ1bCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgICAgICAgICogQHJldHVybiB7VW5kZWZpbmVkIHwgRWxlbWVudH0gIFJldHVybnMgYW4gZWxlbWVudCBpZiBzb21ldGhpbmcgd3JvbmcgaXMgZm91bmQsIG90aGVyd2lzZSBpdCdzIHVuZGVmaW5lZFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5LmZpbmQoZnVuY3Rpb24gKGVsLCBqKSB7IHJldHVybiAhIV90aGlzLmdldENoaWxkcmVuT2YoaikuZmluZChmdW5jdGlvbiAoY2gpIHsgcmV0dXJuIF90aGlzLmNvbXBhcmUoZWwsIGNoKSA+IDA7IH0pOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgb2YgdGhlIGVsZW1lbnRzIGZyb20gdGhpcyBoZWFwLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmhlYXBBcnJheSA9IFtdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2xvbmUgdGhpcyBoZWFwXG4gICAgICAgICAqIEByZXR1cm4ge0hlYXB9XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjbG9uZWQgPSBuZXcgSGVhcCh0aGlzLmNvbXBhcmF0b3IoKSk7XG4gICAgICAgICAgICBjbG9uZWQuaGVhcEFycmF5ID0gdGhpcy50b0FycmF5KCk7XG4gICAgICAgICAgICBjbG9uZWQuX2xpbWl0ID0gdGhpcy5fbGltaXQ7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmVkO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyB0aGUgY29tcGFyaXNvbiBmdW5jdGlvbi5cbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5jb21wYXJhdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tcGFyZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGlzIHF1ZXVlIGNvbnRhaW5zIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICAgICAgICogQHBhcmFtICB7YW55fSAgICAgIG8gICBFbGVtZW50IHRvIGJlIGZvdW5kXG4gICAgICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiAgT3B0aW9uYWwgY29tcGFyaXNvbiBmdW5jdGlvbiwgcmVjZWl2ZXMgKGVsZW1lbnQsIG5lZWRsZSlcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKG8sIGZuKSB7XG4gICAgICAgICAgICBpZiAoZm4gPT09IHZvaWQgMCkgeyBmbiA9IEhlYXAuZGVmYXVsdElzRXF1YWw7IH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYXBBcnJheS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsKSB7IHJldHVybiBmbihlbCwgbyk7IH0pID49IDA7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJbml0aWFsaXNlIGEgaGVhcCwgc29ydGluZyBub2Rlc1xuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gYXJyYXkgT3B0aW9uYWwgaW5pdGlhbCBzdGF0ZSBhcnJheVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5oZWFwQXJyYXkgPSBfX3NwcmVhZChhcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gTWF0aC5mbG9vcih0aGlzLmhlYXBBcnJheS5sZW5ndGgpOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlRG93bihpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2FwcGx5TGltaXQoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRlc3QgaWYgdGhlIGhlYXAgaGFzIG5vIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtCb29sZWFufSBUcnVlIGlmIG5vIGVsZW1lbnRzIG9uIHRoZSBoZWFwXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBsZWFmcyBvZiB0aGUgdHJlZSAobm8gY2hpbGRyZW4gbm9kZXMpXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5sZWFmcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhlYXBBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcGkgPSBIZWFwLmdldFBhcmVudEluZGV4T2YodGhpcy5oZWFwQXJyYXkubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFwQXJyYXkuc2xpY2UocGkgKyAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhlYXAucHJvdG90eXBlLCBcImxlbmd0aFwiLCB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIExlbmd0aCBvZiB0aGUgaGVhcC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhlYXAucHJvdG90eXBlLCBcImxpbWl0XCIsIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2V0IGxlbmd0aCBsaW1pdCBvZiB0aGUgaGVhcC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xpbWl0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU2V0IGxlbmd0aCBsaW1pdCBvZiB0aGUgaGVhcC5cbiAgICAgICAgICAgICAqIEByZXR1cm4ge051bWJlcn1cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAoX2wpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9saW1pdCA9IH5+X2w7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwbHlMaW1pdCgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICAvKipcbiAgICAgICAgICogVG9wIG5vZGUuIEFsaWFzZXM6IGBlbGVtZW50YC5cbiAgICAgICAgICogU2FtZSBhczogYHRvcCgxKVswXWBcbiAgICAgICAgICogQHJldHVybiB7YW55fSBUb3Agbm9kZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhlYXBBcnJheVswXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEV4dHJhY3QgdGhlIHRvcCBub2RlIChyb290KS4gQWxpYXNlczogYHBvbGxgLlxuICAgICAgICAgKiBAcmV0dXJuIHthbnl9IEV4dHJhY3RlZCB0b3Agbm9kZSwgdW5kZWZpbmVkIGlmIGVtcHR5XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IHRoaXMuaGVhcEFycmF5LnBvcCgpO1xuICAgICAgICAgICAgaWYgKHRoaXMubGVuZ3RoID4gMCAmJiBsYXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZXBsYWNlKGxhc3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxhc3Q7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQdXNoZXMgZWxlbWVudChzKSB0byB0aGUgaGVhcC5cbiAgICAgICAgICogQHBhcmFtICB7Li4uYW55fSBlbGVtZW50cyBFbGVtZW50cyB0byBpbnNlcnRcbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn0gVHJ1ZSBpZiBlbGVtZW50cyBhcmUgcHJlc2VudFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50c1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoZWxlbWVudHNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQWxsKGVsZW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhbWUgYXMgcHVzaCAmIHBvcCBpbiBzZXF1ZW5jZSwgYnV0IGZhc3RlclxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9IGVsZW1lbnQgRWxlbWVudCB0byBpbnNlcnRcbiAgICAgICAgICogQHJldHVybiB7YW55fSAgRXh0cmFjdGVkIHRvcCBub2RlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5wdXNocG9wID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBfYTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBhcmUodGhpcy5oZWFwQXJyYXlbMF0sIGVsZW1lbnQpIDwgMCkge1xuICAgICAgICAgICAgICAgIF9hID0gX19yZWFkKFt0aGlzLmhlYXBBcnJheVswXSwgZWxlbWVudF0sIDIpLCBlbGVtZW50ID0gX2FbMF0sIHRoaXMuaGVhcEFycmF5WzBdID0gX2FbMV07XG4gICAgICAgICAgICAgICAgdGhpcy5fc29ydE5vZGVEb3duKDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYW4gZWxlbWVudCBmcm9tIHRoZSBoZWFwLlxuICAgICAgICAgKiBAcGFyYW0gIHthbnl9ICAgbyAgICAgIEVsZW1lbnQgdG8gYmUgZm91bmRcbiAgICAgICAgICogQHBhcmFtICB7RnVuY3Rpb259IGZuICBPcHRpb25hbCBmdW5jdGlvbiB0byBjb21wYXJlXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgVHJ1ZSBpZiB0aGUgaGVhcCB3YXMgbW9kaWZpZWRcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChvLCBmbikge1xuICAgICAgICAgICAgaWYgKGZuID09PSB2b2lkIDApIHsgZm4gPSBIZWFwLmRlZmF1bHRJc0VxdWFsOyB9XG4gICAgICAgICAgICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmhlYXBBcnJheS5maW5kSW5kZXgoZnVuY3Rpb24gKGVsKSB7IHJldHVybiBmbihlbCwgbyk7IH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaWR4ID09PSB0aGlzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYXBBcnJheS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVhcEFycmF5LnNwbGljZShpZHgsIDEsIHRoaXMuaGVhcEFycmF5LnBvcCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zb3J0Tm9kZVVwKGlkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fc29ydE5vZGVEb3duKGlkeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBvcCB0aGUgY3VycmVudCBwZWVrIHZhbHVlLCBhbmQgYWRkIHRoZSBuZXcgaXRlbS5cbiAgICAgICAgICogQHBhcmFtICB7YW55fSBlbGVtZW50ICBFbGVtZW50IHRvIHJlcGxhY2UgcGVla1xuICAgICAgICAgKiBAcmV0dXJuIHthbnl9ICAgICAgICAgT2xkIHBlZWtcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHBlZWsgPSB0aGlzLmhlYXBBcnJheVswXTtcbiAgICAgICAgICAgIHRoaXMuaGVhcEFycmF5WzBdID0gZWxlbWVudDtcbiAgICAgICAgICAgIHRoaXMuX3NvcnROb2RlRG93bigwKTtcbiAgICAgICAgICAgIHJldHVybiBwZWVrO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogU2l6ZSBvZiB0aGUgaGVhcFxuICAgICAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSB0b3AgKGhpZ2hlc3QgdmFsdWUpIE4gZWxlbWVudHMgb2YgdGhlIGhlYXAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gbiAgTnVtYmVyIG9mIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgQXJyYXkgb2YgbGVuZ3RoIDw9IE4uXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgaWYgKG4gPT09IHZvaWQgMCkgeyBuID0gMTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaGVhcEFycmF5Lmxlbmd0aCA9PT0gMCB8fCBuIDw9IDApIHtcbiAgICAgICAgICAgICAgICAvLyBOb3RoaW5nIHRvIGRvXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5oZWFwQXJyYXkubGVuZ3RoID09PSAxIHx8IG4gPT09IDEpIHtcbiAgICAgICAgICAgICAgICAvLyBKdXN0IHRoZSBwZWVrXG4gICAgICAgICAgICAgICAgcmV0dXJuIFt0aGlzLmhlYXBBcnJheVswXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChuID49IHRoaXMuaGVhcEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSB3aG9sZSBwZWVrXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9fc3ByZWFkKHRoaXMuaGVhcEFycmF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNvbWUgZWxlbWVudHNcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fdG9wTl9wdXNoKH5+bik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsb25lIHRoZSBoZWFwJ3MgaW50ZXJuYWwgYXJyYXlcbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF9fc3ByZWFkKHRoaXMuaGVhcEFycmF5KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0cmluZyBvdXRwdXQsIGNhbGwgdG8gQXJyYXkucHJvdG90eXBlLnRvU3RyaW5nKClcbiAgICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFwQXJyYXkudG9TdHJpbmcoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgZWxlbWVudCBhdCB0aGUgZ2l2ZW4gaW5kZXguXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaSBJbmRleCB0byBnZXRcbiAgICAgICAgICogQHJldHVybiB7YW55fSAgICAgICBFbGVtZW50IGF0IHRoYXQgaW5kZXhcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5oZWFwQXJyYXlbaV07XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGVsZW1lbnRzIG9mIHRoZXNlIG5vZGUncyBjaGlsZHJlblxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkeCBOb2RlIGluZGV4XG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5KGFueSl9ICBDaGlsZHJlbiBlbGVtZW50c1xuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuZ2V0Q2hpbGRyZW5PZiA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaWR4KVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGkpIHsgcmV0dXJuIF90aGlzLmhlYXBBcnJheVtpXTsgfSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChlKSB7IHJldHVybiBlICE9PSB1bmRlZmluZWQ7IH0pO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBlbGVtZW50IG9mIHRoaXMgbm9kZSdzIHBhcmVudFxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGlkeCBOb2RlIGluZGV4XG4gICAgICAgICAqIEByZXR1cm4ge2FueX0gICAgIFBhcmVudCBlbGVtZW50XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5nZXRQYXJlbnRPZiA9IGZ1bmN0aW9uIChpZHgpIHtcbiAgICAgICAgICAgIHZhciBwaSA9IEhlYXAuZ2V0UGFyZW50SW5kZXhPZihpZHgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGVhcEFycmF5W3BpXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEl0ZXJhdG9yIGludGVyZmFjZVxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5sZW5ndGgpIHJldHVybiBbMyAvKmJyZWFrKi8sIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0IC8qeWllbGQqLywgdGhpcy5wb3AoKV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDBdO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6IHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYW4gaXRlcmF0b3IuIFRvIGNvbXBseSB3aXRoIEphdmEgaW50ZXJmYWNlLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuaXRlcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpbWl0IGhlYXAgc2l6ZSBpZiBuZWVkZWRcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl9hcHBseUxpbWl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2xpbWl0ICYmIHRoaXMuX2xpbWl0IDwgdGhpcy5oZWFwQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gdGhpcy5oZWFwQXJyYXkubGVuZ3RoIC0gdGhpcy5fbGltaXQ7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBtdWNoIGZhc3RlciB0aGFuIHNwbGljZVxuICAgICAgICAgICAgICAgIHdoaWxlIChybSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlYXBBcnJheS5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgLS1ybTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIGJvdHRvbSAobG93ZXN0IHZhbHVlKSBOIGVsZW1lbnRzIG9mIHRoZSBoZWFwLCB3aXRob3V0IGNvcm5lciBjYXNlcywgdW5zb3J0ZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBuICBOdW1iZXIgb2YgZWxlbWVudHMuXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fSAgICAgQXJyYXkgb2YgbGVuZ3RoIDw9IE4uXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fYm90dG9tTl9wdXNoID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgICAgIC8vIFVzZSBhbiBpbnZlcnRlZCBoZWFwXG4gICAgICAgICAgICB2YXIgYm90dG9tSGVhcCA9IG5ldyBIZWFwKHRoaXMuY29tcGFyZSk7XG4gICAgICAgICAgICBib3R0b21IZWFwLmxpbWl0ID0gbjtcbiAgICAgICAgICAgIGJvdHRvbUhlYXAuaGVhcEFycmF5ID0gdGhpcy5oZWFwQXJyYXkuc2xpY2UoLW4pO1xuICAgICAgICAgICAgYm90dG9tSGVhcC5pbml0KCk7XG4gICAgICAgICAgICB2YXIgc3RhcnRBdCA9IHRoaXMuaGVhcEFycmF5Lmxlbmd0aCAtIDEgLSBuO1xuICAgICAgICAgICAgdmFyIHBhcmVudFN0YXJ0QXQgPSBIZWFwLmdldFBhcmVudEluZGV4T2Yoc3RhcnRBdCk7XG4gICAgICAgICAgICB2YXIgaW5kaWNlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0QXQ7IGkgPiBwYXJlbnRTdGFydEF0OyAtLWkpIHtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5oZWFwQXJyYXk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGluZGljZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb21wYXJlKGFycltpXSwgYm90dG9tSGVhcC5wZWVrKCkpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBib3R0b21IZWFwLnJlcGxhY2UoYXJyW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgJSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goSGVhcC5nZXRQYXJlbnRJbmRleE9mKGkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBib3R0b21IZWFwLnRvQXJyYXkoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vdmUgYSBub2RlIHRvIGEgbmV3IGluZGV4LCBzd2l0Y2hpbmcgcGxhY2VzXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gaiBGaXJzdCBub2RlIGluZGV4XG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gayBBbm90aGVyIG5vZGUgaW5kZXhcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl9tb3ZlTm9kZSA9IGZ1bmN0aW9uIChqLCBrKSB7XG4gICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICBfYSA9IF9fcmVhZChbdGhpcy5oZWFwQXJyYXlba10sIHRoaXMuaGVhcEFycmF5W2pdXSwgMiksIHRoaXMuaGVhcEFycmF5W2pdID0gX2FbMF0sIHRoaXMuaGVhcEFycmF5W2tdID0gX2FbMV07XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNb3ZlIGEgbm9kZSBkb3duIHRoZSB0cmVlICh0byB0aGUgbGVhdmVzKSB0byBmaW5kIGEgcGxhY2Ugd2hlcmUgdGhlIGhlYXAgaXMgc29ydGVkLlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IGkgSW5kZXggb2YgdGhlIG5vZGVcbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl9zb3J0Tm9kZURvd24gPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIHZhciBtb3ZlSXQgPSBpIDwgdGhpcy5oZWFwQXJyYXkubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcy5oZWFwQXJyYXlbaV07XG4gICAgICAgICAgICB2YXIgZ2V0UG90ZW50aWFsUGFyZW50ID0gZnVuY3Rpb24gKGJlc3QsIGopIHtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMuaGVhcEFycmF5Lmxlbmd0aCA+IGogJiYgX3RoaXMuY29tcGFyZShfdGhpcy5oZWFwQXJyYXlbal0sIF90aGlzLmhlYXBBcnJheVtiZXN0XSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3QgPSBqO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYmVzdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3aGlsZSAobW92ZUl0KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuSWR4ID0gSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaSk7XG4gICAgICAgICAgICAgICAgdmFyIGJlc3RDaGlsZEluZGV4ID0gY2hpbGRyZW5JZHgucmVkdWNlKGdldFBvdGVudGlhbFBhcmVudCwgY2hpbGRyZW5JZHhbMF0pO1xuICAgICAgICAgICAgICAgIHZhciBiZXN0Q2hpbGQgPSB0aGlzLmhlYXBBcnJheVtiZXN0Q2hpbGRJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBiZXN0Q2hpbGQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuY29tcGFyZShzZWxmLCBiZXN0Q2hpbGQpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlTm9kZShpLCBiZXN0Q2hpbGRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGkgPSBiZXN0Q2hpbGRJbmRleDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1vdmVJdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1vdmUgYSBub2RlIHVwIHRoZSB0cmVlICh0byB0aGUgcm9vdCkgdG8gZmluZCBhIHBsYWNlIHdoZXJlIHRoZSBoZWFwIGlzIHNvcnRlZC5cbiAgICAgICAgICogQHBhcmFtICB7TnVtYmVyfSBpIEluZGV4IG9mIHRoZSBub2RlXG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fc29ydE5vZGVVcCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgbW92ZUl0ID0gaSA+IDA7XG4gICAgICAgICAgICB3aGlsZSAobW92ZUl0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBpID0gSGVhcC5nZXRQYXJlbnRJbmRleE9mKGkpO1xuICAgICAgICAgICAgICAgIGlmIChwaSA+PSAwICYmIHRoaXMuY29tcGFyZSh0aGlzLmhlYXBBcnJheVtwaV0sIHRoaXMuaGVhcEFycmF5W2ldKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZU5vZGUoaSwgcGkpO1xuICAgICAgICAgICAgICAgICAgICBpID0gcGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb3ZlSXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIHRvcCAoaGlnaGVzdCB2YWx1ZSkgTiBlbGVtZW50cyBvZiB0aGUgaGVhcCwgd2l0aG91dCBjb3JuZXIgY2FzZXMsIHVuc29ydGVkXG4gICAgICAgICAqIEltcGxlbWVudGF0aW9uOiBwdXNoLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9IG4gIE51bWJlciBvZiBlbGVtZW50cy5cbiAgICAgICAgICogQHJldHVybiB7QXJyYXl9ICAgICBBcnJheSBvZiBsZW5ndGggPD0gTi5cbiAgICAgICAgICovXG4gICAgICAgIEhlYXAucHJvdG90eXBlLl90b3BOX3B1c2ggPSBmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgLy8gVXNlIGFuIGludmVydGVkIGhlYXBcbiAgICAgICAgICAgIHZhciB0b3BIZWFwID0gbmV3IEhlYXAodGhpcy5faW52ZXJ0ZWRDb21wYXJlKTtcbiAgICAgICAgICAgIHRvcEhlYXAubGltaXQgPSBuO1xuICAgICAgICAgICAgdmFyIGluZGljZXMgPSBbMF07XG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5oZWFwQXJyYXk7XG4gICAgICAgICAgICB3aGlsZSAoaW5kaWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IGluZGljZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICBpZiAoaSA8IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvcEhlYXAubGVuZ3RoIDwgbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wSGVhcC5wdXNoKGFycltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2guYXBwbHkoaW5kaWNlcywgX19zcHJlYWQoSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNvbXBhcmUoYXJyW2ldLCB0b3BIZWFwLnBlZWsoKSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3BIZWFwLnJlcGxhY2UoYXJyW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGljZXMucHVzaC5hcHBseShpbmRpY2VzLCBfX3NwcmVhZChIZWFwLmdldENoaWxkcmVuSW5kZXhPZihpKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRvcEhlYXAudG9BcnJheSgpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSB0b3AgKGhpZ2hlc3QgdmFsdWUpIE4gZWxlbWVudHMgb2YgdGhlIGhlYXAsIHdpdGhvdXQgY29ybmVyIGNhc2VzLCB1bnNvcnRlZFxuICAgICAgICAgKiBJbXBsZW1lbnRhdGlvbjogaW5pdCArIHB1c2guXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gbiAgTnVtYmVyIG9mIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgIEFycmF5IG9mIGxlbmd0aCA8PSBOLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX3RvcE5fZmlsbCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICAvLyBVc2UgYW4gaW52ZXJ0ZWQgaGVhcFxuICAgICAgICAgICAgdmFyIGhlYXBBcnJheSA9IHRoaXMuaGVhcEFycmF5O1xuICAgICAgICAgICAgdmFyIHRvcEhlYXAgPSBuZXcgSGVhcCh0aGlzLl9pbnZlcnRlZENvbXBhcmUpO1xuICAgICAgICAgICAgdG9wSGVhcC5saW1pdCA9IG47XG4gICAgICAgICAgICB0b3BIZWFwLmhlYXBBcnJheSA9IGhlYXBBcnJheS5zbGljZSgwLCBuKTtcbiAgICAgICAgICAgIHRvcEhlYXAuaW5pdCgpO1xuICAgICAgICAgICAgdmFyIGJyYW5jaCA9IEhlYXAuZ2V0UGFyZW50SW5kZXhPZihuIC0gMSkgKyAxO1xuICAgICAgICAgICAgdmFyIGluZGljZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBicmFuY2g7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2guYXBwbHkoaW5kaWNlcywgX19zcHJlYWQoSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaSkuZmlsdGVyKGZ1bmN0aW9uIChsKSB7IHJldHVybiBsIDwgaGVhcEFycmF5Lmxlbmd0aDsgfSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgobiAtIDEpICUgMikge1xuICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChpbmRpY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBpID0gaW5kaWNlcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGlmIChpIDwgaGVhcEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jb21wYXJlKGhlYXBBcnJheVtpXSwgdG9wSGVhcC5wZWVrKCkpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9wSGVhcC5yZXBsYWNlKGhlYXBBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2guYXBwbHkoaW5kaWNlcywgX19zcHJlYWQoSGVhcC5nZXRDaGlsZHJlbkluZGV4T2YoaSkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0b3BIZWFwLnRvQXJyYXkoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiB0aGUgdG9wIChoaWdoZXN0IHZhbHVlKSBOIGVsZW1lbnRzIG9mIHRoZSBoZWFwLCB3aXRob3V0IGNvcm5lciBjYXNlcywgdW5zb3J0ZWRcbiAgICAgICAgICogSW1wbGVtZW50YXRpb246IGhlYXAuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSAge051bWJlcn0gbiAgTnVtYmVyIG9mIGVsZW1lbnRzLlxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX0gICAgIEFycmF5IG9mIGxlbmd0aCA8PSBOLlxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX3RvcE5faGVhcCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICB2YXIgdG9wSGVhcCA9IHRoaXMuY2xvbmUoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godG9wSGVhcC5wb3AoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIGluZGV4IG9mIHRoZSB0b3AgZWxlbWVudFxuICAgICAgICAgKiBAcGFyYW0gbGlzdFxuICAgICAgICAgKi9cbiAgICAgICAgSGVhcC5wcm90b3R5cGUuX3RvcElkeE9mID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgICAgICAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaWR4ID0gMDtcbiAgICAgICAgICAgIHZhciB0b3AgPSBsaXN0W2lkeF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tcCA9IHRoaXMuY29tcGFyZShsaXN0W2ldLCB0b3ApO1xuICAgICAgICAgICAgICAgIGlmIChjb21wIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBpZHggPSBpO1xuICAgICAgICAgICAgICAgICAgICB0b3AgPSBsaXN0W2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpZHg7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIHRvcCBlbGVtZW50XG4gICAgICAgICAqIEBwYXJhbSBsaXN0XG4gICAgICAgICAqL1xuICAgICAgICBIZWFwLnByb3RvdHlwZS5fdG9wT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGlzdCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICBsaXN0W19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGVhcCA9IG5ldyBIZWFwKHRoaXMuY29tcGFyZSk7XG4gICAgICAgICAgICBoZWFwLmluaXQobGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gaGVhcC5wZWVrKCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBIZWFwO1xuICAgIH0oKSk7XG5cbiAgICBleHBvcnRzLkhlYXAgPSBIZWFwO1xuICAgIGV4cG9ydHMuZGVmYXVsdCA9IEhlYXA7XG4gICAgZXhwb3J0cy50b0ludCA9IHRvSW50O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiJdfQ==
