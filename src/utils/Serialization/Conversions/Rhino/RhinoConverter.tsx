import { customLoadRhinoFile } from './Rhino_Loader';
import rhino3dm, { Brep, BrepFace, Extrusion, Mesh, MeshFaceList, MeshVertexList, ObjectAttributes, RhinoModule } from 'rhino3dm';
import { ShowErrorAlert } from '../../../General/AlertHandler';
import { setDBStorage } from '../../../Storage/IndexedDBFunctions';
import CustomMesh from '../../Object/Geometry/CustomMesh';
import CustomObject from '../../Object/Object';

let rhino:any, doc:any

// Always have to instantiate an instance of Rhino before being able to create objects
rhino3dm().then(async m => {
    rhino = m // Local
})

export async function CustomtoRhino(objects: any) {
    var newDoc = new rhino.File3dm()
    newDoc.uni
    var rMeshes = [] as any[]
    var rBreps = [] as any[]
    await objects.forEach((obj_ : any) => {
        var rMeshFull = new rhino.Mesh()
        var cmesh = obj_.geometry
        cmesh.forEach(async (mesh_ : any) => {
            rMeshes.push( await CustomMeshtoRhinoMesh(mesh_))
        })
    })
    
    for (let m = 0; m < rMeshes.length; m++){
        const objattr_ = new rhino.ObjectAttributes()
        objattr_.layerIndex = 1
        await newDoc.objects().add(rMeshes[m], objattr_)
    }
}

function saveByteArray ( fileName : string, byte : any ) {
    let blob = new Blob( [ byte ], {type: 'application/octect-stream'} )
    let link = document.createElement( 'a' )
    link.href = window.URL.createObjectURL( blob )
    link.download = fileName
    link.click()
  }

export async function CustomMeshtoRhinoMesh(mesh_ : CustomMesh){
    var rMesh = new rhino.Mesh()
    var rMeshFaceList = rMesh.faces()
    var rMeshVertList = rMesh.vertices()
    var dFaces = mesh_.faces
    var dVert = mesh_.vertices_arr
    dVert.forEach((vert_) => {
        rMesh.vertices().add(vert_[0], vert_[1], vert_[2])
    })
    dFaces.forEach((face_) => {
        var dFaceVert = face_.vertices_arr
        var dFaceVertInd = face_.vertexindices
        rMesh.faces().addFace(dFaceVertInd[0], dFaceVertInd[1], dFaceVertInd[2])
        rMesh.vertexColors().add( 255, 0, 255 )
        rMesh.vertexColors().add( 0, 255, 255 )
        rMesh.vertexColors().add( 255, 255, 255 )
    })
    rMesh.normals().computeNormals()

    return rMesh
}

export async function toCustomMesh (Mesh : any) {
    var dmesh = new CustomMesh()

    await new Promise<void> ( async (resolve, reject) => {
        try {
            console.log('Converting Rhino Mesh to CustomMesh')
            
            var rmeshobj = Mesh
            rmeshobj.faces().convertQuadsToTriangles()
            var rmeshFList = rmeshobj.faces()
            var rmeshVList = rmeshobj.vertices()

            for (let j = 0; j < rmeshVList.count; j++){
                dmesh.addVertex(rmeshVList.get(j))
            }
        
            for (let i = 0; i < rmeshFList.count; i++){
                var face = rmeshFList.get(i)
                face.pop()
                dmesh.addFace(face)
            }
            
            resolve()
        }

        catch (error) {
            reject(error)
        }

    })

    return dmesh
}

export async function ListToCustomMesh(MeshList : any[], AttrList: any[], LayerList: any, details_ : any){
    var dMeshes = [] as CustomMesh[]
    for (let i = 0; i < MeshList.length; i++){
        var dMesh = await toCustomMesh(MeshList[i])
        dMesh.layer = LayerList.get(AttrList[i].layerIndex).name
        var userdata_ : Record<string, any> = {}
        for (const key in AttrList[i]){
            if (typeof(AttrList[i][key]) != 'function') {
                userdata_[key] = AttrList[i][key]
            }
        }
        dMesh.userdata = userdata_
        var normals = dMesh.normals // Instantiates calculation for normals
        dMeshes.push(dMesh)
    }
    return dMeshes
}

export async function RhinoToCustomMesh( details_ : any ) {

    if (details_.fileBlob == 0){
        console.log('No Rhino file uploaded')
        return 0
    }

    var doc = (await customLoadRhinoFile(details_)) as any
    var layers = doc.layers()

    // Get all objects in building layers and convert to mesh
    var bMesh_list = []
    var objAttr_list = []
    var objects = doc.objects()
    for (let i = 0; i < objects.count; i++){
        let obj = objects.get(i)
        let geom = obj.geometry()
        console.log(`Object Type : ${geom.constructor.name}`)
        if (geom.constructor.name == "Mesh"){
            bMesh_list.push(geom)
            objAttr_list.push(obj.attributes())

        }

        else if (geom.constructor.name == "Extrusion"){
            console.log('Converting Rhino Extrusion to Rhino Mesh')
            var mesh = geom.getMesh(0)
            bMesh_list.push(mesh)
            objAttr_list.push(obj.attributes())
        }

        else if (geom.constructor.name == "Brep"){
            console.log('Converting Rhino BREP to Rhino Mesh')
            // NEED TO SAVE RHINO FILE WITH AT LEAST 1 SHADED MODE VIEWPORT TO DETECT BREPS
            var faces = geom.faces()
            if (faces.count == 0 || faces.count == undefined) {
                ShowErrorAlert('If you have a brep or polysurface please save your Rhino file with at least 1 view in shaded mode')
                bMesh_list = []
                return 0
            }

            else {
                let brepMesh = faces.get(0).getMesh(0);
                for (let i = 0; i < faces.count; i++){
                    if (i == 0){
                        continue
                    }
                    else {
                        brepMesh.append(faces.get(i).getMesh(0) as Mesh)
                    }
                }
                bMesh_list.push(brepMesh)
                // var attrData = {}
                // for (var attr in obj.attributes()){
                //     attrData[attr] = (obj.attributes())[attr]
                // }
                // objAttr_list.push(attrData)
                objAttr_list.push(obj.attributes())
            }
        }

    }
    var cMeshList = await ListToCustomMesh(bMesh_list, objAttr_list, layers, details_)
    return [cMeshList, objAttr_list]
}

export async function RhinoFileToCustomObject (details_ : any) {
    var cObjList = [] as CustomObject[]
    var [cMeshList, AttrList] = await RhinoToCustomMesh(details_) as any
    cMeshList.forEach((dMesh_ : CustomMesh) => {
        var dObj = new CustomObject()
        dObj.geometry = [dMesh_]
        cObjList.push(dObj)
    })
    details_.objects = cObjList
    // await setDBStorage('App')
}