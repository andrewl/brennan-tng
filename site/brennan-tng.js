const brennanURL = window.APP_CONFIG.BRENNAN_URL;
let currentArtist = "";
let currentTrack = "";
let currentAlbum = "";


document.addEventListener("touchstart", function() {},false);

let mybutton = document.getElementById("topBtn");

window.onscroll = function() {scrollFunction()};
function scrollFunction() {
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}


document.addEventListener('DOMContentLoaded', function() {
  updateUI();
  initialiseArtistsAndAlbums();
  initialisePresets();
  setInterval(updateUI, 2000); // Update every 2 seconds
});

//helper function to convert seconds to mm:s);
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  if (secs < 10) {
    secs = '0' + secs;
  }
  return mins + ':' + secs;
}

function updateUIForRadio(status) {


  if (status.artist !== currentArtist || status.track !== currentTrack || status.album !== currentAlbum) {
    currentTrack = status.station;
    currentArtist = status.station;
    currentAlbum = status.radioStatus;

    document.getElementById('time-into').innerText = "";
    document.getElementById('segue').innerText = "";
    document.getElementById('duration').innerText = "";
    document.getElementById('encoding').innerText = "";
    document.getElementById('track').innerText = currentTrack;
    document.getElementById('artist').innerText = ""
    document.getElementById('album').innerText = currentAlbum;
  }
  return;

}



function updateUI() {

  //fetch the status from http://music.lan/b2cgi.fcgi?status
  fetch(brennanURL + '/b2cgi.fcgi?status').then(response => response.json()).then(data => {

    document.getElementById('volume').value = data.volume;

    if (data.source === "Internet Radio") {
      updateUIForRadio(data);
      return;
    }

    if (data.punchThru === true) {
      data.artist = "Punch Thru";
      data.album = "Punch Thru";
      data.track = "Punch Thru";
      currentArtist = data.artist;
      currentTrack = data.track;
      currentAlbum = data.album;

      document.getElementById('time-into').innerText = "";
      document.getElementById('segue').innerText = "";
      document.getElementById('duration').innerText = "";
      document.getElementById('encoding').innerText = "";
      document.getElementById('track').innerText = "Music being controlled externally";
      document.getElementById('artist').innerText = "Could be Borg";
      document.getElementById('album').innerText = "Probably Spotify";
      return;

    }

    document.getElementById('time-into').innerText = formatTime(data.timeIntoTrack);
    document.getElementById('segue').innerText = "Segue " + data.segue;

    if (data.artist !== currentArtist || data.track !== currentTrack || data.album !== currentAlbum) {

      document.getElementById('artist').innerText = data.artist;
      document.getElementById('album').innerText = 'From "' + data.album + '"';
      document.getElementById('track').innerText = data.track;
      document.getElementById('duration').innerText = formatTime(data.duration);
      document.getElementById('encoding').innerText = data.compression;
      currentArtist = data.artist;
      currentTrack = data.track;
      currentAlbum = data.album;
      console.log('currentalbumid:', data.albumid);

      //iterate over the artistsContainer to find the current album and remove the font-mars class from any other albums and add it to the current album
      elements = document.getElementById('artistsContainer').getElementsByTagName('p');
      console.log('Elements length:', elements.length);
      console.log('Elements:', elements);
      Array.from(elements).forEach(element => {
        if (element.innerText.includes(currentAlbum)) {
          element.classList.add('font-mars');
          element.innerText = currentAlbum + " (now playing)";
        } else {
          element.classList.remove('font-mars');
          element.innerText = element.innerText.replace(" (now playing)", "");
        }
      })

      //iterate over the artists to find the current artist and expand the accordion
      elements = document.getElementById('artistsContainer').getElementsByClassName('artist');
      console.log('Elements length:', elements.length);
      console.log('Elements:', elements);
      Array.from(elements).forEach(element => {
        if (element.innerText === currentArtist) {
          element.classList.add('active');
          var accordionContent = element.nextElementSibling;
          accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        } else {
          element.classList.remove('active');
          var accordionContent = element.nextElementSibling;
          accordionContent.style.maxHeight = null;
        }
      })

    }


  }).catch(error => console.error('Error fetching status:', error));

}

function initialisePresets() {

  //get the list of playlists from /b2gci.fcgi?listplaylists
  fetch(brennanURL + '/b2cgi.fcgi?listplaylists').then(response => response.json()).then(playlists => {

    //get presets from /b2gci.fcgi?getPresets
    //iterate over each one creating a new sibling to the 'encoding' element with a div of either class panel-6 or panel-7
    fetch(brennanURL + '/b2cgi.fcgi?getPresets').then(response => response.json()).then(data => {
      let presetsElement = document.getElementById('presets');
      //remove any presets whose name is "Empty" and reverse sort alphabetically by name
      data = data.filter(preset => preset.name !== "Empty");
      data.forEach((preset, index) => {

        console.log('Processing preset:', preset);

        //if the preset's url is 'Playlist' then get the id from the playlists list
        if (preset.url === "Playlist") {
          let matchingPlaylist = playlists.find(playlist => playlist.name === preset.name);
          if (matchingPlaylist) {
            preset.id = matchingPlaylist.id;
          }
        }
        else {
          preset.id = (6000000 + index).toString();
          console.log('Preset ' + preset.name + ' assigned id ' + preset.id);
        }

        let presetDiv = document.createElement('div');
        presetDiv.classList.add(index % 2 === 0 ? 'panel-6' : 'panel-7');
        presetDiv.innerText = preset.name;
        presetDiv.onclick = function() { playId(preset.id); };
        presetsElement.parentNode.insertBefore(presetDiv, presetsElement.prevSibling);
      });
    }).catch(error => console.error('Error fetching presets:', error));

  }).catch(error => console.error('Error fetching playlists:', error));
}

function initialiseArtistsAndAlbums() {

  //load artists and albums from http://music.lan/b2gci.fcgi?search&albums=Y&tracks=N&radio=N&video=N&offset=0&count=1000&string=
  fetch(brennanURL + '/b2cgi.fcgi?search&albums=Y&tracks=N&radio=N&video=N&offset=0&count=50000&string=').then(response => response.json()).then(data => {
    //The artists are the objects which don't have an "album" property
    artists = data.filter(item => !item.hasOwnProperty('album'));

    //sort the artists alphabetically
    artists.sort((a, b) => a.artist.localeCompare(b.artist));

    let artistsContainer = document.getElementById('artistsContainer');
    artistsContainer.innerHTML = '';
    artists.forEach(artist => {
      let artistDiv = document.createElement('div');
      //add the artist and accordion classes to the element
      artistDiv.classList.add('accordion');
      artistDiv.classList.add('artist');
      artistDiv.innerText = artist.artist;

      //Find albums for this artist
      let albums = data.filter(item => item.hasOwnProperty('album') && item.artist === artist.artist);

      albums = albums.sort((a, b) => a.album.localeCompare(b.album));

      let albumsList = document.createElement('div');
      albumsList.classList.add('accordionContent');
      albums.forEach(album => {
        let albumItem = document.createElement('p');
        albumItem.innerText = album.album;
        albumItem.onclick = function() { playId(album.id); };
        albumsList.appendChild(albumItem);
      });

      artistsContainer.appendChild(artistDiv);
      artistsContainer.appendChild(albumsList);
    });

    // Accordion drop-down
    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var accordionContent = this.nextElementSibling;
        if (accordionContent.style.maxHeight){
          accordionContent.style.maxHeight = null;
        } else {
          accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
        } 
      });
    }

  }).catch(error => console.error('Error fetching artists and albums:', error));

} 

function commandSetVol(vol) {
  playSoundNoRedirect(brennanURL + '/b2cgi.fcgi?vol' + vol);
}

function commandPlay() {
  playSoundNoRedirect(brennanURL + '/b2cgi.fcgi?play');
}

function commandNext() {
  playSoundNoRedirect(brennanURL + '/b2cgi.fcgi?next');
}

function commandPrev() {
  playSoundNoRedirect(brennanURL + '/b2cgi.fcgi?back');
}

function playId(id) {
  playSoundNoRedirect(brennanURL + '/b2cgi.fcgi?playID&' + id);
}

function playSoundNoRedirect(url) {
  var audio = document.getElementById("beep");
  audio.play();

  audio.onended = function() {
    callGet(url);
  };
}

function callGet(url) {
  return fetch(url)
    .then(res => res.text())
    .then(text => {
      console.log("Response:", text);
      updateUI();
      return text;
    })
      .catch(err => console.error("GET error", err));
}


function goToAnchor(anchorId) {
  window.location.hash = anchorId;
}
