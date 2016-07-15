(function(){
  'use strict';

  angular.module('vector')
         .service('vectorService', ['$q', vectorService]);

  function vectorService($q){
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
          }
          return response.data;
        });
        return promise;
      }
    };
  }
})();
