/*
Custom Face which make up CustomMeshes. Will be used as an interface as part of the class CustomObject for all further functions after upload such as 
simulations and manipulations
CREATED BY Jovin

TO DO:
CHANGE TO USE FLOATARRAYS TO SAVE RAM AND PREVENT MISTAKES IN DATA ALTERATION
*/

import {v4 as uuidv4} from 'uuid';
import * as glMatrix from 'gl-matrix';

export default class CustomFace {

    private id = uuidv4();
    private name = "";
    private _FaceNormal !: glMatrix.vec3
    private _vertices = [] as glMatrix.vec3[]
    private _vertexindices = [] as number[]
    private _FaceArea !: number
    private _Facing !: string
    
    public constructor () {

    }

    public get vertices_arr() : number[][] {
        var outArr = [] as number[][]
        this._vertices.forEach((_vertices) => {
            var vertArr = [_vertices[0], _vertices[1], _vertices[2]]
            outArr.push(vertArr)
        })

        return outArr
    }

    public get vertices(): glMatrix.vec3[] {
        return this._vertices
    }

    public set vertices(list : glMatrix.vec3[]){
        this._vertices = list
    }

    public get vertexindices(): number[] {
        return this._vertexindices
    }

    public set vertexindices(list : number[]){
        this._vertexindices = list
    }

    public addVertex (vArr : number[]) {
        this.vertices.push(glMatrix.vec3.fromValues(vArr[0],vArr[1],vArr[2]))
    }

    public get area(): any {
        if (this._FaceArea != undefined || this._FaceArea != null){
            return this._FaceArea
        }

        else {
            if (this.vertices.length == 0){
                return "Vertices of this face is not set. Need vertices to calculate area."
            }
            
            else {
                this.CalculateFaceArea()
                if (this._FaceArea <= 0) {
                    return "Mesh has no area"
                }

                return this._FaceArea
            }
        }
    }

    private CalculateFaceArea() {
        const p0p1 = glMatrix.vec3.subtract( glMatrix.vec3.create(), this.vertices[1], this.vertices[0])
        const p0p2 = glMatrix.vec3.subtract( glMatrix.vec3.create(), this.vertices[2], this.vertices[0])

        const a = Math.abs(0.5 * glMatrix.vec3.length(glMatrix.vec3.cross( glMatrix.vec3.create(), p0p1, p0p2)))
        this._FaceArea = a
    }

    public get normal() : any {

        if (this.vertices.length == 0){
            return "Vertices of this face is not set. Need vertices to calculate area."
        }
        else {
            if (this._FaceNormal != undefined) {
                return (this._FaceNormal)
            }
            else {
                const v1 = glMatrix.vec3.subtract(glMatrix.vec3.create(), this.vertices[1], this.vertices[0])
                const v2 = glMatrix.vec3.subtract(glMatrix.vec3.create(), this.vertices[2], this.vertices[1])
                const fN = glMatrix.vec3.normalize(glMatrix.vec3.create(), glMatrix.vec3.cross(glMatrix.vec3.create(), v1, v2))
                this._FaceNormal = fN
                return (this._FaceNormal)
            }
        }
    }

    public get direction() : string {
        if (this.vertices.length == 0){
            return "Vertices of this face is not set. Need vertices to calculate area."
        }
        else {
            if (this._FaceNormal != undefined){
                // Get direction with face normal
                if (this._FaceNormal[0] == 0 && this._FaceNormal[1] == 0){ // If X and Y of normal == 0, assume it is facing up /down
                    if (this._FaceNormal[2] < 0){
                        this._Facing = "Down"
                    }

                    else if (this._FaceNormal[2] >= 0) {
                        this._Facing = "Up"
                    }

                    return this._Facing
                }

                else { // Flatten to 2D and calculate facing for cardinal directions
                    this.CalcFacing()
                    return this._Facing
                }
            }

            else if (this._FaceNormal == undefined || this._FaceNormal == null){
                // Calculate face normal, then get direction
                this.normal
                // Get direction with face normal
                if (this._FaceNormal[0] == 0 && this._FaceNormal[1] == 0){ // If X and Y of normal == 0, assume it is facing up /down
                    if (this._FaceNormal[2] < 0){
                        this._Facing = "Down"
                    }

                    else if (this._FaceNormal[2] >= 0) {
                        this._Facing = "Up"
                    }

                    return this._Facing
                }

                else { // Flatten to 2D and calculate facing for cardinal directions
                    this.CalcFacing()
                    return this._Facing
                }

            }
        }
        return ""
    }

    private CalcFacing() {
        var angle_Xaxis =  Math.atan2( this._FaceNormal[1], this._FaceNormal[0] ) * (180 / Math.PI) // In degrees
        if (angle_Xaxis < 0){
            angle_Xaxis += 360 // Adjust angle to be between 0 and 360 degrees
        }

        // console.log(`X: ${this.FaceNormal[0]} | Y: ${this.FaceNormal[1]}`)
        
        if (angle_Xaxis <= 22.5 || angle_Xaxis > 337.5 ){
            this._Facing = "East"
        }

        else if (angle_Xaxis <= 67.5 && angle_Xaxis > 22.5 ){
            this._Facing = "NorthEast"
        }

        else if (angle_Xaxis <= 112.5 && angle_Xaxis > 67.5 ){
            this._Facing = "North"
        }

        else if (angle_Xaxis <= 157.5 && angle_Xaxis > 112.5 ){
            this._Facing = "NorthWest"
        }

        else if (angle_Xaxis <= 202.5 && angle_Xaxis > 157.5 ){
            this._Facing = "West"
        }

        else if (angle_Xaxis <= 247.5 && angle_Xaxis > 202.5 ){
            this._Facing = "SouthWest"
        }

        else if (angle_Xaxis <= 292.5 && angle_Xaxis > 247.5 ){
            this._Facing = "South"
        }

        else if (angle_Xaxis <= 337.5 && angle_Xaxis > 292.5 ){
            this._Facing = "SouthEast"
        }

        // console.log(`Angle : ${angle_Xaxis} | Direction : ${this.Facing}`)
    }
}