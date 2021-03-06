$(function() {
  
  var currentBoard = window.location.pathname.slice(3); // get board name
  var url = "/api/threads/"+currentBoard;
  
  $('#boardTitle').text('Welcome to ' + window.location.pathname);
  $("footer").load("/app/footer.html");
  
  //Get board overview
  $.ajax({
    type: "GET",
    url: url,
    success: function(data)
    {

      let html = '';
      
      html+='<h3 class="text-center mt-2">Latest Threads</h3>';
      
      if (data.latest_threads.length == 0) {
        html+='<h4 class="text-center my-5">None yet. Start one!</h4>';
        
      }
      else{
        
        data.latest_threads.forEach(function(ele) {

        html+='<div class="thread card my-4">';
          html+='<div class="card-header">';
            //Thread text as header
            html+='<h4 class="card-title mb-3"><a class="thread-title-link" href="'+window.location.pathname+'/'+ele._id+'">'+ele.text+'</a></h4>';
            html+='<hr>';            
            //Report/delete form row
            html+='<div class="row ml-1 mb-3 justify-content-start align-items-center">';
              //Report Thread Button
              html+='<button class="report-thread report-button" value="'+ele._id+'">Report</button>'; 
              //Delete Thread Form
              html+='<form class="delete-thread"><input type="hidden" value="'+ele._id+'" name="thread_id" required><input type="text" placeholder="password" name="delete_password" required><button type="submit">Delete</button></form>';
            html+='</div>';
            //Thread id and created_on date
            html+='<h6 class="id card-subtitle text-muted mb-1">id: '+ele._id+' ('+ele.created_on+')</h5>';
          html+='</div>'; //end of thread card-header
        
          //Latest 3 replies
          html+='<div class="replies card-body px-5">';

            var hiddenCount = ele.reply_count - 3;
            if (hiddenCount < 1) { hiddenCount = 0 };

            html+='<h5>'+ele.reply_count+' replies total ('+hiddenCount+' hidden) - <a href="'+window.location.pathname+'/'+ele._id+'">See the full thread here</a>.</h5>';

          ele.latest_replies.forEach(function(rep) {
            html+='<div class="reply card my-2">';
              html+='<div class="card-body">';
                //Reply text as header
                html+='<h5 class="card-title mb-3">'+rep.text+'</h5>';
                
                //Report/delete form row
                if(rep.text != '[deleted]'){ 
                  html+='<div class="row ml-1 mb-2 justify-content-start align-items-center">';
                    //Report Reply Button
                    html+='<button class="report-reply report-button" value="'+rep._id+'" data-thread="'+ele._id+'">Report</button>';
                    //Delete reply button
                    html+='<form class="delete-reply"><input type="hidden" value="'+ele._id+'" name="thread_id" required><input type="hidden" value="'+rep._id+'" name="reply_id" required=""><input type="text" placeholder="password" name="delete_password" required=""><button type="submit">Delete</button></form>';
                  html+='</div>'; // end of form-row
                }
                
                //Thread id and created_on date
                html+='<p class="id card-subtitle text-muted">id: '+rep._id+' ('+rep.created_on+')</p>';
              html+='</div>'; // end of card-body
            html+='</div>'; // end of reply card
          }); // end of forEach replies

            html+='<div class="new-reply text-center mt-3">';
              html+='<form action="/api/replies/'+currentBoard+'/" method="post" id="newReply">';
                html+='<div><label for="newReply"><h5>Quick Reply:</h5></label></div>';
                html+='<input type="hidden" name="thread_id" value="'+ele._id+'">';
                html+='<textarea rows="5" cols="50" type="text" placeholder="Yo hold up..." name="text" required></textarea><br>';
                //Form row
                html+='<div class="row justify-content-center align-items-center my-2">';        
                  html+='<input type="text" placeholder="password to delete" name="delete_password" required>';
                  html+='<button type="submit">Submit</button>';
                html+='</div>';
              html+='</form>';
            html+='</div>'; // end of new-reply
          html+='</div>'; // end of card-body Latest 3 replies
        html+='</div>'; // end of thread card
        
      }); // end of thread for each
      
      }

      
      
      $('#boardDisplay').html(html);
    } // end of success
  }); // end of ajax

  $('#newThread').submit(function(){
    $(this).attr('action', "/api/threads/" + currentBoard);
  });

  //Report thread button
  $('#boardDisplay').on('click', '.report-thread', function(e) {
    
    var url = "/api/threads/" + currentBoard;
    
    $.ajax({
      type: "PUT",
      url: url,
      data: { thread_id: e.target.value },
      error: function(err){ errorAlert(err) },
      success: function(data) { alert(data.success) }
    });
    e.preventDefault();
  });
  
  //Report reply button
  $('#boardDisplay').on('click','.report-reply', function(e) {
    
    var url = "/api/replies/" + currentBoard;
    
    $.ajax({
      type: "PUT",
      url: url,
      data: {thread_id: e.target.dataset.thread, reply_id: e.target.value},
      error: function(err){ errorAlert(err) },
      success: function(data) { alert(data.success) }
    });
    e.preventDefault();
  });
  
  //Delete Thread Form
  $('#boardDisplay').on('submit','.delete-thread', function(e) {
    
    var url = "/api/threads/"+ currentBoard;
    let formData = $(this).serializeArray();
    let threadId = formData[0].value;
    let password = formData[1].value;
    
    $.ajax({
      type: "DELETE",
      url: url,
      data:{thread_id: threadId, delete_password: password},
      error: function(err){ errorAlert(err) },
      success: function(data) { 
        alert(data.success); 
        location.reload(true); 
      }
    });
    e.preventDefault();
    
  });
  
  //Delete Reply form
  $('#boardDisplay').on('submit','.delete-reply', function(e) {
    
    var url = "/api/replies/" + currentBoard;
    
    let formData = $(this).serializeArray();
    let threadId = formData[0].value;
    let replyId = formData[1].value;
    let password = formData[2].value;
    
    $.ajax({
      type: "DELETE",
      url: url,
      data: {thread_id: threadId, reply_id: replyId, delete_password: password},
      error: function(err){ errorAlert(err) },
      success: function(data) { 
        alert(data.success); 
        location.reload(true); 
      }
    });
    
    e.preventDefault();
  });
  
  //Alert with error message
  function errorAlert(err){
   let errorMsg = '';
      err.responseJSON.error.forEach(error => {
        let value = Object.values(error);
        errorMsg += value[0];
      });
      alert(errorMsg);
  } // end of function errorAlert
  
});