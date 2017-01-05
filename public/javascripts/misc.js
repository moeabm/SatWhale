var m_names = new Array("January", "February", "March", 
"April", "May", "June", "July", "August", "September", 
"October", "November", "December");

var printDate = function(d){
  var curr_date = d.getDate();
  var sup = "";
  if (curr_date == 1 || curr_date == 21 || curr_date ==31)
     {
     sup = "st";
     }
  else if (curr_date == 2 || curr_date == 22)
     {
     sup = "nd";
     }
  else if (curr_date == 3 || curr_date == 23)
     {
     sup = "rd";
     }
  else
     {
     sup = "th";
     }

  var curr_month = d.getMonth();
  var curr_year = d.getFullYear();
  var a_p = " ";
  var curr_hour = d.getHours();

  if (curr_hour < 12)
     {
     a_p = "AM";
     }
  else
     {
     a_p = "PM";
     }
  if (curr_hour == 0)
     {
     curr_hour = 12;
     }
  if (curr_hour > 12)
     {
     curr_hour = curr_hour - 12;
     }

  var curr_min = d.getMinutes() + "";
  var curr_sec = d.getSeconds() + "";
  if (curr_min.length == 1)
  {
    curr_min = "0" + curr_min;
  }
  if (curr_sec.length == 1)
  {
    curr_sec = "0" + curr_sec;
  }


  return  m_names[curr_month] + " " + curr_date + "<SUP>" + sup + "</SUP> "
    + " " + curr_year + " @ " + curr_hour + ":" + curr_min + ":" + curr_sec + " " + a_p;

}