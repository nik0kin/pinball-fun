
export function loadFromLocalStorage (defaultsMap) {
  return _.mapValues(defaultsMap, (defaultValue, key) => {
    return localStorage.getItem(key) || defaultValue;
  });
};

export function saveToLocalStorage (key, value)  {
  localStorage.setItem(key, value);
};

export function createLocalStorageObject (defaultsMap) {
  let obj = {};
  let values = loadFromLocalStorage(defaultsMap);

  obj.set = function (key, value) {
    values[key] = value;
    saveToLocalStorage(key, value);
  };

  obj.get = function (key, type) {
    if (type === Number) {
      return Number(values[key]);
    } else if (type === Boolean) {
      // if its a string, make it a boolean, if its a boolean let it be
      return (typeof(values[key]) === 'string' ? values[key] === 'true' : !!values[key]);
    }
    return values[key];
  };

  return obj;
};
