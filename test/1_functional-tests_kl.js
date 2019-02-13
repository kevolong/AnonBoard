/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var expect = chai.expect;

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      let text = 'Testing 1-2-3 15';
      let password = 'test123';
      
      test('Test POST new thread - success', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({text: text, delete_password: password})
          .end(function(err, res){
            expect(res).to.redirectTo('https://fcc-anon-msgboard-kl.glitch.me/b/test');
            done();
          });
      });
      
      test('Test POST new thread - missing [text]', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({delete_password: 'halfsls'})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [text].', 'Missing [text] should throw error');
            done();
          });
      });
      
      test('Test POST new thread - missing [delete_password]', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({text: 'halfsls'})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [delete_password].', 'Missing [delete password] should throw error');
            done();
          });
      });
      
      test('Test POST new thread - missing [text] && missing [delete_password]', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [text].', 'Missing [text] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [delete_password].', 'Missing [delete password] should throw error');
            done();
          });
      });
      
      test('Test POST new thread - [text] value not a string', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({text: ['i am an array'], delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [text] value must be a string.', '[text] value not a string should throw error');
            done();
          });
      });
      
      test('Test POST new thread - [delete password] value not a string', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({text: text, delete_password: 99})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [delete_password] value must be a string.', '[delete_password] value not a string should throw error');
            done();
          });
      });
      
       test('Test POST new thread - [text] value not a string && delete password not a string', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({text: ['i am an array'], delete_password: {password: 99}})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [text] value must be a string.', '[text] value not a string should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body property [delete_password] value must be a string.', '[delete_password] value not a string should throw error');
            done();
          });
      });
      
    }); // end of sub-suite POST 
    
    //Get latest 10 threads with latest 3 replies
    suite('GET', function() {
      
      test('Test GET board - success', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.board, 'test', 'Board name should return same');
            assert.isArray(res.body.latest_threads, 'Latest threads should be an array array');
            assert.isArray(res.body.latest_threads[0].latest_replies, 'Latest replies should be an array array');
            done();
          });
      });
      
      test('Test GET board - board not found', function(done) {
        chai.request(server)
          .get('/api/threads/testlslslsllsls')
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testlslslsllsls] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      
    }); // end of sub-suite GET 
    
    suite('PUT', function() {
      let thread = '5bc8d628bf24be595fa1eb71';
      
      test('Test PUT report thread - success', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.thread_id, thread, 'Reply id should return same');
            assert.equal(res.body.success, 'Thread succesfully reported.');
            done();
          });
      });
      
      test('Test PUT report thread - missing [thread_id]', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            done();
          });
      });
      
      test('Test PUT report thread - board not found', function(done) {
        chai.request(server)
          .put('/api/threads/testslsllsssss')
          .send({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testslsllsssss] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test PUT report thread - thread not found', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({thread_id: 's88383sllsls'})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [s88383sllsls] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
      
    }); // end of sub-suite PUT 
    
    suite('DELETE', function() {
      
      let thread = '5bc8cb49ddd39c0c02c84b9e'; // #4
      let password = 'test123';
      
      test('Test DELETE thread - incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id: thread, delete_password: 'babyjesus'})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].password, 'Incorrect Password');
            done();
          });
      });
      
      
      test('Test DELETE thread - success', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id: thread, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.reply_id, thread, 'Thread id should return same');
            assert.equal(res.body.success, 'Thread succesfully deleted.');
            done();
          });
      });
      
      test('Test DELETE thread - missing [thread_id]', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            done();
          });
      });
      
      test('Test DELETE thread - missing [delete_password]', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [delete_password].', 'Missing [delete_password] should throw error');
            done();
          });
      });
      
      test('Test DELETE thread - missing [thread_id] && [delete_password]', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [delete_password].', 'Missing [delete_password] should throw error');
            done();
          });
      });
      
      test('Test DELETE thread - board not found', function(done) {
        chai.request(server)
          .delete('/api/threads/testslsllsssss')
          .send({thread_id: thread, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testslsllsssss] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test DELETE thread - thread not found', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id: 's88383sllsls', delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [s88383sllsls] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
    }); // end of sub-suite DELETE 
    

  }); // end of suite API routing for /api/threads
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
      let text = 'Reply Testing 1-2-3: ' + Math.floor(Math.random() * 1000000);
      let password = 'test123';
      let thread = '5bc8cb8e5f215b0ed1ac6352'
      
      test('Test POST new reply - success', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: text, delete_password: password, thread_id: thread})
          .end(function(err, res){
            expect(res).to.redirectTo('https://fcc-anon-msgboard-kl.glitch.me//b/test/5bc8cb8e5f215b0ed1ac6352');
            done();
          });
      });
      
      test('Test POST new reply - missing [text]', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({delete_password: 'halfsls', thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [text].', 'Missing [text] should throw error');
            done();
          });
      });
      
      test('Test POST new reply - missing [delete_password]', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: 'halfsls', thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [delete_password].', 'Missing [delete password] should throw error');
            done();
          });
      });
      
      test('Test POST new reply - missing [text] && missing [delete_password]', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [text].', 'Missing [text] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [delete_password].', 'Missing [delete password] should throw error');
            done();
          });
      });
      
      test('Test POST new reply - missing [text], [delete_password], && [thread_id]', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [text].', 'Missing [text] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [delete_password].', 'Missing [delete password] should throw error');
            assert.equal(res.body.error[2].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            done();
          });
      });
      
      test('Test POST new reply - [text] value not a string', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: ['i am an array'], delete_password: password, thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [text] value must be a string.', '[text] value not a string should throw error');
            done();
          });
      });
      
      test('Test POST new reply - [delete_password] value not a string', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: text, delete_password: 99, thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [delete_password] value must be a string.', '[delete_password] value not a string should throw error');
            done();
          });
      });
      
      test('Test POST new reply - [thread_id] value not a string', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: text, delete_password: password, thread_id: {id: 9939393939}})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [thread_id] value must be a string.', '[thread_id] value not a string should throw error');
            done();
          });
      });
      
       test('Test POST new reply - [text] value not a string && [delete password] not a string', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: ['i am an array'], delete_password: {password: 99}, thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [text] value must be a string.', '[text] value not a string should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body property [delete_password] value must be a string.', '[delete_password] value not a string should throw error');
            done();
          });
      });
      
      test('Test POST new thread - [text], [delete password], and [thread_id] values not a string', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: ['i am an array'], delete_password: {password: 99}, thread_id: 99})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body property [text] value must be a string.', '[text] value not a string should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body property [delete_password] value must be a string.', '[delete_password] value not a string should throw error');
            assert.equal(res.body.error[2].request_body, 'Request body property [thread_id] value must be a string.', '[delete_password] value not a string should throw error');
            done();
          });
      });
      
      test('Test POST new reply - board not found', function(done) {
        chai.request(server)
          .post('/api/replies/test393lslxlslsls')
          .send({text: text, delete_password: password, thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [test393lslxlslsls] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test POST new reply - thread not found', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({text: text, delete_password: password, thread_id: '5aeiclslsls39393slsl'})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [5aeiclslsls39393slsl] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
      
    }); //end of sub-suite POST 
    
    suite('GET', function() {
      
      let password = 'test123';
      let thread = '5bc8cb8e5f215b0ed1ac6352';
      
      test('Test GET thread - success', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.thread._id, thread, 'Thread id should return same');
            assert.isArray(res.body.thread.replies, 'Thread object should have replies array');
            done();
          });
      });
      
      test('Test GET thread - board not found', function(done) {
        chai.request(server)
          .get('/api/replies/testlslslsllsls')
          .query({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testlslslsllsls] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test GET thread - thread not found', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id: 'lslsls939ALAslsllss93'})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [lslsls939ALAslsllss93] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
      test('Test GET thread - missing query', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].query, 'Request query missing property [thread_id].');
            done();
          });
      });
      
      
    }); // end of sub-suite GET 
    
    suite('PUT', function() {
      
      let thread = '5bc8cb8e5f215b0ed1ac6352';
      let reply = '5bca05671012e2069d487266';
      
      test('Test PUT report reply - success', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id: thread, reply_id: reply})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.reply_id, reply, 'Reply id should return same');
            assert.equal(res.body.success, 'Reply succesfully reported.');
            done();
          });
      });
      
      test('Test PUT report reply - missing [thread_id]', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({reply_id: reply})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            done();
          });
      });
      
      test('Test PUT report reply - missing [reply_id]', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id: thread})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [reply_id].', 'Missing [reply_id] should throw error');
            done();
          });
      });
      
      test('Test PUT report reply - missing [thread_id] && [reply_id]', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [reply_id].', 'Missing [reply_id] should throw error');
            done();
          });
      });
      
      test('Test PUT report reply - board not found', function(done) {
        chai.request(server)
          .put('/api/replies/testslsllsssss')
          .send({thread_id: thread, reply_id: reply})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testslsllsssss] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test PUT report reply - thread not found', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id: 's88383sllsls', reply_id: reply})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [s88383sllsls] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
      test('Test PUT report reply - reply not found', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id: thread, reply_id: 'ssllslsls933slsl'})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Reply [ssllslsls933slsl] not found in thread [5bc8cb8e5f215b0ed1ac6352] in board [test].');
            done();
          });
      });
      
      
      
    }); // end of sub-suite PUT 
    
    suite('DELETE', function() {
      
      let thread = '5bc8cb8e5f215b0ed1ac6352';
      let reply = '5bc8f4f477f2af59d820342b';
      let password = 'test123';
      
      test('Test DELETE reply - success', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: thread, reply_id: reply, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.reply_id, reply, 'Reply id should return same');
            assert.equal(res.body.success, 'Reply succesfully deleted.');
            done();
          });
      });
      
      test('Test DELETE reply - missing [thread_id]', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({reply_id: reply, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - missing [reply_id]', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: thread, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [reply_id].', 'Missing [reply_id] should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - missing [delete_password]', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: thread, reply_id: reply})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [delete_password].', 'Missing [delete_password] should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - missing [thread_id], [reply_id], and [delete_password]', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].request_body, 'Request body missing property [thread_id].', 'Missing [thread_id] should throw error');
            assert.equal(res.body.error[1].request_body, 'Request body missing property [reply_id].', 'Missing [reply_id] should throw error');
            assert.equal(res.body.error[2].request_body, 'Request body missing property [delete_password].', 'Missing [delete_password] should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - board not found', function(done) {
        chai.request(server)
          .delete('/api/replies/testslsllsssss')
          .send({thread_id: thread, reply_id: reply, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].endpoint, 'Board [testslsllsssss] not found.', 'Non-existent board should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - thread not found', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: 's88383sllsls', reply_id: reply, delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Thread [s88383sllsls] not found in board [test].', 'Non-existent thread should throw error');
            done();
          });
      });
      
      test('Test DELETE reply - reply not found', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: thread, reply_id: 'ssllslsls933slsl', delete_password: password})
          .end(function(err, res){
            assert.equal(res.status, 404);
            assert.equal(res.body.error[0].request, 'Reply [ssllslsls933slsl] not found in thread [5bc8cb8e5f215b0ed1ac6352] in board [test].');
            done();
          });
      });
      
      test('Test DELETE reply - incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id: thread, reply_id: reply, delete_password: 'babyjesus'})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].password, 'Incorrect Password');
            done();
          });
      });
      
    }); // end of sub-suite DELETE
    
  }); // end of suite API Routing for /api/replies 
  
  suite('API ROUTING FOR /api/boards/', function() {
    
    //Get all boards except test.
    suite('GET', function() {
      
      test('Test GET board - success', function(done) {
        chai.request(server)
          .get('/api/boards')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body.boards, 'Boards object should be an array of boards');
            assert.property(res.body.boards[0],'board', 'Board object should have property board');
            assert.isNumber(res.body.boards[0].thread_count, 'Thread count should be a number');
            done();
          });
      });
    }); // end of sub-suite GET
      
    //Post new board
    suite('POST', function() {
      
      let randBoard = 'test' + Math.ceil(Math.random() * 100000);
      
      test('Test POST board - success', function(done) {
        chai.request(server)
          .post('/api/boards')
          .send({board: randBoard})
          .end(function(err, res){
            expect(res).to.redirectTo('https://fcc-anon-msgboard-kl.glitch.me/b/' + randBoard);
            done();
          });
      });
    
      
      test('Test POST board - already exists', function(done) {
        chai.request(server)
          .post('/api/boards')
          .send({board: 'test'})
          .end(function(err, res){
            assert.equal(res.status, 400);
            assert.equal(res.body.error[0].name, 'Board [test] already exists. Please choose another name.','Posting board with name that already exists should throw error');
            done();
          });
      });
    
    }); // end of sub-suite POST
    
  }); // end of suite API Routing for /api/boards

});
