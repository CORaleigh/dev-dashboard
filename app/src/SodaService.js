(function(){
  'use strict';

  angular.module('soda')
         .service('sodaService', ['$q', '$http', SodaService]);

  function SodaService($q, $http){
    return {
      loadData: function (id, dateField, statusField, fromDate, toDate, status, addressField, distance, lng, lat) {
        var where = dateField + " >= '"+fromDate+"' and " + dateField + " <= '"+toDate + "'";
        var i = 0;
        if (distance > 0) {
          where += " and within_circle(" + addressField + "," + lat + "," + lng + "," + distance + ")";
        }
    
        if (status.length > 0) {
          where += " and (";
          for (i = 0; i < status.length; i += 1) {
            if (i > 0) {
              where +=  " or ";
            } 
            where += statusField + " = '" + status[i].name + "'";             
          }
          where += ")";
        } else {
          where += " and " + statusField + " = 'NONE'";
        }
        var promise = $http({
            url: 'https://data.raleighnc.gov/resource/'+id+'.json', 
            method: "GET",
            params: {
              '$where': where,
              '$limit': 2000,
              '$order': dateField + ' DESC'
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
            // if (data[i]['planurl_approved']) {
            //   data[i].planurl = data[i]['planurl_approved'];
            // }              
          }
          return response.data;
        });
        return promise;
      },
      dataToGeoJson: function (data, map, longitudeField, latitudeField, columns, dateField) {
        if (map.getSource('points')) {  
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
                  pt.properties['marker-symbol'] = 'permit';
                break;     
              }
            } else {
              pt.properties['marker-symbol'] = 'permit';
            }
            for(var j = 0;j < columns.length;j++) {
              if (columns[j].name === dateField) {
                pt.properties[columns[j].name] = moment(data[i][columns[j].name]).format('LL');
              }
              else if (columns[j].name != "planurl") {
                if (!data[i][columns[j].name]) {
                  data[i][columns[j].name] = " ";
                }
                pt.properties[columns[j].name] = data[i][columns[j].name];
              } else {
                if (data[i][columns[j].name]) {
                  pt.properties[columns[j].name] = data[i][columns[j].name].url;
                }
                if (data[i]['planurl_approved']) {
                  pt.properties[columns[j].name] = data[i]['planurl_approved'].url;
                }              
              }
            }
            geojson.features.push(pt);
          }
          map.getSource('points').setData(geojson);
        }
      }
    };
  }
})();
