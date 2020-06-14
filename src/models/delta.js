const util = require('util');

const labels = {
  beforeLabel: 'before',
  afterLabel: 'after',
  deletedLabel: 'deleted',
  createdLabel: 'created',
  chagedLabel: 'changed'
};

class Delta {
  constructor(options = {}) {
    this.ignore = options.ignore || [];
    this.labels = options.labels || labels;
    if (options.mode && options.mode.toLowerCase() === 'history') options.ignore.push('history');
    this.isValid();
    this.history = {};
  }

  getChanges(oldObj, newObj) {
    this.isValid(oldObj, newObj);
    if (this.isValue(oldObj) || this.isValue(newObj)) {
      if (oldObj === newObj) {
        return null; // do not save equal values
      }
      if (typeof oldObj === 'undefined') {
        return { [this.labels.createdLabel]: newObj };
      }
      if (typeof newObj === 'undefined') {
        return { [this.labels.deletedLabel]: oldObj };
      }
      return { [this.labels.beforeLabel]: oldObj, [this.labels.afterLabel]: newObj };
    }

    let diff = null;

    Object.keys(oldObj).forEach(key => {
      if (this.isFunction(oldObj[key]) || this.ignore[key]) {
        return;
      }
      let value2;
      if (typeof newObj[key] !== 'undefined') {
        value2 = newObj[key];
      }
      const diffs = this.getChanges(oldObj[key], value2);
      if (diffs) {
        if (!diff) diff = {};
        diff[key] = diffs;
      }
    });

    Object.keys(newObj).forEach(key => {
      if (this.isFunction(newObj[key]) || this.ignore[key] || typeof oldObj[key] !== 'undefined') {
        return;
      }
      const diffs = this.getChanges(undefined, newObj[key]);
      if (diffs) {
        if (!diff) diff = {};
        diff[key] = diffs;
      }
    });

    return diff;
  }

  getDelta(oldObj, newObj) {
    this.isValid(oldObj, newObj);
    if (this.isValue(oldObj) || this.isValue(newObj)) {
      if (oldObj === newObj) {
        return null; // do not save equal values
      }
      if (typeof oldObj === 'undefined') {
        return newObj;
      }
      if (typeof newObj === 'undefined') {
        return null;
      }
      return newObj;
    }

    if (this.isArray(oldObj) || this.isArray(oldObj)) {
      if (this.isArray(oldObj) && this.isArray(oldObj)) {
        return this.isEqualArrays(oldObj, newObj) ? null : newObj; // do not save equal values
      }
      if (typeof oldObj === 'undefined') {
        return newObj;
      }
      if (typeof newObj === 'undefined') {
        return null;
      }
      return newObj;
    }

    let diff = null;

    Object.keys(oldObj).forEach(key => {
      if (this.isFunction(oldObj[key]) || this.ignore[key]) {
        return;
      }
      let value2;
      if (typeof newObj[key] !== 'undefined') {
        value2 = newObj[key];
      }
      const diffs = this.getDelta(oldObj[key], value2);
      if (diffs) {
        if (!diff) diff = {};
        diff[key] = diffs;
      }
    });

    Object.keys(newObj).forEach(key => {
      if (this.isFunction(newObj[key]) || this.ignore[key] || typeof oldObj[key] !== 'undefined') {
        return;
      }
      const diffs = this.getDelta(undefined, newObj[key]);
      if (diffs) {
        if (!diff) diff = {};
        diff[key] = diffs;
      }
    });

    return diff;
  }

  createHistory(oldObj, newObj, user = 'anonymous', oldHistory = [], key) {
    let history = Object.assign([], oldHistory);
    this.isValid(oldObj, newObj);
    if (this.isValue(oldObj) || this.isValue(newObj)) {
      if (oldObj === newObj) {
        return history; // do not save equal values
      }
      if (typeof oldObj === 'undefined') {
        return history.concat([
          `${new Date().toISOString()} ${user} ${this.labels.createdLabel} property "${key}" with value "${toRead(
            newObj
          )}"`
        ]);
      }
      if (typeof newObj === 'undefined') {
        return history.concat([`${new Date().toISOString()} ${user} ${this.labels.deletedLabel} property "${key}"`]);
      }
      return history.concat([
        `${new Date().toISOString()} ${user} ${this.labels.chagedLabel} property "${key}" from value "${toRead(
          oldObj
        )}" to "${toRead(newObj)}"`
      ]);
    }

    if (this.isArray(oldObj) || this.isArray(oldObj)) {
      if (this.isArray(oldObj) && this.isArray(oldObj)) {
        if (!this.isEqualArrays(oldObj, newObj))
          return history.concat([
            `${new Date().toISOString()} ${user} ${this.labels.chagedLabel} property "${key}" from array "${toRead(
              oldObj
            )}" to "${toRead(newObj)}"`
          ]);
      }
      if (typeof oldObj === 'undefined') {
        return history.concat([
          `${new Date().toISOString()} ${user} ${this.labels.createdLabel} property "${key}" with array "${toRead(
            newObj
          )}"`
        ]);
      }
      if (typeof newObj === 'undefined') {
        return history.concat([`${new Date().toISOString()} ${user} ${this.labels.deletedLabel} property "${key}"`]);
      }
      return history.concat([
        `${new Date().toISOString()}   ${user}   ${this.labels.chagedLabel} from: ${oldObj}  to ${newObj}`
      ]);
    }

    Object.keys(oldObj).forEach(key => {
      if (this.isFunction(oldObj[key]) || this.ignore[key]) {
        return;
      }
      let value2;
      if (typeof newObj[key] !== 'undefined') {
        value2 = newObj[key];
      }
      // const test = this.createHistory(oldObj[key], value2, history);
      history = this.createHistory(oldObj[key], value2, user, history, key);
    });

    Object.keys(newObj).forEach(key => {
      if (this.isFunction(newObj[key]) || this.ignore[key] || typeof oldObj[key] !== 'undefined') {
        return;
      }
      history = this.createHistory(undefined, newObj[key], user, history, key);
    });

    return history;
  }

  isFunction(obj) {
    return {}.toString.apply(obj) === '[object Function]';
  }

  isArray(obj) {
    return {}.toString.apply(obj) === '[object Array]';
  }

  isObject(obj) {
    return {}.toString.apply(obj) === '[object Object]';
  }

  isValue(obj) {
    return typeof obj === 'undefined' || (!this.isObject(obj) && !this.isArray(obj));
  }

  isEqualArrays(array1, array2) {
    return array1.length === array2.length && array1.sort().every((value, index) => value === array2.sort()[index]);
  }

  isValid(oldObj, newObj) {
    if (this.isFunction(oldObj) || this.isFunction(newObj)) {
      throw new Object({
        code: 500,
        message: 'Diff failed. Invalid argument.'
      });
    }
  }
}

const toRead = value => {
  if ({}.toString.apply(value) === '[object Object]') {
    return util.inspect(value, false, null, true);
  }
  return value;
};

module.exports = Delta;
