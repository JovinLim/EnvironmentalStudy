/*
Custom objects which contain geometry and BIM information for file uploads. Will be used as an interface for all further functions after upload such as simulations and manipulations
CREATED BY Jovin
*/

import  CustomMesh  from './Geometry/CustomMesh'
import BIMElement from './BIM/BIMElements'
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