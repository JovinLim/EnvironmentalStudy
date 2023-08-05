import BIMElement from "./BIMElements";

export default class Window extends BIMElement {
    material !: string
    area !: number

    public constructor() {
        super();
        super.type = "Window"
    }

    public get type(): string {
        return super.type
    }
}   