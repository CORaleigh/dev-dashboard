(function(){

  angular
       .module('key')
       .controller('KeyController', [ 
          KeyController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function KeyController( ) {
    self = this;
    self.tiles = [
      {title: 'Subdivision'}
    ];
  }
})