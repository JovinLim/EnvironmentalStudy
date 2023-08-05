import pytest
import io
import os
import zipfile
from urllib.request import Request, urlopen
import requests
import pathlib
import subprocess
import json
import re
import numpy as np

""" LADYBUG IMPORTS """
from ladybug_geometry.geometry2d import Point2D, Mesh2D
from ladybug_geometry.geometry3d import Vector3D, Point3D, LineSegment3D, Face3D, Mesh3D
from ladybug.dt import Time
from ladybug.location import Location
from ladybug.sunpath import Sunpath
from ladybug.graphic import GraphicContainer
from ladybug.legend import LegendParameters, Legend

from ladybug_radiance.skymatrix import SkyMatrix
from ladybug_radiance.study.radiation import RadiationStudy
from ladybug_radiance.study.directsun import DirectSunStudy

""" PYVISTA IMPORTS """
import pyvista as pv

cwd = os.getcwd()

def createLadybugMeshes(meshVerts, faceInds):
    """Create Ladybug Meshes from mesh vertices, face indices

    Args:
        meshVerts: Nested list with list of vertices for each mesh
        faceInds: Nested list with list of face indices for each mesh

    Returns:
        A list of Ladybug meshes
    """

    meshlist = []
    objectType = "Mesh3D"
    for i in range(len(meshVerts)):

        meshVerts_ = meshVerts[i]
        meshFaceInds_ = faceInds[i]
        meshDict = {
            "type" : "Mesh3D",
            "vertices": meshVerts_,
            "faces": meshFaceInds_,
        }
        LBMesh = Mesh3D.from_dict(meshDict)
        meshlist.append(LBMesh)

    return meshlist

def createPVMeshes(rb_layers, verts_, faces_, max_tri_area_ = 1):
    """ Returns a list of PV Polydata based on a list of vertices and faces 
    
    Arguments: 
    verts_ - nested list of list with x,y,z values of mesh vertices
    faces_ - nested list of list with indices of mesh faces
    """

    meshList = []
    # for m in range(len(verts_)):
    for m in range(len(verts_)):
        np_vertices = np.array(verts_[m])
        faces_info = []
        for f in range(len(faces_[m])):
            face_info = []
            face_info.append(3)
            for i in faces_[m][f]:
                face_info.append(i)
            faces_info.append(face_info)
        np_faces = np.hstack(faces_info)
        mesh = pv.PolyData(np_vertices, np_faces)
        # submesh = mesh.subdivide_adaptive(max_tri_area = max_tri_area_)
        # meshList.append(submesh)
        meshList.append(mesh)

    return meshList

def visualizePVScene(meshes):
    p = pv.Plotter(window_size=(600,400))
    p.camera.position = (0,-100,50)
    p.camera.focal_point = (0,0,0)
    p.background_color = 'w'
    p.enable_anti_aliasing()
    for m in range(len(meshes)):
        p.add_mesh(meshes[m], show_edges=True)
    p.show(auto_close=False)

def get_epw_data(source_url) :
    if source_url[-3:] == "zip" or source_url[-3:] == "all":
        request = requests.get(source_url)
        print (request.status_code)
        if request.status_code != 404:
            zf = zipfile.ZipFile(io.BytesIO(request.content))
            for i in zf.namelist():
                if i[-3:] == "epw":
                    epw_name = i
                    data = zf.read(epw_name)
                    # datastring = data.decode("utf-8")
                    epwFilePath = cwd + "\epwStringPath.epw"
                    f = open(epwFilePath, "wb")
                    f.write(data)
                    f.close()
                    return epwFilePath
        else:
            print("returning none")
            return None
    else:
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            req = Request(source_url, headers=headers)
            epw = urlopen(req).read().decode()
            return epw.split("\n")
        except:
            return None

def prepLadybugRadiationSimulation(meshes_, combined_layers_, b_layers_, o_layers_):
    study_meshes = []
    context = []

    blist = b_layers_.split(",")
    blist.pop()
    olist = o_layers_.split(",")
    olist.pop()

    for l in range(len(combined_layers_)):
        meshlayer_ = combined_layers_[l].layer
        if meshlayer_ in blist:
            study_meshes.append(meshes_[l])
        elif meshlayer_ in olist:
            context.append(meshes_[l])

    return study_meshes, context

def radiation_study(epw_url, rb_layers, study_meshes, context_meshes, sim_folder):
    epw_path = get_epw_data(epw_url)
    sky = SkyMatrix.from_epw(epw_path)
    combinedLBMesh = Mesh3D.join_meshes(study_meshes)
    rad_study = RadiationStudy(sky, combinedLBMesh, context_meshes, sim_folder = sim_folder)
    colored_mesh, graphic, title = rad_study.draw()
    rad_results = {
        'radiation_values' : rad_study.radiation_values,
        'mesh_vertices' : [[v.x, v.y, v.z] for v in colored_mesh._vertices],
        'face_indices' : list([int(f[0]), int(f[1]), int(f[2])] for f in combinedLBMesh.faces),
        'mesh_colors' : [[c.r, c.g, c.b] for c in colored_mesh.colors]
    }

    # combined_layer_study_meshes = []
    # rad_results = {}
    # for m in range(len(study_meshes)):
    #     context = context_meshes
    #     for c in range(len(study_meshes)):
    #         if c != m:
    #             context.append(study_meshes[c])
    #     rad_study_m = {}
    #     rad_study = RadiationStudy(sky, study_meshes[m], context_meshes, sim_folder = sim_folder)
    #     colored_mesh, graphic, title = rad_study.draw()
    #     sim_mesh_facecolors = [[c.r, c.g, c.b] for c in colored_mesh.colors]
    #     sim_mesh_vertices = [[v.x, v.y, v.z] for v in colored_mesh._vertices]
    #     rad_study_m['radiation_values'] = rad_study.radiation_values # PER FACE IN kWh / M^2
    #     rad_study_m['mesh_vertices'] = sim_mesh_vertices
    #     rad_study_m['mesh_colors'] = sim_mesh_facecolors
    #     rad_study_m['face_indices'] = list([int(f[0]), int(f[1]), int(f[2])] for f in study_meshes[m].faces)
    #     rad_results['{}_radiation'.format(rb_layers[m])] = rad_study_m

    return rad_results

def HB_radiation_study(epw_url, aMeshesVerts, aMeshesFaces, LBMeshes, sim_folder):
    """Test the RadiationStudy class."""
    epw_FilePath = 'https://energyplus-weather.s3.amazonaws.com/southwest_pacific_wmo_region_5/SGP/SGP_Singapore.486980_IWEC/SGP_Singapore.486980_IWEC.zip'
    epwURL = get_epw_data(epw_FilePath)
    # sky_from_epw = SkyMatrix.from_epw_file(epwURL)
    HBObjs = []
    pts_a = []
    normals = []
    project_name = 'test'

    try :
        """ Setting radiance parameters"""
        params = RfluxmtxParameters()
        params.ambient_bounces = 1
        params.ambient_divisions = 512
        params.ambient_supersamples = 128
        params.ambient_resolution = 16
        params.ambient_accuracy = 0.25

    except Exception as e:
        print(e)
        return None

    try :
        centroids = [[[val for val in pt] for pt in mesh.face_centroids] for mesh in LBMeshes]

        """ Writing centroids to json file for debugging """
        smeshfaces = [[pt for pt in mesh.faces] for mesh in LBMeshes]
        payload = {
            "face_centroids": smeshfaces,
        }

        # Writing to payload.json
        with open(os.path.join(sim_folder , "face_centroids.json"), "w") as f:
            f.write(json.dumps(payload))
            print('payload written')

        """ Appending points of all meshes to a list in proper order """
        for m in range(len(aMeshesFaces)):
            pts_m = []
            for f in range(len(aMeshesFaces[m])):
                pts_f = []
                for i in range(len(aMeshesFaces[m][f])):
                    pts_f.append(aMeshesVerts[m][aMeshesFaces[m][f][i]])
                pts_a.append(pts_f)
            # pts_a.append(pts_m)
        
        for m in range(len(pts_a)):
            srf = HBSurface('mesh_{}'.format(m), pts_a[m])
            HBObjs.append(srf)

        for m in range(len(LBMeshes)):
            normals_ = []
            for f in range(len(LBMeshes[m].faces)):
                pts_f = []
                for i in range(len((LBMeshes[m].faces)[f])):
                    pt = list((LBMeshes[m].vertices)[(LBMeshes[m].faces)[f][i]])
                    pts_f.append(pt)
                    # pts_f.append([val for val in pt] for pt in (LBMeshes[m].vertices)[(LBMeshes[m].faces)[f][i]])
                normals_.append(normal_from_points(pts_f))
            normals.append(normals_)
        
        """ RUN HONEYBEE_RADIANCE SCRIPT"""
        rad_study = gridbased.GridBased.from_weather_file_points_and_vectors(epwURL, centroids, normals, radiance_parameters=params, hb_objects = HBObjs)
        cmd_file = rad_study.write(sim_folder, project_name=project_name)
        runRadianceCommands(cmd_file)
        resultsPath = os.path.join(sim_folder, "test", "gridbased_radiation", "result", "scene..default.ill")

        with open(resultsPath) as r:
            lines = [line.rstrip("\n") for line in r]
            lines = lines[20::]
            r.close()
            
        rad_vals = []
        rad_vals_combined = []
        counter = 0
        for c in range(len(centroids)):
            rad_m_vals = []
            for f in range(len(centroids[c])):
                rad_vals_str = re.split(r'\t+', lines[counter].rstrip('\t'))
                rad_vals = [ float(x) for x in rad_vals_str ]
                avg_rad_val = sum(rad_vals) / len(rad_vals)
                rad_m_vals.append(avg_rad_val)
                rad_vals_combined.append(avg_rad_val)
                # rad_m_vals.append(lines[(c*f) + f])
                counter+=1
            rad_vals.append(rad_m_vals)

        l_par = LegendParameters()
        l_par.min = min(rad_vals_combined)
        l_par.max = max(rad_vals_combined)
        legend = Legend(rad_vals_combined, l_par)

        # graphic = GraphicContainer(rad_vals_combined, legend_parameters=l_par)
        # colors_combined = graphic.colors
        colors_combined = legend.value_colors
        counter = 0
        colors_faces = []
        for c in range(len(centroids)):
            f_colors = []
            for f in range(len(centroids[c])):
                f_colors.append(colors_combined[counter])
                counter+=1
            colors_faces.append(f_colors)
        
        return rad_vals, colors_faces
        # return None

    except Exception as e:
        print(e)
        return None

def runRadianceCommands(command_file):
    """Run the analysis."""
    assert os.path.isfile(command_file), \
        ValueError('Failed to find command file: {}'.format(command_file))
    subprocess.call([r'{}'.format(command_file)])

def test_radiation_study():
    """Test the RadiationStudy class."""
    epw_FilePath = 'https://energyplus-weather.s3.amazonaws.com/southwest_pacific_wmo_region_5/SGP/SGP_Singapore.486980_IWEC/SGP_Singapore.486980_IWEC.zip'
    epwURL = get_epw_data(epw_FilePath)
    sky_from_epw = SkyMatrix.from_epw(epwURL)
    mesh_2d = Mesh2D.from_grid(Point2D(-1, -1), 2, 2, 1, 1)
    mesh = Mesh3D.from_mesh2d(mesh_2d)
    context_geometry = Face3D.from_extrusion(
        LineSegment3D.from_end_points(Point3D(-2, -2, 0), Point3D(2, -2, 0)),
        Vector3D(0, 0, 2)
    )

    # rad_study = RadiationStudy(sky_from_epw, mesh, [context_geometry], sim_folder=cwd)

    # assert isinstance(rad_study.sky_matrix, SkyMatrix)
    # assert isinstance(rad_study.study_mesh, Mesh3D)
    # assert isinstance(rad_study.context_geometry, tuple)
    # assert rad_study.offset_distance == 0
    # assert not rad_study.by_vertex
    # # assert rad_study.sim_folder is None
    # assert len(rad_study.study_points) == len(mesh.faces)
    # assert len(rad_study.study_normals) == len(mesh.faces)

    # int_mtx = rad_study.intersection_matrix
    # assert len(int_mtx) == len(mesh.faces)
    # assert len(int_mtx[0]) == 290
    # assert all(isinstance(v, float) for v in int_mtx[0])
    # assert not all(int_mtx[0])

    # rad_values = rad_study.radiation_values
    # assert all(isinstance(v, float) for v in rad_values)
    # irr_values = rad_study.irradiance_values
    # assert all(isinstance(v, float) for v in irr_values)
    # # assert rad_study.total_radiation() == pytest.approx(4584.5, rel=1e-3)

    # colored_mesh, graphic, title = rad_study.draw()
    # assert isinstance(colored_mesh, Mesh3D)
    # assert isinstance(graphic, GraphicContainer)
    # assert title == 'Incident Radiation'


def test_direct_sun_study():
    """Test the DirectSun class."""
    nyc = Location('New_York', country='USA', latitude=40.72, longitude=-74.02,
                   time_zone=-5)
    sp = Sunpath.from_location(nyc)
    suns = sp.analemma_suns(Time(12), True, True)
    sun_vecs = [s.sun_vector for s in suns]
    mesh_2d = Mesh2D.from_grid(Point2D(-1, -1), 2, 2, 1, 1)
    mesh = Mesh3D.from_mesh2d(mesh_2d)
    context_geometry = Face3D.from_extrusion(
        LineSegment3D.from_end_points(Point3D(-2, -2, 0), Point3D(2, -2, 0)),
        Vector3D(0, 0, 2)
    )
    sun_study = DirectSunStudy(sun_vecs, mesh, [context_geometry])

    assert isinstance(sun_study.vectors, tuple)
    assert isinstance(sun_study.study_mesh, Mesh3D)
    assert isinstance(sun_study.context_geometry, tuple)
    assert sun_study.offset_distance == 0
    assert not sun_study.by_vertex
    # assert sun_study.sim_folder is None
    assert len(sun_study.study_points) == len(mesh.faces)
    assert len(sun_study.study_normals) == len(mesh.faces)

    int_mtx = sun_study.intersection_matrix
    assert len(int_mtx) == len(mesh.faces)
    assert len(int_mtx[0]) == len(sun_vecs)
    assert all(isinstance(v, bool) for v in int_mtx[0])
    assert not all(int_mtx[0])

    sun_values = sun_study.direct_sun_hours
    assert all(isinstance(v, float) for v in sun_values)

    colored_mesh, graphic, title = sun_study.draw()
    assert isinstance(colored_mesh, Mesh3D)
    assert isinstance(graphic, GraphicContainer)
    assert title == 'Direct Sun Hours'


# test_radiation_study()