function getJsonFromUrl() {
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}
var body = document.body

var src = getJsonFromUrl().u;

class VideoHolder {
    constructor() {
        this.video = document.createElement("video");
        this.loadCallback;
        this.updateCallback;
        this.aborted = false;
        this.video.addEventListener("loadeddata", () => {
            if (this.loadCallback) this.loadCallback(this);
        })
        this.video.addEventListener("abort", () => {
            this.aborted = true;
        })
        this.video.addEventListener("timeupdate", () => {
            if (this.updateCallback && !this.aborted) this.updateCallback(this);
        });

    }
    setLoadCallback(c) {
        this.loadCallback = c;
    }
    format() {
        this.video.style = "position: absolute; left: 0; top: 0;";
        return this;
    }
    appendTo(parent) {
        parent.appendChild(this.video)
        this.parent = parent;
        this.width = this.video.width = parseInt(parent.offsetWidth);
        this.height = this.video.height = parseInt(parent.offsetHeight);
    }
    setSource(url) {
        this.video.src = url;
    }
    play() {
        this.video.play();
    }
    show() {
        this.video.style.width = this.width + 'px';
    }
    hide() {
        this.video.style.width = '0px';
    }
}

class FastStream {
    constructor(parent) {
        this.parent = parent;
        this.timeout = false;
        this.source;
        this.currentSource = 0;
        this.videos = [];
        this.controls = {
            volume: 1,
            playing: false,
            currentTime: 0
        }
        this.setUp();
    }
    getNext() {

    }

    getNextBackwards() {

        for (var i = start; i >= 0; i--) {
            if (!this.info[i]) {

                return i;
                break;
            }
        }
        return null;
    }
    getNextFowards() {
        var max = Math.max(this.info.length, start)
        for (var i = start; i <= max; i++) {
            if (!this.info[i]) {
                return i;
                break;
            }
        }
        return null;
    }
    httpGetAsync(theUrl, callback, r, r2) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.responseType = "arraybuffer";
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4)
                callback(xmlHttp.status, xmlHttp.response, xmlHttp.getAllResponseHeaders());
        }
        xmlHttp.open("GET", theUrl, true); // true for asynchronous 
        xmlHttp.setRequestHeader('Range', 'bytes=' + r + '-' + r2)
        //xmlHttp.setRequestHeader('Origin', '');

        xmlHttp.send(null);
    }
    togglePlay() {

        this.controls.playing = !this.controls.playing
        this.controls.playbtn.innerHTML = (this.controls.playing ? "&#10074;&#10074;" : "&#9658;")

    }
    resize() {

    }
    setUp() {
        this.container = document.createElement("div");
        this.parent.appendChild(this.container);
        this.container.style = "position: relative; width: 100%; height: 100%; background-color: rgb(0,0,0)";
        this.videos = [this.createVideo().format().appendTo(this.container), this.createVideo().format().appendTo(this.container)];

        this.controls.ui = document.createElement('div');
        this.controls.ui.style = "user-select: none; position: absolute; left: 0; right: 0; bottom: 0; height: 30px; background-color: rgba(70,70,70,.8); z-index: 10000"
        this.container.appendChild(this.controls.ui);

        // Play button
        this.controls.playbtn = document.createElement('div');
        this.controls.playbtn.style = "cursor: pointer; display: inline-block; width: 30px; height: 100%; font-size: 20px; color: rgba(255,255,255,.8); margin-left: 5px; margin-right: 5px; float: left; line-height: 35px";

        this.controls.playbtn.innerHTML = "&#9658;";
        this.controls.playbtn.addEventListener('click', () => {
            this.togglePlay();
        })
        this.controls.ui.appendChild(this.controls.playbtn)


        // Seeker
        this.controls.timerange = document.createElement('input');
        this.controls.timerange.type = "range"
        this.controls.timerange.value = "0";
        this.controls.timerange.style = "width: calc(100% - 280px); height: 30px; padding: 0px; margin: 0px"
        this.controls.ui.appendChild(this.controls.timerange)

        // Time
        this.controls.time = document.createElement('div');
        this.controls.time.textContent = "0:00:00/0:00:00"
        this.controls.time.style = "display: inline-block;height: 30px;color: rgba(255, 255, 255, 0.8);vertical-align: top;font-size: 13px;line-height: 30px;margin-left: 5px;"
        this.controls.ui.appendChild(this.controls.time)

        // Full screen
        this.controls.full = document.createElement('div');
        this.controls.full.innerHTML = '<svg width="1792" height="1792" style="width: 20px; height: 20px" fill="rgba(255,255,255,.8)" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M1411 541l-355 355 355 355 144-144q29-31 70-14 39 17 39 59v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l144-144-355-355-355 355 144 144q31 30 14 69-17 40-59 40h-448q-26 0-45-19t-19-45v-448q0-42 40-59 39-17 69 14l144 144 355-355-355-355-144 144q-19 19-45 19-12 0-24-5-40-17-40-59v-448q0-26 19-45t45-19h448q42 0 59 40 17 39-14 69l-144 144 355 355 355-355-144-144q-31-30-14-69 17-40 59-40h448q26 0 45 19t19 45v448q0 42-39 59-13 5-25 5-26 0-45-19z"/></svg>'
        this.controls.full.style = "position: absolute; cursor: pointer; right: 2px; width: 30px;height: 30px;display: inline-block;color: rgba(255, 255, 255, 0.8);vertical-align: top;font-size: 13px;line-h;line-height: 42px;"
        this.controls.full.addEventListener('click', () => {
            this.container.webkitRequestFullScreen();
        })
        this.controls.ui.appendChild(this.controls.full)

        // Captions
        this.controls.captions = document.createElement('div');
        this.controls.captions.style = "display: inline-block; font-family: Arial; margin: 7px; font-size: 10px; vertical-align: top; height: 16px; width: 22px; padding-left: 7px; line-height: 17px; background-color: rgba(255,255,255,.8); border-radius: 5px;"
        this.controls.captions.textContent = "CC"
        this.controls.ui.appendChild(this.controls.captions)

        this.container.addEventListener('resize', () => {
            this.resize();
        })
    }


    createVideo() {
        return new VideoHolder();
    }
    setSource(source) {
        this.stop();
        this.source = source;
        this.data = [];
        this.info = [];
        this.run();
    }
    stop() {
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = false;
    }
    run() {
        this.loop();
    }
    createBlobURL(data) {
        if (this.prevBlobURL) window.URL.revokeObjectURL(this.prevBlobURL)
        var b = new Blob(data, {
            type: "video/mp4"
        });
        this.prevBlobURL = window.URL.createObjectURL(b);
        return this.prevBlobURL;
    }
    swapSourceTo(id, callback) {
        if (this.currentSource == id) return callback(false);
        var previous = this.videos[this.currentSource];
        var to = this.videos[id];

        var start = this.ratio ? Math.max(Math.round((this.currentTime * this.ratio + this.metaSize) / this.size) - this.preload, 0) : 0

        for (var j = start; j < this.info.length; j++) {
            if (this.info[j] != 2) {
                j++;
                break
            }
        }
        this.currentInfo = recieved.slice(0, j)

        var blob = new Blob(data, {
            type: "video/mp4"
        });
        to.setLoadCallback(() => {
            to.video.currentTime = from.video.currentTime

            setTimeout(() => {
                to.video.currentTime = 2 * from.video.currentTime - to.video.currentTime;

                setTimeout(() => {
                    to.video.volume = this.controls.volume;
                    from.video.volume = 0;

                    to.show();
                    from.hide();
                    callback(true);
                }, 500)

            }, 500);

        })
        to.setSource(this.createBlob(this.data.slice(0, j)));
        to.play()
        this.currentSource = id;
    }

    loop() {
        this.timeout = setTimeout(() => {
            this.loop();
        }, 1000);

    }
}
var c = document.createElement("div");
c.style = "position: absolute; left: 50px; top: 50px; right: 50px; bottom: 50px";
document.body.appendChild(c);
var vid = new FastStream(c);
