import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-database.js";
const firebaseConfig = {
    apiKey: "AIzaSyAU12lW7Axec4TF6aDChHuC7Nk-irx47bU",
    authDomain: "clove-4d6c4.firebaseapp.com",
    databaseURL: "https://clove-4d6c4-default-rtdb.firebaseio.com",
    projectId: "clove-4d6c4",
    storageBucket: "clove-4d6c4.appspot.com",
    messagingSenderId: "579159556398",
    appId: "1:579159556398:web:aa578ba4d080508120fabf",
    measurementId: "G-6YHEH9NKSG"
};
var potentiallyPaid = false;
var updatingPopup = false;
var user = null;
var temp = document.cookie.split("; ");
for (var i = 0; i < temp.length; i++){
    if (temp[i].substring(0, 6) == ("email=")){
        user = temp[i].substring(6);
        break;
    }
}
if (user == ""){
    window.location.replace("../static/pages-sign-in.html");
}
var totalEntries = 0;
var app = null;
export function setApp(app2){
    app = app2;
}

var database = null;
export function setUpDatabase() { database = getDatabase(app);}

function addRow(product, amount, date, transactionID, donatedYet) {
    var table = document.getElementById("myTableData");
    var row = table.insertRow(1);
    //row.insertCell(0).innerHTML= '<input type="button" value = "Delete" onClick="Javacsript:dummy()">';
    row.insertCell(0).innerHTML= date;
    row.insertCell(1).innerHTML= product;
    row.insertCell(2).innerHTML= (parseInt(amount*100))/ 100;
    if (donatedYet){
        row.insertCell(3).innerHTML= "Yes";
    } else{
        row.insertCell(3).innerHTML= "No";
    }
    row.insertCell(4).innerHTML= transactionID;
}



var total = 0;
var totalNotPaid = 0;
var totalPaid = 0;

export function setName(){
    var nameSet = document.getElementById("person-name");
    nameSet.innerHTML = user;
}

function set4Boxes(){
    var curBalance = document.getElementById("cur-balance");
    curBalance.innerHTML = totalNotPaid;
    var curPaid = document.getElementById("donationsNotMade");
    curPaid.innerHTML = totalPaid;
    var curCo2Emissions = document.getElementById("co2Emissions");
    curCo2Emissions.innerHTML = (totalPaid/0.04).toFixed(2);
}

export function getFirebaseData(){
    const starCountRef = ref(database, 'transactions');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        if (totalEntries == 0){
            Object.entries(data).forEach((entry) => {
                totalEntries = 1;
                const [key , value] = entry;
                if (value['email'] == user){
                    addRow(value['products'], value['donationAmount'], value['date'], key, value['donatedYet']);
                    var amount = parseFloat(value['donationAmount']);
                    total += amount;
                    if (value['donatedYet']){
                        totalPaid += amount;
                    }
                    else{
                        totalNotPaid += amount;
                    }
                }
            });
            totalPaid = Math.round(parseFloat(totalPaid)*100)/100;
            totalNotPaid = Math.round(parseFloat(totalNotPaid)*100)/100;
            total = Math.round(parseFloat(total)*100)/100;
        }
        else if (updatingPopup){}
        else{
            location.reload();
        }
        set4Boxes();
    });
}

export function updatePotentiallyPaid(){
    const starCountRef = ref(database, 'transactions');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        Object.entries(data).forEach((entry) => {
            const [key , value] = entry;
            if (value['email'] == user && !value['potentiallyPaid'] && !value['donatedYet']){
                update(ref(database, "/transactions/" + key), {potentiallyPaid: true});
            }
        });
        potentiallyPaid = true;
    });
    updateAfterPopup();
}

export function updatePaid(date){
    console.log("in update");
    const starCountRef = ref(database, 'transactions');
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        Object.entries(data).forEach((entry) => {
            const [key , value] = entry;

            if (value['email'] == user && (key < date * 1000)){
                console.log(key);
                console.log(date);
                update(ref(database, "/transactions/" + key), {donatedYet: true});
            }
        });
    });
    // location.reload();

}

export function updateAfterPopup(){
    const starCountRef = ref(database, 'transactions');
    var index = 0;
    updatingPopup = true;
    onValue(starCountRef, (snapshot) => {
        const data = snapshot.val();
        index = 0;
        Object.entries(data).forEach((entry) => {
            const [key , value] = entry;
            if (value['email'] == user && value['potentiallyPaid'] && !value['donatedYet']){
                var description = document.createTextNode(value['date'] + ": " + value['products'] + " (" + key + ")");
                var checkbox = document.createElement("input");
                var label= document.createElement("label");
                //var break1 = document.createElement("br");
                label.id = "description_checkbox" + index.toString();
                checkbox.type = "checkbox"; 
                checkbox.name = "slct[]";
                checkbox.id = "checkbox" + index.toString();
                index += 1;
                label.appendChild(checkbox);
                label.appendChild(description);
                //label.appendChild(break1);
                document.getElementById('checkPopup').appendChild(label);
            }
        });
       
        if (index == 0){
            document.getElementById("myModal").style.display = "none";
            updatingPopup = false;
        } else{
            document.getElementById("myModal").style.display = "block";
        }
    });
}

function deleteLogin(){
    var allCookies = document.cookie.split(';');        
    // The "expire" attribute of every cookie is 
    // Set to "Thu, 01 Jan 1970 00:00:00 GMT"
    for (var i = 0; i < allCookies.length; i++)
        document.cookie = allCookies[i] + "=;expires="
        + new Date(0).toUTCString();
}


export function donationButtonEventListener(){
    if(document.getElementById("donationButton")){
        document.getElementById("donationButton").addEventListener("click", updatePotentiallyPaid);
    }
    if (document.getElementById("logOutButton")){
        document.getElementById("logOutButton").addEventListener("click", deleteLogin);
    }
    if (document.getElementById("loggingOut")){
        document.getElementById("loggingOut").addEventListener("click", deleteLogin);
    }
}

async function test(){
    var curID = 0;
    updatingPopup = true;
    while (document.getElementById("description_checkbox" + curID.toString())){
        potentiallyPaid = false;
        var descrip = document.getElementById("description_checkbox" + curID.toString());
        var key1 = descrip.innerText.substring(descrip.innerText.length - 14, descrip.innerText.length -1);
        if (document.getElementById("checkbox" +curID.toString()).checked){
            await update(ref(database, "/transactions/" + key1), {potentiallyPaid: false, donatedYet: true});
        } else{
            await update(ref(database, "/transactions/" + key1), {potentiallyPaid: false, donatedYet: false});
        }
        curID++;
    }
    document.getElementById("myModal").style.display = "none";
    
}

export function submitPopupButtonEventListener(){
    if(document.getElementById("popupSubmitButton")){
        document.getElementById("popupSubmitButton").addEventListener("click", test);
    }
}



// export function deleteData(id){
//     const starCountRef = ref(database, 'transactions');
//     onValue(starCountRef, (snapshot) => {
//         const data = snapshot.val();
//         Object.entries(data).forEach((entry) => {
//             const [key , ] = entry;
//         });
//     });
// }