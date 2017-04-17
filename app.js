angular.module('amneApp', [])
	.controller('MainCtrl', [
		'$scope',
		function($scope){
			var map;
			var geocoder;
			var autocomplete1;
			var autocomplete2;
			var latLng1;
			var latLng2;
			var bounds;
			var markers = [];
			var austin = {lat: 30.2672, lng: -97.7431}; // default 

			$scope.showList = false;
			$scope.placeObjects = {};  // dictionary, key=name, value=obj location data
			$scope.sortedPlaces = [];
			$scope.addr1 = "";
			$scope.addr2 = "";
			$scope.callbackCount = 0;

			$scope.initMap = function() {
		        map = new google.maps.Map(document.getElementById('map'), {
		          zoom: 11,
		          center: austin
		        });

		        geocoder = new google.maps.Geocoder();
		        bounds = new google.maps.LatLngBounds();

		        // Try HTML5 geolocation.
		        if (navigator.geolocation) {
		          navigator.geolocation.getCurrentPosition(function(position) {
		            var pos = {
		              lat: position.coords.latitude,
		              lng: position.coords.longitude
		            };
		            map.setCenter(pos);
		          });
		        }

		        // Create the autocomplete object, restricting the search to geographical
		        // location types.
		        autocomplete1 = new google.maps.places.Autocomplete(
		            (document.getElementById('autocomplete1')),
		            {types: ['geocode']});

		        autocomplete2 = new google.maps.places.Autocomplete(
		            (document.getElementById('autocomplete2')),
		            {types: ['geocode']});
			}


			$scope.search = function() {
				clearMarkers();
				bounds = new google.maps.LatLngBounds();
				$scope.callbackCount = 0;
				$scope.showList = false;
				$scope.placeObjects = [];
				
				// not the best way to do this, but ng-model isn't being updated on autocomplete
				$scope.addr1 = document.getElementById('autocomplete1').value;
				$scope.addr2 = document.getElementById('autocomplete2').value;

				var blueMarker = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|0000FF';

				geocoder.geocode( { 'address': $scope.addr1 }, function(results, status) {
				  if (status == google.maps.GeocoderStatus.OK) {
					var service = new google.maps.places.PlacesService(map);
					latLng1 = results[0].geometry.location;
					var marker = new google.maps.Marker({
					    position: latLng1,
					    map: map,
					    icon: blueMarker
					});
					bounds.extend(marker.position);
					markers.push(marker);
			        service.nearbySearch({
			          location: latLng1,
			          radius: 16093,  // 10 miles in meters
			          type: ['real_estate_agency']
			        }, callback);
				  } else {
				    alert("Geocode was not successful: " + status);
				  }
				});

				geocoder.geocode( { 'address': $scope.addr2 }, function(results, status) {
				  if (status == google.maps.GeocoderStatus.OK) {
					var service = new google.maps.places.PlacesService(map);
					latLng2 = results[0].geometry.location;
					var marker = new google.maps.Marker({
					    position: latLng2,
					    map: map,
					    icon: blueMarker
					});
					bounds.extend(marker.position);
					markers.push(marker);
			        service.nearbySearch({
			          location: latLng2,
			          radius: 16093,  // 10 miles in meters
			          type: ['real_estate_agency']
			        }, callback);
				  } else {
				    alert("Geocode was not successful: " + status);
				  }
				});
			}

			function callback(results, status) {
		        if (status === google.maps.places.PlacesServiceStatus.OK) {
		          $scope.callbackCount += 1;
		          for (var i = 0; i < results.length; i++) {
		          	var placeName = results[i].name;
		          	var	distFromLoc1 = getDistance(results[i].geometry.location, latLng1);
	          		var distFromLoc2 = getDistance(results[i].geometry.location, latLng2);
	          		
		          	if (!(placeName in $scope.placeObjects)) {
		          		$scope.placeObjects[placeName] = {
		          			dist1: distFromLoc1,
		          			dist2: distFromLoc2,
		          			dist: distFromLoc1 + distFromLoc2
		          		}
		          	}
		          	createMarker(results[i]);
		          }
		        }
		        if ($scope.callbackCount === 2) {
		          // list out places in descending order by total distance
		          sortByDistance();
		    	  $scope.showList = true;
		    	  map.fitBounds(bounds);
		    	  $scope.$apply();
		        }
		    }

		    function sortByDistance() {
		    	$scope.sortedPlaces = [];
				for (placeName in $scope.placeObjects) {
				    $scope.sortedPlaces.push({
				    	name: placeName,
				    	dist1: $scope.placeObjects[placeName].dist1,
				    	dist2: $scope.placeObjects[placeName].dist2,
				    	dist: $scope.placeObjects[placeName].dist
				    });
				}
				$scope.sortedPlaces.sort(function(a, b) {
				    return b.dist - a.dist
				})
			}

		    function createMarker(place, big=false) {
		        var placeLoc = place.geometry.location;
		        var marker = new google.maps.Marker({
		          map: map,
		          position: place.geometry.location
		        });
		        bounds.extend(marker.position);
		        markers.push(marker);
		    }

		    function clearMarkers() {
		    	for (var i = 0; i < markers.length; i++) {
		    		markers[i].setMap(null);
		    	}
		    	markers = [];
		    }

		    // Haversine formula to calculate distance taken from
		    // http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
		    var rad = function(x) {
			  return x * Math.PI / 180;
			};

			var getDistance = function(p1, p2) {
			  var R = 6378137; // Earth’s mean radius in meter
			  var dLat = rad(p2.lat() - p1.lat());
			  var dLong = rad(p2.lng() - p1.lng());
			  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			    Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
			    Math.sin(dLong / 2) * Math.sin(dLong / 2);
			  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			  var d = R * c * 0.000621371;
			  return d; // returns the distance in miles
			};

			$scope.initMap();
		}
	]);
