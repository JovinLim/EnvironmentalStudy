/*
Loading handlers

CREATED BY JOVIN/BOB

Contains functions relating to alerts

  - displayLoading
  - hideLoading
*/

export function displayLoading() {

    const loader = document.querySelector('#loading') as HTMLDivElement
    loader.classList.add("display")
    // setTimeout(() => {
    //     loader.classList.remove("display")
    // }, 5000)
}

export function hideLoading(){
    const loader = document.querySelector('#loading') as HTMLDivElement
    loader.classList.remove("display")
}