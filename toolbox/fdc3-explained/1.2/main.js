import setVersionList from '../versions.js';

// use this to keep track of context listener - one per system channel
let contextListener = null;
let appChannels = [];

// check for FDC3 support
function fdc3OnReady(cb) {
  if (window.fdc3) { cb() }
  else { window.addEventListener('fdc3Ready', cb) }
}

// Wait for the document to load
function documentLoaded(cb) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cb)
  } else { cb() }
}

//  document and FDC3 have loaded start the main function
documentLoaded(() => fdc3OnReady(main));

function main() {
  try {
    console.log("FDC3 is ready and DOM has rendered");
    populateHTML();
    setUpEventListeners();
    getPlatform();
    displayFDC3Support();
    getContext();
  } catch (error) {
    console.error(error);
  }
}

async function populateHTML() {
  try {

    //populate available channels list with system channels
    let channelList = document.getElementById("system-channel-list");

    const populateChannelsList = (name) => {
      let node = document.createElement("li");
      let textNode = document.createTextNode(name);
      node.appendChild(textNode);
      channelList.appendChild(node);
    }

    const systemChannels = await fdc3.getSystemChannels();

    // for all of the system channels populate dropdowns & lists
    systemChannels.forEach(({ displayMetadata, id, type }) => {
      let { name } = displayMetadata;
      populateChannelsList(name);
      populateChannelsDropDown(name);
    });

    // set the versions of FDC3 Explained in the dropdown
    setVersionList();

    // as FDC3 is supported we can enable the buttons again except those that are not yet supported features
    document.querySelectorAll("button").forEach(button => {
      if (!button.className.includes("not-supported")) {
        button.disabled = false;
      }
    })
  } catch (error) {
    console.error("unable to populate the html for the page ", error);
  }
}

function setUpEventListeners() {
  document.getElementById("add-app-channel__btn").addEventListener("click", addAppChannel);
  document.getElementById("join-channel__btn").addEventListener("click", joinChannel);
  document.getElementById("join-app-channel__btn").addEventListener("click", joinAppChannel);
  document.getElementById("leave-channel__btn").addEventListener("click", fdc3.leaveCurrentChannel);
  document.getElementById("broadcast__btn").addEventListener("click", broadcastFDC3Context);
  document.getElementById("add-intent-listener__btn").addEventListener("click", listenToIntent);
  document.getElementById("raise-intent__btn").addEventListener("click", raiseIntent);
  document.getElementById("context-type").addEventListener("keyup", (event) => {
    //  we only want to get the context wen the user hits enter
    if (event.key === "Enter") {
      event.preventDefault();
      let contextType = event.target.value;
      getContext(contextType);
    }
  });
}

function displayFDC3Support() {
  try {
    let supportedElement = document.getElementById("fdc3-support");
    if (window.fdc3) {
      supportedElement.innerHTML = "Yes ✅";
    }
    else {
      supportedElement.innerHTML = "No ❌";
    }
  } catch (error) {
    console.error("can't find FDC3 support", error);
  }
}

function getPlatform() {

  // TODO: add G42 to vendors
  if (window.FSBL) {
    window.FSBL.getFSBLInfo().then((info) => {
      document.getElementById('providerDetails').innerHTML = "Finsemble Version:" + info.FSBLVersion;
    });
  } else if (window.fin) {
    fin.desktop.Application.getCurrent().getInfo((info) => {
      //document.getElementById('providerDetails').innerHTML = info.manifest.startup_app.name
    });
  } else if (window.fdc3) {
    document.getElementById('providerDetails').innerHTML = "FDC3 Desktop Agent Chrome Extension";
  }
  else {
    // no need to update the DOM there is already a default message just return
    return;
  }
}

function populateChannelsDropDown(newOptionText) {
  try {
    let dropdownElement = document.querySelector(".fdc3-channels");

    if (newOptionText) {
      dropdownElement.add(new Option(newOptionText));
    }
    else {
      throw new Error("No option provided");
    }

  } catch (error) {
    console.error("could not add a new channel to the channel dropdown list", error);
  }
}

function populateAppChannelsDropDown(newOptionText) {
  try {
    let dropdownElement = document.querySelector(".fdc3-app-channels");

    if (newOptionText) {
      dropdownElement.add(new Option(newOptionText));
    }
    else {
      throw new Error("No option provided");
    }

  } catch (error) {
    console.error("could not add a new channel to the channel dropdown list", error);
  }
}

async function joinChannel() {
  try {
    let dropdownElement = document.getElementById("join-channel");
    let channelName = dropdownElement.options[dropdownElement.selectedIndex].text.toLowerCase();
    await fdc3.joinChannel(channelName);
  } catch (error) {
    console.error("Can't join channel", error);
  }
}

async function joinAppChannel() {
  try {
    let dropdownElement = document.getElementById("join-app-channel");
    let channelName = dropdownElement.options[dropdownElement.selectedIndex].text.toLowerCase();
    const matchingAppChannel = appChannels.filter(channel => channel.id === channelName);
    if (matchingAppChannel) {
      
    }
    
  } catch (error) {
    console.error("Can't join channel", error);
  }
}

async function broadcastFDC3Context() {
  try {
    let contextData = document.getElementById('txtBroadcastData').value;
    fdc3.broadcast(JSON.parse(contextData));
  } catch (error) {
    console.error("could not broadcast", error);
  }
}

async function getContext(contextType) {
  try {
    let contextResultBox = document.getElementById("context-result");

    if (contextListener) {
      contextListener.unsubscribe();
    }

    // if context type is passed in then only listen on that specific context
    if (contextType) {
      contextListener = fdc3.addContextListener(contextType, (context) => contextResultBox.innerText = JSON.stringify(context, null, 2));
    } else {
      contextListener = fdc3.addContextListener(null, context => contextResultBox.innerText = JSON.stringify(context, null, 2));
    }
  } catch (error) {
    console.error("Unable to add a context listener", error)
  }
}

async function addAppChannel() {
  try {
    let appChannelName = document.getElementById("app-channel").value;

    if (!appChannelName) {
      throw new Error("No channel name set");
    }

    let appChannelExists = appChannels.find(appChannel => appChannel.id === appChannelName);

    if (!appChannelExists) {
      let newAppChannel = await fdc3.getOrCreateChannel(appChannelName);
      appChannels.push(newAppChannel);

      // add to the list of available app channels
      let node = document.createElement("li");
      let textNode = document.createTextNode(appChannelName);
      node.appendChild(textNode);
      document.getElementById("app-channel-list").appendChild(node);

      //populate the channel list dropdown with new appChannel
      populateAppChannelsDropDown(newAppChannel.id);
    } else {
      throw new Error("App channel already exists");
    }
  } catch (error) {
    console.error("Could not add an app channel", error);
  }
}

async function listenToIntent() {
  try {
    // get the channel
    let intentToListenFor = document.getElementById("intent-listener").value;
    let intentResult = document.getElementById("intent-result");

    // TODO: add the target param
    await fdc3.addIntentListener(intentToListenFor, (context) => {
      intentResult.innerText = JSON.stringify(context, null, 2);
    })
  } catch (err) {
    console.error("Unable to listen for intents", err);
  }
}

async function raiseIntent() {
  try {
    // get the channel
    let intent = document.getElementById("intent").value;
    let context = JSON.parse(document.getElementById("intent-context").value);

    // TODO: add the target param
    await fdc3.raiseIntent(intent, context);
  } catch (err) {
    console.error("Intent did not resolve", err);
  }
}