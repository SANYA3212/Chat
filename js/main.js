    import { fetchGeneratedTitle } from './titleHandler.js';
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let currentModel = "";
    let streamAbortController = null;
    let editingIndex = null;
    let currentTheme = "dark";
    let toolsEnabled = false;
    let isModelInstalling = false;
    let currentInstallingModelName = null;
    let globalInstallPercent = 0;
    let isGeneratingTitle = false;

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function applyHighlightTheme(theme) {
      const lightThemeLink = document.getElementById('highlight-light-theme');
      const darkThemeLink = document.getElementById('highlight-dark-theme');

      if (!lightThemeLink || !darkThemeLink) {
        console.error('Highlight.js theme link elements not found!');
        return;
      }

      if (theme === 'light') {
        lightThemeLink.removeAttribute('disabled');
        darkThemeLink.setAttribute('disabled', 'disabled');
      } else { // Default to dark theme
        darkThemeLink.removeAttribute('disabled');
        lightThemeLink.setAttribute('disabled', 'disabled');
      }
    }

    window.approvePlan = function(planId) {
        // Find the chat and the message with the plan
        const chat = chats.find(c => c.id === activeChatId);
        if (!chat) return;

        // For simplicity, we send a direct message to the AI.
        // A more robust implementation might involve marking the plan as approved.
        chatInput.value = "Yes, proceed with the plan.";
        sendMessage();

        // Optional: Disable the buttons for this plan
        const planContainer = document.getElementById(planId);
        if (planContainer) {
            const buttons = planContainer.querySelectorAll('.plan-actions button');
            buttons.forEach(button => button.disabled = true);
        }
    }

    window.rejectPlan = function(planId) {
        // Find the chat and the message with the plan
        const chat = chats.find(c => c.id === activeChatId);
        if (!chat) return;

        // For simplicity, we send a direct message to the AI.
        // A more robust implementation might involve marking the plan as rejected.
        chatInput.value = "No, that plan is not correct. Please propose a new one.";
        sendMessage();
    }


    // --- ЭЛЕМЕНТЫ СТРАНИЦЫ ---
    const newChatBtn = document.getElementById("newChat");
    const changeModelBtn = document.getElementById("changeModel");
    const openSettingsBtn = document.getElementById("openSettings");
    const closeModelModal = document.getElementById("closeModelModal");
    const closeSettingsModal = document.getElementById("closeSettingsModal");
    const chatInput = document.getElementById("chatInput");
    const fileInput = document.getElementById("fileInput");
    const sendBtn = document.getElementById("sendBtn");
    const stopBtn = document.getElementById("stopBtn");
    const toolsBtn = document.getElementById("toolsBtn");
    const chatList = document.getElementById("chatList");
    const chatContent = document.getElementById("chatContent");
    const dragOverlay = document.getElementById("dragOverlay");
    const imageUploadBtn = document.getElementById("imageUploadBtn");
    const languageSelect = document.getElementById("languageSelect");
    const defaultModelSelect = document.getElementById("defaultModelSelect");
    const currentModelDisplay = document.getElementById("currentModelDisplay");
    const settingsModal = document.getElementById("settingsModal");
    const modelModal = document.getElementById("modelModal");
    const modelOptionsContainer = document.getElementById("modelOptionsContainer");
    const modelCustomContainer = document.getElementById("modelCustomContainer");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const attachmentsContainer = document.getElementById("attachmentsContainer");
    const introText = document.getElementById("introText");
    const introTitleEl = document.getElementById("introTitle");
    const introSubtitleEl = document.getElementById("introSubtitle");
    const toggleSidebar = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");
    const bgImageInput = document.getElementById("bgImageInput");
    const uploadBgBtn = document.getElementById("uploadBgBtn");
    const resetBgBtn = document.getElementById("resetBgBtn");
    const bgPreview = document.getElementById("bgPreview");
    const bgPreviewText = document.getElementById("bgPreviewText");
    const gradientColor1 = document.getElementById("gradientColor1");
    const gradientColor2 = document.getElementById("gradientColor2");
    const applyGradientBtn = document.getElementById("applyGradientBtn");
    const mainContent = document.getElementById("mainContent");
    const modelTemperatureInput = document.getElementById("modelTemperatureInput");
    const modelTemperatureValueSpan = document.getElementById("modelTemperatureValueSpan");

    const sidebarModelInstallProgressContainer = document.getElementById("sidebarModelInstallProgressContainer");
    const sidebarProgressLabel = document.getElementById("sidebarProgressLabel");
    const sidebarProgressFill = document.getElementById("sidebarProgressFill");
    const sidebarProgressText = document.getElementById("sidebarProgressText");

    let imageFilesBase64 = [];
    let imageFiles = [];
    let fileAttachments = [];

    function updateInterfaceLanguage(lang) {
      document.getElementById("headerTitle").textContent = translations[lang].headerTitle;
      newChatBtn.innerHTML = `<img src="icon/plus.png" alt="New Chat" style="width:28px;height:28px;"> ${translations[lang].newChat}`;
      changeModelBtn.innerHTML = `<img src="icon/model.png" alt="Change Model" style="width:28px;height:28px;"> ${translations[lang].changeModel}`;
      openSettingsBtn.innerHTML = `<img src="icon/settings.png" alt="Settings" style="width:28px;height:28px;"> ${translations[lang].settings}`;
      chatInput.placeholder = translations[lang].inputPlaceholder;
      introTitleEl.textContent = translations[lang].introTitle;
      introSubtitleEl.textContent = translations[lang].introSubtitle;
      document.getElementById("settingsModalTitle").textContent = translations[lang].settingsModalTitle;
      document.getElementById("languageLabel").textContent = translations[lang].languageLabel;
      document.getElementById("defaultModelLabel").textContent = translations[lang].defaultModelLabel;
      document.getElementById("modelTemperatureLabel").textContent = translations[lang].modelTemperatureLabel;
      saveSettingsBtn.textContent = translations[lang].saveSettings;
      document.getElementById("modelModalTitle").textContent = translations[lang].modelModalTitle;
      dragOverlay.querySelector('p').textContent = translations[lang].dropFilesHere;
      imageUploadBtn.title = translations[lang].attachFile;
      closeModelModal.title = translations[lang].close;
      closeSettingsModal.title = translations[lang].close;
      currentModelDisplay.textContent = translations[lang].currentModel + (currentModel || "—");
      document.getElementById("themeLabel").textContent = translations[lang].themeLabel;
      document.getElementById("backgroundLabel").textContent = translations[lang].backgroundLabel;
      uploadBgBtn.textContent = translations[lang].installModel;
      resetBgBtn.textContent = translations[lang].deleteBtn;
    }

    function autoResize() {
      chatInput.style.height = 'auto';
      const maxHeight = 200;
      chatInput.style.height = Math.min(chatInput.scrollHeight, maxHeight) + 'px';
    }

    window.copyMessageContent = function(btn) {
      const messageBlock = btn.closest('.message-block');
      if (!messageBlock) return;
      const texts = Array.from(messageBlock.querySelectorAll('.chat-text'))
                        .map(el => el.innerText)
                        .join("\n");
      navigator.clipboard.writeText(texts).then(() => {
        const lang = languageSelect.value;
        const oldHTML = btn.innerHTML;
        btn.innerHTML = `<img src="icon/copy.png" alt="Copy" style="width:24px; height:24px;"> ${translations[lang].copiedBtn}`;
        setTimeout(() => {
          btn.innerHTML = oldHTML;
        }, 1500);
      });
    }

    window.copyCode = function(btn) {
      const codeElement = btn.parentElement.querySelector('code');
      if (!codeElement) return;
      const codeText = codeElement.textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        const lang = languageSelect.value;
        const oldHTML = btn.innerHTML;
        btn.innerHTML = translations[lang].copiedBtn;
        setTimeout(() => {
          btn.innerHTML = oldHTML;
        }, 1500);
      });
    }

    window.editUserMessage = function(btn) {
      const messageBlock = btn.closest('.message-block');
      if (!messageBlock) return;
      const chatTextElement = messageBlock.querySelector('.chat-text');
      if (!chatTextElement) return;
      const originalText = chatTextElement.innerText.trim();
      const chat = chats.find(c => c.id === activeChatId);
      if (!chat) return;
      const msgIndex = chat.history.findIndex(m =>
        m.role.toLowerCase() === "user" &&
        (m.display || "").trim() === originalText
      );
      if (msgIndex === -1) return;
      chat.history = chat.history.slice(0, msgIndex + 1);
      editingIndex = msgIndex;
      chatInput.value = originalText;
      autoResize();
      updateChatWindow();
      chatInput.focus();
    }

    function escapeHtml(str) {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function parseContentForCodeBlocks(content, modelNameForMessage = '') {
        content = content.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, "");

        // Handle <plan> tags by replacing them in the content before rendering
        const planRegex = /<plan>([\s\S]*?)<\/plan>/g; // Use global flag to replace all occurrences
        content = content.replace(planRegex, (match, planContent) => {
            const planId = `plan-${Date.now()}-${Math.random()}`;
            let planHtml = `<div class="plan-container" id="${planId}">`;
            planHtml += `<h4>План выполнения</h4>`;
            planHtml += window.markdown.render(planContent.trim()); // Render markdown inside the plan
            planHtml += `<div class="plan-actions">`;
            planHtml += `<button onclick="approvePlan('${planId}')">Утвердить</button>`;
            planHtml += `<button onclick="rejectPlan('${planId}')">Отклонить</button>`;
            planHtml += `</div></div>`;
            return planHtml;
        });


        // >>> НАЧАЛО КОСТЫЛЯ ДЛЯ DEEPSEEK MATHJAX
        let isDeepseekModel = false;
        if (modelNameForMessage && modelNameForMessage.toLowerCase().includes("deepseek")) {
            isDeepseekModel = true;
        }

        if (isDeepseekModel) {
            console.log('[MathJaxDebug] Deepseek model detected, applying MathJax content fixes for [] and [[]]. Content before fix:', content);
            content = content.replace(/\[((?:[^\$\(\)\[\]]|\[(?:\^|\_|[a-zA-Z0-9]))*?[\^_a-zA-Z0-9\\](?:[^\$\(\)\[\]]|\[(?:\^|\_|[a-zA-Z0-9]))*?)\](?!\s*\()/g, (match, p1) => {
                if (p1.includes('$')) return match;
                if (/[\^_\{\}]|(?:\b(?:frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|infty|pm|times|div|approx|neq|leq|geq|equiv|forall|exists|nabla|partial)\b)/.test(p1)) {
                    return `$${p1}$`;
                }
                return match;
            });
            content = content.replace(/\[\[((?:[^\$\(\)\[\]]|\[(?:\^|\_|[a-zA-Z0-9]))*?[\^_a-zA-Z0-9\\](?:[^\$\(\)\[\]]|\[(?:\^|\_|[a-zA-Z0-9]))*?)\]\](?!\s*\()/g, (match, p1) => {
                if (p1.includes('$')) return match;
                if (/[\^_\{\}]|(?:\b(?:frac|sqrt|sum|int|lim|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|infty|pm|times|div|approx|neq|leq|geq|equiv|forall|exists|nabla|partial)\b)/.test(p1)) {
                    return `$$${p1}$$`;
                }
                return match;
            });
            console.log('[MathJaxDebug] Content after fix:', content);
        }
        // <<< КОНЕЦ КОСТЫЛЯ ДЛЯ DEEPSEEK MATHJAX

        // Render everything via markdown-it. The custom fence renderer will handle code blocks.
        const renderedContent = window.markdown.render(content);

        // Wrap the final output in a chat-text div for consistent styling.
        return `<div class="chat-text">${renderedContent}</div>`;
    }

    function updateAttachmentsPreview() {
      attachmentsContainer.innerHTML = "";
      imageFiles.forEach((item, index) => {
        const preview = document.createElement("div");
        preview.className = "attachment-preview";
        const img = document.createElement("img");
        img.src = item.data;
        img.loading = "lazy";
        preview.appendChild(img);
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.innerHTML = "×";
        cancelBtn.addEventListener("click", () => {
          imageFiles.splice(index, 1);
          imageFilesBase64.splice(index, 1);
          updateAttachmentsPreview();
        });
        preview.appendChild(cancelBtn);
        attachmentsContainer.appendChild(preview);
      });
      fileAttachments.forEach((item, index) => {
        const preview = document.createElement("div");
        preview.className = "attachment-preview file-preview";
        const iconImg = document.createElement("img");
        iconImg.src = "icon/file.png";
        iconImg.style.width = "40px";
        iconImg.style.height = "40px";
        iconImg.style.objectFit = "contain";
        preview.appendChild(iconImg);
        const fileNameSpan = document.createElement("span");
        fileNameSpan.textContent = item.name;
        preview.appendChild(fileNameSpan);
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.innerHTML = "×";
        cancelBtn.addEventListener("click", () => {
          fileAttachments.splice(index, 1);
          updateAttachmentsPreview();
        });
        preview.appendChild(cancelBtn);
        attachmentsContainer.appendChild(preview);
      });
      attachmentsContainer.style.display =
        (imageFiles.length === 0 && fileAttachments.length === 0) ? "none" : "flex";
    }

    function handleDroppedFiles(files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const blobUrl = URL.createObjectURL(file);
          imageFiles.push({ data: blobUrl, name: file.name });
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            const base64 = dataUrl.split(',')[1];
            imageFilesBase64.push(base64);
            updateAttachmentsPreview();
          };
          reader.readAsDataURL(file);
        }
      }
    }

    function handleNonImageFiles(files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const textContent = e.target.result;
            fileAttachments.push({ name: file.name, content: textContent });
            updateAttachmentsPreview();
          };
          reader.readAsText(file);
        }
      }
    }

    let chats = [];
    let activeChatId = null;
    let chatIdCounter = 0;
    let defaultSettings;

    function getTruncatedTitle(chat) {
      const lang = languageSelect.value;
      // Если заголовок был сгенерирован AI (chat.titleGenerated === true)
      // и он не пустой (chat.chatnamess) и не равен дефолтному (на случай, если генерация не удалась и сервер вернул дефолт)
      if (chat.titleGenerated && chat.chatnamess && chat.chatnamess !== translations[lang].newChatTitle) {
        return chat.chatnamess; // Возвращаем AI-сгенерированный заголовок как есть (сервер его ограничил ~100 символами)
      }

      // В противном случае, пытаемся взять из первого сообщения пользователя (без клиентской обрезки)
      for (let msg of chat.history) {
        if (msg.role && msg.role.toLowerCase() === "user" && msg.display) {
          return msg.display.trim(); // Возвращаем как есть
        }
      }

      // Если ничего не подошло (например, нет сообщений пользователя или сгенерированного заголовка)
      // или если chat.chatnamess все еще дефолтный.
      // Возвращаем chat.chatnamess если он есть (например, старый заголовок до titleGenerated), иначе дефолтный.
      return chat.chatnamess || translations[lang].newChatTitle;
    }

    function updateChatWindow() {
      const chat = chats.find(c => c.id === activeChatId);
      if (!chat) {
        chatContent.innerHTML = "";
        updateInputPosition();
        return;
      }
      if (chat.history.length === 0) {
        chatContent.innerHTML = "";
        updateInputPosition();
        return;
      }
      let html = "";
      const truncatedTitle = getTruncatedTitle(chat);
      const currentChatModel = (chat.modelhs && chat.modelhs.length > 0) ? chat.modelhs[chat.modelhs.length - 1] : currentModel;
      const lang = languageSelect.value;
      html += `<p style="margin-bottom:20px; color:var(--text-secondary);"><strong>${truncatedTitle}</strong> (${translations[lang].currentModel}${currentChatModel})</p>`;
      chat.history.forEach(m => {
        let role = m.role || "unknown";
        let displayedRole = role;

        if (role.toLowerCase() === "assistant") {
          let usedModel = m.modelUsed ? m.modelUsed : currentChatModel;
          displayedRole = `assistant (${usedModel})`;
        } else if (role.toLowerCase() === "user") {
          displayedRole = "user";
        }
        let contentHTML = "";
        if (role.toLowerCase() === "user" && m.display) {
          contentHTML = `<div class="chat-text">${escapeHtml(m.display)}</div>`;
        } else {
          contentHTML = parseContentForCodeBlocks(m.content || "", m.modelUsed || currentModel);
        }

        if (m.images && Array.isArray(m.images)) {
          m.images.forEach((imgData) => {
            let mimeType = "image/png";
            if (imgData.startsWith("/9j")) mimeType = "image/jpeg";
            else if (imgData.startsWith("R0lGOD")) mimeType = "image/gif";
            else if (imgData.startsWith("AAAB")) mimeType = "image/x-icon";
            contentHTML += `<div style="margin-top:15px;"><img loading="lazy" src="data:${mimeType};base64,${imgData}" style="max-width:300px; border-radius:8px; border:1px solid var(--border-color);"></div>`;
          });
        }
        if (m.files && Array.isArray(m.files)) {
          m.files.forEach(file => {
            contentHTML += `
              <div class="file-preview" style="display:inline-block; margin-top:15px; padding:8px; border-radius:10px; background-color:var(--card-bg);">
                <img src="icon/file.png" alt="File" style="width:40px; height:40px; object-fit:contain;">
                <span>${file.name}</span>
              </div>
            `;
          });
        }
        const copyTitle = (role.toLowerCase() === "assistant")
          ? translations[lang].copyAssistantMessage
          : translations[lang].copyUserMessage;
        let buttonsHTML = `
          <button class="message-copy-btn" onclick="copyMessageContent(this)" title="${copyTitle}">
            <img src="icon/copy.png" alt="Copy" style="width:24px; height:24px;">
          </button>
        `;
        if (role.toLowerCase() === "user") {
          buttonsHTML += `
            <button class="message-edit-btn" onclick="editUserMessage(this)" title="Редактировать">
              <img src="icon/edit.png" alt="Редактировать" style="width:24px; height:24px;">
            </button>
          `;
        }
        html += `
          <div class="message-block ${role.toLowerCase() === "assistant" ? "assistant-message" : (role.toLowerCase() === "user" ? "user-message" : "other-message")}">
            <div class="role">${displayedRole}:</div>
            ${contentHTML}
            <div class="message-buttons">
              ${buttonsHTML}
            </div>
          </div>
        `;
      });
      chatContent.innerHTML = html;

      // Обновляем MathJax после изменения содержимого
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([chatContent])
          .catch((err) => {
            console.error('MathJax typeset failed:', err.message);
          });
      } else if (chatContent.innerText.includes('$')) { // Простое условие, чтобы не логировать постоянно
         console.warn('MathJax or typesetPromise not available on window, but $ symbols detected.');
      }

    // Add this for highlight.js
    if (window.hljs) {
      hljs.highlightAll();
    }

      updateInputPosition();
    }

    function updateInputPosition() {
      const mainEl = document.querySelector('.main');
      const chat = chats.find(c => c.id === activeChatId);
      if (!chat || chat.history.length === 0) {
        mainEl.classList.add('empty-chat');
        introText.style.display = "block";
        setTimeout(() => {
          introText.style.opacity = "1";
          introText.style.transform = "translateY(0)";
        }, 100);
      } else {
        mainEl.classList.remove('empty-chat');
        introText.style.display = "none";
      }
    }

    function updateChatItemText(chatData) {
      if (chatData.itemElement) {
        const lang = languageSelect.value;
        const truncatedTitle = getTruncatedTitle(chatData);
        const currentChatModel = (chatData.modelhs && chatData.modelhs.length > 0) ? chatData.modelhs[chatData.modelhs.length - 1] : currentModel;
        chatData.itemElement.innerHTML = `<span>${truncatedTitle} (${translations[lang].currentModel}${currentChatModel})</span>`;
        if (!chatData.itemElement.querySelector('.chat-delete-btn')) {
          const delBtn = document.createElement("button");
          delBtn.classList.add("chat-delete-btn");
          delBtn.setAttribute('title', translations[lang].deleteBtn);
          delBtn.innerHTML = `<img src="icon/delete.png" alt="${translations[lang].deleteBtn}" style="width:24px;height:24px;">`;
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chatData.id);
          });
          chatData.itemElement.appendChild(delBtn);
        }
      }
    }

    async function loadChats() {
      try {
        const response = await fetch("/chats");
        const chatIDs = await response.json();
        for (const id of chatIDs) {
          const res = await fetch(`/chats/${id}`);
          const chatData = await res.json();
          chats.push(chatData);
          addChatToList(chatData);
          chatIdCounter = Math.max(chatIdCounter, parseInt(chatData.id) + 1);
        }
      } catch (error) {
        console.error("Error loading chats:", error);
      }
    }

    async function saveChat(chat) {
      try {
        const res = await fetch(`/chats/${chat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chat)
        });
        await res.json();
        updateChatItemText(chat);
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    }

    async function deleteChat(chatId) {
      try {
        const response = await fetch(`/delete-chat/${chatId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.status === "success") {
          chats = chats.filter(c => c.id !== chatId);
          const item = document.querySelector(`.chat-item[data-chat-id='${chatId}']`);
          if (item) item.remove();
          if (activeChatId === chatId) {
            activeChatId = null;
            chatContent.innerHTML = "";
            updateInputPosition();
          }
        } else {
          alert("Failed to delete chat");
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    }

    function addChatToList(chatData) {
      const chatItem = document.createElement('div');
      chatItem.classList.add('chat-item');
      chatItem.setAttribute("data-chat-id", chatData.id);
      chatData.itemElement = chatItem;
      updateChatItemText(chatData);
      chatItem.addEventListener('click', () => switchChat(chatData.id));
      chatList.insertBefore(chatItem, chatList.firstChild);

      // Анимация появления
      setTimeout(() => {
        chatItem.classList.add('visible');
      }, 10);
    }

    function switchChat(chatId) {
      document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
      activeChatId = chatId;
      const chatItem = document.querySelector(`.chat-item[data-chat-id='${chatId}']`);
      if (chatItem) chatItem.classList.add('active');
      updateChatWindow();
    }

    async function createNewChat() {
      document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
      const lang = languageSelect.value;
      const chat = {
        id: chatIdCounter.toString(),
        chatnamess: translations[lang].newChatTitle,
        history: [],
        modelhs: [currentModel]
      };
      chats.push(chat);
      addChatToList(chat);
      activeChatId = chat.id;
      updateChatWindow();
      await saveChat(chat);
      chatIdCounter++;
    }

    async function saveSettings() {
      const newSettings = {
        language: languageSelect.value,
        default_model: defaultModelSelect.value,
        model_temperature: parseFloat(modelTemperatureInput.value),
        background: {
          type: localStorage.getItem('backgroundType') || 'none',
          image: localStorage.getItem('backgroundImage') || null,
          gradient: {
            color1: localStorage.getItem('gradientColor1') || '#4166d5',
            color2: localStorage.getItem('gradientColor2') || '#1e1f25'
          }
        }
      };
      try {
        const response = await fetch("/settings", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSettings)
        });
        const data = await response.json();
        if (data.status === "success") {
          defaultSettings = newSettings;
          currentModel = newSettings.default_model;
          currentModelDisplay.textContent = translations[languageSelect.value].currentModel + currentModel;
          const chat = chats.find(c => c.id === activeChatId);
          if (chat) {
            chat.modelhs.push(currentModel);
            updateChatWindow();
            await saveChat(chat);
          }
          updateInterfaceLanguage(languageSelect.value);
          settingsModal.classList.remove('show');
          setTimeout(() => {
            settingsModal.style.display = 'none';
          }, 300);
        } else {
          alert("Failed to save settings");
        }
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }

    async function loadSettings() {
      try {
        const response = await fetch("/settings", { cache: "no-cache" });
        const settingsData = await response.json();
        defaultSettings = settingsData;
        languageSelect.value = settingsData.language || "en";
        currentModel = settingsData.default_model || "";
        await loadInstalledModelsForSettings(); // This ensures defaultModelSelect is populated
        defaultModelSelect.value = settingsData.default_model || ""; // Set the value after options are loaded
        modelTemperatureInput.value = settingsData.model_temperature !== undefined ? settingsData.model_temperature : 0.8;
        if (modelTemperatureValueSpan) modelTemperatureValueSpan.textContent = parseFloat(modelTemperatureInput.value).toFixed(2);
        updateInterfaceLanguage(languageSelect.value);

        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        currentTheme = savedTheme; // Ensure currentTheme is updated
        applyHighlightTheme(currentTheme);

        // Загрузка фона из настроек
        if (settingsData.background) {
          const bg = settingsData.background;
          localStorage.setItem('backgroundType', bg.type || 'none');
          if (bg.type === 'image' && bg.image) {
            localStorage.setItem('backgroundImage', bg.image);
          } else if (bg.type === 'gradient') {
            localStorage.setItem('gradientColor1', bg.gradient.color1);
            localStorage.setItem('gradientColor2', bg.gradient.color2);
          }
        }

        updateBackgroundPreview();
        applyBackground();

        // Загрузка настроек автоматических инструментов
        // automaticToolsToggle.checked = settingsData.automatic_tools || false; // Удалено
        // toolsEnabled = automaticToolsToggle.checked; // Удалено, toolsEnabled инициализируется как false глобально
        toolsBtn.classList.toggle('active', toolsEnabled); // Убедимся, что кнопка отражает начальное состояние toolsEnabled (false)

      } catch (error) {
        console.error("Error loading settings:", error);
      }
    }

    async function loadInstalledModelsForSettings() {
      try {
        const response = await fetch("/installed-models");
        const models = await response.json();
        defaultModelSelect.innerHTML = "";
        models.forEach(model => {
          const opt = document.createElement("option");
          opt.value = model;
          opt.textContent = model;
          defaultModelSelect.appendChild(opt);
        });
        defaultModelSelect.value = defaultSettings.default_model || "";
        currentModelDisplay.textContent = translations[languageSelect.value].currentModel + (currentModel || "—");
      } catch (error) {
        console.error("Error loading models for settings:", error);
      }
    }

    async function changeModel(model) {
      try {
        const resp = await fetch("/switch-model", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model })
        });
        const data = await resp.json();
        if (data.status === "success") {
          currentModel = model;
          currentModelDisplay.textContent = translations[languageSelect.value].currentModel + currentModel;
          const chat = chats.find(c => c.id === activeChatId);
          if (chat) {
            chat.modelhs.push(model);
            updateChatWindow();
            await saveChat(chat);
          }
        } else {
          alert("Failed to switch model");
        }
      } catch (error) {
        console.error("Error switching model:", error);
      }
    }

    async function loadInstalledModels() {
      try {
        const lang = languageSelect.value;
        const resp = await fetch("/installed-models");
        const models = await resp.json();
        modelOptionsContainer.innerHTML = "";
        modelCustomContainer.innerHTML = "";
        models.forEach(m => {
          const div = document.createElement("div");
          div.classList.add("model-option");
          div.innerHTML = `<span>${m}</span>`;
          div.addEventListener('click', () => {
            changeModel(m);
            modelModal.classList.remove('show');
            setTimeout(() => {
              modelModal.style.display = 'none';
            }, 300);
          });
          const delBtn = document.createElement("button");
          delBtn.setAttribute('title', translations[lang].deleteBtn);
          delBtn.innerHTML = `<img src="icon/delete.png" alt="${translations[lang].deleteBtn}" style="width:40px;height:40px;">`;
          delBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteModel(m);
            loadInstalledModels();
          });
          div.appendChild(delBtn);
          modelOptionsContainer.appendChild(div);
        });
        const customDiv = document.createElement("div");
        customDiv.classList.add("model-option");
        customDiv.innerHTML = `<span>${translations[lang].customModel}</span>`;
        customDiv.addEventListener('click', () => {
          if (!document.getElementById('customInput')) {
            const customInput = document.createElement("input");
            customInput.type = "text";
            customInput.placeholder = "e.g. smollm:135m";
            customInput.id = "customInput";
            customInput.classList.add("custom-input");
            const installBtn = document.createElement("button");
            installBtn.innerText = translations[lang].installModel;
            installBtn.classList.add("install-btn");
            installBtn.addEventListener("click", async () => {
              const modelName = customInput.value.trim();
              if (modelName) {
                await installModelStream(modelName);
              }
            });
            modelCustomContainer.innerHTML = "";
            modelCustomContainer.appendChild(customInput);
            modelCustomContainer.appendChild(installBtn);
          }
        });
        modelOptionsContainer.appendChild(customDiv);
      } catch (error) {
        console.error("Error loading installed models:", error);
      }
    }

    async function deleteModel(m) {
      try {
        const resp = await fetch("/delete-model", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: m })
        });
        const data = await resp.json();
        if (data.status !== "success") {
          alert("Failed to delete model");
        }
      } catch (error) {
        console.error("Error deleting model:", error);
      }
    }

    async function installModelStream(modelName) {
     isModelInstalling = true;
     currentInstallingModelName = modelName;
     globalInstallPercent = 0;

     if (sidebarProgressLabel) sidebarProgressLabel.textContent = `Installing ${modelName}...`;
     if (sidebarProgressFill) sidebarProgressFill.style.width = '0%';
     if (sidebarProgressText) sidebarProgressText.textContent = '0%';

     // Очистка контейнера в модальном окне и создание нового прогресс-бара там
     modelCustomContainer.innerHTML = ''; // Очищаем предыдущий прогресс, если был
     const progressContainerModal = document.createElement("div");
     progressContainerModal.className = "progress-container";
     const progressFillModal = document.createElement("div");
     progressFillModal.className = "progress-fill";
     const progressLabelModal = document.createElement("div");
     progressLabelModal.className = "progress-label";
     progressLabelModal.textContent = "0%";
     progressContainerModal.appendChild(progressFillModal);
     progressContainerModal.appendChild(progressLabelModal);
     modelCustomContainer.appendChild(progressContainerModal);
      let currentPercent = 0; // This was part of the original code, ensure it's kept if used below.
      let currentSpeed = ""; // This was part of the original code, ensure it's kept if used below.
      try {
        const resp = await fetch("/install-model-stream", {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelName })
        });
        const reader = await resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (!value) continue;
          const chunk = decoder.decode(value);
          chunk.split("\n\n").forEach(line => {
            if (line.startsWith("data: ")) {
              let dataStr = line.substring(6).trim();
              if (dataStr) {
                const percentMatch = dataStr.match(/(\d+)%/);
                if (percentMatch) {
                  currentPercent = parseInt(percentMatch[1], 10);
                  // progressFill.style.width = currentPercent + "%"; // Old modal progress
                }
                const speedMatch = dataStr.match(/(\d+(?:\.\d+)?\s*(?:MB\/s|KB\/s|GB\/s))/i);
                if (speedMatch) {
                  currentSpeed = speedMatch[1];
                }

                globalInstallPercent = currentPercent;
                let progressDisplayText = currentSpeed ? `${currentPercent}% | ${currentSpeed}` : `${currentPercent}%`;

                // Обновляем прогресс в модальном окне
                progressFillModal.style.width = currentPercent + "%";
                progressLabelModal.textContent = progressDisplayText;

                // Обновляем прогресс на боковой панели
                if (sidebarProgressFill) sidebarProgressFill.style.width = currentPercent + "%";
                if (sidebarProgressText) sidebarProgressText.textContent = progressDisplayText;

                // Показываем/скрываем индикатор на боковой панели в зависимости от видимости модального окна
                if (modelModal.style.display === 'none' || !modelModal.classList.contains('show')) {
                  if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'block';
                } else {
                  if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'none';
                }

                if (dataStr === "DONE") {
                  progressFillModal.style.width = "100%"; // Ensure modal shows 100%
                  progressLabelModal.textContent = progressLabelModal.textContent; // Keep final text (speed might be lost here, but ok)

                  if (sidebarProgressFill) sidebarProgressFill.style.width = "100%";
                  if (sidebarProgressText) sidebarProgressText.textContent = progressLabelModal.textContent;

                  loadInstalledModels();
                  setTimeout(() => {
                    // No need to reset modal progress bar here as modelCustomContainer might be cleared or reused
                    if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'none';
                    isModelInstalling = false;
                    currentInstallingModelName = null;
                    // Reset globalInstallPercent for the next run
                    globalInstallPercent = 0;
                  }, 2000);
                  modelModal.classList.remove('show');
                  setTimeout(() => {
                    modelModal.style.display = 'none';
                  }, 300); // This delay should be less than the one above to hide modal first
                }
              }
            }
          });
        }
      } catch (error) {
        progressLabelModal.textContent = "Error installing model.";
        if (sidebarProgressLabel) sidebarProgressLabel.textContent = 'Error!';
        if (sidebarProgressText) sidebarProgressText.textContent = 'Failed';
        if (sidebarModelInstallProgressContainer && (modelModal.style.display === 'none' || !modelModal.classList.contains('show'))) {
           sidebarModelInstallProgressContainer.style.display = 'block'; // Показать ошибку и на сайдбаре
        }
        // Добавить задержку перед сбросом флагов и скрытием, чтобы пользователь увидел ошибку
        setTimeout(() => {
           if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'none';
           isModelInstalling = false;
           currentInstallingModelName = null;
        }, 5000);
        console.error("Error installing model:", error);
      }
    }

    // --- ФУНКЦИИ ДЛЯ РАБОТЫ С ИНСТРУМЕНТАМИ ---
    function toggleTools() {
      toolsEnabled = !toolsEnabled;
      toolsBtn.classList.toggle('active', toolsEnabled);
    }

    async function executeToolCall(toolName, parameters) {
      try {
        const response = await fetch('/api/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: toolName,
            parameters: parameters
          })
        });

        const result = await response.json();
        return response.ok ? result.result : `Ошибка: ${result.error}`;
      } catch (error) {
        return `Ошибка выполнения: ${error.message}`;
      }
    }

    function parseToolCalls(text) {
      const toolCallRegex = /\[TOOL_CALL\]\s*(\w+)\s*\(([^)]*)\)/g;
      const calls = [];
      let match;

      while ((match = toolCallRegex.exec(text)) !== null) {
        const toolName = match[1];
        const paramsStr = match[2].trim();
        console.log('[parseToolCalls] Original paramsStr:', paramsStr);

        let parameters = {};
        let attemptedJsonString = ''; // Для логирования строки, на которой произошел сбой

        try {
          if (paramsStr) {
            if (paramsStr.startsWith('{') && paramsStr.endsWith('}')) {
              // Попытка 1: Предполагаем, что paramsStr - это уже валидный JSON объект
              attemptedJsonString = paramsStr;
              console.log('[parseToolCalls] Attempting direct JSON.parse on (already wrapped):', attemptedJsonString);
              parameters = JSON.parse(attemptedJsonString);
            } else {
              // Попытка 2: "Костыль" для строк вида "ключ": "значение"
              // Экранируем все обратные слеши в paramsStr.
              let processedParams = paramsStr.replace(/\\/g, '\\\\'); // Corrected global replace
              console.log('[parseToolCalls] paramsStr after global slash escape (\\ -> \\\\):', processedParams);

              attemptedJsonString = `{${processedParams}}`;
              console.log('[parseToolCalls] Attempting JSON.parse on (wrapped and escaped):', attemptedJsonString);
              parameters = JSON.parse(attemptedJsonString);
            }
          }
          calls.push({ toolName, parameters });
        } catch (e) {
          console.error('Ошибка парсинга параметров инструмента (parseToolCalls):', e.message);
          console.error('Исходная строка параметров (paramsStr):', paramsStr);
          console.error('Строка, на которой произошел сбой JSON.parse:', attemptedJsonString);
          calls.push({ toolName, parameters: {} });
        }
      }
      return calls;
    }

async function sendMessage(isContinuation = false) {
    let originalMsg = '';
    // Только обрабатываем ввод пользователя, если это не продолжение вызова инструмента
    if (!isContinuation) {
        originalMsg = chatInput.value.trim();
        if (!originalMsg && imageFilesBase64.length === 0 && fileAttachments.length === 0) {
            return;
        }
    }

    if (activeChatId === null) {
        await createNewChat();
        if (activeChatId === null) {
            console.error("Failed to create or assign activeChatId. Aborting sendMessage.");
            return;
        }
    }

    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) {
        console.error("Chat not found for activeChatId:", activeChatId, ". Aborting sendMessage.");
        return;
    }

    // --- Обработка сообщения пользователя (только для начальных вызовов) ---
    if (!isContinuation) {
        const oneLineMsg = originalMsg.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        chatInput.value = "";
        autoResize();

        let fullText = oneLineMsg;
        if (fileAttachments.length > 0) {
            fileAttachments.forEach(file => {
                fullText += " " + file.content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
            });
        }

        if (editingIndex !== null) {
            chat.history[editingIndex].content = fullText;
            chat.history[editingIndex].display = originalMsg;
            chat.history[editingIndex].role = "user";
            chat.history[editingIndex].images = imageFilesBase64.length > 0 ? imageFilesBase64.slice() : [];
            chat.history[editingIndex].files = fileAttachments.length > 0 ? fileAttachments.map(item => ({ name: item.name, content: item.content })) : [];
            editingIndex = null;
        } else {
            const userMessage = { role: "user", content: fullText, display: originalMsg };
            if (imageFilesBase64.length > 0) userMessage.images = imageFilesBase64.slice();
            if (fileAttachments.length > 0) userMessage.files = fileAttachments.map(item => ({ name: item.name, content: item.content }));
            chat.history.push(userMessage);
        }

        imageFilesBase64 = [];
        imageFiles = [];
        fileAttachments = [];
        updateAttachmentsPreview();
        await saveChat(chat);

        // --- Логика генерации заголовка чата (начало) ---
        const nonSystemMessages = chat.history.filter(m => m.role !== 'system');
        if (nonSystemMessages.length >= 2 && !chat.titleGenerated && !isGeneratingTitle) {
            isGeneratingTitle = true;
            try {
                const modelForTitle = (chat.modelhs && chat.modelhs.length > 0) ? chat.modelhs[chat.modelhs.length - 1] : currentModel;
                const historyForTitleGeneration = chat.history.filter(m => m.role === 'user' || m.role === 'assistant');
                const generatedTitle = await fetchGeneratedTitle(historyForTitleGeneration, modelForTitle);
                if (generatedTitle) {
                    chat.chatnamess = generatedTitle;
                    chat.titleGenerated = true;
                    updateChatItemText(chat);
                    if (activeChatId === chat.id) {
                       updateChatWindow();
                    }
                    await saveChat(chat);
                }
            } catch (error) {
                console.error('[sendMessage] Error during title generation:', error);
            } finally {
                isGeneratingTitle = false;
            }
        }
        // --- Конец логики генерации заголовка чата ---
    }

    // --- Основной цикл генерации ---
    if (streamAbortController) {
        streamAbortController.abort();
    }
    streamAbortController = new AbortController();

    const finalPlaceholder = translations[languageSelect.value]?.inputPlaceholder || "Введите сообщение...";
    sendBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    chatInput.disabled = true;

    try {
        let assistantMessageEntry = {
            role: "assistant",
            content: "",
            modelUsed: (chat.modelhs && chat.modelhs.length > 0) ? chat.modelhs[chat.modelhs.length - 1] : currentModel
        };
        chat.history.push(assistantMessageEntry);
        updateChatWindow();

        const lastMessageBlock = chatContent.querySelector('.assistant-message:last-child');
        let streamingTextContainer = lastMessageBlock ? lastMessageBlock.querySelector('.chat-text') : null;
        if (lastMessageBlock && !streamingTextContainer) {
             streamingTextContainer = document.createElement('div');
             streamingTextContainer.className = 'chat-text';
             lastMessageBlock.insertBefore(streamingTextContainer, lastMessageBlock.querySelector('.message-buttons'));
        }

        // Create and append the TPS counter dynamically
        let tpsCounter = null;
        if (lastMessageBlock) {
            tpsCounter = document.createElement('div');
            tpsCounter.className = 'tps-counter';
            tpsCounter.style.display = 'none'; // Initially hidden
            lastMessageBlock.appendChild(tpsCounter);
        }


        let currentStreamedContent = "";
        let startTime = performance.now();
        let tokenCount = 0;

        const messagesForStream = chat.history.slice(0, -1);

        const requestData = {
            model: assistantMessageEntry.modelUsed,
            messages: messagesForStream,
            tools_enabled: toolsEnabled
        };

        const resp = await fetch("/generate-stream", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
            signal: streamAbortController.signal
        });

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (!value) continue;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr) {
                         try {
                            const obj = JSON.parse(dataStr);
                            if (obj.message && obj.message.content) {
                                currentStreamedContent += obj.message.content;
                                tokenCount++;

                                const elapsedTime = (performance.now() - startTime) / 1000;
                                const tps = elapsedTime > 0 ? (tokenCount / elapsedTime).toFixed(2) : 0;

                                if (tpsCounter) {
                                    tpsCounter.textContent = `TPS: ${tps}`;
                                    tpsCounter.style.display = 'inline-block';
                                }
                            }
                         } catch(e) { /* Игнорируем ошибки парсинга JSON для необъектных данных */ }
                    }
                }
            }

            if (streamingTextContainer) {
                streamingTextContainer.innerHTML = markdown.render(currentStreamedContent);
                if (window.hljs) {
                    streamingTextContainer.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });
                }
            }
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        assistantMessageEntry.content = currentStreamedContent;
        await saveChat(chat);

        // --- ОБРАБОТКА ИНСТРУМЕНТОВ ---
        if (toolsEnabled && currentStreamedContent.includes('[TOOL_CALL]')) {
            const toolCalls = parseToolCalls(currentStreamedContent);
            if (toolCalls.length > 0) {
                let toolResultsContent = '';
                for (const call of toolCalls) {
                    const result = await executeToolCall(call.toolName, call.parameters);
                    toolResultsContent += `[TOOL_RESULT for ${call.toolName}]:\n${result}\n`;
                }

                // Добавляем результаты как новое сообщение в историю
                const toolResultMessage = { role: "tool", content: toolResultsContent };
                chat.history.push(toolResultMessage);
                updateChatWindow();
                await saveChat(chat);

                // ВАЖНО: Вызываем sendMessage снова для получения финального ответа от модели
                await sendMessage(true); // `true` указывает, что это продолжение
                return; // Выходим, чтобы блок finally не сработал преждевременно
            }
        }
    } catch (error) {
        console.error("Stream aborted or error:", error);
        if (error.name !== 'AbortError' && chat.history.length > 0) {
            const lastMessage = chat.history[chat.history.length - 1];
            if (lastMessage.role === "assistant") {
                lastMessage.content = "Ошибка: " + error.message;
                updateChatWindow();
                await saveChat(chat);
            }
        }
    } finally {
        // Эта часть теперь будет выполняться только в конце всей цепочки
        const lastMessage = chat.history.length > 0 ? chat.history[chat.history.length - 1] : null;
        const isStillProcessingTools = toolsEnabled && lastMessage && lastMessage.role === "tool";

        if (!isStillProcessingTools) {
             sendBtn.style.display = "inline-block";
             stopBtn.style.display = "none";
             chatInput.disabled = false;
             chatInput.placeholder = finalPlaceholder;
             streamAbortController = null;
        }
    }
}

    // Функции для работы с фоном
    function updateBackgroundPreview() {
      const bgType = localStorage.getItem('backgroundType');

      if (bgType === 'image') {
        const bgImage = localStorage.getItem('backgroundImage');
        if (bgImage) {
          bgPreview.style.backgroundImage = `url(${bgImage})`;
          bgPreviewText.textContent = '';
        }
      } else if (bgType === 'gradient') {
        const color1 = localStorage.getItem('gradientColor1') || '#4166d5';
        const color2 = localStorage.getItem('gradientColor2') || '#1e1f25';
        bgPreview.style.backgroundImage = `linear-gradient(135deg, ${color1}, ${color2})`;
        bgPreviewText.textContent = '';
      } else {
        bgPreview.style.backgroundImage = '';
        bgPreviewText.textContent = 'No background';
      }
    }

    function applyBackground() {
      const bgType = localStorage.getItem('backgroundType');
      const mainContent = document.querySelector('.main');

      if (bgType === 'image') {
        const bgImage = localStorage.getItem('backgroundImage');
        if (bgImage) {
          mainContent.style.backgroundImage = `url(${bgImage})`;
          mainContent.style.backgroundSize = 'cover';
          mainContent.style.backgroundAttachment = 'fixed';
        }
      } else if (bgType === 'gradient') {
        const color1 = localStorage.getItem('gradientColor1') || '#4166d5';
        const color2 = localStorage.getItem('gradientColor2') || '#1e1f25';
        mainContent.style.backgroundImage = `linear-gradient(135deg, ${color1}, ${color2})`;
      } else {
        mainContent.style.backgroundImage = '';
      }
    }

    // Обработчики событий
    stopBtn.addEventListener("click", () => {
      if (streamAbortController) {
        streamAbortController.abort();
      }
      sendBtn.style.display = "inline-block";
      stopBtn.style.display = "none";
    });

    newChatBtn.addEventListener('click', createNewChat);

    sendBtn.addEventListener('click', function() {
      console.log("Send button clicked!");
      sendMessage();
    });

    toolsBtn.addEventListener('click', toggleTools);

    chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    chatInput.addEventListener('input', autoResize);

    changeModelBtn.addEventListener('click', () => {
      loadInstalledModels();
      if (isModelInstalling) {
        if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'none';
        // Logic to potentially update progress within modal if it's for the same model
        const customInput = document.getElementById('customInput'); // Check if custom input field exists
        const modalProgressFill = modelCustomContainer.querySelector('.progress-fill');
        const modalProgressLabel = modelCustomContainer.querySelector('.progress-label');

        if (currentInstallingModelName && modelCustomContainer.querySelector('.progress-container')) {
          // If an installation is ongoing and progress bar exists in modal
          if (modalProgressFill) modalProgressFill.style.width = globalInstallPercent + '%';
          if (modalProgressLabel) modalProgressLabel.textContent = globalInstallPercent + '%';
          // If the model being installed was from custom input, ensure input is not shown
          if (customInput && customInput.value === currentInstallingModelName) {
             // customInput.style.display = 'none'; // Or remove it
          }
        } else if (customInput) {
            // If there's a custom input but no progress for currentInstallingModelName, ensure it's clear
            // customInput.value = ''; // Or handle as needed
        }
      }
      modelModal.style.display = 'block';
      setTimeout(() => {
        modelModal.classList.add('show');
      }, 10);
    });

    closeModelModal.addEventListener('click', () => {
      if (isModelInstalling) {
        if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'block';
        if (sidebarProgressLabel) sidebarProgressLabel.textContent = `Installing ${currentInstallingModelName}...`;
        if (sidebarProgressFill) sidebarProgressFill.style.width = globalInstallPercent + '%';
        if (sidebarProgressText) sidebarProgressText.textContent = globalInstallPercent + '%';
      }
      modelModal.classList.remove('show');
      setTimeout(() => {
        modelModal.style.display = 'none';
      }, 300);
    });

    openSettingsBtn.addEventListener('click', () => {
      loadSettings();
      settingsModal.style.display = 'block';
      setTimeout(() => {
        settingsModal.classList.add('show');
      }, 10);
    });

    closeSettingsModal.addEventListener('click', () => {
      settingsModal.classList.remove('show');
      setTimeout(() => {
        settingsModal.style.display = 'none';
      }, 300);
    });

    saveSettingsBtn.addEventListener('click', saveSettings);



    window.addEventListener('click', (event) => {
      if (event.target === modelModal) {
        if (isModelInstalling) {
          if (sidebarModelInstallProgressContainer) sidebarModelInstallProgressContainer.style.display = 'block';
          if (sidebarProgressLabel) sidebarProgressLabel.textContent = `Installing ${currentInstallingModelName}...`;
          if (sidebarProgressFill) sidebarProgressFill.style.width = globalInstallPercent + '%';
          if (sidebarProgressText) sidebarProgressText.textContent = globalInstallPercent + '%';
        }
        modelModal.classList.remove('show');
        setTimeout(() => {
          modelModal.style.display = 'none';
        }, 300);
      }
      if (event.target === settingsModal) {
        settingsModal.classList.remove('show');
        setTimeout(() => {
          settingsModal.style.display = 'none';
        }, 300);
      }
    });

    chatWindow.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragOverlay.classList.add('active');
    });

    chatWindow.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    chatWindow.addEventListener('dragleave', (e) => {
      if (e.target === chatWindow || e.target === dragOverlay) {
        dragOverlay.classList.remove('active');
      }
    });

    chatWindow.addEventListener('drop', (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('active');
      if (e.dataTransfer.files.length) {
        handleDroppedFiles(e.dataTransfer.files);
        handleNonImageFiles(e.dataTransfer.files);
      }
    });

    imageUploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      handleDroppedFiles(files);
      handleNonImageFiles(files);
      fileInput.value = "";
    });

    toggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      // Новый код для мобильных:
      if (window.innerWidth <= 768) {
          if (!sidebar.classList.contains('collapsed')) {
              // Если сайдбар открывается на мобильном
              document.body.classList.add('sidebar-open-mobile');
              // Можно добавить слушатель для клика на .main для закрытия сайдбара
          } else {
              document.body.classList.remove('sidebar-open-mobile');
          }
      }
      toggleSidebar.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
    });

    // Обработчики для настроек темы
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        currentTheme = theme; // Ensure currentTheme is updated
        applyHighlightTheme(currentTheme);

        document.querySelectorAll('.theme-option').forEach(opt => {
          opt.classList.remove('active');
        });
        option.classList.add('active');
      });
    });

    uploadBgBtn.addEventListener('click', () => {
      bgImageInput.click();
    });

    bgImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          localStorage.setItem('backgroundImage', e.target.result);
          localStorage.setItem('backgroundType', 'image');
          updateBackgroundPreview();
          applyBackground();
        } catch (error) {
          console.error("Ошибка при сохранении фона:", error);
          alert('Не удалось сохранить изображение. Возможно, закончилось место в хранилище.');
        }
      };
      reader.readAsDataURL(file);
    });

    resetBgBtn.addEventListener('click', () => {
      localStorage.removeItem('backgroundImage');
      localStorage.removeItem('backgroundType');
      localStorage.removeItem('gradientColor1');
      localStorage.removeItem('gradientColor2');
      applyBackground();
      updateBackgroundPreview();
    });

    applyGradientBtn.addEventListener('click', () => {
      const color1 = gradientColor1.value;
      const color2 = gradientColor2.value;
      localStorage.setItem('gradientColor1', color1);
      localStorage.setItem('gradientColor2', color2);
      localStorage.setItem('backgroundType', 'gradient');
      updateBackgroundPreview();
      applyBackground();
    });

    if (modelTemperatureInput && modelTemperatureValueSpan) {
      modelTemperatureInput.addEventListener('input', () => {
        modelTemperatureValueSpan.textContent = parseFloat(modelTemperatureInput.value).toFixed(2);
      });
    }

    // Инициализация приложения
    async function init() {
      await loadSettings();
      await loadChats();

      // Если нет чатов, создаем новый
      if (chats.length === 0) {
        await createNewChat();
      } else {
        // Если есть чаты, активируем первый
        activeChatId = chats[0].id;
        switchChat(activeChatId); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
      }

      updateInputPosition();

      // Применяем сохраненные настройки фона
      applyBackground();

      setTimeout(() => {
        introText.style.opacity = "1";
        introText.style.transform = "translateY(0)";
      }, 300);

      // Показываем существующие чаты с анимацией
      setTimeout(() => {
        document.querySelectorAll('.chat-item').forEach(item => {
          item.classList.add('visible');
        });
      }, 500);
    }






    await init();
