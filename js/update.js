function addRow(product, amount, date, transactionID) {
    var table = document.getElementById("myTableData");
 
    var rowCount = table.rows.length;
    var row = table.insertRow(rowCount);
 
    row.insertCell(0).innerHTML= '<input type="button" value = "Delete" onClick="Javacsript:dummy()">';
    row.insertCell(1).innerHTML= product;
    row.insertCell(2).innerHTML= amount;
    row.insertCell(3).innerHTML= date;
    row.insertCell(4).innerHTML= transactionID;
    
}

function deleteRow(obj) {
      
    var index = obj.parentNode.parentNode.rowIndex;

    var id = obj.parentNode.parentNode.lastChild;

    var table = document.getElementById("myTableData");
    table.deleteRow(index);

    
}