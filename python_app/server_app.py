from flask import Flask, redirect, url_for, request
# from dotenv import dotenv_values
# import datetime
# import time
import os
import logging
import requests
import json
# import pathlib
import zipfile
import shutil
# import inspect
import sys
import numpy as np
from pathlib import Path
import uuid
# from waitress import serve
from simulation.ladybug.radiation import createLadybugMeshes, createPVMeshes, visualizePVScene, radiation_study
import random

fh = logging.FileHandler('python_app/log/python.log', mode='a', encoding='utf-8')
sh = logging.StreamHandler(stream = sys.stdout)
handlers = [fh, sh]

logging.basicConfig(
    level=logging.DEBUG, 
    format='[%(asctime)s] {%(filename)s:%(lineno)d} %(levelname)s - %(message)s',
    handlers=handlers
)
logger = logging.getLogger()
print = logger.info

app = Flask(__name__)

##Set IP and port here##
_hostname = "0.0.0.0"#env["PYHOST"]
_port = 3001
_debug = True
downloadlink = '/downloads/'
basewd = os.getcwd()

@app.route('/test', methods = ['POST'])
def test():
    print(1)
    reply = {'Message': 'Received'}
    return reply

@app.route('/radiation', methods = ['POST'])
def radiation():
    print("Request received on /radiation")
    reply = {'Msg':'Received'}

    try:
        content_type = request.headers.get('Content-Type')
        if (content_type == 'application/json'):
            rhinoPath = request.json['filepath']
            projName = request.json['projname']
            simfolder = request.json['dir']
            public_dir = request.json['public_dir']
            folder_id = request.json['folder_id']
            epwURL = request.json['epw_url']
            mesh_vertices_ = json.loads(request.json['mesh_vertices'])
            face_indices_ = json.loads(request.json['face_indices'])
            mesh_uuids_ = json.loads(request.json['mesh_uids'])
            mesh_layers_ = json.loads(request.json['model_layers'])
            b_layers_ = json.loads(request.json['b_layers'])
            o_layers_ = json.loads(request.json['o_layers'])

            """ SEPARATING STUDY AND CONTEXT MESHES """
            sMeshesVerts = []
            sMeshesFaces = []
            sMeshesCentroids = []
            cMeshesVerts = []
            cMeshesFaces = []
            rb_layers = []
            ro_layers = []
            for m in range(len(mesh_layers_)):
                if mesh_layers_[m] in b_layers_:
                    sMeshesVerts.append(mesh_vertices_[m])
                    sMeshesFaces.append(face_indices_[m])
                    rb_layers.append(mesh_layers_[m])
                elif mesh_layers_[m] in o_layers_:
                    cMeshesVerts.append(mesh_vertices_[m])
                    cMeshesFaces.append(face_indices_[m])
                    ro_layers.append(mesh_layers_[m])

            # EXPORTING JSON TO DEBUG WITH PYMESH
            # debug = {
            #     "mesh_vertices_": mesh_vertices_,
            #     "face_indices_": face_indices_,
            # }

            # with open(Path(public_dir) / "pymesh.json", "w") as f:
            #     f.write(json.dumps(debug))
            #     print('pymesh debug written')

            DPObjectList = []

            """ LADYBUG SOLAR RADIATION START """
            # Create pyvista meshes (subdivided into max tri area of 0.5sqm)
            meshList = createPVMeshes(rb_layers, verts_=sMeshesVerts, faces_=sMeshesFaces, max_tri_area_=1000) # This function also subdivides adaptively to tri-areas of 0.5sqm
            # visualizePVScene(meshList)
            
            # Create Ladybug Meshes 
            sMeshVertices_ = []
            sMeshFaces_ = []
            for m in range(len(meshList)):
                mesh = meshList[m]
                sMeshVertices_.append(mesh.points)
                all_faces = mesh.faces
                chunks_faces = [list(all_faces[i+1:i+4]) for i in range(0, len(all_faces), 4)]
                sMeshFaces_.append(chunks_faces)
            
            # Conduct solar radiation
            combined_layers = rb_layers + ro_layers
            study_meshes = createLadybugMeshes(sMeshVertices_, sMeshFaces_)
            context = createLadybugMeshes(cMeshesVerts, cMeshesFaces)
            rad_results = radiation_study(epwURL, rb_layers, study_meshes, context, simfolder)
            
            # Make directories
            os.makedirs(Path(simfolder) / "results", exist_ok=True)
            os.makedirs(Path(public_dir) / "results", exist_ok=True)

            # Writing results to json
            with open(Path(simfolder) / "results" / "radiation_results.json", "w") as f:
                f.write(json.dumps(rad_results))
                print('payload written')

            with open(Path(public_dir) / "results" / "radiation_results.json", "w") as f:
                f.write(json.dumps(rad_results))
                print('public payload written')

            reply = {
                "download_folder": folder_id
            }
            """ LADYBUG SOLAR RADIATION END """

            print ('Solar Radiation Simulation Done')
    except Exception as e:
        print(e)
        
    return reply


if __name__ == '__main__':
    # serve(app, host=_hostname, port=_port)
    app.run(host=_hostname, port=_port, debug=_debug)
