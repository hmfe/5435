//Time in ms between API calls. Hitting Enter will circumvent this restriction.
const throttleInterval = 1250;
//Max amount of results to be displayed in resultslist
const maxResults = 10;

//Global variabel used by app
let lastCall = new Date();      //Tracks last call
let throttleLeft = null;        //Tracks the difference between throttleInterval and lastCall
let saveResults = [];           //Array of search hitts
let searchHistory = [];         //Array of search history objects
let searchHistoryId =0;         //ID ticker for search history objects

//Target elements
let searchField = document.getElementsByClassName('searchField')[0];
let listResults = document.getElementsByClassName('listResults')[0];
let savedSearches = document.getElementsByClassName('savedSearches')[0];

//Set up EventListeners
searchField.oninput = () =>  {throttle(throttleInterval,()=>{updateSearch(searchField.value)})};
searchField.onkeyup = (e) => {handleEnter(e.key, searchField.value,(value)=>{updateSearch(searchField.value, value)})};
document.addEventListener('click', (e) => { handleClick(e)});

//Gets data from API and saves it in SaveResults Array.
//Ignores if there input is empty
//Passes False/True if Enter has been pressed
function updateSearch(searchString, enter=false){
    if(searchString.length>0){
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "http://stapi.co/api/v1/rest/character/search", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.responseType = 'json';
        xhttp.send("name="+searchString);
        xhttp.onload = function() {
            saveResults = xhttp.response.characters.map((value)=>{
                return value.name;
            })
            if (saveResults.length>maxResults){
                saveResults = saveResults.slice(0,maxResults);
            }
            updateList(saveResults, enter, searchString);
        }
    }
    else {
        updateList(saveResults=[]);
    }
};

//Throttle function calculates timeleft to next Call and passes function back in callback.
//If not, clears old timeout and sets up a new
function throttle(throttleTimeOut, callback){
    let timeLeft = lastCall.getTime()+throttleTimeOut-new Date().getTime();
    if (timeLeft < 0){
        lastCall = new Date();
        callback();
    }
    else {
        clearTimeout(throttleLeft);
        throttleLeft = setTimeout(callback, timeLeft);
    }
}

//Maps array to poplate partial search results. Colapse list if enter is hit. Some styling features.
function updateList(input, enter=false, searchString){
    if (enter){
        input=[];
        saveSearch(searchString);
    }
    if (input.length){
        listResults.style.border = "1px solid grey"
    }
    else {
        listResults.style.border = ""
    }
    listResults.innerHTML = "";
    input.map((value)=>{
        let displayString = value;
        var match = new RegExp(searchString, 'i').exec(value);
        if (match && searchString) {
            if (match.index===0){
                displayString='<b>'+match+'</b>'+value.split(match)[1];
            }
            else {
                displayString=value.split(match)[0]+'<b>'+match+'</b>'+value.split(match)[1];
            }
        }
        let liElement = document.createElement("li");
        liElement.onclick=()=>historyClicked(value);
        let pElement = document.createElement("p");
        pElement.innerHTML = displayString;
        liElement.appendChild(pElement);
        listResults.appendChild(liElement);
    });
}

//Handles click to figure out if listResults or searchField is being clicked or not. Collapse if outside.
function handleClick(input){
    var listClicked = false;
    for (element in input.path){
        let currentElement = input.path[element];
        if (currentElement.className==='listResults' || currentElement.className==='searchField'){
            listClicked = true;
        }
    }
    if (listClicked){
        updateList(saveResults);
    }
    else {
        updateList([]);
    }
}

//If enter is hit clears timeout and instantly call updateSearch()
function handleEnter(key, input, callback){
    if (key==='Enter'){
        clearTimeout(throttleLeft);
        callback(true);
    }
}

//Creates a searchHistoryItem and puts on top
function saveSearch(searchString){
    const searchItem = new searchHistoryItem(searchString, searchHistoryId);
    searchHistoryId+=1;
    searchHistory.unshift(searchItem)
    updateSearchHistory();
}

//Update search history HTML and pass onClick actions.
function updateSearchHistory(){
    savedSearches.innerHTML = "";
    searchHistory.map(
        function(value){
            //textContainer
            let textContainer = document.createElement('div');
            textContainer.className = "gridItem left";
            textContainer.innerHTML = value.search;
            textContainer.onclick = ()=>historyClicked(value.search);
            //timeContainer
            let timeContainer = document.createElement('div');
            timeContainer.className = "gridItem center";
            timeContainer.innerHTML = value.timestamp;
            //deletContainer
            let deleteContainer = document.createElement('div');
            deleteContainer.className = "gridItem right";
            deleteContainer.innerHTML = "X";
            deleteContainer.onclick = ()=> deleteClicked(value.id);
            savedSearches.appendChild(textContainer);
            savedSearches.appendChild(timeContainer);
            savedSearches.appendChild(deleteContainer);
        }
    );
}

//If Item in searh History is clicked (or resultslist) pass that to inputfield and updateSearch
function historyClicked(value){
    searchField.value = value;
    console.log(value);
    updateSearch(value);
    searchField.focus();
}

//Deletes searchHistoryItem from array searchHistory
function deleteClicked(value){
    searchHistory.forEach(
        function (item, index, object){
            if (item.id===value){
                object.splice(index, 1)
            }
        }
    )
    updateSearchHistory();
}
//clear Search Field
function clearSearch(){
    searchField.value = "";
}

//Clear Search History
function clearSearchHistory(){
    searchHistory = [];
    searchHistoryId = 0;
    updateSearchHistory();
}

//Search history Item class
class searchHistoryItem{
    constructor(search, id) {
        this.search = search;
        this.timestamp = new Date().toJSON().slice(0,16).replace(/-/g,'-').replace('T',', ').toString();
        this.id = id;
    }
}
