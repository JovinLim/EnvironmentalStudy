/*
Nominatim Service provider

CREATED BY JOVIN
*/

import { fromLonLat, transform } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { marker, setMarker, updateMarker } from '../../Components/Geoservices/OpenLayersMap.cjs';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon } from 'ol/style';

// Other imports
import { playground, setPlayground } from '../../App';
// import { setDBStorage } from '../Storage/IndexedDBFunctions';
import { getAddress, updateLocation, getEPW_URL } from '../../Components/Geoservices/OpenLayersMap.cjs';
import {displayLoading, hideLoading} from '../General/LoadingHandler'

export default class Nominatim {
    /**
   * @constructor
   * @param {Function} base Base class.
   **/

    baseURL = 'https://nominatim.openstreetmap.org/search?'
    constructor(base) {
        this.Base = base
        this.configureSearchInput()

    }

    configureSearchInput() {
  /*
    Configuring results shown for search input
    
    Arguments:
      - 

    Returns:
      -

    Notes:
      - 
  */
        const getSearchResults = async (params_, max_results = 5) => {
            let searchResult;
            const queryString = new URLSearchParams(params_).toString();
            const requestOptions = {
                method: "GET",
                redirect: "follow"
            }

            await new Promise((resolve, reject) => {
                fetch(`${this.baseURL}${queryString}`, requestOptions)
                    .then((response) => response.text())
                    .then((result) => {
                        const resArr = JSON.parse(result).slice(0, max_results)
                        resolve(resArr)
                    })
                    .catch((error) => {
                        console.log("Error:", error)
                        reject(error)
                    });
            }).then((pRes) => {
                searchResult = pRes
            })

            return searchResult
        }

        const addResult = async (searchRes_) => {
            var resultDiv = this.Base.resultlist_
            var uuid_ = this.Base.uuid_
            for (let i = 0; i < searchRes_.length; i++){
                const result_ = searchRes_[i]
    
                // Create <a> for each result
                var resDiv = document.createElement('anchor')
                resDiv.id = `Searchbar_result_${uuid_}_${i}`
                resDiv.className = 'text-sm search-result px-2.5 py-2'
                resDiv.style.overflow = 'hidden'
                resDiv.innerHTML = result_.display_name
                this.configureResultClick(result_, resDiv)
    
                // Append to result div
                resultDiv.appendChild(resDiv)
            }
        }

        const clearResultDiv = async () => {
            this.Base.resultlist_.replaceChildren()
            this.Base.resultlist_.style.display = ''
        }

        this.Base.searchinput_.addEventListener('change', async function(e) {
            // Prevent page refresh on change
            e.preventDefault()

            // Clear results
            clearResultDiv()

            // Replace search text with input value
            const params = {
                q: e.target.value,
                format: 'json',
                addressdetails: 1,
                polygon_geojson: 0
            }

            
            const results = await getSearchResults(params)
            addResult(results)
        })

        // Preventing refresh when people press enter
        this.Base.searchinput_.addEventListener('keypress', function(e) {
            if (e.key === "Enter"){
                e.preventDefault()
            }
        })
    }

    configureResultClick (result, element) {
        
        const updateMapView = async () => {
            const map = this.Base.getMap()
            await map.getView().animate({duraction:300, resolution: 2.4, zoom: 13}, {duration: 300, center: fromLonLat([result.lon, result.lat])})
            updateMarker(map)
        }

        const closeResultList = async() => {
            var resultDiv = this.Base.resultlist_
            var searchInput = this.Base.searchinput_
            resultDiv.replaceChildren()
            resultDiv.style.display = 'none'
            searchInput.value = ''
            
        }

        const updatePlayground = async (result_, playground_) => {
            playground_.Details.coords = {lat: Number(result_.lat), lng: Number(result_.lon)}
        }

        async function getUTC(playground_) {
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

        element.addEventListener('click', async function(e) {
            const playground_ = playground()
            updatePlayground(result, playground_)
            getCountry(playground_.Details.coords)
            updateMapView()
            closeResultList()
            await getUTC(playground_).then(function(res){
                if (res != 0) {
                  playground_.redrawAnalemma()
                  updateLocation(playground_)
                  getEPW_URL(playground_)
                  getCountry(playground_.Details.coords);
                }
              })
            // Setting IndexedDB storage
            // setDBStorage('App')
        })

    }


}