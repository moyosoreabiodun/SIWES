//If user is not logged in, redirect to log in page
if (sessionStorage.getItem('AuthenticationState') !== 'Authenticated') {
    window.open("./index.html", "_self");
  } 
else { //if user is logged in, fetch data from API & display table

    //get authentication token for API
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


    //data table child row
    function format(param) {
        return (
            '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:3.125rem;">' +
            '<tr>' +
            '<td style="text-align:left;">Request Body:</td>' +
            '<td style="max-width:50rem; word-break:break-all; text-align:left;">' +
            param.requestBody +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td style="text-align:left;">Response Body:</td>' +
            '<td style="max-width:50rem; word-break:break-all; text-align:left;">' +
            param.responseBody +
            '</td>' +
            '</tr>' +
            '</table>'
        );
    }
  

    //populate datatable based on information from the API
    $(document).ready(function () {
        var table = $('#logs').DataTable({
            serverSide: true,
            processing: true,
            paging: true,
            ajax : {
              url: "http://132.145.231.191:9085/nibss-nip/api/portal/v1/nibss-log",
              type: "GET",
              mode: "cors", 
              headers : {Authorization: `Bearer ${actualToken}`},
              data: function(param) {   //params to be taken in by url
                let start = param.start;
                let length = param.length;
                param.size = length;
                param.page = Math.floor(start / length) + 1;
                param.type = $("#type").val();
                param.startDate = $("#startDate").val();
                param.endDate = $("#endDate").val();
              },
             
              dataSrc: function(response) {
                let response_body = response["data"];
                let total_count = response_body["totalCount"];
                response["recordsTotal"] = response["recordsFiltered"] = total_count;
                console.log(response);
                return response_body["data"];
              },
            },
            columns: [
                {
                    className: 'dt-control',
                    orderable: false,
                    data: null,
                    defaultContent: '',
                },
                { data: "type" },
                { data: "createdAt" ,
                    render:  DataTable.render.datetime('DD-MM-YYYY | hh:mm:ss A')},
                // {data: "status"},
            ],
      
        });
      

        // Redraw the table
        table.draw();
      

        // Redraw the table based on the custom input
        $("#startDate, #endDate, #type").bind("keyup change", function(event) {
            event.preventDefault();
            table.search(this.value).draw();
        });
      
        $('#startDate, #endDate, #type').on("change", function() {
            $('#logs').DataTable().ajax.reload();
        });

        $('#clearButton').on('click', function () {
            $("#startDate").val("");
            $("#endDate").val("");
            $("#type").val("Type");
            table.search("").draw();
        })


        //data table child row
        $('#logs tbody').on('click', 'td.dt-control', function () { // Add event listener for opening and closing details
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
  
}