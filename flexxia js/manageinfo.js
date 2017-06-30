/*
 * This controller will take care of parsing the data from json file
 */

var pathArg = drupalSettings.path.currentPath.split('/');

// jsonFileUrl for debug form
var jsonFileUrl = drupalSettings.path.baseUrl + 'manageinfo/angular/json/66';

if ((drupalSettings.path.currentPath.indexOf("manageinfo/") > -1) && (drupalSettings.path.currentPath.indexOf("/add/form/") > -1)) {
  jsonFileUrl = drupalSettings.path.baseUrl + 'manageinfo/' + pathArg[1] + '/' + pathArg[2] + '/add/json/' + pathArg.slice(-1)[0].toLowerCase();
}
else if ((drupalSettings.path.currentPath.indexOf("manageinfo/") > -1) && (drupalSettings.path.currentPath.indexOf("/edit/form") > -1)) {
  jsonFileUrl = drupalSettings.path.baseUrl + 'manageinfo/' + pathArg[1] + '/' + pathArg[2] + '/edit/json/';
}

var pageInfoBaseControllers = angular.module('pageInfoBase', ['ngResource', 'ngMaterial']);
pageInfoBaseControllers.controller('MildderPreFormController', ['$scope', '$http', '$timeout', '$q', '$log', '$filter','$mdDialog', '$element', '$sce',
  function($scope, $http, $timeout, $q, $log, $filter, $mdDialog, $element, $sce) {
    $scope.$sce = $sce;

    var spinner = new Spinner(spinOptions).spin(document.getElementById('center'));
    angular.element(document).ready(function() {

      if ((drupalSettings.path.currentPath.indexOf("manageinfo/node/") > -1) &&
        ((drupalSettings.path.currentPath.indexOf("meeting/add/form/") > -1) || (drupalSettings.path.currentPath.indexOf("/edit/form") > -1))) {
        $scope.saveAndEvaluate = true;
      }
      else {
        $scope.saveAndEvaluate = false;
      }

      // show hide delete button
      if(drupalSettings.path.currentPath.indexOf("/add/form") > -1) {
        $scope.deleteButton = false;
      }
      else {
        $scope.deleteButton = true;
      }

      $http({
        method: 'GET',
        url: jsonFileUrl
      }).then(function(response) {
        $scope.formJson = response.data;
        $timeout(function() {
          var blockHeight = jQuery('.main-container').find('.row').height();
          var footerHeight = jQuery('footer').height();
          jQuery('.sidebar-nav').css("height", (blockHeight + footerHeight));
        });

        // to fill timestamp into date and time models
        angular.forEach($scope.formJson.formElementsSection, function(field) {
          if (field.fieldType == 'dateTime') {
            if (field.defaultValue) {
              var dateTime = field.defaultValue;

              var dateTimeParts = dateTime.split("T");
              var timeParts = dateTimeParts[1].split(':');
              var dateParts = dateTimeParts[0].split('-');
              var date = new Date(Date.UTC(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1]));

              field.fieldDate = date;
              field.fieldTime = $filter('date')(date.getTime(), 'HH:mm');
            }
            else {
              field.fieldDate = new Date();
            }
          }
          if (field.fieldCategory == "filterFather") {
            if (field.defaultValue) {
              $scope.updateFilterFatherChildOptions(field.defaultValue, field.fieldName)
            }
          }
        });
        spinner.stop();

      },function(error) {
        // if error occurs
      });
    });

    // to check returning value of checkbox
    // $scope.checkValue = function(value) {
    //   console.log(value);
    // }

    $scope.convertDate = function(selectedTime, selectedDate, fieldName) {
      var dateTimeFormat = '';
      if (selectedDate) {
        var formatDate = $filter('date')(selectedDate, 'EEEE, MMMM d, y');
        var d = new Date(formatDate);
        var month = '' + (d.getMonth());
        var day = '' + d.getDate();
        var year = d.getFullYear();

        // set default time
        if (selectedTime == null) {
          selectedTime = '00:00';
        }

        var getTime = selectedTime.split(" ");
        var getTimeArray = getTime[0].split(":");
        var dateObj = new Date(year, month, day, getTimeArray[0], getTimeArray[1]);

        var dateTimeFormatUTC = dateObj.toISOString().substr(0, 19);

        angular.forEach($scope.formJson.formElementsSection, function(field) {
          if (field.fieldName == fieldName) {
            field.defaultValue = dateTimeFormatUTC;
          }
        });
      }
    }

    $scope.masterUpdate = function(answerTid, fieldName, fieldCategory) {
      if (fieldCategory == 'hierarchyFather') {
        $scope.hierarcyUpdateChildOptions(answerTid, fieldName);
      }
      else if (fieldCategory == 'specificAnswer') {
        $scope.updateSpecificChildAnswer(answerTid, fieldName);
      }
      else if (fieldCategory == 'filterFather') {
        $scope.updateFilterFatherChildOptions(answerTid, fieldName);
      }
    }

    $scope.resetDateTime  = function(fieldName) {
      angular.forEach($scope.formJson.formElementsSection, function(field) {
        if (field.fieldType == 'dateTime' && field.fieldName == fieldName) {
          field.fieldTime = null;
          field.fieldDate = null;
          field.defaultValue = null;
        }
      });
    }

    // singleFatherMultipleChild options
    $scope.hierarcyUpdateChildOptions = function(answerTid, fieldName) {
      $scope.clearSubModels(answerTid, fieldName);
      angular.forEach($scope.formJson.formElementsSection, function(field) {
        if (field.parentFieldName == fieldName && field.parentTermTid == answerTid) {
          field.fieldShow = true;
        }
      });
    }

    // clearing subModels on select
    $scope.clearSubModels = function(answerTid, fieldName) {
      angular.forEach($scope.formJson.formElementsSection, function(field) {
        if (field.parentFieldName == fieldName && field.parentTermTid != answerTid) {
          field.defaultValue = '';
          field.fieldShow = false;
          field.updateStatus = 0;
        }
      });
    }

    // show Ct chest question
    $scope.updateSpecificChildAnswer = function(answerTid, fieldName) {
      angular.forEach($scope.formJson.formElementsSection, function(field) {
        if (field.parentFieldName == fieldName && answerTid) {
          if (answerTid.indexOf(2125) >= 0) {
            field.fieldShow = true;
          }
          else {
            field.fieldShow = false;
            field.defaultValue = '';
          }
        }
      });
    }

    // single father update
    $scope.updateFilterFatherChildOptions = function(answerTid, fieldName) {
      if (answerTid != "") {
        angular.forEach($scope.formJson.formElementsSection, function(field) {
          if (field.parentFieldName == fieldName) {
            field.fieldShow = true;
            field.filteredLabel = [];
            angular.forEach(field.fieldLabel, function(value) {
              angular.forEach(value.termParentTid, function(parentTid) {
                if (parentTid == answerTid) {
                  (field.filteredLabel).push(value);
                }
              });
            });
          }
        });
      }
    }

    // to get longitude and latitude
    $scope.getLatLon = function() {
      var address = '';
      var country = '';
      var postalCode = '';
      var province = '';
      var city = '';
      var completeAddress = '';

      angular.forEach($scope.formJson.formElementsSection, function(field) {

        if (field.fieldName == "field_meeting_address") {
          address = field.defaultValue;
        }

        if (field.fieldName == "field_meeting_postalcode") {
          postalCode = field.defaultValue;
        }

        if (country == "Canada") {
          if (field.fieldName == "field_meeting_province") {
            if (field.defaultValue != null && field.defaultValue != "") {
              province = jQuery('#select_1071 .md-select-value span div').text();
            }
          }
          if (field.fieldName == "field_meeting_city") {
            if (field.defaultValue != null && field.defaultValue != "") {
              city = jQuery('#select_1085 .md-select-value span div').text();
            }
          }
        }
        else {
          if (field.fieldName == "field_meeting_globalcity") {
            city = field.defaultValue;
          }
        }
      });
      if (address) {
        completeAddress += address;
        completeAddress += ' ';
      }
      if (city) {
        completeAddress += city;
        completeAddress += ' ';
      }
      if (province) {
        completeAddress += province;
        completeAddress += ' ';
      }
      if (country) {
        completeAddress += country;
        completeAddress += ' ';
      }
      if (postalCode) {
        completeAddress += postalCode;
        completeAddress += ' ';
      }
      // for debugging
      // console.log(completeAddress);

      var geocoder = new google.maps.Geocoder();
      geocoder.geocode( { "address": completeAddress}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
          var location = results[0].geometry.location;
          lat = location.lat();
          lng = location.lng();
          $scope.$apply(function() {
            angular.forEach($scope.formJson.formElementsSection, function(field) {
              if (field.fieldName == 'field_meeting_latitude') {
                field.defaultValue = lat;
              }
              else if (field.fieldName == 'field_meeting_longitude') {
                field.defaultValue = lng;
              }
            });
          });
        }
        else {
          $scope.coordinatesAlert();
        }
      });
    }

    $scope.coordinatesAlert = function($event) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        clickOutsideToClose: true,
        scope: $scope,
        preserveScope: true,
        template:
        '<md-dialog flex="30">' +
          '  <md-dialog-content class="padding-24">We are unable to find Co-ordianates with the provided data.Please provide more information' +
          '  </md-dialog-content>' +
          '  <md-dialog-actions>' +
          '    <md-button ng-click="closeDialog()" class="md-primary">' +
          '      Ok' +
          '    </md-button>' +
          '  </md-dialog-actions>' +
        '</md-dialog>',
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function() {
            $mdDialog.hide();
          }
        }
      });
    }

    $scope.submitUnsuccessfulAlert = function($event) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        parent: parentEl,
        clickOutsideToClose: true,
        scope: $scope,
        preserveScope: true,
        template:
        '<md-dialog flex="30">' +
          '  <md-dialog-content class="padding-24">We are unable to submit data at this point.</br>We are sorry for inconvenience.</br>Please contact Admin.' +
          '  </md-dialog-content>' +
          '  <md-dialog-actions>' +
          '    <md-button ng-click="closeDialog()" class="md-primary">' +
          '      Ok' +
          '    </md-button>' +
          '  </md-dialog-actions>' +
        '</md-dialog>',
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function() {
            $mdDialog.hide();
          }
        }
      });
    }

    $scope.deleteAlertBox = function($event) {
      var parentEl = angular.element(document.body);
      $mdDialog.show({
        clickOutsideToClose: true,
        parent: parentEl,
        targetEvent: $event,
        scope: $scope,
        preserveScope: true,
        template:
        '<md-dialog flex="25">' +
          '  <md-dialog-content class="padding-24">Are you sure you want to delete it?</md-dialog-content>' +
          '  <md-dialog-actions>' +
          '    <md-button ng-click="delete()" class="md-primary pageinfo-btn-saved">' +
          '      Yes' +
          '    </md-button>' +
          '    <md-button ng-click="closeDialog()" class="md-primary">' +
          '      No' +
          '    </md-button>' +
          '  </md-dialog-actions>' +
        '</md-dialog>',
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function() {
            $mdDialog.hide();
          }
        }
      });
    }

    // get rest Token
    jQuery.get(drupalSettings.path.baseUrl + 'rest/session/token').done(function (data) {
      $scope.csrfToken = data;
    });

    $scope.submit = function(btnId) {
      if (drupalSettings.path.currentPath.indexOf("manageinfo/node/evaluation/") > -1) {
        $scope.submitEvaluation();
      }
      else {
        $scope.submitStandard(btnId);
      }
    }

    /*
     * post form function
     */
    $scope.submitStandard = function(btnId) {
      var postUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.postUrl;
      var redirectUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.redirectUrl;
      var redirectUrlSubmit = drupalSettings.path.baseUrl + 'manageinfo/program/list/all/';
      var formType = $scope.formJson.formInfo.formType;
      var httpMethod = 'POST';
      console.log(btnId);


      var postTermJsonArray = [];
      var postTermJsonObject = {};

      // post resultSubmit Array
      angular.forEach($scope.formJson.formInfo.resultSubmit, function(value, key) {
        postTermJsonArray.push({
          [key] : [value]
        });
      });

      if (formType == 'add') {
        angular.forEach($scope.formJson.formElementsSection, function(field) {

          if (field.defaultValue != null && field.defaultValue != "") {
            if(field.fieldType == "multiSelect") {

              var parent = [];
              angular.forEach(field.defaultValue, function(value) {
                parent.push({
                  [field.returnType]: value
                });
              });
              postTermJsonArray.push({
                [field.fieldName] : parent
              });
            }
            else {
              postTermJsonArray.push({
                [field.fieldName]: [{
                  [field.returnType]: field.defaultValue
                }]
              });
            }
          }
        });
      }
      else if (formType == 'edit') {
        angular.forEach($scope.formJson.formElementsSection, function(field) {
          httpMethod = 'PATCH';

          if (field.updateStatus == 1) {
            if (field.fieldType == "multiSelect") {
              var parent = [];
              angular.forEach(field.defaultValue, function(value) {
                parent.push({
                  [field.returnType]: value
                });
              });
              postTermJsonArray.push({
                [field.fieldName] : parent
              });
            }
            else {
              postTermJsonArray.push({
                [field.fieldName]: [{
                    [field.returnType]: field.defaultValue
                }]
              });
            }
          }
        });
      }

      // convert postTermJsonArray to postTermJsonObject
      Array.prototype.forEach.call(postTermJsonArray, function(element) {
        var keys = Object.keys(element);
        postTermJsonObject[keys[0]] = element[keys[0]];
      });

      // standard json example
      // var postTermJson2 = {
      //   "vid": [{ "target_id": "province" }],
      //   "name": [{ "value": "aaa new province" }],
      //   "field_province_region": [{ "target_id": 23 }, { "target_id": 63 }],    // multiple
      //   "field_city_name": [{ "value": "windsor" }],     // or value
      // };

      $scope.isLoading = true;
      $http({
        method  : httpMethod,   // GET, POST, PATCH, DELETE
        url     : postUrl,
        data    : postTermJsonObject,
        headers : {'Content-Type': 'application/json', 'X-CSRF-Token': $scope.csrfToken},
      }).then(function(response) {
        $scope.isLoading = false;
        console.log('Success');
        console.log(response);
        if ($scope.saveAndEvaluate == true) {
          if(btnId == 'submit') {
            window.location.replace(redirectUrlSubmit);
          }
          else if(btnId == 'evaluate') {
            window.location.replace(redirectUrl);
          }
        }
        else {
          window.location.replace(redirectUrl);
        }
      },function (error) {
        console.log(error);
        $scope.isLoading = false;
        $scope.submitUnsuccessfulAlert();
        console.log('Form not submit successfully');
      });
    }

    /*
     *
     */
    $scope.submitEvaluation = function() {
      var postUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.postUrl;
      var redirectUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.redirectUrl;
      var formType = $scope.formJson.formInfo.formType;
      var httpMethod = 'POST';

      var postTermJsonArray = [];
      var postTermJsonObject = {};
      var answeredQuestions = [];

      // post resultSubmit Array
      angular.forEach($scope.formJson.formInfo.resultSubmit, function(value, key) {
        postTermJsonArray.push({
          [key] : [value]
        });
      });

      if (formType == 'add') {
        angular.forEach($scope.formJson.formElementsSection, function(field) {

          if (field.defaultValue != null && field.defaultValue != "") {
            if (field.fieldName == "title") {
              postTermJsonArray.push({
                [field.fieldName]: [{
                  [field.returnType]: field.defaultValue
                }]
              });
            }
            else if (field.fieldName == "field_evaluation_reactset") {
              if (field.fieldType == "multiSelect") {
                angular.forEach(field.defaultValue, function(value) {
                  answeredQuestions.push(
                  {
                    "question_tid": field.question_tid,
                    "question_answer": value,
                    "refer_tid": field.refer_tid,
                    "refer_uid": field.refer_uid,
                    "refer_other": field.refer_other
                  });
                });
              }
              else {
                answeredQuestions.push({
                  "question_tid": field.question_tid,
                  "question_answer": field.defaultValue,
                  "refer_tid": field.refer_tid,
                  "refer_uid": field.refer_uid,
                  "refer_other": field.refer_other
                });
              }
            }
          }
        });
      }
      else if (formType == 'edit') {
        angular.forEach($scope.formJson.formElementsSection, function(field) {
          httpMethod = 'PATCH';

          if (field.updateStatus == 1) {
            if (field.fieldName == "title") {
              postTermJsonArray.push({
                [field.fieldName]: [{
                  [field.returnType]: field.defaultValue
                }]
              });
            }
            else if (field.fieldName == "field_evaluation_reactset") {
              answeredQuestions.push({
                "question_tid": field.question_tid ,
                "question_answer": field.defaultValue ,
                "refer_tid": field.refer_tid ,
                "refer_uid": field.refer_uid ,
                "refer_other": field.refer_other
              });
            }
          }
        });
      }

      postTermJsonArray.push({
        "field_evaluation_reactset" : answeredQuestions
      });

      // convert postTermJsonArray to postTermJsonObject
      Array.prototype.forEach.call(postTermJsonArray, function(element) {
        var keys = Object.keys(element);
        postTermJsonObject[keys[0]] = element[keys[0]];
      });

      // var postTermJsonSample = {
      //   "type": [{ "target_id": "evaluation" }],
      //   "title": [{ "value": "Evaluation for meeting 41637" }],
      //   "field_evaluation_meetingnid": [
      //     {
      //       "target_id": "41637",
      //       "target_type": "node",
      //     },
      //   ],
      //   "field_evaluation_reactset": [
      //     {
      //       "question_tid": "2633",
      //       "question_answer": "5",
      //       "refer_uid": "0",
      //       "refer_tid": "0",
      //       "refer_other": ""
      //     },
      //     {
      //       "question_tid": "2640",
      //       "question_answer": "2",
      //       "refer_uid": "0",
      //       "refer_tid": "0",
      //       "refer_other": ""
      //     },
      //   ],    // multiple
      // };
      console.log(postTermJsonObject);
      $scope.isLoading = true;
      $http({
        method  : httpMethod,   // GET, POST, PATCH, DELETE
        url     : postUrl,
        data    : postTermJsonObject,
        headers : {'Content-Type': 'application/json', 'X-CSRF-Token': $scope.csrfToken},
      }).then(function(response) {
        $scope.isLoading = false;
        console.log('Success');

        window.location.replace(redirectUrl);
      },function (error) {
        console.log(error);
        $scope.isLoading = false;
        $scope.submitUnsuccessfulAlert();

        console.log('Form not submit successfully');
      });
    }

    /*
     * delete form function
     */
    $scope.delete = function() {
      var postUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.postUrl;
      var redirectUrl = drupalSettings.path.baseUrl + $scope.formJson.formInfo.deleteRedirectUrl;

      console.log(postUrl);
      $http({
        method  : 'DELETE',   // GET, POST, PATCH, DELETE
        url     : postUrl,
        headers : {'Content-Type': 'application/json', 'X-CSRF-Token': $scope.csrfToken},
      }).then(function(response) {
        $scope.isLoading = false;
        console.log('Success');

        window.location.replace(redirectUrl);
      },function (error) {
        $scope.isLoading = false;
        $scope.submitUnsuccessfulAlert();

        console.log('Form not submit successfully');
      });
    }
  }
]);
