/*
 * This controller will take care of parsing the data from json file
 */

var jsonFileUrl = drupalSettings.path.baseUrl + 'dashpage/angular/json/22/33/44';
// var jsonFileUrl = drupalSettings.path.baseUrl + 'modules/custom/dashpage/angular/mildderjson.json';
var pathArg = drupalSettings.path.currentPath.split('/');

var pageInfoBaseControllers = angular.module('pageInfoBase', ['flexxiaChartsnewjs', 'ngMaterial', 'datatables', 'ngResource', 'datatables.buttons', 'ngSanitize']);

pageInfoBaseControllers.controller('PageInfoBaseController', ['$scope', '$timeout', '$http', '$mdDialog', '$mdMedia', '$filter', '$sce',
  function($scope, $timeout, $http, $mdDialog, $mdMedia, $filter, $sce) {
    $scope.$sce = $sce;
    var spinner = new Spinner(spinOptions).spin(document.getElementById('center'));
    angular.element(document).ready(function() {
      $scope.pageData = null;

      if ((drupalSettings.path.currentPath.indexOf("manageinfo/") > -1) && (drupalSettings.path.currentPath.indexOf("/table") > -1)) {
        jsonFileUrl = drupalSettings.path.baseUrl + drupalSettings.path.currentPath.replace("table", "json");
      }

      $http({
        method: 'GET',
        url: jsonFileUrl
      }).then(function (response) {

        (drupalSettings.path.currentPath.indexOf("dashpage/") > -1)
        if (typeof drupalSettings.dashpage !== 'undefined') {
          $scope.pageData = drupalSettings.dashpage.dashpageData.objectContentData;
        }

        if ((drupalSettings.path.currentPath.indexOf("manageinfo/") > -1)
          && (typeof drupalSettings.manageinfo !== 'undefined')
          && (typeof drupalSettings.manageinfo.manageinfoTable !== 'undefined')
          && (typeof drupalSettings.manageinfo.manageinfoTable.jsonContentData !== 'undefined')) {
          $scope.pageData = drupalSettings.manageinfo.manageinfoTable.jsonContentData;
        }

        if ((drupalSettings.path.currentPath.indexOf("manageinfo/") > -1) && (drupalSettings.path.currentPath.indexOf("/table") > -1)) {
          $scope.pageData = response.data;
        }

        $timeout(function() {
          var blockHeight = jQuery('.path-dashpage').height(); // height of sidebar equal to page height
          var tableHeight = jQuery('#charts-section').height(); // height of sidebar equal to page height
          jQuery('.sidebar-nav').css("height", blockHeight);


        });
        spinner.stop();
      },function (error) {
        // if error occurs
      });
    });

    $scope.checkBrowser = function() {
      var isChrome = !!window.chrome && !!window.chrome.webstore;
      var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
      if (!isChrome) {
        if (!isSafari) {
          $mdDialog.show({
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            scope: $scope,
            preserveScope: true,
            template: '<md-dialog flex="25">' +
            '<md-dialog-content class="onetime-browser-alert padding-24">' +
            '  <h2>Before We Continue</h2>The Dashboard performs best using updated safari or Chrome Browser' +
            '</md-dialog-content>' +
            '<div class="md-actions">' +
            '  <md-button ng-click="closeDialog()" class="md-primary pageinfo-btn-saved">' +
            '    Got it' +
            '  </md-button>' +
            '</div>' +
            '</md-dialog>',
            controller: function DialogController($scope, $mdDialog) {
              $scope.closeDialog = function() {
                $mdDialog.hide();
              }
            }
          });
        }
      }
    }
  }
]);

/* SaveAsPng Controller */
pageInfoBaseControllers.controller('SaveAsPng', SaveImageAsPng);
function SaveImageAsPng($scope, $sce) {

  // Open Menu to save blocks
  $scope.openMenu = function($mdOpenMenu, ev) {
    var originatorEv = ev;
    $mdOpenMenu(ev);
  };

  // save the block as .png
  $scope.saveAsPng = function(blockType, blockTid) {
    var blockId = 'block' + '-' + blockType + '-' + blockTid;
    var buttonId = 'save' + '-' + blockType + '-' + blockTid;

    var blockElement = document.getElementById(blockId);
    jQuery("#" + buttonId).css("display", "none");
    html2canvas(blockElement, {
      onrendered: function(canvas) {
        var element = document.createElement('a');
        element.href = canvas.toDataURL("image/png");
        element.download = blockType + '-' + blockTid + '.png';
        element.click();
      }
    });
    jQuery("#" + buttonId).css("display", "block");
  }
}

/* Datatables Controller */
pageInfoBaseControllers.controller('AngularDataTables', DataTablesCtrl);
function DataTablesCtrl($http, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnBuilder, DTDefaultOptions, $mdDialog) {
  $scope.dtInstance = {};

  $scope.checkDataLength = function(value) {
    // var htmlRegex = new RegExp("<[a-z][\s\S]*>");

    if(value != null) {
      if(value.length > 40 && !value.includes("href")) {
        return value;
      }
      else {
        return 0;
      }
    }
  }
  angular.forEach($scope.pageData.contentSection, function(value) {
    if(value.type == "commonTable" || value.type == "mildderTable" || value.type == "commonPhpTable") {
      $scope.tableSettings = value.middle.middleMiddle.middleMiddleMiddle.tableSettings;
    }
    else if(value.type == "multiTabs") {
      angular.forEach(value.middle.value, function(tabData) {
        if(tabData.type == "commonTable") {
          $scope.tableSettings = tabData.middle.middleMiddle.middleMiddleMiddle.tableSettings;
        }
      });
    }
  });

  $scope.dtOptionsCommonTables = {
    paginationType: $scope.tableSettings.paginationType,
    bInfo: true,
    deferRender: true,
    bPaginate: $scope.tableSettings.pagination,
    bFilter: $scope.tableSettings.searchFilter,
    order: [[ 0, "desc" ]],
    "dom": '<"row view-filter"<"col-sm-12 padding-0"<"pull-left"f><"pull-right margin-left-24"B><"pull-right"l><"clearfix">>>t<"row view-pager"<"col-sm-12"<"text-center"ip>>>',
    buttons: ['copy', 'excel'],
    language: {
      "searchPlaceholder": $scope.tableSettings.searchPlaceholder,
      "sSearch": "",
      "oPaginate": {
        "sFirst": "",
        "sLast": "",
        "sNext": "<span class='fa fa-caret-right color-00a9e0'></span>",
        "sPrevious": "<span class='fa fa-caret-left color-00a9e0'></span>",
      },
      "sLengthMenu": '<select>' + '<option value="10">SHOW 10</option>' + '<option value="20">SHOW 20</option>' + '<option value="30">SHOW 30</option>' + '<option value="40">SHOW 40</option>' + '<option value="50">SHOW 50</option>' + '<option value="-1">SHOW All</option>' + '</select> '
    }
  };

  $scope.dtOptionsMildderTable = {
    paginationType: $scope.tableSettings.paginationType,
    bInfo: true,
    deferRender: true,
    responsive: true,
    ordering: false,
    bPaginate: $scope.tableSettings.pagination,
    bFilter: true,
    order: [[ 0, "desc" ]],
    dom: 'l<"#add-content">frtip',
    language: {
      "searchPlaceholder": $scope.tableSettings.searchPlaceholder,
      "sSearch": "",
      "oPaginate": {
        "sFirst": "",
        "sLast": "",
        "sNext": "<span class='fa fa-caret-right color-00a9e0'></span>",
        "sPrevious": "<span class='fa fa-caret-left color-00a9e0'></span>",
      },
      "sLengthMenu": '<select>' + '<option value="10">SHOW 10</option>' + '<option value="20">SHOW 20</option>' + '<option value="30">SHOW 30</option>' + '<option value="40">SHOW 40</option>' + '<option value="50">SHOW 50</option>' + '<option value="-1">SHOW All</option>' + '</select> '
    },
    initComplete: function () {
      jQuery('#add-content')
        .append(
          `<select id="table-content-filter">
            <option value="" selected="">All</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Overdue">Overdue</option>
            <option value="Incomplete">Incomplete</option>`
        );
    }
  };


  // instance for custom select filter for table
  $scope.dtIntanceCallback = function(instance) {
    $scope.dtInstance = instance;
    var table = $scope.dtInstance.DataTable;
    var select = jQuery('#table-content-filter')
      .on( 'change', function () {
        var filterValue = jQuery(this).val();

        table.columns().every(function() {
          var column = this;
          var data = this.data();
          data.search(filterValue).draw();
        });
      });
  };

  $scope.tablePopUp = function(tableData) {
    var parentEl = angular.element(document.body);
    $mdDialog.show({
      clickOutsideToClose: true,
      parent: parentEl,
      scope: $scope,
      preserveScope: true,
      disableParentScroll: true,
      controller: function DialogController($scope, $mdDialog) {
        $scope.closeDialog = function() {
          $mdDialog.hide();
        }
        var vm = this;
        vm.tableData = {};
        vm.tableData = tableData;
      },
      controllerAs: 'popUp',
      template:
        '<md-dialog flex="45" class="register-dialogbox">' +
          '<md-dialog-content class="overflow-x-hidden">' +
            '<div class="row">' +
              '<div ng-bind-html="$sce.trustAsHtml(popUp.tableData)">{{popUp.tableData}}</div>' +
            '</div>' +
            '<div class="text-align-center">' +
              '<md-button class="btn btn-popup" ng-click="closeDialog()">Great!</md-button>' +
            '</div>' +
          '</md-dialog-content>' +
        '</md-dialog>',
    });
  }

  $timeout(function() {
    var orderColumn = jQuery('#content-render-php-table-wrapper').data('tableSortColumn');
    var orderType = jQuery('#content-render-php-table-wrapper').data('tableSortType');

    // set default orderColumn
    if (!orderColumn) {
      orderColumn = 0;
    }

    if (!orderType) {
      orderType = "asc"; // asc or desc
    }

    jQuery('#php-table-list').DataTable({
      paginationType: 'full_numbers',
      deferRender: true,
      bInfo: true,
      order: [[orderColumn, orderType]],
      language: {
        "searchPlaceholder": "SEARCH",
        "sSearch": "",
        "oPaginate": {
          "sFirst": "",
          "sLast": "",
          "sNext": "<span class='fa fa-caret-right color-00a9e0'></span>",
          "sPrevious": "<span class='fa fa-caret-left color-00a9e0'></span>",
        },
        "sLengthMenu": ' <select>' + '<option value="10">SHOW 10</option>' + '<option value="20">SHOW 20</option>' + '<option value="30">SHOW 30</option>' + '<option value="40">SHOW 40</option>' + '<option value="50">SHOW 50</option>' + '<option value="-1">SHOW All</option>' + '</select> '
      }
    });
    jQuery('#php-table-list').show();
  });
}

pageInfoBaseControllers.directive('compile', ['$compile', function ($compile) {
  return function(scope, element, attrs) {
    scope.$watch(
      function(scope) {
        // watch the 'compile' expression for changes
        return scope.$eval(attrs.compile);
      },
      function(value) {
        // when the 'compile' expression changes
        // assign it into the current DOM
        element.html(value);

        // compile the new DOM and link it to the current
        // scope.
        // NOTE: we only compile .childNodes so that
        // we don't get into infinite loop compiling ourselves
        $compile(element.contents())(scope);
      }
    );
  };
}]).controller('PopUpController', function($scope, $http, $mdDialog, $mdMedia, $filter, $sce) {

});
