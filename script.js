// DeepSeek API 配置
const API_KEY = 'sk-758cf12c7869493db4ecaa1196da50da'; // 請替換為你的 DeepSeek API 金鑰
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
let conversationHistory = [];
let isProcessing = false;
let diseaseData = {};




document.getElementById('start-button').addEventListener('click', async () => {
    const disease = document.getElementById('disease-select').value;
    const stage = document.getElementById('stage-select').value;
    const systemInstruction = {
        role: 'system',
        content: `You are a health educator specializing in ${disease} at ${stage}. Please provide the user with a "precise and brief" answer. If encountered with a question not related to disease or medicine, please reply: "我無法回應疾病以外的問題". Use \n as the end of each paragraph to achieve a segmented effect.`
    };

    // 初始化對話歷史
    conversationHistory = [systemInstruction];

    // 切換到聊天區塊
    document.getElementById('selection-section').style.display = 'none';
    document.getElementById('chatbot-section').style.display = 'block';
});



document.getElementById('send-button').addEventListener('click', async () => {

    if (isProcessing) {
        return; // 系統忙碌中
    }
    isProcessing = true;

    const userQuestion = document.getElementById('user-input').value;
    if (!userQuestion) {
        isProcessing = false;
        return; // 如果輸入為空，不做任何事
    }

    document.getElementById('user-input').value = ''; // 清空輸入欄
    document.getElementById('send-button').disabled = true; // 禁用發送按鈕

    // 添加使用者問題
    addMessage(userQuestion, true);

    // 添加佔位符訊息
    const placeholderDiv = addMessage("Thinking, please wait.", false);

    try {
        // 添加使用者問題到對話歷史
        conversationHistory.push({ role: 'user', content: userQuestion });

        // 發送 API 請求
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: conversationHistory,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // 將 AI 回覆中的 \n 替換為 <br>
        const formattedResponse = aiResponse.replace(/\n/g, '<br>');

        // 更新佔位符訊息為實際回覆，使用 innerHTML 渲染 <br>
        placeholderDiv.innerHTML = formattedResponse;

        // 添加 AI 回覆到對話歷史
        conversationHistory.push({ role: 'assistant', content: aiResponse });

        // 滾動到底部
        document.getElementById('conversation').scrollTop = document.getElementById('conversation').scrollHeight;
    } catch (error) {
        console.error('Error:', error);
        // 更新佔位符訊息為錯誤訊息
        placeholderDiv.textContent = '發生錯誤，請重試。';

        // 滾動到底部
        document.getElementById('conversation').scrollTop = document.getElementById('conversation').scrollHeight;
    } finally {
        isProcessing = false;
        document.getElementById('send-button').disabled = false; // 啟用發送按鈕
    }
});

function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');

    if (isUser) {
        // 使用者訊息使用 textContent
        messageDiv.textContent = message;
    } else {
        // AI 訊息使用 innerHTML 渲染 <br>
        messageDiv.innerHTML = message;
    }

    document.getElementById('conversation').appendChild(messageDiv);
    document.getElementById('conversation').scrollTop = document.getElementById('conversation').scrollHeight;
    return messageDiv;
}


//讀取disease.txt環節(fetch 方式完成)
fetch('disease_data.txt')
    .then(response => response.text())
    .then(text => {
        const lines = text.split('\n');
        let currentDisease = '';
        let content = '';
        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                if (currentDisease && content) {
                    diseaseData[currentDisease] = content.trim();
                }
                currentDisease = line.substring(1, line.length - 1);
                content = '';
            } else {
                content += line + '\n';
            }
        }
        // 添加最後一個疾病的內容
        if (currentDisease && content) {
            diseaseData[currentDisease] = content.trim();
        }
    });

document.getElementById('start-button').addEventListener('click', async () => {
    const disease = document.getElementById('disease-select').value;
    const stage = document.getElementById('stage-select').value;

    // 從 diseaseData 獲取選定疾病的內容
    const diseaseContent = diseaseData[disease];
    if (!diseaseContent) {
        console.error(`未找到疾病 ${disease} 的資料`);
        return;
    }

    // 創建系統指令，包含疾病資料
    const systemInstruction = {
        role: 'system',
        content: `你是專注於 ${disease} ${stage} 的健康教育專家。以下是 ${disease} 的相關資訊：\n\n${diseaseContent}\n\n請根據此資訊，為患者提供關於 ${stage} 的精確且有用的建議，包括飲食建議、飲食禁忌、生活習慣推薦、用藥規範及其他相關健康教育知識。`
    };

    // 初始化對話歷史
    conversationHistory = [systemInstruction];

    // 切換到聊天區塊
    document.getElementById('selection-section').style.display = 'none';
    document.getElementById('chatbot-section').style.display = 'block';
});

