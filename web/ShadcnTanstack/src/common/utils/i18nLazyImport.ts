import { BackendModule, CallbackError, ResourceKey } from 'i18next';

const LazyImportPlugin: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language, namespace, callback) => {
    fetch(`/locales/${language}/${namespace}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${language}/${namespace}.json`);
        }
        return response.json();
      })
      .then((data: ResourceKey) => {
        callback(null, data);
      })
      .catch((error: CallbackError) => {
        callback(error, null);
      });
  },
  save: () => {},
  create: () => {},
};

export default LazyImportPlugin;
