// import { setDBStorage } from '../../utils/Storage/IndexedDBFunctions';
import Playground from "../../utils/playground"

function timeToDecimal(hours: number, minutes: number): any {
  let minuteDecimal = minutes/60
  return (hours + minuteDecimal)

}

export function updateTime(playground_ : Playground){
  const slider = document.querySelector('#timeRange') as HTMLInputElement
  var output = document.querySelector('#timeDisplay') as HTMLInputElement
  output.innerHTML = playground_.Details.timeSimple.minutes > 0 ? `${playground_.Details.timeSimple.hours}:${playground_.Details.timeSimple.minutes}` : `${playground_.Details.timeSimple.hours}:00`
  slider.value = `${playground_.Details.timeSliderVal}`
}

export function changeTime(playground_ : Playground) {

    const slider = document.querySelector('#timeRange') as HTMLInputElement

    if (slider != null)
    {
      var output = document.querySelector('#timeDisplay') as HTMLInputElement
      var totalMinutes = slider.valueAsNumber
      var hours = Math.floor(totalMinutes / 60)
      var minutes = totalMinutes%60
      playground_.Details.time = timeToDecimal(hours,minutes)
      playground_.Details.timeSimple = {hours, minutes}
      playground_.Details.timeSliderVal = totalMinutes
      // output.innerHTML = minutes > 0 ? `${playground_.timeSimple.hours}:${playground_.timeSimple.minutes}` : `${playground_.timeSimple.hours}:00`
      updateTime(playground_)
      playground_.redrawSun()
      // setDBStorage('App')
    }

    else {
      console.log('activatetd')
    }


  }