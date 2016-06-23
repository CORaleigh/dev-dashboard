(function(){
  'use strict';

  angular.module('soda')
         .service('sodaService', ['$q', '$http', SodaService]);

  function SodaService($q, $http){
    return {
      loadData: function (id, dateField, fromDate, toDate, addressField, distance, lng, lat) {
        var where = dateField + " >= '"+fromDate+"' and " + dateField + " <= '"+toDate + "'";
        if (distance > 0) {
          where += " and within_circle(" + addressField + "," + lat + "," + lng + "," + distance + ")";
        }
        var promise = $http({
            url: 'https://data.raleighnc.gov/resource/'+id+'.json', 
            method: "GET",
            params: {
              '$where': where
            }
         }).then(function (response) {
          var data = response.data;
          for (var i = 0;i < data.length; i++) {
            if (data[i].estprojectcost) {
              data[i].estprojectcost = parseInt(data[i].estprojectcost);
            } 
            if (data[i].totalsqft) {
              data[i].totalsqft = parseInt(data[i].totalsqft);
            }
          }
          return response.data;
        });
        return promise;
      },
      dataToGeoJson: function (data, map, longitudeField, latitudeField) {
        var geojson = {
             "type": "FeatureCollection",
             "features": []
         };
        var pt = {};
        for (var i =0; i < data.length;i++) {
          pt = {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Point",
              "coordinates": [data[i][longitudeField], data[i][latitudeField]]
            }
          };
          geojson.features.push(pt);
        }
        map.getSource('points').setData(geojson);
      }
    };
  }

})();
