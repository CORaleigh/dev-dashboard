(function(){
  angular
  .module('development')
  .controller('DevelopmentController', [
    'sodaService', '$mdSidenav', '$mdBottomSheet', '$timeout', '$log', '$http',
    '$scope', '$mdDialog', '$mdMedia', '$mdToast', DevelopmentController
  ]);
  function DevelopmentController( sodaService, $mdSidenav, $mdBottomSheet, $timeout, $log, $http , $scope, $mdDialog, $mdMedia, $mdToast, $window) {

    $scope.filter = {show: false}
    var map = null,mapClickPt = null,clicked = null,lat = 0, lng = 0;;
    var self = this;
    $scope.$watch(function() { return $mdMedia('xs'); }, function(xs) {
      self.xs = xs;
      console.log(self.xs);
      if ($window.innerHeight < 500) {
        self.xs = true;
      }
      if (map) {
        $timeout(function () {
          map.resize();
        }, 500);
      }
    });    
    $scope.selectedRows = [];
    self.toggleList = toggleSearch;
    self.query  = {
      order: '-submitted',
      limit: 10,
      page: 1
    };

    self.fromDate = new Date();
    self.fromDate = self.fromDate.setDate(self.fromDate.getDate() - 365);
    self.fromDate = new Date(self.fromDate);
    self.toDate = new Date();
    self.cluster = true;
    self.showTable = false;
    self.showMap = true;
    self.tableTop = "40%";
    self.toggleFilter = function () {
      self.showFilter = !self.showFilter;
    }
    self.toggleTable = function () {
      self.showTable = !self.showTable;
      if (window.innerWidth < 500 || window.innerHeight < 500) {
        self.showMap = !self.showMap;
        self.tableTop = "0";
        self.xs = true;
      }
      $timeout(function () {
        map.resize();
      });
    };
    self.toggleDataDisplay = function () {
      self.cluster = !self.cluster;
      var params = self.cluster ? self.layers : self.heatLayers;
      var layer = null;
      var layerName = "";
      for (var i = 0; i < params.length; i++) {
        layerName =  'cluster-' + i.toString();
        layer = map.getLayer(layerName);
        map.setPaintProperty(layerName, 'circle-color', params[i][1]);
        map.setPaintProperty(layerName, 'circle-radius', self.cluster ? 18 : 70);
        map.setPaintProperty(layerName, 'circle-blur', self.cluster ? 0 : 1);
        map.setFilter(layerName, i == 0 ?
          [">=", "point_count", params[i][0]] :
          ["all",
          [">=", "point_count", params[i][0]],
          ["<", "point_count", params[i - 1][0]]]);
        }
      };
      self.searches =
      [{name: 'Development Plans',
      id:'ym9a-r7eh',
      dateField: 'submitted',
      addressField: 'geocoded_planaddr',
      longitudeField: 'longitude_planaddr',
      latitudeField: 'latitude_planaddr',
      order: '-submitted',
      defaultDistance: {name: 'All'},
      columns: [
        {
          display: 'Plan #',
          name: 'plan_number',
          order:'plan_number'
        },
        {
          display: 'Plan Name',
          name: 'plan_name',
          order: 'plan_name'
        },
        {
          display: 'Plan Type',
          name: 'plan_type',
          order: 'plan_type'
        },
        {
          display: 'Submitted',
          name: 'submitted',
          order: 'submitted'
        },
        {
          display: 'Status',
          name: 'status',
          order: 'status'
        },
        {
          display: 'Zoning',
          name: 'zoning',
          order: 'zoning'
        },
        {
          display: 'CAC',
          name: 'cac',
          order: 'cac'
        },
        {
          display: 'Document',
          name: 'planurl'
        }
      ]},
      {name: 'Permits',
      id: '5q5u-xiqj',
      dateField: 'issueddate',
      addressField: 'geocoded_permaddr',
      longitudeField: 'longitude_perm',
      latitudeField: 'latitude_perm',
      order: '-issueddate',
      defaultDistance: {name: '1 mile'},
      columns: [
        {
          display: 'Permit #',
          name: 'permitnum',
          order: 'permitnum'
        },
        {
          display: 'Proposed Work',
          name: 'proposedworkdescription',
          order: 'proposedworkdescription'
        },
        {
          display: 'Authorized Work',
          name: 'workclass',
          order: 'workclass'
        },
        {
          display: 'Address',
          name: 'originaladdressfull',
          order: 'originaladdressfull'
        },
        {
          display: 'Issued',
          name: 'issueddate',
          order: 'issueddate'
        },
        {
          display: 'Owner',
          name: 'parcelownername',
          order: 'parcelownername'
        },
        {
          display: 'Contractor',
          name: 'contractorcompanyname',
          order: 'contractorcompanyname'
        },
        {
          display: 'Sq Footage',
          name: 'totalsqft',
          order: 'totalsqft'
        },
        {
          display: 'Cost',
          name: 'estprojectcost',
          order: 'estprojectcost'
        }
      ]}];
      self.distances = [{name: '1/4 mile', value: 402.335}, {name: '1/2 mile', value: 804.67}, {name: '1 mile', value: 1609.34}, {name: '2 miles', value: 3218.68}, {name: 'All', value: 0}];
      self.distanceChanged = function (distance) {
        if (distance > 0 && (self.selectedAddress || mapClickPt)) {
          bufferAddress((clicked) ? mapClickPt : self.selectedAddress);
        }
      }
      self.addressSearch = function(addressText){
        return $http.get("https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=ADDRESS&where=ADDRESSU like '"+addressText.toUpperCase()+"%'")
        .then(function(result){
          return result.data.features;
        })
      }

      self.selectedItemChange = function (address) {
        clicked = false;
        bufferAddress(address);
      }
      var bufferAddress = function (address) {
        if (address) {
          map.flyTo({
            center: [
              address.geometry.x, address.geometry.y
            ],
            zoom: 13
          });
          if (self.selectedDistance.value > 0) {
            lat = address.geometry.y;
            lng = address.geometry.x;
            var pt = {
              "type": "Feature",
              "properties": {},
              "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
              }
            };
            var unit = 'meters';
            var buffered = turf.buffer(pt, self.selectedDistance.value, unit);
            var result = turf.featurecollection([buffered, pt]);
            map.getSource('buffer').setData(result.features[0].features[0]);
            var bbox = turf.extent(result.features[0].features[0]);
            map.fitBounds([[
              bbox[0],
              bbox[1]
            ], [
              bbox[2],
              bbox[3]
            ]]);
            self.search();
          }
        }
      }
      self.rowSelected = function () {
        map.flyTo({
          center: [
            this.model[self.selectedSearch.longitudeField], this.model[self.selectedSearch.latitudeField]
          ],
          zoom: 17
        });
      }
      self.search = function () {
        self.promise =  $timeout(function () {
        }, 2000);
        sodaService.loadData(self.selectedSearch.id, self.selectedSearch.dateField, new moment(self.fromDate).format('YYYY-MM-DD'), new moment(self.toDate).format('YYYY-MM-DD'), self.selectedSearch.addressField, self.selectedDistance.value, lng, lat).then(function (data) {
          self.devplans = data;
          sodaService.dataToGeoJson(data, map, self.selectedSearch.longitudeField, self.selectedSearch.latitudeField, self.selectedSearch.columns, self.selectedSearch.dateField);
        });
      }
      self.showKey = function (e) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: KeyController,
          templateUrl: 'src/key.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          fullscreen: useFullScreen
        });
      }
  
      function KeyController($scope, $mdDialog) {
        $scope.tiles = [
          {title: 'ADMINISTRATIVE SITE REVIEW', icon: 'sitereview'}, {title: 'INFILL RECOMBINATION', icon: 'infill'}, {title: 'GROUP HOUSING', icon: 'grouphousing'}, {title: 'MASTER PLAN', icon:'masterplan'},
          {title: 'MINOR SUBDIVISION', icon:'minorsubdivision'}, {title: 'PLAN APPROVAL', icon: 'planapproval'}, {title: 'SHOPPING CENTER', icon: 'shoppingcenter'}, {title: 'SITE PLAN', icon: 'siteplan'},
          {title: 'SPECIAL USE', icon: 'specialuse'}, {title: 'SUBDIVISION', icon: 'subdivision'}
        ];
        $scope.hide = function() {
          $mdDialog.hide();
        };
        $scope.cancel = function() {
          $mdDialog.cancel();
        };
        $scope.answer = function(answer) {
          $mdDialog.hide(answer);
        };
      }
      $timeout(function (){
        createMap();
      }, 200);
      // *********************************
      // Internal methods
      // *********************************
      function toggleSearch() {
        $mdSidenav('left').toggle();

      }      
      var createMap = function () {

        mapboxgl.accessToken = 'pk.eyJ1IjoicmFsZWlnaGdpcyIsImEiOiJjaXByNWg3M2owNnMzZnRtMzdvZHY1MzRsIn0.LiwS3zOOc_i7vDCTiFXIrQ';    
        map = new mapboxgl.Map({
          container: 'map', // container id
          style: 'vector-tiles.json',
          pitch: 60,
          center: [-78.666, 35.777],
          zoom: 10});
          map.addControl(new mapboxgl.Navigation());
          map.addControl(new mapboxgl.Geolocate({position: 'top-left'}).on('geolocate', geoLocated));
          $timeout(function () {map.resize()});
          map.on('load', mapLoaded);
        }
        var mapLoaded = function () {
          map.addSource('buffer', {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": []
            }
          });
          map.addLayer({
            'id': 'buffer',
            'type': 'line',
            'source': 'buffer',
            'layout': {},
            'paint': {
              'line-color': '#FF0000',
              'line-width': 5,
            }
          });
          var pointSource = new mapboxgl.GeoJSONSource({
            data: {
              "type": "FeatureCollection",
              "features": []
            },
            cluster: true,
            clusterMaxZoom: 16, // Max zoom to cluster points on
            clusterRadius: 50 // Radius of each cluster when clustering points (
            });
            map.addSource('points', pointSource);
            map.addLayer({
              "id": "points",
              "type": "symbol",
              "source": "points",
              "layout": {
                "icon-image": "{marker-symbol}"
              },
              "paint": {},
              "interactive": true
            });
            // Cluster categories
            var highCount = 75,
            lowCount = 15;
            self.layers = [
              [150, '#f28cb1'],
              [20, '#f1f075'],
              [0, '#51bbd6']
            ];
            self.heatLayers = [
              [50, 'red'],
              [20, 'orange'],
              [0, 'green']
            ];
            self.layers.forEach(function (layer, i) {
              map.addLayer({
                "id": "cluster-" + i,
                "type": "circle",
                "source": "points",
                "paint": {
                  "circle-color": layer[1],
                  "circle-radius": 18
                },
                "filter": i == 0 ?
                [">=", "point_count", layer[0]] :
                ["all",
                [">=", "point_count", layer[0]],
                ["<", "point_count", self.layers[i - 1][0]]]
              });
            });
            map.addLayer({
              "id": "cluster-count",
              "type": "symbol",
              "source": "points",
              "layout": {
                "text-field": "{point_count}",
                "text-font": [
                  "Open Sans Semibold"
                ],
                "text-size": 12
              }
            });

            map.on('mousemove', mapMouseMove);
            map.on('click', mapClicked);
          }
          var geoLocated = function (e) {
            map.setPitch(60);
            if (self.selectedDistance.value > 0) {
              clicked = true;
              mapClickPt = {geometry: { x: data.coords.longitude, y: data.coords.latitude}};
              bufferAddress(mapClickPt);
            }
          }
          var mapMouseMove = function (e) {
            var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
            map.getCanvas().style.cursor = features.length ? 'pointer' : '';
          }
          var createPopup = function (features, map, popup) {
            var feature = features[0];
            var html = "";
            for (var i = 0;i < self.selectedSearch.columns.length;i++) {
              html += "<strong>"+self.selectedSearch.columns[i].display + "</strong> ";
              if (self.selectedSearch.columns[i].name === 'planurl') {
                html += "<a href='"+feature.properties[self.selectedSearch.columns[i].name] + "' target='_blank'>View</a><br/>";
              } else {
                html += feature.properties[self.selectedSearch.columns[i].name] +"<br/>"
              }
            }
            popup.setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);            
          }
          var mapClicked = function (e) {
            var popup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: true
            });               
            var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
            if (!features.length) {
              popup.remove();
              if (self.selectedDistance.value > 0) {
                clicked = true;
                lng = e.lngLat.lng;
                lat = e.lngLat.lat;
                mapClickPt = {attributes: {ADDRESS: " "} ,geometry: {x: e.lngLat.lng, y: e.lngLat.lat}};
                bufferAddress({geometry: {x: e.lngLat.lng, y: e.lngLat.lat}});
              }
              return;
            }
            createPopup(features, map, popup);
          }
        }
      })();