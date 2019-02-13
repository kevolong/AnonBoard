/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const mongo = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CONNECTION_STRING = process.env.DB;
mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);

module.exports = function (app) {
  
  //Schema for boards. 
  //Each board has subdocument threads, and each thread has subdocument replies.
  var boardSchema = new Schema({
    board: {        //  Board name
      type: String,
      required: true,
      unique: true
    },
    threads: [      // Threads array
      {
        text: String,                                // Text of thread
        created_on: Date,                            // Created on date
        bumped_on: Date,                             // Updated date 
        reported: {type: Boolean, default: false},   // Reported or not
        delete_password: String,                     // Password to delete thread
        replies: [
          {
            text: String,                              // Reply text
            created_on: Date,                          // Created on date
            reported: {type: Boolean, default: false}, // Reported or not
            delete_password: String                    // Password to delete reply
          }
        ]
      }
    ]
  });
  
  var Board = mongoose.model('Board', boardSchema);
  
  function test(){
    let board = new Board({board: 'test'});
    board.save((err, data) => {
      if(err){ console.log(err);}
      else{ console.log(data); }
    });
  }
  //test();
  
  
  app.route('/api/threads/:board')
  
    //POST new thread to board
    .post(function (req, res){
    
      const boardName = req.params.board; // Board name
      const text = req.body.text;        //New thread text
      const deletePassword = req.body.delete_password; // Password to delete thread
      let errorMessage = { error: [] };  //Error message array
    
      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ createThread(); }
      else {res.status(400).json(errorMessage); }
    
      //Validate request body has text and delete_password
      function validateReq(){
        
        let valid = true;
        
        //No text
        if(text == undefined){
          errorMessage.error.push({request_body: "Request body missing property [text]."})
          valid = false;
        }
        //No delete_password
        if(deletePassword == undefined){
          errorMessage.error.push({request_body: "Request body missing property [delete_password]."})
          valid = false;
        }
        
        //Text not string
        if(typeof(text) != 'string'){
          errorMessage.error.push({request_body: "Request body property [text] value must be a string."})
          valid = false;
        }
        //Delete_password not string
        if(typeof(deletePassword) != 'string'){
          errorMessage.error.push({request_body: "Request body property [delete_password] value must be a string."})
          valid = false;
        }
        
        return valid;
        
      } // end of function validateReq()
    
      //Create new thread in board (create board if doesn't exist)
      function createThread(){
        
        let date = new Date();
        let thread = {  text: text,                                
                        created_on: date,                            
                        bumped_on: date,                             
                        reported: false,   
                        delete_password: deletePassword,                     
                        replies: []
                     };
        
        Board.findOneAndUpdate({board: boardName}, 
                               { $push: {threads: thread} }, 
                               {upsert: true, new: true},
                               (err, doc) => 
        {
          //Error
          if(err){
            console.log(err);
            res.status(500).json( {error: [{server: "Database Write Error."}]} );
          }
          //Success. Return thread
          else{
            let url = 'https://fcc-anon-msgboard-kl.glitch.me/b/' + boardName;
            res.redirect(url);
          }
        
        }); // end of findOneAndUpdate
      } // end of function createThread()
    
    })
    
    //GET 10 most recently bumped threads with 3 most recent replies
    .get(function (req, res){
    
      const boardName = req.params.board; // Board name
    
      validateDoc();
    
      //Validate board exists
      async function validateDoc(){
        
        //Validate board
        let projection = 'board'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Proceed
        if(validBoard.hasOwnProperty('success')){ 
          let board = validBoard.success;
          aggThreads(board);
        }
        
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateBoard()
    
      //Aggregate Latest 10 bumped threads
      function aggThreads(board){
        
        let aggregate =  Board.aggregate([{ $match: { board: boardName }}])
          .project('-threads.delete_password -threads.reported -threads.replies.delete_password -threads.replies.reported')
          .unwind('threads')
          .sort('-threads.bumped_on')
          .limit(10)
          .exec((err, doc) =>{
            //Error
             if(err){ 
               res.status(500).json({error: [{server: "Database Read Error."}]});
               console.log(err);
             }
             else{ 
               let threads = doc.map(thread => thread.threads);
               filterReplies(board, threads);
             }
          });
      } // end of function aggregateThreads
    
      //Filter last 3 replies for each thread
      function filterReplies(board, threads){
        
        //New board object for JSON return
        let newBoard = {board: board.board, _id: board._id, latest_threads: []};
        
        threads.forEach(thread => {
          let newThread = {};
          //If less than 3 replies, push thread object to newBoard
          if(thread.replies.length <= 3){ 
            newThread = { _id: thread._id,
                          text: thread.text,                               
                          created_on: thread.created_on,                          
                          bumped_on: thread.bumped_on,
                          latest_replies: thread.replies,
                          reply_count: thread.replies.length
                        }; 
          }
          //More than 3 replies. Slice out last 3, push to newBoard
          else{
            let lastReplies = thread.replies.slice(-3);
            
            newThread = { _id: thread._id,
                          text: thread.text,                               
                          created_on: thread.created_on,                          
                          bumped_on: thread.bumped_on,
                          latest_replies: lastReplies,
                          reply_count: thread.replies.length
                        };
          }
          
          newBoard.latest_threads.push(newThread);
        }); // end of forEach
        
        returnBoard(newBoard);
        
      } // end of function filterReplies()
    
      //Return board with latest 10 threads with last 3 replies
      function returnBoard(newBoard){
        res.json(newBoard);
      }  
  
    }) // end of GET
  
    //PUT update thread reported status to true
    .put(function (req, res){
    
      const boardName = req.params.board; // Board name
      const threadId = req.body.thread_id; // Thread Id
      let errorMessage = { error: [] };  //Error message array
    
      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ validateDocs(); }
      else {res.status(400).json(errorMessage); }
    
      //Validate request body has thread_id
      function validateReq(){
        
        let valid = true;
        
        if(threadId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [thread_id].'});
          valid = false;
        }
        
        return valid;
        
      } // end of function validateReq()
    
      //Validate board and thread exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = 'board threads'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId);
          
          //Thread exists. Proceed
          if(validThread){ 
            let thread = board.threads.id(threadId);
            updateThread(board, thread); 
          }
          //Thread doesnt exist.
          else{ 
            res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); 
          }
        } // end of if ValidBoard has property 
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
    
      //Update reply reported status to true and save
      function updateThread(board, thread){
        
        //Update reported;
        thread.reported = true;
        
        //Save
        board.save((err, doc) => {
          //Error
          if(err){
            res.status(500).json({error: {server: 'Database Write Error.'}});
            console.log(err);
          }
          //Success.
          else { 
            //console.log(doc);
            res.json({success:'Thread succesfully reported.', thread_id: threadId });
          }
        });
        
      } // end of function updateThread()
  
    }) // end of PUT
  
    //DELETE a thread from board doc
    .delete(function (req, res){
    
      const boardName = req.params.board; // Board name
      const threadId = req.body.thread_id; // Thread Id
      const password = req.body.delete_password; // Reply delete password
      let errorMessage = { error: [] };  //Error message array

      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ validateDocs(); }
      else {res.status(400).json(errorMessage); }

      //Validate request body has thread_id and password
      function validateReq(){

        let valid = true;

        if(threadId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [thread_id].'});
          valid = false;
        }
        if(password == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [delete_password].'});
          valid = false;
        }

        return valid;

      } // end of function validateReq()
    
      //Validate board and thread exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = 'board threads'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId);
          
          //Thread exists. Validate delete password
          if(validThread){ 
            let thread = board.threads.id(threadId);
            //Password match. Proceed
            if(password == thread.delete_password){ deleteThread(board, thread); }
            //Incorrect Password
            else{  res.status(400).json({error: [{password: 'Incorrect Password'}]}); }
          }
          //Thread doesnt exist.
          else{ 
            res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); 
          }
        } // end of if ValidBoard has property 
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
    
      //Delete thread and update board doc
      function deleteThread(board, thread){
        
        //Remove thread
        thread.remove();
        
        //Save
        board.save((err, doc) => {
          //Error
          if(err){
            res.status(500).json({error: {server: 'Database Write Error.'}});
            console.log(err);
          }
          //Success. Return reply.
          else { 
            //console.log(doc);
            res.json({success:'Thread succesfully deleted.', reply_id: threadId });
          }
        });
      
      } // end of function deleteThread()
    
    }); // end of DELETE and ROUTE
    
  app.route('/api/replies/:board')
  
    //POST reply to thread
    .post(function (req, res){
    
      const boardName = req.params.board; // Board name
      const text = req.body.text;        //New thread text
      const deletePassword = req.body.delete_password; // Password to delete thread 
      const threadId = req.body.thread_id;  // Thread _id
      let errorMessage = { error: [] };  //Error message array
    
      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ validateDocs(); }
      else {res.status(400).json(errorMessage); }
    
      //Validate request body has text and delete_password
      function validateReq(){
        
        let valid = true;
        
        //No text
        if(text == undefined){
          errorMessage.error.push({request_body: "Request body missing property [text]."})
          valid = false;
        }
        //No delete_password
        if(deletePassword == undefined){
          errorMessage.error.push({request_body: "Request body missing property [delete_password]."})
          valid = false;
        }
        //No thread_id
        if(threadId == undefined){
          errorMessage.error.push({request_body: "Request body missing property [thread_id]."})
          valid = false;
        }
        
        //Text not string
        if(typeof(text) != 'string'){
          errorMessage.error.push({request_body: "Request body property [text] value must be a string."})
          valid = false;
        }
        //Delete_password not string
        if(typeof(deletePassword) != 'string'){
          errorMessage.error.push({request_body: "Request body property [delete_password] value must be a string."})
          valid = false;
        }
        //Thread_id not string
        if(typeof(threadId) != 'string'){
          errorMessage.error.push({request_body: "Request body property [thread_id] value must be a string."})
          valid = false;
        }
        
        return valid;
        
      } // end of function validateReq()
    
      //Validate board and thread exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = 'board threads';
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId); 
          
          //Thread exists. Proceed
          if(validThread){ createReply(board, board.threads.id(threadId)); }
          //Thread doesnt exist.
          else{ res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); }
        }
        
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
      
    
      //Add reply to thread and save
      function createReply(board, thread){
        let date = new Date();
        
        //Add Reply
        thread.replies.push({
            text: text,                             
            created_on: date,                          
            reported: false, 
            delete_password: deletePassword                    
          });
        //Update bumpbed on;
        thread.bumped_on = date;
        
        //Save
        board.save((err, doc) => {
          //Error
          if(err){
            res.status(500).json({error: {server: 'Database Write Error.'}});
            console.log(err);
          }
          //Success. Return reply.
          else { 
            let url = 'https://fcc-anon-msgboard-kl.glitch.me/b/' + boardName + '/' + threadId;
            res.redirect(url);
          }
        });
      
      } // end of function createReply()
  
    }) // end of POST
  
    //GET thread and all replies 
    .get(function (req, res){
    
      const boardName = req.params.board; // Board name
      const threadId = req.query.thread_id; // Thread Id
    
      //Validate query has thread id. Proceed if valid;
      if(threadId == undefined){ res.status(400).json({ error: [{query: 'Request query missing property [thread_id].'}] }); }
      else{ validateDocs(); };
    
      //Validate board and thread exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = '-threads.delete_password -threads.reported -threads.replies.delete_password -threads.replies.reported'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId); 
          
          //Thread exists. Proceed
          if(validThread){ returnThread(board, board.threads.id(threadId)); }
          //Thread doesnt exist.
          else{ res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); }
        }
        
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
    
      //Return thread and replies
      function returnThread(board, thread){
        res.json({thread: thread});
      }
    
      
    }) // end of GET
  
    //PUT update reply reported status to true
    .put(function (req, res){
    
      const boardName = req.params.board; // Board name
      const threadId = req.body.thread_id; // Thread Id
      const replyId = req.body.reply_id;  // Reply Id
      let errorMessage = { error: [] };  //Error message array
    
      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ validateDocs(); }
      else {res.status(400).json(errorMessage); }
    
      //Validate request body has thread_id and reply_id
      function validateReq(){
        
        let valid = true;
        
        if(threadId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [thread_id].'});
          valid = false;
        }
        if(replyId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [reply_id].'});
          valid = false;
        }
        
        return valid;
        
      } // end of function validateReq()
      
    
      //Validate board, thread and reply exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = 'board threads'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId);
          
          //Thread exists. Validate reply exists in thread sub-doc.
          if(validThread){ 
            let thread = board.threads.id(threadId);
            let validReply = validateReply(thread, replyId); 
          
            //Reply exists. Proceed.
            if(validReply) { 
              let reply = thread.replies.id(replyId);
              updateReply(board, thread, reply); 
            }
            //Reply doesn't exist
            else{ res.status(404).json({error: [{request: 'Reply [' + replyId + '] not found in thread [' + threadId + '] in board [' + boardName + '].'}]}); }
          }
          //Thread doesnt exist.
          else{ res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); }
        }
        
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
    
      //Update reply reported status to true and save
      function updateReply(board, thread, reply){
        
        //Update reported;
        reply.reported = true;
        
        //Save
        board.save((err, doc) => {
          //Error
          if(err){
            res.status(500).json({error: {server: 'Database Write Error.'}});
            console.log(err);
          }
          //Success. Return reply.
          else { 
            //console.log(doc);
            res.json({success:'Reply succesfully reported.', reply_id: replyId });
          }
        });
        
      } // end of function updateReply()
  
    }) // end of PUT
  
    //DELETE a reply (update text to deleted)
    .delete(function (req, res){
    
      const boardName = req.params.board; // Board name
      const threadId = req.body.thread_id; // Thread Id
      const replyId = req.body.reply_id;  // Reply Id
      const password = req.body.delete_password; // Reply delete password
      let errorMessage = { error: [] };  //Error message array
    
      //Run validation check. Proceed if request valid.
      let validReq = validateReq();
      if(validReq){ validateDocs(); }
      else {res.status(400).json(errorMessage); }
    
      //Validate request body has thread_id, reply_id, and delete_password
      function validateReq(){
        
        let valid = true;
        
        if(threadId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [thread_id].'});
          valid = false;
        }
        if(replyId == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [reply_id].'});
          valid = false;
        }
        if(password == undefined){ 
          errorMessage.error.push({request_body: 'Request body missing property [delete_password].'});
          valid = false;
        }
        
        return valid;
        
      } // end of function validateReq()
    
      //Validate board, thread, and reply exist in MongoDB
      async function validateDocs(){
      
        //Validate board and get doc
        let projection = 'board threads'; // Omit delete password and reported
        let validBoard = await validateBoard(boardName, projection);
        
        //Board exists. Validate thread exists in board doc
        if(validBoard.hasOwnProperty('success')){ 
          
          let board = validBoard.success;
          let validThread = validateThread(board, threadId);
          
          //Thread exists. Validate reply exists in thread sub-doc.
          if(validThread){ 
            let thread = board.threads.id(threadId);
            let validReply = validateReply(thread, replyId); 
          
            //Reply exists. Validate password.
            if(validReply) { 
              let reply = thread.replies.id(replyId);
              //Password match. Proceed
              if(password == reply.delete_password){ deleteReply(board, thread, reply); }
              else{ res.status(400).json({error: [{password: 'Incorrect Password'}]}); }
               
            }
            //Reply doesn't exist
            else{ res.status(404).json({error: [{request: 'Reply [' + replyId + '] not found in thread [' + threadId + '] in board [' + boardName + '].'}]}); }
          }
          //Thread doesnt exist.
          else{ res.status(404).json({error: [{request: 'Thread [' + threadId + '] not found in board [' + boardName + '].'}]}); }
        }
        
        //Board doesn't exist
        else if( validBoard.error == 500){ res.status(500).json({error: [{server: "Database Read Error."}]}); }
        else { res.status(404).json({error: [{endpoint: 'Board [' + boardName + '] not found.'}]}); }
        
      } // end of function validateDocs()
    
      //Delete reply and update board doc
      function deleteReply(board, thread, reply){
        
        //Update reply text
        reply.text = '[deleted]';
        
        //Save
        board.save((err, doc) => {
          //Error
          if(err){
            res.status(500).json({error: {server: 'Database Write Error.'}});
            console.log(err);
          }
          //Success. Return reply.
          else { 
            //console.log(doc);
            res.json({success:'Reply succesfully deleted.', reply_id: replyId });
          }
        });
        
      } // end of function deleteReply
  
    }); // end of DELETE and ROUTE
  
  app.route('/api/boards')
    
    //Get ALL boards and threadcount (except test board)
    .get(function (req, res){
      Board.find({board: {$nin: ['test']}}, (err, doc) =>{
        //Error
        if(err){
          console.log(err);
          res.status(500).json({error: [{server: "Database Read Error."}]});
        }
        //Boards found.
        else{
          //Pull out board name and thread count
          let boards = [];
          doc.forEach(board => {
            boards.push({board: board.board, thread_count: board.threads.length});
          });
          //Sort by most threads
          let sortedBoards = boards.sort(function(a, b) {
  return b.thread_count - a.thread_count;
});
          res.json({boards: sortedBoards})
        }
      
      });
  
    })
  
    //Create new board
    .post(function (req, res){
    
      const boardName = req.body.board; 
      
      validateBoardName();
    
      //Check if boardname taken.
      function validateBoardName(){
        
        Board.find({board: boardName}, (err, doc) =>{
          //Error
          if(err){
            console.log(err);
            res.status(500).json({error: [{server: "Database Read Error."}]});
          }
          //Board exists already.
          else if (doc.length != 0){ 
            res.status(400).json({error: [{name: "Board [" + boardName + "] already exists. Please choose another name." }]}); 
          }
          else{ createBoard(); }
        });
        
      } // end of function validateBoardName
    
      //Create new board in DB
      function createBoard(){
      
        let newBoard = new Board({ board: boardName, threads: [] });
        newBoard.save((err, data) => {
          if(err){ 
            console.log(err); 
            res.status(500).json({error: [{server: "Database Write Error."}]});
          }
          //Success. Redirect to bard
          else{ 
            let url = 'https://fcc-anon-msgboard-kl.glitch.me/b/' + boardName;
            res.redirect(url);
          }
        });
      }
      
  
    }); // end of GET
  
  
  //Validate board exists
  function validateBoard(boardName, projection){

    return new Promise(function (resolve, reject) {

      Board.findOne({board: boardName}, projection, (err, doc) =>{
        //Error
        if(err){
          console.log(err);
          resolve({ error: 500});
        }
        //Board not found.
        else if (doc == null){ resolve({ error: 'error'}); }
        //Board found. Proceed and pass board document
        else{ resolve({ success: doc }); }
      }); // end of findOne

    }); // end of Promise

  } // end of function validateBoard()
  
  
  //Validate thread exists
  function validateThread(board, threadId){

      let valid = true;        
    
      //Filter threads for id match
      let threadToUpdate = board.threads.filter(thread => thread._id == threadId);

      //No match
      if(threadToUpdate.length == 0) { valid = false; }

      return valid;

  } // end of function validateThread()
  
  //Validate reply exists
  function validateReply(thread, replyId){

      let valid = true;        
    
      //Filter threads for id match
      let replyToUpdate = thread.replies.filter(reply => reply._id == replyId);

      //No match
      if(replyToUpdate.length == 0) { valid = false; }

      return valid;

  } // end of function validateThread()
      

};
