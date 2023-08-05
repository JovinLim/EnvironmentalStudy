/*
Date Slider

CREATED BY JOVIN

Functions relating to changes in days and months (dates)
*/

import { Component, createSignal } from 'solid-js';
import Playground from '../../utils/playground';

const [month, setMonth] = createSignal<String>("July")
const [date, setDate] = createSignal<number>(1)
const [doy, setDOY] = createSignal<number>(181)

export function convertToMonthAndDay(number : number) : number[] {
  if (number < 0 || number > 365) {
    throw new Error("Number must be an integer between 0 and 365.");
  }

  const months = [
    [1, 31],
    [2, 28],
    [3, 31],
    [4, 30],
    [5, 31],
    [6, 30],
    [7, 31],
    [8, 31],
    [9, 30],
    [10, 31],
    [11, 30],
    [12, 31],
  ];

  try {
    for (let i = 0; i < months.length; i++){
      var days = months[i][1] as number
      var month = months[i][0] as number
      if (number < days) {
        return [month, number + 1];
      }
      number -= days;
    }
  }

  catch {
    return [0]
  }
}

export function updateDate(playground_ : Playground) {
  /*
    Update inner HTML for date display
    
    Arguments:
      - playground_ : Target Playground object

    Returns:
      -

    Notes:
      - 
  */

    var output = document.querySelector('#dateShow') as HTMLInputElement
    output.innerHTML = `${playground_.Details.monthDay} ${playground_.Details.month}`
    const slider = document.querySelector('#dateRange') as HTMLInputElement
    slider.value = `${playground_.Details.doy}`
}

export function getDate(playground_ : Playground) {
  /*
    Get day and month from a day of year (doy) which is extracted from the dateRange input Element
    
    Arguments:
      - playground_ : Target Playground object

    Returns:
      -

    Notes:
      - 
  */

    const slider = document.querySelector('#dateRange') as HTMLInputElement

    // var playground_ = playground() as Playground
    slider.oninput = function() {
        var doy = slider.valueAsNumber
        playground_.Details.doy = doy as number
        // setDOY(doy)

        if (playground_.Details.doy >= 0 && playground_.Details.doy <= 30) {
            playground_.Details.month = "January"
            playground_.Details.monthDay = doy
            playground_.Details.monthNum = 1
            setMonth("January")
            setDate(doy)
        }

        else if (playground_.Details.doy >= 31 && playground_.Details.doy <= 58){
            playground_.Details.month = "February"
            playground_.Details.monthDay = doy - 30
            playground_.Details.monthNum = 2
            setMonth("February")
            setDate(doy - 30)
        }

        else if (playground_.Details.doy >= 59 && playground_.Details.doy <= 89){
            playground_.Details.month = "March"
            playground_.Details.monthDay = doy - 58
            playground_.Details.monthNum = 3
            setMonth("March")
            setDate(doy - 58)
        }

        else if (playground_.Details.doy >= 90 && playground_.Details.doy <= 119){
            playground_.Details.month = "April"
            playground_.Details.monthDay = doy - 89
            playground_.Details.monthNum = 4
            setMonth("April")
            setDate(doy - 89)
        }

        else if (playground_.Details.doy >= 120 && playground_.Details.doy <= 150){
            playground_.Details.month = "May"
            playground_.Details.monthDay = doy - 119
            playground_.Details.monthNum = 5
            setMonth("May")
            setDate(doy - 119)
        }

        else if (playground_.Details.doy >= 151 && playground_.Details.doy <= 180){
            playground_.Details.month = "June"
            playground_.Details.monthDay = doy - 150
            playground_.Details.monthNum = 6
            setMonth("June")
            setDate(doy - 150)
        }

        else if (playground_.Details.doy >= 181 && playground_.Details.doy <= 211){
            playground_.Details.month = "July"
            playground_.Details.monthDay = doy - 180
            playground_.Details.monthNum = 7
            setMonth("July")
            setDate(doy - 180)
        }

        else if (playground_.Details.doy >= 212 && playground_.Details.doy <= 242){
            playground_.Details.month = "August"
            playground_.Details.monthDay = doy - 211
            playground_.Details.monthNum = 8
            setMonth("August")
            setDate(doy - 211)
        }

        else if (playground_.Details.doy >= 243 && playground_.Details.doy <= 272){
            playground_.Details.month = "September"
            playground_.Details.monthDay = doy - 242
            playground_.Details.monthNum = 9
            setMonth("September")
            setDate(doy - 242)
        }

        else if (playground_.Details.doy >= 273 && playground_.Details.doy <= 303){
            playground_.Details.month = "October"
            playground_.Details.monthDay = doy - 272
            playground_.Details.monthNum = 10
            setMonth("October")
            setDate(doy - 272)
        }

        else if (playground_.Details.doy >= 304 && playground_.Details.doy <= 333){
            playground_.Details.month = "November"
            playground_.Details.monthDay = doy - 303
            playground_.Details.monthNum = 11
            setMonth("November")
            setDate(doy - 303)
        }

        else if (playground_.Details.doy >= 334 && playground_.Details.doy <= 364){
            playground_.Details.month = "December"
            playground_.Details.monthDay = doy - 333
            playground_.Details.monthNum = 12
            setMonth("December")
            setDate(doy - 333)
        }
    }

    updateDate(playground_)
    playground_.redrawSun()
    // setDBStorage('App')
}

const DateSlider: Component = () => {
    return (
        <div>
        </div>
    )
}

export default DateSlider;

export {doy}
