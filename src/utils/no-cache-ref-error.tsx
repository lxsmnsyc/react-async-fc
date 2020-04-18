export default class NoCacheRefError extends Error {
  constructor() {
    super('No cache ref detected. In theory, this shouldn\'t happen.');
  }
}
