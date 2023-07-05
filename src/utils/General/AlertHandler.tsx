
export async function ShowErrorAlert(e : string) {
    var alert = document.getElementById('ErrorAlert') as HTMLDivElement
    var alertMsg = document.getElementById('ErrorAlertMessage') as HTMLDivElement
    alert.className = 'flex p-4 mb-4 text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400'
    alertMsg.innerHTML = e
}

export async function ShowDoneAlert(e : string) {
    var alert = document.getElementById('DoneAlert') as HTMLDivElement
    var alertMsg = document.getElementById('DoneAlertMessage') as HTMLDivElement
    alert.className = 'flex p-4 mb-4 text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400'
    alertMsg.innerHTML = e
}

export async function ShowWarningAlert(e : string) {
    var alert = document.getElementById('WarningAlert') as HTMLDivElement
    var alertMsg = document.getElementById('WarningAlertMessage') as HTMLDivElement
    alert.className = "p-4 mb-4 text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800"
    alertMsg.innerHTML = e
}

export async function HideWarningAlert() {
    var alert = document.getElementById('WarningAlert') as HTMLDivElement
    var alertMsg = document.getElementById('WarningAlertMessage') as HTMLDivElement
    alert.className = "p-4 mb-4 text-yellow-800 border border-yellow-300 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 dark:border-yellow-800 hidden"
}