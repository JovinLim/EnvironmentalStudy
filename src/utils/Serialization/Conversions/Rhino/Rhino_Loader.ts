import rhino3dm from 'rhino3dm';

let rhino : any, doc : any;

// global variables
let _model = {
    // saved nurbs curves
    curves: [],
    // new nurbs curve
    points: null,
    // viewport for canvas
    viewport: null,
  }

export async function customLoadRhinoFile(details_ : any, mode = "model"){
  let targetBlob : Blob;
  if(mode === "model"){
    targetBlob = details_.fileBlob;
  }else{
    targetBlob = details_.simBlob;
    console.log(details_.simBlob)
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


// DOWNLOAD
// function download() {
//     if(_model.curves.length<1){
//       console.log('no curves')
//       return
//     }
  
//     let doc = new rhino.File3dm()
//     for(let i=0; i<_model.curves.length;i++) {
//       doc.objects().add(_model.curves[i], null)
//     }
  
//     let options = new rhino.File3dmWriteOptions()
//     options.version = 7
//     let buffer = doc.toByteArray(options)
//     saveByteArray("sketch2d"+ options.version +".3dm", buffer)
//     doc.delete()
//   }
  
//   function saveByteArray(fileName : string, byte : any) {
//     let blob = new Blob([byte], {type: "application/octect-stream"})
//     let link = document.createElement('a')
//     link.href = window.URL.createObjectURL(blob)
//     link.download = fileName
//     link.click()
//   }
