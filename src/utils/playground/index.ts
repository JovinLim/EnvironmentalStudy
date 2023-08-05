import * as THREE from 'three';
import { DirectionalLightHelper } from 'three/src/helpers/DirectionalLightHelper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
import { PCFSoftShadowMap, sRGBEncoding } from 'three/src/constants';
import { DirectionalLight } from 'three/src/lights/DirectionalLight';
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer';
import { Color as ThreeColor } from 'three/src/math/Color';
import { AmbientLight } from 'three/src/lights/AmbientLight';
import Stats from 'three/examples/jsm/libs/stats.module';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry';
import {Font, FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import { Vector3 } from 'three/src/math/Vector3';
import { DoubleSide } from 'three/src/constants';
import { Scene } from 'three/src/scenes/Scene';
import { Mesh } from 'three/src/objects/Mesh';
import { Config } from './Config';
import { Fog } from 'three/src/scenes/Fog';
import Viewport from './utils/Viewport';
import { Color } from 'three/src/math/Color';
import { PI } from './utils/Number';
import RAF from './utils/RAF';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Group, MeshBasicMaterial} from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import {v4 as uuidv4} from 'uuid';
import * as SunCalc from 'suncalc3';
import CustomObject from '../Serialization/Object/Object';
import { convertToMonthAndDay } from '../../Components/Geoservices/DateSlider';
import CustomMesh from '@utils_Serialization/Object/Geometry/CustomMesh';

let white_mat = new THREE.MeshBasicMaterial({color: '#ffffff'});
let ground_mat = new THREE.MeshStandardMaterial({color: '#9fb9e2', side: THREE.DoubleSide});


export default class Playground
{
  
  public scene = new THREE.Scene();
  private test = THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
  private readonly groundSize = Config.Ground.size;
  private readonly update = this.render.bind(this);
  public img_export_aspect = 1920/1080

  public Details = {
    Uid : String(uuidv4()).replaceAll("-","_"),
    owner : '',
    fileInfo : { filename: '', filesize: '', filetype: ''},
    coords : { lat: 1.3521, lng: 103.8198 },
    show : true,
    UTC : 8,
    doy : 181,
    month : 'July',
    monthNum: 7,
    monthDay : 1,
    time : 12.00,
    timeSliderVal : 720,
    timeSimple : {hours: 12, minutes:0},
    sphereRad : 100,
    altitude : 0,
    azimuth : 0,
    layers: <any>[],
    address : {},
    epwURL : 'https://energyplus-weather.s3.amazonaws.com/southwest_pacific_wmo_region_5/SGP/SGP_Singapore.486980_IWEC/SGP_Singapore.486980_IWEC.zip',
    blayers: "",
    olayers: "",
    fileBlob: <any> 0,
    simBlob: <any> 0,
    mtlFile: <any> 0,
    objFile: <any> 0,
    toSimulate: false,
    typology: "NIL",
    gfa: 0,
    importKey: "",
    job_key: "",
    objects: [] as CustomObject[],
    simObjects: [] as CustomMesh[],
    simulating: false,
    buildingInfo : {
      typology: "NIL",
      gfa: 0,
    },
    sustainability_benchmark: "Mandatory",
    boundingbox: {geometry:<any> 0, center: <any> 0},
    modelScaling: 0,
    simResultFolder : "Not Simulated",
  }

  private helper!: DirectionalLightHelper;
  private directional!: DirectionalLight;
  public orbitControls!: OrbitControls;
  public camera!: PerspectiveCamera;
  public otherCameras = {
    EleCam : new THREE.OrthographicCamera,
    PlanCam : new THREE.OrthographicCamera,
    EastCam : new THREE.PerspectiveCamera,
    SouthCam : new THREE.PerspectiveCamera,
    WestCam : new THREE.PerspectiveCamera,
    NorthWestCam : new THREE.PerspectiveCamera,
    SouthEastCam : new THREE.PerspectiveCamera,
    NorthEastCam : new THREE.PerspectiveCamera,
  };
  public bloomComposer !: EffectComposer;
  public renderer!: WebGLRenderer;
  public export_renderer!: WebGLRenderer;
  private ambient!: AmbientLight;
  private renderScene !: RenderPass;
  private bloomPass !: UnrealBloomPass;
  private elementDiv !: HTMLElement;
  private ground!: Mesh;
  private stats?: Stats;
  public viewport !: Viewport;

  public downloadables: String[] = [];
  public report_links: String[] = [];
  public image_links: String[] = [];
  public sim_data: String[] = [];
  public sim_health:object  = {};
  public viz_elements = {
                         "building": [] as THREE.Object3D[],
                         "AMPM": [] as THREE.Object3D[],
                         "Radiation": [] as THREE.Object3D[],
                         "light":  new THREE.DirectionalLight,
                         "sunpath":  new THREE.DirectionalLight
                        };
  
  // For each completed sim, generate a report

  public diagramGroup = new Group;
  private markingGroup = new Group;
  private defaultUp = new THREE.Vector3(0,0,1) // Defining default up for scene
  public sunPos = { x: 0, y:0, z:0 }

  public constructor (element: HTMLDivElement) {

    // THREE.Object3D.DEFAULT_UP.set(0, 0, 1)
    this.diagramGroup.name = 'diagramGroup'

    this.viewport = new Viewport(element)
    this.createScene();
    this.createCamera();
    // this.createGround();
    this.createCameras();
    

    this.createRenderer();
    this.createExportRenderer();
    this.createControls();
    // this.createStats();
    this.createDiagram();
    // this.scene.add(this.diagramGroup);


    RAF.add(this.update);
    RAF.pause = false;
  }

  public resetViz(){
    this.viz_elements = {"building": [] as THREE.Object3D[],
                         "AMPM": [] as THREE.Object3D[],
                        "Radiation": [] as THREE.Object3D[],
                        "light":  new THREE.DirectionalLight,
                        "sunpath":  new THREE.DirectionalLight
                        };
  }
  private createScene (): void {
    this.scene.background = new Color('#9fb9e2');
    this.scene.up.copy(this.defaultUp)
    this.background = Config.Background;
    this.updateFog(Config.Fog);
  }

  private createCamera (): void {
    const { fov, near, far, position } = Config.Camera;
    this.camera = new PerspectiveCamera(fov, this.viewport.size.ratio, near, far);
    this.camera.position.copy(position);
    this.camera.lookAt(0,0,0)
    this.camera.layers.enable(0)
    this.camera.name = 'MainCamera'
    this.camera.up.copy(this.defaultUp)
  }

  public createCameras (): void {
    const { fov, near, far} = Config.Camera;

    // Creating Elevation Camera // Looking from south to north
    const EleCam = new THREE.OrthographicCamera(-(240/2), (240/2), (135/2), -(135/2), near, far);
    EleCam.position.set(0, 67.5, 50)
    EleCam.lookAt(0, 0, 50)
    EleCam.updateProjectionMatrix();
    EleCam.name = 'ElevationCamera'
    EleCam.parent = null;
    EleCam.up.copy(this.defaultUp)
    this.otherCameras.EleCam = EleCam

    // Creating Plan Camera
    // const planCam = new THREE.OrthographicCamera(-this.viewport.width/2.5, this.viewport.width/2.5, this.viewport.height/2.5, -this.viewport.height/2.5, near, far);
    const planCam = new THREE.OrthographicCamera(-(480/2), (480/2), (270/2), -(270/2), near, far);
    planCam.position.set(0, 0, 100)
    planCam.lookAt(0, 0, 0)
    planCam.rotateZ(- Math.PI / 2)
    planCam.updateProjectionMatrix();
    planCam.name = 'PlanCamera'
    planCam.up.copy(this.defaultUp)
    this.otherCameras.PlanCam = planCam

    // Creating West Camera
    const westCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    westCam.position.set(-250, 0, 200)
    westCam.lookAt(0, 0, 0)
    westCam.updateProjectionMatrix();
    westCam.name = "WestCamera"
    westCam.up.copy(this.defaultUp)
    this.otherCameras.WestCam = westCam

    // Creating East Camera
    const eastCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    eastCam.position.set(250, 0, 200)
    eastCam.lookAt(0, 0, 0)
    eastCam.updateProjectionMatrix();
    eastCam.name = "EastCamera"
    eastCam.up.copy(this.defaultUp)
    this.otherCameras.EastCam = eastCam

    // Creating South Camera
    const southCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    southCam.position.set(0, -250, 200)
    southCam.lookAt(0, 0, 0)
    southCam.updateProjectionMatrix();
    southCam.name = "SouthCamera"
    southCam.up.copy(this.defaultUp)
    this.otherCameras.SouthCam = southCam

    // Creating NorthEast Camera
    const neCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    neCam.position.set(225 * Math.cos(degToRad(45)), 225 * Math.sin(degToRad(45)), 200)
    neCam.lookAt(0, 0, 0)
    neCam.updateProjectionMatrix();
    neCam.name = "NorthEastCamera"
    neCam.up.copy(this.defaultUp)
    this.otherCameras.NorthEastCam = neCam

    // Creating NorthWest Camera
    const nwCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    nwCam.position.set(-225 * Math.cos(degToRad(45)), 225 * Math.sin(degToRad(45)), 200)
    nwCam.lookAt(0, 0, 0)
    nwCam.updateProjectionMatrix();
    nwCam.name = "NorthWestCamera"
    nwCam.up.copy(this.defaultUp)
    this.otherCameras.NorthWestCam = nwCam

    // Creating SouthEast Camera
    const seCam = new THREE.PerspectiveCamera(fov, this.img_export_aspect, near, far)
    seCam.position.set(225 * Math.cos(degToRad(45)), -225 * Math.sin(degToRad(45)), 200)
    seCam.lookAt(0, 0, 0)
    seCam.updateProjectionMatrix();
    seCam.name = "SouthEastCamera"
    seCam.up.copy(this.defaultUp)
    this.otherCameras.SouthEastCam = seCam

  }

  private createLights (): void {
    const { ambient, directional } = Config.Lights;

    if (this.ambient == null || this.ambient == undefined) {
      this.ambient = new AmbientLight(ambient.color, ambient.intensity);
      this.directional = new DirectionalLight(directional.color, directional.intensity);
      this.helper = new DirectionalLightHelper(this.directional, directional.helper.size, directional.helper.color);
  
      // this.updateDirectional(directional);
      // this.scene.add(this.directional);
      this.ambient.layers.enable(0)
      this.ambient.layers.set(0)
      this.scene.add(this.ambient);
      // this.scene.add(this.helper);
    }

  }

  private createGround (): void {
    const { color, size } = Config.Ground;

    this.ground = new Mesh(
      new PlaneGeometry(size, size),
    );

    this.ground.receiveShadow = true;
    this.ground.rotateX(-PI.d2);
    this.scene.add(this.ground);
  }

  private createRenderer (): void {
    this.renderer = new WebGLRenderer({ powerPreference: 'high-performance', antialias: true, alpha:true, preserveDrawingBuffer:true, logarithmicDepthBuffer:true});

    this.renderer.setSize(this.viewport.size.width, this.viewport.size.height);
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setClearColor(Color.NAMES.BLACK, 0);
    this.renderer.capabilities.logarithmicDepthBuffer = true

    this.renderer.setPixelRatio(devicePixelRatio);
    // this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true;

  }

  public createExportRenderer (): void {
    this.export_renderer = new WebGLRenderer({ powerPreference: 'high-performance', antialias: true, alpha:true, preserveDrawingBuffer:true, logarithmicDepthBuffer:true});

    this.export_renderer.setSize(1920, 1080);
    this.export_renderer.shadowMap.type = PCFSoftShadowMap;
    this.export_renderer.setClearColor(Color.NAMES.BLACK, 0);
    this.export_renderer.capabilities.logarithmicDepthBuffer = true

    this.export_renderer.setPixelRatio(devicePixelRatio);
    // this.export_renderer.outputEncoding = sRGBEncoding;
    this.export_renderer.shadowMap.enabled = true;
    this.export_renderer.localClippingEnabled = true;
  }

  private createControls (): void {
    this.orbitControls = new OrbitControls(this.camera, this.domElement);
    this.orbitControls.target.copy(Config.Camera.target);

    this.viewport.addResizeCallback(this.resize.bind(this));
    this.orbitControls.addEventListener('change', () => {
      //console.log(this.camera.position)
    })
    this.orbitControls.update();
  }

  private createStats (): void {
    if (document.body.lastElementChild?.id !== 'stats') {
      this.stats = Stats();
      this.stats.showPanel(0);
      this.stats.domElement.id = 'stats';
      document.body.appendChild(this.stats.domElement);
    }
  }

  public resize (width: number, height: number, ratio: number): void {
    this.camera.aspect = ratio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private render (): void {
    this.stats?.begin();

    this.orbitControls.update();
    // this.renderer.render(this.scene, this.otherCameras.PlanCam);
    this.renderer.render(this.scene, this.camera);
    // this.bloomComposer.render();

    this.stats?.end();
  }

  public destroy (): void {
    this.renderer.domElement.remove();
    this.stats?.domElement.remove();
    this.orbitControls.dispose();

    this.renderer.dispose();
    this.scene.clear();
    RAF.dispose();
  }

  public get domElement (): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public set background (color: number) {
    (this.scene.background as ThreeColor).set(color);
  }

  public set controls (enabled: boolean) {
    this.orbitControls.enabled = enabled;
  }

  public set pause (paused: boolean) {
    this.controls = !paused;
    RAF.pause = paused;
  }

  public updateAmbient (ambient: typeof Config.Lights.ambient): void {
    const { color, intensity } = ambient;
    this.ambient.intensity = intensity;
    this.ambient.color.set(color);
  }

  public updateDirectional (directional: typeof Config.Lights.directional): void {
    const { bottom, right, left, top, near, far } = directional.shadow.camera;
    const { color, intensity, position, rotation, shadow } = directional;

    this.directional.shadow.mapSize.copy(shadow.mapSize);
    this.helper.visible = directional.helper.visible;

    this.directional.shadow.camera.bottom = bottom;
    this.directional.shadow.camera.right = right;
    this.directional.shadow.camera.left = left;
    this.directional.shadow.camera.top = top;

    this.directional.shadow.camera.near = near;
    this.directional.castShadow = shadow.cast;
    this.directional.shadow.camera.far = far;

    this.directional.position.copy(position);
    this.directional.rotation.copy(rotation);
    this.directional.intensity = intensity;
    this.directional.color.set(color);
  }

  public updateFog (fog: typeof Config.Fog): void {
    const { visible, color, near, far } = fog;
    this.scene.fog = visible ? new Fog(color, near, far) : null;

    if (this.scene.fog) {
      (this.scene.fog as Fog).near = near;
      (this.scene.fog as Fog).far = far;
      this.scene.fog.color.set(color);
    }
  }

  public updateCamera (camera: typeof Config.Camera): void {
    const { fov, near, far } = camera;
    this.camera.fov = fov;
    this.camera.near = near;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }

  public updateCameraPosition (position: Vector3, target: Vector3): void {
    this.orbitControls.target.copy(target);
    this.camera.position.copy(position);
  }

  public updateGround (ground: typeof Config.Ground): void {
    const { color, size, cell } = ground;
    this.ground.scale.setScalar(size / this.groundSize);
  }

  public createGroundPlane = () => {
    const planeGeom = new THREE.PlaneGeometry(1500 , 1500 ,32,32)
    const planeMat = ground_mat
    const plane = new THREE.Mesh(planeGeom, planeMat)
    plane.receiveShadow = true;
    // plane.rotateX(-PI.d2);
    plane.name = "groundPlane"

    const gridHelper = new THREE.GridHelper(1500, 500, '#9fb9e2', '#9fb9e2')
    gridHelper.name = "grid"
    
    plane.layers.set(0)
    gridHelper.layers.set(0)
    // this.scene.add(gridHelper)
    // this.scene.add(plane)
    // this.diagramGroup.add(gridHelper)
    this.diagramGroup.add(plane)
}


  public hideGroundPlane = () => {

    const white_mat = new THREE.MeshBasicMaterial({color: '#ffffff'});

    this.diagramGroup.traverse( (child) => {
      if(child instanceof THREE.GridHelper){
        child.visible = false;
      }
      
      if(child.name === "groundPlane"){
        (child as THREE.GridHelper).material = white_mat;
      }

    })
  }

  public showGroundPlane = () => {
    this.diagramGroup.traverse( (child) => {
      if(child instanceof THREE.GridHelper){
        child.visible = true;
      }


      if(child.name === "groundPlane"){
        (child as THREE.GridHelper).material = ground_mat;
      }

    })
  }

public updateSunShadow = (sun : THREE.DirectionalLight) => {
  sun.shadow.mapSize.width = this.Details.sphereRad * 3;
  sun.shadow.mapSize.height = this.Details.sphereRad * 3;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = this.Details.sphereRad * 3;
  sun.shadow.camera.top = this.Details.sphereRad * 3;
  sun.shadow.camera.bottom = -this.Details.sphereRad * 3;
  sun.shadow.camera.left = this.Details.sphereRad * 3;
  sun.shadow.camera.right = -this.Details.sphereRad * 3;
}

public createSun = (location : any) => {
  // Full sphere
  const phiStart = 0
  const phiEnd = Math.PI * 2
  const thetaStart = 0
  const thetaEnd = Math.PI * 2

  const geometry = new THREE.SphereGeometry( 5, 32, 16, phiStart, phiEnd, thetaStart, thetaEnd )
  const material = new THREE.MeshStandardMaterial( { color: THREE.Color.NAMES.yellow, side: THREE.DoubleSide, emissive: '#fffa96', emissiveIntensity: 1} )
  const sphere = new THREE.Mesh( geometry, material )
  sphere.position.set(this.sunPos.x, this.sunPos.z, this.sunPos.y)
  sphere.name = "sun"

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.name = "sundirectionalLight"
  directionalLight.position.set(this.sunPos.x, this.sunPos.z, this.sunPos.y)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 5000;
  directionalLight.shadow.mapSize.height = 5000;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 5000;
  directionalLight.shadow.camera.top = 5000;
  directionalLight.shadow.camera.bottom = -5000;
  directionalLight.shadow.camera.left = 5000;
  directionalLight.shadow.camera.right = -5000;

  const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 10, THREE.Color.NAMES.white)
  directionalLightHelper.name = "directionalLightHelper"

  directionalLight.layers.enable(0)
  directionalLight.layers.set(0)
  sphere.layers.set(0)
  // this.scene.add(directionalLight)
  // this.scene.add(sphere)
  this.diagramGroup.add(directionalLight)
  this.diagramGroup.add(sphere)
  this.viz_elements["sunpath"] = directionalLight

}

public calculateSunRoute = (latitude:number, longitude:number, UTC:number, day:number, time:number) => {
  var date = new Date(2023, this.Details.monthNum, this.Details.monthDay, this.Details.timeSimple.hours, this.Details.timeSimple.minutes)
  var SunPosition = SunCalc.getPosition(date, latitude, longitude)
  this.Details.altitude = SunPosition.altitude
  this.Details.azimuth = SunPosition.azimuth
}

public calculateSunLocation = (r : number, altitude : number, azimuth : number, ) => {
  this.sunPos.x = -(this.Details.sphereRad  * Math.cos(altitude) * Math.sin(azimuth))
  // this.sunPos.y = -(this.Details.sphereRad  * Math.cos(altitude) * Math.cos(azimuth))
  this.sunPos.y = (this.Details.sphereRad * Math.sin(altitude))
  // this.sunPos.z = (this.Details.sphereRad * Math.sin(altitude))
  this.sunPos.z = -(this.Details.sphereRad  * Math.cos(altitude) * Math.cos(azimuth))
}

public toggleVisibility = () => {

  const objects = []
  var sun = this.scene.getObjectByName('sun') as THREE.Object3D
  if (this.Details.show === true) {
      if (sun.visible === true) {
          sun.visible = false
      }
      this.Details.show = false
  }

  else {
      if (sun.visible === false){
          sun.visible = true
      }
      this.Details.show = true
  }
}

public redrawSun = () => {

  var sun = this.scene.getObjectByName("sun") as THREE.Object3D
  var dirLight = this.scene.getObjectByName("sundirectionalLight") as THREE.Object3D
  var dirLightHelper = this.scene.getObjectByName("directionalLightHelper") as THREE.Object3D
  this.diagramGroup.remove(sun)
  this.diagramGroup.remove(dirLight)
  this.diagramGroup.remove(dirLightHelper)
  this.calculateSunRoute(this.Details.coords.lat, this.Details.coords.lng, this.Details.UTC, this.Details.doy, this.Details.time)
  this.calculateSunLocation(this.Details.doy, this.Details.altitude, this.Details.azimuth)
  this.createSun(this.sunPos)

}

public createHemisphere = (planes: THREE.Plane[]) => {
  // Half a sphere
  const phiStart = 0
  const phiEnd = Math.PI * 2
  const thetaStart = 0
  const thetaEnd = Math.PI / 2
  const color = new THREE.Color('#f5e687')

  const geometry = new THREE.SphereGeometry( this.Details.sphereRad, 32, 16, phiStart, phiEnd, thetaStart, thetaEnd )
  const material = new THREE.MeshPhongMaterial( { color: color, side: THREE.DoubleSide, opacity:0.2, transparent: true, clippingPlanes: planes, emissive: color, emissiveIntensity:0.5} )
  const sphere = new THREE.Mesh( geometry, material )
  sphere.name = "hemisphere"

  sphere.layers.set(0)
  // this.scene.add(sphere)
  this.diagramGroup.add(sphere)

}

public createCirclePlane = () => {

  var rad = this.Details.sphereRad

  // Innermost Circle
  const circGeom1 = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0,0,this.Details.sphereRad,0, Math.PI * 2, true).getSpacedPoints(200)
  )

  const circleMat = new THREE.LineBasicMaterial({color: THREE.Color.NAMES.black})
  const circleLine = new THREE.Line(circGeom1, circleMat)

  circleLine.position.set(0,0,0.1)
  circleLine.layers.set(0)
  this.markingGroup.add(circleLine)

  // Middle Circle
  const circGeom2 = new THREE.BufferGeometry().setFromPoints(
    new THREE.Path().absarc(0,0,this.Details.sphereRad * 1.02,0, Math.PI * 2, true).getSpacedPoints(200)
  )
  const circleLine2 = new THREE.Line(circGeom2, circleMat)

  circleLine2.position.set(0,0,0.1)
  circleLine2.layers.set(0)
  this.markingGroup.add(circleLine2)

  // Outer Circle
  const circGeom3 = new THREE.BufferGeometry().setFromPoints(
    new THREE.Path().absarc(0,0,this.Details.sphereRad * 1.06,0, Math.PI * 2, true).getSpacedPoints(200)
  )
  const circleLine3 = new THREE.Line(circGeom3, circleMat)

  circleLine3.position.set(0,0,0.1)
  circleLine3.layers.set(0)
  this.markingGroup.add(circleLine3)
  const loader = new FontLoader()
  var group = this.markingGroup

  // Cardinal Lines
  const lineMat = new THREE.LineBasicMaterial({color: THREE.Color.NAMES.black})
  for (let i = 0; i < 8; i++) {
    const angleDeg = i * 45
    const pts = []
    if (angleDeg == 0) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.05, y * 1.05, 0.1))
      pts.push( new THREE.Vector3(x * 1.1, y * 1.1, 0.1))

      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('N', {
            font: font,
            size: 8,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
 
        textMesh.position.set(x * 1.15, y * 1.15, 0.1)
        textMesh.name = 'North'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 45) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.02, y * 1.02, 0.1))
      pts.push( new THREE.Vector3(x * 1.06, y * 1.06, 0.1))

      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('NE', {
            font: font,
            size: 4,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)

        textMesh.position.set(x * 1.11, y * 1.11, 0.1)
        textMesh.name = 'NorthEast'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 90) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.05, y * 1.05, 0.1))
      pts.push( new THREE.Vector3(x * 1.1, y * 1.1, 0.1))

      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('E', {
            font: font,
            size: 8,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)

        textMesh.position.set(x * 1.15, y * 1.15, 0.1)
        textMesh.name = 'East'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 135) {
      const x = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const y = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(-x, -y, 0.1))
      pts.push( new THREE.Vector3(-x * 1.02, -y * 1.02, 0.1))
      pts.push( new THREE.Vector3(-x * 1.06, -y * 1.06, 0.1))
      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('SE', {
            font: font,
            size: 4,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
        textMesh.position.set(- x * 1.13, - y * 1.13 , 0.1)
        textMesh.name = 'SouthEast'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 180) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.05, y * 1.05, 0.1))
      pts.push( new THREE.Vector3(x * 1.1, y * 1.1, 0.1))
      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('S', {
            font: font,
            size: 8,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
        textMesh.position.set(x, y * 1.2, 0.1)
        textMesh.name = 'South'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 225) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.02, y * 1.02, 0.1))
      pts.push( new THREE.Vector3(x * 1.06, y * 1.06, 0.1))
      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('SW', {
            font: font,
            size: 4,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
        textMesh.position.set(x * 1.15, y * 1.2, 0.1)
        textMesh.name = 'SouthWest'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 270) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.05, y * 1.05, 0.1))
      pts.push( new THREE.Vector3(x * 1.1, y * 1.1, 0.1))
      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('W', {
            font: font,
            size: 8,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
        textMesh.position.set(x * 1.25, y, 0.1)
        textMesh.name = 'West'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }
    else if (angleDeg == 315) {
      const y = this.Details.sphereRad * ( Math.cos(degToRad(angleDeg)) )
      const x = this.Details.sphereRad * ( Math.sin(degToRad(angleDeg)) )
      pts.push( new THREE.Vector3(x, y, 0.1))
      pts.push( new THREE.Vector3(x * 1.02, y * 1.02, 0.1))
      pts.push( new THREE.Vector3(x * 1.06, y * 1.06, 0.1))
      loader.load('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeom = new TextGeometry('NW', {
            font: font,
            size: 4,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelOffset: 0,
            bevelSegments: 5,
        })
        const textMat = new MeshBasicMaterial({color: THREE.Color.NAMES.black, side: THREE.DoubleSide})
        const textMesh = new Mesh(textGeom, textMat)
        textMesh.position.set(x * 1.2, y * 1.15, 0.1)
        textMesh.name = 'NorthWest'
        textMesh.layers.set(0)
        group.add(textMesh)
      })
    }


    const lineGeom = new THREE.BufferGeometry().setFromPoints(pts)
    const line = new THREE.Line(lineGeom, lineMat)
    line.layers.set(0)
    this.markingGroup.add(line)


  }

  // North Line


}

private createAnalemma = () => {

  //SETTING EMPTY ARRAYS
  const timings = []
  const days = []
  const analemmaList = []
  const localPlanes = []
  for (let i = 0; i < 24; i++){
      timings.push(i)
  }

  for (let i = 0; i < 365; i+=1){
      days.push(i)
  }
  for (let t = 0; t < timings.length; t++){
      var sunPosVectors = []
      for (let d = 0; d < days.length; d++){
        var [month_, day_] = convertToMonthAndDay(d)
        var date = new Date(2023, month_, day_, timings[t], 0)
        var SunPosition = SunCalc.getPosition(date, this.Details.coords.lat, this.Details.coords.lng)
        var vec = new THREE.Vector3((this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.sin(SunPosition.azimuth)), (this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.cos(SunPosition.azimuth)), -(this.Details.sphereRad * Math.sin(SunPosition.altitude)))
        sunPosVectors.push(vec)
      }
      sunPosVectors.push(sunPosVectors[0])
      const curve = new THREE.CatmullRomCurve3(sunPosVectors)
      
      const pts = curve.getPoints(300)
      const geom = new THREE.BufferGeometry().setFromPoints(pts)
      const material = new THREE.LineBasicMaterial( {color: '#424242'} )
      const curveObj = new THREE.Line(geom, material)
      curveObj.name = `Analemma ${t+1}`
      curveObj.layers.set(0)
      this.diagramGroup.add(curveObj)
  }

  //CREATING ANALEMMA CURVES AND HEMISPHERE
  for (let d = 0; d < 3; d++) {
      var sunPosVectors = []
      var day = 0
      var color = '#424242'
      if (d == 0) {
          day = 50
          color = '#fbff00'
      }

      else if (d == 1){
          day = 140
          color = '#0033ff'//'#ff0000'
      }

      else if (d==2){
          day = 328
          color = '#ff0000'//'#0033ff'
      }

      //CREATING CURVES
      for (let t = 0; t <= timings.length; t++){
        if (t != timings.length) {
          var [month_, day_] = convertToMonthAndDay(day)
          var date = new Date(2023, month_, day_, timings[t], 0)
          var SunPosition = SunCalc.getPosition(date, this.Details.coords.lat, this.Details.coords.lng)
          var vec = new THREE.Vector3((this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.sin(SunPosition.azimuth)), (this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.cos(SunPosition.azimuth)), -(this.Details.sphereRad * Math.sin(SunPosition.altitude)))
          sunPosVectors.push(vec)
        }
        else {
          var [month_, day_] = convertToMonthAndDay(day)
          var date = new Date(2023, month_, day_, timings[0], 0)
          var SunPosition = SunCalc.getPosition(date, this.Details.coords.lat, this.Details.coords.lng)
          var vec = new THREE.Vector3((this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.sin(SunPosition.azimuth)), (this.Details.sphereRad  * Math.cos(SunPosition.altitude) * Math.cos(SunPosition.azimuth)), -(this.Details.sphereRad * Math.sin(SunPosition.altitude)))
          sunPosVectors.push(vec)
        }
      }
      const curve = new THREE.CatmullRomCurve3(sunPosVectors)
      
      const pts = curve.getPoints(300)
      const geom = new THREE.BufferGeometry().setFromPoints(pts)
      const material = new THREE.LineBasicMaterial( {color: color} )
      const curveObj = new THREE.Line(geom, material)
      curveObj.name = `AnalemmaEdge${d+1}`
      curveObj.layers.set(0)
      this.diagramGroup.add(curveObj)
      
      //CREATING CLIPPING PLANES
      if (d == 1) {
          const plane = new THREE.Plane
          plane.setFromCoplanarPoints(sunPosVectors[2], sunPosVectors[1], sunPosVectors[0])
          if (plane.normal.z > 0){
              plane.setFromCoplanarPoints(sunPosVectors[0], sunPosVectors[1], sunPosVectors[2])
          }
          localPlanes.push( plane )
      }

      else if (d == 2) {
          const plane = new THREE.Plane
          plane.setFromCoplanarPoints(sunPosVectors[0], sunPosVectors[1], sunPosVectors[2])
          if (plane.normal.z < 0){
              plane.setFromCoplanarPoints(sunPosVectors[2], sunPosVectors[1], sunPosVectors[0])
          }
          localPlanes.push( plane )
      }
  }
}

public redrawAnalemma = () => {
  this.calculateSunLocation(this.Details.doy, this.Details.altitude, this.Details.azimuth)
  this.redrawSun();
  for (let i = 0; i < 24; i++){
      var analemma = this.scene.getObjectByName(`Analemma ${i+1}`) as THREE.Object3D
      this.diagramGroup.remove(analemma)
  }

  for (let i = 0; i < 3; i++){
      var analemmaEdge = this.scene.getObjectByName(`AnalemmaEdge${i+1}`) as THREE.Object3D
      this.diagramGroup.remove(analemmaEdge)
  }

  var hemisphere = this.scene.getObjectByName('hemisphere') as THREE.Object3D
  this.diagramGroup.remove(hemisphere)
  this.createAnalemma()
}

public createDiagram = () => {
  this.scene.remove(this.diagramGroup)
  this.diagramGroup.clear()
  this.createLights();
  this.calculateSunRoute(this.Details.coords.lat, this.Details.coords.lng, this.Details.UTC, this.Details.doy, this.Details.time)
  this.calculateSunLocation(this.Details.doy, this.Details.altitude, this.Details.azimuth)
  this.createGroundPlane()
  this.createCirclePlane()
  this.createSun(this.sunPos)
  this.createAnalemma()
  this.scene.add(this.markingGroup)
  this.scene.add(this.diagramGroup)

}

public clearModel = () => {
  var previousModel = this.scene.getObjectByName(`Project_${this.Details.Uid}_models`) as THREE.Object3D
  var simModel = this.scene.getObjectByName(`Simulation`) as THREE.Object3D
  this.scene.remove(previousModel)
  this.scene.remove(simModel)
}

}
