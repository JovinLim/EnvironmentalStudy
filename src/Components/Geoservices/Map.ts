import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/assets/css/leaflet.css"
import L, {LeafletMouseEvent } from "leaflet";
import {GeoSearchControl, OpenStreetMapProvider} from 'leaflet-geosearch'
import { playground} from "../MainPage/NewScene";
import Playground from "../../utils/playground";
import {upfiles} from '../MainPage/Import';
import epwInfo from "../../utils/EPW/EPW_Compilation.json";
import {XMLParser} from 'fast-xml-parser';
/*
import { Component, createSignal, onMount } from 'solid-js';
import { testLog } from '../utils/setCoords';
import express from 'express';
import cors from 'cors';
import {createServer as createViteServer} from 'vite';
import jszip from 'jszip';
import { changeTime } from "./TimeHandler";
*/
import {displayLoading, hideLoading} from '../../utils/General/LoadingHandler';
import { setDBStorage } from "../../utils/Storage/IndexedDBFunctions";
import { ShowErrorAlert } from "../../utils/General/AlertHandler";



const parser = new XMLParser();
let map : L.Map

export async function getUTC(playground_ : Playground) {
  displayLoading()
  try {
    const controller = new AbortController()
    const signal = controller.signal
    const response = await fetch(`https://api.wheretheiss.at/v1/coordinates/${playground_.Details.coords.lat},${playground_.Details.coords.lng}`, {signal:signal})
    .then(async function(res) {
      // If fetch succeeds
      if (res.ok){
        const myJson_ = await res.json().then(function (resJson) {
          hideLoading()
          playground_.Details.UTC = resJson.offset
        })
        return res
      }

      // if fetch fails, do not update map and sunpath diagram. Abort fetch
      else{
        hideLoading()
        ShowErrorAlert("Unknown Location. Please Select Another.")
        controller.abort()
        return 0
      }
    })
    // const myJson = await response?.json()
    // console.log(myJson)
    // hideLoading()
    // playground_.Details.UTC = myJson.offset
  }catch {
    hideLoading()
    ShowErrorAlert("Unknown Location. Please Select Another.")
    return 0
  }
}

//BUILD LEAFLET MAP

//Leaflet map coord setting
// var test_mark = L.marker([51.5, -0.09])
// const [coord, setCoord] = createSignal(test_mark.getLatLng())

export function buildMap (div: HTMLDivElement) {
  const playground_ = playground() as Playground
    map = L.map(div).setView([playground_.Details.coords.lat, playground_.Details.coords.lng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
  
    var marker = L.marker([playground_.Details.coords.lat, playground_.Details.coords.lng]).addTo(map)
      // .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
      // .openPopup();
    // var markers = [marker]
    const provider = new OpenStreetMapProvider()
    const searchControl = GeoSearchControl({
      provider: provider, // required
      showMarker: true, // optional: true|false  - default true
      showPopup: false, // optional: true|false  - default false
      style: 'bar',
      maxMarkers: 1, // optional: number      - default 1
      retainZoomLevel: true, // optional: true|false  - default false
      animateZoom: true, // optional: true|false  - default true
      autoClose: false, // optional: true|false  - default false
      searchLabel: 'Enter address', // optional: string      - default 'Enter address'
      keepResult: true, // optional: true|false  - default false
      updateMap: true, // optional: true|false  - default true
    }).addTo(map)


      map.on('click', async (e : any) => {
        updateMarkerOnClick(e, marker)
        const playground_ = playground() as Playground
        await getUTC(playground_).then(function(res){
          if (res != 0) {
            playground_.redrawAnalemma()
            updateLocation(playground_)
            getEPW_URL(playground_)
            getCountry(playground_.Details.coords);
          }
        })
        setDBStorage('App');
      })

      map.on('geosearch/showlocation', async function(e:any) {
        const playground_ = playground() as Playground
        getCountry(e.marker._latlng);
        playground_.Details.coords.lat = e.location.y
        playground_.Details.coords.lng = e.location.x
        await getUTC(playground_).then(function(res){
          if (res != 0) {
            playground_.redrawAnalemma()
            updateLocation(playground_)
            getEPW_URL(playground_)
            getCountry(playground_.Details.coords);
          }
        })
        setDBStorage('App');
      })

}

export function updateLocation(playground_ : Playground) {
  var lngdisp = document.getElementById('lngDisplay') as HTMLElement
  var latdisp = document.getElementById('latDisplay') as HTMLElement
  var utcdisp = document.getElementById('UTCDisplay') as HTMLElement
  lngdisp.innerHTML = `${(playground_.Details.coords.lng).toFixed(4)}&nbsp;&nbsp;&nbsp;&nbsp;`
  latdisp.innerHTML = `${(playground_.Details.coords.lat).toFixed(4)}&nbsp;&nbsp;&nbsp;&nbsp;`
  utcdisp.innerHTML = playground_.Details.UTC > 0 ? `+${playground_.Details.UTC}` : `${playground_.Details.UTC}`
}

export function updateMap(playground_ : Playground, map_ : L.Map) {
  if (map_ == undefined){
    
  }
  else {
    map_.setView([playground_.Details.coords.lat as number, playground_.Details.coords.lng as number], 13)
    removeMarker(map)
    var newMarker = L.marker([playground_.Details.coords.lat, playground_.Details.coords.lng]).addTo(map)
    getCountry(playground_.Details.coords);
  }
}

function removeMarker(map: L.Map) {
  map.eachLayer( function(layer) {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer)
    }
  })
}

export function getCountry(latlng : any){
  const playground_ = playground() as Playground
  let sims = [...upfiles()]
  fetch('https://nominatim.openstreetmap.org/reverse?'+new URLSearchParams({
  lat: latlng.lat,
  lon: latlng.lng,
  })).then((res)=>{
    return res.text();
  }).then((data)=>{
    let result = parser.parse(data);
    playground_.Details.address = result.reversegeocode.addressparts;
    sims.forEach(sim => {
      if(sim.id === playground_.Details.Uid){
        sim.address = playground_.Details.address;
        sim.epw_url = playground_.Details.epwURL;
        console.log(sim)
      }
    });
  });
}

function updateMarkerOnClick(e: LeafletMouseEvent, marker: L.Marker){
  const playground_ = playground() as Playground

  
  removeMarker(map)
  var newMarker = L.marker(e.latlng).addTo(map)
  
  getCountry(e.latlng);


  playground_.Details.coords.lat = e.latlng.lat as number
  playground_.Details.coords.lng = e.latlng.lng as number
}

export function getEPW_URL(playground_ : Playground) {
  var distances = []

  for (var i = 0; i < (epwInfo as any).epw.length; i++) {
    var coords = (epwInfo as any).epw[i].coords
    var dist = Math.abs(Math.pow(playground_.Details.coords.lat - coords[0], 2) + Math.pow(playground_.Details.coords.lng - coords[1], 2))
    distances.push(dist)
  }

  var minDistInd = distances.indexOf(Math.min.apply(Math, distances))
  var url_ = ((epwInfo as any).epw[minDistInd]).url
  playground_.Details.epwURL = url_
  console.log(url_)
  return url_
}
/*
function fetchEPW (url : string) {
  displayLoading()

  fetch(`http://localhost:5173/get-epw/`, {
    method: "POST",
    headers: {
      'Content-Type' : 'application/json'
    },
    body: JSON.stringify({
      url: url
    })
  })
  .then(function(response) {
    return response.text()
  })
  .then(function(result) {
    hideLoading()
    console.log(result)
  })

}
*/

export {map}

