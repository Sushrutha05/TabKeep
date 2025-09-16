const sessionInput = document.getElementById('sessionNameInput');
const notification = document.getElementById('notification');
const messageDiv = document.getElementById('message');
const currentTabsPreview = document.getElementById('currentTabsPreview');
const refreshPreviewBtn = document.getElementById('refreshPreview');

// Clear notification
function clearNotification() {
  notification.textContent = "";
}

// Show notification
function showNotification(message, color = 'red', duration = 3000) {
  notification.style.color = color;
  notification.textContent = message;
  setTimeout(() => {
    notification.textContent = "";
  }, duration);
}

// Preview current tabs
function previewCurrentTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    currentTabsPreview.innerHTML = "";
    if (tabs.length === 0) {
      currentTabsPreview.textContent = "No tabs open!";
      return;
    }

    tabs.forEach(tab => {
      const p = document.createElement('p');
      p.textContent = `${tab.title} — ${tab.url}`;
      currentTabsPreview.appendChild(p);
    });
  });
}

// Refresh button
refreshPreviewBtn.addEventListener('click', previewCurrentTabs);

// Update preview on popup open
previewCurrentTabs();

// Save tabs
document.getElementById('storeTabs').addEventListener("click", () => {
  clearNotification();

  let sessionName = sessionInput.value.trim();
  if (!sessionName) {
    showNotification("Session name cannot be empty!", 'red');
    return;
  }

  chrome.tabs.query({currentWindow: true}, (tabs) => {
    if (tabs.length === 0) {
      showNotification("No tabs are open to save.", 'red');
      return;
    }

    chrome.storage.local.get("savedSets", (result) => {
      let savedSets = result.savedSets || {};

      if (savedSets.hasOwnProperty(sessionName)) {
        showNotification(`A session named "${sessionName}" already exists.`, 'red');
        return;
      }

      savedSets[sessionName] = tabs.map(tab => ({ title: tab.title, url: tab.url }));

      chrome.storage.local.set({ savedSets }, () => {
        showNotification(`Saved "${sessionName}" with ${tabs.length} tabs.`, 'green');
        sessionInput.value = "";
      });
    });
  });
});

// Show saved sessions
document.getElementById('showTabs').addEventListener("click", () => {
  clearNotification();
  messageDiv.innerHTML = "";

  chrome.storage.local.get("savedSets", (result) => {
    let savedSets = result.savedSets || {};
    if (Object.keys(savedSets).length === 0) {
      messageDiv.textContent = "No sessions saved yet.";
      return;
    }

    let ul = document.createElement('ul');

    for (let sessionName in savedSets) {
      let li = document.createElement('li');

      // Session name click to restore
      let span = document.createElement('span');
      span.textContent = sessionName;
      span.className = "session-name";
      span.addEventListener("click", () => {
        let tabs = savedSets[sessionName];
        if (tabs.length > 0) {
          // Open all tabs in a new window
          chrome.windows.create({ url: tabs.map(tab => tab.url) });
        }
      });

      // Preview button
      let previewBtn = document.createElement('button');
      previewBtn.textContent = "👁️";
      previewBtn.className = "preview";

      let previewDiv = document.createElement('div');
      previewDiv.className = "preview-div";

      previewBtn.addEventListener("click", () => {
        if (previewDiv.style.display === "none" || previewDiv.style.display === "") {
          previewDiv.innerHTML = "";
          savedSets[sessionName].forEach(tab => {
            let p = document.createElement('p');
            p.textContent = `${tab.title} — ${tab.url}`;
            previewDiv.appendChild(p);
          });
          previewDiv.style.display = "block";
        } else {
          previewDiv.style.display = "none";
        }
      });

      // Delete button
      let delBtn = document.createElement('button');
      delBtn.textContent = "🗑️";
      delBtn.className = "delete";
      delBtn.addEventListener("click", () => {
        if (li.querySelector(".delete-confirm")) return;

        let confirmDiv = document.createElement("span");
        confirmDiv.className = "delete-confirm";
        confirmDiv.style.marginLeft = "10px";
        confirmDiv.style.fontSize = "12px";
        confirmDiv.style.color = "#e74c3c";
        confirmDiv.textContent = " Are you sure? ";

        let yesBtn = document.createElement("button");
        yesBtn.textContent = "Yes";
        yesBtn.style.marginLeft = "5px";
        yesBtn.addEventListener("click", () => {
          delete savedSets[sessionName];
          chrome.storage.local.set({ savedSets }, () => {
            li.remove();
          });
        });

        let noBtn = document.createElement("button");
        noBtn.textContent = "No";
        noBtn.style.marginLeft = "5px";
        noBtn.addEventListener("click", () => {
          confirmDiv.remove();
        });

        confirmDiv.appendChild(yesBtn);
        confirmDiv.appendChild(noBtn);
        li.appendChild(confirmDiv);
      });

      li.appendChild(span);
      li.appendChild(previewBtn);
      li.appendChild(delBtn);
      li.appendChild(previewDiv);

      ul.appendChild(li);
    }

    messageDiv.appendChild(ul);
  });
});
