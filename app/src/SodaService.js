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
      dataToGeoJson: function (data, map, longitudeField, latitudeField, columns) {
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
          if (data[i].plan_type) {
            switch (data[i].plan_type) {
              case 'SITE PLAN':
                pt.properties['marker-symbol'] = 'siteplan';  
              break;
              case 'SUBDIVISION':
                pt.properties['marker-symbol'] = 'subdivision';
              break;
              case 'SPECIAL USE':
                pt.properties['marker-symbol'] = 'specialuse';
              break;
              case 'MASTER PLAN':
                pt.properties['marker-symbol'] = 'masterplan';
              break;
              case 'GROUP HOUSING':
                pt.properties['marker-symbol'] = 'grouphousing'; 
              break;
              case 'PLAN APPROVAL':
                pt.properties['marker-symbol'] = 'planapproval'; 
              break;
              case 'MINOR SUBDIVISION':
                pt.properties['marker-symbol'] = 'minorsubdivision';
              break;
              case 'SHOPPING CENTER':
                pt.properties['marker-symbol'] = 'shoppingcenter';
              break;
              case 'INFILL RECOMBINATION':
                pt.properties['marker-symbol'] = 'infill';
              break;
              case 'ADMINISTRATIVE SITE REVIEW':
                pt.properties['marker-symbol'] = 'sitereview';
              break;                
              default:
                pt.properties['marker-symbol'] = 'marker-15';
              break;     
            }
          } else {
            pt.properties['marker-symbol'] = 'marker-15';
          }
          for(var j = 0;j < columns.length;j++) {
            if (columns[j].name != "planurl" && columns[j].name != "order") {
              if (!data[i][columns[j].name]) {
                data[i][columns[j].name] = " ";
              }
              pt.properties[columns[j].name] = data[i][columns[j].name];
            }
          }
          geojson.features.push(pt);
        }
        map.getSource('points').setData(geojson);
      }
    };
  }

})();
