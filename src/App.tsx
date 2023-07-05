import { createSignal, type Component, onMount } from 'solid-js'
import {v4 as uuidv4} from 'uuid'
import './index.css'
import { Rhino3dmLoader } from './utils/RhinoLoaderDup.js'
import Playground from './utils/playground'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import LocationSelector from './Components/Geoservices/LocationSelector'
import { buildMap } from './Components/Geoservices/OpenLayersMap.cjs'

export const [playground, setPlayground] = createSignal<Playground>()
const reader = new FileReader()
let fileRef: HTMLInputElement;
let mtlRef: HTMLInputElement;

export async function toggleOptionsList(container_id : string, chevron_id = ""){
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

export async function InitializePlayground() {
  const Uid = uuidv4()
  const canvasDiv = document.getElementById("canvas") as HTMLDivElement
  const playground_ = new Playground(canvasDiv)
  playground_.Details.Uid = Uid
  setPlayground(playground_)
  const sceneDom = (playground() as Playground).domElement
  canvasDiv.appendChild(sceneDom)
  sceneDom.focus()

}

export async function processModel(model : THREE.Group | THREE.Object3D, playground_ : Playground) {

  // Rotating model to correct orientation
  // model.rotateX(-Math.PI / 2);

  // Get sphere radius
  const sphereRad = playground_.Details.sphereRad

  // Getting model size and center
  let center = new THREE.Vector3()
  let size = new THREE.Vector3()
  let modelbox = new THREE.Box3().setFromObject(model)
  modelbox.getSize(size)

  // Testing scaling start
  // if ((Math.max(size.x, size.y, size.z) > (sphereRad*2*0.6) )) {
  //     var proportion = Math.min( (sphereRad * 2 * 0.6) / size.x, (sphereRad * 0.6) / size.y, (sphereRad * 2 * 0.6) / size.z)
  // }

  // else {
  //     var proportion = Math.max( (sphereRad * 2 * 0.6) / size.x, (sphereRad * 0.6) / size.y, (sphereRad * 2 * 0.6) / size.z)
  // }
  // Testing scaling end
  
  var proportion = Math.min( (sphereRad * 2 * 0.6) / size.x, (sphereRad * 0.6) / size.y, (sphereRad * 2 * 0.6) / size.z)
  model.scale.set(proportion, proportion, proportion)
  let modelbox2 = new THREE.Box3().setFromObject(model)
  modelbox2.getCenter(center)
  model.position.set(-center.x, -center.y, 0)
  // model.position.set(-center.x, -center.y, -center.z)
}

export async function uploadModel(upload : HTMLInputElement, mtl_upload : HTMLInputElement, e : Event) {
  upload.click();
}

const App: Component = () => {

  onMount(() =>{
    InitializePlayground()
    const mapDiv = document.querySelector('#map') as HTMLDivElement
    buildMap(mapDiv)
    
    var fileImport = document.getElementById('import_input_file') as HTMLInputElement
    var mtlImport = document.getElementById('import_input_mtl') as HTMLInputElement

    fileImport.addEventListener('change', (event) => {
      if (fileImport.type == "file"){
        try {
          const playground_ = playground() as Playground
          playground_.clearModel()
          var Uid = playground_.Details.Uid
          var fileType = fileImport.value.slice(-3)
          if (fileType == '3dm'){
            let file = fileImport.files as FileList
            var rhinoURL = URL.createObjectURL(file[0])
            const loader = new Rhino3dmLoader()
            loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@7.15.0/' )
            loader.load(rhinoURL, 
            function(obj : any) {
              obj.traverse(function (child : THREE.Object3D) {
                  if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    var name = child.name != "" ? child.name : "Nameless"
                    child.name = `Project_${Uid}_` + name
                  }
              });
              obj.name = `Project_${Uid}_models`
              processModel(obj, playground_)
              playground_.scene.add(obj)
              playground_.Details.fileBlob = file[0] as Blob
              playground_.Details.mtlFile = 0
              playground_.Details.objFile = 0
              
              // updatePlaygroundFileInfo(playground_, file)
              // updateDownloadButton(playground_)
              // c_playgrd = playground_;
              // updateHTMLFileInfo(playground_)
              playground_.Details.blayers = ''
              playground_.Details.olayers = ''
              // updateModelLayers(playground_, false)
              fileImport.value = "";
              mtlImport.value = "";
              
            })
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
          // var previousModel = playground_.scene.getObjectByName(`Project-${selectedDiv() as number}-models`) as THREE.Object3D
          // playground_.scene.remove(previousModel)
  
  
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
                  processModel(obj, playground_)
                  playground_.scene.add(obj)
                  playground_.Details.blayers = ''
                  playground_.Details.olayers = ''
                  // updateModelLayers(playground_, false)
              }
          })
  
          // storeFile(playground_)
          // updatePlaygroundFileInfo(playground_, file)
          // updateDownloadButton(playground_)
          // c_playgrd = playground_;
          // updateHTMLFileInfo(playground_)
          fileImport.value = "";
          mtlImport.value = "";
        })
        // updateDownloadButton(c_playgrd)
        // Update download button
  })

  return (
    <div class="main">
      <div id="menu" class="drawer items-center" style="z-index:100">
        <button id="import_button" onclick={(e) => uploadModel(fileRef, mtlRef, e)} style="z-index:100" class="items-center text-center w-full border-b border-gray-400 p-5 font-medium text-gray-200 hover:bg-blue-800">
          <label>Import Model</label>
          <input type="file" id="import_input_file" name="filename" accept= ".obj, .3dm" ref={fileRef} hidden/>
          <input type="file" id="import_input_mtl" name="filename" accept= ".mtl" ref={mtlRef} hidden/>
        </button>
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
            {/* <div class="flex">
              <button type="button" onclick={async () => HardReset()} class="text-white bg-yellow-800 hover:bg-yellow-900 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-xs px-3 py-1.5 mr-2 text-center inline-flex items-center dark:bg-yellow-300 dark:text-gray-800 dark:hover:bg-yellow-400 dark:focus:ring-yellow-800">
                Reset
              </button>
              <button type="button" onclick={async () => HideWarningAlert()} class="text-yellow-800 bg-transparent border border-yellow-800 hover:bg-yellow-900 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-xs px-3 py-1.5 text-center dark:hover:bg-yellow-300 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-gray-800 dark:focus:ring-yellow-800" data-dismiss-target="#WarningAlert" aria-label="Close">
                Cancel
              </button>
            </div> */}
            {/* HARD RESET BUTTON END */}
          </div>



          <div id = "loading"> </div>
    </div>
  );
};

export default App;
