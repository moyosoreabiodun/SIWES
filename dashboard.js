//If user is not logged in, redirect to log in page
if (sessionStorage.getItem('AuthenticationState') !== 'Authenticated') {
  window.open("./index.html", "_self");
} 
else { //if user is logged in, fetch data from API & display table
  
  //get authentication token for API | store in & get from sessionStorage
  async function getToken() {
    credentials = {
      "username" : "vasnipadmin",
      "password" : "rFsVFJwO6rTweHF"
    }
    let options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(credentials)
    }
    let fetchRes = await fetch("http://132.145.231.191:9085/nibss-nip/api/portal/v1/authenticate", options);
    let data = await fetchRes.json();
    let result = data.data.token;
    return result;
  }
   
  var authToken = getToken().then(token => {
    sessionStorage.setItem("userToken", JSON.stringify(token));
    return token;
  });
  var actualToken = JSON.parse(sessionStorage.getItem("userToken"));


  //date range inputs
  flatpickr('#startDate', {
    allowInput: true,
    dateFormat: "d-m-Y"
  });
  flatpickr('#endDate', {
    allowInput: true,
    dateFormat: "d-m-Y"
  });


  //data table child rows
  function format(param) {
    return (
        '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:3.125rem;">' +
        '<tr>' +
        '<td style="text-align: left">Sender:</td>' +
        '<td style="text-align: left">' +
        param.originatorAccountName +
        '</td>' +
        '</tr>' +
        '<tr>' +
        "<td style='text-align: left'>Sender's Acc. No.:</td>" +
        '<td style="text-align: left">' +
        param.originatorAccountNumber +
        '</td>' +
        '</tr>' +
        '<tr>' +
        "<td style='text-align: left'>Narration:</td>" +
        '<td style="text-align: left">' +
        param.narration +
        '</td>' +
        '</tr>' +
        '<tr>' +
        "<td style='text-align: left'>Status Message:</td>" +
        '<td style="text-align: left">' +
        param.statusMessage +
        '</td>' +
        '</tr>' +
        '</table>'
    );
  }


  //populate datatable based on information from the API 
  $(document).ready(function () {
    if (actualToken !== null){
      var table = $('#transactions').DataTable({
        serverSide: true,
        processing: true,
        paging: true,
        ajax : {
          url: "http://132.145.231.191:9085/nibss-nip/api/portal/v1/transactions",
          type: "GET",
          mode: "cors", 
          headers : {Authorization: `Bearer ${actualToken}`},
          data: function(param) {  //params to be taken in by url
            let start = param.start;
            let length = param.length;
            param.size = length;
            param.page = Math.floor(start / length) + 1;
            param.ref = $("#transRef").val();
            param.startDate = $("#startDate").val();
            param.endDate = $("#endDate").val();
          },
         
          dataSrc: function(response) {
            let responseBody = response["data"];
            let total_count = responseBody["totalCount"];
            response["recordsTotal"] = response["recordsFiltered"] = total_count;
            return responseBody["data"];
          },
        },
        columns: [
          {
            className: 'dt-control',
            orderable: false,
            data: null,
            defaultContent: '',
          },
          { data: "beneficiaryAccountName" },
          { data: "beneficiaryAccountNumber" },
          { data: "destinationInstitutionCode",
            render: function(data, type) {
              if (type === 'display') {
                return '<button id= "" type="button" bankcode="bankdetails" class="btn bankbutton btn-load" data-toggle="modal" data-target="#bankDetailsModal">' + data + '  </button>';
              }
              return data;
            },
          },
          { data: "amount" },
          { data: "referenceNumber" },
          { data: "createdAt",
            render:  DataTable.render.datetime('DD-MM-YYYY, hh:mm:ss A') },
          { data: "status" },
        ],
        dom: 'Blfrtip',
        buttons: [
            {
                extend: 'csv',
                split: [ 'pdf', 'excel', 'copy'],
            }
        ]  
    
      });
    }

  
    // Redraw the table
    table.draw();


    // Redraw the table based on the custom input
    $("#startDate, #endDate, #transRef").bind("keyup change", function(event) {
      event.preventDefault();
      table.search(this.value).draw();
    });

    $('#startDate, #endDate, #transRef').on("change", function() {
      $('#transactions').DataTable().ajax.reload();
    });

    $('#clearButton').on('click', function () {
      $("#startDate").val("");
      $("#endDate").val("");
      $("#transRef").val("");
      table.search("").draw();
    })


    //data tables child row
    $('#transactions tbody').on('click', 'td.dt-control', function () { // Add event listener for opening and closing details
      var tr = $(this).closest('tr');
      var row = table.row(tr);

      if (row.child.isShown()) { // This row is already open - close it
          row.child.hide();
          tr.removeClass('shown');
      } else { // Open this row
          row.child(format(row.data())).show();
          tr.addClass('shown');
      }
    });


    //prevent error
    $.fn.dataTable.ext.errMode = "none"; 

  });


  // bank details api implementation
  $(document).on("click", "button[bankcode='bankdetails']",function(){
      let buttonValue = this.innerText;
      $.ajax({
        url: "http://132.145.231.191:9085/nibss-nip/api/portal/v1/banks",
        type: "GET",
        headers : {Authorization: `Bearer ${actualToken}`},
        data:{ bankCode: buttonValue},
        success: function (response) {
          $("#bankName").html('Bank Name: ' + response.data.name)
          $("#institutionCode").html('Institution Code: ' + response.data.institutionCode)
          $("#category").html('Category: ' + response.data.category)
        },
      });
  });
}