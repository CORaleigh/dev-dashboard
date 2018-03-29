(function(){
  'use strict';

  angular.module('agol')
         .service('agolService', ['$q', '$http', AgolService]);

  function AgolService($q, $http){
    return {
      loadData: function (url, dateField, statusField, fromDate, toDate, status, addressField, distance, lng, lat) {
        var where = dateField + " >= '"+fromDate+"' and " + dateField + " <= '"+toDate + "'";
        var i = 0;
        var params = {
          //'$limit': 5000,
          'resultRecordCount': 2000,
          'orderByFields': dateField + ' DESC',
          'returnGeometry': true,
          'f': 'geojson',
          'outFields': '*',
          'outSR': 4326
        };
        if (distance > 0) {
          params.distance = distance;
          params.inSR = 4326;
          params.spatialRel = 'esriSpatialRelContains',
          params.geometry = lng + ',' + lat,
          params.geometryType =  'esriGeometryPoint'
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
        params.where = where;
        var promise = $http({
            url: url + '/query', 
            method: "GET",
            params: params
         }).then(function (response) {
          var data = response.data.features;
          
          for (var i = 0;i < data.length; i++) {
            if (data[i].properties.estprojectcost) {
              data[i].properties.estprojectcost = parseInt(data[i].estprojectcost);
            } 
            if (data[i].properties.totalsqft) {
              data[i].properties.totalsqft = parseInt(data[i].properties.totalsqft);
            }
            if (data[i].properties['planurl_approved']) {
              data[i].properties.planurl = data[i].properties['planurl_approved'];
            }              
          }
          return response.data;
        });
        return promise;
      },
      dataToGeoJson: function (data, map, longitudeField, latitudeField, columns, dateField) {
        console.log(data);
        if (map.getSource('points')) {  
          var geojson = data;
          var pt = null;
          for (var i = 0;i < geojson.features.length;i++) {
            pt = geojson.features[i];
            if (pt.properties.plan_type) {
              switch (pt.properties.plan_type) {
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
          }
          if (geojson.features.length > 0) {
            for(var j = 0;j < columns.length;j++) {
              // debugger
              // if (columns[j].name === dateField) {
              //   pt.properties[columns[j].name] = moment(pt.properties[columns[j].name]).format('LL');
              // }
              //else 
              if (columns[j].name != "planurl") {
                if (!pt.properties[columns[j].name]) {
                  pt.properties[columns[j].name] = " ";
                }
                pt.properties[columns[j].name] = pt.properties[columns[j].name];
              } else {
                if (pt.properties[columns[j].name]) {
                  pt.properties[columns[j].name] = pt.properties[columns[j].name].url;
                }
                if (pt.properties['planurl_approved']) {
                  pt.properties[columns[j].name] = pt.properties['planurl_approved'].url;
                }              
              }
            }
          }

          var filtered = geojson.features.filter(function (f) {
            return (f.geometry);
          });
          var mapData = geojson;
          mapData.features = filtered;
          console.log(mapData)
          map.getSource('points').setData(mapData);
        }
      }
    };
  }
})();
