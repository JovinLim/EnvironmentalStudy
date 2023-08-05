const express = require('express');
const process = require('process');
const http = require('http');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
process.title = "File Server"
var cors = require('cors');
var multiparty = require('multiparty');
// const env = require('dotenv').config({path: process.cwd()+`/.env.${process.env.NODE_ENV}`}).parsed;

const app = express();
// const port = env.FSV_PORT;
const port = 3245
const fetch_options = {
  method: 'POST',
  mode: 'cors',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json'
  }
}

const options_rad = {
  // For python server that processes the model and runs sim
  // hostname: env.HOSTIP2,
  hostname: '127.0.0.1',
  // port:env.PYS_PORT,
  port: 3001,
  path:'/test',
  method:'POST',
  headers:{
      'Content-Type':'application/json'
  }
};

function getEPW(epw_url){
  console.log(epw_url)
  let s = epw_url.split('/')
  let filename = s[s.length-1]
  console.log(filename)
  filename = filename.replace(".zip",".epw");
  let filepath, filepath2
  if(process.env.NODE_ENV === "development"){
    var root = process.cwd().replace(/\\/g,"/")
    filepath = root+"/"+env['DIR2']+"/server/epw/"+filename;
    filepath2 = root+"/"+env['DIR']+"/server/epw/"+filename;
  }else{
    filepath = env['DIR2']+"/server/epw/"+filename;
    filepath2 = env['DIR']+"/server/epw/"+filename;
  }
  let info = '';
  return new Promise((resolve, reject) => {
    // TODO: refactor to use postData
	  const rq = http.request(options_epw, (rs) => {
	    rs.on('data', (chunk) => {
	      info += `${chunk}`;
	    });
	    rs.on('end', () => {
	      let bdata;
	      bdata = info;
	      //Need try catch here
	      console.log(filepath);
	      fs.writeFileSync(filepath, bdata);
	      resolve(filepath2)
	      return filepath2;
	      //console.log(info) 
	    });

	  });

	  rq.on('error', (e) => {
	      console.error(`Error: ${e.message}`);
	      reject(e);
	      return('failed');
	  });

	  var qdata = JSON.stringify({epw_url:epw_url});
	  rq.write(qdata);

	  rq.end();

  });
  
}

// WARNING! THIS CORS RULE IS UNSAFE. TO SPECIFY DURING PRODUCTION
app.use(cors());
app.options('*',cors());
app.use(express.json());
app.set('trust proxy', true);

// WARNING! THIS CORS RULE IS UNSAFE. TO SPECIFY DURING PRODUCTION

app.post('/', cors(), (req,res) => {
  console.log('test')
  res.send({'msg':0})
})

app.post('/test', cors(), (req,res) => {
  let info='';    
  console.log(options_rad)
  const rq = http.request(options_rad, (rs) =>{
  rs.setEncoding('utf8');
  rs.on('data', (chunk) => {
      info = `${chunk}`;
      });
  rs.on('end', ()=>{
      try{
      }
      catch(err){
          console.log(err);
      }
      console.log(info)
      res.send(info)
      console.log('finished pushing to pyserver');
      });
  });

  rq.on('error', (e) => {
    console.error(`Error: ${e.message}`);
    });

  rq.end();
})


/* START OF TEST RADIATION REQUEST */
app.post('/radiation', cors(), (req,res) => {
  console.log(Date()+"\nObtained POST Request on \'/radiation\'. Body:")
  var form = new multiparty.Form()
  form.parse(req, async(err, fields, files) => {
    if (testing === 'true') {

      // Creating unique folder
      var folder_id = uuidv4().replace(/-/g,'_');
      var folder = process.cwd()+"\\server_app\\server\\user\\"+ folder_id+"\\radiation";
      var epw_url = fields.epw_url[0] ?? "https://energyplus-weather.s3.amazonaws.com/southwest_pacific_wmo_region_5/SGP/SGP_Singapore.486980_IWEC/SGP_Singapore.486980_IWEC.zip";
      var filetype = fields.file_type[0].toUpperCase()
      let filePath = (files.fileBlob != undefined || files.fileBlob != null) ? files.fileBlob[0].path : 0

      var bl = fields.blayers[0]
      var ol = fields.olayers[0]
      bl.split(",").pop()
      ol.split(",").pop()

      var blist = JSON.stringify(bl)
      var olist = JSON.stringify(ol)

      var modelVerts = fields.mesh_vertices[0]
      var modelFaceInd = fields.face_indices[0]
      var modelUids = fields.mesh_Uid[0]
      var meshLayers = fields.mesh_layers[0]

      fs.mkdirSync(folder, {recursive:true}, 
        err=>{console.log("Error: "+err);})

      let info='';    
      console.log(options_rad)
      const rq = http.request(options_rad, (rs) =>{
      rs.setEncoding('utf8');
      rs.on('data', (chunk) => {
          info = `${chunk}`;
          });
      rs.on('end', ()=>{
          try{
          }
          catch(err){
              console.log(err);
          }
          console.log(info)
          res.send(info)
          console.log('finished pushing to pyserver');
          });
      });

      rq.on('error', (e) => {
        console.error(`Error: ${e.message}`);
        });
      
      // SIMULATING PUBLIC DOWNLOAD FOLDER CREATION LOCALLY
      const wd = process.cwd()
      const public_dir = wd + "\\public\\downloads\\" + folder_id + "\\"

      var pdata = JSON.stringify({projname:fields.project_name[0],
                                  dir: folder,
                                  public_dir: public_dir,
                                  folder_id: folder_id,
                                  epw_url: epw_url,
                                  mesh_vertices: modelVerts,
                                  face_indices: modelFaceInd,
                                  mesh_uids: modelUids,
                                  model_layers: meshLayers,
                                  b_layers: blist,
                                  o_layers: olist,
                                  filepath: filePath,
                                  filetype: filetype,});
      rq.write(pdata);
  
      rq.end();

    }
  })
})

app.listen(port,()=>{
    console.log("📁 fserver, Running on port "+String(port));
});
