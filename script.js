/* =========================================
   CALCULATOR STATE
========================================= */
// Add time to calculation history
let currentValue = "0";
let previousValue = "";
let operator = null;
let waitingForNewValue = false;

let history = JSON.parse(
    localStorage.getItem("calculatorHistory")
) || [];


/* =========================================
   DOM ELEMENTS
========================================= */

const currentDisplay =
    document.getElementById("currentValue");

const previousDisplay =
    document.getElementById("previousValue");

const keypad =
    document.querySelector(".keypad");

const historyPanel =
    document.getElementById("historyPanel");

const historyList =
    document.getElementById("historyList");

const historyToggle =
    document.getElementById("historyToggle");

const closeHistory =
    document.getElementById("closeHistory");

const clearHistoryButton =
    document.getElementById("clearHistory");

const copyButton =
    document.getElementById("copyButton");

const toast =
    document.getElementById("toast");


/* =========================================
   UPDATE DISPLAY
========================================= */

function updateDisplay() {

    currentDisplay.textContent =
        formatNumber(currentValue);

    previousDisplay.textContent =
        previousValue;
}


/* =========================================
   FORMAT NUMBER
========================================= */

function formatNumber(value) {

    if (value === "Error") {
        return value;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "Error";
    }

    if (
        Math.abs(number) >= 1e12 ||
        (
            Math.abs(number) > 0 &&
            Math.abs(number) < 1e-9
        )
    ) {
        return number.toExponential(6);
    }

    return value;
}


/* =========================================
   INPUT NUMBER
========================================= */

function inputNumber(number) {

    if (currentValue === "Error") {
        clearCalculator();
    }

    if (waitingForNewValue) {

        currentValue = number;

        waitingForNewValue = false;

    } else {

        if (number === "." &&
            currentValue.includes(".")) {
            return;
        }

        if (
            currentValue === "0" &&
            number !== "."
        ) {
            currentValue = number;
        } else {
            currentValue += number;
        }
    }

    updateDisplay();
}


/* =========================================
   CHOOSE OPERATOR
========================================= */

function chooseOperator(nextOperator) {

    if (currentValue === "Error") {
        return;
    }

    if (operator !== null &&
        !waitingForNewValue) {

        calculate(false);
    }

    previousValue =
        `${formatNumber(currentValue)} ${getOperatorSymbol(nextOperator)}`;

    operator = nextOperator;

    waitingForNewValue = true;

    updateDisplay();
}


/* =========================================
   CALCULATE
========================================= */

function calculate(addToHistory = true) {

    if (
        operator === null ||
        previousValue === ""
    ) {
        return;
    }

    const firstNumber =
        Number(
            previousValue
                .split(" ")[0]
                .replace(/,/g, "")
        );

    const secondNumber =
        Number(currentValue);

    let result;

    switch (operator) {

        case "+":
            result = firstNumber + secondNumber;
            break;

        case "-":
            result = firstNumber - secondNumber;
            break;

        case "*":
            result = firstNumber * secondNumber;
            break;

        case "/":

            if (secondNumber === 0) {

                showError(
                    "Cannot divide by zero"
                );

                return;
            }

            result =
                firstNumber / secondNumber;

            break;

        default:
            return;
    }


    if (!Number.isFinite(result)) {

        showError(
            "Invalid calculation"
        );

        return;
    }


    result =
        Number(
            result.toPrecision(12)
        );


    const expression =
        `${formatNumber(firstNumber)} ` +
        `${getOperatorSymbol(operator)} ` +
        `${formatNumber(secondNumber)}`;


    currentValue =
        String(result);


    if (addToHistory) {

        addToHistoryList(
            expression,
            formatNumber(currentValue)
        );
    }


    previousValue =
        `${expression} =`;

    operator = null;

    waitingForNewValue = true;

    updateDisplay();
}


/* =========================================
   GET OPERATOR SYMBOL
========================================= */

function getOperatorSymbol(operator) {

    const symbols = {

        "+": "+",

        "-": "−",

        "*": "×",

        "/": "÷"
    };

    return symbols[operator] || operator;
}


/* =========================================
   CLEAR CALCULATOR
========================================= */

function clearCalculator() {

    currentValue = "0";

    previousValue = "";

    operator = null;

    waitingForNewValue = false;

    updateDisplay();
}


/* =========================================
   DELETE LAST CHARACTER
========================================= */

function deleteLast() {

    if (waitingForNewValue ||
        currentValue === "Error") {
        return;
    }

    if (currentValue.length <= 1) {

        currentValue = "0";

    } else {

        currentValue =
            currentValue.slice(0, -1);
    }

    updateDisplay();
}


/* =========================================
   PERCENTAGE
========================================= */

function percentage() {

    if (currentValue === "Error") {
        return;
    }

    const number =
        Number(currentValue);

    if (!Number.isFinite(number)) {
        return;
    }

    currentValue =
        String(number / 100);

    updateDisplay();
}


/* =========================================
   TOGGLE POSITIVE / NEGATIVE
========================================= */

function toggleSign() {

    if (
        currentValue === "0" ||
        currentValue === "Error"
    ) {
        return;
    }

    currentValue =
        currentValue.startsWith("-")
            ? currentValue.slice(1)
            : "-" + currentValue;

    updateDisplay();
}


/* =========================================
   ERROR HANDLING
========================================= */

function showError(message) {

    currentValue = "Error";

    previousValue = message;

    operator = null;

    waitingForNewValue = true;

    updateDisplay();
}


/* =========================================
   HISTORY
========================================= */

function addToHistoryList(
    expression,
    result
) {

    history.unshift({
        expression: expression,
        result: result,
        time: Date.now()
    });


    /*
       Keep only the latest
       20 calculations.
    */

    history =
        history.slice(0, 20);


    saveHistory();

    renderHistory();
}


/* =========================================
   SAVE HISTORY
========================================= */

function saveHistory() {

    localStorage.setItem(
        "calculatorHistory",
        JSON.stringify(history)
    );
}


/* =========================================
   RENDER HISTORY
========================================= */

function renderHistory() {

    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                <span>⌁</span>
                <p>No calculations yet</p>
            </div>
        `;

        return;
    }


    historyList.innerHTML =
        history.map((item, index) => {

            return `
                <div
                    class="history-item"
                    data-index="${index}">

                    <div class="history-expression">
                        ${escapeHTML(item.expression)}
                    </div>

                    <div class="history-result">
    = ${escapeHTML(item.result)}
</div>

<div class="history-time">
    ${formatHistoryTime(item.time)}
</div>

                </div>
            `;

        }).join("");


    document
        .querySelectorAll(".history-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            item.dataset.index
                        );

                    useHistoryResult(index);
                }
            );
        });
}
function formatHistoryTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =========================================
   USE HISTORY RESULT
========================================= */

function useHistoryResult(index) {

    const item = history[index];

    if (!item) {
        return;
    }

    currentValue = item.result;

    previousValue = item.expression;

    operator = null;

    waitingForNewValue = true;

    updateDisplay();

    closeHistoryPanel();
}


/* =========================================
   CLEAR HISTORY
========================================= */

function clearHistory() {

    history = [];

    saveHistory();

    renderHistory();

    showToast("History cleared");
}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   HISTORY PANEL
========================================= */

function openHistoryPanel() {

    historyPanel.classList.add("active");
}


function closeHistoryPanel() {

    historyPanel.classList.remove("active");
}


/* =========================================
   COPY RESULT
========================================= */

async function copyResult() {

    if (
        currentValue === "Error" ||
        currentValue === ""
    ) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            currentValue
        );

        showToast("Result copied!");

    } catch (error) {

        showToast(
            "Unable to copy result"
        );
    }
}


/* =========================================
   TOAST
========================================= */

let toastTimer;

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 1800);
}


/* =========================================
   BUTTON CLICK HANDLING
========================================= */

keypad.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(".key");

        if (!button) {
            return;
        }


        const number =
            button.dataset.number;

        const selectedOperator =
            button.dataset.operator;

        const action =
            button.dataset.action;


        /* Number */

        if (number !== undefined) {

            inputNumber(number);

            return;
        }


        /* Operator */

        if (
            selectedOperator !== undefined
        ) {

            chooseOperator(
                selectedOperator
            );

            return;
        }


        /* Actions */

        switch (action) {

            case "clear":

                clearCalculator();

                break;


            case "delete":

                deleteLast();

                break;


            case "percentage":

                percentage();

                break;


            case "toggle-sign":

                toggleSign();

                break;


            case "calculate":

                calculate(true);

                break;
        }
    }
);


/* =========================================
   KEYBOARD SUPPORT
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        const key = event.key;


        /* Numbers */

        if (
            /^[0-9]$/.test(key) ||
            key === "."
        ) {

            inputNumber(key);

            return;
        }


        /* Operators */

        if (
            key === "+" ||
            key === "-" ||
            key === "*" ||
            key === "/"
        ) {

            chooseOperator(key);

            return;
        }


        /* Enter */

        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate(true);

            return;
        }


        /* Backspace */

        if (key === "Backspace") {

            deleteLast();

            return;
        }


        /* Escape */

        if (key === "Escape") {

            clearCalculator();

            closeHistoryPanel();

            return;
        }


        /* Percentage */

        if (key === "%") {

            percentage();

            return;
        }
    }
);


/* =========================================
   HISTORY EVENTS
========================================= */

historyToggle.addEventListener(
    "click",
    openHistoryPanel
);


closeHistory.addEventListener(
    "click",
    closeHistoryPanel
);


clearHistoryButton.addEventListener(
    "click",
    clearHistory
);


/* =========================================
   COPY EVENT
========================================= */

copyButton.addEventListener(
    "click",
    copyResult
);


/* =========================================
   INITIALIZE
========================================= */

renderHistory();

updateDisplay();