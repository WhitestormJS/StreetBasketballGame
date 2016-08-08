'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Points = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _three = require('three');

var THREE = _interopRequireWildcard(_three);

var _api = require('./api');

var _defaults = require('../utils/defaults');

var _Object = require('../core/Object');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Points = function (_WHSObject) {
  (0, _inherits3.default)(Points, _WHSObject);

  /**
   * Create points.
   *
   * Todo
   */

  function Points(params) {
    var _ret;

    (0, _classCallCheck3.default)(this, Points);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Points).call(this, {
      geometry: false,

      material: {
        kind: 'points'
      }
    }));

    (0, _get3.default)((0, _getPrototypeOf2.default)(Points.prototype), 'setParams', _this).call(_this, params);

    var _verts = params.geometry.points;

    var points = new THREE.Points(params.geometry, (0, _api.loadMaterial)(params.material));

    _this.setNative(points);

    var scope = (0, _assign2.default)(_this, {
      _type: 'points'
    });

    return _ret = scope, (0, _possibleConstructorReturn3.default)(_this, _ret);
  }

  /**
   * Add curve to scene.
   */


  (0, _createClass3.default)(Points, [{
    key: 'addTo',
    value: function addTo(parent) {
      var _scope = this;
      _scope.parent = parent;

      return new _promise2.default(function (resolve, reject) {
        try {
          _scope.parent.getScene().add(_scope.getNative());
          _scope.parent.children.push(_scope);
        } catch (err) {
          console.error(err.message);
          reject();
        } finally {
          if (_defaults.defaults.debug) {
            console.debug('@WHS.Curve: Curve ' + _scope._type + ' was added to world.', [_scope, _scope.parent]);
          }

          resolve(_scope);
        }
      });
    }

    /**
     * Clone curve.
     */

  }, {
    key: 'clone',
    value: function clone() {
      return new Points(this.__params).copy(this);
    }

    /**
     * Copy curve.
     *
     * @param {WHS.Points} source - Source object, that will be applied to this.
     */

  }, {
    key: 'copy',
    value: function copy(source) {
      this.setNative(source.getNative().clone());

      this._type = source._type;

      return this;
    }

    /**
     * Remove this curve from world.
     *
     * @return {WHS.Points} - this.
     */

  }, {
    key: 'remove',
    value: function remove() {
      this.parent.getScene().remove(this.getNative());

      this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.parent = null;

      this.emit('remove');

      if (_defaults.defaults.debug) {
        console.debug('@WHS.Points: Curve ' + this._type + ' was removed from world', [_scope]);
      }

      return this;
    }
  }]);
  return Points;
}(_Object.WHSObject);

exports.Points = Points;
//# sourceMappingURL=Points.js.map
