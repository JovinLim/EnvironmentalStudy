import { degToRad } from "three/src/math/MathUtils"

// Calculate altitude and azimuth; https://www.e-education.psu.edu/eme812/node/583
export const Altitude = (latitude : number, hrAngle : number, declination: number) => {
    return (Math.asin((Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination))) + (Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hrAngle)))))
}

export const Azimuth = (latitude: number, hrAngle : number, declination: number, altitude:number) => {

    return hrAngle < 0 ? -(Math.acos( ((Math.sin(degToRad(declination)) * Math.cos(degToRad(latitude))) - ( Math.cos(degToRad(declination)) * Math.sin(degToRad(latitude)) * Math.cos(degToRad(hrAngle)))) / Math.cos(altitude) )) :
    -((2*Math.PI) - Math.acos( ((Math.sin(degToRad(declination)) * Math.cos(degToRad(latitude))) - ( Math.cos(degToRad(declination)) * Math.sin(degToRad(latitude)) * Math.cos(degToRad(hrAngle)))) / Math.cos(altitude) ))

}

// Calculate hour angle; https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
export const calculateHourAngle = (UTC : number, day : number, longitude : number, time : number) => {
    const LSTM = calculateLSTM(UTC)
    const EoT = EquationOfTime(day)
    const TC = calculateTimeCorrection(LSTM, EoT, longitude)
    const LST = (time + (TC / 60)) % 24
    return ((LST-12) * 15)
}

export const calculateDeclination=(N : number) => {
    
    return (23.45 * (Math.sin(degToRad((360/365)*(284 + N)))))
}

export const calculateLSTM=(UTC : number)=> {
    return (15 * UTC)
}

export const EquationOfTime=(day : number)=> {
    const B = degToRad((360/365) * (day - 81 + 1))
    return ( 229.2 * (0.000075 + (0.001868 * Math.cos(B)) - (0.032077 * Math.sin(B)) - (0.014615 * Math.cos(2*B)) - (0.04089 * Math.sin(2*B))) )
}

export const calculateTimeCorrection = (LSTM : number, EoT : number, longitude : number) => {
    return ( (4 * (LSTM - longitude)) + EoT) 
}

export const calculateSolarTime = (UTC : number, day : number, longitude : number, time : number) => {
    const LSTM = calculateLSTM(UTC)
    const EoT = EquationOfTime(day)
    const TC = calculateTimeCorrection(LSTM, EoT, longitude)
    const solarTime = (time + TC) / 60
    return solarTime
}