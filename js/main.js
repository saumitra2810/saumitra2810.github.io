$(document).ready(function(e){

  var imageTemplate = `<div data-idx="{{idx}}" class="image-listing {{#loading}}loading{{/loading}}">
                      {{^loading}}
                      <div class="image"><img src="{{iu}}" /></div>
                      {{/loading}}
                      {{#loading}}
                      <div class="image"><div style="width: 400px; height: 400px;" class="picture"></div></div>
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

  function renderImage(iu, index, loading){
    var imageHtml = Mustache.render(imageTemplate, {iu: iu, loading: loading, idx: index});
    $("#image-listing-container").append(imageHtml);
  }

  function getPhotos(callback){
    $.get( "https://api.unsplash.com/collections/1803198/photos?client_id=191d581920250259f8027f8041a502e357444eb4e589dec1bdbf6011c71d3fab&page=1&per_page=100", function( data ) {
      var photoGallery = data.concat(data);
      photoGallery = photoGallery.concat(photoGallery);
      callback(photoGallery);
    });
  }

  getPhotos(function(photos){
    photos.forEach(function(photoObj, index){
      renderImage(photoObj.urls.small, index, true);
    });
    photos.forEach(function(photoObj, index){
      renderUpdateImage(photoObj.urls.small, index);
    });
  });

  window.ImageLoadQueue = [];
  window.ImageLoadCallbacks = {};
  window.ImageLoading = {};

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
      imageElement.find(".image").html('<img onload="ImageLoadCallbacks['+index+'](event)" onerror="ImageLoadCallbacks['+index+'](event)" src="' + iu + '" />');
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
  var flushImageQueue = debounce(_flushImageQueue, 300);

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
