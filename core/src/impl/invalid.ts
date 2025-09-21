export default class Invalid {
  constructor(private reason: string, private explanation?: string) {}

  toMessage() {
    if (this.explanation) {
      return `${this.reason}: ${this.explanation}`;
    } else {
      return this.reason;
    }
  }
}
