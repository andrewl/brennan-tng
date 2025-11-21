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
  setInterval(updateUI, 5000); // Update every 5 seconds
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


function updateUI() {

  //fetch the status from http://music.lan/b2cgi.fcgi?status
  fetch(brennanURL + '/b2cgi.fcgi?status').then(response => response.json()).then(data => {

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

    document.getElementById('volume').value = data.volume;

  }).catch(error => console.error('Error fetching status:', error));

}

function initialiseArtistsAndAlbums() {

  //load artists and albums from http://music.lan/b2gci.fcgi?search&albums=Y&tracks=N&radio=N&video=N&offset=0&count=1000&string=
  fetch(brennanURL + '/b2cgi.fcgi?search&albums=Y&tracks=N&radio=N&video=N&offset=0&count=1000&string=').then(response => response.json()).then(data => {
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

      //sort the albums alphabetically
      albums.sort((a, b) => a.album.localeCompare(b.album));

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
