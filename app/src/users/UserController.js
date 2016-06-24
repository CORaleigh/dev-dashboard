(function(){

  angular
       .module('users')
       .controller('UserController', [
          'userService', 'sodaService', '$mdSidenav', '$mdBottomSheet', '$timeout', '$log', '$http',
          '$scope', UserController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function UserController( userService, sodaService, $mdSidenav, $mdBottomSheet, $timeout, $log, $http , $scope) {
      $scope.options = {
    rowSelection: true,
    multiSelect: false,
    autoSelect: true,
    decapitate: false,
    largeEditDialog: false,
    boundaryLinks: false,
    limitSelect: true,
    pageSelect: true
  };


    $scope.filter = {show: false}
    var map = null;
    var self = this;
    $scope.selectedRows = [];
    self.users = [ ];
    self.query  = {
            order: '-submitted',
            limit: 10,
            page: 1
        };
    self.selectUser   = selectUser;
    self.toggleList   = toggleUsersList;
    self.makeContact  = makeContact;
    self.fromDate = new Date();
    self.fromDate = self.fromDate.setDate(self.fromDate.getDate() - 365);
    self.fromDate = new Date(self.fromDate);
    self.toDate = new Date();
    self.showTable = false;
    self.showMap = true;
    self.tableTop = "50%"
    self.toggleTable = function () {
      self.showTable = !self.showTable;
      if (window.innerWidth < 500) {
        self.showMap = !self.showMap;
        self.tableTop = "0";
      }
      $timeout(function () {
        map.resize();
      });
      console.log('toggle')
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
      if (distance > 0 && self.selectedAddress) {
        self.selectedItemChange(self.selectedAddress);
      }
    }
    self.addressSearch = function(addressText){
      return $http.get("https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=ADDRESS&where=ADDRESSU like '"+addressText.toUpperCase()+"%'")
      .then(function(result){
        return result.data.features;
      })
    }
    var lat = 0, lng = 0;
    self.selectedItemChange = function (address) {
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
          //var bbox = turf.bbox(result.features[0].features[0]);
          //console.log(bbox);
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
    // Load all registered users

    userService
          .loadAllUsers()
          .then( function( users ) {
            self.users    = [].concat(users);
            self.selected = users[0];
          });

    self.search = function () {
      self.promise =  $timeout(function () {

      }, 2000);
      sodaService.loadData(self.selectedSearch.id, self.selectedSearch.dateField, new moment(self.fromDate).format('YYYY-MM-DD'), new moment(self.toDate).format('YYYY-MM-DD'), self.selectedSearch.addressField, self.selectedDistance.value, lng, lat).then(function (data) {
        self.devplans = data;
        sodaService.dataToGeoJson(data, map, self.selectedSearch.longitudeField, self.selectedSearch.latitudeField, self.selectedSearch.columns, self.selectedSearch.dateField);
      });
    }
  self.maploaded = false;
  mapboxgl.accessToken = 'pk.eyJ1IjoicmFsZWlnaGdpcyIsImEiOiJjaXByNWg3M2owNnMzZnRtMzdvZHY1MzRsIn0.LiwS3zOOc_i7vDCTiFXIrQ';
  $timeout(function () {
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/raleighgis/cipspt1jp000kbkm4ld3cntvd',
        pitch: 60,
        center: [-78.666, 35.777],
        zoom: 10
    });
    map.addControl(new mapboxgl.Navigation()); 
    map.addControl(new mapboxgl.Geolocate({position: 'top-left'}));    
    $timeout(function () {map.resize()}); 
    map.on('load', function () {

      
      map.addSource('buffer', {
          'type': 'geojson',
          'data': {
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
    var layers = [
        [150, '#f28cb1'],
        [20, '#f1f075'],
        [0, '#51bbd6']
    ];

    layers.forEach(function (layer, i) {
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
                    ["<", "point_count", layers[i - 1][0]]]
        });
    });    
    map.addLayer({
        "id": "cluster-count",
        "type": "symbol",
        "source": "points",
        "layout": {
            "text-field": "{point_count}",
            "text-font": [
                    "DIN Offc Pro Medium",
                    "Arial Unicode MS Bold"
                ],
            "text-size": 12
        }
    });  
    var popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false
    });        
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });

        if (!features.length) {
            popup.remove();
            return;
        }

        var feature = features[0];

        // Populate the popup and set its coordinates
        // based on the feature found.
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
    });                  
    });
  }, 200);
  window.onresize = function(event) {
   // map.resize();
  };  
    // *********************************
    // Internal methods
    // *********************************

    /**
     * Hide or Show the 'left' sideNav area
     */
    function toggleUsersList() {
      $mdSidenav('left').toggle();

    }

    /**
     * Select the current avatars
     * @param menuId
     */
    function selectUser ( user ) {
      self.selected = angular.isNumber(user) ? $scope.users[user] : user;
    }

    /**
     * Show the Contact view in the bottom sheet
     */
    function makeContact(selectedUser) {

        $mdBottomSheet.show({
          controllerAs  : "vm",
          templateUrl   : './src/users/view/contactSheet.html',
          controller    : [ '$mdBottomSheet', ContactSheetController],
          parent        : angular.element(document.getElementById('content'))
        }).then(function(clickedItem) {
          $log.debug( clickedItem.name + ' clicked!');
        });

        /**
         * User ContactSheet controller
         */
        function ContactSheetController( $mdBottomSheet ) {
          this.user = selectedUser;
          this.items = [
            { name: 'Phone'       , icon: 'phone'       , icon_url: 'assets/svg/phone.svg'},
            { name: 'Twitter'     , icon: 'twitter'     , icon_url: 'assets/svg/twitter.svg'},
            { name: 'Google+'     , icon: 'google_plus' , icon_url: 'assets/svg/google_plus.svg'},
            { name: 'Hangout'     , icon: 'hangouts'    , icon_url: 'assets/svg/hangouts.svg'}
          ];
          this.contactUser = function(action) {
            // The actually contact process has not been implemented...
            // so just hide the bottomSheet

            $mdBottomSheet.hide(action);
          };
        }

    }

  }

})();
