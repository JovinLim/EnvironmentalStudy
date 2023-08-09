import * as THREE from "three"
import { playground, processModel } from "../../App"
import CustomMesh from "../../utils/Serialization/Object/Geometry/CustomMesh"
import CustomObject from "../../utils/Serialization/Object/Object"
import Playground from "../../utils/playground"
import { setDBStorage } from "../../utils/Storage/IndexedDBFunctions"


let simulation_url = import.meta.env.VITE_FILE_HOST
let res_url = import.meta.env.VITE_RES_HOST

export async function requestSimPreparation(playground_ : Playground){
    let verts = [], faces = [], Uids = [], layers = []
    var objects = playground_.Details.objects
    for (let o = 0; o < objects.length; o++){
      var obj = Object.assign(new CustomObject, objects[o])
      var geom = obj.geometry
      for (let g = 0; g < geom.length; g++){
        var mesh = Object.assign(new CustomMesh, geom[g])
        verts.push(mesh.vertices_arr)
        faces.push(mesh.faceIndices)
        Uids.push(mesh.id)
        layers.push(mesh.layer)
      }
    }
    var vertsJSON = JSON.stringify(verts)
    var facesJSON = JSON.stringify(faces)
    var UidJSON = JSON.stringify(Uids)
    var layersJSON = JSON.stringify(layers)
  
    let formData = new FormData()
    formData.append('project_name',"Scene_"+String(playground_.Details.Uid))
    formData.append('file_type', playground_.Details.fileInfo.filetype)
  
    // Can put a preliminary check here to see if input layers are same as that in the imported model file(s)
    formData.append('blayers', playground_.Details.blayers)
    formData.append('olayers', playground_.Details.olayers)
  
    // TODO: Dynamically download EPW when a new location is picked and there is no cached EPW
    formData.append('address', JSON.stringify(playground_.Details.address))
    formData.append('epw_url', playground_.Details.epwURL)
    // formData.append('simOptions', JSON.stringify(sim_options))
    formData.append('fileBlob', playground_.Details.fileBlob)
    formData.append('mesh_vertices', vertsJSON)
    formData.append('face_indices', facesJSON)
    formData.append('mesh_Uid', UidJSON)
    formData.append('mesh_layers', layersJSON)
  
    let request = {
      method: 'POST',
      body: formData,
    }
    return request
  }

  export async function requestResPreparation(playground_ : Playground){
  
    let formData = new FormData()
    formData.append('project_name',"Scene_"+String(playground_.Details.Uid))
    formData.append('file_type', playground_.Details.fileInfo.filetype)
  
    // Can put a preliminary check here to see if input layers are same as that in the imported model file(s)
    formData.append('blayers', playground_.Details.blayers)
    formData.append('olayers', playground_.Details.olayers)
  
    // TODO: Dynamically download EPW when a new location is picked and there is no cached EPW
    formData.append('address', JSON.stringify(playground_.Details.address))
    formData.append('epw_url', playground_.Details.epwURL)
    // formData.append('simOptions', JSON.stringify(sim_options))
    formData.append('fileBlob', playground_.Details.fileBlob)
    formData.append('downloads_folder', playground_.Details.simResultFolder)
  
    let request = {
      method: 'POST',
      body: formData,
    }
    return request
  }

  
  export async function runRadiationSimulation(){
    const playground_ = playground()
    let downloadfolder;
    try {
        const request = await requestSimPreparation(playground_)
        let response = await fetch(simulation_url + "/radiation", request)
        let result = await response.json()
        downloadfolder = result['download_folder']
        playground_.Details.simResultFolder = downloadfolder
    }
    catch (e) {
        console.log(e)
        return e
    }

    try {
        const request = await requestResPreparation(playground_)
        // Getting simulation mesh with colors
        var simMesh = await new Promise(async (resolve, reject) => {
            try {
              await fetch(res_url, request)
              .then((response) => {
                return response.json()
              })
              .then((result) => {
                // simMesh = new THREE.ObjectLoader().parse(result['jsonMesh'])
                resolve(new THREE.ObjectLoader().parse(result['jsonMesh']))
              })
            }
            catch (error) {
              console.log(error)
              reject(error)
            }
          }) as THREE.Object3D
  
          var group = await processModel(simMesh, playground_, 'result') as unknown as THREE.Object3D
          group.name = "Simulation_"+playground_.Details.Uid
  
          // Adding simulation output mesh to scene
          playground_.scene.add(group)
          setDBStorage('App')
        }
    catch (e) {
        console.log(e)
        return e
    }
}