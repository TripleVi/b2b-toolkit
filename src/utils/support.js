BSS_B2B.support.setDeveloperMode = function () {
  window.localStorage.developerMode = true;
  console.log(
    `%c[BSS_B2B LOG] window.localStorage.developerMode: ${window.localStorage.developerMode}`,
    'color: #00aaff; font-weight: bold'
  );
};

function getElements(selectorList, root = document) {
  return [...root.querySelectorAll(selectorList)];
}

function createDeepProxy(obj, callback) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === 'object' && value !== null) {
        return createDeepProxy(value, callback);
      }
      return value;
    },
    set(target, prop, value) {
      target[prop] = value;
      callback(prop, value);
      return true;
    },
  });
}

const docs = [
  `https://navy-temper-e3f.notion.site/Install-2b71dd53fedf80ed8aa4d721b36b905a`,
];
