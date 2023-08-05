export default class BIMElement {
    private type_ = "none"

    public get BIMElement(): BIMElement {
        return this
    }

    public get type(): string {
        return this.type_
    }

    public set type(input_ : string) {
        this.type_ = input_
    }
}

