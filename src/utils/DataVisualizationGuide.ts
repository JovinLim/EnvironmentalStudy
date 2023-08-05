// Add any data visualization standardisation here.
// Created by Jovinegar

import * as d3 from 'd3';

export module VisGuide {
    export const Directions = {
        East : {
            dirNum : 0,
            color : d3.schemeSet2[0],
        },
        NorthEast : {
            dirNum : 1,
            color : d3.schemeSet2[1],
        },
        North : {
            dirNum : 2,
            color : d3.schemeSet2[2],
        },
        NorthWest : {
            dirNum : 3,
            color : d3.schemeSet2[3],
        },
        West : {
            dirNum : 4,
            color : d3.schemeSet2[4],
        },
        SouthWest : {
            dirNum : 5,
            color : d3.schemeSet2[5],
        },
        South : {
            dirNum : 6,
            color : d3.schemeSet2[6],
        },
        SouthEast : {
            dirNum : 7,
            color : d3.schemeSet2[7],
        }
    }
}