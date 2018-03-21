(function () {
    'use strict';
    angular
        .module('development')
        .controller('DevelopmentController', [
            'sodaService', '$mdSidenav', '$timeout', '$http',
            '$scope', '$mdDialog', '$mdMedia', '$window', 'agolService', DevelopmentController
        ]);
    function DevelopmentController(sodaService, $mdSidenav, $timeout, $http, $scope, $mdDialog, $mdMedia, $window, agolService) {
        $scope.filter = {
            show: false
        };
        var map = null,
            mapClickPt = null,
            clicked = null,
            lat = 0,
            lng = 0;
        var self = this;
        $scope.$watch(function () {
            return $mdMedia('xs');
        }, function (xs) {
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
        self.searching = false;
        self.query = {
            order: 'properties.-submitted',
            limit: 10,
            page: 1
        };
        self.fromDate = new Date();
        self.fromDate = self.fromDate.setDate(self.fromDate.getDate() - 180);
        self.fromDate = new Date(self.fromDate);
        self.toDate = new Date();
        self.cluster = true;
        self.showTable = false;
        self.selectedDistance = {
            name: 'Greater than 2 miles',
            value: 0
        };
        $timeout(function () {
            self.showTable = $window.innerWidth >= 500 ? true : false;
        });
        self.showMap = true;
        self.tableTop = "40%";
        self.toggleFilter = function () {
            self.showFilter = !self.showFilter;
            $timeout(function () {
                document.getElementById("filterInput").focus();
                document.getElementById("filterInput").select();
            });
        };
        self.toggleTable = function () {
            self.showTable = !self.showTable;
            if ($window.innerWidth < 500 || $window.innerHeight < 500) {
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
            var layerName = "";
            var i = 0, layer = null;
            for (i = 0; i < params.length; i += 1) {
                layerName = 'cluster-' + i.toString();
                layer = map.getLayer(layerName);
                map.setPaintProperty(layerName, 'circle-color', params[i][1]);
                map.setPaintProperty(layerName, 'circle-radius', self.cluster ? 18 : 70);
                map.setPaintProperty(layerName, 'circle-blur', self.cluster ? 0 : 1);
                map.setFilter(layerName, i == 0 ? [">=", "point_count", params[i][0]] : ["all", [">=", "point_count", params[i][0]],
                    ["<", "point_count", params[i - 1][0]]
                ]);
            }
        };
        self.searches = [{
            name: 'Development Plans',
            id: '437m-z3m8',
            url: 'https://services.arcgis.com/v400IkDOw1ad7Yad/ArcGIS/rest/services/Development_Plans/FeatureServer/0',
            dateField: 'submitted',
            statusField: 'status',
            addressField: 'geocoded_planaddr',
            longitudeField: 'longitude_planaddr',
            latitudeField: 'latitude_planaddr',
            defaultDistance: {
                name: 'Greater than 2 miles'
            },
            columns: [{
                display: 'Plan #',
                name: 'plan_number',
                order: 'properties.plan_number'
            }, {
                display: 'Plan Name',
                name: 'plan_name',
                order: 'properties.plan_name'
            }, {
                display: 'Plan Type',
                name: 'plan_type',
                order: 'properties.plan_type'
            }, {
                display: 'Submitted',
                name: 'submitted',
                order: 'properties.submitted'
            }, {
                display: 'Approved',
                name: 'approved',
                order: 'properties.approved'
            }, {
                display: 'Status',
                name: 'status',
                order: 'properties.status'
            }, {
                display: 'Zoning',
                name: 'zoning',
                order: 'properties.zoning'
            }, {
                display: 'CAC',
                name: 'cac',
                order: 'properties.cac'
            }, {
                display: 'Document',
                name: 'planurl'
            }],
            statuses: [
                {name: 'Active', definition: 'Development plans have been approved'},
                {name: 'Pending', definition: 'Development plans have been approved and pending administrative approval'},
                {name: 'Review In Progress', definition: 'Development plans are going through the plan review process'},
                {name: 'Withdrawn', definition: 'Development plans have been withdrawn from plan review'}
            ]
        }, {
            name: 'Permits',
            id: 'xce4-kemu',
            url: 'https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/Building_Permits/FeatureServer/0',
            dateField: 'applieddate',
            statusField: 'statuscurrentmapped',
            addressField: 'geocoded_permaddr',
            longitudeField: 'longitude_perm',
            latitudeField: 'latitude_perm',
            defaultDistance: {
                name: '1 mile'
            },
            columns: [{
                display: 'Permit #',
                name: 'permitnum',
                order: 'properties.permitnum'
            }, {
                display: 'Proposed Work',
                name: 'proposedworkdescription',
                order: 'properties.proposedworkdescription'
            }, {
                display: 'Authorized Work',
                name: 'workclass',
                order: 'properties.workclass'
            }, {
                display: 'Address',
                name: 'originaladdress1',
                order: 'properties.originaladdress1'
            }, {
                display: 'Status',
                name: 'statuscurrentmapped',
                order: 'properties.statuscurrentmapped'
            }, {
                display: 'Applied',
                name: 'applieddate',
                order: 'properties.-applieddate'
            }, {
                display: 'Issued',
                name: 'issueddate',
                order: 'properties.-issueddate'
            }, {
                display: 'Owner',
                name: 'parcelownername',
                order: 'properties.parcelownername'
            }, {
                display: 'Contractor',
                name: 'contractorcompanyname',
                order: 'properties.contractorcompanyname'
            }, {
                display: 'Sq Footage',
                name: 'totalsqft',
                order: 'properties.totalsqft'
            }, {
                display: 'Cost',
                name: 'estprojectcost',
                order: 'properties.estprojectcost'
            }],
            statuses: [
                {name: 'Permit Finaled', definition: 'Permits have been approved and pending payment'},
                {name: 'Permit Issued', definition: 'Permit fees have been paid and permits issued'}, 
                {name: 'In Review', definition: 'Permits for the project are going through the plan review process'}, 
                {name: 'Occupancy', definition: 'All inspections have been finaled/completed and Certificate of Occupancy issued'}, 
                {name: 'Permit Cancelled', definition: 'Permits have been voided/cancelled after issuance and are no longer valid'}
            ]
        }];
        self.distances = [{
            name: '1/4 mile',
            value: 402.335
        }, {
            name: '1/2 mile',
            value: 804.67
        }, {
            name: '1 mile',
            value: 1609.34
        }, {
            name: '2 miles',
            value: 3218.68
        }, {
            name: 'Greater than 2 miles',
            value: 0
        }];
        self.distanceChanged = function (distance) {
            if (distance > 0 && (self.selectedAddress || mapClickPt)) {
                self.bufferAddress((clicked) ? mapClickPt : self.selectedAddress);
            }
        };
        self.addressSearch = function (addressText) {
            return $http.get("https://maps.raleighnc.gov/arcgis/rest/services/Addresses/MapServer/0/query?returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=ADDRESS&where=ADDRESSU like '" + addressText.toUpperCase() + "%'")
                .then(function (result) {
                    return result.data.features;
                });
        };
        self.selectedItemChange = function (address) {
            clicked = false;
            self.bufferAddress(address);
        };
        self.bufferAddress = function (address) {
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
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "Point",
                            coordinates: [lng, lat]
                        }
                    };
                    var unit = 'meters';
                    var buffered = turf.buffer(pt, self.selectedDistance.value, unit);
                    var result = turf.featurecollection([buffered, pt]);
                    //map.getSource('buffer').setData(result.features[0].features[0]);
                    
                    map.getSource('buffer').setData(self.createGeoJSONCircle([lng, lat], self.selectedDistance.value).data);
                    var bbox = turf.extent(result.features[0].features[0]);
                    map.fitBounds([
                        [
                            bbox[0],
                            bbox[1]
                        ],
                        [
                            bbox[2],
                            bbox[3]
                        ]
                    ]);
                    self.search();
                }
            }
        };
        self.rowSelected = function () {
            map.flyTo({
                center: this.model.geometry.coordinates,
                zoom: 17
            });
            if (self.xs) {
                self.showMap = true;
                self.showTable = false;
                $timeout(function () {
                    map.resize();
                });
            }
        };
        self.searchTypeChanged = function () {
            self.selectedStatus = self.selectedSearch.statuses;
            self.search();
        };
        self.search = function () {
            if (map && !self.searching) {
                self.promise = $timeout(function () {
                    console.log('loaded');
                }, 2000);
                self.searching = true;
                // sodaService.loadData(self.selectedSearch.id, self.selectedSearch.dateField, self.selectedSearch.statusField, moment(self.fromDate).format('YYYY-MM-DD'), moment(self.toDate).format('YYYY-MM-DD'), self.selectedStatus, self.selectedSearch.addressField, self.selectedDistance.value, lng, lat).then(function (data) {
                //     self.devplans = data;
                //     sodaService.dataToGeoJson(data, map, self.selectedSearch.longitudeField, self.selectedSearch.latitudeField, self.selectedSearch.columns, self.selectedSearch.dateField);
                //     self.searching = false;
                // });
                agolService.loadData(self.selectedSearch.url, self.selectedSearch.dateField, self.selectedSearch.statusField, moment(self.fromDate).format('YYYY-MM-DD'), moment(self.toDate).format('YYYY-MM-DD'), self.selectedStatus, self.selectedSearch.addressField, self.selectedDistance.value, lng, lat).then(function (data) {
                    self.devplans = data.features;
                    agolService.dataToGeoJson(data, map, self.selectedSearch.longitudeField, self.selectedSearch.latitudeField, self.selectedSearch.columns, self.selectedSearch.dateField);
                    self.searching = false;
                });
            }
        };
        self.showKey = function () {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: KeyController,
                templateUrl: 'src/key.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            });
        };
        self.showStatusDefinitions = function () {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: StatusController,
                templateUrl: 'src/status.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            });
        };        
        self.linkClicked = function (e) {
            console.log(e);
        };
        function KeyController($scope, $mdDialog) {
            $scope.tiles = [{
                title: 'ADMINISTRATIVE SITE REVIEW',
                icon: 'sitereview'
            }, {
                title: 'INFILL RECOMBINATION',
                icon: 'infill'
            }, {
                title: 'GROUP HOUSING',
                icon: 'grouphousing'
            }, {
                title: 'MASTER PLAN',
                icon: 'masterplan'
            }, {
                title: 'MINOR SUBDIVISION',
                icon: 'minorsubdivision'
            }, {
                title: 'PLAN APPROVAL',
                icon: 'planapproval'
            }, {
                title: 'SHOPPING CENTER',
                icon: 'shoppingcenter'
            }, {
                title: 'SITE PLAN',
                icon: 'siteplan'
            }, {
                title: 'SPECIAL USE',
                icon: 'specialuse'
            }, {
                title: 'SUBDIVISION',
                icon: 'subdivision'
            }, {
                title: 'PERMIT',
                icon: 'permit'
            }];
            $scope.hide = function () {
                $mdDialog.hide();
            };
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };
        };
        function StatusController($scope, $mdDialog) {
            $scope.definitions = self.selectedSearch.statuses;
            $scope.hide = function () {
                $mdDialog.hide();
            };
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.answer = function (answer) {
                $mdDialog.hide(answer);
            };
        };        
        $timeout(function () {
            self.createMap();
        }, 200);
        // *********************************
        // Internal methods
        // *********************************
        self.toggleList = function () {
            $mdSidenav('left').toggle();
        };
        self.createMap = function () {
            mapboxgl.accessToken = 'pk.eyJ1IjoicmFsZWlnaGdpcyIsImEiOiJjaXByNWg3M2owNnMzZnRtMzdvZHY1MzRsIn0.LiwS3zOOc_i7vDCTiFXIrQ';
            map = new mapboxgl.Map({
                container: 'map', // container id
                style: 'vector-tiles.json',
                pitch: 0,
                center: [-78.666, 35.83],
                zoom: 10,
                maxZoom: 18,
                minZoom: 9
            });
            map.addControl(new mapboxgl.Navigation());
            map.addControl(new mapboxgl.Geolocate({
                position: 'top-left'
            }).on('geolocate', self.geoLocated));
            $timeout(function () {
                map.resize();
            });
            map.on('load', self.mapLoaded);
        };
        self.toggleImagery = function () {
            self.showImage = !self.showImage;
            if (!self.showImage) {
                map.removeLayer('wms-test-layer');
            } else {
                map.addLayer({
                    id: 'wms-test-layer',
                    type: 'raster',
                    source: 'wms-test',
                    paint: {}
                }, 'poi_label');
            }
        };
        self.mapLoaded = function () {
            map.addSource('wms-test', {
                type: 'raster',
                tiles: [
                    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256
            });
            // map.addLayer({
            //     'id': 'wms-test-layer',
            //     'type': 'raster',
            //     'source': 'wms-test',
            //     'paint': {}
            // }, 'aeroway-taxiway');
            map.addSource('buffer', {
                type: 'geojson',
                data: {
                    type: "FeatureCollection",
                    features: []
                }
            });
            map.addLayer({
                id: 'buffer',
                type: 'line',
                source: 'buffer',
                layout: {},
                paint: {
                    "line-color": '#FF0000',
                    "line-width": 5
                }
            });
            var pointSource = new mapboxgl.GeoJSONSource({
                data: {
                    type: "FeatureCollection",
                    features: []
                },
                cluster: true,
                clusterMaxZoom: 16, // Max zoom to cluster points on
                clusterRadius: 50 // Radius of each cluster when clustering points (
            });
            map.addSource('points', pointSource);
            map.addLayer({
                id: "points",
                type: "symbol",
                source: "points",
                layout: {
                    "icon-image": "{marker-symbol}"
                },
                paint: {},
                interactive: true
            });
            // Cluster categories
            // var highCount = 75,
            //     lowCount = 15;
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
                    id: "cluster-" + i,
                    type: "circle",
                    source: "points",
                    paint: {
                        "circle-color": layer[1],
                        "circle-radius": 18
                    },
                    filter: i == 0 ? [">=", "point_count", layer[0]] : ["all", [">=", "point_count", layer[0]],
                        ["<", "point_count", self.layers[i - 1][0]]
                    ]
                });
            });
            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "points",
                layout: {
                    "text-field": "{point_count}",
                    "text-font": [
                        "Open Sans Semibold"
                    ],
                    "text-size": 12
                }
            });
            map.on('mousemove', self.mapMouseMove);
            map.on('click', self.mapClicked);
            self.search();
        };
        self.createGeoJSONCircle = function (center, radiusInKm, points) {
            if (!points) {
                points = 64;
            }
            var i = 0;
            var coords = {
                latitude: center[1],
                longitude: center[0]
            };
            var km = radiusInKm / 1000;
            var ret = [];
            var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
            var distanceY = km / 110.574;
            var theta, x, y;
            for (i = 0; i < points; i += 1) {
                theta = (i / points) * (2 * Math.PI);
                x = distanceX * Math.cos(theta);
                y = distanceY * Math.sin(theta);
                ret.push([coords.longitude + x, coords.latitude + y]);
            }
            ret.push(ret[0]);
            return {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: [{
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [ret]
                        }
                    }]
                }
            };
        };
        self.geoLocated = function (e) {
            map.setPitch(60);
            if (self.selectedDistance.value > 0) {
                clicked = true;
                mapClickPt = {
                    geometry: {
                        x: e.coords.longitude,
                        y: e.coords.latitude
                    }
                };
                self.bufferAddress(mapClickPt);
            }
        };
        self.mapMouseMove = function (e) {
            var features = map.queryRenderedFeatures(e.point, {
                layers: ['points']
            });
            map.getCanvas().style.cursor = features.length ? 'pointer' : '';
        };
        var popupId = 0;
        var popup = null;
        var popupFeatures = [];
        self.createPopup = function (features, map, popup, id) {
            var feature = features[id];
            popupFeatures = features;
            //popupId = 0;
            var html = "";
            var i = 0;
            for (i = 0; i < self.selectedSearch.columns.length; i += 1) {
                if (self.selectedSearch.columns[i].name === 'planurl') {
                    if (feature.properties[self.selectedSearch.columns[i].name]) {
                        html += "<strong>" + self.selectedSearch.columns[i].display + "</strong> ";
                        html += "<a href='" + feature.properties[self.selectedSearch.columns[i].name] + "' target='_blank'>View</a><br/>";
                    }
                } else {
                    html += "<strong>" + self.selectedSearch.columns[i].display + "</strong> ";
                    if (self.selectedSearch.columns[i].display === 'Cost') {
                        html += '$';
                    }
                    html += feature.properties[self.selectedSearch.columns[i].name] + "<br/>";
                }
            }
            if (features.length > 1) {
                html += "<a id='prev' href='javascript:void(0)'>Previous</a><span>           </span>";
                html += "<a id='next' href='javascript:void(0)'>Next</a>";
            }
            popup.setLngLat(feature.geometry.coordinates)
                .setHTML(html)
                .addTo(map);
            var nextTag = document.getElementById("next");
            if (nextTag) {
                nextTag.onclick = function () {
                    if (popupId === popupFeatures.length - 1) {
                        popupId = 0;
                    } else {
                        popupId += 1;
                    }
                    self.createPopup(popupFeatures, map, popup, popupId);
                };
            }
            var prevTag = document.getElementById("prev");
            if (prevTag) {
                prevTag.onclick = function () {
                    if (popupId === 0) {
                        popupId = popupFeatures.length - 1;
                    } else {
                        popupId -= 1;
                    }
                    self.createPopup(popupFeatures, map, popup, popupId);
                };
            }
        };
        var setBufferDistance = function (zoom) {
            if (zoom >= 9 && zoom < 10) {
                return 800;
            }
            if (zoom >= 10 && zoom < 11) {
                return 500;
            }
            if (zoom >= 11 && zoom < 12) {
                return 300;
            }
            if (zoom >= 12 && zoom < 13) {
                return 160;
            }
            if (zoom >= 13 && zoom < 14) {
                return 130;
            }
            if (zoom >= 14 && zoom < 15) {
                return 100;
            }
            if (zoom >= 15 && zoom < 16) {
                return 70;
            }
            if (zoom >= 16 && zoom < 17) {
                return 40;
            }
            if (zoom >= 17) {
                return 10;
            }
        };
        self.mapClicked = function (e) {
            popup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true
            });
            var pt = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Point",
                    coordinates: [e.lngLat.lng, e.lngLat.lat]
                }
            };
            setBufferDistance(map.getZoom());
            var distance = setBufferDistance(map.getZoom());
            console.log(distance);
            var buffered = turf.buffer(pt, distance, 'meters');
            var envelope = turf.envelope(buffered);
            //map.getSource('buffer').setData(envelope);
            var i = 0, features = [];
            for (i = 0; i < map.getSource('points')._data.features.length; i += 1) {
                if (turf.inside(map.getSource('points')._data.features[i], envelope)) {
                    features.push(map.getSource('points')._data.features[i]);
                }
            }
            if (!features.length) {
                popup.remove();
                if (self.selectedDistance.value > 0) {
                    clicked = true;
                    lng = e.lngLat.lng;
                    lat = e.lngLat.lat;
                    mapClickPt = {
                        attributes: {
                            ADDRESS: " "
                        },
                        geometry: {
                            x: e.lngLat.lng,
                            y: e.lngLat.lat
                        }
                    };
                    self.bufferAddress({
                        geometry: {
                            x: e.lngLat.lng,
                            y: e.lngLat.lat
                        }
                    });
                }
                return;
            }
            self.createPopup(features, map, popup, 0);
        };
    }
})();