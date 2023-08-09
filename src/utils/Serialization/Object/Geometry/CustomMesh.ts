/*
Custom Mesh which contain geometry information for file uploads. Will be used as an interface as part of the class CustomObject for all further functions after upload such as 
simulations and manipulations
CREATED BY Jovin
*/

import {v4 as uuidv4} from 'uuid';
import * as glMatrix from 'gl-matrix';
import CustomFace from './CustomFace';

export default class CustomMesh {

    private id_ = uuidv4();
    private name = "";
    private faces_ = [] as CustomFace[]
    private faceIndicesList_ = [] as number[][]
    private vertices_ = [] as  glMatrix.vec3[]
    private MeshArea !: number
    private volume !: number
    private Normals = [] as glMatrix.vec3[]
    private _layer !: string
    private uv_ = [] as number[][]
    private userData_ !: any

    public constructor () {

    }

    public get userdata() : any {
        return this.userData_
    }

    public set userdata(data : any) {
        this.userData_ = data
    }

    public get id() : string {
        return this.id_
    }

    public set id(Uid : string) {
        this.id_ = Uid
    }

    public get faces(): CustomFace[] {
        return this.faces_
    }

    public addFace (faceVertIndices = <any>[] ) {

        if (this.vertices_ == undefined){
            console.log("Vertices Undefined")
            return "Vertices Undefined"
        }
        else {
            var face = new CustomFace()
            var faceIndices_ = []
            for (let i = 0; i < faceVertIndices.length; i++){
                face.vertexindices.push(faceVertIndices[i])
                face.vertices.push(this.vertices_[faceVertIndices[i]])
                faceIndices_.push(faceVertIndices[i])
            }
            this.faceIndicesList_.push(faceIndices_)
            this.faces.push(face)
        }
    }

    public get faceIndices() : number[][] {
        return this.faceIndicesList_
    }

    public get vertices_gl() : glMatrix.vec3[] {
        return this.vertices_
    }

    public get vertices_arr() : number[][] {
        var outArr = [] as number[][]
        this.vertices_.forEach((vertice_) => {
            var vertArr = [vertice_[0], vertice_[1], vertice_[2]]
            outArr.push(vertArr)
        })

        return outArr
    }

    public addVertex (vArr : number[]) {
        this.vertices_.push(glMatrix.vec3.fromValues(vArr[0],vArr[1],vArr[2]))
    }

    public get layer(): string {
        if (this._layer == undefined || this._layer == null){
            return "Mesh is not assigned to a layer"
        }

        else {
            return this._layer
        }
    }

    public set layer(target_ : string) {
        this._layer = target_
    }

    public get area(): any {
        if (this.MeshArea != undefined || this.MeshArea != null){
            return this.MeshArea
        }

        else {
            if (this.vertices_.length == 0 || this.faces.length == 0 ){
                return "Either vertices or faces are not set. Both are needed to calculate the area of the mesh."
            }
            
            else {
                this.CalculateMeshArea()
                if (this.MeshArea <= 0) {
                    return "Mesh has no area"
                }

                return this.MeshArea
            }
        }
    }

    private CalculateMeshArea() {
        var mArea = 0
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i]
            mArea += face.area
        }
        this.MeshArea = mArea
    }

    public get normals (): any {
        if (this.faces.length == 0) {
            return "Mesh has no faces"
        }

        else {
            for (let i = 0; i < this.faces.length; i++) {
                const n = this.faces[i].normal
                this.Normals.push(n)
            }
            var outArr = [] as number[][]
            this.Normals.forEach((normal_) => {
                var nArr = [normal_[0], normal_[1], normal_[2]]
                outArr.push(nArr)
            })
            return outArr
        }
    }

    public get uvs(): any {
        if (this.faces.length == 0){
            return "Mesh has no faces"
        }

        else {
            var n = this.vertices_.length
            // var vFA = new Float32Array(this.vertices_.length * 2)
            const d = 1/n
            let u, v=1, uvIdx = 0

            for (let i = 0; i < n; i++){
                u = 0.5 - i * d / 2 // Left vertex in row
                this.uv_.push([u,v])
                u += d // Left to right
                v -= d
            }

            return this.uv_

        }
    }

    public set uvs(uvList : number[][]) {
        this.uv_ = uvList
    }


}