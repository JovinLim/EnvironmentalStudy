/*
Location Selector

CREATED BY JOVIN

HTML Elements for Geoservices
*/

import { Component, createSignal, onMount } from 'solid-js';
// import 'leaflet/dist/leaflet.css';
import { playground } from '../../App';
import { getDate } from './DateSlider';
import Playground from '../../utils/playground';
import { changeTime } from './TimeHandler';
import { buildMap, map } from './OpenLayersMap.cjs'
// import { configureElem } from '../../utils/Log';



const LocationSelector: Component = () => {
    
    // let mapDiv: any;
    onMount(() => {
      
      const playground_ = playground() as Playground
      var lngdisp = document.getElementById('lngDisplay') as HTMLElement
      var latdisp = document.getElementById('latDisplay') as HTMLElement
      var utcdisp = document.getElementById('UTCDisplay') as HTMLElement

      // Configure buttons that do not have "button" tag manually for logging
      // const timeslider = document.getElementById("timeRange") as HTMLElement
      // const dateslider = document.getElementById("dateRange") as HTMLElement
      // configureElem(timeslider)
      // configureElem(dateslider)

      //TODO: only load innerHTML when receiving an event after Details have loaded
      if(playground_?.Details === undefined){return}
      lngdisp.innerHTML = `${playground_?.Details?.coords.lat, playground_.Details.coords.lng}&nbsp;&nbsp;&nbsp;&nbsp;`
      latdisp.innerHTML = `${playground_?.Details?.coords.lat, playground_.Details.coords.lat}&nbsp;&nbsp;&nbsp;&nbsp;`
      utcdisp.innerHTML = playground_.Details.UTC > 0 ? `+${playground_.Details.UTC}` : `${playground_.Details.UTC}`
      });


    return (
      <div>
        <div class="map ">
            <div id="map"> </div>
        </div>
        
      <div id="accordion-collapse-2" data-accordion="open" style="width: 400px; background-color: white">
        <h2 id="accordion-collapse-heading-4">
          <button id = "Time & Date" type="button" class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" data-accordion-target="#accordion-collapse-body-4" aria-expanded="true" aria-controls="accordion-collapse-body-4">
            <span>Time & Date</span>
            <svg data-accordion-icon class="w-6 h-6 rotate-180 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </h2>
        <div id="accordion-collapse-body-4" class="hidden" aria-labelledby="accordion-collapse-heading-4" >
          <div style="width:100%; padding-bottom:0; padding-top: 10px" class="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
            <div style='color: gray; font-size: 20px; width:100%;'> Time:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span style="position:relative; right:0px" id="timeDisplay">12:00</span >
            </div>
            <div style="width:100%; padding-bottom; 0px;"><input class="time" type="range" min="0" max="1440" value={`${playground()?.Details.timeSliderVal}`} id='timeRange' step="15" onInput={() => changeTime(playground() as Playground)}></input></div>
            <div style='color: gray; font-size: 20px; width:100%'> Date:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span id="dateShow">1 July</span >
            </div>
            <div style="width:300px; padding-bottom; 0px; height:20px"><input type="range" min="0" max="364" value={`${playground()?.Details.doy}`} id='dateRange' class="date" step="1" onInput={() => getDate(playground() as Playground)}/></div>
          </div>
        </div>
        <h2 id="accordion-collapse-heading-5">
          <button id = "Location" type="button" class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" data-accordion-target="#accordion-collapse-body-5" aria-expanded="false" aria-controls="accordion-collapse-body-5">
            <span>Location</span>
            <svg data-accordion-icon class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </h2>
        <div id="accordion-collapse-body-5" class="hidden" aria-labelledby="accordion-collapse-heading-5">
          <div class="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700">
            <div style='color: gray;'>
              Latitude:&nbsp;<span  id="latDisplay">12:00&nbsp;&nbsp;&nbsp;&nbsp;</span >
              Longitude:&nbsp;<span id="lngDisplay">12:00&nbsp;&nbsp;&nbsp;&nbsp;</span >
              </div>
            <div style='color: gray;'>
              Time Zone:&nbsp;<span id="UTCDisplay">12:00</span >
              </div>
          </div>
        </div>
        
        <h2 id="accordion-collapse-heading-6">
          <button id = "ClimateInfo" type="button" class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" data-accordion-target="#accordion-collapse-body-6" aria-expanded="false" aria-controls="accordion-collapse-body-6">
            <span>Climate Information</span>
            <svg data-accordion-icon class="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </h2>
        <div id="accordion-collapse-body-6" class="hidden" aria-labelledby="accordion-collapse-heading-6">
          <div class="p-5 font-light border border-t-0 border-gray-200 dark:border-gray-700">
          <p><a target="_blank" href="/climate.html">Click here to generate Climate Data!</a></p>
          </div>
        </div>
      </div>

      </div>
  )
}

export default LocationSelector;
