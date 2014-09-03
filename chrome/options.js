// Saves options to chrome.storage
function save_options() {
  var script_id = document.getElementById('script_id').value;
  chrome.storage.sync.set({
    script_id: script_id,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    script_id: ''
  }, function(items) {
    document.getElementById('script_id').value = items.script_id;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
