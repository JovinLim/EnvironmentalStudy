///////////////////////////////////////////////////////////////////////////////////
// Components.js
// 
// Contributors: Bob Lee
// Copyright 2022 Bob Lee
// Description:
// Contains all functions used to evaluate and update nodes within the node canvas
//
// TODO List:
// - Make an easy model import node for preconfigured recipes
// - Fix error that happens when a node is deleted, then new nodes are made have issues transferring data
///////////////////////////////////////////////////////////////////////////////////
// Node Creation Functions
///////////////////////////////////////////////////////////////////////////////////
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import {scene} from '../rhino_test/script.js'

let data = {
	
	inputs:[],
	outputs:[],
	monitor:''
}

export function dcgen_node(editor,nodes_to_eval,df_offsetX,df_offsetY){
    //boolean button, but transforms into a loading bar when clicked
    
	console.log("Test1 Node Created");
	let _func = {
		inputs: [],
		outputs: []
	};    
	var run = editor.addNode("node", "7", "1", df_offsetX, df_offsetY, "node", _func, `
				<div>
				<div class="title-box">DCGen</div>
				<div class="box">
                <p>Room Module Spreadsheet</p><br>
                <p>Liquid MW</p><br>
                <p>Air MW</p><br>
                <p>Redundancy</p><br>
                <p>Building Footprint</p><br>
                <p>Building Height</p><br>
                <p>FAR / GFA</p><br>
				</div>
			`);
    var rh = get_nodeHTML(editor,run);

    console.log(rh);

    return run;
}

export function run_node(editor,nodes_to_eval,df_offsetX,df_offsetY){
    //boolean button, but transforms into a loading bar when clicked
    
	console.log("Run Node Created");
	let _func = {
		inputs: [],
		outputs: [],
		ev_func: "eval_Run"
	};    
	var run = editor.addNode("node", "0", "1", df_offsetX, df_offsetY, "node", _func, `
				<div>
				<div class="box">
                <div class="run">
                    <button>Run</button>
                </div>
				</div>
			`);
    var rh = get_nodeHTML(editor,run);

    console.log(rh);

    return run;
}

function bt_to_progress(){
    // should listen for progress 
}

export function location_node(editor, nodes_to_eval, df_offsetX, df_offsetY){
	console.log("Location Node Created");
	let _func = {
		inputs: [],
		outputs: [],
		c_func: "location"
	};    

    
	var loc_node = editor.addNode("node", "0", "1", df_offsetX, df_offsetY, "node", _func, `
				<div>
				<div class="title-box">Location</div>
				<div class="box">
                <input type="text" placeholder="Search.." id="sInput" >
                <div id = "locations" class="dropdown-content">
                    <a>Singapore, Changi Airport</a>
                    <a>Singapore, Paya Lebar</a>
                    <a>Singapore, Seletar</a>
                </div><br>
                </div>
				</div>
			`);

    let tnode = getLast_n_Nodes(editor,1)[0];
    let searchbar = tnode.querySelectorAll('#sInput')[0];
    ['focus','focusout'].forEach(evt => searchbar.addEventListener(evt,(e)=>{
        showList(tnode);
    }));

    ['keyup'].forEach(evt=>searchbar.addEventListener(evt,(e)=>{
        filterList(tnode);
    }));


    let a_list = tnode.querySelectorAll("#locations")[0].children;
    //console.log(a_list);
    //console.log(a_list[0].textContent);
    for(let i =0; i<a_list.length; i++){
        ['mousedown'].forEach(evt=>a_list[i].addEventListener(evt,(e)=>{
            fillSearch(a_list[i],searchbar);
        }));
    }


    return loc_node;
}

//TODO: fill value onCLick

function fillSearch(cnode, pnode){

    pnode.value = cnode.textContent || cnode.innerText;
    
}

function showList(pnode){

    let dd_list = pnode.querySelectorAll("#locations")[0];
    dd_list.classList.toggle("show");
    //TODO: dynamically add to the list of items without using html
}

function filterList(pnode){
    let dd_list = pnode.querySelectorAll("#locations")[0].children;
    let filter = pnode.querySelectorAll("#sInput")[0].value.toUpperCase();
    //console.log(filter);
    
    for (let i =0; i<dd_list.length; i++){
        let txt = dd_list[i].textContent || dd_list[i].innerText;
        if(txt.toUpperCase().indexOf(filter) > -1){
            dd_list[i].style.display="";
        }else{
            dd_list[i].style.display="none";
        }
    }
}

export function radsim_node(editor, nodes_to_eval, df_offsetX, df_offsetY){
	console.log("Radiation Analysis Node Created");
	let _func = {
		inputs: [],
		outputs: [],
		ev_func: "eval_simReport"
	};    
    let r_id = run_node(editor,nodes_to_eval, df_offsetX+100, df_offsetY+300);
    let a_id = analysis_period_node(editor,nodes_to_eval,df_offsetX-200,df_offsetY);
    let l_id = location_node(editor,nodes_to_eval,df_offsetX+100,df_offsetY-150);

	let this_id = editor.addNode("node", "5", "1", df_offsetX + 600, df_offsetY, "node", _func, `
				<div>
				<div class="title-box">Radiation Analysis</div>
				<div class="box">
				<p>Location</p><br>			
				<p>Analysis Period</p><br>
                <p>Analysis Targets</p><br>
                <p>Surrounding Context</p><br>
                <p>Run</p><br>
                </div>
				</div>
			`);

	//let r_node = Object.keys(editor.drawflow.drawflow.Home.data).slice(-3);
	editor.addConnection(l_id, this_id, 'output_1', 'input_1');
	editor.addConnection(a_id, this_id, 'output_1', 'input_2');
	editor.addConnection(r_id, this_id, 'output_1', 'input_5');
}

export function analysis_period_node(editor, nodes_to_eval, df_offsetX, df_offsetY) {

	console.log("Analysis Period Node Created");

	let _func = {
		inputs: [],
		outputs: [],
		ev_func: "eval_analysisPeriod"

	};

	let dt_1 = date_time_node(editor, nodes_to_eval, df_offsetX, df_offsetY);

	let dt_2 = date_time_node(editor, nodes_to_eval, df_offsetX, df_offsetY, -200, "2022-01-31", "17:00:00");

	var this_node = editor.addNode("node", "2", "1", df_offsetX + 300, df_offsetY, "node", _func, `
				<div>
				<div class="title-box">Analysis Period</div>
				<div class="box">
				<p>From Date-time</p>	<br>			
				<p>To Date-time</p>		<br>		</div>
				</div>
			`);

	//console.log(Object.keys(editor.drawflow.drawflow.Home).slice(-3));
	editor.addConnection(dt_1, this_node, 'output_1', 'input_1');
	editor.addConnection(dt_2, this_node, 'output_1', 'input_2');
    return this_node;
	//TODO: Make automated assignment of eventlistener generation
}

export function date_time_node(editor,nodes_to_eval, df_offsetX, df_offsetY, offset = 0, date = "2022-01-31", time = "09:00:00") {

	console.log("Date Time Node Created");
    console.log(date)
	let ddata = date_comp(date, time);
	let date_time = {
		inputs: [],
		outputs: [ddata],
		monitor: ddata.Year + '-' + ddata.Month + '-' + ddata.Day + ' ' + ddata.Hour + ':' + ddata.Minute + ":" + ddata.Seconds,
		c_func: "date_time"
	}

	//console.log(date_time);

	let dt_node = editor.addNode("node", "0", "1", df_offsetX, df_offsetY - offset, "node", date_time, `
				<div>
					
				<div class="title-box">Date & Time</div>
				<div class="box">
				<p><input type ="date" style="width:"100%" value=${date} /></p>	<br>			
				<p><input type ="time" style="width:"100%" value=${time} /></p>				</div>
				</div>
			`);

	let r_node = Object.keys(editor.drawflow.drawflow.Home.data).slice(-1);
	let curr_id = 'node-' + r_node[0];

	let d1_input = document.getElementsByTagName('nimblesim-element')[0].shadowRoot.getElementById(curr_id).children[1].children[0].children[1].children[0].children[0];

	let d2_input = document.getElementsByTagName('nimblesim-element')[0].shadowRoot.getElementById(curr_id).children[1].children[0].children[1].getElementsByTagName('input')[1];


	d1_input.addEventListener("change", (e) => { updateDataOnChange(editor, nodes_to_eval, r_node[0], [d1_input.value, d2_input.value]) });

	d2_input.addEventListener("change", (e) => { updateDataOnChange(editor, nodes_to_eval, r_node[0], [d1_input.value, d2_input.value]) });

    return dt_node;
}

export function data_monitor_node(editor, df_offsetX, df_offsetY) {
			let data = {
				inputs: [],
				outputs: [],
				monitor: '',
				ev_func: 'eval_dataMonitor'
			}


			editor.addNode("node", "1", "1", df_offsetX, df_offsetY, "node", data, `
				<div>
					
				<div class="title-box">Data Monitor</div>
				<div class="ebox"><br>
				</div>			
				</div>
			`);

		}


export function create_light_node(editor,df_offsetX,df_offsetY){
	var title = "Light";

	console.log("Create Light Node Created")
	let node_id = editor.addNode("node", "0", "1", df_offsetX, df_offsetY, "node", data = {inputs:[],outputs:[],monitor:''}, `

		  <div style="background-color:#fff">
				<div id="hide" class="node-top">&nbsp;&nbsp;<button>👁</button></div>
			<div class="title-box2">${title}</div><div class = "box">
			<select>
				<option value = "directional">Directional</option>
				<option value = "hemisphere">Hemisphere</option>
				<option value = "point">Point</option>
				<option value = "ambient">Ambient</option>
				<option value = "spot">Spotlight</option>
			</select>
			</div>
		  </div>
		`);

	let curr_id = "node-" + String(node_id);
	let hide_button = document.getElementsByTagName('nimblesim-element')[0].shadowRoot.getElementById(curr_id).children[1].children[0].children[0].children[0];
	hide_button.addEventListener("click", hideModel)
	hide_button.model_name = 'test';

		}
export function updateDataOnChange(editor, nodelist, node_id, u_data, c_func){//editor,elem,node_id,u_data){
			
	if(editor.getNodeFromId(node_id).data.hasOwnProperty('c_func')){

				console.log("Calculating parameter for Node "+String(node_id));
				switch(editor.getNodeFromId(node_id).data.c_func){

					case 'date_time':
						
						console.log("Updating Date Time Node")
						let ddata = date_comp(u_data[0],u_data[1])
						let seconds;
						//Something is making seconds disappear here KIV
						if(ddata.Seconds==''){
							ddata.Seconds = seconds;
						}
						else{
							seconds = ddata.Seconds;
						};
						let date_time={
							inputs: [],
							outputs: [ddata],
							monitor: ddata.Year + '-' + ddata.Month + '-' + ddata.Day + ' ' + ddata.Hour + ':'+ddata.Minute+":"+ddata.Seconds,
							c_func: "date_time"	
						}
						
						editor.updateNodeDataFromId(node_id,date_time);
						//console.log(editor.getNodeFromId(node_id));
						eval_nodes(editor,nodelist);
						break;

                    case 'location':
                    //TODO: add for data monitor

					default:
						break;
				}
		}
}


////////////////////////////////////////////
// 
// Node Evaluation Functions
// 
////////////////////////////////////////////
// 
//To create list of nodes to evaluate,  everytime a node is create that has inputs, add it to the list.
// Everytime it is deleted, remove the node that has the corresponding node id
// 
// 

export function eval_nodes(editor,nodelist) {
	// Input should be a list of nodes which require input
	// and those that 
	// Loop through the list and evaluate each definition based on their associated evaluation function

	for (let i = 0; i < nodelist.length; i++) {
		//console.log(i)
		let curr_node = editor.getNodeFromId(nodelist[i]);
		//console.log(curr_node);
		// Need another check to see if all inputs are defined, 
		// But also need to check if the input is the correct type
		// For now, just use the unsafe method and just check the length
        
		if (curr_node.data.inputs.length != Object.keys(curr_node.inputs).length) {
            continue; //Goes to next i if the length is wrong, otherwise, evaluate if the node data contains an ev_func attribute
        }
			//console.log(curr_node);
			
        if (curr_node.data.hasOwnProperty('ev_func')) {
            console.log("Evaluating function of Node " + String(nodelist[i]))

            // Check through nodelist and evaluate every function that have their input requirements met
            // TODO: Change color of node if if it doesn't have all inputs or there is some error
            
            let inputlist = get_inputData(editor, curr_node);

            switch (curr_node.data.ev_func) {

                /// Analysis Period Function
                case 'eval_analysisPeriod':
                    console.log("Evaluating analysis period")
                    // Need to read updated outputs and rebuild
                    // TODO: Move this entire function into eval_analysisPeriod

                    curr_node.data.inputs[0] = inputlist[0];
                    curr_node.data.inputs[1] = inputlist[1];
                    curr_node.data.outputs[0] = eval_analysisPeriod(inputlist[0], inputlist[1]);
                    editor.updateNodeDataFromId(nodelist[i], curr_node.data);
                break;

                /// Data Monitor Function
                case 'eval_dataMonitor':
                    console.log("Evaluating Data Monitor");
                    eval_dataMonitor(editor,curr_node,inputlist);
                    
                break;

                default:
                
                break;
            }
		}
	}
}


function eval_dataMonitor(editor, curr_node, inputlist){

	let nodeHTML = get_nodeHTML(editor, curr_node.id);
	let contentbox = nodeHTML.children[1].children[0].children[1];
	nodeHTML.children[1].children[0].children[1].innerHTML = '';
	var table = document.createElement('table');
	contentbox.appendChild(table);
	//console.log(inputlist.length);
	for(let i =0; i< inputlist.length; i++){

		let dnode;
		if(inputlist[i]==null){
			dnode = document.createTextNode("null");
		}else{

			dnode = document.createTextNode(String(inputlist[i].monitor))
		}
		var tr = document.createElement('tr');
		table.appendChild(tr);
		var td = document.createElement('td');
		tr.appendChild(td);
		td.appendChild(dnode);

	}

	//contentbox.appendChild(dnode);
}

function eval_analysisPeriod(fromDate, toDate) {
	try {
		var an_period = {
			fromDay: fromDate.Day,
			fromMonth: fromDate.Month,
			fromHour: fromDate.Hour,
			toDay: toDate.Day,
			toMonth: toDate.Month,
			toHour: toDate.Hour,
			monitor: fromDate.Day + "-" + fromDate.Month + " " + fromDate.Hour + "H " + "to " + toDate.Day + "-" + toDate.Month + " " + toDate.Hour + "H"
		};

		return an_period;

	} catch (err) {
		console.log(err);
	}


}

/////////////////////////////////////////////////////////
// 
// Utility Functions 
//
/////////////////////////////////////////////////////////

function get_nodeHTML(editor, node_id){
	
	let curr_id = "node-" + String(node_id);
	let curr_node_html = document.getElementsByTagName('nimblesim-element')[0].shadowRoot?.getElementById(curr_id);//.children[1].innerHTML;
	return curr_node_html;
}

function get_inputData(editor, curr_node){
	let inputlist = [];
	console.log("Input Length")
	//console.log(Object.keys(curr_node.inputs).length);
	//console.log(curr_node);
	for (let i = 0; i < Object.keys(curr_node.inputs).length; i++) {
		//for(let n = 0; n < Object.keys(curr_node.inputs.))
		for (let n = 0; n < Object.values(curr_node.inputs)[i].connections.length; n++) { 
			let input_node = editor.getNodeFromId(Object.values(curr_node.inputs)[i].connections[n].node);
			try{
                inputlist.push(input_node.data.outputs[0]);
            }catch(err){
                print(err)
            }
		}
	}

	return inputlist;
}
export function date_comp(date, time) {
	//TODO: Add security check for whether input strings are in correct format
    date = String(date);
	let Year = date.slice(0, 4);
	let	Month= date.slice(5, 7);
	let	Day=  date.slice(8, 10);
	let	Hour=  time.slice(0, 2);
	let	Minute=  time.slice(3, 5);
	let	Seconds=  time.slice(6, 8);

	var comp = {
		Year: Year,
		Month: Month,
		Day: Day,
		Hour: Hour,
		Minute: Minute,
		Seconds: Seconds,
		monitor: Year+"-"+Month+"-"+Day+" "+Hour+":"+Minute+":"+Seconds
	}

	return comp;
}

function hideModel(e) {
	//console.log(e.currentTarget);
	let model_name = e.currentTarget.model_name;
	let the_model = scene.getObjectByName(model_name);
	the_model.visible = !the_model.visible;
	//console.log(v_toggle);
	if (v_toggle == true) {
		vis_toggle(false, e.currentTarget);
		v_toggle = false;
	}
	else {
		vis_toggle(true, e.currentTarget);
		v_toggle = true;
	}

}

function getLast_n_Nodes(editor,n){
    let nodelist = [];
	let r_node = Object.keys(editor.drawflow.drawflow.Home.data).slice(0-n);
    for(let i =0; i<r_node.length; i++){
        nodelist.push(get_nodeHTML(editor,r_node[i]));
    }
    return nodelist;
}
