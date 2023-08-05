import  CustomMesh  from './Geometry/CustomMesh'
// import { Wall, Window } from './BIM/BIMElements'
import BIMElement from './BIM/BIMElements'
import Wall from './BIM/Wall'
import {v4 as uuidv4} from 'uuid';

export default class CustomObject {
    private Geometry = [] as CustomMesh[]
    private BuiltElement !: BIMElement
    public name !: string
    private uuid !: string

    public constructor (name = '', ) {
        this.uuid = uuidv4()
        this.name = ''
    }

    public get BIMElement() : BIMElement {
        return this.BuiltElement
    }

    public set BIMElement(BIMele : BIMElement) {
        this.BuiltElement = BIMele
    }

    public get geometry() : CustomMesh[] {
        return this.Geometry
    }

    public set geometry(meshes : CustomMesh[]) {
        this.Geometry = meshes
    }
}