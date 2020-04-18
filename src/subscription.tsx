export default class Subscription {
  private alive = true;

  private listeners = new Set<() => void>();

  public addListener(callback: () => void): void {
    if (this.alive) {
      this.listeners.add(callback);
    }
  }

  public removeListener(callback: () => void): void {
    if (this.alive) {
      this.listeners.delete(callback);
    }
  }

  public cancel(): void {
    if (this.alive) {
      this.alive = false;
      this.listeners.forEach((cb) => cb());
    }
  }

  public get isCancelled(): boolean {
    return !this.alive;
  }
}
