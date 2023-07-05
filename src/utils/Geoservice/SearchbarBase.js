import { Control, defaults as defaultControls } from 'ol/control.js';
import { createSignal } from 'solid-js';
import {v4 as uuidv4 } from 'uuid';
import 'flowbite';
import Nominatim from './Nominatim';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search?'


export default class SearchBar extends Control {

    uuid;
    results;
    searchbar_;
    searchform_;
    searchinput_;
    resultlist_;
    params_;
    nominatim_;

    constructor(opt_options) {

        const options = opt_options || {}
        const uuid = uuidv4();
    
        // Create div
        const searchbardiv = document.createElement('div')
        searchbardiv.id = `Searchbar_${uuid}`
        searchbardiv.style.display = 'flex'
        searchbardiv.style.flexDirection = 'column'
        searchbardiv.className = 'search-container'

        super({
            element:searchbardiv,
            target: options.target
        })

        this.searchbar_ = searchbardiv
        this.uuid = uuid
        const childrenDivs = this.createChildrenDivs(this.searchbar_, uuid)
        this.searchinput_ = childrenDivs[0]
        this.searchform_ = childrenDivs[1]
        this.resultlist_ = childrenDivs[2]
        // this.configureSearchInput()
        this.nominatim_ = new Nominatim(this)

    }

    createChildrenDivs (parentDiv, uuid_) {
       // Create form
       const searchForm = document.createElement('form')
       searchForm.id = `Searchbar-${uuid_}-form`
       searchForm.className = 'no-submit flex w-full'
   
       // Create input
       const input = document.createElement('input')
       input.id = `Searchbar_input_${uuid_}`
       input.type = 'search'
       input.placeholder = 'Search...'
       input.formMethod = "GET"
       input.className = 'no-submit'

       // Create empty list for results
       const resultUL = document.createElement('ul')
       resultUL.id = `Searchbar_resultUL_${uuid_}`
       const resultList = document.createElement('li')
       resultList.id = `Searchbar_result_${uuid_}`
       resultList.className = 'search items-left text-left flex border border-gray-400 divide-y divide-gray-400'
       resultList.style.flexDirection = 'column'

        // Adding to parent
        resultUL.appendChild(resultList)
        searchForm.appendChild(input)
        parentDiv.appendChild(searchForm)
        parentDiv.appendChild(resultUL)

        return [input, searchForm, resultList]
    }

  }