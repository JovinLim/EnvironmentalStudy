/*
Sunpath Diagram Main Page

CREATED BY JOVIN

Canvas: 3D viewer for our scene which will contain a 3D sunpath diagram
Import Model: Currently only accepts 3DM files
Location: TO UPDATE AFTER CLICK
Climate Information: TO UPDATE TO LINK TO PROPER SITE
*/

import { createSignal, type Component, onMount } from 'solid-js'
import {v4 as uuidv4} from 'uuid'
import './index.css'
import { Rhino3dmLoader } from './utils/RhinoLoaderDup.js'
import Playground from './utils/playground'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import LocationSelector from './Components/Geoservices/LocationSelector'
import { buildMap } from './Components/Geoservices/OpenLayersMap.cjs'
import { RhinoFileToCustomObject } from './utils/Serialization/Conversions/Rhino/RhinoConverter'
import { addObjectsToScene } from './utils/Serialization/Conversions/ThreeJS/DPtoThreeJS'
import { HardReset, createDatabase, createLogDatabase, getDBStorage_Refresh, setDBStorage } from './utils/Storage/IndexedDBFunctions'
import rhino3dm from 'rhino3dm'
import { runRadiationSimulation } from './Components/Simulation/Simulate'
import { HideWarningAlert } from './utils/General/AlertHandler'
// import { exec } from "child_process"
// import { createDatabase, createLogDatabase, setDBStorage } from './utils/Storage/IndexedDBFunctions'


let simulation_url = import.meta.env.VITE_FILE_HOST

// Create signal to export the Playground object, allows access from different files
export const [playground, setPlayground] = createSignal<Playground>()
const reader = new FileReader()
let fileRef: HTMLInputElement;
let mtlRef: HTMLInputElement;

export async function toggleOptionsList(container_id : string, chevron_id = ""){
  /*
    Toggling opening and closing a dropdown list
    
    Arguments:
      - container_id : the id of HTMLDivElement as a string
      - chevron_id : the id of SVG Element as a string

    Returns:
      -

    Notes:
      - If there is no chevron, code will ignore and only open and close dropdown list
  */
  const container_ = document.getElementById(container_id) as HTMLDivElement

  if (container_.getAttribute("show") == "false"){
    if (chevron_id != ""){
      const chevron_ = document.querySelector(`#${chevron_id}`) as SVGSVGElement
      chevron_.setAttribute("class", "w-4 h-4 rotate-open")
    }

    var containerClass = container_.className as string
    if (containerClass.includes('hidden')) {
      var containerClass = containerClass.split('hidden')[0]
    }

    container_.className = `${containerClass}`
    container_.setAttribute('show', 'true')
  }

  else if (container_.getAttribute("show") == "true"){
    if (chevron_id != ""){
      const chevron_ = document.querySelector(`#${chevron_id}`) as SVGSVGElement
      chevron_.setAttribute("class", "w-4 h-4 rotate-close")
    }

    container_.className = `${container_.className} hidden`
    container_.setAttribute('show', 'false')
  }
}

export async function InitializePlayground(uuid_ = "") {
  /*
    Initialize Playground object
    
    Arguments:
      - 

    Returns:
      -

    Notes:
      - Creates an assigns a randomly generated UUID for the Playground object which will be used for any HTML elements associated with it
        for future purposes when there needs to be more than one 3D viewer.
  */
  let Uid;
  if (uuid_ == ""){
    Uid = uuidv4()
  }

  else {
    Uid = uuid_
  }
  const canvasDiv = document.getElementById("canvas") as HTMLDivElement
  const playground_ = new Playground(canvasDiv)
  playground_.Details.Uid = Uid
  setPlayground(playground_)
  const sceneDom = (playground() as Playground).domElement
  canvasDiv.appendChild(sceneDom)
  sceneDom.focus()

}

export async function processModel(model : THREE.Group | THREE.Object3D, playground_ : Playground, context : string) {
  /*
    Process uploaded models to ensure it fits within the sunpath diagram
    
    Arguments:
      - model : THREE.Group or THREE.Object3D
      - playground_ : Playground
      - context : 'import' or 'result' (string)

    Returns:
      - THREE.Group

    Notes:
      - 
  */

  // Get sphere radius
  const sphereRad = playground_.Details.sphereRad

  let center = new THREE.Vector3()
  let size = new THREE.Vector3()

  if (context === 'import') {
      // Getting model size and center
      let modelbox = new THREE.Box3().setFromObject(model)
      modelbox.getSize(size)

      var oCenter = new THREE.Vector3()
      modelbox.getCenter(oCenter)

      var bbox = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z))
      bbox.name = 'bounding_box'
      var bboxJSON = bbox.toJSON()
      playground_.Details.boundingbox.geometry = bboxJSON
      playground_.Details.boundingbox.center = oCenter

      var proportion = Math.min( (sphereRad * 2 * 0.6) / size.x, (sphereRad * 0.6) / size.y, (sphereRad * 2 * 0.6) / size.z)
      model.scale.set(proportion, proportion, proportion)
      playground_.Details.modelScaling = proportion
      let modelbox2 = new THREE.Box3().setFromObject(model)
      modelbox2.getCenter(center)
      model.position.set(-center.x, -center.y, 0)
  }

  else if (context === 'result') {
      // Getting original bounding box of model with context
      var obbox = new THREE.ObjectLoader().parse(playground_.Details.boundingbox.geometry)
      var oCenter_ = playground_.Details.boundingbox.center as THREE.Vector3
      obbox.position.set(oCenter_.x, oCenter_.y, oCenter_.z)
      var group = new THREE.Group()
      group.add(model)
      group.add(obbox)

      var position_ = new THREE.Vector3()

      let modelbox = new THREE.Box3().setFromObject(group)
      modelbox.getSize(size)

      var proportion = Math.min( (sphereRad * 2 * 0.6) / size.x, (sphereRad * 0.6) / size.y, (sphereRad * 2 * 0.6) / size.z)
      group.scale.set(proportion, proportion, proportion)
      let modelbox2 = new THREE.Box3().setFromObject(group)
      modelbox2.getCenter(center)
      // console.log(center)
      group.position.set(-center.x, -center.y, 0)
      group.remove(obbox)
      return group
  }

}

export async function uploadModel(upload : HTMLInputElement, mtl_upload : HTMLInputElement, e : Event) {
  /*
    Uses javascript to click the upload button that opens up the file explorer for model input, put in this function in case there 
    are any more functions to carry out when import model button is clicked
    
    Arguments:
      - upload : Target HTMLInputElement for 3D model file
      - mtl_upload : Target HTMLInputElement for material file if needed
      - e : Click event

    Returns:
      -

    Notes:
      - 
  */
  upload.click();
}

export async function customLoadRhinoFile(details_ : any, mode = "model"){
  let targetBlob : Blob;
  if(mode === "model"){
    targetBlob = details_.fileBlob;
  }else{
    targetBlob = details_.simBlob;
    console.log(targetBlob)
  }
  let file3dm;
  await rhino3dm().then(async (rhino : any) => {
    console.log('Loaded rhino3dm.js')
    let buffer = await targetBlob.arrayBuffer()
    let arr = new Uint8Array(buffer)
    file3dm = rhino.File3dm.fromByteArray(arr)
  })
  return file3dm
}

function updatePlaygroundFileInfo(playground_ : Playground, file: FileList) {
  playground_.Details.fileInfo.filename = file[0].name
  playground_.Details.fileInfo.filesize = (file[0].size * 0.000001).toFixed(3)
  playground_.Details.fileInfo.filetype = file[0].name.slice(-3).toUpperCase()
}

export async function addFileLayerHeaders() {
  // Get HTML div of the layer container
  var layerContainerDiv = document.getElementById('layerHeaderContainer') as HTMLDivElement;

  // Adding header row
  var headerDiv = document.createElement('div')
  headerDiv.className = "flex items-center mb-4"
  headerDiv.style.flexDirection = "row"
  headerDiv.style.paddingTop = "20px"

  // Adding building layer header
  var bLayerHeader = document.createElement('label')
  bLayerHeader.innerHTML = `Layers`
  bLayerHeader.className = "ml-2 text-sm font-medium text-gray-200"
  bLayerHeader.style.paddingRight = "60px"

  // Adding visibility header
  var visLayerHeader = document.createElement('label')
  visLayerHeader.innerHTML = `Visibility`
  visLayerHeader.className = "ml-2 text-sm font-medium text-gray-200"
  visLayerHeader.style.paddingRight = "15px"

  // Adding building header
  var BLayerHeader = document.createElement('label')
  BLayerHeader.innerHTML = `Building`
  BLayerHeader.className = "ml-2 text-sm font-medium text-gray-200"
  BLayerHeader.style.paddingRight = "15px"

  // Adding context header
  var CLayerHeader = document.createElement('label')
  CLayerHeader.innerHTML = `Context`
  CLayerHeader.className = "ml-2 text-sm font-medium text-gray-200"
  CLayerHeader.style.paddingRight = "20px"

  // Adding child div elements to parents
  headerDiv.appendChild(bLayerHeader)
  headerDiv.appendChild(visLayerHeader)
  headerDiv.appendChild(BLayerHeader)
  headerDiv.appendChild(CLayerHeader)
  // layerContainerDiv.appendChild(headerDiv)
  layerContainerDiv.insertBefore(headerDiv, layerContainerDiv.children[0])
}

export async function updateModelLayers (playground_ : Playground, refresh : boolean) {

  await addFileLayerHeaders()
  // Get HTML div of the layer container
  var layerContainerDiv = document.getElementById('FileLayersContainer') as HTMLDivElement
  let bStrings = playground_.Details.blayers.split(',')
  let oStrings = playground_.Details.olayers.split(',')

  if (!refresh){
    layerContainerDiv.replaceChildren();
    // Check filetype
    var fileType = playground_.Details.fileInfo.filetype;
    // Decide what to do based on file type
    switch (fileType) {
      case "3DM":
        var doc = (await customLoadRhinoFile(playground_.Details)) as any
        var layers = doc.layers()
        var layers_list = []
        // Append layers to list (for identifying by index)
        for (let i = 0; i < layers.count(); i++){
          let layer = layers.get(i)
          layers_list.push(layer.name)
          var layerDiv = document.createElement('div')
          layerDiv.className = "flex items-center mb-4"
          layerDiv.style.flexDirection = "row"
          layerDiv.setAttribute("LayerName", layer.name)

          // Creating label
          var layerLabel = document.createElement('label')
          layerLabel.innerHTML = `${layer.name}`
          layerLabel.className = "ml-2 text-sm font-medium text-gray-200"
          layerLabel.style.paddingRight = "80px"
          layerLabel.style.overflow = "hidden"
          layerLabel.style.width = "130px"

          // Creating visibility checkbox
          var layerVisInput = document.createElement('input')
          layerVisInput.type = "checkbox"
          layerVisInput.className = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          layerVisInput.id = `${layer.name}-visibility`
          layerVisInput.style.marginRight = "60px"
          layerVisInput.setAttribute("checked", "checked")
          layerVisInput.setAttribute("Index", i.toString())

        // Set all children to be visible
          let simObject : any = undefined;
          playground_.scene.traverse( (child : THREE.Object3D)=> {
            if(child.visible == false){
              child.visible = true
            }
            if(child.name == "Simulation"){
              simObject = child;
              }
            });
            if(simObject !== undefined){
            // Hide Sim buildings
            simObject.traverse((child: THREE.Object3D)=>{
              if(child.userData.hasOwnProperty('attributes')){
              if('layerIndex' in child.userData.attributes){
                if(simObject.userData.layers[child.userData.attributes.layerIndex]
                .fullPath.includes('building')){                    
                child.visible = false;
                }
              }
              }
            });
            // Hide buildings
                playground_.scene.traverse((child: THREE.Object3D)=>{
                if(child.name.includes("Project-") && (!child.name.includes("models"))){
                child.visible = false;
                }
                });
          }
          
          // Creating building checkbox
          var layerBInput = document.createElement('input')
          layerBInput.type = "checkbox"
          layerBInput.className = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          layerBInput.id = `${layer.name}-building`
          layerBInput.style.marginRight = "60px"
          layerBInput.setAttribute("checked", "checked")
          layerBInput.checked = bStrings.includes(layer.name) ? true : false
          layerBInput.setAttribute("Index", i.toString())

          // Creating context checkbox
          var layerCInput = document.createElement('input')
          layerCInput.type = "checkbox"
          layerCInput.className = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          layerCInput.id = `${layer.name}-context`
          layerCInput.setAttribute("checked", "checked")
          layerCInput.checked = oStrings.includes(layer.name) ? true : false
          // layerCInput.checked = false;
          layerCInput.setAttribute("Index", i.toString())
          
          // Appending html child divs to parents
          layerDiv.appendChild(layerLabel)
          layerDiv.appendChild(layerVisInput)
          layerDiv.appendChild(layerBInput)
          layerDiv.appendChild(layerCInput)
          layerContainerDiv.appendChild(layerDiv);
        }
        
        playground_.Details.layers = layers_list
        setDBStorage('App')
    }
  }

  for (let i = 0; i < layerContainerDiv.children.length; i++) {
    var childDiv = layerContainerDiv.children[i]
    childDiv.addEventListener('change', function (e) {
      var target = e.target as any
      if (target.tagName == "INPUT" && target.type == "checkbox"){
        if (target.id.includes("visibility")) {
          playground_.scene.traverse(function (child : THREE.Object3D) {
          if (child instanceof THREE.Mesh && child.name.includes("Project_")){
            console.log(child.userData.layerIndex)
            if (child.userData.layerIndex == target.getAttribute("Index") as number) {
              if (target.checked && child.visible == false) {
                child.visible = true
              }

              else if (!target.checked && child.visible == true) {
                child.visible = false
              }
            }
          }
        })
      }

        else if (target.id.includes("building")) {
          if (target.checked) {
            playground_.Details.blayers += `${target.id.split('-')[0]},`
            playground_.Details.olayers = playground_.Details.olayers.replace(`${target.id.split('-')[0]},`, '')
            var oDivID = target.id.replace('-building', '-context')
            var oDiv = document.getElementById(oDivID) as any
            oDiv.checked = false
          }

          else if (!target.checked) {
            playground_.Details.blayers = playground_.Details.blayers.replace(`${target.id.split('-')[0]},`, '')
          }
        }

        else if (target.id.includes("context")) {
          if (target.checked) {
            var name = childDiv.getAttribute("LayerName") as string
            playground_.Details.olayers += `${target.id.split('-')[0]},`
            playground_.Details.blayers = playground_.Details.blayers.replace(`${target.id.split('-')[0]},`, '')
            var bDivID = target.id.replace('-context', '-building')
            var bDiv = document.getElementById(bDivID) as any
            bDiv.checked = false
          }

          else if (!target.checked) {
            playground_.Details.olayers = playground_.Details.olayers.replace(`${target.id.split('-')[0]},`, '')
          }
          
        }
        setDBStorage('App')
      }
    })
  }
}

async function test() {
  let request = {
    method: 'GET',
  }
  let response = await fetch(simulation_url, request)
  let result = await response.json()
  console.log(result)
}

const App: Component = () => {

  onMount( async () =>{

  /*
    1. Create IDB storage & get details from storage
    2. Build map
    3. Add event listeners for files
  */
    // 1
    createLogDatabase()
    createDatabase()
    await getDBStorage_Refresh()
    // 2
    const mapDiv = document.querySelector('#map') as HTMLDivElement
    // buildMap(mapDiv)
    
    // 3
    var fileImport = document.getElementById('import_input_file') as HTMLInputElement
    var mtlImport = document.getElementById('import_input_mtl') as HTMLInputElement

    fileImport.addEventListener('change', async (event) => {
      if (fileImport.type == "file"){
        try {
          const playground_ = playground() as Playground
          playground_.clearModel()
          var Uid = playground_.Details.Uid
          var fileType = fileImport.value.slice(-3)
          if (fileType == '3dm'){
            let file = fileImport.files as FileList
            var rhinoURL = URL.createObjectURL(file[0])
            playground_.Details.fileBlob = file[0] as Blob
            await RhinoFileToCustomObject(playground_.Details)
            await addObjectsToScene(playground_)
            updatePlaygroundFileInfo(playground_, file)
            updateModelLayers(playground_, false)
            fileImport.value = "";
            mtlImport.value = "";
            playground_.Details.blayers = ''
            playground_.Details.olayers = ''
            playground_.Details.mtlFile = 0
            playground_.Details.objFile = 0
            setDBStorage('App')
          }

          else if (fileType.toUpperCase() == 'OBJ'){
            mtlImport.click();
          }
        }

        catch (error) {
          console.log(error)
        }
      }
    })

        // Process OBJ upload (it prompts for mtl upload so we can use an event listener on mtl_upload)
        mtlImport.addEventListener('change', (event) => {
        

          // let blayers = document.querySelector('#blayers') as HTMLInputElement;
          // let olayers = document.querySelector('#olayers') as HTMLInputElement;
  
          //Remove previous groups if any
          const playground_ = playground() as Playground
          playground_.clearModel()
  
          let file = fileImport.files as FileList
          let mtlfile = mtlImport.files as FileList
          playground_.Details.fileBlob = file[0] as Blob
          playground_.Details.mtlFile = mtlfile[0] as File
          playground_.Details.objFile = file[0] as File
          const Uid = playground_.Details.Uid
          reader.readAsText(file[0])
          reader.addEventListener('load', () => {
              //Load Obj model
              var objLoader = new OBJLoader()
              if (typeof(reader.result) == 'string'){
                  var obj = objLoader.parse(reader.result) as THREE.Group
                  obj.traverse(function (child : THREE.Object3D) {
                      if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        var name = child.name
                        // child.name = `Project-${selectedDiv() as number}-` + name
                        child.name = `Project_${Uid}_` + name
                      }
                   });
                  obj.name = `Project_${Uid}_models`
                  processModel(obj, playground_, 'import')
                  playground_.scene.add(obj)
                  playground_.Details.blayers = ''
                  playground_.Details.olayers = ''
                  updateModelLayers(playground_, false)
              }
          })
  
          updatePlaygroundFileInfo(playground_, file)
          // c_playgrd = playground_;
          fileImport.value = "";
          mtlImport.value = "";
          setDBStorage('App')
        })
  })

  return (
    <div class="main">
      <div id="menu" class="drawer items-center" style="z-index:100">
        <button id="import_button" onclick={(e) => uploadModel(fileRef, mtlRef, e)} style="z-index:100" class="items-center text-center w-full border-b border-gray-400 p-5 font-medium text-gray-200 hover:bg-blue-800">
          <label>Import Model</label>
          <input type="file" id="import_input_file" name="filename" accept= ".obj, .3dm" ref={fileRef} hidden/>
          <input type="file" id="import_input_mtl" name="filename" accept= ".mtl" ref={mtlRef} hidden/>
        </button>
        {/* FILE LAYERS START */}
        <div class="flex" style="z-index:207; white-space: nowrap; gap:20px; position:relative">
            <button type="button" id="FileLayersButton" onclick={(e) => toggleOptionsList('FileLayers', 'FileLayersChevron')} style="min-width:100%" class="flex items-center w-full justify-between border-b border-gray-400 p-5 font-medium text-left text-gray-200 dark:text-gray-400 hover:bg-blue-800">
                <div class = "inline-flex gap-x-4" style='margin-left:20%'>File Layers</div>
                <svg fill="none" id="FileLayersChevron" stroke="dimgray" class="w-4 h-6" stroke-width="4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"></path></svg>
            </button>
            <div id="FileLayers" show="false" style="position: absolute; left: 105%; z-index: 208; flex-wrap:wrap; gap:10px; width:auto; background: rgb(41, 41, 41);" class="flex w-full justify-between border border-gray-400 justify-between p-5 font-medium text-left text-gray-200 hidden" role="alert">
                <button onclick={(e) => toggleOptionsList('FileLayersInfo')}>
                    {/* <svg xmlns="http://www.w3.org/2000/svg" style="position:absolute; left:90%; top:10px" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6" >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg> */}
                </button>
                <div style="display:flex; flex-direction:row"id='layerHeaderContainer'></div>
                <div id='FileLayersContainer' style = "display:flex; flex-wrap:wrap"></div>
            </div>
        </div>
        {/* FILE LAYERS END */}
        <button id="import_button" onclick={(e) => test()} style="z-index:100" class="items-center text-center w-full border-b border-gray-400 p-5 font-medium text-gray-200 hover:bg-blue-800">
          <label>Run Radiation Simulation</label>
        </button>
        <div class="flex">
              <button type="button" onclick={async () => HardReset()} class="items-center text-center w-full border-b border-gray-400 p-5 font-medium text-gray-200 hover:bg-blue-800">
                Reset
              </button>
        </div>
      </div>
      <div id="canvas" style="z-index:10;" class="canvas"></div>
      <div class = "geoDataContainer" id="geoData">
        <LocationSelector></LocationSelector>
      </div>
            {/* CREATING ALERTS */}
            <div id='ErrorAlert' style="position: absolute; top: 5%; left: 40%; z-index: 998; max-width: 400px; height:auto" class="flex p-4 mb-4 text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 hidden" role="alert">
            <svg aria-hidden="true" class="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
            <span class="sr-only">Info</span>
            <div id="ErrorAlertMessage" class="ml-3 text-sm font-medium">
              A simple info alert with an <a href="#" class="font-semibold underline hover:no-underline">example link</a>. Give it a click if you like.
            </div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex h-8 w-8 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700" data-dismiss-target="#ErrorAlert" aria-label="Close">
              <span class="sr-only">Close</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
          </div>


          <div id="DoneAlert" style="position: absolute; top: 5%; left: 50%; z-index: 997; max-width: 400px; height:auto" class="flex p-4 mb-4 text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 hidden" role="alert">
            <svg aria-hidden="true" class="flex-shrink-0 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
            <span class="sr-only">Info</span>
            <div id='DoneAlertMessage'class="ml-3 text-sm font-medium">
              A simple info alert with an <a href="#" class="font-semibold underline hover:no-underline">example link</a>. Give it a click if you like.
            </div>
            <button type="button" class="ml-auto -mx-1.5 -my-1.5 bg-green-50 text-green-500 rounded-lg focus:ring-2 focus:ring-green-400 p-1.5 hover:bg-green-200 inline-flex h-8 w-8 dark:bg-gray-800 dark:text-green-400 dark:hover:bg-gray-700" data-dismiss-target="#DoneAlert" aria-label="Close">
              <span class="sr-only">Close</span>
              <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
          </div>


          <div id="WarningAlert" style="position: absolute; top: 5%; left: 40%; z-index: 996; max-width: 400px; height:auto" class="p-4 mb-4 text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800 hidden" role="alert">
            <div class="flex items-center">
              <svg aria-hidden="true" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
              <span class="sr-only">Info</span>
              <h3 class="text-lg font-medium">Warning</h3>
            </div>
            <div id='WarningAlertMessage' class="mt-2 mb-4 text-sm">
              More info about this info warning goes here. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.
            </div>

            {/* HARD RESET BUTTON START */}
            <div class="flex">
              <button type="button" onclick={async () => HardReset()} class="text-white bg-yellow-800 hover:bg-yellow-900 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-xs px-3 py-1.5 mr-2 text-center inline-flex items-center dark:bg-yellow-300 dark:text-gray-800 dark:hover:bg-yellow-400 dark:focus:ring-yellow-800">
                Reset
              </button>
              <button type="button" onclick={async () => HideWarningAlert()} class="text-yellow-800 bg-transparent border border-yellow-800 hover:bg-yellow-900 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-xs px-3 py-1.5 text-center dark:hover:bg-yellow-300 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-gray-800 dark:focus:ring-yellow-800" data-dismiss-target="#WarningAlert" aria-label="Close">
                Cancel
              </button>
            </div>
            {/* HARD RESET BUTTON END */}
          </div>



          <div id = "loading"> </div>
    </div>
  );
};

export default App;
