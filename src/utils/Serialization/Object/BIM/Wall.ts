import BIMElement from "./BIMElements";

export default class Wall extends BIMElement {
    material !: string
    area !: number
    
    public constructor() {
        super();
        super.type = "Wall"
    }

    public get type(): string {
        return super.type
    }
}   