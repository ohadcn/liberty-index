// ==UserScript==
// @name           Knesset Agendas Editor Addon
// @name:he        עורכי מדד החירות
// @description    Help Knesset Agendas Editors And Reviewers
// @description:he סקריפט עזר למדרגי חוקים עבור מדד החרות.
// @version        1.4.5
// @namespace      ohadcn-kneset-agendas
// @author         Ohad Cohen
// @include          https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawBill.aspx*
// @grant          GM_xmlhttpRequest
// @updateURL      https://raw.githubusercontent.com/ohadcn/userscripts/master/KnessetAgendasEditor.meta.js
// @downloadURL    https://raw.githubusercontent.com/ohadcn/userscripts/master/KnessetAgendasEditor.user.js
// @run-at         document-end
// ==/UserScript==

if ('undefined' == typeof __PAGE_SCOPE_RUN__) {
    (function page_scope_runner() {
        var my_src = "(" + page_scope_runner.caller.toString() + ")();";
        var gapiScript = document.createElement('script');
        gapiScript.src = "https://apis.google.com/js/api.js";
        document.head.appendChild(gapiScript);
        var script = document.createElement('script');
        script.setAttribute("type", "text/javascript");
        script.textContent = "var __PAGE_SCOPE_RUN__ = true;\n" + my_src;
        setTimeout(function () {
            document.head.appendChild(script);
            //document.head.removeChild(script);
        }, 3000);
    })();
    return;
}


var spreadsheetId = '1z6tKCMB6ca-2Jd7ICRvfJ9Ocgy_PLRJxA8cp66eLrmo';

function valElement(value, content) {
    var ret = document.createElement("option");
    ret.innerText = content;
    ret.value = value;
    return ret;
}

function elementWithStyle(name, style) {
    var ret = document.createElement(name)
    ret.style = style;
    return ret;
}

const showBtn = "padding-right: 10px;"
const hideBtn = "display: none;";

var choose;
var sendBtn;
var userMail = "anonymous";

function btn(text, style) {
    var ret = document.createElement("button")
    ret.innerText = text;
    ret.style = showBtn;
    ret.classList.add("btn");
    return ret;
}

function sendData(ev) {
    ev.preventDefault();
    //https://docs.google.com/spreadsheets/d/1c4PDTmDIn2M2tsSjK9LbrtXlhbHhRowdAMJk9aAHID8/edit#gid=0
    var lawName = $(".LawDarkBrownTitleH2").text();
    var billNum = $("strong:contains(מספר הצ\"ח)").parent().next().text().trim();
    var derug = $("#derug").val();
    var initiators = $("strong:contains(חברי הכנסת היוזמים)").parent().parent().next().text().trim().split(", ")
        .concat($("strong:contains(חברי הכנסת המצטרפים)").parent().parent().next().text().trim().split(", "));
    if (derug < -50) {
        alert("בחר דירוג מספרי!");
        return;
    }
    if (!billNum) {
        billNum = $(".LawSecondaryDetailsTd:contains(פרסום ברשומות)").next().text().trim().match(/הצ"ח הממשלה .{10,20} - (\d+)/)[1];
        if (!billNum) return alert("failed");
        billNum = "מ/" + billNum + "/34";
        initiators = ["ממשלתית"];
    }
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'laws' + (Number(billNum.split("/")[2])) + '!A' + (Number(billNum.split("/")[1]) + 1),
        resource: {
            values: [
                [lawName, userMail, billNum, derug,
                    location.href, description.value,
                    /* comment */
                    , /* is voted? */, /* is passed? */,
                ].
                    concat(initiators)
            ]
        },
        valueInputOption: "USER_ENTERED"
    })
        .then(function (res) {
            var text = "נשלח";
            if (res.error)
                text = res.error;
            sendBtn.innerText = text;
        }).catch((err) => { console.error(err); $("#gSignoutBtn").parent().append(document.createTextNode(err.body)) });
}

var description;
var connectBtn;
var disconnectBtn;
if ((col = $("#tblMainProp tr"))) {
    var row = elementWithStyle("td", "padding-right: 10px;");
    var title = elementWithStyle("div", "padding-bottom: 5px;");
    var titleText = document.createElement("strong");
    titleText.innerText = "דירוג:";
    title.appendChild(titleText);
    row.appendChild(title);

    description = elementWithStyle("textarea", "padding-right: 10px;");
    description.id = "gradeDesc";
    description.style.height = "1.5vh";
    row.appendChild(description);

    choose = document.createElement("select");
    choose.dir = "ltr";
    choose.autofocus = true;
    choose.id = "derug";
    choose.appendChild(valElement("-100", "בחר"));
    choose.appendChild(valElement("3", "3"));
    choose.appendChild(valElement("2", "2"));
    choose.appendChild(valElement("1", "1"));
    choose.appendChild(valElement("0", "0"));
    choose.appendChild(valElement("-1", "-1"));
    choose.appendChild(valElement("-2", "-2"));
    choose.appendChild(valElement("-3", "-3"));
    row.appendChild(choose);

    sendBtn = btn("שלח");
    sendData.id = "sendBtn";
    sendBtn.addEventListener("click", sendData);

    sendBtn.classList.add("btn-success");
    sendBtn.classList.add("btn-sm");
    row.appendChild(sendBtn);

    connectBtn = btn("התחבר");
    connectBtn.id = "gSigninBtn";
    connectBtn.addEventListener("click", handleAuthClick);
    connectBtn.classList.add("btn-success");
    row.appendChild(connectBtn);

    disconnectBtn = btn("התנתק");
    disconnectBtn.id = "gSignoutBtn";
    disconnectBtn.addEventListener("click", handleSignoutClick);
    disconnectBtn.classList.add("btn-danger");
    disconnectBtn.classList.add("btn-sm");
    row.appendChild(disconnectBtn);

    col.append(row)
}

document.body.appendChild(function () {
    var ret = document.createElement("pre");
    ret.id = "content";
    return ret;
}());



var CLIENT_ID = '184591434170-99oska8ospn9t3g15as7atcv22khsmd6.apps.googleusercontent.com';
var APP_SECRET = 'FEwu9p-2mDrIc8xQLfRKklc_';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        clientId: CLIENT_ID,
        appSecret: APP_SECRET,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
        //    setTimeout(handleClientLoad, 2000);

    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'block';
        try {
            userMail = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
            disconnectBtn.innerHTML = "התנתק מ" + userMail;
        } catch (e) {
            appendPre(e);
        }
        var billNum = $("strong:contains(מספר הצ\"ח)").parent().next().text().trim().split("/");
        if (billNum.length <= 1) {
            billNum = $(".LawSecondaryDetailsTd:contains(פרסום ברשומות)").next().text().trim().match(/הצ"ח הממשלה .{10,20} - (\d+)/)[1];
            if (!billNum) return alert("failed");
            billNum = ["מ", billNum, "34"];
        }
        var billN = Number(billNum[1]) + 1;
        gapi.client.sheets.spreadsheets.values.batchGet({
            spreadsheetId: spreadsheetId,
            ranges: "laws" + billNum[2] + "!D" + billN + ":F" + billN
        })
            .then(function (res) {
                //console.log(res);
                $("#derug").val(res.result.valueRanges[0].values[0][0]) || -100;
                description.value = res.result.valueRanges[0].values[0][2] || "";

            })
    } else {
        connectBtn.style.display = 'block';
        disconnectBtn.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    event.preventDefault();
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    event.preventDefault();
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

handleClientLoad();