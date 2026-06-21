class Singleton {
    instanceMap = {};
    instance(classSchema) {
        const className = classSchema.name;
        if (this.instanceMap[className] && this.instanceMap[className] instanceof classSchema) {
            return this.instanceMap[className];
        }
        else {
            this.instanceMap[className] = new classSchema();
        }
        return this.instanceMap[className];
    }
}
export default new Singleton();
