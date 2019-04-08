$(document).ready(function(e){

  window.ImageLoadQueue = [];
  window.ImageLoadCallbacks = {};
  window.ImageLoading = {};

  var imageTemplate = `<div data-idx="{{idx}}" class="image-listing {{#loading}}loading{{/loading}}">
                      {{^loading}}
                      <div class="image"><img style="width: 400px; height: 300px;" src="{{iu}}" /></div>
                      {{/loading}}
                      {{#loading}}
                      <div class="image"><div style="width: 400px; height: 300px;" class="picture"></div></div>
                      {{/loading}}
                      </div>
                      `;

  var debounce = function(fn, delay, maxSteps) {
    var timer = null, maxSteps = maxSteps || 1, currStep = 0;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      currStep++;
      timer = setTimeout(function () {
        timer = null;
        currStep = 0;
        fn.apply(context, args);
      }, delay * Math.min(currStep, maxSteps));
    };
  };
  var flushImageQueue = debounce(_flushImageQueue, 300);

  function renderImage(iu, index, loading){
    var imageHtml = Mustache.render(imageTemplate, {iu: iu, loading: loading, idx: index});
    $("#image-listing-container").append(imageHtml);
  }

  function getPhotos(callback){
    $.get( "images.json", function( data ) {
      callback(data);
    });
    // var photos = [];
    // for (var i = 0; i < 30; i++) {
    //   photos.push("https://source.unsplash.com/random/400x300?q=" + i);
    // }
  }

  getPhotos(function(photos){
    photos.forEach(function(photoUrl, index){
      renderImage(photoUrl, index, true);
    });
    photos.forEach(function(photoUrl, index){
      renderUpdateImage(photoUrl, index);
    });
  });

  function queueImageLoad(iu, index, imageElement) {
    if(!iu) {
      console.log("iu not found", product.epi, product.du);
    }
    var idx = imageElement.attr("data-idx");
    ImageLoadCallbacks[index] = function(evt) {
      //console.log("Finished", evt.type, idx);
      var imageElement = $(".image-listing[data-idx='"+index+"']");
      if(evt.type == "error"){
        console.log(evt.type, iu);
        renderUpdateImage(iu, index, true);    // remove the image
      }
      delete ImageLoadCallbacks[index];
      delete ImageLoading[index];
      $(imageElement).removeClass("loading");
      flushImageQueue();
    };
    if(Object.keys(ImageLoading).length >= 8) {
      ImageLoadQueue.push({iu: iu, index: index, imageElement: imageElement});
      flushImageQueue();
    } else {
      ImageLoading[index] = true;
      //console.log("Loading image for", idx);
      imageElement.find(".image").html('<img style="width: 400px; height: 300px;" onload="ImageLoadCallbacks['+index+'](event)" onerror="ImageLoadCallbacks['+index+'](event)" src="' + iu + '" />');
    }
  }

  function _flushImageQueue() {
    var numLoading = Object.keys(ImageLoading).length;
    //console.log("numLoading", numLoading);
    if(numLoading >= 8) {
      flushImageQueue();
    } else {
      var subQueue = ImageLoadQueue.splice(0, 8 - numLoading);
      subQueue.forEach(function(o){
        //console.log("Queueing", o.imageElement.attr("data-idx"));
        if(o) {
          queueImageLoad(o.iu, o.index, o.imageElement);
        }
      });
    }
  }

  function renderUpdateImage(iu, index, bRemove) {
    var body = document.getElementsByTagName("body")[0];
    var imageElement = $(".image-listing[data-idx='"+index+"']");
    if(imageElement) {
      if(bRemove) {
        $(imageElement).remove();
      } else {
        queueImageLoad(iu, index, imageElement);
      }
    } else {
      renderImage(iu);
    }
  }

});
