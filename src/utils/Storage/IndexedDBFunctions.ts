import 'flowbite';
import * as THREE from 'three';
import { updateModelLayers, InitializePlayground, playground } from '../../App';
import Playground from '../playground';
import { buildMap } from '../../Components/Geoservices/OpenLayersMap.cjs';
import { updateTime } from '../../Components/Geoservices/TimeHandler';
import { updateDate } from '../../Components/Geoservices/DateSlider';

let db;

export async function HardReset() {
    // Delete SceneDatabase
    deleteDatabase()
    window.location.reload()
  }

  export async function deleteDatabase () {
    var req = indexedDB.deleteDatabase("SceneDatabase")
    req.onsuccess = function() {
     // console.log("Deleted Database")
    }
    req.onerror = () => {
      console.log(req.result)
    }
  }

  export async function getDBStorage_Refresh() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("SceneDatabase")
      request.onsuccess = async () => {
        let res = request.result
    
        const detailTransaction = res.transaction('details', 'readwrite')
        detailTransaction.oncomplete = function() {
          // console.log('Completed detail transaction')
          resolve()
        }
      
        detailTransaction.onerror = function() {
          //console.error("Error", detailTransaction.error)
          reject(detailTransaction.error)
        }
    
        const detailStore = detailTransaction.objectStore('details')
        const storageCount = detailStore.count()
        
        storageCount.onsuccess = async () => {
          if (storageCount.result == 0) {
            InitializePlayground()
            buildMap(document.getElementById('map') as HTMLDivElement)
          } else {
            // New way of using UUID
            await new Promise<void>((resolve, reject) => {
              const reqD = indexedDB.open("SceneDatabase", 1)
              reqD.onsuccess = () => {
                let resD = reqD.result
                const dTransaction = resD.transaction('details', 'readwrite')
                const detailStore = dTransaction.objectStore('details')
                const getRequest = detailStore.getAll()
  
                getRequest.onerror = (e: any) => {
                  console.log(e)
                  reject(e)
                }
  
                getRequest.onsuccess = (e:any) => {
                  const details = e.target.result
                  details.forEach((details_ : any) => {
                    const uuid = details_.Uid
                    InitializePlayground(uuid)
                    const playground_ = playground() as Playground
                    playground_.Details = details_
                    playground_.redrawSun()
                    playground_.redrawAnalemma()
                    updateTime(playground_)
                    updateDate(playground_)
                  })
                  resolve()
                }
  
                resD.close()
  
                dTransaction.oncomplete = () => {
                  resolve()
                }
  
                dTransaction.onerror = () => {
                  reject(dTransaction.error)
                }
              }
  
              reqD.onerror = (e) => {
                console.error(e)
              }
          })
  
          await new Promise<void>((resolve, reject) =>{
            const reqM = indexedDB.open("SceneDatabase", 1)
            reqM.onsuccess = () => 
            {
              let resM = reqM.result
              const modelTransaction = resM.transaction('models', 'readwrite')
              const modelStore = modelTransaction.objectStore('models')
              const getModels = modelStore.getAll()
  
              getModels.onerror = (e:any) => {
                console.log(e)
                reject(e)
              }
  
              getModels.onsuccess = (e:any) => {
                const models = e.target.result
                const lastIndex = models.length - 1
                for (let i = 0; i < models.length; i++){
                  const model_ = models[i]
                  // const playground_ = playgrounds[i]
                  const playground_ = playground()
                  parseModelData(model_, playground_)
                  buildMap(document.getElementById('map') as HTMLDivElement)
                  updateModelLayers(playground_, false)
                }
              }
              resM.close()
  
              modelTransaction.oncomplete = () => {resolve()}
              modelTransaction.onerror = () => {reject(modelTransaction.error)}
            }
  
            reqM.onerror = (e) => {
              console.error(e)
            }
          })
            setDBStorage('App')
          }
        }
        res.close()
        db = res;
      }
    })
  }

function parseModelData(model : any, playground_ : Playground){
  if (model!= undefined || model != null){ 
    const model_ = new THREE.ObjectLoader().parse(JSON.parse(model as string))
    playground_.scene.add(model_)
  }

  else {
  }
}

export async function setDBStorage(Page: String) {

    if (Page == 'App'){
      return new Promise<void>(async(resolve, reject) => {
        try {
          const request = indexedDB.open("SceneDatabase")
          request.onsuccess = () => {
            let res = request.result
            const modelTransaction = res.transaction('models', 'readwrite')
            const simTransaction = res.transaction('simulations', 'readwrite')

            let playground_ = playground()
            const Uid = playground_.Details.Uid
            var model = playground_.scene.getObjectByName(`Project_${Uid}_models`)
            var sim = playground_.scene.getObjectByName("Simulation")
            const modelStore = modelTransaction.objectStore('models')
            const simStore = simTransaction.objectStore('simulations')

            // Store sim results if present
            if(sim != undefined){
              const request = simStore.put(JSON.stringify(sim), `Project_${Uid}_simulation`)
              request.onsuccess = ()=>{}
              request.onerror = (err : any) =>{console.error(`Error : ${err}`)}
            }

            // Store model if present
            if (model != undefined){
              const request = modelStore.put(JSON.stringify(model), `Project_${Uid}_models`)
              request.onsuccess = () => {}
              request.onerror = (err) => { console.error(`Error : ${err}`) }
            }
            
            
            const detailTransaction = res.transaction('details', 'readwrite')
            detailTransaction.oncomplete = function() {
              //console.log('Completed detail transaction')
            }
          
            detailTransaction.onerror = function() {
              console.error("Error", detailTransaction.error)
            }
        
            const detailStore = detailTransaction.objectStore('details')
            const drequest = detailStore.put(playground_.Details, `Project_${Uid}_details`)
            drequest.onsuccess = () => {
              // console.log(`Details ${i} added`)
      
            }
        
            drequest.onerror = (err) => {
              console.error(`Error : ${err}`)
            }
        
            res.close()
            resolve()
          }
        }

        catch (error){
          reject(error)
        }

      })
    }

    // else if (Page == 'LiveReportsApp'){
    //   return new Promise<void>(async (resolve, reject) => {
    //     try {
    //       const request = indexedDB.open("SceneDatabase")
    //       request.onsuccess = async () => {
    //         let res = request.result
  
    //         await new Promise<void>((resolve, reject) => {
    //           const detailTransaction = res.transaction('details', 'readwrite')
    //           detailTransaction.oncomplete = function() {resolve()}
            
    //           detailTransaction.onerror = function() {console.error("Error", detailTransaction.error); reject()}
            
    //           for (let i = 0; i < ProjectDetails.length; i++) {
    //             var fileBlob = ProjectDetails[i].fileBlob
    //             var deets = JSON.parse(JSON.stringify(ProjectDetails[i]))
    //             deets.fileBlob = fileBlob
    //             const detailStore = detailTransaction.objectStore('details')
    //             const request = detailStore.put(deets, `Project_${deets.Uid}_details`)
    //             request.onsuccess = () => {
    //               //console.log(`Details ${i} added`)
    //             }
            
    //             request.onerror = (err) => {
    //               console.error(`Error : ${err}`)
    //             }
    //           }
    //         })
    //         res.close()
    //         resolve()
    //       }
    //     }
    //     catch (error) {
    //       reject(error)
    //     }
    //   })
    // }

  }

  export async function createDatabase() {
    const openRequest = indexedDB.open("SceneDatabase", 1)
    openRequest.onerror = (e) => {
      // console.log(e)
    }
    openRequest.onsuccess = (e) => {
      //console.log('Successfully opened database')
      // db = openRequest.result
      // let res = db.transaction('details','readonly').objectStore('details').count()
      // res.onsuccess = () => {
      //   let count = res.result
      //   //console.log(count)
      // }
      // db.close()
    }
    openRequest.onupgradeneeded = (e) => {
      db = openRequest.result
      const simStore = db.createObjectStore('simulations', {autoIncrement:true})
      simStore.transaction.oncomplete = () => {console.log('simstore created')}
      const modelStore = db.createObjectStore('models', {autoIncrement:true})
      modelStore.transaction.oncomplete = () => {}
      const detailStore = db.createObjectStore('details', {autoIncrement:true})
      detailStore.transaction.oncomplete = () => {}
  
      db.close()
    }
  
  }

  export async function createLogDatabase() {
    const openRequest = indexedDB.open("LogDatabase", 1)
    openRequest.onerror = function (err) {
      // console.log(err)
    }
    openRequest.onsuccess = function() {
  
    }
    openRequest.onupgradeneeded = function(e) {
      db = openRequest.result
      const logStore = db.createObjectStore('Logs', {autoIncrement : true})
      logStore.transaction.oncomplete = function() {
  
      }
  
      db.close()
    }
  }

//   export function getDetailsfromDB(Page: String){
//     if (Page == 'LiveReportsApp') {
//       return new Promise<void>((resolve, reject) => {
//         const reqD = indexedDB.open("SceneDatabase", 1)
//         reqD.onsuccess = () => {
//           let resD = reqD.result
//           const dTransaction = resD.transaction('details', 'readwrite')
//           const detailStore = dTransaction.objectStore('details')
//           const getRequest = detailStore.getAll()
  
//           getRequest.onerror = (e: any) => {
//             console.log(e)
//             reject(e)
//           }
  
//           getRequest.onsuccess = (e:any) => {
//             const details = e.target.result
//             setProjectDetails(details)
  
//             resolve()
//           }
  
//           resD.close()
  
//           dTransaction.oncomplete = () => {
//             resolve()
//           }
  
//           dTransaction.onerror = () => {
//             reject(dTransaction.error)
//           }
//         }
  
//         reqD.onerror = (e) => {
//           console.error(e)
//         }
//       })
//     }
  
//   else if (Page == 'ReportScene'){
//     return new Promise<void>(async (resolve, reject) => {
//       const reqD = indexedDB.open("SceneDatabase", 1)
//       reqD.onsuccess = () => {
//         let resD = reqD.result
//         const dTransaction = resD.transaction('details', 'readwrite')
//         const detailStore = dTransaction.objectStore('details')
//         const getRequest = detailStore.getAll()

//         getRequest.onerror = (e: any) => {
//           console.log(e)
//           reject(e)
//         }

//         getRequest.onsuccess = (e:any) => {
//           const details = e.target.result
//           details.forEach((details_ : any) => {
//             if (details_.name == windowName()){
//               setProject(details_)
//             }
//           })
//           resolve()
//         }

//         resD.close()

//         dTransaction.oncomplete = () => {
//         }

//         dTransaction.onerror = () => {
//           reject(dTransaction.error)
//         }
//       }

//       reqD.onerror = (e) => {
//         console.error(e)
//       }
//     })
//   }

// }
