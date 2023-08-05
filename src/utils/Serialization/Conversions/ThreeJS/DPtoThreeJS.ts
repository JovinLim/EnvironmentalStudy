import Playground from '../../../playground'
import * as THREE from 'three'
import CustomObject from '../../Object/Object'
import CustomMesh from '../../Object/Geometry/CustomMesh'
import CustomFace from '../../Object/Geometry/CustomFace'
import { VisGuide } from '../../../DataVisualizationGuide'
import BIMElement from '../../Object/BIM/BIMElements'
import { processModel } from '../../../../App'
// TO DO
// FIX MATERIAL UPON IMPORT
// SET UP MATERIAL LIBRARY AND LINK TO THIS


export async function addObjectsToScene(playground_ : Playground) {

    // CLEARING CURRENT PLAYGROUND SCENE AND ADDING NEW GROUP
    const details_ = playground_.Details
    var meshGroup = new THREE.Group()
    meshGroup.name = `${details_.Uid}_meshgroup`

    // GETTING ALL OBJECTS FROM PLAYGROUND
    var objects = playground_.Details.objects as CustomObject[]

    // LOOP THROUGH ALL OBJECTS
    for (let o = 0; o < objects.length; o++){

        // Instantiating dynamic variables
        let material;

        // Getting Mesh and BIMElements
        var dMeshes_ = objects[o].geometry as CustomMesh[]
        var dBIMElem = objects[o].BIMElement as BIMElement

        // LOOPING THROUGH ALL MESHES
        for (let m = 0; m < dMeshes_.length; m++){

            var userdata_ = dMeshes_[m].userdata

            if (dBIMElem == undefined){
                material = new THREE.MeshStandardMaterial({color: THREE.Color.NAMES.gray})
                // material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide})
            }

            else {
                console.log('Material Library not set up')
            }

            // Creating typed array for vertices
            var mesh = dMeshes_[m]
            var mVertices = mesh.vertices_arr
            var mVertice_Values = [] as number[]
            mVertices.forEach((vertice) => {
                vertice.forEach((value) => {
                    mVertice_Values.push(value)
                })
            })
            var mVFA = new Float32Array(mVertice_Values)

            // Creating faces and indice list
            var faces_ = [] as CustomFace[]
            var mIndices = [] as number[]
            mesh.faces.forEach((face : any) => {
                faces_.push(Object.assign(new CustomFace(), face))
            })

            for (let f = 0; f < faces_.length; f++){
                let verticeIndList = faces_[f].vertexindices
                verticeIndList.forEach((ind:any) => {
                    mIndices.push(ind)
                })
            }
            var mIFA = new Float32Array(mIndices)

            // Creating geometry
            const geometry = new THREE.BufferGeometry()
            geometry.setIndex(mIndices)
            geometry.setAttribute('position', new THREE.BufferAttribute(mVFA, 3))
            geometry.computeVertexNormals()
            geometry.normalizeNormals()
            const tMesh = new THREE.Mesh(geometry, material)
            tMesh.receiveShadow = true
            tMesh.castShadow = true
            tMesh.name = `Project_${details_.Uid}_Mesh${m}`
            tMesh.userData = userdata_
            meshGroup.add(tMesh)
            console.log(tMesh)
        }

    }
    meshGroup.name = `Project_${playground_.Details.Uid}_models`
    processModel(meshGroup, playground_, 'import')
    playground_.scene.add(meshGroup)
}