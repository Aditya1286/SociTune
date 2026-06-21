class Singleton {
  private instanceMap: { [key: string]: unknown } = {};

  instance<T>(classSchema: new () => unknown) {
    const className = classSchema.name;
    if (this.instanceMap[className] && this.instanceMap[className] instanceof classSchema) {
      return this.instanceMap[className] as T;
    } else {
      this.instanceMap[className] = new classSchema();
    }
    return this.instanceMap[className] as T;
  }
}

export default new Singleton();
