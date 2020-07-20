// ==UserScript==
// @name         Skribbl Assistant
// @version      1.1.0
// @description  Fetches the Skribbl.io wordlist and displays clickable hints based on the current word's pattern.
// @author       sspathare97
// @match        https://skribbl.io/*
// @grant        none
// @namespace    https://greasyfork.org/en/users/668361-sspathare97
// ==/UserScript==

(async () => {
  'use strict';

  const formChat = document.getElementById('formChat');
  const inputChat = document.getElementById('inputChat');
  const currentWord = document.getElementById('currentWord');
  const containerSidebar = document.getElementById('containerSidebar');
  const boxMessages = document.getElementById('boxMessages');
  const containerFreespace = document.getElementById('containerFreespace');

  const refreshDelay = 500;
  let wordList;
  let currentWordVal = '';
  let enabled = false;
  let assistantPanel;
  let hintBox;

  const disabledText = 'Press ALT to enable Skribbl Assistant.';
  const enabledText = 'Type to highlight hints. Press ALT to disable.';

  const hintClick = (event) => {
    const inputChatVal = inputChat.value;
    inputChat.value = event.target.innerHTML;
    formChat.dispatchEvent(
      new Event('submit', {
        bubbles: true,
        cancelable: true,
      })
    );
    inputChat.value = inputChatVal;
    assist();
  };

  const assist = (event, wordChanged = false) => {
    const currentWordVal = currentWord.textContent;
    let wordRegex = currentWordVal.replace(/_/g, '[^ \\-"]');
    wordRegex = '"'.concat(wordRegex, '"');
    wordRegex = new RegExp(wordRegex, 'g');

    let hints = wordList.match(wordRegex);
    if (!hints) {
      hintBox.innerHTML = '<span style="color:black">Sorry, no hints available!</span>';
      return;
    } else {
      hintBox.innerHTML = '<span style="color:black">Click on a hint to submit it: </span><br>';
    }
    hints = hints.map((hint) => {
      return hint.substring(1, hint.length - 1);
    });
    hints = hints.sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    if (localStorage.Skribbl_Assistant_Debug && wordChanged) {
      console.log({currentWordVal, wordRegex, hints});
    }

    const inputChatVal = inputChat.value;
    hints.forEach((hint) => {
      const hintSpan = document.createElement('a');
      hintSpan.innerHTML = hint;
      hintSpan.style.color = 'royalblue';
      hintSpan.href = 'javascript:void(0);';
      hintSpan.onclick = hintClick;
      if (
        inputChatVal &&
        hint.toLowerCase().search(inputChatVal.toLowerCase()) !== -1
      ) {
        hintSpan.style.background = 'greenyellow';
      }
      hintBox.appendChild(hintSpan);
      hintBox.appendChild(document.createTextNode(', '));
    });
    hintBox.removeChild(hintBox.lastChild);

    boxMessages.scrollTop = boxMessages.scrollHeight;
  };

  const initialize = async () => {
    try {
      wordList = await fetch(
        'https://api.npoint.io/91ac00bc3d335f00e13f'
      ).then((response) => response.json());
    } catch (e) {
      await new Promise((resolve) => setTimeout(resolve, refreshDelay));
      return initialize();
    }

    wordList = JSON.stringify(wordList);
    wordList = wordList.substring(1, wordList.length - 1);

    if (localStorage.Skribbl_Assistant_Debug) {
      console.log({wordList});
    }

    containerFreespace.style.display = 'none';
    assistantPanel = document.createElement('p');

    assistantPanel.innerHTML = `
        <span style="font-size: larger">
          <strong>
            <a target="_blank" href="https://github.com/sspathare97/skribbl-assistant" style="color:green">Skribbl Assistant</a>
            <span style="color:royalblue">by</span> 
            <a target="_blank" href="https://sspathare97.com/" style="color:green">sspathare97</a>
          </strong>
        </span>
        <br>
      `;

    assistantPanel.style = `
        display: none;
        background: rgb(238, 238, 238);
        overflow-wrap: break-word;
        border-radius: 2px;
        border: 4px solid rgb(238, 238, 238);
        width: 100%;
        max-height: 250px;
        overflow-y: auto;
        color: rgb(57, 117, 206);
    `;

    hintBox = document.createElement('span');
    assistantPanel.appendChild(hintBox);

    containerSidebar.insertBefore(
      assistantPanel,
      containerSidebar.childNodes[0]
    );

    inputChat.setAttribute('placeholder', disabledText);

    document.body.onkeyup = (event) => {
      if (event.key === 'Alt') {
        enabled = !enabled;
        if (enabled) {
          assistantPanel.style.display = '';
          inputChat.setAttribute('placeholder', enabledText);
        } else {
          assistantPanel.style.display = 'none';
          inputChat.setAttribute('placeholder', disabledText);
        }
      }
    };

    inputChat.onkeyup = assist;

    setInterval(() => {
      if (
        currentWord &&
        currentWord.textContent.indexOf('_') !== -1
      ) {
        if (currentWordVal !== currentWord.textContent) {
          hintBox.style.display = '';
          assist(undefined, true);
          currentWordVal = currentWord.textContent;
        }
      } else {
        hintBox.style.display = 'none';
        currentWordVal = '';
      }
    }, refreshDelay);
  };

  initialize();
})();
