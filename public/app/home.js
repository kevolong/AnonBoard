$(function() {
  
  $("footer").load("/app/footer.html");
  
  //Get all boards and threadcount
  $.ajax({
    type: "GET",
    url: '/api/boards',
    error: function (err){
      let errorMsg = '';
      err.responseJSON.error.forEach(error => {
        let value = Object.values(error);
        errorMsg += value[0];
      });
      alert(errorMsg);
    },
    success: function(data)
    {

      let html = '';
      let boards = data.boards;
      
      html+='<h3 class="text-center mt-2">Boards</h3>';

      boards.forEach(function(ele) {

        html+='<div class="board board-link card my-2" value="' + ele.board + '">';
          html+='<div class="card-header">';
            html+='<div class="row px-3  pt-2 align-items-center justify-content-between">';
              //Board name header
              html+='<h4 class="card-title">'+ele.board+'</h4>';          
              //Thread id and created_on date
              html+='<h6 class="id card-subtitle text-muted">Threads: '+ele.thread_count+'</h5>';
            html+='</div>';
          html+='</div>'; //end of board card-header
        html+='</div>'; // end of board card
        
      }); // end of thread for each
      
      $('#boardDisplay').html(html);
    } // end of success
  }); // end of ajax
  
  //Click on board card
  $('#boardDisplay').on('click', '.board-link', function(e) {
    
    //console.log(e.currentTarget.getAttribute("value"));
    e.preventDefault();
    window.location = 'https://fcc-anon-msgboard-kl.glitch.me/b/' + e.currentTarget.getAttribute("value"); 
    
  });


  
  
  
              
});