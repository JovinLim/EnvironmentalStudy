import * as THREE from 'three'
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js"
import express from 'express'
import 'process'
import 'http'
import fs from 'fs'
import {v4 as uuidv4} from 'uuid';
import 'dotenv'
import { configDotenv } from 'dotenv'
import cors from 'cors'
import multiparty from 'multiparty'

const env = configDotenv({path: process.cwd()+`/.env.${process.env.NODE_ENV}`}).parsed

const testing = env["TESTING"];
const app = express();
const port = env.RTS_PORT;

// WARNING! THIS CORS RULE IS UNSAFE. TO SPECIFY DURING PRODUCTION
app.use(cors());
app.options('*',cors());
app.use(express.json());
// WARNING! THIS CORS RULE IS UNSAFE. TO SPECIFY DURING PRODUCTION

app.post('/', cors(), (req,res) => {
    console.log(Date()+"\nObtained POST Request on \'/\'. Body:")
    var form = new multiparty.Form()
    form.parse(req, async(err, fields, files) => {
      if (testing === 'true') {
        try {
            // Get public download folder from request body
            var folder_id = fields.downloads_folder[0]
            // var payloadJSON = folder + 'results\\radiation_results.json'
            console.log(`${env.WEB_HOSTNAME}` + `\\public\\downloads\\${folder_id}\\results\\radiation_results.json`)
            let response = await fetch(`${env.WEB_HOSTNAME}` + `\\public\\downloads\\${folder_id}\\results\\radiation_results.json`)
            // console.log(`${env.WEB_HOSTNAME}` + `public/downloads/68053256_d7b8_4ea4_908d_ad7c1ee40d48/results/radiation_results.json`)
            // let response = await fetch(`${env.WEB_HOSTNAME}` + `public/downloads/68053256_d7b8_4ea4_908d_ad7c1ee40d48/results/radiation_results.json`)
            let data = await response.json()

            const faceInds = data['face_indices']
            const meshVertices = data['mesh_vertices']
            const facecolors = data['mesh_colors']

            let verts = []
            let facelist = []

            faceInds.forEach(face => {
              face.forEach( vertIdx => {
                let cVert = meshVertices[vertIdx]
                cVert.forEach(vertComponent => {
                  verts.push(vertComponent)
                })
              })
            })

            let colors = []
            facecolors.forEach((color) => {
              for (let n=0; n< 3; n++){
                color.forEach(rgb_value => {
                  colors.push(rgb_value/255)
                })
              }
            })
            

            const actualVerts = new Float32Array(verts)
            const actualColors = new Float32Array(colors)
            let geometry = new THREE.BufferGeometry()
            geometry.computeVertexNormals()
            geometry.setAttribute('position', new THREE.BufferAttribute(actualVerts, 3))
            geometry.setAttribute('color', new THREE.BufferAttribute(actualColors, 3, false))

            var material = new THREE.MeshBasicMaterial({color: 0xffffff, vertexColors: true, side: THREE.DoubleSide})
            
            const tMesh = new THREE.Mesh(geometry, material)
            tMesh.receiveShadow = true
            tMesh.castShadow = true
            var jsonMesh = tMesh.toJSON()

            // EXPORT TO INSPECT MESH IN JSON
            var stringjsonmesh = JSON.stringify(jsonMesh)
            // fs.writeFile(process.cwd() + '\\jsonmesh.json', stringjsonmesh,(err)=>{
            //   if(err){console.log(err);}
            //   else{
            //     console.log(process.cwd() + '\\jsonmesh.json')
            //       console.log("jsonmesh written successfully");
            //   }
            // })

            console.log('Successfully created ThreeJS mesh')
            res.send({jsonMesh})

        }

        catch (e) {
            console.log(e)
        }

      }
    })
  })

app.listen(port,()=>{
    console.log("sserver, Running on port "+String(port));
});