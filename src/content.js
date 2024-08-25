
// If the available slot is in the NG_PREFIX range, it won't notify
// [[<range1_begin>, <range1_end>], [<range2_begin>, <range2_end>], ...]
const NG_PREFIX = [
    ['2024-06-01', '2024-07-25'],
    ['2024-07-27', '2024-11-30'],
];

// Go back to schedule ui landing page after this period to refresh session
// (it needs to be refreshed within 30 minutes, otherwise it requires login again)
const LOGIN_REFRESH_SEC = 25;

const AVAILABILITY_CHECK_INTERVAL_SEC = 7;
const MOVE_TO_LOCATION_PAGE_DELAY_SEC = 5;
const REASON_TO_RESCHEDULE = "Personal matters";

const INTERVIEW_LOCATION_NAME = "Blain";
const INTERVIEW_LOCATION_ID = "US70";


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function notify() {
    const audio = new Audio(chrome.runtime.getURL('notify.mp3'));
    audio.play();
}

function verifyButtonCaption(button, caption) {
    const trimmed = button.textContent.trim();
    const result = trimmed === caption;
    if (!result) {
        console.log('caption did not match: "' + trimmed + '" / "' + caption + '"');
    } else {
        return true;
    }
}

async function clickButton(name, selectors, buttonCaption) {
    const btn = document.querySelector(selectors);
    if (btn && (buttonCaption === undefined || verifyButtonCaption(btn, buttonCaption))) {
        btn.click();
        console.log('Clicked ' + name + ' button');
        return true;
    } else {
        console.log(name + ' button not found');
        return false;
    }
}

async function cancelSchedule() {
    await clickButton('Cancel', '#cancel');
    await delay(1000);
    await clickButton('Confirm', '#confirmBtn');
}

function findButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
        if (button.textContent.trim() === text) {
            return button;
        }
    }
    return null;
}

async function goToScheduler() {
    if (!await clickButton('Reschedule', 'div.dashboard-card > div.bottom > div.row > div > button', 'Reschedule Interview')) {
        await clickButton('Schedule', 'div.dashboard-card > div.middle > button', 'Schedule Interview');
    }
}

function isOK(timestamp) {
    const date = timestamp.substring(0, 10);
    for (const prefix of NG_PREFIX) {
        if (prefix.length === 1) {
            if (date === prefix[0]) {
                return false;
            }
        } else {
            if (prefix[0] <= date && date <= prefix[1]) {
                return false;
            }
        }
    }
    return true;
}

const monthMap = {
    "January": 0,
    "February": 1,
    "March": 2,
    "April": 3,
    "May": 4,
    "June": 5,
    "July": 6,
    "August": 7,
    "September": 8,
    "October": 9,
    "November": 10,
    "December": 11
};

async function getAvailableDate() {
    const date = document.querySelector(`#popover${INTERVIEW_LOCATION_ID} div.nextAppointment span.date`);
    if (date) {
        const arr = date.textContent.trim().split(/,? /);
        const isoDate = new Date(parseInt(arr[2]), parseInt(monthMap[arr[0]]), parseInt(arr[1])).toISOString();
        return isoDate.substring(0, 10);
    } else {
        return undefined;
    }
}

async function checkAvailability() {
    await clickButton('Close Popover', `#popover${INTERVIEW_LOCATION_ID}BtnClosePopover`);
    if (await clickButton(INTERVIEW_LOCATION_NAME, `#centerDetails${INTERVIEW_LOCATION_ID}`)) {
        for (let i = 0; i < 5; i++) {
            await delay(1000);
            const available = await getAvailableDate();
            if (available && isOK(available) &&
                await clickButton('Choose Location', `#popover${INTERVIEW_LOCATION_ID} #btnChooseLocation`)) {
                console.log("clear timeout: " + cancelTimeoutId);
                clearTimeout(cancelTimeoutId);
                clearInterval(checkAvailabilityIntervalId);
                clearInterval(countDownIntervalId);
                notify();
                return;
            }
        }
    }
}

async function fillReason(text, intervalId) {
    const reason = document.querySelector("textarea#reason");
    if (reason) {
        reason.value = text;
        reason.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Filled reason: " + text);
        clearInterval(intervalId);
        return true;
    } else {
        return false;
    }
}

let statusTimeoutId;
function showStatusMessage(message) {
    let statusDiv = document.getElementById('status-message');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'status-message';
        statusDiv.style.position = 'fixed';
        statusDiv.style.bottom = '10px';
        statusDiv.style.right = '10px';
        statusDiv.style.padding = '10px';
        statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statusDiv.style.color = 'white';
        statusDiv.style.borderRadius = '5px';
        statusDiv.onclick = () => {
            stopAll();
            console.log("stopped all timers");
        }
        document.body.appendChild(statusDiv);
    }
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';

    if (statusTimeoutId) {
        clearTimeout(statusTimeoutId);
    }
    statusTimeoutId = setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

let cancelTimeoutId;
let checkAvailabilityIntervalId;
let countDownIntervalId;
let goToSchedulerIntervalId;

function stopAll() {
    clearTimeout(cancelTimeoutId);
    clearInterval(checkAvailabilityIntervalId);
    clearInterval(countDownIntervalId);
    clearInterval(goToSchedulerIntervalId);
}

if (window.location.pathname === "/schedulerui/schedule-interview/location") {
    let seconds = LOGIN_REFRESH_SEC * 60;
    const timeout = seconds * 1000;
    console.log("schedulerui");
    cancelTimeoutId = setTimeout(cancelSchedule, timeout);
    setTimeout(checkAvailability, 1000); // first check
    checkAvailabilityIntervalId = setInterval(checkAvailability, AVAILABILITY_CHECK_INTERVAL_SEC * 1000);
    countDownIntervalId = setInterval(() => {
        seconds -= 1;
        showStatusMessage("remaining: " + seconds);
    },  1000);
    const fillReasonId = setInterval(() => {
        fillReason(REASON_TO_RESCHEDULE, fillReasonId);
    }, 500);
} else if (window.location.pathname === "/scheduler") {
    console.log("dashboard");
    let seconds = MOVE_TO_LOCATION_PAGE_DELAY_SEC;
    const timeout = seconds * 1000;
    goToSchedulerIntervalId = setInterval(goToScheduler, timeout);
    countDownIntervalId = setInterval(() => {
        seconds -= 1;
        showStatusMessage("remaining: " + seconds);
    },  1000);
}
