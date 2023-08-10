/*
OpenLayers map

CREATED BY JOVIN

Contains functions relating to geoservices for the OpenLayers map

Current functions:
  - build map
  - update map marker
  - update location
  - get address of search
  - get epw url
*/

// ol imports
import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import { Point } from 'ol/geom';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import olstyles from '../../ol.css';
import Select from 'ol/interaction/Select.js';
import {click} from 'ol/events/condition.js';
import { Control, defaults as defaultControls } from 'ol/control.js';
import { Feature } from 'ol'

// Other imports
import { playground, setPlayground } from '../../App';
import SearchBar from '../../utils/Geoservice/SearchbarBase.js'
import { createSignal } from 'solid-js';
// import { setDBStorage } from '../../utils/Storage/IndexedDBFunctions';
import epwInfo from "../../utils/EPW/EPW_Compilation.json";
import {XMLParser} from 'fast-xml-parser';

export const [marker, setMarker] = createSignal();
let map = new Map;
const parser = new XMLParser();
const markerurl = import.meta.env.VITE_TESTING ? '../src/assets/marker-icon.png' : import.meta.env.BASE_URL + 'assets/marker-icon.png'

export function buildMap(div){
/*
  Builds ol map
  
  Arguments:
    - div : Target HTMLDivElement to contain map

  Returns:
    -

  Notes:
    - 
*/
  let playground_ = playground()
  map = new Map({
      target: div,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([playground_.Details.coords.lng, playground_.Details.coords.lat]),
        zoom: 13,
      }),
      controls: defaultControls().extend([new SearchBar()])
  })


  // Create marker
  var marker_ = new VectorLayer({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new Point(
              fromLonLat([playground_.Details.coords.lng, playground_.Details.coords.lat])
            )
          })
        ],
      }),
      style: new Style({
        image: new Icon({
          src: markerurl,
        })
      })
  })

  setMarker(marker_)

  // Add initial marker
  map.addLayer(marker())

  map.on('click', function(e) {

    playground_ = playground()
    // Getting coordinates from click
    var coordinates = transform(e.coordinate, 'EPSG:3857', 'EPSG:4326')

    // Updating playground details
    playground_.Details.coords.lng = coordinates[0]
    playground_.Details.coords.lat = coordinates[1]

    // Updating view on click
    updateMap(playground_, this)
    playground_.createDiagram()
  })

  // // Select interaction working on "click"; for future purposes if needed
  // const selectClick = new Select({});

  // map.addInteraction(selectClick)
  // selectClick.on('select', function(e) {
  //   console.log(e.target.coords)
  // })
}

export async function updateMarker(map) {
/*
  Updates marker on map
  
  Arguments:
    - map : Target Map object

  Returns:
    -

  Notes:
    - Removes previous marker layer and adds a new one
*/
    const playground_ = playground()
    map.removeLayer(marker())
    var marker_ = new VectorLayer({
        source: new VectorSource({
          features: [
            new Feature({
              geometry: new Point(
                fromLonLat([playground_.Details.coords.lng, playground_.Details.coords.lat])
              )
            })
          ],
        }),
        style: new Style({
          image: new Icon({
            src: markerurl,
          })
        }),
    })
    setMarker(marker_)
    map.addLayer(marker_)
}

export function updateMap(playground_, map_) {
/*
  Updates map view
  
  Arguments:
    - playground_ : Target Playground object
    - map_ : Target Map object

  Returns:
    -

  Notes:
    - 
*/
  if (map_ == undefined){
  }
  else {
    map_.getView().animate({duraction:300, resolution: 2.4, zoom: 13}, {duration: 300, center: fromLonLat([playground_.Details.coords.lng, playground_.Details.coords.lat])})
    updateMarker(map_)
    getAddress(playground_.Details.coords)
    getEPW_URL(playground_)
  }
  // setDBStorage('App')
}

export function updateLocation(playground_) {
/*
  Update location of Geoservices div
  
  Arguments:
    - playground_ : Target Playground object

  Returns:
    -

  Notes:
    - 
*/
  var lngdisp = document.getElementById('lngDisplay')
  var latdisp = document.getElementById('latDisplay')
  var utcdisp = document.getElementById('UTCDisplay')
  lngdisp.innerHTML = `${(playground_.Details.coords.lng).toFixed(4)}&nbsp;&nbsp;&nbsp;&nbsp;`
  latdisp.innerHTML = `${(playground_.Details.coords.lat).toFixed(4)}&nbsp;&nbsp;&nbsp;&nbsp;`
  utcdisp.innerHTML = playground_.Details.UTC > 0 ? `+${playground_.Details.UTC}` : `${playground_.Details.UTC}`
}

export function getAddress(latlng){
/*
  Get address of current click or search and updates playground() details
  
  Arguments:
    - latlng : Object containing latitude and longitude

  Returns:
    - 

  Notes:
    - 
*/
  const playground_ = playground()
  // let sims = [...upfiles()]
  fetch('https://nominatim.openstreetmap.org/reverse?'+new URLSearchParams({
  lat: latlng.lat,
  lon: latlng.lng,
  })).then((res)=>{
    return res.text();
  }).then((data)=>{
    let result = parser.parse(data);
    playground_.Details.address = result.reversegeocode.addressparts;
  });
}

export function getEPW_URL(playground_ ) {
/*
  Gets URL for coordinates in target Playground object
  
  Arguments:
    - playground_ : Target Playground object

  Returns:
    -

  Notes:
    - 
*/
  var distances = []

  for (var i = 0; i < (epwInfo).epw.length; i++) {
    var coords = (epwInfo).epw[i].coords
    var dist = Math.abs(Math.pow(playground_.Details.coords.lat - coords[0], 2) + Math.pow(playground_.Details.coords.lng - coords[1], 2))
    distances.push(dist)
  }

  var minDistInd = distances.indexOf(Math.min.apply(Math, distances))
  var url_ = ((epwInfo).epw[minDistInd]).url
  playground_.Details.epwURL = url_
  console.log(url_)
  return url_
}

export {map}